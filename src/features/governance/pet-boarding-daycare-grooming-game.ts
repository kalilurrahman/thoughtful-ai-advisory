export type PetBoardingDaycareGroomingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PET_BOARDING_DAYCARE_GROOMING_ROUNDS: PetBoardingDaycareGroomingRound[] = [
  {
    id: "identification-instructions",
    scenario:
      "An AI system matches pets to bookings and displays care instructions, but it misidentifies a pet or misses owner-provided feeding, routine or handling notes, risking incorrect care.",
    choices: [
      "Capture pet identification and owner-provided care instructions accurately, with checks for uncertain or high-needs cases",
      "Rely on automated matching and default routines to keep check-in and care moving quickly",
      "Ask owners to restate instructions if a problem is noticed, without verifying them at intake",
    ],
    best: 0,
    assurance: "Accurate identification & care instructions",
    feedback:
      "Safe, consistent care depends on getting the basics right: accurate identification and owner-provided instructions, with checks for uncertain or high-needs cases, help prevent avoidable mistakes.",
  },
  {
    id: "welfare-incident-handling",
    scenario:
      "During boarding, daycare or grooming, a pet shows signs of distress or an incident occurs, but observation is inconsistent and there is no clear process for detection, response and documentation.",
    choices: [
      "Support health and welfare observation, incident detection and handling with clear checks and documented response steps",
      "Address issues informally as staff notice them without consistent observation or incident records",
      "Focus on routine services and document only serious incidents after the fact",
    ],
    best: 0,
    assurance: "Welfare observation & incident handling",
    feedback:
      "Trustworthy care requires timely, accountable responses: consistent observation and clear detection, handling and documentation help protect pets and support fair review of incidents.",
  },
  {
    id: "consent-communication",
    scenario:
      "The service uses AI to send updates and manage bookings, but owners are not clearly informed about services, pricing or terms, and consent for photos, updates or sharing is unclear.",
    choices: [
      "Communicate owner consent, updates and service terms transparently before and during care, recording relevant choices",
      "Send automated updates and apply standard terms without clearly explaining options or obtaining specific consent",
      "Provide details only when an owner asks, to reduce messages and check-in time",
    ],
    best: 0,
    assurance: "Transparent consent & communication",
    feedback:
      "Owners need clarity and control: transparent communication of services, terms and consent helps set expectations and respects owner choices during care.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "Cameras and systems capture images and detailed data about pets and owners for monitoring and updates, but retention is excessive and care actions or records are not consistently logged for review.",
    choices: [
      "Apply privacy and minimisation to owner and pet data or images, and log care actions and records for traceability and review",
      "Retain all images and activity data by default to support marketing and future questions",
      "Keep minimal records to limit data, even when it prevents reviewing what care was provided or what happened",
    ],
    best: 0,
    assurance: "Privacy, traceability & care records",
    feedback:
      "Responsible services balance privacy and accountability: minimised, safeguarded data with traceable care records supports review without unnecessary retention or exposure.",
  },
  {
    id: "review-fallback",
    scenario:
      "A pet has unusual needs, a possible welfare concern arises or there is a dispute about care, but staff have no clear path for human review, escalation or fallback when the system is uncertain.",
    choices: [
      "Provide human review, escalation and fallback for incidents, welfare concerns or uncertain cases, with clear paths to act promptly",
      "Follow automated recommendations or routines by default to keep operations consistent",
      "Leave escalation and exception handling to individual staff judgement without guidance or clear routes",
    ],
    best: 0,
    assurance: "Human review, escalation & fallback",
    feedback:
      "Welfare concerns and uncertain situations need prompt human judgement: clear review, escalation and fallback pathways help protect pets and resolve issues responsibly.",
  },
];

export function petBoardingDaycareGroomingScore(answers: Record<string, number>) {
  const done = PET_BOARDING_DAYCARE_GROOMING_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PET_BOARDING_DAYCARE_GROOMING_ROUNDS.length,
  };
}
