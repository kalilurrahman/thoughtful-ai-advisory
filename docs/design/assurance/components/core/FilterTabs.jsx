import React from "react";
export function FilterTabs({ items = [], value, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-sunken)", borderRadius: "var(--radius-sm)", overflowX: "auto", maxWidth: "100%" }}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button key={it.id} role="tab" aria-selected={on} onClick={() => onChange && onChange(it.id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 12px", border: 0, borderRadius: "var(--radius-xs)", background: on ? "var(--surface-card)" : "transparent", boxShadow: on ? "var(--shadow-1)" : "none", color: on ? "var(--text-strong)" : "var(--text-muted)", font: "500 13px/1 var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>
            {it.label}{it.count != null && <span style={{ font: "var(--text-code)", fontSize: 11, color: on ? "var(--brand)" : "var(--text-subtle)" }}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
