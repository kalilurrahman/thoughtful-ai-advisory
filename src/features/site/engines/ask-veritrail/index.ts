/** Ask VERITRAIL: deterministic, retrieval-based browser port of the VERITRAIL Agent's viewer-role Ask flow. */
export {
  answerQuestion,
  createAskSession,
  type AskVeritrailResponse,
  type AskSession,
  type AskState,
  type PublicSource,
} from "./orchestrator";
export { searchKnowledge, tokenize, realControlIds, type KnowledgeResult } from "./knowledge";
export {
  findProhibitedClaims,
  detectInjection,
  detectApprovalBypass,
  asksComplianceDetermination,
  redact,
} from "./safety";
export type { Claim, Cta } from "./compose";
