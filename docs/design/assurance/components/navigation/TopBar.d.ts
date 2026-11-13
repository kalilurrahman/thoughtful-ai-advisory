import * as React from "react";
/** Sticky translucent workspace bar: ⌘K search, org, workspace chip. Must stay one row from 360px. */
export interface TopBarProps { org?: string; workspaceLabel?: string; onSearch?: () => void; right?: React.ReactNode; }
export function TopBar(props: TopBarProps): JSX.Element;
