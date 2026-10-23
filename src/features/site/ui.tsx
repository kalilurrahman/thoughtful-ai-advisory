import { Link } from "@tanstack/react-router";
import {
  STANDARD_DISCLAIMER,
  controlLibrary,
  controlMappings,
  controlUrl,
  getControl,
  getPillar,
  siteConfig,
  type EvidenceStatus,
} from "./content";

const badgeClass: Record<string, string> = {
  Verified: "badge badge-verified",
  "User-asserted": "badge badge-asserted",
  Inferred: "badge badge-inferred",
  "Missing evidence": "badge badge-missing",
  "Critical gap": "badge badge-critical",
};

/** Evidence-status label shown next to every VERITRAIL finding. */
export function EvidenceBadge({ status }: { status: EvidenceStatus | string }) {
  return <span className={badgeClass[status] ?? "badge"}>{status}</span>;
}

export function Disclaimer({ text = STANDARD_DISCLAIMER }: { text?: string }) {
  return (
    <aside className="disclaimer" aria-label="Disclaimer">
      <p>
        <strong>Important:</strong> {text}
      </p>
    </aside>
  );
}

/** Same-site links render through the router; everything else is a plain anchor. */
export function SiteLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/") && !href.startsWith("/downloads/")) {
    const [path = "/", hash] = normalizeHref(href).split("#");
    return hash ? (
      <Link to={path} hash={hash} className={className}>
        {children}
      </Link>
    ) : (
      <Link to={path} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Drop the static site's trailing slashes (/tools/risk-triage/ -> /tools/risk-triage). */
export function normalizeHref(href: string): string {
  const [path = "", hash] = href.split("#");
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return hash ? `${clean}#${hash}` : clean;
}

export function CtaBlock({ ctaKey, variant = "inline" }: { ctaKey: string; variant?: string }) {
  const cta = siteConfig.ctas[ctaKey];
  if (!cta) return null;
  const primary = ctaKey === "assessment" || ctaKey === "baseline";
  return (
    <aside className={`cta-block cta-block--${variant}`} aria-label={cta.title}>
      <h2 className="cta-title">{cta.title}</h2>
      <p className="cta-text">{cta.text}</p>
      <p className="cta-action">
        <SiteLink href={cta.url} className={`btn ${primary ? "btn-primary" : "btn-secondary"}`}>
          {cta.label}
        </SiteLink>
      </p>
    </aside>
  );
}

/** The `{{controls:ID,ID}}` citation block. Unknown IDs are skipped. */
export function ControlCitations({
  ids,
  label = "VERITRAIL controls cited",
}: {
  ids: string[];
  label?: string;
}) {
  const list = [...new Set(ids.map((i) => i.trim().toUpperCase()))]
    .map((id) => getControl(id))
    .filter((c) => c !== undefined);
  if (!list.length) return null;
  return (
    <div className="control-citations">
      <p className="control-citations-label">{label}</p>
      <ul className="control-list">
        {list.map((c) => {
          const maps = controlMappings(c).filter((m) => m.refs.length);
          return (
            <li className="control-item" key={c.id}>
              <Link className="control-link" to={controlUrl(c.id)}>
                <span className="control-id">{c.id}</span>{" "}
                <span className="control-title">{c.title}</span>
              </Link>
              <span className="control-meta">
                {getPillar(c.pillar)?.name} · priority: {c.priority}
              </span>
              {maps.length > 0 && (
                <span className="control-mappings">
                  {maps.map((m, i) => (
                    <span key={m.framework} className="mapping">
                      <span className="mapping-fw">{m.framework}:</span> {m.refs.join(", ")}
                      {i < maps.length - 1 && <span aria-hidden="true"> · </span>}
                    </span>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="control-citations-note">
        Framework mappings are indicative VERITRAIL interpretations (Control Library v
        {controlLibrary.version}); they are not legal advice and do not establish conformity or
        compliance.
      </p>
    </div>
  );
}

/** Inline list of control links, e.g. "VERITRAIL controls cited: IS-11, IS-13". */
export function ControlLinks({ ids, prefix }: { ids: string[]; prefix?: string }) {
  const known = [...new Set(ids)].filter((id) => getControl(id));
  if (!known.length) return null;
  return (
    <p className="cite">
      {prefix}
      {known.map((id, i) => (
        <span key={id}>
          <Link to={controlUrl(id)} title={getControl(id)?.title}>
            {id}
          </Link>
          {i < known.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
  );
}
