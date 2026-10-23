import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  CheckCircle,
  Circle,
  ArrowRight,
  MagnifyingGlass,
  PencilSimple,
  DownloadSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GR, PHASES, type Tier } from "@/data/governance";
import { calculateRiskTier, type RiskProfile } from "@/features/site/engines/risk-tier";
import { requiredGuardrail } from "./model";
import { useGovernance } from "./store";
import { filterInventory, inventoryCsv } from "./inventory-export";
import { Chip, Dot, Kicker } from "./screens-core";
const triageSelects: [string, string, string][] = [
  [
    "decision_impact",
    "Decision impact",
    "none|No decisions about people;advisory|Advisory — human decides;material|Materially influences decisions;automated_decision|Automated decision",
  ],
  [
    "affected_parties",
    "Affected people",
    "internal|Internal staff;customers|Customers;public|General public;vulnerable|Potentially vulnerable people",
  ],
  [
    "data_sensitivity",
    "Data sensitivity",
    "public|Public;internal|Internal;confidential|Confidential;personal|Personal data;special_category|Special-category / highly sensitive",
  ],
  [
    "autonomy",
    "System autonomy",
    "none|No autonomy — produces content only;suggests|Suggests actions;acts_with_approval|Acts after human approval;acts_autonomously|Acts autonomously",
  ],
  [
    "domain_category",
    "Use-case domain",
    "customer_service|Customer service;internal_productivity|Internal productivity;healthcare|Healthcare;life_sciences|Pharma / life sciences;gcc_shared_services|GCC / shared services;financial_services|Financial services;public_sector|Public sector;credit|Credit / lending;employment|Employment / HR;insurance|Insurance;biometric|Biometrics;education|Education;critical_infrastructure|Critical infrastructure;essential_services|Essential services;law_enforcement|Law enforcement;migration|Migration / border control;justice|Justice;other|Other",
  ],
  ["external_actions", "External actions enabled?", "yes|Yes;no|No"],
  ["eu_exposure", "EU exposure?", "yes|Yes;no|No"],
  ["vendor_model", "Third-party model or vendor AI?", "yes|Yes;no|No"],
  ["genai", "Generative AI / LLM?", "yes|Yes;no|No"],
];
export function InventoryScreen() {
  const { state, dispatch } = useGovernance();
  const [filter, setFilter] = useState("All"),
    [statusFilter, setStatusFilter] = useState("All statuses"),
    [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [search, setSearch] = useState(""),
    [owner, setOwner] = useState(""),
    [kind, setKind] = useState(""),
    [vendor, setVendor] = useState(""),
    [data, setData] = useState(""),
    [editingIndex, setEditingIndex] = useState<number | null>(null),
    [editedTier, setEditedTier] = useState<"High-risk" | "Limited" | "Minimal" | "Prohibited">(
      "Minimal",
    ),
    [status, setStatus] = useState("Under review"),
    [riskProfile, setRiskProfile] = useState<RiskProfile>({});
  const triage = calculateRiskTier({ ...riskProfile, name });
  const tier = (
    {
      Low: "Minimal",
      Medium: "Limited",
      High: "High-risk",
      "Prohibited-review": "Prohibited",
    } as const
  )[triage.tier];
  const triageEnabled = editingIndex === null || Boolean(state.systems[editingIndex]?.riskTriage);
  const visibleSystems = filterInventory(state.systems, filter, statusFilter, search);
  function openRegistration() {
    setEditingIndex(null);
    setName("");
    setOwner("");
    setKind("");
    setVendor("");
    setData("");
    setRiskProfile({});
    setOpen(true);
  }
  function openEditor(system: (typeof state.systems)[number], index: number) {
    setEditingIndex(index);
    setName(system.name);
    setOwner(system.owner);
    setKind(system.kind);
    setVendor(system.vendor);
    setData(system.data);
    setRiskProfile(system.riskTriage?.profile ?? {});
    setEditedTier(system.tier as typeof editedTier);
    setStatus(system.status);
    setOpen(true);
  }
  return (
    <>
      <div className="inventory-toolbar">
        <label className="inventory-search">
          <MagnifyingGlass />
          <input
            aria-label="Search AI inventory"
            placeholder="Search systems, owners, vendors, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="inventory-status-filter">
          Status
          <select
            aria-label="Filter by governance status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All statuses</option>
            <option>Under review</option>
            <option>Approved</option>
            <option>Approved with limits</option>
            <option>Not approved</option>
          </select>
        </label>
        <Button
          variant="outline"
          disabled={visibleSystems.length === 0}
          onClick={() => {
            const blob = new Blob(
              ["\uFEFF", inventoryCsv(visibleSystems.map(({ system }) => system))],
              { type: "text/csv;charset=utf-8" },
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "ai-governance-inventory.csv";
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
          }}
        >
          <DownloadSimple />
          Export view ({visibleSystems.length})
        </Button>
        <Button onClick={openRegistration}>
          <Plus />
          Register & triage
        </Button>
      </div>
      <div className="inventory-summary" aria-label="Inventory status summary">
        <span>
          <strong>{state.systems.length}</strong> registered
        </span>
        <span>
          <strong>
            {state.systems.filter((system) => system.status === "Under review").length}
          </strong>{" "}
          under review
        </span>
        <span>
          <strong>
            {
              state.systems.filter(
                (system) =>
                  system.status === "Approved" || system.status === "Approved with limits",
              ).length
            }
          </strong>{" "}
          approved
        </span>
        <span>
          <strong>
            {state.systems.filter((system) => system.status === "Not approved").length}
          </strong>{" "}
          not approved
        </span>
      </div>
      <div className="filters">
        {["All", "High-risk", "Limited", "Minimal", "Prohibited"].map((x) => (
          <Button
            key={x}
            variant={filter === x ? "default" : "outline"}
            onClick={() => setFilter(x)}
          >
            {x} <span>{state.systems.filter((s) => x === "All" || s.tier === x).length}</span>
          </Button>
        ))}
      </div>
      <div className="system-list">
        {visibleSystems.map(({ system: s, index }) => (
          <article className="system-row" key={s.name + index}>
            <div className="split">
              <h3>{s.name}</h3>
              <Chip
                tone={
                  s.tier === "High-risk" || s.tier === "Prohibited"
                    ? "danger"
                    : s.tier === "Limited"
                      ? "success"
                      : "neutral"
                }
              >
                {s.tier}
              </Chip>
            </div>
            <p className="muted">
              {s.kind} · {s.owner} · {s.data}
            </p>
            <p>
              <Dot
                tone={
                  s.status === "Approved"
                    ? "success"
                    : s.status === "Not approved"
                      ? "danger"
                      : "warning"
                }
              />
              {s.status}
            </p>
            <p className="muted">{s.vendor}</p>
            {s.riskTriage && (
              <details className="decision-history">
                <summary>
                  Preliminary triage · {s.riskTriage.result.evidence_status} · score{" "}
                  {s.riskTriage.result.score} (not a percentage)
                </summary>
                <p>{s.riskTriage.result.rationale}</p>
                <p>
                  Human confirmation required.{" "}
                  {s.riskTriage.result.missing_fields.length
                    ? `Missing facts: ${s.riskTriage.result.missing_fields.join(", ")}.`
                    : "Intake facts are complete; reviewer confirmation is still required."}
                </p>
                <p>
                  Drivers:{" "}
                  {s.riskTriage.result.factors
                    .filter((factor) => factor.points > 0)
                    .map((factor) => `${factor.factor} (+${factor.points})`)
                    .join(", ") || "No quantified drivers"}
                </p>
              </details>
            )}
            <Button variant="ghost" size="sm" onClick={() => openEditor(s, index)}>
              <PencilSimple />
              Edit record
            </Button>
          </article>
        ))}
      </div>
      {visibleSystems.length === 0 && (
        <p className="empty-state muted">No systems match your search.</p>
      )}
      <Button className="full-button" onClick={openRegistration}>
        <Plus />
        Register and run structured risk triage
      </Button>
      <p className="footnote">
        Screening is a preliminary inference, not a legal classification or approval. New records
        remain Under review until an accountable human confirms disposition.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="aegis-sheet">
          <DialogTitle>
            {editingIndex === null ? "Register & screen" : "Edit inventory record"}
          </DialogTitle>
          <DialogDescription>
            {editingIndex === null
              ? "Preliminary risk screen · confirm legal applicability separately"
              : "Update system details and governance status. Re-screen after a material change."}
          </DialogDescription>
          <label>
            System name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AI system name"
            />
          </label>
          <div className="registration-fields">
            <label>
              Owner
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Team or accountable owner"
              />
            </label>
            <label>
              System type
              <input
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                placeholder="e.g. Decision support"
              />
            </label>
            <label>
              Vendor
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Vendor or in-house"
              />
            </label>
            <label>
              Data classification
              <input
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="e.g. Internal, personal"
              />
            </label>
          </div>
          {editingIndex !== null && (
            <div className="registration-fields">
              {state.systems[editingIndex]?.riskTriage ? (
                <p className="muted">
                  Inferred tier comes from the saved structured triage. Re-run the intake after a
                  material change.
                </p>
              ) : (
                <label>
                  Legacy display tier
                  <select
                    value={editedTier}
                    onChange={(event) => setEditedTier(event.target.value as typeof editedTier)}
                  >
                    <option>High-risk</option>
                    <option>Limited</option>
                    <option>Minimal</option>
                    <option>Prohibited</option>
                  </select>
                </label>
              )}
              <label>
                Governance status
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option>Under review</option>
                  <option>Approved</option>
                  <option>Approved with limits</option>
                  <option>Not approved</option>
                </select>
              </label>
            </div>
          )}
          {triageEnabled && (
            <>
              <label>
                Intended purpose
                <textarea
                  value={String(riskProfile.purpose ?? "")}
                  onChange={(event) =>
                    setRiskProfile((previous) => ({ ...previous, purpose: event.target.value }))
                  }
                  placeholder="What does the system do, for whom, and in what context?"
                />
              </label>
              <div className="registration-fields">
                {triageSelects.map(([field, label, encodedOptions]) => (
                  <label key={field}>
                    {label}
                    <select
                      value={String(riskProfile[field] ?? "")}
                      onChange={(event) =>
                        setRiskProfile((previous) => ({
                          ...previous,
                          [field]: event.target.value || undefined,
                        }))
                      }
                    >
                      <option value="">Not sure / unanswered</option>
                      {encodedOptions.split(";").map((entry) => {
                        const [value, optionLabel] = entry.split("|");
                        return value && optionLabel ? (
                          <option key={value} value={value}>
                            {optionLabel}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </label>
                ))}
                <label>
                  Tools and permissions
                  <input
                    value={
                      Array.isArray(riskProfile.tools)
                        ? riskProfile.tools.join(", ")
                        : String(riskProfile.tools ?? "")
                    }
                    onChange={(event) =>
                      setRiskProfile((previous) => ({ ...previous, tools: event.target.value }))
                    }
                    placeholder="e.g. crm_read, send_email, issue_refund"
                  />
                </label>
              </div>
              <div className="screening-result">
                <Kicker>Inferred screening result · human confirmation required</Kicker>
                <h2>
                  <Chip tone={tier === "High-risk" || tier === "Prohibited" ? "danger" : "success"}>
                    {tier}
                  </Chip>{" "}
                  <small>Rule score {triage.score} (not a percentage)</small>
                </h2>
                <p>{triage.rationale}</p>
                {triage.missing_fields.length > 0 && (
                  <p>
                    <strong>Missing facts:</strong> {triage.missing_fields.join(", ")}
                  </p>
                )}
                {triage.triggers.length > 0 && (
                  <p>
                    <strong>Review triggers:</strong> {triage.triggers.join(" · ")}
                  </p>
                )}
                <p>
                  <strong>Suggested modules:</strong> {triage.required_modules.join(", ")}
                </p>
                <p>
                  <strong>Suggested authority:</strong> {triage.approval_authority} ·{" "}
                  <strong>Review cadence:</strong>{" "}
                  {triage.review_cadence_months
                    ? "Every " + triage.review_cadence_months + " months"
                    : "Pause and escalate"}
                </p>
              </div>
            </>
          )}
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const system = {
                name: name.trim(),
                tier: triageEnabled ? tier : editedTier,
                kind: kind.trim() || "Registered system",
                owner: owner.trim() || "Unassigned",
                data: data.trim() || "Not specified",
                status: editingIndex === null ? "Under review" : status,
                vendor: vendor.trim() || "Not specified",
                ...(triageEnabled
                  ? {
                      riskTriage: {
                        profile: Object.fromEntries(
                          Object.entries({ ...riskProfile, name: name.trim() }).filter(
                            (entry): entry is [string, string | boolean | string[]] =>
                              entry[1] !== undefined,
                          ),
                        ),
                        result: triage,
                        assessedAt: new Date().toISOString(),
                      },
                    }
                  : {}),
              };
              dispatch(
                editingIndex === null
                  ? { type: "system", system }
                  : { type: "update-system", index: editingIndex, system },
              );
              setOpen(false);
              setEditingIndex(null);
              setSearch("");
              setFilter("All");
            }}
          >
            {editingIndex === null ? "Add to inventory" : "Save changes"}
            {editingIndex === null ? <Plus /> : <CheckCircle />}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function GuardrailsScreen() {
  const { state, dispatch, coverage } = useGovernance();
  return (
    <>
      <div className="coverage-summary">
        <strong>
          {coverage.percent}
          <small>%</small>
        </strong>
        <div>
          <Kicker>Guardrail coverage</Kicker>
          <p>
            {coverage.enabled} of {coverage.required} required controls
          </p>
        </div>
      </div>
      <div className="segments">
        {(["Low", "Medium", "High"] as Tier[]).map((t) => (
          <Button
            key={t}
            variant={state.tier === t ? "default" : "outline"}
            onClick={() => dispatch({ type: "tier", tier: t })}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="guardrail-grid">
        {GR.map((g) => {
          const required = g.c.filter(([, rank]) => requiredGuardrail(Number(rank), state.tier));
          return (
            <section key={g.name}>
              <div className="section-heading">
                <h2>{g.name}</h2>
                <span className="muted">
                  {required.filter(([name]) => state.gr[String(name)]).length}/{required.length}{" "}
                  required
                </span>
              </div>
              {g.c.map(([name, rank]) => {
                const required = requiredGuardrail(Number(rank), state.tier),
                  enabled = state.gr[String(name)];
                return (
                  <label className="toggle-row" key={String(name)}>
                    <div>
                      <span className={!required ? "muted" : ""}>{name}</span>
                      <small className={required && !enabled ? "danger" : "muted"}>
                        {required ? (enabled ? "Required" : "Missing") : "Optional"}
                      </small>
                    </div>
                    <Switch
                      checked={enabled ?? false}
                      onCheckedChange={() => dispatch({ type: "guardrail", name: String(name) })}
                      aria-label={String(name)}
                    />
                  </label>
                );
              })}
            </section>
          );
        })}
      </div>
      <Button asChild className="full-button">
        <Link to="/export">
          Export guardrail bundle
          <ArrowRight />
        </Link>
      </Button>
    </>
  );
}
export function RoadmapScreen() {
  const { state, dispatch } = useGovernance();
  return (
    <>
      <p className="muted">
        Generated from assessment gaps and gate blockers.{" "}
        {state.roadmap.filter((i) => i.done).length} of {state.roadmap.length} complete.
      </p>
      <div className="roadmap-grid">
        {PHASES.map((p, phase) => (
          <section className="roadmap-phase" key={p.num}>
            <div className="phase-heading">
              <strong>{p.num}</strong>
              <div>
                <h2>{p.name}</h2>
                <p className="muted">{p.window}</p>
              </div>
            </div>
            {state.roadmap
              .filter((i) => i.phase === phase)
              .map((i) => (
                <Button
                  variant="ghost"
                  className={"roadmap-item " + (i.done ? "completed" : "")}
                  key={i.key}
                  aria-pressed={i.done}
                  onClick={() => dispatch({ type: "done", key: i.key })}
                >
                  {i.done ? (
                    <CheckCircle className="success" weight="duotone" />
                  ) : (
                    <Circle className="muted" weight="duotone" />
                  )}
                  <div>
                    <span>{i.title}</span>
                    <small className="muted">
                      {i.owner} · {i.effort} effort · {i.tag}
                    </small>
                  </div>
                </Button>
              ))}
          </section>
        ))}
      </div>
    </>
  );
}
