#!/usr/bin/env node
// Generate the per-section link-preview images (Open Graph, 1200×630) in public/og/ from the
// section illustrations, rendered in Chromium against a running build of the site:
//
//   npm run dev &   # or any running build
//   node scripts/generate-social-images.mjs http://localhost:5173
//
// Each image takes the section's illustration from its page, so the pictures always match the
// site. src/features/site/views.tsx (OG_SECTIONS) lists the sections that have an image; pages in
// other sections keep public/og-default.png.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:5173").replace(/\/+$/, "");
const OUT = join(process.cwd(), "public", "og");

/** [image name, page to take the illustration from, eyebrow, headline] */
const SHOTS = [
  [
    "framework",
    "/framework",
    "Framework",
    "Five pillars. 64 controls. One evidence-first framework.",
  ],
  ["solutions", "/solutions", "Solutions", "Six layers, one AI governance system."],
  [
    "compliance",
    "/compliance",
    "Compliance",
    "Readiness for NIST AI RMF, ISO/IEC 42001 and the EU AI Act.",
  ],
  ["industries", "/industries", "Industries", "AI governance for regulated industries."],
  [
    "tools",
    "/tools",
    "Free tools",
    "Assess maturity, triage risk and draft guardrails in your browser.",
  ],
  ["resources", "/resources", "Resources", "Blueprints, runbooks and templates for AI governance."],
  [
    "blog",
    "/resources/blog",
    "Briefing",
    "Practical writing on AI governance and runtime guardrails.",
  ],
  ["contact", "/contact", "Contact", "Book a Governance Baseline or talk to the team."],
  ["legal", "/legal/terms", "Legal", "Terms, privacy and our responsible AI statement."],
  ["company", "/about", "About", "Evidence over assertion: the VERITRAIL approach."],
  [
    "controls",
    "/framework/controls",
    "Control library",
    "64 AI governance controls, mapped and evidenced.",
  ],
  ["glossary", "/glossary", "Glossary", "Plain-language definitions of AI governance terms."],
];

const SHIELD =
  '<svg viewBox="0 0 28 32" width="44" height="50"><path d="M14 1 26 5.5v9.2c0 7.6-5 13.4-12 16.3C7 28.1 2 22.3 2 14.7V5.5L14 1Z" fill="#007396"/><path d="m8.5 16.2 3.8 3.8 7.4-8" fill="none" stroke="#f6f8f9" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const STYLE = `
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #f6f8f9; }
  .og { position: relative; box-sizing: border-box; width: 1200px; height: 630px; padding: 64px 72px 0;
        display: grid; grid-template-columns: 1fr 470px; grid-template-rows: 100%; gap: 40px; font-family: "Source Serif 4", Georgia, serif; color: #201e1d; }
  .og-copy { display: flex; flex-direction: column; min-width: 0; height: 100%; }
  .og-brand { display: flex; align-items: center; gap: 14px; color: #007396; font-weight: 600; letter-spacing: 0.18em; font-size: 30px; }
  .og-rule { height: 7px; border-top: 3px solid #201e1d; border-bottom: 1.5px solid #201e1d; margin: 30px 0 34px; }
  .veritrail-site .og .og-eyebrow { margin: 0 0 14px; font-size: 20px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6665; }
  .veritrail-site .og .og-title { margin: 0; font-size: 52px; line-height: 1.12; font-weight: 600; text-wrap: balance; }
  .veritrail-site .og .og-foot { margin-top: auto; padding-bottom: 46px; font-size: 19px; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6665; }
  .og-art { align-self: center; display: flex; align-items: center; justify-content: center; }
  .og-art svg { width: 470px !important; height: auto !important; max-width: none !important; }
  .og-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 16px; background: #007396; }
  .og * { animation: none !important; }
`;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  reducedMotion: "reduce",
});
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("veritrail-theme", "light");
  } catch {
    /* ignore */
  }
});
// Never record analytics or leads while capturing.
await ctx.route(
  (url) => url.pathname.includes("_serverFn") || /supabase\.(co|in)$/.test(url.hostname),
  (route) => route.abort("blockedbyclient"),
);
const page = await ctx.newPage();
const card = await ctx.newPage();
for (const [name, path, eyebrow, title] of SHOTS) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const { art, sheets } = await page.evaluate(() => ({
    art: document.querySelector(".page-header-art svg")?.outerHTML ?? "",
    sheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href),
  }));
  if (!art) throw new Error(`no illustration on ${path}`);
  // A fresh page that React does not manage, styled by the site's own stylesheets.
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  await card.setContent(
    `<!doctype html><html><head><meta charset="utf-8">
      ${sheets.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}
      <style>${STYLE}</style></head>
      <body><div class="veritrail-site"><div class="og">
        <div class="og-copy">
          <div class="og-brand">${SHIELD}<span>VERITRAIL</span></div>
          <div class="og-rule"></div>
          <p class="og-eyebrow">${esc(eyebrow)}</p>
          <h1 class="og-title">${esc(title)}</h1>
          <p class="og-foot">AI governance · Runtime guardrails · Evidence</p>
        </div>
        <div class="og-art">${art}</div>
        <div class="og-bar"></div>
      </div></div></body></html>`,
    { waitUntil: "networkidle" },
  );
  await card.evaluate(() => document.fonts.ready);
  await card.setViewportSize({ width: 1200, height: 630 });
  await card.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`wrote public/og/${name}.png`);
}
await browser.close();
