-- F3: processed_stripe_events — Stripe webhook idempotency (MySQL)
-- Apply via drizzle-kit migrate / manual DBA as needed.

CREATE TABLE IF NOT EXISTS `processed_stripe_events` (
  `id` varchar(255) NOT NULL,
  `type` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `processed_stripe_events_id` PRIMARY KEY(`id`)
);
