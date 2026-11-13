import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Colour family of a tile, a bar or a banner: the brand teal or a status family. */
export type Tone = "brand" | "success" | "warning" | "danger" | "seal" | "neutral";

export const TONE_TEXT: Record<Tone, string> = {
  brand: "text-primary",
  success: "text-success-ink",
  warning: "text-warning-ink",
  danger: "text-danger-ink",
  seal: "text-seal-ink",
  neutral: "text-muted-foreground",
};

export const TONE_BORDER: Record<Tone, string> = {
  brand: "border-t-primary",
  success: "border-t-success-ink",
  warning: "border-t-warning-ink",
  danger: "border-t-danger-ink",
  seal: "border-t-seal",
  neutral: "border-t-muted-foreground",
};

export const TONE_FILL: Record<Tone, string> = {
  brand: "bg-primary",
  success: "bg-success-ink",
  warning: "bg-warning-ink",
  danger: "bg-danger-ink",
  seal: "bg-seal",
  neutral: "bg-muted-foreground",
};

export interface KpiTileProps {
  value: ReactNode;
  unit?: string;
  label: string;
  tone?: Tone;
  icon?: ReactNode;
  delta?: string;
  className?: string;
}

/** Headline metric: 3px top rule in the tone, serif value, label and a mono delta line. */
export function KpiTile({
  value,
  unit,
  label,
  tone = "brand",
  icon,
  delta,
  className,
}: KpiTileProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-card border border-border border-t-[3px] bg-card px-[18px] py-4 shadow-[var(--workspace-shadow)]",
        TONE_BORDER[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "font-serif text-[clamp(32px,2.2vw+20px,44px)] font-semibold leading-none tabular-nums",
            TONE_TEXT[tone],
          )}
        >
          {value}
          {unit && <span className="ml-0.5 text-[0.45em] text-muted-foreground">{unit}</span>}
        </span>
        {icon && (
          <span aria-hidden="true" className={cn("shrink-0 [&_svg]:size-5", TONE_TEXT[tone])}>
            {icon}
          </span>
        )}
      </div>
      <span className="text-[13px] font-medium leading-[1.35] text-card-foreground">{label}</span>
      {delta && (
        <span className="font-mono text-[11px] leading-[1.35] text-muted-foreground">{delta}</span>
      )}
    </div>
  );
}
