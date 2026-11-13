import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Assurance primitives (docs/design/assurance/README.md §2): status and risk-tier labels.
// Every status is a word, never a colour alone, so screen readers and monochrome prints keep
// the meaning.

/** Audit status of a control, a system or a gate (README: "Audit status"). */
export type StatusTone = "effective" | "partial" | "gap" | "untested" | "info" | "attested";

export const STATUS_WORDS: Record<StatusTone, string> = {
  effective: "Effective",
  partial: "Partial",
  gap: "Gap",
  untested: "Not tested",
  info: "In review",
  attested: "Attested",
};

const STATUS_CLASSES: Record<StatusTone, string> = {
  effective: "bg-success-surface text-success-ink",
  partial: "bg-warning-surface text-warning-ink",
  gap: "bg-danger-surface text-danger-ink",
  untested: "bg-neutral-surface text-muted-foreground",
  info: "bg-info-surface text-info-ink",
  attested: "bg-seal-surface text-seal-ink",
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  /** The label; the status word when omitted. */
  children?: ReactNode;
}

/** Dot + sentence-case word on the status surface. */
export function StatusBadge({ tone = "untested", children, className, ...rest }: StatusBadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-badge px-2 text-xs font-medium leading-none",
        STATUS_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children ?? STATUS_WORDS[tone]}
    </span>
  );
}

/** EU AI Act tier, as the inventory records it. */
export type RiskTier = "Prohibited" | "High-risk" | "Limited" | "Minimal";

const TIER_CLASSES: Record<RiskTier, string> = {
  Prohibited: "bg-risk-prohibited-surface text-risk-prohibited-ink",
  "High-risk": "bg-risk-high-surface text-risk-high-ink",
  Limited: "bg-risk-limited-surface text-risk-limited-ink",
  Minimal: "bg-risk-minimal-surface text-risk-minimal-ink",
};

export function isRiskTier(value: unknown): value is RiskTier {
  return (
    value === "Prohibited" || value === "High-risk" || value === "Limited" || value === "Minimal"
  );
}

export interface RiskTierTagProps extends HTMLAttributes<HTMLSpanElement> {
  tier: RiskTier | string;
  children?: ReactNode;
}

/** Mono uppercase tier label; unknown tiers fall back to the minimal surface. */
export function RiskTierTag({ tier, children, className, ...rest }: RiskTierTagProps) {
  const known = isRiskTier(tier) ? tier : "Minimal";
  return (
    <span
      data-tier={tier}
      className={cn(
        "inline-flex h-[22px] items-center whitespace-nowrap rounded-badge px-2 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.1em]",
        TIER_CLASSES[known],
        className,
      )}
      {...rest}
    >
      {children ?? tier}
    </span>
  );
}
