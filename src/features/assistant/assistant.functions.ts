import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSearchEntries, normalize, type SearchEntry } from "@/features/search/search-index";
import {
  extractText,
  quotaExceededMessage,
  QUOTA_UNAVAILABLE,
} from "@/features/governance/advisor.functions";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assistantInputSchema,
  modelMessages,
  parseMessages,
  type ChatMessage,
} from "./assistant-model";

export interface AssistantSource {
  title: string;
  url: string;
}
export interface AssistantReply {
  ok: boolean;
  error?: string;
  answer?: string;
  sources?: AssistantSource[];
}

const STOP = new Set(
  "a an and are can do does for from how i in is it me my of on or the to what where which who why with you your about find show page".split(
    " ",
  ),
);

/** Site entries sharing the most words with the question, best first. */
export function retrieve(entries: SearchEntry[], question: string, limit = 12): SearchEntry[] {
  const tokens = normalize(question)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t));
  if (!tokens.length) return [];
  return entries
    .map((e) => {
      const title = normalize(e.title);
      const body = normalize(`${e.subtitle} ${e.text}`);
      let s = 0;
      for (const t of tokens) s += (title.includes(t) ? 3 : 0) + (body.includes(t) ? 1 : 0);
      return [s, e] as const;
    })
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([, e]) => e);
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => assistantInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<AssistantReply> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The assistant is not configured yet." };
    const { data: thread, error: loadError } = await context.supabase
      .from("assistant_threads")
      .select("messages,updated_at,title")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (loadError || !thread) return { ok: false, error: "This conversation could not be found." };
    const history = parseMessages(thread.messages);
    if (!history) return { ok: false, error: "This conversation could not be read." };
    const plan = await (
      await import("@/features/billing/billing.server")
    ).planForCaller(context.supabase);
    const rpc = context.supabase.rpc as unknown as (
      fn: "consume_ai_quota",
      args: { p_feature: "advisor"; p_limit: number },
    ) => Promise<{ data: boolean | null; error: unknown }>;
    const quota = await rpc.call(context.supabase, "consume_ai_quota", {
      p_feature: "advisor",
      p_limit: plan.limits.advisorPerDay,
    });
    if (quota.error) return { ok: false, error: QUOTA_UNAVAILABLE };
    if (quota.data !== true) return { ok: false, error: quotaExceededMessage(plan) };
    const next: ChatMessage[] = [...history, { role: "user", content: data.content }];
    const revision = new Date().toISOString();
    const { data: saved, error: saveError } = await context.supabase
      .from("assistant_threads")
      .update({
        messages: JSON.parse(JSON.stringify(next)),
        updated_at: revision,
        title: history.length === 0 ? data.content.slice(0, 80) : thread.title,
      })
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .eq("updated_at", thread.updated_at)
      .select("id")
      .maybeSingle();
    if (saveError || !saved)
      return {
        ok: false,
        error: "The conversation changed or could not be saved. Reload before sending again.",
      };
    const safeMessages = modelMessages(next);
    const retrievalQuestion = safeMessages
      .filter((message) => message.role === "user")
      .slice(-2)
      .map((message) => message.content)
      .join(" ");
    const hits = retrieve(buildSearchEntries(), retrievalQuestion);
    const siteContext = hits
      .map((e) => `- [${e.title}](${e.url}) — ${e.subtitle}. ${e.text.slice(0, 400)}`)
      .join("\n");
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          reasoning: { effort: "low" },
          instructions:
            "You are the VERITRAIL site assistant for AI governance practitioners. Answer using the site content below, " +
            "and for navigation questions point to the exact page with a markdown link using its relative URL. " +
            "If the content does not cover the question, say so briefly and suggest the closest page. Be concise, use sentence case, " +
            "and never invent controls, pages or regulatory facts.\n\nSite content:\n" +
            (siteContext || "(no matching pages)"),
          input: safeMessages,
        }),
      });
      if (res.status === 429)
        return { ok: false, error: "The assistant is busy. Try again in a minute." };
      if (res.status === 402) return { ok: false, error: "AI usage credits are exhausted." };
      if (!res.ok)
        return { ok: false, error: "The assistant could not respond. Try again shortly." };
      const answer = extractText(await res.json().catch(() => null));
      if (!answer)
        return { ok: false, error: "The assistant returned an empty answer. Try again." };
      const sources = hits.slice(0, 4).map((e) => ({ title: e.title, url: e.url }));
      const final: ChatMessage[] = [...next, { role: "assistant", content: answer, sources }];
      const { data: completed, error: finishError } = await context.supabase
        .from("assistant_threads")
        .update({
          messages: JSON.parse(JSON.stringify(final)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.threadId)
        .eq("user_id", context.userId)
        .eq("updated_at", revision)
        .select("id")
        .maybeSingle();
      if (finishError || !completed)
        return {
          ok: false,
          error: "The answer could not be saved. Reload the conversation before trying again.",
        };
      return {
        ok: true,
        answer,
        sources,
      };
    } catch {
      return {
        ok: false,
        error: "The assistant could not respond. Your question is saved; try again shortly.",
      };
    }
  });

export const createAssistantThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().trim().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase
      .from("assistant_threads")
      .insert({ title: data.title, user_id: context.userId })
      .select("id")
      .single();
    if (error || !thread) throw new Error("Could not start a saved conversation. Try again.");
    return thread;
  });
