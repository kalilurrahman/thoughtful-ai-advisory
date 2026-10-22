import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { Breadcrumbs } from "@/features/site/layout";
import { ToolLoading, siteHead } from "@/features/site/views";
import { Disclaimer } from "@/features/site/ui";
import { PLATFORM_TOOLS, getPlatformTool, type PlatformTool } from "./catalog";
import { PLATFORM_COMPONENTS } from "./registry";

const RUNTIME_LABEL: Record<PlatformTool["runtime"], string> = {
  browser: "Runs in your browser",
  server: "Runs on the server",
  "browser + server": "Browser + server functions",
};

export function PlatformIndexView() {
  return (
    <div className="tpl-platform">
      <Breadcrumbs crumbs={[{ label: "Home", url: "/" }, { label: "Platform", url: "/platform", current: true }]} />
      <div className="page-header">
        <div className="container">
          <h1>AEGIS Platform console</h1>
          <p className="lead">
            The AEGIS platform engines — the agent, the runtime policy engine, the pilot rehearsal, reports and the
            admin tools — running directly on this site. Nothing needs to be installed.
          </p>
        </div>
      </div>
      <div className="container page-body">
        <div className="prose">
          <p>
            These modules were originally Python command-line tools. They now run as TypeScript in your browser (or
            as server functions where data is shared), and they are tested against the Python reference
            implementation. Demo data stays in your browser unless a module says otherwise.
          </p>
        </div>
        <div className="table-wrap" role="region" tabIndex={0} aria-label="Platform modules">
          <table>
            <thead>
              <tr>
                <th scope="col">Module</th>
                <th scope="col">What it does</th>
                <th scope="col">Runs</th>
                <th scope="col">Replaces</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_TOOLS.map((t) => (
                <tr key={t.slug}>
                  <th scope="row">
                    <Link to="/platform/$tool" params={{ tool: t.slug }}>
                      {t.title}
                    </Link>
                    {t.restricted && <span className="small"> (sign-in required)</span>}
                  </th>
                  <td>{t.summary}</td>
                  <td>{RUNTIME_LABEL[t.runtime]}</td>
                  <td>
                    <code className="small">{t.python.join(", ")}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Disclaimer />
      </div>
    </div>
  );
}

export function PlatformToolView({ slug }: { slug: string }) {
  const tool = getPlatformTool(slug);
  if (!tool) return null;
  const Component = PLATFORM_COMPONENTS[slug];
  return (
    <div className={`tpl-platform-tool tool-${slug}`}>
      <Breadcrumbs
        crumbs={[
          { label: "Home", url: "/" },
          { label: "Platform", url: "/platform" },
          { label: tool.title, url: `/platform/${slug}`, current: true },
        ]}
      />
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">{RUNTIME_LABEL[tool.runtime]}</p>
          <h1>{tool.title}</h1>
          <p className="lead">{tool.summary}</p>
        </div>
      </div>
      <div className="container page-body">
        {Component && (
          <Suspense fallback={<ToolLoading />}>
            <Component />
          </Suspense>
        )}
        <p className="page-updated">
          Hosted port of <code>{tool.python.join(", ")}</code> from the AEGIS Python platform.
        </p>
      </div>
    </div>
  );
}

export const platformIndexHead = () =>
  siteHead({
    title: "AEGIS Platform console",
    description:
      "Run the AEGIS Agent, runtime policy simulator, pilot dress rehearsal, ROI calculator, sample reports, content checks and admin tools in the browser.",
  });

export function platformToolHead(slug: string) {
  const t = getPlatformTool(slug);
  return t
    ? siteHead({ title: `${t.title} — AEGIS Platform`, description: t.summary, noindex: t.restricted ?? false })
    : siteHead({ title: "Not found", description: "Unknown platform module.", noindex: true });
}
