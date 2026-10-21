import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GovernanceContext } from "@/features/governance/context";
import { IncidentsScreen } from "@/features/governance/screens-incidents";
import { initialState, type AIIncident } from "@/features/governance/store";

const incident: AIIncident = {
  id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
  title: "Unexpected sensitive output",
  system: "Support assistant",
  severity: "High",
  category: "Privacy or data exposure",
  status: "Open",
  detectedAt: "2026-10-20",
  owner: "Privacy lead",
  summary: "A test response contained information outside the expected scope.",
  response: "Access paused while the issue is investigated.",
  statusHistory: [{ status: "Open", changedAt: "2026-10-20T00:00:00.000Z" }],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderIncidents(incidents: AIIncident[] = []) {
  const dispatch = vi.fn();
  const state = { ...initialState(), incidents };
  render(
    <GovernanceContext.Provider
      value={{
        state,
        dispatch,
        userId: null,
        workspaceId: null,
        workspaceName: "Demo workspace",
        setWorkspace: vi.fn(),
      }}
    >
      <IncidentsScreen />
    </GovernanceContext.Provider>,
  );
  return dispatch;
}

describe("AI incident register interface", () => {
  it("validates and dispatches a new incident from the intake form", () => {
    vi.stubGlobal("crypto", { randomUUID: () => incident.id });
    const dispatch = renderIncidents();
    fireEvent.click(screen.getByText("Log an incident or near miss"));
    fireEvent.change(screen.getByLabelText("Incident title"), {
      target: { value: incident.title },
    });
    fireEvent.change(screen.getByLabelText("Initial summary"), {
      target: { value: incident.summary },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save incident" }));

    expect(dispatch).toHaveBeenCalledWith({
      type: "incident",
      incident: expect.objectContaining({
        id: incident.id,
        title: incident.title,
        summary: incident.summary,
        status: "Open",
        statusHistory: expect.arrayContaining([expect.objectContaining({ status: "Open" })]),
      }),
    });
  });

  it("dispatches lifecycle changes for an existing incident", () => {
    const dispatch = renderIncidents([incident]);
    fireEvent.change(screen.getByLabelText("Status for Unexpected sensitive output"), {
      target: { value: "Contained" },
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "update-incident",
      incident: { ...incident, status: "Contained" },
      changedAt: expect.any(String),
    });
  });

  it("filters by severity and search text", () => {
    renderIncidents([
      incident,
      {
        ...incident,
        id: "bf27f610-1ba8-4f36-b2b5-1b33d60dcb62",
        title: "Another event",
        severity: "Low",
      },
    ]);
    fireEvent.change(screen.getByLabelText("Filter incidents by severity"), {
      target: { value: "High" },
    });
    fireEvent.change(screen.getByLabelText("Search incidents"), {
      target: { value: "sensitive" },
    });
    expect(screen.getByText("Unexpected sensitive output")).toBeInTheDocument();
    expect(screen.queryByText("Another event")).not.toBeInTheDocument();
  });

  it("saves revised ownership and response notes for an incident", () => {
    const dispatch = renderIncidents([incident]);
    fireEvent.click(screen.getByText("Update ownership and response notes"));
    const ownerInput = screen.getAllByLabelText("Response owner")[1];
    if (!ownerInput) throw new Error("Second response owner input is missing");
    fireEvent.change(ownerInput, {
      target: { value: "Security lead" },
    });
    const notesInput = screen.getAllByLabelText("Containment and response notes")[1];
    if (!notesInput) throw new Error("Second response notes input is missing");
    fireEvent.change(notesInput, {
      target: { value: "Model access suspended." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save incident updates" }));
    expect(dispatch).toHaveBeenCalledWith({
      type: "edit-incident",
      incident: { ...incident, owner: "Security lead", response: "Model access suspended." },
    });
  });
});
