export type PurposeBoundaryAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PURPOSE_BOUNDARY_ASSURANCE_ROUNDS: PurposeBoundaryAssuranceRound[] = [
  {
    id: "defined-use",
    scenario:
      "An AI system is deployed without clearly defined approved use cases, intended users, or prohibited/unintended uses.",
    choices: [
      "Define and document approved use cases, intended context/users, and prohibited or out-of-scope uses with accountable owners",
      "Allow any use as long as users find it helpful",
      "Describe the system broadly without specifying boundaries or restrictions",
    ],
    best: 0,
    assurance: "Defined use cases and boundaries",
    feedback:
      "Purpose and boundary assurance starts with clear, documented approved uses, context, and prohibited or out-of-scope uses so governance and guardrails are meaningful.",
  },
  {
    id: "enforce-boundaries",
    scenario:
      "Users submit requests that fall outside the system's intended purpose, but there are no guardrails or guidance to refuse, redirect, or escalate safely.",
    choices: [
      "Enforce boundaries with guardrails and guidance to refuse, redirect, or escalate out-of-scope requests appropriately",
      "Attempt to fulfill all requests to maximize usefulness",
      "Rely on users to judge whether a request is appropriate",
    ],
    best: 0,
    assurance: "Boundary enforcement and guardrails",
    feedback:
      "Assurance requires enforcing scope: guardrails and clear handling for out-of-bounds requests reduce misuse and unintended impacts.",
  },
  {
    id: "repurposing-review",
    scenario:
      "A team wants to repurpose or expand the AI system to a new context, population, or decision type without reassessing risks, suitability, or approvals.",
    choices: [
      "Review repurposing/expansion for suitability, risks, and required controls, and obtain appropriate approvals before changing scope",
      "Expand use immediately because the system already works elsewhere",
      "Treat repurposing as a minor change that needs no review",
    ],
    best: 0,
    assurance: "Repurposing and scope-change review",
    feedback:
      "New contexts can change risks and suitability; scope changes should trigger reassessment, controls, and approvals rather than automatic reuse.",
  },
  {
    id: "communication-evidence",
    scenario:
      "Operators and users are unclear about what the system is for and not for, and there is little evidence that boundaries are communicated and followed.",
    choices: [
      "Communicate boundaries to users/operators, provide guidance, and maintain evidence of adherence, monitoring, and corrective action when boundaries are crossed",
      "Assume boundaries are understood without communication or checks",
      "Document boundaries internally but never share or verify them in practice",
    ],
    best: 0,
    assurance: "Communication and adherence evidence",
    feedback:
      "Purpose limitation assurance depends on communicating boundaries and evidencing adherence through guidance, monitoring, and corrective action when needed.",
  },
];

export function purposeBoundaryAssuranceScore(answers: Record<string, number>) {
  const done = PURPOSE_BOUNDARY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PURPOSE_BOUNDARY_ASSURANCE_ROUNDS.length,
  };
}
