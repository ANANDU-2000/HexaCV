-- Razorpay primary: payment_orders (MySQL)
-- Apply via drizzle-kit migrate / manual DBA as needed.

CREATE TABLE IF NOT EXISTS `payment_orders` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `tier` varchar(50) NOT NULL,
  `amountPaise` int NOT NULL,
  `currency` varchar(8) NOT NULL DEFAULT 'INR',
  `razorpayOrderId` varchar(128) NOT NULL,
  `razorpayPaymentId` varchar(128),
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `payment_orders_rzp_order_unique` UNIQUE(`razorpayOrderId`)
);

CREATE INDEX `payment_orders_user_idx` ON `payment_orders` (`userId`);
CREATE INDEX `payment_orders_rzp_order_idx` ON `payment_orders` (`razorpayOrderId`);
