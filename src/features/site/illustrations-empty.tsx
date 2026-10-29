import { useId, type ReactNode } from "react";

/** SVG-safe unique id prefix. */
function useSvgId(): string {
  return `ile${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function Svg({
  id,
  w,
  h,
  title,
  children,
}: {
  id: string;
  w: number;
  h: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <svg
      className="ill ill-empty"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-labelledby={`${id}-title`}
      focusable="false"
    >
      <title id={`${id}-title`}>{title}</title>
      {children}
    </svg>
  );
}

// ------------------------------------------------------------------- Inventory

export function EmptyInventory() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="An empty AI system inventory ledger.">
      <rect x="20" y="12" width="120" height="96" rx="3" className="f-card s-border" strokeWidth="1.5" />
      <rect x="20" y="12" width="120" height="18" rx="3" className="f-paper s-border" strokeWidth="1.5" />
      <rect x="30" y="18" width="40" height="5" rx="2" className="f-border" />
      {[40, 56, 72, 88].map((y) => (
        <g key={y}>
          <rect x="30" y={y} width="12" height="10" rx="2" className="f-none s-border" strokeWidth="1.2" />
          <rect x="48" y={y + 1} width="50" height="4" rx="2" className="f-border" />
          <rect x="48" y={y + 7} width="34" height="3" rx="1.5" className="f-paper" />
          <rect x="108" y={y + 1} width="24" height="9" rx="4.5" className="f-none s-border" strokeWidth="1" />
        </g>
      ))}
    </Svg>
  );
}

// ------------------------------------------------------------------- Incidents

export function EmptyIncidents() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No incidents recorded yet.">
      <rect x="30" y="10" width="100" height="100" rx="3" className="f-card s-border" strokeWidth="1.5" />
      <circle cx="80" cy="42" r="16" className="f-none s-border" strokeWidth="1.5" />
      <path d="M80 34v10M80 50v3" className="s-border" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="50" y="70" width="60" height="5" rx="2" className="f-border" />
      <rect x="56" y="82" width="48" height="4" rx="2" className="f-paper" />
      <rect x="60" y="92" width="40" height="4" rx="2" className="f-paper" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Decisions

export function EmptyDecisions() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No governance decisions recorded yet.">
      {/* Balance scales */}
      <line x1="80" y1="20" x2="80" y2="60" className="s-border" strokeWidth="2" />
      <circle cx="80" cy="18" r="4" className="f-none s-border" strokeWidth="1.5" />
      <line x1="44" y1="42" x2="116" y2="42" className="s-border" strokeWidth="2" />
      {/* Left tray */}
      <path d="M36 42l8 26h-16z" className="f-none s-border" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="36" cy="68" rx="12" ry="3" className="f-none s-border" strokeWidth="1.5" />
      {/* Right tray */}
      <path d="M124 42l8 26h-16z" className="f-none s-border" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="124" cy="68" rx="12" ry="3" className="f-none s-border" strokeWidth="1.5" />
      {/* Base */}
      <path d="M68 60l12 14h-16z" className="f-none s-border" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="54" y="74" width="52" height="4" rx="2" className="f-border" />
      {/* Prompt text lines */}
      <rect x="44" y="90" width="72" height="5" rx="2" className="f-border" />
      <rect x="52" y="102" width="56" height="4" rx="2" className="f-paper" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Change reviews

export function EmptyChanges() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No change reviews submitted yet.">
      {/* Two overlapping documents */}
      <rect x="48" y="18" width="72" height="84" rx="3" className="f-paper s-border" strokeWidth="1.5" transform="rotate(3 84 60)" />
      <rect x="40" y="14" width="72" height="84" rx="3" className="f-card s-border" strokeWidth="1.5" />
      {/* Diff markers */}
      <rect x="50" y="28" width="52" height="5" rx="2" className="f-border" />
      <rect x="50" y="40" width="10" height="10" rx="1" className="f-success-soft s-success" strokeWidth="1" />
      <rect x="64" y="42" width="36" height="4" rx="2" className="f-border" />
      <rect x="50" y="56" width="10" height="10" rx="1" className="f-alert-soft s-alert" strokeWidth="1" />
      <rect x="64" y="58" width="28" height="4" rx="2" className="f-border" />
      <rect x="50" y="72" width="10" height="10" rx="1" className="f-success-soft s-success" strokeWidth="1" />
      <rect x="64" y="74" width="40" height="4" rx="2" className="f-border" />
      {/* Prompt */}
      <rect x="38" y="106" width="84" height="4" rx="2" className="f-border" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Monitoring

export function EmptyMonitoring() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No monitoring plans defined yet.">
      {/* Screen */}
      <rect x="24" y="12" width="112" height="76" rx="4" className="f-card s-border" strokeWidth="1.5" />
      <rect x="24" y="12" width="112" height="14" rx="4" className="f-paper s-border" strokeWidth="1.5" />
      {/* Signal trace */}
      <path
        d="M36 66 Q50 66, 56 54 T76 50 T96 58 T116 46 T124 52"
        className="f-none s-primary"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Threshold line */}
      <line x1="36" y1="50" x2="124" y2="50" className="s-border" strokeWidth="1" strokeDasharray="3 3" />
      {/* Base */}
      <rect x="64" y="88" width="32" height="4" rx="2" className="f-border" />
      <path d="M72 92v8h16v-8" className="f-none s-border" strokeWidth="1.2" />
      {/* Prompt */}
      <rect x="32" y="108" width="96" height="4" rx="2" className="f-border" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Corrective actions

export function EmptyActions() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No corrective actions assigned yet.">
      {/* Document with checklist */}
      <rect x="44" y="10" width="72" height="86" rx="3" className="f-card s-border" strokeWidth="1.5" />
      <rect x="54" y="22" width="52" height="5" rx="2" className="f-border" />
      {[36, 50, 64, 78].map((y) => (
        <g key={y}>
          <rect x="54" y={y} width="10" height="10" rx="2" className="f-none s-border" strokeWidth="1.2" />
          <rect x="68" y={y + 3} width="36" height="4" rx="2" className="f-paper" />
        </g>
      ))}
      {/* Wrench icon */}
      <g transform="translate(108 68) scale(0.9)">
        <path
          d="M4 22L18 8a10 10 0 0 1 3-11l4 4 2-2-4-4a10 10 0 0 1 11-3L20 6l2 2L36 -5"
          className="f-none s-border"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="scale(0.7) translate(2 10)"
        />
      </g>
      {/* Prompt */}
      <rect x="30" y="106" width="100" height="4" rx="2" className="f-border" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Checklist

export function EmptyChecklist() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="Register systems to begin the readiness checklist.">
      {/* Clipboard */}
      <rect x="36" y="20" width="88" height="90" rx="3" className="f-card s-border" strokeWidth="1.5" />
      <rect x="56" y="14" width="48" height="14" rx="7" className="f-paper s-border" strokeWidth="1.5" />
      <circle cx="80" cy="21" r="3" className="f-border" />
      {/* Progress bar */}
      <rect x="48" y="42" width="64" height="6" rx="3" className="f-paper s-border" strokeWidth="1" />
      <rect x="48" y="42" width="16" height="6" rx="3" className="f-primary" />
      {/* Checklist items */}
      {[58, 72, 86].map((y, i) => (
        <g key={y}>
          <rect x="48" y={y} width="10" height="10" rx="2" className="f-none s-border" strokeWidth="1.2" />
          {i === 0 && (
            <path
              d={`m50 ${y + 5} 3 3 5-6`}
              className="f-none s-primary"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <rect x="64" y={y + 3} width={[48, 40, 52][i]} height="4" rx="2" className="f-border" />
        </g>
      ))}
    </Svg>
  );
}

// ------------------------------------------------------------------- Playbook

export function EmptyPlaybook() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="The governance playbook — no chapters reviewed yet.">
      {/* Book spine */}
      <rect x="38" y="16" width="84" height="92" rx="3" className="f-card s-border" strokeWidth="1.5" />
      <line x1="52" y1="16" x2="52" y2="108" className="s-border" strokeWidth="1.5" />
      {/* Pages */}
      <rect x="60" y="30" width="52" height="5" rx="2" className="f-border" />
      {[44, 54, 64, 74, 84].map((y, i) => (
        <rect key={y} x="60" y={y} width={[46, 40, 48, 36, 42][i]} height="4" rx="2" className="f-paper" />
      ))}
      {/* Bookmark */}
      <path d="M112 16v22l-6-4-6 4V16" className="f-primary" />
      {/* Prompt */}
      <rect x="34" y="112" width="92" height="4" rx="2" className="f-border" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Resources

export function EmptyResources() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No matching resources found.">
      {/* Bookshelf */}
      <rect x="24" y="90" width="112" height="4" rx="1" className="f-border" />
      {/* Books */}
      {(
        [
          [32, 14, 72, "f-paper s-border"],
          [50, 18, 68, "f-card s-border"],
          [68, 12, 74, "f-soft s-border"],
          [84, 20, 66, "f-paper s-border"],
          [100, 16, 70, "f-card s-border"],
          [116, 10, 76, "f-soft s-border"],
        ] as const
      ).map(([x, w, y, cls]) => (
        <rect key={x} x={x} y={y} width={w} height={90 - y} rx="1" className={cls} strokeWidth="1" />
      ))}
      {/* Prompt */}
      <rect x="30" y="104" width="100" height="4" rx="2" className="f-border" />
      <rect x="44" y="112" width="72" height="3" rx="1.5" className="f-paper" />
    </Svg>
  );
}

// ------------------------------------------------------------------- Templates

export function EmptyTemplates() {
  const id = useSvgId();
  return (
    <Svg id={id} w={160} h={120} title="No governance templates available yet.">
      {/* Stacked document outlines */}
      <rect x="52" y="24" width="64" height="76" rx="3" className="f-paper s-border" strokeWidth="1.2" transform="rotate(4 84 62)" />
      <rect x="46" y="20" width="64" height="76" rx="3" className="f-paper s-border" strokeWidth="1.2" transform="rotate(-2 78 58)" />
      <rect x="40" y="16" width="64" height="76" rx="3" className="f-card s-border" strokeWidth="1.5" />
      {/* Template lines */}
      <rect x="50" y="28" width="44" height="5" rx="2" className="f-border" />
      <rect x="50" y="40" width="36" height="4" rx="2" className="f-paper" />
      <rect x="50" y="50" width="40" height="4" rx="2" className="f-paper" />
      {/* Dashed content area */}
      <rect
        x="50"
        y="62"
        width="44"
        height="22"
        rx="2"
        className="f-none s-border"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {/* Prompt */}
      <rect x="30" y="104" width="100" height="4" rx="2" className="f-border" />
      <rect x="42" y="112" width="76" height="3" rx="1.5" className="f-paper" />
    </Svg>
  );
}
