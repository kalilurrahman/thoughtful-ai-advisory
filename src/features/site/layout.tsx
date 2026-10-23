import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { usePageViewTracking } from "../platform/analytics";
import { STANDARD_DISCLAIMER, siteConfig } from "./content";
import { LeadForm } from "./forms";
import { footerColumns, siteNav, type Crumb } from "./pages";
import { SiteLink } from "./ui";
import { Moon, Sun } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useDarkTheme } from "@/lib/theme";

// Public website chrome — header with disclosure navigation, breadcrumbs and footer —
// ported from platform/app/website/templates/partials/{header,breadcrumbs,footer}.html.

function BrandMark() {
  return (
    <svg
      className="brand-mark"
      width="28"
      height="32"
      viewBox="0 0 28 32"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14 1 26 5.5v9.2c0 7.6-5 13.4-12 16.3C7 28.1 2 22.3 2 14.7V5.5L14 1Z"
        fill="currentColor"
      />
      <path
        className="brand-mark-check"
        d="m8.5 16.2 3.8 3.8 7.4-8"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Light/dark switch shared with the workspace header (same preference, same icons). */
function ThemeToggle() {
  const [dark, toggle] = useDarkTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      onClick={toggle}
    >
      {dark ? (
        <Sun weight="duotone" aria-hidden="true" />
      ) : (
        <Moon weight="duotone" aria-hidden="true" />
      )}
    </button>
  );
}

function sectionOf(pathname: string): string {
  return pathname.split("/")[1] ?? "";
}

function SiteHeader() {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const current = sectionOf(pathname);
  const [ctaStart, ctaEnd] = siteConfig.header_cta.label.split(" Governance ");

  useEffect(() => {
    setNavOpen(false);
    setOpenSection(null);
  }, [pathname]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenSection(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSection(null);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label="VERITRAIL home">
          <BrandMark />
          <span className="brand-name">VERITRAIL</span>
        </Link>
        <SiteLink className="btn btn-primary header-cta" href={siteConfig.header_cta.url}>
          {ctaEnd !== undefined ? (
            <>
              {ctaStart}
              <span className="cta-optional">&nbsp;Governance</span>&nbsp;{ctaEnd}
            </>
          ) : (
            siteConfig.header_cta.label
          )}
        </SiteLink>
        <ThemeToggle />
        <Button
          variant="outline"
          className="nav-toggle"
          type="button"
          aria-expanded={navOpen}
          aria-controls="site-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
          <span className="nav-toggle-label">Menu</span>
        </Button>
        <nav id="site-nav" className={`site-nav${navOpen ? " is-open" : ""}`} aria-label="Primary">
          <ul className="nav-list">
            {siteNav.map((sec) => (
              <li className="nav-item" key={sec.id}>
                <details
                  className={`nav-disclosure${sec.id === current ? " is-current-section" : ""}`}
                  open={openSection === sec.id}
                  onToggle={(e) => {
                    const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                    setOpenSection((s) => (isOpen ? sec.id : s === sec.id ? null : s));
                  }}
                >
                  <summary className="nav-summary">{sec.label}</summary>
                  <ul className={"nav-sub" + (sec.id === "workspace" ? " nav-sub-workspace" : "")}>
                    {sec.items.map((item) => (
                      <li key={item.url}>
                        <Link
                          to={item.url}
                          aria-current={item.url === pathname ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (!crumbs.length) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <div className="container">
        <ol>
          {crumbs.map((c, i) => (
            <li key={i}>
              {c.current && c.url ? (
                <Link to={c.url} aria-current="page">
                  {c.label}
                </Link>
              ) : c.url ? (
                <Link to={c.url}>{c.label}</Link>
              ) : (
                <span>{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {footerColumns.map((col) => (
            <div className="footer-col" key={col.label}>
              <h2 className="footer-heading">{col.label}</h2>
              <ul>
                {col.items.map((item) => (
                  <li key={item.url}>
                    <Link to={item.url}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-col footer-newsletter">
            <h2 className="footer-heading" id="newsletter-heading">
              Governance briefing
            </h2>
            <p>
              A short, occasional note on AI governance practice and regulatory developments. No
              tracking pixels.
            </p>
            <LeadForm form="newsletter" compact />
          </div>
        </div>
        <aside className="footer-disclaimer" aria-label="Disclaimer">
          <p>{STANDARD_DISCLAIMER}</p>
        </aside>
        <div className="footer-meta">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.organization.name}
          </p>
          <ul className="footer-links">
            {siteConfig.footer_links.map((l) => (
              <li key={l.url}>
                <SiteLink href={l.url}>{l.label}</SiteLink>
              </li>
            ))}
            <li>
              <SiteLink href="/about">About</SiteLink>
            </li>
            <li>
              <Link to="/workspace">Governance workspace</Link>
            </li>
            <li>
              <a href="/sitemap.xml">Sitemap</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  usePageViewTracking();
  // Move focus to <main> after client-side navigation so screen readers announce the new page.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <div className="veritrail-site">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} ref={mainRef}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
