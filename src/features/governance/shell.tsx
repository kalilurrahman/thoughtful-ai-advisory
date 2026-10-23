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
  Moon,
  Sun,
  ClipboardText,
  ArrowsClockwise,
  Gauge,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useDarkTheme } from "@/lib/theme";
import { useGovernance } from "./store";
const tabs = [
  { to: "/workspace", name: "Home", icon: House },
  { to: "/assess", name: "TILLER", icon: ListChecks },
  { to: "/inventory", name: "Inventory", icon: Stack },
  { to: "/roadmap", name: "Roadmap", icon: Path },
  { to: "/more", name: "More", icon: DotsThreeCircle },
] as const;
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
  "/checklist": "Governance lifecycle checklist",
  "/start": "Start here",
  "/export": "Reports & audit pack",
  "/plans": "Plans",
};
const studioTabs = [
  { to: "/gates", name: "Release readiness", icon: TrafficSignal },
  { to: "/guardrails", name: "Guardrails", icon: ShieldCheck },
  { to: "/calculators", name: "Calculators", icon: Calculator },
  { to: "/knowledge", name: "Knowledge hub", icon: Books },
  { to: "/playbook", name: "AI Playbook", icon: BookOpen },
  { to: "/templates", name: "Templates", icon: Books },
  { to: "/incidents", name: "Incidents", icon: TrafficSignal },
  { to: "/actions", name: "Corrective actions", icon: ListChecks },
  { to: "/decisions", name: "Decisions", icon: ClipboardText },
  { to: "/changes", name: "Change reviews", icon: ArrowsClockwise },
  { to: "/monitoring", name: "Monitoring", icon: Gauge },
  { to: "/checklist", name: "Lifecycle checklist", icon: ListChecks },
  { to: "/start", name: "Start here", icon: Path },
  { to: "/export", name: "Reports & audit pack", icon: Export },
  { to: "/plans", name: "Plans", icon: Tag },
] as const;
export function GovernanceShell({ children }: { children: ReactNode }) {
  const { workspaceName, userId } = useGovernance();
  const { pathname } = useLocation();
  const [dark, toggleDark] = useDarkTheme();
  if (pathname === "/onboarding")
    return <main className="veritrail-app onboarding-app">{children}</main>;
  const active = tabs.find((t) => t.to === pathname)?.to ?? "/more";
  return (
    <div className="veritrail-app">
      <aside className="desktop-sidebar">
        <Link to="/workspace" className="sidebar-brand">
          <ShieldCheck weight="duotone" />
          <span>
            VERITRAIL<small>Governance & assurance</small>
          </span>
        </Link>
        <p className="kicker sidebar-label">Workspace</p>
        <nav aria-label="Workspace navigation">
          {tabs.map((t) => (
            <Button
              key={t.to}
              variant="ghost"
              asChild
              className={"sidebar-link " + (pathname === t.to ? "active" : "")}
            >
              <Link to={t.to} aria-current={pathname === t.to ? "page" : undefined}>
                <t.icon weight="duotone" />
                {t.name === "Home"
                  ? "Overview"
                  : t.name === "More"
                    ? "Workspace & account"
                    : t.name === "TILLER"
                      ? "TILLER assessment"
                      : t.name}
              </Link>
            </Button>
          ))}
        </nav>
        <p className="kicker sidebar-label">Assurance studio</p>
        <nav aria-label="Studio navigation">
          {studioTabs.map((t) => (
            <Button
              key={t.to}
              variant="ghost"
              asChild
              className={"sidebar-link " + (pathname === t.to ? "active" : "")}
            >
              <Link to={t.to} aria-current={pathname === t.to ? "page" : undefined}>
                <t.icon weight="duotone" />
                {t.name}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck weight="duotone" />
          <span>
            NIST AI RMF<small>GOVERN · MAP · MEASURE · MANAGE</small>
          </span>
        </div>
      </aside>
      <header className="app-header">
        {active === "/more" && pathname !== "/more" && (
          <Button size="icon" variant="ghost" asChild aria-label="Back to more">
            <Link to="/more">
              <ArrowLeft weight="duotone" />
            </Link>
          </Button>
        )}
        <Link to="/workspace" className="wordmark">
          VERITRAIL
        </Link>
        <Button asChild variant="ghost" size="icon" aria-label="VERITRAIL public website">
          <Link to="/">
            <House weight="duotone" />
          </Link>
        </Button>
        <span className="client-name">{workspaceName}</span>
        <span className="workspace-badge">{userId ? "Personal workspace" : "Demo workspace"}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={dark ? "Use light theme" : "Use dark theme"}
          onClick={toggleDark}
        >
          {dark ? <Sun weight="duotone" /> : <Moon weight="duotone" />}
        </Button>
        <Button asChild variant="ghost" size="icon" aria-label="Export reports">
          <Link to="/export">
            <Export weight="duotone" />
          </Link>
        </Button>
      </header>
      <main className={"app-content page-" + (pathname.slice(1) || "home")}>
        <h1 className="screen-title">{titles[pathname] ?? "VERITRAIL"}</h1>
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map((t) => (
          <Button
            key={t.to}
            variant="ghost"
            className={"tab-link " + (active === t.to ? "active" : "")}
            asChild
          >
            <Link to={t.to} aria-current={active === t.to ? "page" : undefined}>
              <t.icon weight="duotone" />
              <span>{t.name}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
}
