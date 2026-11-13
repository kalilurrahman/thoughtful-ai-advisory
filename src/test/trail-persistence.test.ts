import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachTrailSink,
  clearTrail,
  getTrail,
  getTrailMode,
  recordTrail,
  type TrailEntry,
  type TrailSink,
} from "@/features/governance/trail-store";
import {
  appendTrailInput,
  isMissingTable,
  loadTrailInput,
  rowToEntry,
} from "@/features/governance/trail.functions";

// The evidence trail persists to workspace_trail (migration 0015) through a sink the provider
// attaches for a saved workspace; otherwise it is a tab-only preview.

const flush = () => new Promise((r) => setTimeout(r, 0));

function sink(overrides: Partial<TrailSink> = {}): TrailSink & { appended: TrailEntry[][] } {
  const appended: TrailEntry[][] = [];
  return {
    workspaceId: "11111111-1111-4111-8111-111111111111",
    appended,
    append: vi.fn(async (entries: TrailEntry[]) => {
      appended.push(entries);
      return entries.map((e, i) => ({ ...e, id: `trail-db-${appended.length}-${i}` }));
    }),
    load: vi.fn(async () => [
      {
        id: "trail-db-0",
        title: "Loaded from the workspace",
        who: "Signed-in member",
        at: "2026-11-13T10:00:00.000Z",
        outcome: "info" as const,
      },
    ]),
    ...overrides,
  };
}

describe("trail store with a workspace sink", () => {
  afterEach(clearTrail);

  it("is a preview until a sink hydrates it", async () => {
    expect(getTrailMode()).toBe("preview");
    const s = sink();
    await attachTrailSink(s);
    expect(s.load).toHaveBeenCalledOnce();
    expect(getTrailMode()).toBe("saved");
    expect(getTrail().map((e) => e.title)).toEqual(["Loaded from the workspace"]);
  });

  it("appends new entries through the sink and adopts the stored id", async () => {
    const s = sink();
    await attachTrailSink(s);
    const local = recordTrail({
      title: "T1 scored 3 · Managed",
      who: "Signed-in member",
      ref: "T1",
      outcome: "attested",
    });
    expect(getTrail()[0]?.id).toBe(local.id);
    await flush();
    expect(s.append).toHaveBeenCalledWith([local]);
    expect(getTrail()[0]?.id).toBe("trail-db-1-0");
    expect(getTrail()[0]?.title).toBe("T1 scored 3 · Managed");
    expect(getTrail()).toHaveLength(2);
  });

  it("stays a preview when the table is unavailable, keeping entries in the tab", async () => {
    const s = sink({ load: vi.fn(async () => null), append: vi.fn(async () => null) });
    await attachTrailSink(s);
    expect(getTrailMode()).toBe("preview");
    recordTrail({ title: "x", who: "y", outcome: "gap" });
    await flush();
    expect(getTrail()).toHaveLength(1);
    expect(getTrailMode()).toBe("preview");
  });

  it("detaches cleanly and ignores late results from an old workspace", async () => {
    let resolveLoad: (v: TrailEntry[]) => void = () => {};
    const slow = sink({ load: vi.fn(() => new Promise<TrailEntry[]>((r) => (resolveLoad = r))) });
    const pending = attachTrailSink(slow);
    await attachTrailSink(null);
    resolveLoad([
      { id: "late", title: "late", who: "w", at: "2026-01-01T00:00:00Z", outcome: "info" },
    ]);
    await pending;
    expect(getTrail()).toEqual([]);
    expect(getTrailMode()).toBe("preview");
  });
});

describe("trail server function inputs", () => {
  it("validates entries, outcomes and limits", () => {
    const ok = appendTrailInput.safeParse({
      organizationId: "11111111-1111-4111-8111-111111111111",
      entries: [
        {
          who: "Demo reviewer",
          title: "IS11 evidence · Attached",
          outcome: "attested",
          at: "2026-11-13T10:00:00.000Z",
        },
      ],
    });
    expect(ok.success).toBe(true);
    expect(appendTrailInput.safeParse({ organizationId: "nope", entries: [] }).success).toBe(false);
    expect(
      appendTrailInput.safeParse({
        organizationId: "11111111-1111-4111-8111-111111111111",
        entries: [{ who: "a", title: "b", outcome: "verified", at: "2026-11-13T10:00:00.000Z" }],
      }).success,
    ).toBe(false);
    expect(
      loadTrailInput.safeParse({
        organizationId: "11111111-1111-4111-8111-111111111111",
        limit: 500,
      }).success,
    ).toBe(false);
  });

  it("maps rows to entries and recognises a missing table", () => {
    expect(
      rowToEntry({
        id: 7,
        who: "w",
        title: "t",
        ref: null,
        outcome: "attested",
        recorded_at: "2026-11-13T10:00:00+00:00",
      }),
    ).toEqual({
      id: "trail-7",
      who: "w",
      title: "t",
      ref: undefined,
      outcome: "attested",
      at: "2026-11-13T10:00:00+00:00",
    });
    expect(
      rowToEntry({ id: 8, who: "w", title: "t", ref: "IS11", outcome: "odd", recorded_at: "x" })
        .outcome,
    ).toBe("info");
    expect(isMissingTable({ code: "42P01" })).toBe(true);
    expect(isMissingTable({ code: "PGRST205" })).toBe(true);
    expect(isMissingTable({ code: "42501" })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
});
