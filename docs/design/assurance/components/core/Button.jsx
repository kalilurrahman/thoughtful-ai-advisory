import React from "react";
const SIZES = { sm: { h: "var(--control-height-sm)", px: 12, fs: 13 }, md: { h: "var(--control-height-md)", px: 16, fs: 14 }, lg: { h: "var(--control-height-lg)", px: 22, fs: 15 } };
const VARIANTS = {
  primary: { background: "var(--brand)", color: "var(--text-on-brand)", border: "1px solid var(--brand)" },
  secondary: { background: "var(--surface-card)", color: "var(--brand)", border: "1px solid var(--border-strong)" },
  ghost: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent" },
  danger: { background: "var(--status-gap-ink)", color: "#fff", border: "1px solid var(--status-gap-ink)" },
  seal: { background: "var(--seal)", color: "#fff", border: "1px solid var(--seal)" },
};
export function Button({ variant = "primary", size = "md", iconLeft, iconRight, fullWidth, disabled, children, style, ...rest }) {
  const s = SIZES[size];
  return (
    <button disabled={disabled} {...rest} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: s.h, minHeight: size === "sm" ? undefined : "var(--touch-target)", padding: `0 ${s.px}px`, borderRadius: "var(--radius-sm)", font: `500 ${s.fs}px/1 var(--font-sans)`, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, width: fullWidth ? "100%" : undefined, transition: "background var(--dur-fast) var(--ease-standard)", whiteSpace: "nowrap", ...VARIANTS[variant], ...style }}>
      {iconLeft}{children}{iconRight}
    </button>
  );
}
