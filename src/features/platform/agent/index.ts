/**
 * VERITRAIL Agent (all roles) — browser port of platform/app/agent/veritrail_agent.
 * Runs entirely in the browser: in-memory store (optionally persisted to localStorage),
 * hash-chained audit log, 14 least-privilege tools, human approvals with separation of duties.
 */
export { VeritrailAgent, ReviewError, type AgentResponse, type AgentOptions, type ResponseSource } from "./orchestrator";
export { ApprovalError, payloadHash } from "./approvals";
export { AgentAuditLog } from "./audit-log";
export {
  APPROVER_ROLES,
  EVIDENCE_REVIEWER_ROLES,
  ROLES,
  SENSITIVE_ACTIONS,
  coerceUser,
  type Role,
  type User,
  type UserInput,
} from "./config";
export {
  GAP_SEVERITIES,
  GAP_SEVERITY_SLA_DAYS,
  heatMap,
  identifyGaps,
  recommendControlsFromGaps,
  roadmap,
  type Finding,
  type Gap,
  type GapResult,
} from "./gaps";
export { GAP_CSV_COLUMNS, gapRows, renderMarkdown, type ReportData } from "./reporting";
export { deterministicRuntime, systemRuntime, type AgentRuntime } from "./runtime";
export { Store, COLLECTIONS, type CollectionName, type StoreSnapshot } from "./store";
export {
  TOOL_REGISTRY,
  ToolInputError,
  ToolPermissionError,
  checkPermission,
  invoke,
  shieldProfile,
  type ToolName,
} from "./tools";
export { STORAGE_KEY, clearPersisted, loadPersisted, restoreInto, savePersisted } from "./persistence";
export { runSample, SAMPLE_ANSWERS, SAMPLE_ASSESSOR, SAMPLE_APPROVER } from "./sample-run";
