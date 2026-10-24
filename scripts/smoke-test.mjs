#!/usr/bin/env node
// Browser smoke test: crawl every page reachable from "/" (plus the workspace routes) in
// Chromium and fail on runtime errors, console errors (including hydration warnings), error
// or 404 screens behind internal links, missing linked files, horizontal scrolling at phone
// width, a website or workspace header that wraps onto a second row (also with each Appearance
// theme and font), and installable-app files (manifest, icons, service worker, offline page)
// that are missing or malformed.
//
//   npx vite dev --port 4173 &   # or any running build of the app
//   node scripts/smoke-test.mjs http://localhost:4173
//
// Server functions and Supabase requests are blocked, so the crawl never writes leads,
// analytics events or workspaces to the database. Set CHROMIUM_PATH to use a Chromium other
// than the one Playwright installed, and SMOKE_CONCURRENCY to change the pages in flight (4).
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:4173").replace(/\/+$/, "");
const SEEDS = ["/", "/workspace", "/auth", "/onboarding", "/reset-password"];
const PHONE_WIDTH = 390;
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY) || 4;
const FILE_RE = /\.(pdf|png|jpe?g|svg|ico|zip|csv|json|xml|txt|webmanifest|md|docx|xlsx)$/i;
// Requests the crawl blocks itself, and Vite's dev-only module reloads.
const IGNORED_CONSOLE = /ERR_BLOCKED_BY_CLIENT|ERR_FAILED|ERR_ABORTED|\[vite\]/;

const failures = [];
const fail = (path, kind, detail) =>
  failures.push({ path, kind, detail: String(detail).slice(0, 300) });

function normalise(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

async function newContext(browser, width, appearance) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  // Appearance preferences (src/lib/theme.ts), applied before the page's own scripts run.
  if (appearance)
    await ctx.addInitScript((a) => {
      for (const [key, value] of Object.entries(a)) localStorage.setItem(key, value);
    }, appearance);
  await ctx.route(
    (url) => url.pathname.includes("_serverFn") || /supabase\.(co|in)$/.test(url.hostname),
    (route) => route.abort("blockedbyclient"),
  );
  return ctx;
}

async function visit(ctx, path, { collectLinks }) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(["pageerror", e.message]));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED_CONSOLE.test(m.text())) errors.push(["console", m.text()]);
  });
  let status = 0;
  try {
    const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 });
    status = res?.status() ?? 0;
    await page.waitForTimeout(400);
  } catch (e) {
    errors.push(["navigation", e.message]);
  }
  const info = await page
    .evaluate(
      (collect) => ({
        h1: document.querySelector("h1")?.textContent?.trim() ?? "",
        textLength: document.body?.innerText.trim().length ?? 0,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // 2 when the visible controls of the site or workspace header wrap onto a second row:
        // on one row every control overlaps every other vertically.
        headerRows: [".header-inner", ".app-header"].reduce((most, sel) => {
          const bar = document.querySelector(sel);
          if (!bar) return most;
          const rects = [...bar.children]
            .filter((el) => el.id !== "site-nav" && getComputedStyle(el).display !== "none")
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 0 && r.height > 0);
          if (!rects.length) return most;
          const lowestTop = Math.max(...rects.map((r) => r.top));
          const highestBottom = Math.min(...rects.map((r) => r.bottom));
          return Math.max(most, lowestTop >= highestBottom - 1 ? 2 : 1);
        }, 0),
        links: collect
          ? [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
          : [],
      }),
      collectLinks,
    )
    .catch((e) => {
      errors.push(["evaluate", e.message]);
      return { h1: "", textLength: 0, overflow: 0, headerRows: 0, links: [] };
    });
  await page.close();
  return { status, errors, ...info };
}

/** The files the installed app depends on are served, typed and consistent. */
async function checkInstallableApp(ctx) {
  const get = (path) => ctx.request.get(BASE + path).catch(() => null);
  const manifestRes = await get("/manifest.webmanifest");
  let manifest = null;
  try {
    manifest = manifestRes && manifestRes.ok() ? await manifestRes.json() : null;
  } catch {
    manifest = null;
  }
  if (!manifest) return fail("/manifest.webmanifest", "pwa", "missing or not valid JSON");
  for (const key of ["name", "short_name", "start_url", "display", "icons"])
    if (!manifest[key]) fail("/manifest.webmanifest", "pwa", `no ${key}`);
  const purposes = new Set((manifest.icons ?? []).map((i) => i.purpose));
  if (!purposes.has("maskable")) fail("/manifest.webmanifest", "pwa", "no maskable icon");
  const images = [
    ...(manifest.icons ?? []),
    ...(manifest.screenshots ?? []),
    ...(manifest.shortcuts ?? []).flatMap((s) => s.icons ?? []),
  ];
  for (const img of images) {
    const res = await get(img.src);
    if (!res || !res.ok()) fail(img.src, "pwa", "manifest image missing");
  }
  for (const s of manifest.shortcuts ?? []) {
    const res = await get(s.url);
    if (!res || !res.ok()) fail(s.url, "pwa", "manifest shortcut does not load");
  }
  const sw = await get("/sw.js");
  if (!sw || !sw.ok() || !/javascript/.test(sw.headers()["content-type"] ?? ""))
    fail("/sw.js", "pwa", "service worker missing or not served as JavaScript");
  const offline = await get("/offline.html");
  if (!offline || !offline.ok()) fail("/offline.html", "pwa", "offline page missing");
}

async function main() {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const desktop = await newContext(browser, 1280);

  // Warm up: the first dev-server request optimises dependencies and reloads the page.
  await visit(desktop, "/", { collectLinks: false });
  await visit(desktop, "/workspace", { collectLinks: false });

  const queue = [...SEEDS];
  const seen = new Set(queue);
  const files = new Set();
  const pages = [];
  const crawl = async (path) => {
    const r = await visit(desktop, path, { collectLinks: true });
    pages.push(path);
    if (r.status >= 400) fail(path, "http", r.status);
    for (const [kind, detail] of r.errors) fail(path, kind, detail);
    if (/didn't load/i.test(r.h1)) fail(path, "error-screen", r.h1);
    if (/not found|^404$/i.test(r.h1))
      fail(path, "not-found", "an internal link leads to the 404 page");
    if (r.textLength < 40) fail(path, "blank", `only ${r.textLength} characters of text`);
    if (r.overflow > 1) fail(path, "overflow-1280", `${r.overflow}px wider than the viewport`);
    if (r.headerRows > 1)
      fail(path, "header-wrap-1280", `header controls use ${r.headerRows} rows`);
    for (const href of r.links) {
      if (!href) continue;
      let url;
      try {
        url = new URL(href, BASE + path);
      } catch {
        continue;
      }
      if (url.origin !== new URL(BASE).origin) continue;
      if (FILE_RE.test(url.pathname)) {
        files.add(url.pathname);
        continue;
      }
      const p = normalise(url.pathname);
      if (!seen.has(p)) {
        seen.add(p);
        queue.push(p);
      }
    }
    process.stdout.write(`.${pages.length % 50 === 0 ? ` ${pages.length}\n` : ""}`);
  };
  // Breadth-first crawl with CONCURRENCY pages in flight; new links join the queue.
  await new Promise((resolve) => {
    let active = 0;
    const pump = () => {
      if (!queue.length && active === 0) return resolve();
      while (active < CONCURRENCY && queue.length) {
        active++;
        crawl(queue.shift()).finally(() => {
          active--;
          pump();
        });
      }
    };
    pump();
  });
  process.stdout.write("\n");

  for (const file of files) {
    const res = await desktop.request.get(BASE + file).catch(() => null);
    if (!res || res.status() >= 400) fail(file, "missing-file", res ? res.status() : "no response");
  }
  await checkInstallableApp(desktop);
  await desktop.close();

  // Phone width: nothing may scroll sideways.
  const phone = await newContext(browser, PHONE_WIDTH);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < pages.length) {
        const path = pages[next++];
        const r = await visit(phone, path, { collectLinks: false });
        if (r.overflow > 1)
          fail(path, `overflow-${PHONE_WIDTH}`, `${r.overflow}px wider than the viewport`);
        if (r.headerRows > 1)
          fail(path, `header-wrap-${PHONE_WIDTH}`, `header controls use ${r.headerRows} rows`);
      }
    }),
  );
  await phone.close();

  // Appearance: the wider fonts and the other palettes must not wrap or widen either header.
  const APPEARANCES = [
    { "veritrail-palette": "gold", "veritrail-theme": "dark", "veritrail-font": "kr" },
    { "veritrail-palette": "slate", "veritrail-theme": "light", "veritrail-font": "sans" },
  ];
  for (const appearance of APPEARANCES) {
    const label = `${appearance["veritrail-palette"]}/${appearance["veritrail-font"]}`;
    for (const width of [1280, PHONE_WIDTH]) {
      const ctx = await newContext(browser, width, appearance);
      for (const path of ["/", "/workspace", "/framework/controls"]) {
        const r = await visit(ctx, path, { collectLinks: false });
        for (const [kind, detail] of r.errors) fail(path, `${kind} (${label})`, detail);
        if (r.overflow > 1)
          fail(path, `overflow-${width} (${label})`, `${r.overflow}px wider than the viewport`);
        if (r.headerRows > 1)
          fail(path, `header-wrap-${width} (${label})`, `header controls use ${r.headerRows} rows`);
      }
      await ctx.close();
    }
  }
  await browser.close();

  console.log(
    `Checked ${pages.length} pages and ${files.size} linked files at 1280px and ${PHONE_WIDTH}px.`,
  );
  if (failures.length) {
    console.error(`\n${failures.length} problem(s):`);
    for (const f of failures) console.error(`  ${f.path}  [${f.kind}]  ${f.detail}`);
    process.exit(1);
  }
  console.log("No problems found.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
