import { CONTROLS, GR, PILLARS, type Control, type Tier } from "@/data/governance";
export type Answer = {
  s: number;
  e: number;
  attachment?: string | undefined;
  notes?: string | undefined;
  url?: string | undefined;
};
export type Answers = Record<string, Answer>;
export function at<T>(items: T[], i: number): T {
  const item = items[i];
  if (item === undefined) throw new Error("Invalid item index");
  return item;
}
export const answerAt = (answers: Answers, id: string): Answer => answers[id] ?? { s: 0, e: 0 };
export const defaultAnswers = (): Answers =>
  Object.fromEntries(CONTROLS.map((c) => [c.id, { s: c.s, e: c.e }]));
export const effectiveScore = (a: Answer) => (a.s >= 3 && a.e !== 3 ? 2 : a.s);
export function pillarScores(answers: Answers) {
  return PILLARS.map((_, p) => {
    const cs = CONTROLS.filter((c) => c.p === p);
    return Math.round(
      (cs.reduce((sum, c) => sum + effectiveScore(answerAt(answers, c.id)), 0) / (cs.length * 4)) *
        100,
    );
  });
}
export const indexScore = (scores: number[]) =>
  Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
export const maturityBand = (n: number) =>
  n < 40
    ? "Initial"
    : n < 60
      ? "Developing"
      : n < 75
        ? "Defined"
        : n < 90
          ? "Managed"
          : "Optimized";
export const scoreTone = (n: number) => (n < 45 ? "danger" : n < 70 ? "warning" : "success");
export const gateFloor = (tier: Tier) => ({ High: 70, Medium: 55, Low: 40 })[tier];
export const gateStatus = (scores: number[], tier: Tier) => {
  const failures = scores.slice(3).filter((n) => n < gateFloor(tier)).length;
  return failures === 0 ? "Cleared" : failures === 1 ? "Conditional" : "Blocked";
};
export const blockingControls = (answers: Answers) =>
  CONTROLS.filter(
    (c) =>
      c.w === "Critical" &&
      (answerAt(answers, c.id).s <= 1 ||
        (answerAt(answers, c.id).s >= 3 && answerAt(answers, c.id).e !== 3)),
  );
export const gapPriority = (c: Control, a: Answer, tier: Tier) =>
  (4 - a.s) *
  ({ Critical: 3, High: 2, Medium: 1 }[c.w] ?? 1) *
  { High: 1.5, Medium: 1.2, Low: 1 }[tier];
export const gapPoints = (a: Answer) => ((4 - a.s) / 4) * 100;
export const gapPhase = (c: Pick<Control, "w" | "effort">) =>
  c.w === "Critical" ? (c.effort === "Low" ? 0 : 1) : 2;
export const classify = (q: boolean[]) =>
  q[3] ? "Prohibited" : q[0] && q[1] ? "High-risk" : q[1] || q[2] ? "Limited" : "Minimal";
export const requiredGuardrail = (rank: number, tier: Tier) =>
  rank >= { Low: 3, Medium: 2, High: 1 }[tier];
export const defaultGuardrails = () =>
  Object.fromEntries(
    GR.flatMap((g) => g.c.map(([name, rank]) => [String(name), Number(rank) >= 2])),
  );
export function guardrailCoverage(gr: Record<string, boolean>, tier: Tier) {
  const required = GR.flatMap((g) => g.c).filter(([, rank]) =>
    requiredGuardrail(Number(rank), tier),
  );
  const enabled = required.filter(([name]) => gr[String(name)]).length;
  return {
    required: required.length,
    enabled,
    percent: Math.round((enabled / required.length) * 100),
  };
}
export const money = (n: number) =>
  n >= 1e6
    ? "$" + (n / 1e6).toFixed(1) + "M"
    : n >= 1e3
      ? "$" + Math.round(n / 1e3) + "k"
      : "$" + Math.round(n);
export function calculate(
  id: string,
  v: Record<string, number>,
  scores: number[],
  coverage: number,
) {
  if (id === "cost") {
    const shadow = ((v["emp"] ?? 0) * (v["shadow"] ?? 0)) / 100,
      leakage = shadow * 120,
      breach = ((v["prob"] ?? 0) / 100) * (v["inc"] ?? 0) * 1e6,
      productivity = shadow * (v["hrs"] ?? 0) * 48 * 45,
      total = leakage + breach + productivity;
    return {
      headline: "Annual risk exposure",
      value: money(total),
      raw: total,
      rows: [
        ["Shadow-AI users", Math.round(shadow).toLocaleString()],
        ["Expected breach cost", money(breach)],
        ["Data-leakage handling", money(leakage)],
        ["Productivity loss", money(productivity)],
        ["Avoidable with governance (~65%)", money(total * 0.65)],
      ],
      action:
        "Publish approved-tool tiers and SSO-enforce them: the fastest lever on shadow usage.",
    };
  }
  if (id === "token") {
    const before =
        (((v["users"] ?? 0) * (v["prompts"] ?? 0) * 22 * (v["tok"] ?? 0)) / 1e6) *
        (v["price"] ?? 0),
      cached = before * (1 - ((v["cache"] ?? 0) / 100) * 0.5);
    return {
      headline: "Projected monthly spend",
      value: money(cached),
      raw: cached,
      rows: [
        ["Before caching", money(before)],
        ["Cache saving", money(before - cached)],
        ["Per user / month", money(cached / (v["users"] ?? 0))],
        ["Suggested budget guardrail (+20%)", money(cached * 1.2)],
      ],
      action:
        "Set per-team chargeback and a hard spend ceiling per agent run; alert at 80% of budget.",
    };
  }
  if (id === "risk") {
    const inherent = Math.round(
        (((v["sens"] ?? 0) + (v["auto"] ?? 0) + (v["impact"] ?? 0)) / 15) *
          100 *
          Math.min(1, 0.6 + (v["tools"] ?? 0) / 100),
      ),
      residual = Math.round(inherent * (1 - ((v["ctrl"] ?? 0) / 100) * 0.7));
    return {
      headline: "Residual risk score",
      value: residual + "/100",
      raw: residual,
      rows: [
        ["Inherent risk", inherent + "/100"],
        ["Control effectiveness", Math.round((v["ctrl"] ?? 0) * 0.7) + "%"],
        [
          "Top driver",
          (v["sens"] ?? 0) >= (v["auto"] ?? 0) && (v["sens"] ?? 0) >= (v["impact"] ?? 0)
            ? "Data sensitivity"
            : (v["auto"] ?? 0) >= (v["impact"] ?? 0)
              ? "Autonomy"
              : "Customer impact",
        ],
      ],
      action:
        residual > 50
          ? "Residual risk above appetite — prioritise guardrails on the top driver before scaling."
          : "Within appetite — maintain monitoring and quarterly re-scoring.",
    };
  }
  if (id === "compliance") {
    const base = scores.slice(3).reduce((a, b) => a + b, 0) / 3,
      result = Math.round(
        Math.max(0, base - (v["juris"] ?? 0) * 3 - (v["highrisk"] ?? 0) * 2) *
          (0.6 + (v["docs"] ?? 0) / 250),
      );
    return {
      headline: "Compliance readiness",
      value: result + "%",
      raw: result,
      rows: [
        ["E · R · N pillar average", String(Math.round(base))],
        ["High-risk systems needing Art. 9–15 evidence", String(v["highrisk"] ?? 0)],
        ["Documentation gap", 100 - (v["docs"] ?? 0) + "%"],
      ],
      action:
        "Close technical documentation first (Art. 11, Annex IV); it unblocks conformity evidence for every high-risk system.",
    };
  }
  if (id === "maturity") {
    const index = indexScore(scores);
    return {
      headline: "VERITRAIL Index",
      value: index + " · " + maturityBand(index),
      raw: index,
      rows: PILLARS.map((p, i) => [p.letter + " · " + p.name, String(scores[i])]),
      action: "Weakest pillar: " + at(PILLARS, scores.indexOf(Math.min(...scores))).name + ".",
    };
  }
  if (id === "guardrail-effort") {
    const systems = v["systems"] ?? 0,
      req = v["req"] ?? 0,
      missingPct = (v["missing"] ?? 0) / 100,
      hoursPer = v["hours"] ?? 0,
      rate = v["rate"] ?? 0,
      totalRequired = systems * req,
      missing = Math.round(totalRequired * missingPct),
      hours = missing * hoursPer,
      cost = hours * rate,
      weeks = Math.max(1, Math.ceil(hours / 40));
    return {
      headline: "Guardrail remediation effort",
      value: missing.toLocaleString() + " controls",
      raw: missing,
      rows: [
        ["Total required controls (est.)", Math.round(totalRequired).toLocaleString()],
        ["Estimated remediation hours", hours.toLocaleString() + " h"],
        ["Estimated effort cost", money(cost)],
        ["At 40 h/week", weeks + " week" + (weeks === 1 ? "" : "s")],
      ],
      action:
        missing > 0
          ? "Prioritize missing required guardrails for high-risk systems and track evidence as each control is implemented and verified."
          : "No missing required controls estimated — maintain evidence and review coverage as systems or tiers change.",
    };
  }
  if (id === "assurance-readiness") {
    const evidence = v["evidence"] ?? 0,
      incidents = v["incidents"] ?? 0,
      gates = v["gates"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(evidence * 0.35 + incidents * 0.2 + gates * 0.25 + monitoring * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Evidence attached (35%)", evidence + "%"],
        ["Incident readiness (20%)", incidents + "%"],
        ["Release gates (25%)", gates + "%"],
        ["Monitoring cadence (20%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Focus on the lowest area: attach evidence to tested controls, assign incident owners/responses, satisfy release gates, and review monitoring signals on cadence."
          : "Readiness is trending well — keep evidence current, exercise incident/gate workflows, and review assurance signals regularly.",
    };
  }
  if (id === "literacy-enablement") {
    const roles = v["roles"] ?? 0,
      safeuse = v["safeuse"] ?? 0,
      freshness = v["freshness"] ?? 0,
      reporting = v["reporting"] ?? 0,
      score = Math.round(roles * 0.3 + safeuse * 0.3 + freshness * 0.2 + reporting * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI literacy & enablement coverage",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Role-appropriate guidance (30%)", roles + "%"],
        ["Practical safe-use guidance (30%)", safeuse + "%"],
        ["Guidance freshness/cadence (20%)", freshness + "%"],
        ["Issue/uncertainty reporting adoption (20%)", reporting + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: extend role-tailored guidance and safe-use examples, keep materials current on a review cadence, and make reporting/escalation easy and expected."
          : "Coverage is trending well — refresh guidance as systems change, reinforce verification practices, and use feedback signals to improve enablement.",
    };
  }
  if (id === "vendor-ai-assurance") {
    const assessed = v["assessed"] ?? 0,
      contracts = v["contracts"] ?? 0,
      fallback = v["fallback"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(assessed * 0.3 + contracts * 0.3 + fallback * 0.2 + monitoring * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Third-party AI assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Critical vendors assessed (30%)", assessed + "%"],
        ["Contracts with guardrail/incident terms (30%)", contracts + "%"],
        ["Fallback/exit coverage (20%)", fallback + "%"],
        ["Monitoring & evidence refresh (20%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: complete risk-based due diligence for critical vendors, strengthen contractual data/security/incident terms, plan fallback/exit options, and monitor vendors with refreshed assurance evidence."
          : "Readiness is trending well — keep vendor assessments, contracts, dependency plans, and monitoring evidence current as services and risks change.",
    };
  }
  return {
    headline: "Guardrail Coverage Index",
    value: coverage + "%",
    raw: coverage,
    rows: [],
    action:
      coverage < 100
        ? "Missing required controls are listed in the Guardrails designer."
        : "All required controls enabled for this tier.",
  };
}
/**
 * Audit status of a control for the Assurance screens, from the real scoring rules above: the
 * effective score counts in full only with evidence attached (effectiveScore), so a 3 or 4
 * without evidence is "Partial · capped". "Attested" is a 3 or 4 with evidence attached; a 2 is
 * Partial; 0 or 1 is a Gap; an untouched control (0, no evidence) is Not tested.
 */
export type ControlStatus = "attested" | "partial" | "gap" | "untested";
export const controlStatus = (a: Answer): ControlStatus =>
  a.s === 0 && a.e === 0
    ? "untested"
    : effectiveScore(a) >= 3
      ? "attested"
      : effectiveScore(a) === 2
        ? "partial"
        : "gap";
/** True when the self-score is 3 or 4 but counts as 2 for want of attached evidence. */
export const isCapped = (a: Answer) => a.s >= 3 && a.e !== 3;
