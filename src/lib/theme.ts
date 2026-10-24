import { useCallback, useSyncExternalStore } from "react";

// Appearance preferences shared by the TILLER workspace, the public website and the Platform
// console: light or dark mode, a colour theme and a font. They are per-viewer browser settings,
// not workspace data: each is stored in localStorage and applied to <html> — the `dark` class,
// `data-palette` and `data-font` — which switch the tokens in src/styles.css.
// THEME_INIT_SCRIPT applies them before first paint, so a page never flashes the default look.

export const THEME_STORAGE_KEY = "veritrail-theme";
export const PALETTE_STORAGE_KEY = "veritrail-palette";
export const FONT_STORAGE_KEY = "veritrail-font";

export type Palette = "broadsheet" | "gold" | "slate";
export type FontChoice = "serif" | "kr" | "sans";

/** The colours a palette is recognised by; they match its tokens in src/styles.css. */
export interface Swatch {
  background: string;
  card: string;
  primary: string;
  foreground: string;
}

export interface PaletteOption {
  id: Palette;
  name: string;
  description: string;
  light: Swatch;
  dark: Swatch;
}

export interface FontOption {
  id: FontChoice;
  name: string;
  description: string;
  /** CSS font-family of the body text, for the preview. */
  body: string;
  /** CSS font-family of headings, for the preview. */
  heading: string;
  /** Google Fonts stylesheet loaded when the font is chosen (the default ships with the page). */
  stylesheet: string | null;
}

export const DEFAULT_PALETTE: Palette = "broadsheet";
export const DEFAULT_FONT: FontChoice = "serif";

// Midnight Gold and Financial Slate take their cue from the KR Tools themes of FinPrompt and
// Claudiator (gold on midnight; blue slate with an Arctic light mode).
export const PALETTES: readonly PaletteOption[] = [
  {
    id: "broadsheet",
    name: "Broadsheet",
    description: "VERITRAIL teal on newsprint — the original",
    light: { background: "#f6f8f9", card: "#ffffff", primary: "#007396", foreground: "#201e1d" },
    dark: { background: "#151719", card: "#1d2022", primary: "#62c5ee", foreground: "#f3f2f2" },
  },
  {
    id: "gold",
    name: "Midnight Gold",
    description: "Gold on midnight, ivory by day",
    light: { background: "#f6f3eb", card: "#fffdf8", primary: "#80600f", foreground: "#1b1d24" },
    dark: { background: "#070b12", card: "#0f1622", primary: "#d4af57", foreground: "#f4f1ea" },
  },
  {
    id: "slate",
    name: "Financial Slate",
    description: "Executive blue slate, Arctic by day",
    light: { background: "#eef2f7", card: "#ffffff", primary: "#0057b8", foreground: "#0f1f33" },
    dark: { background: "#0a1020", card: "#111a2e", primary: "#6aaefc", foreground: "#e5edff" },
  },
];

export const FONTS: readonly FontOption[] = [
  {
    id: "serif",
    name: "Editorial serif",
    description: "Source Serif 4 throughout",
    body: '"Source Serif 4", Georgia, serif',
    heading: '"Source Serif 4", Georgia, serif',
    stylesheet: null,
  },
  {
    id: "kr",
    name: "KR Tools",
    description: "DM Sans text, Cormorant Garamond headings",
    body: '"DM Sans", system-ui, sans-serif',
    heading: '"Cormorant Garamond", Georgia, serif',
    stylesheet:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap",
  },
  {
    id: "sans",
    name: "Modern sans",
    description: "Inter — compact and screen-first",
    body: '"Inter", system-ui, sans-serif',
    heading: '"Inter", system-ui, sans-serif',
    stylesheet: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
];

/** Browser UI colour (theme-color) for each palette and mode: the page background. */
export const THEME_COLORS = {
  light: PALETTES[0]!.light.background,
  dark: PALETTES[0]!.dark.background,
} as const;

const CHANGE_EVENT = "veritrail-theme-change";

export function isPalette(v: unknown): v is Palette {
  return PALETTES.some((p) => p.id === v);
}

export function isFontChoice(v: unknown): v is FontChoice {
  return FONTS.some((f) => f.id === v);
}

export function getPalette(id: Palette): PaletteOption {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

export function getFont(id: FontChoice): FontOption {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]!;
}

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function currentPalette(): Palette {
  const v = document.documentElement.getAttribute("data-palette");
  return isPalette(v) ? v : DEFAULT_PALETTE;
}

function currentFont(): FontChoice {
  const v = document.documentElement.getAttribute("data-font");
  return isFontChoice(v) ? v : DEFAULT_FONT;
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, blocked): the choice lasts for this page only */
  }
}

function syncThemeColor(): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  const swatch = getPalette(currentPalette());
  meta.content = (isDark() ? swatch.dark : swatch.light).background;
}

/** Add a font's stylesheet once; fonts other than the default are only fetched when needed. */
export function ensureFontStylesheet(id: FontChoice): void {
  const href = getFont(id).stylesheet;
  if (!href || document.querySelector(`link[data-font-sheet="${id}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-font-sheet", id);
  document.head.appendChild(link);
}

function applyPalette(id: Palette): void {
  if (id === DEFAULT_PALETTE) document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", id);
}

function applyFont(id: FontChoice): void {
  if (id === DEFAULT_FONT) document.documentElement.removeAttribute("data-font");
  else {
    ensureFontStylesheet(id);
    document.documentElement.setAttribute("data-font", id);
  }
}

function changed(): void {
  syncThemeColor();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setDarkTheme(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
  store(THEME_STORAGE_KEY, dark ? "dark" : "light");
  changed();
}

export function setPalette(id: Palette): void {
  applyPalette(id);
  store(PALETTE_STORAGE_KEY, id);
  changed();
}

export function setFont(id: FontChoice): void {
  applyFont(id);
  store(FONT_STORAGE_KEY, id);
  changed();
}

/** Back to Broadsheet, light, Editorial serif. */
export function resetAppearance(): void {
  document.documentElement.classList.remove("dark");
  applyPalette(DEFAULT_PALETTE);
  applyFont(DEFAULT_FONT);
  store(THEME_STORAGE_KEY, "light");
  store(PALETTE_STORAGE_KEY, DEFAULT_PALETTE);
  store(FONT_STORAGE_KEY, DEFAULT_FONT);
  changed();
}

function subscribe(onChange: () => void): () => void {
  // Keep other tabs in step when a preference changes there.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY)
      document.documentElement.classList.toggle("dark", e.newValue === "dark");
    else if (e.key === PALETTE_STORAGE_KEY)
      applyPalette(isPalette(e.newValue) ? e.newValue : DEFAULT_PALETTE);
    else if (e.key === FONT_STORAGE_KEY)
      applyFont(isFontChoice(e.newValue) ? e.newValue : DEFAULT_FONT);
    else return;
    syncThemeColor();
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current mode and a toggle. Renders light on the server and during hydration. */
export function useDarkTheme(): [dark: boolean, toggle: () => void] {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const toggle = useCallback(() => setDarkTheme(!isDark()), []);
  return [dark, toggle];
}

/** Current mode, palette and font. Renders the defaults on the server and during hydration. */
export function useAppearance(): { dark: boolean; palette: Palette; font: FontChoice } {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const palette = useSyncExternalStore(subscribe, currentPalette, () => DEFAULT_PALETTE);
  const font = useSyncExternalStore(subscribe, currentFont, () => DEFAULT_FONT);
  return { dark, palette, font };
}

const INIT_COLORS = Object.fromEntries(
  PALETTES.map((p) => [p.id, [p.light.background, p.dark.background]]),
);
const INIT_FONTS = Object.fromEntries(FONTS.map((f) => [f.id, f.stylesheet ?? ""]));

/** Inline <head> script: apply the stored preferences before the first paint. */
export const THEME_INIT_SCRIPT = `(function(){var r=document.documentElement,C=${JSON.stringify(
  INIT_COLORS,
)},F=${JSON.stringify(INIT_FONTS)};function g(k){try{return localStorage.getItem(k)}catch(e){return null}}var d=g(${JSON.stringify(
  THEME_STORAGE_KEY,
)})==="dark",p=g(${JSON.stringify(PALETTE_STORAGE_KEY)}),f=g(${JSON.stringify(
  FONT_STORAGE_KEY,
)});if(!C.hasOwnProperty(p))p=${JSON.stringify(DEFAULT_PALETTE)};if(!F.hasOwnProperty(f))f=${JSON.stringify(
  DEFAULT_FONT,
)};if(d)r.classList.add("dark");if(p!==${JSON.stringify(
  DEFAULT_PALETTE,
)})r.setAttribute("data-palette",p);if(F[f]){var l=document.createElement("link");l.rel="stylesheet";l.href=F[f];l.setAttribute("data-font-sheet",f);document.head.appendChild(l);r.setAttribute("data-font",f)}var m=document.createElement("meta");m.name="theme-color";m.content=C[p][d?1:0];document.head.appendChild(m)})();`;
