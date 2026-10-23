/**
 * Port of platform/app/common/veritrail_common/redaction.py: deterministic sensitive-data
 * redaction and prompt-injection / jailbreak heuristics. Patterns are the Python ones,
 * compiled through `pyRegex` so `\b \w \d \s` keep Python's Unicode semantics.
 */
import { pyRegex } from "./pyre";

function compile(pattern: string, flags: string): RegExp {
  const rx = pyRegex(pattern, flags);
  if (!rx) throw new Error(`cannot compile built-in pattern ${pattern}`);
  return rx;
}

/** Order matters: more specific patterns first (veritrail_common.redaction.PII_PATTERNS). */
const PII_SOURCES: Array<[string, string, string]> = [
  ["email", "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", ""],
  ["payment_card", "\\b(?:\\d[ -]?){13,19}\\b", ""],
  ["iban", "\\b[A-Z]{2}\\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\\b", ""],
  ["us_ssn", "\\b(?!000|666|9\\d\\d)\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b", ""],
  ["uk_nino", "\\b[A-CEGHJ-PR-TW-Z]{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?[A-D]\\b", "i"],
  ["india_pan", "\\b[A-Z]{5}\\d{4}[A-Z]\\b", ""],
  ["india_aadhaar", "\\b[2-9]\\d{3}\\s?\\d{4}\\s?\\d{4}\\b", ""],
  [
    "phone",
    "(?<![\\w+])(?:\\+\\d{1,3}[\\s.-]?)?(?:\\(\\d{2,5}\\)[\\s.-]?)?\\d{2,5}(?:[\\s.-]\\d{2,6}){1,3}(?![\\w-])",
    "",
  ],
  ["ip_address", "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b", ""],
  ["api_key", "\\b(?:sk|pk|api|key|token)[-_][A-Za-z0-9_-]{16,}\\b", "i"],
  ["aws_access_key", "\\b(?:AKIA|ASIA)[A-Z0-9]{16}\\b", ""],
  ["github_token", "\\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\\b", ""],
];

export const PII_PATTERNS: ReadonlyMap<string, RegExp> = new Map(
  PII_SOURCES.map(([k, p, f]) => [k, compile(p, `${f}g`)]),
);
export const PII_ENTITY_NAMES: readonly string[] = PII_SOURCES.map(([k]) => k);

const NON_DIGIT = compile("\\D", "g");
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}$/;
const ND = /\p{Nd}/u;

/** int(ch) for a Unicode decimal digit (Nd digits come in contiguous runs of ten). */
function digitValue(ch: string): number {
  const cp = ch.codePointAt(0)!;
  if (cp >= 48 && cp <= 57) return cp - 48;
  let start = cp;
  while (start > 0 && ND.test(String.fromCodePoint(start - 1))) start--;
  return (cp - start) % 10;
}

function luhnOk(digits: string): boolean {
  const ds = Array.from(digits);
  let total = 0;
  let alt = false;
  for (let i = ds.length - 1; i >= 0; i--) {
    let d = digitValue(ds[i]!);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
    alt = !alt;
  }
  return total % 10 === 0;
}

export interface RedactionFinding {
  entity: string;
  length: number;
}

export interface RedactionResult {
  text: string;
  /** Entity type and match length only; raw values are never retained. */
  findings: RedactionFinding[];
}

/** RedactionResult.entity_counts. */
export function entityCounts(r: RedactionResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of r.findings) out[f.entity] = (out[f.entity] ?? 0) + 1;
  return out;
}

const cpLength = (s: string) => Array.from(s).length;

/**
 * veritrail_common.redaction.redact: `entities` null/undefined means all entities, `[]` means none.
 * Findings never include the raw value (only entity + span length).
 */
export function redact(
  text: string,
  entities: readonly string[] | null = null,
  mask = "[REDACTED:{entity}]",
): RedactionResult {
  if (!text) return { text: text || "", findings: [] };
  const wanted = entities ?? PII_ENTITY_NAMES;
  const findings: RedactionFinding[] = [];
  let out = text;
  for (const [entity, rx] of PII_PATTERNS) {
    if (!wanted.includes(entity)) continue;
    rx.lastIndex = 0;
    out = out.replace(rx, (val: string) => {
      if (entity === "payment_card") {
        const digits = val.replace(NON_DIGIT, "");
        const n = cpLength(digits);
        if (!(n >= 13 && n <= 19 && luhnOk(digits))) return val;
      }
      if (entity === "phone") {
        const n = cpLength(val.replace(NON_DIGIT, ""));
        if (n < 8 || n > 15 || DATE_LIKE.test(val)) return val;
      }
      findings.push({ entity, length: cpLength(val) });
      return mask.replace("{entity}", entity);
    });
  }
  return { text: out, findings };
}

const INJECTION_SOURCES: Array<[string, string]> = [
  [
    "ignore\\s+(all\\s+|any\\s+)?(the\\s+)?(previous|prior|above|earlier)\\s+(instructions|prompts|rules|messages)",
    "instruction_override",
  ],
  [
    "disregard\\s+(all\\s+|any\\s+|the\\s+)?(previous|prior|above|system)\\s+(instructions|prompt|rules)",
    "instruction_override",
  ],
  ["forget\\s+(everything|all|your)\\s+(you|instructions|rules|previous)", "instruction_override"],
  [
    "(reveal|print|show|output|repeat|leak)\\s+(me\\s+)?(the\\s+|your\\s+)?(system\\s+prompt|hidden\\s+instructions|initial\\s+instructions|developer\\s+message)",
    "prompt_exfiltration",
  ],
  [
    "you\\s+are\\s+now\\s+(in\\s+)?(developer|dan|god|admin|unrestricted|jailbreak)\\s*(mode)?",
    "role_hijack",
  ],
  ["\\bact\\s+as\\s+(an?\\s+)?(unfiltered|unrestricted|uncensored)", "role_hijack"],
  ["<\\s*/?\\s*(system|assistant|im_start|im_end)\\s*>", "delimiter_injection"],
  ["\\[\\s*(system|INST)\\s*\\]", "delimiter_injection"],
  [
    "<\\|\\s*(im_start|im_end|system|endoftext|start_header_id|end_header_id)\\s*\\|>",
    "delimiter_injection",
  ],
  [
    "(send|post|upload|exfiltrate|forward)\\s+(all\\s+|the\\s+)?(data|records|customer\\s+data|credentials|secrets|files)\\s+to\\s+(https?://|\\S+@)",
    "data_exfiltration",
  ],
  [
    "(call|invoke|use|run)\\s+the\\s+\\w+\\s+tool\\s+(with|to)\\s+.*(delete|drop|transfer|export)",
    "tool_hijack",
  ],
];

const JAILBREAK_SOURCES: Array<[string, string]> = [
  ["\\bDAN\\b|do\\s+anything\\s+now", "dan"],
  [
    "(no|without)\\s+(any\\s+)?(restrictions|filters|guidelines|limitations|safety)",
    "restriction_removal",
  ],
  ["pretend\\s+(you\\s+)?(have\\s+no|are\\s+not\\s+bound|there\\s+are\\s+no)", "pretend_unbound"],
  [
    "(hypothetically|in\\s+a\\s+fictional\\s+world).{0,60}(how\\s+to|instructions\\s+for)\\s+(make|build|bypass|hack)",
    "fictional_wrapper",
  ],
  ["bypass\\s+(your|the)\\s+(safety|content|guard)", "guardrail_bypass"],
];

const INJ: Array<[RegExp, string]> = INJECTION_SOURCES.map(([p, t]) => [compile(p, "is"), t]);
const JB: Array<[RegExp, string]> = JAILBREAK_SOURCES.map(([p, t]) => [compile(p, "is"), t]);

function detect(list: Array<[RegExp, string]>, text: string): string[] {
  const hits = new Set<string>();
  for (const [rx, t] of list) if (rx.test(text || "")) hits.add(t);
  return [...hits].sort();
}

export function detectPromptInjection(text: string): string[] {
  return detect(INJ, text);
}

export function detectJailbreak(text: string): string[] {
  return detect(JB, text);
}
