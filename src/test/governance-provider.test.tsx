import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/features/governance/workspace.functions", () => ({
  loadWorkspace: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  } },
}));

import { GovernanceProvider, useGovernance } from "@/features/governance/store";

function Consumer() {
  const { state, dispatch } = useGovernance();
  return <button onClick={() => dispatch({ type: "question", qi: 5 })}>{state.qi}</button>;
}

afterEach(cleanup);
describe("Governance provider", () => {
  it("provides shared state and preserves it when consumers remount", () => {
    const view = render(<GovernanceProvider><Consumer key="first" /></GovernanceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    view.rerender(<GovernanceProvider><Consumer key="updated" /></GovernanceProvider>);
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
  });
});