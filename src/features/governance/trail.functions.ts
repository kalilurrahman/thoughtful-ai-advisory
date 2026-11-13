import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The evidence trail of a saved workspace (migration 0015, table workspace_trail). Both
// functions run as the signed-in caller, so row-level security decides who reads and who
// appends; there is no update or delete. Before the migration is applied the table is missing
// and the client keeps the trail in the browser tab as a preview.

export const TRAIL_OUTCOMES = [
  "effective",
  "partial",
  "gap",
  "untested",
  "info",
  "attested",
] as const;
export const TRAIL_LIMIT = 200;

export const trailEntryInput = z.object({
  who: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(400),
  ref: z.string().trim().max(200).optional(),
  outcome: z.enum(TRAIL_OUTCOMES),
  /** When the client recorded it; the database keeps its own recorded_at as well. */
  at: z.string().datetime({ offset: true }),
});

export const appendTrailInput = z.object({
  organizationId: z.string().uuid(),
  entries: z.array(trailEntryInput).min(1).max(50),
});

export const loadTrailInput = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(TRAIL_LIMIT).optional(),
});

export interface StoredTrailEntry {
  id: string;
  who: string;
  title: string;
  ref?: string | undefined;
  outcome: (typeof TRAIL_OUTCOMES)[number];
  at: string;
}

interface TrailRow {
  id: number | string;
  who: string;
  title: string;
  ref: string | null;
  outcome: string;
  recorded_at: string;
}

/** PostgREST: the table does not exist yet (migration 0015 not applied). */
export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export type TrailResult =
  { ok: true; entries: StoredTrailEntry[] } | { ok: false; reason: "unavailable" | "forbidden" };

// workspace_trail (migration 0015) is newer than the generated Supabase types.
interface TrailClient {
  from(table: "workspace_trail"): {
    insert(rows: object[]): {
      select(
        columns: string,
      ): Promise<{ data: TrailRow[] | null; error: { code?: string } | null }>;
    };
    select(columns: string): {
      eq(
        column: "organization_id",
        value: string,
      ): {
        order(
          column: "id",
          opts: { ascending: boolean },
        ): {
          limit(n: number): Promise<{ data: TrailRow[] | null; error: { code?: string } | null }>;
        };
      };
    };
  };
}

export function rowToEntry(row: TrailRow): StoredTrailEntry {
  const outcome = (TRAIL_OUTCOMES as readonly string[]).includes(row.outcome)
    ? (row.outcome as StoredTrailEntry["outcome"])
    : "info";
  return {
    id: `trail-${row.id}`,
    who: row.who,
    title: row.title,
    ref: row.ref ?? undefined,
    outcome,
    at: row.recorded_at,
  };
}

function failure(error: { code?: string } | null): TrailResult {
  return { ok: false, reason: isMissingTable(error) ? "unavailable" : "forbidden" };
}

/** Append entries to a workspace's trail; RLS refuses members who cannot edit. */
export const appendTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(appendTrailInput)
  .handler(async ({ data, context }): Promise<TrailResult> => {
    const client = context.supabase as unknown as TrailClient;
    const rows = data.entries.map((e) => ({
      organization_id: data.organizationId,
      actor_id: context.userId,
      who: e.who,
      title: e.title,
      ref: e.ref ?? null,
      outcome: e.outcome,
      recorded_at: e.at,
    }));
    const { data: inserted, error } = await client
      .from("workspace_trail")
      .insert(rows)
      .select("id,who,title,ref,outcome,recorded_at");
    if (error) return failure(error);
    return { ok: true, entries: (inserted ?? []).map(rowToEntry).reverse() };
  });

/** The newest entries of a workspace's trail, newest first. */
export const loadTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(loadTrailInput)
  .handler(async ({ data, context }): Promise<TrailResult> => {
    const client = context.supabase as unknown as TrailClient;
    const { data: rows, error } = await client
      .from("workspace_trail")
      .select("id,who,title,ref,outcome,recorded_at")
      .eq("organization_id", data.organizationId)
      .order("id", { ascending: false })
      .limit(data.limit ?? TRAIL_LIMIT);
    if (error) return failure(error);
    return { ok: true, entries: (rows ?? []).map(rowToEntry) };
  });
