import { Resume } from "@shared/types";
import * as db from "./db";
import { trackedInvokeLLM, type TrackedInvokeOptions } from "./usageTracker";
import { STRICT_REWRITE_RULES } from "./ai/grounding";
import {
  rewriteBulletsViaPipeline,
  rewriteProjectBulletsViaPipeline,
  rewriteSummaryViaPipeline,
} from "./ai/pipelineOrchestrator";

export interface BulletSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface ExperienceSuggestions {
  role: string;
  company: string;
  currentBullets: string[];
  suggestedBullets: BulletSuggestion[];
  newBullets: string[];
}

export interface SkillSuggestions {
  currentSkills: string[];
  suggestedSkills: string[];
  keywordMatches: string[];
  missingKeywords: string[];
}

export interface ResumeSuggestions {
  summary?: string;
  skills: SkillSuggestions;
  experience: ExperienceSuggestions[];
  overallAdvice: string;
}

/**
 * Generate AI-powered suggestions for resume content based on job description
 */
export async function generateResumeSuggestions(
  resume: Resume,
  jobDescription: string
): Promise<ResumeSuggestions> {
  if (!jobDescription.trim()) {
    throw new Error("Job description is required");
  }

  // Extract current resume content
  const headerSection = resume.sections.find((s) => s.type === "header");
  const summarySection = resume.sections.find((s) => s.type === "summary");
  const skillsSection = resume.sections.find((s) => s.type === "skills");
  const experienceSection = resume.sections.find((s) => s.type === "experience");

  const headerData = headerSection?.content.header;
  const jobTitle = headerData?.jobTitle || "";
  const targetRole = headerData?.targetRole || jobTitle;

  const currentSummary = summarySection?.content.summary || "";
  const currentSkills = skillsSection?.content.skills || [];
  const currentExperiences = experienceSection?.content.experiences || [];

  const countryCode = headerSection?.content.header?.countryCode;
  const targetCountryCode = headerSection?.content.header?.targetCountryCode;

  let regionalInstructions = "";
  if (targetCountryCode) {
    try {
      const rules = await db.getCountryAtsRules(countryCode || "IN", targetCountryCode);
      if (rules) {
        regionalInstructions = `
REGIONAL TARGETING AND ATS CONTEXT (${countryCode || "IN"} to ${targetCountryCode}):
- Target country preferred formatting rules: ${rules.preferredFormatting}
- Regional hiring expectations to incorporate: ${rules.regionalHiringExpectations}
- Keywords specific to target country to weave in: ${Array.isArray(rules.keywords) ? rules.keywords.join(", ") : rules.keywords}
- Regional Terminology conversions: Replace terms from source country with target country equivalents where appropriate. Map: ${JSON.stringify(rules.regionalTerminology)}
`;
      }
    } catch (e) {
      console.warn("Failed to load regional ATS rules:", e);
    }
  }

  // Build prompt for LLM
  const prompt = buildSuggestionPrompt(
    jobDescription,
    jobTitle,
    targetRole,
    currentSummary,
    currentSkills,
    currentExperiences,
    regionalInstructions
  );

  try {
    const response = await trackedInvokeLLM("suggestions", {
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume reviewer. Suggest improvements using ONLY facts already in the resume. " +
            "Do NOT invent skills, bullets, companies, or achievements. Do NOT add new bullet points. " +
            "Rephrase existing content to align with the job title, target role, and job description. " +
            "Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description:
                  "Suggested professional summary tailored to the job description",
              },
              skills: {
                type: "object",
                properties: {
                  suggestedSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Existing resume skills that align with the job (do not invent new skills)",
                  },
                  keywordMatches: {
                    type: "array",
                    items: { type: "string" },
                    description: "Keywords from job description that match resume",
                  },
                  missingKeywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Important keywords missing from resume",
                  },
                },
                required: ["suggestedSkills", "keywordMatches", "missingKeywords"],
              },
              experience: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: { type: "string" },
                    company: { type: "string" },
                    suggestedBullets: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          suggested: { type: "string" },
                          reason: { type: "string" },
                        },
                        required: ["original", "suggested", "reason"],
                      },
                    },
                    newBullets: {
                      type: "array",
                      items: { type: "string" },
                      description: "Must always be an empty array — never suggest new bullets",
                    },
                  },
                  required: ["role", "company", "suggestedBullets", "newBullets"],
                },
              },
              overallAdvice: {
                type: "string",
                description: "General advice for tailoring resume to this job",
              },
            },
            required: ["skills", "experience", "overallAdvice"],
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const suggestions = JSON.parse(content) as ResumeSuggestions;
    // Strip any invented new bullets the model may have added despite instructions
    if (suggestions.experience) {
      suggestions.experience = suggestions.experience.map((exp) => ({
        ...exp,
        newBullets: [],
        suggestedBullets: (exp.suggestedBullets || []).filter(
          (b) => b.original && b.suggested && b.original.trim() !== b.suggested.trim()
        ),
      }));
    }
    return suggestions;
  } catch (error) {
    console.error("Error generating resume suggestions:", error);
    throw error;
  }
}

/**
 * Generate keyword alignment score between resume and job description
 */
export async function calculateKeywordAlignment(
  resume: Resume,
  jobDescription: string
): Promise<{ score: number; matchedKeywords: string[]; missingKeywords: string[] }> {
  if (!jobDescription.trim()) {
    return { score: 0, matchedKeywords: [], missingKeywords: [] };
  }

  const resumeText = extractResumeText(resume);

  const response = await trackedInvokeLLM("keyword_alignment", {
    messages: [
      {
        role: "system",
        content:
          "You are an expert in resume optimization and ATS (Applicant Tracking System) keyword matching. Analyze the resume and job description to identify keyword matches and gaps.",
      },
      {
        role: "user",
        content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nProvide a JSON response with:
1. alignment_score (0-100)
2. matched_keywords: array
3. missing_keywords: array`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "keyword_alignment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            alignment_score: {
              type: "integer",
              description: "Score from 0-100",
              minimum: 0,
              maximum: 100,
            },
            matched_keywords: {
              type: "array",
              items: { type: "string" },
            },
            missing_keywords: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["alignment_score", "matched_keywords", "missing_keywords"],
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }

  const result = JSON.parse(content);
  return {
    score: result.alignment_score,
    matchedKeywords: result.matched_keywords,
    missingKeywords: result.missing_keywords,
  };
}

/**
 * Generate improved bullet points for a specific experience entry (C2 via pipeline).
 */
export async function improveBulletPoints(
  role: string,
  company: string,
  currentBullets: string[],
  jobDescription: string,
  countryCode?: string,
  targetCountryCode?: string,
  jobTitle?: string,
  targetRole?: string,
  opts?: TrackedInvokeOptions
): Promise<string[]> {
  return rewriteBulletsViaPipeline(
    {
      role,
      company,
      currentBullets,
      jobDescription,
      countryCode,
      targetCountryCode,
      jobTitle,
      targetRole,
    },
    opts
  );
}

/**
 * Generate improved/tailored professional summary (C2 via pipeline).
 */
export async function improveSummary(
  currentSummary: string,
  jobDescription: string,
  jobTitle?: string,
  countryCode?: string,
  targetCountryCode?: string,
  targetRole?: string,
  opts?: TrackedInvokeOptions
): Promise<string> {
  return rewriteSummaryViaPipeline(
    {
      currentSummary,
      jobDescription,
      jobTitle,
      countryCode,
      targetCountryCode,
      targetRole,
    },
    opts
  );
}

export async function improveProjectBullets(
  projectName: string,
  stack: string[],
  currentBullets: string[],
  jobDescription: string,
  targetRole?: string,
  opts?: TrackedInvokeOptions
): Promise<string[]> {
  return rewriteProjectBulletsViaPipeline(
    {
      projectName,
      stack,
      currentBullets,
      jobDescription,
      targetRole,
    },
    opts
  );
}

export async function generateCoverLetter(input: {
  name: string;
  targetRole: string;
  companyName: string;
  hiringManagerName?: string;
  summary: string;
  experienceBullets: string;
  skills: string;
  jobDescription: string;
}): Promise<string> {
  const response = await trackedInvokeLLM("cover_letter", {
    messages: [
      {
        role: "system",
        content:
          "You are an expert cover letter writer. Write a concise, professional cover letter using ONLY the candidate details, employer/role details, and achievements provided below. Do NOT invent any company history, metrics, or experience not present in the resume data. Do NOT use generic filler like 'I am writing to express my interest' as the opening line — open with a specific, concrete hook drawn from the candidate's actual background.",
      },
      {
        role: "user",
        content: `Candidate Name: ${input.name}
Target Role: ${input.targetRole}
Company: ${input.companyName}
Hiring Manager (if known): ${input.hiringManagerName || "Not provided"}

Resume Summary: ${input.summary}
Key Experience:
${input.experienceBullets}
Key Skills: ${input.skills}

Job Description:
${input.jobDescription}

Write a 3-paragraph cover letter (opening hook, relevant experience mapped to the JD, confident close with a call to action). Max 250 words. Return JSON: { "coverLetter": string }`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "cover_letter",
        strict: true,
        schema: {
          type: "object",
          properties: {
            coverLetter: { type: "string" },
          },
          required: ["coverLetter"],
        },
      },
    },
    temperature: 0.6,
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from LLM");
  const result = JSON.parse(content);
  return (result.coverLetter || "").trim();
}

export async function generateLinkedInAbout(input: {
  summary: string;
  jobTitle: string;
  skills: string;
  experienceHighlights: string;
}): Promise<string> {
  const response = await trackedInvokeLLM("linkedin", {
    messages: [
      {
        role: "system",
        content:
          STRICT_REWRITE_RULES +
          "You are rewriting resume content into a LinkedIn 'About' section: first-person, conversational, still 100% grounded in the facts provided. No resume-style bullet fragments — full sentences.",
      },
      {
        role: "user",
        content: `Professional Summary: ${input.summary}
Job Title: ${input.jobTitle}
Top Skills: ${input.skills}
Notable Experience: ${input.experienceHighlights}

Write a first-person LinkedIn About section, 3-5 short paragraphs, ending with what the candidate is currently looking for. Do not invent employers, metrics, or credentials not listed above. Return JSON: { "about": string }`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "linkedin_about",
        strict: true,
        schema: {
          type: "object",
          properties: {
            about: { type: "string" },
          },
          required: ["about"],
        },
      },
    },
    temperature: 0.6,
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from LLM");
  const result = JSON.parse(content);
  return (result.about || "").trim();
}

export async function atsAudit(resumeText: string, jobDescription: string): Promise<{
  overallScore: number;
  formattingIssues: string[];
  missingKeywords: string[];
  weakBullets: { original: string; why: string }[];
  topFixes: string[];
}> {
  const response = await trackedInvokeLLM("ats_audit", {
    messages: [
      {
        role: "system",
        content:
          "You are an ATS (Applicant Tracking System) compliance auditor. Evaluate the resume's machine-readability and keyword alignment against the job description. Be specific and cite the exact resume text you're flagging — do not give generic advice that could apply to any resume.",
      },
      {
        role: "user",
        content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nReturn JSON:\n{\n  "overallScore": number (0-100),\n  "formattingIssues": string[],\n  "missingKeywords": string[],\n  "weakBullets": { "original": string, "why": string }[],\n  "topFixes": string[]\n}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ats_audit",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "integer", minimum: 0, maximum: 100 },
            formattingIssues: { type: "array", items: { type: "string" } },
            missingKeywords: { type: "array", items: { type: "string" } },
            weakBullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  why: { type: "string" },
                },
                required: ["original", "why"],
              },
            },
            topFixes: { type: "array", items: { type: "string" } },
          },
          required: ["overallScore", "formattingIssues", "missingKeywords", "weakBullets", "topFixes"],
        },
      },
    },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from LLM");
  return JSON.parse(content);
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobDescription: string
): Promise<{
  behavioralQuestions: string[];
  technicalQuestions: string[];
  gapQuestions: string[];
  suggestedTalkingPoints: string[];
}> {
  const response = await trackedInvokeLLM("interview", {
    messages: [
      {
        role: "system",
        content:
          "You are a hiring manager preparing to interview this candidate for the target role. Generate likely interview questions based specifically on the overlap and gaps between their resume and the job description — not generic interview questions.",
      },
      {
        role: "user",
        content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nReturn JSON:\n{\n  "behavioralQuestions": string[],\n  "technicalQuestions": string[],\n  "gapQuestions": string[],\n  "suggestedTalkingPoints": string[]\n}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "interview_questions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            behavioralQuestions: { type: "array", items: { type: "string" } },
            technicalQuestions: { type: "array", items: { type: "string" } },
            gapQuestions: { type: "array", items: { type: "string" } },
            suggestedTalkingPoints: { type: "array", items: { type: "string" } },
          },
          required: ["behavioralQuestions", "technicalQuestions", "gapQuestions", "suggestedTalkingPoints"],
        },
      },
    },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from LLM");
  return JSON.parse(content);
}

export async function generateRecruiterOutreach(input: {
  topSkills: string;
  mostRecentRole: string;
  jobTitle: string;
  companyName: string;
  roleSummary: string;
}): Promise<string> {
  const response = await trackedInvokeLLM("outreach", {
    messages: [
      {
        role: "system",
        content:
          "You are helping a recruiter draft a personalized outreach message to a candidate. Use only the candidate's actual resume highlights and the actual role details provided — no generic templated flattery.",
      },
      {
        role: "user",
        content: `Candidate Highlights: ${input.topSkills}, ${input.mostRecentRole}
Role: ${input.jobTitle} at ${input.companyName}
Role Highlights: ${input.roleSummary}

Write a short (under 120 words), specific outreach message referencing one concrete thing from the candidate's background and one concrete thing about the role. Return JSON: { "message": string }`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "recruiter_outreach",
        strict: true,
        schema: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        },
      },
    },
    temperature: 0.6,
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from LLM");
  const result = JSON.parse(content);
  return (result.message || "").trim();
}

/**
 * Extract all text from resume for analysis
 */
function extractResumeText(resume: Resume): string {
  const parts: string[] = [];

  resume.sections.forEach((section) => {
    if (section.type === "header" && section.content.header) {
      const h = section.content.header;
      parts.push(`${h.name} ${h.email} ${h.phone} ${h.location}`);
    } else if (section.type === "summary" && section.content.summary) {
      parts.push(section.content.summary);
    } else if (section.type === "skills" && section.content.skills) {
      section.content.skills.forEach((skillGroup: any) => {
        parts.push(`${skillGroup.category}: ${skillGroup.skills.join(", ")}`);
      });
    } else if (section.type === "experience" && section.content.experiences) {
      section.content.experiences.forEach((exp: any) => {
        parts.push(`${exp.role} at ${exp.company}`);
        if (Array.isArray(exp.description)) {
          parts.push(exp.description.join(" "));
        } else if (exp.description) {
          parts.push(exp.description);
        }
      });
    } else if (section.type === "projects" && section.content.projects) {
      section.content.projects.forEach((proj: any) => {
        parts.push(`${proj.name}: ${proj.description}`);
      });
    } else if (section.type === "education" && section.content.educations) {
      section.content.educations.forEach((edu: any) => {
        parts.push(`${edu.degree} in ${edu.field} from ${edu.institution}`);
      });
    } else if (section.type === "certifications" && section.content.certifications) {
      section.content.certifications?.forEach((cert: any) => {
        parts.push(`${cert.name} from ${cert.issuer}`);
      });
    }
  });

  return parts.join("\n");
}

/**
 * Build the prompt for generating resume suggestions
 */
function buildSuggestionPrompt(
  jobDescription: string,
  jobTitle: string,
  targetRole: string,
  currentSummary: string,
  currentSkills: any[],
  currentExperiences: any[],
  regionalInstructions = ""
): string {
  const skillsText = currentSkills
    .map((sg: any) => `${sg.category}: ${sg.skills.join(", ")}`)
    .join("\n");

  const experienceText = currentExperiences
    .map((exp: any) => {
      const bullets = Array.isArray(exp.description)
        ? exp.description.map((b: string) => `  - ${b}`).join("\n")
        : `  - ${exp.description}`;
      return `${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"})\n${bullets}`;
    })
    .join("\n\n");

  return `Analyze this resume against the target job. Use ONLY content already in the resume — do not invent facts, skills, or bullets.
${regionalInstructions ? `\n${regionalInstructions}\n` : ""}
CANDIDATE JOB TITLE: ${jobTitle || "(from resume)"}
TARGET ROLE: ${targetRole || jobTitle || "(from resume)"}

CURRENT RESUME:
Professional Summary: ${currentSummary || "(Not provided)"}

Skills:
${skillsText || "(Not provided)"}

Experience:
${experienceText || "(Not provided)"}

TARGET JOB DESCRIPTION:
${jobDescription}

Provide:
1. A rephrased professional summary using ONLY facts from the current summary, tailored to the job title and target role
2. Existing skills from the resume that align with the job (do NOT suggest skills not already listed)
3. Keywords from the job that match the resume
4. Important keywords missing from the resume
5. For each experience entry, suggest rephrased bullet points (same count, same facts — no new bullets). Set newBullets to [] always.
6. Overall advice for tailoring this resume without adding fabricated content

Format your response as JSON with the structure provided.`;
}
