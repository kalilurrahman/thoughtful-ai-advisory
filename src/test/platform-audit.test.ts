import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AuditLog,
  GENESIS,
  canonicalJson,
  sha256Hex,
  verifyChain,
} from "@/features/platform/audit";

const pythonLog = readFileSync(join(__dirname, "fixtures/python-audit-log.jsonl"), "utf8");

describe("audit chain", () => {
  it("computes SHA-256 like hashlib", () => {
    for (const s of ["", "abc", "naïve “quotes”", "x".repeat(1000)]) {
      expect(sha256Hex(s)).toBe(createHash("sha256").update(s, "utf8").digest("hex"));
    }
  });

  it("serialises canonical JSON like json.dumps(sort_keys, compact, ensure_ascii=False)", () => {
    expect(canonicalJson({ b: 1, a: [true, null, "é\n"] })).toBe('{"a":[true,null,"é\\n"],"b":1}');
  });

  it("verifies a log written by the Python AuditLog, line for line", () => {
    const log = AuditLog.fromJsonl(pythonLog);
    expect(log.records).toHaveLength(3);
    expect(log.verify()).toEqual({ ok: true, message: "ok" });
    expect(log.toJsonl()).toBe(pythonLog);
  });

  it("detects modification, deletion and reordering", () => {
    const recs = AuditLog.fromJsonl(pythonLog).records;
    const edited = recs.map((r, i) => (i === 1 ? { ...r, actor: "approver:Mallory" } : r));
    expect(verifyChain(edited as never).ok).toBe(false);
    expect(verifyChain([recs[0]!, recs[2]!] as never).message).toMatch(/chain broken at record 1/);
    expect(verifyChain([recs[1]!, recs[0]!] as never).ok).toBe(false);
  });

  it("appends records that continue the chain", () => {
    const log = AuditLog.fromJsonl(pythonLog);
    const rec = log.append("leads.export", "admin:Kai", { count: 2 });
    expect(rec.prev_hash).toBe(log.records[2]!.hash);
    expect(log.verify().ok).toBe(true);
    expect(new AuditLog().append("x", "y").prev_hash).toBe(GENESIS);
  });
});
