import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiIncidentListSchema } from "./incident-schema";
import { governanceDecisionListSchema } from "./decision-schema";
import { changeReviewListSchema } from "./change-schema";
import { monitoringPlanListSchema } from "./monitoring-schema";
import { correctiveActionListSchema } from "./actions-schema";
const answer = z.object({
  s: z.number().int().min(0).max(4),
  e: z.number().int().min(0).max(3),
  attachment: z.string().optional(),
  notes: z.string().optional(),
  url: z.string().optional(),
});
const system = z.object({
  name: z.string(),
  kind: z.string(),
  owner: z.string(),
  data: z.string(),
  tier: z.string(),
  status: z.string(),
  vendor: z.string(),
  riskTriage: z
    .object({
      profile: z.record(z.string(), z.union([z.string(), z.boolean(), z.array(z.string())])),
      result: z.object({
        tier: z.enum(["Low", "Medium", "High", "Prohibited-review"]),
        score: z.number().int().min(0),
        provisional: z.boolean(),
        factors: z.array(
          z.object({
            factor: z.string(),
            value: z.union([z.string(), z.boolean()]),
            points: z.number(),
            citation: z.string(),
          }),
        ),
        triggers: z.array(z.string()),
        missing_fields: z.array(z.string()),
        clarifying_questions: z.array(z.string()),
        required_modules: z.array(z.string()),
        approval_authority: z.string(),
        review_cadence_months: z.number().int().min(0),
        evidence_status: z.literal("Inferred"),
        requires_human_confirmation: z.literal(true),
        rationale: z.string(),
        citations: z.array(z.string()),
        citation_ids: z.array(z.string()),
        method: z.string(),
      }),
      assessedAt: z.string().datetime({ offset: true }),
    })
    .optional(),
});
const item = z.object({
  key: z.string(),
  phase: z.number().int().min(0).max(3),
  title: z.string(),
  owner: z.string(),
  effort: z.string(),
  tag: z.string(),
  done: z.boolean(),
});
export const workspaceState = z.object({
  workspaceMode: z.enum(["sample", "personal"]).default("personal"),
  answers: z.record(z.string(), answer),
  gr: z.record(z.string(), z.boolean()),
  tier: z.enum(["Low", "Medium", "High"]),
  systems: z.array(system),
  incidents: aiIncidentListSchema,
  decisions: governanceDecisionListSchema,
  changeReviews: changeReviewListSchema,
  monitoringPlans: monitoringPlanListSchema,
  correctiveActions: correctiveActionListSchema,
  roadmap: z.array(item),
  qi: z.number().int().min(0).max(11),
});
export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      organizationId: z.string().uuid().nullable(),
      name: z.string().trim().min(1).max(120),
      state: workspaceState,
      sources: z.array(z.record(z.string(), z.string())),
    }),
  )
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("save_aegis_workspace", {
      p_org: data.organizationId ?? "00000000-0000-0000-0000-000000000000",
      p_name: data.name,
      p_state: JSON.parse(JSON.stringify(data.state)),
      p_sources: JSON.parse(JSON.stringify(data.sources)),
    });
    if (result.error) throw new Error("Unable to save workspace. Please retry.");
    return { id: result.data };
  });
export const loadWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ organizationId: z.string().uuid().optional() }).optional())
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("organizations")
      .select("id,name")
      .eq("owner_id", context.userId);
    if (data?.organizationId) query = query.eq("id", data.organizationId);
    const { data: org, error } = await query
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("Unable to load workspace.");
    if (!org) return null;
    const [a, g, s, r, i, d, c, m, ca] = await Promise.all([
      context.supabase.from("assessments").select("answers").eq("organization_id", org.id).single(),
      context.supabase
        .from("guardrail_configs")
        .select("controls,tier")
        .eq("organization_id", org.id)
        .single(),
      context.supabase.from("ai_systems").select("systems").eq("organization_id", org.id).single(),
      context.supabase.from("roadmap_items").select("items").eq("organization_id", org.id).single(),
      context.supabase
        .from("ai_incidents")
        .select("incidents")
        .eq("organization_id", org.id)
        .maybeSingle(),
      context.supabase
        .from("ai_governance_decisions")
        .select("decisions")
        .eq("organization_id", org.id)
        .maybeSingle(),
      context.supabase
        .from("ai_change_reviews")
        .select("reviews")
        .eq("organization_id", org.id)
        .maybeSingle(),
      context.supabase
        .from("ai_monitoring_plans")
        .select("plans")
        .eq("organization_id", org.id)
        .maybeSingle(),
      context.supabase
        .from("ai_corrective_actions")
        .select("actions")
        .eq("organization_id", org.id)
        .maybeSingle(),
    ]);
    if (
      a.error ||
      g.error ||
      s.error ||
      r.error ||
      i.error ||
      d.error ||
      c.error ||
      m.error ||
      ca.error
    )
      throw new Error("Workspace data unavailable.");
    const state = workspaceState.parse({
      workspaceMode: "personal",
      answers: a.data.answers,
      gr: g.data.controls,
      tier: g.data.tier,
      systems: s.data.systems,
      incidents: i.data?.incidents ?? [],
      decisions: d.data?.decisions ?? [],
      changeReviews: c.data?.reviews ?? [],
      monitoringPlans: m.data?.plans ?? [],
      correctiveActions: ca.data?.actions ?? [],
      roadmap: r.data.items,
      qi: 0,
    });
    return { id: org.id, name: org.name, state };
  });
export const listWorkspaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("organizations")
      .select("id,name,created_at")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Unable to list workspaces.");
    return data;
  });
