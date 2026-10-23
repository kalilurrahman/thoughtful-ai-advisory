"""Response composition: structured, cited answers rendered to Markdown."""
from __future__ import annotations

from veritrail_common.content import control_citation, get_control, load_control_library
from veritrail_common.evidence import EVIDENCE_STATUS_DEFINITIONS, STANDARD_DISCLAIMER, EvidenceStatus

from .knowledge import real_control_ids
from .question_bank import get_question, template_meta

FW_LABEL = {"nist_ai_rmf": "NIST AI RMF", "iso_42001": "ISO/IEC 42001", "eu_ai_act": "EU AI Act"}
VALID_STATUSES = {s.value for s in EvidenceStatus}


def _maturity_question(qid: str) -> dict | None:
    from veritrail_common.content import load_assessment_template
    return next((q for q in load_assessment_template().get("questions", []) if q["id"] == qid), None)


class Response:
    def __init__(self, intent: str):
        self.intent = intent
        self.answer = ""
        self.details: list[str] = []          # extra markdown blocks after the direct answer
        self.claims: list[dict] = []
        self.sources: list[dict] = []
        self.missing_evidence: list[str] = []
        self.next_actions: list[str] = []
        self.required_approvals: list[dict] = []
        self.pending_approvals: list[dict] = []
        self.cta: dict | None = None
        self.clarifying_question: str | None = None
        self.confidence: float | None = None
        self.confidence_band: str | None = None
        self.disclaimer: bool = False
        self.data: dict = {}
        self.llm: dict = {"used": False, "reason": "not applicable"}
        self.polishable = False

    # ------------------------------------------------------------------ sources
    def _has(self, typ: str, sid: str) -> bool:
        return any(s["type"] == typ and s["id"] == sid for s in self.sources)

    def add_control(self, cid: str) -> None:
        c = get_control(cid)
        if not c or self._has("control", cid):
            return
        self.sources.append({"type": "control", "id": cid, "title": c["title"], "citation": control_citation(cid),
                             "priority": c.get("priority"), "owner_role": c.get("owner_role"),
                             "mappings": c.get("mappings", {}),
                             "library_version": load_control_library()["library"]["version"]})

    def add_question(self, qid: str) -> None:
        if self._has("question", qid):
            return
        q = get_question(qid)
        if q:
            meta = template_meta()
            self.sources.append({"type": "question", "id": q["id"], "text": q["text"],
                                 "template": f"{meta['id']} v{meta['version']}", "controls": q["controls"]})
            return
        mq = _maturity_question(qid)
        if mq:
            from veritrail_common.content import load_assessment_template
            t = load_assessment_template()["template"]
            self.sources.append({"type": "question", "id": mq["id"], "text": mq["text"],
                                 "template": f"{t['id']} v{t['version']}", "controls": mq.get("controls", [])})

    def add_doc(self, src: dict) -> None:
        key = (f"policy:{src['policy_id']}@{src.get('policy_version')}" if src.get("policy_id")
               else src.get("path", "") + "#" + str(src.get("section", "")) + str(src.get("id")))
        if any(s.get("_key") == key for s in self.sources):
            return
        typ = "policy" if src.get("policy_id") else "document"
        self.sources.append({**src, "type": typ, "id": src.get("policy_id") or src.get("id"), "_key": key})

    def add_evidence(self, ref: str, status: str) -> None:
        if not self._has("evidence", ref):
            self.sources.append({"type": "evidence", "id": ref, "status": status})

    def claim(self, text: str, status: str, sources: list[str] | None = None) -> None:
        assert status in VALID_STATUSES, status
        self.claims.append({"text": text, "evidence_status": status, "sources": sources or []})

    def approval(self, rec: dict) -> None:
        self.pending_approvals.append(rec)

    # ------------------------------------------------------------------ render
    def _auto_cite(self) -> None:
        blob = " ".join([self.answer, *self.details, *self.next_actions, *self.missing_evidence,
                         *[c["text"] for c in self.claims]])
        for cid in real_control_ids(blob):
            self.add_control(cid)

    def control_ids(self) -> set[str]:
        return {s["id"] for s in self.sources if s["type"] == "control"}

    def question_ids(self) -> set[str]:
        return {s["id"] for s in self.sources if s["type"] == "question"}

    def render(self) -> str:
        L = [self.answer.strip()]
        for d in self.details:
            L += ["", d.strip()]
        if self.clarifying_question and self.clarifying_question not in self.answer:
            L += ["", f"**Clarifying question:** {self.clarifying_question}"]
        if self.claims:
            L += ["", "**Evidence status**"]
            L += [f"- {c['text']} — *{c['evidence_status']}*" + (f" ({', '.join(c['sources'])})" if c["sources"] else "")
                  for c in self.claims]
        srcs = [s for s in self.sources if s["type"] != "evidence"]
        if srcs or any(s["type"] == "evidence" for s in self.sources):
            L += ["", "**Sources**"]
            for s in self.sources:
                if s["type"] == "control":
                    maps = "; ".join(f"{FW_LABEL.get(k, k)}: {', '.join(map(str, v))}" for k, v in s["mappings"].items() if v)
                    L.append(f"- {s['citation']}" + (f" — indicative mappings: {maps}" if maps else ""))
                elif s["type"] == "question":
                    L.append(f"- Question {s['id']} ({s['template']})")
                elif s["type"] == "policy":
                    L.append(f"- Policy {s['id']} v{s.get('policy_version') or '?'} ({s.get('path')})")
                elif s["type"] == "document":
                    L.append(f"- {s.get('path')}" + (f" § {s['section']}" if s.get("section") else ""))
                elif s["type"] == "evidence":
                    L.append(f"- Evidence {s['id']} ({s['status']})")
        if self.missing_evidence:
            L += ["", "**Missing evidence**"] + [f"- {m}" for m in self.missing_evidence]
        if self.next_actions:
            L += ["", "**Next actions**"] + [f"{i}. {a}" for i, a in enumerate(self.next_actions, 1)]
        if self.required_approvals or self.pending_approvals:
            L += ["", "**Required approvals**"]
            for a in self.pending_approvals:
                L.append(f"- {a['approval_id']} — {a.get('type')} — status: {a.get('status', 'pending')} "
                         "(resolved by a different user with an approver role)")
            for a in self.required_approvals:
                L.append(f"- {a['action']}: {a['why']}")
        if self.cta:
            L += ["", f"**Next step:** [{self.cta['label']}]({self.cta['url']})"]
        if self.disclaimer:
            L += ["", f"_{STANDARD_DISCLAIMER}_"]
        return "\n".join(L).strip()

    def to_dict(self, *, session_id: str, trace_id: str, state: str, tool_calls: list[dict]) -> dict:
        self._auto_cite()
        md = self.render()
        return {
            "session_id": session_id,
            "trace_id": trace_id,
            "intent": self.intent,
            "state": state,
            "answer": self.answer,
            "message": md,
            "markdown": md,
            "claims": self.claims,
            "sources": [{k: v for k, v in s.items() if not k.startswith("_")} for s in self.sources],
            "citations": sorted(self.control_ids()),
            "missing_evidence": self.missing_evidence,
            "next_actions": self.next_actions,
            "required_approvals": self.required_approvals,
            "pending_approvals": [{k: a.get(k) for k in ("approval_id", "type", "status", "resource", "message")}
                                  for a in self.pending_approvals],
            "cta": self.cta,
            "clarifying_question": self.clarifying_question,
            "confidence": self.confidence,
            "confidence_band": self.confidence_band,
            "tool_calls": tool_calls,
            "llm": self.llm,
            "data": self.data,
            "disclaimer": STANDARD_DISCLAIMER,
            "evidence_status_definitions": EVIDENCE_STATUS_DEFINITIONS,
        }
