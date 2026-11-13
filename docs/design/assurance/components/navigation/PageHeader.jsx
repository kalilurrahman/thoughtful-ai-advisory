import React from "react";
export function PageHeader({ eyebrow, title, meta = [], actions }) {
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {eyebrow && <span style={{ font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", color: "var(--text-muted)", textTransform: "uppercase" }}>{eyebrow}</span>}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <h1 style={{ margin: 0, font: "var(--text-h1)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)" }}>{title}</h1>
        {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{actions}</div>}
      </div>
      <div style={{ borderBottom: "var(--rule-double)" }} />
      {meta.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", color: "var(--text-muted)", textTransform: "uppercase" }}>{meta.map((m) => <span key={m}>{m}</span>)}</div>}
    </header>
  );
}
