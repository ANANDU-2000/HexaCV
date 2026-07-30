-- F4: subscription grace window (MySQL)
ALTER TABLE `subscriptions`
  ADD COLUMN `graceUntil` timestamp NULL;
