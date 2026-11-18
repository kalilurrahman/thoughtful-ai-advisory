import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ChatsCircle, PaperPlaneRight, Trash } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/assurance/page-header";
import { useGovernance } from "./store";

export const DISCUSSION_TOPICS = [
  "General",
  "Policy",
  "Risk",
  "Controls",
  "Incidents",
  "Regulation",
] as const;

interface OrgMessage {
  id: string;
  organization_id: string;
  user_id: string;
  author: string;
  topic: string;
  body: string;
  created_at: string;
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function DiscussionsScreen() {
  const { userId, workspaceId, workspaceName } = useGovernance();
  const [messages, setMessages] = useState<OrgMessage[]>([]);
  const [topic, setTopic] = useState<string>("All");
  const [draftTopic, setDraftTopic] = useState<string>("General");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState("Member");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (active && u) setAuthor(String(u.user_metadata?.["full_name"] ?? u.email ?? "Member"));
    });
    void supabase
      .from("org_messages")
      .select("*")
      .eq("organization_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(500)
      .then(({ data, error: e }) => {
        if (!active) return;
        if (e) setError("Discussions could not be loaded. Check that you are a member of this workspace.");
        else setMessages(data ?? []);
      });
    const channel = supabase
      .channel(`org-messages-${workspaceId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_messages", filter: `organization_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as OrgMessage;
            setMessages((m) => (m.some((x) => x.id === row.id) ? m : [...m, row]));
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            setMessages((m) => m.filter((x) => x.id !== id));
          }
        },
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const shown = useMemo(
    () => (topic === "All" ? messages : messages.filter((m) => m.topic === topic)),
    [messages, topic],
  );
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [shown.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !workspaceId || !userId) return;
    if (text.length > 4000) return setError("Messages are limited to 4,000 characters.");
    setError(null);
    const { data, error: err } = await supabase
      .from("org_messages")
      .insert({ organization_id: workspaceId, user_id: userId, author: author.slice(0, 120), topic: draftTopic, body: text })
      .select()
      .single();
    if (err || !data) return setError("Your message was not sent. Please try again.");
    setBody("");
    setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from("org_messages").delete().eq("id", id);
    if (err) setError("The message could not be deleted.");
    else setMessages((m) => m.filter((x) => x.id !== id));
  }

  if (!userId || !workspaceId) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        <PageHeader eyebrow="Learn & collaborate" title="Team discussions" />
        <p className="text-muted-foreground">
          Team discussions belong to a saved organisation workspace. Sign in and open or create a
          workspace, then invite colleagues to discuss governance topics together.
        </p>
        <Button asChild className="w-fit">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <PageHeader eyebrow="Learn & collaborate" title="Team discussions" meta={[workspaceName]} />
      <p className="text-sm text-muted-foreground">
        Live conversation for members of this organisation. History is saved and visible only to members.
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by topic">
        {["All", ...DISCUSSION_TOPICS].map((t) => (
          <Button
            key={t}
            size="sm"
            role="tab"
            aria-selected={topic === t}
            variant={topic === t ? "default" : "outline"}
            onClick={() => setTopic(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <section
        aria-live="polite"
        className="flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-card p-3"
      >
        {shown.length === 0 && (
          <div className="m-auto flex flex-col items-center gap-2 text-center text-muted-foreground">
            <ChatsCircle size={36} aria-hidden />
            <p>No messages yet. Start the first governance discussion.</p>
          </div>
        )}
        {shown.map((m) => (
          <article key={m.id} className="rounded-lg border border-border bg-background p-3">
            <header className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{m.author}</span>
              <span className="rounded-full border border-border px-2 py-0.5">{m.topic}</span>
              <time dateTime={m.created_at}>{formatWhen(m.created_at)}</time>
              {m.user_id === userId && (
                <button
                  type="button"
                  aria-label="Delete message"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() => void remove(m.id)}
                >
                  <Trash size={16} />
                </button>
              )}
            </header>
            <p className="whitespace-pre-wrap text-sm">{m.body}</p>
          </article>
        ))}
        <div ref={endRef} />
      </section>
      <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          Topic
          <select
            value={draftTopic}
            onChange={(e) => setDraftTopic(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-2"
          >
            {DISCUSSION_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Message
          <textarea
            value={body}
            maxLength={4000}
            rows={2}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-md border border-input bg-background p-2"
            placeholder="Raise a policy, risk or control question for the team"
          />
        </label>
        <Button type="submit" disabled={!body.trim()}>
          <PaperPlaneRight aria-hidden /> Send
        </Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
