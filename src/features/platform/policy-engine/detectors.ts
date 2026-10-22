/**
 * Content detectors for the policy engine — port of
 * platform/app/policy-engine/aegis_policy/detectors.py.
 *
 * Thin extension of the shared redaction module: Unicode NFKC folding, zero-width removal,
 * homoglyph and leetspeak folding, letter-spacing collapse and decoding of base64 (two nested
 * layers), %-encoding and ROT13 so trivially obfuscated injections are still matched. These
 * remain heuristics: paraphrase, non-English, multi-turn splitting and semantic jailbreaks are
 * known misses (pinned as strict xfail tests in platform/tests/security).
 */
import { cpSlice, isPlainObject } from "../../site/engines/shield/py";
import { PY_WS_CLASS, pyRegex } from "./pyre";
import {
  PII_ENTITY_NAMES,
  detectJailbreak,
  detectPromptInjection,
  entityCounts,
  redact,
  type RedactionResult,
} from "./redaction";

export { PII_ENTITY_NAMES, entityCounts, type RedactionResult } from "./redaction";

/** Detection is bounded so a hostile payload cannot make scanning unbounded. */
export const MAX_SCAN_CHARS = 200_000;

// U+034F (combining grapheme joiner) is a separate alternative so it is not read as combining.
const ZERO_WIDTH = new RegExp(
  "[\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u2064\\u2066-\\u2069\\ufeff\\u00ad\\u180e]|\\u034f",
  "g",
);

const HOMOGLYPHS: Record<string, string> = {
  // Cyrillic
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ј: "j",
  ѕ: "s",
  ԁ: "d",
  ɡ: "g",
  һ: "h",
  ӏ: "l",
  к: "k",
  м: "m",
  т: "t",
  в: "b",
  н: "h",
  А: "A",
  Е: "E",
  О: "O",
  Р: "P",
  С: "C",
  У: "Y",
  Х: "X",
  І: "I",
  Ѕ: "S",
  К: "K",
  М: "M",
  Т: "T",
  В: "B",
  Н: "H",
  // Greek
  α: "a",
  ε: "e",
  ο: "o",
  ρ: "p",
  ι: "i",
  κ: "k",
  ν: "v",
  τ: "t",
  υ: "u",
  Α: "A",
  Ε: "E",
  Ο: "O",
  Ρ: "P",
  Ι: "I",
  Κ: "K",
  Ν: "N",
  Τ: "T",
  Υ: "Y",
};
const HOMOGLYPH_RE = new RegExp(`[${Object.keys(HOMOGLYPHS).join("")}]`, "gu");
const LEET: Record<string, string> = {
  "1": "i",
  "0": "o",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};
const LEET_RE = /[103457@$!]/g;
const SPACED = pyRegex("\\b(?:[A-Za-z][ .\\-_*]){3,}[A-Za-z]\\b", "g")!;
const SPACED_SEP = /[ .\-_*]/g;
const WS_RUN = pyRegex("\\s+", "g")!;
const B64 = /(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{16,}={0,2}(?![A-Za-z0-9+/=])/g;
const PCT = /%[0-9A-Fa-f]{2}/g;

/** Extra injection signals layered on top of the shared INJECTION_PATTERNS. */
export const EXTRA_INJECTION_PATTERNS: ReadonlyArray<readonly [string, string]> = [
  [
    "<\\|\\s*(im_start|im_end|system|endoftext|begin_of_text|start_header_id|eot_id)\\s*\\|>",
    "delimiter_injection",
  ],
  ["(^|\\n)\\s*#{2,}\\s*(system|new\\s+instructions?)\\s*:?", "delimiter_injection"],
];
const EXTRA_INJ: Array<[RegExp, string]> = EXTRA_INJECTION_PATTERNS.map(([p, t]) => [
  pyRegex(p, "i")!,
  t,
]);

function detectInjection(text: string): string[] {
  const hits = new Set(detectPromptInjection(text));
  for (const [rx, t] of EXTRA_INJ) if (rx.test(text || "")) hits.add(t);
  return [...hits].sort();
}

function leet(s: string): string {
  return s.replace(LEET_RE, (c) => LEET[c] ?? c);
}

export function normalizeForDetection(text: string): string {
  let t = (text || "").normalize("NFKC");
  t = t.replace(ZERO_WIDTH, "");
  t = t.replace(HOMOGLYPH_RE, (c) => HOMOGLYPHS[c] ?? c);
  SPACED.lastIndex = 0;
  t = t.replace(SPACED, (m) => m.replace(SPACED_SEP, ""));
  WS_RUN.lastIndex = 0;
  t = t.replace(WS_RUN, " ");
  return t;
}

// ------------------------------------------------------------------ decoders

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_INDEX = new Map([...B64_ALPHABET].map((c, i) => [c, i]));

/** base64.b64decode(seg + padding, validate=True); null where Python raises binascii.Error. */
function b64DecodeStrict(seg: string): Uint8Array | null {
  const s = seg + "=".repeat((4 - (seg.length % 4)) % 4);
  const data = s.replace(/=+$/, "");
  const pad = s.length - data.length;
  const rem = data.length % 4;
  if (rem === 1) return null;
  const need = rem === 0 ? 0 : rem === 2 ? 2 : 1;
  if (pad !== need) return null;
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of data) {
    const v = B64_INDEX.get(ch);
    if (v === undefined) return null;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
    buf &= 0xff;
  }
  return Uint8Array.from(out);
}

const PRINTABLE_EXCLUDED = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]/u;
const PY_SPACE = new RegExp(`^[${PY_WS_CLASS}]$`, "u");

function printableOrSpace(ch: string): boolean {
  return ch === " " || !PRINTABLE_EXCLUDED.test(ch) || PY_SPACE.test(ch);
}

function b64Segments(text: string, maxSegments: number): string[] {
  const out: string[] = [];
  const matches = [...(text || "").matchAll(B64)].slice(0, maxSegments);
  const dec = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  for (const m of matches) {
    const bytes = b64DecodeStrict(m[0]);
    if (!bytes) continue;
    let s: string;
    try {
      s = dec.decode(bytes);
    } catch {
      continue;
    }
    const chars = Array.from(s);
    const printable = chars.filter(printableOrSpace).length;
    if (chars.length && printable / chars.length > 0.9) out.push(s);
  }
  return out;
}

/** urllib.parse.unquote (UTF-8, errors="replace"). */
export function pyUnquote(text: string): string {
  if (!text.includes("%")) return text;
  const dec = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
  return text.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    const bytes = Uint8Array.from(run.match(/%[0-9A-Fa-f]{2}/g)!.map((p) => parseInt(p.slice(1), 16)));
    return dec.decode(bytes);
  });
}

function rot13(text: string): string {
  return text.replace(/[A-Za-z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/** [(kind, decoded_text)] for base64 (up to two nested layers), %-encoding and ROT13. */
export function decodedVariants(text: string, maxSegments = 20): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const dec of b64Segments(text, maxSegments)) {
    out.push(["base64", dec]);
    for (const dec2 of b64Segments(dec, 5)) out.push(["base64", dec2]);
  }
  if (((text || "").match(PCT) ?? []).length >= 3) {
    const dec = pyUnquote(text);
    if (dec !== text) out.push(["percent_encoding", dec]);
  }
  out.push(["rot13", rot13(text || "")]);
  return out;
}

function variants(text: string, decode: boolean): Array<[string | null, string]> {
  const base = cpSlice(text || "", MAX_SCAN_CHARS);
  const norm = normalizeForDetection(base);
  const out: Array<[string | null, string]> = [
    [null, base],
    [null, norm],
    [null, leet(norm)],
  ];
  if (decode) {
    for (const [kind, dec] of decodedVariants(base)) out.push([kind, normalizeForDetection(dec)]);
  }
  return out;
}

function scan(text: string, detector: (t: string) => string[], decode: boolean): string[] {
  const hits = new Set<string>();
  for (const [kind, v] of variants(text, decode)) {
    const found = detector(v);
    for (const f of found) hits.add(f);
    if (found.length && kind) hits.add(`obfuscation:${kind}`);
  }
  return [...hits].sort();
}

/** Prompt-injection signals (types) found in text or its normalized/decoded variants. */
export function scanInjection(text: string, decode = true): string[] {
  return scan(text, detectInjection, decode);
}

export function scanJailbreak(text: string, decode = true): string[] {
  return scan(text, detectJailbreak, decode);
}

/**
 * Redact the listed entities (minus exemptions). Empty entity list => no redaction; `null`
 * => all entities. Redaction runs on the NFKC-normalized, zero-width-stripped text.
 */
export function redactText(
  text: string | null | undefined,
  entities: readonly string[] | null,
  exempt: readonly string[] | null = null,
): RedactionResult {
  if (text === null || text === undefined || text === "") return { text: text || "", findings: [] };
  let wanted =
    entities === null
      ? [...PII_ENTITY_NAMES]
      : entities.filter((e) => PII_ENTITY_NAMES.includes(e));
  if (exempt?.length) wanted = wanted.filter((e) => !exempt.includes(e));
  if (!wanted.length) return { text, findings: [] };
  const cleaned = text.normalize("NFKC").replace(ZERO_WIDTH, "");
  return redact(cleaned, wanted);
}

/** Recursively redact strings inside objects/arrays. Returns [copy, entity_counts]. */
export function redactStructure(
  value: unknown,
  entities: readonly string[] | null,
  exempt: readonly string[] | null = null,
  depth = 0,
): [unknown, Record<string, number>] {
  const counts: Record<string, number> = {};
  const add = (c: Record<string, number>) => {
    for (const [k, v] of Object.entries(c)) counts[k] = (counts[k] ?? 0) + v;
  };
  if (depth > 20) return ["[TRUNCATED:depth]", counts];
  if (typeof value === "string") {
    const r = redactText(value, entities, exempt);
    add(entityCounts(r));
    return [r.text, counts];
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const [nv, c] = redactStructure(v, entities, exempt, depth + 1);
      add(c);
      out[k] = nv;
    }
    return [out, counts];
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const v of value) {
      const [nv, c] = redactStructure(v, entities, exempt, depth + 1);
      add(c);
      out.push(nv);
    }
    return [out, counts];
  }
  return [value, counts];
}
