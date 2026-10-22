/**
 * Optional LLM phrasing (aegis_agent/llm.py) — deterministic adapter only.
 *
 * The Python agent can pass a composed answer to an LLM provider for rephrasing and keeps the
 * output only if it passes citation and prohibited-claim validation. The browser build ships
 * no provider: phrasing is always the deterministic, templated answer.
 */
export interface LlmMeta {
  used: boolean;
  provider?: string | null;
  reason: string;
}

export const NOT_APPLICABLE: LlmMeta = { used: false, reason: "not applicable" };

export function polish(text: string): [string, LlmMeta] {
  return [text, { used: false, provider: null, reason: "deterministic mode (no LLM configured)" }];
}
