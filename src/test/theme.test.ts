import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FONTS,
  FONT_STORAGE_KEY,
  PALETTES,
  PALETTE_STORAGE_KEY,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  ensureFontStylesheet,
  resetAppearance,
  setDarkTheme,
  setFont,
  setPalette,
} from "@/lib/theme";

// Appearance: light/dark, colour palettes and fonts (src/lib/theme.ts, src/styles.css).

// Read from disk: Vitest replaces CSS imports (even ?raw) with an empty string.
const stylesCss = readFileSync(join(process.cwd(), "src", "styles.css"), "utf8");

const root = () => document.documentElement;
const themeColor = () =>
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content;
const fontSheets = () => [...document.querySelectorAll("link[data-font-sheet]")];

function clean() {
  localStorage.clear();
  root().className = "";
  root().removeAttribute("data-palette");
  root().removeAttribute("data-font");
  for (const el of document.head.querySelectorAll(
    'meta[name="theme-color"], link[data-font-sheet]',
  ))
    el.remove();
}

describe("appearance preferences", () => {
  beforeEach(clean);
  afterEach(clean);

  it("applies stored mode, palette and font before first paint", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    localStorage.setItem(PALETTE_STORAGE_KEY, "gold");
    localStorage.setItem(FONT_STORAGE_KEY, "kr");
    new Function(THEME_INIT_SCRIPT)();
    expect(root().classList.contains("dark")).toBe(true);
    expect(root().getAttribute("data-palette")).toBe("gold");
    expect(root().getAttribute("data-font")).toBe("kr");
    expect(themeColor()).toBe(PALETTES.find((p) => p.id === "gold")?.dark.background);
    expect(fontSheets().map((l) => l.getAttribute("href"))).toEqual([
      FONTS.find((f) => f.id === "kr")?.stylesheet,
    ]);
  });

  it("falls back to Broadsheet, light and the serif for missing or unknown values", () => {
    localStorage.setItem(PALETTE_STORAGE_KEY, "neon");
    localStorage.setItem(FONT_STORAGE_KEY, "comic");
    new Function(THEME_INIT_SCRIPT)();
    expect(root().classList.contains("dark")).toBe(false);
    expect(root().hasAttribute("data-palette")).toBe(false);
    expect(root().hasAttribute("data-font")).toBe(false);
    expect(fontSheets()).toHaveLength(0);
    expect(themeColor()).toBe(PALETTES[0]?.light.background);
  });

  it("saves each choice, updates <html> and keeps the browser colour in step", () => {
    setPalette("slate");
    setDarkTheme(true);
    setFont("sans");
    expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe("slate");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe("sans");
    expect(root().getAttribute("data-palette")).toBe("slate");
    expect(root().getAttribute("data-font")).toBe("sans");
    expect(themeColor()).toBe(PALETTES.find((p) => p.id === "slate")?.dark.background);
  });

  it("loads a font's stylesheet once, and never for the default font", () => {
    ensureFontStylesheet("serif");
    expect(fontSheets()).toHaveLength(0);
    setFont("kr");
    setFont("kr");
    ensureFontStylesheet("kr");
    expect(fontSheets()).toHaveLength(1);
  });

  it("resets to the defaults", () => {
    setPalette("gold");
    setFont("kr");
    setDarkTheme(true);
    resetAppearance();
    expect(root().classList.contains("dark")).toBe(false);
    expect(root().hasAttribute("data-palette")).toBe(false);
    expect(root().hasAttribute("data-font")).toBe(false);
    expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe("broadsheet");
    expect(themeColor()).toBe(PALETTES[0]?.light.background);
  });
});

// ------------------------------------------------------------------ the palettes in styles.css

/** Declarations of the rule whose selector is exactly `selector` and that sets --background. */
function tokens(selector: string): Map<string, string> {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const m of stylesCss.matchAll(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`, "g"))) {
    const body = m[1] ?? "";
    if (!body.includes("--background:")) continue;
    return new Map(
      [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((d) => [
        d[1] ?? "",
        (d[2] ?? "").trim(),
      ]),
    );
  }
  throw new Error(`no token block for ${selector}`);
}

const BASE_LIGHT = tokens(":root");
const BASE_DARK = tokens(".dark");

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const HEX = /^#[0-9a-f]{6}$/i;
const TEXT_PAIRS: Array<[string, string]> = [
  ["--foreground", "--background"],
  ["--foreground", "--card"],
  ["--card-foreground", "--card"],
  ["--muted-foreground", "--background"],
  ["--muted-foreground", "--card"],
  ["--muted-foreground", "--secondary"],
  ["--primary", "--background"],
  ["--primary", "--card"],
  ["--primary-foreground", "--primary"],
  ["--accent-foreground", "--accent"],
  ["--success-ink", "--card"],
  ["--success-ink", "--success-surface"],
  ["--warning-ink", "--card"],
  ["--warning-ink", "--warning-surface"],
  ["--danger-ink", "--card"],
  ["--danger-ink", "--danger-surface"],
];
const NON_TEXT_PAIRS: Array<[string, string]> = [
  ["--input", "--background"],
  ["--ring", "--background"],
];

describe("colour palettes", () => {
  const themed = PALETTES.filter((p) => p.id !== "broadsheet");

  it.each(themed.map((p) => p.id))("defines the same tokens in light and dark (%s)", (id) => {
    const light = tokens(`:root[data-palette="${id}"]`);
    const dark = tokens(`:root.dark[data-palette="${id}"]`);
    expect([...dark.keys()].sort()).toEqual([...light.keys()].sort());
  });

  it.each(themed.map((p) => p.id))("shows the panel swatches in the CSS colours (%s)", (id) => {
    const p = PALETTES.find((x) => x.id === id)!;
    for (const [mode, block] of [
      ["light", tokens(`:root[data-palette="${id}"]`)],
      ["dark", tokens(`:root.dark[data-palette="${id}"]`)],
    ] as const) {
      const sw = p[mode];
      expect(block.get("--background"), `${id} ${mode}`).toBe(sw.background);
      expect(block.get("--card"), `${id} ${mode}`).toBe(sw.card);
      expect(block.get("--primary"), `${id} ${mode}`).toBe(sw.primary);
      expect(block.get("--foreground"), `${id} ${mode}`).toBe(sw.foreground);
    }
  });

  it.each(themed.flatMap((p) => [`${p.id} light`, `${p.id} dark`]))(
    "meets WCAG AA contrast (%s)",
    (name) => {
      const [id, mode] = name.split(" ");
      const own = tokens(
        mode === "dark" ? `:root.dark[data-palette="${id}"]` : `:root[data-palette="${id}"]`,
      );
      const value = (t: string) =>
        own.get(t) ?? (mode === "dark" ? BASE_DARK.get(t) : undefined) ?? BASE_LIGHT.get(t) ?? "";
      let checked = 0;
      for (const [pairs, min] of [
        [TEXT_PAIRS, 4.5],
        [NON_TEXT_PAIRS, 3],
      ] as const) {
        for (const [fg, bg] of pairs) {
          const a = value(fg);
          const b = value(bg);
          if (!HEX.test(a) || !HEX.test(b)) continue; // a shared oklch() token: checked by design
          checked++;
          expect(contrast(a, b), `${name}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(min);
        }
      }
      expect(checked).toBeGreaterThanOrEqual(14);
    },
  );

  it("gives every font a name, a stack and a stylesheet except the default", () => {
    expect(FONTS.map((f) => f.id)).toEqual(["serif", "kr", "sans"]);
    expect(FONTS[0]?.stylesheet).toBeNull();
    for (const f of FONTS.slice(1))
      expect(f.stylesheet).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
    for (const id of ["kr", "sans"]) expect(stylesCss).toContain(`:root[data-font="${id}"]`);
  });
});
