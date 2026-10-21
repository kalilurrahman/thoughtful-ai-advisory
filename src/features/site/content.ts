import { parse } from "yaml";
import controlsYaml from "../../../platform/content/controls/controls.yaml?raw";
import maturityYaml from "../../../platform/content/assessment_templates/maturity_self_assessment.yaml?raw";
import useCaseYaml from "../../../platform/content/assessment_templates/use_case_assessment.yaml?raw";
import siteYaml from "../../../platform/app/website/site.yaml?raw";

// Governed AEGIS content is read straight from platform/content so the website, the
// Python reference engines and the browser tools share a single source of truth.

export type FrameworkKey = "nist_ai_rmf" | "iso_42001" | "eu_ai_act";

export interface AegisControl {
  id: string;
  title: string;
  pillar: string;
  objective: string;
  applies_to: string;
  domains?: string[];
  evidence?: string[];
  owner_role: string;
  priority: string;
  modules?: string[];
  mappings?: Partial<Record<FrameworkKey, Array<string | number>>>;
}

export interface AegisPillar {
  id: string;
  name: string;
  summary: string;
}

interface ControlLibraryFile {
  library: {
    id: string;
    version: string;
    effective_date: string;
    mapping_disclaimer: string;
  };
  pillars: AegisPillar[];
  controls: AegisControl[];
}

export interface CtaDef {
  title: string;
  text: string;
  label: string;
  url: string;
}

export interface SiteConfig {
  site_name: string;
  site_tagline: string;
  organization: { name: string; email: string };
  nav_sections: Array<{ id: string; label: string }>;
  section_labels: Record<string, string>;
  header_cta: { label: string; url: string };
  privacy_url: string;
  footer_links: Array<{ label: string; url: string }>;
  ctas: Record<string, CtaDef>;
  control_library: { slug: string; nav_label: string; nav_order: number };
  downloads: Record<string, { path: string; label: string }>;
  free_mail_domains: string[];
}

const library = parse(controlsYaml) as ControlLibraryFile;

/* eslint-disable @typescript-eslint/no-explicit-any -- template files are validated by the platform content checks */
export const maturityTemplate = parse(maturityYaml) as any;
export const useCaseTemplate = parse(useCaseYaml) as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const siteConfig = parse(siteYaml) as SiteConfig;

export const controlLibrary = library.library;
export const pillars: AegisPillar[] = library.pillars;
export const controls: AegisControl[] = library.controls;
const byId = new Map(controls.map((c) => [c.id, c]));
const pillarById = new Map(pillars.map((p) => [p.id, p]));

export const CONTROL_ID_RE = /\b(AO|EI|GL|IS|SE)-\d{2}\b/;

export const STANDARD_DISCLAIMER =
  "AEGIS supports governance readiness, control implementation and evidence collection. " +
  "It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or " +
  "replace legal advice. Framework mappings are indicative.";

export const NO_SOURCE_MESSAGE = "No supporting evidence or framework source is available.";

export const EVIDENCE_STATUSES = [
  "Verified",
  "User-asserted",
  "Inferred",
  "Missing evidence",
  "Critical gap",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_STATUS_DEFINITIONS: Record<EvidenceStatus, string> = {
  Verified: "Evidence exists and has been reviewed",
  "User-asserted": "User claims implementation, but evidence is absent",
  Inferred: "Inferred as a likely gap or fact from responses or metadata",
  "Missing evidence": "Required evidence has not been provided",
  "Critical gap": "Material privacy, security, safety, legal, or operational exposure",
};

export const FRAMEWORK_LABELS: Record<FrameworkKey, string> = {
  nist_ai_rmf: "NIST AI RMF",
  iso_42001: "ISO/IEC 42001",
  eu_ai_act: "EU AI Act",
};

export const APPLIES_LABELS: Record<string, string> = {
  all: "All AI systems",
  high_risk: "High-risk systems",
  genai: "Generative AI systems",
  agentic: "Agents and agentic workflows",
  third_party: "Third-party / vendor AI",
};

export function getControl(id: string): AegisControl | undefined {
  return byId.get(id.toUpperCase());
}

export function getPillar(id: string): AegisPillar | undefined {
  return pillarById.get(id);
}

/** Site path of a control page, e.g. IS-11 -> /framework/controls/is-11 */
export function controlUrl(id: string): string {
  return `/framework/controls/${id.toLowerCase()}`;
}

/** Human-readable citation, e.g. "AEGIS Control IS-11: Least-privilege tool access (Control Library v1.0.0)". */
export function controlCitation(id: string): string {
  const c = getControl(id);
  if (!c) throw new Error(`Unknown AEGIS control ID: ${id}`);
  return `AEGIS Control ${c.id}: ${c.title} (Control Library v${controlLibrary.version})`;
}

export function controlMappings(c: AegisControl): Array<{ framework: string; refs: string[] }> {
  return (Object.keys(FRAMEWORK_LABELS) as FrameworkKey[]).map((k) => ({
    framework: FRAMEWORK_LABELS[k],
    refs: (c.mappings?.[k] ?? []).map(String),
  }));
}

/** True when the e-mail address uses a free-mail or disposable domain (business-email gate). */
export function isFreeMailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return siteConfig.free_mail_domains.includes(domain);
}
