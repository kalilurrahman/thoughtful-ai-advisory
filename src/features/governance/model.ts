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
  if (id === "data-subject-request") {
    const triage = v["triage"] ?? 0,
      discovery = v["discovery"] ?? 0,
      redaction = v["redaction"] ?? 0,
      evidence = v["evidence"] ?? 0,
      score = Math.round(triage * 0.3 + discovery * 0.25 + redaction * 0.25 + evidence * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI data subject request readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Requests triaged, identity verified, deadline tracked (30%)", triage + "%"],
        ["Search reaches prompts, logs, memory & summaries (25%)", discovery + "%"],
        ["Third-party data redacted before disclosure (25%)", redaction + "%"],
        ["Search & outcome recorded as evidence (20%)", evidence + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: triage requests with identity verification and a tracked deadline, search prompts, logs, agent memory and derived summaries rather than only the primary database, redact third-party data before disclosure, and record the search and outcome as evidence."
          : "Readiness is trending well — test a request end to end on a live system, extend discovery as new memory and log stores appear, and keep the evidence trail complete.",
    };
  }
  if (id === "ai-cost-allocation") {
    const metering = v["metering"] ?? 0,
      basis = v["basis"] ?? 0,
      visibility = v["visibility"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(metering * 0.3 + basis * 0.25 + visibility * 0.25 + review * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI usage cost allocation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Usage metered per team, system & feature (30%)", metering + "%"],
        ["Chargeback or showback basis agreed with finance (25%)", basis + "%"],
        ["Owners see their spend against a budget (25%)", visibility + "%"],
        ["Review catches runaway, idle & untracked spend (20%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: meter usage per team, system and feature rather than one shared bill, agree a chargeback or showback basis with finance, give owners their spend against a budget, and review for runaway, idle and untracked usage."
          : "Readiness is trending well — check that allocation survives new models and pricing changes, and that untracked tools surface in the same review.",
    };
  }
  if (id === "shadow-ai") {
    const discovery = v["discovery"] ?? 0,
      alternative = v["alternative"] ?? 0,
      egress = v["egress"] ?? 0,
      amnesty = v["amnesty"] ?? 0,
      score = Math.round(discovery * 0.3 + alternative * 0.25 + egress * 0.25 + amnesty * 0.2),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Shadow AI containment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Discovery uses network, spend & identity signals (30%)", discovery + "%"],
        ["Sanctioned route is easier than the workaround (25%)", alternative + "%"],
        ["Egress & data controls limit what tools can reach (25%)", egress + "%"],
        ["Amnesty route & recorded disposition per tool (20%)", amnesty + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: find unsanctioned tools through network, spend and identity signals rather than self-reporting, make the sanctioned route easier than the workaround, limit what tools can reach with egress and data controls, and give people an amnesty route with a recorded disposition per tool."
          : "Readiness is trending well — re-run discovery as new tools appear, check the sanctioned route still wins on convenience, and confirm every tool found has a recorded disposition.",
    };
  }
  if (id === "rag-grounding") {
    const sources = v["sources"] ?? 0,
      citations = v["citations"] ?? 0,
      conflict = v["conflict"] ?? 0,
      refusal = v["refusal"] ?? 0,
      drift = v["drift"] ?? 0,
      score = Math.round(
        sources * 0.3 + citations * 0.25 + conflict * 0.25 + refusal * 0.1 + drift * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Retrieval grounding integrity readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Sources have a named owner & refresh date (30%)", sources + "%"],
        ["Answers cite the passages they rely on (25%)", citations + "%"],
        ["Conflicts & stale sources resolved by rule (25%)", conflict + "%"],
        ["Says it does not know instead of guessing (10%)", refusal + "%"],
        ["Retrieved content monitored for drift & poisoning (10%)", drift + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: give every retrieved source an owner and a refresh date, cite the passages each answer relies on, resolve conflicting or stale sources by a stated rule, make 'I do not know' an acceptable answer, and monitor retrieved content for drift and poisoning."
          : "Readiness is trending well — sample answers against their cited sources, re-check the conflict rule as documents are superseded, and watch for retrieved content that changed without an owner noticing.",
    };
  }
  if (id === "user-recourse") {
    const route = v["route"] ?? 0,
      reviewer = v["reviewer"] ?? 0,
      timeline = v["timeline"] ?? 0,
      remedy = v["remedy"] ?? 0,
      patterns = v["patterns"] ?? 0,
      score = Math.round(
        route * 0.3 + reviewer * 0.25 + timeline * 0.2 + remedy * 0.15 + patterns * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI decision recourse & contestability readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Contest route findable & usable by affected people (30%)", route + "%"],
        ["Reviewer has authority & context to change the outcome (25%)", reviewer + "%"],
        ["Stated timeline the person is told about (20%)", timeline + "%"],
        ["Remedy reverses or corrects the decision (15%)", remedy + "%"],
        ["Appeal outcomes tracked & turned into fixes (10%)", patterns + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: publish a contest route the affected person can actually find and use, give the reviewer authority and context to change the outcome, tell the person the timeline, make remedy reverse or correct the decision, and track appeal outcomes so patterns become fixes."
          : "Readiness is trending well — test the route as an affected person would, confirm reviewers can and do overturn decisions, and check that appeal patterns reach the teams that own the model.",
    };
  }
  if (id === "red-team-program") {
    const scope = v["scope"] ?? 0,
      independence = v["independence"] ?? 0,
      triage = v["triage"] ?? 0,
      retest = v["retest"] ?? 0,
      harms = v["harms"] ?? 0,
      score = Math.round(
        scope * 0.25 + independence * 0.25 + triage * 0.25 + retest * 0.15 + harms * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI red-team programme readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Scope & rules of engagement agreed before testing (25%)", scope + "%"],
        ["Testers independent of the building team (25%)", independence + "%"],
        ["Findings triaged by severity with an owner (25%)", triage + "%"],
        ["Remediation verified by retest (15%)", retest + "%"],
        ["Discovered harms handled safely, not quietly closed (10%)", harms + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: agree scope and rules of engagement before testing, use testers independent of the building team, triage findings by severity with an owner, verify remediation by retest, and handle discovered harms safely instead of closing them quietly."
          : "Readiness is trending well — rotate testers, re-scope as the system grows, and confirm retested findings stay fixed in later releases.",
    };
  }
  if (id === "prompt-governance") {
    const versioning = v["versioning"] ?? 0,
      review = v["review"] ?? 0,
      regression = v["regression"] ?? 0,
      release = v["release"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      score = Math.round(
        versioning * 0.25 + review * 0.25 + regression * 0.25 + release * 0.15 + monitoring * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI prompt & instruction governance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Prompts versioned with a diffable history (25%)", versioning + "%"],
        ["Owned & reviewed before change (25%)", review + "%"],
        ["Tested against a regression set (25%)", regression + "%"],
        ["Released through a controlled path with rollback (15%)", release + "%"],
        ["Behaviour monitored after release (10%)", monitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: version prompts and instructions with a diffable history, give them an owner and review before change, test against a regression set that includes known failure modes, release through a controlled path with rollback, and monitor behaviour after release."
          : "Readiness is trending well — check that hotfixes still go through review, that the regression set grows with each incident, and that rollback is exercised rather than assumed.",
    };
  }
  if (id === "data-residency") {
    const pinning = v["pinning"] ?? 0,
      subprocessors = v["subprocessors"] ?? 0,
      transfer = v["transfer"] ?? 0,
      evidence = v["evidence"] ?? 0,
      change = v["change"] ?? 0,
      score = Math.round(
        pinning * 0.3 + subprocessors * 0.25 + transfer * 0.2 + evidence * 0.15 + change * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI data residency & sovereignty readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Inference & storage regions pinned and recorded per system (30%)", pinning + "%"],
        ["Subprocessor & support-access locations known (25%)", subprocessors + "%"],
        ["Transfer basis documented where data crosses borders (20%)", transfer + "%"],
        ["Provider evidence that region controls are enforced (15%)", evidence + "%"],
        ["Notice when regions or subprocessors change (10%)", change + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: pin and record inference and storage regions per system, establish where subprocessors and support staff can access data, document the transfer basis where data crosses borders, ask the provider for evidence that region controls are enforced, and track notices when regions or subprocessors change."
          : "Readiness is trending well — re-check region settings after each provider release, confirm support-access assumptions still hold, and test that a region change would reach you before your data moves.",
    };
  }
  if (id === "agent-evaluation") {
    const criteria = v["criteria"] ?? 0,
      traces = v["traces"] ?? 0,
      taxonomy = v["taxonomy"] ?? 0,
      sandbox = v["sandbox"] ?? 0,
      regression = v["regression"] ?? 0,
      score = Math.round(
        criteria * 0.3 + traces * 0.25 + taxonomy * 0.2 + sandbox * 0.15 + regression * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI agent evaluation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Success criteria defined per task type (30%)", criteria + "%"],
        ["Tool-use traces reviewed, not just final answers (25%)", traces + "%"],
        ["Failure taxonomy routes each miss to a fix (20%)", taxonomy + "%"],
        ["Sandboxed evaluation with representative tasks (15%)", sandbox + "%"],
        ["Regression when tools, prompts or models change (10%)", regression + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define success criteria per task type, review tool-use traces rather than only final answers, route each failure through a taxonomy to a fix, evaluate in a sandbox with representative tasks and tools, and re-run regression when tools, prompts or models change."
          : "Readiness is trending well — grow the task set from real failures, check that a lucky run cannot pass without the right steps, and keep the evaluation current as tools change.",
    };
  }
  if (id === "content-provenance") {
    const marking = v["marking"] ?? 0,
      survival = v["survival"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      detection = v["detection"] ?? 0,
      register = v["register"] ?? 0,
      score = Math.round(
        marking * 0.3 + survival * 0.25 + disclosure * 0.2 + detection * 0.15 + register * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI content provenance & labelling readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Outputs marked at generation with machine-readable provenance (30%)", marking + "%"],
        ["Marks survive copy, conversion & re-publish (25%)", survival + "%"],
        ["Visible disclosure where a mark cannot travel (20%)", disclosure + "%"],
        ["Unlabeled or stripped output detected & handled (15%)", detection + "%"],
        ["Register of channels & formats where marking is required (10%)", register + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: mark outputs at generation with machine-readable provenance, test that marks survive copy, conversion and re-publish, add visible disclosure wherever a mark cannot travel, detect and handle unlabeled or stripped output, and register the channels and formats where marking is required."
          : "Readiness is trending well — re-test survival after format and channel changes, check that detection catches stripped marks, and keep the register current as new distribution routes appear.",
    };
  }
  if (id === "test-environment-isolation") {
    const data = v["data"] ?? 0,
      credentials = v["credentials"] ?? 0,
      models = v["models"] ?? 0,
      egress = v["egress"] ?? 0,
      teardown = v["teardown"] ?? 0,
      score = Math.round(
        data * 0.25 + credentials * 0.2 + models * 0.2 + egress * 0.2 + teardown * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI test & sandbox environment isolation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Production personal data kept out or de-identified (25%)", data + "%"],
        ["Separate credentials, no production write access (20%)", credentials + "%"],
        ["Isolated model endpoints & keys for test traffic (20%)", models + "%"],
        ["Egress controls stop test data reaching public tools (20%)", egress + "%"],
        ["Environments expire & are cleared after testing (15%)", teardown + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: keep production personal data out of test environments or de-identify it before copying, use separate credentials with no production write access, isolate model endpoints and keys so test traffic cannot train or bill against live systems, control egress so test data cannot reach public tools, and expire and clear environments after testing."
          : "Readiness is trending well — check that copies age out, that keys are rotated when testers leave, and that a new sandbox cannot reach production by default.",
    };
  }
  if (id === "value-realisation") {
    const baseline = v["baseline"] ?? 0,
      outcome = v["outcome"] ?? 0,
      attribution = v["attribution"] ?? 0,
      adoption = v["adoption"] ?? 0,
      review = v["review"] ?? 0,
      score = Math.round(
        baseline * 0.25 + outcome * 0.25 + attribution * 0.2 + adoption * 0.15 + review * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI value realisation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Baseline captured before deployment (25%)", baseline + "%"],
        ["Outcomes measured, not activity or output volume (25%)", outcome + "%"],
        ["Attribution stated honestly, including other changes (20%)", attribution + "%"],
        ["Adoption & real usage measured, not licences bought (15%)", adoption + "%"],
        ["Scheduled review with authority to scale, fix or stop (15%)", review + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: capture a baseline before deployment, measure outcomes rather than activity or output volume, state attribution honestly including what else changed, measure real usage instead of licences bought, and schedule a review with the authority to scale, fix or stop."
          : "Readiness is trending well — keep the baseline when scope changes, re-test attribution as other initiatives land, and confirm the review can still stop a system that is not delivering.",
    };
  }
  if (id === "third-party-audit-rights") {
    const right = v["right"] ?? 0,
      scope = v["scope"] ?? 0,
      exercise = v["exercise"] ?? 0,
      reports = v["reports"] ?? 0,
      findings = v["findings"] ?? 0,
      score = Math.round(
        right * 0.25 + scope * 0.2 + exercise * 0.2 + reports * 0.2 + findings * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI third-party audit & assurance access readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Contractual right to audit or receive assurance evidence (25%)", right + "%"],
        ["Scope covers models, data, subprocessors & controls (20%)", scope + "%"],
        ["Right exercised or relied on in practice (20%)", exercise + "%"],
        ["Independent reports read with a gap analysis (20%)", reports + "%"],
        ["Findings tracked to closure with the provider (15%)", findings + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: secure a contractual right to audit or receive assurance evidence, extend the scope to models, data handling, subprocessors and controls, exercise or rely on the right in practice, read independent reports with a gap analysis rather than as a substitute, and track findings to closure with the provider."
          : "Readiness is trending well — test that the right still applies after a service change, re-read reports against your actual use, and confirm closed findings stay closed in the next cycle.",
    };
  }
  if (id === "consent-withdrawal") {
    const inventory = v["inventory"] ?? 0,
      propagation = v["propagation"] ?? 0,
      downstream = v["downstream"] ?? 0,
      evidence = v["evidence"] ?? 0,
      reuse = v["reuse"] ?? 0,
      score = Math.round(
        inventory * 0.3 + propagation * 0.25 + downstream * 0.2 + evidence * 0.15 + reuse * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI consent withdrawal propagation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Consent-derived data mapped, including derived artifacts (30%)", inventory + "%"],
        ["Withdrawal propagated & removed within a stated window (25%)", propagation + "%"],
        ["Downstream processors notified & confirming (20%)", downstream + "%"],
        ["Per-withdrawal evidence recorded & retrievable (15%)", evidence + "%"],
        ["Consent state checked before data is reused (10%)", reuse + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map where consent-derived data lives including embeddings, caches, fine-tunes, agent memory and evaluation sets, propagate and remove within a stated window, notify downstream processors and obtain confirmation, record per-withdrawal evidence, and check consent state before data is reused."
          : "Readiness is trending well — re-check derived artifacts after each pipeline change, test that a withdrawal reaches processors, and confirm a revoked record cannot re-enter a future dataset.",
    };
  }
  if (id === "complaint-feedback") {
    const intake = v["intake"] ?? 0,
      triage = v["triage"] ?? 0,
      response = v["response"] ?? 0,
      rootcause = v["rootcause"] ?? 0,
      closedloop = v["closedloop"] ?? 0,
      score = Math.round(
        intake * 0.25 + triage * 0.25 + response * 0.2 + rootcause * 0.2 + closedloop * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI complaint & feedback loop readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Complaint intake findable & usable by affected people (25%)", intake + "%"],
        ["Triage separates one-off errors from systemic patterns (25%)", triage + "%"],
        ["Stated response time met & measured (20%)", response + "%"],
        ["Root cause traced to model, data, prompt or process (20%)", rootcause + "%"],
        ["Fix fed back into the system & outcome shared (10%)", closedloop + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: make complaint intake findable and usable by the people affected, triage to separate one-off errors from systemic patterns, meet and measure a stated response time, trace root cause to the model, data, prompt or process rather than closing at the ticket, and feed fixes back into the system while telling the complainant the outcome."
          : "Readiness is trending well — cluster complaints by theme rather than volume, check that fixes survive the next model or prompt change, and confirm complainants are told what changed.",
    };
  }
  if (id === "risk-transfer-insurance") {
    const coverage = v["coverage"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      indemnity = v["indemnity"] ?? 0,
      limits = v["limits"] ?? 0,
      claims = v["claims"] ?? 0,
      score = Math.round(
        coverage * 0.25 + disclosure * 0.2 + indemnity * 0.2 + limits * 0.2 + claims * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI risk transfer & insurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI risks mapped to coverage, including exclusions (25%)", coverage + "%"],
        ["AI use & material incidents disclosed to insurers (20%)", disclosure + "%"],
        ["Indemnities & liability caps matched to exposure (20%)", indemnity + "%"],
        ["Limits & deductibles tested against loss scenarios (20%)", limits + "%"],
        ["Claim evidence assembled before an incident (15%)", claims + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: map AI risks against actual coverage including exclusions, disclose AI use and material incidents to insurers, match contract indemnities and liability caps to the exposure you carry, test limits and deductibles against realistic loss scenarios, and assemble claim evidence before an incident rather than after."
          : "Readiness is trending well — re-check exclusions when a model or use changes, confirm disclosure obligations at each renewal, and test that a claim could be evidenced within the notice period.",
    };
  }
  if (id === "assurance-independence") {
    const coverage = v["coverage"] ?? 0,
      independence = v["independence"] ?? 0,
      reporting = v["reporting"] ?? 0,
      conflicts = v["conflicts"] ?? 0,
      followup = v["followup"] ?? 0,
      score = Math.round(
        coverage * 0.25 + independence * 0.25 + reporting * 0.2 + conflicts * 0.15 + followup * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI assurance independence & audit coverage readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI risks in the assurance plan with a risk-based rationale (25%)", coverage + "%"],
        ["Assurance performed by people outside the build team (25%)", independence + "%"],
        ["Findings reported upward without owner editing (20%)", reporting + "%"],
        ["Conflicts declared, incl. reliance on supplier evidence (15%)", conflicts + "%"],
        ["Findings re-tested independently until closure (15%)", followup + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: include AI risks in the audit or assurance plan with a risk-based rationale, have assurance performed by people who do not own or build the system, report findings to a level with authority to act without owner editing, declare and manage conflicts including reliance on supplier evidence, and re-test findings independently until closure."
          : "Readiness is trending well — keep the assurance plan risk-based as systems change, protect the reporting line when findings are uncomfortable, and check that reliance on supplier evidence is still justified.",
    };
  }
  if (id === "regulatory-horizon") {
    const sources = v["sources"] ?? 0,
      triage = v["triage"] ?? 0,
      impact = v["impact"] ?? 0,
      action = v["action"] ?? 0,
      record = v["record"] ?? 0,
      score = Math.round(
        sources * 0.2 + triage * 0.25 + impact * 0.2 + action * 0.2 + record * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI regulatory horizon scanning readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Defined sources & scanning cadence (20%)", sources + "%"],
        ["Changes triaged against the system inventory (25%)", triage + "%"],
        ["Affected systems, owners & deadlines assigned (20%)", impact + "%"],
        ["Controls, policies & contracts updated before deadline (20%)", action + "%"],
        ["Decisions recorded, including reasoned no-action (15%)", record + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define sources and a scanning cadence, triage each change against the system inventory, assign affected systems, owners and deadlines, update controls, policies and contracts before the deadline, and record decisions including a reasoned no-action."
          : "Readiness is trending well — check the scan still covers the jurisdictions you operate in, confirm deadlines are met rather than tracked, and revisit earlier no-action calls when a system changes.",
    };
  }
  if (id === "output-sampling") {
    const plan = v["plan"] ?? 0,
      reviewers = v["reviewers"] ?? 0,
      rubric = v["rubric"] ?? 0,
      coverage = v["coverage"] ?? 0,
      feedback = v["feedback"] ?? 0,
      score = Math.round(
        plan * 0.25 + reviewers * 0.2 + rubric * 0.2 + coverage * 0.2 + feedback * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI production output sampling readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Sampling plan with rate tied to risk & volume (25%)", plan + "%"],
        ["Reviewers competent & separate from the producing queue (20%)", reviewers + "%"],
        ["Scoring rubric with defined failure categories (20%)", rubric + "%"],
        ["Coverage across channels, languages & edge cases (20%)", coverage + "%"],
        ["Findings routed to a fix & trended over time (15%)", feedback + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: set a sampling plan whose rate follows risk and volume, use reviewers who are competent and separate from the producing queue, score against a rubric with defined failure categories, cover channels, languages and edge cases, and route findings to a fix while trending them over time."
          : "Readiness is trending well — re-weight the rate as volume grows, rotate reviewers to avoid drift, and check that a falling defect trend is not just a rubric that stopped catching cases.",
    };
  }
  if (id === "claims-substantiation") {
    const register = v["register"] ?? 0,
      evidence = v["evidence"] ?? 0,
      approval = v["approval"] ?? 0,
      wording = v["wording"] ?? 0,
      correction = v["correction"] ?? 0,
      score = Math.round(
        register * 0.2 + evidence * 0.25 + approval * 0.2 + wording * 0.2 + correction * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI public claims & marketing substantiation readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Public AI claims registered with owner & channel (20%)", register + "%"],
        ["Each claim backed by current evidence & stated limits (25%)", evidence + "%"],
        ["Reviewed & approved before publication, incl. vendor claims (20%)", approval + "%"],
        ["Wording avoids superlatives & vague compliance assertions (20%)", wording + "%"],
        ["Route to correct or withdraw a challenged claim (15%)", correction + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: register every public AI claim with an owner and channel, back each claim with current evidence including test results and stated limits, review and approve claims before publication including vendor-supplied claims, remove unqualified superlatives and vague compliance assertions, and define a route to correct or withdraw a claim when evidence changes or someone challenges it."
          : "Readiness is trending well — re-check claims when the model, prompts or benchmarks change, keep vendor-supplied claims on the register with their evidence, and make sure a withdrawn claim actually disappears from live channels and sales material.",
    };
  }
  if (id === "worker-monitoring") {
    const purpose = v["purpose"] ?? 0,
      transparency = v["transparency"] ?? 0,
      minimisation = v["minimisation"] ?? 0,
      humanreview = v["humanreview"] ?? 0,
      recourse = v["recourse"] ?? 0,
      score = Math.round(
        purpose * 0.2 + transparency * 0.2 + minimisation * 0.2 + humanreview * 0.25 + recourse * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI worker monitoring & algorithmic management readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Each monitoring use defined, with necessity & proportionality recorded (20%)", purpose + "%"],
        ["Workers & representatives told what is monitored and why (20%)", transparency + "%"],
        ["Data minimised, no covert capture, retention bounded (20%)", minimisation + "%"],
        ["Human reviews decisions on work, pay or standing (25%)", humanreview + "%"],
        ["Worker can see data, challenge an assessment & appeal (15%)", recourse + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define each monitoring use with a lawful basis and a recorded necessity and proportionality test, tell workers and their representatives what is monitored and why, minimise data with no covert capture and bounded retention, have a human review any decision affecting someone's work, pay or standing, and give workers a route to see their data, challenge an assessment and appeal."
          : "Readiness is trending well — re-test proportionality when a new signal or score is added, confirm the human reviewer can actually overrule the model, and check that workers know the appeal route exists.",
    };
  }
  if (id === "research-ethics") {
    const review = v["review"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      consent = v["consent"] ?? 0,
      safeguards = v["safeguards"] ?? 0,
      reporting = v["reporting"] ?? 0,
      score = Math.round(
        review * 0.2 + disclosure * 0.2 + consent * 0.2 + safeguards * 0.25 + reporting * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI research ethics & human-participant testing readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Proportionate ethics review before a study starts (20%)", review + "%"],
        ["Participants told what the system does & how data is used (20%)", disclosure + "%"],
        ["Consent specific, recorded & revocable (20%)", consent + "%"],
        ["Safeguards & stopping rules for harmful or distressing output (25%)", safeguards + "%"],
        ["Findings reported honestly, including negative results (15%)", reporting + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: run a proportionate ethics review before a study starts, tell participants what the system does and how their data and outputs will be used, record specific and revocable consent, put safeguards and stopping rules in place for harmful or distressing output, and report findings honestly including negative results."
          : "Readiness is trending well — review the study protocol whenever output risk changes, check that withdrawing consent actually removes the data, and keep negative results in the record rather than only the launch metrics.",
    };
  }
  if (id === "speak-up-channel") {
    const channels = v["channels"] ?? 0,
      protection = v["protection"] ?? 0,
      triage = v["triage"] ?? 0,
      feedback = v["feedback"] ?? 0,
      learning = v["learning"] ?? 0,
      score = Math.round(
        channels * 0.2 + protection * 0.2 + triage * 0.2 + feedback * 0.2 + learning * 0.2,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI speak-up & concern reporting readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Multiple routes to raise a concern, incl. outside the line (20%)", channels + "%"],
        ["Non-retaliation stated and visible in practice (20%)", protection + "%"],
        ["Concerns triaged with an owner and a timeframe (20%)", triage + "%"],
        ["Reporter told what happened, within stated limits (20%)", feedback + "%"],
        ["Trends reviewed & repeat concerns reach governance (20%)", learning + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: offer more than one route to raise a concern including one outside the line, state and visibly uphold non-retaliation, triage AI-specific concerns with an owner and a timeframe, tell the reporter what happened within stated limits, and review trends so repeat concerns reach governance instead of being closed one at a time."
          : "Readiness is trending well — test the channel with a concern that implicates a senior person, check that reporters who used it would use it again, and review repeat themes rather than only individual closures.",
    };
  }
  if (id === "hiring-screening") {
    const purpose = v["purpose"] ?? 0,
      biastesting = v["biastesting"] ?? 0,
      humanreview = v["humanreview"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      records = v["records"] ?? 0,
      score = Math.round(
        purpose * 0.2 + biastesting * 0.25 + humanreview * 0.2 + disclosure * 0.2 + records * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI hiring & candidate screening readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Screening use defined per role; alternatives considered (20%)", purpose + "%"],
        ["Adverse impact measured by group across every stage (25%)", biastesting + "%"],
        ["Human reviews before rejection & can override (20%)", humanreview + "%"],
        ["Candidates told AI is used & offered an accessible alternative (20%)", disclosure + "%"],
        ["Screening records retained to explain & challenge decisions (15%)", records + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define each screening use for the role and consider less invasive alternatives, measure adverse impact by group across every stage rather than relying on a vendor claim, have a human review before any rejection with reasoning recorded and the ability to override, tell candidates AI is used and offer an accessible alternative, and retain screening records so a decision can be explained and challenged later."
          : "Readiness is trending well — re-test adverse impact when the model or criteria change, check that reviewers actually reject model rankings, and confirm candidates can reach the alternative route without having to ask twice.",
    };
  }
  if (id === "annotation-workforce") {
    const guidelines = v["guidelines"] ?? 0,
      pay = v["pay"] ?? 0,
      wellbeing = v["wellbeing"] ?? 0,
      quality = v["quality"] ?? 0,
      supplier = v["supplier"] ?? 0,
      score = Math.round(
        guidelines * 0.2 + pay * 0.2 + wellbeing * 0.25 + quality * 0.2 + supplier * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI data annotation & labelling workforce readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Tasks issued with written guidelines, examples & a quality bar (20%)", guidelines + "%"],
        ["Pay reflects actual effort, including rework & waiting (20%)", pay + "%"],
        ["Harmful content limited, with warnings, rotation & support (25%)", wellbeing + "%"],
        ["Quality sampled, disagreements reviewed, feedback reaches owners (20%)", quality + "%"],
        ["Supplier contracts carry these terms & are checked (15%)", supplier + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: issue tasks with written guidelines, examples and a quality bar, pay for the real effort including rework and waiting, limit harmful content with warnings, rotation, counselling and a penalty-free opt-out, sample quality and route annotator disagreement back to model owners, and put these terms into supplier contracts and check them."
          : "Readiness is trending well — re-check wellbeing controls when task mix changes to harder content, ask annotators whether the guidelines match the edge cases they actually see, and verify supplier terms by sampling their work rather than reading the contract.",
    };
  }
  if (id === "ai-handover") {
    const ownership = v["ownership"] ?? 0,
      documented = v["documented"] ?? 0,
      access = v["access"] ?? 0,
      rehearsed = v["rehearsed"] ?? 0,
      departure = v["departure"] ?? 0,
      score = Math.round(
        ownership * 0.2 + documented * 0.25 + access * 0.2 + rehearsed * 0.2 + departure * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI handover & key-person dependency readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Every AI asset has a named owner & a second (20%)", ownership + "%"],
        ["Documentation explains design, limits & open risks (25%)", documented + "%"],
        ["Access, runbooks & vendor contacts held by the team (20%)", access + "%"],
        ["Handover rehearsed by the deputy, gaps fixed (20%)", rehearsed + "%"],
        ["Departure checklist confirms handover before access removal (15%)", departure + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: name an owner and a second for every model, prompt set, evaluation suite and vendor relationship, document how each works, why it was built that way, its known limits and open risks, move access, runbooks and vendor contacts from one inbox to the team, rehearse a handover with the deputy and fix what the rehearsal exposes, and add AI ownership to the departure checklist before access is removed."
          : "Readiness is trending well — rehearse handover for the asset everyone assumes is covered, check that the deputy can actually run an evaluation and answer a vendor notice unaided, and confirm documentation is updated when the model or prompts change rather than at departure.",
    };
  }
  if (id === "multilingual-assurance") {
    const coverage = v["coverage"] ?? 0,
      evaluation = v["evaluation"] ?? 0,
      guardrails = v["guardrails"] ?? 0,
      localpolicy = v["localpolicy"] ?? 0,
      reviewers = v["reviewers"] ?? 0,
      score = Math.round(
        coverage * 0.2 + evaluation * 0.25 + guardrails * 0.2 + localpolicy * 0.2 + reviewers * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Multilingual & localisation assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Languages in use known; each marked tested or unsupported (20%)", coverage + "%"],
        ["Quality & safety evaluated per language, not inferred (25%)", evaluation + "%"],
        ["Guardrails & refusals tested in each language and script (20%)", guardrails + "%"],
        ["Local law, culture & accessibility reviewed per market (20%)", localpolicy + "%"],
        ["In-language reviewers available; translation quality monitored (15%)", reviewers + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: list the languages actually in use with their volumes and mark each tested or unsupported, evaluate quality and safety per language instead of inferring from English results, test guardrails, filters and refusals in each supported language and script, review local law, cultural expectations and accessibility per market, and make in-language reviewers available while monitoring translation quality over time."
          : "Readiness is trending well — re-test the lowest-volume language before it grows, check that refusals survive mixed-script and code-switched inputs, and confirm local reviewers see the same escalations as the English queue.",
    };
  }
  if (id === "coding-assistants") {
    const policy = v["policy"] ?? 0,
      review = v["review"] ?? 0,
      licence = v["licence"] ?? 0,
      secrets = v["secrets"] ?? 0,
      accountability = v["accountability"] ?? 0,
      score = Math.round(
        policy * 0.25 + review * 0.25 + licence * 0.2 + secrets * 0.15 + accountability * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI coding assistant governance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Approved tools & repositories stated; prohibited inputs clear (25%)", policy + "%"],
        [
          "AI-generated code passes the same review, tests & security checks (25%)",
          review + "%",
        ],
        ["Licence & provenance of suggested code checked before merge (20%)", licence + "%"],
        [
          "Prompts blocked from carrying secrets, personal data & restricted code (15%)",
          secrets + "%",
        ],
        [
          "Authors remain accountable; assistant use recorded where it matters (15%)",
          accountability + "%",
        ],
      ],
      action:
        score < 60
          ? "Prioritize gaps: name the approved assistants and repositories with an explicit list of what must never be pasted, send all AI-generated code through the same review, tests and security checks as human code, check licence and provenance of suggestions before merge, block prompts carrying secrets, personal data or restricted source, and keep the author accountable with assistant use recorded where it affects assurance."
          : "Readiness is trending well — sample merged code for suggestions that skipped review, check that licence scanning covers generated snippets, and confirm the prohibited-input list still matches what the assistant can actually see.",
    };
  }
  if (id === "ma-ai-diligence") {
    const inventory = v["inventory"] ?? 0,
      contracts = v["contracts"] ?? 0,
      liability = v["liability"] ?? 0,
      data = v["data"] ?? 0,
      integration = v["integration"] ?? 0,
      score = Math.round(
        inventory * 0.25 + contracts * 0.2 + liability * 0.2 + data * 0.2 + integration * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI due diligence for mergers, acquisitions & divestments readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI assets, vendors & data identified from real operations (25%)", inventory + "%"],
        [
          "Inherited contracts, licences & change-of-control rights reviewed (20%)",
          contracts + "%",
        ],
        ["Past incidents, complaints & regulator contact checked (20%)", liability + "%"],
        ["Data rights transfer confirmed; consents & residency respected (20%)", data + "%"],
        ["Integration or separation plan names owners & day-one needs (15%)", integration + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: identify AI assets, models, vendors and data from how the business actually operates, review inherited contracts, licences, change-of-control and termination rights, check past incidents, complaints, regulator contact and open disputes, confirm rights to training and customer data transfer with consents and residency respected, and write an integration or separation plan naming owners, timelines and what must keep running on day one."
          : "Readiness is trending well — verify the inventory against a live walkthrough rather than the data room, test whether the vendor will actually honour change-of-control terms, and check that day-one operations do not depend on a contract that ends at completion.",
    };
  }
  if (id === "children-age-assurance") {
    const ageassurance = v["ageassurance"] ?? 0,
      design = v["design"] ?? 0,
      consent = v["consent"] ?? 0,
      childrisk = v["childrisk"] ?? 0,
      escalation = v["escalation"] ?? 0,
      score = Math.round(
        ageassurance * 0.25 + design * 0.25 + consent * 0.2 + childrisk * 0.2 + escalation * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI services for children & age assurance readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        [
          "Age assurance proportionate; no unnecessary identity collection (25%)",
          ageassurance + "%",
        ],
        ["Age-appropriate defaults, explanations & content limits (25%)", design + "%"],
        ["Parental consent where required, recorded & revocable (20%)", consent + "%"],
        ["Child-specific risks assessed & mitigated (20%)", childrisk + "%"],
        [
          "Child-safety escalation staffed & path to authorities clear (10%)",
          escalation + "%",
        ],
      ],
      action:
        score < 60
          ? "Prioritize gaps: use age assurance proportionate to the risk instead of collecting identity documents by default, set age-appropriate defaults with plain explanations and content limits, obtain and record parental consent where required and make it revocable, assess and mitigate child-specific risks such as manipulation, self-harm, stranger contact and commercial pressure, and staff a child-safety escalation route with trained responders and a clear path to the authorities."
          : "Readiness is trending well — test the age check with a determined child rather than an adult tester, review whether defaults still hold for younger users after product changes, and confirm escalations reach a trained responder out of hours.",
    };
  }
  if (id === "worker-consultation") {
    const mapping = v["mapping"] ?? 0,
      timing = v["timing"] ?? 0,
      content = v["content"] ?? 0,
      response = v["response"] ?? 0,
      ongoing = v["ongoing"] ?? 0,
      score = Math.round(
        mapping * 0.25 + timing * 0.25 + content * 0.2 + response * 0.2 + ongoing * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Worker consultation on AI readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Affected roles & worker representatives identified early (25%)", mapping + "%"],
        ["Consultation before the decision, with time to respond (25%)", timing + "%"],
        ["Purpose, data, monitoring & job effects explained plainly (20%)", content + "%"],
        ["Concerns answered; changes made or reasons recorded (20%)", response + "%"],
        ["Consultation continues as the system & its use change (10%)", ongoing + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: identify affected roles and worker representatives before deployment, consult before the decision with enough information and time to respond, explain the purpose, data used, monitoring, performance measures and expected job changes plainly, answer concerns with changes made or reasons recorded, and keep consulting as the system or its use changes."
          : "Readiness is trending well — check that representatives hear about changes before staff do, test whether the explanation matches what the system actually monitors, and confirm concerns raised late still reach the people who can act on them.",
    };
  }
  if (id === "summarisation-records") {
    const scope = v["scope"] ?? 0,
      confirmation = v["confirmation"] ?? 0,
      correction = v["correction"] ?? 0,
      transparency = v["transparency"] ?? 0,
      retention = v["retention"] ?? 0,
      score = Math.round(
        scope * 0.2 + confirmation * 0.25 + correction * 0.2 + transparency * 0.2 + retention * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI summarisation & record accuracy readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["What may & must never be summarised is defined (20%)", scope + "%"],
        ["A human confirms the summary before it becomes the record (25%)", confirmation + "%"],
        ["Errors corrected, with corrections reaching downstream records (20%)", correction + "%"],
        ["People told AI summarises their conversation & can object (20%)", transparency + "%"],
        [
          "Summaries follow retention & access rules; raw material minimised (15%)",
          retention + "%",
        ],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define what may and must never be summarised, require a human to confirm a summary before it becomes the record of a decision or interaction, make corrections possible and carry them into downstream records, tell people when AI summarises their conversation or document and let them object, and apply the same retention and access rules to summaries while minimising raw transcripts."
          : "Readiness is trending well — sample summaries against the source for dropped caveats, check that a correction reaches every downstream copy, and confirm retention deletes the transcript as well as the summary.",
    };
  }
  if (id === "regulated-advice-boundaries") {
    const scope = v["scope"] ?? 0,
      review = v["review"] ?? 0,
      facts = v["facts"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      escalation = v["escalation"] ?? 0,
      record = v["record"] ?? 0,
      score = Math.round(
        scope * 0.25 +
          review * 0.25 +
          facts * 0.2 +
          disclosure * 0.15 +
          escalation * 0.1 +
          record * 0.05,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in regulated advice boundaries",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Permitted & prohibited advice defined against firm permissions (25%)", scope + "%"],
        ["Qualified human reviews advice before it reaches the client (25%)", review + "%"],
        ["Facts & suitability information the advice depends on are gathered (20%)", facts + "%"],
        ["Limits & disclaimers match what the tool actually does (15%)", disclosure + "%"],
        ["Out-of-scope questions routed to a qualified professional (10%)", escalation + "%"],
        ["Record kept of what was advised, to whom & by whom (5%)", record + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define the advice the tool may and may not give against the permissions your firm holds, require a suitably qualified human to review advice before it reaches the client, gather the facts and suitability information the advice depends on, make limits and disclaimers match what the tool actually does, route out-of-scope questions to a qualified professional, and keep a record of what was advised and by whom."
          : "Readiness is trending well — test the boundary with questions just inside and just outside scope, check that reviewers actually change advice rather than rubber-stamp it, and confirm the record captures the basis of the advice if a client later challenges it.",
    };
  }
  if (id === "public-sector-fairness") {
    const basis = v["basis"] ?? 0,
      human = v["human"] ?? 0,
      reasons = v["reasons"] ?? 0,
      appeal = v["appeal"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      reconstruct = v["reconstruct"] ?? 0,
      score = Math.round(
        basis * 0.2 +
          human * 0.2 +
          reasons * 0.2 +
          appeal * 0.2 +
          monitoring * 0.1 +
          reconstruct * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Public-sector automated decision fairness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Legal basis & published policy for the automated element (20%)", basis + "%"],
        ["Human with authority to change the outcome reviews before deciding (20%)", human + "%"],
        ["Person told plainly what was decided & why (20%)", reasons + "%"],
        ["Notice & an effective appeal or review route (20%)", appeal + "%"],
        ["Outcomes monitored for disparate impact across groups (10%)", monitoring + "%"],
        ["Rules, data & model version recorded for reconstruction (10%)", reconstruct + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: make the legal basis and published policy for the automated element clear, ensure a human with authority to change the outcome reviews before a decision is made, tell the person plainly what was decided and why, provide notice and an effective appeal or review route, monitor outcomes for disparate impact across groups, and record the rules, data and model version used so decisions can be reconstructed."
          : "Readiness is trending well — test the appeal route as a member of the public would, compare outcomes across groups on the same facts, and confirm a decision can still be reconstructed after a model or rule change.",
    };
  }
  if (id === "algorithmic-pricing-competition") {
    const inputs = v["inputs"] ?? 0,
      approval = v["approval"] ?? 0,
      signalling = v["signalling"] ?? 0,
      monitoring = v["monitoring"] ?? 0,
      legal = v["legal"] ?? 0,
      audit = v["audit"] ?? 0,
      score = Math.round(
        inputs * 0.2 +
          approval * 0.2 +
          signalling * 0.15 +
          monitoring * 0.2 +
          legal * 0.15 +
          audit * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "Algorithmic pricing & competition readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Pricing logic & inputs documented; no competitor data used (20%)", inputs + "%"],
        ["Material pricing changes have human review & approval (20%)", approval + "%"],
        ["Market signalling risk through public price moves assessed (15%)", signalling + "%"],
        ["Monitored for parallel pricing & collusion indicators (20%)", monitoring + "%"],
        ["Legal review & escalation route for suspicious patterns (15%)", legal + "%"],
        ["Audit trail of pricing decisions & model versions kept (10%)", audit + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: document the pricing logic and inputs and keep competitor data out of price setting, require human review and approval for material pricing changes, assess market signalling risk through public price moves and announcements, monitor for parallel pricing and other collusion indicators, give legal a review and escalation route for suspicious patterns, and keep an audit trail of pricing decisions and model versions."
          : "Readiness is trending well — test whether the model can react to a competitor signal without human sign-off, check that pricing changes are not announced in ways that coordinate the market, and confirm the audit trail explains a price after the model has moved on.",
    };
  }
  if (id === "ai-export-controls") {
    const classification = v["classification"] ?? 0,
      screening = v["screening"] ?? 0,
      enduse = v["enduse"] ?? 0,
      access = v["access"] ?? 0,
      awareness = v["awareness"] ?? 0,
      escalation = v["escalation"] ?? 0,
      score = Math.round(
        classification * 0.2 +
          screening * 0.2 +
          enduse * 0.2 +
          access * 0.15 +
          awareness * 0.1 +
          escalation * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI export control, sanctions & dual-use readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Models, weights & capabilities classified against export control lists (20%)", classification + "%"],
        ["Customers & users screened against sanctions & denied-party lists (20%)", screening + "%"],
        ["End-use & end-user restrictions written into terms and enforced (20%)", enduse + "%"],
        ["Restricted weights & APIs access-controlled, not openly distributed (15%)", access + "%"],
        ["Staff & partners recognise red flags such as screening avoidance (10%)", awareness + "%"],
        ["Denied or suspicious requests escalated and recorded (15%)", escalation + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: classify models, weights and capabilities against export control and dual-use lists, screen customers and users against sanctions and denied-party lists before access, write end-use and end-user restrictions into terms and enforce them, control access to restricted weights and APIs rather than distributing them openly, help staff and partners recognise red flags such as requests to avoid screening, and escalate and record denied or suspicious requests."
          : "Readiness is trending well — test screening with a near-match name and a reseller in a higher-risk jurisdiction, check whether weights can leave through a partner or a download link, and confirm refusals are recorded well enough to show a regulator what was declined and why.",
    };
  }
  if (id === "vulnerable-customer-ai") {
    const signals = v["signals"] ?? 0,
      adaptation = v["adaptation"] ?? 0,
      adverseAction = v["adverse-action"] ?? 0,
      override = v["override"] ?? 0,
      referral = v["referral"] ?? 0,
      outcomes = v["outcomes"] ?? 0,
      score = Math.round(
        signals * 0.2 +
          adaptation * 0.2 +
          adverseAction * 0.2 +
          override * 0.15 +
          referral * 0.1 +
          outcomes * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI & vulnerable customer readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Vulnerability signals recognised without over-collecting data (20%)", signals + "%"],
        ["Interaction adapts: extra time, plain language, easy human route (20%)", adaptation + "%"],
        ["No automated adverse action on vulnerability without review (20%)", adverseAction + "%"],
        ["Staff trained and empowered to override the automation (15%)", override + "%"],
        ["Referral to specialist or third-sector support is built in (10%)", referral + "%"],
        ["Outcomes for vulnerable groups recorded and monitored (15%)", outcomes + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: recognise vulnerability signals without collecting more data than needed, adapt the interaction with extra time, plain language and an easy route to a person, stop automated adverse action on vulnerability indicators without human review, train and empower staff to override the automation, build in referral to specialist or third-sector support, and record and monitor outcomes for vulnerable groups."
          : "Readiness is trending well — test the journey as someone in distress would experience it, check that an override is honoured downstream as well as on screen, and compare outcomes for customers who disclosed a vulnerability with those who did not.",
    };
  }
  if (id === "education-ai-integrity") {
    const permitted = v["permitted"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      design = v["design"] ?? 0,
      dueProcess = v["due-process"] ?? 0,
      training = v["training"] ?? 0,
      appeal = v["appeal"] ?? 0,
      score = Math.round(
        permitted * 0.2 +
          disclosure * 0.2 +
          design * 0.2 +
          dueProcess * 0.15 +
          training * 0.15 +
          appeal * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in education: integrity & assessment readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Permitted & prohibited AI use defined per assessment (20%)", permitted + "%"],
        ["Students disclose AI contribution where it is allowed (20%)", disclosure + "%"],
        ["Assessment design resists outsourcing rather than relying on detection (20%)", design + "%"],
        ["Detection treated as evidence, with due process before a penalty (15%)", dueProcess + "%"],
        ["Staff & students trained and supported to use AI well (15%)", training + "%"],
        ["Decisions recorded with an appeal route (10%)", appeal + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define permitted and prohibited AI use for each assessment and share it in advance, require students to disclose AI contribution where it is allowed, design assessment that resists outsourcing rather than relying on detection, treat detection results as evidence with due process before any penalty, train and support staff and students, and record decisions with an appeal route."
          : "Readiness is trending well — test an assessment brief against a capable model, check that a detection flag cannot become a penalty without a conversation, and confirm students know where the line is before they submit rather than after.",
    };
  }
  if (id === "insurance-underwriting-claims") {
    const actuarial = v["actuarial"] ?? 0,
      proxies = v["proxies"] ?? 0,
      claimsReview = v["claims-review"] ?? 0,
      explanation = v["explanation"] ?? 0,
      dataSources = v["data-sources"] ?? 0,
      outcomes = v["outcomes"] ?? 0,
      score = Math.round(
        actuarial * 0.2 +
          proxies * 0.2 +
          claimsReview * 0.2 +
          explanation * 0.15 +
          dataSources * 0.15 +
          outcomes * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in insurance underwriting & claims readiness",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Risk factors actuarially justified & documented (20%)", actuarial + "%"],
        ["Proxies for protected characteristics tested and removed (20%)", proxies + "%"],
        ["Adverse automated claims decisions get human review (20%)", claimsReview + "%"],
        ["Declines explained with a route to review (15%)", explanation + "%"],
        ["External data sources verified and permitted for the purpose (15%)", dataSources + "%"],
        ["Outcomes monitored by group; complaints analysed for patterns (10%)", outcomes + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: justify and document risk factors actuarially rather than relying on what predicts, test for and remove proxies for protected characteristics, require human review of adverse automated claims decisions, explain declines with a route to review, verify that external data sources are permitted for the purpose, and monitor outcomes by group while analysing complaints for patterns."
          : "Readiness is trending well — test whether the model can reach a decline without a person seeing it, compare outcomes for similar risks across groups, and check that a customer who challenges a decision can get a specific reason rather than a restatement of the policy.",
    };
  }
  if (id === "incident-notification-individuals") {
    const criteria = v["criteria"] ?? 0,
      identification = v["identification"] ?? 0,
      clarity = v["clarity"] ?? 0,
      remedy = v["remedy"] ?? 0,
      consistency = v["consistency"] ?? 0,
      learning = v["learning"] ?? 0,
      score = Math.round(
        criteria * 0.2 +
          identification * 0.2 +
          clarity * 0.2 +
          remedy * 0.2 +
          consistency * 0.1 +
          learning * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI incident notification to affected individuals",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Criteria & thresholds for notifying affected individuals defined (20%)", criteria + "%"],
        ["Affected individuals can be identified and reached with records (20%)", identification + "%"],
        ["Notifications timely, clear, explain impact & what to do (20%)", clarity + "%"],
        ["Remedy, support & recourse route offered and staffed (20%)", remedy + "%"],
        ["Required regulator/client/partner notices consistent (10%)", consistency + "%"],
        ["Notifications & outcomes logged and fed back into fixes (10%)", learning + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: define criteria and thresholds for when individuals must be notified, ensure affected people can be identified and reached with the needed records, send notifications that are timely and clear about the impact and what to do, offer a staffed remedy, support and recourse route, keep required notices to regulators, clients and partners consistent, and log notifications and outcomes so fixes follow."
          : "Readiness is trending well — run a notification drill from detection to message, check that you can identify everyone affected rather than a sample, and confirm people can actually reach the remedy and support you promised.",
    };
  }
  if (id === "elections-political-ads-integrity") {
    const labeling = v["labeling"] ?? 0,
      targeting = v["targeting"] ?? 0,
      review = v["review"] ?? 0,
      accountability = v["accountability"] ?? 0,
      response = v["response"] ?? 0,
      records = v["records"] ?? 0,
      score = Math.round(
        labeling * 0.2 +
          targeting * 0.2 +
          review * 0.2 +
          accountability * 0.15 +
          response * 0.15 +
          records * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in elections & political advertising integrity",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI-generated or altered political content labeled with provenance (20%)", labeling + "%"],
        ["Audience targeting follows legal limits and avoids prohibited manipulation (20%)", targeting + "%"],
        ["Claims and ads reviewed for accuracy and misleading content (20%)", review + "%"],
        ["Sponsors, funding and accountable owners clear and recorded (15%)", accountability + "%"],
        ["Rapid process to correct, pause or remove harmful or misleading AI content (15%)", response + "%"],
        ["Records support compliance with election and advertising rules (10%)", records + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: clearly label AI-generated or materially altered political content with provenance where feasible, ensure targeting follows legal limits and avoids prohibited manipulation, review claims and ads for accuracy before publication, record sponsors, funding and accountable owners, establish a rapid process to correct, pause or remove harmful or misleading AI content, and keep records that support compliance with applicable election and advertising rules."
          : "Readiness is trending well — test labels and provenance on realistic synthetic content, review targeting criteria for unlawful or manipulative segmentation, and run a rapid-response drill to confirm misleading AI content can be paused, corrected and documented quickly.",
    };
  }
  if (id === "journalism-newsroom-integrity") {
    const verification = v["verification"] ?? 0,
      editorial = v["editorial"] ?? 0,
      syntheticMedia = v["synthetic-media"] ?? 0,
      corrections = v["corrections"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      safeguards = v["safeguards"] ?? 0,
      score = Math.round(
        verification * 0.2 +
          editorial * 0.2 +
          syntheticMedia * 0.2 +
          corrections * 0.15 +
          disclosure * 0.15 +
          safeguards * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in journalism & newsroom verification",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI-assisted output verified against primary sources (20%)", verification + "%"],
        ["Named editor reviews and signs off AI-influenced output (20%)", editorial + "%"],
        ["Synthetic or AI-generated media labelled and provenance checked (20%)", syntheticMedia + "%"],
        ["Corrections and retractions published with a clear trail (15%)", corrections + "%"],
        ["Audiences told when AI played a material role (15%)", disclosure + "%"],
        ["Safeguards prevent unverified claims, fabricated quotes or harmful synthetic media (10%)", safeguards + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: verify AI-assisted output against primary sources before publication, require a named editor to review and sign off AI-influenced output, label synthetic or AI-generated media and check provenance, publish corrections and retractions with a clear trail, tell audiences when AI played a material role, and add safeguards that prevent unverified claims, fabricated quotes and harmful synthetic media from being published."
          : "Readiness is trending well — test a realistic AI-assisted draft for fabricated quotes and confident wrong claims, check whether a labelled synthetic image can be traced to its source, and confirm a correction reaches every version of the story that was published.",
    };
  }
  if (id === "clinical-documentation-integrity") {
    const clinicianReview = v["clinician-review"] ?? 0,
      consent = v["consent"] ?? 0,
      dataProtection = v["data-protection"] ?? 0,
      accuracy = v["accuracy"] ?? 0,
      auditTrail = v["audit-trail"] ?? 0,
      patientAccess = v["patient-access"] ?? 0,
      score = Math.round(
        clinicianReview * 0.2 +
          consent * 0.15 +
          dataProtection * 0.2 +
          accuracy * 0.2 +
          auditTrail * 0.15 +
          patientAccess * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI clinical documentation & ambient scribing integrity",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["AI-generated notes reviewed and signed by the responsible clinician (20%)", clinicianReview + "%"],
        ["Patients told when encounters are recorded; consent captured (15%)", consent + "%"],
        ["Health data minimised; vendor terms cover permitted use and retention (20%)", dataProtection + "%"],
        ["Drafts checked for omitted findings, invented content and billing drift (20%)", accuracy + "%"],
        ["Audit trail shows what was AI-drafted, edited and signed and by whom (15%)", auditTrail + "%"],
        ["Patients can see and correct what the AI-influenced record says (10%)", patientAccess + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: require the responsible clinician to review and sign every AI-generated note before it becomes the record, tell patients when encounters are recorded or transcribed and capture consent where needed, minimise health data and confirm vendor terms cover permitted use and retention, check drafts for omitted findings, invented content and billing drift rather than accepting fluency, keep an audit trail of what was drafted, edited and signed and by whom, and give patients a way to see and correct what was written about them."
          : "Readiness is trending well — compare a sample of signed notes against the encounter recording for omissions and invented findings, check that a clinician can tell which sentences the model wrote, and confirm a patient request to correct the record actually reaches the note.",
    };
  }
  if (id === "legal-ediscovery-evidence") {
    const preservation = v["preservation"] ?? 0,
      validation = v["validation"] ?? 0,
      explainability = v["explainability"] ?? 0,
      privilege = v["privilege"] ?? 0,
      reproducibility = v["reproducibility"] ?? 0,
      defensibility = v["defensibility"] ?? 0,
      score = Math.round(
        preservation * 0.2 +
          validation * 0.2 +
          explainability * 0.15 +
          privilege * 0.2 +
          reproducibility * 0.15 +
          defensibility * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in legal e-discovery & evidence preservation",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Legal holds issued and monitored before relevant data is lost (20%)", preservation + "%"],
        ["AI-assisted collection and review validated and sampled (20%)", validation + "%"],
        ["Reviewers can explain and defend how the model classified documents (15%)", explainability + "%"],
        ["Privilege and confidentiality calls made by qualified people with a log (20%)", privilege + "%"],
        ["Produced sets and defects can be reconstructed and disclosed (15%)", reproducibility + "%"],
        ["Process defensible to opposing parties, regulators and courts (10%)", defensibility + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: issue and monitor legal holds before potentially relevant data is lost, validate and sample AI-assisted collection and review rather than trusting the model, make sure reviewers can explain and defend how documents were classified, keep privilege and confidentiality decisions with qualified people and a clear log, preserve what is needed to reconstruct produced sets and disclose defects, and document the process so it holds up to opposing parties, regulators and courts."
          : "Readiness is trending well — test whether a hold actually reaches messaging and personal devices, sample the review for documents the model missed, check that a privilege call can be traced to a named lawyer, and confirm you can reproduce a produced set if it is challenged.",
    };
  }
  if (id === "critical-infrastructure-operations") {
    const operatorAuthority = v["operator-authority"] ?? 0,
      interlocks = v["interlocks"] ?? 0,
      degradedConditions = v["degraded-conditions"] ?? 0,
      operationalData = v["operational-data"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      fallback = v["fallback"] ?? 0,
      score = Math.round(
        operatorAuthority * 0.2 +
          interlocks * 0.2 +
          degradedConditions * 0.15 +
          operationalData * 0.15 +
          disclosure * 0.15 +
          fallback * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in energy grid & critical infrastructure operations",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Operators keep authority over consequential actions with escalation (20%)", operatorAuthority + "%"],
        ["Model outputs cannot actuate physical systems without limits and interlocks (20%)", interlocks + "%"],
        ["Tested and monitored under degraded data, extreme weather and novel events (15%)", degradedConditions + "%"],
        ["Third-party access to operational data governed and minimised (15%)", operationalData + "%"],
        ["Regulators, customers and communities told when AI influences service decisions (15%)", disclosure + "%"],
        ["Manual fallback and drills for AI-caused or AI-worsened incidents (15%)", fallback + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: keep operators in authority over consequential actions with documented escalation, make sure model outputs cannot actuate physical systems without limits and interlocks, test and monitor performance under degraded data, extreme weather and novel events, govern and minimise third-party access to operational data, tell regulators, customers and affected communities when AI influences service decisions, and build a manual fallback with drills for AI-caused or AI-worsened incidents."
          : "Readiness is trending well — run a degraded-data and extreme-weather exercise against the live model, try to trace one automated action back to a named operator decision, and confirm you can restore service manually if the model is unavailable mid-event.",
    };
  }
  if (id === "tenant-screening-housing") {
    const lawfulCriteria = v["lawful-criteria"] ?? 0,
      disclosure = v["disclosure"] ?? 0,
      humanReview = v["human-review"] ?? 0,
      reasonAndChallenge = v["reason-and-challenge"] ?? 0,
      dataAccuracy = v["data-accuracy"] ?? 0,
      outcomeMonitoring = v["outcome-monitoring"] ?? 0,
      score = Math.round(
        lawfulCriteria * 0.2 +
          disclosure * 0.15 +
          humanReview * 0.2 +
          reasonAndChallenge * 0.2 +
          dataAccuracy * 0.15 +
          outcomeMonitoring * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in tenant screening & housing access",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Criteria lawful and housing-related; proxies for protected traits excluded (20%)", lawfulCriteria + "%"],
        ["Applicants told a scoring model is used and what data drives it (15%)", disclosure + "%"],
        ["Adverse decisions reviewed by a person before rejection (20%)", humanReview + "%"],
        ["Specific reason given with a route to challenge and correct errors (20%)", reasonAndChallenge + "%"],
        ["Screening data accurate with sources verified and stale records fixed (15%)", dataAccuracy + "%"],
        ["Outcomes monitored by group with audit evidence retained (10%)", outcomeMonitoring + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: tie criteria to lawful, housing-related factors and exclude proxies for race, disability, family status and source of income, tell applicants a scoring model is used and what data drives it, require a person to review adverse decisions before rejection, give a specific reason with a route to challenge and correct errors, verify screening data sources and fix stale records, and monitor outcomes by group while retaining audit evidence for fair-housing scrutiny."
          : "Readiness is trending well — test whether source-of-income and disability-related records can influence the score, ask an applicant to obtain their own decision reason, and check that a corrected record actually updates the next application.",
    };
  }
  if (id === "agri-food-system-ai") {
    const localValidation = v["local-validation"] ?? 0,
      dataOwnership = v["data-ownership"] ?? 0,
      equity = v["equity"] ?? 0,
      foodSafety = v["food-safety"] ?? 0,
      tradeOffs = v["trade-offs"] ?? 0,
      fallback = v["fallback"] ?? 0,
      score = Math.round(
        localValidation * 0.2 +
          dataOwnership * 0.2 +
          equity * 0.15 +
          foodSafety * 0.2 +
          tradeOffs * 0.15 +
          fallback * 0.1,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in agriculture & food-system decisions",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Recommendations validated for local conditions before driving action (20%)", localValidation + "%"],
        ["Farmers own and can access the data their operation generates (20%)", dataOwnership + "%"],
        ["Advice does not disadvantage smallholders or thin-data regions (15%)", equity + "%"],
        ["Food safety and traceability keep human sign-off and audit trails (20%)", foodSafety + "%"],
        ["Environmental and animal-welfare trade-offs explicit, not optimised away (15%)", tradeOffs + "%"],
        ["Growers have a workable fallback when the model fails (10%)", fallback + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: validate recommendations for local soil, climate and practice before they drive action, make sure farmers own and can access the data their operation generates, check that advice does not systematically disadvantage smallholders or thin-data regions, keep human sign-off and audit trails on food safety and traceability decisions, make environmental and animal-welfare trade-offs explicit rather than optimised away, and give growers a workable fallback when the model fails."
          : "Readiness is trending well — test the advice on a smallholder-scale operation in a thin-data region, trace one food safety decision back to a named sign-off, and confirm a grower can export their own data and keep farming if the model is switched off.",
    };
  }
  if (id === "construction-built-environment") {
    const professionalCheck = v["professional-check"] ?? 0,
      lifeSafety = v["life-safety"] ?? 0,
      siteSafety = v["site-safety"] ?? 0,
      records = v["records"] ?? 0,
      supplyData = v["supply-data"] ?? 0,
      postHandover = v["post-handover"] ?? 0,
      score = Math.round(
        professionalCheck * 0.2 +
          lifeSafety * 0.2 +
          siteSafety * 0.15 +
          records * 0.15 +
          supplyData * 0.15 +
          postHandover * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in construction & the built environment",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Generated designs, calculations and estimates checked by a qualified professional (20%)", professionalCheck + "%"],
        ["Model outputs never substitute for structural, fire or life-safety sign-off (20%)", lifeSafety + "%"],
        ["Safety predictions and risk flags reach the people who can act on them (15%)", siteSafety + "%"],
        ["Design and as-built records show which elements were AI-assisted (15%)", records + "%"],
        ["Contractor and supplier estimating data accurate and permissioned (15%)", supplyData + "%"],
        ["Errors found after handover have a clear route to correction and disclosure (15%)", postHandover + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: have a qualified professional check generated designs, calculations and cost estimates and carry the liability, never let model output substitute for structural, fire or life-safety sign-off, route safety predictions and risk flags to the people who can act on them, record which design and as-built elements were AI-assisted, verify and permission contractor and supplier data used for estimating, and define a clear route to correct and disclose errors found after handover."
          : "Readiness is trending well — take one AI-generated design element through professional checking end to end, test whether a safety flag actually reaches a site supervisor, and confirm a post-handover defect can be traced back to the model that contributed to it.",
    };
  }
  if (id === "emergency-response-triage") {
    const humanControl = v["human-control"] ?? 0,
      validation = v["validation"] ?? 0,
      biasTesting = v["bias-testing"] ?? 0,
      transparency = v["transparency"] ?? 0,
      failSafe = v["fail-safe"] ?? 0,
      reviewManual = v["review-manual"] ?? 0,
      score = Math.round(
        humanControl * 0.2 +
          validation * 0.2 +
          biasTesting * 0.15 +
          transparency * 0.15 +
          failSafe * 0.15 +
          reviewManual * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in emergency response & public-safety triage",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Trained human keeps final control over dispatch and prioritisation (20%)", humanControl + "%"],
        ["Triage logic validated against outcomes rather than vendor claims (20%)", validation + "%"],
        ["Checked for bias by location, language, disability and demographic group (15%)", biasTesting + "%"],
        ["Callers and staff told when AI is involved and can reach a person (15%)", transparency + "%"],
        ["Degraded or ambiguous inputs fail safe towards sending help (15%)", failSafe + "%"],
        ["Decisions and overrides logged; rehearsed manual process when the model fails (15%)", reviewManual + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: keep a trained human in final control of dispatch and prioritisation, validate triage logic against real outcomes rather than vendor claims, test for bias by location, language, disability and demographic group, tell callers and frontline staff when AI is involved and give them a route to a person, make degraded or ambiguous inputs fail safe towards sending help, log decisions and overrides, and rehearse a manual process for model failure."
          : "Readiness is trending well — run a distorted-audio and non-native-language call through triage, check that a caller can reach a person without fighting the system, and confirm the manual dispatch process was drilled in the last quarter.",
    };
  }
  if (id === "official-statistics-census") {
    const methods = v["methods"] ?? 0,
      sourceData = v["source-data"] ?? 0,
      representativeness = v["representativeness"] ?? 0,
      confidentiality = v["confidentiality"] ?? 0,
      versioning = v["versioning"] ?? 0,
      transparency = v["transparency"] ?? 0,
      score = Math.round(
        methods * 0.2 +
          sourceData * 0.2 +
          representativeness * 0.2 +
          confidentiality * 0.15 +
          versioning * 0.1 +
          transparency * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in official statistics & census data production",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Methods documented, reproducible and quality-checked before release (20%)", methods + "%"],
        ["Source data governed for coverage, linkage and consent (20%)", sourceData + "%"],
        ["Outputs tested for bias, representativeness and small-area error (20%)", representativeness + "%"],
        ["Statistical confidentiality and disclosure control enforced (15%)", confidentiality + "%"],
        ["Revisions and model changes versioned with an audit trail (10%)", versioning + "%"],
        ["Public told when AI influenced published figures and limitations stated (15%)", transparency + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: document and quality-check methods before release, govern source data for coverage, linkage and consent, test outputs for bias, representativeness and small-area error before publication, enforce statistical confidentiality and disclosure control on model outputs, version revisions and model changes with an audit trail, and tell the public when AI materially influenced published figures with limitations stated plainly."
          : "Readiness is trending well — compare AI-assisted estimates against known benchmarks for small areas and hard-to-count groups, check that a derived table cannot be reverse-engineered to individuals, and confirm a revision note clearly explains the model change that drove it.",
    };
  }
  if (id === "telecom-network-operations") {
    const oversight = v["oversight"] ?? 0,
      fairness = v["fairness"] ?? 0,
      changeControl = v["change-control"] ?? 0,
      notification = v["notification"] ?? 0,
      resilience = v["resilience"] ?? 0,
      fallback = v["fallback"] ?? 0,
      score = Math.round(
        oversight * 0.2 +
          fairness * 0.15 +
          changeControl * 0.15 +
          notification * 0.2 +
          resilience * 0.15 +
          fallback * 0.15,
      ),
      band =
        score >= 80 ? "Strong" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Early";
    return {
      headline: "AI in telecommunications network operations & service continuity",
      value: score + "% · " + band,
      raw: score,
      rows: [
        ["Automated actions affecting service have oversight, limits and rollback (20%)", oversight + "%"],
        ["Traffic management and prioritisation tested for fairness and non-discrimination (15%)", fairness + "%"],
        ["Automated changes controlled and logged so incidents can be traced (15%)", changeControl + "%"],
        ["Customers and regulators notified of material AI-influenced outages or impacts (20%)", notification + "%"],
        ["Performance monitored under congestion, failures and novel conditions (15%)", resilience + "%"],
        ["Manual operations can sustain essential service if the model fails (15%)", fallback + "%"],
      ],
      action:
        score < 60
          ? "Prioritize gaps: keep operator oversight, limits and rollback on automated actions that affect service or emergency access, test traffic management and prioritisation for fairness and non-discrimination, control and log automated changes so incidents can be traced, notify customers and regulators of material AI-influenced outages or impacts as required, monitor performance under congestion, failures and novel conditions, and ensure manual operations can sustain essential service if the model fails."
          : "Readiness is trending well — trace a recent automated network change from trigger to rollback, test traffic prioritisation for unintended discrimination under congestion, and confirm manual failover can sustain essential and emergency service during a model outage.",
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
