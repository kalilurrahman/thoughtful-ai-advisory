#!/usr/bin/env node
// Generate the per-section link-preview images (Open Graph, 1200×630) in public/og/ on the
// Assurance layout (docs/design/assurance, "VERITRAIL Brand Marks" 1h): a navy card with the
// mark and wordmark, a mono eyebrow, a serif title and the section's own data visual on the
// right, rendered in Chromium against a running build of the site:
//
//   npm run dev &   # or any running build
//   node scripts/generate-social-images.mjs http://localhost:5173
//
// Each image takes its eyebrow, title and sub-line from the page itself (the section label and
// h1 come from the page's governed frontmatter, the sub-line from its description) and the
// illustration from the page header, so the pictures always match the site. views.tsx
// (OG_SECTIONS) lists the sections that have an image; pages in other sections keep
// public/og-default.png.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:5173").replace(/\/+$/, "");
const OUT = join(process.cwd(), "public", "og");

/** [image name, page to take the copy and illustration from] — one image per section. */
const SHOTS = [
  ["framework", "/framework"],
  ["solutions", "/solutions"],
  ["compliance", "/compliance"],
  ["industries", "/industries"],
  ["tools", "/tools"],
  ["resources", "/resources"],
  ["blog", "/resources/blog"],
  ["contact", "/contact"],
  ["legal", "/legal/terms"],
  ["company", "/about"],
  ["controls", "/framework/controls"],
  ["glossary", "/glossary"],
];

// The shield mark (public/favicon.svg), in a white tile as the brand-marks layout shows it. Swap
// for public/brand/veritrail-mark-<x>.svg once the owner picks the master mark.
const MARK =
  '<svg viewBox="0 0 28 32" width="46" height="52"><path d="M14 1 26 5.5v9.2c0 7.6-5 13.4-12 16.3C7 28.1 2 22.3 2 14.7V5.5L14 1Z" fill="#0d1d29"/><path d="m8.5 16.2 3.8 3.8 7.4-8" fill="none" stroke="#62c5ee" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const STYLE = `
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #071119; }
  .og { position: relative; box-sizing: border-box; width: 1200px; height: 630px; padding: 72px 80px;
        display: grid; grid-template-columns: 1fr 470px; gap: 48px; background: #071119; color: #ffffff;
        font-family: "IBM Plex Sans", system-ui, sans-serif; }
  .og-copy { display: flex; flex-direction: column; gap: 26px; min-width: 0; }
  .og-brand { display: flex; align-items: center; gap: 14px; }
  .og-tile { display: flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 14px;
             background: #ffffff; box-shadow: 0 0 0 1px rgba(255,255,255,.15); }
  .og-word { font: 600 26px/1 "Source Serif 4", Georgia, serif; letter-spacing: .2em; color: #ffffff; }
  .veritrail-site .og .og-eyebrow { margin: 0; font: 500 15px/1.3 "IBM Plex Mono", ui-monospace, monospace; letter-spacing: .1em;
                                    text-transform: uppercase; color: #62c5ee; }
  .veritrail-site .og .og-title { margin: 0; font: 600 58px/1.06 "Source Serif 4", Georgia, serif; letter-spacing: -.02em;
                                  color: #ffffff; text-wrap: balance; }
  .veritrail-site .og .og-sub { margin-top: auto; font: 400 20px/1.4 "IBM Plex Sans", system-ui, sans-serif; color: #a9b8c4;
                                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .og-art { align-self: center; display: flex; align-items: center; justify-content: center; }
  .og-art svg { width: 470px !important; height: auto !important; max-width: none !important; }
  .og * { animation: none !important; transition: none !important; }
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
    localStorage.setItem("veritrail-theme", "dark");
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
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
for (const [name, path] of SHOTS) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const { art, sheets, eyebrow, title, sub } = await page.evaluate(() => ({
    art: document.querySelector(".page-header-art svg")?.outerHTML ?? "",
    sheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href),
    eyebrow: document.querySelector(".page-header .eyebrow")?.textContent?.trim() ?? "",
    title: document.querySelector("h1")?.textContent?.trim() ?? "",
    sub: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
  }));
  if (!art) throw new Error(`no illustration on ${path}`);
  if (!title) throw new Error(`no title on ${path}`);
  // A fresh page that React does not manage, styled by the site's own stylesheets; the dark
  // tokens apply to the illustration because the page is in dark mode.
  await card.setContent(
    `<!doctype html><html class="dark" data-mode="dark"><head><meta charset="utf-8">
      ${sheets.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}
      <style>${STYLE}</style></head>
      <body><div class="veritrail-site dark"><div class="og">
        <div class="og-copy">
          <div class="og-brand"><span class="og-tile">${MARK}</span><span class="og-word">VERITRAIL</span></div>
          <p class="og-eyebrow">${esc(eyebrow || "VERITRAIL")}</p>
          <h1 class="og-title">${esc(title)}</h1>
          <p class="og-sub">${esc(sub)}</p>
        </div>
        <div class="og-art">${art}</div>
      </div></div></body></html>`,
    { waitUntil: "networkidle" },
  );
  await card.evaluate(() => document.fonts.ready);
  await card.setViewportSize({ width: 1200, height: 630 });
  await card.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`wrote public/og/${name}.png  (${title})`);
}
await browser.close();
