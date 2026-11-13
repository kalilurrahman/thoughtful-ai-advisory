import { cn } from "@/lib/utils";
import { type StatusTone } from "./status-badge";

export interface TrailEntry {
  id: string;
  /** What happened ("IS11 scored 3 · Evidence attached"). */
  title: string;
  /** Who recorded it. */
  who: string;
  /** What it refers to (a control code, a system name, a pack hash). */
  ref?: string | undefined;
  /** ISO 8601 instant. */
  at: string;
  outcome?: StatusTone | undefined;
}

const DOT: Record<StatusTone, string> = {
  effective: "bg-success-ink",
  partial: "bg-warning-ink",
  gap: "bg-danger-ink",
  untested: "bg-muted-foreground",
  info: "bg-info-ink",
  attested: "bg-seal",
};

/** "2026-11-13 14:05 UTC" from an ISO instant; the raw value when it does not parse. */
export function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

export interface EvidenceTimelineProps {
  entries: TrailEntry[];
  /** Shown when there are no entries. */
  empty?: string | undefined;
  className?: string | undefined;
}

/** Append-only trail: newest first, dot coloured by outcome, mono UTC timestamp, "who · ref". */
export function EvidenceTimeline({
  entries,
  empty = "Nothing recorded yet.",
  className,
}: EvidenceTimelineProps) {
  if (entries.length === 0)
    return <p className={cn("text-sm text-muted-foreground", className)}>{empty}</p>;
  return (
    <ol className={cn("m-0 list-none p-0", className)}>
      {entries.map((e) => (
        <li
          key={e.id}
          data-outcome={e.outcome ?? "info"}
          className="relative grid grid-cols-[14px_minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-row-rule py-3 last:border-b-0"
        >
          <span
            aria-hidden="true"
            className={cn("mt-1.5 size-2.5 rounded-full", DOT[e.outcome ?? "info"])}
          />
          <span className="text-sm font-medium leading-[1.45] text-foreground">{e.title}</span>
          <time
            dateTime={e.at}
            className="shrink-0 font-mono text-[11px] font-medium leading-[1.35] text-muted-foreground"
          >
            {formatUtc(e.at)}
          </time>
          <span className="col-start-2 col-end-4 text-xs leading-[1.45] text-muted-foreground">
            {e.who}
            {e.ref && <> · {e.ref}</>}
          </span>
        </li>
      ))}
    </ol>
  );
}
