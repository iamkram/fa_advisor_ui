import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  clients, 
  holdings, 
  meetings, 
  tasks, 
  newsCache, 
  aiQueries,
  InsertClient,
  InsertHolding,
  InsertMeeting,
  InsertTask,
  InsertNewsCache,
  InsertAiQuery,
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

    const textFields = ["name", "email", "loginMethod", "advisorId", "firmName", "photoUrl"] as const;
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

// Client queries
export async function getClientsByAdvisor(advisorId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(eq(clients.advisorId, advisorId));
}

export async function getClientById(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(clients).values(client);
}

// Holdings queries
export async function getHoldingsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(holdings).where(eq(holdings.clientId, clientId));
}

export async function createHolding(holding: InsertHolding) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(holdings).values(holding);
}

// Meeting queries
export async function getMeetingsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(meetings)
    .where(eq(meetings.clientId, clientId))
    .orderBy(desc(meetings.meetingDate));
}

export async function createMeeting(meeting: InsertMeeting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(meetings).values(meeting);
}

// Task queries
export async function getTasksByAdvisor(advisorId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks)
    .where(eq(tasks.advisorId, advisorId))
    .orderBy(desc(tasks.createdAt));
}

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(tasks).values(task);
}

// News cache queries
export async function getNewsByTicker(ticker: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(newsCache)
    .where(eq(newsCache.ticker, ticker))
    .orderBy(desc(newsCache.publishedAt))
    .limit(limit);
}

export async function cacheNews(news: InsertNewsCache) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(newsCache).values(news);
}

// AI query history
export async function getAIQueryHistory(advisorId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(aiQueries)
    .where(eq(aiQueries.advisorId, advisorId))
    .orderBy(desc(aiQueries.createdAt))
    .limit(limit);
}

export async function saveAIQuery(query: InsertAiQuery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(aiQueries).values(query);
}
