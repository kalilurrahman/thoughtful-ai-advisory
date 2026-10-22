import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { RateLimiter, validateEvent } from "./analytics-core";

// Cookieless analytics endpoint — port of POST /api/events in platform/app/api/aegis_api/server.py.
// Events are validated against the allow-list and written with the service role into the
// RLS-locked `site_events` table (migration 0008). No IP address, user agent, cookie, user id or
// session id is stored; the client address is used only, hashed with a per-isolate salt, for
// in-memory rate limiting.

export const trackEventInput = z.object({
  name: z.string().max(200),
  path: z.string().max(2000).optional().default("/"),
  props: z.record(z.string(), z.unknown()).optional().default({}),
});

export type TrackEventResult = { ok: true; stored: boolean } | { ok: false; error: string };

// Created lazily inside the handler so nothing server-side runs in the client bundle.
let limiter: RateLimiter | null = null;

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator(trackEventInput)
  .handler(async ({ data }): Promise<TrackEventResult> => {
    const v = validateEvent(data);
    if (!v.ok) return v;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const h = getRequest()?.headers;
      const client =
        h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      limiter ??= new RateLimiter(Number(process.env["AEGIS_RATE_LIMIT"] ?? "60") || 60);
      if (!limiter.allow(client, "events")) {
        return { ok: false, error: "Too many requests. Please retry shortly." };
      }
    } catch {
      /* no request context (tests) — no limiting */
    }
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // site_events is newer than the generated Supabase types.
      const client = supabaseAdmin as unknown as {
        from: (table: string) => {
          insert: (row: object) => Promise<{ error: { message: string } | null }>;
        };
      };
      const { error } = await client.from("site_events").insert(v.event);
      if (error) {
        console.warn("site event insert failed", error.message);
        return { ok: true, stored: false };
      }
      return { ok: true, stored: true };
    } catch {
      return { ok: true, stored: false };
    }
  });
