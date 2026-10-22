/** Policy text parsing (YAML 1.2 core schema or JSON); no bundled content. */
import { parse } from "yaml";

/** Parse policy text as JSON (when `format` is json or the text starts with `{`) or YAML. */
export function parsePolicyText(text: string, format: "auto" | "json" | "yaml" = "auto"): unknown {
  const asJson = format === "json" || (format === "auto" && text.trimStart().startsWith("{"));
  if (asJson) return JSON.parse(text) as unknown;
  return parse(text) as unknown;
}
