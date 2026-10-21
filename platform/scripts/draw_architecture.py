#!/usr/bin/env python3
"""Draw the flagship AEGIS solution-architecture diagram (PNG, SVG, PDF) with matplotlib.

Output: docs/diagrams/01_solution_architecture.{png,svg,pdf}
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "docs" / "diagrams"
NAVY, TEAL, LIGHT, GREY, WHITE, AMBER = "#0B2545", "#13636B", "#E8F1F8", "#5A6472", "#FFFFFF", "#B7791F"


def box(ax, x, y, w, h, text, fc, ec, tc, fs=9, bold=False, ls="-", r=0.012):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}", fc=fc, ec=ec, lw=1.3, ls=ls))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", color=tc, fontsize=fs,
            fontweight="bold" if bold else "normal", wrap=True, linespacing=1.35)


def band(ax, y, h, label):
    ax.add_patch(FancyBboxPatch((0.02, y), 0.96, h, boxstyle="round,pad=0,rounding_size=0.01", fc="#FAFBFC", ec="#D5DCE4", lw=1))
    ax.text(0.03, y + h - 0.012, label, ha="left", va="top", color=GREY, fontsize=8.5, fontweight="bold")


def arrow(ax, x1, y1, x2, y2, color=GREY, style="-|>", lw=1.6, ls="-"):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=14, color=color, lw=lw, ls=ls))


def main():
    fig = plt.figure(figsize=(16, 11), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    ax.text(0.02, 0.975, "AEGIS Enterprise — Solution Architecture", fontsize=18, fontweight="bold", color=NAVY, va="top")
    ax.text(0.02, 0.945, "Govern every AI system, agent, and decision with evidence.  ·  AI proposes. AEGIS evaluates. Approved actions execute.",
            fontsize=10.5, color=GREY, va="top")

    # Users
    band(ax, 0.84, 0.085, "USERS")
    users = ["Board & Executives", "CIO / CTO", "CISO / Security", "Compliance & Risk", "AI CoE", "Engineering", "Consultants"]
    w = 0.122
    for i, u in enumerate(users):
        box(ax, 0.04 + i * (w + 0.012), 0.85, w, 0.045, u, LIGHT, NAVY, NAVY, 9)

    # Channels
    band(ax, 0.715, 0.11, "CHANNELS (built in this MVP)")
    ch = [("AEGIS Website", "framework · solutions · compliance\nindustries · resources · forms"),
          ("Maturity Self-Assessment", "24 questions · 8 weighted domains\ninstant score · gated report"),
          ("AEGIS Agent", "Ask · Guided assessment\nGap analysis · Reports"),
          ("Runtime Shield Advisor", "risk profile · tool matrix\npolicy-as-code generator"),
          ("Admin Console", "approvals · audit verify\nleads · funnel analytics")]
    w = 0.176
    for i, (t, s) in enumerate(ch):
        x = 0.04 + i * (w + 0.012)
        box(ax, x, 0.725, w, 0.075, "", WHITE, TEAL, NAVY)
        ax.text(x + w / 2, 0.784, t, ha="center", va="center", fontsize=10, fontweight="bold", color=TEAL)
        ax.text(x + w / 2, 0.75, s, ha="center", va="center", fontsize=8, color=NAVY, linespacing=1.3)

    arrow(ax, 0.5, 0.84, 0.5, 0.826)
    arrow(ax, 0.5, 0.715, 0.5, 0.70)

    # Layers
    band(ax, 0.235, 0.46, "AEGIS ENTERPRISE — SIX CONNECTED LAYERS")
    layers = [
        ("1  AI System of Record", "Inventory & classify AI systems, models, agents, tools, vendors, data", "Register", "EI-01 · EI-02 · EI-07"),
        ("2  Assessment & Risk Engine", "Maturity, use-case, agentic, privacy, security & vendor assessments; risk tiering", "Assess", "GL-01 · GL-02 · EI-02"),
        ("3  Policy & Control Library", "64 versioned controls with indicative NIST AI RMF / ISO/IEC 42001 / EU AI Act mappings", "Control", "AO-01 · GL-03 · GL-10"),
        ("4  Lifecycle Governance", "Intake → approval gates → change control → monitoring → retirement", "Control", "GL-03 · GL-04 · GL-09"),
        ("5  Runtime Shield", "ALLOW · DENY · REDACT · TRANSFORM · REQUIRE_HUMAN_APPROVAL · ESCALATE · RATE_LIMIT", "Shield", "IS-11 · IS-12 · IS-15"),
        ("6  Assurance & Evidence", "Control testing, evidence packs, KPIs, board reporting, incidents", "Assurance", "SE-01 · SE-05 · SE-08"),
    ]
    lh, gap, top = 0.06, 0.012, 0.603
    for i, (t, d, mod, ctr) in enumerate(layers):
        y = top - i * (lh + gap)
        box(ax, 0.04, y, 0.6, lh, "", NAVY, NAVY, WHITE)
        ax.text(0.052, y + lh * 0.66, t, ha="left", va="center", fontsize=10.5, fontweight="bold", color=WHITE)
        ax.text(0.052, y + lh * 0.28, d, ha="left", va="center", fontsize=8.2, color="#D6E2EE")
        box(ax, 0.65, y + 0.008, 0.1, lh - 0.016, f"AEGIS {mod}", LIGHT, NAVY, NAVY, 8.5, True)
        box(ax, 0.76, y + 0.008, 0.11, lh - 0.016, ctr, WHITE, "#C9D2DC", GREY, 7.8)
    # continuous improvement loop
    ax.add_patch(FancyArrowPatch((0.9, top - 5 * (lh + gap) + lh / 2), (0.9, top + lh / 2),
                                 connectionstyle="arc3,rad=-0.12", arrowstyle="-|>", mutation_scale=14, color=TEAL, lw=1.6, ls="--"))
    ax.text(0.935, 0.45, "continuous\nimprovement", ha="center", va="center", fontsize=8.5, color=TEAL, rotation=90)
    ax.text(0.65, 0.684, "Module", fontsize=8, color=GREY, va="top")
    ax.text(0.76, 0.684, "Key controls", fontsize=8, color=GREY, va="top")

    # Pillars
    band(ax, 0.135, 0.09, "FIVE AEGIS PILLARS (framework)")
    pillars = ["AO · Accountability &\nOperating Model", "EI · Enterprise\nAI Inventory", "GL · Governance &\nLifecycle Control",
               "IS · Integrity, Safety\n& Security", "SE · Stewardship,\nEvidence & Assurance"]
    w = 0.176
    for i, p in enumerate(pillars):
        box(ax, 0.04 + i * (w + 0.012), 0.145, w, 0.055, p, TEAL, TEAL, WHITE, 8.8, True)

    # Cross-cutting + integrations
    box(ax, 0.02, 0.075, 0.47, 0.05,
        "Cross-cutting guardrails: hash-chained audit log · human approval for high-impact actions ·\nredaction before LLM calls · evidence labels · citation-first answers · least-privilege tools",
        "#FFF7E6", AMBER, "#5F370E", 8.2)
    box(ax, 0.51, 0.075, 0.47, 0.05,
        "Integrations: LLM apps & agents (SDK / gateway) · CRM & email · IAM / SSO ·\nSIEM / WORM evidence storage · GRC & ticketing",
        "#F4F6F8", "#8895A7", "#333333", 8.2, ls="--")

    ax.text(0.02, 0.035,
            "Evidence labels: Verified · User-asserted · Inferred · Missing evidence · Critical gap.   "
            "AEGIS supports governance readiness, control implementation and evidence collection; it does not certify ISO/IEC 42001 "
            "conformity or guarantee EU AI Act compliance.", fontsize=7.6, color=GREY, va="center")

    OUT.mkdir(parents=True, exist_ok=True)
    for ext in ("png", "svg", "pdf"):
        fig.savefig(OUT / f"01_solution_architecture.{ext}", dpi=170 if ext == "png" else None, facecolor="white")
    print("wrote", OUT / "01_solution_architecture.{png,svg,pdf}")


if __name__ == "__main__":
    main()
