/**
 * Safety checks ported from the VERITRAIL platform:
 *   - prompt-injection / jailbreak heuristics and redaction (veritrail_common/redaction.py)
 *   - prohibited compliance-claim guard (veritrail_common/evidence.py `find_prohibited_claims`)
 *   - claim coercion, approval bypass, compliance-determination and legal-classification
 *     detectors (veritrail_agent/safety.py)
 * All detectors are deterministic heuristics, exactly as in the Python reference.
 */

// --------------------------------------------------------------------------- redaction
function luhnOk(digits: string): boolean {
  let total = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
    alt = !alt;
  }
  return total % 10 === 0;
}

/** Order matters: more specific patterns first. */
const PII_PATTERNS: Array<[string, RegExp]> = [
  ["email", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
  ["payment_card", /\b(?:\d[ -]?){13,19}\b/g],
  ["iban", /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g],
  ["us_ssn", /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g],
  ["uk_nino", /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi],
  ["india_pan", /\b[A-Z]{5}\d{4}[A-Z]\b/g],
  ["india_aadhaar", /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g],
  [
    "phone",
    /(?<![\w+])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?)?\d{2,5}(?:[\s.-]\d{2,6}){1,3}(?![\w-])/g,
  ],
  ["ip_address", /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g],
  ["api_key", /\b(?:sk|pk|api|key|token)[-_][A-Za-z0-9_-]{16,}\b/gi],
  ["aws_access_key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["github_token", /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/g],
];

export interface RedactionResult {
  text: string;
  /** Entity type and match length only; raw values are never retained. */
  findings: Array<{ entity: string; length: number }>;
}

/** Mask common sensitive-data patterns as `[REDACTED:<entity>]`. */
export function redact(text: string): RedactionResult {
  if (!text) return { text: text || "", findings: [] };
  const findings: RedactionResult["findings"] = [];
  let out = text;
  for (const [entity, rx] of PII_PATTERNS) {
    out = out.replace(rx, (val: string) => {
      if (entity === "payment_card") {
        const digits = val.replace(/\D/g, "");
        if (!(digits.length >= 13 && digits.length <= 19 && luhnOk(digits))) return val;
      }
      if (entity === "phone") {
        const digits = val.replace(/\D/g, "");
        if (digits.length < 8 || digits.length > 15 || /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      }
      findings.push({ entity, length: val.length });
      return `[REDACTED:${entity}]`;
    });
  }
  return { text: out, findings };
}

// --------------------------------------------------------------------------- injection / jailbreak
const INJECTION_PATTERNS: Array<[RegExp, string]> = [
  [
    /ignore\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules|messages)/is,
    "instruction_override",
  ],
  [
    /disregard\s+(all\s+|any\s+|the\s+)?(previous|prior|above|system)\s+(instructions|prompt|rules)/is,
    "instruction_override",
  ],
  [/forget\s+(everything|all|your)\s+(you|instructions|rules|previous)/is, "instruction_override"],
  [
    /(reveal|print|show|output|repeat|leak)\s+(me\s+)?(the\s+|your\s+)?(system\s+prompt|hidden\s+instructions|initial\s+instructions|developer\s+message)/is,
    "prompt_exfiltration",
  ],
  [
    /you\s+are\s+now\s+(in\s+)?(developer|dan|god|admin|unrestricted|jailbreak)\s*(mode)?/is,
    "role_hijack",
  ],
  [/\bact\s+as\s+(an?\s+)?(unfiltered|unrestricted|uncensored)/is, "role_hijack"],
  [/<\s*\/?\s*(system|assistant|im_start|im_end)\s*>/is, "delimiter_injection"],
  [/\[\s*(system|INST)\s*\]/is, "delimiter_injection"],
  [
    /<\|\s*(im_start|im_end|system|endoftext|start_header_id|end_header_id)\s*\|>/is,
    "delimiter_injection",
  ],
  [
    /(send|post|upload|exfiltrate|forward)\s+(all\s+|the\s+)?(data|records|customer\s+data|credentials|secrets|files)\s+to\s+(https?:\/\/|\S+@)/is,
    "data_exfiltration",
  ],
  [
    /(call|invoke|use|run)\s+the\s+\w+\s+tool\s+(with|to)\s+.*(delete|drop|transfer|export)/is,
    "tool_hijack",
  ],
];

const JAILBREAK_PATTERNS: Array<[RegExp, string]> = [
  [/\bDAN\b|do\s+anything\s+now/is, "dan"],
  [
    /(no|without)\s+(any\s+)?(restrictions|filters|guidelines|limitations|safety)/is,
    "restriction_removal",
  ],
  [/pretend\s+(you\s+)?(have\s+no|are\s+not\s+bound|there\s+are\s+no)/is, "pretend_unbound"],
  [
    /(hypothetically|in\s+a\s+fictional\s+world).{0,60}(how\s+to|instructions\s+for)\s+(make|build|bypass|hack)/is,
    "fictional_wrapper",
  ],
  [/bypass\s+(your|the)\s+(safety|content|guard)/is, "guardrail_bypass"],
];

/** Attempts to coerce the agent into making a compliance / certification statement. */
const CLAIM_COERCION: RegExp[] = [
  /\b(say|state|write|declare|confirm|tell\s+\w+|announce|print|output|respond\s+with|reply\s+with|draft\s+a\s+statement)\b.{0,60}\b(we|our|they|the\s+company|the\s+organi[sz]ation|this\s+system|it)\b.{0,30}\b(are|is|'re|'s|be)\b.{0,20}\b(compliant|certified|approved|conformant|accredited)\b/is,
  /\b(just|simply)\s+(say|tell|confirm)\b.{0,40}\b(compliant|certified)\b/is,
  /\bissue\s+(us\s+)?(a\s+)?(certificate|certification|attestation\s+of\s+compliance)\b/is,
];

/** Attempts to bypass human approval / separation of duties. */
const APPROVAL_BYPASS: RegExp[] = [
  /\b(skip|bypass|circumvent|avoid|ignore|override|disable|without)\b.{0,25}\b(the\s+)?(human\s+)?(approval|approver|sign[- ]?off|review\s+step|four[- ]eyes)\b/is,
  /\b(approve|authori[sz]e|sign\s+off)\b.{0,30}\b(it|this|that|them|the\s+request|the\s+change|apr_\w+)?\s*(yourself|on\s+my\s+behalf|for\s+me|automatically|now)\b/is,
  /\b(auto[- ]?approve|self[- ]?approve|rubber[- ]?stamp)\b/is,
  /\bmark\b.{0,40}\b(as\s+)?(approved|verified|reviewed)\b/is,
  /\b(i\s+am|i'm|as)\s+(the\s+|an?\s+)?(ciso|ceo|cro|admin|administrator|approver|dpo|owner|head\s+of\s+\w+)\b.{0,60}\b(so\s+)?(just|go\s+ahead|do\s+it|approve|activate|export|change|no\s+need)\b/is,
  /\b(pretend|assume|act\s+as\s+if)\b.{0,30}\b(i\s+am|i'm|it\s+is|it's|this\s+is)\b.{0,20}\b(approved|an?\s+approver|admin)\b/is,
  /\bapprove\s+(apr_[a-z0-9]+|approval\s+\S+|the\s+pending)/is,
  /\b(go\s+ahead\s+and|just)\s+(activate|enable|deploy|export|send|change|lower|downgrade)\b/is,
];

/** Requests for a compliance / certification determination. */
const COMPLIANCE_DETERMINATION: RegExp[] = [
  /\b(are|am|is)\s+(we|our|this|the|it|they|i|my)\b.{0,50}?\b(compliant|certified|conformant|certifiable|accredited)\b/is,
  /\b(do|does|did)\s+(we|our|this|the|it|they|i|my)\b.{0,50}?\b(comply|conform)\b/is,
  /\bcertify\b/is,
  /\bcertification\b/is,
  /\bcertificate\b/is,
  /\bguarantee\b.{0,30}\bcompliance\b/is,
  /\bcompliance\s+(status|determination|sign[- ]?off|verdict)\b/is,
  /\b(confirm|verify|determine|tell\s+me|check|attest)\b.{0,60}\b(compliance|compliant|conformity|certified)\b/is,
  /\b(will|would|do|can)\s+(we|i|our\s+\w+)\s+(pass|fail)\b.{0,30}\b(audit|certification|assessment|conformity)\b/is,
  /\b(meet|meets|satisfy|satisfies)\s+(all\s+)?(the\s+)?(eu\s+ai\s+act|iso|nist|regulatory|legal)\b/is,
  /\bregulator[- ]approved\b/is,
  /\bcompliant\b/is,
  /\b(compliance|certified|conformity)\b.{0,60}\b(confirm|verify|attest|in writing|sign[- ]?off|right\?|correct\?)/is,
  /\b(does|do|will|would)\s+(the\s+)?(eu\s+ai\s+act|ai\s+act|iso(\/iec)?\s*42001|gdpr|regulation)\s+(apply|applies)\b/is,
  /\b(apply|applies|applicable)\s+to\s+(us|our|me|my)\b/is,
  /\b(are|is)\s+(we|our\s+\w+(\s+\w+)?|this\s+\w+|it)\s+in\s+scope\b/is,
];

const LEGAL_CLASSIFICATION: RegExp[] = [
  /\bwhat\s+(is|are|counts\s+as)\s+(a\s+)?high[- ]risk\s+(ai\s+)?(system|use)/i,
  /\b(is|are|would|will)\b.{0,50}\b(classified|considered|count|counted|qualify|regarded)\b.{0,25}\b(as\s+)?(high[- ]risk|prohibited|limited[- ]risk|gpai)\b/i,
  /\bhigh[- ]risk\s+(under|according\s+to|per)\s+(the\s+)?(eu\s+ai\s+act|ai\s+act|annex\s+iii|art)/i,
  /\bannex\s+iii\b.{0,40}\b(apply|applies|cover|covers|include|includes)\b/i,
];

export function detectPromptInjection(text: string): string[] {
  return [
    ...new Set(INJECTION_PATTERNS.filter(([rx]) => rx.test(text || "")).map(([, t]) => t)),
  ].sort();
}

export function detectJailbreak(text: string): string[] {
  return [
    ...new Set(JAILBREAK_PATTERNS.filter(([rx]) => rx.test(text || "")).map(([, t]) => t)),
  ].sort();
}

/** Combined prompt-injection, jailbreak and claim-coercion signals (sorted, unique). */
export function detectInjection(text: string): string[] {
  const t = text || "";
  const sig = [...detectPromptInjection(t), ...detectJailbreak(t)];
  if (CLAIM_COERCION.some((rx) => rx.test(t))) sig.push("compliance_claim_coercion");
  if (/\b(new|updated|override)\s+(rules?|instructions?|policy)\s*[:=]/i.test(t))
    sig.push("instruction_override");
  if (
    /\b(ignore|forget|disregard)\b.{0,30}\b(rules?|guardrails?|instructions?|policy|policies|restrictions?)\b/i.test(
      t,
    )
  )
    sig.push("instruction_override");
  return [...new Set(sig)].sort();
}

export function detectApprovalBypass(text: string): boolean {
  return APPROVAL_BYPASS.some((rx) => rx.test(text || ""));
}

export function asksComplianceDetermination(text: string): boolean {
  return COMPLIANCE_DETERMINATION.some((rx) => rx.test(text || ""));
}

export function asksLegalClassification(text: string): boolean {
  return LEGAL_CLASSIFICATION.some((rx) => rx.test(text || ""));
}

// --------------------------------------------------------------------------- claim guard
/** Statements VERITRAIL must never make about an organization or system. */
const PROHIBITED_CLAIMS: RegExp[] = [
  /\b(is|are|be|being|been|now|fully|already)\s+(fully\s+)?compliant\b/i,
  /\b(is|are|been|be)\s+(iso(\/iec)?\s*42001\s+)?certified\b/i,
  /\bguarantee[sd]?\s+(full\s+)?(eu\s+ai\s+act\s+)?compliance\b/i,
  /\bregulator[- ]approved\b/i,
  /\bcertif(y|ies)\s+(that\s+)?(you|your|the organi[sz]ation|this system)\b/i,
  /\bmeets\s+all\s+(regulatory\s+)?requirements\b/i,
  /\bin\s+full\s+compliance\b/i,
];

/** Phrases that legitimately contain the words above (negations / disclaimers). */
const ALLOWED_CONTEXT =
  /(does not|do not|doesn't|cannot|can't|never|not)\s+(itself\s+)?(certif|guarantee|determin|make|claim|state|establish|mean)|\bnot\s+(a|an)\s+(\w+\s+){0,3}(determination|certification|guarantee|attestation|legal opinion)/i;

/** Prohibited compliance/certification claims in text (sentence-level, negation-aware). */
export function findProhibitedClaims(text: string): string[] {
  const hits: string[] = [];
  for (const sentence of (text || "").split(/(?<=[.!?])\s+|\n+/)) {
    if (!sentence.trim()) continue;
    if (ALLOWED_CONTEXT.test(sentence)) continue;
    if (/\bnot\s+(be\s+)?(fully\s+)?(compliant|certified)\b/i.test(sentence)) continue;
    if (PROHIBITED_CLAIMS.some((rx) => rx.test(sentence))) hits.push(sentence.trim());
  }
  return hits;
}
