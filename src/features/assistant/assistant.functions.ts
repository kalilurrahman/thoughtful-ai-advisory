import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSearchEntries, normalize, type SearchEntry } from "@/features/search/search-index";
import { extractText } from "@/features/governance/advisor.functions";

const inputSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .min(1)
    .max(40),
});

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
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AssistantReply> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The assistant is not configured yet." };
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const hits = retrieve(buildSearchEntries(), lastUser);
    const context = hits
      .map((e) => `- [${e.title}](${e.url}) — ${e.subtitle}. ${e.text.slice(0, 400)}`)
      .join("\n");
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
          (context || "(no matching pages)"),
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (res.status === 429) return { ok: false, error: "The assistant is busy. Try again in a minute." };
    if (res.status === 402) return { ok: false, error: "AI usage credits are exhausted." };
    if (!res.ok) return { ok: false, error: "The assistant could not respond. Try again shortly." };
    const answer = extractText(await res.json().catch(() => null));
    if (!answer) return { ok: false, error: "The assistant returned an empty answer. Try again." };
    return {
      ok: true,
      answer,
      sources: hits.slice(0, 4).map((e) => ({ title: e.title, url: e.url })),
    };
  });
