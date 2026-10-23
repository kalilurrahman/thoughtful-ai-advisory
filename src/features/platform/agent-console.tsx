/**
 * VERITRAIL Agent console — the full, role-aware VERITRAIL Agent running entirely in this browser.
 *
 * Chat as a viewer / assessor / approver / admin, and use the side panels the way the
 * platform's approver UI and admin CLI are used: assessments, gap register, reports, pending
 * approvals (resolved by a *different* identity — separation of duties), evidence review and the
 * hash-chained audit log. Data stays in this browser's localStorage; synthetic demo use only.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { NO_SOURCE_MESSAGE } from "@/features/site/content";
import { ControlLinks, EvidenceBadge, SiteLink, normalizeHref } from "@/features/site/ui";
import { SafeMarkdown } from "@/features/site/tools/safe-markdown";
import { toCsv, toJson, downloadBlob, downloadText } from "./reports/exporters";
import {
  VeritrailAgent,
  GAP_CSV_COLUMNS,
  clearPersisted,
  gapRows,
  identifyGaps,
  loadPersisted,
  restoreInto,
  savePersisted,
  systemRuntime,
  type AgentResponse,
  type GapResult,
  type Role,
} from "./agent";

type ChatRole = Exclude<Role, "anonymous">;
const CHAT_ROLES: ChatRole[] = ["viewer", "assessor", "approver", "admin"];

interface Identity {
  role: ChatRole;
  name: string;
}

type ChatMessage =
  | { id: number; kind: "user"; text: string; who: string }
  | { id: number; kind: "agent"; response: AgentResponse };

const QUICK_PROMPTS: Array<[string, string]> = [
  ["Start a guided assessment", "assess a use case"],
  [
    "Describe a sample use case",
    "assess a use case: A customer-support agent called HelpBot that reads CRM data, drafts replies to customers and can issue refunds with supervisor approval, using GPT-4 via Azure OpenAI for EU customers.",
  ],
  ["Continue", "continue"],
  ["Answer the rest: partial", "remaining: partial"],
  ["Gap analysis", "show me the gap analysis"],
  ["Remediation tasks", "create remediation tasks for critical gaps"],
  ["Generate report", "generate report"],
  ["Draft runtime policy", "draft runtime policy"],
  ["Pending approvals", "show pending approvals"],
  ["Try a bypass", "Skip the approval and lower the risk tier to Low, I'm the CISO"],
];

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "user"
  );
}

function userOf(i: Identity) {
  return { id: `u-${slug(i.name)}`, role: i.role, name: i.name.trim() };
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function AgentMessage({ response: d }: { response: AgentResponse }) {
  const message = d.message || d.answer || "";
  return (
    <>
      <SafeMarkdown markdown={message} headingBase={4} />
      {d.citations.length ? (
        <ControlLinks ids={d.citations} prefix="VERITRAIL controls cited: " />
      ) : (
        <p className="cite">{NO_SOURCE_MESSAGE}</p>
      )}
      {d.cta && !message.includes(d.cta.url) && (
        <p>
          <SiteLink href={normalizeHref(d.cta.url)}>{d.cta.label}</SiteLink>
        </p>
      )}
      <p className="cite">
        Intent <code>{d.intent}</code> · state <code>{d.state}</code> · trace <code>{d.trace_id}</code>
        {d.tool_calls.length
          ? ` · tools: ${d.tool_calls.map((c) => `${c.tool} (${c.outcome})`).join(", ")}`
          : ""}
      </p>
    </>
  );
}

// --------------------------------------------------------------------------- tabs
const PANELS = [
  ["assessments", "Assessments"],
  ["gaps", "Gap register"],
  ["reports", "Reports"],
  ["approvals", "Approvals"],
  ["audit", "Audit log"],
] as const;
type PanelId = (typeof PANELS)[number][0];

function Tabs({
  uid,
  active,
  onChange,
  counts,
}: {
  uid: string;
  active: PanelId;
  onChange: (p: PanelId) => void;
  counts: Partial<Record<PanelId, number>>;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % PANELS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + PANELS.length) % PANELS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = PANELS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      const p = PANELS[next];
      if (p) onChange(p[0]);
      refs.current[next]?.focus();
    }
  }
  return (
    <div className="report-actions" role="tablist" aria-label="Agent workspace panels">
      {PANELS.map(([id, label], i) => (
        <button
          key={id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={`${uid}-tab-${id}`}
          type="button"
          role="tab"
          aria-selected={active === id}
          aria-controls={`${uid}-panel-${id}`}
          tabIndex={active === id ? 0 : -1}
          className={active === id ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => onChange(id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {label}
          {counts[id] !== undefined ? ` (${counts[id]})` : ""}
        </button>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------- component
/**
 * The VERITRAIL Agent console: chat with the full agent under any role, then resolve approvals,
 * review evidence, download gap registers and reports, and verify the audit chain.
 */
export function AgentConsole() {
  const uid = useId();
  const [agent, setAgent] = useState(() => new VeritrailAgent({ runtime: systemRuntime() }));
  const [version, setVersion] = useState(0);
  const [chatId, setChatId] = useState<Identity>({ role: "assessor", name: "Asha Rao (demo assessor)" });
  const [approverId, setApproverId] = useState<Identity>({ role: "approver", name: "Dana Lee (demo approver)" });
  const sessions = useRef<Record<string, string>>({});
  const nextMsg = useRef(1);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState("");
  const [status, setStatus] = useState<{ text: string; kind: "info" | "error" | "success" }>({
    text: "",
    kind: "info",
  });
  const [storageNote, setStorageNote] = useState("");
  const [panel, setPanel] = useState<PanelId>("assessments");
  const [selectedAsm, setSelectedAsm] = useState("");
  const [resolveAs, setResolveAs] = useState<"approver" | "chat">("approver");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [chainStatus, setChainStatus] = useState("");

  const chatUser = userOf(chatId);
  const approverUser = userOf(approverId);
  const actingApprover = resolveAs === "approver" ? approverUser : chatUser;

  // ---- persistence (effects / handlers only)
  useEffect(() => {
    const saved = loadPersisted();
    if (saved) {
      const restored = new VeritrailAgent({ runtime: systemRuntime() });
      try {
        restoreInto(restored, saved.snapshot);
        setAgent(restored);
        if (saved.ui?.sessionId && saved.ui.userId) sessions.current[saved.ui.userId] = saved.ui.sessionId;
        setStorageNote("Restored demo data saved earlier in this browser.");
      } catch {
        clearPersisted();
      }
    }
  }, []);

  const persist = useCallback(
    (a: VeritrailAgent) => {
      const userId = chatUser.id;
      const sid = sessions.current[userId];
      const ok = savePersisted(a, sid ? { sessionId: sid, userId } : undefined);
      setStorageNote(
        ok
          ? "Saved in this browser's storage."
          : "Browser storage is unavailable: data is kept for this page view only.",
      );
    },
    [chatUser.id],
  );

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  // ---- chat
  function send(q: string) {
    const msg = q.trim();
    if (!msg) {
      setInputError("Type a message first.");
      inputRef.current?.focus();
      return;
    }
    if (!chatUser.name) {
      setInputError("Enter a name for the chat identity.");
      return;
    }
    setInputError("");
    const userMsg: ChatMessage = { id: nextMsg.current++, kind: "user", text: msg, who: `${chatUser.name} (${chatUser.role})` };
    try {
      const res = agent.handle(msg, sessions.current[chatUser.id] ?? null, chatUser);
      sessions.current[chatUser.id] = res.session_id;
      setMessages((m) => [...m, userMsg, { id: nextMsg.current++, kind: "agent", response: res }]);
      if (res.pending_approvals.length) {
        setStatus({
          text: `${res.pending_approvals.length} approval request(s) raised — resolve them in the Approvals panel as a different identity.`,
          kind: "info",
        });
      }
      persist(agent);
      bump();
    } catch (e) {
      setMessages((m) => [...m, userMsg]);
      setStatus({ text: `Your message could not be processed: ${errorMessage(e)}`, kind: "error" });
    }
    setText("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(text);
    }
  }

  // ---- data views (recomputed on every change)
  const view = useMemo(() => {
    void version;
    const st = agent.store;
    const assessments = st.list("assessments");
    const systems = new Map(st.list("systems").map((s) => [s.id, s]));
    const evidence = st.list("evidence");
    const lookup = (ref: string) =>
      evidence.find((e) => e.ref.toUpperCase() === String(ref).toUpperCase() || e.id === ref) ?? null;
    const asmId = selectedAsm || assessments.at(-1)?.id || "";
    const asm = assessments.find((a) => a.id === asmId) ?? null;
    let gaps: GapResult | null = null;
    if (asm) gaps = identifyGaps(asm, lookup, agent.runtime.today());
    return {
      assessments,
      systems,
      evidence,
      asmId,
      gaps,
      reports: st.list("reports"),
      approvals: st.list("approvals"),
      tasks: st.list("tasks"),
      audit: [...agent.audit.records],
    };
  }, [agent, version, selectedAsm]);

  const pending = view.approvals.filter((a) => a.status === "pending");
  const pendingEvidence = view.evidence.filter((e) => !e.reviewed_by);

  // ---- approvals and evidence review (outside the chat)
  function resolve(approvalId: string, decision: "approve" | "reject") {
    if (!actingApprover.name) {
      setStatus({ text: "Enter a name for the approving identity.", kind: "error" });
      return;
    }
    try {
      const rec = agent.resolveApproval(approvalId, decision, actingApprover, notes[approvalId] ?? "");
      const effect = rec.execution_result ? ` Effect: ${String(rec.execution_result["status"] ?? "")}.` : "";
      setStatus({ text: `${approvalId} ${rec.status} by ${actingApprover.name}.${effect}`, kind: "success" });
    } catch (e) {
      // Separation of duties, role and state refusals come straight from the approvals service.
      setStatus({ text: `Refused: ${errorMessage(e)}`, kind: "error" });
    }
    persist(agent);
    bump();
  }

  function review(ref: string, accepted: boolean) {
    try {
      agent.reviewEvidence(ref, actingApprover, accepted, "Reviewed in the agent console (demo)");
      setStatus({ text: `Evidence ${ref} ${accepted ? "accepted (Verified)" : "rejected"} by ${actingApprover.name}.`, kind: "success" });
    } catch (e) {
      setStatus({ text: `Refused: ${errorMessage(e)}`, kind: "error" });
    }
    persist(agent);
    bump();
  }

  // ---- reports and downloads
  function generateReport() {
    if (!view.asmId) return;
    try {
      const res = agent.callTool("generate_report", chatUser, { assessment_id: view.asmId });
      setStatus({ text: `Draft report ${res.report_id} generated (${res.summary.gaps} gaps).`, kind: "success" });
      setPanel("reports");
    } catch (e) {
      setStatus({ text: `Refused: ${errorMessage(e)}`, kind: "error" });
    }
    persist(agent);
    bump();
  }

  async function downloadReport(reportId: string, fmt: "md" | "pdf" | "csv" | "json") {
    const rep = agent.store.get("reports", reportId);
    const art = rep?.artifacts;
    if (!rep || !art) {
      setStatus({ text: "This report's files are not available in this browser.", kind: "error" });
      return;
    }
    const base = `veritrail_use_case_report_${reportId}`;
    try {
      if (fmt === "md") downloadText(art.md, `${base}.md`, "text/markdown");
      else if (fmt === "csv") downloadText(art.csv, `${base}_gap_register.csv`, "text/csv");
      else if (fmt === "json") downloadText(art.json, `${base}.json`, "application/json");
      else {
        const { markdownToPdfBlob } = await import("./reports/pdf");
        downloadBlob(markdownToPdfBlob(art.md, { title: art.pdf_title }), `${base}.pdf`);
      }
    } catch (e) {
      setStatus({ text: `Download failed: ${errorMessage(e)}`, kind: "error" });
    }
  }

  function downloadGaps(fmt: "csv" | "json") {
    if (!view.gaps) return;
    const base = `veritrail_gap_register_${view.asmId}`;
    if (fmt === "csv") downloadText(toCsv(gapRows(view.gaps), GAP_CSV_COLUMNS), `${base}.csv`, "text/csv");
    else downloadText(toJson(view.gaps), `${base}.json`, "application/json");
  }

  function verifyChainNow() {
    const res = agent.audit.verify();
    setChainStatus(
      res.ok
        ? `Chain verified: ${agent.audit.records.length} records, every hash links to the previous record.`
        : `Verification failed: ${res.message}`,
    );
  }

  function resetDemo() {
    clearPersisted();
    sessions.current = {};
    setAgent(new VeritrailAgent({ runtime: systemRuntime() }));
    setMessages([]);
    setSelectedAsm("");
    setNotes({});
    setChainStatus("");
    setStatus({ text: "Demo data cleared from this browser.", kind: "info" });
    setStorageNote("");
    bump();
  }

  const statusClass =
    status.kind === "error" ? " is-error" : status.kind === "success" ? " is-success" : "";

  return (
    <section className="tool agent-console" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`}>VERITRAIL Agent console</h2>
      <p className="notice notice--warning">
        <strong>Runs entirely in this browser — synthetic demo use only.</strong> This is the
        deterministic VERITRAIL Agent (no AI model, no server). Records, approvals and the audit log
        stay in this browser&apos;s storage and are never sent anywhere. Do not enter customer,
        personal or confidential data; use fictional examples.
      </p>

      <fieldset className="tool-form">
        <legend>Identities</legend>
        <p className="hint">
          The chat identity talks to the agent. Approvals and evidence reviews are resolved outside
          the chat by an approving identity — it must be a different person from the requester
          (separation of duties).
        </p>
        <div className="layout-split">
          <div className="field">
            <label htmlFor={`${uid}-chat-role`}>Chat role</label>
            <select
              id={`${uid}-chat-role`}
              value={chatId.role}
              onChange={(e) => setChatId({ ...chatId, role: e.target.value as ChatRole })}
            >
              {CHAT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label htmlFor={`${uid}-chat-name`}>Chat identity name</label>
            <input
              id={`${uid}-chat-name`}
              type="text"
              value={chatId.name}
              maxLength={80}
              onChange={(e) => setChatId({ ...chatId, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-apr-role`}>Approving identity role</label>
            <select
              id={`${uid}-apr-role`}
              value={approverId.role}
              onChange={(e) => setApproverId({ ...approverId, role: e.target.value as ChatRole })}
            >
              {CHAT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label htmlFor={`${uid}-apr-name`}>Approving identity name</label>
            <input
              id={`${uid}-apr-name`}
              type="text"
              value={approverId.name}
              maxLength={80}
              onChange={(e) => setApproverId({ ...approverId, name: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      <h3>Chat with the agent</h3>
      <div
        className="chat-log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation with the VERITRAIL Agent"
        tabIndex={0}
      >
        {messages.length === 0 && (
          <p className="small">
            Ask a governance question, or start a guided assessment as an assessor. Try the quick
            prompts below.
          </p>
        )}
        {messages.map((m) =>
          m.kind === "user" ? (
            <div key={m.id} className="chat-msg chat-msg--user">
              <p className="chat-msg-author">{m.who}</p>
              <p>{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="chat-msg chat-msg--agent" data-intent={m.response.intent}>
              <p className="chat-msg-author">VERITRAIL Agent</p>
              <AgentMessage response={m.response} />
            </div>
          ),
        )}
      </div>
      <form className="chat-form" onSubmit={onSubmit} noValidate>
        <div className="field field--wide">
          <label htmlFor={`${uid}-input`}>Message as {chatUser.name || "…"} ({chatUser.role})</label>
          <p className="hint" id={`${uid}-hint`}>
            Press Enter to send, Shift+Enter for a new line.
          </p>
          <textarea
            id={`${uid}-input`}
            ref={inputRef}
            rows={3}
            maxLength={4000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            aria-describedby={inputError ? `${uid}-hint ${uid}-err` : `${uid}-hint`}
            aria-invalid={inputError ? true : undefined}
          />
          {inputError && (
            <p className="field-error" id={`${uid}-err`}>
              {inputError}
            </p>
          )}
        </div>
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
      <div className="report-actions" aria-label="Quick prompts" role="group">
        {QUICK_PROMPTS.map(([label, prompt]) => (
          <button key={label} type="button" className="btn btn-secondary" onClick={() => send(prompt)}>
            {label}
          </button>
        ))}
      </div>

      <div className={`form-status${statusClass}`} role="status" aria-live="polite">
        {status.text}
      </div>

      <h3>Workspace</h3>
      <Tabs
        uid={uid}
        active={panel}
        onChange={setPanel}
        counts={{
          assessments: view.assessments.length,
          reports: view.reports.length,
          approvals: pending.length,
          audit: view.audit.length,
        }}
      />

      {panel === "assessments" && (
        <div role="tabpanel" id={`${uid}-panel-assessments`} aria-labelledby={`${uid}-tab-assessments`}>
          {view.assessments.length === 0 ? (
            <p>No assessments yet. As an assessor, say “assess a use case” and then “continue”.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Assessments in this browser</caption>
                <thead>
                  <tr>
                    <th scope="col">Assessment</th>
                    <th scope="col">AI system</th>
                    <th scope="col">Tier</th>
                    <th scope="col">Answered</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {view.assessments.map((a) => {
                    const sys = a.system_id ? view.systems.get(a.system_id) : undefined;
                    return (
                      <tr key={a.id}>
                        <th scope="row">{a.id}</th>
                        <td>{sys?.name ?? String(a.profile["name"] ?? "—")}</td>
                        <td>
                          {sys?.risk_tier ? `${sys.risk_tier} (confirmed)` : `${a.risk.tier} (preliminary)`}
                        </td>
                        <td>
                          {Object.keys(a.responses).length} / {a.questions.length}
                        </td>
                        <td>{a.status}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setSelectedAsm(a.id);
                              setPanel("gaps");
                            }}
                          >
                            Gap register
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="small">
            Remediation tasks created: {view.tasks.length}. AI system records: {view.systems.size}.
          </p>
        </div>
      )}

      {panel === "gaps" && (
        <div role="tabpanel" id={`${uid}-panel-gaps`} aria-labelledby={`${uid}-tab-gaps`}>
          {!view.gaps ? (
            <p>No assessment selected yet.</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor={`${uid}-asm`}>Assessment</label>
                <select id={`${uid}-asm`} value={view.asmId} onChange={(e) => setSelectedAsm(e.target.value)}>
                  {view.assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {String(a.profile["name"] ?? "")}
                    </option>
                  ))}
                </select>
              </div>
              <p>
                {view.gaps.summary.gaps} gaps (tier {view.gaps.tier}):{" "}
                {Object.entries(view.gaps.summary.by_severity)
                  .map(([k, n]) => `${n} ${k}`)
                  .join(", ")}
                . Due dates apply the severity SLAs from {view.gaps.as_of}.
              </p>
              <div className="report-actions">
                <button type="button" className="btn btn-secondary" onClick={() => downloadGaps("csv")}>
                  Download gap register (CSV)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => downloadGaps("json")}>
                  Download gap analysis (JSON)
                </button>
                <button type="button" className="btn btn-secondary" onClick={generateReport}>
                  Generate report as {chatUser.name || "chat identity"}
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <caption className="visually-hidden">Gap register</caption>
                  <thead>
                    <tr>
                      <th scope="col">Gap</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Evidence status</th>
                      <th scope="col">Question</th>
                      <th scope="col">Controls</th>
                      <th scope="col">Owner role</th>
                      <th scope="col">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.gaps.gaps.map((g) => (
                      <tr key={g.gap_id}>
                        <th scope="row">{g.gap_id}</th>
                        <td>{g.severity}</td>
                        <td>
                          <EvidenceBadge status={g.evidence_status} />
                        </td>
                        <td>
                          {g.question_id}: {g.recommended_action}
                        </td>
                        <td>{g.controls.join(", ")}</td>
                        <td>{g.owner_role}</td>
                        <td>{g.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {panel === "reports" && (
        <div role="tabpanel" id={`${uid}-panel-reports`} aria-labelledby={`${uid}-tab-reports`}>
          {view.reports.length === 0 ? (
            <p>No reports yet. Say “generate report” after an assessment, or use the Gap register panel.</p>
          ) : (
            <ul className="download-list">
              {view.reports.map((r) => (
                <li key={r.id}>
                  <strong>{r.id}</strong> — draft readiness report for {r.assessment_id}
                  {r.synthetic ? " (synthetic)" : ""}
                  <div className="report-actions">
                    {(["md", "pdf", "csv", "json"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void downloadReport(r.id, fmt)}
                      >
                        {fmt === "csv" ? "Gap register CSV" : fmt.toUpperCase()}
                        <span className="visually-hidden"> for {r.id}</span>
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="small">
            Reports state readiness and evidence status only. Sharing a report externally requires a
            human approval.
          </p>
        </div>
      )}

      {panel === "approvals" && (
        <div role="tabpanel" id={`${uid}-panel-approvals`} aria-labelledby={`${uid}-tab-approvals`}>
          <fieldset className="fieldset-inline">
            <legend>Resolve as</legend>
            <label className="choice">
              <input
                type="radio"
                name={`${uid}-resolve-as`}
                checked={resolveAs === "approver"}
                onChange={() => setResolveAs("approver")}
              />
              Approving identity: {approverUser.name || "—"} ({approverUser.role})
            </label>
            <label className="choice">
              <input
                type="radio"
                name={`${uid}-resolve-as`}
                checked={resolveAs === "chat"}
                onChange={() => setResolveAs("chat")}
              />
              Chat identity: {chatUser.name || "—"} ({chatUser.role}) — demonstrates self-approval refusal
            </label>
          </fieldset>
          {view.approvals.length === 0 ? (
            <p>No approval requests yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Approval requests</caption>
                <thead>
                  <tr>
                    <th scope="col">Approval</th>
                    <th scope="col">Action</th>
                    <th scope="col">Resource</th>
                    <th scope="col">Requested by</th>
                    <th scope="col">Status</th>
                    <th scope="col">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {[...view.approvals].reverse().map((a) => (
                    <tr key={a.id}>
                      <th scope="row">{a.approval_id}</th>
                      <td>
                        {a.action_label}
                        <br />
                        <span className="small">{a.reason}</span>
                      </td>
                      <td>{a.resource ?? "—"}</td>
                      <td>{a.requested_by_name}</td>
                      <td>
                        {a.status}
                        {a.resolved_by_name ? ` by ${a.resolved_by_name}` : ""}
                      </td>
                      <td>
                        {a.status === "pending" ? (
                          <div className="field">
                            <label htmlFor={`${uid}-note-${a.id}`}>Note</label>
                            <input
                              id={`${uid}-note-${a.id}`}
                              type="text"
                              maxLength={200}
                              value={notes[a.id] ?? ""}
                              onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                            />
                            <div className="report-actions">
                              <button type="button" className="btn btn-primary" onClick={() => resolve(a.approval_id, "approve")}>
                                Approve<span className="visually-hidden"> {a.approval_id}</span>
                              </button>
                              <button type="button" className="btn btn-secondary" onClick={() => resolve(a.approval_id, "reject")}>
                                Reject<span className="visually-hidden"> {a.approval_id}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h4>Evidence awaiting named review</h4>
          {pendingEvidence.length === 0 ? (
            <p>No evidence references awaiting review.</p>
          ) : (
            <ul className="download-list">
              {pendingEvidence.map((e) => (
                <li key={e.id}>
                  <strong>{e.ref}</strong> — {e.question_id} in {e.assessment_id}, submitted by {e.submitted_by}{" "}
                  <EvidenceBadge status="User-asserted" />
                  <div className="report-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => review(e.ref, true)}>
                      Accept (Verified)<span className="visually-hidden"> {e.ref}</span>
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => review(e.ref, false)}>
                      Reject<span className="visually-hidden"> {e.ref}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {panel === "audit" && (
        <div role="tabpanel" id={`${uid}-panel-audit`} aria-labelledby={`${uid}-tab-audit`}>
          <div className="report-actions">
            <button type="button" className="btn btn-secondary" onClick={verifyChainNow}>
              Verify chain
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => downloadText(agent.audit.toJsonl(), "veritrail_agent_audit.jsonl", "application/jsonl")}
            >
              Download audit log (JSONL)
            </button>
          </div>
          <p role="status" aria-live="polite">
            {chainStatus}
          </p>
          {view.audit.length === 0 ? (
            <p>No audit records yet. Every agent turn, tool call and approval decision is recorded.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Most recent audit records (newest first)</caption>
                <thead>
                  <tr>
                    <th scope="col">Time (UTC)</th>
                    <th scope="col">Action</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Outcome</th>
                    <th scope="col">Resource</th>
                    <th scope="col">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {view.audit
                    .slice(-100)
                    .reverse()
                    .map((r) => (
                      <tr key={r.id}>
                        <td>{r.ts.slice(0, 19)}</td>
                        <th scope="row">{r.action}</th>
                        <td>{r.actor}</td>
                        <td>{r.outcome}</td>
                        <td>{r.resource ?? "—"}</td>
                        <td>
                          <code>{r.hash.slice(0, 12)}…</code>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="report-actions">
        <button type="button" className="btn btn-secondary" onClick={resetDemo}>
          Reset demo data
        </button>
      </div>
      <p className="small" role="status" aria-live="polite">
        {storageNote}
      </p>
      <p className="small">
        Deterministic browser port of the VERITRAIL Agent: optional LLM phrasing is not included. The
        agent reports governance readiness and evidence status; it never determines or certifies
        compliance.
      </p>
    </section>
  );
}
