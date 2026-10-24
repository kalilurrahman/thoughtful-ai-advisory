import { useSyncExternalStore } from "react";
import {
  INSTALL_CHANGE_EVENT,
  INSTALL_GLOBAL,
  INSTALL_SNOOZE_KEY,
  detectInstallPlatform,
  type InstallPlatform,
} from "./pwa-core";

// One install state for the whole app: the header button, the workspace button and the install
// card all read it, so a prompt used (or an app installed) in one place updates the others.

interface DeferredPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface CapturedInstall {
  event: DeferredPrompt | null;
  installed: boolean;
}

export interface InstallState {
  platform: InstallPlatform;
  /** Running as the installed app (display-mode standalone, or iOS home-screen web app). */
  standalone: boolean;
  /** Installed during this visit. */
  installed: boolean;
  /** The step-by-step instructions sheet (iOS, Safari) is open. */
  sheetOpen: boolean;
  /** Something can be offered: a browser prompt or manual instructions. */
  canInstall: boolean;
}

const SERVER_STATE: InstallState = {
  platform: "unsupported",
  standalone: false,
  installed: false,
  sheetOpen: false,
  canInstall: false,
};

let snapshot: InstallState = SERVER_STATE;
let sheetOpen = false;

function captured(): CapturedInstall {
  const w = window as unknown as Record<string, CapturedInstall | undefined>;
  return (w[INSTALL_GLOBAL] ??= { event: null, installed: false });
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function compute(): InstallState {
  const c = captured();
  const platform = detectInstallPlatform({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    hasPromptEvent: c.event !== null,
  });
  const standalone = isStandalone();
  return {
    platform,
    standalone,
    installed: c.installed,
    sheetOpen,
    canInstall: !standalone && !c.installed && platform !== "unsupported",
  };
}

function refresh(): void {
  const next = compute();
  const same = (Object.keys(next) as Array<keyof InstallState>).every(
    (k) => next[k] === snapshot[k],
  );
  if (!same) snapshot = next;
}

function notify(): void {
  window.dispatchEvent(new Event(INSTALL_CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  const handler = () => {
    refresh();
    onChange();
  };
  const mq = window.matchMedia?.("(display-mode: standalone)");
  window.addEventListener(INSTALL_CHANGE_EVENT, handler);
  mq?.addEventListener?.("change", handler);
  handler();
  return () => {
    window.removeEventListener(INSTALL_CHANGE_EVENT, handler);
    mq?.removeEventListener?.("change", handler);
  };
}

function getSnapshot(): InstallState {
  return snapshot;
}

/** Install availability for this browser. Renders as "nothing to offer" on the server. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

export function setInstallSheetOpen(open: boolean): void {
  sheetOpen = open;
  notify();
}

/** Remember "Not now" so the card stays away for INSTALL_SNOOZE_DAYS. */
export function snoozeInstall(): void {
  try {
    localStorage.setItem(INSTALL_SNOOZE_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the card simply stays dismissed for this page */
  }
}

/**
 * Show the browser's install dialog where there is one, otherwise the instructions sheet.
 * Resolves to the browser's outcome, or "instructions".
 */
export async function requestInstall(): Promise<"accepted" | "dismissed" | "instructions"> {
  const c = captured();
  if (!c.event) {
    setInstallSheetOpen(true);
    return "instructions";
  }
  const event = c.event;
  // A deferred prompt can only be shown once.
  c.event = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "dismissed") snoozeInstall();
  notify();
  return outcome;
}
