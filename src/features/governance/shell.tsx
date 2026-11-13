import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  House,
  ListChecks,
  Stack,
  Path,
  DotsThreeCircle,
  ArrowLeft,
  Export,
  ShieldCheck,
  TrafficSignal,
  Calculator,
  Books,
  BookOpen,
  Tag,
  Palette,
  ClipboardText,
  ArrowsClockwise,
  Gauge,
  Sparkle,
  ChatCircleText,
  DotsThreeVertical,
  DownloadSimple,
  MagnifyingGlass,
  GameController,
  SealCheck,
  Globe,
  type IconProps,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { openSearch } from "@/features/search/search-palette";
import { InstallButton } from "./install-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { requestInstall, useInstallState } from "@/features/pwa/install-store";
import { openAppearance } from "@/features/appearance/appearance-panel";
import { useGovernance } from "./store";
import { VeritrailMark } from "@/features/site/brand-marks";

// The workspace shell (docs/design/assurance/README.md §3.1): a command-navy sidebar from
// 1024px, the same sidebar as a 72px icon rail from 640px, and a four-item bottom navigation on
// phones; a sticky translucent top bar with the ⌘K search, the organisation overline and the
// workspace chip. Every destination of the old shell is still here: the primary tabs, the
// Assurance studio screens, "Workspace & account" (/more) and the "More actions" menu.

type Icon = ComponentType<IconProps>;
type NavItem = { to: string; name: string; label?: string; icon: Icon };

/** Primary destinations: the sidebar's first group and, bar Roadmap, the phone bottom nav. */
const tabs: readonly NavItem[] = [
  { to: "/workspace", name: "Overview", icon: House },
  { to: "/assess", name: "Assess", label: "TILLER assessment", icon: ListChecks },
  { to: "/inventory", name: "Systems", label: "AI inventory", icon: Stack },
  { to: "/export", name: "Evidence", label: "Reports & audit pack", icon: SealCheck },
  { to: "/roadmap", name: "Roadmap", icon: Path },
  { to: "/more", name: "More", label: "Workspace & account", icon: DotsThreeCircle },
];
/** The four phone tabs (README §3.1); Roadmap and More stay one tap away in the menu. */
const PHONE_TABS = new Set(["/workspace", "/assess", "/inventory", "/export"]);
const titles: Record<string, string> = {
  "/workspace": "Governance overview",
  "/assess": "TILLER assessment",
  "/inventory": "AI inventory",
  "/roadmap": "Roadmap",
  "/more": "More",
  "/gates": "Release readiness",
  "/guardrails": "Guardrails designer",
  "/calculators": "Calculators",
  "/knowledge": "Knowledge hub",
  "/playbook": "AI Governance Playbook",
  "/templates": "Governance Templates",
  "/incidents": "AI incidents & near misses",
  "/decisions": "Governance decisions",
  "/changes": "AI change reviews",
  "/monitoring": "AI system monitoring",
  "/actions": "Corrective actions",
  "/advisor": "AI governance advisor",
  "/assistant": "Site assistant",
  "/checklist": "Governance lifecycle checklist",
  "/games": "AI Governance Games",
  "/academy": "Governance Learning Arcade",
  "/start": "Start here",
  "/export": "Reports & audit pack",
  "/plans": "Plans",
  "/invite": "Join a workspace",
};
const studioTabs: readonly NavItem[] = [
  { to: "/gates", name: "Release readiness", icon: TrafficSignal },
  { to: "/guardrails", name: "Guardrails", icon: ShieldCheck },
  { to: "/calculators", name: "Calculators", icon: Calculator },
  { to: "/knowledge", name: "Knowledge hub", icon: Books },
  { to: "/playbook", name: "AI Playbook", icon: BookOpen },
  { to: "/templates", name: "Templates", icon: Books },
  { to: "/incidents", name: "Incidents", icon: TrafficSignal },
  { to: "/actions", name: "Corrective actions", icon: ListChecks },
  { to: "/advisor", name: "AI advisor", icon: Sparkle },
  { to: "/assistant", name: "Assistant", icon: ChatCircleText },
  { to: "/decisions", name: "Decisions", icon: ClipboardText },
  { to: "/changes", name: "Change reviews", icon: ArrowsClockwise },
  { to: "/monitoring", name: "Monitoring", icon: Gauge },
  { to: "/checklist", name: "Lifecycle checklist", icon: ListChecks },
  { to: "/games", name: "Games & practice", icon: GameController },
  { to: "/academy", name: "Learning Arcade", icon: BookOpen },
  { to: "/start", name: "Start here", icon: Path },
  { to: "/plans", name: "Plans", icon: Tag },
];

/** The sidebar brand: the shield mark, with the wordmark on the full sidebar. */
function Brand({ className }: { className?: string }) {
  return (
    <Link to="/workspace" className={className ?? "sidebar-brand"} aria-label="VERITRAIL overview">
      <VeritrailMark size={28} className="sidebar-mark" />
      <span className="sidebar-wordmark">
        VERITRAIL<small>Governance &amp; assurance</small>
      </span>
    </Link>
  );
}

function SidebarLink({
  item,
  current,
  count,
  alert,
}: {
  item: NavItem;
  current: boolean;
  count?: number | undefined;
  alert?: boolean | undefined;
}) {
  const label = item.label ?? item.name;
  return (
    <Link
      to={item.to}
      className={"sidebar-link" + (current ? " active" : "")}
      aria-current={current ? "page" : undefined}
      title={label}
    >
      <item.icon weight={current ? "fill" : "regular"} aria-hidden="true" />
      <span className="sidebar-text">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={"sidebar-count" + (alert ? " alert" : "")} aria-label={`${count}`}>
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * Search, appearance, export, the public website and install in one menu, so the header stays
 * a single row on phones (the same actions sit inline in the header from 640px up). Roadmap and
 * "Workspace & account" are here too, because the phone bottom nav has four items.
 */
function HeaderOverflowMenu() {
  const { canInstall } = useInstallState();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="header-overflow" aria-label="More actions">
          <DotsThreeVertical weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="header-menu">
        <DropdownMenuItem onSelect={openSearch}>
          <MagnifyingGlass weight="duotone" /> Search
        </DropdownMenuItem>
        <DropdownMenuItem data-cta="appearance-menu" onSelect={openAppearance}>
          <Palette weight="duotone" /> Appearance
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/export">
            <Export weight="duotone" /> Reports &amp; audit pack
          </Link>
        </DropdownMenuItem>
        {canInstall && (
          <DropdownMenuItem data-cta="pwa-install-menu" onSelect={() => void requestInstall()}>
            <DownloadSimple weight="duotone" /> Install the app
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/roadmap">
            <Path weight="duotone" /> Roadmap
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/more">
            <DotsThreeCircle weight="duotone" /> Workspace &amp; account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/">
            <Globe weight="duotone" /> Public website
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GovernanceShell({ children }: { children: ReactNode }) {
  const { workspaceName, userId, state, blocking } = useGovernance();
  const { pathname } = useLocation();
  if (pathname === "/onboarding")
    return <main className="veritrail-app onboarding-app">{children}</main>;
  const isPrimary = tabs.some((t) => t.to === pathname);
  const counts: Record<string, { count: number; alert?: boolean }> = {
    "/assess": { count: blocking.length, alert: true },
    "/inventory": { count: state.systems.length },
    "/incidents": {
      count: state.incidents.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length,
      alert: true,
    },
    "/actions": {
      count: state.correctiveActions.filter((a) => a.status !== "Closed").length,
    },
  };
  const mode = userId ? "Personal workspace" : "Demo workspace";
  return (
    <div className="veritrail-app">
      <aside className="desktop-sidebar">
        <Brand />
        <p className="sidebar-label">Workspace</p>
        <nav aria-label="Workspace navigation">
          {tabs.map((t) => (
            <SidebarLink
              key={t.to}
              item={t}
              current={pathname === t.to}
              count={counts[t.to]?.count}
              alert={counts[t.to]?.alert}
            />
          ))}
        </nav>
        <p className="sidebar-label">Assurance studio</p>
        <nav aria-label="Studio navigation">
          {studioTabs.map((t) => (
            <SidebarLink
              key={t.to}
              item={t}
              current={pathname === t.to}
              count={counts[t.to]?.count}
              alert={counts[t.to]?.alert}
            />
          ))}
        </nav>
        <div className="sidebar-footer" title={`${workspaceName} · ${mode}`}>
          <ShieldCheck weight="duotone" aria-hidden="true" />
          <span className="sidebar-text">
            <span className="sidebar-org">{workspaceName}</span>
            <small>{mode} · NIST AI RMF · GOVERN · MAP · MEASURE · MANAGE</small>
          </span>
        </div>
      </aside>
      <header className="app-header">
        {!isPrimary && (
          <Button
            size="icon"
            variant="ghost"
            asChild
            aria-label="Back to more"
            className="header-back"
          >
            <Link to="/more">
              <ArrowLeft weight="bold" />
            </Link>
          </Button>
        )}
        <Link to="/workspace" className="wordmark header-brand" aria-label="VERITRAIL overview">
          <VeritrailMark size={22} className="header-mark" />
          <span>VERITRAIL</span>
        </Link>
        <button
          type="button"
          className="header-search-field"
          aria-label="Search (press / or Ctrl K)"
          onClick={openSearch}
        >
          <MagnifyingGlass weight="bold" aria-hidden="true" />
          <span className="header-search-text">Search controls, systems, pages…</span>
          <kbd aria-hidden="true">⌘K</kbd>
        </button>
        <span className="client-name" title={workspaceName}>
          {workspaceName}
        </span>
        <span className="workspace-badge">{userId ? "Personal" : "Demo"}</span>
        <div className="header-actions">
          <InstallButton />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Appearance: theme, mode and font"
            data-cta="appearance-header"
            onClick={openAppearance}
          >
            <Palette weight="duotone" />
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Export reports">
            <Link to="/export">
              <Export weight="duotone" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="VERITRAIL public website">
            <Link to="/">
              <Globe weight="duotone" />
            </Link>
          </Button>
        </div>
        <HeaderOverflowMenu />
      </header>
      <main className={"app-content page-" + (pathname.slice(1) || "home")}>
        <h1 className="screen-title">{titles[pathname] ?? "VERITRAIL"}</h1>
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs
          .filter((t) => PHONE_TABS.has(t.to))
          .map((t) => {
            const current = pathname === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={"tab-link " + (current ? "active" : "")}
                aria-current={current ? "page" : undefined}
              >
                <t.icon weight={current ? "fill" : "regular"} aria-hidden="true" />
                <span>{t.name}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
