import type { ComponentType } from "react";
import { siteConfig } from "../content";
import { SiteLink } from "../ui";
import { MaturityAssessmentTool } from "./maturity-assessment";

// Interactive tools mounted by the tool page template, keyed by front-matter `tool`.

function ToolPending() {
  const demo = siteConfig.ctas["demo"];
  return (
    <div className="notice notice--info">
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
  "maturity-assessment": MaturityAssessmentTool,
  "guardrail-generator": ToolPending,
  "ask-aegis": ToolPending,
  "risk-triage": ToolPending,
};
