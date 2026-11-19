export type AviationAirTrafficRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AVIATION_AIR_TRAFFIC_ROUNDS: AviationAirTrafficRound[] = [
  {
    id: "automation-bias",
    scenario:
      "An AI decision-support tool suggests a runway or spacing change during a busy period. A controller feels uneasy, but the interface presents the suggestion as high confidence and makes it hard to reject or override quickly.",
    choices: [
      "Keep human authority clear: controllers can override or reject AI advice quickly, and the system treats human judgement as final for safety-critical decisions",
      "Follow the AI suggestion because it is usually more efficient than manual judgement",
      "Require a second AI model to confirm the suggestion before the controller can act",
    ],
    best: 0,
    assurance: "Human authority & override",
    feedback:
      "Advisory AI must not erode human authority: safety-critical decisions need clear override paths and interfaces that support, rather than pressure, professional judgement.",
  },
  {
    id: "edge-conditions",
    scenario:
      "The model performed well in routine simulations, but it has not been validated in severe weather, degraded sensors, unusual traffic mixes or other edge conditions the operation can face.",
    choices: [
      "Validate performance in edge cases, degraded conditions and novel scenarios before relying on it operationally",
      "Deploy it now and rely on routine performance metrics until a problem appears",
      "Limit validation to the scenarios the vendor included in its demo data",
    ],
    best: 0,
    assurance: "Validation in degraded conditions",
    feedback:
      "Safety-relevant AI must be tested beyond routine cases: validate behaviour in degraded and novel conditions so surprises do not appear first in live operations.",
  },
  {
    id: "traceability",
    scenario:
      "After an unsafe separation event, investigators cannot reconstruct what the AI recommended, which inputs it used or which model version was running at the time.",
    choices: [
      "Log decisions, inputs and model versions so AI-influenced actions can be traced and investigated",
      "Rely on controller recollections and general system logs to piece together what happened",
      "Keep detailed logs only when an incident is already suspected",
    ],
    best: 0,
    assurance: "Traceability & investigation",
    feedback:
      "Traceability supports learning and accountability: record what the AI saw, recommended and which version ran so investigations can establish facts, not guesses.",
  },
  {
    id: "baseline-drift",
    scenario:
      "A team pushes a model and procedure update to improve efficiency, but the change is not reviewed against certified or approved operational baselines and there is no controlled rollback path.",
    choices: [
      "Control changes, review them against certified or approved operational baselines, and keep a tested rollback path",
      "Roll out the update broadly because the metrics improved in a short trial",
      "Document the change after deployment if no issues are reported",
    ],
    best: 0,
    assurance: "Change control & baseline separation",
    feedback:
      "Operational changes need discipline: keep AI and procedure updates controlled, reviewed against approved baselines, and reversible if behaviour is not as expected.",
  },
  {
    id: "manual-fallback",
    scenario:
      "The AI support system becomes unavailable and staff have not recently practised manual procedures or coordination steps needed to sustain safe operations under load.",
    choices: [
      "Maintain and rehearse degraded modes, manual procedures and coordination so safe operations continue if AI fails",
      "Assume the system will recover quickly because outages have been rare",
      "Pause AI-dependent tasks and improvise manual handling during the event",
    ],
    best: 0,
    assurance: "Manual fallback & coordination",
    feedback:
      "Fallback is only effective if people can use it: rehearse manual procedures and coordination so loss of AI support does not become loss of safe control.",
  },
];

export function aviationAirTrafficScore(answers: Record<string, number>) {
  const done = AVIATION_AIR_TRAFFIC_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AVIATION_AIR_TRAFFIC_ROUNDS.length,
  };
}
