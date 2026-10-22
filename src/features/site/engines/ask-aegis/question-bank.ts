/**
 * Use-case question bank, deterministic intake extraction and preliminary risk tiering, ported from
 * aegis_agent/question_bank.py, aegis_agent/extraction.py and aegis_assessment/risk_tier.py.
 * Every extracted value is a candidate (Inferred) and every tier is preliminary (Inferred,
 * requires human confirmation).
 */
import { getControl, useCaseTemplate } from "../../content";

export type ProfileValue = string | boolean | string[];
export type Profile = Record<string, ProfileValue>;

type Condition = Record<string, unknown>;

export interface UseCaseQuestion {
  id: string;
  text: string;
  controls: string[];
  evidence_expected: string[];
  remediation: string;
  domain?: string;
  applies_when?: Condition[];
  module: string;
  module_name: string;
}

interface ModuleRaw {
  id: string;
  name: string;
  description?: string;
  applies_when?: Condition[];
  questions: Array<Omit<UseCaseQuestion, "module" | "module_name">>;
}

export interface IntakeField {
  id: string;
  required?: boolean;
  type: "text" | "select" | "boolean" | "list";
  prompt: string;
  options?: Array<string | number>;
}

interface GuardrailDef {
  id: string;
  title: string;
  controls: string[];
  applies_when?: Condition[];
}

const bank = (useCaseTemplate ?? {}) as {
  template: { id: string; version: string; name: string };
  modules: ModuleRaw[];
  intake_fields: IntakeField[];
  runtime_guardrails?: GuardrailDef[];
};

export const templateMeta = bank.template;
export const modules: ModuleRaw[] = bank.modules ?? [];
export const intakeFields: IntakeField[] = bank.intake_fields ?? [];

const questionsById = new Map<string, UseCaseQuestion>();
for (const m of modules) {
  for (const q of m.questions ?? []) {
    questionsById.set(q.id, {
      ...q,
      controls: q.controls ?? [],
      evidence_expected: q.evidence_expected ?? [],
      module: m.id,
      module_name: m.name,
    });
  }
}

export function allQuestions(): UseCaseQuestion[] {
  return [...questionsById.values()];
}

export function getQuestion(qid: string): UseCaseQuestion | undefined {
  return qid ? questionsById.get(qid.toUpperCase()) : undefined;
}

export function intakeField(id: string): IntakeField | undefined {
  return intakeFields.find((f) => f.id === id);
}

export function moduleById(id: string): ModuleRaw | undefined {
  return modules.find((m) => m.id === id);
}

/** Python-style str() of a profile value ("True", "a, b"). */
export function pyValue(v: ProfileValue | undefined): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "True" : "False";
  return v ?? "None";
}

// --------------------------------------------------------------------------- applicability
function conditionHolds(
  cond: Condition,
  profile: Profile,
  tier: string | null,
  required: string[],
): boolean {
  if (cond["always"]) return true;
  if ("tier_in" in cond) return (cond["tier_in"] as string[]).includes(tier ?? "");
  if ("profile" in cond) {
    return Object.entries(cond["profile"] as Record<string, unknown>).every(
      ([k, v]) => profile[k] === v,
    );
  }
  if ("profile_in" in cond) {
    return Object.entries(cond["profile_in"] as Record<string, unknown[]>).every(([k, vals]) =>
      vals.includes(profile[k] as unknown),
    );
  }
  if ("has_tools" in cond) {
    const tools = profile["tools"];
    return (Array.isArray(tools) && tools.length > 0) === Boolean(cond["has_tools"]);
  }
  if ("required_module" in cond) {
    const target = String(cond["required_module"]).toLowerCase();
    const norm = required.map((m) =>
      String(m)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, ""),
    );
    return norm.some((n) => target === n || n.includes(target));
  }
  return false;
}

function applies(
  conds: Condition[] | undefined,
  profile: Profile,
  tier: string | null,
  required: string[],
) {
  if (!conds || !conds.length) return true;
  return conds.some((c) => conditionHolds(c, profile, tier, required));
}

function describeCondition(c: Condition): string {
  if (c["always"]) return "applies to every use case";
  if ("tier_in" in c) return `risk tier is ${(c["tier_in"] as string[]).join(" or ")}`;
  if ("profile" in c) {
    return Object.entries(c["profile"] as Record<string, unknown>)
      .map(([k, v]) => `${k} = ${String(v).toLowerCase()}`)
      .join(", ");
  }
  if ("profile_in" in c) {
    return Object.entries(c["profile_in"] as Record<string, unknown[]>)
      .map(([k, v]) => `${k} in [${v.map(String).join(", ")}]`)
      .join(", ");
  }
  if ("has_tools" in c) return "the system has tool access";
  if ("required_module" in c)
    return `risk tiering requires the ${String(c["required_module"])} module`;
  return JSON.stringify(c);
}

export interface SelectedModule {
  id: string;
  name: string;
  reasons: string[];
}

export function selectModules(
  profile: Profile,
  tier: string | null,
  required: string[] = [],
): SelectedModule[] {
  const out: SelectedModule[] = [];
  for (const m of modules) {
    const reasons = (m.applies_when ?? []).filter((c) =>
      conditionHolds(c, profile, tier, required),
    );
    if (reasons.length)
      out.push({ id: m.id, name: m.name, reasons: reasons.map(describeCondition) });
  }
  return out;
}

export function applicableQuestions(
  profile: Profile,
  tier: string | null,
  required: string[] = [],
): UseCaseQuestion[] {
  const qs: UseCaseQuestion[] = [];
  for (const m of selectModules(profile, tier, required)) {
    for (const q of moduleById(m.id)?.questions ?? []) {
      const full = questionsById.get(q.id);
      if (full && applies(q.applies_when, profile, tier, required)) qs.push(full);
    }
  }
  return qs;
}

// --------------------------------------------------------------------------- extraction
const DOMAIN: Array<[RegExp, string]> = [
  [/\b(credit|loan|lending|underwrit|creditworth)/, "credit"],
  [
    /\b(hiring|recruit|cv|resume|candidate|employment|hr screening|promotion|performance review)/,
    "employment",
  ],
  [/\b(patient|clinical|diagnos|medical|health|triage nurse|hospital)/, "healthcare"],
  [/\b(biometric|face recognition|facial|fingerprint|voiceprint)/, "biometric"],
  [/\b(student|exam|school|admission|education|grading)/, "education"],
  [
    /\b(power grid|water supply|critical infrastructure|energy grid|traffic control)/,
    "critical_infrastructure",
  ],
  [/\b(police|law enforcement|crime predict|policing)/, "law_enforcement"],
  [/\b(visa|asylum|immigration|border control|migration)/, "migration"],
  [/\b(court|judicial|sentencing|justice)/, "justice"],
  [
    /\b(insurance pricing|benefit eligibility|social benefit|emergency dispatch|essential service)/,
    "essential_services",
  ],
  [
    /\b(customer[- ]support|customer[- ]service|support agent|helpdesk|help desk|contact cent|call cent|support ticket|customer queries|customer enquir|customer inquir)/,
    "customer_service",
  ],
  [
    /\b(internal productivity|summari[sz]e (meeting|document)|coding assistant|code assistant|knowledge assistant|internal (search|assistant|copilot|chatbot|chat bot|bot|tool)|employee productivity)/,
    "internal_productivity",
  ],
];
const DATA: Array<[RegExp, string]> = [
  [
    /\b(health data|medical record|diagnos|biometric|ethnic|religio|sexual orientation|trade union|genetic|special[- ]category)/,
    "special_category",
  ],
  [
    /\b(crm|cvs?|resumes?|candidate data|applicant data|customer data|customer record|personal data|pii|personally identifiable|email address|phone number|names? and address|customer profile|account details|order history|employee data|patient)/,
    "personal",
  ],
  [
    /\b(confidential|financial statement|trade secret|source code|contracts?|pricing data|m&a)/,
    "confidential",
  ],
  [/\b(internal (docs|documents|wiki|knowledge base)|intranet|internal data)/, "internal"],
  [/\b(public (data|website|information)|publicly available|open data)/, "public"],
];
const AFFECTED: Array<[RegExp, string]> = [
  [/\b(children|minors|patients|elderly|vulnerable|students)\b/, "vulnerable"],
  [
    /\b(citizens|general public|members of the public|public[- ]facing|applicants?|candidates?|job seekers?)\b/,
    "public",
  ],
  [/\b(customers?|clients?|consumers?|policyholders?|account holders?|end users?)\b/, "customers"],
  [
    /\b(employees|staff|internal users|agents? on our team|colleagues|internal (chatbot|assistant|copilot|tool))\b/,
    "internal",
  ],
];
const TOOLS: Array<[string, RegExp]> = [
  ["crm", /\b(crm|salesforce|hubspot|dynamics)\b/],
  ["email", /\b(e-?mails?|outlook|gmail)\b/],
  ["ticketing", /\b(ticket|zendesk|servicenow|jira|freshdesk)/],
  ["payments", /\b(refund|payment|payout|stripe|billing|charge)/],
  ["knowledge_base", /\b(knowledge base|kb articles?|faq|help cent|confluence|sharepoint)\b/],
  ["database", /\b(database|sql|data warehouse)\b/],
  ["web_search", /\b(web search|browse the web|internet search)\b/],
  ["calendar", /\b(calendar|schedul)/],
  ["messaging", /\b(slack|teams|sms|whatsapp|chat messages?)\b/],
  ["code_execution", /\b(execute code|run code|code interpreter|shell)\b/],
  [
    "code_repository",
    /\b(repo|repos|repository|repositories|github|gitlab|bitbucket|pull requests?|commits?)\b/,
  ],
  ["hr_system", /\b(ats|applicant tracking|hris|workday)\b/],
  ["file_storage", /\b(file storage|google drive|onedrive|s3 bucket|documents? store)\b/],
];
const ACTION_VERBS =
  /\b(issues?|issuing|process(es|ing)?|sends?|sending|updates?|updating|creates?|creating|clos(e|es|ing)|delet(e|es|ing)|refunds?|cancel(s|ling)?|books?|transfers?|pays?|posts?|modif(y|ies)|writes? back|write access|write permissions?|merges?|push(es)?|deploys?|executes?|escalates?|reassigns?)\b/;
const GENAI =
  /\b(llm|gpt|genai|gen ai|generative|chatbot|chat bot|copilot|claude|gemini|llama|mistral|large language model|rag|retrieval[- ]augmented|prompt|ai agent|agentic|assistant)\b/;
const VENDOR =
  /\b(openai|azure openai|anthropic|claude|gemini|google vertex|bedrock|vendor|third[- ]party|saas|cohere|mistral api|hosted model|api model|gpt-?\d)/;
const EU =
  /\b(eu|european union|europe|gdpr|germany|france|spain|italy|netherlands|ireland|belgium|poland|sweden|austria|denmark|finland|portugal)\b/;
const ENV: Array<[RegExp, string]> = [
  [/\b(in production|production|live|go[- ]live|deployed)\b/, "production"],
  [/\b(pilot|proof of concept|poc|trial)\b/, "pilot"],
  [/\b(in development|building|prototype|developing)\b/, "development"],
  [/\b(idea|exploring|considering|planning to)\b/, "idea"],
];

function first(patterns: Array<[RegExp, string]>, text: string): string | null {
  for (const [rx, val] of patterns) if (rx.test(text)) return val;
  return null;
}

/** Candidate intake fields found in free text (missing fields are omitted). */
export function extractProfile(text: string): Profile {
  const t = (text || "").toLowerCase();
  const out: Profile = {};
  if (!t.trim()) return out;

  const name =
    /\b(?:called|named|name is|codename)\s+["“']?([A-Z][\w-]*(?:\s+[A-Z0-9][\w-]*){0,4})/.exec(
      text || "",
    );
  if (name?.[1]) out["name"] = name[1].trim();

  const firstSentence = (text || "").trim().split(/(?<=[.!?])\s+/)[0] ?? "";
  if (firstSentence.split(/\s+/).filter(Boolean).length >= 4)
    out["purpose"] = firstSentence.slice(0, 300);

  const dom = first(DOMAIN, t);
  if (dom) out["domain_category"] = dom;
  const data = first(DATA, t);
  if (data) out["data_sensitivity"] = data;
  const aff = first(AFFECTED, t);
  if (aff) out["affected_parties"] = aff;

  const tools = TOOLS.filter(([, rx]) => rx.test(t)).map(([k]) => k);
  if (tools.length) out["tools"] = tools;

  if (GENAI.test(t)) out["genai"] = true;
  if (VENDOR.test(t)) out["vendor_model"] = true;
  if (
    /\b(in[- ]house model|self[- ]hosted|our own model|trained internally)\b/.test(t) &&
    !("vendor_model" in out)
  )
    out["vendor_model"] = false;
  if (EU.test(t)) out["eu_exposure"] = true;
  else if (/\b(us only|united states only|india only|no eu|not in the eu|uk only)\b/.test(t))
    out["eu_exposure"] = false;

  const acts = ACTION_VERBS.test(t) && (tools.length > 0 || /\bagent\b/.test(t));
  const approval =
    /\b(with (human )?approval|human[- ]approv|approved by|requires? approval|after review|human in the loop|hitl|supervisor approv)/.test(
      t,
    );
  const suggests =
    /\b(drafts?|suggests?|recommends?|proposes?|summari[sz]es?|answers? questions)\b/.test(t);
  const autonomous =
    /\b(autonomous(ly)?|without (human )?(review|approval)|automatically|on its own|fully automated)\b/.test(
      t,
    );
  if (acts) {
    out["external_actions"] = true;
    const autonomy =
      autonomous && !approval
        ? "acts_autonomously"
        : approval
          ? "acts_with_approval"
          : autonomous
            ? "acts_autonomously"
            : null;
    if (autonomy) out["autonomy"] = autonomy; // acts, but approval model unclear -> ask
  } else if (suggests) {
    out["autonomy"] = "suggests";
  }
  if (/\b(read[- ]only|cannot take actions|no actions|only reads)\b/.test(t))
    out["external_actions"] = false;

  if (
    /\b(automated decision|automatically (approve|reject|deny|decide)|decides whether|approves or rejects|denies)\b/.test(
      t,
    )
  )
    out["decision_impact"] = "automated_decision";
  else if (
    /\b(eligibility|pricing decision|credit limit|hire|hiring decision|reject|material decision|screen(s|ing)?|shortlist(s|ing)?|rank(s|ing)? (candidates|applicants)|scor(e|es|ing) (candidates|applicants|customers))\b/.test(
      t,
    )
  )
    out["decision_impact"] = "material";
  else if (/\b(advis|recommend|suggest|assist|draft)/.test(t)) out["decision_impact"] = "advisory";

  const env = first(ENV, t);
  if (env) out["environment"] = env;
  return out;
}

const BOOL_TRUE = /^\s*(y|yes|yeah|yep|true|correct|it does|it can|we do|affirmative)\b/i;
const BOOL_FALSE =
  /^\s*(n|no|nope|false|it does not|it doesn't|it can't|it cannot|we don't|we do not|negative)\b/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parse a reply for a specific intake field; null if it cannot be parsed. */
export function parseFieldValue(fieldId: string, text: string): ProfileValue | null {
  const f = intakeField(fieldId);
  if (!f || text === null || text === undefined) return null;
  const raw = text.trim();
  if (!raw) return null;
  if (f.type === "boolean") {
    if (BOOL_TRUE.test(raw)) return true;
    if (BOOL_FALSE.test(raw)) return false;
    return null;
  }
  if (f.type === "select") {
    const opts = (f.options ?? []).map(String);
    const norm = raw
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/^[_ .]+|[_ .]+$/g, "");
    const exact = opts.find((o) => o.toLowerCase() === norm);
    if (exact) return exact;
    const squashed = raw.toLowerCase().replace(/[\s-]+/g, "_");
    for (const o of opts) {
      if (new RegExp(`(?<![a-z_])${escapeRe(o.toLowerCase())}(?![a-z_])`).test(squashed)) return o;
    }
    const cand = extractProfile(raw)[fieldId];
    return typeof cand === "string" && opts.includes(cand) ? cand : null;
  }
  if (f.type === "list") {
    if (/^\s*(none|no tools|nothing)\s*$/i.test(raw)) return [];
    const cand = extractProfile(raw)["tools"];
    if (Array.isArray(cand) && cand.length) return cand;
    return raw
      .split(/[,;/]| and /)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.toLowerCase().replaceAll(" ", "_"))
      .slice(0, 12);
  }
  return raw.slice(0, 300);
}

/** Explicit corrections such as "data_sensitivity: confidential; autonomy = suggests". */
export function parseFieldAssignments(text: string): Profile {
  const out: Profile = {};
  const known = new Set(intakeFields.map((f) => f.id));
  for (const m of (text || "").matchAll(/\b([a-z_]{3,30})\s*[:=]\s*([^;\n]+)/g)) {
    const key = (m[1] ?? "").toLowerCase();
    if (known.has(key)) {
      const val = parseFieldValue(key, (m[2] ?? "").trim());
      if (val !== null) out[key] = val;
    }
  }
  return out;
}

// --------------------------------------------------------------------------- risk tier
const DECISION_IMPACT: Record<string, number> = {
  none: 0,
  advisory: 5,
  material: 20,
  automated_decision: 30,
};
const AFFECTED_PTS: Record<string, number> = {
  internal: 0,
  customers: 10,
  public: 15,
  vulnerable: 25,
};
const SENSITIVITY: Record<string, number> = {
  public: 0,
  internal: 5,
  confidential: 10,
  personal: 15,
  special_category: 25,
};
const AUTONOMY: Record<string, number> = {
  none: 0,
  suggests: 5,
  acts_with_approval: 15,
  acts_autonomously: 30,
};

/** Indicative screens echoing EU AI Act Annex III areas; a trigger for legal review only. */
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
const SECTOR_SENSITIVE: Record<string, number> = {
  healthcare: 20,
  financial_services: 10,
  public_sector: 10,
};
const CATEGORY_POINTS = 30;
const PROHIBITED_SCREEN_TERMS: Record<string, string> = {
  "social scoring": "Social scoring",
  "social score": "Social scoring",
  "emotion recognition": "Emotion recognition (workplace/education contexts)",
  subliminal: "Subliminal or manipulative techniques",
  manipulat: "Manipulative techniques exploiting vulnerabilities",
  "untargeted scraping": "Untargeted scraping of facial images",
  "facial image scraping": "Untargeted scraping of facial images",
  "predictive policing": "Crime prediction based solely on profiling",
  "biometric categori": "Biometric categorisation inferring sensitive attributes",
  "real-time remote biometric": "Real-time remote biometric identification in public spaces",
};
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
const KEY_FIELDS = [
  "purpose",
  "decision_impact",
  "affected_parties",
  "data_sensitivity",
  "autonomy",
  "domain_category",
];
const TIER_RULES: Record<string, { approval_authority: string; review_cadence_months: number }> = {
  Low: { approval_authority: "Product Owner with AI CoE review", review_cadence_months: 24 },
  Medium: { approval_authority: "AI Risk Lead", review_cadence_months: 12 },
  High: { approval_authority: "AI Governance Forum", review_cadence_months: 6 },
  "Prohibited-review": {
    approval_authority: "Legal and AI Governance Forum (default: do not proceed)",
    review_cadence_months: 0,
  },
};

export interface RiskResult {
  tier: string;
  score: number;
  provisional: boolean;
  triggers: string[];
  missing_fields: string[];
  required_modules: string[];
  approval_authority: string;
  rationale: string;
  citation_ids: string[];
}

function asBool(v: ProfileValue | undefined): boolean | null {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v;
  return ["true", "yes", "y", "1"].includes(String(v).trim().toLowerCase());
}

function isMissing(v: ProfileValue | undefined): boolean {
  return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

/** Preliminary, explainable risk tier (Inferred; requires human confirmation). */
export function calculateRiskTier(profile: Profile): RiskResult {
  const p = { ...profile };
  const factors: Array<{ factor: string; value: string; points: number }> = [];
  const triggers: string[] = [];
  const citations = new Set(["EI-02", "GL-01"]);
  let score = 0;
  const add = (factor: string, value: string, points: number, cite: string) => {
    score += points;
    citations.add(cite);
    factors.push({ factor, value, points });
  };
  const missing = KEY_FIELDS.filter((f) => isMissing(p[f]));
  const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

  const di = str("decision_impact");
  if (di !== undefined && di in DECISION_IMPACT)
    add("decision_impact", di, DECISION_IMPACT[di] ?? 0, "GL-02");
  const ap = str("affected_parties");
  if (ap !== undefined && ap in AFFECTED_PTS)
    add("affected_parties", ap, AFFECTED_PTS[ap] ?? 0, "EI-04");
  const ds = str("data_sensitivity");
  if (ds !== undefined && ds in SENSITIVITY)
    add("data_sensitivity", ds, SENSITIVITY[ds] ?? 0, "IS-03");
  const au = str("autonomy");
  if (au !== undefined && au in AUTONOMY) add("autonomy", au, AUTONOMY[au] ?? 0, "IS-09");

  const rawTools = p["tools"];
  const tools =
    typeof rawTools === "string"
      ? rawTools
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : Array.isArray(rawTools)
        ? rawTools
        : [];
  const writeTools = tools.filter((t) => WRITE_TOOL_HINTS.some((h) => t.toLowerCase().includes(h)));
  if (tools.length) {
    add(
      "tool_access",
      `${tools.length} tool(s), ${writeTools.length} with write/act capability`,
      5 + (writeTools.length ? 10 : 0),
      "IS-11",
    );
  }
  const ext = asBool(p["external_actions"]);
  if (ext) add("external_actions", "True", 10, "IS-13");

  const cat = (str("domain_category") ?? "").trim().toLowerCase();
  const eu = asBool(p["eu_exposure"]);
  if (cat in ANNEX_III_LIKE) {
    add("domain_category", `${cat} — ${ANNEX_III_LIKE[cat]}`, CATEGORY_POINTS, "AO-07");
    if (eu) {
      triggers.push(
        `Potential EU AI Act high-risk area: ${ANNEX_III_LIKE[cat]} — legal classification review required (Art. 6)`,
      );
    }
  } else if (cat in SECTOR_SENSITIVE)
    add("domain_category", cat, SECTOR_SENSITIVE[cat] ?? 0, "AO-07");
  else if (cat) add("domain_category", cat, 0, "EI-02");

  if (asBool(p["genai"])) add("generative_ai", "True", 5, "IS-14");
  if (asBool(p["vendor_model"])) add("third_party_model", "True", 5, "GL-11");
  if (eu) add("eu_exposure", "True", 5, "AO-07");

  const material = di === "material" || di === "automated_decision";
  if (cat in ANNEX_III_LIKE && material)
    triggers.push("Material or automated decisions in a sensitive (Annex III-like) domain");
  if (au === "acts_autonomously" && (ext || writeTools.length))
    triggers.push("Autonomous agent with write or external-action capability");
  if (ds === "special_category" && material)
    triggers.push("Special-category data used for material decisions");
  if (ap === "vulnerable" && material)
    triggers.push("Material decisions affecting vulnerable people");

  const text = ["purpose", "description", "name"]
    .map((k) => (p[k] === undefined ? "" : pyValue(p[k])))
    .join(" ")
    .toLowerCase();
  const prohibited = [
    ...new Set(
      Object.entries(PROHIBITED_SCREEN_TERMS)
        .filter(([term]) => text.includes(term))
        .map(([, label]) => label),
    ),
  ].sort();

  let tier: string;
  if (prohibited.length) {
    tier = "Prohibited-review";
    citations.add("AO-10");
    for (const x of prohibited)
      triggers.push(`Possible prohibited practice (EU AI Act Art. 5 screen): ${x}`);
  } else if (score >= 60 || triggers.some((t) => !t.startsWith("Potential EU AI Act")))
    tier = "High";
  else if (score >= 30) tier = "Medium";
  else tier = "Low";

  if (missing.length >= 3 && tier === "Low") {
    tier = "Medium";
    triggers.push("Tier floored at Medium because key intake facts are missing (safest default)");
  }

  const mods = ["core"];
  if (
    ds === "personal" ||
    ds === "special_category" ||
    ds === "confidential" ||
    missing.includes("data_sensitivity")
  )
    mods.push("data_privacy");
  if (tier !== "Low" || tools.length) mods.push("security");
  if (asBool(p["genai"])) mods.push("genai_llm");
  if (tools.length || au === "acts_with_approval" || au === "acts_autonomously")
    mods.push("agentic");
  if (
    tier === "High" ||
    tier === "Prohibited-review" ||
    material ||
    ap === "public" ||
    ap === "vulnerable"
  )
    mods.push("fairness_safety");
  if (
    tier === "High" ||
    tier === "Prohibited-review" ||
    material ||
    au === "acts_with_approval" ||
    au === "acts_autonomously"
  )
    mods.push("human_oversight");
  if (asBool(p["vendor_model"])) mods.push("vendor_third_party");

  citations.add("GL-02");
  citations.add("GL-03");
  const bits = factors.filter((f) => f.points).map((f) => `${f.factor}=${f.value} (+${f.points})`);
  const rationale =
    `Preliminary tier ${tier} (score ${score}). ` +
    (bits.length ? `Drivers: ${bits.join("; ")}. ` : "") +
    (triggers.length ? `Triggers: ${triggers.join("; ")}. ` : "") +
    (missing.length ? `Provisional — missing: ${missing.join(", ")}. ` : "") +
    "Inferred from user-provided intake; requires human confirmation.";
  return {
    tier,
    score,
    provisional: missing.length > 0,
    triggers,
    missing_fields: missing,
    required_modules: mods,
    approval_authority: TIER_RULES[tier]?.approval_authority ?? "",
    rationale,
    citation_ids: [...citations].sort(),
  };
}

export interface RecommendedControl {
  id: string;
  title: string;
  priority: string;
  owner_role: string;
}

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

/** The `recommend_controls` tool for a profile (no stored assessment in the browser demo). */
export function recommendControls(
  profile: Profile,
  limit = 10,
): { tier: string; controls: RecommendedControl[] } {
  const risk = calculateRiskTier(profile);
  const qs = applicableQuestions(profile, risk.tier, risk.required_modules);
  const seen = new Set<string>();
  const recs: RecommendedControl[] = [];
  for (const q of qs) {
    for (const cid of q.controls) {
      if (seen.has(cid)) continue;
      seen.add(cid);
      const c = getControl(cid);
      if (c) recs.push({ id: cid, title: c.title, priority: c.priority, owner_role: c.owner_role });
    }
  }
  recs.sort((a, b) => {
    const d = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    return d !== 0 ? d : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return { tier: risk.tier, controls: recs.slice(0, limit) };
}

// --------------------------------------------------------------------------- answers, severity, guardrails
// (question_bank.py: answer_options, severity_rules, applicable_guardrails, parse_answer,
// parse_evidence_refs — used by the role-aware agent in src/features/platform/agent.)

export const ANSWER_IDS = [
  "implemented",
  "partial",
  "not_implemented",
  "unknown",
  "not_applicable",
] as const;
export type AnswerId = (typeof ANSWER_IDS)[number];
/** Order used when matching free-text answers: most specific first. */
const MATCH_ORDER: AnswerId[] = [
  "not_applicable",
  "unknown",
  "not_implemented",
  "partial",
  "implemented",
];

export interface AnswerOption {
  id: AnswerId;
  label: string;
  credit: number | null;
  severity_points: number;
  synonyms?: string[];
}

export interface SeverityRules {
  priority_points: Record<string, number>;
  tier_points: Record<string, number>;
  thresholds: Record<"Critical" | "High" | "Medium", number>;
  evidence_gap_max_severity: string;
  critical_override_min_tier: string;
}

const rawBank = (useCaseTemplate ?? {}) as {
  answer_options?: AnswerOption[];
  severity_rules?: SeverityRules;
  runtime_guardrails?: GuardrailDef[];
};

const answerOptionMap: Record<string, AnswerOption> = Object.fromEntries(
  (rawBank.answer_options ?? []).map((o) => [o.id, o]),
);

export function answerOptions(): Record<string, AnswerOption> {
  return answerOptionMap;
}

export function severityRules(): SeverityRules {
  return (
    rawBank.severity_rules ?? {
      priority_points: {},
      tier_points: {},
      thresholds: { Critical: 8, High: 6, Medium: 4 },
      evidence_gap_max_severity: "Medium",
      critical_override_min_tier: "Medium",
    }
  );
}

export interface RuntimeGuardrail {
  id: string;
  title: string;
  controls: string[];
}

/** Runtime guardrail definitions whose applicability conditions hold for the profile. */
export function applicableGuardrails(
  profile: Profile,
  tier: string | null = null,
): RuntimeGuardrail[] {
  return (rawBank.runtime_guardrails ?? [])
    .filter((g) => applies(g.applies_when, profile, tier, []))
    .map((g) => ({ ...g, controls: g.controls ?? [] }));
}

function answerNorm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9/'?]+/g, " ");
}

/** Map free text ("partially", "not sure", "yes — evidence EV-12") to an answer id. */
export function parseAnswer(text: string): AnswerId | null {
  let t = " " + answerNorm(text || "") + " ";
  t = t.replaceAll("_", " ");
  // "yes, but no evidence yet" is an implementation claim without evidence, not a "no".
  t = t.replace(
    / (no|without|missing) (written |formal |documented )?(evidence|documentation|docs|proof) /g,
    " ",
  );
  for (const aid of MATCH_ORDER) {
    if (t.includes(` ${aid.replaceAll("_", " ")} `)) return aid;
    for (const syn of answerOptionMap[aid]?.synonyms ?? []) {
      const s = " " + answerNorm(String(syn)) + " ";
      if (t.includes(s)) return aid;
    }
  }
  return null;
}

const EVIDENCE_REF_RE =
  /\b((?:EV|EVD|DOC|EVIDENCE|TKT|JIRA|CONF|SP)[-_][A-Za-z0-9][A-Za-z0-9._-]{0,60})\b/gi;

/** Evidence references such as EV-104, DOC-DPIA-07 (case-insensitively de-duplicated). */
export function parseEvidenceRefs(text: string): string[] {
  const refs: string[] = [];
  for (const m of (text || "").matchAll(EVIDENCE_REF_RE)) {
    const ref = (m[1] ?? "").replace(/[.,;]+$/, "");
    if (!refs.some((r) => r.toUpperCase() === ref.toUpperCase())) refs.push(ref);
  }
  return refs;
}
