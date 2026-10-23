#!/usr/bin/env python3
"""Pilot dress rehearsal — runs the full Pilot A (regulated enterprise) workflow end-to-end
on a SYNTHETIC organization using the real VERITRAIL tooling.

Purpose: prove the pilot kit and product work together before a real design partner is
onboarded. Nothing here is customer data; all answers are generated deterministically
and labelled synthetic. Metrics marked "requires real partner" cannot be met by a dry run.

Steps (mirrors docs/PILOT_PLAYBOOK.md):
  W2  register 28 AI systems (create_ai_system_record) + preliminary risk tiers
  W2  human confirmation of tiers via approval queue (confirm_risk_tier, resolved by approver)
  W3  organization maturity self-assessment
  W4  deep-dive assessments: all High-tier systems (>= 5 priority) via agent tools
      + agent reviews for 2 agentic systems (draft_runtime_policy)
  W5  gap analysis, consolidated gap register, remediation tasks (with confirmation)
  W6  executive readiness report (md/pdf), evidence pack export (with approval), metrics scorecard
Output: output/sample_reports/pilot_dry_run/
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for d in sorted((ROOT / "app").iterdir()):
    if d.is_dir():
        sys.path.insert(0, str(d))

from veritrail_agent.orchestrator import VeritrailAgent  # noqa: E402
from veritrail_assessment.engine import score_assessment  # noqa: E402
from veritrail_common.evidence import STANDARD_DISCLAIMER, find_prohibited_claims  # noqa: E402
from veritrail_reports.exporters import write_csv, write_json, write_markdown  # noqa: E402
from veritrail_reports.maturity import render_maturity_markdown  # noqa: E402
from veritrail_reports.pdf import markdown_to_pdf  # noqa: E402

OUT = ROOT / "output" / "sample_reports" / "pilot_dry_run"
ORG = "Example Regional Bank (synthetic)"
ASSESSOR = {"id": "u-assessor-1", "role": "assessor", "name": "Synthetic VERITRAIL Analyst"}
APPROVER = {"id": "u-approver-1", "role": "approver", "name": "Synthetic Head of AI Risk"}
AS_OF = "2026-10-21"

# name, purpose, decision_impact, affected, sensitivity, autonomy, category, tools, external, genai, vendor
SYSTEMS = [
    ("SME credit decisioning model", "Recommend credit limits for small-business applicants", "material", "customers", "personal", "suggests", "credit", [], False, False, False),
    ("Retail credit scorecard", "Score consumer loan applications", "automated_decision", "customers", "personal", "acts_autonomously", "credit", ["loan_origination_write"], False, False, False),
    ("Card fraud detection", "Flag suspicious card transactions for review", "material", "customers", "personal", "acts_with_approval", "financial_services", ["card_block"], False, False, True),
    ("AML transaction monitoring", "Prioritise AML alerts for investigators", "advisory", "customers", "personal", "suggests", "financial_services", [], False, False, True),
    ("KYC document verification", "Extract and verify ID documents at onboarding", "material", "customers", "special_category", "suggests", "essential_services", [], False, False, True),
    ("Biometric face match (ID&V)", "Match selfie to ID photo during onboarding", "material", "customers", "special_category", "suggests", "biometric", [], False, False, True),
    ("Customer support agent", "Answer customer queries and update tickets using CRM data", "advisory", "customers", "personal", "acts_with_approval", "customer_service", ["crm_read", "crm_write", "send_email"], True, True, True),
    ("Collections outreach agent", "Draft and send payment-reminder messages", "advisory", "customers", "personal", "acts_autonomously", "customer_service", ["crm_read", "send_sms", "send_email"], True, True, True),
    ("Chargeback dispute assistant", "Draft dispute responses for analysts", "advisory", "customers", "personal", "suggests", "customer_service", ["case_read"], False, True, True),
    ("Marketing propensity model", "Rank customers for product offers", "advisory", "customers", "personal", "suggests", "other", [], False, False, False),
    ("CV screening assistant", "Shortlist job applicants for recruiters", "material", "public", "personal", "suggests", "employment", [], False, True, True),
    ("Employee attrition model", "Predict attrition risk for HR planning", "advisory", "internal", "personal", "suggests", "employment", [], False, False, False),
    ("Internal code assistant", "Suggest code for developers", "none", "internal", "confidential", "suggests", "internal_productivity", [], False, True, True),
    ("Meeting summariser", "Summarise internal meetings", "none", "internal", "internal", "suggests", "internal_productivity", [], False, True, True),
    ("Contract review LLM", "Highlight clauses in supplier contracts", "advisory", "internal", "confidential", "suggests", "other", [], False, True, True),
    ("Call-centre speech analytics", "Transcribe and tag call topics", "advisory", "customers", "personal", "suggests", "customer_service", [], False, True, True),
    ("Treasury liquidity forecast", "Forecast intraday liquidity", "advisory", "internal", "confidential", "suggests", "financial_services", [], False, False, False),
    ("Branch staffing forecast", "Forecast branch staffing needs", "advisory", "internal", "internal", "suggests", "internal_productivity", [], False, False, False),
    ("Document OCR pipeline", "Digitise paper forms", "none", "internal", "personal", "suggests", "other", [], False, False, True),
    ("Email triage classifier", "Route inbound customer emails", "advisory", "customers", "personal", "suggests", "customer_service", [], False, False, False),
    ("IT helpdesk agent", "Reset passwords and answer IT questions", "advisory", "internal", "internal", "acts_with_approval", "internal_productivity", ["itsm_write", "iam_reset"], False, True, True),
    ("Cyber threat detection", "Detect anomalous network activity", "advisory", "internal", "confidential", "suggests", "critical_infrastructure", [], False, False, True),
    ("Robo-advice portfolio tool", "Suggest investment portfolios to retail clients", "material", "customers", "personal", "suggests", "financial_services", [], False, False, True),
    ("Complaints classifier", "Classify and route complaints", "advisory", "customers", "personal", "suggests", "customer_service", [], False, False, False),
    ("Regulatory reporting assistant", "Answer questions over regulatory reporting manuals (RAG)", "advisory", "internal", "confidential", "suggests", "other", ["doc_search"], False, True, True),
    ("Policy Q&A assistant", "Answer staff questions about internal policies (RAG)", "none", "internal", "internal", "suggests", "internal_productivity", ["doc_search"], False, True, True),
    ("Sales copilot (vendor)", "Draft sales emails inside the CRM", "none", "customers", "personal", "suggests", "other", ["crm_read"], False, True, True),
    ("Mortgage valuation model", "Estimate property values for mortgage underwriting", "material", "customers", "confidential", "suggests", "credit", [], False, False, True),
]

AGENT_REVIEWS = ["Customer support agent", "Collections outreach agent"]
MATURITY_ANSWERS = {"STR-Q1": 3, "STR-Q2": 3, "STR-Q3": 2, "INV-Q1": 2, "INV-Q2": 2, "INV-Q3": 2,
                    "RSK-Q1": 3, "RSK-Q2": 2, "RSK-Q3": 2, "DAT-Q1": 3, "DAT-Q2": 3, "DAT-Q3": 2,
                    "SEC-Q1": 3, "SEC-Q2": 2, "SEC-Q3": 2, "FST-Q1": 3, "FST-Q2": 2, "FST-Q3": 2,
                    "HUM-Q1": 3, "HUM-Q2": 3, "HUM-Q3": 2, "ASR-Q1": 2, "ASR-Q2": 2, "ASR-Q3": 3}
MATURITY_PROFILE = {"industry": "bfsi", "org_size": "1000-5000", "ai_systems": "25-99", "uses_agents": True, "eu_operations": True}


def profile_of(row) -> dict:
    name, purpose, di, ap, ds, au, cat, tools, ext, genai, vendor = row
    return {"name": name, "purpose": purpose, "decision_impact": di, "affected_parties": ap, "data_sensitivity": ds,
            "autonomy": au, "domain_category": cat, "tools": tools, "external_actions": ext, "genai": genai,
            "vendor_model": vendor, "eu_exposure": True, "environment": "production",
            "business_owner": f"Synthetic owner — {name}"}


def synthetic_answer(system: str, qid: str) -> tuple[str, list[str]]:
    """Deterministic pseudo-random answer with a realistic mix; ~15% carry an evidence reference."""
    h = int(hashlib.sha256(f"{system}|{qid}".encode()).hexdigest(), 16)
    r = h % 100
    ans = "implemented" if r < 30 else "partial" if r < 58 else "not_implemented" if r < 83 else "unknown"
    refs = [f"EVD-{h % 9000 + 1000}"] if ans in ("implemented", "partial") and (h // 100) % 3 == 0 else []
    return ans, refs


def main() -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    data_dir = OUT / "_agent_data"
    agent = VeritrailAgent(data_dir)
    log: list[str] = []

    # ---------------- W2 inventory + preliminary tiers
    inventory = []
    for row in SYSTEMS:
        prof = profile_of(row)
        rec = agent.call_tool("create_ai_system_record", ASSESSOR, profile=prof, owner=prof["business_owner"])
        sid = rec["system"]["id"]
        tier = agent.call_tool("calculate_risk_tier", ASSESSOR, profile=prof)
        inventory.append({"system_id": sid, "name": prof["name"], "purpose": prof["purpose"],
                          "domain_category": prof["domain_category"], "autonomy": prof["autonomy"],
                          "data_sensitivity": prof["data_sensitivity"], "genai": prof["genai"],
                          "vendor_model": prof["vendor_model"], "tools": prof["tools"],
                          "preliminary_tier": tier["tier"], "tier_score": tier["score"],
                          "tier_evidence_status": tier["evidence_status"], "triggers": tier["triggers"],
                          "profile": prof})
    log.append(f"W2: registered {len(inventory)} AI systems as draft records")

    # Human confirmation of tiers: assessor requests, approver resolves (separation of duties)
    confirmed = 0
    for inv in inventory:
        req = agent.call_tool("request_human_approval", ASSESSOR, action="confirm_risk_tier", resource_id=inv["system_id"],
                              payload={"system_id": inv["system_id"], "tier": inv["preliminary_tier"]},
                              reason=f"Confirm preliminary tier {inv['preliminary_tier']}")
        res = agent.resolve_approval(req["approval_id"], "approve", APPROVER, note="Synthetic dry-run confirmation")
        inv["tier_confirmation"] = res.get("status", "approved")
        confirmed += 1
    # Self-approval must be refused
    req = agent.call_tool("request_human_approval", ASSESSOR, action="change_risk_tier", resource_id=inventory[0]["system_id"],
                          payload={"system_id": inventory[0]["system_id"], "tier": "Low"}, reason="Attempted downgrade")
    try:
        agent.resolve_approval(req["approval_id"], "approve", ASSESSOR)
        sod = "FAILED — self-approval was accepted"
    except Exception as e:  # expected
        sod = f"PASS — self-approval refused ({type(e).__name__})"
    agent.resolve_approval(req["approval_id"], "reject", APPROVER, note="Downgrade not justified (synthetic)")
    log.append(f"W2: {confirmed} tier confirmations approved by approver; separation-of-duties check: {sod}")

    write_csv([{k: v for k, v in i.items() if k != "profile"} for i in inventory], OUT / "01_ai_inventory.csv")

    # ---------------- W3 maturity
    mres = score_assessment(MATURITY_ANSWERS, MATURITY_PROFILE)
    mmd = render_maturity_markdown(mres, {"company": ORG}, generated=AS_OF)
    write_markdown(mmd, OUT / "02_maturity_baseline.md")
    markdown_to_pdf(mmd, OUT / "02_maturity_baseline.pdf", title=f"Maturity baseline — {ORG}")
    log.append(f"W3: maturity baseline {mres['overall_score']} ({mres['maturity_level']}), {len(mres['critical_flags'])} critical flags")

    # ---------------- W4 deep dives: all High (+ Prohibited-review) systems, at least 5
    order = {"Prohibited-review": 0, "High": 1, "Medium": 2, "Low": 3}
    ranked = sorted(inventory, key=lambda i: (order[i["preliminary_tier"]], -i["tier_score"]))
    high = [i for i in ranked if i["preliminary_tier"] in ("High", "Prohibited-review")]
    deep = high if len(high) >= 5 else ranked[:5]
    deep_dir = OUT / "03_deep_dives"
    all_gaps, assessments = [], []
    for inv in deep:
        st = agent.call_tool("start_assessment", ASSESSOR, system_id=inv["system_id"])
        aid = st["assessment_id"]
        a = agent.store.get("assessments", aid)
        for qid in a["questions"]:
            ans, refs = synthetic_answer(inv["name"], qid)
            agent.call_tool("submit_assessment_response", ASSESSOR, assessment_id=aid, question_id=qid, answer=ans,
                            evidence_refs=refs, notes="synthetic dry-run answer")
        # approver reviews half of the submitted evidence -> becomes Verified
        evs = [e for e in agent.store.list("evidence") if e.get("assessment_id") == aid]
        for e in evs[::2]:
            agent.review_evidence(e["ref"], APPROVER, accepted=True, note="Synthetic review")
        g = agent.call_tool("identify_gaps", ASSESSOR, assessment_id=aid, as_of=AS_OF)
        slug = inv["name"].lower().replace(" ", "_").replace("(", "").replace(")", "").replace("&", "and").replace("-", "_")
        rep = agent.call_tool("generate_report", ASSESSOR, assessment_id=aid, formats=["md", "pdf", "csv", "json"],
                              out_dir=str(deep_dir / slug), synthetic=True, as_of=AS_OF, basename=slug)
        for gap in g["gaps"]:
            all_gaps.append({"system": inv["name"], "system_id": inv["system_id"], "tier": inv["preliminary_tier"], **gap})
        assessments.append({"system": inv["name"], "assessment_id": aid, "tier": inv["preliminary_tier"],
                            "questions": len(a["questions"]), "summary": g["summary"], "report_dir": f"03_deep_dives/{slug}"})
    log.append(f"W4: completed {len(assessments)} deep-dive assessments via agent tools ({sum(x['questions'] for x in assessments)} responses)")

    # Agent reviews -> runtime policies
    pol_dir = OUT / "04_runtime_policies"
    pol_dir.mkdir()
    policies = []
    for name in AGENT_REVIEWS:
        inv = next(i for i in inventory if i["name"] == name)
        asm = next((x for x in assessments if x["system"] == name), None)
        res = agent.call_tool("draft_runtime_policy", ASSESSOR, assessment_id=asm["assessment_id"]) if asm else \
            agent.call_tool("draft_runtime_policy", ASSESSOR, profile=inv["profile"])
        if res.get("status") == "draft" and res.get("advice"):
            from veritrail_shield.generator import to_json, to_yaml
            from veritrail_shield.render import render_advice_markdown
            slug = name.lower().replace(" ", "_")
            pol = res["advice"]["policy"]
            (pol_dir / f"{slug}_policy.yaml").write_text(to_yaml(pol), encoding="utf-8")
            (pol_dir / f"{slug}_policy.json").write_text(to_json(pol), encoding="utf-8")
            write_markdown(render_advice_markdown(res["advice"], synthetic_label=True), pol_dir / f"{slug}_advice.md")
            # activation requires approval — request it, do NOT resolve (stays pending: production change)
            appr = agent.call_tool("request_human_approval", ASSESSOR, action="activate_runtime_policy",
                                   resource_id=res["policy_id"], payload={"policy_id": pol.get("policy_id"), "version": pol.get("version")},
                                   reason="Move from observe to enforce after shadow period (synthetic)")
            policies.append({"agent": name, "policy_id": pol.get("policy_id"), "version": pol.get("version"),
                             "status": pol.get("status"), "rollout_mode": (pol.get("rollout") or {}).get("mode"),
                             "rating": res["advice"].get("risk_profile", {}).get("overall_rating"),
                             "validation_errors": len(res.get("validation_errors") or []),
                             "activation_approval": appr["approval_id"] + " (pending)"})
    log.append(f"W4: {len(policies)} agent reviews; runtime policies drafted (status draft, activation pending human approval)")

    # ---------------- W5 consolidated gap register + remediation tasks
    gap_cols = ["system", "tier", "gap_id", "severity", "evidence_status", "question_id", "controls", "owner_role",
                "recommended_action", "due_date"]
    for gr in all_gaps:
        gr.setdefault("recommended_action", gr.get("action"))
    write_csv(all_gaps, OUT / "05_gap_register.csv", gap_cols)
    crit_tasks = 0
    for asm in assessments:
        prev = agent.call_tool("create_remediation_task", ASSESSOR, assessment_id=asm["assessment_id"], severities=["Critical"]) \
            if any(g["severity"] == "Critical" and g["system"] == asm["system"] for g in all_gaps) else None
        if prev and prev["status"] == "confirmation_required":
            done = agent.call_tool("create_remediation_task", ASSESSOR, assessment_id=asm["assessment_id"],
                                   severities=["Critical"], confirmed=True)
            crit_tasks += done["count"]
    log.append(f"W5: gap register {len(all_gaps)} gaps; {crit_tasks} remediation tasks created for Critical gaps after explicit confirmation")

    # ---------------- W6 evidence pack (approval-gated) for the top system
    top = assessments[0]
    p1 = agent.call_tool("export_evidence_pack", ASSESSOR, assessment_id=top["assessment_id"])
    agent.resolve_approval(p1["approval_id"], "approve", APPROVER, note="Approved for audit preparation (synthetic)")
    p2 = agent.call_tool("export_evidence_pack", ASSESSOR, assessment_id=top["assessment_id"], approval_id=p1["approval_id"],
                         out_dir=str(OUT / "06_evidence_pack"))
    log.append(f"W6: evidence pack export: first call -> {p1['status']}; after approval -> {p2['status']} ({p2.get('evidence_items')} items)")

    # ---------------- metrics
    tiers = Counter(i["preliminary_tier"] for i in inventory)
    n_high = tiers.get("High", 0) + tiers.get("Prohibited-review", 0)
    assessed_high = sum(1 for x in assessments if x["tier"] in ("High", "Prohibited-review"))
    sev = Counter(g["severity"] for g in all_gaps)
    evs = Counter(g.get("evidence_status") for g in all_gaps)
    metrics = [
        ("AI systems registered", "≥ 25", str(len(inventory)), "Met (synthetic)" if len(inventory) >= 25 else "Not met"),
        ("High-risk systems assessed", "100%", f"{assessed_high}/{n_high} ({round(assessed_high / max(n_high, 1) * 100)}%)",
         "Met (synthetic)" if assessed_high == n_high else "Not met"),
        ("Agent-assisted assessment completion", "≥ 70%", "100% (all responses captured via agent tools; scripted)",
         "Met (synthetic — not a measure of user adoption)"),
        ("Critical gaps documented with owners", "Yes", f"{sev.get('Critical', 0)} critical gaps, all with owner role + due date",
         "Met (synthetic)"),
        ("Runtime policies drafted", "≥ 2", str(len(policies)), "Met (synthetic)" if len(policies) >= 2 else "Not met"),
        ("Executive report accepted", "Yes", "Report generated", "Requires real partner"),
        ("Follow-on commercial discussion initiated", "Yes", "—", "Requires real partner"),
    ]

    # ---------------- executive readiness report
    L = [f"# Executive Readiness Report — {ORG}", "",
         "> **SYNTHETIC DRESS REHEARSAL.** Fictional organization, generated answers. This report demonstrates the VERITRAIL "
         "Pilot A workflow and outputs; it is not evidence about any real organization.", "",
         f"**Prepared:** {AS_OF} · **Scope:** VERITRAIL Governance Baseline (Pilot A profile) · **Prepared by:** VERITRAIL Agent-assisted workflow, synthetic analyst", "",
         "## 1. Executive summary", "",
         f"- **{len(inventory)} AI systems** registered as draft inventory records (EI-01); preliminary tiers: "
         + ", ".join(f"{k} {v}" for k, v in sorted(tiers.items(), key=lambda kv: order[kv[0]])) + ". Tiers are Inferred and were confirmed through the approval queue (EI-02, IS-13).",
         f"- **Enterprise maturity: {mres['overall_score']} / 100 — {mres['maturity_level']}** (self-reported, User-asserted).",
         f"- **{len(assessments)} deep-dive assessments** covering every High-tier system; **{len(all_gaps)} gaps** identified "
         f"(Critical {sev.get('Critical', 0)}, High {sev.get('High', 0)}, Medium {sev.get('Medium', 0)}, Low {sev.get('Low', 0)}).",
         f"- **{len(policies)} runtime policies** drafted for agentic systems; both remain in draft/observe mode pending human approval to activate (IS-12, IS-13).",
         "- Evidence position: " + ", ".join(f"{k}: {v}" for k, v in evs.most_common()) + ".", "",
         "## 2. AI portfolio by risk tier", "", "| Tier | Systems | Examples |", "|---|---|---|"]
    for t in ["Prohibited-review", "High", "Medium", "Low"]:
        ex = [i["name"] for i in inventory if i["preliminary_tier"] == t][:4]
        if ex:
            L.append(f"| {t} | {tiers[t]} | {', '.join(ex)} |")
    L += ["", "## 3. Maturity baseline by domain", "", "| Domain | Score |", "|---|---|"]
    L += [f"| {d['name']} | {d['score']} |" for d in mres["domains"]]
    L += ["", "## 4. Risk heat map — gaps by system and severity", "", "| System | Tier | Critical | High | Medium | Low |", "|---|---|---|---|---|---|"]
    for x in assessments:
        c = Counter(g["severity"] for g in all_gaps if g["system"] == x["system"])
        L.append(f"| {x['system']} | {x['tier']} | {c.get('Critical', 0)} | {c.get('High', 0)} | {c.get('Medium', 0)} | {c.get('Low', 0)} |")
    ctrl_counter = Counter(c for g in all_gaps if g["severity"] in ("Critical", "High") for c in (g.get("controls") or []))
    L += ["", "## 5. Most frequent Critical/High control gaps", "", "| Control | Occurrences |", "|---|---|"]
    from veritrail_common.content import get_control
    L += [f"| {cid} {get_control(cid)['title']} | {n} |" for cid, n in ctrl_counter.most_common(10)]
    L += ["", "## 6. Remediation roadmap", "",
          "- **First 30 days:** close Critical gaps (owners and due dates in the gap register), stand up the AI system of record as authoritative (EI-01, EI-03), enable redaction and kill switch for agentic systems (IS-04, IS-15).",
          "- **Days 31–60:** High gaps; adversarial testing of LLM apps and agents (IS-14); change triggers for model/prompt/tool changes (GL-04); move runtime policies from observe to warn/protect (IS-12).",
          "- **Days 61–90:** Medium gaps; control-testing programme and evidence repository (SE-01, SE-02); leadership KPI pack (SE-03); enforce mode for agents after approval (IS-13).", "",
          "## 7. Runtime Shield recommendations", "", "| Agent | Policy | Version | Status | Rollout mode | Risk rating | Activation |", "|---|---|---|---|---|---|---|"]
    L += [f"| {p['agent']} | {p['policy_id']} | {p['version']} | {p['status']} | {p['rollout_mode']} | {p['rating']} | {p['activation_approval']} |" for p in policies]
    L += ["", "## 8. Pilot success metrics (dry run)", "", "| Metric | Target | Result | Status |", "|---|---|---|---|"]
    L += [f"| {m} | {t} | {r} | {s} |" for m, t, r, s in metrics]
    L += ["", "## 9. Governance checks exercised", ""] + [f"- {x}" for x in log]
    L += ["", "## 10. Artefacts", "",
          "- `01_ai_inventory.csv` — inventory with preliminary tiers", "- `02_maturity_baseline.{md,pdf}`",
          "- `03_deep_dives/<system>/` — per-system report (md, pdf, csv gap register, json)",
          "- `04_runtime_policies/` — advisor output + policy YAML/JSON for two agents", "- `05_gap_register.csv` — consolidated",
          "- `06_evidence_pack/` — approval-gated evidence pack", "- `metrics.json`, `run_log.md`", "",
          f"*{STANDARD_DISCLAIMER}*", ""]
    exec_md = "\n".join(L)
    assert not find_prohibited_claims(exec_md), find_prohibited_claims(exec_md)
    write_markdown(exec_md, OUT / "00_executive_readiness_report.md")
    markdown_to_pdf(exec_md, OUT / "00_executive_readiness_report.pdf", title=f"Executive Readiness Report — {ORG}")
    write_json({"synthetic": True, "organization": ORG, "metrics": [dict(zip(["metric", "target", "result", "status"], m)) for m in metrics],
                "tiers": tiers, "gap_severity": sev, "evidence_status": evs, "assessments": assessments, "policies": policies},
               OUT / "metrics.json")
    write_markdown("# Pilot dry-run log (synthetic)\n\n" + "\n".join(f"- {x}" for x in log) + "\n", OUT / "run_log.md")
    ok, msg = agent.audit.verify()
    n_audit = sum(1 for _ in agent.audit.records())
    (OUT / "run_log.md").write_text((OUT / "run_log.md").read_text() + f"- Audit chain: {n_audit} records, verify={ok} ({msg})\n")
    shutil.rmtree(data_dir)  # internal agent state is not a deliverable
    for x in log:
        print(x)
    print(f"audit chain: {n_audit} records verify={ok}")
    print("tiers:", dict(tiers), "gaps:", dict(sev))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
