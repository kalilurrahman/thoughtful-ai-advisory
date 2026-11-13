import * as React from "react";
/** Serif page title over the signature double ledger rule, with mono meta line. */
export interface PageHeaderProps { eyebrow?: string; title: string; meta?: string[]; actions?: React.ReactNode; }
export function PageHeader(props: PageHeaderProps): JSX.Element;
