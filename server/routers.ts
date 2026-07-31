import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateResumeSuggestions, improveBulletPoints, calculateKeywordAlignment, improveSummary, improveProjectBullets, generateCoverLetter, generateLinkedInAbout, atsAudit, generateInterviewQuestions, generateRecruiterOutreach } from "./aiSuggestions";
import { nanoid } from "nanoid";
import { extractText, parseResumeWithLLM } from "./fileParser";
import { getAllApiKeys, saveApiKey, testApiKey as testApiKeyFunc, isAiPaused, upsertModelRoute } from "./apiKeyManager";
import { TRPCError } from "@trpc/server";
import { buildAdminUsageStats } from "./usageTracker";
import { runResumePipeline } from "./ai/pipelineOrchestrator";
import {
  createRazorpayOrder,
  getPaymentProvider,
  verifyAndFulfillCheckout,
  listPaymentOrders,
  adminRefundPaymentOrder,
} from "./payments/razorpay";
import { isEffectivelyPaid } from "./subscriptionGrace";

async function resolveTrackedAiOpts(ctx: {
  user?: { id: number } | null;
}): Promise<{
  userId: number | null;
  planTier: "guest" | "free" | "paid";
  guestKey?: string;
}> {
  let planTier: "guest" | "free" | "paid" = "guest";
  let userId: number | null = null;
  if (ctx.user?.id) {
    userId = ctx.user.id;
    const sub = await db.getSubscription(ctx.user.id);
    planTier = isEffectivelyPaid(sub) ? "paid" : "free";
  }
  return {
    userId,
    planTier,
    guestKey: userId == null ? "anonymous-web" : undefined,
  };
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      ctx.res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: false });
      ctx.res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "none", secure: true });
      ctx.res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true });
      ctx.res.clearCookie(COOKIE_NAME);
      return {
        success: true,
      } as const;
    }),
    setEvaluationOptOut: protectedProcedure
      .input(z.object({ optOut: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await db.setUserEvaluationOptOut(ctx.user.id, input.optOut);
        return { success: true as const, evaluationOptOut: input.optOut };
      }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(200),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updated = await db.updateUserProfile(ctx.user.id, {
          name: input.name,
        });
        return { success: true as const, user: updated };
      }),
    convertGuest: protectedProcedure
      .input(z.object({ guestSessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return db.convertGuestSession(input.guestSessionId, ctx.user.id);
      }),
  }),

  // Resume Router
  resume: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listResumes(ctx.user.id);
    }),
    
    parse: publicProcedure
      .input(z.object({
        filename: z.string(),
        base64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const fileBuffer = Buffer.from(input.base64, "base64");
        const rawText = await extractText(fileBuffer, input.filename);
        return parseResumeWithLLM(rawText);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const resume = await db.getResume(input.id);
        if (!resume || resume.userId !== ctx.user.id) {
          throw new Error("Resume not found or access denied");
        }
        return resume;
      }),
      
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        templateId: z.string(),
        content: z.string(), // JSON string representing the Resume content
        jobDescriptionId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        return db.createResume({
          id,
          userId: ctx.user.id,
          title: input.title,
          templateId: input.templateId,
          content: input.content,
          jobDescriptionId: input.jobDescriptionId || null,
        });
      }),
      
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        templateId: z.string().optional(),
        content: z.string().optional(),
        jobDescriptionId: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getResume(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Resume not found or access denied");
        }
        
        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.templateId !== undefined) updateData.templateId = input.templateId;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.jobDescriptionId !== undefined) updateData.jobDescriptionId = input.jobDescriptionId;
        
        const updated = await db.updateResume(input.id, ctx.user.id, updateData);
        if (updated && input.content !== undefined) {
          await db.saveResumeHistory(
            ctx.user.id,
            updated.id,
            updated.title,
            updated.templateId,
            updated.content
          );
        }
        return updated;
      }),
      
    getHistory: protectedProcedure
      .input(z.object({ resumeId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getResumeHistory(input.resumeId, ctx.user.id);
      }),
      
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getResume(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Resume not found or access denied");
        }
        return db.deleteResume(input.id, ctx.user.id);
      }),

    restore: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getResume(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Resume not found or access denied");
        }
        return db.restoreResume(input.id, ctx.user.id);
      }),
  }),

  // Job Description Router
  jobDescription: router({
    list: publicProcedure
      .input(z.object({ includeCustom: z.boolean().default(true) }))
      .query(async ({ input, ctx }) => {
        const userId = input.includeCustom && ctx.user ? ctx.user.id : undefined;
        return db.listJobDescriptions(userId);
      }),
      
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        keywords: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        return db.createJobDescription({
          id,
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          keywords: JSON.stringify(input.keywords),
          isCustom: true,
        });
      }),
      
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getJobDescription(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Job description not found or access denied");
        }
        return db.deleteJobDescription(input.id, ctx.user.id);
      }),
  }),

  // AI Integration Router — gated by AI_PAUSED kill switch
  ai: (() => {
    const aiProcedure = publicProcedure.use(async ({ next }) => {
      if (isAiPaused()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "temporarily unavailable, try again shortly",
        });
      }
      return next();
    });

    return router({
    generateFullResume: aiProcedure
      .input(z.object({
        jobTitle: z.string(),
        experienceDetails: z.string(),
        experienceLevel: z.string().optional(),
        market: z.string().optional(),
        jobDescription: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const opts = await resolveTrackedAiOpts(ctx);
          return await runResumePipeline(
            {
              sourceText: input.experienceDetails || "",
              jobTitle: input.jobTitle,
              jobDescription: input.jobDescription,
              market: input.market,
              experienceLevel: input.experienceLevel,
            },
            opts
          );
        } catch (error: any) {
          console.error("AI Generation error:", error);
          // NEVER return fabricated data — throw a real error instead
          throw new Error(
            `Resume generation failed: ${error?.message || "Unknown error"}. ` +
            "Please check that your API keys are configured correctly in the .env file and try again, " +
            "or use the 'Create from scratch' option to build your resume manually."
          );
        }
      }),

    generateSuggestions: aiProcedure
      .input(z.object({
        resumeId: z.string().optional(),
        resumeContent: z.string().optional(), // Fallback raw JSON string
        jobDescription: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        let resumeObj: any = null;
        if (input.resumeId) {
          const res = await db.getResume(input.resumeId);
          if (res && ctx.user && res.userId === ctx.user.id) {
            resumeObj = JSON.parse(res.content);
          }
        }
        if (!resumeObj && input.resumeContent) {
          resumeObj = JSON.parse(input.resumeContent);
        }
        if (!resumeObj) {
          throw new Error("Valid resume data is required");
        }
        return generateResumeSuggestions(resumeObj, input.jobDescription);
      }),

    improveBullets: aiProcedure
      .input(z.object({
        role: z.string(),
        company: z.string(),
        currentBullets: z.array(z.string()),
        jobDescription: z.string(),
        countryCode: z.string().optional(),
        targetCountryCode: z.string().optional(),
        jobTitle: z.string().optional(),
        targetRole: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const opts = await resolveTrackedAiOpts(ctx);
        return improveBulletPoints(
          input.role,
          input.company,
          input.currentBullets,
          input.jobDescription,
          input.countryCode,
          input.targetCountryCode,
          input.jobTitle,
          input.targetRole,
          opts
        );
      }),

    improveSummary: aiProcedure
      .input(z.object({
        currentSummary: z.string(),
        jobDescription: z.string(),
        jobTitle: z.string().optional(),
        targetRole: z.string().optional(),
        countryCode: z.string().optional(),
        targetCountryCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const opts = await resolveTrackedAiOpts(ctx);
        return improveSummary(
          input.currentSummary,
          input.jobDescription,
          input.jobTitle,
          input.countryCode,
          input.targetCountryCode,
          input.targetRole,
          opts
        );
      }),

    improveProjectBullets: aiProcedure
      .input(z.object({
        projectName: z.string(),
        stack: z.array(z.string()),
        currentBullets: z.array(z.string()),
        jobDescription: z.string(),
        targetRole: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const opts = await resolveTrackedAiOpts(ctx);
        return improveProjectBullets(
          input.projectName,
          input.stack,
          input.currentBullets,
          input.jobDescription,
          input.targetRole,
          opts
        );
      }),

    generateCoverLetter: aiProcedure
      .input(z.object({
        name: z.string(),
        targetRole: z.string(),
        companyName: z.string(),
        hiringManagerName: z.string().optional(),
        summary: z.string(),
        experienceBullets: z.string(),
        skills: z.string(),
        jobDescription: z.string(),
      }))
      .mutation(async ({ input }) => {
        return generateCoverLetter(input);
      }),

    generateLinkedInAbout: aiProcedure
      .input(z.object({
        summary: z.string(),
        jobTitle: z.string(),
        skills: z.string(),
        experienceHighlights: z.string(),
      }))
      .mutation(async ({ input }) => {
        return generateLinkedInAbout(input);
      }),

    calculateScore: aiProcedure
      .input(z.object({
        resumeContent: z.string(),
        jobDescription: z.string(),
      }))
      .mutation(async ({ input }) => {
        const resumeObj = JSON.parse(input.resumeContent);
        return calculateKeywordAlignment(resumeObj, input.jobDescription);
      }),

    atsAudit: aiProcedure
      .input(z.object({
        resumeText: z.string(),
        jobDescription: z.string(),
      }))
      .mutation(async ({ input }) => {
        return atsAudit(input.resumeText, input.jobDescription);
      }),

    generateInterviewQuestions: aiProcedure
      .input(z.object({
        resumeText: z.string(),
        jobDescription: z.string(),
      }))
      .mutation(async ({ input }) => {
        return generateInterviewQuestions(input.resumeText, input.jobDescription);
      }),

    generateRecruiterOutreach: aiProcedure
      .input(z.object({
        topSkills: z.string(),
        mostRecentRole: z.string(),
        jobTitle: z.string(),
        companyName: z.string(),
        roleSummary: z.string(),
      }))
      .mutation(async ({ input }) => {
        return generateRecruiterOutreach(input);
      }),

    /** C5 — thumbs up/down on AI rewrite quality */
    submitEvaluation: aiProcedure
      .input(z.object({
        resumeId: z.string().optional(),
        stage: z.string().default("rewrite"),
        rating: z.enum(["up", "down"]),
        note: z.string().optional(),
        overallScore: z.number().int().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.evaluationOptOut) {
          return { skipped: true as const, reason: "evaluation_opt_out" as const };
        }
        const { insertResumeEvaluation, getActivePrompt } = await import(
          "./promptVersions"
        );
        const active = await getActivePrompt(input.stage);
        return insertResumeEvaluation({
          userId: ctx.user?.id ?? null,
          resumeId: input.resumeId ?? null,
          stage: input.stage,
          promptVersionId: active?.id ?? null,
          rating: input.rating,
          note: input.note ?? null,
          overallScore: input.overallScore ?? null,
        });
      }),
  });
  })(),

// PRUNED — not in V6 scope, see ARCHITECTURE.md scope question
//   // SaaS: Organization Router
//   organization: router({
//     list: protectedProcedure.query(async ({ ctx }) => {
//       return db.getUserOrganizations(ctx.user.id);
//     }),
//     create: protectedProcedure
//       .input(z.object({ name: z.string(), slug: z.string() }))
//       .mutation(async ({ input, ctx }) => {
//         const id = nanoid();
//         const org = await db.createOrganization({
//           id,
//           name: input.name,
//           slug: input.slug,
//           primaryColor: "#1e40af",
//           secondaryColor: "#0d9488",
//           logoUrl: "https://www.hexastacksolutions.com/logo.png",
//           customDomain: `${input.slug}.hexacv.com`
//         });
//         await db.addOrganizationMember({
//           id: nanoid(),
//           organizationId: id,
//           userId: ctx.user.id,
//           role: "owner"
//         });
//         return org;
//       }),
//     update: protectedProcedure
//       .input(z.object({
//         id: z.string(),
//         name: z.string().optional(),
//         logoUrl: z.string().optional(),
//         primaryColor: z.string().optional(),
//         secondaryColor: z.string().optional(),
//         customDomain: z.string().optional()
//       }))
//       .mutation(async ({ input, ctx }) => {
//         const members = await db.getOrganizationMembers(input.id);
//         const caller = members.find(m => m.userId === ctx.user.id);
//         if (!caller || (caller.role !== 'owner' && caller.role !== 'admin')) {
//           throw new Error("Unauthorized to update organization");
//         }
//         return db.updateOrganization(input.id, input);
//       }),
//     members: protectedProcedure
//       .input(z.object({ orgId: z.string() }))
//       .query(async ({ input, ctx }) => {
//         const members = await db.getOrganizationMembers(input.orgId);
//         const isMember = members.some(m => m.userId === ctx.user.id);
//         if (!isMember) {
//           throw new Error("Unauthorized to view members");
//         }
//         return members;
//       }),
//     invite: protectedProcedure
//       .input(z.object({ orgId: z.string(), email: z.string(), role: z.string() }))
//       .mutation(async ({ input, ctx }) => {
//         const members = await db.getOrganizationMembers(input.orgId);
//         const caller = members.find(m => m.userId === ctx.user.id);
//         if (!caller || (caller.role !== 'owner' && caller.role !== 'admin')) {
//           throw new Error("Unauthorized to invite members");
//         }
//         const invitee = db.mockDb.users.find(u => u.email === input.email);
//         if (!invitee) {
//           throw new Error("No HexaCv user found with that email yet. Have them sign in once first!");
//         }
//         return db.addOrganizationMember({
//           id: nanoid(),
//           organizationId: input.orgId,
//           userId: invitee.id,
//           role: input.role
//         });
//       }),
//     removeMember: protectedProcedure
//       .input(z.object({ orgId: z.string(), memberId: z.string() }))
//       .mutation(async ({ input, ctx }) => {
//         const members = await db.getOrganizationMembers(input.orgId);
//         const caller = members.find(m => m.userId === ctx.user.id);
//         if (!caller || (caller.role !== 'owner' && caller.role !== 'admin')) {
//           throw new Error("Unauthorized to remove members");
//         }
//         return db.removeOrganizationMember(input.orgId, input.memberId);
//       })
//   }),

// PRUNED — not in V6 scope, see ARCHITECTURE.md scope question
//   // SaaS: Marketplace Router
//   marketplace: router({
//     list: publicProcedure
//       .input(z.object({ type: z.string().optional() }))
//       .query(async ({ input }) => {
//         return db.listMarketplaceItems(input.type);
//       }),
//     publish: protectedProcedure
//       .input(z.object({
//         title: z.string(),
//         description: z.string(),
//         type: z.string(),
//         content: z.string(),
//         price: z.number(),
//         isPremium: z.boolean()
//       }))
//       .mutation(async ({ input, ctx }) => {
//         return db.createMarketplaceItem({
//           id: nanoid(),
//           authorId: ctx.user.id,
//           title: input.title,
//           description: input.description,
//           type: input.type,
//           content: input.content,
//           price: input.price,
//           isPremium: input.isPremium
//         });
//       }),
//     download: publicProcedure
//       .input(z.object({ id: z.string() }))
//       .mutation(async ({ input }) => {
//         return db.incrementDownloads(input.id);
//       }),
//     rate: protectedProcedure
//       .input(z.object({ id: z.string(), rating: z.number() }))
//       .mutation(async ({ input, ctx }) => {
//         return db.rateMarketplaceItem(input.id, input.rating);
//       })
//   }),

  // SaaS: Affiliate Router
  affiliate: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return db.getReferralsByReferrer(ctx.user.id);
    }),
    trackClick: publicProcedure
      .input(z.object({ referrerId: z.number(), email: z.string() }))
      .mutation(async ({ input }) => {
        return db.trackReferralClick(input.referrerId, input.email);
      })
  }),

// PRUNED — not in V6 scope, see ARCHITECTURE.md scope question
//   // SaaS: Recruiter Router
//   recruiter: router({
//     createJob: protectedProcedure
//       .input(z.object({
//         orgId: z.string(),
//         title: z.string(),
//         description: z.string(),
//         requirements: z.string()
//       }))
//       .mutation(async ({ input, ctx }) => {
//         const members = await db.getOrganizationMembers(input.orgId);
//         const caller = members.find(m => m.userId === ctx.user.id);
//         if (!caller || (caller.role !== 'owner' && caller.role !== 'recruiter' && caller.role !== 'admin')) {
//           throw new Error("Unauthorized to create job for this organization");
//         }
//         return db.createRecruiterJob({
//           id: nanoid(),
//           organizationId: input.orgId,
//           title: input.title,
//           description: input.description,
//           requirements: input.requirements
//         });
//       }),
//     listJobs: publicProcedure
//       .input(z.object({ orgId: z.string().optional() }))
//       .query(async ({ input }) => {
//         return db.listRecruiterJobs(input.orgId);
//       }),
//     listApplications: protectedProcedure
//       .input(z.object({ jobId: z.string() }))
//       .query(async ({ input, ctx }) => {
//         const job = await db.getRecruiterJob(input.jobId);
//         if (!job) throw new Error("Recruiter job vacancy not found");
//         const members = await db.getOrganizationMembers(job.organizationId);
//         const caller = members.find(m => m.userId === ctx.user.id);
//         if (!caller || (caller.role !== 'owner' && caller.role !== 'recruiter' && caller.role !== 'admin')) {
//           throw new Error("Unauthorized to view applications for this vacancy");
//         }
//         return db.listJobApplications(input.jobId);
//       }),
//     submitApplication: publicProcedure
//       .input(z.object({
//         jobId: z.string(),
//         applicantName: z.string(),
//         applicantEmail: z.string(),
//         resumeContent: z.string()
//       }))
//       .mutation(async ({ input }) => {
//         const job = await db.getRecruiterJob(input.jobId);
//         if (!job) throw new Error("Recruiter job listing not found");
//
//         let parsedResume: any;
//         try {
//           parsedResume = JSON.parse(input.resumeContent);
//         } catch {
//           // fallback mock resume structure if plain text is submitted
//           parsedResume = {
//             sections: [
//               { type: "skills", content: { skills: [{ category: "Skills", skills: input.resumeContent.split(/\s*,\s*/) }] } },
//               { type: "experience", content: { experiences: [{ role: "Candidate", company: "General", description: [input.resumeContent] }] } }
//             ]
//           };
//         }
//
//         const scoreObj = await calculateKeywordAlignment(parsedResume, job.requirements);
//         return db.createJobApplication({
//           id: nanoid(),
//           jobId: input.jobId,
//           applicantName: input.applicantName,
//           applicantEmail: input.applicantEmail,
//           matchScore: scoreObj.score,
//           resumeContent: input.resumeContent,
//           status: "pending"
//         });
//       }),
//     updateStatus: protectedProcedure
//       .input(z.object({ id: z.string(), status: z.string() }))
//       .mutation(async ({ input, ctx }) => {
//         const app = await db.getJobApplication(input.id);
//         if (!app) throw new Error("Application not found");
//         const job = await db.getRecruiterJob(app.jobId);
//         if (!job) throw new Error("Recruiter job vacancy not found");
//         const members = await db.getOrganizationMembers(job.organizationId);
//         const caller = members.find(m => m.userId === ctx.user.id);
//         if (!caller || (caller.role !== 'owner' && caller.role !== 'recruiter' && caller.role !== 'admin')) {
//           throw new Error("Unauthorized to modify application status");
//         }
//         return db.updateApplicationStatus(input.id, input.status);
//       })
//   }),

  // SaaS: Billing & Support Router (Razorpay only)
  billing: router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return db.getSubscription(ctx.user.id);
    }),

    getPaymentProvider: protectedProcedure.query(async () => {
      return { provider: getPaymentProvider() };
    }),
    
    createCheckoutSession: protectedProcedure
      .input(z.object({ tier: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const tier = input.tier.toLowerCase();
        if (tier === "free") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot checkout free tier" });
        }

        try {
          const order = await createRazorpayOrder({
            userId: ctx.user.id,
            tier,
          });
          return {
            provider: "razorpay" as const,
            keyId: order.keyId,
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            tier: order.tier,
            paymentOrderId: order.paymentOrderId,
            sandbox: order.sandbox,
            url: null as string | null,
          };
        } catch (e: any) {
          console.error("Razorpay order creation error:", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Razorpay order failed: ${e.message}`,
          });
        }
      }),

    verifyRazorpayPayment: protectedProcedure
      .input(
        z.object({
          orderId: z.string().min(1),
          paymentId: z.string().min(1),
          signature: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await verifyAndFulfillCheckout({
            userId: ctx.user.id,
            orderId: input.orderId,
            paymentId: input.paymentId,
            signature: input.signature,
          });
          return {
            ok: true,
            duplicate: result.duplicate,
            tier: result.order?.tier,
          };
        } catch (e: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e.message || "Payment verification failed",
          });
        }
      }),
  }),

  support: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listSupportTickets(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ title: z.string(), description: z.string(), priority: z.string().default("medium") }))
      .mutation(async ({ input, ctx }) => {
        return db.createSupportTicket(ctx.user.id, input.title, input.description, input.priority);
      })
  }),

  backup: router({
    save: protectedProcedure
      .input(z.object({
        type: z.string(),
        name: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.saveCloudBackup(ctx.user.id, input.type, input.name, input.content);
      }),
    list: protectedProcedure
      .input(z.object({ type: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.listCloudBackups(ctx.user.id, input.type);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteCloudBackup(input.id, ctx.user.id);
      }),
  }),

  // SaaS Admin & CRM Router
  admin: router({
    getDashboardStats: adminProcedure.query(async () => {
      return db.getAnalyticsSummary();
    }),
    getUsers: adminProcedure.query(async () => {
      return db.getCRMUsersList();
    }),
    getTickets: adminProcedure.query(async () => {
      return db.listSupportTickets();
    }),
    resolveTicket: adminProcedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(async ({ input }) => {
        return db.resolveSupportTicket(input.id, input.status);
      }),
    getApiKeys: adminProcedure.query(async () => {
      return getAllApiKeys();
    }),
    updateApiKey: adminProcedure
      .input(z.object({ keyName: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        saveApiKey(input.keyName, input.value);
        return { success: true, keyName: input.keyName };
      }),
    testApiKey: adminProcedure
      .input(z.object({ keyName: z.string() }))
      .mutation(async ({ input }) => {
        return testApiKeyFunc(input.keyName);
      }),

    getUsageStats: adminProcedure.query(async () => {
      return buildAdminUsageStats();
    }),

    setModelRoute: adminProcedure
      .input(
        z.object({
          id: z.string().optional(),
          stage: z.string().min(1),
          tier: z.string().min(1),
          provider: z.string().min(1),
          model: z.string().min(1),
          rpmLimit: z.number().int().positive(),
          rpdLimit: z.number().int().positive(),
          priority: z.number().int(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updatedBy =
          ctx.user.email || ctx.user.openId || `user-${ctx.user.id}`;
        const row = await upsertModelRoute({ ...input, updatedBy });
        return { success: true as const, route: row };
      }),

    setAiPaused: adminProcedure
      .input(z.object({ paused: z.boolean() }))
      .mutation(async ({ input }) => {
        saveApiKey("AI_PAUSED", input.paused ? "true" : "false");
        return { success: true as const, aiPaused: isAiPaused() };
      }),

    /** Manual tier grant — admin only. Paid upgrades otherwise go through Razorpay fulfill. */
    manualGrantSubscription: adminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          tier: z.string().min(1),
          reason: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        console.log(
          `[Admin] manualGrantSubscription by user=${ctx.user.id} target=${input.userId} tier=${input.tier} reason=${input.reason}`
        );
        const sub = await db.updateSubscription(input.userId, input.tier);
        const price =
          input.tier === "enterprise" ? 9900 : input.tier === "pro" ? 1900 : 0;
        if (price > 0) {
          const crmUsers = await db.getCRMUsersList();
          const target = crmUsers.find(u => u.id === input.userId);
          if (target?.email) {
            await db.rewardReferralConversion(target.email, input.userId, price);
          }
        }
        return sub;
      }),

    setUserRole: adminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          role: z.enum(["user", "admin"]),
          reason: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.userId === ctx.user.id && input.role === "user") {
          const adminCount = await db.countAdmins();
          if (adminCount <= 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot demote the only remaining admin",
            });
          }
        }
        console.log(
          `[Admin] setUserRole by user=${ctx.user.id} target=${input.userId} role=${input.role} reason=${input.reason}`
        );
        const updated = await db.setUserRole(input.userId, input.role);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return updated;
      }),

    listPaymentOrders: adminProcedure.query(async () => {
      return listPaymentOrders(100);
    }),

    refundPayment: adminProcedure
      .input(
        z.object({
          paymentOrderId: z.string().min(1),
          reason: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await adminRefundPaymentOrder({
            paymentOrderId: input.paymentOrderId,
            reason: input.reason,
            adminUserId: ctx.user.id,
          });
        } catch (e: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e?.message || "Refund failed",
          });
        }
      }),
  }),
});


export type AppRouter = typeof appRouter;

