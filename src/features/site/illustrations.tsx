import { useId, type ReactNode } from "react";
import { controls, pillars } from "./content";

// Editorial illustrations for the public website. Inline SVG drawn with the Broadsheet tokens
// (classes such as .f-primary / .s-ink in site.css map to --primary, --foreground, …), so every
// picture is sharp at any size, follows light and dark mode, costs no network request and works
// offline in the installed app.

const SHIELD = "M14 1 26 5.5v9.2c0 7.6-5 13.4-12 16.3C7 28.1 2 22.3 2 14.7V5.5L14 1Z";
const CHECK = "m8.5 16.2 3.8 3.8 7.4-8";

/** SVG-safe unique id prefix (React ids contain characters url(#…) references dislike). */
function useSvgId(): string {
  return `ill${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** The VERITRAIL shield mark centred at (cx, cy) with the given height. */
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

/** Soft disc and fading dot grid behind every illustration. */
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

/** A floating card with the Broadsheet offset shadow. */
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

/** Double rule (2px + 1px) — the Broadsheet signature under every title. */
function Rule({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height="2.5" className="f-ink" />
      <rect x={x} y={y + 5} width={w} height="1.2" className="f-ink" />
    </>
  );
}

// ------------------------------------------------------------------------------ home hero

const TRAIL =
  "M10 452 C 30 452, 35 440, 50 436 C 80 428, 105 400, 135 398 C 165 396, 190 425, 220 424 C 250 423, 280 392, 305 388 C 330 384, 360 380, 388 380";
const MILESTONES: Array<[number, number, string, number]> = [
  [50, 436, "Baseline", 462],
  [135, 398, "Register", 380],
  [220, 424, "Control", 450],
  [305, 388, "Shield", 414],
];

export function HeroIllustration() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={600}
      h={480}
      className="ill-hero"
      title="An evidence trail — baseline, register, control and shield — leading to assured AI under the VERITRAIL shield, surrounded by inventory, maturity, policy and evidence-log cards."
    >
      <Backdrop id={id} cx={390} cy={228} r={178} w={600} h={480} />
      <path
        d="M224 104 C 262 112, 280 146, 300 166"
        className="f-none s-muted"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      <path
        d="M190 262 C 230 262, 262 252, 292 246"
        className="f-none s-muted"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      <circle
        cx="390"
        cy="225"
        r="152"
        className="f-none s-primary ill-orbit"
        strokeWidth="1.5"
        strokeDasharray="2 9"
        opacity="0.5"
      />
      <g transform="translate(289.4 110) scale(7.1875)">
        <path d={SHIELD} className="f-primary" />
        <path
          d={SHIELD}
          transform="translate(2.1 2.4) scale(0.85)"
          className="f-none s-bg"
          strokeWidth="0.3"
          opacity="0.45"
        />
        <path
          d={CHECK}
          className="f-none s-bg ill-check"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <Rule x={300} y={352} w={180} />

      {/* The trail */}
      <path d={TRAIL} className="f-none s-border" strokeWidth="9" strokeLinecap="round" />
      <path
        d={TRAIL}
        className="f-none s-primary ill-trail"
        strokeWidth="3"
        strokeDasharray="1 9"
        strokeLinecap="round"
      />
      {MILESTONES.map(([x, y, label, ly], i) => (
        <g key={label}>
          <circle cx={x} cy={y} r="9" className="f-card s-primary" strokeWidth="2.5" />
          <circle cx={x} cy={y} r="3.5" className="f-primary" />
          <text x={x} y={ly} textAnchor="middle" className="t-cap">
            {i + 1} {label}
          </text>
        </g>
      ))}
      <circle cx="388" cy="380" r="12" className="f-primary" />
      <path
        d="m382 380 4.2 4.2 7.8-8.4"
        className="f-none s-bg"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="388" y="408" textAnchor="middle" className="t-cap t-strong">
        5 Assurance
      </text>

      {/* Inventory */}
      <Card x={24} y={36} w={200} h={132} className="ill-float ill-float-1">
        <text x="40" y="58" className="t-cap">
          AI system inventory
        </text>
        <line x1="40" y1="66" x2="208" y2="66" className="s-border" strokeWidth="1" />
        {(
          [
            [80, 84, "High", "f-alert-soft s-alert", "f-alert"],
            [106, 70, "Med", "f-warm-soft s-warm", "f-warm"],
            [132, 56, "Low", "f-soft s-primary", "f-primary"],
          ] as const
        ).map(([y, w, tier, chip, ink]) => (
          <g key={tier}>
            <rect x="40" y={y} width="16" height="16" rx="3" className="f-soft" />
            <rect x="64" y={y + 2} width={w} height="6" rx="3" className="f-border" />
            <rect x="64" y={y + 11} width={w * 0.6} height="4" rx="2" className="f-paper" />
            <rect x="160" y={y + 1} width="48" height="15" rx="7.5" className={chip} />
            <text x="184" y={y + 12} textAnchor="middle" className={`t-chip ${ink}`}>
              {tier}
            </text>
          </g>
        ))}
      </Card>

      {/* Maturity gauge */}
      <Card x={40} y={196} w={150} h={124} className="ill-float ill-float-2">
        <text x="54" y="216" className="t-cap">
          Maturity index
        </text>
        <path d="M67 290 A48 48 0 0 1 163 290" className="f-none s-border" strokeWidth="10" />
        <path d="M67 290 A48 48 0 0 1 140.7 249.5" className="f-none s-primary" strokeWidth="10" />
        <line
          x1="115"
          y1="290"
          x2="136"
          y2="258"
          className="s-ink"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="115" cy="290" r="4.5" className="f-ink" />
        <text x="115" y="313" textAnchor="middle" className="t-label">
          3.4 / 5
        </text>
      </Card>

      {/* Runtime policy */}
      <Card x={452} y={40} w={136} h={104} className="ill-float ill-float-3">
        <text x="466" y="60" className="t-cap">
          Policy v1.3
        </text>
        {(
          [
            [80, "Allow", "f-primary"],
            [102, "Deny", "f-alert"],
            [124, "Approve", "f-warm"],
          ] as const
        ).map(([y, label, dot]) => (
          <g key={label}>
            <circle cx="472" cy={y - 4} r="5" className={dot} />
            <text x="484" y={y} className="t-label t-upper">
              {label}
            </text>
          </g>
        ))}
      </Card>

      {/* Evidence log */}
      <Card x={440} y={262} w={148} h={80} className="ill-float ill-float-4">
        <text x="454" y="282" className="t-cap">
          Evidence log
        </text>
        {(
          [
            [302, "#a3f9 → #9c1e"],
            [324, "#9c1e → #42bd"],
          ] as const
        ).map(([y, hash]) => (
          <g key={hash}>
            <rect
              x="454"
              y={y - 9}
              width="9"
              height="6"
              rx="3"
              className="f-none s-primary"
              strokeWidth="1.5"
            />
            <rect
              x="459"
              y={y - 5}
              width="9"
              height="6"
              rx="3"
              className="f-none s-primary"
              strokeWidth="1.5"
            />
            <text x="474" y={y} className="t-mono">
              {hash}
            </text>
            <path
              d={`m566 ${y - 5} 3 3 6-6`}
              className="f-none s-primary"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </Card>
    </Svg>
  );
}

// ------------------------------------------------------------------------- section art

function FrameworkArt() {
  const id = useSvgId();
  const cols = ["AO", "EI", "GL", "IS", "SE"];
  return (
    <Svg id={id} w={360} h={240} title="Five pillars holding up one governance framework.">
      <Backdrop id={id} cx={180} cy={128} r={104} w={360} h={240} />
      <path
        d="M60 92 180 40 300 92Z"
        className="f-card s-ink"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ShieldMark cx={180} cy={72} height={28} />
      <rect x="56" y="92" width="248" height="12" className="f-paper s-ink" strokeWidth="2" />
      {cols.map((code, i) => {
        const c = 80 + i * 50;
        return (
          <g key={code}>
            <rect
              x={c - 11}
              y="104"
              width="22"
              height="80"
              className={i === 3 ? "f-soft s-ink" : "f-card s-ink"}
              strokeWidth="2"
            />
            <line x1={c - 4} y1="114" x2={c - 4} y2="176" className="s-border" strokeWidth="1.5" />
            <line x1={c + 4} y1="114" x2={c + 4} y2="176" className="s-border" strokeWidth="1.5" />
            <rect
              x={c - 15}
              y="104"
              width="30"
              height="6"
              className="f-paper s-ink"
              strokeWidth="1.5"
            />
            <rect
              x={c - 15}
              y="180"
              width="30"
              height="6"
              className="f-paper s-ink"
              strokeWidth="1.5"
            />
            <text x={c} y="150" textAnchor="middle" className="t-code">
              {code}
            </text>
          </g>
        );
      })}
      <rect x="44" y="188" width="272" height="8" className="f-paper s-ink" strokeWidth="1.5" />
      <rect x="32" y="196" width="296" height="8" className="f-paper s-ink" strokeWidth="1.5" />
      <Rule x={20} y={214} w={320} />
    </Svg>
  );
}

function slab(cx: number, y: number) {
  return {
    top: `M${cx} ${y - 30} L${cx + 90} ${y} L${cx} ${y + 30} L${cx - 90} ${y}Z`,
    left: `M${cx - 90} ${y} L${cx} ${y + 30} L${cx} ${y + 40} L${cx - 90} ${y + 10}Z`,
    right: `M${cx} ${y + 30} L${cx + 90} ${y} L${cx + 90} ${y + 10} L${cx} ${y + 40}Z`,
  };
}

function SolutionsArt() {
  const id = useSvgId();
  const layers = ["Baseline", "Register", "Control", "Shield", "Assurance", "Copilot"];
  const cx = 150;
  return (
    <Svg id={id} w={360} h={240} title="Six stacked layers forming one governance system.">
      <Backdrop id={id} cx={160} cy={130} r={100} w={360} h={240} />
      {layers.map((label, i) => {
        const y = 188 - i * 22;
        const s = slab(cx, y);
        const top = i === layers.length - 1;
        return (
          <g key={label} className="ill-layer" style={{ animationDelay: `${i * 0.12}s` }}>
            <path d={s.left} className="f-paper s-ink" strokeWidth="1.5" strokeLinejoin="round" />
            <path d={s.right} className="f-border s-ink" strokeWidth="1.5" strokeLinejoin="round" />
            <path
              d={s.top}
              className={top ? "f-primary s-ink" : "f-card s-ink"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <line
              x1={cx + 90}
              y1={y + 5}
              x2={cx + 104}
              y2={y + 5}
              className="s-muted"
              strokeWidth="1"
            />
            <text x={cx + 108} y={y + 9} className="t-cap">
              {i + 1} {label}
            </text>
          </g>
        );
      })}
      <ShieldMark cx={cx} cy={78} height={24} fill="f-card" check="s-primary" />
    </Svg>
  );
}

function ComplianceArt() {
  const id = useSvgId();
  const seal = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 22 : 27;
    return `${(124 + Math.cos(a) * r).toFixed(1)},${(192 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A readiness file with tabs for NIST AI RMF, the EU AI Act and ISO/IEC 42001."
    >
      <Backdrop id={id} cx={190} cy={124} r={104} w={360} h={240} />
      <rect
        x="118"
        y="40"
        width="150"
        height="180"
        rx="3"
        className="f-paper s-ink"
        strokeWidth="1.5"
        transform="rotate(-5 193 130)"
      />
      {(
        [
          [50, "NIST", "f-soft"],
          [86, "EU AI", "f-card"],
          [122, "ISO", "f-card"],
        ] as const
      ).map(([y, label, fill]) => (
        <g key={label}>
          <rect
            x="238"
            y={y}
            width="70"
            height="28"
            rx="3"
            className={`${fill} s-ink`}
            strokeWidth="1.5"
          />
          <text x="282" y={y + 18} textAnchor="middle" className="t-code">
            {label}
          </text>
        </g>
      ))}
      <rect
        x="100"
        y="30"
        width="150"
        height="186"
        rx="3"
        className="f-card s-ink"
        strokeWidth="2"
      />
      <rect x="116" y="48" width="90" height="8" rx="2" className="f-ink" />
      {[66, 76, 86].map((y, i) => (
        <rect
          key={y}
          x="116"
          y={y}
          width={[118, 104, 112][i]}
          height="4.5"
          rx="2"
          className="f-border"
        />
      ))}
      {[104, 124, 144].map((y) => (
        <g key={y}>
          <rect
            x="116"
            y={y}
            width="12"
            height="12"
            rx="2"
            className="f-none s-primary"
            strokeWidth="1.8"
          />
          <path
            d={`m118.5 ${y + 6} 2.8 2.8 5-5.6`}
            className="f-none s-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="136" y={y + 4} width="92" height="4.5" rx="2" className="f-border" />
        </g>
      ))}
      <polygon points={seal} className="f-primary" />
      <circle cx="124" cy="192" r="16" className="f-none s-bg" strokeWidth="1.5" />
      <path
        d="m117 192 5 5 9-10"
        className="f-none s-bg"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IndustriesArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A skyline of a bank, a hospital, a public building, an office tower and a cloud service."
    >
      <Backdrop id={id} cx={180} cy={132} r={104} w={360} h={240} />
      <path
        d="M126 72 H192 A13 13 0 0 0 192 46 A20 20 0 0 0 154 40 A16 16 0 0 0 126 72Z"
        className="f-card s-ink ill-float ill-float-2"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Bank */}
      <path
        d="M32 98 76 72 120 98Z"
        className="f-card s-ink"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="36" y="98" width="80" height="8" className="f-paper s-ink" strokeWidth="1.5" />
      {[46, 64, 82, 100].map((x) => (
        <rect
          key={x}
          x={x}
          y="106"
          width="8"
          height="76"
          className="f-card s-ink"
          strokeWidth="1.5"
        />
      ))}
      <rect x="32" y="182" width="88" height="7" className="f-paper s-ink" strokeWidth="1.5" />
      {/* Hospital */}
      <rect x="128" y="110" width="60" height="86" className="f-card s-ink" strokeWidth="1.8" />
      <path d="M154 120h8v8h8v8h-8v8h-8v-8h-8v-8h8z" className="f-alert" />
      {[138, 164].map((x) =>
        [156, 176].map((y) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="14"
            height="12"
            className="f-soft s-ink"
            strokeWidth="1"
          />
        )),
      )}
      {/* Public building */}
      <path d="M200 132 A30 30 0 0 1 260 132Z" className="f-soft s-ink" strokeWidth="1.8" />
      <line x1="230" y1="102" x2="230" y2="82" className="s-ink" strokeWidth="1.5" />
      <path d="M230 82h16l-4 5 4 5h-16z" className="f-warm" />
      <rect x="196" y="132" width="68" height="64" className="f-card s-ink" strokeWidth="1.8" />
      {[206, 222, 238, 254].map((x) => (
        <line key={x} x1={x} y1="142" x2={x} y2="188" className="s-ink" strokeWidth="2" />
      ))}
      {/* Tower */}
      <rect x="274" y="58" width="52" height="138" className="f-card s-ink" strokeWidth="1.8" />
      <line x1="300" y1="58" x2="300" y2="40" className="s-ink" strokeWidth="1.5" />
      <circle cx="300" cy="38" r="3" className="f-primary" />
      {Array.from({ length: 6 }, (_, r) =>
        [282, 296, 310].map((x, c) => (
          <rect
            key={`${r}-${c}`}
            x={x}
            y={70 + r * 19}
            width="9"
            height="11"
            className={(r + c) % 3 === 0 ? "f-primary" : "f-border"}
          />
        )),
      )}
      <ShieldMark cx={300} cy={185} height={14} />
      <Rule x={20} y={198} w={320} />
    </Svg>
  );
}

function ToolsArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="An assessment dashboard with a maturity gauge, sliders, a bar chart and a checklist."
    >
      <Backdrop id={id} cx={190} cy={124} r={104} w={360} h={240} />
      <rect
        x="64"
        y="34"
        width="250"
        height="176"
        rx="4"
        className="f-card s-ink"
        strokeWidth="2"
      />
      <rect
        x="64"
        y="34"
        width="250"
        height="24"
        rx="4"
        className="f-paper s-ink"
        strokeWidth="2"
      />
      {[78, 90, 102].map((x) => (
        <circle key={x} cx={x} cy="46" r="3.5" className="f-border" />
      ))}
      <path d="M86 142 A42 42 0 0 1 170 142" className="f-none s-border" strokeWidth="9" />
      <path d="M86 142 A42 42 0 0 1 150.5 106.6" className="f-none s-primary" strokeWidth="9" />
      <line
        x1="128"
        y1="142"
        x2="146"
        y2="114"
        className="s-ink"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="128" cy="142" r="4" className="f-ink" />
      {(
        [
          [86, 246],
          [110, 272],
          [134, 226],
        ] as const
      ).map(([y, k]) => (
        <g key={y}>
          <line
            x1="196"
            y1={y}
            x2="296"
            y2={y}
            className="s-border"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="196"
            y1={y}
            x2={k}
            y2={y}
            className="s-primary"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={k} cy={y} r="7" className="f-card s-primary" strokeWidth="2.5" />
        </g>
      ))}
      {[30, 46, 22, 54, 38, 60].map((h, i) => (
        <rect
          key={i}
          x={200 + i * 16}
          y={198 - h}
          width="10"
          height={h}
          className={i === 5 ? "f-primary" : "f-soft s-primary"}
          strokeWidth="1"
        />
      ))}
      <Card x={24} y={150} w={100} h={72} className="ill-float ill-float-1">
        {[166, 184, 202].map((y, i) => (
          <g key={y}>
            <path
              d={`m36 ${y} 3 3 6-6.5`}
              className={`f-none ${i < 2 ? "s-primary" : "s-border"}`}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="52" y={y - 3} width={[56, 48, 60][i]} height="5" rx="2" className="f-border" />
          </g>
        ))}
      </Card>
      <path d="M262 150 l0 22 6-6 5 10 4-2-5-10 8 0z" className="f-ink s-card" strokeWidth="1.2" />
    </Svg>
  );
}

function ResourcesArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A blueprint, a stack of playbooks and a downloadable document."
    >
      <Backdrop id={id} cx={180} cy={124} r={104} w={360} h={240} />
      <g transform="rotate(6 228 96)">
        <rect
          x="156"
          y="36"
          width="150"
          height="112"
          rx="3"
          className="f-soft s-primary"
          strokeWidth="1.5"
        />
        {[60, 84, 108, 132].map((y) => (
          <line
            key={y}
            x1="156"
            y1={y}
            x2="306"
            y2={y}
            className="s-primary"
            strokeWidth="0.8"
            opacity="0.4"
          />
        ))}
        {[186, 216, 246, 276].map((x) => (
          <line
            key={x}
            x1={x}
            y1="36"
            x2={x}
            y2="148"
            className="s-primary"
            strokeWidth="0.8"
            opacity="0.4"
          />
        ))}
        <ShieldMark cx={262} cy={78} height={34} fill="f-none s-primary" check="s-primary" />
      </g>
      {(
        [
          [196, 120, "f-primary"],
          [178, 110, "f-card"],
          [160, 126, "f-paper"],
        ] as const
      ).map(([y, w, fill], i) => (
        <g key={y}>
          <rect
            x={44 + i * 6}
            y={y}
            width={w}
            height="18"
            rx="2"
            className={`${fill} s-ink`}
            strokeWidth="1.5"
          />
          <line
            x1={58 + i * 6}
            y1={y}
            x2={58 + i * 6}
            y2={y + 18}
            className="s-ink"
            strokeWidth="1.2"
          />
        </g>
      ))}
      <path
        d="M174 92 h88 l18 18 v104 h-106z"
        className="f-card s-ink"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M262 92 v18 h18" className="f-paper s-ink" strokeWidth="2" strokeLinejoin="round" />
      <rect x="188" y="114" width="58" height="7" rx="2" className="f-ink" />
      {[132, 142, 152, 162, 172].map((y, i) => (
        <rect
          key={y}
          x="188"
          y={y}
          width={[76, 70, 78, 60, 72][i]}
          height="4.5"
          rx="2"
          className="f-border"
        />
      ))}
      <circle cx="292" cy="196" r="22" className="f-primary ill-float ill-float-3" />
      <path
        d="M292 184v20m-8-8 8 8 8-8"
        className="f-none s-bg"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ContactArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A calendar with a booked baseline session and a conversation with the VERITRAIL team."
    >
      <Backdrop id={id} cx={180} cy={124} r={104} w={360} h={240} />
      <rect
        x="236"
        y="40"
        width="74"
        height="48"
        rx="3"
        className="f-paper s-ink ill-float ill-float-2"
        strokeWidth="1.5"
      />
      <path
        d="m236 42 37 26 37-26"
        className="f-none s-ink"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="62"
        y="48"
        width="156"
        height="156"
        rx="4"
        className="f-card s-ink"
        strokeWidth="2"
      />
      <path d="M62 52a4 4 0 0 1 4-4h148a4 4 0 0 1 4 4v28H62z" className="f-primary" />
      {[96, 184].map((x) => (
        <rect key={x} x={x} y="38" width="6" height="20" rx="3" className="f-ink" />
      ))}
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => {
          const x = 76 + c * 27;
          const y = 92 + r * 26;
          const on = r === 1 && c === 2;
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width="20"
              height="18"
              rx="2"
              className={on ? "f-primary" : r === 1 && c > 2 ? "f-soft" : "f-paper"}
            />
          );
        }),
      )}
      <path
        d="m136 127 4 4 8-8.5"
        className="f-none s-bg"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M196 120h112a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10h-74l-16 14v-14h-22a10 10 0 0 1-10-10v-40a10 10 0 0 1 10-10z"
        className="f-card s-ink ill-float ill-float-1"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="210" cy="138" r="8" className="f-soft s-primary" strokeWidth="1.5" />
      <rect x="226" y="134" width="72" height="5" rx="2" className="f-border" />
      <rect x="208" y="154" width="96" height="5" rx="2" className="f-border" />
      <rect x="208" y="164" width="62" height="5" rx="2" className="f-border" />
    </Svg>
  );
}

function PlatformArt() {
  const id = useSvgId();
  const lines: Array<[number, number, string]> = [
    [0, 52, "f-primary"],
    [0, 80, "f-border"],
    [14, 64, "f-warm"],
    [14, 96, "f-border"],
    [28, 46, "f-primary"],
    [28, 70, "f-border"],
    [0, 60, "f-border"],
  ];
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="The VERITRAIL platform console evaluating policy and returning allow, deny and approval decisions."
    >
      <Backdrop id={id} cx={180} cy={124} r={104} w={360} h={240} />
      <rect
        x="40"
        y="34"
        width="280"
        height="176"
        rx="4"
        className="f-card s-ink"
        strokeWidth="2"
      />
      <rect
        x="40"
        y="34"
        width="280"
        height="22"
        rx="4"
        className="f-paper s-ink"
        strokeWidth="2"
      />
      {[54, 66, 78].map((x) => (
        <circle key={x} cx={x} cy="45" r="3.5" className="f-border" />
      ))}
      <rect x="41" y="56" width="58" height="153" className="f-paper" />
      {[72, 90, 108, 126].map((y, i) => (
        <rect
          key={y}
          x="52"
          y={y}
          width={[36, 28, 34, 26][i]}
          height="6"
          rx="3"
          className={i === 1 ? "f-primary" : "f-border"}
        />
      ))}
      <text x="112" y="80" className="t-mono">
        $ veritrail evaluate
      </text>
      {lines.map(([indent, w, fill], i) => (
        <rect
          key={i}
          x={112 + indent}
          y={92 + i * 12}
          width={w}
          height="5.5"
          rx="2"
          className={fill}
        />
      ))}
      {(
        [
          [112, "Allow", "f-soft s-primary", "f-primary"],
          [176, "Deny", "f-alert-soft s-alert", "f-alert"],
          [234, "Approve", "f-warm-soft s-warm", "f-warm"],
        ] as const
      ).map(([x, label, chip, ink]) => (
        <g key={label}>
          <rect
            x={x}
            y="182"
            width={label === "Approve" ? 72 : 56}
            height="18"
            rx="9"
            className={chip}
            strokeWidth="1.2"
          />
          <text
            x={x + (label === "Approve" ? 36 : 28)}
            y="195"
            textAnchor="middle"
            className={`t-chip ${ink}`}
          >
            {label}
          </text>
        </g>
      ))}
      <ShieldMark cx={290} cy={100} height={40} />
    </Svg>
  );
}

function LegalArt() {
  const id = useSvgId();
  return (
    <Svg id={id} w={360} h={240} title="A signed document with the VERITRAIL seal.">
      <Backdrop id={id} cx={180} cy={124} r={104} w={360} h={240} />
      <rect
        x="110"
        y="28"
        width="150"
        height="190"
        rx="3"
        className="f-card s-ink"
        strokeWidth="2"
      />
      <rect x="128" y="48" width="84" height="8" rx="2" className="f-ink" />
      {[68, 78, 88, 104, 114, 124, 140, 150].map((y, i) => (
        <rect
          key={y}
          x="128"
          y={y}
          width={[112, 104, 94, 112, 100, 108, 90, 76][i]}
          height="4.5"
          rx="2"
          className="f-border"
        />
      ))}
      <path
        d="M130 186c10-14 16-16 18-8s-6 14 2 10 10-14 16-10 2 10 10 8 8-8 14-6"
        className="f-none s-primary"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line x1="128" y1="196" x2="206" y2="196" className="s-muted" strokeWidth="1" />
      <circle cx="232" cy="184" r="22" className="f-soft s-primary" strokeWidth="1.5" />
      <ShieldMark cx={232} cy={184} height={26} />
      <path
        d="M272 70 300 42l14 14-28 28-18 4z"
        className="f-paper s-ink ill-float ill-float-2"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CompanyArt() {
  const id = useSvgId();
  return (
    <Svg
      id={id}
      w={360}
      h={240}
      title="A folded map with a dotted trail leading to the VERITRAIL shield."
    >
      <Backdrop id={id} cx={180} cy={124} r={104} w={360} h={240} />
      <path
        d="M48 52 128 36 208 52 300 36 300 196 208 212 128 196 48 212Z"
        className="f-card s-ink"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M128 36 128 196M208 52 208 212" className="s-border" strokeWidth="1.5" />
      <path d="M48 52 128 36 128 196 48 212Z" className="f-paper" opacity="0.7" />
      <path d="M208 52 300 36 300 196 208 212Z" className="f-paper" opacity="0.4" />
      <path
        d="M70 186 C 100 170, 96 140, 130 136 S 180 160, 196 128 S 230 84, 262 92"
        className="f-none s-primary ill-trail"
        strokeWidth="3"
        strokeDasharray="1 9"
        strokeLinecap="round"
      />
      <circle cx="70" cy="186" r="6" className="f-card s-primary" strokeWidth="2.5" />
      <ShieldMark cx={264} cy={80} height={36} />
      <path d="M90 80l10 10m0-10L90 90" className="s-muted" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BlogArt() {
  const id = useSvgId();
  return (
    <Svg id={id} w={360} h={240} title="A broadsheet briefing with headlines, columns and a chart.">
      <Backdrop id={id} cx={180} cy={124} r={104} w={360} h={240} />
      <rect
        x="62"
        y="30"
        width="236"
        height="186"
        rx="2"
        className="f-card s-ink"
        strokeWidth="2"
      />
      <text x="180" y="56" textAnchor="middle" className="t-masthead">
        The Briefing
      </text>
      <Rule x={76} y={64} w={208} />
      <rect x="76" y="82" width="132" height="9" rx="2" className="f-ink" />
      <rect x="76" y="96" width="104" height="9" rx="2" className="f-ink" />
      {[114, 122, 130, 138, 146, 154, 162, 170, 178, 186, 194].map((y, i) => (
        <rect
          key={y}
          x={i < 6 ? 76 : 76}
          y={y}
          width={i % 4 === 3 ? 44 : 60}
          height="4"
          rx="2"
          className="f-border"
        />
      ))}
      {[114, 122, 130, 138, 146, 154, 162, 170, 178, 186, 194].map((y, i) => (
        <rect
          key={`b${y}`}
          x="146"
          y={y}
          width={i % 5 === 4 ? 40 : 62}
          height="4"
          rx="2"
          className="f-border"
        />
      ))}
      <rect x="220" y="82" width="64" height="62" className="f-soft s-primary" strokeWidth="1.2" />
      {[24, 36, 30, 46].map((h, i) => (
        <rect
          key={i}
          x={230 + i * 13}
          y={136 - h}
          width="8"
          height={h}
          className={i === 3 ? "f-primary" : "f-card s-primary"}
          strokeWidth="1"
        />
      ))}
      {[154, 162, 170, 178, 186, 194].map((y, i) => (
        <rect
          key={`c${y}`}
          x="220"
          y={y}
          width={i % 3 === 2 ? 40 : 64}
          height="4"
          rx="2"
          className="f-border"
        />
      ))}
    </Svg>
  );
}

export type ArtKind =
  | "framework"
  | "solutions"
  | "compliance"
  | "industries"
  | "tools"
  | "resources"
  | "contact"
  | "platform"
  | "legal"
  | "company"
  | "blog";

const ART: Record<ArtKind, () => ReactNode> = {
  framework: FrameworkArt,
  solutions: SolutionsArt,
  compliance: ComplianceArt,
  industries: IndustriesArt,
  tools: ToolsArt,
  resources: ResourcesArt,
  contact: ContactArt,
  platform: PlatformArt,
  legal: LegalArt,
  company: CompanyArt,
  blog: BlogArt,
};

/** Which illustration heads a page, from its path and front-matter section. */
export function artFor(path: string, section: string): ArtKind | undefined {
  if (path.startsWith("/resources/blog")) return "blog";
  if (path.startsWith("/platform")) return "platform";
  return section in ART ? (section as ArtKind) : undefined;
}

export function SectionArt({ kind }: { kind: ArtKind }) {
  const Art = ART[kind];
  return <Art />;
}

// ------------------------------------------------------------------- control mosaic

const PRIORITY_CLASS: Record<string, string> = {
  critical: "f-primary",
  high: "f-soft s-primary",
  medium: "f-paper s-border",
};

/**
 * All controls in the library as one tile each, grouped by pillar and shaded by priority —
 * drawn from platform/content/controls/controls.yaml, so it always matches the library.
 */
export function ControlMosaic({
  compact = false,
  highlight,
}: {
  compact?: boolean;
  /** Control id to pick out (the others are dimmed), e.g. on a control's own page. */
  highlight?: string;
}) {
  const id = useSvgId();
  const tile = 16;
  const gap = 4;
  const perRow = 4;
  const colW = perRow * tile + (perRow - 1) * gap;
  const groups = pillars.map((p) => ({ ...p, items: controls.filter((c) => c.pillar === p.id) }));
  const rows = Math.max(...groups.map((g) => Math.ceil(g.items.length / perRow)));
  const w = groups.length * colW + (groups.length - 1) * 20;
  const h = 24 + rows * (tile + gap);
  const critical = controls.filter((c) => c.priority === "critical").length;
  return (
    <Svg
      id={id}
      w={w}
      h={h}
      className={`ill-mosaic${compact ? " ill-mosaic--compact" : ""}${highlight ? " ill-mosaic--highlight" : ""}`}
      title={
        highlight
          ? `Where ${highlight} sits among the ${controls.length} controls of the library.`
          : `${controls.length} controls across ${pillars.length} pillars; ${critical} are critical priority.`
      }
    >
      {groups.map((g, gi) => {
        const x0 = gi * (colW + 20);
        return (
          <g key={g.id}>
            <text x={x0} y="14" className="t-code">
              {g.id}
            </text>
            <text x={x0 + colW} y="14" textAnchor="end" className="t-cap">
              {g.items.length}
            </text>
            {g.items.map((c, i) => (
              <rect
                key={c.id}
                className={`ill-tile ${PRIORITY_CLASS[c.priority] ?? "f-paper s-border"}${c.id === highlight ? " is-highlight" : ""}`}
                x={x0 + (i % perRow) * (tile + gap)}
                y={24 + Math.floor(i / perRow) * (tile + gap)}
                width={tile}
                height={tile}
                rx="2"
                strokeWidth="1.2"
                style={{ animationDelay: `${(gi * 12 + i) * 18}ms` }}
              >
                <title>{`${c.id} ${c.title} (${c.priority})`}</title>
              </rect>
            ))}
          </g>
        );
      })}
    </Svg>
  );
}
