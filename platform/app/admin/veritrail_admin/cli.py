"""VERITRAIL admin CLI — operations console for audit, leads, approvals and analytics.

Usage (from repo root, with PYTHONPATH set by `make` or scripts/veritrail):
  python3 -m veritrail_admin.cli audit verify
  python3 -m veritrail_admin.cli leads list [--tag shield_candidate]
  python3 -m veritrail_admin.cli leads export --out leads.csv
  python3 -m veritrail_admin.cli approvals list
  python3 -m veritrail_admin.cli approvals resolve <approval_id> --decision approve --approver "Jane Doe" --role approver
  python3 -m veritrail_admin.cli analytics funnel
  python3 -m veritrail_admin.cli forms list

Separation of duties: approvals cannot be resolved by the identity that requested them,
and only the `approver` or `admin` role may resolve. Every resolution is audit-logged.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from veritrail_common.audit import AuditLog
from veritrail_common.paths import VAR_DIR
from veritrail_common.env import getenv

APPROVER_ROLES = {"approver", "admin"}
FUNNEL = ["page_view", "assessment_start", "assessment_preliminary", "assessment_gate_view",
          "assessment_lead_submitted", "assessment_report_download"]


def _var(args) -> Path:
    return Path(args.var_dir or getenv("VERITRAIL_VAR_DIR") or VAR_DIR)


def _jsonl(p: Path) -> list[dict]:
    if not p.exists():
        return []
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]


def cmd_audit_verify(args) -> int:
    var = _var(args)
    logs = sorted(var.rglob("*audit*.jsonl"))
    if not logs:
        print("No audit logs found under", var)
        return 0
    bad = 0
    for p in logs:
        ok, msg = AuditLog(p).verify()
        n = sum(1 for _ in AuditLog(p).records())
        print(f"{'OK  ' if ok else 'FAIL'} {p.relative_to(var)}  records={n}  {msg}")
        bad += 0 if ok else 1
    return 1 if bad else 0


def cmd_leads_list(args) -> int:
    leads = _jsonl(_var(args) / "leads" / "leads.jsonl")
    if args.tag:
        leads = [l for l in leads if args.tag in l.get("lead_tags", [])]
    print(f"{'lead_id':<26} {'created':<20} {'company':<28} {'score':>5} {'level':<11} tags")
    for l in leads:
        print(f"{l['lead_id']:<26} {l['created_at'][:19]:<20} {l['company'][:28]:<28} {l['overall_score']:>5} "
              f"{l['maturity_level']:<11} {','.join(l.get('lead_tags', []))}")
    print(f"\n{len(leads)} lead(s)")
    return 0


def cmd_leads_export(args) -> int:
    from veritrail_reports.exporters import write_csv
    leads = _jsonl(_var(args) / "leads" / "leads.jsonl")
    cols = ["lead_id", "created_at", "email", "name", "company", "role", "overall_score", "maturity_level",
            "lead_tags", "critical_flags", "source", "marketing_opt_in"]
    write_csv(leads, args.out, cols)
    AuditLog(_var(args) / "audit" / "admin_audit.jsonl").append(
        "leads.export", args.actor, {"count": len(leads), "out": str(args.out)})
    print(f"Exported {len(leads)} lead(s) to {args.out} (contains personal data — handle per privacy notice)")
    return 0


def _approval_dirs(var: Path) -> list[Path]:
    return [d for d in (var / "approvals", var / "agent" / "approvals") if d.exists()]


def _load_approvals(var: Path) -> list[tuple[Path, dict]]:
    out = []
    for d in _approval_dirs(var):
        for p in sorted(d.glob("*.json")):
            try:
                out.append((p, json.loads(p.read_text(encoding="utf-8"))))
            except json.JSONDecodeError:
                continue
    return out


def cmd_approvals_list(args) -> int:
    items = _load_approvals(_var(args))
    if args.status:
        items = [(p, a) for p, a in items if a.get("status") == args.status]
    for p, a in items:
        print(f"{a.get('approval_id', p.stem):<26} {a.get('status', '?'):<9} {a.get('type') or a.get('action_type', '?'):<28} "
              f"requested_by={a.get('requested_by', 'system')}  {a.get('reason', '')[:70]}")
    print(f"\n{len(items)} approval(s)")
    return 0


def cmd_approvals_resolve(args) -> int:
    var = _var(args)
    if args.role not in APPROVER_ROLES:
        print("Refused: only approver/admin roles may resolve approvals.", file=sys.stderr)
        return 2
    # Delegate to the agent approval service when the approval belongs to it.
    for p, a in _load_approvals(var):
        if a.get("approval_id", p.stem) != args.approval_id:
            continue
        if a.get("status") != "pending":
            print(f"Refused: approval is already {a.get('status')}.", file=sys.stderr)
            return 2
        if a.get("requested_by") and a.get("requested_by") == args.approver:
            print("Refused: requester cannot approve their own request (separation of duties).", file=sys.stderr)
            return 2
        if "agent" in p.parts:
            try:
                from veritrail_agent.orchestrator import VeritrailAgent
                agent = VeritrailAgent(var / "agent")
                res = agent.resolve_approval(args.approval_id, decision=args.decision,
                                             approver={"id": args.approver, "role": args.role}, note=args.note)
                print(json.dumps(res, indent=2, default=str))
                return 0
            except (ImportError, AttributeError):
                pass
        a["status"] = "approved" if args.decision == "approve" else "rejected"
        a["resolved_by"] = args.approver
        a["resolved_role"] = args.role
        a["resolved_at"] = datetime.now(timezone.utc).isoformat()
        a["note"] = args.note
        p.write_text(json.dumps(a, indent=2), encoding="utf-8")
        AuditLog(var / "audit" / "admin_audit.jsonl").append(
            f"approval.{a['status']}", args.approver, {"approval_id": args.approval_id, "type": a.get("type"),
                                                       "role": args.role, "note": args.note}, resource=args.approval_id)
        print(f"Approval {args.approval_id} {a['status']} by {args.approver}.")
        return 0
    print(f"Approval {args.approval_id} not found.", file=sys.stderr)
    return 1


def funnel(var: Path) -> dict:
    ev = _jsonl(var / "analytics" / "events.jsonl")
    c = Counter(e["name"] for e in ev)
    steps = []
    prev = None
    for name in FUNNEL:
        n = c.get(name, 0)
        steps.append({"step": name, "count": n,
                      "conversion_from_previous": (round(n / prev * 100, 1) if prev else None)})
        prev = n or prev
    ctas = Counter(e["props"].get("cta") for e in ev if e["name"] == "cta_click")
    return {"events": len(ev), "funnel": steps, "cta_clicks": dict(ctas)}


def cmd_analytics_funnel(args) -> int:
    f = funnel(_var(args))
    print(f"Total events: {f['events']}")
    for s in f["funnel"]:
        conv = f"{s['conversion_from_previous']}%" if s["conversion_from_previous"] is not None else "—"
        print(f"  {s['step']:<30} {s['count']:>6}   conv {conv}")
    if f["cta_clicks"]:
        print("CTA clicks:", ", ".join(f"{k}={v}" for k, v in f["cta_clicks"].items()))
    return 0


def cmd_forms_list(args) -> int:
    subs = _jsonl(_var(args) / "forms" / "submissions.jsonl")
    for s in subs:
        print(f"{s['id']:<26} {s['created_at'][:19]} {s['form']:<14} {s.get('company', '')[:30]}")
    print(f"\n{len(subs)} submission(s)")
    return 0


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="veritrail-admin", description="VERITRAIL admin console")
    ap.add_argument("--var-dir", default=None)
    ap.add_argument("--actor", default=os.environ.get("USER", "admin"))
    sub = ap.add_subparsers(dest="group", required=True)
    a = sub.add_parser("audit").add_subparsers(dest="cmd", required=True)
    a.add_parser("verify").set_defaults(fn=cmd_audit_verify)
    l = sub.add_parser("leads").add_subparsers(dest="cmd", required=True)
    ll = l.add_parser("list"); ll.add_argument("--tag"); ll.set_defaults(fn=cmd_leads_list)
    le = l.add_parser("export"); le.add_argument("--out", required=True); le.set_defaults(fn=cmd_leads_export)
    p = sub.add_parser("approvals").add_subparsers(dest="cmd", required=True)
    pl = p.add_parser("list"); pl.add_argument("--status"); pl.set_defaults(fn=cmd_approvals_list)
    pr = p.add_parser("resolve")
    pr.add_argument("approval_id"); pr.add_argument("--decision", choices=["approve", "reject"], required=True)
    pr.add_argument("--approver", required=True); pr.add_argument("--role", required=True); pr.add_argument("--note", default="")
    pr.set_defaults(fn=cmd_approvals_resolve)
    an = sub.add_parser("analytics").add_subparsers(dest="cmd", required=True)
    an.add_parser("funnel").set_defaults(fn=cmd_analytics_funnel)
    f = sub.add_parser("forms").add_subparsers(dest="cmd", required=True)
    f.add_parser("list").set_defaults(fn=cmd_forms_list)
    return ap


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
