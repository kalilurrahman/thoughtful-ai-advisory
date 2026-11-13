import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Circle, MinusCircle } from "@phosphor-icons/react";
import { EmptyChecklist } from "@/features/site/illustrations-empty";
import { Button } from "@/components/ui/button";
import { CHANGE_IMPACT_ROUNDS, scoreChangeImpact } from "./change-impact-game";
import { useGovernance } from "./store";
import { VENDOR_CHALLENGES, vendorChallengeScore } from "./vendor-challenge";
import { INCIDENT_TABLETOP, tabletopResult } from "./tabletop-model";
import { crosswalkScore, FRAMEWORK_CROSSWALK } from "./framework-crosswalk";
import { EVIDENCE_DETECTIVE_ROUNDS, evidenceDetectiveScore } from "./evidence-detective";
import { RED_TEAM_ROUNDS, redTeamScore } from "./red-team-game";
import {
  buildLifecycleChecklist,
  checklistProgress,
  governanceMilestones,
  nextGovernanceChallenge,
} from "./checklist-model";
import { INCLUSIVE_DESIGN_ROUNDS, inclusiveDesignScore } from "./inclusive-design-game";
import {
  GUARDRAIL_ASSURANCE_ROUNDS,
  guardrailAssuranceScore,
} from "./guardrail-assurance-game";
import {
  MONITORING_ASSURANCE_ROUNDS,
  monitoringAssuranceScore,
} from "./monitoring-assurance-game";
import {
  RELEASE_GATE_ASSURANCE_ROUNDS,
  releaseGateAssuranceScore,
} from "./release-gate-assurance-game";
import {
  CORRECTIVE_ACTION_ASSURANCE_ROUNDS,
  correctiveActionAssuranceScore,
} from "./corrective-action-assurance-game";
import {
  RISK_ACCEPTANCE_ASSURANCE_ROUNDS,
  riskAcceptanceAssuranceScore,
} from "./risk-acceptance-assurance-game";

const statusText = {
  complete: "Complete",
  action: "Action needed",
  "not-applicable": "No active records",
};

export function ChecklistScreen() {
  const [inclusionAnswers, setInclusionAnswers] = useState<Record<string, number>>({});
  const [evidenceAnswers, setEvidenceAnswers] = useState<Record<string, string>>({});
  const [redTeamAnswers, setRedTeamAnswers] = useState<Record<string, number>>({});
  const [changeSelections, setChangeSelections] = useState<Record<string, string[]>>({});
  const [changeSubmitted, setChangeSubmitted] = useState<Record<string, boolean>>({});
  const [vendorAnswers, setVendorAnswers] = useState<Record<string, number>>({});
  const [tabletopAnswers, setTabletopAnswers] = useState<Record<string, number>>({});
  const [crosswalkAnswers, setCrosswalkAnswers] = useState<Record<string, number>>({});
  const [guardrailAnswers, setGuardrailAnswers] = useState<Record<string, number>>({});
  const [monitoringAnswers, setMonitoringAnswers] = useState<Record<string, number>>({});
  const [releaseGateAnswers, setReleaseGateAnswers] = useState<Record<string, number>>({});
  const [correctiveAnswers, setCorrectiveAnswers] = useState<Record<string, number>>({});
  const [riskAcceptanceAnswers, setRiskAcceptanceAnswers] = useState<Record<string, number>>({});
  const { state } = useGovernance();
  const phases = buildLifecycleChecklist(state);
  const progress = checklistProgress(phases);
  const milestones = governanceMilestones(phases);
  const vendorScore = vendorChallengeScore(vendorAnswers);
  const tabletop = tabletopResult(tabletopAnswers);
  const crosswalk = crosswalkScore(crosswalkAnswers);
  const evidenceGame = evidenceDetectiveScore(evidenceAnswers);
  const redTeam = redTeamScore(redTeamAnswers);
  const challenge = nextGovernanceChallenge(phases);
  const inclusionScore = inclusiveDesignScore(inclusionAnswers);
  const guardrailGame = guardrailAssuranceScore(guardrailAnswers);
  const monitoringGame = monitoringAssuranceScore(monitoringAnswers);
  const releaseGateGame = releaseGateAssuranceScore(releaseGateAnswers);
  const correctiveGame = correctiveActionAssuranceScore(correctiveAnswers);
  const riskAcceptanceGame = riskAcceptanceAssuranceScore(riskAcceptanceAnswers);
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
      {challenge && (
        <section className="checklist-phase" aria-label="Recommended next challenge">
          <h2>Your next governance challenge · {challenge.phase}</h2>
          <div className="checklist-task checklist-action">
            <Circle weight="duotone" />
            <div>
              <h3>{challenge.title}</h3>
              <p>{challenge.detail}</p>
              <small>{challenge.progress}</small>
            </div>
            <Button variant="default" asChild size="sm">
              <Link to={challenge.href}>
                {challenge.action}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      )}
      <section className="checklist-phase" aria-label="Governance milestones">
        <h2>Governance milestones · {milestones.level}</h2>
        <p>
          {milestones.points} progress points · Earned by completing applicable actions, with extra
          credit for evidence and verification—not by raising self-assessment scores.
        </p>
        <div className="checklist-tasks">
          {milestones.badges.map((badge) => (
            <article
              className={`checklist-task ${badge.earned ? "checklist-complete" : "checklist-action"}`}
              key={badge.id}
            >
              {badge.earned ? <CheckCircle weight="duotone" /> : <Circle weight="duotone" />}
              <div>
                <h3>
                  {badge.title} {badge.earned ? "· Earned" : "· In progress"}
                </h3>
                <p>{badge.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="incident-tabletop" className="checklist-phase" aria-label="AI incident tabletop exercise">
        <h2>Incident tabletop · Contain, coordinate, recover</h2>
        <p>
          Practice a response sequence for a fictional AI incident. Your answers stay in this
          browser session; this exercise does not replace your incident plan or legal review.
        </p>
        <p>
          <strong>
            {tabletop.bestChoices}/{tabletop.answered}
          </strong>{" "}
          sound response choices ·{" "}
          {tabletop.finished && (
            <Button variant="outline" onClick={() => setTabletopAnswers({})}>
              Run exercise again
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCIDENT_TABLETOP.map((step) => {
            const selected = tabletopAnswers[step.id];
            return (
              <article className="checklist-task" key={step.id}>
                <div>
                  <h3>{step.prompt}</h3>
                  {step.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTabletopAnswers((answers) => ({ ...answers, [step.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === step.best ? "Strong response." : "Review the response plan."}
                      </strong>{" "}
                      {step.feedback}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p>
          <a
            href="https://www.nist.gov/itl/ai-risk-management-framework"
            target="_blank"
            rel="noreferrer"
          >
            Reference: NIST AI Risk Management Framework
          </a>
        </p>
      </section>
      <section id="framework-crosswalk" className="checklist-phase" aria-label="Framework crosswalk game">
        <h2>Framework crosswalk · Match the governance move</h2>
        <p>
          Practice recognizing how related activities appear across leading frameworks. This is a
          learning aid, not a compliance determination.
        </p>
        <p>
          <strong>
            {crosswalk.correct}/{crosswalk.attempted}
          </strong>{" "}
          correct ·{" "}
          {crosswalk.complete ? (
            <Button variant="outline" onClick={() => setCrosswalkAnswers({})}>
              Play again
            </Button>
          ) : (
            `${FRAMEWORK_CROSSWALK.length - crosswalk.attempted} rounds remaining`
          )}
        </p>
        <div className="checklist-tasks">
          {FRAMEWORK_CROSSWALK.map((round) => {
            const selected = crosswalkAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.activity}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCrosswalkAnswers((previous) => ({ ...previous, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.correct ? "Correct." : "Try the next round."}
                      </strong>{" "}
                      {round.explanation}{" "}
                      <a href={round.url} target="_blank" rel="noreferrer">
                        Source: {round.source}
                      </a>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="supplier-assurance" className="checklist-phase" aria-label="AI supplier assurance challenge">
        <h2>Supplier assurance challenge</h2>
        <p>
          Practice evidence-led AI vendor due diligence. Scenarios are illustrative and do not
          replace procurement, security, privacy, or legal review.
        </p>
        <p>
          <strong>
            {vendorScore.preferred}/{vendorScore.answered}
          </strong>{" "}
          preferred decisions ·{" "}
          {vendorScore.complete && (
            <Button variant="outline" onClick={() => setVendorAnswers({})}>
              Play again
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VENDOR_CHALLENGES.map((q) => {
            const selected = vendorAnswers[q.id];
            return (
              <article className="checklist-task" key={q.id}>
                <div>
                  <h3>{q.scenario}</h3>
                  {q.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() => setVendorAnswers((answers) => ({ ...answers, [q.id]: index }))}
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === q.preferred
                          ? "Good evidence-first choice."
                          : "Consider the evidence gap."}
                      </strong>{" "}
                      {q.rationale}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="guardrail-assurance" className="checklist-phase" aria-label="Guardrail assurance challenge">
        <h2>Guardrail assurance challenge</h2>
        <p>
          Practice choosing proportionate guardrails and evidence-backed assurance for different AI
          risk tiers. Scenarios are learning prompts, not legal advice or a substitute for context-
          specific review.
        </p>
        <p>
          <strong>
            {guardrailGame.correct}/{guardrailGame.attempted}
          </strong>{" "}
          sound decisions ·{" "}
          {guardrailGame.complete && (
            <Button variant="outline" onClick={() => setGuardrailAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {GUARDRAIL_ASSURANCE_ROUNDS.map((round) => {
            const selected = guardrailAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <small>Risk tier scenario: {round.tier}</small>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setGuardrailAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good guardrail assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="monitoring-assurance" className="checklist-phase" aria-label="Monitoring and assurance signals game">
        <h2>Monitoring & assurance signals</h2>
        <p>
          Practice interpreting post-deployment monitoring signals, guardrail drift/breaches, and
          evidence gaps. Scenarios are learning prompts, not a substitute for your monitoring plan,
          incident response, or specialist review.
        </p>
        <p>
          <strong>
            {monitoringGame.correct}/{monitoringGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {monitoringGame.complete && (
            <Button variant="outline" onClick={() => setMonitoringAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MONITORING_ASSURANCE_ROUNDS.map((round) => {
            const selected = monitoringAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.signal}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMonitoringAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assurance response."
                          : "Review the assurance signal."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="release-gate-assurance" className="checklist-phase" aria-label="Release gate and assurance readiness game">
        <h2>Release gate & assurance readiness</h2>
        <p>
          Practice go/no-go decisions, conditional approvals, required evidence/guardrail readiness,
          and change-triggered reassessment. Scenarios are learning prompts, not a substitute for
          your release process, accountable approvals, or specialist review.
        </p>
        <p>
          <strong>
            {releaseGateGame.correct}/{releaseGateGame.attempted}
          </strong>{" "}
          sound readiness decisions ·{" "}
          {releaseGateGame.complete && (
            <Button variant="outline" onClick={() => setReleaseGateAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RELEASE_GATE_ASSURANCE_ROUNDS.map((round) => {
            const selected = releaseGateAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setReleaseGateAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good release-gate decision."
                          : "Review the readiness gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="corrective-action-assurance" className="checklist-phase" aria-label="Corrective action and effectiveness verification game">
        <h2>Corrective action & effectiveness verification</h2>
        <p>
          Practice turning findings into owned corrective actions, requiring completion evidence,
          verifying effectiveness, and following up when fixes do not address root causes. Scenarios
          are learning prompts, not a substitute for your corrective-action process or specialist
          review.
        </p>
        <p>
          <strong>
            {correctiveGame.correct}/{correctiveGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {correctiveGame.complete && (
            <Button variant="outline" onClick={() => setCorrectiveAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CORRECTIVE_ACTION_ASSURANCE_ROUNDS.map((round) => {
            const selected = correctiveAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCorrectiveAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good corrective-action assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="risk-acceptance-assurance" className="checklist-phase" aria-label="Risk acceptance and governance decision assurance game">
        <h2>Risk acceptance & decision assurance</h2>
        <p>
          Practice accountable approvals, time-bound risk acceptance, review triggers, and evidence-
          backed rationale/conditions. Scenarios are learning prompts, not a substitute for your
          decision process, legal review, or specialist assessment.
        </p>
        <p>
          <strong>
            {riskAcceptanceGame.correct}/{riskAcceptanceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {riskAcceptanceGame.complete && (
            <Button variant="outline" onClick={() => setRiskAcceptanceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RISK_ACCEPTANCE_ASSURANCE_ROUNDS.map((round) => {
            const selected = riskAcceptanceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRiskAcceptanceAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good decision assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="inclusive-design" className="checklist-phase" aria-label="Inclusive AI design game">
        <h2>Inclusive design challenge</h2>
        <p>
          Practice identifying evaluation, accessibility, and recourse gaps. Scenarios are learning
          prompts, not a substitute for impact assessment or consultation with affected communities.
        </p>
        <p>
          {inclusionScore.sound}/{inclusionScore.attempted} thoughtful decisions ·{" "}
          {inclusionScore.complete && (
            <Button variant="outline" onClick={() => setInclusionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCLUSIVE_DESIGN_ROUNDS.map((round) => {
            const selected = inclusionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.prompt}</h3>
                  {round.options.map((option, index) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setInclusionAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {option}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Strong inclusive-design choice."
                          : "Consider the missing safeguard."}
                      </strong>{" "}
                      {round.lesson}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="evidence-detective" className="checklist-phase" aria-label="Evidence detective game">
        <h2>Evidence detective · Is it decision-grade?</h2>
        <p>
          Classify the strength of a governance evidence sample. Quality judgments are illustrative;
          adapt evidence criteria to your organization and applicable obligations.
        </p>
        <p>
          {evidenceGame.correct}/{evidenceGame.answered} identified ·{" "}
          {evidenceGame.complete && (
            <Button variant="outline" onClick={() => setEvidenceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EVIDENCE_DETECTIVE_ROUNDS.map((round) => {
            const selected = evidenceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.evidence}</h3>
                  {["Weak", "Partial", "Strong"].map((grade) => (
                    <Button
                      key={grade}
                      size="sm"
                      variant={selected === grade ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEvidenceAnswers((previous) => ({ ...previous, [round.id]: grade }))
                      }
                    >
                      {grade}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assessment."
                          : `Better classification: ${round.best}.`}
                      </strong>{" "}
                      {round.lesson}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="red-team-defender" className="checklist-phase" aria-label="AI security defender game">
        <h2>AI red-team / defender challenge</h2>
        <p>
          Practice defending against fictional prompt injection, data exfiltration, and unsafe tool
          use. No attack payloads are executed; use the concepts to strengthen approved controls.
        </p>
        <p>
          <strong>
            {redTeam.defended}/{redTeam.attempted}
          </strong>{" "}
          defended ·{" "}
          {redTeam.complete && (
            <Button variant="outline" onClick={() => setRedTeamAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RED_TEAM_ROUNDS.map((round) => {
            const selected = redTeamAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.prompt}</h3>
                  {round.options.map((option, index) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRedTeamAnswers((current) => ({ ...current, [round.id]: index }))
                      }
                    >
                      {option}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>{selected === round.best ? "Defended." : "Control gap."}</strong>{" "}
                      {round.feedback}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <a
          href="https://www.nist.gov/itl/ai-risk-management-framework"
          target="_blank"
          rel="noreferrer"
        >
          NIST AI RMF reference
        </a>
      </section>

      <section id="change-impact" className="checklist-phase" aria-label="AI change impact challenge">
        <h2>Change-impact challenge</h2>
        <p>
          Identify areas requiring review before implementing a system change. This practice
          exercise does not replace the formal change-review workflow.
        </p>
        <div className="checklist-tasks">
          {CHANGE_IMPACT_ROUNDS.map((round) => {
            const selected = changeSelections[round.id] ?? [];
            const result = changeSubmitted[round.id] ? scoreChangeImpact(round.id, selected) : null;
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.change}</h3>
                  {[
                    "Purpose or intended use",
                    "Data source or processing",
                    "Model or AI provider",
                    "Integration or deployment context",
                    "Controls or operating procedure",
                  ].map((category) => (
                    <label className="block" key={category}>
                      <input
                        type="checkbox"
                        disabled={Boolean(result)}
                        checked={selected.includes(category)}
                        onChange={(event) =>
                          setChangeSelections((current) => ({
                            ...current,
                            [round.id]: event.target.checked
                              ? [...(current[round.id] ?? []), category]
                              : (current[round.id] ?? []).filter((item) => item !== category),
                          }))
                        }
                      />{" "}
                      {category}
                    </label>
                  ))}
                  {!result && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setChangeSubmitted((current) => ({ ...current, [round.id]: true }))
                      }
                    >
                      Check answer
                    </Button>
                  )}
                  {result && (
                    <p role="status">
                      <strong>
                        {result.correct ? "Good change map." : "Review the change map."}
                      </strong>{" "}
                      {result.feedback}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
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
          <div className="empty-state muted">
            <EmptyChecklist />
            <p>Register systems to assess profile completeness.</p>
          </div>
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
