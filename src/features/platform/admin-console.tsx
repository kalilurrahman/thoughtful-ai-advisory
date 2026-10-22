/*
 * AEGIS admin console — browser UI for the port of platform/app/admin/aegis_admin/cli.py.
 *
 *  - Leads: assessment leads with lead tags (filter by tag) and the CLI's CSV export.
 *  - Forms: other website form submissions.
 *  - Funnel: the CLI's funnel (step counts + conversion from previous step) and CTA clicks.
 *  - Audit verify: upload JSONL audit logs (Python platform or browser tools) and verify the
 *    hash chain locally with verifyChain — nothing is uploaded to a server.
 * Approvals are resolved in the Agent console (/platform/agent).
 *
 * Access: sign-in required; the server functions additionally require the caller's user id in
 * public.site_admins and only then read leads/events with the service role.
 */
import { useCallback, useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLink } from "@/features/site/ui";
import { AuditLog, verifyChain } from "./audit";
import { funnelText, type FunnelReport } from "./analytics-core";
import {
  allTags,
  auditVerifyLine,
  grantAdminSql,
  type FormView,
  type LeadView,
} from "./admin-core";
import {
  exportLeadsCsv,
  funnelAnalytics,
  isSiteAdmin,
  listForms,
  listLeads,
} from "./admin.functions";
import { downloadText } from "./reports/exporters";
import { pyFloatStr } from "@/features/site/engines/shield/py";

type Access =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "not-admin"; userId: string }
  | { kind: "admin"; userId: string }
  | { kind: "error"; message: string; userId: string | null };

const TABS = [
  { id: "leads", label: "Leads" },
  { id: "forms", label: "Forms" },
  { id: "funnel", label: "Funnel" },
  { id: "audit", label: "Audit verify" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const errText = (e: unknown) => (e instanceof Error ? e.message : "The request failed.");

function useAccess(): Access {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [access, setAccess] = useState<Access>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => alive && setUserId(data.session?.user.id ?? null))
      .catch(() => alive && setUserId(null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setUserId(session?.user.id ?? null);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (userId === null) {
      setAccess({ kind: "signed-out" });
      return;
    }
    let alive = true;
    setAccess({ kind: "loading" });
    isSiteAdmin()
      .then((r) => {
        if (alive) setAccess({ kind: r.isAdmin ? "admin" : "not-admin", userId: r.userId });
      })
      .catch((e: unknown) => {
        if (alive) setAccess({ kind: "error", message: errText(e), userId });
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  return access;
}

// ----------------------------------------------------------------- tabs

function LeadsTab() {
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [leads, setLeads] = useState<LeadView[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setStatus("Loading leads…");
    listLeads({ data: tag ? { tag } : {} })
      .then((r) => {
        if (!alive) return;
        setLeads(r.leads);
        setTruncated(r.truncated);
        if (!tag) setTags(allTags(r.leads));
        setStatus(`${r.leads.length} lead(s)`);
        setError("");
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(errText(e));
        setStatus("");
      });
    return () => {
      alive = false;
    };
  }, [tag]);

  const exportCsv = async () => {
    setStatus("Preparing CSV…");
    try {
      const r = await exportLeadsCsv();
      downloadText(r.csv, "aegis_leads.csv", "text/csv");
      setStatus(
        `Exported ${r.count} lead(s) (contains personal data — handle per the privacy notice).`,
      );
    } catch (e) {
      setError(errText(e));
      setStatus("");
    }
  };

  return (
    <>
      <div className="tool-form">
        <div className="field">
          <label htmlFor="admin-tag">Filter by lead tag</label>
          <select id="admin-tag" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p>
        <button type="button" className="btn btn-primary" onClick={() => void exportCsv()}>
          Download CSV (all leads)
        </button>
      </p>
      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>
      {error && <p className="notice notice--error">{error}</p>}
      {truncated && (
        <p className="notice notice--warning">Showing the newest 5,000 leads only.</p>
      )}
      {leads && leads.length === 0 && <p>No leads recorded yet.</p>}
      {leads && leads.length > 0 && (
        <div className="table-wrap" role="region" tabIndex={0} aria-label="Leads">
          <table>
            <thead>
              <tr>
                {["Created", "Company", "Name", "Email", "Score", "Level", "Tags", "Flags"].map(
                  (h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.lead_id}>
                  <th scope="row">{l.created_at.slice(0, 19).replace("T", " ")}</th>
                  <td>{l.company}</td>
                  <td>{l.name}</td>
                  <td>{l.email}</td>
                  <td>{l.overall_score === null ? "—" : pyFloatStr(l.overall_score)}</td>
                  <td>{l.maturity_level || "—"}</td>
                  <td>{l.lead_tags.join(", ") || "—"}</td>
                  <td>{l.critical_flags.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FormsTab() {
  const [forms, setForms] = useState<FormView[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    listForms()
      .then((r) => alive && setForms(r.forms))
      .catch((e: unknown) => alive && setError(errText(e)));
    return () => {
      alive = false;
    };
  }, []);
  if (error) return <p className="notice notice--error">{error}</p>;
  if (!forms) return <p role="status">Loading submissions…</p>;
  if (!forms.length) return <p>No form submissions recorded yet.</p>;
  return (
    <>
      <p role="status">{forms.length} submission(s)</p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Form submissions">
        <table>
          <thead>
            <tr>
              {["Created", "Form", "Company", "Name", "Email", "Message"].map((h) => (
                <th scope="col" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id}>
                <th scope="row">{f.created_at.slice(0, 19).replace("T", " ")}</th>
                <td>{f.form}</td>
                <td>{f.company}</td>
                <td>{f.name}</td>
                <td>{f.email}</td>
                <td>{f.message.length > 140 ? `${f.message.slice(0, 140)}…` : f.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FunnelTab() {
  const [f, setF] = useState<FunnelReport | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    funnelAnalytics()
      .then(setF)
      .catch((e: unknown) => setError(errText(e)));
  }, []);
  useEffect(load, [load]);
  if (error) return <p className="notice notice--error">{error}</p>;
  if (!f) return <p role="status">Loading analytics…</p>;
  const ctas = Object.entries(f.cta_clicks);
  return (
    <>
      <p>
        Total events: <strong>{f.events}</strong>{" "}
        <button type="button" className="btn btn-secondary" onClick={load}>
          Refresh
        </button>
      </p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Assessment funnel">
        <table>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Events</th>
              <th scope="col">Conversion from previous step</th>
            </tr>
          </thead>
          <tbody>
            {f.funnel.map((s) => (
              <tr key={s.step}>
                <th scope="row">
                  <code>{s.step}</code>
                </th>
                <td>{s.count}</td>
                <td>
                  {s.conversion_from_previous === null
                    ? "—"
                    : `${pyFloatStr(s.conversion_from_previous)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ctas.length > 0 && (
        <p>
          CTA clicks: {ctas.map(([k, v]) => `${k}=${v}`).join(", ")}
        </p>
      )}
      <p className="small">
        Cookieless counts (no identifiers), so steps are event counts, not unique visitors; visitors
        with Do Not Track or Global Privacy Control enabled are not counted.
      </p>
      <details>
        <summary>CLI output</summary>
        <pre className="code-block" tabIndex={0}>
          <code>{funnelText(f)}</code>
        </pre>
      </details>
    </>
  );
}

interface VerifyRow {
  file: string;
  records: number;
  ok: boolean;
  message: string;
}

/** File.text() with a FileReader fallback for older browsers. */
function readText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsText(file);
  });
}

function AuditTab() {
  const [rows, setRows] = useState<VerifyRow[]>([]);
  const [busy, setBusy] = useState(false);

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    const out: VerifyRow[] = [];
    for (const file of files) {
      try {
        const text = await readText(file);
        const log = AuditLog.fromJsonl(text);
        const r = verifyChain(log.records as unknown as Array<Record<string, unknown>>);
        out.push({ file: file.name, records: log.records.length, ok: r.ok, message: r.message });
      } catch (err) {
        out.push({
          file: file.name,
          records: 0,
          ok: false,
          message: `not a JSONL audit log (${err instanceof Error ? err.message : "parse error"})`,
        });
      }
    }
    out.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
    setRows(out);
    setBusy(false);
  };

  return (
    <>
      <p>
        Upload one or more <code>*audit*.jsonl</code> files — from the Python platform (
        <code>var/**/</code>) or exported by the browser tools — to verify their hash chains in this
        browser. Files are not uploaded anywhere. A passing chain is tamper <em>evidence</em>, not
        tamper proof.
      </p>
      <div className="field">
        <label htmlFor="audit-files">Audit log files (JSONL)</label>
        <input
          id="audit-files"
          type="file"
          accept=".jsonl,.json,.txt,application/json,text/plain"
          multiple
          onChange={(e) => void onFiles(e)}
        />
      </div>
      <p className="form-status" role="status" aria-live="polite">
        {busy ? "Verifying…" : rows.length ? `${rows.length} file(s) verified.` : ""}
      </p>
      {rows.length > 0 && (
        <>
          <div
            className={`notice ${rows.every((r) => r.ok) ? "notice--success" : "notice--error"}`}
          >
            {rows.every((r) => r.ok)
              ? "All audit chains verified."
              : `${rows.filter((r) => !r.ok).length} file(s) failed verification.`}
          </div>
          <pre className="code-block" tabIndex={0}>
            <code>
              {rows.map((r) => auditVerifyLine(r.file, r.records, r.ok, r.message)).join("\n")}
            </code>
          </pre>
        </>
      )}
    </>
  );
}

// ----------------------------------------------------------------- console

export function AdminConsole() {
  const access = useAccess();
  const [tab, setTab] = useState<TabId>("leads");

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!n) return;
    e.preventDefault();
    const next = TABS[(i + n + TABS.length) % TABS.length];
    if (next) {
      setTab(next.id);
      document.getElementById(`admin-tab-${next.id}`)?.focus();
    }
  };

  return (
    <section className="tool" aria-labelledby="admin-title">
      <h2 id="admin-title">Admin console</h2>
      {access.kind === "loading" && <p role="status">Checking your access…</p>}
      {access.kind === "signed-out" && (
        <div className="notice notice--warning">
          <p>The admin console is for site administrators. Sign in to continue.</p>
          <p>
            <SiteLink href="/auth" className="btn btn-primary">
              Sign in
            </SiteLink>
          </p>
        </div>
      )}
      {access.kind === "error" && (
        <div className="notice notice--error">
          <p>We could not check your access: {access.message}</p>
          {access.userId && (
            <p className="small">If this persists, ask an administrator to confirm your access.</p>
          )}
        </div>
      )}
      {access.kind === "not-admin" && (
        <div className="notice notice--warning">
          <p>
            You are signed in, but your account is not a site administrator. Admin access is
            granted by an existing operator, who runs this statement in the Lovable Cloud SQL
            editor (it adds your user id to <code>public.site_admins</code>):
          </p>
          <pre className="code-block" tabIndex={0}>
            <code>{grantAdminSql(access.userId)}</code>
          </pre>
          <p className="small">
            Your user id: <code>{access.userId}</code>. Reload this page after access is granted.
          </p>
        </div>
      )}
      {access.kind === "admin" && (
        <>
          <p className="small">
            Approvals (separation of duties, audit-logged) are handled in the{" "}
            <SiteLink href="/platform/agent">Agent console</SiteLink>. Lead data is personal data:
            handle exports per the privacy notice.
          </p>
          <div role="tablist" aria-label="Admin sections" className="step-nav">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                id={`admin-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`admin-panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                className={`btn ${tab === t.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {TABS.map((t) => (
            <div
              key={t.id}
              id={`admin-panel-${t.id}`}
              role="tabpanel"
              aria-labelledby={`admin-tab-${t.id}`}
              hidden={tab !== t.id}
            >
              {tab === t.id && t.id === "leads" && <LeadsTab />}
              {tab === t.id && t.id === "forms" && <FormsTab />}
              {tab === t.id && t.id === "funnel" && <FunnelTab />}
              {tab === t.id && t.id === "audit" && <AuditTab />}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
