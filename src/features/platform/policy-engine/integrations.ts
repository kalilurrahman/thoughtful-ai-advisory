/**
 * Integration helpers — port of platform/app/runtime-shield/veritrail_shield/integrations.py:
 *
 * - `ShieldedLLM` — SDK wrapper around any `(prompt) => string` model call;
 * - `ToolGuard` — agent-framework hook: every tool call is evaluated before execution and every
 *   tool output is screened before it re-enters the model context;
 * - `decisionEvents` — event sink: flattens the hash-chained decision log into SIEM events
 *   (redacted content only);
 * - `integrationSnippets` — copyable code showing the four integration patterns.
 */
import type { AuditLog, AuditRecord } from "../audit";
import { PolicyEngine, type Decision } from "./engine";

export class Blocked extends Error {
  readonly decision: Decision;
  constructor(decision: Decision) {
    super(`${decision.decision}: ${decision.reasons.slice(0, 3).join("; ")}`);
    this.name = "Blocked";
    this.decision = decision;
  }
}

/**
 * Evaluate the prompt, call the model with the permitted payload, evaluate the response.
 * Throws `Blocked` when a decision does not permit proceeding.
 */
export class ShieldedLLM {
  constructor(
    readonly engine: PolicyEngine,
    readonly llm: (prompt: string) => string,
    readonly opts: {
      identity: Record<string, unknown>;
      context?: Record<string, unknown>;
      sessionId?: string | null;
    },
  ) {}

  private req(type: string, content: string, traceId: string | null) {
    return {
      type,
      content,
      identity: this.opts.identity,
      context: this.opts.context ?? {},
      session: { id: this.opts.sessionId ?? null },
      trace_id: traceId,
    };
  }

  call(prompt: string): { text: unknown; prompt_decision: Decision; response_decision: Decision } {
    const dIn = this.engine.evaluate(this.req("prompt", prompt, null));
    if (!dIn.allowed) throw new Blocked(dIn);
    // The model only ever sees the permitted (e.g. redacted) payload.
    const raw = this.llm(dIn.payload as string);
    const dOut = this.engine.evaluate(this.req("response", raw, dIn.trace_id));
    if (!dOut.allowed) throw new Blocked(dOut);
    return { text: dOut.payload, prompt_decision: dIn, response_decision: dOut };
  }
}

export interface ToolGuardResult {
  executed: boolean;
  decision: string;
  reasons: string[];
  trace_id: string;
  approval_request_id?: string | null;
  output?: unknown;
  output_decision?: string;
}

/** Agent-framework hook. `tools` maps tool name -> function(params). */
export class ToolGuard {
  constructor(
    readonly engine: PolicyEngine,
    readonly tools: Record<string, (params: Record<string, unknown>) => unknown>,
  ) {}

  call(
    tool: string,
    params: Record<string, unknown>,
    opts: {
      identity: Record<string, unknown>;
      context?: Record<string, unknown>;
      sessionId?: string | null;
      approvalId?: string | null;
      traceId?: string | null;
    },
  ): ToolGuardResult {
    const d = this.engine.evaluate({
      type: "tool_call",
      tool,
      params,
      identity: opts.identity,
      context: opts.context ?? {},
      session: { id: opts.sessionId ?? null },
      approval_id: opts.approvalId ?? null,
      trace_id: opts.traceId ?? null,
    });
    if (!d.allowed) {
      return {
        executed: false,
        decision: d.decision,
        reasons: d.reasons,
        approval_request_id: d.approval_request_id,
        trace_id: d.trace_id,
      };
    }
    const fn = Object.prototype.hasOwnProperty.call(this.tools, tool) ? this.tools[tool] : undefined;
    if (!fn) {
      // declared in policy but not wired: fail closed
      return {
        executed: false,
        decision: "DENY",
        reasons: ["tool not available"],
        trace_id: d.trace_id,
      };
    }
    const output = fn((d.payload as { params: Record<string, unknown> }).params);
    const dOut = this.engine.evaluate({
      type: "tool_output",
      content: typeof output === "string" ? output : JSON.stringify(output),
      identity: opts.identity,
      context: opts.context ?? {},
      session: { id: opts.sessionId ?? null },
      trace_id: d.trace_id,
    });
    return {
      executed: true,
      decision: d.decision,
      output: dOut.allowed ? dOut.payload : null,
      output_decision: dOut.decision,
      reasons: [...d.reasons, ...dOut.reasons],
      trace_id: d.trace_id,
    };
  }
}

/** Flatten decision-log records into SIEM-friendly events (content already redacted). */
export function decisionEvents(
  source: PolicyEngine | AuditLog | readonly AuditRecord[],
  action = "policy.evaluate",
): Array<Record<string, unknown>> {
  const records: readonly AuditRecord[] =
    source instanceof PolicyEngine
      ? source.audit.records
      : Array.isArray(source)
        ? source
        : (source as AuditLog).records;
  const out: Array<Record<string, unknown>> = [];
  for (const r of records) {
    if (r.action !== action) continue;
    const d = r.details ?? {};
    const ctx = (d["context"] as Record<string, unknown> | undefined) ?? {};
    out.push({
      ts: r.ts,
      trace_id: r.trace_id,
      audit_id: r.id,
      record_hash: r.hash,
      actor: r.actor,
      policy: r.resource,
      mode: d["mode"] ?? null,
      decision: d["decision"] ?? null,
      would_be_decision: d["would_be_decision"] ?? null,
      warning: d["warning"] ?? null,
      kill_switch: d["kill_switch"] ?? null,
      request_type: d["request_type"] ?? null,
      tool: d["tool"] ?? null,
      matched_rules: d["matched_rules"] ?? null,
      citations: d["citations"] ?? null,
      findings: d["findings"] ?? null,
      ...Object.fromEntries(Object.entries(ctx).map(([k, v]) => [`ctx_${k}`, v])),
    });
  }
  return out;
}

export interface IntegrationSnippet {
  id: "sdk_wrapper" | "tool_guard" | "gateway" | "event_sink";
  title: string;
  description: string;
  language: "python";
  code: string;
}

/** The four integration patterns (docs/RUNTIME_SHIELD_DESIGN.md §7) as copyable snippets. */
export function integrationSnippets(policyFile = "policy.yaml"): IntegrationSnippet[] {
  const load =
    "from veritrail_common.audit import AuditLog\n" +
    "from veritrail_policy.engine import PolicyEngine\n" +
    "from veritrail_policy.loader import load_policy\n\n" +
    `engine = PolicyEngine(load_policy("${policyFile}"), AuditLog("var/audit/runtime_shield.jsonl"),\n` +
    '                      default_context={"agent_name": "my-agent", "environment": "staging"})\n';
  return [
    {
      id: "sdk_wrapper",
      title: "SDK wrapper",
      description:
        "Evaluate the prompt, call the model with the permitted (e.g. redacted) payload, then evaluate the response.",
      language: "python",
      code:
        load +
        "from veritrail_shield.integrations import Blocked, ShieldedLLM\n\n" +
        "llm = ShieldedLLM(engine, call_model, identity=user_claims, session_id=session_id)\n" +
        "try:\n" +
        "    answer = llm(user_prompt)[\"text\"]\n" +
        "except Blocked as exc:\n" +
        "    answer = f\"Request not permitted: {exc.decision.decision}\"\n",
    },
    {
      id: "tool_guard",
      title: "Agent-framework tool guard",
      description:
        "Every tool call is evaluated before execution; every tool output is screened before it re-enters the model context.",
      language: "python",
      code:
        load +
        "from veritrail_shield.integrations import ToolGuard\n\n" +
        'guard = ToolGuard(engine, {"crm.lookup_order": lookup_order})\n' +
        'result = guard.call("crm.lookup_order", {"order_id": "ORD-123456"}, identity=user_claims,\n' +
        "                    session_id=session_id, approval_id=approval_id)\n" +
        'if not result["executed"]:\n' +
        '    queue_for_review(result["decision"], result.get("approval_request_id"))\n',
    },
    {
      id: "gateway",
      title: "Gateway / proxy",
      description:
        "Run PolicyEngine.evaluate in an HTTP proxy in front of the model API; forward only decision.payload when decision.allowed.",
      language: "python",
      code:
        load +
        "\ndef handle(request_json: dict) -> dict:\n" +
        "    decision = engine.evaluate(request_json)\n" +
        "    if not decision.allowed:\n" +
        '        return {"status": 403, "decision": decision.decision, "trace_id": decision.trace_id}\n' +
        '    return {"status": 200, "forward": decision.payload, "trace_id": decision.trace_id}\n',
    },
    {
      id: "event_sink",
      title: "Event sink (SIEM)",
      description:
        "Flatten the hash-chained decision log into JSON events for a SIEM or data lake (redacted content only).",
      language: "python",
      code:
        load +
        "import json\nfrom veritrail_shield.integrations import decision_events\n\n" +
        "for event in decision_events(engine):\n" +
        "    siem.send(json.dumps(event))\n",
    },
  ];
}
