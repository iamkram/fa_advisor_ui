import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Client management
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByAdvisor(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientName: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createClient({
          advisorId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Holdings
  holdings: router({
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getHoldingsByClient(input.clientId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        ticker: z.string(),
        companyName: z.string().optional(),
        shares: z.number(),
        costBasis: z.number().optional(),
        currentPrice: z.number().optional(),
        sector: z.string().optional(),
        assetClass: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createHolding(input);
        return { success: true };
      }),
  }),

  // Meetings
  meetings: router({
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMeetingsByClient(input.clientId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        meetingDate: z.date(),
        meetingType: z.enum(["review", "planning", "onboarding", "check-in"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMeeting({
          advisorId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Tasks
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTasksByAdvisor(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        clientId: z.number().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTask({
          advisorId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // AI queries
  ai: router({
    query: protectedProcedure
      .input(z.object({
        query: z.string(),
        clientId: z.number().optional(),
        queryType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // TODO: Integrate with FA AI System backend API
        // For now, return mock response
        const response = `Based on your query: "${input.query}"\n\nI've analyzed the available data and here are the key insights:\n\n• Portfolio performance is strong\n• Consider rebalancing recommendations\n• Tax optimization opportunities identified\n\nWould you like me to generate a detailed report?`;
        
        const executionTime = Date.now() - startTime;
        
        // Save query to history
        await db.saveAIQuery({
          advisorId: ctx.user.id,
          clientId: input.clientId,
          query: input.query,
          response,
          queryType: input.queryType,
          executionTimeMs: executionTime,
        });
        
        return {
          response,
          executionTimeMs: executionTime,
        };
      }),
    
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getAIQueryHistory(ctx.user.id, input.limit);
      }),
  }),

  // News
  news: router({
    getByTicker: protectedProcedure
      .input(z.object({ 
        ticker: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getNewsByTicker(input.ticker, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
