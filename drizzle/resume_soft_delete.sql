-- Soft-delete for resumes (Dashboard Resume Hub).
-- 30-day purge cron is a follow-up; this only adds the column.
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS "deletedAt" timestamp;
