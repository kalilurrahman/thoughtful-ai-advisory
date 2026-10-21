/**
 * Small helpers that reproduce Python semantics the AEGIS reference engines rely on
 * (str()/repr() formatting, truthiness, round(), str.strip(), code-point slicing).
 * Pure functions: safe for SSR and the browser.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

/** Characters Python's str.strip() removes (str.isspace()). */
const PY_WS =
  "\\t\\n\\v\\f\\r\\x1c-\\x20\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
const PY_STRIP_RE = new RegExp(`^[${PY_WS}]+|[${PY_WS}]+$`, "g");

export function pyStrip(s: string): string {
  return s.replace(PY_STRIP_RE, "");
}

/** Length in code points (Python len()). */
export function cpLen(s: string): number {
  return Array.from(s).length;
}

/** First `n` code points (Python s[:n]). */
export function cpSlice(s: string, n: number): string {
  return cpLen(s) <= n ? s : Array.from(s).slice(0, n).join("");
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Python truthiness for JSON-like values. */
export function pyTruthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === 0 || v === "") return false;
  if (typeof v === "number" && Number.isNaN(v)) return true;
  if (Array.isArray(v)) return v.length > 0;
  if (isPlainObject(v)) return Object.keys(v).length > 0;
  return true;
}

/** Python `x in (None, "", [], {})`-style emptiness (== comparison). */
export function pyIsEmptyLike(v: unknown, opts: { list?: boolean; dict?: boolean } = {}): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (opts.list && Array.isArray(v) && v.length === 0) return true;
  if (opts.dict && isPlainObject(v) && Object.keys(v).length === 0) return true;
  return false;
}

/** Python repr() of a float. */
export function pyFloatStr(x: number): string {
  if (Number.isNaN(x)) return "nan";
  if (!Number.isFinite(x)) return x > 0 ? "inf" : "-inf";
  if (Number.isInteger(x)) return x.toFixed(1);
  const s = String(x);
  // JS uses e.g. 1e-7 / 1e+21; Python uses 1e-07 / 1e+21.
  return s.replace(/e([+-])(\d)$/, "e$10$2");
}

/** Python str()/repr() of a number decoded from JSON (integers are treated as int). */
export function pyNumStr(x: number): string {
  return Number.isInteger(x) && Math.abs(x) < 1e16 ? String(x) : pyFloatStr(x);
}

function reprString(s: string): string {
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\\") out += "\\\\";
    else if (ch === quote) out += `\\${quote}`;
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20 || code === 0x7f) out += `\\x${code.toString(16).padStart(2, "0")}`;
    else if (code >= 0x80 && code < 0xa0) out += `\\x${code.toString(16).padStart(2, "0")}`;
    else out += ch;
  }
  return quote + out + quote;
}

/** Python repr() for JSON-like values. */
export function pyRepr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (typeof v === "number") return pyNumStr(v);
  if (typeof v === "string") return reprString(v);
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(", ")}]`;
  if (isPlainObject(v)) {
    return `{${Object.entries(v)
      .map(([k, x]) => `${reprString(k)}: ${pyRepr(x)}`)
      .join(", ")}}`;
  }
  return String(v);
}

/** Python str() for JSON-like values. */
export function pyStr(v: unknown): string {
  return typeof v === "string" ? v : pyRepr(v);
}

/** Python type(v).__name__ for JSON-like values. */
export function pyTypeName(v: unknown): string {
  if (v === null || v === undefined) return "NoneType";
  if (typeof v === "boolean") return "bool";
  if (typeof v === "number") return Number.isInteger(v) ? "int" : "float";
  if (typeof v === "string") return "str";
  if (Array.isArray(v)) return "list";
  return "dict";
}

/** Python round(x, ndigits) — half-to-even on the exact binary value. */
export function pyRound(x: number, ndigits: number): number {
  if (!Number.isFinite(x)) return x;
  const neg = x < 0;
  const s = Math.abs(x).toPrecision(21);
  if (s.includes("e")) return x;
  const [intPart = "0", frac = ""] = s.split(".");
  const padded = frac.padEnd(ndigits + 1, "0");
  const keep = BigInt(intPart + padded.slice(0, ndigits));
  const rest = padded.slice(ndigits);
  const first = rest[0] ?? "0";
  const tail = rest.slice(1);
  let up = false;
  if (first > "5") up = true;
  else if (first === "5") up = /[1-9]/.test(tail) || keep % 2n === 1n;
  const n = up ? keep + 1n : keep;
  const val = Number(n) / 10 ** ndigits;
  return neg ? -val : val;
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Python format(n, ",") for integers. */
export function fmtThousands(n: number): string {
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Python `re.match` with a pattern ending in `$` (which also matches before a final newline). */
export function pyReMatch(pattern: string, value: string): boolean {
  const js =
    pattern.endsWith("$") && !pattern.endsWith("\\$")
      ? `${pattern.slice(0, -1)}(?=\\n?$)`
      : pattern;
  return new RegExp(js).test(value);
}

/** JSON-safe deep clone. */
export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function hasKey(o: Record<string, unknown>, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

/** dict.get(k) on an untrusted object (own keys only). */
export function getKey(o: Record<string, unknown>, k: string): unknown {
  return hasKey(o, k) ? o[k] : undefined;
}
