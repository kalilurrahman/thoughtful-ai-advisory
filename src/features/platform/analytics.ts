/*
 * Client analytics helper — port of platform/app/website/static/js/analytics.js.
 *
 *  - track(name, props): fire-and-forget; never throws; returns false during SSR, for names
 *    outside the allow-list, or when Do Not Track / Global Privacy Control is enabled.
 *  - usePageViewTracking(): mount once in the site layout; sends page_view on every route
 *    change (the SPA equivalent of one page_view per page load) and, like analytics.js init(),
 *    cta_click for elements with data-cta and outbound_click (host only) for external links.
 *
 * Cookieless: only {name, path (pathname, no query/fragment), sanitised props} are sent.
 */
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { buildEvent, isEventName, trackingAllowed, type EventName } from "./analytics-core";
import { trackEvent } from "./analytics.functions";

export { EVENT_NAMES, FUNNEL, type EventName } from "./analytics-core";

export function track(name: EventName | string, props: Record<string, unknown> = {}): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (!isEventName(name) || !trackingAllowed(window as never)) return false;
    const body = buildEvent(name, props, window.location?.pathname);
    void trackEvent({ data: body }).catch(() => {
      /* analytics must never break the page */
    });
    return true;
  } catch {
    return false;
  }
}

export function usePageViewTracking(): void {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    track("page_view", {});
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onClick = (ev: MouseEvent) => {
      try {
        const target = ev.target as Element | null;
        const t = target?.closest?.("a, button");
        if (!t) return;
        const cta = t.getAttribute("data-cta");
        if (cta) {
          track("cta_click", { cta });
          return;
        }
        if (t instanceof HTMLAnchorElement && /^https?:/i.test(t.href || "")) {
          if (t.host !== window.location.host) track("outbound_click", { host: t.host });
        }
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}
