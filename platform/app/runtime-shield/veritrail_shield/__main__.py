"""CLI: ``python3 -m veritrail_shield <command>``

  advise PROFILE.(yaml|json) [--out DIR]   run the advisor; writes advisor .md/.json and policy .yaml/.json
  validate POLICY.(yaml|json)...           validate policies (exit 1 on errors)
  diff OLD NEW                             structural diff of two policy versions
  samples [--out DIR]                      regenerate output/sample_reports/runtime_shield/
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml


def _load(path: str):
    text = Path(path).read_text(encoding="utf-8")
    return json.loads(text) if path.endswith(".json") else yaml.safe_load(text)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="veritrail_shield", description="VERITRAIL Runtime Shield")
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("advise")
    a.add_argument("profile")
    a.add_argument("--out", default=None)
    v = sub.add_parser("validate")
    v.add_argument("policies", nargs="+")
    d = sub.add_parser("diff")
    d.add_argument("old")
    d.add_argument("new")
    s = sub.add_parser("samples")
    s.add_argument("--out", default=None)
    args = ap.parse_args(argv)

    if args.cmd == "advise":
        from .advisor import advise
        from .render import render_advice_markdown
        advice = advise(_load(args.profile))
        if args.out:
            out = Path(args.out)
            out.mkdir(parents=True, exist_ok=True)
            stem = advice["app"]["agent_name"]
            (out / f"{stem}_advisor.md").write_text(render_advice_markdown(advice), encoding="utf-8")
            (out / f"{stem}_advisor.json").write_text(json.dumps(advice, indent=2), encoding="utf-8")
            (out / f"{stem}_policy.yaml").write_text(advice["policy_yaml"], encoding="utf-8")
            (out / f"{stem}_policy.json").write_text(advice["policy_json"], encoding="utf-8")
            print(f"wrote advisor output and draft policy for {stem} to {out}")
        else:
            print(json.dumps(advice, indent=2))
        return 0
    if args.cmd == "validate":
        from veritrail_policy.schema import lint_policy, validate_policy
        rc = 0
        for p in args.policies:
            errors = validate_policy(_load(p))
            if errors:
                rc = 1
                print(f"INVALID {p}")
                for e in errors:
                    print(f"  - {e}")
            else:
                print(f"valid   {p}")
                for w in lint_policy(_load(p)):
                    print(f"  warning: {w}")
        return rc
    if args.cmd == "diff":
        from veritrail_policy.versioning import diff_policies, summarize_diff
        for line in summarize_diff(diff_policies(_load(args.old), _load(args.new))):
            print(line)
        return 0
    if args.cmd == "samples":
        from .samples import write_samples
        for p in write_samples(args.out):
            print(p)
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
