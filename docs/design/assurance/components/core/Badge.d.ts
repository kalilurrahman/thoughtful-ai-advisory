import * as React from "react";
/** Status or risk-tier label. kind="status" shows dot + sentence case; kind="tier" shows mono uppercase. */
export interface BadgeProps {
  tone?: "effective" | "partial" | "gap" | "untested" | "info" | "attested" | "prohibited" | "high" | "limited" | "minimal";
  kind?: "status" | "tier";
  children: React.ReactNode;
}
export function Badge(props: BadgeProps): JSX.Element;
