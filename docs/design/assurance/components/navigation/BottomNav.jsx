import React from "react";
export function BottomNav({ items = [], active, onSelect }) {
  return (
    <nav style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, height: "var(--bottomnav-height)", background: "var(--surface-card)", borderTop: "1px solid var(--border-default)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} onClick={() => onSelect && onSelect(it.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, border: 0, background: "transparent", color: on ? "var(--brand)" : "var(--text-muted)", font: "500 11px/1 var(--font-sans)", cursor: "pointer", position: "relative" }}>
            {on && <span style={{ position: "absolute", top: 0, width: 28, height: 2, background: "var(--brand)" }} />}
            <i className={`ph${on ? "-fill" : ""} ph-${it.icon}`} style={{ fontSize: 22 }} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
