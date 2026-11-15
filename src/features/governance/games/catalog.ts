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
    id: "training-awareness-assurance",
    title: "Training, awareness & competence assurance",
    category: "Training & competence",
    description:
      "Practice role-relevant training, acceptable-use awareness, competence verification and refreshers, and learning updates after changes/incidents.",
    anchor: "training-awareness-assurance",
  },
  {
    id: "stakeholder-reporting-assurance",
    title: "Stakeholder communication & reporting assurance",
    category: "Communication & reporting",
    description:
      "Practice evidence-backed governance reporting, communicating limitations/changes and incidents, and audience-appropriate channels/escalation.",
    anchor: "stakeholder-reporting-assurance",
  },
  {
    id: "continuity-resilience-assurance",
    title: "Business continuity & resilience assurance",
    category: "Continuity & resilience",
    description:
      "Practice dependency/failure planning, fallback and degraded-mode procedures, recovery objectives/testing, and readiness evidence.",
    anchor: "continuity-resilience-assurance",
  },
  {
    id: "user-recourse-contestability-assurance",
    title: "User recourse & contestability assurance",
    category: "Recourse & contestability",
    description:
      "Practice accessible recourse paths, timely human review/correction, clear communication of options, and tracked fair remediation.",
    anchor: "user-recourse-contestability-assurance",
  },
  {
    id: "resource-efficiency-assurance",
    title: "Environmental & resource efficiency assurance",
    category: "Efficiency & sustainability",
    description:
      "Practice proportionate resource-impact assessment, right-sizing, efficiency monitoring signals, and lifecycle optimization evidence.",
    anchor: "resource-efficiency-assurance",
  },
  {
    id: "testing-validation-assurance",
    title: "Testing, validation & evaluation assurance",
    category: "Testing & evaluation",
    description:
      "Practice evaluation design and acceptance criteria, representative/edge-case testing, guardrail validation, and regression evidence after changes.",
    anchor: "testing-validation-assurance",
  },
  {
    id: "purpose-boundary-assurance",
    title: "Purpose limitation & use-case boundary assurance",
    category: "Purpose & boundaries",
    description:
      "Practice defining approved/prohibited uses, enforcing scope guardrails, reviewing repurposing, and evidencing communicated boundaries.",
    anchor: "purpose-boundary-assurance",
  },
  {
    id: "output-quality-reliability-assurance",
    title: "Output quality & reliability assurance",
    category: "Quality & reliability",
    description:
      "Practice quality/reliability expectations, handling errors/hallucinations and uncertainty, confidence communication, and evidence-backed improvement.",
    anchor: "output-quality-reliability-assurance",
  },
  {
    id: "logging-traceability-assurance",
    title: "Logging, traceability & auditability assurance",
    category: "Logging & auditability",
    description:
      "Practice meaningful logging, integrity/privacy protection, traceable investigation records, and retention/review for audit readiness.",
    anchor: "logging-traceability-assurance",
  },
  {
    id: "access-identity-assurance",
    title: "Access control & identity assurance",
    category: "Access & identity",
    description:
      "Practice least-privilege access, strong identity/authentication, access reviews/revocation, and segregation of duties with evidence.",
    anchor: "access-identity-assurance",
  },
  {
    id: "model-prompt-config-assurance",
    title: "Model & prompt configuration governance",
    category: "Configuration governance",
    description:
      "Practice controlled model/prompt/config management, versioning and approvals, safe settings/guardrails, and rollback traceability.",
    anchor: "model-prompt-config-assurance",
  },
  {
    id: "content-safety-misuse-assurance",
    title: "Content safety & misuse prevention assurance",
    category: "Content safety & misuse",
    description:
      "Practice safety/misuse policies, input/output safeguards and refusals, dual-use handling and escalation, and evidence-backed guardrail tuning.",
    anchor: "content-safety-misuse-assurance",
  },
  {
    id: "service-level-reliability-assurance",
    title: "Performance & service-level assurance",
    category: "Performance & reliability",
    description:
      "Practice service/reliability expectations, capacity and degraded-mode safeguards, actionable monitoring/alerts, and evidence-backed improvement.",
    anchor: "service-level-reliability-assurance",
  },
  {
    id: "explainability-interpretability-assurance",
    title: "Explainability & interpretability assurance",
    category: "Explainability & interpretability",
    description:
      "Practice appropriate explanations for context/audience, communicating limitations, supporting reviewer understanding, and validating/documenting usefulness.",
    anchor: "explainability-interpretability-assurance",
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
