import { useMemo, useState } from "react";
import { ArrowRight, Compass, Path } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PLAYBOOK_CHAPTERS } from "@/data/playbook";
import { Kicker } from "./screens-core";

const roles = {
  Executive: {
    description: "Set direction, assign accountability and ask for evidence leaders can act on.",
    chapters: ["01-mandate", "04-risk", "12-improve", "09-operations"],
    actions: [
      "Name an accountable executive and decision forum",
      "Approve risk appetite and escalation thresholds",
      "Review portfolio risks, incidents and overdue actions",
    ],
    tools: [
      { label: "View workspace assessment", to: "/assess" as const },
      { label: "Prepare an audit pack", to: "/export" as const },
    ],
  },
  "AI governance lead": {
    description:
      "Build the operating model, connect obligations to controls and keep the programme moving.",
    chapters: ["01-mandate", "02-inventory", "03-use-cases", "04-risk", "12-improve"],
    actions: [
      "Publish the governance charter and lifecycle RACI",
      "Establish intake, inventory and risk review",
      "Turn control gaps into owned quarterly actions",
    ],
    tools: [
      { label: "Review the assessment", to: "/assess" as const },
      { label: "Open governance templates", to: "/templates" as const },
      { label: "Build the roadmap", to: "/roadmap" as const },
    ],
  },
  "Product and engineering": {
    description:
      "Move a use case safely from intake through testing, release and production monitoring.",
    chapters: [
      "03-use-cases",
      "05-data",
      "06-security",
      "07-human",
      "09-operations",
      "10-incidents",
    ],
    actions: [
      "Register the use case and intended purpose",
      "Threat-model data, model and tool pathways",
      "Agree release evidence, monitoring and rollback before launch",
    ],
    tools: [
      { label: "Register a system", to: "/inventory" as const },
      { label: "Configure guardrails", to: "/guardrails" as const },
      { label: "Review release readiness", to: "/gates" as const },
    ],
  },
  "Legal and privacy": {
    description:
      "Clarify applicability, rights, data protection and the evidence needed for accountable decisions.",
    chapters: ["04-risk", "05-data", "08-suppliers", "11-transparency"],
    actions: [
      "Map jurisdictions, affected people and applicable obligations",
      "Review personal-data purpose, rights, retention and transfers",
      "Record advice, conditions and evidence gaps in the decision file",
    ],
    tools: [
      { label: "Review checked sources", to: "/knowledge" as const },
      { label: "Open impact assessment template", to: "/templates" as const },
    ],
  },
  "Security and operations": {
    description:
      "Bound system authority and prepare teams to detect, contain and learn from failures.",
    chapters: ["02-inventory", "06-security", "08-suppliers", "09-operations", "10-incidents"],
    actions: [
      "Discover AI endpoints, integrations and vendor dependencies",
      "Apply least privilege, adversarial testing and monitored guardrails",
      "Exercise incident escalation, rollback and kill-switch procedures",
    ],
    tools: [
      { label: "Open the inventory", to: "/inventory" as const },
      { label: "Configure guardrails", to: "/guardrails" as const },
      { label: "Review release gates", to: "/gates" as const },
    ],
  },
} as const;

const goals = {
  "Establish foundations": ["01-mandate", "02-inventory", "03-use-cases", "04-risk", "12-improve"],
  "Launch a use case": [
    "03-use-cases",
    "04-risk",
    "05-data",
    "06-security",
    "07-human",
    "09-operations",
  ],
  "Scale the portfolio": [
    "02-inventory",
    "08-suppliers",
    "09-operations",
    "11-transparency",
    "12-improve",
  ],
  "Improve assurance": [
    "04-risk",
    "06-security",
    "09-operations",
    "10-incidents",
    "11-transparency",
    "12-improve",
  ],
} as const;

const stages = {
  "Getting started":
    "Start with a clear mandate, a lightweight register and a consistent intake. Pilot the workflow on a small number of representative systems.",
  "Scaling adoption":
    "Prioritise repeatable controls, supplier coverage, reusable evidence and production monitoring across teams.",
  "Mature programme":
    "Focus on control effectiveness, independent challenge, outcome trends and continuous improvement across the portfolio.",
} as const;

export function StartScreen() {
  const [role, setRole] = useState<keyof typeof roles>("AI governance lead");
  const [goal, setGoal] = useState<keyof typeof goals>("Establish foundations");
  const [stage, setStage] = useState<keyof typeof stages>("Getting started");
  const journey = roles[role];
  const recommended = useMemo(() => {
    const ranking = goals[goal];
    return journey.chapters
      .map((id) => PLAYBOOK_CHAPTERS.find((chapter) => chapter.id === id))
      .filter((chapter): chapter is (typeof PLAYBOOK_CHAPTERS)[number] => Boolean(chapter))
      .sort((a, b) => {
        const aRank = ranking.indexOf(a.id as (typeof ranking)[number]);
        const bRank = ranking.indexOf(b.id as (typeof ranking)[number]);
        return (aRank < 0 ? ranking.length : aRank) - (bRank < 0 ? ranking.length : bRank);
      })
      .slice(0, 5);
  }, [goal, journey]);

  return (
    <>
      <div className="resource-intro">
        <Compass weight="duotone" />
        <div>
          <Kicker>Your AI governance starting path</Kicker>
          <p>
            Choose your role, programme stage and immediate goal. AEGIS will suggest a focused
            reading path and first actions.
          </p>
        </div>
      </div>
      <section className="journey-controls">
        <label>
          Your role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as keyof typeof roles)}
          >
            {Object.keys(roles).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Programme stage
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value as keyof typeof stages)}
          >
            {Object.keys(stages).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Immediate goal
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value as keyof typeof goals)}
          >
            {Object.keys(goals).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>
      <div className="journey-summary">
        <Kicker>
          {role} · {stage}
        </Kicker>
        <p>{journey.description}</p>
        <p className="muted">{stages[stage]}</p>
      </div>
      <section className="journey-section">
        <div className="section-heading">
          <h2>Recommended reading</h2>
          <span className="muted">
            {recommended.length} chapters · ordered for “{goal.toLowerCase()}”
          </span>
        </div>
        <div className="journey-chapters">
          {recommended.map((chapter, index) => (
            <article key={chapter.id}>
              <span className="journey-step">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <Kicker>{chapter.part}</Kicker>
                <h3>{chapter.title}</h3>
                <p className="muted">{chapter.standfirst}</p>
              </div>
              <Button asChild variant="link">
                <Link to="/playbook" hash={chapter.id}>
                  Read <ArrowRight />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
      <section className="journey-section">
        <div className="section-heading">
          <h2>First actions</h2>
          <Path weight="duotone" />
        </div>
        <ol className="journey-actions">
          {journey.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      </section>
      <section className="journey-section">
        <div className="section-heading">
          <h2>Open the right tools</h2>
        </div>
        <div className="journey-tools">
          {journey.tools.map((tool) => (
            <Button asChild key={tool.to + tool.label} variant="outline">
              <Link to={tool.to}>
                {tool.label}
                <ArrowRight />
              </Link>
            </Button>
          ))}
        </div>
      </section>
      <p className="footnote">
        This path is a suggested learning sequence. Tailor approvals, controls and review depth to
        the use case, jurisdiction and people affected.
      </p>
    </>
  );
}
