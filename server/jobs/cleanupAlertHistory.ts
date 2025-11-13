/**
 * Periodic cleanup for in-memory alert history
 * Prevents memory leaks by removing old alert history entries
 */

import cron from "node-cron";

// Import the alert history map from complianceScan
// Note: In production, this should be moved to a database
let cleanupTask: ReturnType<typeof cron.schedule> | null = null;

/**
 * Clean up alert history older than 30 days
 */
export function cleanupOldAlertHistory(alertHistory: Map<string, any>) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let removedCount = 0;
  
  for (const [alertId, history] of Array.from(alertHistory.entries())) {
    if (history.firstDetected < thirtyDaysAgo) {
      alertHistory.delete(alertId);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`[Alert History Cleanup] Removed ${removedCount} old alert history entries`);
  }
  
  // Log memory usage
  const memUsage = process.memoryUsage();
  console.log(`[Memory] Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
}

/**
 * Initialize periodic cleanup job
 * Runs every hour to prevent memory accumulation
 */
export function initCleanupJob(alertHistory: Map<string, any>) {
  // Stop existing cleanup job if it exists
  if (cleanupTask) {
    cleanupTask.stop();
    console.log("[Alert History Cleanup] Stopped existing cleanup task");
  }
  
  // Schedule: Run every hour
  const schedule = "0 0 * * * *"; // Every hour at minute 0
  
  cleanupTask = cron.schedule(schedule, () => {
    cleanupOldAlertHistory(alertHistory);
  });
  
  console.log("[Alert History Cleanup] Scheduled to run hourly");
}
