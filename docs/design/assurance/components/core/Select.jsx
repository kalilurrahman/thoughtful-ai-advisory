import React from "react";
export function Select({ label, options = [], value, onChange, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, ...style }}>
      {label && <span style={{ font: "var(--text-label)", color: "var(--text-strong)" }}>{label}</span>}
      <select value={value} onChange={(e) => onChange && onChange(e.target.value)} style={{ height: "var(--control-height-md)", minHeight: "var(--touch-target)", padding: "0 32px 0 12px", border: "1px solid var(--border-input)", borderRadius: "var(--radius-sm)", background: "var(--surface-card)", color: "var(--text-strong)", font: "var(--text-body-md)" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
