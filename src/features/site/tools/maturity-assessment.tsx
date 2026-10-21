/*
 * AEGIS Maturity Self-Assessment — interactive tool (route /tools/maturity-assessment).
 *
 * Port of platform/app/website/static/js/assessment-ui.js and
 * templates/partials/tool_assessment.html.
 *
 * Flow: profile -> 8 domain steps -> instant preliminary result -> business-email gate ->
 * submitLead (score summary only) -> detailed report rendered in the browser with Markdown
 * download and print-to-PDF. If the lead cannot be stored the report is still shown, with a
 * notice that nothing was stored or emailed. Progress (profile, answers, step — never contact
 * details) is kept in sessionStorage only, and only touched from effects/handlers so the
 * component renders on the server without browser globals.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { controlUrl, isFreeMailDomain, siteConfig } from "../content";
import { submitLead } from "../leads.functions";
import { EvidenceBadge, SiteLink } from "../ui";
import {
  buildAssessmentBundle,
  preliminaryResult,
  scoreAssessment,
  type AssessmentResult,
  type DomainScore,
  type ProfileField,
  type TemplateQuestion,
} from "../engines/assessment-engine";
import {
  INDICATIVE,
  NO_FLAGS,
  NO_GAPS,
  NO_HORIZON_ACTIONS,
  NO_STRENGTHS,
  PLAN_HORIZONS,
  READINESS_NOTE,
  fixed1,
  mappingRefs,
  markdownFilename,
  toMarkdown,
} from "../engines/assessment-report";

export const STORE_KEY = "aegis.assessment.v1";

/** Display labels for profile select options (builder.py PROFILE_OPTION_LABELS). */
const PROFILE_OPTION_LABELS: Record<string, Record<string, string>> = {
  industry: {
    healthcare_pharma: "Healthcare & pharma",
    bfsi: "Banking, financial services & insurance",
    gcc_it_services: "Global capability center / IT services",
    saas_product: "SaaS / product company",
    public_sector: "Public sector",
    other: "Other",
  },
  org_size: {
    "<250": "Fewer than 250",
    "250-1000": "250–1,000",
    "1000-5000": "1,000–5,000",
    "5000+": "More than 5,000",
  },
  ai_systems: {
    "0-9": "0–9",
    "10-24": "10–24",
    "25-99": "25–99",
    "100+": "100 or more",
    unknown: "Not sure",
  },
};

const EMAIL_RE = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$/;

type Profile = Record<string, string | boolean>;
type Answers = Record<string, number>;
interface FieldError {
  id: string;
  message: string;
}
type Phase = "steps" | "preliminary" | "report";
type StatusKind = "" | "error" | "success";

interface GateFields {
  name: string;
  email: string;
  company: string;
  role: string;
  website: string;
  consent: boolean;
}

const EMPTY_GATE: GateFields = {
  name: "",
  email: "",
  company: "",
  role: "",
  website: "",
  consent: false,
};

interface ReportState {
  result: AssessmentResult;
  company: string;
  stored: boolean;
  message: string;
}

const bundle = buildAssessmentBundle();
const template = bundle.template;
const domains = template.domains.slice().sort((a, b) => a.order - b.order);
const questions = template.questions.slice().sort((a, b) => a.order - b.order);
const STEPS: Array<{ title: string; questions: TemplateQuestion[] }> = [
  { title: "Your organization", questions: [] },
  ...domains.map((d) => ({ title: d.name, questions: questions.filter((q) => q.domain === d.id) })),
];
const TOTAL = STEPS.length;
const QIDS = new Set(questions.map((q) => q.id));

// ---------------------------------------------------------------- session storage

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Accept only well-formed stored progress: known fields, known questions, scores 1-5. */
function sanitizeStored(v: unknown): {
  step: number;
  profile: Profile;
  answers: Answers;
  started: boolean;
} | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const step = Math.min(Math.max(parseInt(String(o["step"]), 10) || 0, 0), TOTAL - 1);
  const profile: Profile = {};
  const rawProfile = o["profile"];
  if (rawProfile && typeof rawProfile === "object") {
    for (const f of template.profile_fields) {
      const pv = (rawProfile as Record<string, unknown>)[f.id];
      if (f.type === "select" && typeof pv === "string" && (f.options ?? []).includes(pv)) {
        profile[f.id] = pv;
      } else if (f.type !== "select" && typeof pv === "boolean") {
        profile[f.id] = pv;
      }
    }
  }
  const answers: Answers = {};
  const rawAnswers = o["answers"];
  if (rawAnswers && typeof rawAnswers === "object") {
    for (const [k, av] of Object.entries(rawAnswers as Record<string, unknown>)) {
      if (QIDS.has(k) && typeof av === "number" && Number.isInteger(av) && av >= 1 && av <= 5) {
        answers[k] = av;
      }
    }
  }
  return { step, profile, answers, started: o["started"] === true };
}

// ---------------------------------------------------------------- small views

function ErrorSummary({
  id,
  title,
  errors,
  headingLevel = 3,
}: {
  id: string;
  title: string;
  errors: FieldError[];
  headingLevel?: 3 | 4;
}) {
  if (!errors.length) return null;
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <div className="error-summary" id={id} role="alert" tabIndex={-1}>
      <Heading className="error-summary-title">{title}</Heading>
      <ul>
        {errors.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => {
                ev.preventDefault();
                const t = document.getElementById(e.id);
                if (!t) return;
                const focusable = t.tagName === "FIELDSET" ? t.querySelector("input") : t;
                (focusable ?? t).focus();
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldErrorText({ id, error }: { id: string; error: string | undefined }) {
  if (!error) return null;
  return (
    <p className="field-error" id={`${id}-error`}>
      {error}
    </p>
  );
}

export function DomainBars({
  domains: items,
  idPrefix,
}: {
  domains: DomainScore[];
  idPrefix: string;
}) {
  return (
    <ul className="domain-bars">
      {items.map((d) => {
        const lid = `${idPrefix}-${d.id}`;
        return (
          <li className="domain-bar" key={d.id}>
            <span id={lid}>{d.name}</span>
            <span className="domain-bar-score">{fixed1(d.score)}</span>
            <progress max={100} value={d.score} aria-labelledby={lid} />
          </li>
        );
      })}
    </ul>
  );
}

function ControlRefs({ ids }: { ids: string[] }) {
  return (
    <span className="cite">
      AEGIS controls:{" "}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ", "}
          <SiteLink href={controlUrl(id)}>{id}</SiteLink>
        </span>
      ))}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="report-section" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      {children}
    </section>
  );
}

/** The detailed report, rendered from the scored result (text only; no HTML injection). */
export function AssessmentReportView({
  result,
  company,
}: {
  result: AssessmentResult;
  company: string;
}) {
  const org = company || "Your organization";
  const labels = result.action_plan_labels;
  const cta = result.cta.primary;
  return (
    <div id="report-body">
      <h2 id="report-title" tabIndex={-1}>
        AI Governance Maturity Report — {org}
      </h2>
      <p className="evidence-note">
        <EvidenceBadge status={result.evidence_status} />
        {` All findings are based on self-reported answers. No evidence has been reviewed. Template ${result.template_id} v${result.template_version}.`}
      </p>
      <aside className="disclaimer" aria-label="Assessment disclaimer">
        <p>{result.disclaimer}</p>
      </aside>

      <Section id="rpt-overall" title="Overall maturity">
        <div className="score-summary">
          <p className="score-big">
            {fixed1(result.overall_score)}
            <span className="score-max"> / 100</span>
          </p>
          <p className="score-level">
            Maturity level: <strong>{result.maturity_level}</strong>
          </p>
          <p>{result.level_interpretation}</p>
        </div>
      </Section>

      <Section id="rpt-domains" title="Domain scores">
        <DomainBars domains={result.domains} idPrefix="rpt-d" />
      </Section>

      <Section id="rpt-flags" title="Critical risk flags">
        {!result.critical_flags.length && <p>{NO_FLAGS}</p>}
        {result.critical_flags.map((f) => (
          <div className="flag" key={f.id}>
            <h4>
              <EvidenceBadge status={f.severity} /> {f.title}
            </h4>
            <p>{f.rationale}</p>
            <p>
              <ControlRefs ids={f.controls} />
              <span className="cite">{` · Trigger: ${f.question_id} · Evidence status: User-asserted`}</span>
            </p>
          </div>
        ))}
      </Section>

      <Section id="rpt-gaps" title="Top gaps">
        {result.gaps.length ? (
          <ol>
            {result.gaps.map((g) => (
              <li key={g.question_id}>
                <strong>{g.domain}: </strong>
                {g.text} <span className="cite">{`(${g.question_id}, answer ${g.score}/5)`}</span>
                <br />
                {`Recommended action: ${g.action ?? ""} `}
                <br />
                <ControlRefs ids={g.controls} />
              </li>
            ))}
          </ol>
        ) : (
          <p>{NO_GAPS}</p>
        )}
      </Section>

      <Section id="rpt-strengths" title="Top strengths">
        {result.strengths.length ? (
          <ul>
            {result.strengths.map((s) => (
              <li key={s.question_id}>
                <strong>{s.domain}: </strong>
                {s.text} <span className="cite">{`(${s.question_id}, answer ${s.score}/5) `}</span>
                <EvidenceBadge status="User-asserted" /> <ControlRefs ids={s.controls} />
              </li>
            ))}
          </ul>
        ) : (
          <p>{NO_STRENGTHS}</p>
        )}
      </Section>

      <Section id="rpt-plan" title="30/60/90-day action plan">
        <div className="plan-grid">
          {PLAN_HORIZONS.map((h) => {
            const items = result.action_plan[h] ?? [];
            return (
              <div className="plan-col" key={h}>
                <h4>{labels[h] || `${h} days`}</h4>
                {items.length ? (
                  <ul>
                    {items.map((it) => (
                      <li key={it.question_id}>
                        {it.action} <br />
                        <span className="cite">{`${it.domain} · ${it.question_id} · `}</span>
                        <ControlRefs ids={it.controls} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="small">{NO_HORIZON_ACTIONS}</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="rpt-controls" title="Recommended AEGIS controls">
        <div className="table-wrap" role="region" tabIndex={0} aria-label="Recommended controls">
          <table>
            <thead>
              <tr>
                {["Control", "Pillar", "Priority", "NIST AI RMF", "ISO/IEC 42001", "EU AI Act"].map(
                  (h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {result.recommended_controls.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    <SiteLink href={controlUrl(c.id)}>
                      <span className="control-id">{c.id}</span> {c.title}
                    </SiteLink>
                  </th>
                  <td>{c.pillar}</td>
                  <td>{c.priority}</td>
                  <td>{mappingRefs(c.mappings, "nist_ai_rmf")}</td>
                  <td>{mappingRefs(c.mappings, "iso_42001")}</td>
                  <td>{mappingRefs(c.mappings, "eu_ai_act")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">
          Framework mappings are indicative AEGIS interpretations, not legal advice or an official
          crosswalk.
        </p>
      </Section>

      <Section id="rpt-readiness" title="Framework readiness indicators">
        <p>
          <strong>{INDICATIVE}. </strong>
          {READINESS_NOTE}
        </p>
        {result.readiness.map((fw) => (
          <div key={fw.framework}>
            <h4>{fw.framework} (indicative)</h4>
            <div
              className="table-wrap"
              role="region"
              tabIndex={0}
              aria-label={`${fw.framework} readiness indicators`}
            >
              <table>
                <thead>
                  <tr>
                    {["Area", "Indicator", "Band", "Based on questions"].map((h) => (
                      <th scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fw.groups.map((g) => (
                    <tr key={g.id}>
                      <th scope="row">{g.name}</th>
                      <td>{fixed1(g.value)}</td>
                      <td>{g.band}</td>
                      <td>{g.questions.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      <Section id="rpt-modules" title="Recommended AEGIS modules">
        <ul>
          {result.recommended_modules.map((m) => (
            <li key={m.module}>
              <strong>AEGIS {m.module}</strong> — {m.reason}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="rpt-next" title="Next step: validate with evidence">
        <p>{cta.description}</p>
        <p>
          <SiteLink href={cta.url} className="btn btn-primary">
            {cta.label}
          </SiteLink>
        </p>
        {result.cta.secondary && (
          <p>
            <SiteLink href={result.cta.secondary.url}>{result.cta.secondary.label}</SiteLink>
          </p>
        )}
      </Section>
      <aside className="disclaimer" aria-label="Disclaimer">
        <p>{result.standard_disclaimer}</p>
      </aside>
    </div>
  );
}

function ProfileFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: ProfileField;
  value: string | boolean | undefined;
  error: string | undefined;
  onChange: (v: string | boolean | undefined) => void;
}) {
  const id = `pf-${field.id}`;
  const req = field.required ? (
    <>
      {" "}
      <span className="req">(required)</span>
    </>
  ) : null;
  if (field.type === "select") {
    const labels = PROFILE_OPTION_LABELS[field.id] ?? {};
    return (
      <div className="field">
        <label htmlFor={id}>
          {field.label}
          {req}
        </label>
        <select
          id={id}
          name={field.id}
          required={field.required}
          value={typeof value === "string" ? value : ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {labels[o] ?? o}
            </option>
          ))}
        </select>
        <FieldErrorText id={id} error={error} />
      </div>
    );
  }
  return (
    <fieldset
      className="field fieldset-inline"
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend>
        {field.label}
        {req}
      </legend>
      {([true, false] as const).map((b) => (
        <div className="choice" key={String(b)}>
          <input
            type="radio"
            id={`${id}-${b ? "yes" : "no"}`}
            name={field.id}
            value={String(b)}
            checked={value === b}
            onChange={() => onChange(b)}
          />
          <label htmlFor={`${id}-${b ? "yes" : "no"}`}>{b ? "Yes" : "No"}</label>
        </div>
      ))}
      <FieldErrorText id={id} error={error} />
    </fieldset>
  );
}

function QuestionInput({
  q,
  value,
  error,
  onChange,
}: {
  q: TemplateQuestion;
  value: number | undefined;
  error: string | undefined;
  onChange: (v: number) => void;
}) {
  const qid = q.id.toLowerCase();
  const id = `q-${qid}`;
  return (
    <fieldset
      className="question"
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend>
        <span className="question-id">{q.id}</span> {q.text}
      </legend>
      <div className="scale">
        {template.scale.map((s) => (
          <div className="scale-option" key={s.score}>
            <input
              type="radio"
              id={`${id}-${s.score}`}
              name={q.id}
              value={s.score}
              checked={value === s.score}
              onChange={() => onChange(s.score)}
            />
            <label htmlFor={`${id}-${s.score}`}>
              <span className="scale-score">{s.score}</span>{" "}
              <span className="scale-label">{s.label}</span>{" "}
              <span className="scale-desc">{s.description}</span>
            </label>
          </div>
        ))}
      </div>
      <FieldErrorText id={id} error={error} />
    </fieldset>
  );
}

function downloadMarkdown(md: string, company: string) {
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = markdownFilename(company);
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

function stepErrors(n: number, profile: Profile, answers: Answers): FieldError[] {
  const errs: FieldError[] = [];
  if (n === 0) {
    for (const f of template.profile_fields) {
      if (!f.required || profile[f.id] !== undefined) continue;
      errs.push({
        id: `pf-${f.id}`,
        message: (f.type === "select" ? "Select: " : "Choose an answer: ") + f.label,
      });
    }
  }
  for (const q of STEPS[n]?.questions ?? []) {
    if (answers[q.id] === undefined) {
      errs.push({ id: `q-${q.id.toLowerCase()}`, message: `Choose an answer: ${q.id} ${q.text}` });
    }
  }
  return errs;
}

function gateValidation(g: GateFields): FieldError[] {
  const errs: FieldError[] = [];
  if (!g.name.trim()) errs.push({ id: "gate-name", message: "Enter your full name." });
  const email = g.email.trim();
  if (!email) errs.push({ id: "gate-email", message: "Enter your work email." });
  else if (!EMAIL_RE.test(email)) {
    errs.push({ id: "gate-email", message: "Enter a valid email address, like name@company.com." });
  } else if (isFreeMailDomain(email)) {
    errs.push({
      id: "gate-email",
      message: "Please use your business email address (personal email domains are not accepted).",
    });
  }
  if (!g.company.trim()) errs.push({ id: "gate-company", message: "Enter your organization." });
  if (!g.consent) {
    errs.push({
      id: "gate-consent",
      message: "Please confirm your consent so we can prepare your report.",
    });
  }
  return errs;
}

const FALLBACK_TAIL =
  "Your detailed report has been generated in your browser below. Download it as Markdown or use “Print or save as PDF”.";

function fallbackMessage(reason: "unavailable" | "error"): string {
  return (
    (reason === "unavailable"
      ? "We could not reach the AEGIS service, so your details were not saved and this report has not been emailed to you. "
      : "The AEGIS service returned an error, so your details may not have been saved and this report has not been emailed to you. ") +
    FALLBACK_TAIL
  );
}

// ---------------------------------------------------------------- the tool

export function MaturityAssessmentTool() {
  const [phase, setPhase] = useState<Phase>("steps");
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({});
  const [answers, setAnswers] = useState<Answers>({});
  const [started, setStarted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [gate, setGate] = useState<GateFields>(EMPTY_GATE);
  const [gateErrors, setGateErrors] = useState<FieldError[]>([]);
  const [gateStatus, setGateStatus] = useState<{ message: string; kind: StatusKind }>({
    message: "",
    kind: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<ReportState | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string; seq: number } | null>(null);
  const seq = useRef(0);

  const requestFocus = (id: string) => {
    seq.current += 1;
    setFocusRequest({ id, seq: seq.current });
  };

  // Restore progress from this tab's sessionStorage (client only).
  useEffect(() => {
    const s = storage();
    if (s) {
      try {
        const v = sanitizeStored(JSON.parse(s.getItem(STORE_KEY) || "null"));
        if (v) {
          setStep(v.step);
          setProfile(v.profile);
          setAnswers(v.answers);
          setStarted(v.started);
        }
      } catch {
        /* ignore corrupt state */
      }
    }
    setHydrated(true);
  }, []);

  // Persist progress (never contact details) whenever it changes.
  useEffect(() => {
    if (!hydrated) return;
    const s = storage();
    if (!s) return;
    try {
      s.setItem(STORE_KEY, JSON.stringify({ step, profile, answers, started }));
    } catch {
      /* quota / private mode */
    }
  }, [hydrated, step, profile, answers, started]);

  // Move focus after phase/step changes (headings, error summaries, notices).
  useEffect(() => {
    if (!focusRequest) return;
    document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);

  const preliminary = useMemo(() => {
    if (phase !== "preliminary") return null;
    try {
      return preliminaryResult(answers, profile, bundle);
    } catch {
      return null;
    }
  }, [phase, answers, profile]);

  const errorFor = (list: FieldError[], id: string) => list.find((e) => e.id === id)?.message;

  const goToStep = (n: number) => {
    setStep(n);
    setErrors([]);
    requestFocus(`step-${n}-title`);
  };

  const onStepSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const errs = stepErrors(step, profile, answers);
    setErrors(errs);
    if (errs.length) {
      requestFocus("assessment-errors");
      return;
    }
    if (step === 0 && !started) setStarted(true);
    if (step < TOTAL - 1) {
      goToStep(step + 1);
    } else {
      setPhase("preliminary");
      requestFocus("prelim-title");
    }
  };

  const updateProfile = (id: string, v: string | boolean | undefined) => {
    setProfile((p) => {
      const next = { ...p };
      if (v === undefined) delete next[id];
      else next[id] = v;
      return next;
    });
  };

  const showReport = (company: string, stored: boolean, message: string) => {
    const result = scoreAssessment(answers, profile, bundle);
    setReport({ result, company, stored, message });
    setPhase("report");
    requestFocus("report-delivery");
  };

  const onGateSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const errs = gateValidation(gate);
    setGateErrors(errs);
    if (errs.length) {
      requestFocus("gate-errors");
      return;
    }
    const company = gate.company.trim();
    if (gate.website.trim()) {
      // honeypot: send nothing
      showReport(company, false, fallbackMessage("unavailable"));
      return;
    }
    const summary = preliminaryResult(answers, profile, bundle);
    setSubmitting(true);
    setGateStatus({ message: "Preparing your report…", kind: "" });
    let outcome: "stored" | "unavailable" | "error" = "unavailable";
    try {
      const industry = profile["industry"];
      const aiSystems = profile["ai_systems"];
      const r = await submitLead({
        data: {
          form: "assessment",
          email: gate.email.trim(),
          name: gate.name.trim(),
          company,
          role: gate.role.trim(),
          ...(typeof industry === "string" ? { industry } : {}),
          ...(typeof aiSystems === "string" ? { ai_systems: aiSystems } : {}),
          tool: "maturity-assessment",
          consent: true,
          website: "",
          payload: {
            template_id: summary.template_id,
            template_version: summary.template_version,
            overall_score: summary.overall_score,
            maturity_level: summary.maturity_level,
            domain_scores: Object.fromEntries(summary.domains.map((d) => [d.id, d.score])),
          },
        },
      });
      if (r.ok) {
        outcome = r.stored ? "stored" : "unavailable";
      } else if (/business email/i.test(r.error)) {
        setSubmitting(false);
        setGateStatus({ message: "", kind: "" });
        setGateErrors([{ id: "gate-email", message: r.error }]);
        requestFocus("gate-errors");
        return;
      } else {
        outcome = "error";
      }
    } catch {
      outcome = "unavailable";
    }
    setSubmitting(false);
    setGateStatus({ message: "", kind: "" });
    if (outcome === "stored") {
      showReport(
        company,
        true,
        "Your detailed report is ready. We have not emailed a copy, so please use the download options below.",
      );
    } else {
      showReport(company, false, fallbackMessage(outcome));
    }
  };

  const restart = () => {
    const s = storage();
    if (s) {
      try {
        s.removeItem(STORE_KEY);
      } catch {
        /* ignore */
      }
    }
    setPhase("steps");
    setStep(0);
    setProfile({});
    setAnswers({});
    setStarted(false);
    setErrors([]);
    setGate(EMPTY_GATE);
    setGateErrors([]);
    setGateStatus({ message: "", kind: "" });
    setReport(null);
    requestFocus("step-0-title");
  };

  const current = STEPS[step] ?? STEPS[0];
  const gateField = (k: "name" | "email" | "company" | "role" | "website", v: string) =>
    setGate((g) => ({ ...g, [k]: v }));
  const gateInvalid = (id: string) => {
    const err = errorFor(gateErrors, id);
    return {
      "aria-invalid": err ? true : undefined,
      "aria-describedby": err ? `${id}-error` : undefined,
    } as const;
  };

  return (
    <section
      className="tool assessment"
      id="assessment"
      data-tool="maturity-assessment"
      aria-labelledby="assessment-heading"
    >
      <h2 id="assessment-heading" className="visually-hidden">
        AI Governance Maturity Self-Assessment
      </h2>

      {phase === "steps" && (
        <>
          <div className="assessment-progress" id="assessment-progress-wrap">
            <p className="progress-label" id="assessment-progress-label">
              Step {step + 1} of {TOTAL} — {current?.title}
            </p>
            <progress
              id="assessment-progress"
              max={TOTAL}
              value={step + 1}
              aria-labelledby="assessment-progress-label"
            />
          </div>
          <form id="assessment-form" className="assessment-form" noValidate onSubmit={onStepSubmit}>
            <ErrorSummary
              id="assessment-errors"
              title="Please answer the following"
              errors={errors}
            />
            {step === 0 ? (
              <section className="assessment-step" data-step="0" aria-labelledby="step-0-title">
                <h3 className="step-title" id="step-0-title" tabIndex={-1}>
                  Your organization
                </h3>
                <p className="small">
                  About {template.template.estimated_minutes ?? 8} minutes. Your answers stay in
                  this browser tab until you choose to request the detailed report.
                </p>
                {template.profile_fields.map((f) => (
                  <ProfileFieldInput
                    key={f.id}
                    field={f}
                    value={profile[f.id]}
                    error={errorFor(errors, `pf-${f.id}`)}
                    onChange={(v) => updateProfile(f.id, v)}
                  />
                ))}
              </section>
            ) : (
              <section
                className="assessment-step"
                data-step={step}
                aria-labelledby={`step-${step}-title`}
              >
                <h3 className="step-title" id={`step-${step}-title`} tabIndex={-1}>
                  {current?.title}
                </h3>
                <p className="small">
                  Choose the statement that best describes your organization today. Answers are
                  self-reported (<em>User-asserted</em>).
                </p>
                {(current?.questions ?? []).map((q) => (
                  <QuestionInput
                    key={q.id}
                    q={q}
                    value={answers[q.id]}
                    error={errorFor(errors, `q-${q.id.toLowerCase()}`)}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  />
                ))}
              </section>
            )}
            <div className="step-nav">
              {step > 0 && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  id="assessment-back"
                  onClick={() => goToStep(step - 1)}
                >
                  Back
                </button>
              )}
              <button className="btn btn-primary" type="submit" id="assessment-next">
                {step === TOTAL - 1 ? "See my results" : "Next"}
              </button>
            </div>
          </form>
        </>
      )}

      {phase === "preliminary" && preliminary && (
        <section
          className="assessment-preliminary"
          id="assessment-preliminary"
          aria-labelledby="prelim-title"
        >
          <h2 id="prelim-title" tabIndex={-1}>
            Your preliminary result
          </h2>
          <p className="evidence-note">
            <span className="badge badge-asserted">User-asserted</span> Based only on your
            self-reported answers. No evidence has been reviewed.
          </p>
          <div className="score-summary">
            <p className="score-big">
              <span id="prelim-score">{fixed1(preliminary.overall_score)}</span>
              <span className="score-max"> / 100</span>
            </p>
            <p className="score-level">
              Maturity level: <strong id="prelim-level">{preliminary.maturity_level}</strong>
            </p>
            <p id="prelim-interpretation">{preliminary.level_interpretation}</p>
          </div>
          <h3>Domain scores</h3>
          <DomainBars domains={preliminary.domains} idPrefix="prelim-d" />
          <div className="gate" id="assessment-gate-panel">
            <h3 id="gate-title">Get your detailed report</h3>
            <p>
              Your detailed report includes strengths, gaps, critical risk flags, a 30/60/90-day
              plan, recommended AEGIS controls with framework mappings, and indicative readiness
              indicators.
            </p>
            <form
              id="assessment-gate"
              className="aegis-form"
              noValidate
              aria-labelledby="gate-title"
              onSubmit={(ev) => void onGateSubmit(ev)}
            >
              <ErrorSummary
                id="gate-errors"
                title="Please correct the following"
                errors={gateErrors}
                headingLevel={4}
              />
              <div className="field">
                <label htmlFor="gate-name">
                  Full name <span className="req">(required)</span>
                </label>
                <input
                  id="gate-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  required
                  value={gate.name}
                  onChange={(e) => gateField("name", e.target.value)}
                  {...gateInvalid("gate-name")}
                />
                <FieldErrorText id="gate-name" error={errorFor(gateErrors, "gate-name")} />
              </div>
              <div className="field">
                <label htmlFor="gate-email">
                  Work email <span className="req">(required)</span>
                </label>
                <p className="hint" id="gate-email-hint">
                  Please use your business email address.
                </p>
                <input
                  id="gate-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  spellCheck={false}
                  required
                  value={gate.email}
                  onChange={(e) => gateField("email", e.target.value)}
                  aria-invalid={errorFor(gateErrors, "gate-email") ? true : undefined}
                  aria-describedby={
                    "gate-email-hint" +
                    (errorFor(gateErrors, "gate-email") ? " gate-email-error" : "")
                  }
                />
                <FieldErrorText id="gate-email" error={errorFor(gateErrors, "gate-email")} />
              </div>
              <div className="field">
                <label htmlFor="gate-company">
                  Organization <span className="req">(required)</span>
                </label>
                <input
                  id="gate-company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  maxLength={160}
                  required
                  value={gate.company}
                  onChange={(e) => gateField("company", e.target.value)}
                  {...gateInvalid("gate-company")}
                />
                <FieldErrorText id="gate-company" error={errorFor(gateErrors, "gate-company")} />
              </div>
              <div className="field">
                <label htmlFor="gate-role">Job title</label>
                <input
                  id="gate-role"
                  name="role"
                  type="text"
                  autoComplete="organization-title"
                  maxLength={120}
                  value={gate.role}
                  onChange={(e) => gateField("role", e.target.value)}
                />
              </div>
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="gate-website">Leave this field empty</label>
                <input
                  id="gate-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={gate.website}
                  onChange={(e) => gateField("website", e.target.value)}
                />
              </div>
              <div className="field field--check">
                <input
                  id="gate-consent"
                  name="consent"
                  type="checkbox"
                  value="true"
                  required
                  checked={gate.consent}
                  onChange={(e) => setGate((g) => ({ ...g, consent: e.target.checked }))}
                  {...gateInvalid("gate-consent")}
                />
                <label htmlFor="gate-consent">
                  I agree that AEGIS may store my details and my score summary to prepare my report.
                  See our <SiteLink href={siteConfig.privacy_url}>privacy notice</SiteLink>.{" "}
                  <span className="req">(required)</span>
                </label>
                <FieldErrorText id="gate-consent" error={errorFor(gateErrors, "gate-consent")} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                Get my detailed report
              </button>
              <div
                className={"form-status" + (gateStatus.kind ? ` is-${gateStatus.kind}` : "")}
                id="gate-status"
                role="status"
                aria-live="polite"
                tabIndex={-1}
              >
                {gateStatus.message}
              </div>
            </form>
          </div>
        </section>
      )}

      {phase === "report" && report && (
        <section
          className="assessment-report"
          id="assessment-report"
          aria-labelledby="report-title"
        >
          <div
            className={`report-delivery notice ${report.stored ? "notice--success" : "notice--warning"}`}
            id="report-delivery"
            role="status"
            tabIndex={-1}
          >
            {report.message}
          </div>
          <div className="report-actions" id="report-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                downloadMarkdown(
                  toMarkdown(report.result, { bundle, company: report.company }),
                  report.company,
                )
              }
            >
              Download Markdown
            </button>{" "}
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
              Print or save as PDF
            </button>
          </div>
          <AssessmentReportView result={report.result} company={report.company} />
          <p className="report-restart">
            <button
              className="btn btn-secondary"
              type="button"
              id="assessment-restart"
              onClick={restart}
            >
              Start a new assessment
            </button>
          </p>
        </section>
      )}
    </section>
  );
}
