/**
 * Custodian Portfolio Sync Service
 * 
 * Integrates with major custodians (Schwab, Fidelity, etc.) to sync
 * real-time portfolio holdings data.
 * 
 * Runs nightly at 2 AM to update all holdings.
 */

import { getDb } from "../db";
import { holdings, accounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface HoldingData {
  ticker: string;
  companyName: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  assetClass: string;
  sector?: string;
  purchaseDate?: Date;
}

interface CustodianAccount {
  accountNumber: string;
  accountName: string;
  accountType: string;
  currentValue: number;
  holdings: HoldingData[];
}

/**
 * Base interface for custodian API clients
 */
interface CustodianClient {
  authenticate(): Promise<boolean>;
  getAccounts(advisorId: string): Promise<CustodianAccount[]>;
  getAccountHoldings(accountNumber: string): Promise<HoldingData[]>;
}

/**
 * Schwab API Client
 * 
 * Integrates with Charles Schwab's Advisor API
 * https://developer.schwab.com/
 */
class SchwabClient implements CustodianClient {
  private apiKey: string;
  private apiSecret: string;
  private accessToken?: string;

  constructor() {
    this.apiKey = process.env.SCHWAB_API_KEY || "";
    this.apiSecret = process.env.SCHWAB_API_SECRET || "";
  }

  async authenticate(): Promise<boolean> {
    if (!this.apiKey || !this.apiSecret) {
      console.warn("[Schwab] API credentials not configured");
      return false;
    }

    try {
      // OAuth 2.0 authentication flow
      const response = await fetch("https://api.schwabapi.com/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        console.error("[Schwab] Authentication failed:", response.statusText);
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return true;
    } catch (error) {
      console.error("[Schwab] Authentication error:", error);
      return false;
    }
  }

  async getAccounts(advisorId: string): Promise<CustodianAccount[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://api.schwabapi.com/v1/accounts?advisorId=${advisorId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Schwab API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      console.error("[Schwab] Failed to fetch accounts:", error);
      return [];
    }
  }

  async getAccountHoldings(accountNumber: string): Promise<HoldingData[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://api.schwabapi.com/v1/accounts/${accountNumber}/positions`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Schwab API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error("[Schwab] Failed to fetch holdings:", error);
      return [];
    }
  }
}

/**
 * Fidelity API Client
 * 
 * Integrates with Fidelity's WealthCentral API
 * https://www.fidelity.com/bin-public/060_www_fidelity_com/documents/wealthcentral-api.pdf
 */
class FidelityClient implements CustodianClient {
  private apiKey: string;
  private apiSecret: string;
  private accessToken?: string;

  constructor() {
    this.apiKey = process.env.FIDELITY_API_KEY || "";
    this.apiSecret = process.env.FIDELITY_API_SECRET || "";
  }

  async authenticate(): Promise<boolean> {
    if (!this.apiKey || !this.apiSecret) {
      console.warn("[Fidelity] API credentials not configured");
      return false;
    }

    try {
      const response = await fetch("https://api.fidelity.com/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        console.error("[Fidelity] Authentication failed:", response.statusText);
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return true;
    } catch (error) {
      console.error("[Fidelity] Authentication error:", error);
      return false;
    }
  }

  async getAccounts(advisorId: string): Promise<CustodianAccount[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://api.fidelity.com/v1/accounts?advisorId=${advisorId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Fidelity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      console.error("[Fidelity] Failed to fetch accounts:", error);
      return [];
    }
  }

  async getAccountHoldings(accountNumber: string): Promise<HoldingData[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://api.fidelity.com/v1/accounts/${accountNumber}/positions`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Fidelity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error("[Fidelity] Failed to fetch holdings:", error);
      return [];
    }
  }
}

/**
 * Custodian Sync Manager
 * 
 * Orchestrates syncing from multiple custodians
 */
export class CustodianSyncManager {
  private clients: Map<string, CustodianClient> = new Map();

  constructor() {
    this.clients.set("schwab", new SchwabClient());
    this.clients.set("fidelity", new FidelityClient());
  }

  /**
   * Sync all holdings for an advisor from all custodians
   */
  async syncAdvisor(advisorId: string): Promise<{
    success: boolean;
    accountsSynced: number;
    holdingsSynced: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      accountsSynced: 0,
      holdingsSynced: 0,
      errors: [] as string[],
    };

    console.log(`[CustodianSync] Starting sync for advisor ${advisorId}`);

    for (const custodianName of Array.from(this.clients.keys())) {
      const client = this.clients.get(custodianName)!;
      try {
        console.log(`[CustodianSync] Syncing ${custodianName}...`);
        
        // Authenticate
        const authenticated = await client.authenticate();
        if (!authenticated) {
          results.errors.push(`${custodianName}: Authentication failed`);
          continue;
        }

        // Get accounts
        const custodianAccounts = await client.getAccounts(advisorId);
        console.log(`[CustodianSync] Found ${custodianAccounts.length} accounts in ${custodianName}`);

        for (const custodianAccount of custodianAccounts) {
          try {
            // Find matching account in database
            const db = await getDb();
            if (!db) {
              results.errors.push("Database not available");
              continue;
            }

            const [dbAccount] = await db
              .select()
              .from(accounts)
              .where(eq(accounts.accountNumber, custodianAccount.accountNumber))
              .limit(1);

            if (!dbAccount) {
              console.warn(`[CustodianSync] Account ${custodianAccount.accountNumber} not found in database`);
              continue;
            }

            // Delete existing holdings
            await db.delete(holdings).where(eq(holdings.accountId, dbAccount.id));

            // Insert new holdings
            for (const holding of custodianAccount.holdings) {
              const currentValue = holding.shares * holding.currentPrice;
              const unrealizedGainLoss = currentValue - holding.costBasis;
              const unrealizedGainLossPercent = (unrealizedGainLoss / holding.costBasis) * 100;

              // Map asset class to schema enum
              const assetClassMap: Record<string, "equity" | "fixed_income" | "cash" | "alternative" | "other"> = {
                equity: "equity",
                stock: "equity",
                stocks: "equity",
                bond: "fixed_income",
                bonds: "fixed_income",
                fixed_income: "fixed_income",
                cash: "cash",
                alternative: "alternative",
                alternatives: "alternative",
              };
              
              const mappedAssetClass = assetClassMap[holding.assetClass.toLowerCase()] || "other";
              
              await db.insert(holdings).values({
                accountId: dbAccount.id,
                ticker: holding.ticker,
                companyName: holding.companyName,
                shares: holding.shares.toString(),
                costBasis: holding.costBasis.toFixed(2),
                currentPrice: holding.currentPrice.toFixed(2),
                currentValue: currentValue.toFixed(2),
                assetClass: mappedAssetClass,
                sector: holding.sector,
                unrealizedGainLoss: unrealizedGainLoss.toFixed(2),
                unrealizedGainLossPercent: unrealizedGainLossPercent.toFixed(4),
                purchaseDate: holding.purchaseDate,
              });

              results.holdingsSynced++;
            }

            results.accountsSynced++;
            console.log(`[CustodianSync] Synced ${custodianAccount.holdings.length} holdings for account ${custodianAccount.accountNumber}`);
          } catch (error) {
            const errorMsg = `Failed to sync account ${custodianAccount.accountNumber}: ${error}`;
            console.error(`[CustodianSync] ${errorMsg}`);
            results.errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `${custodianName} sync failed: ${error}`;
        console.error(`[CustodianSync] ${errorMsg}`);
        results.errors.push(errorMsg);
        results.success = false;
      }
    }

    console.log(`[CustodianSync] Sync complete: ${results.accountsSynced} accounts, ${results.holdingsSynced} holdings`);
    return results;
  }

  /**
   * Sync all advisors (for nightly batch job)
   */
  async syncAll(): Promise<void> {
    console.log("[CustodianSync] Starting nightly sync for all advisors");
    
    const db = await getDb();
    if (!db) {
      console.error("[CustodianSync] Database not available");
      return;
    }

    // Get all advisors with external advisor IDs
    const advisors = await db
      .select()
      .from(accounts)
      .where(eq(accounts.status, "active"));

    console.log(`[CustodianSync] Found ${advisors.length} active accounts to sync`);

    // Sync each advisor
    for (const advisor of advisors) {
      try {
        await this.syncAdvisor(advisor.id.toString());
      } catch (error) {
        console.error(`[CustodianSync] Failed to sync advisor ${advisor.id}:`, error);
      }
    }

    console.log("[CustodianSync] Nightly sync complete");
  }
}

// Export singleton instance
export const custodianSync = new CustodianSyncManager();

/**
 * Schedule nightly sync at 2 AM
 * 
 * In production, use a cron job or scheduler like node-cron:
 * 
 * import cron from 'node-cron';
 * 
 * // Run every day at 2 AM
 * cron.schedule('0 2 * * *', async () => {
 *   await custodianSync.syncAll();
 * });
 */
