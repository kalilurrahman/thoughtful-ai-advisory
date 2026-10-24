// Progressive Web App rules shared by the install prompt, the service-worker registration and
// their tests. Pure functions only (no DOM access), so they are safe during SSR.

/** Hosts that serve the Lovable editor preview. A service worker must never cache those pages. */
const PREVIEW_ZONES = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "gpt-eng.com",
  "gptengineer.run",
] as const;
const UUID_LABEL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** localStorage key that turns the service worker on for local production-build testing. */
export const SW_OPT_IN_KEY = "veritrail-sw";

export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (PREVIEW_ZONES.some((z) => host === z || host.endsWith(`.${z}`))) return true;
  if (host === "lovable.app" || host.endsWith(".lovable.app")) {
    const label = host.split(".")[0] ?? "";
    return /^(id-preview|preview|project)(-[a-z0-9]+)?--/.test(label) || UUID_LABEL.test(label);
  }
  return false;
}

export interface SwContext {
  hostname: string;
  protocol: string;
  /** True when the page runs inside an iframe (the Lovable editor embeds its preview). */
  framed: boolean;
  /** import.meta.env.DEV */
  dev: boolean;
  /** localStorage[SW_OPT_IN_KEY] === "on" */
  optIn: boolean;
  supported: boolean;
}

/**
 * Register the offline service worker only on the published site: never in development, in an
 * iframe, on a Lovable preview host, or on localhost (unless explicitly opted in for testing).
 */
export function shouldRegisterServiceWorker(ctx: SwContext): boolean {
  if (!ctx.supported || ctx.dev || ctx.framed) return false;
  if (isPreviewHost(ctx.hostname)) return false;
  if (LOCAL_HOSTS.has(ctx.hostname.toLowerCase())) return ctx.optIn;
  return ctx.protocol === "https:";
}

export type InstallPlatform =
  /** Chromium (Chrome, Edge, Samsung Internet, Opera) fires beforeinstallprompt. */
  | "prompt"
  /** iPhone / iPad: Share → Add to Home Screen. */
  | "ios"
  /** Safari 17+ on macOS: File → Add to Dock. */
  | "mac-safari"
  | "unsupported";

export interface PlatformHints {
  userAgent: string;
  /** navigator.maxTouchPoints — iPadOS reports a Mac user agent. */
  maxTouchPoints: number;
  hasPromptEvent: boolean;
}

export function detectInstallPlatform(h: PlatformHints): InstallPlatform {
  if (h.hasPromptEvent) return "prompt";
  const ua = h.userAgent;
  const iPadOS = /Macintosh/.test(ua) && h.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) {
    // In-app browsers (Instagram, LinkedIn, Facebook) cannot add to the home screen.
    if (/FBAN|FBAV|Instagram|LinkedInApp|Line\//.test(ua)) return "unsupported";
    return "ios";
  }
  const safari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Firefox/.test(ua);
  const version = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0);
  if (/Macintosh/.test(ua) && safari && version >= 17) return "mac-safari";
  return "unsupported";
}

/** Days a "Not now" keeps the install card away. */
export const INSTALL_SNOOZE_DAYS = 14;
export const INSTALL_SNOOZE_KEY = "veritrail-install-snoozed";
export const INSTALL_VISITS_KEY = "veritrail-install-visits";

export function isSnoozed(storedAt: string | null, now: number): boolean {
  const at = Number(storedAt);
  if (!storedAt || !Number.isFinite(at)) return false;
  return now - at < INSTALL_SNOOZE_DAYS * 86_400_000;
}

/** Routes where an install suggestion would interrupt a task. */
const QUIET_ROUTES = /^\/(auth|reset-password|onboarding|contact)(\/|$)/;

export interface EngagementState {
  pathname: string;
  /** Distinct pages viewed in this tab. */
  pagesViewed: number;
  /** Milliseconds since the first page view in this tab. */
  elapsedMs: number;
}

/** Suggest installing only once someone has shown interest: two pages, or 40 seconds reading. */
export function isEngaged(s: EngagementState): boolean {
  if (QUIET_ROUTES.test(s.pathname)) return false;
  return s.pagesViewed >= 2 || s.elapsedMs >= 40_000;
}

/** Window property where PWA_INIT_SCRIPT keeps the deferred install prompt. */
export const INSTALL_GLOBAL = "__veritrailInstall";
export const INSTALL_CHANGE_EVENT = "veritrail-install-change";

/**
 * Inline <head> script. Chromium fires `beforeinstallprompt` once, often before React hydrates,
 * so it is captured here (which also stops the browser's own mini-infobar) and handed to the
 * install card later. `appinstalled` is recorded the same way.
 */
export const PWA_INIT_SCRIPT = `(function(){var s=window.${INSTALL_GLOBAL}={event:null,installed:false};function c(){window.dispatchEvent(new Event(${JSON.stringify(
  INSTALL_CHANGE_EVENT,
)}))}window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();s.event=e;c()});window.addEventListener("appinstalled",function(){s.event=null;s.installed=true;c()})})();`;
