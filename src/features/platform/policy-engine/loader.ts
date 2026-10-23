/**
 * Load policies and policy packs from YAML/JSON — port of
 * platform/app/policy-engine/veritrail_policy/loader.py. Packs are bundled at build time from
 * platform/content/policy_packs/*.yaml (no file system access in the browser).
 */
import { validatePolicy } from "../../site/engines/shield/schema";
import { isPlainObject } from "../../site/engines/shield/py";
import type { Policy } from "./engine";
import { parsePolicyText } from "./parse";

export { parsePolicyText } from "./parse";

const packFiles = import.meta.glob<string>("../../../../platform/content/policy_packs/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});

const PACK_TEXT: ReadonlyMap<string, string> = new Map(
  Object.entries(packFiles).map(([path, text]) => [
    path.replace(/^.*\//, "").replace(/\.yaml$/, ""),
    text,
  ]),
);

export class PolicyLoadError extends Error {
  readonly errors: string[];
  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = "PolicyLoadError";
    this.errors = errors;
  }
}

/** load_policy: parse and (optionally) validate; throws PolicyLoadError when invalid. */
export function loadPolicyText(
  text: string,
  opts: { name?: string; format?: "auto" | "json" | "yaml"; validate?: boolean } = {},
): Policy {
  let data: unknown;
  try {
    data = parsePolicyText(text, opts.format ?? "auto");
  } catch (e) {
    throw new PolicyLoadError(`${opts.name ?? "policy"}: could not parse: ${(e as Error).message}`);
  }
  if (opts.validate ?? true) {
    const errors = validatePolicy(data);
    if (errors.length) {
      throw new PolicyLoadError(
        `${opts.name ?? "policy"}: invalid policy: ` + errors.join("; "),
        errors,
      );
    }
  }
  return (isPlainObject(data) ? data : {}) as Policy;
}

/** Names of the bundled policy packs (sorted). */
export function listPacks(): string[] {
  return [...PACK_TEXT.keys()].sort();
}

/** Raw YAML text of a bundled pack (or undefined). */
export function packText(name: string): string | undefined {
  return PACK_TEXT.get(name);
}

export function loadPack(name: string, validate = true): Policy {
  if (name.includes("/") || name.includes("\\") || name.startsWith(".")) {
    throw new PolicyLoadError("invalid pack name");
  }
  const text = PACK_TEXT.get(name);
  if (text === undefined) throw new PolicyLoadError(`unknown policy pack '${name}'`);
  return loadPolicyText(text, { name: `${name}.yaml`, format: "yaml", validate });
}
