#!/usr/bin/env python3
"""Generate docs/COMPLIANCE_MAPPING.md from content/controls/controls.yaml.

The crosswalk tables are derived ONLY from the `mappings` field of each control. Narrative sections
(methodology, disclaimers, coverage gaps) are maintained in this script so that the generated document is
reproducible. Re-run after any change to controls.yaml:

    python3 docs/tools/gen_compliance_mapping.py            # writes docs/COMPLIANCE_MAPPING.md
    python3 docs/tools/gen_compliance_mapping.py --check    # exit 1 if the file is out of date

Reference structures (NIST AI RMF subcategory list, ISO/IEC 42001 clause and Annex A identifiers, EU AI Act article
titles) are compiled from the published documents' structure for gap analysis. They must be checked against the
user's licensed / official copies; they are not reproduced text.
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTROLS_FILE = REPO_ROOT / "content" / "controls" / "controls.yaml"
OUT_FILE = REPO_ROOT / "docs" / "COMPLIANCE_MAPPING.md"
GENERATED_DATE = "2026-10-21"

STANDARD_DISCLAIMER = (
    "AEGIS supports governance readiness, control implementation and evidence collection. "
    "It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or "
    "replace legal advice. Framework mappings are indicative."
)

# --------------------------------------------------------------------------- reference structures
NIST_FUNCTIONS = ["GOVERN", "MAP", "MEASURE", "MANAGE"]
NIST_FUNCTION_PURPOSE = {
    "GOVERN": "Cultivate a culture of risk management; policies, accountability, workforce, third parties.",
    "MAP": "Establish context, categorize the AI system, and identify risks and impacts.",
    "MEASURE": "Analyze, assess, benchmark and monitor AI risks and trustworthiness characteristics.",
    "MANAGE": "Prioritize, respond to and treat risks; monitor, recover and communicate.",
}
# Subcategory counts per category in NIST AI 100-1 (AI RMF 1.0): function -> {category: n_subcategories}
NIST_STRUCTURE = {
    "GOVERN": {1: 7, 2: 3, 3: 2, 4: 3, 5: 2, 6: 2},
    "MAP": {1: 6, 2: 3, 3: 5, 4: 2, 5: 2},
    "MEASURE": {1: 3, 2: 13, 3: 3, 4: 3},
    "MANAGE": {1: 4, 2: 4, 3: 2, 4: 3},
}

ISO_CLAUSES = {
    "4": "Context of the organization",
    "5": "Leadership",
    "6": "Planning",
    "7": "Support",
    "8": "Operation",
    "9": "Performance evaluation",
    "10": "Improvement",
}
ISO_SUBCLAUSES = [
    "4.1", "4.2", "4.3", "4.4", "5.1", "5.2", "5.3", "6.1", "6.1.1", "6.1.2", "6.1.3", "6.1.4", "6.2", "6.3",
    "7.1", "7.2", "7.3", "7.4", "7.5", "8.1", "8.2", "8.3", "8.4", "9.1", "9.2", "9.3", "10.1", "10.2",
]
ISO_ANNEX_A_GROUPS = {
    "A.2": "Policies related to AI",
    "A.3": "Internal organization",
    "A.4": "Resources for AI systems",
    "A.5": "Assessing impacts of AI systems",
    "A.6": "AI system life cycle",
    "A.7": "Data for AI systems",
    "A.8": "Information for interested parties of AI systems",
    "A.9": "Use of AI systems",
    "A.10": "Third-party and customer relationships",
}
ISO_ANNEX_A_CONTROLS = [
    "A.2.2", "A.2.3", "A.2.4", "A.3.2", "A.3.3", "A.4.2", "A.4.3", "A.4.4", "A.4.5", "A.4.6",
    "A.5.2", "A.5.3", "A.5.4", "A.5.5", "A.6.1.2", "A.6.1.3", "A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5",
    "A.6.2.6", "A.6.2.7", "A.6.2.8", "A.7.2", "A.7.3", "A.7.4", "A.7.5", "A.7.6", "A.8.2", "A.8.3",
    "A.8.4", "A.8.5", "A.9.2", "A.9.3", "A.9.4", "A.10.2", "A.10.3", "A.10.4",
]

EU_ARTICLE_TITLES = {
    4: "AI literacy",
    5: "Prohibited AI practices",
    6: "Classification rules for high-risk AI systems",
    9: "Risk management system",
    10: "Data and data governance",
    11: "Technical documentation",
    12: "Record-keeping",
    13: "Transparency and provision of information to deployers",
    14: "Human oversight",
    15: "Accuracy, robustness and cybersecurity",
    17: "Quality management system",
    18: "Documentation keeping",
    19: "Automatically generated logs",
    20: "Corrective actions and duty of information",
    25: "Responsibilities along the AI value chain",
    26: "Obligations of deployers of high-risk AI systems",
    27: "Fundamental rights impact assessment for high-risk AI systems",
    43: "Conformity assessment",
    49: "Registration",
    50: "Transparency obligations for providers and deployers of certain AI systems",
    72: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    73: "Reporting of serious incidents",
}

# How AEGIS supports each mapped article — and where its support stops. Keeps the crosswalk honest for articles
# whose core obligation AEGIS cannot discharge (e.g. conformity assessment, registration).
EU_ARTICLE_NOTES = {
    5: "Supports screening of use cases against a prohibited/restricted list. Whether a practice is prohibited is a legal determination.",
    6: "Supports classification evidence and intake triage. AEGIS risk tiers are not the legal high-risk classification.",
    17: "Supports governance-policy, forum and testing evidence that can feed a provider's quality management system; does not constitute a QMS.",
    25: "Supports documenting role allocation and vendor accountability; role determination (provider/deployer/etc.) requires counsel.",
    27: "Supports impact-assessment workflow and stakeholder input; the FRIA content and any notification obligations must be confirmed by counsel.",
    43: "Supports internal approval gates and change control that produce evidence a conformity assessment may use. AEGIS does NOT perform conformity assessment and is not a notified body.",
    49: "Inventory data can help prepare registration information. AEGIS does NOT register systems in the EU database.",
    72: "Supports monitoring plans and monitoring evidence; provider post-market monitoring obligations remain with the provider.",
    73: "Supports incident detection, triage and records; it does not file serious-incident reports with authorities.",
}

# Areas of the three frameworks that AEGIS v1.0.0 does NOT cover (or covers only as evidence support).
COVERAGE_GAPS = [
    ("EU AI Act", "Conformity assessment by notified bodies and internal-control conformity assessment procedures (Art. 43, Annexes VI–VII)",
     "Not covered. GL-03/GL-04 produce approval and change evidence only. Notified-body assessment is performed by designated bodies; AEGIS is not one."),
    ("EU AI Act", "EU declaration of conformity (Art. 47) and CE marking (Art. 48)",
     "Not covered. AEGIS does not draw up declarations or authorize CE marking."),
    ("EU AI Act", "Registration in the EU database (Art. 49, Art. 71)",
     "Not covered. EI-01 inventory data may help prepare registration information; registration itself is performed by the obligated party."),
    ("EU AI Act", "General-purpose AI (GPAI) model provider obligations, including systemic-risk models (Chapter V, Arts. 51–56) and codes of practice",
     "Not covered in depth. AEGIS treats foundation models as third-party components (EI-08, GL-11, IS-10) from a deployer/downstream-provider perspective."),
    ("EU AI Act", "Provider obligations as a whole (Art. 16), authorised representatives (Art. 22), importers (Art. 23) and distributors (Art. 24)",
     "Partially supported through evidence controls (GL-06, SE-02, SE-05) but role-specific obligations are not modelled."),
    ("EU AI Act", "Quality management system as a complete system (Art. 17) and technical documentation content per Annex IV",
     "Partially supported. AO-01, AO-02, SE-01, SE-07 and GL-06 produce inputs; AEGIS does not validate Annex IV completeness."),
    ("EU AI Act", "Serious-incident notification to market surveillance authorities (Art. 73) and cooperation with authorities (Art. 21)",
     "Process support only (SE-04). AEGIS does not file reports or interact with authorities."),
    ("EU AI Act", "Regulatory sandboxes, real-world testing (Arts. 57–63), penalties (Arts. 99–101) and governance bodies",
     "Not covered."),
    ("EU AI Act", "Annex I product legislation interplay (e.g. medical devices, machinery)",
     "Not covered. Sector product-safety conformity routes remain with the manufacturer and its notified body."),
    ("ISO/IEC 42001", "Certification audit by an accredited certification body",
     "Not covered. AEGIS supports readiness and evidence; only an accredited certification body can issue certification."),
    ("ISO/IEC 42001", "Clauses with no AEGIS control mapping in v1.0.0 (see unmapped list below), e.g. 4.3 scope and 4.4 AI management system",
     "Not mapped. The organization must define AIMS scope and the management system itself."),
    ("NIST AI RMF", "Subcategories with no AEGIS control mapping in v1.0.0 (see unmapped list below)",
     "Not mapped. Many relate to workforce diversity, organizational culture, TEVV methodology and third-party contingency; candidates for future controls."),
    ("All", "Jurisdictions and sector regimes outside the three frameworks (privacy law, sector regulators, US state AI laws, etc.)",
     "Not mapped in controls.yaml. Industry packs list regimes to consider, flagged 'verify with counsel'. AO-07 maintains the organization's own obligations register."),
    ("All", "Legal determinations of applicability, role (provider/deployer) and risk classification",
     "Not covered. Requires qualified legal counsel."),
]

# --------------------------------------------------------------------------- helpers


def load_controls() -> tuple[dict, list[dict], list[dict]]:
    data = yaml.safe_load(CONTROLS_FILE.read_text(encoding="utf-8"))
    return data["library"], data["pillars"], data["controls"]


def _nist_key(ref: str) -> tuple:
    m = re.match(r"(GOVERN|MAP|MEASURE|MANAGE)\s+(\d+)\.(\d+)", ref)
    if not m:
        raise ValueError(f"Unrecognized NIST AI RMF reference: {ref}")
    return (NIST_FUNCTIONS.index(m.group(1)), int(m.group(2)), int(m.group(3)))


def _iso_key(ref: str) -> tuple:
    s = str(ref)
    annex = s.startswith("A.")
    parts = [int(p) for p in s.replace("A.", "").split(".")]
    return (1 if annex else 0, parts)


def _eu_num(ref: str) -> int:
    m = re.match(r"Art\.\s*(\d+)", ref)
    if not m:
        raise ValueError(f"Unrecognized EU AI Act reference: {ref}")
    return int(m.group(1))


def nist_all_subcategories() -> list[str]:
    out = []
    for fn in NIST_FUNCTIONS:
        for cat, n in NIST_STRUCTURE[fn].items():
            out.extend(f"{fn} {cat}.{i}" for i in range(1, n + 1))
    return out


def build_index(controls: list[dict], framework: str) -> dict[str, list[dict]]:
    idx: dict[str, list[dict]] = defaultdict(list)
    for c in controls:
        for ref in c.get("mappings", {}).get(framework, []) or []:
            idx[str(ref)].append(c)
    return idx


def _ctl_list(cs: list[dict]) -> str:
    return ", ".join(f"{c['id']}" for c in cs)


def _ctl_titles(cs: list[dict]) -> str:
    return "; ".join(f"{c['id']} {c['title']}" for c in cs)


# --------------------------------------------------------------------------- rendering


def render() -> str:
    lib, pillars, controls = load_controls()
    nist = build_index(controls, "nist_ai_rmf")
    iso = build_index(controls, "iso_42001")
    eu = build_index(controls, "eu_ai_act")
    pillar_name = {p["id"]: p["name"] for p in pillars}

    L: list[str] = []
    w = L.append
    w("---")
    w('title: "AEGIS Compliance Mapping — NIST AI RMF, ISO/IEC 42001, EU AI Act"')
    w(f"generated: {GENERATED_DATE}")
    w(f"source: content/controls/controls.yaml ({lib['id']} v{lib['version']})")
    w("generator: docs/tools/gen_compliance_mapping.py")
    w("owner: AEGIS Governance Content Lead")
    w("---")
    w("")
    w("# AEGIS Compliance Mapping")
    w("")
    w("<!-- GENERATED FILE — do not edit by hand. Run: python3 docs/tools/gen_compliance_mapping.py -->")
    w("")
    w("> **IMPORTANT — READ FIRST**")
    w(">")
    w(f"> {STANDARD_DISCLAIMER}")
    w(">")
    w(f"> {lib['mapping_disclaimer'].strip()}")
    w(">")
    w("> - This crosswalk is AEGIS's own indicative interpretation. It is **not** an official crosswalk published by")
    w(">   NIST, ISO/IEC or the European Commission.")
    w("> - A mapping means an AEGIS control *can produce evidence relevant to* a framework element. It does **not** mean")
    w(">   that implementing the control satisfies that element.")
    w("> - **EU AI Act timelines:** applicability dates must be verified against the current Official Journal text of")
    w(">   Regulation (EU) 2024/1689 and any amendments. The Commission's 2025 \"Digital Omnibus\" proposals may change")
    w(">   high-risk timelines; their status has **not been verified in this repository**.")
    w("> - Jurisdiction- and sector-specific use requires qualified legal review.")
    w("")
    w("## Contents")
    w("")
    w("1. Methodology")
    w("2. Summary statistics")
    w("3. NIST AI RMF 1.0 crosswalk (by function)")
    w("4. ISO/IEC 42001:2023 crosswalk (clauses and Annex A)")
    w("5. EU AI Act crosswalk (by article)")
    w("6. Control-by-control matrix")
    w("7. Coverage gaps — what AEGIS does not cover")
    w("8. EU AI Act applicability timeline — verification required")
    w("9. Maintenance")
    w("")
    # ---------------------------------------------------------------- 1 methodology
    w("## 1. Methodology")
    w("")
    w("1. **Single source.** Every table below is generated from the `mappings` field of the 64 controls in")
    w(f"   `content/controls/controls.yaml` (library {lib['id']} v{lib['version']}, effective {lib['effective_date']}).")
    w("   No mapping appears here that is not in that file.")
    w("2. **Mapping basis.** A control is mapped to a framework element when the control's objective and evidence")
    w("   would be relevant to demonstrating the practice described by that element. Mappings were authored by the AEGIS")
    w("   Governance Content Lead and are subject to quarterly review.")
    w("3. **References.** NIST AI RMF references use AI 100-1 (AI RMF 1.0) subcategory identifiers; ISO/IEC 42001")
    w("   references use clause numbers and Annex A control identifiers of the 2023 edition; EU AI Act references use")
    w("   article numbers of Regulation (EU) 2024/1689. No standard text is reproduced. Users should consult their")
    w("   licensed copy of ISO/IEC 42001 and the official EU AI Act text.")
    w("4. **Many-to-many.** One control can map to several framework elements and vice versa. Coverage counts")
    w("   indicate breadth of evidence support, not depth or sufficiency.")
    w("5. **Gap analysis.** Framework elements not referenced by any control are listed in §7 together with areas that")
    w("   AEGIS deliberately does not cover. Reference lists used for gap analysis are compiled from the published")
    w("   structures and should be checked against official copies.")
    w("6. **Readiness indicators.** The self-assessment's framework readiness indicators")
    w("   (`maturity_self_assessment.yaml` → `readiness_groups`) are a separate, coarser grouping of questions and are")
    w("   also indicative only.")
    w("")
    # ---------------------------------------------------------------- 2 stats
    w("## 2. Summary statistics")
    w("")
    all_nist = nist_all_subcategories()
    nist_ok = [s for s in all_nist if s in nist]
    unknown_nist = sorted([k for k in nist if k not in all_nist], key=_nist_key)
    iso_clauses_mapped = [s for s in ISO_SUBCLAUSES if s in iso]
    iso_annex_mapped = [a for a in ISO_ANNEX_A_CONTROLS if a in iso]
    unknown_iso = sorted([k for k in iso if k not in ISO_SUBCLAUSES and k not in ISO_ANNEX_A_CONTROLS], key=_iso_key)
    no_eu = [c for c in controls if not c.get("mappings", {}).get("eu_ai_act")]
    w("| Measure | Value |")
    w("|---|---|")
    w(f"| AEGIS controls | {len(controls)} |")
    w(f"| Controls with ≥1 NIST AI RMF mapping | {sum(1 for c in controls if c['mappings'].get('nist_ai_rmf'))} |")
    w(f"| Controls with ≥1 ISO/IEC 42001 mapping | {sum(1 for c in controls if c['mappings'].get('iso_42001'))} |")
    w(f"| Controls with ≥1 EU AI Act mapping | {len(controls) - len(no_eu)} |")
    w(f"| NIST AI RMF subcategories referenced | {len(nist_ok)} of {len(all_nist)} |")
    w(f"| ISO/IEC 42001 clauses/sub-clauses referenced | {len(iso_clauses_mapped)} of {len(ISO_SUBCLAUSES)} in reference list |")
    w(f"| ISO/IEC 42001 Annex A controls referenced | {len(iso_annex_mapped)} of {len(ISO_ANNEX_A_CONTROLS)} in reference list |")
    w(f"| EU AI Act articles referenced | {len(eu)} |")
    w("")
    if unknown_nist or unknown_iso:
        w("> Note: the following references in controls.yaml are not in the reference lists used for gap analysis and")
        w("> should be reviewed: " + ", ".join(unknown_nist + unknown_iso))
        w("")
    # ---------------------------------------------------------------- 3 NIST
    w("## 3. NIST AI RMF 1.0 crosswalk (by function)")
    w("")
    w("Source: NIST AI 100-1. Voluntary framework; \"alignment\" here means AEGIS controls can produce evidence relevant")
    w("to the subcategory.")
    w("")
    for fn in NIST_FUNCTIONS:
        keys = sorted([k for k in nist if k.startswith(fn + " ")], key=_nist_key)
        total = sum(NIST_STRUCTURE[fn].values())
        mapped = len([k for k in keys if k in all_nist])
        w(f"### {fn}")
        w("")
        w(f"*{NIST_FUNCTION_PURPOSE[fn]}* — {mapped} of {total} subcategories referenced.")
        w("")
        w("| Subcategory | AEGIS controls | Control titles |")
        w("|---|---|---|")
        for k in keys:
            cs = sorted(nist[k], key=lambda c: c["id"])
            w(f"| {k} | {_ctl_list(cs)} | {_ctl_titles(cs)} |")
        w("")
    # ---------------------------------------------------------------- 4 ISO
    w("## 4. ISO/IEC 42001:2023 crosswalk")
    w("")
    w("Clause references are to the management-system requirements (Clauses 4–10); Annex A references are to reference")
    w("controls. Certification against ISO/IEC 42001 can only be granted by an accredited certification body.")
    w("")
    w("### 4.1 Clauses 4–10")
    w("")
    w("| Clause | Clause title | Sub-clause | AEGIS controls | Control titles |")
    w("|---|---|---|---|---|")
    clause_keys = sorted([k for k in iso if not k.startswith("A.")], key=_iso_key)
    for k in clause_keys:
        top = k.split(".")[0]
        cs = sorted(iso[k], key=lambda c: c["id"])
        w(f"| {top} | {ISO_CLAUSES.get(top, '—')} | {k} | {_ctl_list(cs)} | {_ctl_titles(cs)} |")
    w("")
    w("### 4.2 Annex A reference controls")
    w("")
    w("| Annex A group | Group title | Control | AEGIS controls | Control titles |")
    w("|---|---|---|---|---|")
    annex_keys = sorted([k for k in iso if k.startswith("A.")], key=_iso_key)
    for k in annex_keys:
        grp = "A." + k.split(".")[1]
        cs = sorted(iso[k], key=lambda c: c["id"])
        w(f"| {grp} | {ISO_ANNEX_A_GROUPS.get(grp, '—')} | {k} | {_ctl_list(cs)} | {_ctl_titles(cs)} |")
    w("")
    # ---------------------------------------------------------------- 5 EU
    w("## 5. EU AI Act crosswalk (by article)")
    w("")
    w("Regulation (EU) 2024/1689. Many articles apply only to specific roles (provider, deployer, importer,")
    w("distributor) and to specific risk categories; whether an article applies to a given organization or system is a")
    w("legal determination. The \"AEGIS support boundary\" column states where AEGIS support stops.")
    w("")
    w("| Article | Title | AEGIS controls | AEGIS support boundary |")
    w("|---|---|---|---|")
    for k in sorted(eu, key=_eu_num):
        n = _eu_num(k)
        cs = sorted(eu[k], key=lambda c: c["id"])
        note = EU_ARTICLE_NOTES.get(n, "Evidence support only; applicability and sufficiency require legal review.")
        w(f"| {k} | {EU_ARTICLE_TITLES.get(n, '—')} | {_ctl_list(cs)} | {note} |")
    w("")
    if no_eu:
        w("Controls with no EU AI Act mapping (good practice not tied to a specific article): "
          + ", ".join(c["id"] for c in no_eu) + ".")
        w("")
    # ---------------------------------------------------------------- 6 matrix
    w("## 6. Control-by-control matrix")
    w("")
    w("| Control | Title | Pillar | NIST AI RMF | ISO/IEC 42001 | EU AI Act |")
    w("|---|---|---|---|---|---|")
    for c in controls:
        m = c.get("mappings", {})
        w("| {id} | {t} | {p} | {n} | {i} | {e} |".format(
            id=c["id"], t=c["title"], p=pillar_name[c["pillar"]],
            n=", ".join(m.get("nist_ai_rmf") or []) or "—",
            i=", ".join(str(x) for x in (m.get("iso_42001") or [])) or "—",
            e=", ".join(m.get("eu_ai_act") or []) or "—"))
    w("")
    # ---------------------------------------------------------------- 7 gaps
    w("## 7. Coverage gaps — what AEGIS does not cover")
    w("")
    w("AEGIS is a governance-readiness and evidence product. The following areas are outside its scope or only")
    w("supported as evidence inputs. Buyers should plan for them separately.")
    w("")
    w("### 7.1 Out-of-scope and partially supported areas")
    w("")
    w("| Framework | Area | AEGIS position |")
    w("|---|---|---|")
    for fw, area, pos in COVERAGE_GAPS:
        w(f"| {fw} | {area} | {pos} |")
    w("")
    w("### 7.2 NIST AI RMF subcategories not referenced by any AEGIS control (v{})".format(lib["version"]))
    w("")
    unmapped_nist = [s for s in all_nist if s not in nist]
    for fn in NIST_FUNCTIONS:
        items = [s for s in unmapped_nist if s.startswith(fn + " ")]
        w(f"- **{fn}** ({len(items)}): " + (", ".join(items) if items else "none"))
    w("")
    w("### 7.3 ISO/IEC 42001 elements not referenced by any AEGIS control (v{})".format(lib["version"]))
    w("")
    un_cl = [s for s in ISO_SUBCLAUSES if s not in iso]
    un_ax = [a for a in ISO_ANNEX_A_CONTROLS if a not in iso]
    w("- **Clauses/sub-clauses:** " + (", ".join(un_cl) if un_cl else "none"))
    w("- **Annex A controls:** " + (", ".join(un_ax) if un_ax else "none"))
    w("")
    w("Note: a parent clause (e.g. 6.1) may be referenced while some of its sub-clauses are not, and vice versa.")
    w("")
    # ---------------------------------------------------------------- 8 timeline
    w("## 8. EU AI Act applicability timeline — verification required")
    w("")
    w("As originally published, Regulation (EU) 2024/1689 entered into force on 1 August 2024 with staggered")
    w("application (Art. 113): prohibitions and AI-literacy provisions from 2 February 2025; GPAI and governance")
    w("provisions from 2 August 2025; most remaining provisions, including many high-risk obligations, from")
    w("2 August 2026; and Art. 6(1) product-embedded high-risk systems from 2 August 2027.")
    w("")
    w("**These dates must be verified against the current Official Journal text and any amending acts before use.**")
    w("The European Commission's 2025 \"Digital Omnibus\" proposals included changes that may defer or condition")
    w("high-risk timelines. Whether and in what form such changes were adopted has **not been verified in this")
    w("repository**. Do not present any date in this section to a customer as current without legal confirmation.")
    w("")
    # ---------------------------------------------------------------- 9 maintenance
    w("## 9. Maintenance")
    w("")
    w("| Item | Rule |")
    w("|---|---|")
    w("| Regeneration | Run `python3 docs/tools/gen_compliance_mapping.py` after any change to controls.yaml; "
      "`tests/unit/test_content_compliance_mapping.py` fails if this file is stale |")
    w("| Review cadence | Quarterly, and on any material regulatory change (risk R-07 in `docs/RISK_REGISTER.md`) |")
    w("| Change control | Mapping changes are made in controls.yaml only, with a version bump of the control library |")
    w("| Legal review | Required before any mapping is used in customer-facing compliance statements |")
    w("")
    w(f"*{STANDARD_DISCLAIMER}*")
    w("")
    return "\n".join(L)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if docs/COMPLIANCE_MAPPING.md is out of date")
    ap.add_argument("--out", default=str(OUT_FILE))
    args = ap.parse_args(argv)
    text = render()
    out = Path(args.out)
    if args.check:
        current = out.read_text(encoding="utf-8") if out.exists() else ""
        if current != text:
            print(f"{out} is out of date; run python3 docs/tools/gen_compliance_mapping.py", file=sys.stderr)
            return 1
        print(f"{out} is up to date")
        return 0
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
