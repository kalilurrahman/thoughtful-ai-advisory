import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Governance and Advisory — Kalilur Rahman" },
      {
        name: "description",
        content:
          "AI governance and advisory for enterprise leaders by Kalilur Rahman. Full site coming soon.",
      },
      { property: "og:title", content: "AI Governance and Advisory — Kalilur Rahman" },
      {
        property: "og:description",
        content: "Responsible AI strategy, governance frameworks and advisory. Coming soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LINKS = [
  { label: "Portfolio", href: "https://kalilurrahman.lovable.app" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kalilurrahman/" },
  { label: "KR Projects", href: "https://kalilur-portfolio.lovable.app" },
];

function Index() {
  return (
    <main className="dark flex min-h-screen flex-col bg-background text-foreground">
      <section className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Coming soon
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            AI governance and advisory
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Practical guidance for senior IT leaders on responsible AI strategy, risk, compliance
            and governance frameworks. The full site is being prepared.
          </p>
          <nav aria-label="External links" className="mt-8 flex flex-wrap justify-center gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </section>
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-3xl">
          AI Content Notice. Content may be produced with the assistance of AI and can contain
          errors. Treat it as a starting point only and have it reviewed by qualified professionals
          before use. Not financial, legal or investment advice.
        </p>
        <p className="mt-2">© 2026 Kalilur Rahman</p>
      </footer>
    </main>
  );
}
