/**
 * AEGIS use-case risk tiering (preliminary, explainable) — TypeScript port of
 * platform/app/assessment-engine/aegis_assessment/risk_tier.py.
 *
 * Produces a PRELIMINARY risk tier with a factor-by-factor rationale. Output is
 * labelled *Inferred* and always `requires_human_confirmation: true`: a risk tier
 * becomes authoritative only when an approver confirms it.
 *
 * The EU AI Act category screen is an indicative trigger for legal review, NOT a
 * legal classification under Art. 6 / Annex III.
 */
import { controlCitation } from "../content";
import { hasKey, isPlainObject, pyStr, pyStrip } from "./shield/py";

export const DECISION_IMPACT: Record<string, number> = {
  none: 0,
  advisory: 5,
  material: 20,
  automated_decision: 30,
};
export const AFFECTED: Record<string, number> = {
  internal: 0,
  customers: 10,
  public: 15,
  vulnerable: 25,
};
export const SENSITIVITY: Record<string, number> = {
  public: 0,
  internal: 5,
  confidential: 10,
  personal: 15,
  special_category: 25,
};
export const AUTONOMY: Record<string, number> = {
  none: 0,
  suggests: 5,
  acts_with_approval: 15,
  acts_autonomously: 30,
};

// Indicative screens. Categories echo EU AI Act Annex III areas; inclusion is a trigger for legal review only.
export const ANNEX_III_LIKE: Record<string, string> = {
  biometric: "Biometrics (Annex III area 1)",
  critical_infrastructure: "Critical infrastructure (Annex III area 2)",
  education: "Education and vocational training (Annex III area 3)",
  employment: "Employment and worker management (Annex III area 4)",
  essential_services: "Access to essential private/public services (Annex III area 5)",
  credit: "Creditworthiness / credit scoring (Annex III area 5)",
  insurance: "Life/health insurance risk and pricing (Annex III area 5)",
  law_enforcement: "Law enforcement (Annex III area 6)",
  migration: "Migration, asylum and border control (Annex III area 7)",
  justice: "Administration of justice and democratic processes (Annex III area 8)",
};
export const SECTOR_SENSITIVE: Record<string, number> = {
  healthcare: 20,
  financial_services: 10,
  public_sector: 10,
};
const CATEGORY_POINTS = 30;

const PROHIBITED_SCREEN_TERMS: Array<[string, string]> = [
  ["social scoring", "Social scoring"],
  ["social score", "Social scoring"],
  ["emotion recognition", "Emotion recognition (workplace/education contexts)"],
  ["subliminal", "Subliminal or manipulative techniques"],
  ["manipulat", "Manipulative techniques exploiting vulnerabilities"],
  ["untargeted scraping", "Untargeted scraping of facial images"],
  ["facial image scraping", "Untargeted scraping of facial images"],
  ["predictive policing", "Crime prediction based solely on profiling"],
  ["biometric categori", "Biometric categorisation inferring sensitive attributes"],
  ["real-time remote biometric", "Real-time remote biometric identification in public spaces"],
];

const WRITE_TOOL_HINTS = [
  "write",
  "update",
  "delete",
  "send",
  "email",
  "pay",
  "transfer",
  "export",
  "post",
  "create",
  "execute",
  "deploy",
  "refund",
  "approve",
  "trade",
];

export const KEY_FIELDS = [
  "purpose",
  "decision_impact",
  "affected_parties",
  "data_sensitivity",
  "autonomy",
  "domain_category",
] as const;

export const INTAKE_FIELDS: Record<string, string> = {
  name: "What is the AI system or use case called?",
  purpose: "What is the intended purpose of the system, in one or two sentences?",
  decision_impact:
    "Does the system's output inform or make decisions about people? (none / advisory / material / automated_decision)",
  affected_parties: "Who is affected by its outputs? (internal / customers / public / vulnerable)",
  data_sensitivity:
    "What is the most sensitive data it processes? (public / internal / confidential / personal / special_category)",
  autonomy: "How autonomous is it? (none / suggests / acts_with_approval / acts_autonomously)",
  domain_category:
    "Which domain does it operate in? (e.g. customer_service, credit, employment, healthcare, education, internal_productivity, other)",
  tools: "Which tools, APIs, plugins or databases can it access?",
  external_actions:
    "Can it take actions outside your organization (send emails, payments, posts)? (yes/no)",
  eu_exposure: "Is it placed on the EU market or does it affect people in the EU? (yes/no)",
  vendor_model: "Does it use a third-party / vendor model or AI product? (yes/no)",
  genai: "Is it a generative AI / LLM-based system? (yes/no)",
  environment: "Which environment is it in? (development / staging / production)",
};

export type RiskTier = "Low" | "Medium" | "High" | "Prohibited-review";

export const TIER_RULES: Record<
  RiskTier,
  { approval_authority: string; review_cadence_months: number }
> = {
  Low: { approval_authority: "Product Owner with AI CoE review", review_cadence_months: 24 },
  Medium: { approval_authority: "AI Risk Lead", review_cadence_months: 12 },
  High: { approval_authority: "AI Governance Forum", review_cadence_months: 6 },
  "Prohibited-review": {
    approval_authority: "Legal and AI Governance Forum (default: do not proceed)",
    review_cadence_months: 0,
  },
};

export const RISK_TIER_METHOD =
  "AEGIS risk-tier rules v1.0 (thresholds: High >= 60 or any high-risk trigger; Medium >= 30)";

/** Profile accepted by the risk tiering engine (all fields optional; booleans may be "yes"/"no"). */
export interface RiskProfile {
  name?: string;
  purpose?: string;
  description?: string;
  decision_impact?: string;
  affected_parties?: string;
  data_sensitivity?: string;
  autonomy?: string;
  domain_category?: string;
  environment?: string;
  tools?: string[] | string;
  external_actions?: boolean | string;
  eu_exposure?: boolean | string;
  vendor_model?: boolean | string;
  genai?: boolean | string;
  /** Profiles are persisted in authenticated workspace snapshots; keep values JSON-safe. */
  [key: string]: string | boolean | string[] | undefined;
}

export interface RiskFactor {
  factor: string;
  value: string | boolean;
  points: number;
  citation: string;
}

export interface RiskTierResult {
  tier: RiskTier;
  score: number;
  provisional: boolean;
  factors: RiskFactor[];
  triggers: string[];
  missing_fields: string[];
  clarifying_questions: string[];
  required_modules: string[];
  approval_authority: string;
  review_cadence_months: number;
  evidence_status: "Inferred";
  requires_human_confirmation: true;
  rationale: string;
  citations: string[];
  citation_ids: string[];
  method: string;
}

/** Python `_bool`: None -> null; bool -> itself; otherwise truthy strings yes/true/y/1. */
function toBool(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  return ["true", "yes", "y", "1"].includes(pyStrip(pyStr(v)).toLowerCase());
}

function lookup(table: Record<string, number>, v: unknown): number | undefined {
  return typeof v === "string" && hasKey(table, v) ? table[v] : undefined;
}

function isMissing(v: unknown): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** Calculate the preliminary (Inferred) risk tier for a use-case profile. */
export function calculateRiskTier(
  profile: RiskProfile | Record<string, unknown> | null | undefined,
): RiskTierResult {
  const p: Record<string, unknown> = isPlainObject(profile) ? { ...profile } : {};
  const get = (k: string): unknown => (hasKey(p, k) ? p[k] : undefined);
  const factors: RiskFactor[] = [];
  const triggers: string[] = [];
  const citations = new Set<string>(["EI-02", "GL-01"]);
  let score = 0;

  const add = (factor: string, value: string | boolean, points: number, cite: string) => {
    score += points;
    citations.add(cite);
    factors.push({ factor, value, points, citation: controlCitation(cite) });
  };

  const missing = KEY_FIELDS.filter((f) => isMissing(get(f))) as string[];

  const di = get("decision_impact");
  const diPts = lookup(DECISION_IMPACT, di);
  if (diPts !== undefined) add("decision_impact", di as string, diPts, "GL-02");
  const ap = get("affected_parties");
  const apPts = lookup(AFFECTED, ap);
  if (apPts !== undefined) add("affected_parties", ap as string, apPts, "EI-04");
  const ds = get("data_sensitivity");
  const dsPts = lookup(SENSITIVITY, ds);
  if (dsPts !== undefined) add("data_sensitivity", ds as string, dsPts, "IS-03");
  const au = get("autonomy");
  const auPts = lookup(AUTONOMY, au);
  if (auPts !== undefined) add("autonomy", au as string, auPts, "IS-09");

  const rawTools = get("tools");
  let tools: unknown[] = [];
  if (typeof rawTools === "string") {
    tools = rawTools
      .split(",")
      .map((t) => pyStrip(t))
      .filter(Boolean);
  } else if (Array.isArray(rawTools)) {
    tools = rawTools;
  }
  const writeTools = tools.filter((t) => {
    const s = pyStr(t).toLowerCase();
    return WRITE_TOOL_HINTS.some((h) => s.includes(h));
  });
  if (tools.length) {
    add(
      "tool_access",
      `${tools.length} tool(s), ${writeTools.length} with write/act capability`,
      5 + (writeTools.length ? 10 : 0),
      "IS-11",
    );
  }
  const ext = toBool(get("external_actions"));
  if (ext) add("external_actions", true, 10, "IS-13");

  const rawCat = get("domain_category");
  const cat = rawCat ? pyStrip(pyStr(rawCat)).toLowerCase() : "";
  const eu = toBool(get("eu_exposure"));
  const annex = hasKey(ANNEX_III_LIKE, cat) ? ANNEX_III_LIKE[cat] : undefined;
  if (annex !== undefined) {
    add("domain_category", `${cat} — ${annex}`, CATEGORY_POINTS, "AO-07");
    if (eu) {
      triggers.push(
        `Potential EU AI Act high-risk area: ${annex} — legal classification review required (Art. 6)`,
      );
    }
  } else if (hasKey(SECTOR_SENSITIVE, cat)) {
    add("domain_category", cat, SECTOR_SENSITIVE[cat] ?? 0, "AO-07");
  } else if (cat) {
    add("domain_category", cat, 0, "EI-02");
  }

  if (toBool(get("genai"))) add("generative_ai", true, 5, "IS-14");
  if (toBool(get("vendor_model"))) add("third_party_model", true, 5, "GL-11");
  if (eu) add("eu_exposure", true, 5, "AO-07");

  // High-risk triggers (any => High)
  const material = di === "material" || di === "automated_decision";
  if (annex !== undefined && material) {
    triggers.push("Material or automated decisions in a sensitive (Annex III-like) domain");
  }
  if (au === "acts_autonomously" && (ext || writeTools.length)) {
    triggers.push("Autonomous agent with write or external-action capability");
  }
  if (ds === "special_category" && material) {
    triggers.push("Special-category data used for material decisions");
  }
  if (ap === "vulnerable" && material) {
    triggers.push("Material decisions affecting vulnerable people");
  }

  // Prohibited-practice screen (text match on purpose/description/name)
  const text = ["purpose", "description", "name"]
    .map((k) => (hasKey(p, k) ? pyStr(p[k]) : ""))
    .join(" ")
    .toLowerCase();
  const prohibited = [
    ...new Set(PROHIBITED_SCREEN_TERMS.filter(([term]) => text.includes(term)).map(([, l]) => l)),
  ].sort();

  let tier: RiskTier;
  if (prohibited.length) {
    tier = "Prohibited-review";
    citations.add("AO-10");
    for (const x of prohibited) {
      triggers.push(`Possible prohibited practice (EU AI Act Art. 5 screen): ${x}`);
    }
  } else if (score >= 60 || triggers.some((t) => !t.startsWith("Potential EU AI Act"))) {
    tier = "High";
  } else if (score >= 30) {
    tier = "Medium";
  } else {
    tier = "Low";
  }

  const provisional = missing.length > 0;
  if (missing.length >= 3 && tier === "Low") {
    tier = "Medium"; // safest default when key facts are unknown
    triggers.push("Tier floored at Medium because key intake facts are missing (safest default)");
  }

  // Required assessment modules
  const genai = toBool(get("genai"));
  const mods = ["core"];
  if (
    ds === "personal" ||
    ds === "special_category" ||
    ds === "confidential" ||
    missing.includes("data_sensitivity")
  ) {
    mods.push("data_privacy");
  }
  const tierHighish = tier === "High" || tier === "Prohibited-review";
  if (tier !== "Low" || tools.length) mods.push("security");
  if (genai) mods.push("genai_llm");
  if (tools.length || au === "acts_with_approval" || au === "acts_autonomously")
    mods.push("agentic");
  if (tierHighish || material || ap === "public" || ap === "vulnerable")
    mods.push("fairness_safety");
  if (tierHighish || material || au === "acts_with_approval" || au === "acts_autonomously") {
    mods.push("human_oversight");
  }
  if (toBool(get("vendor_model"))) mods.push("vendor_third_party");

  const rules = TIER_RULES[tier];
  citations.add("GL-02");
  citations.add("GL-03");
  const fmtValue = (v: string | boolean) => (typeof v === "boolean" ? (v ? "True" : "False") : v);
  const rationaleBits = factors
    .filter((f) => f.points)
    .map((f) => `${f.factor}=${fmtValue(f.value)} (+${f.points})`);
  const rationale =
    `Preliminary tier ${tier} (score ${score}). ` +
    (rationaleBits.length ? `Drivers: ${rationaleBits.join("; ")}. ` : "") +
    (triggers.length ? `Triggers: ${triggers.join("; ")}. ` : "") +
    (missing.length ? `Provisional — missing: ${missing.join(", ")}. ` : "") +
    "Inferred from user-provided intake; requires human confirmation.";

  const citationIds = [...citations].sort();
  return {
    tier,
    score,
    provisional,
    factors,
    triggers,
    missing_fields: missing,
    clarifying_questions: missing.map((f) => INTAKE_FIELDS[f] ?? f),
    required_modules: mods,
    approval_authority: rules.approval_authority,
    review_cadence_months: rules.review_cadence_months,
    evidence_status: "Inferred",
    requires_human_confirmation: true,
    rationale,
    citations: citationIds.map((c) => controlCitation(c)),
    citation_ids: citationIds,
    method: RISK_TIER_METHOD,
  };
}
