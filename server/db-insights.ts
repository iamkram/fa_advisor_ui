/**
 * Database functions for batch insights
 */

import { getDb } from "./db";
import { sql, desc, eq } from "drizzle-orm";
import { householdInsights, batchRuns } from "../drizzle/schema";

export interface HouseholdInsight {
  id: number;
  batchRunId: number;
  householdId: number;
  portfolioSummary: string | null;
  newsSummary: string | null;
  finalSummary: string | null;
  talkingPoints: string[]; // Parsed from JSON
  portfolioValidated: boolean;
  portfolioAccuracy: number | null;
  newsValidated: boolean;
  newsAccuracy: number | null;
  processingTime: number | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}

export interface BatchRun {
  id: number;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  totalHouseholds: number;
  successfulHouseholds: number;
  failedHouseholds: number;
  avgProcessingTime: number | null;
  totalDuration: number | null;
  errorLog: any | null; // Parsed from JSON
  createdAt: Date;
}

/**
 * Get the latest insight for a household
 */
export async function getLatestInsightByHousehold(householdId: number): Promise<HouseholdInsight | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select()
    .from(householdInsights)
    .where(eq(householdInsights.householdId, householdId))
    .orderBy(desc(householdInsights.createdAt))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];
  
  return {
    id: row.id,
    batchRunId: row.batchRunId,
    householdId: row.householdId,
    portfolioSummary: row.portfolioSummary,
    newsSummary: row.newsSummary,
    finalSummary: row.finalSummary,
    talkingPoints: row.talkingPoints ? JSON.parse(row.talkingPoints) : [],
    portfolioValidated: Boolean(row.portfolioValidated),
    portfolioAccuracy: row.portfolioAccuracy ? parseFloat(row.portfolioAccuracy) : null,
    newsValidated: Boolean(row.newsValidated),
    newsAccuracy: row.newsAccuracy ? parseFloat(row.newsAccuracy) : null,
    processingTime: row.processingTime ? parseFloat(row.processingTime) : null,
    status: row.status,
    errorMessage: row.errorMessage,
    createdAt: new Date(row.createdAt),
  };
}

/**
 * Get all insights for a batch run
 */
export async function getInsightsByBatchRun(batchRunId: number): Promise<HouseholdInsight[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select()
    .from(householdInsights)
    .where(eq(householdInsights.batchRunId, batchRunId))
    .orderBy(householdInsights.householdId);

  return results.map((row) => ({
    id: row.id,
    batchRunId: row.batchRunId,
    householdId: row.householdId,
    portfolioSummary: row.portfolioSummary,
    newsSummary: row.newsSummary,
    finalSummary: row.finalSummary,
    talkingPoints: row.talkingPoints ? JSON.parse(row.talkingPoints) : [],
    portfolioValidated: Boolean(row.portfolioValidated),
    portfolioAccuracy: row.portfolioAccuracy ? parseFloat(row.portfolioAccuracy) : null,
    newsValidated: Boolean(row.newsValidated),
    newsAccuracy: row.newsAccuracy ? parseFloat(row.newsAccuracy) : null,
    processingTime: row.processingTime ? parseFloat(row.processingTime) : null,
    status: row.status,
    errorMessage: row.errorMessage,
    createdAt: new Date(row.createdAt),
  }));
}

/**
 * Get latest batch run
 */
export async function getLatestBatchRun(): Promise<BatchRun | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select()
    .from(batchRuns)
    .orderBy(desc(batchRuns.startedAt))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];
  
  return {
    id: row.id,
    startedAt: new Date(row.startedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
    status: row.status,
    totalHouseholds: row.totalHouseholds,
    successfulHouseholds: row.successfulHouseholds ?? 0,
    failedHouseholds: row.failedHouseholds ?? 0,
    avgProcessingTime: row.avgProcessingTime ? parseFloat(row.avgProcessingTime) : null,
    totalDuration: row.totalDuration ? parseFloat(row.totalDuration) : null,
    errorLog: row.errorLog ? JSON.parse(row.errorLog) : null,
    createdAt: new Date(row.createdAt),
  };
}

/**
 * Get batch run by ID
 */
export async function getBatchRunById(batchRunId: number): Promise<BatchRun | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select()
    .from(batchRuns)
    .where(eq(batchRuns.id, batchRunId));

  if (results.length === 0) return null;

  const row = results[0];
  
  return {
    id: row.id,
    startedAt: new Date(row.startedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
    status: row.status,
    totalHouseholds: row.totalHouseholds,
    successfulHouseholds: row.successfulHouseholds ?? 0,
    failedHouseholds: row.failedHouseholds ?? 0,
    avgProcessingTime: row.avgProcessingTime ? parseFloat(row.avgProcessingTime) : null,
    totalDuration: row.totalDuration ? parseFloat(row.totalDuration) : null,
    errorLog: row.errorLog ? JSON.parse(row.errorLog) : null,
    createdAt: new Date(row.createdAt),
  };
}

/**
 * Get all batch runs (paginated)
 */
export async function getAllBatchRuns(limit: number = 10, offset: number = 0): Promise<BatchRun[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select()
    .from(batchRuns)
    .orderBy(desc(batchRuns.startedAt))
    .limit(limit)
    .offset(offset);

  return results.map((row) => ({
    id: row.id,
    startedAt: new Date(row.startedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
    status: row.status,
    totalHouseholds: row.totalHouseholds,
    successfulHouseholds: row.successfulHouseholds ?? 0,
    failedHouseholds: row.failedHouseholds ?? 0,
    avgProcessingTime: row.avgProcessingTime ? parseFloat(row.avgProcessingTime) : null,
    totalDuration: row.totalDuration ? parseFloat(row.totalDuration) : null,
    errorLog: row.errorLog ? JSON.parse(row.errorLog) : null,
    createdAt: new Date(row.createdAt),
  }));
}
