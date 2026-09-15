/**
 * Single home for "pick a resume file → validate → base64 → trpc.resume.parse".
 *
 * Used by both upload UIs (Landing drag-drop card and ResumeUploader) so the
 * validation rules, encoding strategy, and parse call exist exactly once.
 * Each call site keeps its own shell (ParseLoader overlay vs inline spinner)
 * and decides what to do with the parsed result.
 */
import { useCallback, useState } from "react";

import type { ParsePhase } from "@/components/ParseLoader";
import { arrayBufferToBase64Async, stringToBase64, yieldToMain } from "@/lib/base64";
import { trpc } from "@/lib/trpc";
import type { ParsedResume } from "@shared/types";

/** Stricter of the two historical rule sets (ResumeUploader's 10MB cap). */
export const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;

/** Combined accepted-type list — PDF / Word / plain text. */
export const RESUME_FILE_ACCEPT =
  ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const VALID_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const VALID_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/** Returns an error message when the file is rejected, null when accepted. */
export function validateResumeFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const typeOk =
    (file.type && VALID_MIME_TYPES.includes(file.type)) ||
    VALID_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!typeOk) {
    return "Please upload a PDF, Word document, or text file.";
  }
  if (file.size > MAX_RESUME_FILE_BYTES) {
    return "File size must be less than 10MB.";
  }
  return null;
}

/**
 * Runs the shared parse pipeline for one file. Resolves with the parsed
 * resume, or null when validation/parse failed (`error` state carries the
 * message). Drives `phase` so a ParseLoader overlay can follow real progress,
 * and enforces a soft floor so the loader stays readable on fast parses.
 */
export function useResumeUpload() {
  const parseMutation = trpc.resume.parse.useMutation();
  const [parsing, setParsing] = useState(false);
  const [phase, setPhase] = useState<ParsePhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    async (file: File): Promise<ParsedResume | null> => {
      const validationError = validateResumeFile(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setError(null);
      setParsing(true);
      setPhase("reading");
      // Let any loader paint before heavy encode work.
      await yieldToMain();

      const startedAt = Date.now();
      try {
        const buffer = await file.arrayBuffer();
        setPhase("encoding");
        // TODO(upload): resume.parse still takes base64 over tRPC — prefer
        // multipart / binary body to skip the ~33% size overhead.
        const base64 = await arrayBufferToBase64Async(buffer);
        setPhase("uploading");
        const parsePromise = parseMutation.mutateAsync({
          filename: file.name,
          base64,
        });
        setPhase("extracting");
        const parsed = await parsePromise;
        setPhase("done");

        // Soft floor so the loader is readable; short now that encode is fast.
        const MIN_PARSE_MS = 800;
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_PARSE_MS) {
          await new Promise((r) => setTimeout(r, MIN_PARSE_MS - elapsed));
        }

        return parsed;
      } catch (err: any) {
        console.error("File parsing error:", err);
        setError(
          err?.message ||
            "We couldn't read this file — try again, or paste your resume text instead."
        );
        return null;
      } finally {
        setParsing(false);
        setPhase("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trpc mutation is stable
    []
  );

  /** Pasted-text variant of the same parse pipeline (no file, no phases). */
  const parseText = useCallback(
    async (
      text: string,
      filename = "pasted-text.txt"
    ): Promise<ParsedResume | null> => {
      setError(null);
      setParsing(true);
      try {
        const parsed = await parseMutation.mutateAsync({
          filename,
          base64: stringToBase64(text),
        });
        return parsed;
      } catch (err: any) {
        console.error("Text parsing error:", err);
        setError(
          err?.message ||
            "Failed to parse the pasted text. Please check the content and try again."
        );
        return null;
      } finally {
        setParsing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trpc mutation is stable
    []
  );

  return { parseFile, parseText, parsing, phase, error, setError };
}
