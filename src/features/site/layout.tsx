import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { usePageViewTracking } from "../platform/analytics";
import { STANDARD_DISCLAIMER, siteConfig } from "./content";
import { LeadForm } from "./forms";
import { footerColumns, siteNav, type Crumb } from "./pages";
import { SiteLink } from "./ui";
import { ArrowLeft, ArrowUp, List, Palette, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/features/pwa/pwa-layer";
import { SearchButton } from "@/features/search/search-palette";
import {
  AppearanceButton,
  openAppearance,
  useAppearanceSummary,
} from "@/features/appearance/appearance-panel";
import { GlossaryTip } from "./glossary-tip";

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

/** On phones the appearance settings live in the menu, so the header fits on one row. */
function MenuAppearanceRow() {
  const summary = useAppearanceSummary();
  return (
    <p className="nav-theme-row">
      <button
        type="button"
        className="nav-theme-btn"
        data-cta="appearance-menu"
        onClick={openAppearance}
      >
        <Palette weight="duotone" aria-hidden="true" />
        <span className="nav-theme-text">
          Appearance
          <span className="nav-theme-summary">{summary}</span>
        </span>
      </button>
    </p>
  );
}

function sectionOf(pathname: string): string {
  return pathname.split("/")[1] ?? "";
}

/** Back button for the installed app, which has no browser toolbar (shown only when standalone). */
function StandaloneBack() {
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  return (
    <button
      type="button"
      className="standalone-back"
      aria-label="Back"
      onClick={() => window.history.back()}
    >
      <ArrowLeft weight="bold" aria-hidden="true" />
    </button>
  );
}

function SiteHeader() {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
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
      if (e.key !== "Escape") return;
      setOpenSection(null);
      setNavOpen(false);
    };
    // The sticky header gains a shadow once the page scrolls under it.
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`} ref={headerRef}>
      <div className="container header-inner">
        <StandaloneBack />
        <Link className="brand" to="/" aria-label="VERITRAIL home">
          <BrandMark />
          <span className="brand-name">VERITRAIL</span>
        </Link>
        <SiteLink
          className="btn btn-primary header-cta"
          href={siteConfig.header_cta.url}
          cta="header-baseline"
        >
          {ctaEnd !== undefined ? (
            <>
              {ctaStart}
              <span className="cta-optional">&nbsp;Governance</span>&nbsp;{ctaEnd}
            </>
          ) : (
            siteConfig.header_cta.label
          )}
        </SiteLink>
        <SearchButton className="header-search" />
        <InstallAppButton className="header-install" />
        <AppearanceButton className="theme-toggle header-theme" cta="appearance-header" />
        <Button
          variant="outline"
          className="nav-toggle"
          type="button"
          aria-expanded={navOpen}
          aria-controls="site-nav"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          onClick={() => setNavOpen((o) => !o)}
        >
          {navOpen ? (
            <X weight="bold" aria-hidden="true" />
          ) : (
            <List weight="bold" aria-hidden="true" />
          )}
          <span className="nav-toggle-label" aria-hidden="true">
            Menu
          </span>
        </Button>
        <nav id="site-nav" className={`site-nav${navOpen ? " is-open" : ""}`} aria-label="Primary">
          <p className="nav-mobile-cta">
            <SiteLink
              className="btn btn-primary"
              href={siteConfig.header_cta.url}
              cta="menu-baseline"
            >
              {siteConfig.header_cta.label}
            </SiteLink>
          </p>
          <MenuAppearanceRow />
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

/** Thin bar along the top of the window showing how far through a long page the reader is. */
function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      barRef.current?.style.setProperty("--progress", String(ratio));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return <div className="reading-progress" ref={barRef} aria-hidden="true" />;
}

/** Appears after a screen and a half of scrolling on long pages. */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`back-to-top${visible ? " is-visible" : ""}`}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        document.getElementById("main")?.focus({ preventScroll: true });
      }}
    >
      <ArrowUp weight="bold" aria-hidden="true" />
    </button>
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
              <Link to="/glossary">Glossary</Link>
            </li>
            <li>
              <a href="/sitemap.xml">Sitemap</a>
            </li>
            <li>
              <InstallAppButton className="footer-install" />
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
  // Printed pages (and "Save as PDF") include every FAQ answer, not just the open ones.
  useEffect(() => {
    const openAll = () =>
      document.querySelectorAll<HTMLDetailsElement>(".faq-item").forEach((d) => (d.open = true));
    window.addEventListener("beforeprint", openAll);
    return () => window.removeEventListener("beforeprint", openAll);
  }, []);
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
      {pathname !== "/" && <ReadingProgress key={pathname} />}
      <main id="main" tabIndex={-1} ref={mainRef}>
        {children}
      </main>
      <SiteFooter />
      <BackToTop />
      <GlossaryTip />
    </div>
  );
}
