import { z } from "zod";
import { redact } from "@/features/site/engines/ask-veritrail/safety";

export const assistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(16000),
  sources: z.array(z.object({ title: z.string(), url: z.string().startsWith("/") })).optional(),
});
export type ChatMessage = z.infer<typeof assistantMessageSchema>;
export type ThreadRow = { id: string; title: string; updated_at: string };
export const assistantInputSchema = z.object({
  threadId: z.uuid(),
  content: z.string().trim().min(1).max(4000),
});

export function parseMessages(value: unknown): ChatMessage[] | null {
  const parsed = z.array(assistantMessageSchema).safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function modelMessages(messages: ChatMessage[]) {
  return messages.slice(-40).map(({ role, content }) => ({ role, content: redact(content).text }));
}