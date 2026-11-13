#!/usr/bin/env node
// Regenerate the installable-app icons in public/icons from the VERITRAIL shield mark (the same
// path as public/favicon.svg and the site header), rasterised in Chromium.
//
//   node scripts/generate-pwa-icons.mjs            # the current shield mark
//   node scripts/generate-pwa-icons.mjs --mark b   # a master mark from public/brand (a | b | c)
//
// The Assurance handoff offers three master marks (docs/design/assurance, "VERITRAIL Brand
// Marks" 1a / 1b / 1c). Until the owner picks one the current shield stays; pass --mark to
// regenerate every icon from public/brand/veritrail-mark-<x>.svg instead (the mark sits inside
// the 80% maskable safe zone).
//
// Outputs: icon-{192,512}.png (purpose "any"), icon-maskable-{192,512}.png (full bleed, mark
// inside the 80% safe zone), apple-touch-icon.png (180, opaque) and the 96px shortcut icons
// listed in public/manifest.webmanifest.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BookOpenText,
  ChatsCircle,
  Gauge,
  SquaresFour,
  TrafficSignal,
} from "@phosphor-icons/react/dist/ssr";
import { chromium } from "playwright";

const OUT = join(process.cwd(), "public", "icons");
const SHIELD = "M14 1 26 5.5v9.2c0 7.6-5 13.4-12 16.3C7 28.1 2 22.3 2 14.7V5.5L14 1Z";
const CHECK = "m8.5 16.2 3.8 3.8 7.4-8";
const GRADIENT = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#0a8db3"/><stop offset="1" stop-color="#004961"/></linearGradient></defs>`;

const markArg = process.argv.indexOf("--mark");
const MASTER = markArg > 0 ? process.argv[markArg + 1] : undefined;
if (MASTER && !/^[abc]$/.test(MASTER)) {
  console.error("--mark takes a, b or c (public/brand/veritrail-mark-<x>.svg)");
  process.exit(1);
}
/** The inner markup of a master mark SVG (64×64 viewBox), without its <svg> wrapper. */
const MASTER_BODY = MASTER
  ? readFileSync(join(process.cwd(), "public", "brand", `veritrail-mark-${MASTER}.svg`), "utf8")
      .replace(/^[\s\S]*?<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "")
  : null;

/** The mark centred at (cx, cy) with the given height: the shield with a teal check, or the
 *  chosen master mark (64×64) drawn at the same height. */
function mark(cx, cy, height) {
  if (MASTER_BODY) {
    const s = height / 64;
    return `<g transform="translate(${cx - 32 * s} ${cy - 32 * s}) scale(${s})">${MASTER_BODY}</g>`;
  }
  const s = height / 32;
  const x = cx - 14 * s;
  const y = cy - 16 * s;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="${SHIELD}" fill="#ffffff"/>
    <path d="${CHECK}" fill="none" stroke="#007396" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/** The Broadsheet double rule under the mark (2px + 1px, as under every page title). */
function rule(cx, y, width, unit) {
  return `<rect x="${cx - width / 2}" y="${y}" width="${width}" height="${unit * 2}" fill="#ffffff" opacity="0.92"/>
    <rect x="${cx - width / 2}" y="${y + unit * 4}" width="${width}" height="${unit}" fill="#ffffff" opacity="0.92"/>`;
}

const anyIcon = (size) => {
  const inset = size * 0.04;
  const r = size * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${GRADIENT}
    <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${r}" fill="url(#g)"/>
    ${mark(size / 2, size * 0.45, size * 0.48)}
    ${rule(size / 2, size * 0.735, size * 0.4, size / 256)}
  </svg>`;
};

const fullBleed = (size, markScale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${GRADIENT}
    <rect width="${size}" height="${size}" fill="url(#g)"/>
    ${mark(size / 2, size * 0.47, size * markScale)}
    ${rule(size / 2, size * (0.47 + markScale / 2 + 0.05), size * markScale * 0.8, size / 256)}
  </svg>`;

function shortcut(Icon) {
  const glyph = renderToStaticMarkup(
    createElement(Icon, { size: 56, weight: "duotone", color: "#ffffff" }),
  ).replace("<svg ", '<svg x="20" y="20" ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${GRADIENT}
    <rect width="96" height="96" rx="20" fill="url(#g)"/>${glyph}</svg>`;
}

const ICONS = {
  "icon-192.png": anyIcon(192),
  "icon-512.png": anyIcon(512),
  "icon-maskable-192.png": fullBleed(192, 0.42),
  "icon-maskable-512.png": fullBleed(512, 0.42),
  "apple-touch-icon.png": fullBleed(180, 0.46),
  "shortcut-assessment.png": shortcut(Gauge),
  "shortcut-triage.png": shortcut(TrafficSignal),
  "shortcut-controls.png": shortcut(SquaresFour),
  "shortcut-ask.png": shortcut(ChatsCircle),
  "shortcut-workspace.png": shortcut(BookOpenText),
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
for (const [file, svg] of Object.entries(ICONS)) {
  const size = Number(/width="(\d+)"/.exec(svg)?.[1]);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page
    .locator("svg")
    .first()
    .screenshot({ path: join(OUT, file), omitBackground: true });
  console.log(`wrote public/icons/${file}`);
}
await browser.close();
