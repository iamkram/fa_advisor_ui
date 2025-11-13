import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, index, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with advisor-specific fields for FA system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // FA-specific fields
  advisorId: varchar("advisorId", { length: 64 }), // External advisor ID (e.g., from Salesforce)
  firmName: text("firmName"),
  photoUrl: text("photoUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  advisorIdIdx: index("advisor_id_idx").on(table.advisorId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Households - Client family units
 * Each advisor manages ~200 households
 */
export const households = mysqlTable("households", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull().references(() => users.id),
  
  // Household info
  householdName: varchar("householdName", { length: 255 }).notNull(),
  primaryContactName: varchar("primaryContactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  
  // Financial profile
  totalNetWorth: decimal("totalNetWorth", { precision: 15, scale: 2 }),
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]),
  investmentObjective: text("investmentObjective"),
  
  // Salesforce integration
  salesforceId: varchar("salesforceId", { length: 64 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  advisorIdIdx: index("household_advisor_idx").on(table.advisorId),
  salesforceIdIdx: index("household_salesforce_idx").on(table.salesforceId),
}));

export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

/**
 * Accounts - Individual investment accounts within households
 * Each household has ~7 accounts (IRA, 401k, taxable, etc.)
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull().references(() => households.id),
  
  // Account info
  accountNumber: varchar("accountNumber", { length: 64 }).notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountType: mysqlEnum("accountType", [
    "taxable",
    "ira_traditional",
    "ira_roth",
    "401k",
    "403b",
    "529",
    "trust",
    "other"
  ]).notNull(),
  
  // Account owner
  ownerName: varchar("ownerName", { length: 255 }),
  
  // Financial data
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }),
  costBasis: decimal("costBasis", { precision: 15, scale: 2 }),
  
  // Performance
  ytdReturn: decimal("ytdReturn", { precision: 10, scale: 4 }), // Percentage
  oneYearReturn: decimal("oneYearReturn", { precision: 10, scale: 4 }),
  
  // Status
  status: mysqlEnum("status", ["active", "closed", "pending"]).default("active"),
  
  // Salesforce integration
  salesforceId: varchar("salesforceId", { length: 64 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  householdIdIdx: index("account_household_idx").on(table.householdId),
  accountNumberIdx: unique("account_number_unique").on(table.accountNumber),
  salesforceIdIdx: index("account_salesforce_idx").on(table.salesforceId),
}));

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Holdings - Individual securities within accounts
 * Each account has ~15 holdings (typically S&P 500 stocks)
 */
export const holdings = mysqlTable("holdings", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().references(() => accounts.id),
  
  // Security info
  ticker: varchar("ticker", { length: 20 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  cusip: varchar("cusip", { length: 9 }),
  
  // Position data
  shares: decimal("shares", { precision: 15, scale: 4 }).notNull(),
  costBasis: decimal("costBasis", { precision: 15, scale: 2 }),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }),
  
  // Classification
  assetClass: mysqlEnum("assetClass", ["equity", "fixed_income", "cash", "alternative", "other"]),
  sector: varchar("sector", { length: 100 }),
  
  // Performance
  unrealizedGainLoss: decimal("unrealizedGainLoss", { precision: 15, scale: 2 }),
  unrealizedGainLossPercent: decimal("unrealizedGainLossPercent", { precision: 10, scale: 4 }),
  
  // Dates
  purchaseDate: timestamp("purchaseDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdIdx: index("holding_account_idx").on(table.accountId),
  tickerIdx: index("holding_ticker_idx").on(table.ticker),
}));

export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = typeof holdings.$inferInsert;

/**
 * Legacy clients table - kept for backward compatibility
 * Will be deprecated in favor of households
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull().references(() => users.id),
  householdId: int("householdId").references(() => households.id),
  
  clientName: varchar("clientName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  advisorIdIdx: index("client_advisor_idx").on(table.advisorId),
  householdIdIdx: index("client_household_idx").on(table.householdId),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Meetings - Advisor-client meetings
 */
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull().references(() => users.id),
  householdId: int("householdId").references(() => households.id),
  clientId: int("clientId").references(() => clients.id), // Legacy support
  
  meetingDate: timestamp("meetingDate").notNull(),
  meetingType: mysqlEnum("meetingType", ["review", "planning", "onboarding", "check-in"]),
  notes: text("notes"),
  talkingPoints: text("talkingPoints"), // JSON array
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  advisorIdIdx: index("meeting_advisor_idx").on(table.advisorId),
  householdIdIdx: index("meeting_household_idx").on(table.householdId),
  meetingDateIdx: index("meeting_date_idx").on(table.meetingDate),
}));

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Tasks - Advisor to-do items
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull().references(() => users.id),
  householdId: int("householdId").references(() => households.id),
  clientId: int("clientId").references(() => clients.id), // Legacy support
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending"),
  dueDate: timestamp("dueDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  advisorIdIdx: index("task_advisor_idx").on(table.advisorId),
  statusIdx: index("task_status_idx").on(table.status),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * News cache - Market news and insights
 */
export const newsCache = mysqlTable("newsCache", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  url: text("url"),
  source: varchar("source", { length: 100 }),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tickerIdx: index("news_ticker_idx").on(table.ticker),
  publishedAtIdx: index("news_published_idx").on(table.publishedAt),
}));

export type NewsCache = typeof newsCache.$inferSelect;
export type InsertNewsCache = typeof newsCache.$inferInsert;

/**
 * AI query history
 */
export const aiQueries = mysqlTable("aiQueries", {
  id: int("id").autoincrement().primaryKey(),
  advisorId: int("advisorId").notNull().references(() => users.id),
  householdId: int("householdId").references(() => households.id),
  clientId: int("clientId").references(() => clients.id), // Legacy support
  
  query: text("query").notNull(),
  response: text("response").notNull(),
  queryType: varchar("queryType", { length: 100 }),
  executionTimeMs: int("executionTimeMs"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  advisorIdIdx: index("ai_query_advisor_idx").on(table.advisorId),
  createdAtIdx: index("ai_query_created_idx").on(table.createdAt),
}));

export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = typeof aiQueries.$inferInsert;

/**
 * S&P 500 reference data
 */
export const sp500Companies = mysqlTable("sp500Companies", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 20 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  marketCap: decimal("marketCap", { precision: 20, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tickerIdx: unique("sp500_ticker_unique").on(table.ticker),
  sectorIdx: index("sp500_sector_idx").on(table.sector),
}));

export type SP500Company = typeof sp500Companies.$inferSelect;
export type InsertSP500Company = typeof sp500Companies.$inferInsert;
