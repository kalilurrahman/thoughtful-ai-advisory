import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/features/site/layout";
import { PageHeader } from "@/features/site/views";
import { siteHead } from "@/features/site/views";

type SitemapEntry = { loc: string; lastmod?: string; path: string };

function parseSitemap(xml: string): SitemapEntry[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) return [];
  return Array.from(doc.querySelectorAll("url")).flatMap((url) => {
    const loc = url.querySelector("loc")?.textContent?.trim();
    if (!loc) return [];
    const lastmod = url.querySelector("lastmod")?.textContent?.trim() || undefined;
    let path = loc;
    try {
      path = new URL(loc).pathname || "/";
    } catch {
      // keep raw loc
    }
    return [{ loc, lastmod, path }];
  });
}

function SitemapPage() {
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/sitemap.xml")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load sitemap (${res.status}).`);
        return res.text();
      })
      .then((xml) => {
        if (cancelled) return;
        const parsed = parseSitemap(xml);
        setEntries(parsed);
        if (!parsed.length) setError("No sitemap URLs could be read.");
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load sitemap.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, SitemapEntry[]>();
    for (const entry of entries) {
      const key = entry.path === "/" ? "Home" : (entry.path.split("/").filter(Boolean)[0] ?? "Other");
      const label = key === "Home" ? "Home" : key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const list = groups.get(label) ?? [];
      list.push(entry);
      groups.set(label, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [entries]);

  return (
    <>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Sitemap" }]} />
      <PageHeader
        h1="Sitemap"
        eyebrow="Site map"
        lead="A readable index of public pages on this site. The machine-readable XML sitemap remains available for search engines and download."
      />
      <div className="container page-body">
        <div className="action-bar" style={{ marginBottom: 16 }}>
          <Button asChild>
            <a href="/sitemap.xml" download="sitemap.xml">
              <DownloadSimple />
              Download XML sitemap
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              Open raw XML
            </a>
          </Button>
          <p className="muted" aria-live="polite">
            {loading ? "Loading sitemap…" : `${entries.length} URLs`}
          </p>
        </div>
        {error && <p role="alert" className="danger">{error}</p>}
        {!loading && !error && (
          <div className="sitemap-groups">
            {grouped.map(([label, items]) => (
              <section key={label} className="sitemap-group" aria-labelledby={`sitemap-${label}`}>
                <h2 id={`sitemap-${label}`}>
                  {label} <span className="muted">({items.length})</span>
                </h2>
                <ul>
                  {items.map((entry) => (
                    <li key={entry.loc}>
                      <a href={entry.path}>{entry.path}</a>
                      {entry.lastmod && <span className="muted"> · {entry.lastmod}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export const Route = createFileRoute("/sitemap")({
  head: () =>
    siteHead({
      title: "Sitemap",
      description: "Readable index of public VERITRAIL pages with XML sitemap download.",
      path: "/sitemap",
    }),
  component: SitemapPage,
});
