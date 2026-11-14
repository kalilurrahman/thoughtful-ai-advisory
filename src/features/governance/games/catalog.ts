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
    id: "human-oversight-assurance",
    title: "Human oversight & escalation",
    category: "Oversight & assurance",
    description:
      "Practice meaningful human oversight, escalation/override paths, role competence, and evidence that controls operate in practice.",
    anchor: "human-oversight-assurance",
  },
  {
    id: "data-governance-assurance",
    title: "Data governance & privacy assurance",
    category: "Data & privacy assurance",
    description:
      "Practice data provenance/permissions, minimization and retention, sensitive-data guardrails, and evidence-backed response to data issues.",
    anchor: "data-governance-assurance",
  },
  {
    id: "transparency-recordkeeping-assurance",
    title: "Transparency & recordkeeping assurance",
    category: "Transparency & assurance",
    description:
      "Practice system documentation, user-facing transparency, traceable evidence trails, and versioned change history.",
    anchor: "transparency-recordkeeping-assurance",
  },
  {
    id: "supply-chain-assurance",
    title: "Third-party & supply-chain assurance",
    category: "Third-party & supply-chain assurance",
    description:
      "Practice vendor/model terms, fitness-for-use evidence, integration guardrails, and ongoing monitoring/exit readiness.",
    anchor: "supply-chain-assurance",
  },
  {
    id: "security-robustness-assurance",
    title: "Security, robustness & abuse resilience",
    category: "Security & robustness assurance",
    description:
      "Practice prompt-injection/tool-abuse defenses, least-privilege access, misuse/robustness testing, and security incident response.",
    anchor: "security-robustness-assurance",
  },
  {
    id: "fairness-impact-assurance",
    title: "Fairness, bias & impact assurance",
    category: "Fairness & impact assurance",
    description:
      "Practice impact/harms assessment, representative bias evaluation, mitigation/guardrails for disparate outcomes, and recourse/review.",
    anchor: "fairness-impact-assurance",
  },
  {
    id: "continuous-improvement-assurance",
    title: "Continuous improvement & assurance review",
    category: "Continuous assurance",
    description:
      "Practice periodic governance reviews, control effectiveness metrics, lessons learned feedback loops, and accountable follow-up.",
    anchor: "continuous-improvement-assurance",
  },
  {
    id: "policy-alignment-assurance",
    title: "Policy, standards & alignment assurance",
    category: "Policy & alignment assurance",
    description:
      "Practice mapping applicable policies/standards, translating them into controls, maintaining evidence of alignment, and escalating gaps.",
    anchor: "policy-alignment-assurance",
  },
  {
    id: "change-deployment-assurance",
    title: "Change management & deployment assurance",
    category: "Change & deployment assurance",
    description:
      "Practice pre-deployment review, controlled rollout/rollback, change approvals and traceability, and post-deployment validation.",
    anchor: "change-deployment-assurance",
  },
  {
    id: "accountability-raci-assurance",
    title: "Accountability, roles & RACI assurance",
    category: "Accountability & oversight",
    description:
      "Practice clear ownership, decision rights and approvals, role competence/training, and evidence of accountable oversight.",
    anchor: "accountability-raci-assurance",
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
