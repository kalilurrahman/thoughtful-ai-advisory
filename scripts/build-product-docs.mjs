#!/usr/bin/env node
// Build the product documentation index in docs/product/ from one source,
// docs/product/catalog.yaml, plus the governed content the site renders:
//
//   node scripts/build-product-docs.mjs           # write the generated files
//   node scripts/build-product-docs.mjs --check   # exit 1 if they are out of date
//
// Generated: README.md, CAPABILITIES_INDEX.md, EPICS_AND_STORIES.md, USE_CASES.md.
// PRD.md is written by hand and links to these. The website pages, control library and glossary
// are read from platform/content, so the index lists every page without editing the catalog.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const ROOT = process.cwd();
const OUT = join(ROOT, "docs", "product");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const catalog = parse(read("docs/product/catalog.yaml"));
const site = parse(read("platform/app/website/site.yaml"));
const library = parse(read("platform/content/controls/controls.yaml"));
const glossary = parse(read("platform/content/glossary.yaml"));

// ------------------------------------------------------------------ website pages
const FRONT_MATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const PAGE_DIR = "platform/content/website_pages";
const pages = readdirSync(join(ROOT, PAGE_DIR))
  .filter((f) => f.endsWith(".md"))
  .map((file) => {
    const text = read(`${PAGE_DIR}/${file}`);
    const m = FRONT_MATTER_RE.exec(text);
    if (!m) throw new Error(`${file}: missing front matter`);
    const meta = parse(m[1]) ?? {};
    const body = text.slice(m[0].length);
    const path = String(meta.slug ?? "/").replace(/\/+$/, "") || "/";
    return {
      file,
      path,
      h1: String(meta.h1 ?? meta.title ?? file),
      description: String(meta.description ?? ""),
      section: String(meta.section ?? "home"),
      template: String(meta.template ?? "page"),
      tool: meta.tool ? String(meta.tool) : "",
      noindex: meta.noindex === true,
      faqs: Array.isArray(meta.faq) ? meta.faq.length : 0,
      words: body
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*_`|[\]()-]+/g, " ")
        .split(/\s+/)
        .filter((w) => /[a-z0-9]/i.test(w)).length,
      order: Number(meta.nav_order ?? 100),
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

// ------------------------------------------------------------------ lookups
const personas = new Map(catalog.personas.map((p) => [p.id, p]));
const areas = new Map(catalog.areas.map((a) => [a.id, a]));
const epics = catalog.epics;
const stories = epics.flatMap((e) => e.stories.map((s) => ({ ...s, epic: e.id })));
const storyById = new Map(stories.map((s) => [s.id, s]));
const caps = catalog.capabilities;
const capByRoute = new Map(caps.filter((c) => c.route).map((c) => [c.route, c]));
const pageByPath = new Map(pages.map((p) => [p.path, p]));

/** The capability that delivers a route: its own, or the page template's. */
function capabilityFor(route) {
  const own = capByRoute.get(route);
  if (own) return own;
  const page = pageByPath.get(route);
  if (!page) return undefined;
  return capByRoute.get(page.template === "form" ? "/contact" : "/$");
}

const capById = new Map(caps.map((c) => [c.id, c]));

/** Capabilities a story touches: those serving its routes, plus any it lists itself. */
function capabilitiesForStory(story) {
  const found = new Set();
  for (const r of story.routes ?? []) {
    const c = capabilityFor(r);
    if (c) found.add(c);
  }
  for (const id of story.capabilities ?? []) {
    const c = capById.get(id);
    if (c) found.add(c);
  }
  return [...found].sort((a, b) => a.id.localeCompare(b.id));
}

const storiesForCapability = (cap) =>
  stories.filter((s) => capabilitiesForStory(s).includes(cap)).map((s) => s.id);

function storiesForRoute(route) {
  return stories.filter((s) => (s.routes ?? []).includes(route)).map((s) => s.id);
}

// ------------------------------------------------------------------ formatting helpers
const STATUS = {
  live: "Live",
  demo: "Demo",
  preview: "Preview",
  planned: "Planned",
  done: "Done",
  partial: "Partial",
};
const DATA = {
  none: "None",
  session: "Tab session",
  browser: "This browser",
  memory: "Page memory",
  cloud: "Cloud (RLS)",
  server: "Server",
};
const cell = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const code = (s) => (s ? `\`${s}\`` : "—");
const list = (xs, f = (x) => x) => (xs?.length ? xs.map(f).join(", ") : "—");
const personaName = (id) => personas.get(id)?.name ?? id;
/** "Prospective buyer" → "prospective buyer"; names with other capitals keep them. */
const inSentence = (name) =>
  /[A-Z]/.test(name.slice(1)) ? name : name[0].toLowerCase() + name.slice(1);
const article = (name) => (/^[aeiou]/i.test(name) ? "an" : "a");
/** GitHub's heading anchor: lower case, punctuation dropped, each space a hyphen. */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-");
const epicAnchor = (e) => slug(`${e.id} — ${e.title}`);
const ucAnchor = (u) => slug(`${u.id} — ${u.title}`);
const epicLink = (id, file = "EPICS_AND_STORIES.md") => {
  const e = epics.find((x) => x.id === id);
  return e ? `[${id}](${file}#${epicAnchor(e)})` : id;
};
const storyLink = (id, file = "EPICS_AND_STORIES.md") => `[${id}](${file}#${slug(id)})`;
const table = (head, rows) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`]
    .concat(rows.map((r) => `| ${r.map(cell).join(" | ")} |`))
    .join("\n");
const count = (xs, key) => xs.reduce((m, x) => m.set(x[key], (m.get(x[key]) ?? 0) + 1), new Map());
const GENERATED =
  "<!-- Generated by scripts/build-product-docs.mjs from docs/product/catalog.yaml and platform/content. Do not edit by hand. -->";

const contentPages = pages.filter((p) => !p.noindex);
const totalWords = contentPages.reduce((n, p) => n + p.words, 0);
const capStatus = count(caps, "status");
const storyStatus = count(stories, "status");
const gapCount = stories.reduce((n, s) => n + (s.gaps?.length ?? 0), 0);

// ------------------------------------------------------------------ README.md
function readme() {
  const statusLine = (m, keys) =>
    keys.map((k) => `${m.get(k) ?? 0} ${STATUS[k].toLowerCase()}`).join(", ");
  return `${GENERATED}

# VERITRAIL product index

Everything VERITRAIL offers — the public website, the free tools, the TILLER governance workspace,
the platform console and the installable app — described four ways, from one catalog.

| Document | What it answers |
|---|---|
| [Product requirements (PRD)](PRD.md) | Why VERITRAIL exists, for whom, what it must do and not do, and how success is measured |
| [Capabilities index](CAPABILITIES_INDEX.md) | Every app, tool and feature (${caps.length}) and every website page (${contentPages.length}), with route, status, data and tests |
| [Epics and user stories](EPICS_AND_STORIES.md) | ${epics.length} epics and ${stories.length} user stories with acceptance criteria and known gaps |
| [Use cases](USE_CASES.md) | ${catalog.use_cases.length} end-to-end use cases with flows, alternatives and traceability |

## At a glance

| Measure | Count |
|---|---|
| Capabilities | ${caps.length} (${statusLine(capStatus, ["live", "demo", "preview", "planned"])}) |
| Website content pages | ${contentPages.length} in ${new Set(contentPages.map((p) => p.section)).size} sections, about ${Math.round(totalWords / 1000)}k words |
| Controls in the library | ${library.controls.length} across ${library.pillars.length} pillars |
| Glossary terms | ${glossary.terms.length} in ${glossary.categories.length} topics |
| Epics / user stories | ${epics.length} / ${stories.length} (${statusLine(storyStatus, ["done", "partial", "planned"])}) |
| Use cases | ${catalog.use_cases.length} |
| Known gaps recorded against stories | ${gapCount} |

## Personas

${table(
  ["ID", "Persona", "Who they are", "Use cases"],
  catalog.personas.map((p) => [
    code(p.id),
    p.name,
    p.summary,
    list(
      catalog.use_cases.filter((u) => u.actors.includes(p.id)).map((u) => u.id),
      (id) => `[${id}](USE_CASES.md#${ucAnchor(catalog.use_cases.find((u) => u.id === id))})`,
    ),
  ]),
)}

## Status and data labels

| Label | Meaning |
|---|---|
| Live | Works for real: data is real, or computed from what the user enters |
| Demo | Works end to end on synthetic or sample data, in the browser |
| Preview | Produces output labelled a preview, not a signed or certified export |
| Planned | Designed and announced (waitlist), not built |
| Done / Partial | A story is fully met, or met with the gaps listed under it |

Data shows where a capability keeps state: **None**, **Tab session** (sessionStorage),
**This browser** (localStorage), **Page memory** (lost on reload), **Cloud (RLS)** (Supabase,
row-level security) or **Server** (a server function).

## Keeping it current

1. Edit [\`catalog.yaml\`](catalog.yaml) — personas, epics and stories, use cases and capabilities.
   Website pages, controls and glossary terms are read from \`platform/content\` automatically.
2. Run \`node scripts/build-product-docs.mjs\`.
3. \`npm test\` fails if a route, tool page or glossary has no capability, if a story, use case or
   test reference is broken, or if these files are out of date.
`;
}

// ------------------------------------------------------------------ CAPABILITIES_INDEX.md
function capabilitiesIndex() {
  const out = [GENERATED, "", "# VERITRAIL capabilities index", ""];
  out.push(
    `Every app, tool and feature, then every website content page, the control library and the glossary. Source: [\`catalog.yaml\`](catalog.yaml) and \`platform/content\`. See the [product index](README.md) for the status and data labels.`,
    "",
    "## Summary by area",
    "",
    table(
      ["Area", "Capabilities", "Live", "Demo", "Preview", "Planned"],
      catalog.areas
        .map((a) => {
          const inArea = caps.filter((c) => c.area === a.id);
          const by = count(inArea, "status");
          return [
            `[${a.name}](#${slug(a.name)})`,
            inArea.length,
            by.get("live") ?? 0,
            by.get("demo") ?? 0,
            by.get("preview") ?? 0,
            by.get("planned") ?? 0,
          ];
        })
        .filter((r) => r[1] > 0),
    ),
    "",
    "## Apps, tools and features",
    "",
  );
  for (const a of catalog.areas) {
    const inArea = caps.filter((c) => c.area === a.id);
    if (!inArea.length) continue;
    out.push(
      `### ${a.name}`,
      "",
      table(
        ["ID", "Capability", "Route", "Status", "Data", "For", "Epic", "What it does"],
        inArea.map((c) => [
          c.id,
          c.name,
          c.route ? code(c.route) : "Site-wide",
          STATUS[c.status],
          DATA[c.data],
          list(c.personas, personaName),
          epicLink(c.epic),
          c.summary,
        ]),
      ),
      "",
    );
  }

  out.push(
    "## Website content",
    "",
    `${contentPages.length} pages written in Markdown in \`platform/content/website_pages\` and shared with the Python platform, about ${totalWords.toLocaleString("en-GB")} words. The React site renders them with the reading aids in CAP-074; tool and form pages add the capability named in the last column.`,
    "",
  );
  const sectionIds = ["home", ...site.nav_sections.map((s) => s.id)];
  for (const p of contentPages) if (!sectionIds.includes(p.section)) sectionIds.push(p.section);
  for (const sec of sectionIds) {
    const inSec = contentPages.filter((p) => p.section === sec);
    if (!inSec.length) continue;
    const label = sec === "home" ? "Home" : (site.section_labels?.[sec] ?? sec);
    out.push(
      `### ${label}`,
      "",
      table(
        ["Page", "Route", "Type", "What it covers", "Words", "FAQs", "Delivered by", "Stories"],
        inSec
          .sort((a, b) => a.order - b.order || a.path.localeCompare(b.path))
          .map((p) => {
            const cap = capabilityFor(p.path);
            return [
              p.h1,
              code(p.path),
              p.tool ? `tool: ${p.tool}` : p.template,
              p.description,
              p.words,
              p.faqs || "—",
              cap ? `${cap.id} ${cap.name}` : "—",
              list(storiesForRoute(p.path), (id) => storyLink(id)),
            ];
          }),
      ),
      "",
    );
  }

  out.push(
    "## Control library",
    "",
    `${library.controls.length} controls, version ${library.library.version}, served at \`/framework/controls\` (CAP-003) with one page per control (CAP-004). Framework mappings are indicative.`,
    "",
    table(
      ["Pillar", "Name", "Controls", "Critical", "High", "Medium", "Low"],
      library.pillars.map((p) => {
        const inP = library.controls.filter((c) => c.pillar === p.id);
        const by = count(inP, "priority");
        return [
          p.id,
          p.name,
          inP.length,
          by.get("critical") ?? 0,
          by.get("high") ?? 0,
          by.get("medium") ?? 0,
          by.get("low") ?? 0,
        ];
      }),
    ),
    "",
    "## Glossary",
    "",
    `${glossary.terms.length} governed terms (version ${glossary.version}) in \`platform/content/glossary.yaml\`, listed at \`/glossary\` (CAP-005) and defined in page text (CAP-073).`,
    "",
    table(
      ["Topic", "Terms"],
      glossary.categories.map((c) => [
        c.label,
        glossary.terms
          .filter((t) => t.category === c.id)
          .map((t) => t.term)
          .sort((a, b) => a.localeCompare(b))
          .join(", "),
      ]),
    ),
    "",
    "## Where each capability lives",
    "",
    table(
      ["ID", "Capability", "Stories", "Source", "Tests (src/test)"],
      caps.map((c) => [
        c.id,
        c.name,
        list(storiesForCapability(c), (id) => storyLink(id)),
        list(c.source, code),
        c.tests.length ? list(c.tests, code) : "**None**",
      ]),
    ),
    "",
  );
  return out.join("\n");
}

// ------------------------------------------------------------------ EPICS_AND_STORIES.md
function epicsAndStories() {
  const out = [GENERATED, "", "# VERITRAIL epics and user stories", ""];
  out.push(
    `${epics.length} epics and ${stories.length} user stories, each with Given/When/Then acceptance criteria, the routes and tests that cover it, and the gaps still open. Source: [\`catalog.yaml\`](catalog.yaml).`,
    "",
    table(
      ["Epic", "Title", "Area", "Status", "Stories", "Done", "Partial", "Planned"],
      epics.map((e) => {
        const by = count(e.stories, "status");
        return [
          `[${e.id}](#${epicAnchor(e)})`,
          e.title,
          areas.get(e.area)?.name ?? e.area,
          STATUS[e.status],
          e.stories.length,
          by.get("done") ?? 0,
          by.get("partial") ?? 0,
          by.get("planned") ?? 0,
        ];
      }),
    ),
    "",
  );
  for (const e of epics) {
    const epicCaps = caps.filter((c) => c.epic === e.id);
    out.push(
      `## ${e.id} — ${e.title}`,
      "",
      `**Goal:** ${e.goal}`,
      "",
      `**Area:** ${areas.get(e.area)?.name ?? e.area} · **Status:** ${STATUS[e.status]}`,
      "",
      `**Capabilities:** ${list(epicCaps, (c) => `${c.id} ${c.name}`)}`,
      "",
    );
    for (const s of e.stories) {
      const who = inSentence(personaName(s.persona));
      out.push(
        `### ${s.id}`,
        "",
        `**As ${article(who)} ${who}**, I want ${s.want}, so that ${s.so_that}.`,
        "",
        `*Status: ${STATUS[s.status]}*`,
        "",
        "Acceptance criteria:",
        "",
        ...s.acceptance.map((a) => `- ${a}`),
        "",
      );
      const meta = [];
      if (s.routes?.length) meta.push(`**Routes:** ${list(s.routes, code)}`);
      const storyCaps = capabilitiesForStory(s);
      if (storyCaps.length) meta.push(`**Capabilities:** ${list(storyCaps, (c) => c.id)}`);
      meta.push(`**Tests:** ${s.tests?.length ? list(s.tests, code) : "none yet"}`);
      out.push(meta.join(" · "), "");
      if (s.gaps?.length) out.push("Known gaps:", "", ...s.gaps.map((g) => `- ${g}`), "");
    }
  }
  out.push(
    "## Known gaps",
    "",
    "Every gap recorded against a story, in one list for planning.",
    "",
    table(
      ["Story", "Epic", "Gap"],
      stories.flatMap((s) => (s.gaps ?? []).map((g) => [storyLink(s.id, ""), s.epic, g])),
    ),
    "",
  );
  return out.join("\n");
}

// ------------------------------------------------------------------ USE_CASES.md
function useCases() {
  const ucs = catalog.use_cases;
  const out = [GENERATED, "", "# VERITRAIL use cases", ""];
  out.push(
    `${ucs.length} end-to-end use cases. Each lists its actors, flow, alternatives and outcome, and traces to the user stories and capabilities that deliver it. Source: [\`catalog.yaml\`](catalog.yaml).`,
    "",
    table(
      ["Use case", "Actors", "Goal", "Stories"],
      ucs.map((u) => [
        `[${u.id} ${u.title}](#${ucAnchor(u)})`,
        list(u.actors, personaName),
        u.goal,
        list(u.stories, (id) => storyLink(id)),
      ]),
    ),
    "",
  );
  for (const u of ucs) {
    const ucCaps = new Map();
    for (const id of u.stories) {
      const s = storyById.get(id);
      if (s) for (const c of capabilitiesForStory(s)) ucCaps.set(c.id, c);
    }
    out.push(
      `## ${u.id} — ${u.title}`,
      "",
      `**Actors:** ${list(u.actors, personaName)}`,
      "",
      `**Goal:** ${u.goal}`,
      "",
      `**Preconditions:** ${u.preconditions.join(" ")}`,
      "",
      "**Main flow:**",
      "",
      ...u.flow.map((f, i) => `${i + 1}. ${f}`),
      "",
    );
    if (u.alternatives?.length)
      out.push("**Alternatives:**", "", ...u.alternatives.map((a) => `- ${a}`), "");
    out.push(
      `**Outcome:** ${u.outcome}`,
      "",
      `**Stories:** ${list(u.stories, (id) => `${storyLink(id)} (${storyById.get(id)?.epic ?? "?"})`)}`,
      "",
      `**Capabilities:** ${list(
        [...ucCaps.values()].sort((a, b) => a.id.localeCompare(b.id)),
        (c) => `${c.id} ${c.name}`,
      )}`,
      "",
    );
  }
  out.push(
    "## Traceability: capabilities to use cases",
    "",
    table(
      ["Capability", "Status", "Use cases"],
      caps.map((c) => [
        `${c.id} ${c.name}`,
        STATUS[c.status],
        list(
          ucs
            .filter((u) =>
              u.stories.some((id) => {
                const s = storyById.get(id);
                return s && capabilitiesForStory(s).includes(c);
              }),
            )
            .map((u) => u.id),
        ),
      ]),
    ),
    "",
  );
  return out.join("\n");
}

// ------------------------------------------------------------------ write or check
const files = {
  "README.md": readme(),
  "CAPABILITIES_INDEX.md": capabilitiesIndex(),
  "EPICS_AND_STORIES.md": epicsAndStories(),
  "USE_CASES.md": useCases(),
};
const check = process.argv.includes("--check");
const stale = [];
for (const [name, text] of Object.entries(files)) {
  // Not run through Prettier (listed in .prettierignore): it pads wide tables to many times their size.
  const formatted = `${text.trimEnd()}\n`;
  const target = join(OUT, name);
  if (check) {
    let current = "";
    try {
      current = readFileSync(target, "utf8");
    } catch {
      /* missing counts as stale */
    }
    if (current !== formatted) stale.push(`docs/product/${name}`);
  } else {
    writeFileSync(target, formatted);
    console.log(`wrote docs/product/${name}`);
  }
}
if (stale.length) {
  console.error(`Out of date: ${stale.join(", ")}. Run: node scripts/build-product-docs.mjs`);
  process.exit(1);
}
