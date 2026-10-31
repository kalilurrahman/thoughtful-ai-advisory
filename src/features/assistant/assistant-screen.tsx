import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Compass, History, MessageSquarePlus } from "lucide-react";
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
import { askAssistant, createAssistantThread } from "./assistant.functions";
import { parseMessages, type ChatMessage, type ThreadRow } from "./assistant-model";
import { ThreadList } from "./thread-list";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Shimmer } from "@/components/ai-elements/shimmer";

const EXAMPLES = [
  "Where do I record an AI incident?",
  "Which controls cover human oversight?",
  "How do I run the maturity assessment?",
];

export function AssistantScreen({ threadId }: { threadId?: string }) {
  const { userId } = useGovernance();
  const navigate = useNavigate();
  const ask = useServerFn(askAssistant);
  const create = useServerFn(createAssistantThread);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(threadId));
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    setThreads([]);
    if (userId) void supabase.from("assistant_threads").select("id,title,updated_at")
      .eq("user_id", userId).order("updated_at", { ascending: false }).limit(50)
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError("Saved conversations could not be loaded. Try again.");
        else setThreads(data ?? []);
      });
    return () => { active = false; };
  }, [userId, threadId, busy]);

  useEffect(() => {
    let active = true;
    setMessages([]);
    setError("");
    setLoading(Boolean(userId && threadId));
    if (userId && threadId) void supabase.from("assistant_threads").select("messages")
      .eq("id", threadId).eq("user_id", userId).maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active) return;
        const loaded = data ? parseMessages(data.messages) : null;
        if (loadError || !loaded) setError("This conversation could not be found or read.");
        else setMessages(loaded);
        setLoading(false);
        inputRef.current?.focus();
      });
    return () => { active = false; };
  }, [userId, threadId]);

  async function startConversation(title = "New conversation") {
    if (busy || !userId) return;
    setBusy(true);
    setError("");
    try {
      const thread = await create({ data: { title } });
      await navigate({ to: "/assistant/$threadId", params: { threadId: thread.id } });
    } catch { setError("Could not start a saved conversation. Try again."); }
    finally { setBusy(false); }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || loading || !userId || !threadId) return;
    setError("");
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      const reply = await ask({ data: { threadId, content } });
      if (reply.ok && reply.answer) setMessages([...next, { role: "assistant", content: reply.answer, sources: reply.sources }]);
      else setError(reply.error ?? "The assistant could not respond.");
    } catch { setError("The assistant could not respond. Reload to check your saved question before trying again."); }
    finally { setBusy(false); inputRef.current?.focus(); }
  }

  async function remove(id: string) {
    if (!userId || busy || !window.confirm("Permanently delete this conversation?")) return;
    const { data, error: deleteError } = await supabase.from("assistant_threads").delete()
      .eq("id", id).eq("user_id", userId).select("id");
    if (deleteError || !data?.length) { setError("The conversation could not be deleted. Try again."); return; }
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (id === threadId) void navigate({ to: "/assistant" });
  }

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
    <div className="grid h-[calc(100dvh-9rem)] min-h-96 min-w-0 gap-3 p-2 md:grid-cols-[240px_minmax(0,1fr)] md:p-4">
      <aside className="hidden min-w-0 flex-col gap-2 overflow-y-auto border-r border-border p-3 md:flex">
        <Button disabled={busy} onClick={() => void startConversation()}><MessageSquarePlus aria-hidden /> Start conversation</Button>
        <ThreadList threads={threads} threadId={threadId} busy={busy} onDelete={(id) => void remove(id)} />
      </aside>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader className="mb-5"><SheetTitle>Saved conversations</SheetTitle><SheetDescription>Your private conversation history.</SheetDescription></SheetHeader>
          <ThreadList threads={threads} threadId={threadId} busy={busy} onSelect={() => setHistoryOpen(false)} onDelete={(id) => void remove(id)} />
        </SheetContent>
      </Sheet>
      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <div className="flex min-w-0 items-center gap-2"><Compass className="size-5 shrink-0 text-primary" aria-hidden /><span className="truncate font-medium">Site assistant</span></div>
          <div className="flex shrink-0 gap-1">
            <Button className="md:hidden" size="icon" variant="outline" aria-label="Saved conversations" title="Saved conversations" onClick={() => setHistoryOpen(true)}><History aria-hidden /></Button>
            <Button size="icon" variant="outline" aria-label="New conversation" title="New conversation" disabled={busy} onClick={() => void startConversation()}><MessageSquarePlus aria-hidden /></Button>
          </div>
        </div>
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {loading ? <p role="status" className="text-muted-foreground">Loading conversation…</p> : messages.length === 0 ? (
              <ConversationEmptyState
                icon={<Compass className="size-10 text-primary" />}
                title="Ask about VERITRAIL guidance"
                description="Answers come from the site's governance content, with links to the right page."
              >
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {!threadId ? <Button disabled={busy} onClick={() => void startConversation()}><MessageSquarePlus aria-hidden /> Start conversation</Button> : EXAMPLES.map((q) => (
                    <Button key={q} size="sm" variant="outline" disabled={busy} className="h-auto min-h-11 whitespace-normal text-left" onClick={() => void send(q)}>
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
            {busy ? <div role="status"><Shimmer>Thinking…</Shimmer></div> : null}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t border-border p-3">
          <PromptInput onSubmit={(msg) => void send(msg.text)}>
            <PromptInputTextarea ref={inputRef} autoFocus disabled={loading || busy || !threadId} maxLength={4000} aria-label="Governance question" placeholder="Ask where to find something, or about a control…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={busy ? "submitted" : "ready"} disabled={busy || loading || !threadId} aria-label="Send question" />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-xs text-muted-foreground">
            Private saved history · Common sensitive details are masked before AI processing. AI answers need human review.
          </p>
        </div>
      </section>
    </div>
  );
}
