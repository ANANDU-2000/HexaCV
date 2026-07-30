import express, { Express } from "express";
import Stripe from "stripe";
import * as db from "./db";

export function registerStripeWebhook(app: Express) {
  // Mount the stripe webhook handler with raw body parser
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!secret || !signature) {
        console.warn("[Stripe Webhook] Stripe webhook secret or signature missing. Parsing directly in sandbox/dev mode.");
        try {
          const rawBody = req.body instanceof Buffer ? req.body.toString("utf-8") : req.body;
          const body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
          await handleStripeEvent(body);
          res.json({ received: true });
        } catch (err: any) {
          console.error("[Stripe Webhook] Error parsing direct dev webhook payload:", err);
          res.status(400).send(`Webhook Error: ${err.message}`);
        }
        return;
      }

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2023-10-16" as any,
        });
        const event = stripe.webhooks.constructEvent(
          req.body,
          signature as string,
          secret
        );
        await handleStripeEvent(event);
        res.json({ received: true });
      } catch (err: any) {
        console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  );
}

async function handleStripeEvent(event: any) {
  console.log(`[Stripe Webhook] Processing event type: ${event.type}`);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data?.object;
      const userId = subscription?.metadata?.userId;
      const tier = subscription?.metadata?.tier;
      if (userId && tier) {
        await db.updateSubscription(parseInt(userId), tier);
        console.log(`[Stripe Webhook] Successfully configured subscription for user ${userId} to ${tier}`);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data?.object;
      const userId = subscription?.metadata?.userId;
      if (userId) {
        await db.updateSubscription(parseInt(userId), "free");
        console.log(`[Stripe Webhook] Cancelled subscription for user ${userId}`);
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data?.object;
      // Optionally reward referral commission on paid invoice
      const customerEmail = invoice?.customer_email;
      if (customerEmail && invoice?.amount_paid) {
        const matchingUser = db.mockDb.users.find(u => u.email === customerEmail);
        if (matchingUser) {
          await db.rewardReferralConversion(customerEmail, matchingUser.id, invoice.amount_paid);
        }
      }
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
}
