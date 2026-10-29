// Plan catalogue shared by the Plans screen and the billing entitlements.
// Prices are deliberately not listed here: `platform/content/commercial/pricing_models.md` holds
// them as hypotheses that must not be published without the commercial lead's approval. The
// amount a customer pays is set on the matching Dodo Payments product and shown at checkout.

export type PlanId = "free" | "team" | "business" | "enterprise";

export interface PlanLimits {
  /** Paid operator seats; approvers and viewers are always free. */
  operatorSeats: number;
  aiSystems: number;
  workspaces: number;
  /** Signed-in AI advisor requests per user per day. */
  advisorPerDay: number;
  evidenceStorageMb: number;
  /** Reports without the "Free plan" watermark. */
  unwatermarkedReports: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  buyer: string;
  summary: string;
  includes: string[];
  priceLabel: string;
  /** Self-serve plans are bought through Dodo checkout; the others start with a conversation. */
  selfServe: boolean;
  limits: PlanLimits;
}

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    buyer: "Evaluating",
    summary: "Learn the method and run a first private workspace.",
    includes: [
      "Public tools, playbook and templates",
      "One private workspace, up to 5 AI systems",
      "Markdown and CSV exports",
    ],
    priceLabel: "Free",
    selfServe: false,
    limits: {
      operatorSeats: 1,
      aiSystems: 5,
      workspaces: 1,
      advisorPerDay: 5,
      evidenceStorageMb: 0,
      unwatermarkedReports: false,
    },
  },
  {
    id: "team",
    name: "Team",
    buyer: "First governance hire",
    summary: "Run an AI governance programme with a small team.",
    includes: [
      "Everything in Free",
      "Up to 50 AI systems and 5 operator seats",
      "Unlimited free approvers and viewers",
      "Reports without watermark",
      "AI advisor with a daily allowance",
    ],
    priceLabel: "Monthly or annual subscription · price shown at checkout",
    selfServe: true,
    limits: {
      operatorSeats: 5,
      aiSystems: 50,
      workspaces: 3,
      advisorPerDay: 50,
      evidenceStorageMb: 5_000,
      unwatermarkedReports: true,
    },
  },
  {
    id: "business",
    name: "Business",
    buyer: "Governance function",
    summary: "Governance across business units, with integrations and an industry pack.",
    includes: [
      "Everything in Team",
      "Up to 250 AI systems and 15 operator seats",
      "One industry pack",
      "Priority support",
    ],
    priceLabel: "Annual subscription · price shown at checkout",
    selfServe: true,
    limits: {
      operatorSeats: 15,
      aiSystems: 250,
      workspaces: 10,
      advisorPerDay: 200,
      evidenceStorageMb: 50_000,
      unwatermarkedReports: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    buyer: "Regulated enterprise",
    summary: "Runtime Shield, assurance and enterprise controls, scoped with you.",
    includes: [
      "Everything in Business",
      "Runtime Shield policies and assurance testing",
      "All industry packs, data residency and custom retention",
      "Governance Baseline engagement credited to year one",
    ],
    priceLabel: "Annual agreement · scoped with you",
    selfServe: false,
    limits: {
      operatorSeats: 1_000,
      aiSystems: 10_000,
      workspaces: 100,
      advisorPerDay: 1_000,
      evidenceStorageMb: 500_000,
      unwatermarkedReports: true,
    },
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}
