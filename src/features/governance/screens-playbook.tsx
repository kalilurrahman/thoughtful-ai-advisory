import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle, DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PLAYBOOK_CHAPTERS } from "@/data/playbook";
import { Chip, Kicker } from "./screens-core";

const progressKey = "aegis-playbook-progress-v1";

export function PlaybookScreen() {
  const hash = useLocation({ select: (location) => location.hash });
  const [query, setQuery] = useState("");
  const [part, setPart] = useState("All");
  const [open, setOpen] = useState(PLAYBOOK_CHAPTERS[0].id);
  const [completed, setCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const parts = [
    "All",
    ...Array.from(new Set(PLAYBOOK_CHAPTERS.map((chapter) => chapter.part.split(" · ")[1]))),
  ];
  const chapters = useMemo(
    () =>
      PLAYBOOK_CHAPTERS.filter((chapter) => {
        const matchesPart = part === "All" || chapter.part.endsWith(part);
        return (
          matchesPart && JSON.stringify(chapter).toLowerCase().includes(query.trim().toLowerCase())
        );
      }),
    [part, query],
  );

  useEffect(() => {
    const chapterId = hash.replace(/^#/, "");
    if (!PLAYBOOK_CHAPTERS.some((chapter) => chapter.id === chapterId)) return;
    setOpen(chapterId);
    window.requestAnimationFrame(() =>
      document.getElementById(chapterId)?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }, [hash]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const record = parsed as { completed?: unknown; notes?: unknown };
          if (Array.isArray(record.completed)) {
            const validIds = new Set(PLAYBOOK_CHAPTERS.map((chapter) => chapter.id));
            setCompleted(
              record.completed.filter(
                (id): id is string => typeof id === "string" && validIds.has(id),
              ),
            );
          }
          if (record.notes && typeof record.notes === "object" && !Array.isArray(record.notes)) {
            const validIds = new Set(PLAYBOOK_CHAPTERS.map((chapter) => chapter.id));
            setNotes(
              Object.fromEntries(
                Object.entries(record.notes).filter(
                  ([id, note]) => validIds.has(id) && typeof note === "string",
                ),
              ),
            );
          }
        }
      }
    } catch {
      // Reader progress is optional; private browsing or blocked storage keeps this session usable.
    } finally {
      setProgressLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    try {
      localStorage.setItem(progressKey, JSON.stringify({ completed, notes }));
    } catch {
      // Keep edits available in memory when browser storage is unavailable.
    }
  }, [completed, notes, progressLoaded]);

  function downloadNotes() {
    const entries = PLAYBOOK_CHAPTERS.filter((chapter) => notes[chapter.id]?.trim());
    const body = entries
      .map((chapter) => `## ${chapter.title}\n\n${notes[chapter.id].trim()}`)
      .join("\n\n");
    const markdown = `# AEGIS Playbook Notes\n\nReviewed chapters: ${completed.length} / ${PLAYBOOK_CHAPTERS.length}\n\n${body || "No chapter notes have been added yet."}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aegis-playbook-notes.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="resource-intro playbook-intro">
        <BookOpen weight="duotone" />
        <div>
          <Kicker>AI Governance Playbook · 12 chapters</Kicker>
          <p>
            A practical operating guide from mandate and inventory to monitoring, incidents and
            continual improvement.
          </p>
        </div>
      </div>
      <div className="playbook-template-cta">
        <span>
          <Kicker>Ready-to-adapt working documents</Kicker>
          <strong>Put the playbook into practice with governance templates.</strong>
        </span>
        <Button asChild variant="outline">
          <Link to="/templates">Browse templates →</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/start">Choose a learning path →</Link>
        </Button>
      </div>
      <div className="playbook-meta">
        <span className="muted">
          {completed.length} of {PLAYBOOK_CHAPTERS.length} chapters reviewed ·{" "}
          {progressLoaded ? "Progress saved locally" : "Loading progress…"}
        </span>
        <progress
          max={PLAYBOOK_CHAPTERS.length}
          value={completed.length}
          aria-label="Playbook reading progress"
        />
        <Button variant="outline" onClick={downloadNotes}>
          <DownloadSimple />
          Download notes
        </Button>
      </div>
      <label className="inventory-search resource-search">
        <MagnifyingGlass />
        <input
          aria-label="Search playbook"
          placeholder="Search governance topics…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="filters resource-filters" aria-label="Playbook parts">
        {parts.map((item) => (
          <Button
            key={item}
            variant={part === item ? "default" : "outline"}
            onClick={() => setPart(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="playbook-list">
        {chapters.map((chapter) => {
          const isOpen = open === chapter.id;
          const isDone = completed.includes(chapter.id);
          return (
            <article
              id={chapter.id}
              className={"playbook-chapter " + (isOpen ? "open" : "")}
              key={chapter.id}
            >
              <button
                className="playbook-chapter-header"
                onClick={() => setOpen(isOpen ? "" : chapter.id)}
                aria-expanded={isOpen}
              >
                <span className="playbook-number">{chapter.id.slice(0, 2)}</span>
                <span className="playbook-heading">
                  <Kicker>{chapter.part}</Kicker>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.standfirst}</small>
                </span>
                <span className={isDone ? "success" : "muted"}>
                  {isDone ? <CheckCircle weight="duotone" /> : "Read"}
                </span>
              </button>
              {isOpen && (
                <div className="playbook-chapter-body">
                  <div className="playbook-outcomes">
                    <Kicker>What good looks like</Kicker>
                    {chapter.outcomes.map((outcome) => (
                      <Chip key={outcome} tone="success">
                        {outcome}
                      </Chip>
                    ))}
                  </div>
                  {chapter.sections.map((section) => (
                    <section className="playbook-section" key={section.heading}>
                      <h3>{section.heading}</h3>
                      <p>{section.body}</p>
                      <ul>
                        {section.actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                  <div className="playbook-tools">
                    <Kicker>Continue in AEGIS</Kicker>
                    {chapter.tools.map((tool) => (
                      <Button key={tool.href + tool.label} asChild variant="link">
                        <Link to={tool.href}>{tool.label} →</Link>
                      </Button>
                    ))}
                  </div>
                  <label className="playbook-note-field">
                    <span>
                      <Kicker>Your notes</Kicker>
                      <small>Stored in this browser only · avoid sensitive information</small>
                    </span>
                    <textarea
                      aria-label={`Private notes for ${chapter.title}`}
                      value={notes[chapter.id] ?? ""}
                      onChange={(event) =>
                        setNotes((saved) => ({ ...saved, [chapter.id]: event.target.value }))
                      }
                      placeholder="Capture decisions, owners, questions, or follow-up actions…"
                    />
                  </label>
                  <Button
                    variant={isDone ? "outline" : "default"}
                    onClick={() =>
                      setCompleted((items) =>
                        isDone
                          ? items.filter((item) => item !== chapter.id)
                          : [...items, chapter.id],
                      )
                    }
                  >
                    {isDone ? "Mark unread" : "Mark chapter reviewed"}
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {chapters.length === 0 && (
        <div className="empty-state">
          <h3>No chapters match</h3>
          <Button
            variant="link"
            onClick={() => {
              setQuery("");
              setPart("All");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <p className="footnote">
        This is practitioner guidance, not legal advice or a certification method. Confirm
        applicable law, standards and implementation guidance for each deployment.
      </p>
    </>
  );
}
