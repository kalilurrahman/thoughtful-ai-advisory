import { describe, expect, it } from "vitest";
import { saveStatusText, shouldAutosave, snapshotKey } from "@/features/governance/autosave-model";
import { blankState } from "@/features/governance/store";
import { isConflict } from "@/features/governance/workspace.functions";

// Autosave rules (src/features/governance/autosave-model.ts) and conflict detection.

const ready = {
  userId: "u1",
  workspaceId: "w1",
  role: "operator" as const,
  status: "saved" as const,
  dirty: true,
};

describe("autosave", () => {
  it("saves a changed, saved workspace for editors only", () => {
    expect(shouldAutosave(ready)).toBe(true);
    expect(shouldAutosave({ ...ready, dirty: false })).toBe(false);
    expect(shouldAutosave({ ...ready, workspaceId: null })).toBe(false);
    expect(shouldAutosave({ ...ready, userId: null })).toBe(false);
    expect(shouldAutosave({ ...ready, role: "viewer" })).toBe(false);
    expect(shouldAutosave({ ...ready, role: "approver" })).toBe(false);
    expect(shouldAutosave({ ...ready, status: "saving" })).toBe(false);
  });

  it("stops after a conflict until the workspace is restored", () => {
    expect(shouldAutosave({ ...ready, status: "conflict" })).toBe(false);
    expect(saveStatusText("conflict", true)).toMatch(/Someone else saved/);
    expect(isConflict({ code: "40001" })).toBe(true);
    expect(isConflict({ code: "PGRST202" })).toBe(false);
    expect(isConflict(null)).toBe(false);
  });

  it("ignores navigation-only changes when deciding what is unsaved", () => {
    const s = blankState();
    expect(snapshotKey({ ...s, qi: 5 }, "Acme")).toBe(snapshotKey(s, "Acme"));
    expect(snapshotKey(s, "Acme")).not.toBe(snapshotKey(s, "Acme Ltd"));
    expect(snapshotKey({ ...s, tier: "Low" }, "Acme")).not.toBe(snapshotKey(s, "Acme"));
  });

  it("says plainly whether changes are saved", () => {
    expect(saveStatusText("saved", false)).toBe("All changes saved.");
    expect(saveStatusText("saved", true)).toBe("Unsaved changes");
    expect(saveStatusText("error", true)).toMatch(/still on this screen/);
    expect(saveStatusText("idle", false)).toBe("");
  });
});
