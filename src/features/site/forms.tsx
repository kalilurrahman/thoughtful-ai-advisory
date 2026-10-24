import { useId, useRef, useState, type FormEvent } from "react";
import { isFreeMailDomain, siteConfig } from "./content";
import { submitLead, type LeadForm as LeadFormKey } from "./leads.functions";
import { SiteLink } from "./ui";
import { track } from "@/features/platform/analytics";

// Lead forms — ported from platform/app/website/veritrail_website/forms.py and the form
// handling in static/js/site.js (validation, error summary, business-email gate).

type Option = [value: string, label: string];
interface FieldDef {
  name: "name" | "email" | "company" | "role" | "message" | "ai_systems" | "industry" | "tool";
  label: string;
  type: "text" | "email" | "select" | "textarea";
  required?: boolean;
  autocomplete?: string;
  options?: Option[];
  hint?: string;
  rows?: number;
}
interface FormDef {
  businessEmail: boolean;
  submit: string;
  fields: FieldDef[];
  consent: string;
  success: string;
}

const AI_SYSTEMS_OPTIONS: Option[] = [
  ["", "Select…"],
  ["0-9", "0–9"],
  ["10-24", "10–24"],
  ["25-99", "25–99"],
  ["100+", "100 or more"],
  ["unknown", "Not sure"],
];
const INDUSTRY_OPTIONS: Option[] = [
  ["", "Select…"],
  ["healthcare_pharma", "Healthcare & pharma"],
  ["bfsi", "Banking, financial services & insurance"],
  ["gcc_it_services", "Global capability center / IT services"],
  ["saas_product", "SaaS / product company"],
  ["public_sector", "Public sector"],
  ["other", "Other"],
];
const INTEREST_OPTIONS: Option[] = [
  ["", "Select…"],
  ["assess", "VERITRAIL Assess"],
  ["register", "VERITRAIL Register"],
  ["control", "VERITRAIL Control"],
  ["shield", "VERITRAIL Shield (runtime guardrails)"],
  ["assurance", "VERITRAIL Assurance"],
  ["agent", "VERITRAIL Agent"],
  ["not_sure", "Not sure yet"],
];
const NO_PERSONAL = "Optional. Do not include personal or confidential data about individuals.";

const NAME: FieldDef = {
  name: "name",
  label: "Full name",
  type: "text",
  required: true,
  autocomplete: "name",
};
const WORK_EMAIL: FieldDef = {
  name: "email",
  label: "Work email",
  type: "email",
  required: true,
  autocomplete: "email",
  hint: "Please use your business email address.",
};
const EMAIL: FieldDef = {
  name: "email",
  label: "Email",
  type: "email",
  required: true,
  autocomplete: "email",
};
const COMPANY: FieldDef = {
  name: "company",
  label: "Organization",
  type: "text",
  required: true,
  autocomplete: "organization",
};
const COMPANY_OPT: FieldDef = { ...COMPANY, required: false };
const ROLE: FieldDef = {
  name: "role",
  label: "Job title",
  type: "text",
  autocomplete: "organization-title",
};
const AI_SYSTEMS: FieldDef = {
  name: "ai_systems",
  label: "Approximate number of AI systems in use",
  type: "select",
  options: AI_SYSTEMS_OPTIONS,
};
const INDUSTRY: FieldDef = {
  name: "industry",
  label: "Industry",
  type: "select",
  options: INDUSTRY_OPTIONS,
};
const message = (label: string, rows: number, required = false): FieldDef => ({
  name: "message",
  label,
  type: "textarea",
  rows,
  required,
  hint: required ? "Do not include personal or confidential data about individuals." : NO_PERSONAL,
});

export const FORMS: Record<LeadFormKey, FormDef> = {
  baseline: {
    businessEmail: true,
    submit: "Request a Governance Baseline",
    fields: [
      NAME,
      WORK_EMAIL,
      COMPANY,
      ROLE,
      INDUSTRY,
      AI_SYSTEMS,
      message("What would you like the Baseline to focus on?", 5),
    ],
    consent: "I agree that VERITRAIL may contact me about this request.",
    success:
      "Thank you. Your request has been received. A member of the VERITRAIL team will contact you to schedule a scoping call.",
  },
  demo: {
    businessEmail: true,
    submit: "Request a demo",
    fields: [
      NAME,
      WORK_EMAIL,
      COMPANY,
      ROLE,
      { name: "tool", label: "Main area of interest", type: "select", options: INTEREST_OPTIONS },
      message("What would you like to see?", 5),
    ],
    consent: "I agree that VERITRAIL may contact me about this request.",
    success:
      "Thank you. Your demo request has been received and we will be in touch to arrange a time.",
  },
  contact: {
    businessEmail: false,
    submit: "Send message",
    fields: [NAME, EMAIL, COMPANY_OPT, message("Message", 6, true)],
    consent: "I agree that VERITRAIL may use these details to respond to my message.",
    success: "Thank you. Your message has been received.",
  },
  newsletter: {
    businessEmail: false,
    submit: "Subscribe",
    fields: [EMAIL],
    consent: "Send me the VERITRAIL governance briefing. I can unsubscribe at any time.",
    success: "Thank you. Your subscription request has been recorded.",
  },
  blueprint: {
    businessEmail: true,
    submit: "Get the blueprint",
    fields: [NAME, WORK_EMAIL, COMPANY, ROLE],
    consent: "I agree that VERITRAIL may send me the blueprint and related governance content.",
    success: "Thank you. Your download is ready.",
  },
  design_partner: {
    businessEmail: true,
    submit: "Apply to the design partner programme",
    fields: [
      NAME,
      WORK_EMAIL,
      COMPANY,
      ROLE,
      INDUSTRY,
      AI_SYSTEMS,
      message("What would you like to pilot?", 5),
    ],
    consent: "I agree that VERITRAIL may contact me about the design partner programme.",
    success:
      "Thank you. Your application has been received and we will contact you to discuss fit and scope.",
  },
  waitlist: {
    businessEmail: true,
    submit: "Join the waitlist",
    fields: [NAME, WORK_EMAIL, COMPANY, ROLE, message("What would you use it for?", 4)],
    consent: "I agree that VERITRAIL may contact me when this tool becomes available.",
    success:
      "Thank you. You are on the waitlist and we will contact you when the tool is available.",
  },
  assessment: {
    businessEmail: true,
    submit: "Get my report",
    fields: [NAME, WORK_EMAIL, COMPANY, ROLE],
    consent: "I agree that VERITRAIL may send me my report and related governance content.",
    success: "Thank you. Your report is ready.",
  },
};

export function formSubmitLabel(key: string): string {
  return FORMS[key as LeadFormKey]?.submit ?? "Submit";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(def: FormDef, values: Record<string, string>, consent: boolean) {
  const errors: Array<{ field: string; message: string }> = [];
  for (const f of def.fields) {
    const v = (values[f.name] ?? "").trim();
    if (f.required && !v) {
      errors.push({ field: f.name, message: `Enter your ${f.label.toLowerCase()}.` });
    } else if (f.type === "email" && v) {
      if (!EMAIL_RE.test(v))
        errors.push({ field: f.name, message: "Enter a valid email address." });
      else if (def.businessEmail && isFreeMailDomain(v))
        errors.push({ field: f.name, message: "Please use your business email address." });
    }
  }
  if (!consent)
    errors.push({ field: "consent", message: "Please confirm that you agree so we can respond." });
  return errors;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; text: string; download: boolean }
  | { kind: "error"; text: string; download: boolean };

export function LeadForm({
  form,
  compact,
  tool,
}: {
  form: LeadFormKey;
  compact?: boolean;
  tool?: string;
}) {
  const def = FORMS[form];
  const p = useId().replace(/:/g, "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const summaryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const blueprint = siteConfig.downloads["blueprint"];
  const errorFor = (name: string) => errors.find((e) => e.field === name)?.message;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateLead(def, values, consent);
    setErrors(found);
    if (found.length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setStatus({ kind: "sending" });
    const offerDownload = form === "blueprint";
    try {
      const res = await submitLead({
        data: {
          form,
          ...values,
          email: values["email"] ?? "",
          consent: true,
          website: honeypot,
          ...(tool ? { tool } : {}),
        },
      });
      if (res.ok) {
        // As site.js: count stored submissions only; the honeypot gets a confirmation, not a count.
        if (!honeypot) track("form_submit", { form });
        setStatus({ kind: "success", text: def.success, download: offerDownload });
        setValues({});
        setConsent(false);
      } else {
        setStatus({ kind: "error", text: res.error, download: false });
      }
    } catch {
      setStatus({
        kind: "error",
        text: `We could not reach the VERITRAIL service, so nothing was recorded. Please email ${siteConfig.organization.email}.${
          offerDownload
            ? " You can still download the blueprint; your details were not recorded."
            : ""
        }`,
        download: offerDownload,
      });
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  return (
    <form
      className={`veritrail-form${compact ? " veritrail-form--compact" : ""}`}
      noValidate
      onSubmit={onSubmit}
    >
      {errors.length > 0 && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <h3 className="error-summary-title">Please correct the following</h3>
          <ul>
            {errors.map((er) => (
              <li key={er.field}>
                <a href={`#${p}-${er.field}`}>{er.message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {def.fields.map((f) => {
        const id = `${p}-${f.name}`;
        const err = errorFor(f.name);
        const describedBy =
          [f.hint ? `${id}-hint` : "", err ? `${id}-error` : ""].filter(Boolean).join(" ") ||
          undefined;
        const common = {
          id,
          name: f.name,
          required: f.required,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": describedBy,
          value: values[f.name] ?? "",
          onChange: (ev: { target: { value: string } }) =>
            setValues((v) => ({ ...v, [f.name]: ev.target.value })),
        };
        return (
          <div key={f.name} className={`field${f.type === "textarea" ? " field--wide" : ""}`}>
            <label htmlFor={id}>
              {f.label}
              {f.required && <span className="req"> (required)</span>}
            </label>
            {f.hint && (
              <p className="hint" id={`${id}-hint`}>
                {f.hint}
              </p>
            )}
            {f.type === "select" ? (
              <select {...common}>
                {(f.options ?? []).map(([val, lab]) => (
                  <option key={val} value={val}>
                    {lab}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea {...common} rows={f.rows ?? 4} maxLength={4000} />
            ) : (
              <input
                {...common}
                type={f.type}
                autoComplete={f.autocomplete}
                maxLength={f.type === "email" ? 254 : 160}
                spellCheck={f.type === "email" ? false : undefined}
              />
            )}
            {err && (
              <p className="field-error" id={`${id}-error`}>
                {err}
              </p>
            )}
          </div>
        );
      })}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`${p}-website`}>Leave this field empty</label>
        <input
          id={`${p}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      <div className="field field--check">
        <input
          id={`${p}-consent`}
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={errorFor("consent") ? true : undefined}
          required
        />
        <label htmlFor={`${p}-consent`}>
          {def.consent} See our <SiteLink href={siteConfig.privacy_url}>privacy notice</SiteLink>.{" "}
          <span className="req">(required)</span>
        </label>
        {errorFor("consent") && <p className="field-error">{errorFor("consent")}</p>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : def.submit}
      </button>
      <div
        className={`form-status${status.kind === "success" ? " is-success" : status.kind === "error" ? " is-error" : ""}`}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        ref={statusRef}
      >
        {(status.kind === "success" || status.kind === "error") && (
          <>
            {status.text}
            {status.download && blueprint && (
              <>
                {" "}
                <a className="btn btn-secondary" href={blueprint.path} download>
                  {blueprint.label}
                </a>
              </>
            )}
          </>
        )}
      </div>
    </form>
  );
}
