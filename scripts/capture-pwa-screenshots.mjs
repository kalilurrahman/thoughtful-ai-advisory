#!/usr/bin/env node
// Capture the screenshots the web app manifest offers in the browser's richer install dialog
// (Chrome and Edge show them before installing). Run against any running build of the site:
//
//   node scripts/capture-pwa-screenshots.mjs http://localhost:4173
//
// Writes public/screenshots/*.jpg at the sizes declared in public/manifest.webmanifest.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:4173").replace(/\/+$/, "");
const OUT = join(process.cwd(), "public", "screenshots");
const SHOTS = [
  { file: "home-wide.jpg", path: "/", width: 1280, height: 800, scale: 1 },
  { file: "controls-wide.jpg", path: "/framework/controls", width: 1280, height: 800, scale: 1 },
  { file: "home-narrow.jpg", path: "/", width: 390, height: 844, scale: 2 },
  {
    file: "assessment-narrow.jpg",
    path: "/tools/maturity-assessment",
    width: 390,
    height: 844,
    scale: 2,
  },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
for (const s of SHOTS) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: s.scale,
    reducedMotion: "reduce",
  });
  // Never record analytics or leads while capturing.
  await ctx.route(
    (url) => url.pathname.includes("_serverFn") || /supabase\.(co|in)$/.test(url.hostname),
    (route) => route.abort("blockedbyclient"),
  );
  const page = await ctx.newPage();
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, s.file), type: "jpeg", quality: 82 });
  console.log(`wrote public/screenshots/${s.file}`);
  await ctx.close();
}
await browser.close();
