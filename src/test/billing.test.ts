import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { describeBilling } from "@/features/billing/describe";
import {
  entitledPlan,
  governingSubscription,
  productCatalogFromEnv,
  productFor,
  subscriptionRowFromEvent,
  type SubscriptionRecord,
} from "@/features/billing/entitlements";
import { verifyWebhook } from "@/features/billing/standard-webhooks";
import { handleDodoWebhook } from "@/features/billing/webhook";

// Billing through Dodo Payments (src/features/billing): plan rules, Standard Webhooks signature
// checks and webhook handling, with storage passed in.

const ENV = {
  DODO_PRODUCT_TEAM_MONTHLY: "pdt_team_m",
  DODO_PRODUCT_TEAM_ANNUAL: "pdt_team_y",
  DODO_PRODUCT_BUSINESS_ANNUAL: "pdt_biz_y",
  DODO_PRODUCT_ENTERPRISE: "pdt_ent",
  DODO_PRODUCT_BUSINESS_MONTHLY: "  ",
};
const catalog = productCatalogFromEnv(ENV);

const sub = (over: Partial<SubscriptionRecord>): SubscriptionRecord => ({
  subscription_id: "sub_1",
  plan: "team",
  status: "active",
  next_billing_date: "2027-01-01T00:00:00Z",
  cancel_at_next_billing_date: false,
  ...over,
});

describe("plan rules", () => {
  it("maps configured products to plans and ignores blank ones", () => {
    expect(catalog).toEqual({
      pdt_team_m: { plan: "team", interval: "monthly" },
      pdt_team_y: { plan: "team", interval: "annual" },
      pdt_biz_y: { plan: "business", interval: "annual" },
      pdt_ent: { plan: "enterprise", interval: "annual" },
    });
  });

  it("sells only self-serve plans through checkout", () => {
    expect(productFor(catalog, "team", "annual")).toBe("pdt_team_y");
    expect(productFor(catalog, "business", "monthly")).toBeUndefined();
    expect(productFor(catalog, "enterprise", "annual")).toBeUndefined();
  });

  it("grants the highest plan of active or past-due subscriptions, else Free", () => {
    expect(entitledPlan([]).id).toBe("free");
    expect(entitledPlan([sub({})]).id).toBe("team");
    expect(entitledPlan([sub({ status: "past_due" })]).id).toBe("team");
    for (const status of ["on_hold", "paused", "cancelled", "failed", "expired", "pending"])
      expect(entitledPlan([sub({ status })]).id, status).toBe("free");
    expect(entitledPlan([sub({}), sub({ subscription_id: "sub_2", plan: "business" })]).id).toBe(
      "business",
    );
    // A product VERITRAIL does not know grants nothing.
    expect(entitledPlan([sub({ plan: null })]).id).toBe("free");
  });

  it("shows the subscription that sets the plan, or the latest problem", () => {
    const held = sub({ subscription_id: "sub_old", status: "on_hold" });
    expect(governingSubscription([held, sub({})])?.subscription_id).toBe("sub_1");
    expect(governingSubscription([held])?.status).toBe("on_hold");
    expect(governingSubscription([])).toBeUndefined();
  });
});

const event = (type: string, data: Record<string, unknown> = {}) => ({
  business_id: "bus_1",
  type,
  timestamp: "2026-10-29T10:00:00Z",
  data: {
    subscription_id: "sub_1",
    product_id: "pdt_team_y",
    status: "active",
    customer: { customer_id: "cus_1", email: "a@example.com", name: "A" },
    next_billing_date: "2027-10-29T10:00:00Z",
    cancel_at_next_billing_date: false,
    ...data,
  },
});

describe("subscription events", () => {
  it("turns a subscription event into the row to store", () => {
    expect(subscriptionRowFromEvent(event("subscription.active"), catalog)).toEqual({
      subscription_id: "sub_1",
      customer_id: "cus_1",
      product_id: "pdt_team_y",
      plan: "team",
      status: "active",
      next_billing_date: "2027-10-29T10:00:00Z",
      cancel_at_next_billing_date: false,
      event_at: "2026-10-29T10:00:00Z",
    });
    expect(
      subscriptionRowFromEvent(event("subscription.plan_changed", { product_id: "x" }), catalog)
        ?.plan,
    ).toBeNull();
  });

  it("ignores other events and rejects malformed subscription events", () => {
    expect(subscriptionRowFromEvent(event("payment.succeeded"), catalog)).toBeNull();
    expect(() =>
      subscriptionRowFromEvent(event("subscription.active", { customer: null }), catalog),
    ).toThrow(/Malformed/);
    expect(() =>
      subscriptionRowFromEvent({ ...event("subscription.renewed"), timestamp: "soon" }, catalog),
    ).toThrow(/Malformed/);
  });
});

const SECRET_BYTES = Buffer.from("veritrail-test-webhook-secret-32b");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const NOW = 1_793_000_000;

function signed(body: string, opts: { id?: string; ts?: number; secret?: Buffer } = {}) {
  const id = opts.id ?? "msg_1";
  const ts = opts.ts ?? NOW;
  const sig = createHmac("sha256", opts.secret ?? SECRET_BYTES)
    .update(`${id}.${ts}.${body}`)
    .digest("base64");
  return new Headers({
    "webhook-id": id,
    "webhook-timestamp": String(ts),
    "webhook-signature": `v1,${sig}`,
  });
}

describe("Standard Webhooks signature", () => {
  const body = JSON.stringify(event("subscription.active"));

  it("accepts a valid signature, including one of several", async () => {
    expect(await verifyWebhook(SECRET, signed(body), body, NOW)).toEqual({ ok: true });
    const h = signed(body);
    h.set("webhook-signature", `v1,bm90LWl0 ${h.get("webhook-signature")}`);
    expect((await verifyWebhook(SECRET, h, body, NOW)).ok).toBe(true);
  });

  it("refuses a changed body, a wrong secret, missing headers or a stale timestamp", async () => {
    expect(await verifyWebhook(SECRET, signed(body), body + " ", NOW)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
    const other = signed(body, { secret: Buffer.from("another-secret") });
    expect((await verifyWebhook(SECRET, other, body, NOW)).ok).toBe(false);
    expect((await verifyWebhook(SECRET, new Headers(), body, NOW)).ok).toBe(false);
    expect(await verifyWebhook(SECRET, signed(body, { ts: NOW - 301 }), body, NOW)).toEqual({
      ok: false,
      reason: "stale",
    });
    expect((await verifyWebhook(SECRET, signed(body, { ts: NOW + 299 }), body, NOW)).ok).toBe(true);
  });
});

describe("Dodo webhook endpoint", () => {
  const post = (body: string, headers: Headers) =>
    new Request("https://example.test/api/billing/dodo-webhook", {
      method: "POST",
      headers,
      body,
    });

  it("records a verified subscription event once and acknowledges it", async () => {
    const record = vi.fn().mockResolvedValue("applied");
    const body = JSON.stringify(event("subscription.active"));
    const res = await handleDodoWebhook(post(body, signed(body)), {
      secret: SECRET,
      env: ENV,
      record,
      now: NOW,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, outcome: "applied" });
    expect(record).toHaveBeenCalledWith(
      "msg_1",
      "subscription.active",
      expect.objectContaining({ subscription_id: "sub_1", plan: "team", customer_id: "cus_1" }),
    );
  });

  it("acknowledges events it does not use without a subscription row", async () => {
    const record = vi.fn().mockResolvedValue("ignored");
    const body = JSON.stringify(event("payment.succeeded"));
    const res = await handleDodoWebhook(post(body, signed(body)), {
      secret: SECRET,
      env: ENV,
      record,
      now: NOW,
    });
    expect(res.status).toBe(200);
    expect(record).toHaveBeenCalledWith("msg_1", "payment.succeeded", null);
  });

  it("changes nothing for unsigned, malformed or unconfigured requests", async () => {
    const record = vi.fn();
    const body = JSON.stringify(event("subscription.active"));
    const deps = { secret: SECRET, env: ENV, record, now: NOW };
    expect((await handleDodoWebhook(post(body, new Headers()), deps)).status).toBe(401);
    const bad = "{not json";
    expect((await handleDodoWebhook(post(bad, signed(bad)), deps)).status).toBe(400);
    const res = await handleDodoWebhook(post(body, signed(body)), { ...deps, secret: undefined });
    expect(res.status).toBe(503);
    expect(record).not.toHaveBeenCalled();
  });

  it("asks Dodo to retry when the event cannot be stored", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const body = JSON.stringify(event("subscription.renewed"));
    const res = await handleDodoWebhook(post(body, signed(body)), {
      secret: SECRET,
      env: ENV,
      record: () => Promise.reject(new Error("db down")),
      now: NOW,
    });
    expect(res.status).toBe(500);
  });
});

describe("billing status line", () => {
  const status = {
    plan: "team" as const,
    status: "active",
    renewsOn: "2027-01-15T00:00:00Z",
    cancelAtPeriodEnd: false,
    canManage: true,
    checkout: {
      team: { monthly: true, annual: true },
      business: { monthly: false, annual: true },
    },
  };

  it("says the plan and what happens next", () => {
    expect(describeBilling({ ...status, plan: "free" })).toBe("You are on the Free plan.");
    expect(describeBilling(status)).toMatch(/^You are on the Team plan; it renews on /);
    expect(describeBilling({ ...status, cancelAtPeriodEnd: true })).toMatch(/will not renew/);
    expect(describeBilling({ ...status, status: "past_due" })).toMatch(/payment failed/);
  });
});
