/**
 * C1/C2 — thin Extract → Target → Rewrite orchestrator + editor helpers.
 * No Polish, evaluator, or prompt_versions.
 */
import {
  evaluateRewriteDeterministic,
  filterGroundedBullets,
  filterGroundedRewrite,
  isAiGeneratedPhrase,
  resumeHasRealContent,
  validateGeneratedResume,
} from "../contentValidation";
import * as db from "../db";
import {
  trackedInvokeLLM,
  type TrackedInvokeOptions,
} from "../usageTracker";
import type {
  PipelineExtractFacts,
  PipelineTargetProfile,
  ResumePipelineInput,
} from "@shared/types";
import { AI_GROUNDING_RULES, STRICT_REWRITE_RULES } from "./grounding";

const GROUNDING_RULES = AI_GROUNDING_RULES;
const RESUME_JSON_SCHEMA = {
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
          required: [
            "id",
            "company",
            "role",
            "startDate",
            "endDate",
            "current",
            "description",
          ],
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
          required: [
            "id",
            "name",
            "description",
            "technologies",
            "link",
            "date",
          ],
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
          required: [
            "id",
            "institution",
            "degree",
            "field",
            "graduationDate",
            "gpa",
          ],
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
      "references",
    ],
  },
} as const;

function parseJsonContent(content: unknown, label: string): unknown {
  if (!content || typeof content !== "string") {
    throw new Error(`Failed to get ${label} content from AI`);
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Failed to parse ${label} JSON from AI`);
  }
}

function emptyExtract(): PipelineExtractFacts {
  return {
    name: "",
    email: "",
    phone: "",
    location: "",
    roles: [],
    skills: [],
    education: [],
    otherFacts: [],
  };
}

function normalizeExtract(raw: any): PipelineExtractFacts {
  const base = emptyExtract();
  if (!raw || typeof raw !== "object") return base;
  return {
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    location: typeof raw.location === "string" ? raw.location : "",
    roles: Array.isArray(raw.roles)
      ? raw.roles.map((r: any) => ({
          company: String(r?.company || ""),
          title: String(r?.title || ""),
          startDate: String(r?.startDate || ""),
          endDate: String(r?.endDate || ""),
          bullets: Array.isArray(r?.bullets)
            ? r.bullets.map((b: unknown) => String(b || "")).filter(Boolean)
            : [],
        }))
      : [],
    skills: Array.isArray(raw.skills)
      ? raw.skills.map((s: unknown) => String(s || "")).filter(Boolean)
      : [],
    education: Array.isArray(raw.education)
      ? raw.education.map((e: any) => ({
          institution: String(e?.institution || ""),
          degree: String(e?.degree || ""),
          field: String(e?.field || ""),
          graduationDate: String(e?.graduationDate || ""),
        }))
      : [],
    otherFacts: Array.isArray(raw.otherFacts)
      ? raw.otherFacts.map((f: unknown) => String(f || "")).filter(Boolean)
      : [],
  };
}

function normalizeTarget(raw: any): PipelineTargetProfile {
  return {
    keywords: Array.isArray(raw?.keywords)
      ? raw.keywords.map((k: unknown) => String(k || "")).filter(Boolean)
      : [],
    mustHaves: Array.isArray(raw?.mustHaves)
      ? raw.mustHaves.map((k: unknown) => String(k || "")).filter(Boolean)
      : [],
    countryAtsNotes: Array.isArray(raw?.countryAtsNotes)
      ? raw.countryAtsNotes.map((k: unknown) => String(k || "")).filter(Boolean)
      : [],
  };
}

/** Stage 1 — facts only from source text. */
export async function stageExtract(
  sourceText: string,
  opts?: TrackedInvokeOptions
): Promise<PipelineExtractFacts> {
  const response = await trackedInvokeLLM(
    "extract",
    {
      messages: [
        {
          role: "system",
          content:
            GROUNDING_RULES +
            "Extract ONLY grounded facts from the user's background text into JSON. " +
            "Do not write a polished resume yet. Empty fields beat invented ones.",
        },
        {
          role: "user",
          content: sourceText || "Not specified",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pipeline_extract",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              location: { type: "string" },
              roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    company: { type: "string" },
                    title: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    bullets: { type: "array", items: { type: "string" } },
                  },
                  required: [
                    "company",
                    "title",
                    "startDate",
                    "endDate",
                    "bullets",
                  ],
                },
              },
              skills: { type: "array", items: { type: "string" } },
              education: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    institution: { type: "string" },
                    degree: { type: "string" },
                    field: { type: "string" },
                    graduationDate: { type: "string" },
                  },
                  required: [
                    "institution",
                    "degree",
                    "field",
                    "graduationDate",
                  ],
                },
              },
              otherFacts: { type: "array", items: { type: "string" } },
            },
            required: [
              "name",
              "email",
              "phone",
              "location",
              "roles",
              "skills",
              "education",
              "otherFacts",
            ],
          },
        },
      },
      temperature: 0.2,
    },
    opts
  );

  return normalizeExtract(
    parseJsonContent(response.choices[0]?.message.content, "extract")
  );
}

/** Stage 2 — JD / market targeting profile. */
export async function stageTarget(
  input: Pick<
    ResumePipelineInput,
    "jobTitle" | "jobDescription" | "market" | "experienceLevel"
  >,
  opts?: TrackedInvokeOptions
): Promise<PipelineTargetProfile> {
  const response = await trackedInvokeLLM(
    "target",
    {
      messages: [
        {
          role: "system",
          content:
            "Extract targeting signals for resume rewriting. Return JSON only. " +
            "keywords = important skills/terms from the JD or title. " +
            "mustHaves = hard requirements stated in the JD. " +
            "countryAtsNotes = short ATS/format notes for the target market (no outcome guarantees). " +
            "If JD is missing, derive light keywords from the job title only; leave mustHaves empty.",
        },
        {
          role: "user",
          content: `Job Title: ${input.jobTitle}
Experience Level: ${input.experienceLevel || "Not specified"}
Target Market: ${input.market || "Global"}
Job Description: ${input.jobDescription || "Not provided"}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pipeline_target",
          strict: true,
          schema: {
            type: "object",
            properties: {
              keywords: { type: "array", items: { type: "string" } },
              mustHaves: { type: "array", items: { type: "string" } },
              countryAtsNotes: { type: "array", items: { type: "string" } },
            },
            required: ["keywords", "mustHaves", "countryAtsNotes"],
          },
        },
      },
      temperature: 0.2,
    },
    opts
  );

  return normalizeTarget(
    parseJsonContent(response.choices[0]?.message.content, "target")
  );
}

/** Stage 3 — structured resume rewrite from extract + target. */
export async function stageRewrite(
  input: ResumePipelineInput,
  extract: PipelineExtractFacts,
  target: PipelineTargetProfile,
  opts?: TrackedInvokeOptions,
  feedback?: string[]
): Promise<unknown> {
  const feedbackBlock =
    feedback && feedback.length > 0
      ? `\nFix specifically (evaluator feedback — address each item):\n${feedback.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n`
      : "";

  const { getActivePrompt } = await import("../promptVersions");
  const activePrompt = await getActivePrompt("rewrite");
  const systemContent =
    activePrompt?.body ||
    GROUNDING_RULES +
      "Generate a professional resume JSON matching the schema. " +
      "Use ONLY facts from the Extract JSON. Use Target keywords to prioritize wording — never invent skills. " +
      "Return only the JSON object.";

  const response = await trackedInvokeLLM(
    "rewrite",
    {
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: `Job Title: ${input.jobTitle}
Experience Level: ${input.experienceLevel || "Not specified"}
Target Market: ${input.market || "Global"}
Extract (facts only): ${JSON.stringify(extract)}
Target profile: ${JSON.stringify(target)}
Original source (for grounding): ${input.sourceText || "Not specified"}
${input.jobDescription ? `Job Description: ${input.jobDescription}` : ""}${feedbackBlock}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: RESUME_JSON_SCHEMA as any,
      },
      temperature: 0.6,
    },
    opts
  );

  return parseJsonContent(response.choices[0]?.message.content, "rewrite");
}

export type PipelineStageName =
  | "extract"
  | "target"
  | "rewrite"
  | "validate"
  | "polish";

/**
 * Run Extract → Target → Rewrite → validate → C3 evaluate (1 rewrite retry on fail).
 * Optional onStage reports progress for the V6 pipeline loader.
 */
export async function runResumePipeline(
  input: ResumePipelineInput,
  opts?: TrackedInvokeOptions,
  onStage?: (stage: PipelineStageName) => void | Promise<void>
): Promise<any> {
  const report = async (stage: PipelineStageName) => {
    try {
      await onStage?.(stage);
    } catch {
      /* progress reporting must never break the pipeline */
    }
  };

  await report("extract");
  const extract = await stageExtract(input.sourceText, opts);
  await report("target");
  const target = await stageTarget(input, opts);

  await report("rewrite");
  let rewritten = await stageRewrite(input, extract, target, opts);
  await report("validate");
  let validated = validateGeneratedResume(rewritten);
  // Evaluate raw + post-validate: banned on raw; content on cleaned
  let evaluation = evaluateRewriteDeterministic(rewritten, input.sourceText);
  if (!resumeHasRealContent(validated)) {
    evaluation = {
      ...evaluation,
      hasRealContent: false,
      passed: false,
      reasons: [
        ...evaluation.reasons.filter(
          (r) => !r.includes("no usable grounded content")
        ),
        "Resume has no usable grounded content after validation",
      ],
      overall: Math.min(evaluation.overall, 40),
    };
  } else if (evaluation.bannedHits.length === 0) {
    // Prefer cleaned resume for grounding when bans already stripped
    evaluation = evaluateRewriteDeterministic(validated, input.sourceText);
  }

  let retries = 0;
  if (!evaluation.passed) {
    console.info("[pipeline] C3 evaluate fail — retrying rewrite once", {
      overall: evaluation.overall,
      reasons: evaluation.reasons,
    });
    await report("rewrite");
    rewritten = await stageRewrite(
      input,
      extract,
      target,
      opts,
      evaluation.reasons
    );
    await report("validate");
    validated = validateGeneratedResume(rewritten);
    evaluation = evaluateRewriteDeterministic(rewritten, input.sourceText);
    if (!resumeHasRealContent(validated)) {
      evaluation = {
        ...evaluation,
        hasRealContent: false,
        passed: false,
        reasons: [
          ...evaluation.reasons,
          "Resume has no usable grounded content after validation",
        ],
        overall: Math.min(evaluation.overall, 40),
      };
    } else if (evaluation.bannedHits.length === 0) {
      evaluation = evaluateRewriteDeterministic(validated, input.sourceText);
    }
    retries = 1;
  }

  console.info("[pipeline] C3 evaluate", {
    passed: evaluation.passed,
    overall: evaluation.overall,
    groundingScore: evaluation.groundingScore,
    retries,
    reasons: evaluation.reasons,
  });

  if (!evaluation.passed) {
    throw new Error(
      `Resume rewrite failed quality checks after retry: ${
        evaluation.reasons.join("; ") || `score ${evaluation.overall}`
      }`
    );
  }

  if (!resumeHasRealContent(validated)) {
    throw new Error(
      "AI generation produced no valid content from your background details. " +
        "Please provide more specific information about your experience, skills, and background."
    );
  }

  await report("polish");
  // Attach evaluation flags for Review amber markers (client may ignore)
  return {
    ...validated,
    _pipelineMeta: {
      evaluation,
      targetKeywords: (target as any)?.keywords || [],
      region: input.market || null,
      role: input.jobTitle || null,
    },
  };
}

async function loadRegionalAtsInstructions(
  countryCode?: string,
  targetCountryCode?: string
): Promise<string> {
  if (!targetCountryCode) return "";
  try {
    const rules = await db.getCountryAtsRules(
      countryCode || "IN",
      targetCountryCode
    );
    if (!rules) return "";
    return `
REGIONAL OPTIMIZATION INSTRUCTIONS (${countryCode || "IN"} -> ${targetCountryCode}):
- Target country formatting style details: ${rules.preferredFormatting}
- Target country keywords: ${Array.isArray(rules.keywords) ? rules.keywords.join(", ") : rules.keywords}
- Regional Terminology conversions (prefer target terms): ${JSON.stringify(rules.regionalTerminology)}
`;
  } catch (e) {
    console.warn("Failed to load regional ATS rules:", e);
    return "";
  }
}

export type RewriteBulletsPipelineArgs = {
  role: string;
  company: string;
  currentBullets: string[];
  jobDescription: string;
  countryCode?: string;
  targetCountryCode?: string;
  jobTitle?: string;
  targetRole?: string;
};

/** C2: stageTarget → rewrite → grounded bullets. */
export async function rewriteBulletsViaPipeline(
  args: RewriteBulletsPipelineArgs,
  opts?: TrackedInvokeOptions
): Promise<string[]> {
  const jobTitle = args.jobTitle || args.role || "Not specified";
  const target = await stageTarget(
    {
      jobTitle,
      jobDescription: args.jobDescription,
      experienceLevel: undefined,
      market: args.targetCountryCode || args.countryCode,
    },
    opts
  );
  const regionalInstructions = await loadRegionalAtsInstructions(
    args.countryCode,
    args.targetCountryCode
  );

  const response = await trackedInvokeLLM(
    "rewrite",
    {
      messages: [
        {
          role: "system",
          content:
            STRICT_REWRITE_RULES +
            "You are an expert resume writer. Rephrase bullet points to be clearer and better aligned with the target job — without adding new facts." +
            (regionalInstructions ? `\n${regionalInstructions}` : ""),
        },
        {
          role: "user",
          content: `Candidate Job Title: ${jobTitle}
Target Role: ${args.targetRole || jobTitle}
Role: ${args.role} at ${args.company}
Target profile: ${JSON.stringify(target)}
Current Bullet Points (${args.currentBullets.length} total — return exactly ${args.currentBullets.length} rephrased bullets):
${args.currentBullets.map((b) => `- ${b}`).join("\n")}

Target Job Description:
${args.jobDescription}

Rephrase each bullet to:
1. Use stronger action verbs while keeping the same facts
2. Incorporate relevant target keywords only where they match existing experience
3. Stay concise and impactful
4. NEVER add metrics, tools, or achievements not in the original bullets
5. Return exactly ${args.currentBullets.length} bullets in the same order

Return JSON: { "bullets": string[] }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "improved_bullets",
          strict: true,
          schema: {
            type: "object",
            properties: {
              bullets: {
                type: "array",
                items: { type: "string" },
                description: "Improved bullet points",
              },
            },
            required: ["bullets"],
          },
        },
      },
      temperature: 0.2,
    },
    opts
  );

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }
  const result = JSON.parse(content);
  const rawBullets: string[] = Array.isArray(result.bullets)
    ? result.bullets
    : [];
  return filterGroundedBullets(args.currentBullets, rawBullets);
}

export type RewriteSummaryPipelineArgs = {
  currentSummary: string;
  jobDescription: string;
  jobTitle?: string;
  countryCode?: string;
  targetCountryCode?: string;
  targetRole?: string;
};

/** C2: stageTarget → rewrite → grounded summary. */
export async function rewriteSummaryViaPipeline(
  args: RewriteSummaryPipelineArgs,
  opts?: TrackedInvokeOptions
): Promise<string> {
  if (!args.currentSummary.trim()) {
    return "";
  }

  const jobTitle = args.jobTitle || "Not specified";
  const target = await stageTarget(
    {
      jobTitle,
      jobDescription: args.jobDescription,
      market: args.targetCountryCode || args.countryCode,
    },
    opts
  );
  const regionalInstructions = await loadRegionalAtsInstructions(
    args.countryCode,
    args.targetCountryCode
  );

  const response = await trackedInvokeLLM(
    "rewrite",
    {
      messages: [
        {
          role: "system",
          content:
            STRICT_REWRITE_RULES +
            "You are an expert resume writer. Rewrite the professional summary to be compelling and aligned with the target job — using only facts from the current summary." +
            (regionalInstructions ? `\n${regionalInstructions}` : ""),
        },
        {
          role: "user",
          content: `Current Summary: ${args.currentSummary || "(Not provided)"}
Candidate Job Title: ${jobTitle}
Target Role: ${args.targetRole || jobTitle}
Target profile: ${JSON.stringify(target)}
Target Job Description:
${args.jobDescription}

Rewrite to:
1. Highlight skills/experience already stated
2. Incorporate target keywords only where they match existing experience
3. Align tone with target role/job title
4. Be concise (2-4 sentences, ~50-80 words)
5. Do NOT invent credentials, degrees, years of experience, or companies
6. Empty input → empty output, never fabricate

Return JSON: { "summary": string }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "improved_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "The rewritten professional summary",
              },
            },
            required: ["summary"],
          },
        },
      },
      temperature: 0.2,
    },
    opts
  );

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }
  const result = JSON.parse(content);
  const rewritten = (result.summary || "").trim();
  if (!rewritten || isAiGeneratedPhrase(rewritten)) {
    return args.currentSummary;
  }
  return filterGroundedRewrite(args.currentSummary, rewritten, 0.15);
}

export type RewriteProjectBulletsPipelineArgs = {
  projectName: string;
  stack: string[];
  currentBullets: string[];
  jobDescription: string;
  targetRole?: string;
};

/** C2: stageTarget → rewrite for project bullets. */
export async function rewriteProjectBulletsViaPipeline(
  args: RewriteProjectBulletsPipelineArgs,
  opts?: TrackedInvokeOptions
): Promise<string[]> {
  if (!args.currentBullets.length) return [];

  const jobTitle = args.targetRole || "Not specified";
  const target = await stageTarget(
    {
      jobTitle,
      jobDescription: args.jobDescription,
    },
    opts
  );

  const response = await trackedInvokeLLM(
    "rewrite",
    {
      messages: [
        {
          role: "system",
          content:
            STRICT_REWRITE_RULES +
            "You are an expert resume writer. Rephrase project description bullets to better highlight technical impact and relevance to the target role — without adding new facts, tools, or metrics.",
        },
        {
          role: "user",
          content: `Project: ${args.projectName}
Stack (grounded only): ${args.stack.join(", ") || "(none)"}
Target Role: ${jobTitle}
Target profile: ${JSON.stringify(target)}
Current bullets (${args.currentBullets.length} — return exactly this many):
${args.currentBullets.map((b) => `- ${b}`).join("\n")}
Job Description:
${args.jobDescription}

Return JSON: { "bullets": string[] }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "improved_project_bullets",
          strict: true,
          schema: {
            type: "object",
            properties: {
              bullets: { type: "array", items: { type: "string" } },
            },
            required: ["bullets"],
          },
        },
      },
      temperature: 0.2,
    },
    opts
  );

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }
  const result = JSON.parse(content);
  const rawBullets: string[] = Array.isArray(result.bullets)
    ? result.bullets
    : [];
  return filterGroundedBullets(args.currentBullets, rawBullets);
}
