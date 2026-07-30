-- G2: evaluation-dataset opt-out on users
ALTER TABLE `users`
  ADD COLUMN `evaluationOptOut` boolean NOT NULL DEFAULT false;
