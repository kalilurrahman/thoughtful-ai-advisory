import { lazy, type ComponentType } from "react";
import { siteConfig } from "../content";
import { SiteLink } from "../ui";
import { ToolPendingArt } from "../illustrations-tools";

// Interactive tools mounted by the tool page template, keyed by front-matter `tool`.
// Each tool (and its engine) loads only on its own page, so other pages stay light.

function ToolPending() {
  const demo = siteConfig.ctas["demo"];
  return (
    <div className="notice notice--info">
      <ToolPendingArt />
      <h3>This tool is being enabled</h3>
      <p>
        The interactive version of this tool is not available yet. Nothing you enter on this page is
        stored.
      </p>
      {demo && (
        <p>
          <SiteLink className="btn btn-secondary" href={demo.url}>
            {demo.label}
          </SiteLink>
        </p>
      )}
    </div>
  );
}

export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  "maturity-assessment": lazy(() =>
    import("./maturity-assessment").then((m) => ({ default: m.MaturityAssessmentTool })),
  ),
  "guardrail-generator": lazy(() =>
    import("./guardrail-generator").then((m) => ({ default: m.GuardrailGeneratorTool })),
  ),
  "ask-veritrail": lazy(() =>
    import("./ask-veritrail").then((m) => ({ default: m.AskVeritrailTool })),
  ),
  "risk-triage": lazy(() => import("./risk-triage").then((m) => ({ default: m.RiskTriageTool }))),
};
