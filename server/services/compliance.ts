/**
 * Compliance Monitoring Service
 * 
 * Automated risk detection and compliance monitoring for financial advisors.
 * Detects concentration risk, suitability issues, and annual review requirements.
 */

import { getDb } from "../db";
import { households, accounts, holdings, users } from "../../drizzle/schema";
import { sql, eq, and, lt, gte } from "drizzle-orm";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = "concentration_risk" | "suitability_mismatch" | "annual_review_due" | "large_position" | "underperforming";

export interface ComplianceAlert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  householdId: number;
  householdName: string;
  advisorId: number;
  advisorName: string;
  title: string;
  description: string;
  recommendation: string;
  affectedHoldings?: Array<{
    ticker: string;
    percentage: number;
    value: number;
  }>;
  createdAt: Date;
}

interface ComplianceStats {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  alertsByType: Record<AlertType, number>;
  householdsAffected: number;
}

/**
 * Scan all portfolios for compliance issues
 */
export async function scanComplianceIssues(advisorId?: number): Promise<ComplianceAlert[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const alerts: ComplianceAlert[] = [];

  // Get all households (optionally filtered by advisor)
  let householdsQuery = db
    .select({
      householdId: households.id,
      householdName: households.householdName,
      riskTolerance: households.riskTolerance,
      lastReviewDate: households.updatedAt,
      advisorId: households.advisorId,
      advisorName: users.name,
    })
    .from(households)
    .leftJoin(users, eq(users.id, households.advisorId));

  if (advisorId) {
    householdsQuery = householdsQuery.where(eq(households.advisorId, advisorId)) as any;
  }

  const householdsList = await householdsQuery;

  // Process each household
  for (const household of householdsList) {
    // Get all holdings for this household
    const householdHoldings = await db
      .select({
        ticker: holdings.ticker,
        companyName: holdings.companyName,
        currentValue: holdings.currentValue,
        assetClass: holdings.assetClass,
        sector: holdings.sector,
        shares: holdings.shares,
        costBasis: holdings.costBasis,
      })
      .from(holdings)
      .leftJoin(accounts, eq(accounts.id, holdings.accountId))
      .where(eq(accounts.householdId, household.householdId));

    if (householdHoldings.length === 0) continue;

    // Calculate total portfolio value
    const totalValue = householdHoldings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0);

    // 1. Concentration Risk Detection (>10% in single holding)
    for (const holding of householdHoldings) {
      const holdingValue = Number(holding.currentValue || 0);
      const percentage = totalValue > 0 ? (holdingValue / totalValue) * 100 : 0;

      if (percentage > 10) {
        const severity: AlertSeverity = percentage > 20 ? "critical" : "warning";
        alerts.push({
          id: `conc_${household.householdId}_${holding.ticker}`,
          severity,
          type: "concentration_risk",
          householdId: household.householdId,
          householdName: household.householdName || "Unknown",
          advisorId: household.advisorId,
          advisorName: household.advisorName || "Unknown",
          title: `Concentration Risk: ${holding.ticker}`,
          description: `${holding.ticker} (${holding.companyName || "Unknown"}) represents ${percentage.toFixed(1)}% of portfolio value, exceeding the 10% concentration threshold.`,
          recommendation: percentage > 20
            ? `CRITICAL: Immediately diversify this position. Consider selling ${((percentage - 10) / percentage * 100).toFixed(0)}% of holdings to reduce concentration risk.`
            : `Consider rebalancing to reduce ${holding.ticker} exposure to below 10% of portfolio value. Suggest diversification into other sectors.`,
          affectedHoldings: [{
            ticker: holding.ticker,
            percentage,
            value: holdingValue,
          }],
          createdAt: new Date(),
        });
      }
    }

    // 2. Risk Profile Suitability Checks
    const riskTolerance = household.riskTolerance || "moderate";
    
    // Calculate equity exposure
    const equityValue = householdHoldings
      .filter(h => h.assetClass === "equity")
      .reduce((sum, h) => sum + Number(h.currentValue || 0), 0);
    const equityPercentage = totalValue > 0 ? (equityValue / totalValue) * 100 : 0;

    // Check suitability based on risk tolerance
    let isSuitabilityIssue = false;
    let suitabilityMessage = "";

    if (riskTolerance === "conservative" && equityPercentage > 40) {
      isSuitabilityIssue = true;
      suitabilityMessage = `Portfolio has ${equityPercentage.toFixed(1)}% equity exposure, which exceeds the recommended 40% maximum for conservative investors.`;
    } else if (riskTolerance === "moderate" && (equityPercentage < 40 || equityPercentage > 70)) {
      isSuitabilityIssue = true;
      suitabilityMessage = `Portfolio has ${equityPercentage.toFixed(1)}% equity exposure. Moderate investors should maintain 40-70% equity allocation.`;
    } else if (riskTolerance === "aggressive" && equityPercentage < 70) {
      isSuitabilityIssue = true;
      suitabilityMessage = `Portfolio has ${equityPercentage.toFixed(1)}% equity exposure, which is below the recommended 70% minimum for aggressive growth investors.`;
    }

    if (isSuitabilityIssue) {
      alerts.push({
        id: `suit_${household.householdId}`,
        severity: "warning",
        type: "suitability_mismatch",
        householdId: household.householdId,
        householdName: household.householdName || "Unknown",
        advisorId: household.advisorId,
        advisorName: household.advisorName || "Unknown",
        title: `Risk Profile Mismatch: ${riskTolerance.toUpperCase()}`,
        description: suitabilityMessage,
        recommendation: `Review asset allocation with client. Consider rebalancing to align with ${riskTolerance} risk profile. Document any client preferences that deviate from standard allocation.`,
        createdAt: new Date(),
      });
    }

    // 3. Annual Review Requirements
    const lastReview = household.lastReviewDate ? new Date(household.lastReviewDate) : null;
    const daysSinceReview = lastReview
      ? Math.floor((Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceReview > 365) {
      const severity: AlertSeverity = daysSinceReview > 400 ? "critical" : "warning";
      alerts.push({
        id: `review_${household.householdId}`,
        severity,
        type: "annual_review_due",
        householdId: household.householdId,
        householdName: household.householdName || "Unknown",
        advisorId: household.advisorId,
        advisorName: household.advisorName || "Unknown",
        title: "Annual Review Overdue",
        description: lastReview
          ? `Last review completed ${daysSinceReview} days ago on ${lastReview.toLocaleDateString()}. Annual review is ${daysSinceReview - 365} days overdue.`
          : "No review date on record. Annual review required for compliance.",
        recommendation: daysSinceReview > 400
          ? "URGENT: Schedule annual review immediately. Document review completion to maintain compliance."
          : "Schedule annual review within the next 30 days. Prepare updated risk assessment and investment policy statement.",
        createdAt: new Date(),
      });
    }

    // 4. Large Position Alerts (informational)
    const largePositions = householdHoldings.filter(h => {
      const value = Number(h.currentValue || 0);
      return value > 100000; // Positions over $100k
    });

    if (largePositions.length > 0 && totalValue > 500000) {
      for (const position of largePositions) {
        const value = Number(position.currentValue || 0);
        const percentage = (value / totalValue) * 100;
        
        if (percentage > 5) { // Only alert if >5% of portfolio
          alerts.push({
            id: `large_${household.householdId}_${position.ticker}`,
            severity: "info",
            type: "large_position",
            householdId: household.householdId,
            householdName: household.householdName || "Unknown",
            advisorId: household.advisorId,
            advisorName: household.advisorName || "Unknown",
            title: `Large Position: ${position.ticker}`,
            description: `${position.ticker} position valued at $${value.toLocaleString()} (${percentage.toFixed(1)}% of portfolio).`,
            recommendation: "Monitor for concentration risk. Consider tax-loss harvesting opportunities or gradual position reduction if concentration increases.",
            affectedHoldings: [{
              ticker: position.ticker,
              percentage,
              value,
            }],
            createdAt: new Date(),
          });
        }
      }
    }

    // 5. Underperforming Holdings
    for (const holding of householdHoldings) {
      const cost = Number(holding.shares) * Number(holding.costBasis || 0);
      const current = Number(holding.currentValue || 0);
      const gainLoss = current - cost;
      const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

      // Alert if position is down more than 20%
      if (gainLossPercent < -20 && current > 10000) {
        alerts.push({
          id: `under_${household.householdId}_${holding.ticker}`,
          severity: "info",
          type: "underperforming",
          householdId: household.householdId,
          householdName: household.householdName || "Unknown",
          advisorId: household.advisorId,
          advisorName: household.advisorName || "Unknown",
          title: `Underperforming: ${holding.ticker}`,
          description: `${holding.ticker} is down ${Math.abs(gainLossPercent).toFixed(1)}% from cost basis. Current value: $${current.toLocaleString()}, Loss: $${Math.abs(gainLoss).toLocaleString()}.`,
          recommendation: "Review investment thesis. Consider tax-loss harvesting if appropriate. Discuss with client whether to hold, average down, or exit position.",
          affectedHoldings: [{
            ticker: holding.ticker,
            percentage: (current / totalValue) * 100,
            value: current,
          }],
          createdAt: new Date(),
        });
      }
    }
  }

  return alerts;
}

/**
 * Get compliance statistics
 */
export async function getComplianceStats(advisorId?: number): Promise<ComplianceStats> {
  const alerts = await scanComplianceIssues(advisorId);

  const stats: ComplianceStats = {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === "critical").length,
    warningAlerts: alerts.filter(a => a.severity === "warning").length,
    infoAlerts: alerts.filter(a => a.severity === "info").length,
    alertsByType: {
      concentration_risk: alerts.filter(a => a.type === "concentration_risk").length,
      suitability_mismatch: alerts.filter(a => a.type === "suitability_mismatch").length,
      annual_review_due: alerts.filter(a => a.type === "annual_review_due").length,
      large_position: alerts.filter(a => a.type === "large_position").length,
      underperforming: alerts.filter(a => a.type === "underperforming").length,
    },
    householdsAffected: new Set(alerts.map(a => a.householdId)).size,
  };

  return stats;
}

/**
 * Get alerts for a specific household
 */
export async function getHouseholdAlerts(householdId: number): Promise<ComplianceAlert[]> {
  const allAlerts = await scanComplianceIssues();
  return allAlerts.filter(a => a.householdId === householdId);
}
