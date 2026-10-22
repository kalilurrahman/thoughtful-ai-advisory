/**
 * AEGIS runtime policy engine — browser port of platform/app/policy-engine/aegis_policy
 * (engine, detectors, params, versioning, loader) plus the runtime-shield render / CLI /
 * integration helpers. Pure modules: safe for SSR and the browser; state is in memory only.
 *
 * "AI proposes. AEGIS evaluates. Approved actions execute."
 */
export * from "./engine";
export {
  MAX_SCAN_CHARS,
  decodedVariants,
  normalizeForDetection,
  redactStructure,
  redactText,
  scanInjection,
  scanJailbreak,
} from "./detectors";
export { conditionMet, domainAllowed, extractHost, validateParams } from "./params";
export {
  addApproval,
  approvalsComplete,
  bumpVersion,
  diffPolicies,
  latest,
  newVersion,
  recordChange,
  summarizeDiff,
  transitionStatus,
  type DiffEntry,
} from "./versioning";
export {
  PolicyLoadError,
  listPacks,
  loadPack,
  loadPolicyText,
  packText,
  parsePolicyText,
} from "./loader";
export {
  Blocked,
  ShieldedLLM,
  ToolGuard,
  decisionEvents,
  integrationSnippets,
  type IntegrationSnippet,
} from "./integrations";
export {
  SYNTHETIC_BANNER,
  diffPolicyTexts,
  renderAdviceMarkdown,
  sampleFiles,
  validatePolicyText,
  type PolicyCheck,
} from "./shield-render";
