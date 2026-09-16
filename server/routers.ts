import { COOKIE_NAME } from "@shared/const";
import { isValidCountryCode, getCountryContext } from "@shared/countriesData";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateResumeSuggestions, improveBulletPoints, calculateKeywordAlignment, improveSummary, improveProjectBullets, generateLinkedInAbout, atsAudit, generateInterviewQuestions, generateRecruiterOutreach } from "./aiSuggestions";
import { generateCoverLetter, COVER_LETTER_TONES, COVER_LETTER_LENGTHS } from "./coverLetterGenerator";
import { analyzeResume } from "./aiResumeAnalyzer";
import { analyzeJobDescription } from "./jdAnalyzer";
import { matchResumeToJob } from "./resumeJobMatcher";
import { optimizeResume, OPTIMIZER_SECTIONS } from "./resumeOptimizer";
import { resumeHasRealContent } from "./contentValidation";
import { nanoid } from "nanoid";
import { extractText, parseResumeWithLLM } from "./fileParser";
import { isResumeParseTextTooLong, validateResumeUpload } from "./uploadValidation";
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
import {
  getCreditBalance,
  grantSignupFreeCredit,
  consumeBuildCredit,
  releaseBuildCredit,
  createBuild,
  updateBuildStage,
  getBuild,
} from "./credits";

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

// ---------------------------------------------------------------------------
// PHASE 5 — server-side canonical country-code validation.
//
// Country codes enter the system from two places, both canonicalized here:
//   1. resume.content JSON — the header stores `countryCode` /
//      `targetCountryCode` (ISO 3166-1 alpha-2). We validate the parsed JSON
//      server-side and REJECT unknown / malformed codes.
//   2. AI micro-tool inputs (`countryCode` / `targetCountryCode`) — validated
//      by zod refine in their procedure inputs (see improveBullets /
//      improveSummary).
// Default is to reject unknown/malformed codes; we never trust a client-supplied
// country name. `null`/absent is the canonical "not set" (backward-compatible
// with existing resumes that predate country selection).
// ---------------------------------------------------------------------------

/**
 * True only when every country field present in the content JSON is valid.
 * A code is canonical if it is present in the shared master list (the 250+
 * ISO alpha-2 set) OR in the DB countries table (which admins can extend via
 * the existing admin endpoints). Unknown/malformed codes are rejected.
 */
async function isContentCountryFieldsValid(rawContent: string): Promise<boolean> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return true; // malformed JSON is handled by the resume content path, not here
  }
  const header =
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    (parsed as Record<string, unknown>).header;
  if (!header || typeof header !== "object") return true;
  const h = header as Record<string, unknown>;
  const fields: unknown[] = [];
  if ("countryCode" in h) fields.push(h.countryCode);
  if ("targetCountryCode" in h) fields.push(h.targetCountryCode);
  const needsDbCheck: string[] = [];
  for (const code of fields) {
    if (code === null || code === undefined) continue;
    if (typeof code !== "string") return false;
    if (!isValidCountryCode(code)) needsDbCheck.push(code);
  }
  if (needsDbCheck.length === 0) return true;
  try {
    const dbCountries = await db.getCountries();
    const dbCodes = new Set((dbCountries || []).map((c) => String(c.code).toUpperCase()));
    return needsDbCheck.every((c) => dbCodes.has(c.toUpperCase()));
  } catch {
    return false; // on DB lookup failure, err toward rejecting the unknown code
  }
}

/** Zod post-check used by AI procedures that accept country codes. */
const optionalCountryCode = z
  .string()
  .max(10)
  .optional()
  .refine((v) => v === undefined || isValidCountryCode(v), {
    message: "Invalid or unknown ISO 3166-1 alpha-2 country code.",
  });

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
        const result = await db.convertGuestSession(input.guestSessionId, ctx.user.id);
        // Ensure free credit exists (idempotent) for converted accounts
        await grantSignupFreeCredit(ctx.user.id);
        return result;
      }),
  }),

  // V6: per-build credits
  credits: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const balance = await getCreditBalance(ctx.user.id);
      return {
        balance,
        ctaLabel:
          balance > 0
            ? "Build my resume — free"
            : "Build my resume — ₹99",
      };
    }),
    ensureSignupCredit: protectedProcedure.mutation(async ({ ctx }) => {
      const balance = await grantSignupFreeCredit(ctx.user.id);
      return { balance };
    }),
  }),

  // Resume Router
  resume: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listResumes(ctx.user.id);
    }),
    
    parse: publicProcedure
      .input(z.object({
        filename: z.string().trim().min(1).max(255),
        // TODO(upload): accept multipart/binary instead of base64 to avoid ~33% overhead
        // (see client/src/lib/base64.ts). Keep base64 until tRPC transport supports it cleanly.
        base64: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Server-authoritative gate on extension / size / encoding. Runs before
        // any parsing or LLM work, so an oversized or malformed upload never
        // reaches costly extraction (Step 4 — resume.parse upload size hardening).
        const validated = validateResumeUpload(input);
        if (!validated.ok) {
          throw new TRPCError({ code: "BAD_REQUEST", message: validated.error });
        }

        // resume.parse routes text through the LLM, so it honors the AI_PAUSED
        // kill switch just like every other AI procedure (Step 3).
        if (isAiPaused()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "temporarily unavailable, try again shortly",
          });
        }

        const rawText = await extractText(validated.buffer, validated.extension);

        // Guard extracted text length before it reaches the parse LLM (Step 4).
        if (isResumeParseTextTooLong(rawText)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "This resume is too long to parse. Please trim it to a more concise one-page summary and try again.",
          });
        }

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

    /** V6: poll pipeline stage while generateFullResume is in flight */
    buildStatus: protectedProcedure
      .input(z.object({ buildId: z.string() }))
      .query(async ({ input, ctx }) => {
        const build = await getBuild(input.buildId, ctx.user.id);
        if (!build) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Build not found" });
        }
        return build;
      }),

    startBuild: protectedProcedure
      .input(
        z.object({
          role: z.string().optional(),
          region: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const build = await createBuild({
          userId: ctx.user.id,
          role: input.role,
          region: input.region,
        });
        return build;
      }),
      
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        templateId: z.literal("classic-ats-blue"),
        content: z.string(), // JSON string representing the Resume content
        jobDescriptionId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        if (!(await isContentCountryFieldsValid(input.content))) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Invalid country selection. Pick a country from the list or skip for now.",
          });
        }
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
        if (input.content !== undefined) {
          if (!(await isContentCountryFieldsValid(input.content))) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Invalid country selection. Pick a country from the list or skip for now.",
            });
          }
          updateData.content = input.content;
        }
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
    // Generous cap so a real resume/JD always fits, while an absurd payload is
    // rejected before reaching the LLM (Step 12 — AI input safety).
    const AI_MAX_TEXT = 50_000;
    // Phase 7 — JD Analyzer accepts up to 100k characters.
    const JD_MAX_TEXT = 100_000;
    const aiText = () => z.string().max(AI_MAX_TEXT);
    const aiRequiredText = () => z.string().trim().min(1).max(AI_MAX_TEXT);

    const aiProcedure = publicProcedure.use(async ({ next }) => {
      if (isAiPaused()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "temporarily unavailable, try again shortly",
        });
      }
      return next();
    });

    // Auth-aware layer for LLM-invoking AI procedures. AI generation is a paid
    // operation: authenticated users only. Guests keep local/scratch workflows
    // (no server-side paid AI), per the guest-AI policy.
    const aiProtectedProcedure = aiProcedure.use(async ({ next, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Please sign in to use this AI feature.",
        });
      }
      return next();
    });

    // Adds a credit gate on top of auth for AI *generation*. Signed-in users
    // without a credit balance cannot run the (paid) LLM micro-tools — matching
    // the existing build-pipeline policy and the "insufficient credits" UX.
    // Consumption itself stays per-build (consume-on-success, release-on-error)
    // in generateFullResume; these micro-tools are gated but not metered here.
    const aiCreditProtectedProcedure = aiProtectedProcedure.use(
      async ({ next, ctx }) => {
        const balance = await getCreditBalance(ctx.user!.id);
        if (balance < 1) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }
        return next();
      }
    );

    return router({
    generateFullResume: aiProcedure
      .input(z.object({
        jobTitle: z.string(),
        experienceDetails: z.string(),
        experienceLevel: z.string().optional(),
        market: z.string().optional(),
        jobDescription: z.string().optional(),
        buildId: z.string().optional(),
        // Phase 5 — target country code for regional ATS/AI context.
        targetCountryCode: optionalCountryCode,
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Sign in to run the AI pipeline. Your draft is saved.",
          });
        }
        const userId = ctx.user.id;
        const balance = await getCreditBalance(userId);
        if (balance < 1) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        let build =
          input.buildId
            ? await getBuild(input.buildId, userId)
            : null;
        if (!build) {
          build = await createBuild({
            userId,
            role: input.jobTitle,
            region: input.market,
          });
        }

        const consumed = await consumeBuildCredit(userId, build.id);
        if (!consumed.ok) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        try {
          const opts = await resolveTrackedAiOpts(ctx);
          const result = await runResumePipeline(
            {
              sourceText: input.experienceDetails || "",
              jobTitle: input.jobTitle,
              jobDescription: input.jobDescription,
              market: input.market,
              experienceLevel: input.experienceLevel,
              targetCountryCode: input.targetCountryCode,
            },
            opts,
            async (stage) => {
              await updateBuildStage(build!.id, stage);
            }
          );
          await updateBuildStage(build.id, "done");
          return { ...result, buildId: build.id };
        } catch (error: any) {
          console.error("AI Generation error:", error);
          await releaseBuildCredit(userId, build.id);
          await updateBuildStage(build.id, "failed", {
            errorMessage: error?.message || "Generation failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              `We hit a snag on the AI pipeline — no credit used. ` +
              `${error?.message || "Please try again."}`,
          });
        }
      }),

    generateSuggestions: aiCreditProtectedProcedure
      .input(z.object({
        resumeId: z.string().max(64).optional(),
        resumeContent: aiText().optional(), // Fallback raw JSON string
        jobDescription: aiRequiredText(),
      }))
      .mutation(async ({ input, ctx }) => {
        let resumeObj: any = null;
        if (input.resumeId) {
          const res = await db.getResume(input.resumeId);
          // Never fall through to client content when an owned resume is named
          // — an unowned id is an ownership failure, not a fallback trigger.
          if (!res || res.userId !== ctx.user!.id) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Resume not found or access denied",
            });
          }
          resumeObj = JSON.parse(res.content);
        }
        if (!resumeObj && input.resumeContent) {
          resumeObj = JSON.parse(input.resumeContent);
        }
        if (!resumeObj) {
          throw new Error("Valid resume data is required");
        }
        return generateResumeSuggestions(resumeObj, input.jobDescription);
      }),

    improveBullets: aiCreditProtectedProcedure
      .input(z.object({
        role: aiRequiredText(),
        company: aiRequiredText(),
        currentBullets: z.array(aiText()).max(200),
        jobDescription: aiRequiredText(),
        countryCode: optionalCountryCode,
        targetCountryCode: optionalCountryCode,
        jobTitle: aiText().optional(),
        targetRole: aiText().optional(),
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

    improveSummary: aiCreditProtectedProcedure
      .input(z.object({
        currentSummary: aiText(),
        jobDescription: aiRequiredText(),
        jobTitle: aiText().optional(),
        targetRole: aiText().optional(),
        countryCode: optionalCountryCode,
        targetCountryCode: optionalCountryCode,
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

    improveProjectBullets: aiCreditProtectedProcedure
      .input(z.object({
        projectName: aiRequiredText(),
        stack: z.array(aiText()).max(200),
        currentBullets: z.array(aiText()).max(200),
        jobDescription: aiRequiredText(),
        targetRole: aiText().optional(),
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

    /**
     * PHASE 10 — AI Cover Letter Generator.
     *
     * Personalized, factual cover letter grounded in an EXISTING resume and a
     * target Job Description. Deterministic match/keyword context reuses the
     * Phase 8 matcher (zero extra AI calls); a single structured AI call writes
     * the letter. Every paragraph is validated against the resume, the JD and
     * the user's additional context before it is accepted — paragraphs that
     * introduce unsupported factual claims are dropped, never invented.
     *
     * Credit lifecycle mirrors optimizeResume / matchResumeToJob: a build is
     * created and one credit consumed, then released (net-zero) if the AI leg
     * throws or the letter cannot be validated.
     */
    generateCoverLetter: aiCreditProtectedProcedure
      .input(z.object({
        resumeId: z.string().max(64).optional(),
        resumeContent: aiText().optional(), // raw ParsedResume JSON string
        jobDescription: z.string().trim().min(1).max(JD_MAX_TEXT),
        targetCountryCode: optionalCountryCode,
        companyName: z.string().trim().max(300).optional(),
        hiringManagerName: z.string().trim().max(300).optional(),
        tone: z.enum(COVER_LETTER_TONES).optional(),
        length: z.enum(COVER_LETTER_LENGTHS).optional(),
        // Untrusted user context; treated as data, never as instructions.
        additionalContext: z.string().max(5000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let contentObj: any = null;
        if (input.resumeId) {
          const res = await db.getResume(input.resumeId);
          // An unowned resume id is an ownership failure, never a fallback to
          // client content (mirrors optimizeResume / analyzeResume / matcher).
          if (!res || res.userId !== ctx.user!.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found or access denied" });
          }
          try {
            contentObj = JSON.parse(res.content);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Stored resume content is not valid JSON." });
          }
        }
        if (!contentObj && input.resumeContent) {
          try {
            contentObj = JSON.parse(input.resumeContent);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is not valid JSON." });
          }
        }
        if (!contentObj || typeof contentObj !== "object" || Array.isArray(contentObj)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is required to generate a cover letter." });
        }
        if (!resumeHasRealContent(contentObj)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This resume appears empty — add content before generating a cover letter.",
          });
        }

        const targetRole = (contentObj?.header?.jobTitle || "").trim() || undefined;
        const targetCountryCode =
          input.targetCountryCode ?? contentObj?.header?.targetCountryCode ?? undefined;

        const build = await createBuild({
          userId: ctx.user!.id,
          role: targetRole,
          region: targetCountryCode,
        });
        const consumed = await consumeBuildCredit(ctx.user!.id, build.id);
        if (!consumed.ok) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        const opts = await resolveTrackedAiOpts(ctx);
        try {
          const result = await generateCoverLetter(
            contentObj,
            {
              targetCountryCode: input.targetCountryCode,
              companyName: input.companyName,
              hiringManagerName: input.hiringManagerName,
              tone: input.tone,
              length: input.length,
              additionalContext: input.additionalContext,
              jobDescription: input.jobDescription,
            },
            // onCreditConsume/onCreditRelease already handled by the router's
            // build+credit lifecycle above, so the generator's own callback
            // hooks are intentionally left unset to avoid double-billing.
            opts
          );
          await updateBuildStage(build.id, "done");
          return { result, buildId: build.id };
        } catch (error: any) {
          // AI failure → release the consumed credit (net zero for the user).
          await releaseBuildCredit(ctx.user!.id, build.id);
          await updateBuildStage(build.id, "failed", {
            errorMessage: error?.message || "Cover letter generation failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We hit a snag generating the cover letter — no credit used. " +
              (error?.message || "Please try again."),
          });
        }
      }),

    generateLinkedInAbout: aiCreditProtectedProcedure
      .input(z.object({
        summary: aiText(),
        jobTitle: aiRequiredText(),
        skills: aiText(),
        experienceHighlights: aiText(),
      }))
      .mutation(async ({ input }) => {
        return generateLinkedInAbout(input);
      }),

    calculateScore: aiCreditProtectedProcedure
      .input(z.object({
        resumeContent: aiRequiredText(),
        jobDescription: aiRequiredText(),
      }))
      .mutation(async ({ input }) => {
        const resumeObj = JSON.parse(input.resumeContent);
        return calculateKeywordAlignment(resumeObj, input.jobDescription);
      }),

    atsAudit: aiCreditProtectedProcedure
      .input(z.object({
        resumeText: aiRequiredText(),
        jobDescription: aiRequiredText(),
      }))
      .mutation(async ({ input }) => {
        return atsAudit(input.resumeText, input.jobDescription);
      }),

    // Phase 6 — AI Resume Analyzer. A paid, metered AI operation: auth +
    // credit-gated, consumes one build credit on success and releases it when
    // the AI call fails (no permanent charge for a failed analysis). The user
    // can only analyze their own resume; a named resumeId never falls back to
    // client-supplied content for an unowned id.
    analyzeResume: aiCreditProtectedProcedure
      .input(z.object({
        resumeId: z.string().max(64).optional(),
        resumeContent: aiText().optional(), // raw ParsedResume JSON string
        targetRole: z.string().trim().max(300).optional(),
        targetCountryCode: optionalCountryCode,
      }))
      .mutation(async ({ input, ctx }) => {
        let contentObj: any = null;
        if (input.resumeId) {
          const res = await db.getResume(input.resumeId);
          // An unowned resume id is an ownership failure, never a fallback
          // trigger to client content (mirrors generateSuggestions).
          if (!res || res.userId !== ctx.user!.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found or access denied" });
          }
          try {
            contentObj = JSON.parse(res.content);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Stored resume content is not valid JSON." });
          }
        }
        if (!contentObj && input.resumeContent) {
          try {
            contentObj = JSON.parse(input.resumeContent);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is not valid JSON." });
          }
        }
        if (!contentObj || typeof contentObj !== "object" || Array.isArray(contentObj)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is required to analyze." });
        }
        if (!resumeHasRealContent(contentObj)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This resume appears empty — add at least a name or some experience before analyzing.",
          });
        }

        const targetRole = (input.targetRole || "").trim() || undefined;
        // Country codes come from the validated input, or from the owned
        // resume's header. Codes are canonical ISO alpha-2 (validated above);
        // a client-provided country NAME is never trusted.
        const targetCountryCode =
          input.targetCountryCode ?? contentObj?.header?.targetCountryCode ?? undefined;
        const sourceCountryCode = contentObj?.header?.countryCode ?? undefined;

        const build = await createBuild({
          userId: ctx.user!.id,
          role: targetRole,
          region: targetCountryCode,
        });
        const consumed = await consumeBuildCredit(ctx.user!.id, build.id);
        if (!consumed.ok) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        const opts = await resolveTrackedAiOpts(ctx);
        try {
          const analysis = await analyzeResume(
            contentObj,
            { targetRole, targetCountryCode, sourceCountryCode },
            opts
          );
          await updateBuildStage(build.id, "done");
          return { analysis, buildId: build.id };
        } catch (error: any) {
          // AI failure → release the consumed credit (net zero for the user).
          await releaseBuildCredit(ctx.user!.id, build.id);
          await updateBuildStage(build.id, "failed", {
            errorMessage: error?.message || "Analysis failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We hit a snag analyzing your resume — no credit used. " +
              (error?.message || "Please try again."),
          });
        }
      }),

    /**
     * PHASE 7 — Job Description Analyzer.
     * auth + credit-gated; consumes one build credit on success and releases it
     * on AI failure. The JD is untrusted user content; validation is server-side.
     */
    analyzeJobDescription: aiCreditProtectedProcedure
      .input(z.object({
        jobDescription: z.string().trim().min(1).max(JD_MAX_TEXT),
        targetCountryCode: optionalCountryCode,
        sourceCountryCode: optionalCountryCode,
        providedJobTitle: z.string().trim().max(200).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const build = await createBuild({
          userId: ctx.user!.id,
          role: input.providedJobTitle || undefined,
          region: input.targetCountryCode || undefined,
        });
        const consumed = await consumeBuildCredit(ctx.user!.id, build.id);
        if (!consumed.ok) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        const opts = await resolveTrackedAiOpts(ctx);
        try {
          const analysis = await analyzeJobDescription(
            input.jobDescription,
            {
              targetCountryCode: input.targetCountryCode,
              sourceCountryCode: input.sourceCountryCode,
              providedJobTitle: input.providedJobTitle,
            },
            opts
          );
          await updateBuildStage(build.id, "done");
          return { analysis, buildId: build.id };
        } catch (error: any) {
          // AI failure → release the consumed credit (net zero for the user).
          await releaseBuildCredit(ctx.user!.id, build.id);
          await updateBuildStage(build.id, "failed", {
            errorMessage: error?.message || "JD analysis failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We hit a snag analyzing the job description — no credit used. " +
              (error?.message || "Please try again."),
          });
        }
      }),

    /**
     * PHASE 8 — Resume ↔ Job Description Matcher.
     * auth + credit-gated; consumes one build credit on success and releases it
     * on AI failure (no permanent charge for a failed match). The resume is
     * loaded by id from the DB (ownership enforced) or supplied as raw content;
     * the JD is untrusted user content validated server-side.
     */
    matchResumeToJob: aiCreditProtectedProcedure
      .input(z.object({
        resumeId: z.string().max(64).optional(),
        resumeContent: aiText().optional(), // raw ParsedResume JSON string
        jobDescription: z.string().trim().min(1).max(JD_MAX_TEXT),
        targetCountryCode: optionalCountryCode,
        providedJobTitle: z.string().trim().max(200).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let contentObj: any = null;
        if (input.resumeId) {
          const res = await db.getResume(input.resumeId);
          // An unowned resume id is an ownership failure, never a fallback to
          // client content (mirrors generateSuggestions / analyzeResume).
          if (!res || res.userId !== ctx.user!.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found or access denied" });
          }
          try {
            contentObj = JSON.parse(res.content);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Stored resume content is not valid JSON." });
          }
        }
        if (!contentObj && input.resumeContent) {
          try {
            contentObj = JSON.parse(input.resumeContent);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is not valid JSON." });
          }
        }
        if (!contentObj || typeof contentObj !== "object" || Array.isArray(contentObj)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is required to run the matcher." });
        }
        if (!resumeHasRealContent(contentObj)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This resume appears empty — add content before running the matcher.",
          });
        }

        const build = await createBuild({
          userId: ctx.user!.id,
          role: input.providedJobTitle || undefined,
          region: input.targetCountryCode || undefined,
        });
        const consumed = await consumeBuildCredit(ctx.user!.id, build.id);
        if (!consumed.ok) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        const opts = await resolveTrackedAiOpts(ctx);
        try {
          const match = await matchResumeToJob(
            contentObj,
            input.jobDescription,
            {
              targetCountryCode: input.targetCountryCode,
              providedJobTitle: input.providedJobTitle,
            },
            opts
          );
          await updateBuildStage(build.id, "done");
          return { match, buildId: build.id };
        } catch (error: any) {
          // AI failure → release the consumed credit (net zero for the user).
          await releaseBuildCredit(ctx.user!.id, build.id);
          await updateBuildStage(build.id, "failed", {
            errorMessage: error?.message || "Resume match failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We hit a snag matching the resume — no credit used. " +
              (error?.message || "Please try again."),
          });
        }
      }),

    generateInterviewQuestions: aiCreditProtectedProcedure
      .input(z.object({
        resumeText: aiRequiredText(),
        jobDescription: aiRequiredText(),
      }))
      .mutation(async ({ input }) => {
        return generateInterviewQuestions(input.resumeText, input.jobDescription);
      }),

    /**
     * PHASE 9 — AI Resume Optimizer.
     *
     * Deterministic score + section findings + requirement gaps + ATS keyword
     * opportunities are ALWAYS returned (zero AI cost). A single structured AI
     * call adds qualitative guidance and safe-to-apply rewrites; failures
     * degrade to deterministic-only without consuming the user's credit.
     *
     * Credit lifecycle mirrors matchResumeToJob: a build is created and one
     * credit consumed, then released (net-zero) if the AI leg throws.
     */
    optimizeResume: aiCreditProtectedProcedure
      .input(z.object({
        resumeId: z.string().max(64).optional(),
        resumeContent: aiText().optional(), // raw ParsedResume JSON string
        jobDescription: z.string().trim().min(1).max(JD_MAX_TEXT),
        targetCountryCode: optionalCountryCode,
        providedJobTitle: z.string().trim().max(200).optional(),
        sections: z.array(z.enum(OPTIMIZER_SECTIONS)).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let contentObj: any = null;
        if (input.resumeId) {
          const res = await db.getResume(input.resumeId);
          // An unowned resume id is an ownership failure, never a fallback to
          // client content (mirrors generateSuggestions / analyzeResume / matcher).
          if (!res || res.userId !== ctx.user!.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found or access denied" });
          }
          try {
            contentObj = JSON.parse(res.content);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Stored resume content is not valid JSON." });
          }
        }
        if (!contentObj && input.resumeContent) {
          try {
            contentObj = JSON.parse(input.resumeContent);
          } catch {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is not valid JSON." });
          }
        }
        if (!contentObj || typeof contentObj !== "object" || Array.isArray(contentObj)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Resume content is required to run the optimizer." });
        }
        if (!resumeHasRealContent(contentObj)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This resume appears empty — add content before running the optimizer.",
          });
        }

        const targetRole = (input.providedJobTitle || "").trim() || undefined;
        const targetCountryCode =
          input.targetCountryCode ?? contentObj?.header?.targetCountryCode ?? undefined;

        const build = await createBuild({
          userId: ctx.user!.id,
          role: targetRole,
          region: targetCountryCode,
        });
        const consumed = await consumeBuildCredit(ctx.user!.id, build.id);
        if (!consumed.ok) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "No build credits left. Pay ₹99 for one resume build.",
          });
        }

        const opts = await resolveTrackedAiOpts(ctx);
        try {
          const result = await optimizeResume(
            contentObj,
            {
              targetCountryCode: input.targetCountryCode,
              providedJobTitle: input.providedJobTitle,
              sections: input.sections,
              jobDescription: input.jobDescription,
            },
            // onCreditConsume/onCreditRelease already handled by the router's
            // build+credit lifecycle above, so the optimizer's own callback
            // hooks are intentionally left unset to avoid double-billing.
            opts
          );
          await updateBuildStage(build.id, "done");
          return { result, buildId: build.id };
        } catch (error: any) {
          // AI failure → release the consumed credit (net zero for the user).
          await releaseBuildCredit(ctx.user!.id, build.id);
          await updateBuildStage(build.id, "failed", {
            errorMessage: error?.message || "Resume optimization failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We hit a snag optimizing the resume — no credit used. " +
              (error?.message || "Please try again."),
          });
        }
      }),

    generateRecruiterOutreach: aiCreditProtectedProcedure
      .input(z.object({
        topSkills: aiRequiredText(),
        mostRecentRole: aiRequiredText(),
        jobTitle: aiRequiredText(),
        companyName: aiRequiredText(),
        roleSummary: aiRequiredText(),
      }))
      .mutation(async ({ input }) => {
        return generateRecruiterOutreach(input);
      }),

    /** C5 — thumbs up/down on AI rewrite quality */
    submitEvaluation: aiProtectedProcedure
      .input(z.object({
        resumeId: z.string().max(64).optional(),
        stage: z.string().trim().min(1).max(50).default("rewrite"),
        rating: z.enum(["up", "down"]),
        note: z.string().max(2000).optional(),
        overallScore: z.number().int().min(0).max(100).optional(),
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
        // V6: "build" = ₹99 one-time credit; pro/enterprise kept for legacy

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

