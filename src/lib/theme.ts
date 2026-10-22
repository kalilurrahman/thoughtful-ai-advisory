import { useCallback, useSyncExternalStore } from "react";

// Light/dark preference shared by the GOVERN workspace, the public website and the
// Platform console. It is a per-viewer browser setting, not workspace data: it is stored in
// localStorage and applied as the `dark` class on <html>, which switches the Broadsheet
// tokens in src/styles.css. THEME_INIT_SCRIPT applies it before first paint.

export const THEME_STORAGE_KEY = "aegis-theme";

/** Browser UI colour per theme: the Broadsheet page background (--background). */
export const THEME_COLORS = { light: "#f6f8f9", dark: "#151719" } as const;

const CHANGE_EVENT = "aegis-theme-change";

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function syncThemeColor(dark: boolean): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = dark ? THEME_COLORS.dark : THEME_COLORS.light;
}

export function setDarkTheme(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
  syncThemeColor(dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    /* storage unavailable (private mode, blocked): the choice lasts for this page only */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  // Keep other tabs in step when the preference changes there.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return;
    const dark = e.newValue === "dark";
    document.documentElement.classList.toggle("dark", dark);
    syncThemeColor(dark);
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current theme and a toggle. Renders light on the server and during hydration. */
export function useDarkTheme(): [dark: boolean, toggle: () => void] {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const toggle = useCallback(() => setDarkTheme(!isDark()), []);
  return [dark, toggle];
}

/** Inline <head> script: apply the stored preference before the first paint. */
export const THEME_INIT_SCRIPT = `(function(){var d=false;try{d=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})==="dark"}catch(e){}if(d)document.documentElement.classList.add("dark");var m=document.createElement("meta");m.name="theme-color";m.content=d?${JSON.stringify(
  THEME_COLORS.dark,
)}:${JSON.stringify(THEME_COLORS.light)};document.head.appendChild(m)})();`;
