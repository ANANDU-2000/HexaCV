import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateResumeSuggestions, improveBulletPoints, calculateKeywordAlignment, improveSummary } from "./aiSuggestions";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { extractText, parseResumeWithLLM } from "./fileParser";
import Stripe from "stripe";

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

  // AI Integration Router
  ai: router({
    generateFullResume: publicProcedure
      .input(z.object({
        jobTitle: z.string(),
        experienceDetails: z.string(),
        experienceLevel: z.string().optional(),
        market: z.string().optional(),
        jobDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert resume writer. Generate a fully completed professional resume JSON structure matching the schema. Fill in all fields with plausible, highly tailored professional bullets based on the user's prompt. Return only the JSON object.",
              },
              {
                role: "user",
                content: `Job Title: ${input.jobTitle}
Experience Level: ${input.experienceLevel || "Not specified"}
Target Market: ${input.market || "Global"}
User Background/Highlights: ${input.experienceDetails || "Not specified"}
${input.jobDescription ? `Target Job Description: ${input.jobDescription}` : ""}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "parsed_resume",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    header: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" },
                        location: { type: "string" },
                        links: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              label: { type: "string" },
                              url: { type: "string" },
                            },
                            required: ["label", "url"],
                          },
                        },
                      },
                      required: ["name", "email", "phone", "location", "links"],
                    },
                    summary: { type: "string" },
                    skills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          skills: { type: "array", items: { type: "string" } },
                        },
                        required: ["category", "skills"],
                      },
                    },
                    experiences: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          company: { type: "string" },
                          role: { type: "string" },
                          startDate: { type: "string" },
                          endDate: { type: "string" },
                          current: { type: "boolean" },
                          description: { type: "array", items: { type: "string" } },
                        },
                        required: ["id", "company", "role", "startDate", "endDate", "current", "description"],
                      },
                    },
                    projects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          description: { type: "string" },
                          technologies: { type: "array", items: { type: "string" } },
                          link: { type: "string" },
                          date: { type: "string" },
                        },
                        required: ["id", "name", "description", "technologies", "link", "date"],
                      },
                    },
                    educations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          institution: { type: "string" },
                          degree: { type: "string" },
                          field: { type: "string" },
                          graduationDate: { type: "string" },
                          gpa: { type: "string" },
                        },
                        required: ["id", "institution", "degree", "field", "graduationDate", "gpa"],
                      },
                    },
                    certifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          issuer: { type: "string" },
                          date: { type: "string" },
                          link: { type: "string" },
                        },
                        required: ["id", "name", "issuer", "date", "link"],
                      },
                    },
                    languages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          language: { type: "string" },
                          proficiency: { type: "string" },
                        },
                        required: ["language", "proficiency"],
                      },
                    },
                    achievements: { type: "array", items: { type: "string" } },
                    publications: { type: "array", items: { type: "string" } },
                    references: { type: "array", items: { type: "string" } },
                  },
                  required: [
                    "header",
                    "summary",
                    "skills",
                    "experiences",
                    "projects",
                    "educations",
                    "certifications",
                    "languages",
                    "achievements",
                    "publications",
                    "references"
                  ],
                },
              },
            },
          });

          const content = response.choices[0]?.message.content;
          if (!content || typeof content !== "string") throw new Error("Failed to generate content from AI");
          return JSON.parse(content);
        } catch (error) {
          console.error("AI Generation error:", error);
          // Return a structured mockup matching the schema in case LLM is unconfigured
          return {
            header: {
              name: "Professional Candidate",
              email: "candidate@hexastacksolutions.com",
              phone: "+1 (555) 019-2834",
              location: "San Francisco, CA",
              links: [
                { label: "LinkedIn", url: "https://linkedin.com/in/candidate" },
                { label: "GitHub", url: "https://github.com/candidate" }
              ]
            },
            summary: `Results-driven and highly motivated professional specializing in ${input.jobTitle}. Proven track record of designing scalable applications and driving project success.`,
            skills: [
              { category: "Core Technologies", skills: ["JavaScript", "TypeScript", "React", "Node.js"] },
              { category: "Methods", skills: ["Agile", "Scrum", "CI/CD", "TDD"] }
            ],
            experiences: [
              {
                id: "exp-1",
                company: "Tech Solutions Corp",
                role: input.jobTitle,
                startDate: "2023-01",
                endDate: "Present",
                current: true,
                description: [
                  "Led the architecture and development of core software solutions.",
                  "Collaborated with product designers to create mobile-responsive interfaces.",
                  "Improved system performance and database queries, resulting in 30% faster load times."
                ]
              }
            ],
            projects: [
              {
                id: "proj-1",
                name: "HexaCv Platform",
                description: "An AI-powered ATS resume builder application.",
                technologies: ["React", "TypeScript", "Tailwind CSS"],
                link: "https://github.com/hexastack/hexacv",
                date: "2026-05"
              }
            ],
            educations: [
              {
                id: "edu-1",
                institution: "State University of Technology",
                degree: "Bachelor of Science",
                field: "Computer Science",
                graduationDate: "2022-05",
                gpa: "3.8"
              }
            ],
            certifications: [
              {
                id: "cert-1",
                name: "AWS Certified Solutions Architect",
                issuer: "Amazon Web Services",
                date: "2024-08",
                link: ""
              }
            ],
            languages: [
              { language: "English", proficiency: "Professional Native" }
            ],
            achievements: ["Delivered 10+ major products on schedule", "Awarded Employee of the Quarter, Q3 2025"],
            publications: ["Optimizing Frontend Performance in React (Tech Journal 2025)"],
            references: ["Available upon request"]
          };
        }
      }),

    generateSuggestions: publicProcedure
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

    improveBullets: publicProcedure
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
      .mutation(async ({ input }) => {
        return improveBulletPoints(
          input.role,
          input.company,
          input.currentBullets,
          input.jobDescription,
          input.countryCode,
          input.targetCountryCode,
          input.jobTitle,
          input.targetRole
        );
      }),

    improveSummary: publicProcedure
      .input(z.object({
        currentSummary: z.string(),
        jobDescription: z.string(),
        jobTitle: z.string().optional(),
        targetRole: z.string().optional(),
        countryCode: z.string().optional(),
        targetCountryCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return improveSummary(
          input.currentSummary,
          input.jobDescription,
          input.jobTitle,
          input.countryCode,
          input.targetCountryCode,
          input.targetRole
        );
      }),

    calculateScore: publicProcedure
      .input(z.object({
        resumeContent: z.string(),
        jobDescription: z.string(),
      }))
      .mutation(async ({ input }) => {
        const resumeObj = JSON.parse(input.resumeContent);
        return calculateKeywordAlignment(resumeObj, input.jobDescription);
      }),
  }),

  // SaaS: Organization Router
  organization: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrganizations(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), slug: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        const org = await db.createOrganization({
          id,
          name: input.name,
          slug: input.slug,
          primaryColor: "#1e40af",
          secondaryColor: "#0d9488",
          logoUrl: "https://www.hexastacksolutions.com/logo.png",
          customDomain: `${input.slug}.hexacv.com`
        });
        await db.addOrganizationMember({
          id: nanoid(),
          organizationId: id,
          userId: ctx.user.id,
          role: "owner"
        });
        return org;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        customDomain: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const members = await db.getOrganizationMembers(input.id);
        const caller = members.find(m => m.userId === ctx.user.id);
        if (!caller || (caller.role !== 'owner' && caller.role !== 'admin')) {
          throw new Error("Unauthorized to update organization");
        }
        return db.updateOrganization(input.id, input);
      }),
    members: protectedProcedure
      .input(z.object({ orgId: z.string() }))
      .query(async ({ input, ctx }) => {
        const members = await db.getOrganizationMembers(input.orgId);
        const isMember = members.some(m => m.userId === ctx.user.id);
        if (!isMember) {
          throw new Error("Unauthorized to view members");
        }
        return members;
      }),
    invite: protectedProcedure
      .input(z.object({ orgId: z.string(), email: z.string(), role: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const members = await db.getOrganizationMembers(input.orgId);
        const caller = members.find(m => m.userId === ctx.user.id);
        if (!caller || (caller.role !== 'owner' && caller.role !== 'admin')) {
          throw new Error("Unauthorized to invite members");
        }
        const invitee = db.mockDb.users.find(u => u.email === input.email);
        if (!invitee) {
          throw new Error("No HexaCv user found with that email yet. Have them sign in once first!");
        }
        return db.addOrganizationMember({
          id: nanoid(),
          organizationId: input.orgId,
          userId: invitee.id,
          role: input.role
        });
      }),
    removeMember: protectedProcedure
      .input(z.object({ orgId: z.string(), memberId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const members = await db.getOrganizationMembers(input.orgId);
        const caller = members.find(m => m.userId === ctx.user.id);
        if (!caller || (caller.role !== 'owner' && caller.role !== 'admin')) {
          throw new Error("Unauthorized to remove members");
        }
        return db.removeOrganizationMember(input.orgId, input.memberId);
      })
  }),

  // SaaS: Marketplace Router
  marketplace: router({
    list: publicProcedure
      .input(z.object({ type: z.string().optional() }))
      .query(async ({ input }) => {
        return db.listMarketplaceItems(input.type);
      }),
    publish: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        type: z.string(),
        content: z.string(),
        price: z.number(),
        isPremium: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createMarketplaceItem({
          id: nanoid(),
          authorId: ctx.user.id,
          title: input.title,
          description: input.description,
          type: input.type,
          content: input.content,
          price: input.price,
          isPremium: input.isPremium
        });
      }),
    download: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return db.incrementDownloads(input.id);
      }),
    rate: protectedProcedure
      .input(z.object({ id: z.string(), rating: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.rateMarketplaceItem(input.id, input.rating);
      })
  }),

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

  // SaaS: Recruiter Router
  recruiter: router({
    createJob: protectedProcedure
      .input(z.object({
        orgId: z.string(),
        title: z.string(),
        description: z.string(),
        requirements: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const members = await db.getOrganizationMembers(input.orgId);
        const caller = members.find(m => m.userId === ctx.user.id);
        if (!caller || (caller.role !== 'owner' && caller.role !== 'recruiter' && caller.role !== 'admin')) {
          throw new Error("Unauthorized to create job for this organization");
        }
        return db.createRecruiterJob({
          id: nanoid(),
          organizationId: input.orgId,
          title: input.title,
          description: input.description,
          requirements: input.requirements
        });
      }),
    listJobs: publicProcedure
      .input(z.object({ orgId: z.string().optional() }))
      .query(async ({ input }) => {
        return db.listRecruiterJobs(input.orgId);
      }),
    listApplications: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input, ctx }) => {
        const job = await db.getRecruiterJob(input.jobId);
        if (!job) throw new Error("Recruiter job vacancy not found");
        const members = await db.getOrganizationMembers(job.organizationId);
        const caller = members.find(m => m.userId === ctx.user.id);
        if (!caller || (caller.role !== 'owner' && caller.role !== 'recruiter' && caller.role !== 'admin')) {
          throw new Error("Unauthorized to view applications for this vacancy");
        }
        return db.listJobApplications(input.jobId);
      }),
    submitApplication: publicProcedure
      .input(z.object({
        jobId: z.string(),
        applicantName: z.string(),
        applicantEmail: z.string(),
        resumeContent: z.string()
      }))
      .mutation(async ({ input }) => {
        const job = await db.getRecruiterJob(input.jobId);
        if (!job) throw new Error("Recruiter job listing not found");
        
        let parsedResume: any;
        try {
          parsedResume = JSON.parse(input.resumeContent);
        } catch {
          // fallback mock resume structure if plain text is submitted
          parsedResume = {
            sections: [
              { type: "skills", content: { skills: [{ category: "Skills", skills: input.resumeContent.split(/\s*,\s*/) }] } },
              { type: "experience", content: { experiences: [{ role: "Candidate", company: "General", description: [input.resumeContent] }] } }
            ]
          };
        }

        const scoreObj = await calculateKeywordAlignment(parsedResume, job.requirements);
        return db.createJobApplication({
          id: nanoid(),
          jobId: input.jobId,
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          matchScore: scoreObj.score,
          resumeContent: input.resumeContent,
          status: "pending"
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const app = await db.getJobApplication(input.id);
        if (!app) throw new Error("Application not found");
        const job = await db.getRecruiterJob(app.jobId);
        if (!job) throw new Error("Recruiter job vacancy not found");
        const members = await db.getOrganizationMembers(job.organizationId);
        const caller = members.find(m => m.userId === ctx.user.id);
        if (!caller || (caller.role !== 'owner' && caller.role !== 'recruiter' && caller.role !== 'admin')) {
          throw new Error("Unauthorized to modify application status");
        }
        return db.updateApplicationStatus(input.id, input.status);
      })
  }),

  // SaaS: Billing & Support Router
  billing: router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return db.getSubscription(ctx.user.id);
    }),
    
    createCheckoutSession: protectedProcedure
      .input(z.object({ tier: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (process.env.STRIPE_SECRET_KEY) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
            const origin = ctx.req.headers.origin || "http://localhost:3000";
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              line_items: [{
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: `HexaCv ${input.tier.toUpperCase()} Plan`,
                    description: `Access to HexaCv ${input.tier} features`,
                  },
                  unit_amount: input.tier === "pro" ? 1900 : input.tier === "enterprise" ? 9900 : 0,
                  recurring: { interval: "month" },
                },
                quantity: 1,
              }],
              mode: "subscription",
              success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
              cancel_url: `${origin}/dashboard/billing?status=cancel`,
              metadata: {
                userId: ctx.user.id.toString(),
                tier: input.tier,
              }
            });
            return { url: session.url };
          } catch (e: any) {
            console.error("Stripe session creation error:", e);
            throw new Error(`Stripe session creation failed: ${e.message}`);
          }
        } else {
          // Fall back to simulated checkout simulation page
          return { url: `/dashboard/billing/checkout?tier=${input.tier}` };
        }
      }),

    upgradePlan: protectedProcedure
      .input(z.object({ tier: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const sub = await db.updateSubscription(ctx.user.id, input.tier);
        // reward affiliate if they converted
        if (ctx.user.email) {
          const price = input.tier === "enterprise" ? 9900 : input.tier === "pro" ? 1900 : 0;
          await db.rewardReferralConversion(ctx.user.email, ctx.user.id, price);
        }
        return sub;
      })
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
      })
  }),
});

export type AppRouter = typeof appRouter;

