import { describe, expect, it } from "vitest";
import { aiIncidentListSchema } from "@/features/governance/incident-schema";
import { initialState, reducer, type AIIncident } from "@/features/governance/store";
import { filterIncidents } from "@/features/governance/incident-filters";

const sample: AIIncident = {
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

describe("AI incident register", () => {
  it("defaults missing incident data for pre-migration workspace snapshots", () => {
    expect(aiIncidentListSchema.parse(undefined)).toEqual([]);
  });

  it("validates incident dates, severity, identifiers and bounded text", () => {
    expect(aiIncidentListSchema.parse([sample])).toEqual([sample]);
    expect(aiIncidentListSchema.safeParse([{ ...sample, detectedAt: "yesterday" }]).success).toBe(
      false,
    );
    expect(aiIncidentListSchema.safeParse([{ ...sample, severity: "Urgent" }]).success).toBe(false);
    expect(aiIncidentListSchema.safeParse([{ ...sample, title: " " }]).success).toBe(false);
  });

  it("backfills an initial lifecycle event for older incident records", () => {
    const { statusHistory: _history, ...olderRecord } = sample;
    const backfilled = aiIncidentListSchema.parse([olderRecord])[0];
    if (!backfilled) throw new Error("Backfilled incident record is missing");
    expect(backfilled.statusHistory).toEqual([
      { status: "Open", changedAt: "2026-10-20T00:00:00.000Z" },
    ]);
  });

  it("adds new incidents and updates lifecycle state without replacing other records", () => {
    const another = { ...sample, id: "bf27f610-1ba8-4f36-b2b5-1b33d60dcb62", title: "Near miss" };
    const withFirst = reducer(initialState(), { type: "incident", incident: sample });
    const withBoth = reducer(withFirst, { type: "incident", incident: another });
    expect(withBoth.incidents.map((incident) => incident.id)).toEqual([another.id, sample.id]);
    const updated = reducer(withBoth, {
      type: "update-incident",
      incident: { ...sample, status: "Contained" },
      changedAt: "2026-10-20T10:00:00.000Z",
    });
    const changed = updated.incidents.find((incident) => incident.id === sample.id);
    expect(changed?.status).toBe("Contained");
    expect(changed?.statusHistory).toEqual([
      ...sample.statusHistory,
      { status: "Contained", changedAt: "2026-10-20T10:00:00.000Z" },
    ]);
    expect(updated.incidents).toHaveLength(2);
  });

  it("does not append duplicate timeline events when a status is unchanged", () => {
    const state = reducer(initialState(), { type: "incident", incident: sample });
    const updated = reducer(state, {
      type: "update-incident",
      incident: sample,
      changedAt: "2026-10-20T10:00:00.000Z",
    });
    const firstIncident = updated.incidents[0];
    if (!firstIncident) throw new Error("Updated incident record is missing");
    expect(firstIncident.statusHistory).toEqual(sample.statusHistory);
  });

  it("updates response ownership and notes without changing lifecycle history", () => {
    const state = reducer(initialState(), { type: "incident", incident: sample });
    const updated = reducer(state, {
      type: "edit-incident",
      incident: { ...sample, owner: "Security lead", response: "Model access suspended." },
    });
    expect(updated.incidents[0]).toMatchObject({
      owner: "Security lead",
      response: "Model access suspended.",
      statusHistory: sample.statusHistory,
    });
  });

  it("combines status, severity, system and case-insensitive text filters", () => {
    const second = {
      ...sample,
      id: "bf27f610-1ba8-4f36-b2b5-1b33d60dcb62",
      title: "Service interruption",
      system: "Claims model",
      severity: "Critical" as const,
      category: "Availability",
      status: "Contained" as const,
    };
    expect(
      filterIncidents([sample, second], {
        status: "Active",
        severity: "Critical",
        system: "Claims model",
        search: "  claims  ",
      }),
    ).toEqual([second]);
    expect(
      filterIncidents([sample, second], {
        status: "Resolved",
        severity: "All severities",
        system: "All systems",
        search: "no match",
      }),
    ).toEqual([]);
  });
});
