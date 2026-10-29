// Standard Webhooks signature check (https://www.standardwebhooks.com), as Dodo Payments signs
// its webhooks, using Web Crypto so it runs on Cloudflare Workers without a dependency. Matches
// the reference `standardwebhooks` package: HMAC-SHA256 over "<id>.<timestamp>.<raw body>" with
// the base64 secret after its "whsec_" prefix, a space-separated "v1,<base64>" signature list
// and a five-minute timestamp tolerance either way.

export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export type WebhookCheck =
  | { ok: true }
  | { ok: false; reason: "missing-headers" | "bad-timestamp" | "stale" | "bad-signature" };

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Constant-time comparison of two strings of possibly different lengths. */
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function signWebhook(
  secret: string,
  id: string,
  timestamp: number,
  body: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secret.startsWith("whsec_") ? secret.slice(6) : secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  return `v1,${bytesToBase64(mac)}`;
}

export async function verifyWebhook(
  secret: string,
  headers: Headers,
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<WebhookCheck> {
  const id = headers.get("webhook-id");
  const signatures = headers.get("webhook-signature");
  const timestampHeader = headers.get("webhook-timestamp");
  if (!id || !signatures || !timestampHeader) return { ok: false, reason: "missing-headers" };
  const timestamp = Number.parseInt(timestampHeader, 10);
  if (Number.isNaN(timestamp)) return { ok: false, reason: "bad-timestamp" };
  if (Math.abs(nowSeconds - timestamp) > WEBHOOK_TOLERANCE_SECONDS)
    return { ok: false, reason: "stale" };
  const expected = (await signWebhook(secret, id, timestamp, body)).slice(3);
  for (const versioned of signatures.split(" ")) {
    const [version, signature] = versioned.split(",");
    if (version === "v1" && signature && timingSafeEqual(signature, expected)) return { ok: true };
  }
  return { ok: false, reason: "bad-signature" };
}
