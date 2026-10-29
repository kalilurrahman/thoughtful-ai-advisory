import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Compass, MessageSquarePlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { useGovernance } from "@/features/governance/store";
import { askAssistant, type AssistantSource } from "./assistant.functions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[] | undefined;
}
interface ThreadRow {
  id: string;
  title: string;
  updated_at: string;
}

const EXAMPLES = [
  "Where do I record an AI incident?",
  "Which controls cover human oversight?",
  "How do I run the maturity assessment?",
];

function isMessages(v: unknown): v is ChatMessage[] {
  return Array.isArray(v);
}

export function AssistantScreen({ threadId }: { threadId?: string }) {
  const { userId } = useGovernance();
  const navigate = useNavigate();
  const ask = useServerFn(askAssistant);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("assistant_threads")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setThreads(data ?? []));
  }, [userId, threadId, busy]);

  useEffect(() => {
    setMessages([]);
    setError("");
    if (!userId || !threadId) return;
    void supabase
      .from("assistant_threads")
      .select("messages")
      .eq("id", threadId)
      .maybeSingle()
      .then(({ data, error: e }) => {
        if (e || !data) setError("This conversation could not be found.");
        else if (isMessages(data.messages)) setMessages(data.messages);
      });
    inputRef.current?.focus();
  }, [userId, threadId]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !userId) return;
    setError("");
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    let id = threadId;
    if (!id) {
      const { data, error: e } = await supabase
        .from("assistant_threads")
        .insert({ title: content.slice(0, 80) })
        .select("id")
        .single();
      if (e || !data) {
        setError("Could not start a saved conversation. Try again.");
        setBusy(false);
        return;
      }
      id = data.id;
    }
    const reply = await ask({
      data: { messages: next.map(({ role, content: c }) => ({ role, content: c })) },
    }).catch(() => ({ ok: false, error: "The assistant could not respond.", answer: undefined, sources: undefined }));
    const final: ChatMessage[] = reply.ok && reply.answer
      ? [...next, { role: "assistant", content: reply.answer, sources: reply.sources }]
      : next;
    if (!reply.ok) setError(reply.error ?? "The assistant could not respond.");
    setMessages(final);
    const { error: saveErr } = await supabase
      .from("assistant_threads")
      .update({ messages: JSON.parse(JSON.stringify(final)), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (saveErr) setError("Your reply arrived but could not be saved.");
    setBusy(false);
    if (id !== threadId) void navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    inputRef.current?.focus();
  }

  async function remove(id: string) {
    await supabase.from("assistant_threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
    if (id === threadId) void navigate({ to: "/assistant" });
  }

  if (!userId)
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <Compass className="mx-auto mb-3 size-10 text-primary" aria-hidden />
        <h1 className="mb-2 text-2xl font-semibold">Ask the site assistant</h1>
        <p className="mb-4 text-muted-foreground">
          Sign in to chat with an assistant that answers from VERITRAIL guidance and saves your
          conversations privately.
        </p>
        <Button asChild>
          <Link to="/auth">Sign in to start</Link>
        </Button>
      </div>
    );

  return (
    <div className="grid h-[calc(100dvh-8rem)] gap-4 p-3 md:grid-cols-[240px_1fr] md:p-4">
      <aside className="hidden flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-card p-3 md:flex">
        <Button asChild size="sm">
          <Link to="/assistant">
            <MessageSquarePlus aria-hidden /> New conversation
          </Link>
        </Button>
        <ul className="flex flex-col gap-1">
          {threads.map((t) => (
            <li key={t.id} className="group flex items-center gap-1">
              <Link
                to="/assistant/$threadId"
                params={{ threadId: t.id }}
                className={`flex-1 truncate rounded-md px-2 py-1.5 text-sm hover:bg-muted ${t.id === threadId ? "bg-muted font-medium" : ""}`}
              >
                {t.title}
              </Link>
              <button
                type="button"
                aria-label={`Delete conversation ${t.title}`}
                onClick={() => void remove(t.id)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3 md:hidden">
          <span className="font-medium">Site assistant</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/assistant">
              <MessageSquarePlus aria-hidden /> New
            </Link>
          </Button>
        </div>
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<Compass className="size-10 text-primary" />}
                title="Ask about VERITRAIL guidance"
                description="Answers come from the site's governance content, with links to the right page."
              >
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {EXAMPLES.map((q) => (
                    <Button key={q} size="sm" variant="outline" onClick={() => void send(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((m, i) => (
                <Message key={i} from={m.role}>
                  <MessageContent>
                    {m.role === "assistant" ? (
                      <>
                        <MessageResponse>{m.content}</MessageResponse>
                        {m.sources?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {m.sources.map((s) => (
                              <a key={s.url} href={s.url} className="rounded-full border border-border px-2 py-0.5 hover:bg-muted">
                                {s.title}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      m.content
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
            {busy ? <p className="text-sm text-muted-foreground">Thinking…</p> : null}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t border-border p-3">
          <PromptInput onSubmit={(msg) => void send(msg.text)}>
            <PromptInputTextarea ref={inputRef} autoFocus placeholder="Ask where to find something, or about a control…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={busy ? "submitted" : "ready"} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-xs text-muted-foreground">
            AI answers can be wrong. Check guidance with qualified people before relying on it.
          </p>
        </div>
      </section>
    </div>
  );
}
