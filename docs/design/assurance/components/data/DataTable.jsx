import React from "react";
export function DataTable({ columns = [], rows = [], onRowClick, stacked }) {
  if (stacked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} onClick={() => onRowClick && onRowClick(r)} style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 14, display: "grid", gap: 8 }}>
            {columns.map((c) => (
              <div key={c.key} style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: 10 }}>
                <span style={{ font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", color: "var(--text-subtle)", textTransform: "uppercase" }}>{c.label}</span>
                <span style={{ font: "var(--text-label)", fontWeight: 400, color: "var(--text-strong)" }}>{c.render ? c.render(r) : r[c.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "auto", background: "var(--surface-card)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", font: "var(--text-label)", fontWeight: 400 }}>
        <thead><tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.align || "left", padding: "10px 14px", font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-default)", position: "sticky", top: 0, whiteSpace: "nowrap" }}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} onClick={() => onRowClick && onRowClick(r)} style={{ cursor: onRowClick ? "pointer" : undefined }}>{columns.map((c) => <td key={c.key} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-hairline)", color: "var(--text-strong)", textAlign: c.align || "left", fontVariantNumeric: "tabular-nums" }}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
