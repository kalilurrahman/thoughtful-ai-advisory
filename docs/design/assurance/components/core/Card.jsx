import React from "react";
export function Card({ accent, padding = 20, interactive, children, style, ...rest }) {
  return (
    <div {...rest} style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderTop: accent ? `3px solid var(${accent})` : undefined, borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-1)", padding, cursor: interactive ? "pointer" : undefined, transition: "border-color var(--dur-fast) var(--ease-standard)", minWidth: 0, ...style }}>
      {children}
    </div>
  );
}
