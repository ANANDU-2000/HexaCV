import express, { Express } from "express";
import {
  fulfillVerifiedPayment,
  getRazorpayWebhookSecret,
  verifyWebhookSignature,
} from "./payments/razorpay";
import { enterGracePeriod } from "./subscriptionGrace";

export function registerRazorpayWebhook(app: Express) {
  app.post(
    "/api/webhooks/razorpay",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = String(req.headers["x-razorpay-signature"] || "");
      const secret = getRazorpayWebhookSecret();
      const rawBody =
        req.body instanceof Buffer
          ? req.body
          : Buffer.from(JSON.stringify(req.body || {}));

      if (secret) {
        if (!verifyWebhookSignature(rawBody, signature, secret)) {
          console.error("[Razorpay Webhook] Signature verification failed");
          res.status(400).send("Invalid signature");
          return;
        }
      } else {
        console.warn(
          "[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET missing — sandbox parse only"
        );
      }

      let event: any;
      try {
        const text = rawBody.toString("utf8");
        event = JSON.parse(text || "{}");
      } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      try {
        const result = await handleRazorpayEvent(event);
        res.json({
          received: true,
          ...(result.duplicate ? { duplicate: true } : {}),
        });
      } catch (err: any) {
        console.error("[Razorpay Webhook] Handler failed:", err.message);
        res.status(500).send(`Webhook Error: ${err.message}`);
      }
    }
  );
}

function extractUserIdFromPayload(event: any): number | null {
  const notes =
    event?.payload?.payment?.entity?.notes ||
    event?.payload?.subscription?.entity?.notes ||
    event?.payload?.order?.entity?.notes ||
    {};
  const raw = notes.userId || notes.user_id;
  if (raw == null) return null;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}

/** Exported for validate scripts. */
export async function handleRazorpayEvent(
  event: any
): Promise<{ duplicate: boolean }> {
  const type = event?.event || event?.type || "unknown";
  console.log(`[Razorpay Webhook] Processing event: ${type}`);

  if (type === "payment.captured" || type === "order.paid") {
    const payment =
      event?.payload?.payment?.entity ||
      event?.payload?.order?.entity ||
      event?.payload?.payment ||
      {};
    const orderId =
      payment.order_id ||
      payment.orderId ||
      event?.payload?.order?.entity?.id;
    const paymentId = payment.id || payment.payment_id || null;

    if (!orderId) {
      console.warn("[Razorpay Webhook] No order id on event — ignoring");
      return { duplicate: false };
    }

    const result = await fulfillVerifiedPayment({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    });
    return { duplicate: result.duplicate };
  }

  if (type === "payment.failed") {
    console.info(
      "[Razorpay Webhook] payment.failed — not fulfilling; grace if user known"
    );
    const userId = extractUserIdFromPayload(event);
    if (userId != null) {
      await enterGracePeriod(userId, "payment.failed");
    }
    return { duplicate: false };
  }

  if (
    type === "subscription.halted" ||
    type === "subscription.pending" ||
    type === "subscription.paused"
  ) {
    const userId = extractUserIdFromPayload(event);
    if (userId != null) {
      await enterGracePeriod(userId, type);
    } else {
      console.warn(
        `[Razorpay Webhook] ${type} without notes.userId — cannot enter grace`
      );
    }
    return { duplicate: false };
  }

  console.log(`[Razorpay Webhook] Unhandled event type: ${type}`);
  return { duplicate: false };
}
