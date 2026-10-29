import { afterEach, describe, expect, it } from "vitest";
import { firstActivation, isActivated } from "@/features/governance/activation";
import { blankState, initialState } from "@/features/governance/store";

// Workspace activation (src/features/governance/activation.ts): a saved private workspace with
// at least three triaged AI systems, counted once per workspace per browser.

const triaged = (n: number) => {
  const state = blankState();
  const system = { ...initialState().systems[0]!, riskTriage: { assessedAt: "x" } as never };
  return { ...state, systems: Array.from({ length: n }, () => ({ ...system })) };
};

afterEach(() => localStorage.clear());

describe("workspace activation", () => {
  it("needs three triaged systems in a private workspace", () => {
    expect(isActivated(triaged(2))).toBe(false);
    expect(isActivated(triaged(3))).toBe(true);
    expect(isActivated({ ...triaged(3), workspaceMode: "sample" })).toBe(false);
    const untriaged = blankState();
    expect(isActivated({ ...untriaged, systems: initialState().systems })).toBe(false);
  });

  it("is reported once per workspace", () => {
    expect(firstActivation("ws-1", triaged(3))).toBe(true);
    expect(firstActivation("ws-1", triaged(4))).toBe(false);
    expect(firstActivation("ws-2", triaged(3))).toBe(true);
    expect(firstActivation("ws-3", triaged(1))).toBe(false);
  });
});
