"""Markdown rendering of Runtime Shield Advisor output."""
from __future__ import annotations

from aegis_common.evidence import STANDARD_DISCLAIMER


def _cite(ids) -> str:
    return ", ".join(ids) if ids else "—"


def _esc(v) -> str:
    return str(v if v is not None else "—").replace("|", "\\|").replace("\n", " ")


def render_advice_markdown(advice: dict, *, synthetic_label: bool | None = None, include_policy_yaml: bool = True) -> str:
    app = advice["app"]
    synthetic = app.get("synthetic") if synthetic_label is None else synthetic_label
    r = advice["risk_profile"]
    L: list[str] = []
    title = f"AEGIS Runtime Shield Advisor — {app['app_name']}"
    L.append(f"# {title}")
    L.append("")
    if synthetic:
        L.append("> **Synthetic example.** Fictional organization and system, generated to illustrate AEGIS output.")
        L.append("")
    L.append(f"> {advice['principle']}")
    L.append("")
    L.append(f"**Status:** Draft advisory output — evidence status **{advice['evidence_status']}**. "
             "Requires review by the accountable owner and security before any use.")
    L.append("")
    L.append("## Summary")
    L.append("")
    L.append(advice["summary"])
    L.append("")
    L.append("| Field | Value |")
    L.append("|---|---|")
    for k, lab in (("purpose", "Purpose"), ("model", "Model"), ("vendor", "Vendor"), ("environment", "Environment"),
                   ("autonomy", "Autonomy"), ("human_approval_model", "Human-approval model"),
                   ("data_sensitivity", "Data sensitivity"), ("affected_parties", "Affected parties")):
        L.append(f"| {lab} | {_esc(app.get(k))} |")
    L.append(f"| Risk tier (user-asserted) | {_esc(r['user_asserted_risk_tier'])} |")
    L.append(f"| Risk tier (inferred) | {_esc(r['inferred_risk_tier'])} |")
    L.append("")

    L.append("## 1. Agent risk profile")
    L.append("")
    L.append("| Dimension | Rating | Rationale |")
    L.append("|---|---|---|")
    for key, lab in (("autonomy", "Autonomy"), ("blast_radius", "Blast radius"), ("data_exposure", "Data exposure"),
                     ("tool_risk", "Tool risk")):
        L.append(f"| {lab} | {r[key]['level']} | {_esc(r[key]['rationale'])} |")
    L.append(f"| **Overall** | **{r['overall']['rating']}** | {_esc(r['overall']['rationale'])} |")
    L.append("")
    L.append(f"Citations: {_cite(r['citations'])}. Evidence status: {r['evidence_status']}.")
    L.append("")
    if advice.get("assumptions"):
        L.append("**Assumptions used (confirm or correct):**")
        L.append("")
        for a in advice["assumptions"]:
            L.append(f"- `{a['field']}` assumed **{a['assumed']}** — {a['why']}")
        L.append("")

    L.append("## 2. Tool permission matrix")
    L.append("")
    L.append("Default-deny: any tool not listed below is denied.")
    L.append("")
    L.append("| Tool | Operation | Decision | Engine action | Approvers | Reasons | Controls |")
    L.append("|---|---|---|---|---|---|---|")
    for m in advice["tool_matrix"]:
        extra = ""
        if m["require_approval_if"]:
            extra = " Approval if: " + "; ".join(f"{c['param']} {c['op']} {c['value']}" for c in m["require_approval_if"]) + "."
        L.append(f"| `{m['tool']}` | {m['operation']} ({m['operation_evidence']}) | **{m['decision']}** | "
                 f"{m['engine_action']} | {_esc(', '.join(m['approval_roles']) or '—')} | "
                 f"{_esc('; '.join(m['reasons']) + extra)} | {_cite(m['citations'])} |")
    if not advice["tool_matrix"]:
        L.append("| — | — | — | — | — | No tools declared; all tool calls are denied by default. | IS-11 |")
    L.append("")

    dh = advice["data_handling"]
    L.append("## 3. Data handling and redaction")
    L.append("")
    L.append(f"- Redacted entities: {', '.join(dh['redaction_entities'])}")
    L.append(f"- Surfaces: {', '.join(dh['redaction_surfaces'])}")
    L.append(f"- Prompt / response logging level: {dh['prompt_logging']} / {dh['response_logging']}")
    L.append(f"- Evidence retention (proposed): {dh['evidence_retention_days']} days")
    for e in dh["exemptions"]:
        L.append(f"- Exemption: `{e['tool']}` may receive {', '.join(e['entities'])} unmasked — {e['reason']}")
    L.append("")
    for rule in dh["rules"]:
        L.append(f"- **{rule['id']}** — {rule['rule']} ({_cite(rule['citations'])})")
    L.append("")
    L.append(f"*Detector limitations:* {dh['detector_limitations']}")
    L.append("")

    L.append("## 4. Human-approval rules")
    L.append("")
    L.append("| Rule | Trigger | Approver roles | Binding | Controls |")
    L.append("|---|---|---|---|---|")
    for a in advice["approval_rules"]:
        L.append(f"| {a['id']} | {_esc(a['trigger'])} | {_esc(', '.join(a['approver_roles']))} | "
                 f"{_esc(a['binding'])} | {_cite(a['citations'])} |")
    L.append("")

    lim = advice["limits"]
    L.append("## 5. Rate and budget limits")
    L.append("")
    L.append("| Limit | Value |")
    L.append("|---|---|")
    L.append(f"| Requests per minute (per identity) | {lim['requests_per_minute']} |")
    L.append(f"| Tool calls per session | {lim['tool_calls_per_session']} |")
    L.append(f"| Tokens per day (tenant+agent) | {lim['tokens_per_day']:,} |")
    L.append(f"| Cost per month (USD) | {lim['cost_per_month_usd']:,} |")
    L.append(f"| Action on breach | {lim['action_on_breach']} (alert at {lim['alert_at_percent']}%) |")
    L.append("")
    L.append(f"{lim['rationale']} Source: {lim['source']} ({lim['evidence_status']}). Controls: {_cite(lim['citations'])}.")
    L.append("")

    mon = advice["monitoring"]
    L.append("## 6. Monitoring plan")
    L.append("")
    L.append("| Metric | Description | Controls |")
    L.append("|---|---|---|")
    for m in mon["metrics"]:
        L.append(f"| {m['metric']} | {_esc(m['description'])} | {_cite(m['citations'])} |")
    L.append("")
    L.append("| Alert | Condition | Severity | Route |")
    L.append("|---|---|---|---|")
    for a in mon["alerts"]:
        L.append(f"| {a['alert']} | {_esc(a['condition'])} | {a['severity']} | {a['route']} |")
    L.append("")
    L.append("Review cadence: " + "; ".join(f"{k.replace('_', ' ')}: {v}" for k, v in mon["review_cadence"].items()) + ".")
    L.append("")

    ir = advice["incident_response"]
    ks = ir["kill_switch"]
    L.append("## 7. Incident response and kill switch")
    L.append("")
    L.append(f"- Scopes: {', '.join(ks['scopes'])}; authorized roles: {', '.join(ks['authorized_roles'])}")
    L.append(f"- Target time-to-disable: {ks['target_time_to_disable_minutes']} minutes. {ks['precedence']}.")
    for i, step in enumerate(ks["procedure"], 1):
        L.append(f"{i}. {step}")
    L.append("")
    L.append("| Playbook | Trigger | Actions | Controls |")
    L.append("|---|---|---|---|")
    for p in ir["playbooks"]:
        L.append(f"| {p['id']} | {_esc(p['trigger'])} | {_esc('; '.join(p['actions']))} | {_cite(p['citations'])} |")
    L.append("")

    ro = advice["rollout"]
    L.append("## 8. Rollout plan")
    L.append("")
    L.append(ro["promotion_rule"])
    L.append("")
    for st in ro["stages"]:
        L.append(f"### Stage {st['stage']}: {st['mode']}")
        L.append("")
        L.append(st["purpose"])
        L.append("")
        L.append("Entry criteria:")
        L.append("")
        for c in st["entry_criteria"]:
            L.append(f"- {c}")
        L.append("")
        L.append("Exit criteria:")
        L.append("")
        for c in st["exit_criteria"]:
            L.append(f"- {c}")
        L.append("")
        L.append(f"Controls: {_cite(st['citations'])}")
        L.append("")

    L.append("## 9. Missing inputs and clarifying questions")
    L.append("")
    if advice["missing_inputs"]:
        for m in advice["missing_inputs"]:
            L.append(f"- **{m['label']}** ({m['status']}): {m['impact']}")
        L.append("")
    if advice["clarifying_questions"]:
        for i, q in enumerate(advice["clarifying_questions"], 1):
            L.append(f"{i}. {q['question']} ({_cite(q['citations'])})")
    else:
        L.append("No clarifying questions.")
    L.append("")

    ev = advice["evidence"]
    L.append("## 10. Evidence labels")
    L.append("")
    L.append("| Item | Status | Controls |")
    L.append("|---|---|---|")
    for it in ev["items"]:
        L.append(f"| {_esc(it['item'])} | {it['status']} | {_cite(it['citations'])} |")
    L.append("")
    L.append(ev["verified_note"])
    L.append("")

    pol = advice["policy"]
    L.append("## 11. Draft runtime policy")
    L.append("")
    L.append(f"- Policy: `{pol['policy_id']}` v{pol['version']} — status **{pol['status']}**, rollout mode "
             f"**{pol['rollout']['mode']}**")
    L.append(f"- {advice['activation']}")
    val = advice["policy_validation"]
    L.append(f"- Schema validation: {'passed' if val['valid'] else 'FAILED'}; reviewer warnings: {len(val['warnings'])}")
    for w in val["warnings"]:
        L.append(f"  - {w}")
    L.append("")
    if include_policy_yaml:
        L.append("```yaml")
        L.append(advice["policy_yaml"].rstrip())
        L.append("```")
        L.append("")

    L.append("## Citations")
    L.append("")
    for c in advice["citation_details"]:
        L.append(f"- {c['citation']}")
    L.append("")
    L.append("---")
    L.append("")
    L.append(f"*{STANDARD_DISCLAIMER}* Runtime detection is heuristic and does not guarantee that every unsafe input "
             "or output is caught.")
    L.append("")
    return "\n".join(L)
