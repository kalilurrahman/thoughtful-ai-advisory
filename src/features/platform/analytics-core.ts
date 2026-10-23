/*
 * Privacy-friendly analytics — shared pure rules (no DOM, no I/O; safe for SSR and Workers).
 *
 * Ports of:
 *  - platform/app/website/static/js/analytics.js — event allow-list, Do-Not-Track / Global
 *    Privacy Control opt-out, client-side prop sanitising, path = location.pathname only;
 *  - platform/app/api/veritrail_api/server.py (VeritrailApp.event, _str, RateLimiter) — server-side
 *    validation: allow-listed names, path without query string, at most 10 scalar props with
 *    keys <= 40 chars (no "email" keys) and values stringified to <= 120 chars;
 *  - platform/app/admin/veritrail_admin/cli.py (FUNNEL, funnel()) — funnel computation.
 *
 * Cookieless: no cookies, no client or session identifiers, no IP address or user agent stored.
 */
import { sha256Hex } from "./audit";
import { pyFloatStr, pyRound, pyStr, pyStrip } from "@/features/site/engines/shield/py";

export const EVENT_NAMES = [
  "page_view",
  "cta_click",
  "assessment_start",
  "assessment_step",
  "assessment_preliminary",
  "assessment_gate_view",
  "assessment_lead_submitted",
  "assessment_report_download",
  "form_submit",
  "tool_use",
  "outbound_click",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
const EVENT_SET: ReadonlySet<string> = new Set(EVENT_NAMES);

export function isEventName(name: unknown): name is EventName {
  return typeof name === "string" && EVENT_SET.has(name);
}

/** Funnel steps, in order (cli.py FUNNEL). */
export const FUNNEL: readonly EventName[] = [
  "page_view",
  "assessment_start",
  "assessment_preliminary",
  "assessment_gate_view",
  "assessment_lead_submitted",
  "assessment_report_download",
];

export type PropValue = string | number | boolean;
export type EventProps = Record<string, PropValue>;

// ----------------------------------------------------------------- client rules (analytics.js)

const BLOCKED_KEY = /(email|name|phone|company|message|address|ip|user)/i;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+/;

export interface TrackingEnv {
  navigator?: {
    doNotTrack?: string | null;
    msDoNotTrack?: string | null;
    globalPrivacyControl?: boolean | string;
  };
  doNotTrack?: string | null;
}

/** trackingAllowed(): false when Do Not Track or Global Privacy Control is enabled. */
export function trackingAllowed(env: TrackingEnv | undefined): boolean {
  const nav = env?.navigator ?? {};
  const dnt: unknown = nav.doNotTrack ?? env?.doNotTrack ?? nav.msDoNotTrack;
  if (dnt === "1" || dnt === "yes" || dnt === 1) return false;
  if (nav.globalPrivacyControl === true || nav.globalPrivacyControl === "1") return false;
  return true;
}

/** sanitizeProps(): <= 10 keys, no personal-looking keys, scalars only, no email-like strings. */
export function sanitizeProps(props: unknown): EventProps {
  const out: EventProps = {};
  if (!props || typeof props !== "object") return out;
  const o = props as Record<string, unknown>;
  for (const k of Object.keys(o).slice(0, 10)) {
    const v = o[k];
    if (BLOCKED_KEY.test(k)) continue;
    if (typeof v === "number" || typeof v === "boolean") {
      out[k.slice(0, 40)] = v;
    } else if (typeof v === "string") {
      if (EMAIL_LIKE.test(v)) continue;
      out[k.slice(0, 40)] = v.slice(0, 120);
    }
  }
  return out;
}

export interface EventBody {
  name: string;
  path: string;
  props: EventProps;
}

/** buildEvent(): {name, path (pathname only, <= 200 chars), props (sanitised)}. */
export function buildEvent(name: string, props: unknown, pathname: string | undefined): EventBody {
  return { name, path: String(pathname || "/").slice(0, 200), props: sanitizeProps(props) };
}

// ----------------------------------------------------------------- server rules (server.py)

/** VeritrailApp._str(): str(), strip, drop control characters, truncate. */
export function cleanStr(v: unknown, maxlen = 200): string {
  if (v === null || v === undefined) return "";
  const s = pyStrip(pyStr(v))
    // eslint-disable-next-line no-control-regex -- same character class as server.py
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  return Array.from(s).slice(0, maxlen).join("");
}

export interface StoredEvent {
  name: EventName;
  path: string;
  props: Record<string, string>;
}

export type EventValidation = { ok: true; event: StoredEvent } | { ok: false; error: string };

/** VeritrailApp.event(): validate and normalise an incoming event before storage. */
export function validateEvent(data: unknown): EventValidation {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const name = cleanStr(d["name"], 60);
  if (!isEventName(name)) return { ok: false, error: "Unknown event." };
  const path = cleanStr(d["path"], 200).split("?")[0] ?? "";
  const rawProps = d["props"];
  const propsIn =
    rawProps && typeof rawProps === "object" && !Array.isArray(rawProps)
      ? (rawProps as Record<string, unknown>)
      : {};
  const props: Record<string, string> = {};
  for (const [k, v] of Object.entries(propsIn).slice(0, 10)) {
    if (!["string", "number", "boolean"].includes(typeof v)) continue;
    if (k.toLowerCase().includes("email")) continue;
    props[cleanStr(k, 40)] = cleanStr(v, 120);
  }
  return { ok: true, event: { name, path, props } };
}

/**
 * RateLimiter: fixed-window limiter keyed by a salted hash of the client address. The address is
 * never stored; hashes live only in this isolate's memory.
 */
export class RateLimiter {
  private hits = new Map<string, [number, number]>();
  private readonly salt: string;

  constructor(
    readonly limit = 60,
    readonly windowSec = 60,
    private readonly now: () => number = () => Date.now() / 1000,
  ) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    this.salt = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  allow(client: string, bucket: string): boolean {
    const key = sha256Hex(`${this.salt}${bucket}|${client}`);
    const win = Math.floor(this.now() / this.windowSec);
    let [w, n] = this.hits.get(key) ?? [win, 0];
    if (w !== win) [w, n] = [win, 0];
    n += 1;
    this.hits.set(key, [w, n]);
    if (this.hits.size > 50_000) {
      for (const [k, v] of this.hits) if (v[0] !== win) this.hits.delete(k);
    }
    return n <= this.limit;
  }
}

// ----------------------------------------------------------------- funnel (cli.py)

export interface FunnelStep {
  step: string;
  count: number;
  conversion_from_previous: number | null;
}

export interface FunnelReport {
  events: number;
  funnel: FunnelStep[];
  cta_clicks: Record<string, number>;
}

/** Funnel from per-event counts (what the admin server function can query cheaply). */
export function funnelFromCounts(
  counts: Partial<Record<string, number>>,
  totalEvents: number,
  ctaClicks: Record<string, number> = {},
): FunnelReport {
  const steps: FunnelStep[] = [];
  let prev: number | null = null;
  for (const name of FUNNEL) {
    const n = counts[name] ?? 0;
    steps.push({
      step: name,
      count: n,
      conversion_from_previous: prev ? pyRound((n / prev) * 100, 1) : null,
    });
    prev = n || prev;
  }
  return { events: totalEvents, funnel: steps, cta_clicks: ctaClicks };
}

/** Python str() of a JSON dict key (None -> "None"). */
function ctaKey(v: unknown): string {
  return v === undefined || v === null ? "None" : pyStr(v);
}

/** funnel(var): the same computation over a list of stored events. */
export function computeFunnel(
  events: ReadonlyArray<{ name: string; props?: Record<string, unknown> | null }>,
): FunnelReport {
  const counts: Record<string, number> = {};
  const ctas: Record<string, number> = {};
  for (const e of events) {
    counts[e.name] = (counts[e.name] ?? 0) + 1;
    if (e.name === "cta_click") {
      const k = ctaKey(e.props?.["cta"]);
      ctas[k] = (ctas[k] ?? 0) + 1;
    }
  }
  return funnelFromCounts(counts, events.length, ctas);
}

/** cmd_analytics_funnel() text output. */
export function funnelText(f: FunnelReport): string {
  const lines = [`Total events: ${f.events}`];
  for (const s of f.funnel) {
    const conv =
      s.conversion_from_previous === null ? "—" : `${pyFloatStr(s.conversion_from_previous)}%`;
    lines.push(`  ${s.step.padEnd(30)} ${String(s.count).padStart(6)}   conv ${conv}`);
  }
  const ctas = Object.entries(f.cta_clicks);
  if (ctas.length) lines.push("CTA clicks: " + ctas.map(([k, v]) => `${k}=${v}`).join(", "));
  return lines.join("\n");
}
