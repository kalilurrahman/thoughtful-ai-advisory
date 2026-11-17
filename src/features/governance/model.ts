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
  if (id === "inventory-risk-classification") {
    const inventory = v["inventory"] ?? 0,
      classification = v["classification"] ?? 0,
      ownership = v["ownership"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(inventory * 0.3 + classification * 0.25 + ownership * 0.25 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI inventory & risk classification readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI systems & use cases inventoried (30%)", inventory + "%"],
        ["Risk tiering/classification coverage (25%)", classification + "%"],
        ["Ownership & lifecycle tracking (25%)", ownership + "%"],
        ["Periodic review/revalidation evidence (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: maintain a complete AI inventory, classify systems/use cases by risk, assign ownership and lifecycle tracking, and conduct periodic review/revalidation with evidence."
          : "Readiness is trending well — keep the inventory, risk classifications, ownership/lifecycle records, and review evidence current as AI systems and uses change.",
    };
  }
  if (id === "explainability-interpretability") {
    const coverageVal = v["coverage"] ?? 0,
      rationale = v["rationale"] ?? 0,
      uncertainty = v["uncertainty"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(coverageVal * 0.3 + rationale * 0.25 + uncertainty * 0.25 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Explainability & interpretability readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Explanation/interpretability coverage (30%)", coverageVal + "%"],
        ["User-appropriate rationale & guidance (25%)", rationale + "%"],
        ["Limitations & uncertainty communicated (25%)", uncertainty + "%"],
        ["Explainability review & evidence cadence (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand explanation/interpretability coverage for key uses, provide user-appropriate rationale and guidance, communicate limitations and uncertainty clearly, and review explainability practices with supporting evidence."
          : "Readiness is trending well — keep explanations, user guidance, and limitation/uncertainty communications current, and review explainability evidence as systems and uses change.",
    };
  }
  if (id === "continuous-monitoring-oversight") {
    const signals = v["signals"] ?? 0,
      alerting = v["alerting"] ?? 0,
      oversight = v["oversight"] ?? 0,
      remediation = v["remediation"] ?? 0,
      score = Math.round(signals * 0.3 + alerting * 0.25 + oversight * 0.25 + remediation * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Continuous monitoring & oversight readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Monitoring signal coverage (30%)", signals + "%"],
        ["Alerting & thresholds configured (25%)", alerting + "%"],
        ["Human review & oversight cadence (25%)", oversight + "%"],
        ["Drift/issue detection & remediation evidence (20%)", remediation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand monitoring signal coverage, configure actionable alerting/thresholds, maintain human review and oversight cadence, and document drift/issue detection and remediation with evidence."
          : "Readiness is trending well — keep monitoring signals, alerting, oversight cadence, and remediation evidence current as systems, risks, and performance change.",
    };
  }
  if (id === "security-vulnerability-management") {
    const patching = v["patching"] ?? 0,
      hardening = v["hardening"] ?? 0,
      testing = v["testing"] ?? 0,
      remediation = v["remediation"] ?? 0,
      score = Math.round(patching * 0.3 + hardening * 0.25 + testing * 0.25 + remediation * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Security & vulnerability management readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Vulnerability & patch coverage (30%)", patching + "%"],
        ["Secure configuration & hardening (25%)", hardening + "%"],
        ["Security testing & assessment cadence (25%)", testing + "%"],
        ["Security incident & remediation evidence (20%)", remediation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: improve vulnerability and patch coverage for AI components, enforce secure configuration and hardening, maintain regular security testing and assessments, and document security incidents and remediation with evidence."
          : "Readiness is trending well — keep patching, hardening, security testing cadence, and incident/remediation evidence current as AI components and threats evolve.",
    };
  }
  if (id === "regulatory-compliance-alignment") {
    const mapping = v["mapping"] ?? 0,
      evidence = v["evidence"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      remediation = v["remediation"] ?? 0,
      score = Math.round(mapping * 0.3 + evidence * 0.25 + monitoring * 0.25 + remediation * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Regulatory & compliance alignment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Applicable requirements mapped (30%)", mapping + "%"],
        ["Control mapping & evidence coverage (25%)", evidence + "%"],
        ["Compliance monitoring & assessment cadence (25%)", monitoring + "%"],
        ["Remediation & attestation evidence (20%)", remediation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map applicable regulatory and compliance requirements to AI uses and controls, maintain control mapping and evidence coverage, conduct compliance monitoring and assessments on cadence, and document remediation and attestation with evidence."
          : "Readiness is trending well — keep requirement mappings, control evidence, compliance assessments, and remediation/attestation records current as regulations and AI uses change.",
    };
  }
  if (id === "data-quality-integrity") {
    const quality = v["quality"] ?? 0,
      integrity = v["integrity"] ?? 0,
      issues = v["issues"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(quality * 0.3 + integrity * 0.25 + issues * 0.25 + monitoring * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Data quality & integrity readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Source/data quality checks (30%)", quality + "%"],
        ["Integrity & validation controls (25%)", integrity + "%"],
        ["Data quality issue handling & remediation (25%)", issues + "%"],
        ["Quality monitoring & evidence cadence (20%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: strengthen source and data quality checks, apply integrity and validation controls, improve data quality issue handling and remediation, and maintain quality monitoring with evidence on cadence."
          : "Readiness is trending well — keep data quality checks, integrity and validation controls, issue remediation, and monitoring evidence current as data sources and AI uses change.",
    };
  }
  if (id === "human-oversight-escalation") {
    const points = v["points"] ?? 0,
      escalation = v["escalation"] ?? 0,
      training = v["training"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(points * 0.3 + escalation * 0.25 + training * 0.25 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Human oversight & escalation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Defined oversight points (30%)", points + "%"],
        ["Escalation paths & response targets (25%)", escalation + "%"],
        ["Reviewer training & authority (25%)", training + "%"],
        ["Oversight evidence & review cadence (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define oversight points for key AI decisions/outputs, establish escalation paths and response targets, ensure reviewer training and authority, and maintain oversight evidence and review cadence."
          : "Readiness is trending well — keep oversight points, escalation paths and targets, reviewer readiness, and oversight evidence current as AI uses and risks change.",
    };
  }
  if (id === "model-documentation-transparency") {
    const coverageVal = v["coverage"] ?? 0,
      limitations = v["limitations"] ?? 0,
      artifacts = v["artifacts"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(coverageVal * 0.3 + limitations * 0.25 + artifacts * 0.25 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Model documentation & transparency readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Model/system documentation coverage (30%)", coverageVal + "%"],
        ["Intended use & limitations documented (25%)", limitations + "%"],
        ["Stakeholder-appropriate transparency artifacts (25%)", artifacts + "%"],
        ["Documentation review & update evidence (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand model/system documentation coverage, document intended use and limitations clearly, provide stakeholder-appropriate transparency artifacts, and maintain documentation review and update evidence on cadence."
          : "Readiness is trending well — keep documentation, intended-use/limitation statements, transparency artifacts, and review evidence current as models and uses change.",
    };
  }
  if (id === "post-deployment-performance-drift") {
    const kpis = v["kpis"] ?? 0,
      drift = v["drift"] ?? 0,
      thresholds = v["thresholds"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(kpis * 0.3 + drift * 0.25 + thresholds * 0.25 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Post-deployment performance & drift readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Performance & quality KPI coverage (30%)", kpis + "%"],
        ["Drift & degradation detection (25%)", drift + "%"],
        ["Retraining/rollback thresholds & process (25%)", thresholds + "%"],
        ["Performance review & evidence cadence (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define performance and quality KPIs, configure drift and degradation detection, establish retraining/rollback thresholds and process, and maintain performance review evidence on cadence."
          : "Readiness is trending well — keep KPIs, drift detection, retraining/rollback thresholds, and performance review evidence current as models and data change.",
    };
  }
  if (id === "ai-supply-chain-dependency-assurance") {
    const provenance = v["provenance"] ?? 0,
      inventory = v["inventory"] ?? 0,
      supplier = v["supplier"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(provenance * 0.3 + inventory * 0.25 + supplier * 0.25 + monitoring * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI supply chain & dependency assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Component/model/source provenance checks (30%)", provenance + "%"],
        ["Dependency inventory / SBOM coverage (25%)", inventory + "%"],
        ["Supplier assurance & license/usage review (25%)", supplier + "%"],
        ["Dependency monitoring & update evidence (20%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: run provenance checks on components, models and sources, maintain a dependency inventory/SBOM, complete supplier assurance and license/usage reviews, and keep dependency monitoring and update evidence current."
          : "Readiness is trending well — keep provenance checks, dependency inventory, supplier/license reviews, and monitoring evidence current as components and suppliers change.",
    };
  }
  if (id === "human-factors-usability") {
    const testing = v["testing"] ?? 0,
      errors = v["errors"] ?? 0,
      workload = v["workload"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(testing * 0.3 + errors * 0.25 + workload * 0.25 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Human factors & usability readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["User testing & feedback coverage (30%)", testing + "%"],
        ["Error & override handling (25%)", errors + "%"],
        ["Workload & comprehension safeguards (25%)", workload + "%"],
        ["Usability review & evidence cadence (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: expand user testing and feedback coverage for AI features, support error and override handling, apply workload and comprehension safeguards, and maintain usability review evidence on cadence."
          : "Readiness is trending well — keep user testing, error/override handling, workload safeguards, and usability review evidence current as AI features and users change.",
    };
  }
  if (id === "ethical-societal-impact") {
    const review = v["review"] ?? 0,
      principles = v["principles"] ?? 0,
      societal = v["societal"] ?? 0,
      escalation = v["escalation"] ?? 0,
      score = Math.round(review * 0.3 + principles * 0.25 + societal * 0.25 + escalation * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Ethical risk & societal impact readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Ethics & values review coverage (30%)", review + "%"],
        ["Documented ethical principles applied (25%)", principles + "%"],
        ["Societal, externality & community scan (25%)", societal + "%"],
        ["Escalation, dissent & remedy path evidenced (20%)", escalation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: review AI use cases against ethics and values, document and apply ethical principles in decisions, scan societal and community effects, and evidence an escalation, dissent and remedy path."
          : "Readiness is trending well — keep ethics reviews, applied principles, societal/community scans, and escalation and remedy evidence current as use cases and contexts change.",
    };
  }
  if (id === "training-competency") {
    const coverage = v["coverage"] ?? 0,
      competence = v["competence"] ?? 0,
      refresher = v["refresher"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(coverage * 0.3 + competence * 0.3 + refresher * 0.2 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Training & competency assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Required-role completion coverage (30%)", coverage + "%"],
        ["Competence verified by assessment (30%)", competence + "%"],
        ["Refresher & change-triggered cadence (20%)", refresher + "%"],
        ["Training records & role mapping (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: close required-role training coverage, verify competence with assessment rather than completion alone, trigger refreshers on change, and keep training records mapped to roles as evidence."
          : "Readiness is trending well — keep completion coverage, competence checks, change-triggered refreshers, and role-mapped training records current as systems and roles change.",
    };
  }
  if (id === "inclusive-accessibility") {
    const testing = v["testing"] ?? 0,
      access = v["access"] ?? 0,
      alternatives = v["alternatives"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(testing * 0.3 + access * 0.3 + alternatives * 0.2 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Inclusive design & accessibility readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Inclusive usability testing (30%)", testing + "%"],
        ["Accessibility & language accommodations (30%)", access + "%"],
        ["Human/non-AI alternative route (20%)", alternatives + "%"],
        ["Findings tracked to remediation (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: test with affected users, provide accessibility and language accommodations, keep a human or non-AI route when AI is unsuitable, and track inclusion findings to remediation with evidence."
          : "Readiness is trending well — keep inclusive testing, accommodations, alternative routes, and remediation of inclusion findings current as users and systems change.",
    };
  }
  if (id === "guardrail-effectiveness") {
    const effectiveness = v["effectiveness"] ?? 0,
      tuning = v["tuning"] ?? 0,
      overrides = v["overrides"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(
        effectiveness * 0.3 + tuning * 0.3 + overrides * 0.2 + evidence * 0.2,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Guardrail effectiveness & tuning readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Measured effectiveness vs test/red-team cases (30%)", effectiveness + "%"],
        ["False-positive/false-negative tuning cadence (30%)", tuning + "%"],
        ["Override & exception handling reviewed (20%)", overrides + "%"],
        ["Tuning & exception evidence kept (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: measure guardrail effectiveness against test and red-team cases, tune false positives/negatives on a cadence, record and review overrides and exceptions, and keep tuning evidence for review."
          : "Readiness is trending well — keep effectiveness testing, tuning cadence, override/exception review, and tuning evidence current as models, prompts, and threat patterns change.",
    };
  }
  if (id === "retention-deletion") {
    const schedules = v["schedules"] ?? 0,
      deletion = v["deletion"] ?? 0,
      requests = v["requests"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(schedules * 0.3 + deletion * 0.3 + requests * 0.2 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Data retention & deletion assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Retention schedules defined (30%)", schedules + "%"],
        ["Timely deletion & secure disposal (30%)", deletion + "%"],
        ["Erasure, holds & requests handled (20%)", requests + "%"],
        ["Retention & disposal evidence (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define retention schedules for AI data and artifacts, execute timely deletion and secure disposal, handle erasure/holds and requests, and keep retention and disposal actions evidenced and reviewed."
          : "Readiness is trending well — keep retention schedules, deletion/disposal execution, request handling, and disposal evidence current as data, systems, and obligations change.",
    };
  }
  if (id === "decommissioning-retirement") {
    const criteria = v["criteria"] ?? 0,
      disposal = v["disposal"] ?? 0,
      continuity = v["continuity"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(criteria * 0.25 + disposal * 0.3 + continuity * 0.25 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI decommissioning & retirement readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Retirement criteria, triggers & approvals (25%)", criteria + "%"],
        ["Data/model disposal & access removal (30%)", disposal + "%"],
        ["Stakeholder notice, continuity & alternatives (25%)", continuity + "%"],
        ["Decommissioning records & evidence (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define retirement criteria, triggers and approvals, remove or securely dispose data/models and access, plan stakeholder notice and continuity/alternatives, and record decommissioning actions as evidence."
          : "Readiness is trending well — keep retirement criteria, disposal and access removal, continuity planning, and decommissioning evidence current as systems and dependencies change.",
    };
  }
  if (id === "procurement-contracting") {
    const requirements = v["requirements"] ?? 0,
      terms = v["terms"] ?? 0,
      onboarding = v["onboarding"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(requirements * 0.3 + terms * 0.3 + onboarding * 0.2 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI procurement & contracting assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI requirements & risk tiering at sourcing (30%)", requirements + "%"],
        ["Data/security/incident/IP/liability terms (30%)", terms + "%"],
        ["Supplier onboarding & obligation verification (20%)", onboarding + "%"],
        ["Renewal/exit reviews & evidence (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define AI requirements and risk tiering before sourcing, put data/security/incident/IP/liability terms in contracts, verify supplier onboarding and obligations, and record renewal and exit reviews with evidence."
          : "Readiness is trending well — keep sourcing requirements, contract terms, supplier onboarding checks, and renewal/exit records current as suppliers and obligations change.",
    };
  }
  if (id === "ethics-values-alignment") {
    const values = v["values"] ?? 0,
      deliberation = v["deliberation"] ?? 0,
      stakeholders = v["stakeholders"] ?? 0,
      closure = v["closure"] ?? 0,
      score = Math.round(values * 0.3 + deliberation * 0.25 + stakeholders * 0.25 + closure * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI ethics & values alignment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Codified values applied to AI decisions (30%)", values + "%"],
        ["Ethics deliberation for edge cases/conflicts (25%)", deliberation + "%"],
        ["Affected-group input into value trade-offs (25%)", stakeholders + "%"],
        ["Ethics findings tracked to closure (20%)", closure + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: codify values and apply them in AI decisions, deliberate edge cases and value conflicts, bring affected groups into value trade-offs, and track ethics findings to decision and closure."
          : "Readiness is trending well — keep values applied to decisions, ethics deliberation, stakeholder input, and finding closure current as use cases and expectations change.",
    };
  }
  if (id === "transparency-disclosure") {
    const notice = v["notice"] ?? 0,
      limits = v["limits"] ?? 0,
      appeal = v["appeal"] ?? 0,
      record = v["record"] ?? 0,
      score = Math.round(notice * 0.3 + limits * 0.25 + appeal * 0.25 + record * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI transparency & user disclosure readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Clear notice that AI is in use (30%)", notice + "%"],
        ["Purpose, limits & failure modes disclosed (25%)", limits + "%"],
        ["Question, appeal & human-contact routes (25%)", appeal + "%"],
        ["Disclosure decisions recorded across channels (20%)", record + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: tell users when AI is in use, disclose purpose, limits and known failure modes, publish question, appeal and human-contact routes, and record disclosure decisions across channels and languages."
          : "Readiness is trending well — keep AI-in-use notices, limit disclosures, appeal routes and channel coverage current as features and audiences change.",
    };
  }
  if (id === "data-rights-licensing") {
    const basis = v["basis"] ?? 0,
      licence = v["licence"] ?? 0,
      optout = v["optout"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(basis * 0.3 + licence * 0.3 + optout * 0.2 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Training data rights & licensing readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Lawful basis & consent documented (30%)", basis + "%"],
        ["Dataset licences & contract terms checked (30%)", licence + "%"],
        ["Opt-out & withdrawal honoured in models (20%)", optout + "%"],
        ["Scraped/third-party dataset review evidence (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: document lawful basis and consent for training data, check dataset licences and contract terms before use, honour opt-out and withdrawal requests in models, and keep review evidence for scraped and third-party datasets."
          : "Readiness is trending well — re-check lawful basis, licences, opt-out handling and dataset evidence whenever data sources, model versions or terms change.",
    };
  }
  if (id === "guardrail-config-governance") {
    const versioned = v["versioned"] ?? 0,
      review = v["review"] ?? 0,
      testing = v["testing"] ?? 0,
      rollback = v["rollback"] ?? 0,
      score = Math.round(versioned * 0.3 + review * 0.3 + testing * 0.2 + rollback * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Guardrail configuration & change governance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Rules & thresholds version-controlled (30%)", versioned + "%"],
        ["Threshold/policy changes reviewed & approved (30%)", review + "%"],
        ["Rule changes tested before release (20%)", testing + "%"],
        ["Rollback path & environment parity (20%)", rollback + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: version-control guardrail rules and thresholds, review and approve threshold and policy changes, test rule changes against known cases before release, and confirm rollback paths and environment parity."
          : "Readiness is trending well — keep rule versions, change approvals, pre-release tests and rollback parity current so guardrail behaviour cannot change unobserved.",
    };
  }
  if (id === "assurance-cadence") {
    const schedule = v["schedule"] ?? 0,
      testing = v["testing"] ?? 0,
      freshness = v["freshness"] ?? 0,
      escalation = v["escalation"] ?? 0,
      score = Math.round(schedule * 0.3 + testing * 0.3 + freshness * 0.2 + escalation * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Assurance review cadence & evidence refresh readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Scheduled reviews with named owners (30%)", schedule + "%"],
        ["Control testing against a dated plan (30%)", testing + "%"],
        ["Evidence refresh & staleness tracking (20%)", freshness + "%"],
        ["Overdue reviews & evidence escalated (20%)", escalation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: schedule reviews with named owners, test controls against a dated plan, refresh evidence and track staleness, and escalate overdue reviews and evidence."
          : "Readiness is trending well — keep the review calendar, control testing, evidence freshness and overdue escalation working as systems and risks change.",
    };
  }
  if (id === "risk-appetite") {
    const appetite = v["appetite"] ?? 0,
      tolerance = v["tolerance"] ?? 0,
      breach = v["breach"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(appetite * 0.3 + tolerance * 0.3 + breach * 0.2 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI risk appetite & tolerance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Risk appetite documented per use case & tier (30%)", appetite + "%"],
        ["Tolerance thresholds & limits quantified (30%)", tolerance + "%"],
        ["Breach detection with defined responses (20%)", breach + "%"],
        ["Appetite reviewed against the live portfolio (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: document risk appetite per use case and tier, quantify tolerance thresholds and limits, detect breaches with defined responses, and review appetite against the live portfolio."
          : "Readiness is trending well — keep appetite statements, tolerance limits, breach responses and portfolio reviews current as use cases and risk exposure change.",
    };
  }
  if (id === "evaluation-dataset-governance") {
    const versioned = v["versioned"] ?? 0,
      holdout = v["holdout"] ?? 0,
      coverage = v["coverage"] ?? 0,
      refresh = v["refresh"] ?? 0,
      score = Math.round(versioned * 0.3 + holdout * 0.3 + coverage * 0.2 + refresh * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI evaluation dataset governance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Evaluation sets versioned & documented (30%)", versioned + "%"],
        ["Holdout discipline & contamination checks (30%)", holdout + "%"],
        ["Coverage of real cases & edge conditions (20%)", coverage + "%"],
        ["Refresh & sign-off on model/data change (20%)", refresh + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: version and document evaluation sets, keep holdouts uncontaminated, cover real cases and edge conditions, and refresh and sign off evaluations when models or data change."
          : "Readiness is trending well — keep eval versions, holdout integrity, coverage and refresh sign-off current so results still mean what they claim.",
    };
  }
  if (id === "assurance-case") {
    const claims = v["claims"] ?? 0,
      evidence = v["evidence"] ?? 0,
      assumptions = v["assumptions"] ?? 0,
      challenge = v["challenge"] ?? 0,
      score = Math.round(claims * 0.3 + evidence * 0.3 + assumptions * 0.2 + challenge * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI assurance case readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Explicit claims stated for the system (30%)", claims + "%"],
        ["Evidence mapped to each claim (30%)", evidence + "%"],
        ["Assumptions, limits & counter-arguments (20%)", assumptions + "%"],
        ["Independent challenge recorded (20%)", challenge + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: state explicit claims for the AI system, map evidence to each claim, document assumptions, limits and counter-arguments, and record independent challenge before relying on the argument."
          : "Readiness is trending well — keep claims, evidence mapping, assumptions and independent challenge current as the system and its context change.",
    };
  }
  if (id === "governance-operating-model") {
    const forums = v["forums"] ?? 0,
      rights = v["rights"] ?? 0,
      escalation = v["escalation"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(forums * 0.3 + rights * 0.3 + escalation * 0.2 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI governance operating model & decision rights readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Chartered AI forums with named members (30%)", forums + "%"],
        ["Decision rights for approve/waive/stop (30%)", rights + "%"],
        ["Escalation routes with turnaround commitments (20%)", escalation + "%"],
        ["Operating model reviewed as the estate grows (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: charter AI forums with named members, document decision rights for approve, waive and stop, set escalation routes with turnaround commitments, and review the operating model as the estate grows."
          : "Readiness is trending well — keep forum membership, decision rights, escalation turnaround and operating-model reviews current as use cases multiply.",
    };
  }
  if (id === "agentic-guardrails") {
    const permissions = v["permissions"] ?? 0,
      approval = v["approval"] ?? 0,
      limits = v["limits"] ?? 0,
      replay = v["replay"] ?? 0,
      score = Math.round(permissions * 0.3 + approval * 0.3 + limits * 0.2 + replay * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Agentic AI action guardrails readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Least-privilege tool & action permissions (30%)", permissions + "%"],
        ["Human approval for irreversible actions (30%)", approval + "%"],
        ["Scope, spend & rate limits enforced (20%)", limits + "%"],
        ["Action logs complete and replayable (20%)", replay + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: restrict agents to least-privilege tool and action permissions, require human approval for irreversible or high-impact actions, enforce scope, spend and rate limits, and keep action logs complete and replayable."
          : "Readiness is trending well — re-test agent permissions, approval gates, limits and action logs whenever tools, scopes or autonomy levels change.",
    };
  }
  if (id === "workforce-role-change") {
    const mapping = v["mapping"] ?? 0,
      consultation = v["consultation"] ?? 0,
      reskilling = v["reskilling"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(mapping * 0.3 + consultation * 0.3 + reskilling * 0.2 + monitoring * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI workforce impact & role change readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Affected roles & task-level impact mapped (30%)", mapping + "%"],
        ["Consultation with affected workers (30%)", consultation + "%"],
        ["Reskilling & redeployment paths agreed (20%)", reskilling + "%"],
        ["Displacement, workload & quality monitored (20%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map affected roles and task-level impact, consult affected workers and their representatives, agree reskilling and redeployment paths, and monitor displacement, workload and quality effects after deployment."
          : "Readiness is trending well — keep role-impact mapping, consultation, reskilling paths and post-deployment workforce monitoring current as AI changes the work.",
    };
  }
  if (id === "risk-register-quality") {
    const statements = v["statements"] ?? 0,
      owners = v["owners"] ?? 0,
      residual = v["residual"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(statements * 0.3 + owners * 0.3 + residual * 0.2 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI risk register quality & treatment tracking readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Risk statements current, specific & tied to systems (30%)", statements + "%"],
        ["Named owners & dated treatment plans (30%)", owners + "%"],
        ["Residual risk tracked with evidence (20%)", residual + "%"],
        ["Register reviewed; stale & duplicates closed (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: keep risk statements current, specific and tied to systems, assign named owners with dated treatment plans, track residual risk with evidence, and review the register to close stale or duplicated entries."
          : "Readiness is trending well — keep statements, owners, treatment dates, residual evidence and register reviews current so the register stays a working tool rather than an archive.",
    };
  }
  if (id === "output-ip-rights") {
    const ownership = v["ownership"] ?? 0,
      infringement = v["infringement"] ?? 0,
      licences = v["licences"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      score = Math.round(ownership * 0.3 + infringement * 0.2 + licences * 0.3 + disclosure * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI output ownership & IP risk readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Output ownership & usage rights in contracts (30%)", ownership + "%"],
        ["Infringement & similarity checks (20%)", infringement + "%"],
        ["Third-party & open-source licence tracking (30%)", licences + "%"],
        ["AI-assisted work disclosed & recorded (20%)", disclosure + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: settle output ownership and usage rights in contracts, run infringement and similarity checks on generated material, track third-party and open-source licence obligations, and record where AI assisted the work."
          : "Readiness is trending well — re-check ownership terms, similarity checks, licence obligations and disclosure records when models, providers or output uses change.",
    };
  }
  if (id === "oversight-capacity") {
    const capacity = v["capacity"] ?? 0,
      competence = v["competence"] ?? 0,
      workload = v["workload"] ?? 0,
      bias = v["bias"] ?? 0,
      score = Math.round(capacity * 0.3 + competence * 0.3 + workload * 0.2 + bias * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI human oversight capacity readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Review capacity matched to decision volume (30%)", capacity + "%"],
        ["Reviewer competence & authority to override (30%)", competence + "%"],
        ["Workload limits allow real review time (20%)", workload + "%"],
        ["Override rates & rubber-stamping monitored (20%)", bias + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: match review capacity to decision volume, confirm reviewer competence and authority to override, set workload limits that allow real review time, and monitor override rates for rubber-stamping."
          : "Readiness is trending well — keep review capacity, reviewer authority, workload limits and override monitoring aligned as decision volume grows.",
    };
  }
  if (id === "governance-metrics") {
    const defined = v["defined"] ?? 0,
      sources = v["sources"] ?? 0,
      honest = v["honest"] ?? 0,
      decisions = v["decisions"] ?? 0,
      score = Math.round(defined * 0.3 + sources * 0.3 + honest * 0.2 + decisions * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI governance metrics & reporting readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Defined metrics with owners & thresholds (30%)", defined + "%"],
        ["Metrics traced to system data (30%)", sources + "%"],
        ["Reporting includes failures & near misses (20%)", honest + "%"],
        ["Decisions recorded from the metrics (20%)", decisions + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define a small set of metrics with owners and thresholds, trace them to system data rather than manual decks, include failures and near misses in reporting, and record the decisions the numbers drove."
          : "Readiness is trending well — keep metric definitions, data lineage, honest reporting and recorded decisions current so reporting stays decision-grade rather than decorative.",
    };
  }
  if (id === "production-testing") {
    const shadow = v["shadow"] ?? 0,
      canary = v["canary"] ?? 0,
      rollback = v["rollback"] ?? 0,
      safeguards = v["safeguards"] ?? 0,
      score = Math.round(shadow * 0.3 + canary * 0.3 + rollback * 0.2 + safeguards * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI production testing & canary readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Shadow-mode comparison before exposure (30%)", shadow + "%"],
        ["Canary rollout with success & stop criteria (30%)", canary + "%"],
        ["Rollback & kill switch tested in production (20%)", rollback + "%"],
        ["Production test data & user safeguards (20%)", safeguards + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: compare in shadow mode before real exposure, run a canary with pre-agreed success and stop criteria, test rollback and kill switches in production, and protect test data and affected users."
          : "Readiness is trending well — keep shadow comparisons, canary criteria, tested rollback and production safeguards current as models and traffic change.",
    };
  }
  if (id === "model-deprecation") {
    const register = v["register"] ?? 0,
      retest = v["retest"] ?? 0,
      fallback = v["fallback"] ?? 0,
      reapproval = v["reapproval"] ?? 0,
      score = Math.round(register * 0.3 + retest * 0.3 + fallback * 0.2 + reapproval * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI model deprecation & migration readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Model versions & sunset dates tracked (30%)", register + "%"],
        ["Re-evaluation & regression tests before migration (30%)", retest + "%"],
        ["Tested fallback or portability option (20%)", fallback + "%"],
        ["Migrated system re-approved & recorded (20%)", reapproval + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: track model versions and provider sunset dates, re-evaluate and regression-test before migration, keep a tested fallback or portability option, and re-approve and record the migrated system."
          : "Readiness is trending well — watch provider deprecation notices, re-test on every model change, and keep fallback and re-approval records current.",
    };
  }
  if (id === "board-oversight") {
    const attention = v["attention"] ?? 0,
      reporting = v["reporting"] ?? 0,
      challenge = v["challenge"] ?? 0,
      decisions = v["decisions"] ?? 0,
      score = Math.round(attention * 0.3 + reporting * 0.3 + challenge * 0.2 + decisions * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI board & executive oversight readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Scheduled board attention with executive owner (30%)", attention + "%"],
        ["Board reporting includes risk, incidents & failures (30%)", reporting + "%"],
        ["Challenge & dissent recorded in minutes (20%)", challenge + "%"],
        ["Executive decisions tracked to completion (20%)", decisions + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: put AI on the board agenda with a named executive owner, report risk, incidents and failures honestly, minute the challenge and dissent, and track executive decisions to completion."
          : "Readiness is trending well — keep board attention scheduled, reporting candid, challenge minuted, and decisions followed through as the AI portfolio grows.",
    };
  }
  if (id === "incident-severity") {
    const tiers = v["tiers"] ?? 0,
      triage = v["triage"] ?? 0,
      notification = v["notification"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(tiers * 0.3 + triage * 0.3 + notification * 0.2 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI incident severity & notification readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Severity tiers cover AI-specific harms (30%)", tiers + "%"],
        ["Named triage owner with a decision window (30%)", triage + "%"],
        ["Notification triggers & timelines agreed in advance (20%)", notification + "%"],
        ["Blameless review & corrective actions tracked (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define severity tiers that cover AI-specific harms, name a triage owner with a decision window, agree notification triggers and timelines with legal and communications beforehand, and run blameless reviews with tracked corrective actions."
          : "Readiness is trending well — re-test severity calls against real near misses, keep notification contacts and timelines current, and close corrective actions on schedule.",
    };
  }
  if (id === "secrets-hygiene") {
    const register = v["register"] ?? 0,
      scoping = v["scoping"] ?? 0,
      rotation = v["rotation"] ?? 0,
      detection = v["detection"] ?? 0,
      score = Math.round(register * 0.3 + scoping * 0.3 + rotation * 0.2 + detection * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI model key & secrets hygiene readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Key register with owners & environments (30%)", register + "%"],
        ["Least-privilege keys, never in client code (30%)", scoping + "%"],
        ["Rotation & revocation rehearsed (20%)", rotation + "%"],
        ["Leaks in repos, logs or prompts detected (20%)", detection + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: register every model key with an owner and environment, scope keys to least privilege and keep them server-side, rehearse rotation and revocation, and scan repos, logs and prompts for leaks."
          : "Readiness is trending well — keep the key register current, re-test revocation, and treat prompt and log output as a place secrets can escape.",
    };
  }
  if (id === "evidence-pack") {
    const mapping = v["mapping"] ?? 0,
      freshness = v["freshness"] ?? 0,
      traceability = v["traceability"] ?? 0,
      walkthrough = v["walkthrough"] ?? 0,
      score = Math.round(mapping * 0.3 + freshness * 0.25 + traceability * 0.25 + walkthrough * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI assurance evidence pack readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Evidence mapped to the claims it supports (30%)", mapping + "%"],
        ["Evidence dated & still current (25%)", freshness + "%"],
        ["Each claim traceable to an owner & source (25%)", traceability + "%"],
        ["Reviewer can navigate & reproduce unaided (20%)", walkthrough + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map each claim to the evidence behind it, date the evidence and refresh it, name an owner and source per claim, and run a walkthrough with someone who did not assemble the pack."
          : "Readiness is trending well — re-date evidence before each review, keep the claim-to-evidence map current, and re-run the unaided walkthrough after major changes.",
    };
  }
  if (id === "prompt-injection") {
    const threatmodel = v["threatmodel"] ?? 0,
      filtering = v["filtering"] ?? 0,
      leastprivilege = v["leastprivilege"] ?? 0,
      redteam = v["redteam"] ?? 0,
      score = Math.round(threatmodel * 0.3 + filtering * 0.3 + leastprivilege * 0.2 + redteam * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Prompt injection & jailbreak resilience readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Retrieved & user content treated as untrusted (30%)", threatmodel + "%"],
        ["Input/output filtering & instruction isolation (30%)", filtering + "%"],
        ["Tools & data scoped against a hijack (20%)", leastprivilege + "%"],
        ["Red-team attacks in a regression suite (20%)", redteam + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: treat retrieved and user content as untrusted, isolate instructions and filter input and output, scope tools and data so a hijacked prompt cannot act widely, and turn red-team attacks into a regression suite."
          : "Resilience is trending well — re-run attacks after every model, prompt or tool change, and keep tool and data scopes narrow.",
    };
  }
  if (id === "synthetic-data") {
    const provenance = v["provenance"] ?? 0,
      fidelity = v["fidelity"] ?? 0,
      leakage = v["leakage"] ?? 0,
      labels = v["labels"] ?? 0,
      score = Math.round(provenance * 0.3 + fidelity * 0.25 + leakage * 0.25 + labels * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Synthetic data governance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Generation method, model & parameters recorded (30%)", provenance + "%"],
        ["Fidelity & utility validated against real data (25%)", fidelity + "%"],
        ["No real people or records reproduced (25%)", leakage + "%"],
        ["Synthetic labels reviewed, limits documented (20%)", labels + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: record how each synthetic dataset was generated, validate fidelity and utility against real data, test that the generator does not reproduce real people or records, and review labels while documenting known limits."
          : "Readiness is trending well — keep provenance with the dataset, re-test leakage and fidelity when the generator changes, and state synthetic limits wherever the data is used.",
    };
  }
  if (id === "model-selection") {
    const requirements = v["requirements"] ?? 0,
      evaluation = v["evaluation"] ?? 0,
      rightsize = v["rightsize"] ?? 0,
      switchpath = v["switchpath"] ?? 0,
      score = Math.round(requirements * 0.3 + evaluation * 0.3 + rightsize * 0.2 + switchpath * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI model selection & fitness-for-purpose readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Task requirements & quality bar set first (30%)", requirements + "%"],
        ["Candidates evaluated on your own data (30%)", evaluation + "%"],
        ["Smallest adequate model, trade-offs recorded (20%)", rightsize + "%"],
        ["Switch or exit path assessed before lock-in (20%)", switchpath + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: write the task requirements and quality bar before choosing, evaluate candidates on your own data, choose the smallest model that clears the bar and record the trade-offs, and assess a switch or exit path before lock-in."
          : "Readiness is trending well — re-run your own evaluation when candidates change, revisit right-sizing as usage grows, and keep the exit path credible.",
    };
  }
  if (id === "environmental-impact") {
    const measurement = v["measurement"] ?? 0,
      efficiency = v["efficiency"] ?? 0,
      reporting = v["reporting"] ?? 0,
      targets = v["targets"] ?? 0,
      score = Math.round(measurement * 0.3 + efficiency * 0.3 + reporting * 0.2 + targets * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI compute & environmental impact readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Energy & compute measured per workload (30%)", measurement + "%"],
        ["Right-sizing, caching & low-carbon scheduling (30%)", efficiency + "%"],
        ["Impact in sustainability reporting, assumptions stated (20%)", reporting + "%"],
        ["Reduction targets with owners & review (20%)", targets + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: measure energy and compute per workload with a stated method, apply right-sizing, caching and low-carbon scheduling, include AI impact in sustainability reporting with assumptions, and set reduction targets with owners."
          : "Readiness is trending well — keep measurement with the workload, re-test efficiency as usage grows, and report impact with the same rigour as cost.",
    };
  }
  if (id === "tabletop-exercise") {
    const scenarios = v["scenarios"] ?? 0,
      participants = v["participants"] ?? 0,
      cadence = v["cadence"] ?? 0,
      findings = v["findings"] ?? 0,
      score = Math.round(scenarios * 0.3 + participants * 0.25 + cadence * 0.25 + findings * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI assurance tabletop & rehearsal readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Scenarios cover your real AI failure modes (30%)", scenarios + "%"],
        ["Engineering, business, legal & comms take part (25%)", participants + "%"],
        ["Regular cadence including the last real incident (25%)", cadence + "%"],
        ["Findings tracked to closure with owners (20%)", findings + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: build scenarios from your real AI failure modes, involve engineering, business, legal and communications, run a regular cadence that reuses the last real incident, and track findings to closure with owners."
          : "Readiness is trending well — refresh scenarios from near misses and incidents, keep cross-functional attendance real, and verify findings are closed rather than noted.",
    };
  }
  if (id === "change-impact") {
    const dependencies = v["dependencies"] ?? 0,
      affected = v["affected"] ?? 0,
      retest = v["retest"] ?? 0,
      signoff = v["signoff"] ?? 0,
      score = Math.round(dependencies * 0.3 + affected * 0.25 + retest * 0.25 + signoff * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI change impact assessment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Dependency map of what the change touches (30%)", dependencies + "%"],
        ["Affected user groups & obligations identified (25%)", affected + "%"],
        ["Re-test plan for guardrails & evaluations (25%)", retest + "%"],
        ["Reviewed sign-off incl. risk & legal (20%)", signoff + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map the prompts, tools, datasets and systems the change touches, identify affected user groups and their obligations, plan the guardrail and evaluation re-tests it invalidates, and get a reviewed sign-off that includes risk and legal."
          : "Readiness is trending well — keep the dependency map current, re-test the guardrails a change invalidates, and keep sign-off proportional to the blast radius.",
    };
  }
  if (id === "agent-memory") {
    const register = v["register"] ?? 0,
      retention = v["retention"] ?? 0,
      isolation = v["isolation"] ?? 0,
      control = v["control"] ?? 0,
      score = Math.round(register * 0.3 + retention * 0.25 + isolation * 0.25 + control * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Agent memory governance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Register of what is stored & why (30%)", register + "%"],
        ["Retention & deletion remove memories for real (25%)", retention + "%"],
        ["Isolation between users & tenants (25%)", isolation + "%"],
        ["User visibility & control over what is kept (20%)", control + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: keep a register of what the agent stores and why, verify retention and deletion actually remove memories, test isolation so one user's memories never surface for another, and give users visibility and control over what is kept."
          : "Readiness is trending well — review the memory register as new memory types appear, re-test deletion and isolation after changes, and keep user controls honest.",
    };
  }
  if (id === "incentive-alignment") {
    const incentivemap = v["incentivemap"] ?? 0,
      conflicts = v["conflicts"] ?? 0,
      balanced = v["balanced"] ?? 0,
      escalation = v["escalation"] ?? 0,
      score = Math.round(incentivemap * 0.3 + conflicts * 0.25 + balanced * 0.25 + escalation * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI incentive alignment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Incentives touching AI use mapped (30%)", incentivemap + "%"],
        ["Places where incentives reward bypassing controls (25%)", conflicts + "%"],
        ["Performance measures paired with quality & safety (25%)", balanced + "%"],
        ["Safe route to flag pressure to bypass (20%)", escalation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map the incentives that touch AI use, find where they reward bypassing a control, pair performance measures with quality and safety indicators, and give people a safe route to flag pressure to bypass."
          : "Readiness is trending well — re-check incentives whenever targets change, watch for new shortcuts as tools evolve, and keep the flag route visibly safe.",
    };
  }
  if (id === "provider-terms-watch") {
    const register = v["register"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      impactreview = v["impactreview"] ?? 0,
      fallback = v["fallback"] ?? 0,
      score = Math.round(register * 0.3 + monitoring * 0.25 + impactreview * 0.25 + fallback * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI provider terms change readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Terms, DPAs, subprocessors & model cards registered (30%)", register + "%"],
        ["Notice channels monitored (status, changelog, legal) (25%)", monitoring + "%"],
        ["Changes assessed against the assurance case (25%)", impactreview + "%"],
        ["Tested fallback if terms become unacceptable (20%)", fallback + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: register the terms, data-processing agreements, subprocessors and model cards you rely on with an owner, monitor notice channels, assess changes against your assurance case before adoption, and test a fallback if terms become unacceptable."
          : "Readiness is trending well — keep the register current, route legal and changelog notices to an owner, and re-test the fallback as dependencies grow.",
    };
  }
  if (id === "regulator-inquiry") {
    const evidenceindex = v["evidenceindex"] ?? 0,
      responder = v["responder"] ?? 0,
      timelines = v["timelines"] ?? 0,
      verification = v["verification"] ?? 0,
      score = Math.round(evidenceindex * 0.3 + responder * 0.25 + timelines * 0.25 + verification * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI regulator inquiry readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Evidence index maps systems to obligations (30%)", evidenceindex + "%"],
        ["Named responder & legal review path (25%)", responder + "%"],
        ["Statutory & contractual timelines tracked (25%)", timelines + "%"],
        ["Answers verified against evidence before submission (20%)", verification + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: build an evidence index that maps each AI system to the obligations it answers, name a responder with a legal review path, track statutory and contractual timelines, and verify answers against evidence before submitting."
          : "Readiness is trending well — refresh the index as systems change, rehearse a live inquiry end to end, and keep the legal review path from becoming a bottleneck.",
    };
  }
  if (id === "incident-evidence") {
    const capture = v["capture"] ?? 0,
      hold = v["hold"] ?? 0,
      custody = v["custody"] ?? 0,
      replay = v["replay"] ?? 0,
      score = Math.round(capture * 0.3 + hold * 0.25 + custody * 0.25 + replay * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI incident evidence preservation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Prompt, context, model version & outputs captured (30%)", capture + "%"],
        ["Retention & legal hold applied before rotation (25%)", hold + "%"],
        ["Handling, access & chain of custody recorded (25%)", custody + "%"],
        ["Replayable trail for root-cause review (20%)", replay + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: capture the prompt, retrieved context, model version and outputs at the time, apply retention and legal hold before logs rotate or models change, record handling and access, and keep a replayable trail for root-cause review."
          : "Readiness is trending well — test preservation on a recent incident, re-check that holds survive model and provider changes, and keep the custody record with the evidence.",
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
