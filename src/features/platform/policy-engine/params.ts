/**
 * Tool-call parameter validation (least privilege at the argument level) — port of
 * platform/app/policy-engine/aegis_policy/params.py. Messages never echo parameter values.
 */
import { cpLen, isPlainObject, pyNumStr, pyRepr, pyTruthy } from "../../site/engines/shield/py";
import { PyTypeError, pyCompare, pyEq, pyFullmatch, pyIn } from "./pyre";

/** Bound regex work on hostile input. */
export const MAX_REGEX_INPUT = 10_000;

/** URL hostname as urllib.parse.urlsplit(v).hostname would report it (or null / "invalid"). */
function urlHostname(raw: string): string | null | "invalid" {
  const v = raw.replace(/[\t\r\n]/g, "");
  const scheme = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.exec(v);
  if (!scheme && !v.startsWith("//")) return null;
  const rest = v.slice(scheme ? scheme[0].length : 2);
  const authorityEnd = rest.search(/[/?#]/);
  const netloc = authorityEnd < 0 ? rest : rest.slice(0, authorityEnd);
  const hostport = netloc.includes("@") ? netloc.slice(netloc.lastIndexOf("@") + 1) : netloc;
  if (hostport.startsWith("[")) {
    const end = hostport.indexOf("]");
    if (end < 0) return "invalid";
    return hostport.slice(1, end).toLowerCase() || null;
  }
  if (hostport.includes("[") || hostport.includes("]")) return "invalid";
  const host = hostport.split(":", 1)[0] ?? "";
  return host ? host.toLowerCase() : null;
}

/** Host for a URL, e-mail address or bare hostname (lower-cased, NFKC, no trailing dot). */
export function extractHost(value: unknown): string | null {
  const v = String(value).normalize("NFKC").trim();
  if (!v) return null;
  let host: string | null;
  if (v.includes("://")) {
    const h = urlHostname(v);
    if (h === "invalid") return null;
    host = h;
  } else if (v.includes("@")) {
    host = v.slice(v.lastIndexOf("@") + 1);
  } else {
    host = (v.split("/", 1)[0] ?? "").split(":", 1)[0] ?? "";
  }
  if (!host) return null;
  host = host.trim().replace(/\.+$/, "").toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(host)) return null; // reject IDN/unicode or odd hosts rather than guess
  return host;
}

export function domainAllowed(value: unknown, allowList: readonly string[]): boolean {
  const host = extractHost(value);
  if (!host) return false;
  for (const raw of allowList) {
    const d = raw.toLowerCase().replace(/^[*.]+/, "").replace(/\.+$/, "");
    if (host === d || host.endsWith("." + d)) return true;
  }
  return false;
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === "number";

export type ParamSpec = Record<string, unknown>;
export type Problem = [code: string, message: string];

function num(v: unknown): string {
  return typeof v === "number" ? pyNumStr(v) : String(v);
}

function checkScalar(name: string, value: unknown, spec: ParamSpec, problems: Problem[]): void {
  if ("enum" in spec && !(Array.isArray(spec["enum"]) && spec["enum"].some((x) => pyEq(value, x)))) {
    problems.push(["enum", `parameter '${name}' is not one of the permitted values`]);
  }
  if (typeof value === "string") {
    const len = cpLen(value);
    if ("max_length" in spec && len > Number(spec["max_length"])) {
      problems.push([
        "max_length",
        `parameter '${name}' exceeds max length ${num(spec["max_length"])}`,
      ]);
    }
    if ("min_length" in spec && len < Number(spec["min_length"])) {
      problems.push(["min_length", `parameter '${name}' shorter than ${num(spec["min_length"])}`]);
    }
    if ("regex" in spec) {
      if (len > MAX_REGEX_INPUT || !pyFullmatch(String(spec["regex"]), value)) {
        problems.push(["regex", `parameter '${name}' does not match the required pattern`]);
      }
    }
    if (
      "domain_allow_list" in spec &&
      !domainAllowed(value, (spec["domain_allow_list"] as string[] | undefined) ?? [])
    ) {
      problems.push(["domain", `parameter '${name}' domain is not on the allow-list`]);
    }
  }
  if (isNum(value)) {
    if ("min" in spec && value < Number(spec["min"])) {
      problems.push(["min", `parameter '${name}' is below minimum ${num(spec["min"])}`]);
    }
    if ("max" in spec && value > Number(spec["max"])) {
      problems.push(["max", `parameter '${name}' exceeds maximum ${num(spec["max"])}`]);
    }
  }
}

/** Return [(code, message)] problems. Messages never echo parameter values. */
export function validateParams(
  rawParams: unknown,
  specs: Record<string, ParamSpec> | null | undefined,
  additionalAllowed = false,
): Problem[] {
  const problems: Problem[] = [];
  const params = pyTruthy(rawParams) ? rawParams : {};
  if (!isPlainObject(params)) return [["type", "tool parameters must be an object"]];
  for (const [name, spec] of Object.entries(specs ?? {})) {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      if (spec["required"]) problems.push(["required", `required parameter '${name}' missing`]);
      continue;
    }
    const value = params[name];
    const typ = spec["type"];
    const checks: Record<string, boolean> = {
      string: typeof value === "string",
      integer: isInt(value),
      number: isNum(value),
      boolean: typeof value === "boolean",
      array: Array.isArray(value),
    };
    const ok = typeof typ === "string" && typ in checks ? checks[typ] : true;
    if (!ok) {
      problems.push(["type", `parameter '${name}' must be of type ${String(typ)}`]);
      continue;
    }
    if (typ === "number" && typeof value === "number" && Number.isNaN(value)) {
      problems.push(["type", `parameter '${name}' is not a finite number`]);
      continue;
    }
    if (typ === "array" && Array.isArray(value)) {
      if ("max_items" in spec && value.length > Number(spec["max_items"])) {
        problems.push([
          "max_items",
          `parameter '${name}' has more than ${num(spec["max_items"])} items`,
        ]);
      }
      for (const item of value) checkScalar(name, item, spec, problems);
    } else {
      checkScalar(name, value, spec, problems);
    }
  }
  return problems.concat(extraCheck(params, specs, additionalAllowed));
}

function extraCheck(
  params: Record<string, unknown>,
  specs: Record<string, ParamSpec> | null | undefined,
  additionalAllowed: boolean,
): Problem[] {
  if (additionalAllowed) return [];
  const declared = specs ?? {};
  const extra = Object.keys(params)
    .filter((k) => !Object.prototype.hasOwnProperty.call(declared, k))
    .sort();
  return extra.length
    ? [["undeclared", `undeclared parameter(s) ${pyRepr(extra)} are not permitted`]]
    : [];
}

export interface ApprovalCondition {
  param: string;
  op: string;
  value: unknown;
  reason?: string;
}

/** Evaluate a require_approval_if condition. Missing parameter => met (conservative). */
export function conditionMet(params: unknown, cond: ApprovalCondition): [boolean, string] {
  const { param: name, op, value: target } = cond;
  if (!isPlainObject(params) || !Object.prototype.hasOwnProperty.call(params, name)) {
    return [true, `parameter '${name}' absent; approval required conservatively`];
  }
  const v = params[name];
  let met: boolean;
  try {
    switch (op) {
      case "gt":
        met = pyCompare(v, target) > 0;
        break;
      case "gte":
        met = pyCompare(v, target) >= 0;
        break;
      case "lt":
        met = pyCompare(v, target) < 0;
        break;
      case "lte":
        met = pyCompare(v, target) <= 0;
        break;
      case "eq":
        met = pyEq(v, target);
        break;
      case "ne":
        met = !pyEq(v, target);
        break;
      case "in":
        met = pyIn(v, target);
        break;
      case "not_in":
        met = !pyIn(v, target);
        break;
      default:
        throw new Error(`unknown condition operator ${op}`);
    }
  } catch (e) {
    if (e instanceof PyTypeError) {
      return [true, `parameter '${name}' not comparable; approval required conservatively`];
    }
    throw e;
  }
  const reason = cond.reason || `parameter '${name}' ${op} ${pyRepr(target)}`;
  return [met, reason];
}
