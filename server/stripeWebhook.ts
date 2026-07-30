import express, { Express } from "express";
import Stripe from "stripe";
import * as db from "./db";
import {
  markStripeEventProcessed,
  wasStripeEventProcessed,
} from "./stripeEvents";

export function registerStripeWebhook(app: Express) {
  // Mount the stripe webhook handler with raw body parser
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!secret || !signature) {
        console.warn(
          "[Stripe Webhook] Stripe webhook secret or signature missing. Parsing directly in sandbox/dev mode."
        );
        try {
          const rawBody =
            req.body instanceof Buffer ? req.body.toString("utf-8") : req.body;
          const body =
            typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
          const result = await handleStripeEvent(body);
          res.json({
            received: true,
            ...(result.duplicate ? { duplicate: true } : {}),
          });
        } catch (err: any) {
          console.error(
            "[Stripe Webhook] Error parsing/handling direct dev webhook payload:",
            err
          );
          const status = err?.statusCode === 400 ? 400 : 500;
          res.status(status).send(`Webhook Error: ${err.message}`);
        }
        return;
      }

      let event: Stripe.Event;
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2023-10-16" as any,
        });
        event = stripe.webhooks.constructEvent(
          req.body,
          signature as string,
          secret
        );
      } catch (err: any) {
        console.error(
          `[Stripe Webhook] Signature verification failed:`,
          err.message
        );
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      try {
        const result = await handleStripeEvent(event);
        res.json({
          received: true,
          ...(result.duplicate ? { duplicate: true } : {}),
        });
      } catch (err: any) {
        console.error(`[Stripe Webhook] Handler failed:`, err.message);
        res.status(500).send(`Webhook Error: ${err.message}`);
      }
    }
  );
}

/** Exported for validate scripts — applies effects then marks event id. */
export async function handleStripeEvent(
  event: any
): Promise<{ duplicate: boolean }> {
  const eventId = event?.id as string | undefined;
  const eventType = (event?.type as string) || "unknown";

  if (eventId && (await wasStripeEventProcessed(eventId))) {
    console.info(
      `[Stripe Webhook] Skipping duplicate event ${eventId} (${eventType})`
    );
    return { duplicate: true };
  }

  console.log(`[Stripe Webhook] Processing event type: ${eventType}`);

  try {
    await applyStripeEventEffects(event);
  } catch (err) {
    // Do not mark — Stripe can retry
    throw err;
  }

  if (eventId) {
    await markStripeEventProcessed(eventId, eventType);
  }

  return { duplicate: false };
}

async function applyStripeEventEffects(event: any): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data?.object;
      const userId = subscription?.metadata?.userId;
      const tier = subscription?.metadata?.tier;
      if (userId && tier) {
        await db.updateSubscription(parseInt(userId), tier, {
          provider: "stripe",
          referenceId: subscription?.id || undefined,
        });
        console.log(
          `[Stripe Webhook] Successfully configured subscription for user ${userId} to ${tier}`
        );
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data?.object;
      const userId = subscription?.metadata?.userId;
      if (userId) {
        await db.updateSubscription(parseInt(userId), "free", {
          provider: "stripe",
          referenceId: subscription?.id || undefined,
        });
        console.log(
          `[Stripe Webhook] Cancelled subscription for user ${userId}`
        );
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data?.object;
      const customerEmail = invoice?.customer_email;
      if (customerEmail && invoice?.amount_paid) {
        const matchingUser = db.mockDb.users.find(
          (u) => u.email === customerEmail
        );
        if (matchingUser) {
          await db.rewardReferralConversion(
            customerEmail,
            matchingUser.id,
            invoice.amount_paid
          );
        }
      }
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
}
