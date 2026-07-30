-- C5: prompt_versions + resume_evaluations (MySQL)
-- Apply via drizzle-kit migrate / manual DBA as needed.

CREATE TABLE IF NOT EXISTS `prompt_versions` (
  `id` varchar(36) NOT NULL,
  `stage` varchar(64) NOT NULL,
  `version` int NOT NULL,
  `body` text NOT NULL,
  `isActive` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `createdBy` varchar(128),
  CONSTRAINT `prompt_versions_id` PRIMARY KEY(`id`)
);

CREATE INDEX `prompt_versions_stage_idx` ON `prompt_versions` (`stage`);
CREATE INDEX `prompt_versions_stage_active_idx` ON `prompt_versions` (`stage`, `isActive`);

CREATE TABLE IF NOT EXISTS `resume_evaluations` (
  `id` varchar(36) NOT NULL,
  `userId` int,
  `resumeId` varchar(64),
  `stage` varchar(64) NOT NULL,
  `promptVersionId` varchar(36),
  `rating` varchar(16) NOT NULL,
  `note` text,
  `overallScore` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `resume_evaluations_id` PRIMARY KEY(`id`)
);

CREATE INDEX `resume_evaluations_user_idx` ON `resume_evaluations` (`userId`);
CREATE INDEX `resume_evaluations_resume_idx` ON `resume_evaluations` (`resumeId`);
CREATE INDEX `resume_evaluations_stage_idx` ON `resume_evaluations` (`stage`);
