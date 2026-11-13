import {
  Anchor,
  ArrowSquareIn,
  ArrowSquareOut,
  CheckCircle,
  CurrencyCircleDollar,
  Database,
  Eye,
  EyeSlash,
  Flask,
  HandPalm,
  LockKey,
  Power,
  Prohibit,
  Pulse,
  Robot,
  Scroll,
  ShieldCheck,
  Syringe,
  UserCheck,
  UserFocus,
  Warning,
  WarningOctagon,
  Wrench,
  XCircle,
  type Icon,
} from "@phosphor-icons/react";

// Guardrail iconography (docs/design/assurance/README.md §7): one Phosphor glyph per guardrail
// category (src/data/governance GR), per Shield rollout mode and per policy decision, so the
// Guardrails designer, the Shield tools and the policy simulator all draw the same picture.

const BY_NAME: Record<string, Icon> = {
  // Guardrail categories (GR)
  data: Database,
  input: ArrowSquareIn,
  output: ArrowSquareOut,
  agent: Robot,
  "human oversight": UserCheck,
  monitoring: Pulse,
  testing: Flask,
  // Individual guardrails and Shield policy families
  "prompt injection": Syringe,
  "pii masking": EyeSlash,
  "pii redaction": EyeSlash,
  groundedness: Anchor,
  toxicity: WarningOctagon,
  "tool allow-list": Wrench,
  "tool allowlist": Wrench,
  "spend limit": CurrencyCircleDollar,
  "approval gate": HandPalm,
  "kill switch": Power,
  "audit log": Scroll,
  // Shield rollout modes
  observe: Eye,
  warn: Warning,
  protect: ShieldCheck,
  enforce: LockKey,
  contain: Prohibit,
  // Policy decisions
  allow: CheckCircle,
  deny: XCircle,
  require_human_approval: UserFocus,
};

/** Longest-first keys, so "prompt injection" wins over "input" inside a longer guardrail name. */
const KEYS = Object.keys(BY_NAME).sort((a, b) => b.length - a.length);

/**
 * The glyph for a guardrail category, guardrail name, Shield mode or policy decision; matched by
 * name, case-insensitive, then by the longest key the name contains. Unknown names get the
 * shield so a tile is never empty.
 */
export function guardrailIcon(name: string): Icon {
  const key = name.trim().toLowerCase().replace(/[_-]+/g, " ");
  const exact = BY_NAME[key] ?? BY_NAME[key.replace(/ /g, "_")];
  if (exact) return exact;
  const hit = KEYS.find((k) => key.includes(k.replace(/_/g, " ")) || key.includes(k));
  return hit ? BY_NAME[hit]! : ShieldCheck;
}
