import React from "react";
export function TextField({ label, hint, error, iconLeft, id, style, ...rest }) {
  const fid = id || (label ? label.toLowerCase().replace(/\W+/g, "-") : undefined);
  return (
    <label htmlFor={fid} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, ...style }}>
      {label && <span style={{ font: "var(--text-label)", color: "var(--text-strong)" }}>{label}</span>}
      <span style={{ display: "flex", alignItems: "center", gap: 8, height: "var(--control-height-md)", minHeight: "var(--touch-target)", padding: "0 12px", background: "var(--surface-card)", border: `1px solid var(${error ? "--status-gap-ink" : "--border-input"})`, borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}>
        {iconLeft}
        <input id={fid} {...rest} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", font: "var(--text-body-md)", color: "var(--text-strong)" }} />
      </span>
      {(error || hint) && <span style={{ font: "var(--text-caption)", color: error ? "var(--status-gap-ink)" : "var(--text-muted)" }}>{error || hint}</span>}
    </label>
  );
}
