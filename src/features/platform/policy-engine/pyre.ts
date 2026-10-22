/**
 * Python-behaviour helpers for the policy-engine port: `re` pattern translation (Unicode-aware
 * `\b \w \d \s`, `$`, `(?P<name>)`), `fnmatch.fnmatchcase`, `==`/ordering semantics for
 * JSON-like values, and a few `str`/`datetime` formatting helpers. Pure and SSR-safe.
 */
import { isPlainObject } from "../../site/engines/shield/py";

/** Characters matched by Python's `\s` for str patterns (str.isspace()). */
export const PY_WS_CLASS =
  "\\t\\n\\x0B\\f\\r\\x1C-\\x20\\x85\\xA0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000";
const PY_WORD_CLASS = "\\p{L}\\p{N}_";
const W = `[${PY_WORD_CLASS}]`;
const SYNTAX = new Set([..."^$\\.*+?()[]{}|/"]);
const QUANT_RE = /^\{(\d+(,\d*)?|,\d+)\}/;

/**
 * Translate a Python `re` pattern into a JavaScript pattern for the `u` flag, keeping Python's
 * Unicode semantics for `\b \B \w \W \d \D \s \S`, `$` (also before a final newline), `\Z`, `\A`,
 * named groups and literal `{`/`}`/`]`.
 */
export function translatePyPattern(src: string): { source: string; flags: string } {
  let flags = "";
  let pat = src;
  const inline = /^\(\?([aiLmsux]+)\)/.exec(pat);
  if (inline?.[1]) {
    if (inline[1].includes("i")) flags += "i";
    if (inline[1].includes("s")) flags += "s";
    if (inline[1].includes("m")) flags += "m";
    pat = pat.slice(inline[0].length);
  }
  let out = "";
  let inClass = false;
  let classStart = false;
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i] as string;
    if (c === "\\") {
      const n = pat[i + 1];
      i++;
      if (n === undefined) {
        out += "\\\\";
        break;
      }
      if (inClass) {
        classStart = false;
        if (n === "w") out += PY_WORD_CLASS;
        else if (n === "d") out += "\\p{Nd}";
        else if (n === "D") out += "\\P{Nd}";
        else if (n === "s") out += PY_WS_CLASS;
        else if (n === "b") out += "\\x08";
        else if (/[A-Za-z0-9]/.test(n)) out += `\\${n}`;
        else out += `\\u{${n.codePointAt(0)!.toString(16)}}`;
        continue;
      }
      switch (n) {
        case "b":
          out += `(?:(?<=${W})(?!${W})|(?<!${W})(?=${W}))`;
          break;
        case "B":
          out += `(?:(?<=${W})(?=${W})|(?<!${W})(?!${W}))`;
          break;
        case "w":
          out += W;
          break;
        case "W":
          out += `[^${PY_WORD_CLASS}]`;
          break;
        case "d":
          out += "\\p{Nd}";
          break;
        case "D":
          out += "\\P{Nd}";
          break;
        case "s":
          out += `[${PY_WS_CLASS}]`;
          break;
        case "S":
          out += `[^${PY_WS_CLASS}]`;
          break;
        case "Z":
          out += "$";
          break;
        case "A":
          out += "^";
          break;
        case "U": {
          const hex = pat.slice(i + 1, i + 9);
          out += `\\u{${hex.replace(/^0+(?=.)/, "")}}`;
          i += 8;
          break;
        }
        default: {
          if (/[A-Za-z0-9]/.test(n)) out += `\\${n}`;
          else {
            const cp = pat.codePointAt(i)!;
            out += `\\u{${cp.toString(16)}}`;
            if (cp > 0xffff) i++;
          }
        }
      }
      continue;
    }
    if (inClass) {
      if (c === "]" && !classStart) {
        inClass = false;
        out += "]";
        continue;
      }
      if (classStart && c === "^") {
        out += "^";
        continue;
      }
      classStart = false;
      if (c === "[" || c === "/" || c === "{" || c === "}" || c === "(" || c === ")" || c === "|")
        out += `\\${c}`;
      else if (c === "]") out += "\\]";
      else out += c;
      continue;
    }
    if (c === "[") {
      inClass = true;
      classStart = true;
      out += "[";
      // Python allows "[]...]" and "[^]...]" where the first "]" is literal.
      if (pat[i + 1] === "^") {
        out += "^";
        i++;
      }
      if (pat[i + 1] === "]") {
        out += "\\]";
        i++;
      }
      classStart = false;
      continue;
    }
    if (c === "(" && pat.startsWith("(?P<", i)) {
      out += "(?<";
      i += 3;
      continue;
    }
    if (c === "(" && pat.startsWith("(?P=", i)) {
      const end = pat.indexOf(")", i);
      out += `\\k<${pat.slice(i + 4, end)}>`;
      i = end;
      continue;
    }
    if (c === "$") {
      out += flags.includes("m") ? "$" : "(?=\\n?$)";
      continue;
    }
    if (c === "{") {
      const q = QUANT_RE.exec(pat.slice(i));
      if (q) {
        out += q[0];
        i += q[0].length - 1;
      } else out += "\\{";
      continue;
    }
    if (c === "}" || c === "]") {
      out += `\\${c}`;
      continue;
    }
    out += c;
  }
  return { source: out, flags };
}

const cache = new Map<string, RegExp | null>();

/**
 * Compile a Python pattern. `flags` uses JS letters (i, s, m, g). Returns null when the
 * pattern cannot be compiled in JavaScript.
 */
export function pyRegex(pattern: string, flags = ""): RegExp | null {
  const key = `${flags}\u0000${pattern}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  let rx: RegExp | null = null;
  try {
    const t = translatePyPattern(pattern);
    rx = new RegExp(t.source, [...new Set([...flags, ...t.flags, "u"])].join(""));
  } catch {
    try {
      rx = new RegExp(pattern.replace(/\(\?P</g, "(?<"), flags);
    } catch {
      rx = null;
    }
  }
  if (cache.size > 500) cache.clear();
  cache.set(key, rx);
  return rx;
}

/** Python `re.fullmatch(pattern, value) is not None`; uncompilable patterns never match. */
export function pyFullmatch(pattern: string, value: string): boolean {
  const rx = pyRegex(pattern, "");
  if (!rx) return false;
  let anchored: RegExp;
  try {
    anchored = new RegExp(`^(?:${rx.source})$`, rx.flags);
  } catch {
    return false;
  }
  const m = anchored.exec(value);
  return m !== null && m[0].length === value.length;
}

/** Python `re.escape` (enough for fnmatch literals). */
function reEscape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

const fnCache = new Map<string, RegExp>();

/** fnmatch.translate (Python 3.13) -> anchored JS RegExp (dotall, case-sensitive). */
export function fnmatchRegex(pat: string): RegExp {
  const hit = fnCache.get(pat);
  if (hit) return hit;
  const res: string[] = [];
  let i = 0;
  const n = pat.length;
  while (i < n) {
    const c = pat[i] as string;
    i++;
    if (c === "*") {
      if (res.at(-1) !== ".*") res.push(".*");
    } else if (c === "?") res.push(".");
    else if (c === "[") {
      let j = i;
      if (j < n && pat[j] === "!") j++;
      if (j < n && pat[j] === "]") j++;
      while (j < n && pat[j] !== "]") j++;
      if (j >= n) res.push("\\[");
      else {
        let stuff = pat.slice(i, j);
        if (!stuff.includes("-")) stuff = stuff.replace(/\\/g, "\\\\");
        else {
          const chunks: string[] = [];
          let k = pat[i] === "!" ? i + 2 : i + 1;
          for (;;) {
            k = pat.indexOf("-", k);
            if (k < 0 || k >= j) break;
            chunks.push(pat.slice(i, k));
            i = k + 1;
            k = k + 3;
          }
          const chunk = pat.slice(i, j);
          if (chunk) chunks.push(chunk);
          else if (chunks.length) chunks[chunks.length - 1] += "-";
          for (let m = chunks.length - 1; m > 0; m--) {
            const prev = chunks[m - 1] as string;
            const cur = chunks[m] as string;
            if ((prev.at(-1) ?? "") > (cur[0] ?? "")) {
              chunks[m - 1] = prev.slice(0, -1) + cur.slice(1);
              chunks.splice(m, 1);
            }
          }
          stuff = chunks.map((s) => s.replace(/\\/g, "\\\\").replace(/-/g, "\\-")).join("-");
        }
        stuff = stuff.replace(/([&~|[\]])/g, "\\$1");
        i = j + 1;
        if (!stuff) res.push("(?!)");
        else if (stuff === "!") res.push(".");
        else {
          if (stuff[0] === "!") stuff = "^" + stuff.slice(1);
          else if (stuff[0] === "^") stuff = "\\" + stuff;
          res.push(`[${stuff}]`);
        }
      }
    } else res.push(reEscape(c));
  }
  let rx: RegExp;
  try {
    rx = new RegExp(`^(?:${res.join("")})$`, "su");
  } catch {
    rx = new RegExp(`^(?:${res.join("")})$`, "s");
  }
  fnCache.set(pat, rx);
  return rx;
}

/** fnmatch.fnmatchcase(name, pat). */
export function fnmatchcase(name: string, pat: string): boolean {
  return fnmatchRegex(pat).test(name);
}

// ------------------------------------------------------------------ equality / ordering

function numLike(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
}

/** Python `a == b` for JSON-like values (True == 1, 1 == 1.0, deep list/dict equality). */
export function pyEq(a: unknown, b: unknown): boolean {
  const na = numLike(a);
  const nb = numLike(b);
  if (na !== null || nb !== null) return na !== null && nb !== null && na === nb;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (typeof a === "string") return a === b;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((x, i) => pyEq(x, b[i]));
  }
  if (isPlainObject(a)) {
    if (!isPlainObject(b)) return false;
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && pyEq(a[k], b[k]));
  }
  return a === b;
}

export class PyTypeError extends Error {
  override name = "TypeError";
}

function cmpCodePoints(a: string, b: string): number {
  const A = Array.from(a);
  const B = Array.from(b);
  for (let i = 0; i < Math.min(A.length, B.length); i++) {
    const x = A[i]!.codePointAt(0)!;
    const y = B[i]!.codePointAt(0)!;
    if (x !== y) return x < y ? -1 : 1;
  }
  return A.length - B.length;
}

/** Python 3 ordering comparison; throws PyTypeError where Python raises TypeError. */
export function pyCompare(a: unknown, b: unknown): number {
  const na = numLike(a);
  const nb = numLike(b);
  if (na !== null && nb !== null) return na < nb ? -1 : na > nb ? 1 : na === nb ? 0 : NaN;
  if (typeof a === "string" && typeof b === "string") return Math.sign(cmpCodePoints(a, b));
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (!pyEq(a[i], b[i])) return pyCompare(a[i], b[i]);
    }
    return Math.sign(a.length - b.length);
  }
  throw new PyTypeError("'<' not supported between these types");
}

/** Python `v in target`; throws PyTypeError where Python raises TypeError. */
export function pyIn(v: unknown, target: unknown): boolean {
  if (Array.isArray(target)) return target.some((x) => pyEq(v, x));
  if (typeof target === "string") {
    if (typeof v !== "string") throw new PyTypeError("'in <string>' requires string as left operand");
    return target.includes(v);
  }
  if (isPlainObject(target)) {
    if (Array.isArray(v) || isPlainObject(v)) throw new PyTypeError("unhashable type");
    if (typeof v === "string") return Object.prototype.hasOwnProperty.call(target, v);
    return false;
  }
  throw new PyTypeError("argument is not iterable");
}

// ------------------------------------------------------------------ str / datetime helpers

const PY_WS_RE = new RegExp(`[${PY_WS_CLASS}]+$`, "u");

/** Python str.rstrip(). */
export function pyRstrip(s: string): string {
  return s.replace(PY_WS_RE, "");
}

/** datetime.fromtimestamp(t, tz=timezone.utc).isoformat(). */
export function pyUtcIsoFromEpoch(t: number): string {
  const ms = Math.floor(t * 1000);
  const d = new Date(ms);
  const base = d.toISOString().slice(0, 19);
  const micro = Math.round((t - Math.floor(t)) * 1_000_000) % 1_000_000;
  return micro ? `${base}.${String(micro).padStart(6, "0")}+00:00` : `${base}+00:00`;
}

/** time.strftime("%Y-%m-%d", time.gmtime(t)). */
export function pyUtcDate(t: number): string {
  return new Date(Math.floor(t) * 1000).toISOString().slice(0, 10);
}
