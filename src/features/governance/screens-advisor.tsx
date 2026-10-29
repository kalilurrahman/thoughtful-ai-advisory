import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Sparkle,
  Scroll,
  Warning,
  ShieldCheck,
  Compass,
  ListPlus,
  CheckCircle,
  ArrowRight,
  CircleNotch,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/advisor-hero.jpg";
import { recommendGovernance, type AdvisorResult, type AdvisorAction } from "./advisor.functions";
import { correctiveActionSchema } from "./actions-schema";
import { useGovernance } from "./store";

const FOCI = [
  { id: "Policy", icon: Scroll, hint: "A policy gap, unclear rule or missing standard" },
  { id: "Risk", icon: Warning, hint: "A harm, exposure or emerging threat" },
  { id: "Control", icon: ShieldCheck, hint: "A control that is weak, missing or untested" },
] as const;

const EXAMPLES = [
  "Teams are pasting customer data into public chatbots and we have no approved-use policy.",
  "Our credit-scoring model has not been re-validated since a major data drift last quarter.",
  "A vendor LLM feature went live without a change review or human oversight sign-off.",
];

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const due = { Critical: 7, High: 14, Moderate: 30, Low: 60 } as const;

export function AdvisorScreen() {
  const { dispatch, userId } = useGovernance();
  const recommend = useServerFn(recommendGovernance);
  const [focus, setFocus] = useState<(typeof FOCI)[number]["id"]>("Risk");
  const [concern, setConcern] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [added, setAdded] = useState<string[]>([]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      setResult({ ok: false, error: "Sign in to use the AI advisor." });
      return;
    }
    if (concern.trim().length < 20) {
      setResult({ ok: false, error: "Describe the concern in at least 20 characters." });
      return;
    }
    setBusy(true);
    setAdded([]);
    try {
      setResult(await recommend({ data: { concern, focus } }));
    } catch {
      setResult({ ok: false, error: "The advisor could not respond. Try again shortly." });
    } finally {
      setBusy(false);
    }
  }

  function addAction(a: AdvisorAction) {
    const stamp = new Date().toISOString();
    const parsed = correctiveActionSchema.safeParse({
      id: crypto.randomUUID(),
      title: a.title.slice(0, 160),
      description: a.description.slice(0, 4000),
      system: "Portfolio-wide",
      source: "Assessment finding",
      sourceReference: `AI advisor · ${a.controlId}`,
      priority: a.priority,
      owner: a.owner.slice(0, 120) || "Governance lead",
      dueDate: inDays(due[a.priority]),
      status: "Open",
      createdAt: stamp,
      updatedAt: stamp,
      completionEvidence: "",
      verificationNote: "",
      verifiedBy: "",
      verifiedAt: null,
      history: [{ status: "Open", changedAt: stamp, actor: "AI advisor", note: "Suggested by AI advisor" }],
    });
    if (!parsed.success) return;
    dispatch({ type: "corrective-action", action: parsed.data });
    setAdded((prev) => [...prev, a.title]);
  }

  return (
    <div className="advisor">
      <section className="advisor-hero">
        <img src={heroImage} alt="" width={1536} height={640} />
        <div>
          <p className="kicker"><Sparkle weight="duotone" /> AI governance advisor</p>
          <h2>Turn a concern into mapped controls and owned actions</h2>
          <p>Describe a policy, risk or control issue. The advisor maps it to TILLER and NIST GOVERN areas and drafts corrective actions you can add to your tracker.</p>
        </div>
      </section>

      <form className="advisor-form" onSubmit={submit}>
        <div className="advisor-foci" role="radiogroup" aria-label="Concern type">
          {FOCI.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={focus === f.id}
              className={"advisor-focus " + (focus === f.id ? "active" : "")}
              onClick={() => setFocus(f.id)}
            >
              <f.icon weight="duotone" />
              <strong>{f.id}</strong>
              <small>{f.hint}</small>
            </button>
          ))}
        </div>
        <label htmlFor="advisor-concern" className="kicker">Describe the concern</label>
        <textarea
          id="advisor-concern"
          rows={5}
          maxLength={4000}
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          placeholder="What is happening, which systems or teams are involved, and what worries you?"
        />
        <div className="advisor-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setConcern(ex)}>{ex}</button>
          ))}
        </div>
        {!userId && (
          <p className="advisor-signin" role="note">
            The advisor uses an AI model, so it needs a free account.{" "}
            <Link to="/auth">Sign in or create an account</Link> to get recommendations.
          </p>
        )}
        <Button type="submit" disabled={busy || !userId} size="lg">
          {busy ? <CircleNotch className="spin" weight="bold" /> : <Compass weight="duotone" />}
          {busy ? "Analysing concern…" : "Get recommendations"}
        </Button>
      </form>

      {result && !result.ok && <p className="advisor-error" role="alert"><Warning weight="duotone" /> {result.error}</p>}

      {result?.ok && (
        <div className="advisor-results" aria-live="polite">
          <section className="advisor-summary">
            <p className="kicker">Advisor summary</p>
            <p>{result.summary}</p>
          </section>
          <h3><Compass weight="duotone" /> Relevant governance areas</h3>
          <div className="advisor-grid">
            {result.areas?.map((a) => (
              <article key={a.controlId} className={"advisor-area rel-" + a.relevance.toLowerCase()}>
                <header>
                  <span className="advisor-code">{a.code}</span>
                  <span className="advisor-badge">{a.relevance} relevance</span>
                </header>
                <p className="kicker">{a.pillar} · NIST {a.nist}</p>
                <strong>{a.question}</strong>
                <p>{a.rationale}</p>
              </article>
            ))}
          </div>
          <h3><ListPlus weight="duotone" /> Recommended corrective actions</h3>
          <div className="advisor-grid">
            {result.actions?.map((a) => {
              const done = added.includes(a.title);
              return (
                <article key={a.title} className="advisor-action">
                  <header>
                    <span className={"advisor-badge pri-" + a.priority.toLowerCase()}>{a.priority}</span>
                    <span className="advisor-code">{a.controlId}</span>
                  </header>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                  <p className="kicker">Owner: {a.owner}</p>
                  <Button variant={done ? "secondary" : "outline"} disabled={done} onClick={() => addAction(a)}>
                    {done ? <CheckCircle weight="duotone" /> : <ListPlus weight="duotone" />}
                    {done ? "Added to tracker" : "Add to corrective actions"}
                  </Button>
                </article>
              );
            })}
          </div>
          {added.length > 0 && (
            <Button asChild variant="ghost">
              <Link to="/actions">Open corrective actions <ArrowRight weight="bold" /></Link>
            </Button>
          )}
          <p className="advisor-note">AI-generated suggestions can be wrong or incomplete. Review with qualified governance, legal and risk professionals before acting.</p>
        </div>
      )}
    </div>
  );
}
