import { useEffect, useState } from "react";
import type { TocEntry } from "./markdown";

// Reading aids for long website pages: the "On this page" navigation (a sticky rail on wide
// screens, a collapsible list on phones) with the current section highlighted.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-10-21" → "21 October 2026" (fixed format, so server and browser render the same). */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`;
}

/** Id of the section heading the reader is currently in. */
function useActiveHeading(ids: string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);
  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current: string | undefined;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current ?? els[0]?.id);
    };
    const io = new IntersectionObserver(update, { rootMargin: "0px 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [ids]);
  return active;
}

function TocLinks({ entries, active }: { entries: TocEntry[]; active: string | undefined }) {
  return (
    <ol className="toc-list">
      {entries.map((e) => (
        <li key={e.id}>
          <a href={`#${e.id}`} aria-current={e.id === active ? "location" : undefined}>
            {e.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function OnThisPage({ entries }: { entries: TocEntry[] }) {
  const [ids] = useState(() => entries.map((e) => e.id));
  const active = useActiveHeading(ids);
  return (
    <>
      <details className="toc-mobile">
        <summary>
          On this page <span className="toc-count">{entries.length} sections</span>
        </summary>
        <nav aria-label="On this page">
          <TocLinks entries={entries} active={active} />
        </nav>
      </details>
      <nav className="toc-rail" aria-label="On this page">
        <p className="toc-title">On this page</p>
        <TocLinks entries={entries} active={active} />
      </nav>
    </>
  );
}
