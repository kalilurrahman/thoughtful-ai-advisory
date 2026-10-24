import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INSTALL_GLOBAL,
  INSTALL_SNOOZE_DAYS,
  INSTALL_SNOOZE_KEY,
  PWA_INIT_SCRIPT,
  detectInstallPlatform,
  isEngaged,
  isPreviewHost,
  isSnoozed,
  shouldRegisterServiceWorker,
  type SwContext,
} from "@/features/pwa/pwa-core";
import { requestInstall } from "@/features/pwa/install-store";
import { getSitePage } from "@/features/site/pages";

const PUBLIC = join(process.cwd(), "public");

const UA = {
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0 Mobile/15E148 Safari/604.1",
  instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0",
  macSafari17:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  macSafari16:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  firefox: "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
};

describe("service-worker gating", () => {
  const published: SwContext = {
    hostname: "thoughtful-ai-governance.lovable.app",
    protocol: "https:",
    framed: false,
    dev: false,
    optIn: false,
    supported: true,
  };

  it("recognises Lovable preview hosts but not the published site", () => {
    expect(isPreviewHost("id-preview--3f0c2e1a-1b2c-4d5e-8f90-123456789abc.lovable.app")).toBe(
      true,
    );
    expect(isPreviewHost("preview--thoughtful-ai-governance.lovable.app")).toBe(true);
    expect(isPreviewHost("3f0c2e1a-1b2c-4d5e-8f90-123456789abc.lovableproject.com")).toBe(true);
    expect(isPreviewHost("thoughtful-ai-governance.lovable.app")).toBe(false);
    expect(isPreviewHost("www.veritrail.example")).toBe(false);
  });

  it("registers only on the published https site", () => {
    expect(shouldRegisterServiceWorker(published)).toBe(true);
    expect(shouldRegisterServiceWorker({ ...published, dev: true })).toBe(false);
    expect(shouldRegisterServiceWorker({ ...published, framed: true })).toBe(false);
    expect(shouldRegisterServiceWorker({ ...published, supported: false })).toBe(false);
    expect(shouldRegisterServiceWorker({ ...published, protocol: "http:" })).toBe(false);
    expect(
      shouldRegisterServiceWorker({
        ...published,
        hostname: "id-preview--3f0c2e1a-1b2c-4d5e-8f90-123456789abc.lovable.app",
      }),
    ).toBe(false);
  });

  it("stays off on localhost unless opted in for testing", () => {
    const local = { ...published, hostname: "localhost", protocol: "http:" };
    expect(shouldRegisterServiceWorker(local)).toBe(false);
    expect(shouldRegisterServiceWorker({ ...local, optIn: true })).toBe(true);
    expect(shouldRegisterServiceWorker({ ...local, hostname: "127.0.0.1", optIn: true })).toBe(
      true,
    );
  });
});

describe("install platform detection", () => {
  const detect = (userAgent: string, hasPromptEvent = false, maxTouchPoints = 0) =>
    detectInstallPlatform({ userAgent, hasPromptEvent, maxTouchPoints });

  it("uses the browser prompt wherever one was captured", () => {
    expect(detect(UA.chromeAndroid, true)).toBe("prompt");
    expect(detect(UA.macChrome, true)).toBe("prompt");
  });

  it("offers Home Screen instructions on iPhone and iPad", () => {
    expect(detect(UA.iphone)).toBe("ios");
    expect(detect(UA.iphoneChrome)).toBe("ios");
    // iPadOS reports a Mac user agent with touch support.
    expect(detect(UA.macSafari17, false, 5)).toBe("ios");
  });

  it("offers Add to Dock on Safari 17+ for Mac only", () => {
    expect(detect(UA.macSafari17)).toBe("mac-safari");
    expect(detect(UA.macSafari16)).toBe("unsupported");
  });

  it("offers nothing where the browser cannot install", () => {
    expect(detect(UA.instagram)).toBe("unsupported");
    expect(detect(UA.firefox)).toBe("unsupported");
    expect(detect(UA.chromeAndroid)).toBe("unsupported");
  });
});

describe("install card timing", () => {
  it("waits for two pages or 40 seconds, and stays off task pages", () => {
    expect(isEngaged({ pathname: "/", pagesViewed: 1, elapsedMs: 5_000 })).toBe(false);
    expect(isEngaged({ pathname: "/framework", pagesViewed: 2, elapsedMs: 5_000 })).toBe(true);
    expect(isEngaged({ pathname: "/", pagesViewed: 1, elapsedMs: 41_000 })).toBe(true);
    expect(isEngaged({ pathname: "/auth", pagesViewed: 5, elapsedMs: 90_000 })).toBe(false);
    expect(isEngaged({ pathname: "/contact/request-demo", pagesViewed: 5, elapsedMs: 0 })).toBe(
      false,
    );
  });

  it("snoozes 'Not now' for a fortnight", () => {
    const now = Date.UTC(2026, 9, 24);
    expect(isSnoozed(null, now)).toBe(false);
    expect(isSnoozed("not-a-number", now)).toBe(false);
    expect(isSnoozed(String(now - 86_400_000), now)).toBe(true);
    expect(isSnoozed(String(now - INSTALL_SNOOZE_DAYS * 86_400_000 - 1), now)).toBe(false);
  });
});

describe("install prompt capture", () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)[INSTALL_GLOBAL];
    localStorage.clear();
  });

  it("captures beforeinstallprompt before React mounts and suppresses the mini-infobar", () => {
    new Function(PWA_INIT_SCRIPT)();
    const changed = vi.fn();
    window.addEventListener("veritrail-install-change", changed);
    const event = new Event("beforeinstallprompt", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    const captured = (window as unknown as Record<string, { event: Event | null }>)[INSTALL_GLOBAL];
    expect(captured?.event).toBe(event);
    expect(changed).toHaveBeenCalled();
    window.dispatchEvent(new Event("appinstalled"));
    expect(captured?.event).toBeNull();
    window.removeEventListener("veritrail-install-change", changed);
  });

  it("shows the browser dialog once and snoozes a dismissal", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    (window as unknown as Record<string, unknown>)[INSTALL_GLOBAL] = {
      event: { prompt, userChoice: Promise.resolve({ outcome: "dismissed" }) },
      installed: false,
    };
    await expect(requestInstall()).resolves.toBe("dismissed");
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(INSTALL_SNOOZE_KEY)).not.toBeNull();
    // The deferred prompt is spent: the next request falls back to instructions.
    await expect(requestInstall()).resolves.toBe("instructions");
  });
});

/** Width and height from a PNG or JPEG file header. */
function imageSize(file: string): [number, number] {
  const b = readFileSync(file);
  if (b.toString("ascii", 1, 4) === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    // Walk the JPEG segments to the start-of-frame marker.
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1] ?? 0;
      const length = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + length;
    }
  }
  throw new Error(`unknown image format: ${file}`);
}

describe("web app manifest", () => {
  const manifest = JSON.parse(readFileSync(join(PUBLIC, "manifest.webmanifest"), "utf8")) as {
    id: string;
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
    shortcuts: Array<{ url: string; icons: Array<{ src: string; sizes: string }> }>;
    screenshots: Array<{ src: string; sizes: string; form_factor: string; label: string }>;
  };

  it("meets the installability criteria", () => {
    expect(manifest.id).toBe("/");
    expect(manifest.name).toContain("VERITRAIL");
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
    expect(manifest.display).toBe("standalone");
    for (const purpose of ["any", "maskable"])
      for (const size of ["192x192", "512x512"])
        expect(
          manifest.icons.some((i) => i.purpose === purpose && i.sizes === size),
          `${purpose} ${size}`,
        ).toBe(true);
  });

  it("points at icons and screenshots that exist at the declared sizes", () => {
    const images = [
      ...manifest.icons.filter((i) => i.type === "image/png"),
      ...manifest.shortcuts.flatMap((s) => s.icons),
      ...manifest.screenshots,
    ];
    for (const img of images) {
      const file = join(PUBLIC, img.src);
      expect(existsSync(file), img.src).toBe(true);
      expect(imageSize(file).join("x"), img.src).toBe(img.sizes);
    }
    expect(existsSync(join(PUBLIC, "icons", "apple-touch-icon.png"))).toBe(true);
  });

  it("offers wide and narrow screenshots for the richer install dialog", () => {
    expect(manifest.screenshots.some((s) => s.form_factor === "wide")).toBe(true);
    expect(manifest.screenshots.some((s) => s.form_factor === "narrow")).toBe(true);
    for (const s of manifest.screenshots) expect(s.label).toBeTruthy();
  });

  it("links every shortcut to a real page", () => {
    const routes = new Set(["/framework/controls", "/workspace"]);
    for (const s of manifest.shortcuts)
      expect(routes.has(s.url) || getSitePage(s.url) !== undefined, s.url).toBe(true);
  });
});

type Strategy = (request: { method: string; mode: string }, url: URL, origin: string) => string;

function loadServiceWorker() {
  const listeners: Record<string, unknown> = {};
  const self: Record<string, unknown> = {
    location: new URL("https://www.veritrail.example/sw.js"),
    registration: {},
    addEventListener: (type: string, fn: unknown) => (listeners[type] = fn),
  };
  new Function("self", readFileSync(join(PUBLIC, "sw.js"), "utf8"))(self);
  const api = self["__veritrailSw"] as { strategyFor: Strategy; pageKey: (u: URL) => string };
  return { ...api, listeners };
}

describe("service worker caching rules", () => {
  const { strategyFor, pageKey, listeners } = loadServiceWorker();
  const origin = "https://www.veritrail.example";
  const get = (path: string, mode = "no-cors") =>
    strategyFor({ method: "GET", mode }, new URL(path, origin), origin);

  it("handles install, activate, fetch and cache-warming messages", () => {
    expect(Object.keys(listeners).sort()).toEqual(["activate", "fetch", "install", "message"]);
  });

  it("keeps pages fresh (network first) and never stores sign-in or query pages", () => {
    expect(get("/", "navigate")).toBe("page");
    expect(get("/?source=pwa", "navigate")).toBe("page");
    expect(get("/framework/controls/is-11", "navigate")).toBe("page");
    expect(get("/auth", "navigate")).toBe("page-no-store");
    expect(get("/reset-password?token=abc", "navigate")).toBe("page-no-store");
    expect(get("/tools/risk-triage?domain=credit", "navigate")).toBe("page-no-store");
  });

  it("never intercepts writes, server functions or other origins", () => {
    expect(strategyFor({ method: "POST", mode: "cors" }, new URL("/", origin), origin)).toBe(
      "bypass",
    );
    expect(get("/_serverFn/abc123")).toBe("bypass");
    expect(get("/sw.js")).toBe("bypass");
    expect(get("https://abc.supabase.co/rest/v1/site_leads")).toBe("bypass");
    expect(get("/downloads/veritrail-blueprint.pdf")).toBe("bypass");
  });

  it("caches hashed build assets, icons and fonts", () => {
    expect(get("/assets/index-3f2a1b.js")).toBe("asset");
    expect(get("/icons/icon-192.png")).toBe("static");
    expect(get("/manifest.webmanifest")).toBe("static");
    expect(get("https://fonts.gstatic.com/s/sourceserif4/v8/x.woff2")).toBe("font");
  });

  it("stores pages under their path only", () => {
    expect(pageKey(new URL("/?source=pwa", origin))).toBe(`${origin}/`);
    expect(pageKey(new URL("/tools/risk-triage/", origin))).toBe(`${origin}/tools/risk-triage`);
  });

  it("ships an offline fallback page", () => {
    const html = readFileSync(join(PUBLIC, "offline.html"), "utf8");
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain("veritrail-pages-");
  });
});
