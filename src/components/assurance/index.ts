// VERITRAIL Assurance primitives (docs/design/assurance). Styled with Tailwind classes on the
// tokens in src/styles.css only, so they follow every palette, light and dark.
export { StatusBadge, RiskTierTag, STATUS_WORDS, isRiskTier } from "./status-badge";
export type { StatusTone, RiskTier } from "./status-badge";
export { KpiTile } from "./kpi-tile";
export type { KpiTileProps, Tone } from "./kpi-tile";
export { PillarScore, pillarTone } from "./pillar-score";
export { ControlRow } from "./control-row";
export { GateBanner, gateState } from "./gate-banner";
export type { GateState } from "./gate-banner";
export { PageHeader } from "./page-header";
export { FilterTabs } from "./filter-tabs";
export type { FilterTabItem } from "./filter-tabs";
export { EvidenceTimeline, formatUtc } from "./evidence-timeline";
export type { TrailEntry } from "./evidence-timeline";
export { ResponsiveDrawer, usePhoneLayout } from "./responsive-drawer";
export { RouteLink } from "./route-link";
