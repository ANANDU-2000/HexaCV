-- V6: per-build credits + pipeline build status tracking
CREATE TABLE IF NOT EXISTS credit_ledger (
  id varchar(36) PRIMARY KEY,
  "userId" integer NOT NULL,
  delta integer NOT NULL,
  reason varchar(64) NOT NULL,
  "orderId" varchar(36),
  "buildId" varchar(36),
  "idempotencyKey" varchar(128) NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_idx ON credit_ledger ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_idem_uidx ON credit_ledger ("idempotencyKey");

CREATE TABLE IF NOT EXISTS builds (
  id varchar(36) PRIMARY KEY,
  "userId" integer NOT NULL,
  "resumeId" varchar(36),
  stage varchar(32) NOT NULL DEFAULT 'extract',
  role varchar(255),
  region varchar(64),
  "errorMessage" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS builds_user_idx ON builds ("userId");
