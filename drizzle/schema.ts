import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // FA-specific fields
  advisorId: varchar("advisorId", { length: 64 }),
  firmName: varchar("firmName", { length: 255 }),
  photoUrl: text("photoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients managed by financial advisors
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  netWorth: int("netWorth"), // Store in cents to avoid decimal issues
  portfolioValue: int("portfolioValue"), // Store in cents
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]),
  nextMeetingDate: timestamp("nextMeetingDate"),
  lastMeetingDate: timestamp("lastMeetingDate"),
  retirementDate: timestamp("retirementDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Holdings for each client
 */
export const holdings = mysqlTable("holdings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  shares: int("shares").notNull(), // Store as integer (multiply by 1000 for fractional shares)
  costBasis: int("costBasis"), // Per share in cents
  currentPrice: int("currentPrice"), // Per share in cents
  currentValue: int("currentValue"), // Total value in cents
  sector: varchar("sector", { length: 100 }),
  assetClass: varchar("assetClass", { length: 50 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = typeof holdings.$inferInsert;

/**
 * Meeting notes and talking points
 */
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  advisorId: int("advisorId").notNull(),
  meetingDate: timestamp("meetingDate").notNull(),
  meetingType: mysqlEnum("meetingType", ["review", "planning", "onboarding", "check-in"]),
  talkingPoints: text("talkingPoints"), // JSON array of talking points
  aiInsights: text("aiInsights"), // JSON array of AI-generated insights
  riskFlags: text("riskFlags"), // JSON array of risk flags
  recommendedQuestions: text("recommendedQuestions"), // JSON array
  notes: text("notes"),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Tasks and to-dos for advisors
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull(),
  clientId: int("clientId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * News and insights cache
 */
export const newsCache = mysqlTable("newsCache", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  url: text("url"),
  source: varchar("source", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  relevanceScore: int("relevanceScore"), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsCache = typeof newsCache.$inferSelect;
export type InsertNewsCache = typeof newsCache.$inferInsert;

/**
 * AI query history
 */
export const aiQueries = mysqlTable("aiQueries", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull(),
  clientId: int("clientId"),
  query: text("query").notNull(),
  response: text("response"),
  queryType: varchar("queryType", { length: 50 }),
  executionTimeMs: int("executionTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = typeof aiQueries.$inferInsert;
