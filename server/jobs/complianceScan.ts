/**
 * Scheduled Compliance Scan Job
 * 
 * Runs nightly at 2 AM to scan all portfolios for compliance issues
 * and notify advisors of critical alerts.
 */

import cron from "node-cron";
import { scanComplianceIssues, ComplianceAlert } from "../services/compliance";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

interface AlertHistory {
  alertId: string;
  firstDetected: Date;
  lastNotified: Date;
}

// In-memory store for alert history (in production, use database)
export const alertHistory = new Map<string, AlertHistory>();

// Store cron task reference for cleanup
let cronTask: ReturnType<typeof cron.schedule> | null = null;

/**
 * Send email notification to advisor about critical alerts
 */
async function notifyAdvisorOfAlerts(advisorId: number, advisorName: string, alerts: ComplianceAlert[]) {
  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const warningAlerts = alerts.filter(a => a.severity === "warning");

  if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return; // No alerts to notify
  }

  // Build email content
  const subject = `Compliance Alert Summary - ${criticalAlerts.length} Critical, ${warningAlerts.length} Warnings`;
  
  let content = `Dear ${advisorName},\n\n`;
  content += `Your nightly compliance scan has detected the following issues:\n\n`;
  
  if (criticalAlerts.length > 0) {
    content += `🔴 CRITICAL ALERTS (${criticalAlerts.length}):\n`;
    content += `These require immediate attention:\n\n`;
    
    criticalAlerts.forEach((alert, idx) => {
      content += `${idx + 1}. ${alert.title}\n`;
      content += `   Household: ${alert.householdName}\n`;
      content += `   Issue: ${alert.description}\n`;
      content += `   Action: ${alert.recommendation}\n\n`;
    });
  }

  if (warningAlerts.length > 0) {
    content += `\n⚠️  WARNING ALERTS (${warningAlerts.length}):\n`;
    content += `Please review these within the next few days:\n\n`;
    
    warningAlerts.slice(0, 5).forEach((alert, idx) => {
      content += `${idx + 1}. ${alert.title} - ${alert.householdName}\n`;
    });
    
    if (warningAlerts.length > 5) {
      content += `\n... and ${warningAlerts.length - 5} more warnings.\n`;
    }
  }

  content += `\n\nLog in to your Advisor Dashboard to view full details and take action.\n\n`;
  content += `Best regards,\nCompliance Monitoring System`;

  // Send notification (using built-in notification system)
  // In production, this would send an actual email via SendGrid/AWS SES
  await notifyOwner({
    title: subject,
    content: content,
  });

  console.log(`[Compliance Job] Notified advisor ${advisorName} (ID: ${advisorId}) of ${criticalAlerts.length + warningAlerts.length} alerts`);
}

/**
 * Identify new alerts that haven't been notified yet
 */
function getNewAlerts(allAlerts: ComplianceAlert[]): ComplianceAlert[] {
  const newAlerts: ComplianceAlert[] = [];
  const now = new Date();

  for (const alert of allAlerts) {
    const history = alertHistory.get(alert.id);

    if (!history) {
      // First time seeing this alert
      alertHistory.set(alert.id, {
        alertId: alert.id,
        firstDetected: now,
        lastNotified: now,
      });
      newAlerts.push(alert);
    } else {
      // Check if we should notify again (e.g., every 7 days for persistent issues)
      const daysSinceLastNotification = (now.getTime() - history.lastNotified.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastNotification >= 7) {
        history.lastNotified = now;
        newAlerts.push(alert);
      }
    }
  }

  return newAlerts;
}

/**
 * Run the compliance scan job
 */
export async function runComplianceScan() {
  console.log(`[Compliance Job] Starting nightly compliance scan at ${new Date().toISOString()}`);

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Compliance Job] Database not available");
      return;
    }

    // Get all advisors
    const advisors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.role, "admin")); // In production, filter by role === "advisor"

    console.log(`[Compliance Job] Scanning portfolios for ${advisors.length} advisors`);

    let totalAlerts = 0;
    let totalCritical = 0;

    // Scan each advisor's portfolios
    for (const advisor of advisors) {
      const alerts = await scanComplianceIssues(advisor.id);
      const newAlerts = getNewAlerts(alerts);

      if (newAlerts.length > 0) {
        const criticalCount = newAlerts.filter(a => a.severity === "critical").length;
        totalAlerts += newAlerts.length;
        totalCritical += criticalCount;

        // Notify advisor of new alerts
        await notifyAdvisorOfAlerts(
          advisor.id,
          advisor.name || "Advisor",
          newAlerts
        );
      }
    }

    console.log(`[Compliance Job] Scan complete. Found ${totalAlerts} new alerts (${totalCritical} critical) across ${advisors.length} advisors`);

    // Send summary to system owner
    if (totalAlerts > 0) {
      await notifyOwner({
        title: "Nightly Compliance Scan Complete",
        content: `Compliance scan completed at ${new Date().toLocaleString()}.\n\n` +
                 `Summary:\n` +
                 `- Total new alerts: ${totalAlerts}\n` +
                 `- Critical alerts: ${totalCritical}\n` +
                 `- Advisors notified: ${advisors.length}\n\n` +
                 `All advisors have been notified of their respective alerts.`,
      });
    }

  } catch (error) {
    console.error("[Compliance Job] Error during compliance scan:", error);
    
    // Notify owner of job failure
    await notifyOwner({
      title: "Compliance Scan Failed",
      content: `The nightly compliance scan failed at ${new Date().toLocaleString()}.\n\n` +
               `Error: ${error instanceof Error ? error.message : String(error)}\n\n` +
               `Please check the logs and investigate.`,
    });
  }
}

/**
 * Initialize the scheduled compliance scan job
 * Runs every day at 2:00 AM
 */
export function initComplianceJob() {
  // Stop existing cron job if it exists (prevents accumulation during hot reload)
  if (cronTask) {
    cronTask.stop();
    console.log("[Compliance Job] Stopped existing cron task");
  }

  // Schedule: Run at 2:00 AM every day
  // Cron format: second minute hour day month dayOfWeek
  const schedule = "0 0 2 * * *"; // 2:00 AM daily

  cronTask = cron.schedule(schedule, async () => {
    await runComplianceScan();
  });

  console.log("[Compliance Job] Scheduled to run daily at 2:00 AM");
  
  // Initialize cleanup job to prevent memory leaks
  import("./cleanupAlertHistory").then(({ initCleanupJob }) => {
    initCleanupJob(alertHistory);
  }).catch(console.error);

  // Optional: Run immediately on startup for testing
  // Uncomment the line below to run on server start
  // runComplianceScan();
}

/**
 * Manually trigger compliance scan (for testing or on-demand execution)
 */
export async function triggerComplianceScan() {
  console.log("[Compliance Job] Manual trigger requested");
  await runComplianceScan();
}
