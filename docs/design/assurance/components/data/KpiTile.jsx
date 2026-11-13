import React from "react";
export function KpiTile({ value, unit, label, tone = "--brand", icon, delta }) {
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderTop: `3px solid var(${tone})`, borderRadius: "var(--radius-md)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ font: "600 var(--size-kpi)/1 var(--font-display)", color: `var(${tone})`, fontVariantNumeric: "tabular-nums" }}>{value}{unit && <span style={{ fontSize: "0.45em", color: "var(--text-muted)", marginLeft: 2 }}>{unit}</span>}</span>
        {icon && <span style={{ color: `var(${tone})`, fontSize: 20 }}>{icon}</span>}
      </div>
      <span style={{ font: "var(--text-label)", color: "var(--text-body)" }}>{label}</span>
      {delta && <span style={{ font: "var(--text-code)", fontSize: 11, color: "var(--text-muted)" }}>{delta}</span>}
    </div>
  );
}
