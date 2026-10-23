import { useMemo, useState } from "react";
import {
  Check,
  ClipboardText,
  DownloadSimple,
  FileText,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GOVERNANCE_TEMPLATES } from "@/data/templates";
import { Kicker } from "./screens-core";

const categories = ["All", "Programme", "Lifecycle", "Assurance", "Operations"] as const;

export function TemplatesScreen() {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(GOVERNANCE_TEMPLATES[0]?.id ?? "");
  const [context, setContext] = useState({ organisation: "", owner: "", system: "", date: "" });
  const [copied, setCopied] = useState(false);
  const visible = useMemo(
    () =>
      GOVERNANCE_TEMPLATES.filter(
        (template) =>
          (category === "All" || template.category === category) &&
          `${template.title} ${template.description} ${template.category}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [category, query],
  );
  const selected =
    GOVERNANCE_TEMPLATES.find((template) => template.id === selectedId) ?? GOVERNANCE_TEMPLATES[0];
  if (!selected) {
    return <p className="muted">No governance templates are available yet.</p>;
  }
  const activeTemplate = selected;
  const markdown = `# ${selected.title}\n\n> Starter template · Adapt to your organisation and validate with relevant owners.\n\n${selected.description}\n\n## Document details\n\n- Organisation: ${context.organisation || "[Organisation]"}\n- Accountable owner: ${context.owner || "[Name / role]"}\n- AI system or programme: ${context.system || "[System / programme]"}\n- Prepared / reviewed: ${context.date || "[Date]"}\n\n## How to use\n\n${selected.prompt}\n\n${selected.sections.map((section) => `## ${section.heading}\n\n${section.prompts.map((prompt) => `- [ ] ${prompt}\n  - Notes / evidence: \n`).join("\n")}`).join("\n")}\n## Approval and review\n\n- Decision: [Approve / approve with conditions / reject / defer]\n- Decision owner: [Name / role]\n- Conditions and actions: [Owner · due date · evidence]\n- Next review date: [Date]\n`;

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `veritrail-${activeTemplate.id}-template.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className="resource-intro">
        <FileText weight="duotone" />
        <div>
          <Kicker>Governance starter templates · {GOVERNANCE_TEMPLATES.length} documents</Kicker>
          <p>
            Adaptable working documents for an AI governance programme. Add your organisation
            context, then download as Markdown or copy the draft.
          </p>
        </div>
      </div>
      <label className="inventory-search resource-search">
        <MagnifyingGlass />
        <input
          aria-label="Search templates"
          placeholder="Search templates…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="filters resource-filters" aria-label="Template categories">
        {categories.map((item) => (
          <Button
            key={item}
            variant={category === item ? "default" : "outline"}
            onClick={() => setCategory(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="template-layout">
        <div className="template-list" aria-label="Available templates">
          {visible.map((template) => (
            <button
              className={"template-choice " + (selected.id === template.id ? "selected" : "")}
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              aria-pressed={selected.id === template.id}
            >
              <Kicker>{template.category}</Kicker>
              <strong>{template.title}</strong>
              <span>{template.description}</span>
            </button>
          ))}
          {visible.length === 0 && <p className="muted">No templates match your search.</p>}
        </div>
        <section className="template-builder">
          <div className="section-heading">
            <div>
              <Kicker>{selected.category} · starter document</Kicker>
              <h2>{selected.title}</h2>
            </div>
            <span className="chip">Markdown</span>
          </div>
          <p className="muted template-note">{selected.prompt}</p>
          <div className="template-fields">
            <label>
              Organisation
              <input
                value={context.organisation}
                onChange={(event) => setContext({ ...context, organisation: event.target.value })}
                placeholder="Organisation name"
              />
            </label>
            <label>
              Accountable owner
              <input
                value={context.owner}
                onChange={(event) => setContext({ ...context, owner: event.target.value })}
                placeholder="Name or role"
              />
            </label>
            <label>
              System or programme
              <input
                value={context.system}
                onChange={(event) => setContext({ ...context, system: event.target.value })}
                placeholder="AI system or programme"
              />
            </label>
            <label>
              Prepared / reviewed
              <input
                type="date"
                value={context.date}
                onChange={(event) => setContext({ ...context, date: event.target.value })}
              />
            </label>
          </div>
          <Kicker>Document sections</Kicker>
          <div className="template-outline">
            {selected.sections.map((section, index) => (
              <div key={section.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{section.heading}</strong>
                <small>{section.prompts.length} prompts</small>
              </div>
            ))}
          </div>
          <div className="template-actions">
            <Button onClick={download}>
              <DownloadSimple />
              Download Markdown
            </Button>
            <Button variant="outline" onClick={copy}>
              <ClipboardText />
              {copied ? (
                <>
                  <Check />
                  Copied
                </>
              ) : (
                "Copy draft"
              )}
            </Button>
          </div>
          <p className="footnote">
            Templates are editable starting points, not approved policies, legal advice or proof of
            compliance. Review and approve through your organisation’s process.
          </p>
        </section>
      </div>
    </>
  );
}
