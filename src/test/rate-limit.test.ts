import { afterEach, describe, expect, it, vi } from "vitest";

// Public server functions share server.py's per-client, per-endpoint limit
// (src/features/platform/rate-limit.server.ts): lead forms ("contact", "assessment") and
// analytics ("events") each allow VERITRAIL_RATE_LIMIT requests a minute per client.

let address = "203.0.113.9";
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: new Headers({ "cf-connecting-ip": address }) }),
}));

const { allowRequest, RATE_LIMITED } = await import("@/features/platform/rate-limit.server");

afterEach(() => {
  address = "203.0.113.9";
});

async function burst(bucket: string, n: number): Promise<boolean[]> {
  const out: boolean[] = [];
  for (let i = 0; i < n; i++) out.push(await allowRequest(bucket));
  return out;
}

describe("rate limit for public server functions", () => {
  it("allows 60 lead submissions a minute from one client, then refuses", async () => {
    const results = await burst("contact", 61);
    expect(results.slice(0, 60).every(Boolean)).toBe(true);
    expect(results[60]).toBe(false);
    expect(RATE_LIMITED).toBe("Too many requests. Please retry shortly.");
  });

  it("counts each endpoint and each client separately", async () => {
    expect(await allowRequest("assessment")).toBe(true);
    expect(await allowRequest("events")).toBe(true);
    address = "198.51.100.4";
    expect(await allowRequest("contact")).toBe(true);
  });
});
