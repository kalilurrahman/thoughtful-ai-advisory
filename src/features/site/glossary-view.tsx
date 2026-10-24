import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { controlUrl, getControl } from "./content";
import { GLOSSARY, GLOSSARY_CATEGORIES, GLOSSARY_VERSION, type GlossaryTerm } from "./glossary";
import { Breadcrumbs } from "./layout";
import { SectionArt } from "./illustrations";
import { normalize } from "@/features/search/search-index";
import { PageHeader, ogImageFor, siteHead } from "./views";

// /glossary — every term in platform/content/glossary.yaml, A–Z, filterable by text and topic.

function matches(t: GlossaryTerm, q: string): boolean {
  if (!q) return true;
  const hay = normalize(`${t.term} ${(t.aliases ?? []).join(" ")} ${t.definition}`);
  return q.split(" ").every((w) => hay.includes(w));
}

export function GlossaryView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const q = normalize(query);
  const shown = useMemo(
    () => GLOSSARY.filter((t) => (category === "all" || t.category === category) && matches(t, q)),
    [q, category],
  );
  const letters = [...new Set(shown.map((t) => t.term[0]?.toUpperCase() ?? ""))];
  const label = (id: string) => GLOSSARY_CATEGORIES.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="tpl-glossary">
      <Breadcrumbs
        crumbs={[
          { label: "Home", url: "/" },
          { label: "Glossary", url: "/glossary", current: true },
        ]}
      />
      <PageHeader
        eyebrow="Resources"
        h1="Glossary"
        lead="Plain-language definitions of the terms used across VERITRAIL — the method, evidence labels, runtime guardrails, and the regulations and standards it maps to."
        meta={`${GLOSSARY.length} terms · Glossary v${GLOSSARY_VERSION}`}
        art={<SectionArt kind="resources" />}
      />
      <div className="container page-body">
        <div className="glossary-tools">
          <div className="field glossary-filter">
            <label htmlFor="glossary-q">Filter terms</label>
            <input
              id="glossary-q"
              type="search"
              value={query}
              placeholder="e.g. risk tier, kill switch, deployer"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="glossary-cats" role="group" aria-label="Topic">
            {[{ id: "all", label: "All topics" }, ...GLOSSARY_CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                className="glossary-cat"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {letters.length > 1 && (
          <nav className="glossary-letters" aria-label="Jump to letter">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`}>
                {l}
              </a>
            ))}
          </nav>
        )}
        <p className="glossary-count" role="status">
          {shown.length === GLOSSARY.length
            ? `${shown.length} terms`
            : `${shown.length} of ${GLOSSARY.length} terms`}
        </p>
        {shown.length === 0 && (
          <p className="notice">
            No terms match “{query}”. Try a shorter word, or choose “All topics”.
          </p>
        )}
        <dl className="glossary-list">
          {shown.map((t, i) => {
            const letter = t.term[0]?.toUpperCase() ?? "";
            const first = i === 0 || (shown[i - 1]?.term[0]?.toUpperCase() ?? "") !== letter;
            return (
              <div className="glossary-entry" id={t.id} key={t.id}>
                {first && (
                  <p className="glossary-letter" id={`letter-${letter}`} aria-hidden="true">
                    {letter}
                  </p>
                )}
                <dt>
                  {t.term}
                  <span className="glossary-tag">{label(t.category)}</span>
                </dt>
                <dd>
                  <p>{t.definition}</p>
                  {t.aliases && t.aliases.length > 0 && (
                    <p className="glossary-aliases">Also: {t.aliases.join(", ")}</p>
                  )}
                  {t.controls && t.controls.length > 0 && (
                    <p className="glossary-controls">
                      Related controls:{" "}
                      {t.controls.map((id, j) => {
                        const c = getControl(id);
                        return (
                          <span key={id}>
                            {j > 0 && ", "}
                            {c ? (
                              <Link to={controlUrl(c.id)} title={c.title} className="control-ref">
                                {c.id}
                              </Link>
                            ) : (
                              id
                            )}
                          </span>
                        );
                      })}
                    </p>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
        <aside className="disclaimer" aria-label="About these definitions">
          <p>
            Definitions of laws and standards are short, indicative summaries to help readers follow
            VERITRAIL pages. They are not legal interpretations.
          </p>
        </aside>
      </div>
    </div>
  );
}

export const glossaryHead = () =>
  siteHead({
    title: "AI governance glossary",
    description: `${GLOSSARY.length} plain-language definitions of AI governance terms used by VERITRAIL: risk tiers, evidence labels, runtime guardrails, the EU AI Act, NIST AI RMF and ISO/IEC 42001.`,
    image: ogImageFor("glossary"),
  });
