// Tamper-evident (hash-chained), append-only audit log — a browser port of
// platform/app/common/veritrail_common/audit.py. Each record carries the SHA-256 of the
// previous record, so verify() detects modification, deletion or reordering. This is
// tamper EVIDENCE, not tamper PROOF. Records must only ever hold redacted payloads.

export const GENESIS = "0".repeat(64);

export interface AuditRecord {
  id: string;
  ts: string;
  trace_id: string;
  actor: string;
  action: string;
  resource: string | null;
  outcome: string;
  details: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}

// ------------------------------------------------------------------ SHA-256 (sync)

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** Synchronous SHA-256 of a UTF-8 string, as lowercase hex (same as hashlib.sha256().hexdigest()). */
export function sha256Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  view.setUint32(padded.length - 4, bitLen >>> 0);
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15] ?? 0;
      const b = w[i - 2] ?? 0;
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      w[i] = ((w[i - 16] ?? 0) + s0 + (w[i - 7] ?? 0) + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = [h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + (K[i] ?? 0) + (w[i] ?? 0)) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0]! + a) >>> 0;
    h[1] = (h[1]! + b) >>> 0;
    h[2] = (h[2]! + c) >>> 0;
    h[3] = (h[3]! + d) >>> 0;
    h[4] = (h[4]! + e) >>> 0;
    h[5] = (h[5]! + f) >>> 0;
    h[6] = (h[6]! + g) >>> 0;
    h[7] = (h[7]! + hh) >>> 0;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, "0")).join("");
}

// ------------------------------------------------------------------ canonical JSON

function escapeString(s: string): string {
  // json.dumps(ensure_ascii=False): escape quotes, backslashes and control characters only.
  // eslint-disable-next-line no-control-regex -- json.dumps escapes control characters
  return `"${s.replace(/[\\"\u0000-\u001f]/g, (ch) => {
    switch (ch) {
      case '"':
        return '\\"';
      case "\\":
        return "\\\\";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\t":
        return "\\t";
      case "\b":
        return "\\b";
      case "\f":
        return "\\f";
      default:
        return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
    }
  })}"`;
}

/** json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False). */
export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return escapeString(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${escapeString(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return escapeString(String(value));
}

// ------------------------------------------------------------------ ids

/** Sortable-ish unique id: <prefix>_<ms timestamp base36><random hex> (veritrail_common.ids.new_id). */
export function newId(prefix: string): string {
  const rand = new Uint8Array(4);
  globalThis.crypto.getRandomValues(rand);
  return `${prefix}_${Date.now().toString(36)}${Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// ------------------------------------------------------------------ log

export function recordHash(rec: Omit<AuditRecord, "hash">): string {
  return sha256Hex(canonicalJson(rec));
}

export class AuditLog {
  readonly records: AuditRecord[];

  constructor(records: AuditRecord[] = []) {
    this.records = [...records];
  }

  get lastHash(): string {
    return this.records.at(-1)?.hash ?? GENESIS;
  }

  append(
    action: string,
    actor: string,
    details: Record<string, unknown> = {},
    opts: { traceId?: string; resource?: string | null; outcome?: string; ts?: string } = {},
  ): AuditRecord {
    const body: Omit<AuditRecord, "hash"> = {
      id: newId("aud"),
      ts: opts.ts ?? new Date().toISOString(),
      trace_id: opts.traceId ?? newId("trc"),
      actor,
      action,
      resource: opts.resource ?? null,
      outcome: opts.outcome ?? "success",
      details,
      prev_hash: this.lastHash,
    };
    const rec: AuditRecord = { ...body, hash: recordHash(body) };
    this.records.push(rec);
    return rec;
  }

  verify(): { ok: boolean; message: string } {
    return verifyChain(this.records as unknown as Array<Record<string, unknown>>);
  }

  query(filter: { action?: string; traceId?: string; resource?: string } = {}): AuditRecord[] {
    return this.records.filter(
      (r) =>
        (!filter.action || r.action === filter.action) &&
        (!filter.traceId || r.trace_id === filter.traceId) &&
        (!filter.resource || r.resource === filter.resource),
    );
  }

  /** One canonical JSON record per line, the same format as the Python JSONL logs. */
  toJsonl(): string {
    return this.records.map((r) => canonicalJson(r)).join("\n") + (this.records.length ? "\n" : "");
  }

  static fromJsonl(text: string): AuditLog {
    const recs = text
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as AuditRecord);
    return new AuditLog(recs);
  }
}

/** AuditLog.verify() — works on records produced by either the Python or the browser log. */
export function verifyChain(records: Array<Record<string, unknown>>): { ok: boolean; message: string } {
  let prev = GENESIS;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i] ?? {};
    if (rec["prev_hash"] !== prev) {
      return { ok: false, message: `chain broken at record ${i} (${String(rec["id"])}): prev_hash mismatch` };
    }
    const body = Object.fromEntries(Object.entries(rec).filter(([k]) => k !== "hash"));
    if (sha256Hex(canonicalJson(body)) !== rec["hash"]) {
      return { ok: false, message: `record ${i} (${String(rec["id"])}) content hash mismatch` };
    }
    prev = String(rec["hash"]);
  }
  return { ok: true, message: "ok" };
}
