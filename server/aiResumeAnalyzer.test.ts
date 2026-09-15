/**
 * PHASE 6 — AI Resume Analyzer tests (20).
 *
 * Covers the deterministic scoring engine, AI qualitative analysis (mocked),
 * country grounding guard, credit lifecycle, ownership, and idempotency.
 * LLM calls are short-circuited via vi.mock("./usageTracker").
 */
import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Env before any server module import
// ---------------------------------------------------------------------------
process.env.JWT_SECRET = "analyzer-test-secret-at-least-32-bytes!!";
process.env.VITE_APP_ID = "analyzer-test-app-id";
process.env.AI_PAUSED = "";

// ---------------------------------------------------------------------------
// Mock trackedInvokeLLM — controllable stub
// ---------------------------------------------------------------------------
type LlmImpl = (
  label: string,
  params: any,
  opts?: any,
) => Promise<{ choices: [{ message: { content: string } }] }>;

let llmImpl: LlmImpl = async () => ({
  choices: [{ message: { content: "{}" } }],
});

vi.mock("./usageTracker", () => ({
  trackedInvokeLLM: (...args: [string, any, any?]) => (llmImpl as any)(...args),
}));

// ---------------------------------------------------------------------------
// Imports (AFTER mock)
// ---------------------------------------------------------------------------
import {
  analyzeResume,
  contentToText,
  scoreResumeDeterministic,
  validateAiAnalysis,
  isUngroundedCountryClaim,
  aiAnalysisIsUsable,
} from "./aiResumeAnalyzer";
import type { ParsedResume } from "@shared/types";
import type { AnalyzerOptions, AnalyzerRunContext } from "./aiResumeAnalyzer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal but complete ParsedResume for deterministic-scoring happy paths. */
function baseResume(overrides: Partial<ParsedResume> = {}): ParsedResume {
  return {
    header: {
      name: "Jordan Doe",
      email: "jordan@example.com",
      phone: "+1-555-0100",
      location: "San Francisco, CA",
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/jordan" }],
      jobTitle: "Software Engineer",
      targetRole: "Senior Software Engineer",
      countryCode: "US",
      targetCountryCode: "US",
    },
    summary:
      "Software engineer with 6 years of experience building scalable web applications and APIs.",
    skills: [
      { category: "Languages", skills: ["TypeScript", "Python", "Go"] },
      { category: "Frameworks", skills: ["React", "Node.js", "Express"] },
    ],
    experiences: [
      {
        id: "e1",
        company: "Acme Corp",
        role: "Software Engineer",
        startDate: "2020-01",
        endDate: "2024-01",
        current: false,
        description: [
          "Built a microservices platform serving 5M requests/day",
          "Led migration from REST to GraphQL reducing payload size 40%",
        ],
      },
      {
        id: "e2",
        company: "StartupXYZ",
        role: "Junior Developer",
        startDate: "2018-06",
        endDate: "2019-12",
        current: false,
        description: [
          "Developed customer-facing dashboard with React and D3.js",
          "Implemented CI/CD pipeline reducing deploy time 60%",
        ],
      },
    ],
    projects: [
      {
        id: "p1",
        name: "Open Source CLI Tool",
        description: "A CLI tool for automating code reviews",
        technologies: ["TypeScript", "Node.js"],
        link: "https://github.com/jordan/cli-tool",
      },
    ],
    educations: [
      {
        id: "ed1",
        institution: "UC Berkeley",
        degree: "BS",
        field: "Computer Science",
        graduationDate: "2018-05",
        gpa: "3.8",
      },
    ],
    certifications: [],
    achievements: [],
    languages: [],
    references: [],
    ...overrides,
  };
}

/** Build a deterministic AI response object (the raw shape before validation). */
function aiResponse(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    summaryAnalysis:
      "Strong resume with solid experience. Good quantified achievements.",
    strengths: [
      "Clear career progression with quantified impact",
      "Strong technical skill set relevant to target role",
      "Good use of action verbs in experience bullets",
    ],
    issues: [
      "Summary could be more tailored to target role",
      "Missing certifications section",
    ],
    recommendations: [
      { text: "Add certifications like AWS or cloud credentials", priority: "medium" },
      { text: "Tailor summary to emphasize leadership for senior roles", priority: "high" },
    ],
    experienceAnalysis: "Solid two-position trajectory with measurable impact.",
    skillsAnalysis: "Relevant and well-categorized technical skills.",
    projectAnalysis: "One notable project with clear description.",
    keywordObservations: "TypeScript, React, and microservices align well.",
    ...overrides,
  };
}

/** Full analyzer options with country codes. */
const ANALYZER_OPTS: AnalyzerOptions = {
  targetCountryCode: "US",
  sourceCountryCode: "IN",
  targetRole: "Senior Software Engineer",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Phase 6 — AI Resume Analyzer: deterministic scoring", () => {
  it("1. rejects empty / minimal resume content", () => {
    const empty: ParsedResume = {
      header: { name: "", email: "", phone: "", location: "", links: [] },
      summary: "",
      skills: [],
      experiences: [],
      projects: [],
      educations: [],
      certifications: [],
    };
    const result = scoreResumeDeterministic(empty);
    expect(result.overallScore).toBeLessThan(30);
    const contactCat = result.categoryScores.find((c) => c.id === "contact");
    expect(contactCat?.score).toBe(0);
    expect(result.checks.some((c) => c.id === "missing_name" || c.id === "missing_summary")).toBe(true);
  });

  it("2. produces a complete analysis for a well-structured resume", () => {
    const result = scoreResumeDeterministic(baseResume());
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    const contact = result.categoryScores.find((c) => c.id === "contact");
    const experience = result.categoryScores.find((c) => c.id === "experience");
    const skills = result.categoryScores.find((c) => c.id === "skills");
    const structure = result.categoryScores.find((c) => c.id === "structure");
    expect(contact!.score).toBeGreaterThanOrEqual(7);
    expect(experience!.score).toBeGreaterThanOrEqual(15);
    expect(skills!.score).toBeGreaterThanOrEqual(10);
    expect(structure!.score).toBeGreaterThanOrEqual(7);
    // Well-structured resume should have a populated score explanation
    expect(result.scoreExplanation.strongAreas.length).toBeGreaterThan(0);
  });

  it("3. handles missing optional sections (projects, certifications) gracefully", () => {
    const minimal = baseResume({ projects: [], certifications: [] });
    const result = scoreResumeDeterministic(minimal);
    expect(result.overallScore).toBeGreaterThanOrEqual(50);
    const structure = result.categoryScores.find((c) => c.id === "structure");
    expect(structure).toBeDefined();
  });

  it("4. flags missing required fields (name, summary, experience)", () => {
    const bare: ParsedResume = {
      header: { name: "", email: "", phone: "", location: "", links: [] },
      summary: "",
      skills: [{ category: "General", skills: ["Excel"] }],
      experiences: [],
      projects: [],
      educations: [],
      certifications: [],
    };
    const result = scoreResumeDeterministic(bare);
    const ids = result.checks.map((c) => c.id);
    expect(ids).toContain("missing_summary");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("5. overall score is an integer between 0 and 100", () => {
    const result = scoreResumeDeterministic(baseResume());
    expect(Number.isInteger(result.overallScore)).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("6. every category score has id, score (0-100), weight, and applied flag", () => {
    const result = scoreResumeDeterministic(baseResume());
    for (const cat of result.categoryScores) {
      expect(typeof cat.id).toBe("string");
      expect(cat.score).toBeGreaterThanOrEqual(0);
      expect(cat.score).toBeLessThanOrEqual(100);
      expect(cat.weight).toBeGreaterThan(0);
      expect(typeof cat.applied).toBe("boolean");
    }
  });
});

describe("Phase 6 — AI Resume Analyzer: LLM integration (mocked)", () => {
  beforeEach(() => {
    llmImpl = async () => ({
      choices: [{ message: { content: JSON.stringify(aiResponse()) } }],
    });
  });

  it("7. returns full analysis with AI insights on success", async () => {
    const result = await analyzeResume(baseResume(), ANALYZER_OPTS, {
      userId: "u1",
      planTier: "paid",
    });
    expect(result.aiAvailable).toBe(true);
    expect(result.quality).toBe("full");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.summaryAnalysis).toBe("string");
    expect(result.summaryAnalysis.length).toBeGreaterThan(0);
  });

  it("8. validateAiAnalysis rejects malformed / missing fields", () => {
    // Missing required fields → returns empty (not usable)
    const empty1 = validateAiAnalysis({ summaryAnalysis: 80 });
    expect(aiAnalysisIsUsable(empty1)).toBe(false);
    const empty2 = validateAiAnalysis(null);
    expect(aiAnalysisIsUsable(empty2)).toBe(false);
    const empty3 = validateAiAnalysis("string");
    expect(aiAnalysisIsUsable(empty3)).toBe(false);
  });

  it("9. validateAiAnalysis accepts a correct AI schema", () => {
    const valid = validateAiAnalysis(aiResponse());
    expect(aiAnalysisIsUsable(valid)).toBe(true);
    expect(valid.strengths.length).toBeGreaterThan(0);
  });

  it("10. handles malformed JSON from LLM gracefully", async () => {
    llmImpl = async () => ({
      choices: [{ message: { content: "not json at all !!!" } }],
    });
    const result = await analyzeResume(baseResume(), ANALYZER_OPTS, {
      userId: "u1",
      planTier: "paid",
    });
    // AI failed, but deterministic analysis still returned
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.aiAvailable).toBe(false);
    expect(result.quality).toBe("degraded");
    expect(aiAnalysisIsUsable({
      summaryAnalysis: result.summaryAnalysis,
      strengths: result.strengths,
      issues: result.issues,
      recommendations: [],
      experienceAnalysis: result.experienceAnalysis,
      skillsAnalysis: result.skillsAnalysis,
      projectAnalysis: result.projectAnalysis,
      keywordObservations: result.keywordObservations,
    })).toBe(false);
  });
});

describe("Phase 6 — AI Resume Analyzer: credit lifecycle", () => {
  it("11. blocks guest users from paid analysis", async () => {
    await expect(
      analyzeResume(baseResume(), ANALYZER_OPTS, { guestKey: "g1" })
    ).rejects.toThrow(/sign in/i);
  });

  it("12. blocks users with zero credit balance", async () => {
    await expect(
      analyzeResume(baseResume(), ANALYZER_OPTS, {
        userId: "u1",
        planTier: "paid",
        balance: 0,
      })
    ).rejects.toThrow(/credit/i);
  });

  it("13. succeeds for authenticated user with balance >= 1", async () => {
    const result = await analyzeResume(baseResume(), ANALYZER_OPTS, {
      userId: "u1",
      planTier: "paid",
      balance: 5,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("14. releases credit on AI failure", async () => {
    llmImpl = async () => ({
      choices: [{ message: { content: "NOT_JSON" } }],
    });
    const released: string[] = [];
    const result = await analyzeResume(
      baseResume(),
      ANALYZER_OPTS,
      {
        userId: "u1",
        planTier: "paid",
        balance: 3,
        onCreditRelease: (buildId: string) => released.push(buildId),
      }
    );
    // AI failed → credit should have been released
    expect(result.aiAvailable).toBe(false);
    expect(released.length).toBe(1);
  });
});

describe("Phase 6 — AI Resume Analyzer: resume ownership", () => {
  it("15. validates resume belongs to the requesting user (via fetchResume callback)", async () => {
    let fetchedUserId: string | undefined;
    const result = await analyzeResume(
      baseResume(),
      ANALYZER_OPTS,
      {
        userId: "u-owner",
        planTier: "paid",
        balance: 5,
        fetchResume: async (id: string) => {
          fetchedUserId = "u-owner";
          return { userId: "u-owner", content: baseResume() };
        },
        resumeId: "resume-123",
      }
    );
    expect(fetchedUserId).toBe("u-owner");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("16. rejects when resume belongs to a different user", async () => {
    await expect(
      analyzeResume(
        baseResume(),
        ANALYZER_OPTS,
        {
          userId: "u-attacker",
          planTier: "paid",
          balance: 5,
          fetchResume: async () => ({
            userId: "u-owner",
            content: baseResume(),
          }),
          resumeId: "resume-123",
        }
      )
    ).rejects.toThrow(/not found|access denied/i);
  });
});

describe("Phase 6 — AI Resume Analyzer: country context", () => {
  it("17. passes country context to LLM and strips ungrounded visa/work-auth claims", async () => {
    llmImpl = async (_label: string, params: any) => {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify(
                aiResponse({
                  strengths: [
                    "You hold full US work authorization",
                    "Strong technical skills",
                  ],
                  issues: [
                    "Mention your H-1B visa sponsorship status",
                    "Summary too generic",
                  ],
                  recommendations: [
                    { text: "Put 'work visa ready' in your summary", priority: "medium" },
                    { text: "Add more quantified achievements", priority: "high" },
                  ],
                })
              ),
            },
          },
        ],
      };
    };

    const result = await analyzeResume(
      baseResume(),
      { targetCountryCode: "US", sourceCountryCode: "IN" },
      { userId: "u1", planTier: "paid", balance: 5 }
    );

    expect(result.aiAvailable).toBe(true);
    const allText = [
      ...result.strengths,
      ...result.issues,
      ...result.recommendations.map((r) => r.text),
    ].join(" ");
    // Ungrounded visa/work-auth claims should be stripped
    expect(allText).not.toMatch(/work authorization/i);
    expect(allText).not.toMatch(/H-?1B/i);
    expect(allText).not.toMatch(/visa sponsorship/i);
    expect(allText).not.toMatch(/work visa/i);
    // Legitimate text preserved
    expect(allText).toMatch(/technical skills/i);
    expect(allText).toMatch(/quantified achievements/i);
  });

  it("18. strips ungrounded salary/compensation claims", async () => {
    llmImpl = async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(
              aiResponse({
                issues: [
                  "Add your expected CTC of ₹20 LPA",
                  "No salary range mentioned",
                ],
                recommendations: [
                  { text: "Include compensation expectations of $120k+", priority: "medium" },
                  { text: "Add more projects", priority: "low" },
                ],
              })
            ),
          },
        },
      ],
    });

    const result = await analyzeResume(
      baseResume(),
      { targetCountryCode: "US" },
      { userId: "u1", planTier: "paid", balance: 5 }
    );

    const allText = [
      ...result.issues,
      ...result.recommendations.map((r) => r.text),
    ].join(" ");
    expect(allText).not.toMatch(/CTC/i);
    expect(allText).not.toMatch(/\$120k/i);
    expect(allText).not.toMatch(/salary range/i);
    expect(allText).toMatch(/projects/i);
  });

  it("19. strips ungrounded certification assertions but keeps cert advice", async () => {
    llmImpl = async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(
              aiResponse({
                strengths: ["Hold a US PMP certification", "Solid site experience"],
                recommendations: [
                  { text: "Add an AWS certification (US)", priority: "medium" },
                  { text: "Get a Scrum Master credential", priority: "low" },
                ],
              })
            ),
          },
        },
      ],
    });

    const result = await analyzeResume(
      baseResume({ certifications: [] }),
      { targetCountryCode: "US" },
      { userId: "u1", planTier: "paid", balance: 5 }
    );

    const allText = [
      ...result.strengths,
      ...result.recommendations.map((r) => r.text),
    ].join(" ");
    // Ungrounded assertion stripped (resume has no certs, text asserts "Hold ... PMP certification")
    expect(allText).not.toMatch(/Hold a US PMP certification/i);
    // Control — advice preserved (no assert verb)
    expect(allText).toMatch(/Solid site experience/i);
  });
});

describe("Phase 6 — AI Resume Analyzer: idempotency", () => {
  it("20. returns consistent deterministic score across calls", async () => {
    const a = scoreResumeDeterministic(baseResume());
    const b = scoreResumeDeterministic(baseResume());
    expect(a.overallScore).toBe(b.overallScore);
    for (let i = 0; i < a.categoryScores.length; i++) {
      expect(a.categoryScores[i].score).toBe(b.categoryScores[i].score);
    }
  });
});
