import React from "react";
export function AppSidebar({ groups = [], active, onSelect, collapsed, org = "Acme Health" }) {
  return (
    <nav style={{ width: collapsed ? "var(--sidebar-rail)" : "var(--sidebar-width)", flexShrink: 0, background: "var(--surface-nav)", color: "var(--text-inverse)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "18px 0" : "18px 20px", justifyContent: collapsed ? "center" : "flex-start", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <img src="assets/veritrail-shield.svg" alt="" style={{ width: 26, height: 26 }} />
        {!collapsed && <span style={{ font: "600 16px/1 var(--font-display)", letterSpacing: "0.2em" }}>VERITRAIL</span>}
      </div>
      {groups.map((g) => (
        <div key={g.label} style={{ padding: collapsed ? "12px 10px" : "14px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {!collapsed && <span style={{ font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", color: "var(--text-inverse-muted)", padding: "0 10px 6px", textTransform: "uppercase" }}>{g.label}</span>}
          {g.items.map((it) => {
            const on = it.id === active;
            return (
              <button key={it.id} title={it.label} onClick={() => onSelect && onSelect(it.id)} style={{ display: "flex", alignItems: "center", gap: 12, height: 40, padding: collapsed ? 0 : "0 10px", justifyContent: collapsed ? "center" : "flex-start", border: 0, borderRadius: "var(--radius-sm)", background: on ? "var(--surface-nav-active)" : "transparent", boxShadow: on ? "inset 2px 0 0 var(--teal-300)" : "none", color: on ? "#fff" : "var(--text-inverse-muted)", font: "500 14px/1 var(--font-sans)", cursor: "pointer", textAlign: "left" }}>
                <i className={`ph ph-${it.icon}`} style={{ fontSize: 19 }} />
                {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
                {!collapsed && it.count != null && <span style={{ font: "var(--text-code)", fontSize: 11, color: it.alert ? "#ff8fb4" : "var(--text-inverse-muted)" }}>{it.count}</span>}
              </button>
            );
          })}
        </div>
      ))}
      {!collapsed && <div style={{ marginTop: "auto", padding: 20, borderTop: "1px solid rgba(255,255,255,0.07)", font: "var(--text-caption)", color: "var(--text-inverse-muted)" }}>{org}</div>}
    </nav>
  );
}
