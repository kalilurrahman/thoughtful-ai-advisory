import { useAssistant } from "./use-assistant";
import { Link } from "@tanstack/react-router";
import { Compass, History, MessageSquarePlus } from "lucide-react";
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
import { ThreadList } from "./thread-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Shimmer } from "@/components/ai-elements/shimmer";

const EXAMPLES = [
  "Where do I record an AI incident?",
  "Which controls cover human oversight?",
  "How do I run the maturity assessment?",
];

export function AssistantScreen({ threadId }: { threadId?: string }) {
  const {
    userId,
    historyOpen,
    setHistoryOpen,
    loading,
    threads,
    messages,
    busy,
    error,
    inputRef,
    startConversation,
    send,
    remove,
  } = useAssistant(threadId);

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
        <Button disabled={busy} onClick={() => void startConversation()}>
          <MessageSquarePlus aria-hidden /> Start conversation
        </Button>
        <ThreadList
          threads={threads}
          threadId={threadId}
          busy={busy}
          onDelete={(id) => void remove(id)}
        />
      </aside>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>Saved conversations</SheetTitle>
            <SheetDescription>Your private conversation history.</SheetDescription>
          </SheetHeader>
          <ThreadList
            threads={threads}
            threadId={threadId}
            busy={busy}
            onSelect={() => setHistoryOpen(false)}
            onDelete={(id) => void remove(id)}
          />
        </SheetContent>
      </Sheet>
      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <div className="flex min-w-0 items-center gap-2">
            <Compass className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="truncate font-medium">Site assistant</span>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              className="md:hidden"
              size="icon"
              variant="outline"
              aria-label="Saved conversations"
              title="Saved conversations"
              onClick={() => setHistoryOpen(true)}
            >
              <History aria-hidden />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="New conversation"
              title="New conversation"
              disabled={busy}
              onClick={() => void startConversation()}
            >
              <MessageSquarePlus aria-hidden />
            </Button>
          </div>
        </div>
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {loading ? (
              <p role="status" className="text-muted-foreground">
                Loading conversation…
              </p>
            ) : messages.length === 0 ? (
              <ConversationEmptyState
                icon={<Compass className="size-10 text-primary" />}
                title="Ask about VERITRAIL guidance"
                description="Answers come from the site's governance content, with links to the right page."
              >
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {!threadId ? (
                    <Button disabled={busy} onClick={() => void startConversation()}>
                      <MessageSquarePlus aria-hidden /> Start conversation
                    </Button>
                  ) : (
                    EXAMPLES.map((q) => (
                      <Button
                        key={q}
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        className="h-auto min-h-11 whitespace-normal text-left"
                        onClick={() => void send(q)}
                      >
                        {q}
                      </Button>
                    ))
                  )}
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
                              <a
                                key={s.url}
                                href={s.url}
                                className="rounded-full border border-border px-2 py-0.5 hover:bg-muted"
                              >
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
            {busy ? (
              <div role="status">
                <Shimmer>Thinking…</Shimmer>
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t border-border p-3">
          <PromptInput onSubmit={(msg) => void send(msg.text)}>
            <PromptInputTextarea
              ref={inputRef}
              autoFocus
              disabled={loading || busy || !threadId}
              maxLength={4000}
              aria-label="Governance question"
              placeholder="Ask where to find something, or about a control…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={busy ? "submitted" : "ready"}
                disabled={busy || loading || !threadId}
                aria-label="Send question"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-xs text-muted-foreground">
            Private saved history · Common sensitive details are masked before AI processing. AI
            answers need human review.
          </p>
        </div>
      </section>
    </div>
  );
}
