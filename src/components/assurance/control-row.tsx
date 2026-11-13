import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "./status-badge";

export interface ControlRowProps {
  code: string;
  text: string;
  weight?: string | undefined;
  owner?: string | undefined;
  status?: StatusTone | undefined;
  statusLabel?: ReactNode;
  evidence?: string | undefined;
  refs?: string[] | undefined;
  onClick?: (() => void) | undefined;
  selected?: boolean | undefined;
  className?: string | undefined;
}

/**
 * One control in a register or assessment list: mono code column, question, caption meta and
 * the status badge. Selected rows get the selected surface and a 3px inset brand bar.
 */
export function ControlRow({
  code,
  text,
  weight,
  owner,
  status = "untested",
  statusLabel,
  evidence,
  refs = [],
  onClick,
  selected = false,
  className,
}: ControlRowProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3.5 border-b border-row-rule px-4 py-3.5 text-left",
        onClick &&
          "cursor-pointer hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected && "bg-accent shadow-[inset_3px_0_0_var(--primary)]",
        className,
      )}
    >
      <span className="pt-0.5 font-mono text-[13px] font-medium leading-[1.35] text-primary">
        {code}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-medium leading-[1.45] text-foreground">{text}</span>
        {(weight || owner || evidence || refs.length > 0) && (
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-[1.45] text-muted-foreground">
            {weight && <span>{weight}</span>}
            {owner && <span>{owner}</span>}
            {evidence && <span>Evidence · {evidence}</span>}
            {refs.slice(0, 2).map((r) => (
              <span key={r} className="font-mono text-[11px]">
                {r}
              </span>
            ))}
          </span>
        )}
      </span>
      <StatusBadge tone={status}>{statusLabel}</StatusBadge>
    </Tag>
  );
}
