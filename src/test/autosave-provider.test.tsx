import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankState } from "@/features/governance/store";

// Autosave in the governance provider: a saved team workspace is saved shortly after an edit,
// with the revision it was loaded at; a conflict stops autosave instead of overwriting.

const { load, save } = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/features/governance/workspace.functions", () => ({
  loadWorkspace: load,
  saveWorkspace: save,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

const { GovernanceProvider, useGovernance } = await import("@/features/governance/store");

function Editor() {
  const { state, dispatch, saveStatus } = useGovernance();
  return (
    <>
      <button onClick={() => dispatch({ type: "tier", tier: "Low" })}>tier {state.tier}</button>
      <output>{saveStatus}</output>
    </>
  );
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  load.mockResolvedValue({
    id: "ws-1",
    name: "Acme",
    role: "operator",
    revision: 4,
    state: { ...blankState(), tier: "High" },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("workspace autosave", () => {
  it("saves an edit after a pause, sending the loaded revision", async () => {
    save.mockResolvedValue({ ok: true, id: "ws-1", revision: 5 });
    render(
      <GovernanceProvider>
        <Editor />
      </GovernanceProvider>,
    );
    await settle();
    expect(screen.getByRole("button").textContent).toBe("tier High");
    await act(async () => vi.advanceTimersByTime(5000));
    expect(save).not.toHaveBeenCalled(); // nothing changed since loading

    fireEvent.click(screen.getByRole("button"));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(save).not.toHaveBeenCalled(); // still within the pause
    await act(async () => vi.advanceTimersByTime(2000));
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0].data).toMatchObject({ organizationId: "ws-1", revision: 4 });
    expect(screen.getByRole("status").textContent).toBe("saved");
  });

  it("stops autosaving after a conflict", async () => {
    save.mockResolvedValue({ ok: false, conflict: true });
    render(
      <GovernanceProvider>
        <Editor />
      </GovernanceProvider>,
    );
    await settle();
    fireEvent.click(screen.getByRole("button"));
    await act(async () => vi.advanceTimersByTime(3000));
    await settle();
    expect(screen.getByRole("status").textContent).toBe("conflict");
    await act(async () => vi.advanceTimersByTime(10000));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("never autosaves for a read-only role", async () => {
    load.mockResolvedValue({
      id: "ws-1",
      name: "Acme",
      role: "viewer",
      revision: 4,
      state: blankState(),
    });
    render(
      <GovernanceProvider>
        <Editor />
      </GovernanceProvider>,
    );
    await settle();
    fireEvent.click(screen.getByRole("button"));
    await act(async () => vi.advanceTimersByTime(10000));
    expect(save).not.toHaveBeenCalled();
  });
});
