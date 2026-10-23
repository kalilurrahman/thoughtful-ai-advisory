import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GovernanceContext } from "@/features/governance/context";
import { ExportScreen } from "@/features/governance/screens-resources";
import { initialState } from "@/features/governance/store";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("export page download flow", () => {
  it("generates a preview file and allows downloading it again", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const state = initialState();
    render(
      <GovernanceContext.Provider
        value={{
          state,
          dispatch: vi.fn(),
          userId: null,
          workspaceId: null,
          workspaceName: "Acme Health",
          setWorkspace: vi.fn(),
        }}
      >
        <ExportScreen />
      </GovernanceContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));
    expect(await screen.findByText(/Preview ready/)).toBeInTheDocument();
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(screen.getByText(/VERITRAIL_Executive-one-pager_Acme-Health\.pdf/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Download again" }));
    expect(click).toHaveBeenCalledTimes(2);
  });
});
