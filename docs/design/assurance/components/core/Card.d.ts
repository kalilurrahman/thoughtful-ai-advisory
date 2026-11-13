import * as React from "react";
/** Surface container. accent = a CSS var name (e.g. "--status-gap-ink") drawn as a 3px top rule. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { accent?: string; padding?: number | string; interactive?: boolean; }
export function Card(props: CardProps): JSX.Element;
