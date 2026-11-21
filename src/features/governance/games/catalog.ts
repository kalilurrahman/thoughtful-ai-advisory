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
  {
    id: "model-deprecation-assurance",
    title: "AI model deprecation & migration assurance",
    category: "Model lifecycle",
    description:
      "Practice tracking model versions and sunset dates, controlling unpinned model change, re-running evaluation before migration, and re-approving the system after a model swap.",
    anchor: "model-deprecation-assurance",
  },
  {
    id: "board-oversight-assurance",
    title: "AI board & executive oversight assurance",
    category: "Leadership & accountability",
    description:
      "Practice putting AI on the board agenda with a named executive owner, reporting risk and failures honestly, minuting challenge and dissent, and tracking board decisions to completion.",
    anchor: "board-oversight-assurance",
  },
  {
    id: "incident-severity-assurance",
    title: "AI incident severity & notification assurance",
    category: "Incident response",
    description:
      "Practice classifying AI-specific harms, naming a triage owner with a decision window, pre-agreeing notification triggers and timelines, and running blameless reviews with tracked corrective actions.",
    anchor: "incident-severity-assurance",
  },
  {
    id: "secrets-hygiene-assurance",
    title: "AI model key & secrets hygiene assurance",
    category: "Security & access",
    description:
      "Practice keeping model keys server-side and least-privilege, registering keys with owners and environments, rehearsing rotation and revocation, and catching secrets that leak into repos, logs or prompts.",
    anchor: "secrets-hygiene-assurance",
  },
  {
    id: "evidence-pack-assurance",
    title: "AI assurance evidence pack assurance",
    category: "Assurance & audit",
    description:
      "Practice mapping claims to specific evidence, replacing stale evidence after material change, recording owners and sources per claim, and testing a pack with an unaided reviewer.",
    anchor: "evidence-pack-assurance",
  },
  {
    id: "prompt-injection-assurance",
    title: "Prompt injection & jailbreak resilience assurance",
    category: "Security & access",
    description:
      "Practice treating retrieved content as untrusted, scoping agent tools and data, turning red-team attacks into regression tests, and detecting instruction-extraction attempts in production.",
    anchor: "prompt-injection-assurance",
  },
  {
    id: "synthetic-data-assurance",
    title: "Synthetic data governance assurance",
    category: "Data governance",
    description:
      "Practice recording how synthetic data was generated, validating fidelity and utility against real data, testing for memorised records, and documenting label limits before reuse.",
    anchor: "synthetic-data-assurance",
  },
  {
    id: "model-selection-assurance",
    title: "AI model selection & fitness-for-purpose assurance",
    category: "Model lifecycle",
    description:
      "Practice setting the quality bar before choosing, evaluating candidates on your own data, recording cost and risk trade-offs, and keeping a credible switch path before lock-in.",
    anchor: "model-selection-assurance",
  },
  {
    id: "env-impact-assurance",
    title: "AI compute & environmental impact assurance",
    category: "Responsible AI",
    description:
      "Practice measuring energy and compute per workload, right-sizing and scheduling for efficiency, reporting AI impact with assumptions, and owning reduction targets with a review cadence.",
    anchor: "env-impact-assurance",
  },
  {
    id: "tabletop-assurance",
    title: "AI assurance tabletop & rehearsal assurance",
    category: "Incident response",
    description:
      "Practice building scenarios from real AI failure modes, rehearsing cross-functionally with legal and communications, running on a cadence that reuses real incidents, and tracking findings to closure.",
    anchor: "tabletop-assurance",
  },
  {
    id: "agent-memory-assurance",
    title: "Agent memory governance assurance",
    category: "Agentic AI",
    description:
      "Practice registering what an agent remembers, deleting memories across every store, testing isolation between users and tenants, and validating what can be written to memory before it becomes an instruction.",
    anchor: "agent-memory-assurance",
  },
  {
    id: "incentive-alignment-assurance",
    title: "AI incentive alignment assurance",
    category: "Governance operating model",
    description:
      "Practice spotting where targets reward bypassing a guardrail, pairing throughput measures with quality and safety, protecting people who flag pressure, and making cost-versus-quality trade-offs explicit.",
    anchor: "incentive-alignment-assurance",
  },
  {
    id: "provider-terms-assurance",
    title: "AI provider terms change assurance",
    category: "Third-party & supply chain",
    description:
      "Practice registering subprocessors and model cards, routing provider notices to an owner, assessing term changes against actual use, and testing an exit path before it is needed.",
    anchor: "provider-terms-assurance",
  },
  {
    id: "regulator-inquiry-assurance",
    title: "AI regulator inquiry assurance",
    category: "Regulatory & assurance",
    description:
      "Practice answering an inquiry from a maintained evidence index, routing it through one named responder with legal review, tracking deadlines with a deputy, and verifying each answer against evidence.",
    anchor: "regulator-inquiry-assurance",
  },
  {
    id: "incident-evidence-assurance",
    title: "AI incident evidence preservation assurance",
    category: "Incident response",
    description:
      "Practice capturing prompts, retrieved context, model versions and outputs at the time, applying a hold before rotation, keeping chain of custody, and demonstrating root cause with a replayable trail.",
    anchor: "incident-evidence-assurance",
  },
  {
    id: "data-subject-request-assurance",
    title: "AI data subject request assurance",
    category: "Data & privacy assurance",
    description:
      "Practice verifying identity and tracking deadlines, searching prompts, logs, agent memory and derived summaries, redacting third-party data before disclosure, propagating corrections, and recording how each request was handled.",
    anchor: "data-subject-request-assurance",
  },
  {
    id: "cost-allocation-assurance",
    title: "AI usage cost allocation assurance",
    category: "Operations & value",
    description:
      "Practice metering usage per team, system and feature, agreeing a chargeback or showback basis with finance, giving owners their spend against a budget, reviewing runaway and idle usage, and pulling untracked tools into the same picture.",
    anchor: "cost-allocation-assurance",
  },
  {
    id: "shadow-ai-assurance",
    title: "Shadow AI containment assurance",
    category: "Guardrails & controls",
    description:
      "Practice finding unsanctioned tools through network, spend and identity signals, making the sanctioned route easier than the workaround, bounding data reach with egress controls, offering amnesty for disclosure, and recording a disposition for every tool found.",
    anchor: "shadow-ai-assurance",
  },
  {
    id: "rag-grounding-assurance",
    title: "Retrieval grounding integrity assurance",
    category: "Guardrails & controls",
    description:
      "Practice giving retrieved sources an owner and refresh date, requiring answers to cite the passages they rely on, resolving conflicts by a stated rule, making abstention acceptable, and monitoring the corpus for drift and poisoning.",
    anchor: "rag-grounding-assurance",
  },
  {
    id: "assurance-case-assurance",
    title: "AI assurance case integrity assurance",
    category: "Assurance evidence",
    description:
      "Practice tying claims to evidence that shows the control operating, dating evidence and refreshing it on change, recording known gaps as defeaters, re-assessing when scope or data moves, and routing approvers to the argument rather than a summary.",
    anchor: "assurance-case-assurance",
  },
  {
    id: "prompt-governance-assurance",
    title: "AI prompt & instruction governance assurance",
    category: "Configuration governance",
    description:
      "Practice versioning prompts with a diffable history, reviewing instruction changes with a recorded approver, growing the regression set from incidents, releasing with a tested rollback, and monitoring behaviour for drift after release.",
    anchor: "prompt-governance-assurance",
  },
  {
    id: "vuln-management-assurance",
    title: "AI vulnerability management assurance",
    category: "Security & robustness assurance",
    description:
      "Practice extending inventory and scanning to model SDKs, runtimes and containers, applying compensating controls with dated exceptions when patching cannot happen, triaging by exploitability and exposure, verifying the deployed version, and tracking provider security notices.",
    anchor: "vuln-management-assurance",
  },
  {
    id: "data-residency-assurance",
    title: "AI data residency & sovereignty assurance",
    category: "Data & privacy assurance",
    description:
      "Practice verifying where each call path processes data, documenting support-access locations and transfer bases, tracking subprocessor and region changes, asking for evidence covering backups and replicas, and stopping undocumented transfers.",
    anchor: "data-residency-assurance",
  },
  {
    id: "agent-evaluation-assurance",
    title: "AI agent evaluation assurance",
    category: "Agentic AI",
    description:
      "Practice reviewing tool-use traces rather than final answers, defining success criteria per task type, routing repeated failures through a taxonomy, evaluating with representative tools and errors, and re-running regression when tools, prompts or models change.",
    anchor: "agent-evaluation-assurance",
  },
  {
    id: "content-provenance-assurance",
    title: "AI content provenance & labelling assurance",
    category: "Content safety & misuse",
    description:
      "Practice marking at generation and testing every export path, verifying marks survive format and channel changes, adding visible disclosure where a mark cannot travel, detecting stripped or unlabeled content on ingest, and keeping a register of channels where labelling is required.",
    anchor: "content-provenance-assurance",
  },
  {
    id: "test-isolation-assurance",
    title: "AI test & sandbox isolation assurance",
    category: "Access & identity",
    description:
      "Practice keeping production personal data out of test environments, using isolated model endpoints and keys, removing production write access from test credentials, controlling egress to public tools, and expiring environments with a recorded owner for extensions.",
    anchor: "test-isolation-assurance",
  },
  {
    id: "value-realisation-assurance",
    title: "AI value realisation assurance",
    category: "Operations & value",
    description:
      "Practice capturing a baseline before deployment, measuring outcomes rather than activity, stating attribution honestly alongside other changes, measuring real usage instead of licences, and recording review decisions with the authority to scale, fix or stop.",
    anchor: "value-realisation-assurance",
  },
  {
    id: "third-party-audit-assurance",
    title: "AI third-party audit & assurance access",
    category: "Third-party & supply chain",
    description:
      "Practice securing a right to audit or receive assurance evidence, extending scope to models, data and subprocessors, exercising the right on a risk-based cadence, reading reports against actual use, and verifying findings to closure with evidence.",
    anchor: "third-party-audit-assurance",
  },
  {
    id: "consent-withdrawal-assurance",
    title: "AI consent withdrawal assurance",
    category: "Data & privacy assurance",
    description:
      "Practice treating derived artifacts as in scope, stating and measuring a removal window, requiring confirmation from downstream processors, recording per-withdrawal evidence, and checking consent state at the point of reuse.",
    anchor: "consent-withdrawal-assurance",
  },
  {
    id: "complaint-feedback-assurance",
    title: "AI complaint & feedback loop assurance",
    category: "Accountability & redress",
    description:
      "Practice placing intake where the decision happens, triaging by theme so patterns surface, measuring response against the promise, tracing root cause to the model, data, prompt or process, and closing the loop with the people who reported it.",
    anchor: "complaint-feedback-assurance",
  },
  {
    id: "risk-transfer-assurance",
    title: "AI risk transfer & insurance assurance",
    category: "Risk & assurance",
    description:
      "Practice mapping AI risk to actual policy wording and exclusions, notifying insurers within the policy terms, matching indemnities and caps to the exposure carried, testing limits against plausible loss scenarios, and assembling claim evidence before an incident.",
    anchor: "risk-transfer-assurance",
  },
  {
    id: "assurance-independence-assurance",
    title: "AI assurance independence & audit coverage",
    category: "Risk & assurance",
    description:
      "Practice keeping assurance independent of the build team, choosing coverage by risk with recorded exclusions, reporting findings unedited to a level with authority, declaring reliance on supplier evidence, and re-testing findings independently before closure.",
    anchor: "assurance-independence-assurance",
  },
  {
    id: "regulatory-horizon-assurance",
    title: "AI regulatory horizon scanning assurance",
    category: "Regulatory & assurance",
    description:
      "Practice naming sources and a scanning cadence, triaging each change against the system inventory, setting internal deadlines ahead of external ones, updating the controls and contracts the obligation touches, and recording no-action calls with their rationale.",
    anchor: "regulatory-horizon-assurance",
  },
  {
    id: "output-sampling-assurance",
    title: "AI production output sampling assurance",
    category: "Quality & reliability",
    description:
      "Practice weighting sample rates by risk and volume, separating reviewers from the producing queue, scoring against a calibrated rubric, stratifying coverage across channels and languages, and trending findings by category so drift is visible.",
    anchor: "output-sampling-assurance",
  },
  {
    id: "claims-substantiation-assurance",
    title: "AI public claims & marketing substantiation assurance",
    category: "Risk & assurance",
    description:
      "Practice replacing unevidenced superlatives with testable claims, sourcing and verifying vendor claims, re-running evidence when the system changes, describing compliance work accurately, and withdrawing a claim everywhere it appears.",
    anchor: "claims-substantiation-assurance",
  },
  {
    id: "worker-monitoring-assurance",
    title: "AI worker monitoring & algorithmic management assurance",
    category: "People & workforce",
    description:
      "Practice justifying each monitoring use with a recorded necessity and proportionality test, disclosing what is captured and why, keeping a human in decisions about work and pay, giving workers access and appeal, and deleting data on a stated schedule.",
    anchor: "worker-monitoring-assurance",
  },
  {
    id: "research-ethics-assurance",
    title: "AI research ethics & human-participant testing assurance",
    category: "Testing & evaluation",
    description:
      "Practice reviewing a study before participants start, disclosing what is retained and how outputs are used, taking specific and revocable consent, stopping when a participant signals distress, and reporting inconvenient findings with their limits.",
    anchor: "research-ethics-assurance",
  },
  {
    id: "speak-up-assurance",
    title: "AI speak-up & concern reporting assurance",
    category: "People & workforce",
    description:
      "Practice offering routes outside the line, treating adverse treatment after a concern as retaliation risk, triaging concerns with an owner and a clock, giving reporters an outcome, and escalating repeat themes into governance.",
    anchor: "speak-up-assurance",
  },
  {
    id: "hiring-screening-assurance",
    title: "AI hiring & candidate screening assurance",
    category: "People & workforce",
    description:
      "Practice measuring adverse impact on your own pipeline instead of trusting a vendor fairness claim, putting a human in front of every rejection, disclosing AI assessment to candidates, offering a genuine accessible alternative, and retaining records that explain a decision.",
    anchor: "hiring-screening-assurance",
  },
  {
    id: "annotation-workforce-assurance",
    title: "AI data annotation & labelling workforce assurance",
    category: "People & workforce",
    description:
      "Practice defining labels with worked examples before work starts, paying for real effort including rework, limiting harmful content with warnings, rotation, support and a penalty-free opt-out, routing annotator disagreement to model owners, and verifying supplier terms by sampling the work.",
    anchor: "annotation-workforce-assurance",
  },
  {
    id: "ai-handover-assurance",
    title: "AI handover & key-person dependency assurance",
    category: "Operating model",
    description:
      "Practice naming a second owner for every AI asset, documenting design rationale and known limits, moving access and vendor contacts to the team, rehearsing a handover and fixing what it exposes, and checking each asset off before a leaver's access is removed.",
    anchor: "ai-handover-assurance",
  },
  {
    id: "multilingual-assurance",
    title: "Multilingual & localisation assurance game",
    category: "Guardrails & assurance",
    description:
      "Practice evaluating each supported language instead of inferring from English results, testing guardrails and refusals across languages and scripts, reviewing local law and accessibility per market, staffing in-language review, and tying language coverage to real volumes.",
    anchor: "multilingual-assurance",
  },
  {
    id: "coding-assistants-assurance",
    title: "AI coding assistant governance game",
    category: "Operational readiness",
    description:
      "Practice reviewing generated code like human code, checking licence and provenance of suggestions, rotating secrets after a paste and blocking prohibited inputs, approving assistants before they touch repositories, and keeping the author accountable.",
    anchor: "coding-assistants-assurance",
  },
  {
    id: "ma-diligence-assurance",
    title: "AI due diligence for mergers & divestments game",
    category: "Operating model",
    description:
      "Practice building the AI inventory from real operations, checking change-of-control and termination rights before signing, surfacing inherited incidents and regulator contact, confirming data rights transfer or costing a retrain, and planning what must keep running on day one.",
    anchor: "ma-diligence-assurance",
  },
  {
    id: "children-age-assurance",
    title: "AI services for children & age assurance game",
    category: "Safety & harm prevention",
    description:
      "Practice choosing age assurance proportionate to the risk, setting age-appropriate defaults, recording revocable parental consent, assessing child-specific harm such as stranger contact and self-harm, and routing disclosures to trained responders.",
    anchor: "children-age-assurance",
  },
  {
    id: "worker-consultation-assurance",
    title: "Worker consultation on AI game",
    category: "People & workforce",
    description:
      "Practice consulting before the decision rather than announcing it, identifying the roles whose work actually changes, explaining purpose, data and monitoring in plain terms, answering concerns with changes or recorded reasons, and consulting again when the system or its use changes.",
    anchor: "worker-consultation-assurance",
  },
  {
    id: "summarisation-records-assurance",
    title: "AI summarisation & record accuracy game",
    category: "Data & documentation",
    description:
      "Practice keeping AI summaries of meetings, calls and cases trustworthy: defining what may never be summarised, requiring a human to confirm a summary before it becomes the record, carrying corrections into every downstream copy, telling people their conversation is summarised and letting them object, and applying retention and access rules to transcripts as well as summaries.",
    anchor: "summarisation-records-assurance",
  },
  {
    id: "regulated-advice-assurance",
    title: "AI in regulated advice game",
    category: "Assurance & oversight",
    description:
      "Practice keeping AI inside regulated advice boundaries: defining what advice the tool may give against the firm's permissions, requiring a suitably qualified reviewer who can change the advice, gathering the facts and suitability information the advice depends on, routing out-of-scope questions to a professional, and keeping a record of what was advised and by whom.",
    anchor: "regulated-advice-assurance",
  },
  {
    id: "public-sector-fairness-assurance",
    title: "Public-sector automated decision fairness game",
    category: "Fairness & impact",
    description:
      "Practice keeping automated public decisions fair and contestable: publishing the legal basis and policy, ensuring a human with authority reviews before the decision takes effect, giving plain reasons, making the appeal route genuinely usable, and investigating disparate impact rather than assuming an objective model.",
    anchor: "public-sector-fairness-assurance",
  },
  {
    id: "algorithmic-pricing-assurance",
    title: "Algorithmic pricing & competition game",
    category: "Commercial & competition",
    description:
      "Practice keeping AI pricing inside competition law: keeping competitor data out of price setting, requiring human approval for material price moves, assessing the signalling risk of public price statements, treating parallel market movement as a collusion indicator with a legal escalation route, and keeping an audit trail of decisions and model versions.",
    anchor: "algorithmic-pricing-assurance",
  },
  {
    id: "export-controls-assurance",
    title: "AI export control & sanctions game",
    category: "Legal & regulatory",
    description:
      "Practice keeping AI capability inside export control and sanctions rules: screening end users rather than delegating it to a reseller, classifying a fine-tune's capability before releasing weights, treating logging-removal and undisclosed end-use requests as red flags, testing screening for near-matches and ownership, and recording refusals with reasons and decision makers.",
    anchor: "export-controls-assurance",
  },
  {
    id: "vulnerable-customers-assurance",
    title: "AI & vulnerable customers game",
    category: "Customers & vulnerability",
    description:
      "Practice protecting people in vulnerable circumstances from automated harm: pausing adverse action on hardship signals for human review, adapting the interaction when someone discloses bereavement or illness, limiting vulnerability data to what was disclosed or needed, giving trained staff real override authority, and recording support and outcomes for vulnerable groups.",
    anchor: "vulnerable-customers-assurance",
  },
  {
    id: "education-integrity-assurance",
    title: "AI in education & assessment game",
    category: "Education & research",
    description:
      "Practice handling AI in education fairly: setting permitted use per assessment before work starts, treating detector output as evidence rather than a verdict, redesigning assessment that a model can complete, giving students a disclosure step, and training markers so decisions are consistent, recorded and appealable.",
    anchor: "education-integrity-assurance",
  },
  {
    id: "insurance-ai-assurance",
    title: "AI in insurance underwriting & claims game",
    category: "Sector assurance",
    description:
      "Practice keeping AI pricing and claims decisions fair: testing for proxies rather than trusting factors that never name a protected characteristic, reviewing adverse automated decisions before they reach the customer, giving specific reasons and a route to review, justifying rating factors actuarially, and investigating complaint clusters instead of explaining them away.",
    anchor: "insurance-ai-assurance",
  },
  {
    id: "incident-notification-assurance",
    title: "AI incident notification to affected individuals game",
    category: "Operational readiness",
    description:
      "Practice notifying people affected by AI incidents: defining when notification is required, identifying and reaching those affected, explaining impact and next steps clearly, offering a staffed remedy and recourse route, and keeping regulator, client and individual messages consistent while logging outcomes for follow-up.",
    anchor: "incident-notification-assurance",
  },
  {
    id: "elections-integrity-assurance",
    title: "AI in elections & political advertising game",
    category: "Civic integrity",
    description:
      "Practice responsible AI use in election-period communications and political advertising: labeling synthetic or altered content with provenance, constraining targeting to lawful and non-manipulative use, reviewing claims before publication, recording sponsors and accountable owners, and responding rapidly to correct or pause harmful or misleading AI content.",
    anchor: "elections-integrity-assurance",
  },
  {
    id: "journalism-integrity-assurance",
    title: "AI in journalism & newsroom verification game",
    category: "Civic integrity",
    description:
      "Practice responsible AI use in newsrooms and editorial work: verifying AI-assisted drafts and quotes against primary sources, requiring a named editor to sign off AI-influenced output, labelling synthetic media and checking provenance, publishing corrections and retractions with a clear trail, and telling audiences when AI played a material role.",
    anchor: "journalism-integrity-assurance",
  },
  {
    id: "clinical-documentation-assurance",
    title: "AI clinical documentation & ambient scribing game",
    category: "Sector assurance",
    description:
      "Practice keeping AI-drafted clinical records safe: requiring clinician review and sign-off before a note becomes the record, telling patients when encounters are recorded and capturing consent, checking drafts for omitted findings and invented content, monitoring documentation-driven billing drift, and keeping an audit trail of AI authorship together with a route for patients to see and correct the record.",
    anchor: "clinical-documentation-assurance",
  },
  {
    id: "ediscovery-assurance",
    title: "AI in legal e-discovery & evidence preservation game",
    category: "Legal assurance",
    description:
      "Practice defensible AI-assisted litigation and investigation work: issuing and monitoring legal holds across messaging and devices, validating and sampling AI review rather than trusting it, explaining how documents were classified, keeping privilege calls with qualified lawyers and a log, and preserving enough to reconstruct a produced set and disclose defects.",
    anchor: "ediscovery-assurance",
  },
  {
    id: "critical-infrastructure-assurance",
    title: "AI in energy grid & critical infrastructure game",
    category: "Operational readiness",
    description:
      "Practice keeping AI in safety-critical operations under control: preserving operator authority over consequential actions, putting limits and interlocks between model output and physical systems, testing behaviour under degraded data and extreme weather, governing third-party access to operational telemetry, disclosing AI influence on service decisions, and rehearsing a manual fallback when the model is unavailable.",
    anchor: "critical-infrastructure-assurance",
  },
  {
    id: "tenant-screening-assurance",
    title: "AI in tenant screening & housing access game",
    category: "Fairness assurance",
    description:
      "Practice keeping AI-assisted rental screening fair: testing criteria for proxies such as source of income, telling applicants a model is used and what data drives it, requiring human review before rejection, giving specific reasons with a route to correct errors, verifying screening data sources, and retaining audit evidence for fair-housing scrutiny.",
    anchor: "tenant-screening-assurance",
  },
  {
    id: "agri-food-assurance",
    title: "AI in agriculture & food-system decisions game",
    category: "Sector assurance",
    description:
      "Practice governing AI in farming and food supply: validating recommendations for local conditions, keeping farm data with the grower, checking advice does not disadvantage smallholders or thin-data regions, keeping human sign-off and audit trails on food safety and traceability, making environmental and animal-welfare trade-offs explicit, and leaving growers a workable fallback when a model fails.",
    anchor: "agri-food-assurance",
  },
  {
    id: "construction-assurance",
    title: "AI in construction & the built environment game",
    category: "Sector assurance",
    description:
      "Practice keeping AI in design and delivery safe: requiring qualified professional checking of generated designs and calculations, refusing to let model output replace structural or fire sign-off, routing site-safety flags to the crews who can act, recording AI-authored design elements, and correcting and disclosing defects after handover.",
    anchor: "construction-assurance",
  },
  {
    id: "emergency-response-assurance",
    title: "AI in emergency response & public-safety triage game",
    category: "Operational readiness",
    description:
      "Practice keeping AI-supported dispatch and triage safe: keeping a trained human in final control and failing safe on degraded calls, testing outcomes for bias by location, language and disability, telling callers and staff when AI is involved with a route to a person, validating triage against local outcomes with decision logs, and rehearsing a manual process for model failure.",
    anchor: "emergency-response-assurance",
  },
  {
    id: "official-statistics-assurance",
    title: "AI in official statistics & census data production game",
    category: "Public assurance",
    description:
      "Practice governing AI in official statistics and census production: documenting reproducible methods and quality checks, testing outputs for bias and small-area error before release, enforcing statistical confidentiality on derived tables, versioning revisions and model changes with an audit trail, and telling the public when AI materially influenced published figures.",
    anchor: "official-statistics-assurance",
  },
  {
    id: "telecom-operations-assurance",
    title: "AI in telecommunications network operations game",
    category: "Operational readiness",
    description:
      "Practice governing AI in network operations and service continuity: keeping operator oversight, limits and rollback on automated changes, testing traffic management for fairness under congestion, logging changes for traceable incidents, notifying customers and regulators of material AI-influenced impacts, and rehearsing manual operations to sustain essential service if the model fails.",
    anchor: "telecom-operations-assurance",
  },
  {
    id: "aviation-air-traffic-assurance",
    title: "AI in aviation & air traffic operations game",
    category: "Operational readiness",
    description:
      "Practice governing AI in aviation and air traffic operations: keeping human authority and quick override for safety-critical decisions, validating performance in edge and degraded conditions, logging decisions and model versions for traceability, controlling changes against certified or approved baselines, and rehearsing manual procedures and coordination when AI fails.",
    anchor: "aviation-air-traffic-assurance",
  },
  {
    id: "maritime-port-operations-assurance",
    title: "AI in maritime & port operations game",
    category: "Operational readiness",
    description:
      "Practice governing AI in maritime and port operations: keeping human oversight and override for safety- and security-critical actions, validating performance in adverse and degraded conditions, logging recommendations and model versions for traceability, testing screening and scheduling for fairness, and rehearsing manual procedures, coordination and notification when AI fails.",
    anchor: "maritime-port-operations-assurance",
  },
  {
    id: "pharma-clinical-trials-assurance",
    title: "AI in pharmaceutical clinical trials game",
    category: "Public assurance",
    description:
      "Practice governing AI in pharmaceutical clinical trials: keeping qualified human oversight over participant safety and protocol adherence, maintaining consent and transparency when AI is used, testing recruitment and stratification for bias and representativeness, preserving data integrity, provenance and protected access, and monitoring performance with clear escalation and the ability to pause or revert AI use.",
    anchor: "pharma-clinical-trials-assurance",
  },
  {
    id: "humanitarian-aid-allocation-assurance",
    title: "AI in humanitarian & aid allocation game",
    category: "Public assurance",
    description:
      "Practice governing AI in humanitarian response and aid allocation: testing targeting for fairness and non-discrimination, explaining allocation criteria and AI's role, providing human review and recourse for high-impact decisions, protecting sensitive crisis data with quality checks and minimisation, and maintaining accountable records with manual fallback in rapidly changing conditions.",
    anchor: "humanitarian-aid-allocation-assurance",
  },
  {
    id: "water-wastewater-operations-assurance",
    title: "AI in water & wastewater utility operations game",
    category: "Operational readiness",
    description:
      "Practice governing AI in water and wastewater utility operations: keeping operator oversight and authority for safety- and quality-critical actions, validating performance under sensor faults and adverse conditions, monitoring thresholds with alarms and escalation, logging decisions and model versions for traceability, and maintaining controlled changes with fail-safe manual fallback and required incident notification.",
    anchor: "water-wastewater-operations-assurance",
  },
  {
    id: "border-immigration-screening-assurance",
    title: "AI in border, immigration & mobility screening game",
    category: "Public assurance",
    description:
      "Practice governing AI in border, immigration and mobility screening: requiring qualified human review for high-impact decisions, testing outcomes for fairness and disproportionate impact, validating accuracy and false matches, providing explanation, contestability and recourse where appropriate while protecting sensitive data, and maintaining audit trails with manual fallback.",
    anchor: "border-immigration-screening-assurance",
  },
  {
    id: "railway-signalling-operations-assurance",
    title: "AI in railway operations & signalling support game",
    category: "Operational readiness",
    description:
      "Practice governing AI in railway operations and signalling support: keeping human authority and clear advisory-versus-control boundaries, validating performance in degraded conditions and signal faults, logging recommendations and model versions for traceability, controlling changes against approved or certified baselines, and rehearsing manual procedures, coordination and notifications when AI fails.",
    anchor: "railway-signalling-operations-assurance",
  },
  {
    id: "mining-extractive-safety-assurance",
    title: "AI in mining & extractive operations safety game",
    category: "Operational readiness",
    description:
      "Practice governing AI in mining and extractive operations safety: keeping human authority over safety-critical alerts and actions, validating performance in harsh environments and sensor faults, monitoring hazard thresholds with timely alarms and escalation, logging decisions and model versions for traceability, and maintaining controlled changes with fail-safe manual procedures and incident coordination.",
    anchor: "mining-extractive-safety-assurance",
  },
  {
    id: "pharma-manufacturing-quality-assurance",
    title: "AI in pharmaceutical manufacturing & quality game",
    category: "Operational readiness",
    description:
      "Practice governing AI in pharmaceutical manufacturing and quality control: maintaining qualified human review and release authority, preserving data integrity and audit trails, detecting and escalating deviations with timely investigation, validating performance across products, lines and conditions, and controlling changes with safe manual fallback to protect product quality and continuity.",
    anchor: "pharma-manufacturing-quality-assurance",
  },
  {
    id: "customs-cargo-trade-screening-assurance",
    title: "AI in customs cargo & trade screening game",
    category: "Operational readiness",
    description:
      "Practice governing AI in customs cargo and trade screening: maintaining human authority for holds, inspections and enforcement actions, validating risk targeting for fairness and trade impacts, protecting trade and partner data, logging decisions and risk scores for traceability and audit, and controlling changes with manual fallback and expedited review to sustain legitimate facilitation.",
    anchor: "customs-cargo-trade-screening-assurance",
  },
  {
    id: "waste-recycling-operations-assurance",
    title: "AI in waste management & recycling operations game",
    category: "Operational readiness",
    description:
      "Practice governing AI in waste management and recycling operations: maintaining human authority over safety-critical actions, validating performance across waste streams and sensor faults, detecting hazards and contamination with timely alarms and escalation, logging decisions and model versions for traceability and compliance evidence, and controlling changes with fail-safe manual procedures and worker-safety coordination.",
    anchor: "waste-recycling-operations-assurance",
  },
] as const;
