import { ArrowRight, ClipboardCheck, ShieldCheck, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLink } from "./ui";

const SERVICE_PATHWAYS = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Governance & advisory",
    description:
      "Establish ownership, assess maturity and turn policy into an actionable operating model.",
    deliverables: "Baseline · AI inventory · Remediation roadmap",
    href: "/contact/book-governance-baseline",
    action: "Explore the governance baseline",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Risk & control implementation",
    description:
      "Connect risk decisions to lifecycle controls, human oversight and agent safeguards.",
    deliverables: "Risk assessment · Control library · Runtime policy",
    href: "/solutions/control",
    action: "Explore governance controls",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Assurance & readiness",
    description:
      "Organize control evidence, review gaps and prepare clear reporting for leadership and audit.",
    deliverables: "Control testing · Evidence packs · Readiness reviews",
    href: "/solutions/assurance",
    action: "Explore assurance",
  },
] as const;

export function ServicePathways() {
  return (
    <section
      className="border-b border-border bg-background py-12 md:py-16"
      aria-labelledby="service-pathways-title"
    >
      <div className="container">
        <header className="mb-8 max-w-2xl">
          <p className="eyebrow">Services & expertise</p>
          <h2 id="service-pathways-title" className="!mt-0 !text-3xl">
            From governance intent to assurance evidence
          </h2>
          <p className="text-muted-foreground">
            Three connected disciplines. One evidence-first approach to responsible AI.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {SERVICE_PATHWAYS.map(
            ({ number, icon: Icon, title, description, deliverables, href, action }) => (
              <article
                key={number}
                className="flex min-w-0 flex-col border-t-2 border-primary pt-5"
              >
                <div className="flex items-center justify-between text-primary">
                  <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
                  <span className="font-mono text-sm text-muted-foreground">{number}</span>
                </div>
                <h3 className="!mt-4">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
                <p className="mt-auto border-t border-border pt-4 text-sm text-muted-foreground">
                  {deliverables}
                </p>
                <Button
                  asChild
                  variant="link"
                  className="h-auto min-h-11 justify-start whitespace-normal px-0 text-left"
                >
                  <SiteLink href={href}>
                    {action}
                    <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
                  </SiteLink>
                </Button>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
