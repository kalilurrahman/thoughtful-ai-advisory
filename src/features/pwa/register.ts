import { SW_OPT_IN_KEY, shouldRegisterServiceWorker } from "./pwa-core";

// Service-worker registration for the published site (see public/sw.js for the caching rules).

function optedIn(): boolean {
  try {
    return localStorage.getItem(SW_OPT_IN_KEY) === "on";
  } catch {
    return false;
  }
}

function framed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Hand the worker the build assets this page loaded, so it can be read again offline. */
function warmCache(worker: ServiceWorker | null | undefined): void {
  if (!worker) return;
  const urls = performance
    .getEntriesByType("resource")
    .map((e) => e.name)
    .filter((u) => u.startsWith(`${location.origin}/assets/`));
  if (urls.length) worker.postMessage({ type: "WARM", urls });
}

interface LaunchParams {
  targetURL?: string;
}
interface LaunchQueue {
  setConsumer: (consumer: (params: LaunchParams) => void) => void;
}

/**
 * The manifest asks for `focus-existing`: re-launching the app focuses the open window instead of
 * reloading it. A home-screen shortcut still has to take you where it says, so navigate then.
 */
function handleLaunches(navigate: (href: string) => void): void {
  const queue = (window as Window & { launchQueue?: LaunchQueue }).launchQueue;
  queue?.setConsumer((params) => {
    if (!params.targetURL) return;
    const target = new URL(params.targetURL);
    if (target.origin !== location.origin) return;
    target.searchParams.delete("source");
    const href = `${target.pathname}${target.search}${target.hash}`;
    if (href !== "/" && href !== `${location.pathname}${location.search}${location.hash}`)
      navigate(href);
  });
}

export function setUpServiceWorker(navigate: (href: string) => void): void {
  if (typeof window === "undefined") return;
  handleLaunches(navigate);
  const sw = navigator.serviceWorker;
  const allowed = shouldRegisterServiceWorker({
    hostname: location.hostname,
    protocol: location.protocol,
    framed: framed(),
    dev: import.meta.env.DEV,
    optIn: optedIn(),
    supported: !!sw,
  });
  if (!sw) return;
  if (!allowed) {
    // A worker left behind on a host that must not have one (a preview, say) is removed.
    void sw
      .getRegistrations()
      .then((regs) => regs.forEach((r) => void r.unregister()))
      .catch(() => undefined);
    return;
  }
  const register = () =>
    sw
      .register("/sw.js", { scope: "/" })
      .then(() => sw.ready)
      .then((reg) => warmCache(reg.active))
      .catch(() => {
        /* offline support is an enhancement; the site works without it */
      });
  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
}
