import * as React from "react";
/** Release-gate verdict banner. */
export interface GateBannerProps { state?: "blocked" | "conditional" | "ready"; context?: string; title?: string; detail?: string; action?: React.ReactNode; }
export function GateBanner(props: GateBannerProps): JSX.Element;
