/**
 * C5 — prompt_versions + resume_evaluations helpers.
 * Never mutate an active prompt body — insert + promote instead.
 */
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  promptVersions,
  resumeEvaluations,
  type PromptVersionDb,
  type ResumeEvaluationDb,
} from "../drizzle/schema";
import { AI_GROUNDING_RULES } from "./ai/grounding";
import { getDb, mockDb } from "./db";

export const DEFAULT_REWRITE_PROMPT_BODY =
  AI_GROUNDING_RULES +
  "Generate a professional resume JSON matching the schema. " +
  "Use ONLY facts from the Extract JSON. Use Target keywords to prioritize wording — never invent skills. " +
  "Return only the JSON object.";

export async function ensureDefaultRewritePrompt(): Promise<void> {
  const existing = await getActivePrompt("rewrite");
  if (existing) return;
  await insertPromptVersion({
    stage: "rewrite",
    body: DEFAULT_REWRITE_PROMPT_BODY,
    createdBy: "system-c5-seed",
    promote: true,
  });
}

export async function getActivePrompt(
  stage: string
): Promise<PromptVersionDb | null> {
  await ensureDefaultRewritePromptIfNeeded(stage);

  const db = await getDb();
  if (!db) {
    const rows = (mockDb.promptVersions || []) as PromptVersionDb[];
    return (
      rows.find((r) => r.stage === stage && r.isActive) ||
      null
    );
  }
  try {
    const rows = await db
      .select()
      .from(promptVersions)
      .where(
        and(eq(promptVersions.stage, stage), eq(promptVersions.isActive, true))
      )
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.warn("[promptVersions] getActivePrompt failed:", error);
    const rows = (mockDb.promptVersions || []) as PromptVersionDb[];
    return rows.find((r) => r.stage === stage && r.isActive) || null;
  }
}

async function ensureDefaultRewritePromptIfNeeded(stage: string): Promise<void> {
  if (stage !== "rewrite") return;
  const db = await getDb();
  if (!db) {
    const rows = (mockDb.promptVersions || []) as PromptVersionDb[];
    if (!rows.some((r) => r.stage === "rewrite")) {
      await insertPromptVersion({
        stage: "rewrite",
        body: DEFAULT_REWRITE_PROMPT_BODY,
        createdBy: "system-c5-seed",
        promote: true,
      });
    }
    return;
  }
  try {
    const any = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.stage, "rewrite"))
      .limit(1);
    if (any.length === 0) {
      await insertPromptVersion({
        stage: "rewrite",
        body: DEFAULT_REWRITE_PROMPT_BODY,
        createdBy: "system-c5-seed",
        promote: true,
      });
    }
  } catch {
    /* table may not exist yet — mock path still works */
  }
}

export async function listPromptVersions(
  stage?: string
): Promise<PromptVersionDb[]> {
  const db = await getDb();
  if (!db) {
    let rows = [...((mockDb.promptVersions || []) as PromptVersionDb[])];
    if (stage) rows = rows.filter((r) => r.stage === stage);
    return rows.sort((a, b) => b.version - a.version);
  }
  try {
    if (stage) {
      return await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.stage, stage))
        .orderBy(desc(promptVersions.version));
    }
    return await db
      .select()
      .from(promptVersions)
      .orderBy(desc(promptVersions.version));
  } catch (error) {
    console.warn("[promptVersions] list failed:", error);
    return [];
  }
}

export type InsertPromptVersionInput = {
  stage: string;
  body: string;
  createdBy?: string | null;
  /** If true, deactivate other versions for stage and activate this one. */
  promote?: boolean;
};

/** Insert a new version. Never edits an existing active body in place. */
export async function insertPromptVersion(
  input: InsertPromptVersionInput
): Promise<PromptVersionDb> {
  const existing = await listPromptVersions(input.stage);
  const nextVersion =
    existing.length > 0
      ? Math.max(...existing.map((r) => r.version)) + 1
      : 1;

  const row: PromptVersionDb = {
    id: randomUUID(),
    stage: input.stage,
    version: nextVersion,
    body: input.body,
    isActive: false,
    createdAt: new Date(),
    createdBy: input.createdBy || null,
  };

  const db = await getDb();
  if (!db) {
    mockDb.promptVersions = mockDb.promptVersions || [];
    mockDb.promptVersions.push({ ...row });
    if (input.promote) {
      await promotePromptVersion(row.id);
      return (await getActivePrompt(input.stage)) || { ...row, isActive: true };
    }
    return row;
  }

  try {
    await db.insert(promptVersions).values(row);
    if (input.promote) {
      await promotePromptVersion(row.id);
      return (await getActivePrompt(input.stage)) || { ...row, isActive: true };
    }
    return row;
  } catch (error) {
    console.warn("[promptVersions] insert failed, using mock:", error);
    mockDb.promptVersions = mockDb.promptVersions || [];
    mockDb.promptVersions.push({ ...row });
    if (input.promote) await promotePromptVersion(row.id);
    return row;
  }
}

/** Flip isActive: only this id active for its stage. Does not change body. */
export async function promotePromptVersion(
  id: string
): Promise<PromptVersionDb | null> {
  const db = await getDb();

  const findInMock = () =>
    ((mockDb.promptVersions || []) as PromptVersionDb[]).find((r) => r.id === id);

  if (!db) {
    const target = findInMock();
    if (!target) return null;
    for (const r of mockDb.promptVersions as PromptVersionDb[]) {
      if (r.stage === target.stage) r.isActive = r.id === id;
    }
    return findInMock() || null;
  }

  try {
    const found = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.id, id))
      .limit(1);
    const target = found[0];
    if (!target) return null;

    const siblings = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.stage, target.stage));

    for (const s of siblings) {
      const active = s.id === id;
      if (s.isActive !== active) {
        await db
          .update(promptVersions)
          .set({ isActive: active })
          .where(eq(promptVersions.id, s.id));
      }
    }

    const updated = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.id, id))
      .limit(1);
    return updated[0] || null;
  } catch (error) {
    console.warn("[promptVersions] promote failed:", error);
    const target = findInMock();
    if (!target) return null;
    for (const r of mockDb.promptVersions as PromptVersionDb[]) {
      if (r.stage === target.stage) r.isActive = r.id === id;
    }
    return findInMock() || null;
  }
}

export type InsertResumeEvaluationInput = {
  userId?: number | null;
  resumeId?: string | null;
  stage: string;
  promptVersionId?: string | null;
  rating: "up" | "down";
  note?: string | null;
  overallScore?: number | null;
};

export async function insertResumeEvaluation(
  input: InsertResumeEvaluationInput
): Promise<ResumeEvaluationDb> {
  const row: ResumeEvaluationDb = {
    id: randomUUID(),
    userId: input.userId ?? null,
    resumeId: input.resumeId ?? null,
    stage: input.stage,
    promptVersionId: input.promptVersionId ?? null,
    rating: input.rating,
    note: input.note ?? null,
    overallScore: input.overallScore ?? null,
    createdAt: new Date(),
  };

  const db = await getDb();
  if (!db) {
    mockDb.resumeEvaluations = mockDb.resumeEvaluations || [];
    mockDb.resumeEvaluations.push({ ...row });
    return row;
  }
  try {
    await db.insert(resumeEvaluations).values(row);
    return row;
  } catch (error) {
    console.warn("[resumeEvaluations] insert failed, using mock:", error);
    mockDb.resumeEvaluations = mockDb.resumeEvaluations || [];
    mockDb.resumeEvaluations.push({ ...row });
    return row;
  }
}

export function resetPromptVersionStoresForTests(): void {
  mockDb.promptVersions = [];
  mockDb.resumeEvaluations = [];
}
