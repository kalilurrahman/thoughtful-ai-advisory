/*
 * VERITRAIL Maturity Self-Assessment — browser scoring engine (pure TypeScript, no DOM).
 *
 * Port of platform/app/website/static/js/assessment-engine.js, which mirrors the Python
 * reference engine platform/app/assessment-engine/veritrail_assessment/engine.py
 * (score_assessment / preliminary_result) field-for-field. Parity is enforced by
 * src/test/site-assessment-engine.test.ts against fixtures exported from the Python engine
 * (platform/scripts/export_assessment_parity_fixtures.py). All score arithmetic uses integers
 * and the template's round-half-up rule: floor((20*num + den) / (2*den)) / 10.
 */
import {
  STANDARD_DISCLAIMER,
  controlLibrary,
  controlUrl,
  getControl,
  maturityTemplate,
  type FrameworkKey,
} from "../content";

// ---------------------------------------------------------------- template types

export interface ScaleEntry {
  score: number;
  label: string;
  description: string;
}

export interface ScoreLevel {
  name: string;
  min: number;
  max: number;
  interpretation: string;
}

export interface ScoreBand {
  name: string;
  min: number;
  max: number;
}

export interface ProfileField {
  id: string;
  label: string;
  type: "select" | "boolean" | string;
  options?: string[];
  required?: boolean;
}

export interface TemplateDomain {
  id: string;
  name: string;
  weight: number;
  order: number;
}

export interface TemplateQuestion {
  id: string;
  domain: string;
  order: number;
  text: string;
  controls: string[];
  action: string;
}

export interface CriticalFlagDef {
  id: string;
  title: string;
  severity: string;
  when: { question: string; max_score: number; profile?: Record<string, unknown> };
  rationale: string;
  controls: string[];
}

export interface RuleCondition {
  always?: unknown;
  overall_below?: number;
  domain_below?: Record<string, number>;
  profile?: Record<string, unknown>;
  flag?: string;
}

export interface CtaLink {
  label: string;
  url: string;
  description?: string;
}

export interface AssessmentTemplate {
  template: {
    id: string;
    name: string;
    version: string;
    evidence_status: string;
    disclaimer: string;
    estimated_minutes?: number;
  };
  scale: ScaleEntry[];
  scoring: {
    levels: ScoreLevel[];
    strengths: { min_score: number; limit: number };
    gaps: { max_score: number; limit: number };
    action_plan: {
      horizons: Array<{ horizon: string; label: string; scores: number[] }>;
      limit_per_horizon: number;
    };
    recommended_controls: { limit: number };
    readiness: { bands: ScoreBand[] };
  };
  profile_fields: ProfileField[];
  domains: TemplateDomain[];
  questions: TemplateQuestion[];
  critical_flags: CriticalFlagDef[];
  readiness_groups: Array<{
    framework: string;
    groups: Array<{ id: string; name: string; questions: string[] }>;
  }>;
  module_rules: Array<{ module: string; reason: string; any: RuleCondition[] }>;
  lead_rules: Array<{ tag: string; label: string; any: RuleCondition[] }>;
  cta: { primary: CtaLink & { description: string }; secondary?: CtaLink };
}

export type ControlMappings = Partial<Record<FrameworkKey, Array<string | number>>>;

export interface BundleControl {
  title: string;
  pillar: string;
  priority: string;
  mappings: ControlMappings;
}

/** Equivalent of builder.py assessment_context()["bundle"]. */
export interface AssessmentBundle {
  template: AssessmentTemplate;
  controls: Record<string, BundleControl>;
  control_library_version: string;
  standard_disclaimer: string;
  control_url_base: string;
}

// ---------------------------------------------------------------- result types

export interface DomainScore {
  id: string;
  name: string;
  weight: number;
  score: number;
}

export interface DomainResult extends DomainScore {
  answers: Record<string, number>;
}

export interface PreliminaryResult {
  template_id: string;
  template_version: string;
  evidence_status: string;
  overall_score: number;
  maturity_level: string;
  level_interpretation: string;
  domains: DomainScore[];
}

export interface QuestionView {
  question_id: string;
  domain_id: string;
  domain: string;
  text: string;
  score: number;
  controls: string[];
  action?: string;
}

export interface FlagResult {
  id: string;
  title: string;
  severity: string;
  rationale: string;
  controls: string[];
  question_id: string;
  evidence_status: "User-asserted";
}

export interface PlanItem {
  question_id: string;
  domain: string;
  action: string;
  controls: string[];
  score: number;
}

export interface RecommendedControl {
  id: string;
  title: string;
  pillar: string;
  priority: string;
  mappings: ControlMappings;
}

export interface ReadinessGroupResult {
  id: string;
  name: string;
  value: number;
  band: string;
  questions: string[];
}

export interface ReadinessResult {
  framework: string;
  groups: ReadinessGroupResult[];
}

export interface AssessmentResult {
  template_id: string;
  template_version: string;
  evidence_status: string;
  overall_score: number;
  maturity_level: string;
  level_interpretation: string;
  domains: DomainResult[];
  strengths: QuestionView[];
  gaps: QuestionView[];
  critical_flags: FlagResult[];
  action_plan: Record<string, PlanItem[]>;
  action_plan_labels: Record<string, string>;
  recommended_controls: RecommendedControl[];
  readiness: ReadinessResult[];
  recommended_modules: Array<{ module: string; reason: string }>;
  /** Internal lead qualification — never shown to the respondent. */
  lead: { tags: string[]; labels: string[] };
  profile: Record<string, unknown>;
  disclaimer: string;
  standard_disclaimer: string;
  cta: AssessmentTemplate["cta"];
}

export type AnswersInput = Record<string, unknown>;
export type ProfileInput = Record<string, unknown>;

// ---------------------------------------------------------------- errors

export class AssessmentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssessmentInputError";
  }
}

// ---------------------------------------------------------------- arithmetic

function floorDiv(a: number, b: number): number {
  // integer floor division for integer a and positive integer b
  const r = a % b;
  let q = (a - r) / b;
  if (r !== 0 && r < 0 !== b < 0) q -= 1;
  return q;
}

export function roundHalfUp1dp(num: number, den: number): number {
  if (!(den > 0)) throw new Error("den must be positive");
  return floorDiv(20 * num + den, 2 * den) / 10;
}

function gcd(a: number, b: number): number {
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

// ---------------------------------------------------------------- python-like helpers

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function hasKey(o: object, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

function pyTruthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === 0 || v === "") return false;
  if (typeof v === "number" && Number.isNaN(v)) return true; // bool(float('nan')) is True
  if (Array.isArray(v)) return v.length > 0;
  if (isPlainObject(v)) return Object.keys(v).length > 0;
  return true;
}

/** Python == for JSON-like scalars (True == 1, 1 == 1.0); containers compared deeply. */
function pyEq(a: unknown, b: unknown): boolean {
  if (a === undefined) a = null;
  if (b === undefined) b = null;
  const na = typeof a === "boolean" ? (a ? 1 : 0) : a;
  const nb = typeof b === "boolean" ? (b ? 1 : 0) : b;
  if (typeof na === "number" && typeof nb === "number") return na === nb;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => pyEq(x, b[i]));
  }
  if (isPlainObject(a)) {
    if (!isPlainObject(b)) return false;
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => hasKey(b, k) && pyEq(a[k], b[k]));
  }
  return a === b;
}

/** Stable sort by a tuple key of numbers (Python sorted(key=lambda: (...))). */
function sortedBy<T>(arr: readonly T[], keyFn: (x: T) => number[]): T[] {
  return arr
    .map((x, i) => ({ x, k: keyFn(x), i }))
    .sort((p, q) => {
      for (let n = 0; n < p.k.length; n++) {
        const a = p.k[n] ?? 0;
        const b = q.k[n] ?? 0;
        if (a < b) return -1;
        if (a > b) return 1;
      }
      return p.i - q.i;
    })
    .map((p) => p.x);
}

function clone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

function req<T>(v: T | undefined, what: string): T {
  if (v === undefined) throw new Error(`assessment template is missing ${what}`);
  return v;
}

// ---------------------------------------------------------------- validation

const CANONICAL_INT = /^(0|-?[1-9][0-9]*)$/;
// Python str.isspace() characters (differs from JS \s: includes \x1c-\x1f and \x85, excludes U+FEFF)
const PY_WS =
  "\\t\\n\\x0b\\x0c\\r \\x1c-\\x1f\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
const PY_STRIP = new RegExp("^[" + PY_WS + "]+|[" + PY_WS + "]+$", "g");

export function validateAnswers(
  answers: unknown,
  template: AssessmentTemplate,
): Record<string, number> {
  if (!isPlainObject(answers)) {
    throw new AssessmentInputError("answers must be an object of question_id -> score");
  }
  const qids = template.questions.map((q) => q.id);
  const missing = qids.filter((q) => !hasKey(answers, q));
  if (missing.length) throw new AssessmentInputError("missing answers: " + missing.join(", "));
  const unknown = Object.keys(answers).filter((k) => !qids.includes(k));
  if (unknown.length) {
    throw new AssessmentInputError("unknown question ids: " + unknown.sort().join(", "));
  }
  const clean: Record<string, number> = {};
  for (const q of qids) {
    const v = answers[q];
    const bad = q + ": score must be an integer 1-5";
    let iv: number;
    if (typeof v === "number") {
      if (!Number.isFinite(v) || Math.floor(v) !== v) throw new AssessmentInputError(bad);
      iv = v;
    } else if (typeof v === "string") {
      const s = v.replace(PY_STRIP, "");
      if (!CANONICAL_INT.test(s)) throw new AssessmentInputError(bad);
      iv = parseInt(s, 10);
    } else {
      throw new AssessmentInputError(bad); // booleans, null, objects
    }
    if (iv < 1 || iv > 5) throw new AssessmentInputError(q + ": score must be between 1 and 5");
    clean[q] = iv;
  }
  return clean;
}

export function normalizeProfile(profile: unknown): Record<string, unknown> {
  const p: Record<string, unknown> = isPlainObject(profile) ? clone(profile) : {};
  for (const k of ["uses_agents", "eu_operations"]) {
    const v = p[k];
    p[k] =
      typeof v === "string"
        ? ["true", "yes", "1", "y"].includes(v.replace(PY_STRIP, "").toLowerCase())
        : pyTruthy(v);
  }
  return p;
}

function profileMatches(cond: Record<string, unknown>, profile: Record<string, unknown>): boolean {
  return Object.keys(cond).every((k) => pyEq(hasKey(profile, k) ? profile[k] : null, cond[k]));
}

// ---------------------------------------------------------------- scoring

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

function domainScores(clean: Record<string, number>, template: AssessmentTemplate) {
  const domains = template.domains.slice().sort(byOrder);
  const questions = template.questions.slice().sort(byOrder);
  const out: DomainResult[] = [];
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const d of domains) {
    const qs = questions.filter((q) => q.domain === d.id);
    let s = 0;
    const answers: Record<string, number> = {};
    for (const q of qs) {
      const v = req(clean[q.id], q.id);
      s += v;
      answers[q.id] = v;
    }
    sums[d.id] = s;
    counts[d.id] = qs.length;
    out.push({
      id: d.id,
      name: d.name,
      weight: d.weight,
      score: roundHalfUp1dp(s * 100, 5 * qs.length),
      answers,
    });
  }
  return { domains: out, sums, counts };
}

function overallScore(
  sums: Record<string, number>,
  counts: Record<string, number>,
  template: AssessmentTemplate,
): number {
  let L = 1;
  const dens: Record<string, number> = {};
  for (const d of template.domains) {
    const den = 5 * req(counts[d.id], d.id);
    dens[d.id] = den;
    L = lcm(L, den);
  }
  let num = 0;
  for (const d of template.domains) {
    num += req(sums[d.id], d.id) * d.weight * (L / req(dens[d.id], d.id));
  }
  return roundHalfUp1dp(num, L);
}

function levelFor(score: number, levels: ScoreLevel[]): ScoreLevel {
  for (const l of levels) if (l.min <= score && score <= l.max) return l;
  const last = req(levels[levels.length - 1], "levels");
  return score > last.min ? last : req(levels[0], "levels");
}

function bandFor(value: number, bands: ScoreBand[]): string {
  for (const b of bands) if (b.min <= value && value <= b.max) return b.name;
  const last = req(bands[bands.length - 1], "bands");
  return value > last.min ? last.name : req(bands[0], "bands").name;
}

function unpack(bundle: AssessmentBundle | null | undefined): AssessmentBundle {
  if (!bundle || !bundle.template) throw new Error("assessment bundle with template is required");
  return bundle;
}

export function preliminaryResult(
  answers: unknown,
  _profile: unknown,
  bundle: AssessmentBundle,
): PreliminaryResult {
  const template = unpack(bundle).template;
  const clean = validateAnswers(answers, template);
  const ds = domainScores(clean, template);
  const overall = overallScore(ds.sums, ds.counts, template);
  const lvl = levelFor(overall, template.scoring.levels);
  return {
    template_id: template.template.id,
    template_version: template.template.version,
    evidence_status: template.template.evidence_status,
    overall_score: overall,
    maturity_level: lvl.name,
    level_interpretation: lvl.interpretation,
    domains: ds.domains.map((d) => ({ id: d.id, name: d.name, weight: d.weight, score: d.score })),
  };
}

export function scoreAssessment(
  answers: unknown,
  profile: unknown,
  bundleIn: AssessmentBundle,
): AssessmentResult {
  const bundle = unpack(bundleIn);
  const template = bundle.template;
  const lib = bundle.controls;
  const clean = validateAnswers(answers, template);
  const prof = normalizeProfile(profile);
  const sc = template.scoring;
  const ds = domainScores(clean, template);
  const domainById = new Map(ds.domains.map((d) => [d.id, d]));
  const overall = overallScore(ds.sums, ds.counts, template);
  const lvl = levelFor(overall, sc.levels);
  const weight = new Map(template.domains.map((d) => [d.id, d.weight]));
  const dname = new Map(template.domains.map((d) => [d.id, d.name]));
  const questions = template.questions.slice().sort(byOrder);
  const score = (qid: string) => req(clean[qid], qid);
  const w = (domain: string) => req(weight.get(domain), domain);
  const name = (domain: string) => req(dname.get(domain), domain);

  const qview = (q: TemplateQuestion, withAction: boolean): QuestionView => {
    const v: QuestionView = {
      question_id: q.id,
      domain_id: q.domain,
      domain: name(q.domain),
      text: q.text,
      score: score(q.id),
      controls: q.controls.slice(),
    };
    if (withAction) v.action = q.action;
    return v;
  };

  const strengths = sortedBy(
    questions.filter((q) => score(q.id) >= sc.strengths.min_score),
    (q) => [-score(q.id), -w(q.domain), q.order],
  )
    .slice(0, sc.strengths.limit)
    .map((q) => qview(q, false));

  const gaps = sortedBy(
    questions.filter((q) => score(q.id) <= sc.gaps.max_score),
    (q) => [score(q.id), -w(q.domain), q.order],
  )
    .slice(0, sc.gaps.limit)
    .map((q) => qview(q, true));

  const flags: FlagResult[] = [];
  for (const f of template.critical_flags) {
    const when = f.when;
    if (score(when.question) > when.max_score) continue;
    if (when.profile !== undefined && !profileMatches(when.profile, prof)) continue;
    flags.push({
      id: f.id,
      title: f.title,
      severity: f.severity,
      rationale: f.rationale,
      controls: f.controls.slice(),
      question_id: when.question,
      evidence_status: "User-asserted",
    });
  }
  const flagIds = flags.map((f) => f.id);

  const plan: Record<string, PlanItem[]> = {};
  const planLabels: Record<string, string> = {};
  for (const h of sc.action_plan.horizons) {
    const items = sortedBy(
      questions.filter((q) => h.scores.includes(score(q.id))),
      (q) => [score(q.id), -w(q.domain), q.order],
    );
    plan[h.horizon] = items.slice(0, sc.action_plan.limit_per_horizon).map((q) => ({
      question_id: q.id,
      domain: name(q.domain),
      action: q.action,
      controls: q.controls.slice(),
      score: score(q.id),
    }));
    planLabels[h.horizon] = h.label;
  }

  const ctrlIds: string[] = [];
  for (const src of [...flags, ...gaps]) {
    for (const c of src.controls) if (!ctrlIds.includes(c)) ctrlIds.push(c);
  }
  const recControls: RecommendedControl[] = ctrlIds
    .slice(0, sc.recommended_controls.limit)
    .map((c) => {
      const ctl = lib[c];
      if (!ctl) throw new Error("control " + c + " missing from assessment bundle");
      return {
        id: c,
        title: ctl.title,
        pillar: ctl.pillar,
        priority: ctl.priority,
        mappings: clone(ctl.mappings),
      };
    });

  const readiness: ReadinessResult[] = template.readiness_groups.map((fw) => ({
    framework: fw.framework,
    groups: fw.groups.map((g) => {
      const s = g.questions.reduce((acc, q) => acc + score(q), 0);
      const val = roundHalfUp1dp(s * 100, 5 * g.questions.length);
      return {
        id: g.id,
        name: g.name,
        value: val,
        band: bandFor(val, sc.readiness.bands),
        questions: g.questions.slice(),
      };
    }),
  }));

  const condTrue = (cond: RuleCondition): boolean => {
    if (pyTruthy(cond.always)) return true;
    if (cond.overall_below !== undefined) return overall < cond.overall_below;
    if (cond.domain_below !== undefined) {
      return Object.entries(cond.domain_below).some(
        ([d, v]) => req(domainById.get(d), d).score < v,
      );
    }
    if (cond.profile !== undefined) return profileMatches(cond.profile, prof);
    if (cond.flag !== undefined) return flagIds.includes(cond.flag);
    return false;
  };

  const modules = template.module_rules
    .filter((r) => r.any.some(condTrue))
    .map((r) => ({ module: r.module, reason: r.reason }));
  const leadRules = template.lead_rules.filter((r) => r.any.some(condTrue));

  return {
    template_id: template.template.id,
    template_version: template.template.version,
    evidence_status: template.template.evidence_status,
    overall_score: overall,
    maturity_level: lvl.name,
    level_interpretation: lvl.interpretation,
    domains: ds.domains,
    strengths,
    gaps,
    critical_flags: flags,
    action_plan: plan,
    action_plan_labels: planLabels,
    recommended_controls: recControls,
    readiness,
    recommended_modules: modules,
    lead: { tags: leadRules.map((r) => r.tag), labels: leadRules.map((r) => r.label) },
    profile: prof,
    disclaimer: template.template.disclaimer,
    standard_disclaimer: bundle.standard_disclaimer,
    cta: clone(template.cta),
  };
}

// ---------------------------------------------------------------- bundle

let cachedBundle: AssessmentBundle | null = null;

/**
 * Build the scoring bundle the static site embedded in the page
 * (builder.py assessment_context()): template, every control the template cites,
 * the control library version and the standard disclaimer.
 */
export function buildAssessmentBundle(): AssessmentBundle {
  if (cachedBundle) return cachedBundle;
  const template = maturityTemplate as AssessmentTemplate;
  const referenced = [
    ...template.questions.flatMap((q) => q.controls),
    ...template.critical_flags.flatMap((f) => f.controls),
  ];
  const ids = [...new Set(referenced)].sort();
  const unknown = ids.filter((id) => !getControl(id));
  if (unknown.length) {
    throw new Error(`assessment template cites unknown control IDs: ${unknown.join(", ")}`);
  }
  const controls: Record<string, BundleControl> = {};
  for (const id of ids) {
    const c = req(getControl(id), id);
    controls[id] = {
      title: c.title,
      pillar: c.pillar,
      priority: c.priority,
      mappings: c.mappings ?? {},
    };
  }
  cachedBundle = {
    template,
    controls,
    control_library_version: controlLibrary.version,
    standard_disclaimer: STANDARD_DISCLAIMER,
    control_url_base: controlUrl(""),
  };
  return cachedBundle;
}
