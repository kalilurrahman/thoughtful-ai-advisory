import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useGovernance } from "@/features/governance/store";
import { askAssistant, createAssistantThread } from "./assistant.functions";
import { parseMessages, type ChatMessage, type ThreadRow } from "./assistant-model";

export function useAssistant(threadId?: string) {
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
    if (userId)
      void supabase
        .from("assistant_threads")
        .select("id,title,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(50)
        .then(({ data, error: loadError }) => {
          if (!active) return;
          if (loadError) setError("Saved conversations could not be loaded. Try again.");
          else setThreads(data ?? []);
        });
    return () => {
      active = false;
    };
  }, [userId, threadId, busy]);

  useEffect(() => {
    let active = true;
    setMessages([]);
    setError("");
    setLoading(Boolean(userId && threadId));
    if (userId && threadId)
      void supabase
        .from("assistant_threads")
        .select("messages")
        .eq("id", threadId)
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data, error: loadError }) => {
          if (!active) return;
          const loaded = data ? parseMessages(data.messages) : null;
          if (loadError || !loaded) setError("This conversation could not be found or read.");
          else setMessages(loaded);
          setLoading(false);
          inputRef.current?.focus();
        });
    return () => {
      active = false;
    };
  }, [userId, threadId]);

  async function startConversation(title = "New conversation") {
    if (busy || !userId) return;
    setBusy(true);
    setError("");
    try {
      const thread = await create({ data: { title } });
      await navigate({ to: "/assistant/$threadId", params: { threadId: thread.id } });
    } catch {
      setError("Could not start a saved conversation. Try again.");
    } finally {
      setBusy(false);
    }
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
      if (reply.ok && reply.answer)
        setMessages([
          ...next,
          { role: "assistant", content: reply.answer, sources: reply.sources },
        ]);
      else setError(reply.error ?? "The assistant could not respond.");
    } catch {
      setError(
        "The assistant could not respond. Reload to check your saved question before trying again.",
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function remove(id: string) {
    if (!userId || busy || !window.confirm("Permanently delete this conversation?")) return;
    const { data, error: deleteError } = await supabase
      .from("assistant_threads")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");
    if (deleteError || !data?.length) {
      setError("The conversation could not be deleted. Try again.");
      return;
    }
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (id === threadId) void navigate({ to: "/assistant" });
  }

  useEffect(() => {
    if (!busy && !loading) inputRef.current?.focus();
  }, [busy, loading, threadId]);
  return {
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
  };
}
