export type EmergencyResponseRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EMERGENCY_RESPONSE_ROUNDS: EmergencyResponseRound[] = [
  {
    id: "auto-downgrade",
    scenario:
      "A triage model downgrades a call because the transcript is fragmented and the caller is struggling to speak, and the system routes it to a slower queue with no human review.",
    choices: [
      "Keep a trained human in final control of prioritisation and fail safe towards sending help when inputs are degraded",
      "Keep the routing because the model confidence was below the threshold for an urgent response",
      "Ask the caller to redial and describe the emergency more clearly",
    ],
    best: 0,
    assurance: "Fail-safe human control",
    feedback:
      "Degraded input is not lower risk: ambiguous calls should fail safe towards sending help, with a trained person able to override the score.",
  },
  {
    id: "unequal-response",
    scenario:
      "Analysis shows the model consistently assigns lower urgency to calls from certain neighbourhoods and to non-native speakers, but the team has not tested for bias because the vendor reported good overall accuracy.",
    choices: [
      "Test triage outcomes for bias by location, language, disability and demographic group, not just overall accuracy",
      "Accept the vendor's overall accuracy because it is audited annually",
      "Tune the model on the under-served group later, once enough local data accumulates",
    ],
    best: 0,
    assurance: "Outcome bias testing",
    feedback:
      "Overall accuracy can hide who waits longest: validate outcomes by location, language and disability so slower help is not built into the system.",
  },
  {
    id: "no-person",
    scenario:
      "A caller wants to speak to a dispatcher but the AI call-handling flow offers no route to a person and staff on shift cannot see what the model is asking or deciding.",
    choices: [
      "Tell callers and frontline staff when AI is involved and give them a clear route to a person",
      "Leave the AI flow as the only option to keep call-handling time down",
      "Tell callers at the end of the call that an AI system assisted, if they ask",
    ],
    best: 0,
    assurance: "Transparency & human access",
    feedback:
      "People in an emergency need to reach a person: callers and staff should know when AI is involved and be able to bypass it.",
  },
  {
    id: "vendor-trust",
    scenario:
      "The service is asked to justify its triage thresholds after a delayed response, but it only has the vendor's benchmark results and no record of outcomes, overrides or false negatives from its own calls.",
    choices: [
      "Validate triage logic against local outcomes and log decisions and overrides for review",
      "Rely on the vendor's published benchmarks because the model was procured through an approved contract",
      "Reconstruct the incident from dispatch notes without system logs",
    ],
    best: 0,
    assurance: "Outcome validation & logging",
    feedback:
      "Vendor benchmarks are not your evidence: validate against local outcomes and keep logs of decisions and overrides so a delayed response can be examined.",
  },
  {
    id: "model-outage",
    scenario:
      "The triage system goes down during a peak period and dispatchers, who have not rehearsed a manual process, scramble to improvise while calls queue.",
    choices: [
      "Rehearse a manual dispatch process and keep it ready for model failure or outage",
      "Wait for the vendor to restore service because the manual process is slower",
      "Ask callers to use an online form until the system is back",
    ],
    best: 0,
    assurance: "Manual fallback",
    feedback:
      "Manual fallback is only real if people have drilled it: rehearse dispatch without the model so an outage does not become a response failure.",
  },
];

export function emergencyResponseScore(answers: Record<string, number>) {
  const done = EMERGENCY_RESPONSE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EMERGENCY_RESPONSE_ROUNDS.length,
  };
}
