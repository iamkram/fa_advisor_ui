import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { faAiClient } from "./services/faAiClient";
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
        accountId: z.number(),
        ticker: z.string(),
        companyName: z.string().optional(),
        shares: z.number(),
        costBasis: z.number().optional(),
        currentPrice: z.number().optional(),
        sector: z.string().optional(),
        assetClass: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createHolding({
          accountId: input.accountId,
          ticker: input.ticker,
          companyName: input.companyName || null,
          shares: input.shares.toString(),
          costBasis: input.costBasis?.toString() || null,
          currentPrice: input.currentPrice?.toString() || null,
          sector: input.sector || null,
          assetClass: input.assetClass as any || null,
        });
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
    
    transcribeAndGenerateNotes: protectedProcedure
      .input(z.object({
        householdId: z.number(),
        audioData: z.string(), // base64 encoded audio
        clientName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { transcribeAndGenerateNotes } = await import("./services/meetingNotes");
        
        const result = await transcribeAndGenerateNotes(
          input.audioData,
          input.clientName
        );
        
        // Save as interaction
        await db.createInteraction({
          advisorId: ctx.user.id,
          householdId: input.householdId,
          interactionType: "meeting",
          subject: `Meeting with ${input.clientName}`,
          description: result.notes,
          interactionDate: new Date(),
          outcome: result.summary,
          nextSteps: result.nextSteps.join('; '),
        });
        
        return result;
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

  // Interactions
  interactions: router({  
    getByHousehold: protectedProcedure
      .input(z.object({ householdId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInteractionsByHousehold(input.householdId);
      }),
    
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getInteractionsByAdvisor(ctx.user.id, input.limit);
      }),
    
    create: protectedProcedure
      .input(z.object({
        householdId: z.number(),
        interactionType: z.enum(["email", "call", "meeting", "note"]),
        subject: z.string(),
        description: z.string().optional(),
        interactionDate: z.date(),
        duration: z.number().optional(),
        outcome: z.string().optional(),
        nextSteps: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createInteraction({
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
        
        let response: string;
        let sources: any[] = [];
        
        try {
          // Call FA AI System backend
          const result = await faAiClient.query({
            query: input.query,
            fa_id: ctx.user.advisorId || ctx.user.id.toString(),
            client_id: input.clientId,
            include_news: true,
            query_type: input.queryType || "meeting_prep",
          });
          
          response = result.response;
          sources = result.sources || [];
        } catch (error) {
          console.error("FA AI System error:", error);
          
          // Fallback to mock response if backend is unavailable
          response = `I'm currently unable to connect to the AI analysis system. Here's what I can tell you based on cached data:\n\n• Your query: "${input.query}"\n• System status: Temporarily unavailable\n• Please try again in a moment\n\nIf this persists, contact support.`;
        }
        
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
          sources,
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
