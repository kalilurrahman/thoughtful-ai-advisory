import * as React from "react";
/** Headline metric with a tone-coloured top rule. tone is a CSS var name.
 * @startingPoint section="Data" subtitle="KPI tiles, pillar scores, control rows" viewport="700x360" */
export interface KpiTileProps { value: React.ReactNode; unit?: string; label: string; tone?: string; icon?: React.ReactNode; delta?: string; }
export function KpiTile(props: KpiTileProps): JSX.Element;
