import React from "react";
export function TopBar({ org = "Acme Health", workspaceLabel = "Demo workspace", onSearch, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: "var(--topbar-height)", padding: "0 var(--gutter)", background: "color-mix(in oklab, var(--surface-canvas) 85%, transparent)", backdropFilter: "var(--blur-glass)", borderBottom: "1px solid var(--border-default)", position: "sticky", top: 0, zIndex: 5 }}>
      <button onClick={onSearch} style={{ flex: "1 1 auto", maxWidth: 440, display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--surface-card)", color: "var(--text-subtle)", font: "var(--text-label)", fontWeight: 400, cursor: "text", minWidth: 0 }}>
        <i className="ph ph-magnifying-glass" style={{ fontSize: 16 }} />
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>Search controls, systems, evidence…</span>
        <kbd style={{ font: "var(--text-code)", fontSize: 11, padding: "2px 5px", border: "1px solid var(--border-default)", borderRadius: 3 }}>⌘K</kbd>
      </button>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", color: "var(--text-muted)", textTransform: "uppercase" }}>{org}</span>
        <span style={{ font: "500 11px/1 var(--font-sans)", padding: "5px 8px", background: "var(--brand-soft)", color: "var(--brand-soft-ink)", borderRadius: "var(--radius-xs)" }}>{workspaceLabel}</span>
        {right}
      </div>
    </div>
  );
}
