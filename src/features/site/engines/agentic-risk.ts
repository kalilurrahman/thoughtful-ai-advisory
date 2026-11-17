// Agentic AI risk checker — a browser-only readiness review of one AI agent across the seven
// areas the planned tool page promised (tool inventory, least privilege, high-impact actions,
// injection exposure, containment, limits, logging). Pure and deterministic: the tool component
// renders what this module returns, and src/test/site-agentic-risk.test.ts pins the behaviour.
//
// Every finding carries an evidence label. Nothing here is a security assessment or a
// certification: a "Yes" answer is the user's own assertion until evidence is reviewed.

import { WRITE_TOOL_HINTS } from "./risk-tier";

export type AreaAnswer = "yes" | "partial" | "no" | "";

export interface AgentProfile {
  name?: string;
  purpose?: string;
  /** suggests | acts_with_approval | acts_autonomously */
  autonomy?: string;
  /** "yes" | "no" | "" */
  external_actions?: string;
  /** "yes" | "no" | "" — reads web pages, email, documents or other untrusted content. */
  untrusted_input?: string;
  /** development | staging | production */
  environment?: string;
  tools?: string[];
  inventory?: AreaAnswer;
  least_privilege?: AreaAnswer;
  approvals?: AreaAnswer;
  injection_testing?: AreaAnswer;
  containment?: AreaAnswer;
  limits?: AreaAnswer;
  logging?: AreaAnswer;
}

export type AreaKey =
  | "inventory"
  | "least_privilege"
  | "approvals"
  | "injection_testing"
  | "containment"
  | "limits"
  | "logging";

export interface AreaDefinition {
  key: AreaKey;
  area: string;
  question: string;
  controls: string[];
  /** The action recommended when the answer is not "yes". */
  action: string;
}

export const AGENT_AREAS: readonly AreaDefinition[] = [
  {
    key: "inventory",
    area: "Tool inventory",
    question: "Is every tool, scope and data store the agent can reach listed in a registry?",
    controls: ["EI-07"],
    action: "Register the agent and every tool, scope and data store it can reach (EI-07).",
  },
  {
    key: "least_privilege",
    area: "Least privilege",
    question: "Is tool access default-deny and limited to the declared purpose?",
    controls: ["IS-11"],
    action: "Make tool access default-deny and scope each tool to the declared purpose (IS-11).",
  },
  {
    key: "approvals",
    area: "High-impact actions",
    question:
      "Do irreversible, external or financial operations require human approval before they run?",
    controls: ["IS-13"],
    action: "Gate irreversible, external and financial actions behind human approval (IS-13).",
  },
  {
    key: "injection_testing",
    area: "Injection exposure",
    question: "Has the agent been tested against prompt injection carried in untrusted content?",
    controls: ["IS-14", "IS-01"],
    action:
      "Threat-model the agent and test it against injected instructions in the content it reads (IS-14, IS-01).",
  },
  {
    key: "containment",
    area: "Containment",
    question: "Can the agent, a tool or a tenant be disabled quickly, and has that been tested?",
    controls: ["IS-15"],
    action:
      "Implement and rehearse a kill switch for the agent, each tool and each tenant (IS-15).",
  },
  {
    key: "limits",
    area: "Limits",
    question: "Are rate, token, tool-call and cost limits enforced at runtime?",
    controls: ["IS-16"],
    action: "Enforce rate, token, tool-call and spend limits with alerts on breach (IS-16).",
  },
  {
    key: "logging",
    area: "Logging",
    question: "Are tool calls and policy decisions logged tamper-evidently?",
    controls: ["SE-08"],
    action: "Log every tool call and policy decision to an append-only store (SE-08).",
  },
];

export type AreaStatus = "User-asserted" | "Inferred" | "Missing evidence" | "Critical gap";

export interface AreaFinding {
  key: AreaKey;
  area: string;
  answer: AreaAnswer;
  points: number;
  /** Areas that matter most for this agent's exposure; a "no" there is a critical gap. */
  critical: boolean;
  status: AreaStatus;
  controls: string[];
  action?: string;
}

export type AgentPosture =
  | "Ready for supervised operation"
  | "Needs controls before expansion"
  | "Not ready for autonomous operation";

export interface AgentRiskResult {
  name: string;
  score: number;
  max_score: number;
  readiness_pct: number;
  posture: AgentPosture;
  evidence_status: "Inferred";
  requires_human_confirmation: true;
  exposure: string[];
  write_capable_tools: string[];
  areas: AreaFinding[];
  critical_gaps: string[];
  missing_fields: string[];
  next_actions: string[];
  citation_ids: string[];
  rationale: string;
  method: string;
}

export const AGENTIC_RISK_METHOD =
  "VERITRAIL agentic risk check v1.0 (seven areas scored 0–2; critical areas depend on autonomy, external reach and untrusted input)";

const POINTS: Record<AreaAnswer, number> = { yes: 2, partial: 1, no: 0, "": 0 };

function isWriteCapable(tool: string): boolean {
  const t = tool.toLowerCase();
  return WRITE_TOOL_HINTS.some((h) => t.includes(h));
}

function criticalAreas(p: AgentProfile, writeTools: string[]): Set<AreaKey> {
  const set = new Set<AreaKey>();
  const autonomous = p.autonomy === "acts_autonomously";
  const external = p.external_actions === "yes";
  if (autonomous || external || writeTools.length > 0) {
    set.add("approvals");
    set.add("containment");
    set.add("least_privilege");
  }
  if (p.untrusted_input === "yes") set.add("injection_testing");
  if (autonomous && p.environment === "production") set.add("logging");
  return set;
}

/** Review one agent. The input is never mutated. */
export function checkAgentRisk(input: AgentProfile): AgentRiskResult {
  const p: AgentProfile = { ...input, tools: [...(input.tools ?? [])] };
  const writeTools = p.tools!.filter(isWriteCapable);
  const critical = criticalAreas(p, writeTools);

  const exposure: string[] = [];
  if (p.autonomy === "acts_autonomously") exposure.push("Acts without a human in the loop");
  else if (p.autonomy === "acts_with_approval") exposure.push("Acts after human approval");
  else if (p.autonomy === "suggests") exposure.push("Suggests actions only");
  if (p.external_actions === "yes") exposure.push("Can act outside the organisation");
  if (p.untrusted_input === "yes") exposure.push("Reads untrusted content");
  if (writeTools.length) exposure.push(`Write-capable tools: ${writeTools.join(", ")}`);
  if (p.environment === "production") exposure.push("Running in production");

  const areas: AreaFinding[] = AGENT_AREAS.map((def) => {
    const answer: AreaAnswer = (p[def.key] ?? "") as AreaAnswer;
    const points = POINTS[answer] ?? 0;
    const isCritical = critical.has(def.key);
    let status: AreaStatus;
    if (answer === "yes") status = "User-asserted";
    else if (answer === "partial") status = "Inferred";
    else if (isCritical) status = "Critical gap";
    else status = "Missing evidence";
    const finding: AreaFinding = {
      key: def.key,
      area: def.area,
      answer,
      points,
      critical: isCritical,
      status,
      controls: [...def.controls],
    };
    if (answer !== "yes") finding.action = def.action;
    return finding;
  });

  const score = areas.reduce((s, a) => s + a.points, 0);
  const max = AGENT_AREAS.length * 2;
  const readiness = Math.round((score / max) * 100);
  const criticalGaps = areas.filter((a) => a.status === "Critical gap").map((a) => a.area);
  const missing = areas.filter((a) => a.answer === "").map((a) => a.area);

  let posture: AgentPosture;
  if (criticalGaps.length) posture = "Not ready for autonomous operation";
  else if (readiness >= 75 && missing.length === 0) posture = "Ready for supervised operation";
  else posture = "Needs controls before expansion";

  // Critical gaps first, then the rest in area order.
  const nextActions = [
    ...areas.filter((a) => a.action && a.critical).map((a) => a.action!),
    ...areas.filter((a) => a.action && !a.critical).map((a) => a.action!),
  ];

  const cited = new Set<string>();
  for (const a of areas) for (const c of a.controls) cited.add(c);

  const rationale =
    `${readiness}% of the seven areas are covered (${score} of ${max} points). ` +
    (criticalGaps.length
      ? `Critical gaps for this agent's exposure: ${criticalGaps.join(", ")}. `
      : "No critical gap for this agent's exposure. ") +
    (missing.length ? `Unanswered: ${missing.join(", ")}. ` : "") +
    "Answers are user-asserted and the result is inferred; it requires human confirmation against evidence before the agent's posture is recorded.";

  return {
    name: p.name?.trim() || "Unnamed agent",
    score,
    max_score: max,
    readiness_pct: readiness,
    posture,
    evidence_status: "Inferred",
    requires_human_confirmation: true,
    exposure,
    write_capable_tools: writeTools,
    areas,
    critical_gaps: criticalGaps,
    missing_fields: missing,
    next_actions: nextActions,
    citation_ids: [...cited],
    rationale,
    method: AGENTIC_RISK_METHOD,
  };
}
