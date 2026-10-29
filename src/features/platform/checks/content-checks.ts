/*
 * VERITRAIL content integrity checks (pure) — ports of platform/scripts/check_content.py and
 * platform/scripts/check_website_pages.py, using the shared prohibited-claim guard
 * (findProhibitedClaims, the port of veritrail_common.evidence.find_prohibited_claims) and the
 * Runtime Shield policy validator (validatePolicy, the port of veritrail_policy.schema).
 *
 * The functions take the content as {path, text} files (paths relative to platform/, e.g.
 * "content/controls/controls.yaml"), so they run in the browser on the bundled content, in
 * vitest, or on any other file set. Scope on the hosted site: controls.yaml, the assessment
 * templates, policy packs, industry packs, website pages and email_templates.yaml. The Python
 * script additionally scans docs/, app/ and output/, which are not bundled into the website.
 */
import { parse } from "yaml";
import { findProhibitedClaims } from "@/features/site/engines/ask-veritrail/safety";
import { validatePolicy } from "@/features/site/engines/shield/schema";
import { pyStrip } from "@/features/site/engines/shield/py";

export interface ContentFile {
  /** Path relative to platform/, with forward slashes. */
  path: string;
  text: string;
}

export interface CheckStep {
  /** "[1]".."[6]" for check_content, "pages" for the website check. */
  id: string;
  title: string;
  /** The line the Python script prints for this step. */
  line: string;
  ok: boolean;
  errors: string[];
}

export interface CheckReport {
  script: string;
  ok: boolean;
  steps: CheckStep[];
  errors: string[];
  warnings: string[];
  /** Script-style console output. */
  output: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- YAML documents are untyped data */
type Yaml = any;

const CTRL_RE = /\b(AO|EI|GL|IS|SE)-(\d{2})\b/g;
const INSTRUCTIONAL = new RegExp(
  "never|must not|do not|don't|prohibit|avoid|banned|trap|refus|forbid|not allowed|" +
    "no .{0,20}claim|claims? (like|such as)|e\\.g\\.|example of|should not|rather than|instead of|" +
    '"[^"]*(compliant|certified|guarantee|regulator-approved)[^"]*"|' +
    "'[^']*(compliant|certified|guarantee|regulator-approved)[^']*'|" +
    "`[^`]*(compliant|certified|guarantee|regulator-approved)[^`]*`",
  "i",
);

/** Python str.splitlines() (no trailing empty element). */
export function splitlines(text: string): string[] {
  // eslint-disable-next-line no-control-regex -- Python splitlines() boundaries
  const parts = text.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/);
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts;
}

const ext = (p: string) => p.slice(p.lastIndexOf("."));
const baseName = (p: string) => p.slice(p.lastIndexOf("/") + 1);
const under = (p: string, dir: string) => p.startsWith(dir.endsWith("/") ? dir : dir + "/");
const SKIP_DIRS = new Set(["dist", "__pycache__", "node_modules", ".git", "fixtures"]);
const skipped = (p: string) => p.split("/").some((part) => SKIP_DIRS.has(part));

function selectFiles(files: ContentFile[], dir: string, exts: string[]): ContentFile[] {
  return files.filter((f) => under(f.path, dir) && exts.includes(ext(f.path)) && !skipped(f.path));
}

function lstripChars(s: string, chars: string): string {
  let i = 0;
  while (i < s.length && chars.includes(s[i] ?? "")) i++;
  return s.slice(i);
}

/** Paragraph-aware prohibited-claim scan of one file (check_content.py step 6). */
export function scanProhibitedClaims(file: ContentFile): string[] {
  const hits: string[] = [];
  const lines = splitlines(file.text);
  let block: string[] = [];
  let start = 1;
  const all = [...lines, ""];
  all.forEach((line, idx) => {
    const i = idx + 1;
    const t = pyStrip(line);
    if (t && !["|", "#", "- ", "* "].some((p) => t.startsWith(p))) {
      if (!block.length) start = i;
      block.push(pyStrip(lstripChars(t, "> ")));
      return;
    }
    const chunks: Array<{ text: string; lineChunk: boolean }> = block.length
      ? [{ text: block.join(" "), lineChunk: false }]
      : [];
    block = [];
    if (t) chunks.push({ text: t, lineChunk: true });
    for (const chunk of chunks) {
      // Python reports the line number only when `chunk is line.strip()` (no surrounding space).
      const at = chunk.lineChunk && t === line ? i : start;
      for (const sent of chunk.text.split(/(?<=[.!?])\s+/)) {
        if (INSTRUCTIONAL.test(sent)) continue;
        for (const h of findProhibitedClaims(sent)) {
          hits.push(`${file.path}:${at}: ${Array.from(h).slice(0, 140).join("")}`);
        }
      }
    }
  });
  return hits;
}

/** check_content.py: steps [1]–[6]; exit code 1 (ok=false) on any failure. */
export function runContentChecks(files: ContentFile[]): CheckReport {
  const errors: string[] = [];
  const steps: CheckStep[] = [];
  const get = (p: string) => files.find((f) => f.path === p);
  const step = (id: string, title: string, line: string, errs: string[]) => {
    steps.push({ id, title, line: `${id} ${line}`, ok: errs.length === 0, errors: errs });
    errors.push(...errs);
  };

  // [1] control library
  const libFile = get("content/controls/controls.yaml");
  const library: Yaml = libFile ? parse(libFile.text) : { controls: [] };
  const lib = new Map<string, Yaml>();
  const dupes: string[] = [];
  for (const c of library?.controls ?? []) {
    if (lib.has(c.id)) dupes.push(`duplicate control ID ${c.id}`);
    lib.set(c.id, c);
  }
  step(
    "[1]",
    "Control library",
    `control library: ${lib.size} controls`,
    libFile ? dupes : ["control library content/controls/controls.yaml missing"],
  );

  // [2] self-assessment template
  const tplFile = get("content/assessment_templates/maturity_self_assessment.yaml");
  const t: Yaml = tplFile ? parse(tplFile.text) : { questions: [], domains: [], readiness_groups: [] };
  const e2: string[] = [];
  const qids = new Set<string>((t.questions ?? []).map((q: Yaml) => q.id));
  const weightSum = (t.domains ?? []).reduce((a: number, d: Yaml) => a + Number(d.weight), 0);
  if ((t.questions ?? []).length !== 24 || (t.domains ?? []).length !== 8 || weightSum !== 100) {
    e2.push("assessment template shape invalid");
  }
  for (const fw of t.readiness_groups ?? []) {
    for (const g of fw.groups ?? []) {
      for (const q of g.questions ?? []) {
        if (!qids.has(q)) e2.push(`readiness group ${g.id} unknown question ${q}`);
      }
    }
  }
  step(
    "[2]",
    "Self-assessment template",
    `self-assessment template: ${(t.questions ?? []).length} questions`,
    e2,
  );

  // [3] every control ID referenced in content exists
  let nRefs = 0;
  const badRefs = new Map<string, Set<string>>();
  for (const f of selectFiles(files, "content", [".md", ".yaml", ".yml", ".csv", ".py"])) {
    for (const m of f.text.matchAll(CTRL_RE)) {
      nRefs++;
      const cid = m[0];
      if (!lib.has(cid) && !cid.endsWith("-00") && !/(XX|NN)-/.test(cid)) {
        if (!badRefs.has(cid)) badRefs.set(cid, new Set());
        badRefs.get(cid)?.add(f.path);
      }
    }
  }
  const e3 = [...badRefs.keys()]
    .sort()
    .map((cid) => `unknown control ID ${cid} in ${[...(badRefs.get(cid) ?? [])].sort().join(", ")}`);
  step(
    "[3]",
    "Control references",
    `control references scanned: ${nRefs}, unknown: ${badRefs.size}`,
    e3,
  );

  // [4] website page front matter
  const e4: string[] = [];
  const slugs = new Map<unknown, string>();
  const pages = files
    .filter((f) => /^content\/website_pages\/[^/]+\.md$/.test(f.path))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const p of pages) {
    const name = baseName(p.path);
    if (name.toLowerCase() === "readme.md") continue;
    const m = /^---\n([\s\S]*?)\n---\n/.exec(p.text);
    if (!m) {
      e4.push(`${name}: missing front matter`);
      continue;
    }
    const fm: Yaml = parse(m[1] ?? "") ?? {};
    for (const k of ["title", "slug", "description", "section", "template"]) {
      if (!fm[k]) e4.push(`${name}: front matter missing '${k}'`);
    }
    const s = fm.slug;
    if (slugs.has(s)) e4.push(`duplicate slug ${String(s)} in ${name} and ${slugs.get(s)}`);
    slugs.set(s, name);
  }
  step("[4]", "Website pages", `website pages: ${slugs.size}`, e4);

  // [5] policy packs validate against the policy schema
  const packs = files
    .filter((f) => /^content\/policy_packs\/[^/]+\.ya?ml$/.test(f.path))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
  const e5: string[] = [];
  for (const p of packs) {
    for (const e of validatePolicy(parse(p.text))) e5.push(`policy pack ${baseName(p.path)}: ${e}`);
  }
  step("[5]", "Policy packs", `policy packs validated: ${packs.length}`, e5);

  // [6] prohibited-claim scan
  const hits = selectFiles(files, "content", [".md", ".yaml", ".yml"]).flatMap(scanProhibitedClaims);
  step(
    "[6]",
    "Prohibited-claim scan",
    `prohibited-claim scan: ${hits.length} hit(s)`,
    hits.map((h) => `prohibited claim: ${h}`),
  );

  const out = steps.map((s) => s.line);
  if (errors.length) {
    out.push("", "FAILURES:", ...errors.map((e) => `  - ${e}`));
  } else {
    out.push("", "All content checks passed.");
  }
  return {
    script: "scripts/check_content.py",
    ok: errors.length === 0,
    steps,
    errors,
    warnings: [],
    output: out.join("\n"),
  };
}

// --------------------------------------------------------------------------- website pages

const FM = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n/;
const REQ = [
  "title",
  "slug",
  "description",
  "section",
  "nav_label",
  "nav_order",
  "template",
  "schema_type",
  "updated",
];
const CTA = new Set(["assessment", "baseline", "agent", "blueprint", "demo", "guardrails"]);
const GENERATED = new Set(["/framework/controls/"]);
/** Pages carry a real revision date: no earlier than the launch build, never in the future. */
export const PAGES_LAUNCH = "2026-10-21";

function validRevisionDate(value: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === value &&
    value >= PAGES_LAUNCH &&
    value <= today
  );
}

export interface PageRow {
  name: string;
  slug: string;
  section: string;
  template: string;
  words: number;
  faq: number;
}

export interface WebsitePagesReport extends CheckReport {
  rows: PageRow[];
}

const cpLen = (s: string) => Array.from(s).length;

/** Python str() of a scalar YAML value (dates are already strings in YAML 1.2). */
function pyScalar(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  return String(v);
}

/** check_website_pages.py over content/website_pages/*.md. */
export function runWebsitePageChecks(
  files: ContentFile[],
  controlIds: ReadonlySet<string>,
): WebsitePagesReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: PageRow[] = [];
  const pages = new Map<string, [Yaml, string]>();
  const sorted = files
    .filter((f) => /^content\/website_pages\/[^/]+\.md$/.test(f.path))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const f of sorted) {
    const name = baseName(f.path);
    if (name === "README.md") continue;
    const m = FM.exec(f.text);
    if (!m) {
      errors.push(`${name}: no front matter`);
      continue;
    }
    const meta: Yaml = parse(m[1] ?? "") ?? {};
    const body = f.text.slice(m[0].length);
    pages.set(name, [meta, body]);
    for (const k of REQ) if (!(k in meta)) errors.push(`${name}: missing ${k}`);
    if (!validRevisionDate(pyScalar(meta.updated), new Date().toISOString().slice(0, 10))) {
      errors.push(`${name}: updated=${pyScalar(meta.updated)}`);
    }
    const slug: string = String(meta.slug);
    const expected = slug === "/" ? "index.md" : slug.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") + ".md";
    if (name !== expected) errors.push(`${name}: filename should be ${expected}`);
    const d = String(meta.description ?? "");
    if (!(cpLen(d) >= 120 && cpLen(d) <= 160)) errors.push(`${name}: description ${cpLen(d)} chars`);
    for (const k of ["primary_cta", "secondary_cta"]) {
      if (meta[k] && !CTA.has(meta[k])) errors.push(`${name}: bad ${k}`);
    }
    if (meta.template === "tool" && !meta.tool) errors.push(`${name}: tool missing`);
    if (meta.template === "form" && !meta.form) errors.push(`${name}: form missing`);
    for (const mm of body.matchAll(/\{\{cta:([a-z]+)\}\}/g)) {
      if (!CTA.has(mm[1] ?? "")) errors.push(`${name}: bad cta shortcode ${mm[1]}`);
    }
    for (const mm of body.matchAll(/\{\{([^}]*)\}\}/g)) {
      const sc = mm[1] ?? "";
      if (!(sc === "disclaimer" || sc.startsWith("cta:") || sc.startsWith("controls:"))) {
        errors.push(`${name}: unknown shortcode ${sc}`);
      }
    }
    for (const mm of body.matchAll(/\{\{controls:([^}]*)\}\}/g)) {
      for (const cid of (mm[1] ?? "").split(",")) {
        if (!controlIds.has(pyStrip(cid))) errors.push(`${name}: unknown control in shortcode ${cid}`);
      }
    }
    const allText = (m[1] ?? "") + body;
    for (const mm of allText.matchAll(/\b(?:AO|EI|GL|IS|SE)-\d{2}\b/g)) {
      if (!controlIds.has(mm[0])) errors.push(`${name}: unknown control ID ${mm[0]}`);
    }
    const faqs: Array<{ q: string; a: string }> = Array.isArray(meta.faq) ? meta.faq : [];
    const claims = [
      ...findProhibitedClaims(body),
      ...faqs.flatMap((faq) => findProhibitedClaims(`${faq.a} ${faq.q}`)),
    ];
    for (const c of claims) {
      errors.push(`${name}: prohibited claim: ${Array.from(c).slice(0, 140).join("")}`);
    }
    if (/\ban VERITRAIL\b/.test(allText))
      errors.push(`${name}: style: 'an VERITRAIL' should be 'a VERITRAIL'`);
    const words = (
      body.replace(/\{\{[^}]*\}\}/g, "").match(/[A-Za-z0-9][\p{L}\p{N}_'’/-]*/gu) ?? []
    ).length;
    rows.push({
      name,
      slug,
      section: String(meta.section),
      template: String(meta.template),
      words,
      faq: faqs.length,
    });
  }

  const slugs = [...pages.values()].map(([meta]) => String(meta.slug));
  const dups = [...new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))];
  if (dups.length) errors.push(`duplicate slugs: {${dups.map((s) => `'${s}'`).join(", ")}}`);
  const valid = new Set([...slugs, ...GENERATED]);
  for (const [name, [meta, body]] of pages) {
    for (const mm of body.matchAll(/\]\((\/[^)\s#]*)(?:#[^)]*)?\)/g)) {
      if (!valid.has(mm[1] ?? "")) errors.push(`${name}: broken internal link ${mm[1]}`);
    }
    for (const mm of body.matchAll(/\]\((https?:\/\/[^)]*)\)/g)) {
      warnings.push(`${name}: external link ${mm[1]}`);
    }
    if (
      (meta.template === "page" || meta.template === "home") &&
      !body.includes("{{cta:") &&
      meta.section !== "legal"
    ) {
      warnings.push(`${name}: no CTA shortcode in body`);
    }
  }

  const w = rows.map((r) => r.words);
  const summary =
    `pages=${rows.length} total_words=${w.reduce((a, b) => a + b, 0)} ` +
    `min=${w.length ? Math.min(...w) : 0} max=${w.length ? Math.max(...w) : 0}`;
  const out = [
    summary,
    ...warnings.map((x) => `WARN ${x}`),
    ...errors.map((e) => `ERROR ${e}`),
    `errors: ${errors.length}`,
  ];
  return {
    script: "scripts/check_website_pages.py",
    ok: errors.length === 0,
    steps: [
      { id: "pages", title: "Website pages", line: summary, ok: errors.length === 0, errors },
    ],
    errors,
    warnings,
    output: out.join("\n"),
    rows,
  };
}

/** Control IDs defined in the bundled controls.yaml (for the website page check). */
export function controlIdsFrom(files: ContentFile[]): Set<string> {
  const f = files.find((x) => x.path === "content/controls/controls.yaml");
  const lib: Yaml = f ? parse(f.text) : { controls: [] };
  return new Set<string>((lib?.controls ?? []).map((c: Yaml) => c.id));
}

/** Run both scripts. */
export function runAllChecks(files: ContentFile[]): [CheckReport, WebsitePagesReport] {
  return [runContentChecks(files), runWebsitePageChecks(files, controlIdsFrom(files))];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
