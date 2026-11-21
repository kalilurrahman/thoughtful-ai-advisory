export type EvChargingStationNetworkRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EV_CHARGING_STATION_NETWORK_ROUNDS: EvChargingStationNetworkRound[] = [
  {
    id: "identification-availability",
    scenario:
      "An AI system shows charger availability and matches drivers to connectors, but it lists broken or occupied chargers as available, mismatches connector types or starts a session on the wrong charger.",
    choices: [
      "Ensure charger or connector identification, availability and session matching are accurate, with checks for uncertain or stale status and connector data",
      "Rely on last-known charger status and automated matching to keep sessions fast, updating only when drivers report problems",
      "Ask drivers to try nearby chargers or restart sessions themselves if the shown charger does not work",
    ],
    best: 0,
    assurance: "Accurate identification, availability & session matching",
    feedback:
      "Charging networks must get the match right: accurate charger/connector identification, availability and session matching, with checks for uncertainty, help prevent failed sessions and wasted journeys.",
  },
  {
    id: "pricing-terms",
    scenario:
      "The network sets charging rates and session fees, but drivers are not clearly informed of pricing, idle or overstay fees, membership terms or how billing is calculated before the session starts.",
    choices: [
      "Communicate pricing, session and usage terms transparently before the session starts, including idle/overstay fees, membership terms and how billing is calculated",
      "Show a headline per-kWh rate and reveal session, idle or membership fees after charging begins",
      "Rely on posted or app-wide terms that do not clearly explain session-specific charges or fee conditions",
    ],
    best: 0,
    assurance: "Transparent pricing, session & usage terms",
    feedback:
      "Drivers need clear expectations before they plug in: transparent pricing, session and usage terms reduce billing disputes and build trust in the network.",
  },
  {
    id: "fault-safety-handling",
    scenario:
      "A charger faults mid-session, a safety warning appears or a billing error occurs, but detection, reporting and handling are inconsistent and it is unclear who is accountable for resolution.",
    choices: [
      "Support charging fault, safety incident, billing error or outage detection, reporting and handling and accountability with clear processes and documented follow-up",
      "Handle faults and billing issues case by case when drivers contact support, without consistent detection or records",
      "Mark the charger unavailable and leave resolution to general support with no defined accountability",
    ],
    best: 0,
    assurance: "Fault, safety & billing issue handling",
    feedback:
      "Charging involves safety and money: clear detection, reporting and accountable handling of faults, safety incidents, billing errors and outages protect drivers and the network's credibility.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The network stores driver, vehicle, location and charging-session data, but records are hard to trace for billing or safety disputes and personal or location data is retained and shared more than necessary.",
    choices: [
      "Apply privacy and minimisation to driver, vehicle and location or usage data, and log session, billing and incident records for traceability and dispute review",
      "Retain all driver, vehicle, location and session data indefinitely for analytics, planning and future investigations",
      "Keep minimal records to limit data, even when it prevents tracing a session or resolving a billing or safety dispute",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Charging networks should balance privacy and accountability: minimised, safeguarded data with traceable session, billing and incident records supports dispute review without unnecessary exposure.",
  },
  {
    id: "support-fallback",
    scenario:
      "A session fails to start, a charge is disputed, a safety concern is raised or the case is uncertain, but drivers have no clear human support or fallback path.",
    choices: [
      "Provide human support and fallback for charging failures, disputes or uncertain cases, with clear ways to get timely help on the road",
      "Direct drivers to automated help steps only, even when charging, billing or safety issues remain unresolved",
      "Leave resolution to repeated attempts or generic contact forms without a defined support or escalation path",
    ],
    best: 0,
    assurance: "Human support & fallback",
    feedback:
      "Drivers are often away from home when things fail: clear human support and fallback pathways resolve charging failures and disputes promptly and fairly.",
  },
];

export function evChargingStationNetworkScore(answers: Record<string, number>) {
  const done = EV_CHARGING_STATION_NETWORK_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EV_CHARGING_STATION_NETWORK_ROUNDS.length,
  };
}
