import { useId, type ReactNode } from "react";

/** SVG-safe unique id prefix. */
function useSvgId(): string {
  return `ilt${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function Svg({
  id,
  w,
  h,
  title,
  className = "",
  children,
}: {
  id: string;
  w: number;
  h: number;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={`ill ${className}`}
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

function Backdrop({
  id,
  cx,
  cy,
  r,
  w,
  h,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  w: number;
  h: number;
}) {
  return (
    <>
      <defs>
        <pattern id={`${id}-dots`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" className="f-border" />
        </pattern>
        <radialGradient id={`${id}-fade`}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width={w} height={h} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
      <circle cx={cx} cy={cy} r={r} className="f-soft" />
    </>
  );
}

function Rule({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height="2.5" className="f-ink" />
      <rect x={x} y={y + 5} width={w} height="1.2" className="f-ink" />
    </>
  );
}

function Card({
  x,
  y,
  w,
  h,
  className = "",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <g className={className}>
      <rect x={x + 4} y={y + 4} width={w} height={h} rx="4" className="f-border" />
      <rect x={x} y={y} width={w} height={h} rx="4" className="f-card s-ink" strokeWidth="1.5" />
      {children}
    </g>
  );
}

const SHIELD = "M14 1 26 5.5v9.2c0 7.6-5 13.4-12 16.3C7 28.1 2 22.3 2 14.7V5.5L14 1Z";
const CHECK = "m8.5 16.2 3.8 3.8 7.4-8";

function ShieldMark({
  cx,
  cy,
  height,
  fill = "f-primary",
  check = "s-bg",
}: {
  cx: number;
  cy: number;
  height: number;
  fill?: string;
  check?: string;
}) {
  const s = height / 32;
  return (
    <g transform={`translate(${cx - 14 * s} ${cy - 16 * s}) scale(${s})`}>
      <path d={SHIELD} className={fill} />
      <path
        d={CHECK}
        className={`f-none ${check}`}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

// ------------------------------------------------------------------- Maturity spot

export function MaturitySpotArt() {
  const id = useSvgId();
  return (
    <Svg id={id} w={360} h={240} title="A maturity gauge with five labelled levels from initial to optimising.">
      <Backdrop id={id} cx={180} cy={130} r={104} w={360} h={240} />
      {/* Gauge arc */}
      <path d="M80 180 A80 80 0 0 1 280 180" className="f-none s-border" strokeWidth="14" />
      <path d="M80 180 A80 80 0 0 1 244.3 117.4" className="f-none s-primary" strokeWidth="14" />
      {/* Level ticks */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = Math.PI - (i / 4) * Math.PI;
        const x1 = 180 + Math.cos(a) * 72;
        const y1 = 180 - Math.sin(a) * 72;
        const x2 = 180 + Math.cos(a) * 88;
        const y2 = 180 - Math.sin(a) * 88;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="s-bg"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
      {/* Needle */}
      <line
        x1="180"
        y1="180"
        x2="240"
        y2="124"
        className="s-ink"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="180" cy="180" r="6" className="f-ink" />
      {/* Level labels */}
      {(
        [
          [62, 194, "1"],
          [80, 120, "2"],
          [140, 84, "3"],
          [220, 84, "4"],
          [278, 120, "5"],
        ] as const
      ).map(([x, y, n]) => (
        <text key={n} x={x} y={y} textAnchor="middle" className="t-label">
          {n}
        </text>
      ))}
      <text x="180" y="210" textAnchor="middle" className="t-cap">
        Maturity level
      </text>
      {/* Score cards */}
      <Card x={24} y={36} w={90} h={56} className="ill-float ill-float-1">
        <text x="38" y="54" className="t-cap">
          Score
        </text>
        <text x="38" y="78" className="t-label" style={{ fontSize: 22, fill: "var(--primary)" }}>
          3.4
        </text>
        <text x="72" y="78" className="t-cap">
          / 5
        </text>
      </Card>
      <Card x={254} y={36} w={86} h={56} className="ill-float ill-float-3">
        <text x="268" y="54" className="t-cap">
          Controls
        </text>
        <text x="268" y="78" className="t-label" style={{ fontSize: 22, fill: "var(--primary)" }}>
          64
        </text>
      </Card>
      <Rule x={40} y={224} w={280} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Risk triage spot

export function RiskTriageSpotArt() {
  const id = useSvgId();
  const bands: Array<[number, string, string, string, string]> = [
    [50, "Critical", "f-alert-soft s-alert", "f-alert", "f-none s-alert"],
    [92, "High", "f-warm-soft s-warm", "f-warm", "f-none s-warm"],
    [134, "Medium", "f-soft s-primary", "f-primary", "f-none s-primary"],
    [176, "Low", "f-paper s-border", "f-border", "f-none s-border"],
  ];
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="Four risk severity bands flowing through a checkpoint gate."
    >
      <Backdrop id={id} cx={180} cy={120} r={104} w={360} h={240} />
      {bands.map(([y, label, band, pill, check]) => (
        <g key={label}>
          <rect x="40" y={y} width="140" height="34" rx="3" className={band} strokeWidth="1.5" />
          <text x="56" y={y + 21} className="t-cap" style={{ fill: label === "Critical" ? "var(--danger-ink)" : label === "High" ? "var(--warning-ink)" : undefined }}>
            {label}
          </text>
          <rect x="134" y={y + 6} width="36" height="22" rx="11" className={pill} />
          {/* Arrow from band to gate */}
          <path
            d={`M182 ${y + 17} h26`}
            className={check}
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
        </g>
      ))}
      {/* Gate posts */}
      <rect x="216" y="44" width="5" height="172" rx="2.5" className="f-ink" />
      <rect x="228" y="44" width="5" height="172" rx="2.5" className="f-ink" />
      <rect x="210" y="112" width="30" height="5" rx="2" className="f-primary" />
      {/* Arrow through gate */}
      <path
        d="M240 120 h72"
        className="f-none s-primary"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M306 114 l8 6-8 6"
        className="f-none s-primary"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Result card */}
      <Card x={254} y={50} w={82} h={60}>
        <text x="268" y="68" className="t-cap">
          Sorted
        </text>
        {[82, 94].map((y) => (
          <g key={y}>
            <path
              d={`m268 ${y} 3 3 6-6`}
              className="f-none s-success"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="282" y={y - 2} width="40" height="4" rx="2" className="f-border" />
          </g>
        ))}
      </Card>
      <Rule x={40} y={224} w={280} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Guardrail spot

export function GuardrailSpotArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A guardrail gate on a processing path with allow, deny and escalate signals."
    >
      <Backdrop id={id} cx={180} cy={120} r={104} w={360} h={240} />
      {/* Rail track */}
      <path
        d="M32 140 H160"
        className="f-none s-border"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M200 140 H328"
        className="f-none s-border"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Gate structure */}
      <rect x="158" y="56" width="44" height="144" rx="3" className="f-card s-ink" strokeWidth="2" />
      <rect x="164" y="62" width="32" height="20" rx="2" className="f-paper" />
      <ShieldMark cx={180} cy={74} height={18} />
      {/* Signal lights */}
      <circle cx="180" cy="100" r="8" className="f-success" />
      <circle cx="180" cy="122" r="8" className="f-warm" />
      <circle cx="180" cy="144" r="8" className="f-alert" />
      {/* Gate bar */}
      <rect x="150" y="170" width="60" height="5" rx="2" className="f-primary" />
      {/* Input arrow */}
      <path
        d="M60 140 h88"
        className="f-none s-primary ill-trail"
        strokeWidth="2.5"
        strokeDasharray="1 8"
        strokeLinecap="round"
      />
      <circle cx="60" cy="140" r="6" className="f-card s-primary" strokeWidth="2" />
      {/* Output arrows */}
      <path
        d="M208 104 h40"
        className="f-none s-success"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text x="256" y="108" className="t-cap" style={{ fill: "var(--success-ink)" }}>
        Allow
      </text>
      <path
        d="M208 140 h40"
        className="f-none s-warm"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text x="256" y="144" className="t-cap" style={{ fill: "var(--warning-ink)" }}>
        Escalate
      </text>
      <path
        d="M208 168 h40"
        className="f-none s-alert"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text x="256" y="172" className="t-cap" style={{ fill: "var(--danger-ink)" }}>
        Deny
      </text>
      {/* Input label */}
      <Card x={24} y={40} w={100} h={52} className="ill-float ill-float-1">
        <text x="38" y="58" className="t-cap">
          AI request
        </text>
        <rect x="38" y="66" width="72" height="4" rx="2" className="f-border" />
        <rect x="38" y="76" width="56" height="4" rx="2" className="f-border" />
      </Card>
      <Rule x={40} y={224} w={280} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Ask chatbot spot

export function AskVeritrailSpotArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A conversation with the governance advisor: a question bubble and an answer with references."
    >
      <Backdrop id={id} cx={180} cy={120} r={104} w={360} h={240} />
      {/* User question bubble */}
      <path
        d="M52 50h180a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H100l-14 12v-12H52a8 8 0 0 1-8-8V58a8 8 0 0 1 8-8z"
        className="f-paper s-ink"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="64" y="68" width="120" height="6" rx="3" className="f-ink" />
      <rect x="64" y="82" width="88" height="5" rx="2.5" className="f-border" />
      <rect x="64" y="94" width="56" height="5" rx="2.5" className="f-border" />
      {/* Answer bubble */}
      <path
        d="M120 140h192a8 8 0 0 1 8 8v56a8 8 0 0 1-8 8h-40v12l-14-12H120a8 8 0 0 1-8-8v-56a8 8 0 0 1 8-8z"
        className="f-card s-primary"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ShieldMark cx={140} cy={162} height={18} />
      <rect x="156" y="156" width="100" height="5" rx="2.5" className="f-border" />
      <rect x="156" y="167" width="80" height="5" rx="2.5" className="f-border" />
      {/* Reference chips */}
      {(
        [
          [136, "IS-03", "f-soft s-primary"],
          [192, "GL-01", "f-soft s-primary"],
          [248, "AO-05", "f-soft s-primary"],
        ] as const
      ).map(([x, label, cls]) => (
        <g key={label}>
          <rect x={x} y="182" width="48" height="18" rx="9" className={cls} strokeWidth="1" />
          <text x={x + 24} y="194" textAnchor="middle" className="t-chip" style={{ fill: "var(--primary)" }}>
            {label}
          </text>
        </g>
      ))}
      <Rule x={40} y={224} w={280} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Gateway illustration

export function GatewayArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={480}
      h={200}
      title="The governance workspace: five pillar columns leading to assessment, inventory and assurance screens."
    >
      <Backdrop id={id} cx={240} cy={100} r={120} w={480} h={200} />
      {/* Five pillar columns */}
      {(["AO", "EI", "GL", "IS", "SE"] as const).map((code, i) => {
        const x = 52 + i * 76;
        return (
          <g key={code}>
            <rect x={x} y="36" width="48" height="108" rx="3" className="f-card s-ink" strokeWidth="1.5" />
            <rect x={x} y="36" width="48" height="16" rx="3" className="f-primary" />
            <text x={x + 24} y="48" textAnchor="middle" className="t-chip" style={{ fill: "var(--card)" }}>
              {code}
            </text>
            {[62, 78, 94, 110, 126].map((y) => (
              <rect key={y} x={x + 8} y={y} width="32" height="4" rx="2" className="f-border" />
            ))}
          </g>
        );
      })}
      {/* Base platform */}
      <rect x="32" y="148" width="416" height="8" rx="2" className="f-paper s-ink" strokeWidth="1.5" />
      {/* Shield */}
      <ShieldMark cx={240} cy={176} height={28} />
      <Rule x={32} y={190} w={416} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Plans illustration

export function PlansArt() {
  const id = useSvgId();
  return (
    <Svg id={id} w={360} h={240} title="Three plan tiers represented as stacked cards with increasing features.">
      <Backdrop id={id} cx={180} cy={120} r={104} w={360} h={240} />
      {(
        [
          [36, 140, "Starter", 3, "f-paper"],
          [128, 160, "Professional", 5, "f-soft"],
          [220, 180, "Enterprise", 7, "f-card"],
        ] as const
      ).map(([x, h, label, checks, bg]) => (
        <g key={label}>
          <rect x={x + 3} y={220 - h + 3} width="104" height={h} rx="4" className="f-border" />
          <rect
            x={x}
            y={220 - h}
            width="104"
            height={h}
            rx="4"
            className={`${bg} s-ink`}
            strokeWidth="1.5"
          />
          <text x={x + 52} y={220 - h + 18} textAnchor="middle" className="t-cap">
            {label}
          </text>
          {Array.from({ length: checks }, (_, i) => (
            <g key={i}>
              <path
                d={`m${x + 16} ${220 - h + 30 + i * 14} 3 3 6-6`}
                className="f-none s-primary"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x={x + 30}
                y={220 - h + 26 + i * 14}
                width="56"
                height="4"
                rx="2"
                className="f-border"
              />
            </g>
          ))}
        </g>
      ))}
      <Rule x={40} y={228} w={280} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Invite illustration

export function InviteArt() {
  const id = useSvgId();
  return (
    <Svg id={id} w={360} h={240} title="An invitation envelope connecting two workspace shields.">
      <Backdrop id={id} cx={180} cy={120} r={104} w={360} h={240} />
      {/* Envelope */}
      <rect x="100" y="66" width="160" height="108" rx="4" className="f-card s-ink" strokeWidth="2" />
      <path
        d="M100 70l80 56 80-56"
        className="f-none s-ink"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M100 174l56-40M260 174l-56-40" className="f-none s-border" strokeWidth="1.5" />
      {/* Shields */}
      <ShieldMark cx={64} cy={120} height={36} />
      {/* Dashed connector */}
      <path
        d="M86 120 h10"
        className="f-none s-primary"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      <path
        d="M264 120 h10"
        className="f-none s-primary"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      <ShieldMark cx={296} cy={120} height={36} fill="f-soft s-primary" check="s-primary" />
      {/* Letter content */}
      <rect x="140" y="96" width="80" height="6" rx="3" className="f-border" />
      <rect x="140" y="108" width="60" height="5" rx="2.5" className="f-border" />
      <rect x="150" y="128" width="60" height="18" rx="9" className="f-primary" />
      <text x="180" y="140" textAnchor="middle" className="t-chip" style={{ fill: "var(--card)" }}>
        Join
      </text>
      <Rule x={40} y={224} w={280} />
    </Svg>
  );
}

// ------------------------------------------------------------------- How-it-works flow

export function HowItWorksArt() {
  const id = useSvgId();
  const steps: Array<[string, string]> = [
    ["Assess", "Baseline your maturity"],
    ["Register", "Inventory AI systems"],
    ["Control", "Map risks to controls"],
    ["Evidence", "Capture compliance artefacts"],
    ["Assure", "Continuous governance"],
  ];
  return (
    <Svg
      id={id}
      w={480}
      h={180}
      title="Five-step governance method: assess, register, control, evidence, assure."
    >
      <Backdrop id={id} cx={240} cy={90} r={120} w={480} h={180} />
      {steps.map(([label, sub], i) => {
        const x = 24 + i * 92;
        const active = i === steps.length - 1;
        return (
          <g key={label}>
            <circle
              cx={x + 30}
              cy="60"
              r="24"
              className={active ? "f-primary" : "f-card s-ink"}
              strokeWidth={active ? 0 : "1.5"}
            />
            <text
              x={x + 30}
              y="66"
              textAnchor="middle"
              className="t-label"
              style={active ? { fill: "var(--card)" } : undefined}
            >
              {i + 1}
            </text>
            {i < steps.length - 1 && (
              <path
                d={`M${x + 56} 60 h${92 - 52}`}
                className="f-none s-border"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}
            <text x={x + 30} y="100" textAnchor="middle" className="t-cap">
              {label}
            </text>
            <text x={x + 30} y="114" textAnchor="middle" className="t-cap" style={{ fontSize: 8, letterSpacing: "0.06em" }}>
              {sub}
            </text>
          </g>
        );
      })}
      <Rule x={24} y={138} w={432} />
    </Svg>
  );
}

// ------------------------------------------------------------------- Tool pending placeholder

export function ToolPendingArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A tool under construction: a blank card with a dashed outline and a shield placeholder."
    >
      <Backdrop id={id} cx={180} cy={120} r={104} w={360} h={240} />
      <rect
        x="80"
        y="40"
        width="200"
        height="160"
        rx="6"
        className="f-none s-muted"
        strokeWidth="2"
        strokeDasharray="8 6"
      />
      <ShieldMark cx={180} cy={100} height={48} fill="f-soft s-primary" check="s-primary" />
      <rect x="130" y="140" width="100" height="6" rx="3" className="f-border" />
      <rect x="142" y="154" width="76" height="5" rx="2.5" className="f-border" />
      <rect x="140" y="174" width="80" height="22" rx="11" className="f-soft s-primary" strokeWidth="1.2" />
      <text x="180" y="189" textAnchor="middle" className="t-cap" style={{ fill: "var(--primary)" }}>
        Coming soon
      </text>
      <Rule x={40} y={224} w={280} />
    </Svg>
  );
}
