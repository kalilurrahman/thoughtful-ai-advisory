import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Mono meta line under the rule; the first item sits left, the rest wrap to the right. */
  meta?: ReactNode[];
  actions?: ReactNode;
  /** Heading level: the workspace shell already renders the page <h1>. */
  as?: "h1" | "h2";
  className?: string;
}

/** Overline → serif title (+ action right, wrapping under on phones) → double rule → meta. */
export function PageHeader({
  eyebrow,
  title,
  meta = [],
  actions,
  as: Heading = "h1",
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("assurance-page-header flex flex-col gap-2.5", className)}>
      {eyebrow && (
        <span className="font-mono text-[11px] font-medium uppercase leading-[1.3] tracking-[0.1em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading className="m-0 font-serif text-[clamp(32px,1.4vw+24px,46px)] font-semibold leading-[1.1] tracking-[-0.01em] text-foreground">
          {title}
        </Heading>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div aria-hidden="true" className="border-b-4 border-double border-rule" />
      {meta.length > 0 && (
        <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] font-medium uppercase leading-[1.3] tracking-[0.1em] text-muted-foreground">
          {meta.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      )}
    </header>
  );
}
