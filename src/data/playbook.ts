export type PlaybookChapter = {
  id: string;
  part: string;
  title: string;
  standfirst: string;
  outcomes: string[];
  sections: { heading: string; body: string; actions: string[] }[];
  tools: {
    label: string;
    href:
      | "/assess"
      | "/inventory"
      | "/guardrails"
      | "/gates"
      | "/roadmap"
      | "/knowledge"
      | "/export"
      | "/";
  }[];
};

const chapter = (
  id: string,
  part: string,
  title: string,
  standfirst: string,
  outcomes: string[],
  sections: PlaybookChapter["sections"],
  tools: PlaybookChapter["tools"],
): PlaybookChapter => ({ id, part, title, standfirst, outcomes, sections, tools });

export const PLAYBOOK_CHAPTERS: PlaybookChapter[] = [
  chapter(
    "01-mandate",
    "01 · Govern",
    "Make AI governance a management system",
    "Turn responsible AI intent into accountable decisions, repeatable evidence and a cadence leaders can operate.",
    [
      "Named executive accountability",
      "Policy hierarchy and escalation",
      "Cross-functional review cadence",
    ],
    [
      {
        heading: "Start with decision rights",
        body: "Governance is the system that decides what AI may do, who may approve it, what evidence is required and when a deployment must stop. Assign an accountable executive and give product, legal, security, data and risk owners explicit rights.",
        actions: [
          "Approve an AI governance charter",
          "Publish a lifecycle RACI",
          "Set an executive review cadence",
        ],
      },
      {
        heading: "Set the policy stack",
        body: "Layer an enterprise policy, data and security standards, use-case procedures, supplier requirements and technical controls. Each layer should point to evidence and an owner instead of repeating principles.",
        actions: [
          "Define permitted, restricted and prohibited uses",
          "Record exceptions with expiry dates",
          "Link policy to control tests",
        ],
      },
    ],
    [
      { label: "Assess governance controls", href: "/assess" },
      { label: "Open the knowledge hub", href: "/knowledge" },
    ],
  ),
  chapter(
    "02-inventory",
    "02 · Map",
    "Know where AI is operating",
    "Build a living register covering models, agents, embedded features, vendors, data flows and business owners.",
    ["One AI estate register", "Shadow-AI discovery", "Criticality and data classification"],
    [
      {
        heading: "Inventory the whole estate",
        body: "Include experiments, production services, copilots, vendor features and agents. Capture purpose, owner, users, data, model or vendor, geography, permissions, lifecycle state and dependencies.",
        actions: [
          "Require registration before production access",
          "Reconcile SSO, procurement and cloud telemetry",
          "Review completeness quarterly",
        ],
      },
      {
        heading: "Classify context, not labels alone",
        body: "Risk depends on the use, affected people, autonomy, data, scale and reversibility of the decision. Screen every use case, then escalate high-impact or regulated contexts for legal and risk review.",
        actions: [
          "Record affected populations and jurisdictions",
          "Link classification to the release gate",
          "Review material changes",
        ],
      },
    ],
    [
      { label: "Open AI inventory", href: "/inventory" },
      { label: "Review release readiness", href: "/gates" },
    ],
  ),
  chapter(
    "03-use-cases",
    "03 · Map",
    "Control the use-case lifecycle",
    "Move from idea to retirement with intake that captures value, harm, autonomy, data and evidence requirements.",
    ["Consistent intake record", "Stage gates", "Retirement and change process"],
    [
      {
        heading: "Ask whether AI is the right intervention",
        body: "Document the user problem, decision being improved, expected value and non-AI alternatives. Governance is stronger when it can stop low-value automation before it creates durable risk.",
        actions: [
          "Define measurable benefit",
          "Name the human decision owner",
          "Set success, failure and stop conditions",
        ],
      },
      {
        heading: "Treat change as a new decision",
        body: "Model changes, new tools, data, geographies and autonomy can change risk. Use versioned approvals and lightweight re-review triggers so teams move quickly without losing traceability.",
        actions: [
          "Version the use-case record",
          "Set re-review triggers",
          "Archive retired systems and evidence",
        ],
      },
    ],
    [
      { label: "Model your roadmap", href: "/roadmap" },
      { label: "Use the inventory intake", href: "/inventory" },
    ],
  ),
  chapter(
    "04-risk",
    "04 · Measure",
    "Assess risk and impact before harm",
    "Combine risk registers, impact assessments, legal applicability and affected-person analysis into one decision record.",
    ["Risk and control register", "Impact assessment", "Residual-risk acceptance"],
    [
      {
        heading: "Make risk specific",
        body: "Describe the harm, pathway, likelihood, severity, affected people, existing controls and residual exposure. Separate model performance from deployment risk: accuracy alone does not make a system safe or lawful.",
        actions: [
          "Use a common risk taxonomy",
          "Assess disparate impact and accessibility",
          "Record residual-risk acceptance",
        ],
      },
      {
        heading: "Map obligations to evidence",
        body: "Track laws, sector rules, contracts and internal policies by jurisdiction. Map every obligation to a control owner and evidence item, marking assumptions that require legal confirmation.",
        actions: [
          "Maintain an applicability matrix",
          "Link obligations to control tests",
          "Set regulatory review dates",
        ],
      },
    ],
    [
      { label: "Run the AEGIS assessment", href: "/assess" },
      { label: "Explore checked sources", href: "/knowledge" },
    ],
  ),
  chapter(
    "05-data",
    "05 · Measure",
    "Govern data, privacy and provenance",
    "Make data lineage, quality, minimisation, rights and retention visible before data reaches a model or agent.",
    [
      "Documented lineage",
      "Privacy and retention decisions",
      "Quality and representativeness checks",
    ],
    [
      {
        heading: "Know what crosses the boundary",
        body: "Record sources, transformations, sensitive attributes, residency, retention and onward transfers. Apply minimisation and purpose limitation to prompts, retrieval stores, fine-tuning sets, logs and evaluation data.",
        actions: [
          "Classify data before model calls",
          "Mask or tokenize sensitive fields",
          "Define deletion and retention controls",
        ],
      },
      {
        heading: "Test quality and impact",
        body: "Check representativeness, missingness, label reliability, drift and consequences across groups. Preserve provenance so reviewers can explain where a result came from and which version was used.",
        actions: [
          "Define data-quality thresholds",
          "Test meaningful subgroups",
          "Retain provenance with evaluations",
        ],
      },
    ],
    [
      { label: "Configure guardrails", href: "/guardrails" },
      { label: "Review controls", href: "/assess" },
    ],
  ),
  chapter(
    "06-security",
    "06 · Measure",
    "Engineer security for models and agents",
    "Treat prompt injection, supply-chain risk, data leakage and excessive agency as security conditions, not edge cases.",
    ["AI threat model", "Adversarial testing", "Least-privilege tools and secrets"],
    [
      {
        heading: "Threat-model the full pathway",
        body: "Map users, prompts, retrieval, tools, model providers, outputs and downstream actions. Test direct and indirect injection, jailbreaks, sensitive-information disclosure, poisoned content and insecure outputs.",
        actions: [
          "Maintain an AI threat model",
          "Run adversarial tests in CI",
          "Track findings to release decisions",
        ],
      },
      {
        heading: "Bound agent authority",
        body: "Agents need only the tools, scopes, spend, network access and data visibility required for the task. Irreversible or high-impact actions need human approval, limits and a tested kill switch.",
        actions: [
          "Allow-list tools and destinations",
          "Require approval for irreversible actions",
          "Rotate and isolate credentials",
        ],
      },
    ],
    [
      { label: "Design the guardrail bundle", href: "/guardrails" },
      { label: "Check the release gate", href: "/gates" },
    ],
  ),
  chapter(
    "07-human",
    "07 · Manage",
    "Design meaningful human oversight",
    "Make human involvement capable, informed and empowered to intervene—not a checkbox after the model has acted.",
    ["Clear decision ownership", "Escalation thresholds", "Training and accessibility safeguards"],
    [
      {
        heading: "Put people in the right place",
        body: "Decide whether a person approves, reviews, supervises, samples or can reverse an action. Give enough context, time, training and authority to disagree; avoid automation bias and impossible intervention.",
        actions: [
          "Define roles by risk tier",
          "Test override usability",
          "Measure override quality",
        ],
      },
      {
        heading: "Protect affected people",
        body: "Explain relevant decisions in accessible language, provide notice and contestability where required, and offer routes to correct data or outcomes. Involve representative users in design and testing.",
        actions: [
          "Publish user-facing notices",
          "Provide appeal and correction routes",
          "Include accessibility in acceptance tests",
        ],
      },
    ],
    [
      { label: "Review assessment evidence", href: "/assess" },
      { label: "Plan remediation", href: "/roadmap" },
    ],
  ),
  chapter(
    "08-suppliers",
    "08 · Govern",
    "Hold vendors and partners to the same standard",
    "Procurement is a governance control: contract for transparency, security, assurance, change notice and exit.",
    [
      "Supplier due diligence",
      "Contractual AI requirements",
      "Evidence that survives provider change",
    ],
    [
      {
        heading: "Ask for usable evidence",
        body: "Translate supplier claims into evidence: model and data documentation, security testing, incidents, evaluation results, subprocessors, data use, retention, residency and service commitments. Record what is unavailable.",
        actions: [
          "Use a risk-tiered questionnaire",
          "Verify material claims",
          "Set evidence refresh intervals",
        ],
      },
      {
        heading: "Plan for provider change",
        body: "A model update, new subprocessor, changed terms or degraded service can change risk. Architecture and contracts should support notice, testing, rollback, portability and termination.",
        actions: [
          "Define material-change notification",
          "Maintain a tested fallback",
          "Include exit and deletion obligations",
        ],
      },
    ],
    [
      { label: "Open the knowledge hub", href: "/knowledge" },
      { label: "Build a release gate", href: "/gates" },
    ],
  ),
  chapter(
    "09-operations",
    "09 · Manage",
    "Operate with monitoring and assurance",
    "Production governance is an operating discipline: measure quality, safety, fairness, cost, drift and control health.",
    ["Monitoring plan", "Post-deployment evaluation", "Evidence retained for review"],
    [
      {
        heading: "Monitor what matters",
        body: "Define metrics for quality, groundedness, latency, cost, drift, guardrail triggers, security, fairness, overrides and complaints. Set thresholds and named on-call owners.",
        actions: [
          "Create a production monitoring plan",
          "Review metrics on a defined cadence",
          "Alert on control failure and drift",
        ],
      },
      {
        heading: "Assure over time",
        body: "A launch approval is not permanent. Re-evaluate after material changes, incidents, new data, new populations and at scheduled intervals. Keep evidence connected to the version and decision it supports.",
        actions: [
          "Schedule periodic re-approval",
          "Sample real outcomes",
          "Retain evaluation and sign-off evidence",
        ],
      },
    ],
    [
      { label: "Check guardrail coverage", href: "/guardrails" },
      { label: "Review the gate", href: "/gates" },
    ],
  ),
  chapter(
    "10-incidents",
    "10 · Manage",
    "Respond to incidents and near misses",
    "Make AI failures legible, containable and learnable with severity, escalation, notification and recovery paths.",
    ["AI incident taxonomy", "Containment and kill switch", "Post-incident learning"],
    [
      {
        heading: "Prepare before failure",
        body: "Define incidents and near misses across safety, privacy, security, discrimination, misinformation, service degradation and unauthorised action. Make ownership and escalation visible to operators and suppliers.",
        actions: [
          "Set severity and notification rules",
          "Exercise the kill switch",
          "Publish an incident intake route",
        ],
      },
      {
        heading: "Close the learning loop",
        body: "Contain, preserve evidence, notify the right parties and investigate contributing factors. Feed lessons into risk registers, tests, guardrails, training and supplier decisions.",
        actions: [
          "Run blameless reviews",
          "Add regression tests",
          "Verify corrective actions independently",
        ],
      },
    ],
    [
      { label: "Add remediation actions", href: "/roadmap" },
      { label: "Review critical controls", href: "/assess" },
    ],
  ),
  chapter(
    "11-transparency",
    "11 · Govern",
    "Explain, document and engage",
    "Transparency is purpose-led: give each audience information to make a safe decision or exercise a right.",
    [
      "Audience-specific documentation",
      "Traceable decision records",
      "Feedback and contestability",
    ],
    [
      {
        heading: "Document for the lifecycle",
        body: "Maintain a concise system record, model and data facts, limitations, evaluations, decision logs, approvals, incidents and changes. Write for operators, affected people, auditors, executives and regulators.",
        actions: [
          "Create a minimum evidence pack",
          "Record limitations and intended use",
          "Version public and internal notices",
        ],
      },
      {
        heading: "Use transparency to improve control",
        body: "Good explanations support action: when to trust, when to verify, how to appeal, how to report a problem and who is accountable. Test comprehension rather than page count.",
        actions: [
          "Test notices with real users",
          "Publish contact and appeal routes",
          "Review complaints and feedback",
        ],
      },
    ],
    [
      { label: "Build an audit pack", href: "/export" },
      { label: "Read the source register", href: "/knowledge" },
    ],
  ),
  chapter(
    "12-improve",
    "12 · Improve",
    "Scale maturity through evidence",
    "Use a measured improvement loop to move from ad hoc controls to a resilient, learning governance capability.",
    [
      "Prioritised improvement backlog",
      "Actionable metrics",
      "Independent review and continual improvement",
    ],
    [
      {
        heading: "Measure capability, not theatre",
        body: "Track whether controls are present, effective, evidenced and used. Combine leading measures such as review coverage with lagging measures such as incidents, complaints, drift and remediation age.",
        actions: [
          "Set control health indicators",
          "Review gaps by risk",
          "Audit evidence freshness",
        ],
      },
      {
        heading: "Make improvement normal",
        body: "Prioritise high-risk gaps, assign owners and dates, fund foundations and revisit the operating model as AI changes. Use independent assurance for high-impact systems and be transparent about uncertainty.",
        actions: [
          "Run a quarterly governance review",
          "Refresh the roadmap from live evidence",
          "Reassess after material change",
        ],
      },
    ],
    [
      { label: "Prioritise the roadmap", href: "/roadmap" },
      { label: "Review the AEGIS index", href: "/" },
    ],
  ),
];
