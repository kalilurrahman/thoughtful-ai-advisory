/** Small Python-compatibility helpers for byte-identical output (json.dumps, str(), round()). */

function escapeJsonString(s: string, ensureAscii: boolean): string {
  let out = '"';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (code < 0x20) out += `\\u${code.toString(16).padStart(4, "0")}`;
    else if (ensureAscii && code > 0x7f) {
      if (code > 0xffff) {
        const v = code - 0x10000;
        const hi = 0xd800 + (v >> 10);
        const lo = 0xdc00 + (v & 0x3ff);
        out += `\\u${hi.toString(16).padStart(4, "0")}\\u${lo.toString(16).padStart(4, "0")}`;
      } else out += `\\u${code.toString(16).padStart(4, "0")}`;
    } else out += ch;
  }
  return out + '"';
}

/** json.dumps(obj, sort_keys=..., ensure_ascii=..., default=str) with Python's default separators. */
export function pyDumps(
  value: unknown,
  opts: { sortKeys?: boolean; ensureAscii?: boolean } = {},
): string {
  const { sortKeys = false, ensureAscii = true } = opts;
  const enc = (v: unknown): string => {
    if (v === null || v === undefined) return "null";
    if (typeof v === "string") return escapeJsonString(v, ensureAscii);
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NaN";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (Array.isArray(v)) return `[${v.map(enc).join(", ")}]`;
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      let keys = Object.keys(o).filter((k) => o[k] !== undefined);
      if (sortKeys) keys = keys.sort();
      return `{${keys.map((k) => `${escapeJsonString(k, ensureAscii)}: ${enc(o[k])}`).join(", ")}}`;
    }
    return escapeJsonString(String(v), ensureAscii);
  };
  return enc(value);
}

/** Python str() for JSON-ish values (True/False/None, lists as repr is not needed here). */
export function pyStr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  return String(v);
}

/** repr of a float as Python prints it (50.0, 48.1). */
export function pyFloat(x: number): string {
  return Number.isInteger(x) ? x.toFixed(1) : String(x);
}

/** round(x, 1) with Python's round-half-even on exact ties. */
export function pyRound1(x: number): number {
  const y = x * 10;
  const f = Math.floor(y);
  if (y - f === 0.5) return (f % 2 === 0 ? f : f + 1) / 10;
  return Math.round(y) / 10;
}

export function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Python-style truncation by code points (s[:n]). */
export function pySlice(s: string, n: number): string {
  if (s.length <= n) return s;
  const cps = Array.from(s);
  return cps.length <= n ? s : cps.slice(0, n).join("");
}
