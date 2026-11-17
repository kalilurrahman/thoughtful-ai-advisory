// EU AI Act readiness checker — role-aware readiness questions for the obligation areas the
// planned tool page promised, mapped to VERITRAIL controls. Browser-only, pure and
// deterministic; src/test/site-eu-ai-act-readiness.test.ts pins the behaviour.
//
// Honest limits, repeated in the result: this does not classify a system under the Act and
// makes no compliance determination. Screening results are indicative triggers for legal review.
// Timelines were amended by Regulation (EU) 2026/1744 (the Digital Omnibus); verify dates
// against the current EUR-Lex text.

import { ANNEX_III_LIKE, PROHIBITED_SCREEN_TERMS } from "./risk-tier";

export type ReadinessAnswer = "yes" | "partial" | "no" | "";

export type ActRole = "provider" | "deployer" | "both" | "";

export interface ActProfile {
  name?: string;
  purpose?: string;
  role?: ActRole | string;
  /** "yes" | "no" | "" */
  eu_exposure?: string;
  domain_category?: string;
  /** none | advisory | material | automated_decision */
  decision_impact?: string;
  /** "yes" | "no" | "" */
  genai?: string;
  /** "yes" | "no" | "" — people interact with the system directly. */
  interacts_with_people?: string;
  /** "yes" | "no" | "" — produces synthetic text, audio, image or video. */
  synthetic_content?: string;
  literacy?: ReadinessAnswer;
  risk_management?: ReadinessAnswer;
  data_governance?: ReadinessAnswer;
  documentation?: ReadinessAnswer;
  record_keeping?: ReadinessAnswer;
  instructions?: ReadinessAnswer;
  human_oversight?: ReadinessAnswer;
  robustness?: ReadinessAnswer;
  deployer_duties?: ReadinessAnswer;
  transparency_people?: ReadinessAnswer;
  post_market?: ReadinessAnswer;
  incidents?: ReadinessAnswer;
}

export type ObligationKey =
  | "literacy"
  | "risk_management"
  | "data_governance"
  | "documentation"
  | "record_keeping"
  | "instructions"
  | "human_oversight"
  | "robustness"
  | "deployer_duties"
  | "transparency_people"
  | "post_market"
  | "incidents";

/** Who an obligation area falls on when a system is high-risk-like. */
type Bearer = "all" | "provider" | "deployer" | "transparency";

export interface ObligationDefinition {
  key: ObligationKey;
  area: string;
  article: string;
  question: string;
  controls: string[];
  bearer: Bearer;
}

export const OBLIGATION_AREAS: readonly ObligationDefinition[] = [
  {
    key: "literacy",
    area: "AI literacy",
    article: "Art. 4",
    question: "Do the people who operate or oversee the system have role-appropriate AI training?",
    controls: ["AO-05"],
    bearer: "all",
  },
  {
    key: "risk_management",
    area: "Risk management",
    article: "Art. 9",
    question:
      "Is there a documented, repeated risk assessment for this system across its lifecycle?",
    controls: ["GL-02", "AO-04"],
    bearer: "provider",
  },
  {
    key: "data_governance",
    area: "Data governance",
    article: "Art. 10",
    question: "Are training, validation and test data governed for quality, bias and provenance?",
    controls: ["IS-02", "IS-05", "EI-06"],
    bearer: "provider",
  },
  {
    key: "documentation",
    area: "Technical documentation",
    article: "Art. 11",
    question: "Is technical documentation maintained and kept current with each change?",
    controls: ["GL-06", "EI-05"],
    bearer: "provider",
  },
  {
    key: "record_keeping",
    area: "Record-keeping",
    article: "Art. 12",
    question: "Does the system log events automatically in a way that supports traceability?",
    controls: ["SE-08"],
    bearer: "provider",
  },
  {
    key: "instructions",
    area: "Transparency and instructions for use",
    article: "Art. 13",
    question: "Are capabilities, limitations and instructions for use documented for deployers?",
    controls: ["IS-08", "EI-04"],
    bearer: "provider",
  },
  {
    key: "human_oversight",
    area: "Human oversight",
    article: "Art. 14",
    question: "Can trained people understand, intervene in and stop the system?",
    controls: ["IS-09", "IS-15"],
    bearer: "provider",
  },
  {
    key: "robustness",
    area: "Accuracy, robustness and cybersecurity",
    article: "Art. 15",
    question:
      "Is the system tested for accuracy, robustness and security before and after release?",
    controls: ["IS-07", "IS-01"],
    bearer: "provider",
  },
  {
    key: "deployer_duties",
    area: "Deployer obligations",
    article: "Art. 26",
    question:
      "Are provider instructions followed, oversight assigned, input data controlled and logs retained?",
    controls: ["EI-03", "AO-09", "GL-07"],
    bearer: "deployer",
  },
  {
    key: "transparency_people",
    area: "Transparency to people",
    article: "Art. 50",
    question: "Are people told they are interacting with AI, and is synthetic content marked?",
    controls: ["IS-08"],
    bearer: "transparency",
  },
  {
    key: "post_market",
    area: "Post-market monitoring",
    article: "Art. 72",
    question: "Is there a post-market monitoring plan with performance and drift monitoring?",
    controls: ["SE-09", "SE-12"],
    bearer: "provider",
  },
  {
    key: "incidents",
    area: "Serious incident reporting",
    article: "Art. 73",
    question: "Can serious incidents be detected, escalated and reported within the required time?",
    controls: ["SE-04"],
    bearer: "all",
  },
];

export type Applicability =
  | "Applies"
  | "Applies via your provider"
  | "Voluntary on these facts"
  | "Not triggered on these facts";

export type ReadinessStatus = "User-asserted" | "Inferred" | "Missing evidence" | "Critical gap";

export interface ObligationFinding {
  key: ObligationKey;
  area: string;
  article: string;
  applicability: Applicability;
  answer: ReadinessAnswer;
  points: number;
  status: ReadinessStatus;
  controls: string[];
}

export interface ActScreening {
  role: ActRole;
  eu_exposure: string;
  prohibited_flags: string[];
  high_risk_like: boolean;
  high_risk_reasons: string[];
  transparency_duties: boolean;
}

export interface ActReadinessResult {
  name: string;
  screening: ActScreening;
  readiness_pct: number;
  applicable_count: number;
  evidence_status: "Inferred";
  requires_legal_review: boolean;
  obligations: ObligationFinding[];
  next_steps: string[];
  missing_fields: string[];
  citation_ids: string[];
  rationale: string;
  method: string;
}

export const EU_AI_ACT_READINESS_METHOD =
  "VERITRAIL EU AI Act readiness check v1.0 (role-aware applicability; Annex III-like domains and prohibited-practice terms are screens for legal review, not a classification)";

const POINTS: Record<ReadinessAnswer, number> = { yes: 2, partial: 1, no: 0, "": 0 };

function normaliseRole(role: string | undefined): ActRole {
  return role === "provider" || role === "deployer" || role === "both" ? role : "";
}

function screen(p: ActProfile, role: ActRole): ActScreening {
  const purpose = (p.purpose ?? "").toLowerCase();
  const prohibited = new Set<string>();
  for (const [term, label] of PROHIBITED_SCREEN_TERMS)
    if (purpose.includes(term)) prohibited.add(label);

  const reasons: string[] = [];
  const annex = p.domain_category ? ANNEX_III_LIKE[p.domain_category] : undefined;
  if (annex) reasons.push(annex);
  if (p.decision_impact === "automated_decision") reasons.push("Automated decisions about people");
  else if (p.decision_impact === "material" && annex === undefined)
    reasons.push("Materially shapes decisions about people");

  return {
    role,
    eu_exposure: p.eu_exposure === "yes" || p.eu_exposure === "no" ? p.eu_exposure : "",
    prohibited_flags: [...prohibited],
    high_risk_like: annex !== undefined || p.decision_impact === "automated_decision",
    high_risk_reasons: reasons,
    transparency_duties:
      p.genai === "yes" || p.interacts_with_people === "yes" || p.synthetic_content === "yes",
  };
}

function applicability(def: ObligationDefinition, s: ActScreening): Applicability {
  if (def.bearer === "all") return "Applies";
  if (def.bearer === "transparency")
    return s.transparency_duties ? "Applies" : "Not triggered on these facts";
  if (!s.high_risk_like) return "Voluntary on these facts";
  if (def.bearer === "provider") {
    if (s.role === "provider" || s.role === "both" || s.role === "") return "Applies";
    return "Applies via your provider";
  }
  // deployer
  if (s.role === "deployer" || s.role === "both" || s.role === "") return "Applies";
  return "Not triggered on these facts";
}

/** Review one system's readiness. The input is never mutated. */
export function checkActReadiness(input: ActProfile): ActReadinessResult {
  const p: ActProfile = { ...input };
  const role = normaliseRole(p.role);
  const screening = screen(p, role);

  const obligations: ObligationFinding[] = OBLIGATION_AREAS.map((def) => {
    const applies = applicability(def, screening);
    const answer: ReadinessAnswer = (p[def.key] ?? "") as ReadinessAnswer;
    const points = POINTS[answer] ?? 0;
    let status: ReadinessStatus;
    if (answer === "yes") status = "User-asserted";
    else if (answer === "partial") status = "Inferred";
    else if (applies === "Applies" && answer === "no") status = "Critical gap";
    else status = "Missing evidence";
    return {
      key: def.key,
      area: def.area,
      article: def.article,
      applicability: applies,
      answer,
      points,
      status,
      controls: [...def.controls],
    };
  });

  const scored = obligations.filter(
    (o) => o.applicability === "Applies" || o.applicability === "Applies via your provider",
  );
  const score = scored.reduce((s, o) => s + o.points, 0);
  const readiness = scored.length ? Math.round((score / (scored.length * 2)) * 100) : 0;
  const missing = scored.filter((o) => o.answer === "").map((o) => o.area);

  const nextSteps: string[] = [];
  if (screening.prohibited_flags.length)
    nextSteps.push(
      `Stop and obtain legal review: the stated purpose matches a prohibited-practice screen (${screening.prohibited_flags.join("; ")}) (AO-10).`,
    );
  if (role === "")
    nextSteps.push(
      "Record the facts that determine whether you are a provider, a deployer or both, for legal review (EI-02).",
    );
  if (screening.eu_exposure === "")
    nextSteps.push(
      "Confirm whether the system is placed on the EU market or affects people in the EU (EI-02).",
    );
  if (screening.high_risk_like)
    nextSteps.push(
      `Record the classification facts for legal assessment: ${screening.high_risk_reasons.join("; ")} (EI-02).`,
    );
  for (const o of obligations) {
    if (o.status === "Critical gap")
      nextSteps.push(`Close the gap in ${o.area} (${o.article}; ${o.controls.join(", ")}).`);
  }
  for (const o of obligations) {
    if (o.applicability === "Applies via your provider" && o.answer !== "yes")
      nextSteps.push(
        `Ask your provider for evidence of ${o.area} (${o.article}; ${o.controls.join(", ")}).`,
      );
  }
  for (const o of scored) {
    if (o.answer === "partial")
      nextSteps.push(
        `Complete ${o.area} and file the evidence (${o.article}; ${o.controls.join(", ")}).`,
      );
  }

  const cited = new Set<string>(["AO-10", "EI-02"]);
  for (const o of scored) for (const c of o.controls) cited.add(c);

  const applicableNames = scored.map((o) => o.article).join(", ");
  const rationale =
    (screening.eu_exposure === "no"
      ? "You indicated the system neither reaches the EU market nor affects people in the EU, so the Act may not apply; the readiness view is still useful as good practice. "
      : "") +
    (screening.high_risk_like
      ? `The facts match a high-risk-like screen (${screening.high_risk_reasons.join("; ")}), so the high-risk obligation areas are shown as applicable to your role. `
      : "No high-risk-like screen was triggered on these facts, so the Article 9–15 areas are shown as voluntary good practice. ") +
    `${readiness}% readiness across ${scored.length} applicable areas (${applicableNames || "none"}). ` +
    (missing.length ? `Unanswered: ${missing.join(", ")}. ` : "") +
    "This is an indicative readiness view with user-asserted answers, not a legal classification or a compliance determination.";

  return {
    name: p.name?.trim() || "Unnamed system",
    screening,
    readiness_pct: readiness,
    applicable_count: scored.length,
    evidence_status: "Inferred",
    requires_legal_review: screening.prohibited_flags.length > 0 || screening.high_risk_like,
    obligations,
    next_steps: nextSteps,
    missing_fields: missing,
    citation_ids: [...cited],
    rationale,
    method: EU_AI_ACT_READINESS_METHOD,
  };
}
