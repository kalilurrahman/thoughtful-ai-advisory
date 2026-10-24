// Regenerates public/sitemap.xml from the website pages and the control library.
// Usage: node scripts/generate-sitemap.mjs [https://your-domain]
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const origin = (process.argv[2] ?? "https://thoughtful-ai-governance.lovable.app").replace(
  /\/+$/,
  "",
);
const root = new URL("..", import.meta.url).pathname;
const pagesDir = join(root, "platform/content/website_pages");

const entries = [];
for (const file of readdirSync(pagesDir)
  .filter((f) => f.endsWith(".md"))
  .sort()) {
  const text = readFileSync(join(pagesDir, file), "utf8");
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) continue;
  const meta = parse(fm[1]);
  if (meta.noindex) continue;
  const path = String(meta.slug ?? "/").replace(/\/+$/, "") || "/";
  entries.push({ path, updated: meta.updated ? String(meta.updated) : undefined });
}
entries.push({ path: "/glossary" });
const lib = parse(readFileSync(join(root, "platform/content/controls/controls.yaml"), "utf8"));
const libDate = String(lib.library.effective_date);
entries.push({ path: "/framework/controls", updated: libDate });
for (const c of lib.controls) {
  entries.push({ path: `/framework/controls/${c.id.toLowerCase()}`, updated: libDate });
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(
    (e) =>
      `  <url><loc>${origin}${e.path === "/" ? "/" : e.path}</loc>${e.updated ? `<lastmod>${e.updated}</lastmod>` : ""}</url>`,
  ),
  "</urlset>",
  "",
].join("\n");
writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`Wrote ${entries.length} URLs to public/sitemap.xml`);
