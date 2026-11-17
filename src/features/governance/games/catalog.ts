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
    id: "data-retention-deletion-assurance",
    title: "Data retention & deletion assurance",
    category: "Data retention & deletion",
    description:
      "Practice proportionate retention limits, reliable deletion/lifecycle disposal, protection during retention, and evidence of compliance.",
    anchor: "data-retention-deletion-assurance",
  },
  {
    id: "ethical-values-alignment-assurance",
    title: "Ethical use & values alignment assurance",
    category: "Ethics & values alignment",
    description:
      "Practice defining AI principles, assessing use cases against values/impacts, transparent trade-offs, and evidence-backed concern review.",
    anchor: "ethical-values-alignment-assurance",
  },
  {
    id: "procurement-contracting-assurance",
    title: "Procurement & contracting assurance for AI",
    category: "Procurement & contracting",
    description:
      "Practice AI-specific procurement requirements, evidence-based vendor evaluation, clear contract terms, and ongoing onboarding/vendor assurance reviews.",
    anchor: "procurement-contracting-assurance",
  },
  {
    id: "data-labeling-quality-assurance",
    title: "Data labeling & annotation quality assurance",
    category: "Data labeling & quality",
    description:
      "Practice clear labeling guidelines, annotator training and consistency, ambiguity/edge-case handling, and QA audits with evidence-backed feedback.",
    anchor: "data-labeling-quality-assurance",
  },
  {
    id: "incident-communication-tabletop-assurance",
    title: "Incident communication tabletop assurance",
    category: "Incident communication",
    description:
      "Practice cross-functional coordination, timely/factual updates, escalation and decision logging, and after-action communication review.",
    anchor: "incident-communication-tabletop-assurance",
  },
  {
    id: "decommissioning-retirement-assurance",
    title: "AI system decommissioning & retirement assurance",
    category: "Decommissioning & retirement",
    description:
      "Practice planned retirement, stakeholder communication and alternatives, access revocation and data/model disposal, and closure evidence/lessons learned.",
    anchor: "decommissioning-retirement-assurance",
  },
  {
    id: "ai-literacy-enablement-assurance",
    title: "AI literacy & user enablement assurance",
    category: "Literacy & enablement",
    description:
      "Practice role-appropriate AI literacy, clear capabilities/limitations, safe/effective use guidance, and feedback-driven enablement improvement.",
    anchor: "ai-literacy-enablement-assurance",
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
  {
    id: "human-ai-handoff-assurance",
    title: "Human-AI collaboration & handoff assurance",
    category: "Human oversight & collaboration",
    description:
      "Practice clear task division and handoffs, preserving human context/judgment, escalation on low confidence, and evidence-backed review to avoid overreliance.",
    anchor: "human-ai-handoff-assurance",
  },
  {
    id: "vendor-ai-assurance",
    title: "Third-party & vendor AI assurance",
    category: "Third-party & supply chain",
    description:
      "Practice risk-based vendor due diligence, contractual guardrails, dependency/concentration planning, and ongoing monitoring with evidence refresh.",
    anchor: "vendor-ai-assurance",
  },
  {
    id: "transparency-disclosure-assurance",
    title: "Transparency & user disclosure assurance",
    category: "Transparency & user rights",
    description:
      "Practice clear AI disclosure, communicating limitations/uncertainty, contestability and recourse channels, and evidence-backed transparency effectiveness.",
    anchor: "transparency-disclosure-assurance",
  },
  {
    id: "privacy-minimization-assurance",
    title: "AI privacy & data minimization assurance",
    category: "Data & privacy assurance",
    description:
      "Practice minimizing personal data at collection, before third-party model calls, and on secondary use, with minimization evidence kept on review.",
    anchor: "privacy-minimization-assurance",
  },
  {
    id: "inventory-risk-classification-assurance",
    title: "AI inventory & risk classification assurance",
    category: "Inventory & risk classification",
    description:
      "Practice registering every AI use, classifying risk against documented criteria, keeping the inventory current through change, and turning tiers into proportionate assurance action.",
    anchor: "inventory-risk-classification-assurance",
  },
  {
    id: "guardrail-tuning-assurance",
    title: "Guardrail tuning & effectiveness assurance",
    category: "Guardrails & assurance",
    description:
      "Practice tuning noisy guardrails against real traffic, changing thresholds with recorded evidence, measuring catch and miss rates, and reviewing overrides as tuning signals.",
    anchor: "guardrail-tuning-assurance",
  },
  {
    id: "performance-drift-assurance",
    title: "Post-deployment performance & drift assurance",
    category: "Monitoring & assurance",
    description:
      "Practice baselining post-deployment performance, watching for data and quality drift, assigning drift response owners and SLAs, and keeping auditable drift evidence.",
    anchor: "performance-drift-assurance",
  },
  {
    id: "human-factors-usability-assurance",
    title: "Human factors & usability assurance",
    category: "Human factors & usability",
    description:
      "Practice representative user testing, usable error and correction paths, workload and comprehension safeguards, and repeated usability reviews with evidence.",
    anchor: "human-factors-usability-assurance",
  },
  {
    id: "model-documentation-transparency-assurance",
    title: "Model documentation & transparency assurance",
    category: "Transparency & documentation",
    description:
      "Practice documenting intended use and limitations, versioning model changes and notifying operators, recording failure modes, and keeping performance evidence traceable and current.",
    anchor: "model-documentation-transparency-assurance",
  },
  {
    id: "data-quality-integrity-assurance",
    title: "Data quality & integrity assurance",
    category: "Data quality & integrity",
    description:
      "Practice data lineage and metadata, ground-truth auditing, data health monitoring in production, and documented remediation of bad datasets.",
    anchor: "data-quality-integrity-assurance",
  },
  {
    id: "safety-misuse-assurance",
    title: "AI safety & misuse prevention assurance",
    category: "Safety & misuse prevention",
    description:
      "Practice adversarial and misuse testing, capability-gated safeguards, misuse monitoring and response, and documented safety incident review and closure.",
    anchor: "safety-misuse-assurance",
  },
  {
    id: "guardrail-exception-assurance",
    title: "Guardrail exception & override assurance",
    category: "Guardrails & exceptions",
    description:
      "Practice time-boxed overrides with expiry, exception trend review, exception ownership and review, and assessing the impact of outputs produced while an override was active.",
    anchor: "guardrail-exception-assurance",
  },
  {
    id: "data-rights-licensing-assurance",
    title: "Training data rights & licensing assurance",
    category: "Data rights & licensing",
    description:
      "Practice confirming lawful basis for training data, checking licence terms against actual use, honouring opt-outs and withdrawals, and reviewing scraped corpora before use.",
    anchor: "data-rights-licensing-assurance",
  },
  {
    id: "guardrail-config-assurance",
    title: "Guardrail configuration change assurance",
    category: "Guardrails & configuration",
    description:
      "Practice configuration history and approval, environment parity, pre-release rule testing on edge and adversarial cases, and tested rollback for guardrail changes.",
    anchor: "guardrail-config-assurance",
  },
  {
    id: "assurance-cadence",
    title: "Assurance review cadence & evidence refresh",
    category: "Assurance operations",
    description:
      "Practice owned review calendars, evidence freshness after system change, authoritative evidence registers, and escalating overdue assurance items before audit.",
    anchor: "assurance-cadence",
  },
  {
    id: "risk-appetite-assurance",
    title: "AI risk appetite & tolerance assurance",
    category: "Risk appetite & acceptance",
    description:
      "Practice setting appetite before approval, routing tolerance breaches to named owners with defined responses, reviewing appetite against the live portfolio, and recording risk acceptance.",
    anchor: "risk-appetite-assurance",
  },
  {
    id: "eval-integrity-assurance",
    title: "AI evaluation integrity assurance",
    category: "Testing & evaluation",
    description:
      "Practice holdout integrity and contamination checks, complete and honest reporting, evaluation relevance as products change, and sign-off on eval set versions and thresholds.",
    anchor: "eval-integrity-assurance",
  },
  {
    id: "intake-onboarding-assurance",
    title: "AI intake & onboarding assurance",
    category: "Intake & onboarding",
    description:
      "Practice bringing shadow AI into intake, proportionate review for pilots with real users, verified onboarding evidence, and recorded handover of ongoing obligations.",
    anchor: "intake-onboarding-assurance",
  },
  {
    id: "operating-model-assurance",
    title: "AI governance operating model assurance",
    category: "Governance operations",
    description:
      "Practice publishing decision rights, keeping forums operating with quorum and decision logs, owning escalation turnaround, and reviewing the operating model as the estate grows.",
    anchor: "operating-model-assurance",
  },
  {
    id: "agentic-guardrails-assurance",
    title: "Agentic AI action guardrails assurance",
    category: "Guardrails & configuration",
    description:
      "Practice least-privilege agent credentials, approval gates for irreversible actions, enforced spend and step limits, and replayable action logs for tool-using agents.",
    anchor: "agentic-guardrails-assurance",
  },
  {
    id: "near-miss-reporting-assurance",
    title: "AI near-miss reporting & learning assurance",
    category: "Incident & learning",
    description:
      "Practice blame-free near-miss reporting, a reportable near-miss category, closed-loop learning with reporters, and impact-based triage and escalation.",
    anchor: "near-miss-reporting-assurance",
  },
  {
    id: "risk-register-quality-assurance",
    title: "AI risk register quality assurance",
    category: "Risk & appetite",
    description:
      "Practice writing specific system-tied risk statements, assigning named owners with dated treatment, evidencing residual risk, and keeping the register free of duplicates and stale entries.",
    anchor: "risk-register-quality-assurance",
  },
  {
    id: "output-ip-assurance",
    title: "AI output ownership & IP assurance",
    category: "Rights & disclosure",
    description:
      "Practice settling output ownership terms, running similarity and infringement checks on generated content, checking licence obligations in AI-assisted code, and disclosing and recording AI involvement.",
    anchor: "output-ip-assurance",
  },
  {
    id: "oversight-capacity-assurance",
    title: "AI human oversight capacity assurance",
    category: "Human oversight",
    description:
      "Practice detecting automation bias and rubber-stamping, giving reviewers real override authority, matching review capacity to decision volume, and assigning competent reviewers with context.",
    anchor: "oversight-capacity-assurance",
  },
  {
    id: "governance-metrics-assurance",
    title: "AI governance metrics & reporting assurance",
    category: "Assurance operations",
    description:
      "Practice replacing vanity counts with decision-grade metrics, tracing figures to system sources, reporting failures and near misses honestly, and tying every metric to a decision and owner.",
    anchor: "governance-metrics-assurance",
  },
  {
    id: "production-testing-assurance",
    title: "AI production testing & canary assurance",
    category: "Deployment & release",
    description:
      "Practice staged exposure in shadow and canary, pre-agreed success and stop criteria, rehearsed rollback and kill switches, and safeguards for live test data and affected users.",
    anchor: "production-testing-assurance",
  },
] as const;
