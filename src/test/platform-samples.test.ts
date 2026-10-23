import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import {
  BANNER,
  generateMaturitySamples,
  generateRiskTierSamples,
  generateSamples,
  generateShieldSamples,
} from "@/features/platform/samples/generate";
import { findProhibitedClaims } from "@/features/site/engines/ask-veritrail/safety";

// The committed outputs in platform/output/sample_reports were written by
// platform/scripts/generate_samples.py and `python3 -m veritrail_shield.samples`.
const OUT = path.resolve(__dirname, "../../platform/output/sample_reports");
const committed = (rel: string) => readFileSync(path.join(OUT, rel), "utf-8");

/** Drop the fenced YAML policy block (YAML emitters differ in line wrapping, not in content). */
function withoutYamlBlock(md: string): string {
  return md.replace(/```yaml\n[\s\S]*?\n```\n/, "```yaml\n…\n```\n");
}

// Python picks the highest-impact operation from a set, so ties (delete/payment,
// export/external_send) depend on hash order — same normalisation as site-shield.test.ts.
const OP_WEIGHT: Record<string, number> = {
  read: 1,
  write: 2,
  export: 3,
  external_send: 3,
  delete: 4,
  payment: 4,
};
const normaliseTies = (s: string) =>
  s.replace(
    /highest-impact operation: ([a-z_]+)/g,
    (_m, op: string) => `highest-impact operation: <weight ${OP_WEIGHT[op] ?? op}>`,
  );

/** Normalise tie wording and replace serialized YAML strings by their parsed value. */
function normaliseAdvice(v: unknown, key = ""): unknown {
  if (typeof v === "string") return key === "policy_yaml" ? parse(v) : normaliseTies(v);
  if (Array.isArray(v)) return v.map((x) => normaliseAdvice(x));
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, normaliseAdvice(x, k)]),
    );
  }
  return v;
}

describe("synthetic sample generation (generate_samples.py port)", () => {
  const maturity = generateMaturitySamples();
  const riskTier = generateRiskTierSamples();
  const shield = generateShieldSamples();

  it("produces every committed maturity, risk-tier and shield file (except PDFs)", () => {
    const paths = generateSamples().flatMap((g) => g.files.map((f) => f.path));
    expect(paths).toContain("maturity/README.md");
    expect(paths.filter((p) => p.startsWith("maturity/"))).toHaveLength(7);
    expect(paths.filter((p) => p.startsWith("risk_tier/"))).toHaveLength(3);
    expect(paths.filter((p) => p.startsWith("runtime_shield/"))).toHaveLength(9);
  });

  it.each(maturity.files.map((f) => [f.path, f] as const))(
    "maturity %s matches the committed output exactly",
    (rel, f) => {
      expect(f.content).toBe(committed(rel));
    },
  );

  it.each(riskTier.files.map((f) => [f.path, f] as const))(
    "risk tier %s matches the committed output exactly",
    (rel, f) => {
      expect(f.content).toBe(committed(rel));
    },
  );

  it.each(shield.files.filter((f) => f.kind === "json").map((f) => [f.path, f] as const))(
    "shield %s matches the committed JSON",
    (rel, f) => {
      expect(normaliseAdvice(JSON.parse(f.content))).toEqual(
        normaliseAdvice(JSON.parse(committed(rel))),
      );
    },
  );

  it.each(shield.files.filter((f) => f.kind === "yaml").map((f) => [f.path, f] as const))(
    "shield %s has the same banner, header and policy content",
    (rel, f) => {
      const want = committed(rel);
      expect(f.content.split("\n").slice(0, 3)).toEqual(want.split("\n").slice(0, 3));
      expect(parse(f.content)).toEqual(parse(want));
    },
  );

  it.each(shield.files.filter((f) => f.kind === "markdown").map((f) => [f.path, f] as const))(
    "shield %s Markdown matches (policy YAML block compared semantically)",
    (rel, f) => {
      const want = committed(rel);
      expect(normaliseTies(withoutYamlBlock(f.content))).toBe(
        normaliseTies(withoutYamlBlock(want)),
      );
      const block = (s: string) => /```yaml\n([\s\S]*?)\n```/.exec(s)?.[1];
      if (block(want)) expect(parse(block(f.content) ?? "")).toEqual(parse(block(want) ?? ""));
    },
  );

  it("labels every Markdown sample as synthetic and makes no prohibited claims", () => {
    for (const g of generateSamples()) {
      for (const f of g.files.filter((x) => x.kind === "markdown")) {
        expect(f.content.toLowerCase()).toContain("synthetic");
        expect(findProhibitedClaims(f.content)).toEqual([]);
      }
    }
    expect(maturity.files[1]?.content.startsWith(BANNER)).toBe(true);
  });
});

describe("SamplesGallery and RoiCalculator UI", () => {
  it("lists regenerated samples with download buttons", async () => {
    const { render, screen } = await import("@testing-library/react");
    const { createElement } = await import("react");
    const { SamplesGallery } = await import("@/features/platform/samples-gallery");
    render(createElement(SamplesGallery));
    expect(screen.getByText("maturity/example_bank_developing.md")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "PDF" })).toHaveLength(7);
  });

  it("renders the ROI worked example with hypotheses labelled", async () => {
    const { render, screen, fireEvent } = await import("@testing-library/react");
    const { createElement } = await import("react");
    const { RoiCalculator } = await import("@/features/platform/roi-calculator");
    render(createElement(RoiCalculator));
    expect(screen.getAllByRole("cell", { name: "160,980" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("VERITRAIL hypothesis — validate in pilot").length).toBeGreaterThan(
      0,
    );
    fireEvent.change(screen.getByLabelText(/Hourly cost|Blended hourly cost/), {
      target: { value: "-1" },
    });
    expect(screen.getByText("Must be 0 or more.")).toBeInTheDocument();
  });
});
