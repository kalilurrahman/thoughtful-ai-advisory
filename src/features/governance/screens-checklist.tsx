import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Circle, MinusCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useGovernance } from "./store";
import { buildLifecycleChecklist, checklistProgress, governanceMilestones } from "./checklist-model";
import { GOVERNANCE_GAME_QUESTIONS, scoreGovernanceRound } from "./governance-games";

const statusText = {
  complete: "Complete",
  action: "Action needed",
  "not-applicable": "No active records",
};

export function ChecklistScreen() {
  const [gameAnswers, setGameAnswers] = useState<Record<string, number>>({});
  const { state } = useGovernance();
  const phases = buildLifecycleChecklist(state);
  const progress = checklistProgress(phases);
  const milestones = governanceMilestones(phases);
  const gameScore = scoreGovernanceRound(gameAnswers);
  const profiles = state.systems.map((system, index) => {
    const fields = [system.kind, system.owner, system.vendor, system.data];
    const complete = fields.filter((value, fieldIndex) =>
      fieldIndex === 0
        ? value.trim() !== "" && value !== "Registered system"
        : fieldIndex === 1
          ? value.trim() !== "" && value !== "Unassigned"
          : value.trim() !== "" && value !== "Not specified",
    ).length;
    return { system, index, complete };
  });

  return (
    <>
      <section className="checklist-intro">
        <h2>Governance lifecycle review</h2>
        <p>
          This checklist is derived from the live workspace inventory, governance assessment,
          guardrails, release gate, roadmap and incident register. Maturity, guardrail and
          release-gate results remain workspace-level; system cards below measure inventory-profile
          completeness only.
        </p>
      </section>
      <section className="checklist-progress" aria-label="Lifecycle checklist progress">
        <div>
          <strong>{progress.percent}%</strong>
          <span>
            {progress.complete} of {progress.total} applicable checks complete
          </span>
        </div>
        <progress
          max={progress.total || 1}
          value={progress.complete}
          aria-label="Applicable checklist completion"
        />
      </section>
      <section className="checklist-phase" aria-label="Governance milestones">
        <h2>Governance milestones · {milestones.level}</h2>
        <p>{milestones.points} progress points · Earned by completing applicable actions, with extra credit for evidence and verification—not by raising self-assessment scores.</p>
        <div className="checklist-tasks">
          {milestones.badges.map((badge) => (
            <article className={`checklist-task ${badge.earned ? "checklist-complete" : "checklist-action"}`} key={badge.id}>
              {badge.earned ? <CheckCircle weight="duotone" /> : <Circle weight="duotone" />}
              <div><h3>{badge.title} {badge.earned ? "· Earned" : "· In progress"}</h3><p>{badge.detail}</p></div>
            </article>
          ))}
        </div>
      </section>
      <section className="checklist-phase" aria-label="Governance scenario game">
        <h2>Governance scenario arcade</h2>
        <p>Choose the strongest next governance action. Learn the reasoning and revisit missed scenarios. Practice only—this is not legal advice, a certification, or a compliance determination.</p>
        <p><strong>{gameScore.correct}/{gameScore.attempted}</strong> correct · {gameScore.complete ? "Round complete" : `${GOVERNANCE_GAME_QUESTIONS.length - gameScore.attempted} scenarios left`}</p>
        <div className="checklist-tasks">
          {GOVERNANCE_GAME_QUESTIONS.map((question) => {
            const selected = gameAnswers[question.id];
            return <article className="checklist-task" key={question.id}><div>
              <h3>{question.topic}</h3><p>{question.prompt}</p>
              {question.options.map((option, index) => <Button key={option} variant={selected === index ? "default" : "outline"} size="sm" disabled={selected !== undefined} onClick={() => setGameAnswers((current) => ({ ...current, [question.id]: index }))}>{option}</Button>)}
              {selected !== undefined && <p role="status"><strong>{selected === question.answer ? "Correct." : "Not quite."}</strong> {question.why} <a href={question.url} target="_blank" rel="noreferrer">Source: {question.source}</a></p>}
            </div></article>;
          })}
        </div>
        {gameScore.complete && <Button variant="outline" onClick={() => setGameAnswers({})}>Play again</Button>}
      </section>
      <div className="checklist-phases">
        {phases.map((phase) => (
          <section className="checklist-phase" key={phase.id}>
            <h2>{phase.title}</h2>
            <div className="checklist-tasks">
              {phase.tasks.map((task) => {
                const Icon =
                  task.status === "complete"
                    ? CheckCircle
                    : task.status === "action"
                      ? Circle
                      : MinusCircle;
                return (
                  <article className={`checklist-task checklist-${task.status}`} key={task.id}>
                    <Icon weight="duotone" />
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.detail}</p>
                      <small>{task.progress}</small>
                    </div>
                    <span className="checklist-status">{statusText[task.status]}</span>
                    <Button variant="ghost" asChild size="sm">
                      <Link to={task.href}>
                        {task.action}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <section className="checklist-phase system-profile-checks">
        <h2>System profile completeness</h2>
        <p className="muted">
          These checks assess whether inventory fields are present. They do not calculate an
          individual system’s governance score or determine legal applicability.
        </p>
        {profiles.length === 0 ? (
          <p className="empty-state muted">Register systems to assess profile completeness.</p>
        ) : (
          <div className="checklist-tasks">
            {profiles.map(({ system, index, complete }) => (
              <article
                className={`checklist-task ${complete === 4 ? "checklist-complete" : "checklist-action"}`}
                key={`${system.name}-${index}`}
              >
                {complete === 4 ? <CheckCircle weight="duotone" /> : <Circle weight="duotone" />}
                <div>
                  <h3>{system.name}</h3>
                  <p>
                    {system.kind} · Preliminary tier: {system.tier} · Governance disposition:{" "}
                    {system.status}
                  </p>
                  <small>
                    {complete} of 4 profile fields complete: system type, owner, supplier and data
                    classification
                  </small>
                </div>
                <Button variant="ghost" asChild size="sm">
                  <Link to="/inventory">
                    Review profile & tier
                    <ArrowRight />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="footnote">
        A readiness checklist supports internal governance coordination. It is not a certification,
        compliance conclusion or legal applicability assessment.
      </p>
    </>
  );
}
