import { parse } from "yaml";
import glossaryYaml from "../../../platform/content/glossary.yaml?raw";

// The governed glossary (platform/content/glossary.yaml): the /glossary page, the definitions
// shown when a reader taps an underlined term in page text, and glossary results in search.

export interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  definition: string;
  aliases?: string[];
  controls?: string[];
  /** false: listed in the glossary, never underlined in page text. */
  auto?: boolean;
}

interface GlossaryFile {
  version: string;
  categories: Array<{ id: string; label: string }>;
  terms: GlossaryTerm[];
}

const file = parse(glossaryYaml) as GlossaryFile;

export const GLOSSARY_VERSION = file.version;
export const GLOSSARY_CATEGORIES = file.categories;
export const GLOSSARY: GlossaryTerm[] = [...file.terms].sort((a, b) =>
  a.term.localeCompare(b.term, "en", { sensitivity: "base" }),
);

const byId = new Map(GLOSSARY.map((t) => [t.id, t]));

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return byId.get(id);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Phrase (lower-cased) → term id, for every term and alias that may be underlined. */
const PHRASES = new Map<string, string>();
for (const t of GLOSSARY) {
  if (t.auto === false) continue;
  for (const p of [t.term, ...(t.aliases ?? [])]) PHRASES.set(p.toLowerCase(), t.id);
}

/**
 * Source for a regex alternation of every glossary phrase, longest first ("AI agent" before
 * "agent"). The Markdown renderer wraps it with its own word boundaries (no lookbehind, which
 * older Safari cannot parse).
 */
const phrases = [...PHRASES.keys()].sort((a, b) => b.length - a.length);
const original = new Map<string, string>();
for (const t of GLOSSARY)
  for (const p of [t.term, ...(t.aliases ?? [])]) original.set(p.toLowerCase(), p);

export const GLOSSARY_PHRASE_SOURCE = phrases.map((p) => escapeRegExp(p)).join("|");

/**
 * The term id for a matched phrase. Matching is case-insensitive, except that all-caps terms
 * (TILLER, AIMS, NIST AI RMF) only count in capitals, so ordinary words are left alone.
 */
export function termIdFor(match: string): string | undefined {
  const key = match.toLowerCase();
  const id = PHRASES.get(key);
  if (!id) return undefined;
  const source = original.get(key) ?? "";
  const allCaps = /^[A-Z0-9_/ ()-]+$/.test(source) && /[A-Z]{2}/.test(source);
  if (allCaps && match !== source) return undefined;
  return id;
}
