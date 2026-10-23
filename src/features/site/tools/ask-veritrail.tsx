import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { NO_SOURCE_MESSAGE } from "../content";
import { ControlLinks, SiteLink, normalizeHref } from "../ui";
import {
  answerQuestion,
  createAskSession,
  type AskVeritrailResponse,
  type AskSession,
} from "../engines/ask-veritrail";
import { SafeMarkdown } from "./safe-markdown";

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "agent"; response: AskVeritrailResponse };

function AgentMessage({ response: d }: { response: AskVeritrailResponse }) {
  const message = d.message || d.answer || "";
  return (
    <>
      <SafeMarkdown markdown={message} headingBase={4} />
      {d.citations.length ? (
        <ControlLinks ids={d.citations} prefix="VERITRAIL controls cited: " />
      ) : (
        <p className="cite">{NO_SOURCE_MESSAGE}</p>
      )}
      {d.clarifying_question && !message.includes(d.clarifying_question) && (
        <p>
          <strong>Question: </strong>
          {d.clarifying_question}
        </p>
      )}
      {d.cta && !message.includes(d.cta.url) && (
        <p>
          <SiteLink href={normalizeHref(d.cta.url)}>{d.cta.label}</SiteLink>
        </p>
      )}
    </>
  );
}

/**
 * Ask VERITRAIL (limited demo): a deterministic, retrieval-based port of the VERITRAIL Agent's public
 * viewer-role Ask flow. Runs entirely in the browser; nothing is sent or stored.
 */
export function AskVeritrailTool() {
  const uid = useId();
  const inputId = `${uid}-input`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const session = useRef<AskSession>(createAskSession());
  const nextId = useRef(1);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const q = text.trim();
    if (!q) {
      setError("Type a question first.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    const userMsg: ChatMessage = { id: nextId.current++, role: "user", text: q };
    try {
      const response = answerQuestion(q, session.current);
      setMessages((m) => [...m, userMsg, { id: nextId.current++, role: "agent", response }]);
      setStatus("");
    } catch {
      setMessages((m) => [...m, userMsg]);
      setStatus("Your message could not be processed.");
    }
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function reset() {
    session.current = createAskSession();
    setMessages([]);
    setText("");
    setError("");
    setStatus("");
    inputRef.current?.focus();
  }

  return (
    <section className="tool chat" id="ask-veritrail" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`}>Ask VERITRAIL</h2>
      <p className="notice">
        <strong>Deterministic demo — runs in your browser.</strong> Answers come from a rule-based,
        retrieval-only port of the VERITRAIL Agent over public VERITRAIL content (no AI model).
        Nothing you type is sent to a server or stored; the conversation is cleared when you leave
        the page.
      </p>
      <p className="small">
        Answers cite VERITRAIL controls and label evidence status. This public demo is read-only: it
        cannot change risk tiers, approve exceptions or send anything on your behalf. Do not enter
        personal or confidential data.
      </p>
      <div
        className="chat-log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation"
        tabIndex={0}
      >
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="chat-msg chat-msg--user">
              <p className="chat-msg-author">You</p>
              <p>{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="chat-msg chat-msg--agent" data-intent={m.response.intent}>
              <p className="chat-msg-author">VERITRAIL</p>
              <AgentMessage response={m.response} />
            </div>
          ),
        )}
      </div>
      <form className="chat-form" onSubmit={submit} noValidate>
        <div className="field field--wide">
          <label htmlFor={inputId}>Your question</label>
          <p className="hint" id={hintId}>
            For example: “Which controls cover agent tool permissions?” Press Enter to send,
            Shift+Enter for a new line.
          </p>
          <textarea
            id={inputId}
            ref={inputRef}
            name="message"
            rows={3}
            maxLength={4000}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p className="field-error" id={errorId}>
              {error}
            </p>
          )}
        </div>
        <button className="btn btn-primary" type="submit">
          Send
        </button>
        {messages.length > 0 && (
          <button className="btn btn-secondary" type="button" onClick={reset}>
            Start over
          </button>
        )}
        <div className={`form-status${status ? " is-error" : ""}`} role="status" aria-live="polite">
          {status}
        </div>
      </form>
    </section>
  );
}
