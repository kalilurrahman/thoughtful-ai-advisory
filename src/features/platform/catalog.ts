// The AEGIS Platform console: every Python-only capability of platform/ and the
// browser or server-function port that runs it on the hosted site.

export interface PlatformTool {
  slug: string;
  title: string;
  summary: string;
  /** Python modules / scripts this replaces on the hosted site. */
  python: string[];
  /** Where it runs once hosted. */
  runtime: "browser" | "server" | "browser + server";
  /** Sign-in required (admin console). */
  restricted?: boolean;
}

export const PLATFORM_TOOLS: PlatformTool[] = [
  {
    slug: "agent",
    title: "AEGIS Agent console",
    summary:
      "The governance copilot with viewer, assessor, approver and admin roles: guided use-case assessments, gap registers, readiness reports, approvals with separation of duties and a tamper-evident audit log.",
    python: [
      "app/agent/aegis_agent/*",
      "python3 -m aegis_agent",
      "aegis_agent.sample_run",
    ],
    runtime: "browser",
  },
  {
    slug: "policy-simulator",
    title: "Runtime policy simulator",
    summary:
      "Evaluate prompts, responses and agent tool calls against AEGIS policy packs or your own policy-as-code, across rollout modes and the kill switch.",
    python: ["app/policy-engine/aegis_policy/*", "python3 -m aegis_shield"],
    runtime: "browser",
  },
  {
    slug: "pilot-rehearsal",
    title: "Pilot dress rehearsal",
    summary:
      "Run the synthetic Pilot A rehearsal end to end — registration, tiering approvals, deep dives, gaps, remediation, runtime policies and an approval-gated evidence export.",
    python: ["scripts/pilot_dry_run.py"],
    runtime: "browser",
  },
  {
    slug: "roi-calculator",
    title: "ROI calculator",
    summary: "Model the governance ROI hypotheses from the commercial kit with your own inputs.",
    python: ["content/commercial/roi_calculator.py"],
    runtime: "browser",
  },
  {
    slug: "samples",
    title: "Sample reports",
    summary:
      "Regenerate the synthetic maturity, risk-tier and Runtime Shield sample reports with the browser engines and download them as Markdown, JSON or PDF.",
    python: ["scripts/generate_samples.py", "app/reports/aegis_reports/*"],
    runtime: "browser",
  },
  {
    slug: "content-checks",
    title: "Content checks",
    summary:
      "Run the content-integrity and prohibited-claim checks over the governed content bundled into this site.",
    python: ["scripts/check_content.py", "scripts/check_website_pages.py"],
    runtime: "browser",
  },
  {
    slug: "admin",
    title: "Admin console",
    summary:
      "Leads, tags and CSV export, the assessment funnel, and audit-chain verification for exported logs.",
    python: ["app/admin/aegis_admin/cli.py", "app/api/aegis_api/*"],
    runtime: "browser + server",
    restricted: true,
  },
];

export function getPlatformTool(slug: string): PlatformTool | undefined {
  return PLATFORM_TOOLS.find((t) => t.slug === slug);
}
