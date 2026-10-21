/**
 * Knowledge retrieval over governed AEGIS content (BM25), ported from
 * platform/app/agent/aegis_agent/knowledge.py.
 *
 * Sources (bundled at build time with Vite `?raw` imports, parsed with `yaml`):
 *   content/controls/controls.yaml                              one doc per control
 *   content/assessment_templates/maturity_self_assessment.yaml  questions + critical flags
 *   content/assessment_templates/use_case_assessment.yaml       use-case questions
 *   content/policy_packs/*.yaml                                 policy packs (header, sections, rules)
 *   content/industry_packs/*.yaml                               industry packs (header, sections, items)
 *   content/*.md, docs/COMPLIANCE_MAPPING.md                    chunked by heading
 */
import { parse } from "yaml";
import {
  controlLibrary,
  controls,
  getControl,
  maturityTemplate,
  pillars,
  useCaseTemplate,
  type AegisControl,
  type FrameworkKey,
} from "../../content";
import aegisFrameworkMd from "../../../../../platform/content/aegis_framework.md?raw";
import maturityModelMd from "../../../../../platform/content/maturity_model.md?raw";
import pillarsMd from "../../../../../platform/content/pillars.md?raw";
import complianceMappingMd from "../../../../../platform/docs/COMPLIANCE_MAPPING.md?raw";

const policyPackFiles = import.meta.glob<string>(
  "../../../../../platform/content/policy_packs/*.yaml",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);
const industryPackFiles = import.meta.glob<string>(
  "../../../../../platform/content/industry_packs/*.yaml",
  { query: "?raw", import: "default", eager: true },
);

export const CONTROL_ID_RE = /\b(AO|EI|GL|IS|SE)-(\d{2})\b/i;
export const MATURITY_QID_RE = /\b(STR|INV|RSK|DAT|SEC|FST|HUM|ASR)-Q\d\b/i;
export const UC_QID_RE = /\bUC-[A-Z]{2,4}-Q\d{1,2}\b/i;

export const FRAMEWORK_LABELS: Record<FrameworkKey, string> = {
  nist_ai_rmf: "NIST AI RMF 1.0",
  iso_42001: "ISO/IEC 42001:2023",
  eu_ai_act: "EU AI Act (Regulation (EU) 2024/1689)",
};

const STOPWORDS = new Set(
  `a an and are as at be been being but by can could do does did for from has have having how i if in into is it its
me my of on or our ours should so than that the their them then there these they this those to us was we were what
when where which who whom why will with would you your yours about any all also am just more most no not only own same
such too very s t don shall may might must tell give show explain list please need want know get let like make use using
aegis handle ensure ensuring require requires required requirement requirements organization organisation company
companies doing done way ways best practice practices good something anything thing things one ones does do help`.split(
    /\s+/,
  ),
);

export const SYNONYMS: Record<string, string[]> = {
  pii: ["personal", "data", "redaction"],
  gdpr: ["privacy", "personal", "data"],
  dpia: ["privacy", "impact", "assessment"],
  llm: ["genai", "generative", "prompt"],
  chatbot: ["genai", "llm", "disclosure"],
  gpt: ["genai", "llm", "vendor"],
  agent: ["agentic", "tool"],
  agents: ["agentic", "tool"],
  guardrail: ["runtime", "policy", "enforcement"],
  guardrails: ["runtime", "policy", "enforcement"],
  jailbreak: ["injection", "adversarial"],
  redteam: ["adversarial", "injection", "testing"],
  audit: ["evidence", "logging"],
  logs: ["logging", "log"],
  inventory: ["register", "registry"],
  vendor: ["third", "party", "procurement"],
  supplier: ["vendor", "third", "party"],
  bias: ["fairness"],
  oversight: ["human", "review"],
  hitl: ["human", "approval", "oversight"],
  approval: ["approve", "human"],
  killswitch: ["kill", "switch", "rollback"],
  drift: ["monitoring", "performance"],
  incident: ["incidents", "escalation"],
  transparency: ["disclosure"],
  training: ["literacy"],
  tier: ["classification", "tiering", "risk"],
  tiering: ["classification", "tier", "risk"],
};

function synonymsOf(t: string): string[] {
  return Object.prototype.hasOwnProperty.call(SYNONYMS, t) ? (SYNONYMS[t] ?? []) : [];
}

/** Vocabulary indicating a question is within AI-governance scope. */
const GOVERNANCE_VOCAB = new Set(
  `ai artificial intelligence model models llm genai generative agent agents agentic governance risk risks control controls
policy policies privacy data security compliance compliant regulation regulatory act iso nist rmf 42001 eu framework
frameworks audit evidence oversight human approval inventory register vendor third party bias fairness transparency
disclosure incident incidents monitoring drift guardrail guardrails runtime prompt injection jailbreak redaction pii
gdpr dpia tier tiering classification assessment assess maturity readiness certification certified certify accountability
owner ownership lifecycle deployment testing red team kill switch rollback logging literacy chatbot copilot rag tool tools
safety harm explainability appeal procurement contract shadow use case cases high-risk prohibited article annex clause
governance aegis pillar pillars module modules pack packs industry bfsi healthcare pharma banking insurance saas gcc
public sector gpai obligations obligation provider providers deployer deployers maturity soc nist regulator regulators
auditor auditors dora hipaa fine-tune fine-tuning finetune chatgpt openai anthropic copilot vendor vendors retention`.split(
    /\s+/,
  ),
);

export function stem(w: string): string {
  if (w.length <= 3 || /^[a-z]{2}-\d{2}$/.test(w) || /\d/.test(w)) return w;
  const rules: Array<[string, string]> = [
    ["ies", "y"],
    ["sses", "ss"],
    ["ing", ""],
    ["ed", ""],
    ["es", ""],
    ["s", ""],
  ];
  for (const [suf, rep] of rules) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length) + rep;
  }
  return w;
}

const TOKEN_RE =
  /[a-z]{2}-\d{2}|[a-z]+-q\d+|uc-[a-z]+-q\d+|a\.\d+(?:\.\d+)*|\d+(?:\.\d+)+|[a-z0-9]+/g;

export function tokenize(text: string, expand = false): string[] {
  const toks: string[] = [];
  for (const m of (text || "").toLowerCase().matchAll(TOKEN_RE)) {
    const t = m[0];
    if (STOPWORDS.has(t)) continue;
    toks.push(stem(t));
    if (expand) for (const s of synonymsOf(t)) toks.push(stem(s));
  }
  return toks;
}

// --------------------------------------------------------------------------- documents
export interface SourceRef {
  type: string;
  id: string;
  title: string;
  path: string;
  section?: string;
  policy_id?: string;
  policy_version?: string;
}

export interface KnowledgeDoc {
  id: string;
  kind: string;
  title: string;
  text: string;
  source: string;
  section: string;
  control_ids: string[];
  question_ids: string[];
  policy_id: string | null;
  policy_version: string | null;
  boost: number;
  summary: string;
}

function makeDoc(
  d: Partial<KnowledgeDoc> & Pick<KnowledgeDoc, "id" | "kind" | "title" | "text" | "source">,
): KnowledgeDoc {
  return {
    section: "",
    control_ids: [],
    question_ids: [],
    policy_id: null,
    policy_version: null,
    boost: 1,
    summary: "",
    ...d,
  };
}

export function docSource(d: KnowledgeDoc): SourceRef {
  const s: SourceRef = { type: d.kind, id: d.id, title: d.title, path: d.source };
  if (d.section) s.section = d.section;
  if (d.policy_id) {
    s.policy_id = d.policy_id;
    if (d.policy_version !== null) s.policy_version = d.policy_version;
  }
  return s;
}

/** Control IDs in text that exist in the Control Library, in order of first appearance. */
export function realControlIds(text: string): string[] {
  const out: string[] = [];
  for (const m of (text || "").matchAll(/\b(AO|EI|GL|IS|SE)-(\d{2})\b/gi)) {
    const cid = `${(m[1] ?? "").toUpperCase()}-${m[2] ?? ""}`;
    if (getControl(cid) && !out.includes(cid)) out.push(cid);
  }
  return out;
}

/** Python str() for YAML scalars. */
function pyStr(v: unknown): string {
  if (typeof v === "boolean") return v ? "True" : "False";
  if (v === null || v === undefined) return "None";
  return String(v);
}

function isScalar(v: unknown): v is string | number {
  return typeof v === "string" || typeof v === "number";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mapsText(c: AegisControl): string {
  return Object.entries(c.mappings ?? {})
    .filter(([, v]) => Array.isArray(v) && v.length)
    .map(
      ([k, v]) => `${FRAMEWORK_LABELS[k as FrameworkKey] ?? k} ${(v ?? []).map(String).join(", ")}`,
    )
    .join("; ");
}

const CONTROLS_PATH = "content/controls/controls.yaml";
export const MATURITY_PATH = "content/assessment_templates/maturity_self_assessment.yaml";
const USE_CASE_PATH = "content/assessment_templates/use_case_assessment.yaml";

function controlDocs(): KnowledgeDoc[] {
  const ver = controlLibrary.version;
  const pillarNames = new Map(pillars.map((p) => [p.id, p.name]));
  return controls.map((c) =>
    makeDoc({
      id: c.id,
      kind: "control",
      title: `${c.id} ${c.title}`,
      text:
        `${c.id} ${c.id} ${c.title}. ${c.title}. Pillar: ${pillarNames.get(c.pillar) ?? c.pillar}. ` +
        `Objective: ${c.objective} Evidence: ${(c.evidence ?? []).join("; ")}. ` +
        `Owner: ${c.owner_role ?? ""}. Priority: ${c.priority ?? ""}. Applies to: ${c.applies_to ?? ""}. ` +
        `Domains: ${(c.domains ?? []).join(", ")}. Mappings: ${mapsText(c)}.`,
      source: CONTROLS_PATH,
      section: `Control Library v${ver}`,
      control_ids: [c.id],
      boost: 1.25,
    }),
  );
}

export interface MaturityQuestion {
  id: string;
  text: string;
  action?: string;
  domain?: string;
  controls?: string[];
}
interface MaturityFlag {
  id: string;
  title: string;
  rationale?: string;
  controls?: string[];
  when?: { question?: string };
}

export const maturityQuestions: MaturityQuestion[] = (maturityTemplate?.questions ??
  []) as MaturityQuestion[];

function maturityDocs(): KnowledgeDoc[] {
  const ver = String(maturityTemplate?.template?.version ?? "");
  const docs: KnowledgeDoc[] = maturityQuestions.map((q) =>
    makeDoc({
      id: q.id,
      kind: "maturity_question",
      title: `${q.id}: ${q.text}`,
      text: `${q.id} ${q.text} Recommended action: ${q.action ?? ""} Domain: ${q.domain ?? ""}.`,
      source: MATURITY_PATH,
      section: `Maturity Self-Assessment v${ver}`,
      control_ids: [...(q.controls ?? [])],
      question_ids: [q.id],
    }),
  );
  for (const f of (maturityTemplate?.critical_flags ?? []) as MaturityFlag[]) {
    docs.push(
      makeDoc({
        id: f.id,
        kind: "critical_flag",
        title: `${f.id}: ${f.title}`,
        text: `${f.title}. ${f.rationale ?? ""}`,
        source: MATURITY_PATH,
        section: `Maturity Self-Assessment v${ver} critical flags`,
        control_ids: [...(f.controls ?? [])],
        question_ids: f.when?.question ? [f.when.question] : [],
      }),
    );
  }
  return docs;
}

interface UseCaseQuestionRaw {
  id: string;
  text: string;
  controls?: string[];
  evidence_expected?: string[];
  remediation?: string;
}

function questionBankDocs(): KnowledgeDoc[] {
  const ver = String(useCaseTemplate?.template?.version ?? "");
  const docs: KnowledgeDoc[] = [];
  for (const m of (useCaseTemplate?.modules ?? []) as Array<{
    name: string;
    questions?: UseCaseQuestionRaw[];
  }>) {
    for (const q of m.questions ?? []) {
      docs.push(
        makeDoc({
          id: q.id,
          kind: "use_case_question",
          title: `${q.id}: ${q.text}`,
          text:
            `${q.id} ${q.text} Module: ${m.name}. Evidence expected: ` +
            `${(q.evidence_expected ?? []).join("; ")}. Remediation: ${q.remediation ?? ""}`,
          source: USE_CASE_PATH,
          section: `Use-Case Assessment v${ver} / ${m.name}`,
          control_ids: [...(q.controls ?? [])],
          question_ids: [q.id],
        }),
      );
    }
  }
  return docs;
}

function findMeta(data: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) if (k in data && isScalar(data[k])) return pyStr(data[k]);
  for (const v of Object.values(data)) {
    if (isRecord(v)) for (const k of keys) if (k in v && isScalar(v[k])) return pyStr(v[k]);
  }
  return null;
}

function flatten(obj: unknown, prefix = ""): string[] {
  const out: string[] = [];
  if (isRecord(obj)) {
    for (const [k, v] of Object.entries(obj)) out.push(...flatten(v, k));
  } else if (Array.isArray(obj)) {
    for (const v of obj) out.push(...flatten(v, prefix));
  } else if (obj !== null && obj !== undefined && typeof obj !== "boolean") {
    const s = pyStr(obj).trim();
    if (s) out.push(prefix ? `${prefix.replaceAll("_", " ")}: ${s}` : s);
  }
  return out;
}

function* ruleItems(
  data: unknown,
  path = "",
  depth = 0,
): Generator<[string, Record<string, unknown>]> {
  if (depth > 4) return;
  if (isRecord(data)) {
    for (const [k, v] of Object.entries(data))
      yield* ruleItems(v, path ? `${path}.${k}` : k, depth + 1);
  } else if (Array.isArray(data)) {
    for (const item of data) {
      if (isRecord(item) && (typeof item["id"] === "string" || typeof item["id"] === "number")) {
        yield [path, item];
      } else if (isRecord(item) || Array.isArray(item)) {
        yield* ruleItems(item, path, depth + 1);
      }
    }
  }
}

/** Relative platform path ("content/policy_packs/x.yaml") from a glob key. */
function platformPath(globKey: string): string {
  const i = globKey.indexOf("platform/");
  return i >= 0 ? globKey.slice(i + "platform/".length) : globKey;
}

function stemOf(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.[^.]+$/, "");
}

export interface PackFile {
  path: string;
  stem: string;
  data: Record<string, unknown>;
}

function loadPacks(files: Record<string, string>): PackFile[] {
  const out: PackFile[] = [];
  for (const key of Object.keys(files).sort()) {
    try {
      const data: unknown = parse(files[key] ?? "");
      if (isRecord(data)) out.push({ path: platformPath(key), stem: stemOf(key), data });
    } catch {
      // malformed pack: skipped, as the Python loader does
    }
  }
  return out;
}

export const policyPacks: PackFile[] = loadPacks(policyPackFiles);
export const industryPacks: PackFile[] = loadPacks(industryPackFiles);

function packDocs(packs: PackFile[], kind: "policy_pack" | "industry_pack"): KnowledgeDoc[] {
  const docs: KnowledgeDoc[] = [];
  for (const { path, stem: fileStem, data } of packs) {
    const pid = findMeta(data, ["policy_id", "pack_id", "id"]) ?? fileStem;
    const ver = findMeta(data, ["version", "policy_version"]);
    const title = findMeta(data, ["policy_name", "name", "title"]) ?? pid;
    const label = kind === "policy_pack" ? "runtime policy pack" : "industry pack";
    const headParts = [`${title} ${label} ${pid}`];
    for (const [key, val] of Object.entries(data)) {
      if (isScalar(val)) headParts.push(`${key.replaceAll("_", " ")}: ${pyStr(val)}`);
      else if (isRecord(val)) {
        for (const [k2, v2] of Object.entries(val)) {
          if (isScalar(v2)) headParts.push(`${k2.replaceAll("_", " ")}: ${pyStr(v2)}`);
        }
      }
    }
    const head = headParts.join(". ");
    const pol =
      kind === "policy_pack"
        ? { policy_id: pid, policy_version: ver }
        : { policy_id: null, policy_version: null };
    const desc = findMeta(data, ["description", "summary", "purpose"]);
    const status = data["status"];
    const statusTxt = status ? `, status: ${pyStr(status)}` : "";
    docs.push(
      makeDoc({
        id: pid,
        kind,
        title: `${title} (${label})`,
        text: head.slice(0, 6000),
        source: path,
        control_ids: realControlIds(flatten(data).join(" ")),
        boost: 1.3,
        summary: desc
          ? `${title} (${label}${statusTxt}): ${desc.split(/\s+/).filter(Boolean).join(" ").slice(0, 400)}`
          : "",
        ...pol,
      }),
    );
    for (const [key, val] of Object.entries(data)) {
      if ((Array.isArray(val) || isRecord(val)) && key !== "rules") {
        const stext = flatten(val).join(" ");
        if (stext.length < 40) continue;
        docs.push(
          makeDoc({
            id: `${pid}#${key}`,
            kind: `${kind}_section`,
            title: `${title} — ${key.replaceAll("_", " ")}`,
            text: `${title} ${label} ${key.replaceAll("_", " ")}. ${stext}`.slice(0, 8000),
            source: path,
            section: key,
            control_ids: realControlIds(stext),
            ...pol,
          }),
        );
      }
    }
    for (const [rpath, r] of ruleItems(data)) {
      const rid = pyStr(r["id"]);
      const rtext = flatten(r).join(" ");
      const rawDesc = r["description"] || r["text"] || r["name"] || "";
      const rdesc = pyStr(rawDesc).trim();
      const bits = [r["action"], r["tool"], r["type"]].filter(
        (x): x is string => typeof x === "string",
      );
      const cites = (Array.isArray(r["citations"]) ? (r["citations"] as unknown[]) : []).filter(
        (c): c is string => typeof c === "string",
      );
      const summ =
        `rule ${rid}` +
        (bits.length ? ` (${bits.join(" ")})` : "") +
        (rdesc ? `: ${rdesc}` : "") +
        (cites.length ? ` [${cites.join(", ")}]` : "");
      docs.push(
        makeDoc({
          id: `${pid}#${rid}`,
          kind: `${kind}_rule`,
          title: `${title} — ${rid}`,
          text: `${title} ${rpath.replaceAll(".", " ")} ${rtext}`.slice(0, 6000),
          source: path,
          section: `${rpath}: ${rid}`,
          control_ids: realControlIds(rtext),
          summary: summ,
          boost: 1.15,
          ...pol,
        }),
      );
    }
  }
  return docs;
}

function titleCase(s: string): string {
  return s.replace(/[A-Za-z]+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function markdownDocs(raw: string, path: string, kind: string): KnowledgeDoc[] {
  const txt = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  const fileStem = stemOf(path);
  const chunks: Array<[string, string[]]> = [];
  let title = titleCase(fileStem.replaceAll("_", " "));
  let current = title;
  let buf: string[] = [];
  for (const line of txt.split(/\r?\n/)) {
    const m = /^(#{1,4})\s+(.*)/.exec(line);
    if (m) {
      if (buf.some((b) => b.trim())) chunks.push([current, buf]);
      current = (m[2] ?? "").trim();
      buf = [];
      if (m[1] === "#") title = current;
    } else {
      buf.push(line);
    }
  }
  if (buf.some((b) => b.trim())) chunks.push([current, buf]);
  return chunks.map(([sec, lines], i) => {
    const body = lines.join("\n").trim();
    return makeDoc({
      id: `${fileStem}#${i + 1}`,
      kind,
      title: sec !== title ? `${title} — ${sec}` : title,
      text: `${sec}. ${body}`.slice(0, 8000),
      source: path,
      section: sec,
      control_ids: realControlIds(body),
    });
  });
}

export function buildCorpus(): KnowledgeDoc[] {
  return [
    ...controlDocs(),
    ...maturityDocs(),
    ...questionBankDocs(),
    ...packDocs(policyPacks, "policy_pack"),
    ...packDocs(industryPacks, "industry_pack"),
    ...markdownDocs(aegisFrameworkMd, "content/aegis_framework.md", "content_doc"),
    ...markdownDocs(maturityModelMd, "content/maturity_model.md", "content_doc"),
    ...markdownDocs(pillarsMd, "content/pillars.md", "content_doc"),
    ...markdownDocs(complianceMappingMd, "docs/COMPLIANCE_MAPPING.md", "compliance_mapping"),
  ];
}

// --------------------------------------------------------------------------- BM25
export interface SearchHit {
  doc: KnowledgeDoc;
  score: number;
  coverage: number;
  matched: string[];
}

function round(x: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

export class BM25Index {
  readonly docs: KnowledgeDoc[];
  private readonly tfs: Array<Map<string, number>>;
  private readonly lens: number[];
  private readonly avgdl: number;
  private readonly idf: Map<string, number>;

  constructor(
    docs: KnowledgeDoc[],
    private readonly k1 = 1.4,
    private readonly b = 0.75,
  ) {
    this.docs = docs;
    const df = new Map<string, number>();
    this.tfs = docs.map((d) => {
      const titleToks = tokenize(d.title);
      const tf = new Map<string, number>();
      for (const t of [...titleToks, ...titleToks, ...tokenize(d.text)])
        tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
      return tf;
    });
    this.lens = this.tfs.map((tf) => [...tf.values()].reduce((a, n) => a + n, 0));
    this.avgdl = this.lens.length ? this.lens.reduce((a, n) => a + n, 0) / this.lens.length : 1;
    const n = docs.length;
    this.idf = new Map([...df].map(([t, f]) => [t, Math.log(1 + (n - f + 0.5) / (f + 0.5))]));
  }

  search(query: string, k = 8, kinds?: ReadonlySet<string>): SearchHit[] {
    const qTerms = tokenize(query, true);
    const baseTerms = new Set(tokenize(query));
    if (!qTerms.length) return [];
    const uniq = [...new Set(qTerms)];
    const results: SearchHit[] = [];
    this.docs.forEach((d, i) => {
      if (kinds && kinds.size && !kinds.has(d.kind)) return;
      const tf = this.tfs[i] ?? new Map<string, number>();
      const len = this.lens[i] ?? 0;
      let score = 0;
      for (const t of uniq) {
        const f = tf.get(t);
        if (!f) continue;
        const w = baseTerms.has(t) ? 1.0 : 0.4; // synonym expansions count less
        const denom = f + this.k1 * (1 - this.b + (this.b * len) / this.avgdl);
        score += (w * (this.idf.get(t) ?? 0) * f * (this.k1 + 1)) / denom;
      }
      if (score <= 0) return;
      score *= d.boost;
      const matched = [...baseTerms].filter(
        (t) => tf.has(t) || synonymsOf(t).some((x) => tf.has(stem(x))),
      );
      const coverage = matched.length / Math.max(1, baseTerms.size);
      results.push({
        doc: d,
        score: round(score, 4),
        coverage: round(coverage, 3),
        matched: matched.sort(),
      });
    });
    results.sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.doc.id < b.doc.id
          ? -1
          : a.doc.id > b.doc.id
            ? 1
            : 0,
    );
    return results.slice(0, k);
  }
}

let index: BM25Index | null = null;

/** Lazily built, module-level index (content is static in the browser bundle). */
export function getIndex(): BM25Index {
  if (!index) index = new BM25Index(buildCorpus());
  return index;
}

export type Band = "high" | "medium" | "low";

/** Heuristic confidence from coverage of query terms and absolute BM25 score. */
export function confidenceBand(top: SearchHit | undefined, query: string): [Band, number] {
  if (!top) return ["low", 0];
  const nTerms = new Set(tokenize(query)).size;
  const { coverage: cov, score } = top;
  const conf = round(Math.min(1, 0.6 * cov + 0.4 * Math.min(1, score / 12)), 3);
  if (cov >= 0.5 && score >= 5) return ["high", conf];
  if ((cov >= 0.34 && score >= 3) || (nTerms <= 2 && cov >= 0.5 && score >= 2.5))
    return ["medium", conf];
  return ["low", conf];
}

export interface KnowledgeResult {
  query: string;
  confidence: number;
  band: Band;
  results: SearchHit[];
}

/** The `search_aegis_knowledge` tool. */
export function searchKnowledge(query: string, k = 5, kinds?: string[]): KnowledgeResult {
  const res = getIndex().search(query, k, kinds ? new Set(kinds) : undefined);
  const [band, confidence] = confidenceBand(res[0], query);
  return { query, confidence, band, results: res };
}

export function inGovernanceScope(text: string): boolean {
  const t = text || "";
  if (CONTROL_ID_RE.test(t) || MATURITY_QID_RE.test(t) || UC_QID_RE.test(t)) return true;
  const words = t.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.some((w) => GOVERNANCE_VOCAB.has(w));
}

// --------------------------------------------------------------------------- framework lookup
const EU_RE = /\b(?:art(?:icle)?s?\.?\s*)(\d{1,3})\b/gi;
const ISO_ANNEX_RE = /\bA\.\d{1,2}(?:\.\d{1,2}){0,2}\b/gi;
const ISO_CLAUSE_RE = /\b(?:clause|cl\.?|section)\s*(\d{1,2}(?:\.\d{1,2}){0,2})\b/gi;
const ISO_BARE_RE = /(?<![\w.:/])\d{1,2}\.\d{1,2}(?:\.\d{1,2})?(?![\w.]*\d{3})\b/g;
const NIST_RE = /\b(GOVERN|MAP|MEASURE|MANAGE)(?:\s+(\d{1,2}(?:\.\d{1,2})?))?\b/gi;

export function detectFrameworks(text: string): Set<FrameworkKey> {
  const t = (text || "").toLowerCase();
  const out = new Set<FrameworkKey>();
  if (
    /\beu\s*ai\s*act\b|\bai act\b|regulation \(eu\) 2024\/1689|\bartificial intelligence act\b/.test(
      t,
    )
  )
    out.add("eu_ai_act");
  if (/\biso(\/iec)?\s*42001\b|\b42001\b/.test(t)) out.add("iso_42001");
  if (/\bnist\b|\bai\s*rmf\b/.test(t)) out.add("nist_ai_rmf");
  if (
    /\b(GOVERN|MAP|MEASURE|MANAGE)(?:\s+(\d{1,2}(?:\.\d{1,2})?))?\b/i.test(text || "") &&
    /\b(GOVERN|MEASURE|MANAGE)\b/.test(text || "")
  )
    out.add("nist_ai_rmf");
  return out;
}

/** Extract (framework, reference) pairs, e.g. ['eu_ai_act','Art. 14'], ['iso_42001','A.6.2.8']. */
export function parseFrameworkRefs(text: string): Array<[FrameworkKey, string]> {
  const s = text || "";
  const fws = detectFrameworks(s);
  const refs: Array<[FrameworkKey, string]> = [];
  if (fws.has("eu_ai_act") || /\barticle\s+\d/i.test(s)) {
    for (const m of s.matchAll(EU_RE))
      refs.push(["eu_ai_act", `Art. ${parseInt(m[1] ?? "0", 10)}`]);
  }
  if (fws.has("iso_42001") || /\bA\.\d{1,2}(?:\.\d{1,2}){0,2}\b/i.test(s)) {
    for (const m of s.matchAll(ISO_ANNEX_RE)) refs.push(["iso_42001", m[0].toUpperCase()]);
    for (const m of s.matchAll(ISO_CLAUSE_RE)) refs.push(["iso_42001", m[1] ?? ""]);
    if (fws.has("iso_42001")) {
      const nistSpans = [...s.matchAll(NIST_RE)]
        .filter((m) => m[2])
        .map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length] as const);
      for (const m of s.matchAll(ISO_BARE_RE)) {
        const start = m.index ?? 0;
        if (nistSpans.some(([a, b]) => a <= start && start < b)) continue;
        refs.push(["iso_42001", m[0]]);
      }
    }
  }
  for (const m of s.matchAll(NIST_RE)) {
    const word = m[1] ?? "";
    // "map"/"manage" are common English words: require upper case or a NIST context.
    if (word === word.toUpperCase() || fws.has("nist_ai_rmf")) {
      refs.push(["nist_ai_rmf", word.toUpperCase() + (m[2] ? ` ${m[2]}` : "")]);
    }
  }
  const seen = new Set<string>();
  return refs.filter(([fw, ref]) => {
    const key = `${fw}|${ref}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function refMatches(framework: FrameworkKey, wanted: string, actual: string): boolean {
  let a = String(actual).trim();
  let w = String(wanted).trim();
  if (framework === "eu_ai_act") return a.toLowerCase() === w.toLowerCase();
  a = a.toUpperCase();
  w = w.toUpperCase();
  if (framework === "nist_ai_rmf") return a === w || a.startsWith(`${w}.`) || a.startsWith(`${w} `);
  // ISO: exact or hierarchical prefix (A.6 matches A.6.2.8; 9 matches 9.1)
  return a === w || a.startsWith(`${w}.`);
}

export function controlsForFrameworkRef(framework: FrameworkKey, ref: string): AegisControl[] {
  return controls.filter((c) =>
    (c.mappings?.[framework] ?? []).some((actual) => refMatches(framework, ref, String(actual))),
  );
}

export function controlsForFramework(framework: FrameworkKey): AegisControl[] {
  return controls.filter((c) => (c.mappings?.[framework] ?? []).length > 0);
}
