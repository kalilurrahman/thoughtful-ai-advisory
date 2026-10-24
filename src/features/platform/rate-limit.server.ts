import { RateLimiter } from "./analytics-core";

// Per-client, per-endpoint rate limit for public server functions — port of the limiter that
// platform/app/api/veritrail_api/server.py applies to every POST /api/<bucket> (the bucket is the
// endpoint: "events", "contact", "assessment"). VERITRAIL_RATE_LIMIT requests a minute (60 by
// default). The client address is hashed with a per-isolate salt and never stored.

// Created lazily on first use, so nothing server-side runs in the client bundle.
let limiter: RateLimiter | null = null;

/** True when the request may go ahead (always, when there is no request, as in tests). */
export async function allowRequest(bucket: string): Promise<boolean> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const h = getRequest()?.headers;
    const client =
      h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    limiter ??= new RateLimiter(Number(process.env["VERITRAIL_RATE_LIMIT"] ?? "60") || 60);
    return limiter.allow(client, bucket);
  } catch {
    return true; // no request context
  }
}

export const RATE_LIMITED = "Too many requests. Please retry shortly.";
