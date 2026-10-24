import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  ArrowRight,
  BookOpenText,
  FileText,
  Hash,
  MagnifyingGlass,
  Question,
  SquaresFour,
  TerminalWindow,
  TextAa,
} from "@phosphor-icons/react";
import { GLOSSARY } from "@/features/site/glossary";
import {
  KIND_LABELS,
  SUGGESTED_URLS,
  buildSearchEntries,
  prepare,
  search,
  type SearchEntry,
  type SearchKind,
} from "./search-index";

// Site-wide search: ⌘K / Ctrl+K or "/" anywhere, or the search buttons in the website and
// workspace headers. Results come from search-index.ts and open through the router.

const OPEN_EVENT = "veritrail-search-change";
let open = false;

function setOpen(next: boolean): void {
  open = next;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function openSearch(): void {
  setOpen(true);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(OPEN_EVENT, onChange);
  return () => window.removeEventListener(OPEN_EVENT, onChange);
}

function useSearchOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

const KIND_ICONS: Record<SearchKind, typeof FileText> = {
  page: FileText,
  section: Hash,
  control: SquaresFour,
  glossary: TextAa,
  workspace: BookOpenText,
  platform: TerminalWindow,
  faq: Question,
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/** Mounted once at the root, beside the PWA layer. */
export function SearchLayer() {
  const isOpen = useSearchOpen();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const all = useMemo(() => buildSearchEntries(GLOSSARY), []);
  const index = useMemo(() => prepare(all), [all]);
  const results = useMemo(() => search(index, query), [index, query]);
  const suggestions = useMemo(
    () =>
      SUGGESTED_URLS.map((url) => all.find((e) => e.url === url)).filter(
        (e): e is SearchEntry => !!e,
      ),
    [all],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "/" && !open && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const go = (url: string) => {
    setOpen(false);
    void navigate({ href: url });
  };

  // Groups in the order of their best result, so the top match is always the first item.
  const kinds = [...new Set(results.map((r) => r.kind))];
  const groups = kinds.map((kind) => ({
    kind,
    items: results.filter((r) => r.kind === kind).slice(0, kind === "section" ? 8 : 6),
  }));

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="search-overlay" />
        <Dialog.Content className="search-dialog" aria-describedby={undefined}>
          <Dialog.Title className="search-title">Search VERITRAIL</Dialog.Title>
          <Command shouldFilter={false} loop label="Search VERITRAIL">
            <div className="search-input-row">
              <MagnifyingGlass weight="bold" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, controls, terms and tools…"
                className="search-input"
              />
              <kbd className="search-kbd">Esc</kbd>
            </div>
            <Command.List className="search-list">
              {query.trim() && (
                <Command.Empty className="search-empty">
                  No matches for “{query.trim()}”. Try a control ID such as IS-11, or a term such as
                  “risk tier”.
                </Command.Empty>
              )}
              {!query.trim() && (
                <Command.Group heading="Popular" className="search-group">
                  {suggestions.map((e) => (
                    <ResultItem key={e.id} entry={e} onSelect={go} />
                  ))}
                </Command.Group>
              )}
              {groups.map((g) => (
                <Command.Group key={g.kind} heading={KIND_LABELS[g.kind]} className="search-group">
                  {g.items.map((e) => (
                    <ResultItem key={e.id} entry={e} onSelect={go} />
                  ))}
                </Command.Group>
              ))}
            </Command.List>
            <p className="search-foot">
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> to move
              </span>
              <span>
                <kbd>Enter</kbd> to open
              </span>
              <span>
                <kbd>⌘</kbd> <kbd>K</kbd> or <kbd>/</kbd> to search from anywhere
              </span>
            </p>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ResultItem({ entry, onSelect }: { entry: SearchEntry; onSelect: (url: string) => void }) {
  const Icon = KIND_ICONS[entry.kind];
  return (
    <Command.Item value={entry.id} onSelect={() => onSelect(entry.url)} className="search-item">
      <Icon weight="duotone" aria-hidden="true" className="search-item-icon" />
      <span className="search-item-text">
        <span className="search-item-title">{entry.title}</span>
        {entry.subtitle && <span className="search-item-sub">{entry.subtitle}</span>}
      </span>
      <ArrowRight weight="bold" aria-hidden="true" className="search-item-go" />
    </Command.Item>
  );
}

/** Search button for the website header. */
export function SearchButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`search-btn ${className}`}
      aria-label="Search (press / or Ctrl K)"
      title="Search  ( / or ⌘K )"
      onClick={openSearch}
    >
      <MagnifyingGlass weight="bold" aria-hidden="true" />
    </button>
  );
}
