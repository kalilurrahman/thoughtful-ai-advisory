export const EVIDENCE_DETECTIVE_ROUNDS = [
  {
    id: "policy",
    evidence:
      "A signed AI policy says all systems must have human oversight. No system-level record exists.",
    best: "Partial",
    lesson:
      "A policy shows intent, but operational records are needed to show the control is implemented for this system.",
  },
  {
    id: "vendor",
    evidence:
      "A vendor slide claims ‘99% accurate’ with no date, test population, methodology, or intended-use detail.",
    best: "Weak",
    lesson:
      "A claim without scope, method, population, and traceable source is not decision-grade evidence.",
  },
  {
    id: "monitoring",
    evidence:
      "A dated monitoring report identifies the system/version, metric, threshold, owner, exceptions, and remediation ticket.",
    best: "Strong",
    lesson:
      "Evidence is stronger when current, attributable, scoped, reproducible, and linked to an accountable response.",
  },
  {
    id: "training",
    evidence:
      "A training attendance record lists the course and date but not attendees’ roles or assessment of understanding.",
    best: "Partial",
    lesson:
      "Attendance supports participation, but role relevance and demonstrated understanding strengthen AI literacy evidence.",
  },
] as const;
export function evidenceDetectiveScore(answers: Record<string, string>) {
  const done = EVIDENCE_DETECTIVE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    answered: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EVIDENCE_DETECTIVE_ROUNDS.length,
  };
}
