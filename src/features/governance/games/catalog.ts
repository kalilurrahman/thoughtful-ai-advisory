export const GOVERNANCE_GAMES = [
  {
    id: "framework-crosswalk",
    title: "Framework crosswalk",
    category: "Framework fluency",
    description:
      "Match governance activities to NIST AI RMF, ISO/IEC 42001, and EU AI Act concepts.",
    anchor: "framework-crosswalk",
    difficulty: "Beginner",
    minutes: 5,
    tags: ["NIST", "ISO 42001", "EU AI Act"],
  },
  {
    id: "incident-tabletop",
    title: "Incident tabletop",
    category: "Operational readiness",
    description:
      "Practice containment, coordinated escalation, and safe recovery in a fictional incident.",
    anchor: "incident-tabletop",
    difficulty: "Intermediate",
    minutes: 8,
    tags: ["Incident response", "Containment", "Recovery"],
  },
] as const;
