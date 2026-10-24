import { useEffect, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Moon, Palette, Sun, X } from "@phosphor-icons/react";
import {
  FONTS,
  PALETTES,
  ensureFontStylesheet,
  getFont,
  getPalette,
  resetAppearance,
  setDarkTheme,
  setFont,
  setPalette,
  useAppearance,
} from "@/lib/theme";

// Appearance: light or dark, a colour theme and a font, from the website header and menu, the
// workspace header and More screen. Choices apply at once and are remembered in this browser
// (src/lib/theme.ts); nothing is sent anywhere.

const OPEN_EVENT = "veritrail-appearance-change";
let open = false;

function setOpen(next: boolean): void {
  open = next;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function openAppearance(): void {
  setOpen(true);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(OPEN_EVENT, onChange);
  return () => window.removeEventListener(OPEN_EVENT, onChange);
}

function useAppearanceOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

/** Short summary for menus: "Midnight Gold · Dark · KR Tools". */
export function useAppearanceSummary(): string {
  const { dark, palette, font } = useAppearance();
  return `${getPalette(palette).name} · ${dark ? "Dark" : "Light"} · ${getFont(font).name}`;
}

/** Mounted once at the root, beside the search and PWA layers. */
export function AppearanceLayer() {
  const isOpen = useAppearanceOpen();
  const { dark, palette, font } = useAppearance();

  // Load the other fonts while the panel is open, so each preview shows its real typeface.
  useEffect(() => {
    if (isOpen) for (const f of FONTS) ensureFontStylesheet(f.id);
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="appearance-overlay" />
        <Dialog.Content
          className="appearance-dialog"
          tabIndex={-1}
          // Start on the panel itself rather than ringing the close button.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <div className="appearance-head">
            <Dialog.Title className="appearance-title">
              <Palette weight="duotone" aria-hidden="true" />
              Appearance
            </Dialog.Title>
            <Dialog.Close className="appearance-close" aria-label="Close">
              <X weight="bold" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="appearance-desc">
            Changes apply straight away and are remembered in this browser only.
          </Dialog.Description>

          <fieldset className="appearance-group">
            <legend>Mode</legend>
            <div className="appearance-modes">
              {[
                { id: "light", label: "Light", icon: Sun, value: false },
                { id: "dark", label: "Dark", icon: Moon, value: true },
              ].map((m) => (
                <label key={m.id} className="appearance-mode">
                  <input
                    type="radio"
                    name="appearance-mode"
                    value={m.id}
                    checked={dark === m.value}
                    onChange={() => setDarkTheme(m.value)}
                  />
                  <m.icon weight="duotone" aria-hidden="true" />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="appearance-group">
            <legend>Theme</legend>
            <div className="appearance-options">
              {PALETTES.map((p) => {
                const sw = dark ? p.dark : p.light;
                return (
                  <label key={p.id} className="appearance-option">
                    <input
                      type="radio"
                      name="appearance-palette"
                      value={p.id}
                      checked={palette === p.id}
                      onChange={() => setPalette(p.id)}
                    />
                    <span
                      className="appearance-swatch"
                      aria-hidden="true"
                      style={{ background: sw.background, color: sw.foreground }}
                    >
                      <span className="sw-bar" style={{ background: sw.primary }} />
                      <span className="sw-card" style={{ background: sw.card }}>
                        <span className="sw-line" style={{ background: sw.foreground }} />
                        <span className="sw-line short" style={{ background: sw.primary }} />
                      </span>
                    </span>
                    <span className="appearance-text">
                      <span className="appearance-name">{p.name}</span>
                      <span className="appearance-note">{p.description}</span>
                    </span>
                    <Check className="appearance-check" weight="bold" aria-hidden="true" />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="appearance-group">
            <legend>Font</legend>
            <div className="appearance-options">
              {FONTS.map((f) => (
                <label key={f.id} className="appearance-option">
                  <input
                    type="radio"
                    name="appearance-font"
                    value={f.id}
                    checked={font === f.id}
                    onChange={() => setFont(f.id)}
                  />
                  <span className="appearance-sample" aria-hidden="true">
                    <span style={{ fontFamily: f.heading }}>Aa</span>
                  </span>
                  <span className="appearance-text">
                    <span className="appearance-name" style={{ fontFamily: f.body }}>
                      {f.name}
                    </span>
                    <span className="appearance-note" style={{ fontFamily: f.body }}>
                      {f.description}
                    </span>
                  </span>
                  <Check className="appearance-check" weight="bold" aria-hidden="true" />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="appearance-foot">
            <button type="button" className="appearance-reset" onClick={resetAppearance}>
              Reset to default
            </button>
            <Dialog.Close className="appearance-done">Done</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Header button (website and workspace). */
export function AppearanceButton({ className = "", cta }: { className?: string; cta?: string }) {
  return (
    <button
      type="button"
      className={`appearance-btn ${className}`}
      aria-label="Appearance: theme, mode and font"
      title="Appearance"
      data-cta={cta}
      onClick={openAppearance}
    >
      <Palette weight="duotone" aria-hidden="true" />
    </button>
  );
}
