/**
 * Analytics Service
 * 
 * Calculates portfolio performance metrics, asset allocation,
 * and generates dashboard analytics.
 */

import { getDb } from "../db";
import { households, accounts, holdings, users } from "../../drizzle/schema";
import { sql, eq, and, gte } from "drizzle-orm";

interface AnalyticsOverview {
  totalAUM: number;
  aumChange: number;
  avgReturn: number;
  totalClients: number;
  activeClients: number;
  avgPortfolioSize: number;
  performanceData: Array<{ month: string; return: number; benchmark: number }>;
  topPerformers: Array<{ name: string; aum: number; return: number }>;
  underperformers: Array<{ name: string; aum: number; return: number }>;
  assetAllocation: Array<{ name: string; value: number }>;
  sectorAllocation: Array<{ sector: string; percentage: number }>;
  advisorBreakdown: Array<{ name: string; aum: number; clients: number }>;
  aumDistribution: Array<{ range: string; count: number }>;
}

export async function getAnalyticsOverview(timeframe: string = "ytd"): Promise<AnalyticsOverview> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Calculate total AUM
  const aumResult = await db
    .select({
      total: sql<number>`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2)))`,
    })
    .from(holdings);

  const totalAUM = Number(aumResult[0]?.total || 0);

  // Calculate total clients
  const clientsResult = await db
    .select({
      total: sql<number>`COUNT(DISTINCT ${households.id})`,
    })
    .from(households);

  const totalClients = Number(clientsResult[0]?.total || 0);

  // Calculate average portfolio size
  const avgPortfolioSize = totalClients > 0 ? totalAUM / totalClients : 0;

  // Mock performance data (in production, calculate from historical data)
  const performanceData = [
    { month: "Jan", return: 2.3, benchmark: 1.8 },
    { month: "Feb", return: 3.1, benchmark: 2.5 },
    { month: "Mar", return: 1.8, benchmark: 2.1 },
    { month: "Apr", return: 4.2, benchmark: 3.8 },
    { month: "May", return: 2.9, benchmark: 2.4 },
    { month: "Jun", return: 3.5, benchmark: 3.2 },
    { month: "Jul", return: 2.7, benchmark: 2.9 },
    { month: "Aug", return: 3.8, benchmark: 3.5 },
    { month: "Sep", return: 2.1, benchmark: 1.9 },
    { month: "Oct", return: 4.5, benchmark: 4.1 },
    { month: "Nov", return: 3.2, benchmark: 2.8 },
  ];

  const avgReturn = performanceData.reduce((sum, d) => sum + d.return, 0) / performanceData.length;

  // Get top performers (mock data - in production, calculate from actual returns)
  const topHouseholds = await db
    .select({
      id: households.id,
      name: households.householdName,
      totalValue: sql<number>`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2)))`,
    })
    .from(households)
    .leftJoin(accounts, eq(accounts.householdId, households.id))
    .leftJoin(holdings, eq(holdings.accountId, accounts.id))
    .groupBy(households.id, households.householdName)
    .orderBy(sql`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2))) DESC`)
    .limit(5);

  const topPerformers = topHouseholds.map((h, idx) => ({
    name: h.name || "Unknown",
    aum: Number(h.totalValue || 0),
    return: 15.5 - idx * 2.3, // Mock return data
  }));

  // Get underperformers
  const underperformers = topHouseholds.slice(0, 5).map((h, idx) => ({
    name: h.name || "Unknown",
    aum: Number(h.totalValue || 0),
    return: -2.1 - idx * 0.8, // Mock negative returns
  }));

  // Asset allocation
  const assetAllocationResult = await db
    .select({
      assetClass: holdings.assetClass,
      total: sql<number>`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2)))`,
    })
    .from(holdings)
    .groupBy(holdings.assetClass);

  const assetAllocation = assetAllocationResult.map(a => ({
    name: a.assetClass?.replace("_", " ").toUpperCase() || "OTHER",
    value: Number(a.total || 0),
  }));

  // Sector allocation
  const sectorAllocationResult = await db
    .select({
      sector: holdings.sector,
      total: sql<number>`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2)))`,
    })
    .from(holdings)
    .where(sql`${holdings.sector} IS NOT NULL`)
    .groupBy(holdings.sector)
    .orderBy(sql`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2))) DESC`)
    .limit(10);

  const sectorAllocation = sectorAllocationResult.map(s => ({
    sector: s.sector || "Other",
    percentage: totalAUM > 0 ? (Number(s.total || 0) / totalAUM) * 100 : 0,
  }));

  // Advisor breakdown
  const advisorBreakdownResult = await db
    .select({
      advisorId: households.advisorId,
      name: users.name,
      clients: sql<number>`COUNT(DISTINCT ${households.id})`,
      aum: sql<number>`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2)))`,
    })
    .from(households)
    .leftJoin(users, eq(users.id, households.advisorId))
    .leftJoin(accounts, eq(accounts.householdId, households.id))
    .leftJoin(holdings, eq(holdings.accountId, accounts.id))
    .groupBy(households.advisorId, users.name)
    .orderBy(sql`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2))) DESC`)
    .limit(10);

  const advisorBreakdown = advisorBreakdownResult.map(a => ({
    name: a.name || "Unknown Advisor",
    aum: Number(a.aum || 0) / 1000000, // Convert to millions
    clients: Number(a.clients || 0),
  }));

  // AUM distribution
  const aumDistribution = [
    { range: "$0-$100K", count: 0 },
    { range: "$100K-$500K", count: 0 },
    { range: "$500K-$1M", count: 0 },
    { range: "$1M-$5M", count: 0 },
    { range: "$5M+", count: 0 },
  ];

  const householdAUMs = await db
    .select({
      householdId: households.id,
      totalValue: sql<number>`SUM(CAST(${holdings.currentValue} AS DECIMAL(15,2)))`,
    })
    .from(households)
    .leftJoin(accounts, eq(accounts.householdId, households.id))
    .leftJoin(holdings, eq(holdings.accountId, accounts.id))
    .groupBy(households.id);

  householdAUMs.forEach(h => {
    const aum = Number(h.totalValue || 0);
    if (aum < 100000) aumDistribution[0].count++;
    else if (aum < 500000) aumDistribution[1].count++;
    else if (aum < 1000000) aumDistribution[2].count++;
    else if (aum < 5000000) aumDistribution[3].count++;
    else aumDistribution[4].count++;
  });

  return {
    totalAUM,
    aumChange: 5.2, // Mock data - calculate from historical
    avgReturn,
    totalClients,
    activeClients: Math.floor(totalClients * 0.85), // Mock - 85% active
    avgPortfolioSize,
    performanceData,
    topPerformers,
    underperformers,
    assetAllocation,
    sectorAllocation,
    advisorBreakdown,
    aumDistribution,
  };
}

export async function getAdvisorsList() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const advisorsList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(users.name);

  return advisorsList;
}
