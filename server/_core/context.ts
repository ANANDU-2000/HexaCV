import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  const guestSessionId = opts.req.headers["x-guest-session-id"] as string | undefined;
  const deviceUid = opts.req.headers["x-device-uid"] as string | undefined;

  if (guestSessionId && deviceUid && !user) {
    db.trackGuestSession(guestSessionId, deviceUid).catch((err) => {
      console.error("[Context] Failed to track guest session:", err);
    });
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
