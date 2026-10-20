export type GovernanceTemplate = {
  id: string;
  category: "Programme" | "Lifecycle" | "Assurance" | "Operations";
  title: string;
  description: string;
  prompt: string;
  sections: { heading: string; prompts: string[] }[];
};

export const GOVERNANCE_TEMPLATES: GovernanceTemplate[] = [
  {
    id: "charter",
    category: "Programme",
    title: "AI governance charter",
    description: "Set the mandate, scope, decision rights and oversight cadence for the programme.",
    prompt:
      "Adapt the scope and decision rights to your organisation’s authority structure. Have the charter approved by the executive owner.",
    sections: [
      {
        heading: "Purpose and scope",
        prompts: [
          "Entities, AI systems and lifecycle stages in scope",
          "Prohibited, restricted and escalated uses",
        ],
      },
      {
        heading: "Governance principles",
        prompts: ["Commitments for safety, rights, fairness, privacy, security and transparency"],
      },
      {
        heading: "Authority and decisions",
        prompts: [
          "Accountable executive and governance forum",
          "Approval, exception, suspension and retirement decision rights",
        ],
      },
      {
        heading: "Operating cadence",
        prompts: [
          "Review frequency, reporting and escalation timeframes",
          "Policy and charter review process",
        ],
      },
    ],
  },
  {
    id: "raci",
    category: "Programme",
    title: "AI lifecycle RACI",
    description:
      "Assign accountable roles from idea intake through retirement and incident learning.",
    prompt:
      "Assign one accountable role for each decision. Tailor role names and separation of duties to your operating model.",
    sections: [
      {
        heading: "Roles",
        prompts: [
          "Executive sponsor · governance lead · business and product owners · engineering · data · privacy · legal · security · risk · procurement · audit · operations",
        ],
      },
      {
        heading: "Lifecycle decisions",
        prompts: [
          "Intake · risk tier · impact assessment · data and supplier approval · evaluation · release · monitoring · incidents · material change · retirement",
        ],
      },
      {
        heading: "Escalation and delegation",
        prompts: [
          "Disagreement resolution, residual-risk acceptance and suspension authority",
          "Delegated limits and required evidence",
        ],
      },
    ],
  },
  {
    id: "intake",
    category: "Lifecycle",
    title: "AI use-case intake",
    description: "Capture intended purpose, value, users, data, autonomy and initial risk signals.",
    prompt:
      "Complete before experimentation with sensitive data or production access. Involve affected teams when the use could materially affect people.",
    sections: [
      {
        heading: "Use case and value",
        prompts: [
          "Problem and purpose · proposed capability · alternatives · expected outcomes and measures",
        ],
      },
      {
        heading: "People and context",
        prompts: [
          "Users and affected people · decisions supported or made · human role · jurisdictions · scale and reversibility",
        ],
      },
      {
        heading: "Technology and data",
        prompts: [
          "Model, provider and version · tools and permissions · data sources and classifications · retention and transfers · dependencies",
        ],
      },
      {
        heading: "Initial controls and decisions",
        prompts: [
          "Known harms · required evaluations · owners · approvers · decision and conditions · review date · change triggers",
        ],
      },
    ],
  },
  {
    id: "impact",
    category: "Assurance",
    title: "AI impact and risk assessment",
    description: "Record foreseeable harms, affected groups, controls and residual-risk decisions.",
    prompt:
      "Use with legal, privacy, security and domain specialists as applicable. This worksheet does not determine legal applicability by itself.",
    sections: [
      {
        heading: "System and use context",
        prompts: [
          "Intended and foreseeable uses · system boundary · model and data versions · deployment locations",
        ],
      },
      {
        heading: "Affected people and harms",
        prompts: [
          "Affected groups · physical, economic, psychological, privacy, security and societal harms · severity and likelihood",
        ],
      },
      {
        heading: "Risk treatment",
        prompts: [
          "Existing controls and evidence · fairness and accessibility · oversight · residual risks · owners and due dates",
        ],
      },
      {
        heading: "Decision record",
        prompts: [
          "Applicable obligations confirmed by · decision · conditions · accepted residual-risk owner · next review and change triggers",
        ],
      },
    ],
  },
  {
    id: "supplier",
    category: "Assurance",
    title: "AI supplier due diligence",
    description:
      "Review provider transparency, data use, security, performance, changes and exit readiness.",
    prompt:
      "Request evidence proportionate to system criticality. Mark unavailable evidence and compensating controls explicitly.",
    sections: [
      {
        heading: "Provider and service",
        prompts: [
          "Service and model versions · intended use · hosting locations · subprocessors · dependencies",
        ],
      },
      {
        heading: "Data and rights",
        prompts: [
          "Training use · retention and deletion · ownership and permitted use · residency and transfers",
        ],
      },
      {
        heading: "Assurance and security",
        prompts: [
          "Evaluations and limitations · security testing and incidents · access controls · audit reports · vulnerability disclosure",
        ],
      },
      {
        heading: "Contract and continuity",
        prompts: [
          "Change and incident notice · service levels · audit rights · portability · fallback · exit and deletion verification",
        ],
      },
    ],
  },
  {
    id: "release",
    category: "Lifecycle",
    title: "AI release readiness checklist",
    description:
      "Collect the evidence and sign-offs needed before deployment or a material change.",
    prompt:
      "Checklist completion is not automatic approval. Escalate exceptions and unresolved high-severity risks to the designated decision owner.",
    sections: [
      {
        heading: "Accountability and scope",
        prompts: [
          "Inventory current · owners named · intended use approved · affected groups identified",
        ],
      },
      {
        heading: "Risk, data and evaluation",
        prompts: [
          "Impact assessment current · data rights and quality reviewed · subgroup performance tested · safety and security tests passed",
        ],
      },
      {
        heading: "Operations and oversight",
        prompts: [
          "Oversight trained · monitoring owners assigned · rollback tested · incident path exercised",
        ],
      },
      {
        heading: "Approval",
        prompts: [
          "Open risks and conditions · required approvals · release decision · review date",
        ],
      },
    ],
  },
  {
    id: "monitoring",
    category: "Operations",
    title: "Post-deployment monitoring plan",
    description: "Define outcome, drift, safety, fairness, security and operational monitoring.",
    prompt:
      "Select metrics tied to the use case and foreseeable harms. Set thresholds, owners and actions before launch.",
    sections: [
      {
        heading: "Signals and thresholds",
        prompts: [
          "Quality · subgroup outcomes · drift · groundedness · overrides · complaints · guardrail events · security · latency and cost",
        ],
      },
      {
        heading: "Data and review cadence",
        prompts: [
          "Signal sources and retention · sampling · review frequency · thresholds and escalation",
        ],
      },
      {
        heading: "Response actions",
        prompts: [
          "On-call owner · investigation · rollback or suspension criteria · communications",
        ],
      },
      {
        heading: "Reassessment",
        prompts: [
          "Review date · change triggers · evaluation refresh · evidence repository and retention owner",
        ],
      },
    ],
  },
  {
    id: "incident",
    category: "Operations",
    title: "AI incident response plan",
    description: "Prepare containment, investigation, communications, recovery and learning steps.",
    prompt:
      "Align with existing security, privacy, safety and business continuity processes. Confirm notification duties with qualified owners.",
    sections: [
      {
        heading: "Incident scope and severity",
        prompts: [
          "Safety · privacy · security · discrimination · misinformation · unauthorised action · service disruption · near miss",
        ],
      },
      {
        heading: "First response",
        prompts: [
          "Triage owner · affected system and version · containment · evidence preservation · protection of affected people",
        ],
      },
      {
        heading: "Escalation and communications",
        prompts: [
          "Internal path · provider contacts · legal and regulator assessment owner · affected-user communications",
        ],
      },
      {
        heading: "Recovery and learning",
        prompts: [
          "Recovery approval · root-cause review · corrective actions · regression tests · risk update · closure sign-off",
        ],
      },
    ],
  },
];
