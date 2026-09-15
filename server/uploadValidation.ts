import {
  MAX_RESUME_UPLOAD_BYTES,
  MAX_RESUME_PARSE_TEXT_CHARS,
  RESUME_UPLOAD_EXTENSIONS,
  RESUME_UPLOAD_TOO_LARGE_MSG,
} from "../shared/const";

/**
 * Server-side pre-parse validation for `resume.parse` uploads. The client
 * already validates, but the server is the authority — a request can never
 * skip these checks. All inputs are rejected BEFORE any PDF/DOCX parsing or
 * LLM call, so oversized/malformed payloads never reach expensive work.
 */
export type ResumeUploadValidation =
  | { ok: true; buffer: Buffer; extension: string }
  | { ok: false; error: string };

/** Base64 alphabet allows padding and (tolerated) whitespace/newlines. */
const BASE64_PATTERN = /^[A-Za-z0-9+/=\r\n\s]*$/;
/** ~4/3 expansion factor plus slack for a file just under the cap. */
const MAX_BASE64_STRING_LENGTH = Math.ceil((MAX_RESUME_UPLOAD_BYTES * 4) / 3) + 4;

export function validateResumeUpload(params: {
  filename: string;
  base64: string;
}): ResumeUploadValidation {
  const { filename, base64 } = params;

  const extension = filename.split(".").pop()?.toLowerCase() || "";
  if (!(RESUME_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      ok: false,
      error: `Unsupported file type. Please upload a PDF, Word (.doc/.docx), or text (.txt) file.`,
    };
  }

  if (typeof base64 !== "string" || !base64.trim()) {
    return { ok: false, error: "The uploaded file is empty." };
  }

  if (!BASE64_PATTERN.test(base64)) {
    return { ok: false, error: "The uploaded file data is invalid or corrupted." };
  }

  // Cheap pre-flight on the encoded length before allocating a decode buffer.
  if (base64.length > MAX_BASE64_STRING_LENGTH) {
    return { ok: false, error: RESUME_UPLOAD_TOO_LARGE_MSG };
  }

  const normalized = base64.replace(/[\r\n\s]/g, "");
  const buffer = Buffer.from(normalized, "base64");

  if (buffer.length === 0) {
    return { ok: false, error: "The uploaded file is empty." };
  }

  if (buffer.length > MAX_RESUME_UPLOAD_BYTES) {
    return { ok: false, error: RESUME_UPLOAD_TOO_LARGE_MSG };
  }

  return { ok: true, buffer, extension };
}

/**
 * Guard the amount of extracted text handed to the parse LLM. Stopping an
 * absurdly long document before an expensive call protects both cost and
 * context limits without touching the grounding/validation pipeline.
 */
export function isResumeParseTextTooLong(rawText: string): boolean {
  return rawText.length > MAX_RESUME_PARSE_TEXT_CHARS;
}