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
import { classify, requiredGuardrail } from "./model";
import { useGovernance } from "./store";
import { filterInventory, inventoryCsv } from "./inventory-export";
import { Chip, Dot, Kicker } from "./screens-core";
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
    [q, setQ] = useState([false, false, false, false]);
  const tier = classify(q);
  const visibleSystems = filterInventory(state.systems, filter, statusFilter, search);
  const questions = [
    "Used in employment, credit, health, education, critical infrastructure or law enforcement?",
    "Makes or materially influences decisions about individuals?",
    "Interacts with people or generates synthetic content?",
    "Social scoring, manipulation or real-time remote biometric identification?",
  ];
  const notes: Record<string, string> = {
    Prohibited: "EU AI Act Art. 5 — do not deploy; escalate to legal.",
    "High-risk":
      "Annex III candidate — Art. 9–15 obligations apply; full TILLER assessment and release gate required.",
    Limited: "Art. 50 transparency duties apply; standard guardrail bundle.",
    Minimal: "Minimal risk — acceptable-use policy and inventory entry suffice.",
  };
  function openRegistration() {
    setEditingIndex(null);
    setName("");
    setOwner("");
    setKind("");
    setVendor("");
    setData("");
    setQ([false, false, false, false]);
    setOpen(true);
  }
  function openEditor(system: (typeof state.systems)[number], index: number) {
    setEditingIndex(index);
    setName(system.name);
    setOwner(system.owner);
    setKind(system.kind);
    setVendor(system.vendor);
    setData(system.data);
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
          Register system
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
        Register & classify a system
      </Button>
      <p className="footnote">
        Screening informed by EU AI Act Art. 5–6 / Annex III. Final applicability requires legal
        review.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="veritrail-sheet">
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
              <label>
                Review tier
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
          {editingIndex === null &&
            questions.map((text, i) => (
              <label className="toggle-row classifier-question" key={text}>
                <span>{text}</span>
                <Switch
                  checked={q[i] ?? false}
                  onCheckedChange={(on) => setQ(q.map((x, j) => (j === i ? on : x)))}
                />
              </label>
            ))}
          {editingIndex === null && (
            <div className="screening-result">
              <Kicker>Screening result</Kicker>
              <h2>
                <Chip tone={tier === "High-risk" || tier === "Prohibited" ? "danger" : "success"}>
                  {tier}
                </Chip>
              </h2>
              <p>{notes[tier]}</p>
            </div>
          )}
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const system = {
                name: name.trim(),
                tier: editingIndex === null ? tier : editedTier,
                kind: kind.trim() || "Registered system",
                owner: owner.trim() || "Unassigned",
                data: data.trim() || "Not specified",
                status:
                  editingIndex === null
                    ? tier === "Prohibited"
                      ? "Not approved"
                      : "Under review"
                    : status,
                vendor: vendor.trim() || "Not specified",
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
