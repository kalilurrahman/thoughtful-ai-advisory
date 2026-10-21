"""Command-line chat with the AEGIS Agent.

    PYTHONPATH=$(ls -d app/*/ | tr '\\n' ':') python3 -m aegis_agent --role assessor --name "Asha Rao"
    PYTHONPATH=... python3 -m aegis_agent --message "Which controls map to EU AI Act Art. 14?"
    PYTHONPATH=... python3 -m aegis_agent --json --message "What does IS-11 require?"
"""
from __future__ import annotations

import argparse
import json
import sys

from .orchestrator import AegisAgent


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="aegis_agent", description="AEGIS governance copilot (deterministic)")
    ap.add_argument("--data-dir", default=None, help="data directory (default $AEGIS_AGENT_DATA_DIR or var/agent)")
    ap.add_argument("--user", default="cli-user")
    ap.add_argument("--name", default="")
    ap.add_argument("--role", default="assessor", choices=["anonymous", "viewer", "assessor", "approver", "admin"])
    ap.add_argument("--session", default=None)
    ap.add_argument("--message", "-m", action="append", help="send message(s) non-interactively")
    ap.add_argument("--json", action="store_true", help="print full JSON responses")
    args = ap.parse_args(argv)

    agent = AegisAgent(args.data_dir)
    user = {"id": args.user, "role": args.role, "name": args.name}
    session = args.session

    def send(msg: str) -> None:
        nonlocal session
        res = agent.handle(msg, session_id=session, user=user)
        session = res["session_id"]
        if args.json:
            print(json.dumps({k: v for k, v in res.items() if k != "evidence_status_definitions"}, indent=2, default=str))
        else:
            print(f"\n[{res['intent']} · state={res['state']} · trace={res['trace_id']}]\n{res['message']}\n")

    if args.message:
        for m in args.message:
            send(m)
        return 0
    print("AEGIS Agent — type 'exit' to quit. Answers are readiness indicators, not compliance determinations.")
    for line in sys.stdin:
        line = line.strip()
        if line.lower() in ("exit", "quit"):
            break
        if line:
            send(line)
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
