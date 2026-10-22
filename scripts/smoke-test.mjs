#!/usr/bin/env node
// Browser smoke test: crawl every page reachable from "/" (plus the workspace routes) in
// Chromium and fail on runtime errors, console errors (including hydration warnings), error
// or 404 screens behind internal links, missing linked files, and horizontal scrolling at
// phone width.
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

async function newContext(browser, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
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
        links: collect
          ? [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
          : [],
      }),
      collectLinks,
    )
    .catch((e) => {
      errors.push(["evaluate", e.message]);
      return { h1: "", textLength: 0, overflow: 0, links: [] };
    });
  await page.close();
  return { status, errors, ...info };
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
      }
    }),
  );
  await phone.close();
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
