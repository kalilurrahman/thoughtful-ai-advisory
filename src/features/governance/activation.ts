import type { GovernanceState } from "./store";

// Activation: the first time a private workspace is saved with at least three AI systems that
// have a risk triage. Recorded as the existing `tool_use` event (tool "workspace", milestone
// "activated"), like install outcomes reuse `cta_click`, so the analytics allow-list stays in
// parity with the Python platform. Counted once per workspace per browser.

export const ACTIVATION_SYSTEMS = 3;

export function isActivated(state: Pick<GovernanceState, "systems" | "workspaceMode">): boolean {
  return (
    state.workspaceMode === "personal" &&
    state.systems.filter((s) => s.riskTriage).length >= ACTIVATION_SYSTEMS
  );
}

const key = (workspaceId: string) => `veritrail-activated-${workspaceId}`;

/** True the first time this workspace is seen activated in this browser. */
export function firstActivation(
  workspaceId: string,
  state: Pick<GovernanceState, "systems" | "workspaceMode">,
): boolean {
  if (!isActivated(state)) return false;
  try {
    if (localStorage.getItem(key(workspaceId))) return false;
    localStorage.setItem(key(workspaceId), "1");
    return true;
  } catch {
    return false;
  }
}
