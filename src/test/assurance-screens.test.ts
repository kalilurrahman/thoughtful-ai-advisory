import { afterEach, describe, expect, it } from "vitest";
import { controlStatus, isCapped } from "@/features/governance/model";
import { clearTrail, getTrail, recordTrail, trailActor } from "@/features/governance/trail-store";

// Phase 4 of the Assurance uplift: the audit status of a control follows the real scoring rules
// in model.ts, and the evidence trail is an in-memory, append-only preview.

describe("controlStatus", () => {
  it("is Not tested for an untouched control", () => {
    expect(controlStatus({ s: 0, e: 0 })).toBe("untested");
  });

  it("is Attested only for a 3 or 4 with evidence attached", () => {
    expect(controlStatus({ s: 3, e: 3 })).toBe("attested");
    expect(controlStatus({ s: 4, e: 3 })).toBe("attested");
    expect(controlStatus({ s: 4, e: 2 })).not.toBe("attested");
  });

  it("caps a 3 or 4 without evidence to Partial, and says so", () => {
    expect(controlStatus({ s: 4, e: 1 })).toBe("partial");
    expect(isCapped({ s: 4, e: 1 })).toBe(true);
    expect(isCapped({ s: 2, e: 1 })).toBe(false);
    expect(isCapped({ s: 3, e: 3 })).toBe(false);
  });

  it("is Partial for a 2 and a Gap below that", () => {
    expect(controlStatus({ s: 2, e: 0 })).toBe("partial");
    expect(controlStatus({ s: 2, e: 3 })).toBe("partial");
    expect(controlStatus({ s: 1, e: 3 })).toBe("gap");
    expect(controlStatus({ s: 0, e: 1 })).toBe("gap");
  });
});

describe("evidence trail (preview)", () => {
  afterEach(clearTrail);

  it("appends newest first with a UTC instant and a sequential id", () => {
    const a = recordTrail({
      title: "T1 scored 3 · Managed",
      who: "Demo reviewer",
      ref: "T1",
      outcome: "attested",
    });
    const b = recordTrail({
      title: "T1 evidence · Partial",
      who: "Demo reviewer",
      ref: "T1",
      outcome: "partial",
    });
    expect(getTrail().map((e) => e.id)).toEqual([b.id, a.id]);
    expect(a.id).not.toBe(b.id);
    expect(new Date(a.at).toISOString()).toBe(a.at);
  });

  it("keeps an explicit instant and is cleared on demand", () => {
    recordTrail({ title: "x", who: "y", outcome: "info", at: "2026-11-13T14:05:00.000Z" });
    expect(getTrail()[0]?.at).toBe("2026-11-13T14:05:00.000Z");
    clearTrail();
    expect(getTrail()).toEqual([]);
  });

  it("names the demo reviewer when nobody is signed in", () => {
    expect(trailActor(null)).toBe("Demo reviewer");
    expect(trailActor("user-1")).toBe("Signed-in member");
  });
});
