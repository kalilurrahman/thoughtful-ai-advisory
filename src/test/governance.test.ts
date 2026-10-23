import { describe, it, expect } from "vitest";
import { CONTROLS, CALCS } from "@/data/governance";
import {
  defaultAnswers,
  effectiveScore,
  pillarScores,
  indexScore,
  maturityBand,
  gateFloor,
  gateStatus,
  blockingControls,
  gapPriority,
  gapPhase,
  gapPoints,
  classify,
  defaultGuardrails,
  guardrailCoverage,
  calculate,
  at,
} from "@/features/governance/model";
describe("VERITRAIL supplied governance rules", () => {
  it("caps maturity 3 and 4 at 2 unless evidence is verified", () => {
    expect(effectiveScore({ s: 3, e: 2 })).toBe(2);
    expect(effectiveScore({ s: 4, e: 1 })).toBe(2);
    expect(effectiveScore({ s: 4, e: 3 })).toBe(4);
  });
  it("computes the supplied pillar percentages and VERITRAIL index", () => {
    const scores = pillarScores(defaultAnswers());
    expect(scores).toEqual([63, 63, 50, 50, 50, 38]);
    expect(indexScore(scores)).toBe(52);
  });
  it("uses the exact maturity band boundaries", () => {
    expect([29, 30, 49, 50, 69, 70, 84, 85].map(maturityBand)).toEqual([
      "Nascent",
      "Emerging",
      "Emerging",
      "Established",
      "Established",
      "Managed",
      "Managed",
      "Optimized",
    ]);
  });
  it("uses 70,55,40 gate floors and zero/one/two failures", () => {
    expect(["High", "Medium", "Low"].map((t) => gateFloor(t as "High" | "Medium" | "Low"))).toEqual(
      [70, 55, 40],
    );
    expect(gateStatus([80, 80, 80, 70, 70, 70], "High")).toBe("Cleared");
    expect(gateStatus([80, 80, 80, 69, 70, 70], "High")).toBe("Conditional");
    expect(gateStatus([80, 80, 80, 69, 69, 70], "High")).toBe("Blocked");
  });
  it("blocks critical low scores and unverified managed scores", () => {
    const a = defaultAnswers();
    a["G1"] = { s: 3, e: 2 };
    expect(blockingControls(a).map((c) => c.id)).toEqual(["G1", "R1", "N1"]);
  });
  it("uses raw gaps with Critical3 and High risk1.5", () => {
    expect(gapPriority(at(CONTROLS, 8), { s: 1, e: 0 }, "High")).toBe(13.5);
    expect(gapPoints({ s: 1, e: 0 })).toBe(75);
  });
  it("assigns low effort critical to phase1, other critical phase2, others phase3", () => {
    expect(gapPhase({ w: "Critical", effort: "Low" })).toBe(0);
    expect(gapPhase({ w: "Critical", effort: "High" })).toBe(1);
    expect(gapPhase({ w: "High", effort: "Low" })).toBe(2);
  });
  it("classifies prohibited first then high limited and minimal", () => {
    expect(classify([true, true, true, true])).toBe("Prohibited");
    expect(classify([true, true, false, false])).toBe("High-risk");
    expect(classify([false, true, false, false])).toBe("Limited");
    expect(classify([false, false, true, false])).toBe("Limited");
    expect(classify([false, false, false, false])).toBe("Minimal");
  });
  it("requires all21 at High,18 at Medium and6 at Low with default ranks2+ enabled", () => {
    const gr = defaultGuardrails();
    expect(guardrailCoverage(gr, "High")).toEqual({ required: 21, enabled: 18, percent: 86 });
    expect(guardrailCoverage(gr, "Medium")).toEqual({ required: 18, enabled: 18, percent: 100 });
    expect(guardrailCoverage(gr, "Low")).toEqual({ required: 6, enabled: 6, percent: 100 });
  });
  for (const [id, result] of [
    ["cost", 4058880],
    ["token", 13721.4],
    ["risk", 42],
    ["compliance", 27],
  ] as const) {
    it("calculates " + id + " with the supplied defaults", () => {
      const calc = CALCS.find((c) => c.id === id);
      if (!calc) throw new Error("Missing calculator");
      const values = Object.fromEntries(calc.inputs.map((i) => [i.k, i.v]));
      expect(calculate(id, values, [63, 63, 50, 50, 50, 38], 86).raw).toBe(result);
    });
  }
});
