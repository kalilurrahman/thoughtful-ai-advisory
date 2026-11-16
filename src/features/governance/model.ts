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
  if (id === "incident-response-readiness") {
    const playbooks = v["playbooks"] ?? 0,
      detection = v["detection"] ?? 0,
      comms = v["comms"] ?? 0,
      recovery = v["recovery"] ?? 0,
      score = Math.round(playbooks * 0.3 + detection * 0.25 + comms * 0.2 + recovery * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Incident response & recovery readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Playbooks & named owners (30%)", playbooks + "%"],
        ["Detection, triage & escalation (25%)", detection + "%"],
        ["Communication/notification readiness (20%)", comms + "%"],
        ["Exercises & recovery objectives (25%)", recovery + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define incident playbooks and owners, test detection/triage/escalation paths, prepare stakeholder communications, and run exercises with clear recovery/fallback objectives."
          : "Readiness is trending well — exercise and update playbooks, validate escalation and communications, and review recovery objectives as systems and risks change.",
    };
  }
  if (id === "deployment-change-control") {
    const prechecks = v["prechecks"] ?? 0,
      gates = v["gates"] ?? 0,
      rollout = v["rollout"] ?? 0,
      postdeploy = v["postdeploy"] ?? 0,
      score = Math.round(prechecks * 0.3 + gates * 0.25 + rollout * 0.2 + postdeploy * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Secure deployment & change-control readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Pre-release testing & guardrail checks (30%)", prechecks + "%"],
        ["Approvals & release gates with evidence (25%)", gates + "%"],
        ["Staged rollout & rollback readiness (20%)", rollout + "%"],
        ["Post-deploy monitoring & evidence (25%)", postdeploy + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: complete pre-release testing and guardrail checks, enforce approvals/release gates with evidence, prepare staged rollout and rollback, and capture post-deploy monitoring signals and evidence."
          : "Readiness is trending well — keep change controls, rollout/rollback plans, and post-deploy assurance evidence current as systems and risks evolve.",
    };
  }
  if (id === "privacy-data-minimization") {
    const inventory = v["inventory"] ?? 0,
      lawful = v["lawful"] ?? 0,
      controls = v["controls"] ?? 0,
      reviews = v["reviews"] ?? 0,
      score = Math.round(inventory * 0.3 + lawful * 0.25 + controls * 0.25 + reviews * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI privacy & data-minimization readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Data inventory & minimization/purpose limits (30%)", inventory + "%"],
        ["Lawful basis, consent & purpose controls (25%)", lawful + "%"],
        ["Access, retention & deletion controls (25%)", controls + "%"],
        ["Privacy impact/review evidence (20%)", reviews + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map data flows and minimize/purpose-limit collection, apply lawful-basis and consent/purpose controls, enforce access-retention-deletion, and keep privacy impact/review evidence current."
          : "Readiness is trending well — maintain data minimization and purpose controls, verify access/retention/deletion practices, and refresh privacy reviews as systems and data use change.",
    };
  }
  if (id === "model-quality-evaluation") {
    const coverageVal = v["coverage"] ?? 0,
      criteria = v["criteria"] ?? 0,
      review = v["review"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(coverageVal * 0.3 + criteria * 0.25 + review * 0.2 + monitoring * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Model & output quality evaluation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Evaluation/test coverage (30%)", coverageVal + "%"],
        ["Quality acceptance thresholds/criteria (25%)", criteria + "%"],
        ["Human review & calibration (20%)", review + "%"],
        ["Regression/quality monitoring cadence (25%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand evaluation/test coverage for key use cases, define acceptance thresholds, strengthen human review/calibration, and monitor quality/regressions on a regular cadence."
          : "Readiness is trending well — keep evaluations, acceptance criteria, review practices, and regression monitoring current as models, data, and use cases change.",
    };
  }
  if (id === "logging-traceability-audit") {
    const coverageVal = v["coverage"] ?? 0,
      traceability = v["traceability"] ?? 0,
      integrity = v["integrity"] ?? 0,
      audit = v["audit"] ?? 0,
      score = Math.round(coverageVal * 0.3 + traceability * 0.25 + integrity * 0.25 + audit * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Logging, traceability & audit readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Event/action log coverage (30%)", coverageVal + "%"],
        ["Traceability to inputs/decisions/versions (25%)", traceability + "%"],
        ["Record retention & integrity (25%)", integrity + "%"],
        ["Audit evidence access & review (20%)", audit + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand logging of key AI events and context, strengthen traceability to inputs/decisions/model versions, ensure retention and integrity of records, and make audit evidence accessible for timely review."
          : "Readiness is trending well — keep logging and traceability comprehensive, protect record integrity/retention, and ensure audit evidence remains accessible and reviewable.",
    };
  }
  if (id === "bias-fairness-impact") {
    const assessment = v["assessment"] ?? 0,
      mitigation = v["mitigation"] ?? 0,
      stakeholders = v["stakeholders"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(assessment * 0.3 + mitigation * 0.25 + stakeholders * 0.2 + monitoring * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Bias, fairness & impact assessment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Impact/fairness assessments completed (30%)", assessment + "%"],
        ["Mitigations & guardrail controls (25%)", mitigation + "%"],
        ["Stakeholder/affected-group review (20%)", stakeholders + "%"],
        ["Monitoring & remediation evidence (25%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: complete impact/fairness assessments for key uses, implement mitigations and guardrails, engage stakeholders/affected groups for review and feedback, and monitor outcomes with documented remediation."
          : "Readiness is trending well — keep assessments, mitigations, stakeholder engagement, and monitoring/remediation evidence current as systems, data, and contexts change.",
    };
  }
  if (id === "access-identity-assurance") {
    const leastpriv = v["leastpriv"] ?? 0,
      secrets = v["secrets"] ?? 0,
      reviews = v["reviews"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(leastpriv * 0.3 + secrets * 0.25 + reviews * 0.2 + monitoring * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Access control & identity assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Least-privilege roles & access (30%)", leastpriv + "%"],
        ["Credential/API key/secret management (25%)", secrets + "%"],
        ["Access review & recertification (20%)", reviews + "%"],
        ["Privileged-action logging & monitoring (25%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: enforce least-privilege roles and access, strengthen credential/API key/secret management, run access reviews/recertification on cadence, and log/monitor privileged actions with evidence."
          : "Readiness is trending well — maintain least-privilege access, protect credentials and secrets, keep access reviews current, and monitor privileged activity as systems and users change.",
    };
  }
  if (id === "business-continuity-resilience") {
    const dependencies = v["dependencies"] ?? 0,
      fallback = v["fallback"] ?? 0,
      recovery = v["recovery"] ?? 0,
      testing = v["testing"] ?? 0,
      score = Math.round(dependencies * 0.3 + fallback * 0.25 + recovery * 0.25 + testing * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Business continuity & resilience readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Critical AI dependencies mapped (30%)", dependencies + "%"],
        ["Fallback/degraded-mode plans (25%)", fallback + "%"],
        ["Backup & recovery objectives defined (25%)", recovery + "%"],
        ["Resilience testing & exercise cadence (20%)", testing + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map critical AI dependencies, define fallback/degraded-mode plans, set backup and recovery objectives, and test resilience through regular exercises."
          : "Readiness is trending well — keep dependency mapping, fallback plans, recovery objectives, and resilience exercises current as systems and operating conditions change.",
    };
  }
  if (id === "provenance-lineage") {
    const datalineage = v["datalineage"] ?? 0,
      modelprov = v["modelprov"] ?? 0,
      pipelines = v["pipelines"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(datalineage * 0.3 + modelprov * 0.25 + pipelines * 0.25 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Data/model provenance & lineage readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Data/source lineage documented (30%)", datalineage + "%"],
        ["Model/version provenance tracked (25%)", modelprov + "%"],
        ["Transformations & pipeline steps documented (25%)", pipelines + "%"],
        ["Provenance evidence reviewed & current (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: document data/source lineage for key uses, track model/version provenance, record transformations and pipeline steps, and review provenance evidence to keep it current."
          : "Readiness is trending well — maintain lineage and provenance records, keep pipeline documentation current, and review provenance evidence as data, models, and workflows change.",
    };
  }
  if (id === "policy-accountability") {
    const coverageVal = v["coverage"] ?? 0,
      accountability = v["accountability"] ?? 0,
      training = v["training"] ?? 0,
      enforcement = v["enforcement"] ?? 0,
      score = Math.round(coverageVal * 0.3 + accountability * 0.25 + training * 0.2 + enforcement * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Responsible AI policy & accountability readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Policy coverage for key risks/uses (30%)", coverageVal + "%"],
        ["Roles, ownership & accountability (25%)", accountability + "%"],
        ["Training & policy acknowledgment (20%)", training + "%"],
        ["Policy review, enforcement & evidence (25%)", enforcement + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand policy coverage for key AI risks and uses, clarify roles and accountability, strengthen training/acknowledgment, and maintain review, enforcement, and evidence."
          : "Readiness is trending well — keep policies, accountability mapping, training, and enforcement evidence current as AI use, risks, and requirements evolve.",
    };
  }
  if (id === "safety-misuse-prevention") {
    const controls = v["controls"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      testing = v["testing"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(controls * 0.3 + monitoring * 0.25 + testing * 0.2 + review * 0.25),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Safety & misuse prevention readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Safety/guardrail controls implemented (30%)", controls + "%"],
        ["Misuse/abuse monitoring & response (25%)", monitoring + "%"],
        ["Red-teaming/safety testing cadence (20%)", testing + "%"],
        ["Safety incident review & improvement (25%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: implement and enable safety/guardrail controls, strengthen misuse monitoring and response, run red-teaming/safety testing on cadence, and review safety incidents with documented improvements."
          : "Readiness is trending well — maintain safety controls, monitor for misuse, keep testing current, and use incident reviews to drive continuous improvement.",
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
