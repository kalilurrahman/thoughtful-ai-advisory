import React from "react";
import { Badge } from "../core/Badge.jsx";
export function ControlRow({ code, text, weight, owner, status = "untested", statusLabel, evidence, refs = [], onClick, selected }) {
  return (
    <div onClick={onClick} style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr) auto", gap: 14, alignItems: "start", padding: "14px 16px", borderBottom: "1px solid var(--border-hairline)", background: selected ? "var(--surface-selected)" : "transparent", boxShadow: selected ? "inset 3px 0 0 var(--brand)" : "none", cursor: onClick ? "pointer" : undefined }}>
      <span style={{ font: "var(--text-code)", color: "var(--brand)", paddingTop: 2 }}>{code}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span style={{ font: "500 14px/1.45 var(--font-sans)", color: "var(--text-strong)" }}>{text}</span>
        <span style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", font: "var(--text-caption)", color: "var(--text-muted)" }}>
          {weight && <span>{weight}</span>}{owner && <span>{owner}</span>}{evidence && <span>Evidence · {evidence}</span>}
          {refs.slice(0, 2).map((r) => <span key={r} style={{ font: "var(--text-code)", fontSize: 11 }}>{r}</span>)}
        </span>
      </div>
      <Badge tone={status}>{statusLabel || status}</Badge>
    </div>
  );
}
