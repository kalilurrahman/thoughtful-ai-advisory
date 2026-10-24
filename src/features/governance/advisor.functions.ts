import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CONTROLS, PILLARS } from "@/data/governance";
import { correctiveActionPriorities } from "./actions-schema";

const inputSchema = z.object({
  concern: z.string().trim().min(20, "Describe the concern in at least 20 characters.").max(4000),
  focus: z.enum(["Policy", "Risk", "Control"]),
});

export interface AdvisorArea {
  controlId: string;
  code: string;
  pillar: string;
  nist: string;
  question: string;
  relevance: "High" | "Medium" | "Low";
  rationale: string;
}
export interface AdvisorAction {
  title: string;
  description: string;
  priority: (typeof correctiveActionPriorities)[number];
  owner: string;
  controlId: string;
}
export interface AdvisorResult {
  ok: boolean;
  error?: string;
  summary?: string;
  areas?: AdvisorArea[];
  actions?: AdvisorAction[];
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "areas", "actions"],
  properties: {
    summary: { type: "string" },
    areas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["controlId", "relevance", "rationale"],
        properties: {
          controlId: { type: "string" },
          relevance: { type: "string", enum: ["High", "Medium", "Low"] },
          rationale: { type: "string" },
        },
      },
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "priority", "owner", "controlId"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: [...correctiveActionPriorities] },
          owner: { type: "string" },
          controlId: { type: "string" },
        },
      },
    },
  },
};

export function extractText(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const b = body as { output_text?: unknown; output?: unknown };
  if (typeof b.output_text === "string") return b.output_text;
  if (!Array.isArray(b.output)) return "";
  for (const item of b.output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      const t = (c as { text?: unknown }).text;
      if (typeof t === "string") return t;
    }
  }
  return "";
}

const UNREADABLE = "The advisor returned an unreadable answer. Try again.";

/**
 * The advisor's answer from the gateway's HTTP status and JSON body: busy and credit errors
 * explained, and only areas and actions that cite a control in the catalogue kept.
 */
export function adviceFromResponse(status: number, body: unknown): AdvisorResult {
  if (status === 429) return { ok: false, error: "The advisor is busy. Try again in a minute." };
  if (status === 402)
    return { ok: false, error: "AI usage credits are exhausted for this workspace." };
  if (status < 200 || status >= 300)
    return { ok: false, error: "The advisor could not respond. Try again shortly." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractText(body));
  } catch {
    return { ok: false, error: UNREADABLE };
  }
  const p = parsed as { summary?: unknown; areas?: unknown; actions?: unknown } | null;
  if (!p || typeof p.summary !== "string" || !Array.isArray(p.areas) || !Array.isArray(p.actions))
    return { ok: false, error: UNREADABLE };
  const byId = new Map<string, (typeof CONTROLS)[number]>(CONTROLS.map((c) => [c.id, c]));
  const relevance = new Set<string>(["High", "Medium", "Low"]);
  const priorities = new Set<string>(correctiveActionPriorities);
  const areas: AdvisorArea[] = p.areas.flatMap((raw) => {
    const a = raw as { controlId?: unknown; relevance?: unknown; rationale?: unknown };
    const c = typeof a.controlId === "string" ? byId.get(a.controlId) : undefined;
    if (!c || typeof a.relevance !== "string" || !relevance.has(a.relevance)) return [];
    return [
      {
        controlId: c.id,
        code: c.code,
        pillar: PILLARS[c.p]?.name ?? "",
        nist: PILLARS[c.p]?.nist ?? "",
        question: c.text,
        relevance: a.relevance as AdvisorArea["relevance"],
        rationale: typeof a.rationale === "string" ? a.rationale : "",
      },
    ];
  });
  const actions = p.actions.filter((raw): raw is AdvisorAction => {
    const a = raw as Partial<Record<keyof AdvisorAction, unknown>>;
    return (
      typeof a.controlId === "string" &&
      byId.has(a.controlId) &&
      typeof a.title === "string" &&
      typeof a.description === "string" &&
      typeof a.owner === "string" &&
      typeof a.priority === "string" &&
      priorities.has(a.priority)
    );
  });
  return { ok: true, summary: p.summary, areas, actions };
}

export const recommendGovernance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AdvisorResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The AI advisor is not configured yet." };
    const catalogue = CONTROLS.map(
      (c) =>
        `${c.id} | ${c.code} | ${PILLARS[c.p]?.name ?? ""} (${PILLARS[c.p]?.nist ?? ""}) | ${c.text}`,
    ).join("\n");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        instructions:
          "You are a senior AI governance advisor aligned to NIST AI RMF, ISO/IEC 42001 and the EU AI Act. " +
          "Map the user's concern to the most relevant controls from the catalogue (use only listed controlIds, 3-6 areas, most relevant first) " +
          "and propose 3-5 concrete, owned corrective actions, each tied to one listed controlId. Be precise and practical; no generic advice.\n\nCatalogue (id | code | pillar | question):\n" +
          catalogue,
        input: `Concern type: ${data.focus}\n\n${data.concern}`,
        text: { format: { type: "json_schema", name: "governance_advice", strict: true, schema } },
      }),
    });
    return adviceFromResponse(res.status, res.ok ? await res.json().catch(() => null) : null);
  });
