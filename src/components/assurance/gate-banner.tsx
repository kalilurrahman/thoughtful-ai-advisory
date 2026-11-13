import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RouteLink } from "./route-link";

export type GateState = "blocked" | "conditional" | "ready";

const GATE: Record<GateState, { word: string; box: string; dot: string; ink: string }> = {
  blocked: {
    word: "Blocked",
    box: "bg-danger-surface border-danger-ink/30",
    dot: "bg-danger-ink shadow-[0_0_0_4px_color-mix(in_oklab,var(--danger-ink)_18%,transparent)]",
    ink: "text-danger-ink",
  },
  conditional: {
    word: "Conditional",
    box: "bg-warning-surface border-warning-ink/30",
    dot: "bg-warning-ink shadow-[0_0_0_4px_color-mix(in_oklab,var(--warning-ink)_18%,transparent)]",
    ink: "text-warning-ink",
  },
  ready: {
    word: "Ready to release",
    box: "bg-success-surface border-success-ink/30",
    dot: "bg-success-ink shadow-[0_0_0_4px_color-mix(in_oklab,var(--success-ink)_18%,transparent)]",
    ink: "text-success-ink",
  },
};

/** The workspace gate words (model.ts) mapped to banner states. */
export function gateState(gate: string): GateState {
  return gate === "Cleared" ? "ready" : gate === "Conditional" ? "conditional" : "blocked";
}

export interface GateBannerProps {
  state?: GateState;
  context?: string;
  title?: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  /** Route the whole banner links to (the release-readiness screen). */
  to?: string;
  className?: string;
}

/** Full-width release-gate verdict: 10px dot with a halo, overline context, title and detail. */
export function GateBanner({
  state = "blocked",
  context,
  title,
  detail,
  action,
  to,
  className,
}: GateBannerProps) {
  const g = GATE[state];
  const inner = (
    <>
      <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", g.dot)} />
      <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
        {context && (
          <span
            className={cn(
              "font-mono text-[11px] font-medium uppercase leading-[1.3] tracking-[0.1em]",
              g.ink,
            )}
          >
            {context}
          </span>
        )}
        <span className="text-base font-semibold leading-[1.3] text-foreground">
          {title ?? g.word}
        </span>
        {detail && <span className="text-xs leading-[1.45] text-card-foreground">{detail}</span>}
      </span>
      {action}
    </>
  );
  const box = cn(
    "flex w-full flex-wrap items-center gap-4 rounded-card border px-5 py-4 text-left",
    g.box,
    className,
  );
  if (to)
    return (
      <RouteLink
        to={to}
        data-gate={state}
        className={cn(
          box,
          "no-underline transition-colors duration-200 hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {inner}
      </RouteLink>
    );
  return (
    <div role="status" data-gate={state} className={box}>
      {inner}
    </div>
  );
}
