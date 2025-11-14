import { desc, eq, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  households,
  accounts,
  holdings,
  meetings,
  tasks,
  newsCache,
  aiQueries,
  interactions,
  sp500Companies,
  InsertUser,
  InsertHousehold,
  InsertAccount,
  InsertHolding,
  InsertMeeting,
  InsertTask,
  InsertNewsCache,
  InsertAIQuery,
  InsertInteraction,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Households
export async function getHouseholdsByAdvisor(advisorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(households).where(eq(households.advisorId, advisorId));
}

export async function getHouseholdById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(households).where(eq(households.id, id)).limit(1);
  return result[0];
}

// Accounts
export async function getAccountsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(accounts).where(eq(accounts.householdId, householdId));
}

// Holdings
export async function getHoldingsByAccount(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(holdings).where(eq(holdings.accountId, accountId));
}

// Interactions
export async function getInteractionsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(interactions)
    .where(eq(interactions.householdId, householdId))
    .orderBy(desc(interactions.interactionDate));
}

export async function getInteractionsByAdvisor(advisorId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(interactions)
    .where(eq(interactions.advisorId, advisorId))
    .orderBy(desc(interactions.interactionDate))
    .limit(limit);
}

export async function createInteraction(interaction: InsertInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interactions).values(interaction);
  return result[0].insertId;
}

// Meetings
export async function getMeetingsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(meetings).where(eq(meetings.householdId, householdId));
}

// Tasks
export async function getTasksByAdvisor(advisorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(tasks).where(eq(tasks.advisorId, advisorId));
}

// AI Queries
export async function getAIQueriesByHousehold(householdId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(aiQueries)
    .where(eq(aiQueries.householdId, householdId))
    .orderBy(desc(aiQueries.createdAt))
    .limit(limit);
}

export async function saveAIQuery(query: InsertAIQuery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(aiQueries).values(query);
}

// S&P 500 Companies
export async function getAllSP500Companies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(sp500Companies);
}

// Create operations
export async function createMeeting(meeting: InsertMeeting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(meetings).values(meeting);
  return result[0].insertId;
}

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function createHolding(holding: InsertHolding) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(holdings).values(holding);
  return result[0].insertId;
}

// AI Query History
export async function getAIQueryHistory(householdId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(aiQueries)
    .where(eq(aiQueries.householdId, householdId))
    .orderBy(desc(aiQueries.createdAt))
    .limit(limit);
}

// News cache
export async function getNewsByTicker(ticker: string, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(newsCache)
    .where(eq(newsCache.ticker, ticker))
    .orderBy(desc(newsCache.publishedAt))
    .limit(limit);
}

// Backward compatibility aliases (client = household)
export async function getClientsByAdvisor(advisorId: number) {
  return getHouseholdsByAdvisor(advisorId);
}

export async function getClientById(id: number) {
  return getHouseholdById(id);
}

export async function createClient(client: { advisorId: number; clientName: string; email?: string; phone?: string; riskTolerance?: "conservative" | "moderate" | "aggressive" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const household: InsertHousehold = {
    advisorId: client.advisorId,
    householdName: client.clientName,
    email: client.email,
    phone: client.phone,
    riskTolerance: client.riskTolerance,
  };
  
  const result = await db.insert(households).values(household);
  return result[0].insertId;
}

export async function getHoldingsByClient(householdId: number) {
  // Get all accounts for this household, then get all holdings
  const accountsList = await getAccountsByHousehold(householdId);
  const allHoldings = [];
  
  for (const account of accountsList) {
    const accountHoldings = await getHoldingsByAccount(account.id);
    allHoldings.push(...accountHoldings);
  }
  
  return allHoldings;
}

export async function getMeetingsByClient(householdId: number) {
  return getMeetingsByHousehold(householdId);
}

// Get upcoming meetings for advisor's dashboard
export async function getUpcomingMeetingsByAdvisor(advisorId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  
  const result = await db
    .select({
      meeting: meetings,
      household: households,
    })
    .from(meetings)
    .innerJoin(households, eq(meetings.householdId, households.id))
    .where(
      and(
        eq(meetings.advisorId, advisorId),
        gte(meetings.meetingDate, now),
        lte(meetings.meetingDate, endOfToday)
      )
    )
    .orderBy(meetings.meetingDate)
    .limit(limit);
  
  return result.map(r => ({
    ...r.meeting,
    householdName: r.household.householdName,
    primaryContactName: r.household.primaryContactName,
  }));
}

// Get household summary with aggregated financial data
export async function getHouseholdSummary(householdId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const household = await getHouseholdById(householdId);
  if (!household) return null;
  
  const accountsList = await getAccountsByHousehold(householdId);
  
  // Calculate total portfolio value and performance
  let totalPortfolioValue = 0;
  let totalCostBasis = 0;
  let weightedYtdReturn = 0;
  
  for (const account of accountsList) {
    const accountValue = parseFloat(account.currentValue?.toString() || "0");
    const costBasis = parseFloat(account.costBasis?.toString() || "0");
    const ytdReturn = parseFloat(account.ytdReturn?.toString() || "0");
    
    totalPortfolioValue += accountValue;
    totalCostBasis += costBasis;
    
    if (accountValue > 0) {
      weightedYtdReturn += ytdReturn * accountValue;
    }
  }
  
  const avgYtdReturn = totalPortfolioValue > 0 ? weightedYtdReturn / totalPortfolioValue : 0;
  
  return {
    ...household,
    totalPortfolioValue,
    totalCostBasis,
    ytdReturn: avgYtdReturn,
    accountCount: accountsList.length,
  };
}
