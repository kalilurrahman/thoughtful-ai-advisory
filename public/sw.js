/* VERITRAIL service worker — offline reading for the installed app and the published site.
 *
 * Registered only on the published site (src/features/pwa/register.ts): never in development,
 * inside the Lovable editor iframe, on Lovable preview hosts, or on localhost unless opted in.
 *
 *  - Pages (navigations): network first, so an online visitor always gets the latest HTML. The
 *    response is kept so the page can be re-read offline; with no copy, /offline.html is shown.
 *  - Build assets (/assets/*, content-hashed): cache first — a hashed file never changes.
 *  - Icons, manifest and Google Fonts: stale-while-revalidate.
 *  - Never touched: non-GET requests, server functions, Supabase/auth, sign-in pages and any URL
 *    with a query string (tokens, filters), so private or live data is never cached.
 *
 * Kill switch: replace this file with one that calls self.registration.unregister() in its
 * activate handler and deletes the "veritrail-" caches.
 */
const VERSION = "v1";
const STATIC_CACHE = `veritrail-static-${VERSION}`;
const PAGE_CACHE = `veritrail-pages-${VERSION}`;
const FONT_CACHE = `veritrail-fonts-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGE_CACHE, FONT_CACHE];
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];
const MAX_PAGES = 80;
const MAX_ASSETS = 160;
/** On a very slow connection, show the saved copy after this long (the fetch still refreshes it). */
const NAVIGATION_TIMEOUT_MS = 6000;
const NO_STORE_PAGES = /^\/(auth|reset-password|onboarding|platform\/admin)(\/|$)/;
const STATIC_FILE = /\.(?:png|svg|ico|webp|jpe?g|woff2?|webmanifest)$/i;

/**
 * Which caching strategy a request gets: "page", "page-no-store", "asset", "static", "font" or
 * "bypass" (the browser handles it as if there were no service worker).
 */
function strategyFor(request, url, origin) {
  if (request.method !== "GET") return "bypass";
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") return "font";
  if (url.origin !== origin) return "bypass";
  if (/^\/(_serverFn|_server|api)(\/|$)/.test(url.pathname)) return "bypass";
  if (request.mode === "navigate") {
    const search = new URLSearchParams(url.search);
    search.delete("source");
    if (NO_STORE_PAGES.test(url.pathname) || [...search.keys()].length > 0) return "page-no-store";
    return "page";
  }
  if (url.pathname.startsWith("/assets/")) return "asset";
  if (url.pathname === "/sw.js") return "bypass";
  if (STATIC_FILE.test(url.pathname)) return "static";
  return "bypass";
}

/** Cache key for a page: path only, without "?source=pwa" or a trailing slash. */
function pageKey(url) {
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  return new URL(path, url.origin).href;
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE);
      // The home page is a convenience, not a requirement: install even if it fails.
      try {
        const res = await fetch("/", { credentials: "same-origin" });
        if (res.ok) await (await caches.open(PAGE_CACHE)).put(pageKey(new URL("/", self.location.origin)), res);
      } catch {
        /* offline during install */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("veritrail-") && !CURRENT_CACHES.includes(n))
          .map((n) => caches.delete(n)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

async function networkPage(event) {
  const preload = await event.preloadResponse;
  return preload || fetch(event.request);
}

async function handlePage(event, store) {
  const url = new URL(event.request.url);
  const cache = await caches.open(PAGE_CACHE);
  const key = pageKey(url);
  const network = networkPage(event).then(async (res) => {
    if (store && res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
      await cache.put(key, res.clone());
      await trim(PAGE_CACHE, MAX_PAGES);
    }
    return res;
  });
  event.waitUntil(network.catch(() => undefined));
  const saved = store ? await cache.match(key) : undefined;
  try {
    if (!saved) return await network;
    // A saved copy exists: wait for the network, but not forever.
    return await Promise.race([
      network,
      new Promise((resolve) => setTimeout(() => resolve(saved), NAVIGATION_TIMEOUT_MS)),
    ]);
  } catch {
    return saved || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    await cache.put(request, res.clone());
    await trim(cacheName, max);
  }
  return res;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then(async (res) => {
      if (res.ok || res.type === "opaque") await cache.put(event.request, res.clone());
      return res;
    })
    .catch(() => undefined);
  event.waitUntil(refresh);
  return hit || (await refresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const strategy = strategyFor(event.request, url, self.location.origin);
  if (strategy === "bypass") return;
  if (strategy === "page") event.respondWith(handlePage(event, true));
  else if (strategy === "page-no-store") event.respondWith(handlePage(event, false));
  else if (strategy === "asset") event.respondWith(cacheFirst(event.request, STATIC_CACHE, MAX_ASSETS));
  else if (strategy === "static") event.respondWith(staleWhileRevalidate(event, STATIC_CACHE));
  else if (strategy === "font") event.respondWith(staleWhileRevalidate(event, FONT_CACHE));
});

// The page sends the build assets it has already loaded, so the first visit is enough to read
// that page again offline.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "WARM" || !Array.isArray(data.urls)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      for (const href of data.urls.slice(0, 120)) {
        try {
          const url = new URL(href, self.location.origin);
          if (url.origin !== self.location.origin || !url.pathname.startsWith("/assets/")) continue;
          if (await cache.match(url.href)) continue;
          const res = await fetch(url.href);
          if (res.ok) await cache.put(url.href, res);
        } catch {
          /* best effort */
        }
      }
    })(),
  );
});

// Exposed for the unit tests (src/test/pwa.test.ts), which evaluate this file in a sandbox.
self.__veritrailSw = { strategyFor, pageKey };
