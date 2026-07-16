# AI Prompt Provider Notes

## Schema Support

Strict JSON schema (`response_format: { type: "json_schema", strict: true }`)
is reliable on **OpenAI**, **Gemini**, and **Grok**. On OpenRouter / Hugging Face
it depends on the underlying routed model — test before relying on it, or
force `model: "gpt-4o"` for schema-critical calls.

**Schema-critical calls (pinned to `gpt-4o`):**
- `§1.1` — `generateFullResume` (`server/routers.ts`)
- `§1.2` — `parseResumeWithLLM` (`server/fileParser.ts`)

## Temperature Guidelines

| Section | Function | Temp | Reason |
|---|---|---|---|
| §1.1 | `generateFullResume` | 0.6 | Generation — no source to distort |
| §1.2 | `parseResumeWithLLM` | 0.1 | Precision parsing |
| §1.5 | `improveBulletPoints` | 0.2 | Precision rewrite |
| §1.6 | `improveSummary` | 0.2 | Precision rewrite |
| §2.1 | `improveProjectBullets` | 0.2 | Precision rewrite |
| §2.2 | `generateCoverLetter` | 0.6 | Generation |
| §2.2 | `generateLinkedInAbout` | 0.6 | Generation |
| §2.2 | `generateRecruiterOutreach` | 0.6 | Generation |
| — | `atsAudit` | 0.2 | Analysis |
| — | `generateInterviewQuestions` | 0.3 | Mixed |

- **Rewrite tasks** (§1.5, §1.6, §2.1): low temperature (0.1–0.3) — precision edits.
- **Generation-only tasks** (§1.1, §2.2): higher temperature (0.5–0.7) — no source to distort.

## Grounding Rules — Never Relax

Resumes are a domain where a single fabricated metric or job title is a
real, embarrassing failure mode for the user. All grounding rules
(STRICT_REWRITE_RULES) exist to prevent this. Do not loosen prompts to
get more "impressive-sounding" output.
