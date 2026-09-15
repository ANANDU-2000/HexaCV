export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ==========================================
// Upload limits (single source of truth — client and server read this)
// ==========================================

/** Maximum decoded resume file size that resume.parse will accept. */
export const MAX_RESUME_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Maximum characters of extracted resume text sent to the parse LLM. */
export const MAX_RESUME_PARSE_TEXT_CHARS = 100_000;

/** Supported resume upload extensions, lower-case (aligned with extractText). */
export const RESUME_UPLOAD_EXTENSIONS = ["pdf", "docx", "doc", "txt"] as const;

/** User-facing message for oversize uploads. */
export const RESUME_UPLOAD_TOO_LARGE_MSG =
  "Resume file is too large. Please upload a file smaller than 10 MB.";
