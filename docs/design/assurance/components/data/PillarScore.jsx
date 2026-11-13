import React from "react";
export function PillarScore({ letter, name, fn, score, target, tone }) {
  const t = tone || (score < target - 20 ? "--status-gap-ink" : score < target ? "--status-partial-ink" : "--status-effective-ink");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) 40px", gap: 12, alignItems: "center" }}>
      <span style={{ font: "600 22px/1 var(--font-display)", color: "var(--brand)" }}>{letter}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ font: "var(--text-label)", color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <span style={{ font: "var(--text-overline)", letterSpacing: "var(--tracking-overline)", color: "var(--text-subtle)", textTransform: "uppercase" }}>{fn}</span>
        </div>
        <div style={{ position: "relative", height: 6, background: "var(--viz-track)", borderRadius: 1 }}>
          <div style={{ width: `${score}%`, height: "100%", background: `var(${t})`, borderRadius: 1 }} />
          <div title={`Target ${target}`} style={{ position: "absolute", left: `${target}%`, top: -4, width: 2, height: 14, background: "var(--viz-target)" }} />
        </div>
      </div>
      <span style={{ font: "600 18px/1 var(--font-display)", color: `var(${t})`, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </div>
  );
}
