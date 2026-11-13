import React from "react";
const TONES = {
  effective: ["--status-effective-ink", "--status-effective-bg"], partial: ["--status-partial-ink", "--status-partial-bg"],
  gap: ["--status-gap-ink", "--status-gap-bg"], untested: ["--status-untested-ink", "--status-untested-bg"],
  info: ["--status-info-ink", "--status-info-bg"], attested: ["--seal-ink", "--seal-soft"],
  prohibited: ["--risk-prohibited-ink", "--risk-prohibited-bg"], high: ["--risk-high-ink", "--risk-high-bg"],
  limited: ["--risk-limited-ink", "--risk-limited-bg"], minimal: ["--risk-minimal-ink", "--risk-minimal-bg"],
};
export function Badge({ tone = "untested", kind = "status", children }) {
  const [ink, bg] = TONES[tone] || TONES.untested;
  const tier = kind === "tier";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 8px", borderRadius: "var(--radius-xs)", background: `var(${bg})`, color: `var(${ink})`, font: tier ? "var(--text-overline)" : "500 12px/1 var(--font-sans)", letterSpacing: tier ? "var(--tracking-overline)" : 0, textTransform: tier ? "uppercase" : "none", whiteSpace: "nowrap" }}>
      {!tier && <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />}
      {children}
    </span>
  );
}
