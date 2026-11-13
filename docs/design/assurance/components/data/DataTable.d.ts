import * as React from "react";
/** Register table. Pass stacked on phones (<640px): each row becomes a labelled card. */
export interface DataTableColumn { key: string; label: string; align?: "left" | "right" | "center"; render?: (row: any) => React.ReactNode; }
export interface DataTableProps { columns: DataTableColumn[]; rows: any[]; onRowClick?: (row: any) => void; stacked?: boolean; }
export function DataTable(props: DataTableProps): JSX.Element;
