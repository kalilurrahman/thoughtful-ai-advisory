export const GOVERNANCE_GAMES = [
  {
    id: "incident-tabletop",
    title: "Incident tabletop",
    category: "Operational readiness",
    description:
      "Practice containment, coordinated escalation, and safe recovery in a fictional incident.",
    anchor: "incident-tabletop",
  },
  {
    id: "framework-crosswalk",
    title: "Framework crosswalk",
    category: "Framework fluency",
    description:
      "Match governance activities to NIST AI RMF, ISO/IEC 42001, and EU AI Act concepts.",
    anchor: "framework-crosswalk",
  },
  {
    id: "supplier-assurance",
    title: "Supplier assurance challenge",
    category: "Third-party assurance",
    description:
      "Practice evidence-led AI vendor due diligence, data handling, and exit readiness.",
    anchor: "supplier-assurance",
  },
  {
    id: "guardrail-assurance",
    title: "Guardrail assurance challenge",
    category: "Guardrails & assurance",
    description:
      "Choose proportionate guardrails and assurance evidence for different AI risk tiers and scenarios.",
    anchor: "guardrail-assurance",
  },
  {
    id: "monitoring-assurance",
    title: "Monitoring & assurance signals",
    category: "Assurance & monitoring",
    description:
      "Interpret monitoring signals, guardrail drift/breaches, and evidence gaps to choose sound assurance actions.",
    anchor: "monitoring-assurance",
  },
  {
    id: "release-gate-assurance",
    title: "Release gate & assurance readiness",
    category: "Governance gates & assurance",
    description:
      "Practice go/no-go decisions, conditional approvals, evidence/guardrail readiness, and change-triggered reassessment.",
    anchor: "release-gate-assurance",
  },
  {
    id: "corrective-action-assurance",
    title: "Corrective action & effectiveness",
    category: "Corrective actions & assurance",
    description:
      "Practice owned corrective actions, completion evidence, effectiveness verification, and follow-up when fixes fail.",
    anchor: "corrective-action-assurance",
  },
  {
    id: "risk-acceptance-assurance",
    title: "Risk acceptance & decision assurance",
    category: "Governance decisions & assurance",
    description:
      "Practice accountable approvals, time-bound risk acceptance, review triggers, and evidence-backed rationale/conditions.",
    anchor: "risk-acceptance-assurance",
  },
  {
    id: "inclusive-design",
    title: "Inclusive design challenge",
    category: "Responsible AI",
    description:
      "Identify evaluation, accessibility, and recourse gaps that affect people and oversight.",
    anchor: "inclusive-design",
  },
  {
    id: "evidence-detective",
    title: "Evidence detective",
    category: "Assurance evidence",
    description:
      "Judge whether governance evidence is weak, partial, or decision-grade for assurance.",
    anchor: "evidence-detective",
  },
  {
    id: "red-team-defender",
    title: "AI red-team / defender challenge",
    category: "Security & guardrails",
    description:
      "Defend against prompt injection, data exfiltration, and unsafe tool-use scenarios.",
    anchor: "red-team-defender",
  },
  {
    id: "change-impact",
    title: "Change-impact challenge",
    category: "Governance change control",
    description:
      "Map material AI changes to the governance areas that require review before implementation.",
    anchor: "change-impact",
  },
] as const;
