import { cn } from "@/lib/utils";
import { TONE_FILL, TONE_TEXT, type Tone } from "./kpi-tile";

export interface PillarScoreProps {
  letter: string;
  name: string;
  /** NIST AI RMF function shown as an overline (GOVERN, MAP, MEASURE, MANAGE). */
  fn: string;
  score: number;
  target: number;
  /** Overrides the tone derived from the distance to the target. */
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}

/** Distance to target: more than 20 under is a gap, under is partial, at or over is effective. */
export function pillarTone(score: number, target: number): Tone {
  return score < target - 20 ? "danger" : score < target ? "warning" : "success";
}

/** Letter, name and NIST function over a 6px track with a 2×14px target tick. */
export function PillarScore({
  letter,
  name,
  fn,
  score,
  target,
  tone,
  onClick,
  className,
}: PillarScoreProps) {
  const t = tone ?? pillarTone(score, target);
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const body = (
    <>
      <span className="font-serif text-[22px] font-semibold leading-none text-primary">
        {letter}
      </span>
      <span className="flex min-w-0 flex-col gap-[7px]">
        <span className="flex justify-between gap-2">
          <span className="truncate text-[13px] font-medium leading-[1.35] text-foreground">
            {name}
          </span>
          <span className="shrink-0 font-mono text-[11px] font-medium uppercase leading-[1.3] tracking-[0.1em] text-muted-foreground">
            {fn}
          </span>
        </span>
        <span
          className="relative block h-1.5 rounded-[1px] bg-viz-track"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamp(score)}
          aria-label={`${name} score ${score} of 100, target ${target}`}
        >
          <span
            className={cn(
              "block h-full rounded-[1px] transition-[width] duration-300 ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none",
              TONE_FILL[t],
            )}
            style={{ width: `${clamp(score)}%` }}
          />
          <span
            aria-hidden="true"
            title={`Target ${target}`}
            className="absolute -top-1 h-3.5 w-0.5 bg-viz-target"
            style={{ left: `${clamp(target)}%` }}
          />
        </span>
      </span>
      <span
        className={cn(
          "text-right font-serif text-lg font-semibold leading-none tabular-nums",
          TONE_TEXT[t],
        )}
      >
        {score}
      </span>
    </>
  );
  const layout = "grid w-full grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-3 text-left";
  if (onClick)
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          layout,
          "cursor-pointer rounded-control px-1 py-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        {body}
      </button>
    );
  return <div className={cn(layout, className)}>{body}</div>;
}
