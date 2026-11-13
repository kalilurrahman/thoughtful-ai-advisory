import React from "react";
const MAP = { blocked: ["--status-gap-ink", "--status-gap-bg", "Blocked"], conditional: ["--status-partial-ink", "--status-partial-bg", "Conditional"], ready: ["--status-effective-ink", "--status-effective-bg", "Ready to release"] };
export function GateBanner({ state = "blocked", context, title, detail, action }) {
  const [ink, bg, word] = MAP[state];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "16px 20px", background: `var(${bg})`, border: `1px solid color-mix(in oklab, var(${ink}) 30%, transparent)`, borderRadius: "var(--radius-md)" }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: `var(${ink})`, boxShadow: `0 0 0 4px color-mix(in oklab, var(${ink}) 18%, transparent)` }} />
      <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 4 }}>
        {context && <span style={{ font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", textTransform: "uppercase", color: `var(${ink})` }}>{context}</span>}
        <span style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--text-strong)" }}>{title || word}</span>
        {detail && <span style={{ font: "var(--text-caption)", color: "var(--text-body)" }}>{detail}</span>}
      </div>
      {action}
    </div>
  );
}
