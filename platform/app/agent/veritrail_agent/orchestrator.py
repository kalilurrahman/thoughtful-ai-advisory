"""VERITRAIL Agent orchestrator: intent routing, guided assessment state machine, cited composition.

    agent = VeritrailAgent(data_dir)
    result = agent.handle("Which controls map to EU AI Act Art. 14?", session_id="s1",
                          user={"id": "u1", "role": "assessor", "name": "Asha Rao"})

Deterministic by design. See docs/AGENT_DESIGN.md for intents, states and policies.
"""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from veritrail_common.audit import AuditLog
from veritrail_common.content import control_citation, controls_by_id, get_control, load_control_library
from veritrail_common.evidence import GAP_SEVERITY_SLA_DAYS, NO_SOURCE_MESSAGE, EvidenceStatus, find_prohibited_claims
from veritrail_common.ids import new_id
from veritrail_common.redaction import redact

from . import approvals as approvals_svc
from . import knowledge, llm
from .compose import Response
from .config import (CTA_ASSESSMENT, CTA_BASELINE, CTA_SHIELD, EVIDENCE_REVIEWER_ROLES, ROLE_PERMISSIONS,
                     SENSITIVE_ACTION_CONTROLS, SENSITIVE_ACTIONS, CREATE_DRAFT, User, coerce_user, data_dir_from_env)
from .extraction import extract_profile, parse_field_assignments, parse_field_value
from .question_bank import (answer_options, get_question, intake_field, intake_fields, parse_answer,
                            parse_evidence_refs, template_meta)
from .safety import asks_compliance_determination, asks_legal_classification, detect_approval_bypass, detect_injection
from .store import Store, utcnow, valid_id
from .tools import ToolContext, ToolInputError, ToolPermissionError, invoke

GUIDED_STATES = {"intake", "tier_review", "questions"}
VERSION = load_control_library()["library"]["version"]
REG_NOTE = ("Regulatory applicability timelines must be verified against the current Official Journal text and any "
            "amendments; VERITRAIL has not verified post-2025 changes.")

_RX = lambda p: re.compile(p, re.IGNORECASE)  # noqa: E731
START_RE = _RX(r"\b(assess|assessment|evaluate|review|triage|onboard|register)\b.{0,40}?\b(use[- ]?case|ai system|system|agent|model|chatbot|copilot|application|app|tool)\b|"
               r"\b(start|begin|new|run)\b.{0,20}\b(assessment|intake|use[- ]?case)\b|^\s*(assess|start assessment)\b|"
               r"\bwe (want|plan|are planning|would like) to (deploy|launch|build|use)\b")
GAP_RE = _RX(r"\b(gap analysis|gaps?|gap register|what are we missing|findings)\b")
REPORT_RE = _RX(r"\b(generate|create|produce|export|download|build|give me)\b.{0,30}\b(report|pdf|csv|json|deliverable)\b|^\s*report\s*$")
TASK_RE = _RX(r"\b(create|open|raise|log|add)\b.{0,30}\b(remediation\s+)?(tasks?|tickets?|actions?)\b")
POLICY_RE = _RX(r"\b(draft|generate|create|write|propose|suggest)\b.{0,40}\b(runtime\s+|guardrail\s+|shield\s+)?(policy|policies|guardrails?)\b")
LOGS_RE = _RX(r"\b(runtime|guardrail|shield|policy)\s+(logs?|decisions?|events?|blocks?)\b|\bblocked\s+(requests?|prompts?)\b")
INVENTORY_RE = _RX(r"\b(list|show|search|find|display)\b.{0,25}\b(ai\s+)?(systems|inventory|records|use cases)\b|"
                   r"\b(which|what|how many)\s+(ai\s+)?(systems|use cases)\s+(do we have|are (registered|in the inventory|on record))")
APPROVALS_RE = _RX(r"\b(pending|open|my|list|show|status of)\b.{0,20}\bapprovals?\b|\bapr_[a-z0-9]+\b.*\bstatus\b")
TIERQ_RE = _RX(r"\b(what|which)\b.{0,20}\b(risk\s+)?tier\b|\b(is|are)\s+(our|my|this|the)\b.{0,40}\b(high[- ]risk|low[- ]risk|risky)\b|\bhow risky\b")
HELP_RE = _RX(r"^\s*(hi|hello|hey|help|what can you do|who are you|menu|start|\?)\W*\s*$")
QUESTION_RE = _RX(r"^\s*(how|what|why|when|which|who|where|should|is|are|does|do|did)\b")
LIBRARY_RE = _RX(r"\bhow many (veritrail )?controls\b|\b(list|show|what are)\b.{0,15}\b(all\s+)?(the\s+)?(veritrail\s+)?(controls|pillars)\b|"
                 r"\b(veritrail\s+)?(control\s+library|pillars)\b.{0,20}\b(overview|structure)?\s*\??$")
PACKS_RE = _RX(r"\b(which|what|list|show)\b.{0,25}\b(policy|industry|runtime)\s+packs\b|\b(policy|industry|runtime)\s+packs?\b.{0,20}\b(exist|available|are there|do you have)\b")
MATURITY_RE = _RX(r"\b(rate|score|assess|measure|benchmark|check|what is|what's|evaluate)\b.{0,25}\b(our|my|the organi[sz]ation'?s?)\b.{0,25}\bmaturity\b|"
                  r"\bhow mature\b|\bmaturity (self[- ])?assessment\b|\bmaturity levels?\b")
USECASE_CONTROLS_RE = _RX(r"\b(what|which)\b.{0,30}\b(veritrail\s+)?(controls?|guardrails?|safeguards?|governance\s+controls?)\b.{0,50}"
                          r"\b(apply|applies|need|needed|required|require|should|recommend\w*|for)\b.{0,80}"
                          r"\b(agents?|assistants?|chatbots?|copilots?|bots?|models?|systems?|tools?|use[- ]?cases?|apps?|applications?)\b|"
                          r"\b(recommend|suggest|list)\b.{0,20}\b(controls?|guardrails?)\b.{0,20}\bfor\s+(an?|our|the|my)\b")
CANCEL_RE = _RX(r"^\s*(cancel|stop|quit|exit|abort|restart|reset)\b")
AFFIRM_RE = _RX(r"^\s*(y|yes|confirm|confirmed|go ahead|proceed|ok|okay|do it|continue|start|begin|sure)\b")
NEGATE_RE = _RX(r"^\s*(n|no|cancel|don't|do not|stop|abort)\b")
SKIP_RE = _RX(r"^\s*(skip|pass|next)\s*$")
REMAINING_RE = _RX(r"\b(all\s+)?remaining\b.{0,15}?[:=]?\s*(implemented|partial|not[ _]implemented|unknown|not[ _]applicable)\b")
BULK_RE = _RX(r"(UC-[A-Z]{2,4}-Q\d{1,2})\s*[:=]\s*([^\n;]+)")
FRAMEWORK_INTENT_RE = _RX(r"\b(map|maps|mapped|mapping|mappings|crosswalk|correspond|align|alignment|relate)\b|"
                          r"\bwhich (veritrail )?controls?\b.{0,40}\b(eu ai act|iso|nist|article|art\.|annex|govern|measure|manage|clause)\b")

SENSITIVE_PATTERNS = [
    ("change_risk_tier", _RX(r"\b(change|lower|reduce|raise|increase|downgrade|upgrade|set|reclassify|move|update|override|drop)\b.{0,40}\b(risk[- ])?tier\b|"
                             r"\b(classify|mark|treat|record|re-?classify|label)\b.{0,30}\bas\s+(low|medium|minimal)[- ]risk\b")),
    ("confirm_risk_tier", _RX(r"\bconfirm\b.{0,20}\b(risk[- ])?tier\b")),
    ("approve_exception", _RX(r"\b(approve|grant|accept|sign off|waive|record)\b.{0,40}\b(exception|waiver|risk acceptance|deviation)\b|\baccept the risk\b")),
    ("activate_runtime_policy", _RX(r"\b(activate|enable|deploy|push|turn on|switch on|enforce|promote|apply|roll out)\b.{0,50}\b(policy|policies|guardrails?)\b.{0,40}\b(production|prod|live|enforce|enforcement)\b|"
                                    r"\b(switch|move|set)\b.{0,40}\b(enforce|enforcement)\s+mode\b|\bto production\b.{0,30}\bpolicy\b")),
    ("export_sensitive_evidence", _RX(r"\b(export|download|send|share|extract)\b.{0,40}\bevidence\b")),
    ("send_external_communication", _RX(
        r"\b(send|email|e-mail|forward|submit|share|publish|post)\s+(the\s+|this\s+|our\s+|my\s+|a\s+|that\s+)?(readiness\s+|final\s+|draft\s+)?"
        r"(report|results|assessment|findings|summary|letter|notice|message|notification|email|update|it|this|that|gap register|statement)\b"
        r".{0,40}\b(to|with)\s+(the\s+|our\s+|a\s+|all\s+)?(regulators?|customers?|auditors?|supervisory\s+authorit(y|ies)|authorit(y|ies)|external\s+\w+|clients?|press|board|partners?|vendors?)\b|"
        r"\bnotify\s+(the\s+|our\s+|all\s+)?(regulators?|customers?|authorit(y|ies)|supervisory|clients?|data subjects)\b|"
        r"\b(send|e-?mail|forward)\b.{0,40}\bto\s+\S+@\S+")),
]


def _tier_from_text(text: str) -> str | None:
    m = re.search(r"\b(prohibited[- ]review|high|medium|low)\b", text or "", re.IGNORECASE)
    if not m:
        return None
    t = m.group(1).lower()
    return "Prohibited-review" if t.startswith("prohibited") else t.capitalize()


class VeritrailAgent:
    def __init__(self, data_dir: str | Path | None = None, llm_adapter=None):
        self.data_dir = data_dir_from_env(data_dir)
        self.store = Store(self.data_dir)
        self.audit = AuditLog(self.store.audit_path)
        self.llm_adapter = llm_adapter

    # ================================================================== public API
    def handle(self, message: str, session_id: str | None = None, user=None) -> dict:
        user = coerce_user(user)
        trace_id = new_id("trc")
        message = (message or "")[:4000]
        try:
            session = self._load_session(session_id, user)
        except PermissionError:
            self.audit.append("agent.security.session_mismatch", user.id, {"session_id": session_id},
                              trace_id=trace_id, outcome="denied")
            session = self._new_session(user)  # fresh session; the other user's state is never exposed
        ctx = ToolContext(store=self.store, audit=self.audit, user=user, trace_id=trace_id, session_id=session["id"])
        try:
            resp = self._route(message, session, ctx)
        except ToolPermissionError as exc:
            resp = self._denied(str(exc))
        except ToolInputError as exc:
            resp = Response("input_error")
            resp.answer = f"I couldn't complete that: {exc}"
            resp.clarifying_question = "Could you provide the missing or corrected detail?"
        self._maybe_polish(resp)
        # Defence in depth: a deterministic answer must never carry a prohibited claim.
        out = resp.to_dict(session_id=session["id"], trace_id=trace_id, state=session["state"], tool_calls=ctx.calls)
        if find_prohibited_claims(out["message"]):
            safe = Response("safety_fallback")
            safe.answer = ("I can't provide that statement. VERITRAIL reports governance readiness and evidence status; it "
                           "does not determine or certify compliance.")
            out = safe.to_dict(session_id=session["id"], trace_id=trace_id, state=session["state"], tool_calls=ctx.calls)
        red_msg = redact(message).text
        session.setdefault("transcript", []).append({"role": "user", "text": red_msg, "ts": utcnow(), "trace_id": trace_id})
        session["transcript"].append({"role": "agent", "intent": out["intent"], "text": redact(out["message"]).text[:6000],
                                      "ts": utcnow(), "trace_id": trace_id})
        session["transcript"] = session["transcript"][-200:]
        self.store.put("sessions", session)
        self.audit.append("agent.turn", user.id, {
            "session_id": session["id"], "role": user.role, "message": red_msg[:500], "intent": out["intent"],
            "state": out["state"], "tools": [c["tool"] for c in ctx.calls],
            "approvals": [a["approval_id"] for a in out["pending_approvals"]], "citations": out["citations"],
            "llm_used": out["llm"].get("used", False)}, trace_id=trace_id, resource=session.get("assessment_id"))
        return out

    def call_tool(self, name: str, user, session_id: str | None = None, **kwargs) -> dict:
        """Programmatic tool access (API/UI) with the same RBAC and audit logging as agent turns."""
        u = coerce_user(user)
        ctx = ToolContext(store=self.store, audit=self.audit, user=u, trace_id=new_id("trc"), session_id=session_id)
        return invoke(ctx, name, **kwargs)

    def resolve_approval(self, approval_id: str, decision: str, approver, note: str = "") -> dict:
        """Resolve a pending approval. Called by an approver UI / admin CLI — never by the agent itself."""
        return approvals_svc.resolve_approval(self.store, self.audit, approval_id, decision, coerce_user(approver), note)

    def list_approvals(self, status: str | None = None) -> list[dict]:
        return [a for a in self.store.list("approvals") if not status or a.get("status") == status]

    def review_evidence(self, evidence_ref: str, reviewer, accepted: bool = True, note: str = "") -> dict:
        """Mark referenced evidence as reviewed by a named reviewer (approver/admin, not the submitter)."""
        r = coerce_user(reviewer)
        if r.role not in EVIDENCE_REVIEWER_ROLES:
            raise PermissionError("Only approver/admin roles may review evidence.")
        if not (r.name or "").strip():
            raise PermissionError("Evidence review requires a named reviewer (user.name).")
        ev = next((e for e in self.store.list("evidence") if e.get("ref", "").upper() == evidence_ref.upper()), None)
        if ev is None:
            raise KeyError(f"Evidence {evidence_ref} not found")
        if ev.get("submitted_by") == r.id:
            raise PermissionError("Separation of duties: the submitter cannot review their own evidence.")
        ev.update(reviewed_by=r.name, reviewer_id=r.id, reviewed_at=utcnow(),
                  review_status="accepted" if accepted else "rejected", review_note=redact(note).text[:500],
                  label="Verified" if accepted else "Rejected on review")
        self.store.put("evidence", ev)
        self.audit.append("evidence.reviewed", r.id, {"evidence": ev["ref"], "accepted": accepted},
                          resource=ev.get("assessment_id"))
        return ev

    # ================================================================== sessions
    def _new_session(self, user: User, session_id: str | None = None) -> dict:
        return {"id": session_id or self.store.new_id("sessions"), "user_id": user.id, "state": "idle",
                "profile": {}, "provenance": {}, "transcript": []}

    def _load_session(self, session_id: str | None, user: User) -> dict:
        if session_id and valid_id(session_id):
            s = self.store.get("sessions", session_id)
            if s is None:
                return self._new_session(user, session_id)
            if s.get("user_id") != user.id:
                # Never let one identity continue another identity's session.
                raise PermissionError("Session belongs to a different user.")
            return s
        return self._new_session(user)

    def _reset(self, session: dict) -> None:
        for k in ("asked_field", "assessment_id", "system_id", "current_q", "risk", "pending_confirmation"):
            session.pop(k, None)
        session.update(state="idle", profile={}, provenance={})

    # ================================================================== routing
    def _route(self, text: str, session: dict, ctx: ToolContext) -> Response:
        t = text.strip()
        if not t:
            return self._help()
        inj = detect_injection(t)
        if inj == ["compliance_claim_coercion"]:
            # A request to *state* compliance without override/jailbreak markers: answer with the
            # readiness framing (and the explicit refusal) rather than treating the user as hostile.
            self.audit.append("agent.security.claim_coercion", ctx.user.id, {"message": redact(t).text[:300]},
                              trace_id=ctx.trace_id, outcome="refused")
            r = self._compliance_readiness(ctx, session, t)
            r.answer += (" VERITRAIL never states that an organization is compliant, certified or regulator-approved; it "
                         "reports readiness indicators and evidence status only.")
            return r
        if inj:
            return self._injection(ctx, t, inj)

        if session.get("pending_confirmation"):
            pc = session.pop("pending_confirmation")
            if AFFIRM_RE.match(t):
                return self._execute_confirmation(ctx, session, pc)
            if NEGATE_RE.match(t):
                r = Response("confirmation_cancelled")
                r.answer = "Cancelled — nothing was created."
                return r

        if CANCEL_RE.match(t) and session["state"] in GUIDED_STATES:
            self._reset(session)
            r = Response("assessment_cancelled")
            r.answer = ("Guided assessment closed. Saved responses remain on the draft assessment record. "
                        "Say \"assess a use case\" to start again.")
            return r

        if detect_approval_bypass(t):
            return self._approval_bypass(ctx, session, t)
        sens = next((a for a, rx in SENSITIVE_PATTERNS if rx.search(t)), None)
        if sens and not QUESTION_RE.match(t):
            return self._sensitive_action(ctx, session, t, sens)

        state = session["state"]
        if state == "questions":
            r = self._question_turn(ctx, session, t)
            if r is not None:
                return r
        if state == "intake":
            r = self._intake_turn(ctx, session, t)
            if r is not None:
                return r
        if state == "tier_review":
            r = self._tier_review_turn(ctx, session, t)
            if r is not None:
                return r

        if asks_legal_classification(t):
            return self._with_reprompt(session, self._legal_classification(ctx, t))
        if asks_compliance_determination(t):
            return self._with_reprompt(session, self._compliance_readiness(ctx, session, t))
        if LIBRARY_RE.search(t):
            return self._with_reprompt(session, self._library_overview())
        if PACKS_RE.search(t):
            return self._with_reprompt(session, self._packs_overview(t))
        if MATURITY_RE.search(t):
            return self._with_reprompt(session, self._maturity_overview())
        if START_RE.search(t) and state not in GUIDED_STATES and not re.search(r"\?\s*$", t):
            return self._start_guided(ctx, session, t)
        if REPORT_RE.search(t) and not QUESTION_RE.match(t):
            return self._report(ctx, session, t)
        if TASK_RE.search(t) and not QUESTION_RE.match(t):
            return self._tasks(ctx, session, t)
        if POLICY_RE.search(t) and not re.search(r"\?\s*$", t) and not QUESTION_RE.match(t):
            return self._draft_policy(ctx, session)
        if LOGS_RE.search(t):
            return self._runtime_logs(ctx, t)
        if APPROVALS_RE.search(t):
            return self._approvals_status(ctx)
        if GAP_RE.search(t) and (session.get("assessment_id") or re.search(r"\basm_\w+", t)) or re.search(r"\b(gap analysis|show (me )?(the )?gaps)\b", t, re.I):
            return self._gaps(ctx, session, t)
        if INVENTORY_RE.search(t) and not knowledge.CONTROL_ID_RE.search(t) and not re.search(r"\bcontrols?\b", t, re.I):
            return self._inventory(ctx, t)
        if (USECASE_CONTROLS_RE.search(t) and not knowledge.CONTROL_ID_RE.search(t)
                and not knowledge.parse_framework_refs(t)):
            return self._with_reprompt(session, self._use_case_controls(ctx, session, t))
        if TIERQ_RE.search(t) and not knowledge.CONTROL_ID_RE.search(t):
            return self._with_reprompt(session, self._tier_question(ctx, session, t))
        if knowledge.CONTROL_ID_RE.search(t):
            return self._with_reprompt(session, self._control_lookup(ctx, session, t))
        if knowledge.MATURITY_QID_RE.search(t) or knowledge.UC_QID_RE.search(t):
            return self._with_reprompt(session, self._question_lookup(ctx, t))
        if knowledge.parse_framework_refs(t) or (FRAMEWORK_INTENT_RE.search(t) and knowledge.detect_frameworks(t)):
            return self._with_reprompt(session, self._framework_mapping(ctx, session, t))
        if HELP_RE.match(t):
            return self._help()
        if AFFIRM_RE.match(t) and len(t.split()) <= 3:
            r = Response("nothing_pending")
            r.answer = "There is nothing awaiting your confirmation right now."
            r.next_actions = ["Ask a governance question or say \"assess a use case\"."]
            return r
        return self._with_reprompt(session, self._ask(ctx, session, t))

    def _with_reprompt(self, session: dict, r: Response) -> Response:
        """When a side question is asked mid-assessment, answer it and repeat the pending prompt."""
        if session["state"] == "questions" and session.get("current_q"):
            q = get_question(session["current_q"])
            r.details.append(f"_Back to the assessment — {q['id']}: {q['text']} (implemented / partial / not implemented / unknown / not applicable)_")
        elif session["state"] == "intake" and session.get("asked_field"):
            r.details.append(f"_Back to intake — {intake_field(session['asked_field'])['prompt']}_")
        return r

    # ================================================================== helpers
    def _can(self, ctx: ToolContext, permission: str) -> bool:
        return permission in ROLE_PERMISSIONS.get(ctx.user.role, set()) and ctx.user.role not in ("anonymous", "viewer")

    def _denied(self, reason: str) -> Response:
        r = Response("permission_denied")
        r.answer = (f"That action isn't available to your role ({reason}). VERITRAIL applies least privilege: viewers can ask "
                    "questions and run previews; assessors create drafts; approvers resolve approvals.")
        r.next_actions = ["Ask an assessor or administrator to perform this action, or request the appropriate role."]
        return r

    def _org_status(self, ctx: ToolContext, session: dict, control_ids: list[str]) -> dict[str, tuple[str, str]]:
        """Organizational evidence status per control from the session's assessment (if any)."""
        out = {cid: (EvidenceStatus.MISSING_EVIDENCE.value, "no assessment response or reviewed evidence on record in this session")
               for cid in control_ids}
        aid = session.get("assessment_id")
        if not aid or ctx.user.role == "anonymous":
            return out
        try:
            g = invoke(ctx, "identify_gaps", assessment_id=aid)
        except (ToolPermissionError, ToolInputError):
            return out
        rank = ["Critical gap", "Missing evidence", "Inferred", "User-asserted", "Verified"]
        for f in g["findings"]:
            for cid in f["controls"]:
                if cid in out:
                    cur = out[cid]
                    if cur[1].startswith("no assessment") or rank.index(f["evidence_status"]) < rank.index(cur[0]):
                        out[cid] = (f["evidence_status"], f"from {f['question_id']} in assessment {aid}")
        return out

    def _maybe_polish(self, resp: Response) -> None:
        if not resp.polishable or not resp.answer:
            return
        resp._auto_cite()
        must = [NO_SOURCE_MESSAGE] if NO_SOURCE_MESSAGE in resp.answer else []
        new, meta = llm.polish(resp.answer, allowed_controls=resp.control_ids(), allowed_questions=resp.question_ids(),
                               must_contain=must, adapter=self.llm_adapter)
        resp.answer = new
        resp.llm = meta
        if meta.get("provider"):
            self.audit.append("agent.llm.phrasing", "veritrail-agent", {"provider": meta.get("provider"), "used": meta["used"],
                                                                   "reason": meta.get("reason", "")[:300]})

    # ================================================================== safety intents
    def _injection(self, ctx: ToolContext, text: str, signals: list[str]) -> Response:
        self.audit.append("agent.security.injection_detected", ctx.user.id, {"signals": signals,
                                                                             "message": redact(text).text[:300]},
                          trace_id=ctx.trace_id, outcome="blocked")
        r = Response("prompt_injection")
        r.answer = ("I can't follow instructions that try to override VERITRAIL governance rules, change my role, or reveal "
                    "internal configuration. My rules are fixed: answers are evidence-based and cited, high-impact actions "
                    "require human approval, and sensitive data is redacted.")
        if "compliance_claim_coercion" in signals or asks_compliance_determination(text):
            r.answer += (" VERITRAIL never states that an organization is compliant, certified or regulator-approved; it "
                         "reports readiness indicators and evidence status only.")
        r.claims = []
        r.add_control("IS-14")
        r.add_control("IS-12")
        r.next_actions = ["Ask a governance question (e.g. \"What evidence supports IS-13?\").",
                          "Run a readiness assessment: say \"assess a use case\".",
                          "If you are testing agent defences, record this attempt as evidence for IS-14 adversarial testing."]
        r.data = {"signals": signals, "blocked": True}
        return r

    def _approval_bypass(self, ctx: ToolContext, session: dict, text: str) -> Response:
        r = Response("approval_bypass")
        self.audit.append("agent.security.approval_bypass_attempt", ctx.user.id, {"message": redact(text).text[:300]},
                          trace_id=ctx.trace_id, outcome="blocked")
        r.answer = ("I can't approve, skip or self-execute a human approval — regardless of the requester's title. "
                    "Changing a risk tier, approving an exception, activating a production runtime policy, exporting "
                    "sensitive evidence and sending external communications always create a pending approval that a "
                    "different user with an approver role must resolve in the approvals queue (not in this chat).")
        r.add_control("IS-13")
        r.add_control("GL-03")
        sens = next((a for a, rx in SENSITIVE_PATTERNS if rx.search(text)), None)
        if sens:
            sub = self._sensitive_action(ctx, session, text, sens, from_bypass=True)
            r.details += [sub.answer] + sub.details
            r.pending_approvals += sub.pending_approvals
            r.required_approvals += sub.required_approvals
            for s in sub.sources:
                if s["type"] == "control":
                    r.add_control(s["id"])
            r.data.update(sub.data)
        r.next_actions = ["An approver resolves pending items with: python3 -m veritrail_admin.cli approvals resolve <approval_id> --decision approve|reject --approver \"<name>\" --role approver"]
        r.data["executed"] = False
        return r

    def _sensitive_action(self, ctx: ToolContext, session: dict, text: str, action: str,
                          from_bypass: bool = False) -> Response:
        r = Response("approval_required")
        label = SENSITIVE_ACTIONS[action]
        for cid in SENSITIVE_ACTION_CONTROLS[action]:
            r.add_control(cid)
        r.required_approvals.append({"action": action, "why": f"{label} requires human approval and never self-executes."})
        r.data["executed"] = False
        if not self._can(ctx, CREATE_DRAFT):
            r.answer = (f"\"{label}\" requires human approval and your role ({ctx.user.role}) cannot raise approval "
                        "requests. Nothing has been changed.")
            r.next_actions = ["Ask an assessor to raise the approval request, or sign in with an assessor role."]
            return r
        resource, payload, reason = None, {}, redact(text).text[:300]
        if action in ("change_risk_tier", "confirm_risk_tier"):
            m = re.search(r"\bsys_[a-z0-9]+\b", text)
            resource = m.group(0) if m else session.get("system_id")
            to = _tier_from_text(re.split(r"\bto\b", text, maxsplit=1)[-1]) if re.search(r"\bto\b", text) else _tier_from_text(text)
            current = (session.get("risk") or {}).get("tier")
            if action == "confirm_risk_tier":
                to = to or current
            if not resource or not to:
                r.answer = (f"\"{label}\" requires human approval. To raise the request I need "
                            + ("the AI system (system ID or a guided assessment in this session)" if not resource else "")
                            + (" and " if not resource and not to else "")
                            + ("the target tier (Low, Medium, High or Prohibited-review)" if not to else "") + ". Nothing has been changed.")
                r.clarifying_question = "Which AI system and which target tier should the approval request cover?"
                return r
            payload = {"from_tier": current, "to_tier": to, "assessment_id": session.get("assessment_id")}
        elif action == "approve_exception":
            resource = session.get("assessment_id") or session.get("system_id")
            payload = {"control_ids": knowledge.real_control_ids(text), "expiry_days": 90,
                       "question_ids": [q.upper() for q in knowledge.UC_QID_RE.findall(text)]}
        elif action == "activate_runtime_policy":
            m = re.search(r"\bpol_[a-z0-9]+\b", text)
            resource = m.group(0) if m else session.get("policy_id")
            if not resource:
                r.answer = ("Activating or changing a production runtime policy requires human approval, and there is no "
                            "draft policy in this session to attach the request to. Nothing has been activated.")
                r.clarifying_question = "Shall I draft a runtime policy first (monitor mode, non-production)? Say \"draft runtime policy\"."
                return r
            payload = {"environment": "production", "mode": "enforce"}
        elif action == "export_sensitive_evidence":
            aid = session.get("assessment_id") or (re.search(r"\basm_[a-z0-9]+\b", text) or [None])[0]
            if not aid:
                r.answer = ("Exporting sensitive evidence requires human approval, and I need to know which assessment's "
                            "evidence to export. Nothing has been exported.")
                r.clarifying_question = "Which assessment (asm_…) should the evidence pack cover?"
                return r
            res = invoke(ctx, "export_evidence_pack", assessment_id=aid)
            r.approval({**res, "type": "export_sensitive_evidence", "status": "pending", "resource": aid})
            r.answer = (f"Evidence export requires human approval. I created pending approval {res['approval_id']}; nothing "
                        "has been exported. After a different user with an approver role approves it, you can run the export "
                        "once with that approval ID.")
            return r
        elif action == "send_external_communication":
            rcpt = re.search(r"\b(regulators?|customers?|auditors?|supervisory authority|authorit(?:y|ies)|clients?|press|board|partners?)\b", text, re.I)
            resource = session.get("assessment_id")
            payload = {"to": rcpt.group(1).lower() if rcpt else "external recipient (unspecified)",
                       "subject": "VERITRAIL governance communication", "body_ref": session.get("last_report_id")}
        res = invoke(ctx, "request_human_approval", action=action, resource_id=resource, payload=payload, reason=reason)
        r.approval({**res, "status": "pending"})
        r.answer = (f"\"{label}\" requires human approval. I created pending approval {res['approval_id']}"
                    + (f" for {resource}" if resource else "") + ". Nothing has been changed; it takes effect only if a "
                    "different user with an approver role approves it.")
        if action in ("change_risk_tier", "confirm_risk_tier"):
            r.claim(f"Requested tier change: {payload.get('from_tier') or 'unconfirmed'} → {payload['to_tier']} (not applied)",
                    EvidenceStatus.USER_ASSERTED.value, ["EI-02", "GL-03"])
        r.data["approval_id"] = res["approval_id"]
        return r

    def _compliance_readiness(self, ctx: ToolContext, session: dict, text: str) -> Response:
        r = Response("compliance_readiness")
        r.polishable = True
        r.disclaimer = True
        fws = sorted(knowledge.detect_frameworks(text))
        names = {"eu_ai_act": "the EU AI Act", "iso_42001": "ISO/IEC 42001", "nist_ai_rmf": "the NIST AI RMF"}
        fw_txt = " or ".join(names[f] for f in fws) if fws else "any AI regulation or standard"
        if re.search(r"\b(apply|applies|applicable|in scope)\b", text, re.I):
            r.answer = (f"VERITRAIL cannot determine whether {fw_txt if fws else 'a law or standard'} legally applies to your "
                        "organization — applicability depends on your role (e.g. provider or deployer), your systems and "
                        "jurisdictions, and needs qualified legal review. VERITRAIL helps you prepare: record obligations by "
                        "system in an obligations register (AO-07), classify systems by risk (EI-02) and assess readiness "
                        "against the mapped controls.")
        else:
            r.answer = (f"VERITRAIL cannot determine, certify or guarantee whether your organization or system is compliant with {fw_txt}. "
                        "That is a legal determination (and, for ISO/IEC 42001 certification, a decision for an accredited "
                        "certification body). What VERITRAIL can do is assess readiness: which controls mapped to the framework "
                        "are in place, what evidence exists, and what gaps remain.")
        if "iso_42001" in fws:
            r.answer += " VERITRAIL does not issue certificates; it can prepare an audit-ready evidence pack (SE-05) for your certification body."
        if "eu_ai_act" in fws:
            r.answer += " " + REG_NOTE
        # readiness controls: critical/high controls mapped to the named frameworks
        pool = []
        for f in (fws or ["eu_ai_act", "iso_42001", "nist_ai_rmf"]):
            pool += knowledge.controls_for_framework(f)
        order = ["critical", "high", "medium", "low"]
        seen, sel = set(), []
        for c in sorted(pool, key=lambda c: (order.index(c["priority"]), c["id"])):
            if c["id"] not in seen:
                seen.add(c["id"])
                sel.append(c)
        sel = sel[:6]
        status = self._org_status(ctx, session, [c["id"] for c in sel])
        rows = []
        for c in sel:
            refs = "; ".join(f"{k}: {', '.join(map(str, c['mappings'][k]))}" for k in (fws or c["mappings"].keys()) if c["mappings"].get(k))
            rows.append(f"- {c['id']} {c['title']} — {refs}")
            r.add_control(c["id"])
            st, basis = status[c["id"]]
            r.claim(f"{c['id']} {c['title']}: organizational evidence status ({basis})", st, [c["id"]])
            if st != EvidenceStatus.VERIFIED.value:
                r.missing_evidence.append(f"{c['id']}: {c['evidence'][0]}")
        r.details.append("**Readiness indicators to evidence first (priority controls with indicative mappings):**\n" + "\n".join(rows))
        aid = session.get("assessment_id")
        if aid and ctx.user.role != "anonymous":
            try:
                g = invoke(ctx, "identify_gaps", assessment_id=aid)
                s = g["summary"]
                r.details.append(f"For the use case assessed in this session ({aid}), the gap register currently shows "
                                 f"{s['gaps']} gaps ({s['by_severity']['Critical']} Critical, {s['by_severity']['High']} High); "
                                 f"{s['by_evidence_status']['Verified']} findings are Verified by a named reviewer.")
            except (ToolPermissionError, ToolInputError):
                pass
        r.next_actions = [
            "Take the 24-question AI Governance Maturity Self-Assessment for an indicative, User-asserted baseline.",
            "Run a guided use-case assessment for your highest-risk system (say \"assess a use case\").",
            "Attach evidence for priority controls and have a named reviewer verify it.",
            "Obtain qualified legal review of applicability and obligations (AO-07).",
        ]
        r.add_control("AO-07")
        r.cta = CTA_BASELINE
        r.confidence, r.confidence_band = 1.0, "high"
        return r

    # ------------------------------------------------------------------ "what controls apply to <use case>"
    _THEME = {"EI": 0, "IS": 1, "SE": 2, "GL": 3, "AO": 4}
    _PRIORITY_PTS = {"critical": 3.0, "high": 2.0, "medium": 1.0, "low": 0.0}

    def _use_case_controls(self, ctx: ToolContext, session: dict, text: str) -> Response:
        """Structured baseline-control answer for a described use case (blueprint §4.5 shape).

        Derived, not hard-coded: keyword-extracted profile -> recommend_controls (applicable question-bank
        modules) + BM25 retrieval over controls/policy packs; each line uses the remediation text of the
        most relevant applicable question that cites the control."""
        from .question_bank import applicable_questions, select_modules
        r = Response("use_case_controls")
        r.polishable = True
        prof = extract_profile(text)
        prov = {k: EvidenceStatus.USER_ASSERTED.value for k in prof}
        if "genai" not in prof and re.search(r"\b(agent|assistant|chatbot|copilot|bot)\b", text, re.I):
            prof["genai"] = True
            prov["genai"] = EvidenceStatus.INFERRED.value
        prof.pop("purpose", None)
        prov.pop("purpose", None)
        signal = [k for k in prof if k != "name" and prov[k] == EvidenceStatus.USER_ASSERTED.value]
        if not signal or len(prof) < 2:
            r.intent = "clarify"
            r.answer = "I need a little more about the use case to recommend controls."
            r.clarifying_question = ("What does it do, what data and tools can it access, who is affected, and can it take "
                                     "actions (e.g. send messages, change records, move money)?")
            r.add_control("EI-04")
            return r
        recs = invoke(ctx, "recommend_controls", profile=prof, limit=64)
        tier = recs.get("tier")
        risk_mods = []
        try:
            risk = invoke(ctx, "calculate_risk_tier", profile=prof)
            risk_mods = risk.get("required_modules", [])
        except (ToolPermissionError, ToolInputError):
            risk = {}
        mods = {m["id"] for m in select_modules(prof, tier, risk_mods)}
        qs = applicable_questions(prof, tier, risk_mods)
        triggered = mods - {"core", "security", "monitoring_assurance"}
        res = invoke(ctx, "search_veritrail_knowledge", query=text, k=10)
        q_terms = set(knowledge.tokenize(text, expand=True))

        hits: dict[str, int] = {}
        for x in res["results"]:
            for cid in x["control_ids"]:
                hits[cid] = hits.get(cid, 0) + 1
        scores: dict[str, float] = {}
        for c in recs["controls"]:
            cid = c["id"]
            from_triggered = any(cid in q["controls"] and q["module"] in triggered for q in qs)
            scores[cid] = (self._PRIORITY_PTS.get(c["priority"], 0) + (2.0 if from_triggered else 0.0)
                           + 1.5 * min(3, hits.get(cid, 0)))
        ranked = sorted(scores, key=lambda c: (-scores[c], c))

        from .question_bank import module_by_id

        def targeted(q: dict) -> bool:  # question carries its own applicability condition that matched this profile
            raw = next(x for x in module_by_id(q["module"])["questions"] if x["id"] == q["id"])
            return bool(raw.get("applies_when"))

        for q in qs:  # narrowly targeted questions signal use-case-specific controls
            if targeted(q):
                for cid in q["controls"]:
                    if cid in scores:
                        scores[cid] += 2.0
        ranked = sorted(scores, key=lambda c: (-scores[c], c))

        def q_score(q: dict, cid: str) -> float:
            overlap = len(set(knowledge.tokenize(q["text"] + " " + q["remediation"], expand=True)) & q_terms)
            return 1.5 * overlap + (1.0 if q["controls"][0] == cid else 0) + (2 if q["module"] in triggered else 0)

        def best_question(cid: str) -> dict | None:
            cands = [q for q in qs if cid in q["controls"]]
            if not cands:
                return None
            return max(cands, key=lambda q: (q_score(q, cid), -qs.index(q)))

        lines: list[dict] = []
        used_q: dict[str, dict] = {}
        # Foundation first: the system must be registered with an accountable owner before other controls can
        # be evidenced — use the best-matching core-module inventory question from the question bank.
        core_inv = [q for q in qs if q["module"] == "core" and q["domain"] == "inventory"]
        if core_inv:
            q0 = core_inv[0]
            used_q[q0["id"]] = {"question": q0, "controls": list(q0["controls"])}
            lines.append(used_q[q0["id"]])
        covered = {c for ln in lines for c in ln["controls"]}
        for cid in ranked:
            if len(lines) >= 9:
                break
            if cid in covered:
                continue
            q = best_question(cid)
            if q is None:
                continue
            if q["id"] in used_q:
                if cid not in used_q[q["id"]]["controls"]:
                    used_q[q["id"]]["controls"].append(cid)
                continue
            line = {"question": q, "controls": [c for c in q["controls"] if c == cid or scores.get(c, 0) >= 5][:3]}
            used_q[q["id"]] = line
            lines.append(line)
            covered |= set(line["controls"])
        foundation = lines[:1] if core_inv else []
        rest = lines[len(foundation):]
        rest.sort(key=lambda ln: (self._THEME.get(ln["controls"][0][:2], 9), -max(scores.get(c, 0) for c in ln["controls"])))
        lines = foundation + rest

        status = self._org_status(ctx, session, sorted({c for ln in lines for c in ln["controls"]}))
        items = []
        for i, ln in enumerate(lines, 1):
            q = ln["question"]
            items.append(f"{i}. {q['remediation']} ({', '.join(ln['controls'])})")
            st, basis = status[ln["controls"][0]]
            r.claim(f"Item {i} ({', '.join(ln['controls'])}): organizational evidence status ({basis})", st, ln["controls"])
            r.add_question(q["id"])
            for cid in ln["controls"]:
                r.add_control(cid)
            if st != EvidenceStatus.VERIFIED.value:
                r.missing_evidence.append(f"{', '.join(ln['controls'])}: {'; '.join(q['evidence_expected'][:2])}")
        facts = "; ".join(f"{k} = {', '.join(v) if isinstance(v, list) else str(v).lower()} ({prov[k]})"
                          for k, v in prof.items() if k != "name")
        r.answer = (f"Recommended baseline controls for this use case, in priority order:\n" + "\n".join(items))
        r.details.append(f"**Based on what you described:** {facts}. "
                         + (f"Preliminary tier indication: {tier} (Inferred from partial intake; requires human confirmation). "
                            if tier else "")
                         + ("Modules considered: " + ", ".join(sorted(mods)) + "." if mods else ""))
        # supporting sources: relevant policy / industry packs (cited by id+version, never pasted)
        packs = [x for x in res["results"] if x["kind"] in ("policy_pack", "policy_pack_rule", "industry_pack")
                 and x["coverage"] >= 0.5]
        packs.sort(key=lambda x: 0 if x["kind"].startswith("policy") else 1)
        for x in packs[:2]:
            r.add_doc({k: v for k, v in x["source"].items() if k in ("id", "path", "policy_id", "policy_version", "title")})
        if packs:
            p0 = packs[0]["source"]
            label = (f"policy pack {p0.get('policy_id')} v{p0.get('policy_version')}" if p0.get("policy_id")
                     else f"{p0.get('title') or p0.get('path')}")
            r.details.append(f"Supporting template: {label} — a draft runtime policy you can tailor; it is not active "
                             "until reviewed and approved.")
        r.next_actions = ["Run a guided assessment to record implementation status and get a gap register (say \"assess a use case: …\").",
                          "Assign each control to its owner role and collect the listed evidence for named review.",
                          "Draft a runtime guardrail policy in observe mode (say \"draft runtime policy\" after the assessment)."]
        r.cta = CTA_BASELINE
        r.confidence, r.confidence_band = (0.9, "high") if lines else (0.0, "low")
        r.data = {"profile": prof, "profile_provenance": prov, "tier": tier,
                  "controls": [c for ln in lines for c in ln["controls"]]}
        if not lines:
            r.answer = NO_SOURCE_MESSAGE
        return r

    def _legal_classification(self, ctx: ToolContext, text: str) -> Response:
        r = Response("legal_classification")
        r.polishable = True
        r.disclaimer = True
        try:
            from veritrail_assessment.risk_tier import ANNEX_III_LIKE
            areas = sorted(set(ANNEX_III_LIKE.values()))
        except ImportError:
            areas = []
        r.answer = ("VERITRAIL does not make legal classifications under the EU AI Act (for example whether a system is "
                    "\"high-risk\" under Art. 6 and Annex III, or a prohibited practice under Art. 5). That determination "
                    "needs qualified legal review. VERITRAIL supports it with an indicative screen: the risk-tier rules flag use "
                    "cases in Annex III-like areas, material or automated decisions, special-category data and autonomous "
                    "agents for legal classification review, and record the outcome in the obligations register.")
        if areas:
            r.details.append("Areas the VERITRAIL screen flags for legal review: " + "; ".join(areas) + ".")
        r.details.append(REG_NOTE)
        for cid in ("EI-02", "AO-07", "AO-10", "GL-02"):
            r.add_control(cid)
            r.claim(f"{cid} {get_control(cid)['title']} — organizational evidence status (no reviewed evidence on record in this session)",
                    EvidenceStatus.MISSING_EVIDENCE.value, [cid])
        r.next_actions = ["Run a guided use-case assessment to obtain a preliminary, explainable tier (say \"assess a use case\").",
                          "Send flagged systems for legal classification review and record the result in the obligations register (AO-07)."]
        r.cta = CTA_BASELINE
        return r

    def _library_overview(self) -> Response:
        lib = load_control_library()
        r = Response("library_overview")
        counts = {p["id"]: sum(1 for c in lib["controls"] if c["pillar"] == p["id"]) for p in lib["pillars"]}
        crit = sum(1 for c in lib["controls"] if c["priority"] == "critical")
        r.answer = (f"The VERITRAIL Control Library v{VERSION} has {len(lib['controls'])} controls across {len(lib['pillars'])} pillars "
                    f"({crit} critical-priority). Each control has an objective, expected evidence, an owner role and indicative "
                    "NIST AI RMF, ISO/IEC 42001 and EU AI Act mappings.")
        r.details.append("\n".join(f"- **{p['id']} — {p['name']}** ({counts[p['id']]} controls): {p['summary']}" for p in lib["pillars"]))
        r.add_doc({"id": "controls.yaml", "path": "content/controls/controls.yaml", "section": f"Control Library v{VERSION}", "title": "VERITRAIL Control Library"})
        r.next_actions = ["Ask about any control by ID (e.g. \"What does IS-13 require?\")."]
        return r

    def _packs_overview(self, text: str) -> Response:
        from veritrail_common.paths import CONTENT_DIR
        r = Response("packs_overview")
        want_ind = bool(re.search(r"industry", text, re.I))
        want_pol = bool(re.search(r"policy|runtime", text, re.I)) or not want_ind
        lines = []
        for d, kind in ((CONTENT_DIR / "policy_packs", "policy"), (CONTENT_DIR / "industry_packs", "industry")):
            if (kind == "policy" and not want_pol) or (kind == "industry" and not want_ind):
                continue
            for p in sorted(d.glob("*.yaml")) if d.exists() else []:
                try:
                    import yaml as _y
                    data = _y.safe_load(p.read_text(encoding="utf-8")) or {}
                except Exception:
                    continue
                meta = data.get("pack") if isinstance(data.get("pack"), dict) else data
                pid = meta.get("policy_id") or meta.get("id") or p.stem
                ver = meta.get("version", "?")
                name = meta.get("policy_name") or meta.get("name") or pid
                status = meta.get("status", "")
                lines.append(f"- {name} — {pid} v{ver}" + (f" ({status})" if status else ""))
                src = {"id": pid, "path": f"content/{d.name}/{p.name}", "title": name}
                if kind == "policy":
                    src.update(policy_id=pid, policy_version=str(ver))
                r.add_doc(src)
        if not lines:
            r.answer = NO_SOURCE_MESSAGE
            return r
        r.answer = f"{len(lines)} pack(s) are available in this deployment:"
        r.details.append("\n".join(lines))
        r.details.append("Packs are templates (status shown); tailor them, then review and approve before use. "
                         "Activating a runtime policy in production requires human approval.")
        r.add_control("IS-12")
        return r

    def _maturity_overview(self) -> Response:
        from veritrail_common.content import load_assessment_template
        from veritrail_common.paths import ASSESSMENT_TEMPLATE_FILE
        t = load_assessment_template()
        r = Response("maturity")
        levels = t["scoring"]["levels"]
        r.answer = (f"VERITRAIL measures governance maturity with the {t['template']['name']} (v{t['template']['version']}): "
                    f"{len(t['questions'])} questions across {len(t['domains'])} weighted domains, scored 1–5 and rolled up to "
                    "0–100. Results are User-asserted readiness indicators, not a compliance determination. I can't rate your "
                    "maturity from a chat message — take the self-assessment for an indicative baseline.")
        r.details.append("Maturity levels: " + "; ".join(f"{lv['name']} ({lv['min']}–{lv['max']})" for lv in levels) + ".")
        r.add_doc({"id": t["template"]["id"], "path": "content/assessment_templates/" + ASSESSMENT_TEMPLATE_FILE.name,
                   "section": f"{t['template']['id']} v{t['template']['version']}", "title": t["template"]["name"]})
        r.next_actions = ["Take the self-assessment, then validate it with evidence in a Governance Baseline."]
        r.cta = CTA_ASSESSMENT
        return r

    # ================================================================== Ask VERITRAIL
    def _help(self) -> Response:
        r = Response("help")
        r.answer = ("I'm the VERITRAIL governance copilot. I can:\n"
                    "- answer AI governance, control and framework-mapping questions with citations (e.g. \"What does IS-11 require?\", "
                    "\"Which controls map to EU AI Act Art. 14?\");\n"
                    "- run a guided use-case assessment (\"assess a use case\") with risk tiering, gap analysis and a report;\n"
                    "- draft runtime guardrail policies and raise approval requests for sensitive actions.\n"
                    "I report readiness and evidence status — I never determine or certify compliance.")
        r.next_actions = ["Ask a governance question", "Say \"assess a use case\""]
        r.cta = CTA_ASSESSMENT
        return r

    def _out_of_scope(self) -> Response:
        r = Response("out_of_scope")
        r.answer = ("That's outside what VERITRAIL covers — I answer AI governance, risk, control and evidence questions. "
                    + NO_SOURCE_MESSAGE)
        r.next_actions = ["Ask about AI policies, controls, risk tiers, framework mappings or evidence.",
                          "Say \"assess a use case\" to start a guided assessment."]
        return r

    def _ask(self, ctx: ToolContext, session: dict, text: str) -> Response:
        # Retrieval never sees raw sensitive values: redact, then drop the redaction markers.
        red = redact(text)
        text = re.sub(r"\[REDACTED:[a-z_]+\]", " ", red.text).strip() or text
        if red.findings:  # focus on the actual question rather than the sentence that carried personal data
            qs = [seg for seg in re.split(r"(?<=[.!?])\s+|\s[-–—]\s", text) if seg.strip().endswith("?")]
            if qs:
                text = " ".join(qs)
        in_scope = knowledge.in_governance_scope(text)
        if not in_scope:
            # Vocabulary miss: still in scope if governed content matches strongly (e.g. VERITRAIL-specific terms).
            probe = knowledge.get_index().search(text, k=1)
            if probe and probe[0]["coverage"] >= 0.67 and probe[0]["score"] >= 8.0 and len(set(knowledge.tokenize(text))) >= 2:
                in_scope = True
        if not in_scope:
            words = re.findall(r"[a-z']+", text.lower())
            if len(words) <= 8 and set(words) & {"it", "this", "that", "these", "those", "they", "we", "our", "us"}:
                r = Response("clarify")
                r.answer = "I want to make sure I answer the right question, but I don't have enough context."
                r.clarifying_question = ("What does \"" + ("it" if "it" in words else "this") + "\" refer to — which AI system, "
                                         "policy, control or framework are you asking about?")
                return r
            return self._out_of_scope()
        words = re.findall(r"[a-z']+", text.lower())
        generic = {"control", "apply", "applie", "policy", "polic", "requirement", "need", "rule", "guardrail", "relevant"}
        if (len(words) <= 7 and set(words) & {"it", "this", "that", "these", "those", "they", "them"}
                and not set(knowledge.tokenize(text)) - generic):
            r = Response("clarify")
            r.answer = "I want to make sure I answer the right question, but I don't know what it refers to."
            r.clarifying_question = ("Which AI system, use case, control or framework do you mean? For a use case, describe "
                                     "what it does, its data and tools, and whether it can take actions.")
            return r
        res = invoke(ctx, "search_veritrail_knowledge", query=text, k=6)
        if knowledge.detect_frameworks(text):
            # Framework-level questions are best answered by the compliance mapping / framework documents.
            doc_res = invoke(ctx, "search_veritrail_knowledge", query=text, k=4,
                             kinds=["compliance_mapping", "content_doc", "industry_pack", "industry_pack_section"])
            if doc_res["results"] and doc_res["band"] != "low":
                res = {**doc_res, "results": doc_res["results"] + [x for x in res["results"] if x["kind"] == "control"][:2]}
        r = Response("ask")
        r.polishable = True
        r.confidence, r.confidence_band = res["confidence"], res["band"]
        content_terms = set(knowledge.tokenize(text))
        if res["band"] == "low":
            if len(content_terms) <= 2 or not res["results"]:
                r.intent = "clarify"
                opts = [x["title"] for x in res["results"][:3]]
                r.answer = "I want to make sure I answer the right question."
                r.clarifying_question = ("Could you be more specific — for example, which AI system, control or framework you mean"
                                         + (f"? Closest matches: {'; '.join(opts)}." if opts else "?"))
                if not res["results"]:
                    r.answer += " " + NO_SOURCE_MESSAGE
                return r
            r.intent = "no_source"
            r.answer = NO_SOURCE_MESSAGE + (" I couldn't find VERITRAIL content that answers this with enough confidence, "
                                            "so I won't guess.")
            r.clarifying_question = "Could you rephrase with the control, framework or governance activity you're asking about?"
            return r
        top = res["results"][0]
        keep = [x for x in res["results"] if x["score"] >= 0.45 * top["score"]][:4]
        lines = []
        q_terms = set(knowledge.tokenize(text, expand=True))
        for x in keep:
            lines.append(self._summarize_result(x, q_terms, r))
        r.answer = lines[0]
        if len(lines) > 1:
            r.details.append("**Related:**\n" + "\n".join(f"- {ln}" for ln in lines[1:]))
        ctrl_ids = []
        for x in keep:
            for cid in x["control_ids"]:
                if cid not in ctrl_ids:
                    ctrl_ids.append(cid)
        ctrl_ids = ctrl_ids[:6]
        status = self._org_status(ctx, session, ctrl_ids)
        for cid in ctrl_ids:
            c = get_control(cid)
            r.add_control(cid)
            st, basis = status[cid]
            r.claim(f"{cid} {c['title']} — organizational evidence status ({basis})", st, [cid])
            if st != EvidenceStatus.VERIFIED.value:
                r.missing_evidence.append(f"{cid}: {'; '.join(c.get('evidence', [])[:2])}")
        r.next_actions = ["Run a guided use-case assessment to record your implementation status (say \"assess a use case\")."]
        if ctrl_ids:
            r.next_actions.insert(0, f"Assign an owner for {ctrl_ids[0]} ({get_control(ctrl_ids[0])['owner_role']}) and collect the listed evidence.")
        r.cta = CTA_BASELINE
        return r

    def _summarize_result(self, x: dict, q_terms: set[str], r: Response) -> str:
        kind = x["kind"]
        if kind == "control":
            c = get_control(x["id"])
            r.add_control(c["id"])
            return (f"{c['id']} {c['title']} ({c['priority']} priority, owner: {c['owner_role']}): {c['objective']} "
                    f"Typical evidence: {'; '.join(c.get('evidence', [])[:3])}.")
        if kind in ("use_case_question", "maturity_question"):
            q = get_question(x["id"])
            r.add_question(x["id"])
            if q:
                return (f"Assessed by {q['id']}: \"{q['text']}\" ({', '.join(q['controls'])}). Recommended action: {q['remediation']}")
            text = x["text"]
            return f"Assessed by maturity question {x['id']} ({', '.join(x['control_ids'])}): {text[len(x['id']) + 1:][:300]}"
        if kind == "critical_flag":
            r.add_doc(x["source"])
            return f"Critical flag {x['title']} ({', '.join(x['control_ids'])})."
        # documents / policy packs: curated summary if available, else best matching sentences
        r.add_doc(x["source"])
        label = (f"Policy {x['source'].get('policy_id')} v{x['source'].get('policy_version') or '?'}" if x["source"].get("policy_id")
                 else x["source"]["path"])
        if x.get("summary"):
            return f"Per {label}, {x['summary']}"
        if kind.endswith(("_section", "_rule")) or kind in ("policy_pack", "industry_pack"):
            # structured pack content is cited, never pasted as flattened YAML
            sec = x["source"].get("section") or ""
            return f"See {label}" + (f" § {sec.replace('_', ' ')}" if sec else "") + f" ({x['source']['path']})."
        sents = re.split(r"(?<=[.!?])\s+|\n+", x["text"])
        scored = sorted(((len(set(knowledge.tokenize(s)) & q_terms), i, s) for i, s in enumerate(sents) if len(s.split()) >= 4),
                        key=lambda t: (-t[0], t[1]))
        best = " ".join(s.replace("**", "").strip(" -*#|>") for _, _, s in sorted(scored[:2], key=lambda t: t[1]))[:500]
        label = (f"Policy {x['source'].get('policy_id')} v{x['source'].get('policy_version') or '?'}" if x["source"].get("policy_id")
                 else f"{x['source']['path']}" + (f" § {x['source'].get('section')}" if x["source"].get("section") else ""))
        return f"Per {label}: {best}"

    def _control_lookup(self, ctx: ToolContext, session: dict, text: str) -> Response:
        r = Response("control_lookup")
        r.polishable = True
        known = controls_by_id()
        ids = []
        for m in knowledge.CONTROL_ID_RE.finditer(text):
            cid = f"{m.group(1).upper()}-{m.group(2)}"
            if cid not in ids:
                ids.append(cid)
        valid = [c for c in ids if c in known][:4]
        invalid = [c for c in ids if c not in known]
        parts = []
        for cid in invalid:
            parts.append(f"{cid} is not an VERITRAIL control ID in Control Library v{VERSION}; I won't describe a control that doesn't exist.")
        status = self._org_status(ctx, session, valid)
        for cid in valid:
            c = known[cid]
            r.add_control(cid)
            maps = "; ".join(f"{lbl}: {', '.join(map(str, c['mappings'].get(k) or [])) or 'no mapping'}"
                             for k, lbl in (("nist_ai_rmf", "NIST AI RMF"), ("iso_42001", "ISO/IEC 42001"), ("eu_ai_act", "EU AI Act")))
            parts.append(f"**{control_citation(cid)}** — {c['objective']} Priority: {c['priority']}; applies to: {c['applies_to']}; "
                         f"owner: {c['owner_role']}. Expected evidence: {'; '.join(c.get('evidence', []))}. "
                         f"Indicative framework mappings: {maps}.")
            qs = self._questions_citing(cid)
            for q in qs[:4]:
                r.add_question(q)
            if qs:
                parts[-1] += f" Assessed by: {', '.join(qs[:6])}."
            st, basis = status[cid]
            r.claim(f"{cid} implementation in your organization ({basis})", st, [cid])
            if st != EvidenceStatus.VERIFIED.value:
                r.missing_evidence.append(f"{cid}: {'; '.join(c.get('evidence', []))}")
        if not valid:
            r.intent = "control_not_found"
            parts.append(NO_SOURCE_MESSAGE)
            r.clarifying_question = "Did you mean a different control ID? Valid IDs use the AO/EI/GL/IS/SE-NN pattern (e.g. IS-11)."
        r.answer = parts[0]
        r.details += parts[1:]
        if valid:
            r.next_actions = [f"Confirm an owner ({known[valid[0]]['owner_role']}) and attach the expected evidence for {valid[0]} for named review.",
                              "Run a guided use-case assessment to record implementation status."]
            r.cta = CTA_BASELINE
        r.confidence, r.confidence_band = (1.0, "high") if valid else (0.0, "low")
        return r

    def _questions_citing(self, cid: str) -> list[str]:
        from veritrail_common.content import load_assessment_template
        from .question_bank import questions_by_id
        out = [q["id"] for q in load_assessment_template().get("questions", []) if cid in q.get("controls", [])]
        out += [qid for qid, q in questions_by_id().items() if cid in q["controls"]]
        return out

    def _question_lookup(self, ctx: ToolContext, text: str) -> Response:
        from veritrail_common.content import load_assessment_template
        r = Response("question_lookup")
        ids = [m.group(0).upper() for m in knowledge.MATURITY_QID_RE.finditer(text)] + \
              [m.group(0).upper() for m in knowledge.UC_QID_RE.finditer(text)]
        parts = []
        for qid in ids[:4]:
            q = get_question(qid)
            if q:
                r.add_question(qid)
                parts.append(f"**{qid}** ({q['module_name']}): {q['text']} Controls: {', '.join(q['controls'])}. "
                             f"Evidence expected: {'; '.join(q['evidence_expected'])}. Remediation if missing: {q['remediation']}")
                continue
            mq = next((x for x in load_assessment_template().get("questions", []) if x["id"] == qid), None)
            if mq:
                r.add_question(qid)
                parts.append(f"**{qid}** (maturity self-assessment): {mq['text']} Controls: {', '.join(mq['controls'])}. "
                             f"Recommended action: {mq['action']}")
            else:
                parts.append(f"{qid} is not a question in the VERITRAIL assessment templates.")
        if not r.question_ids():
            parts.append(NO_SOURCE_MESSAGE)
            r.intent = "question_not_found"
        r.answer, r.details = parts[0], parts[1:]
        return r

    def _framework_mapping(self, ctx: ToolContext, session: dict, text: str) -> Response:
        r = Response("framework_mapping")
        r.polishable = True
        r.disclaimer = True
        refs = knowledge.parse_framework_refs(text)
        label = knowledge.FRAMEWORK_LABELS
        parts = []
        all_ids: list[str] = []
        if refs:
            for fw, ref in refs[:5]:
                cs = knowledge.controls_for_framework_ref(fw, ref)
                if cs:
                    parts.append(f"Per VERITRAIL Control Library v{VERSION}, these controls carry an indicative mapping to "
                                 f"{label[fw]} {ref}: " + "; ".join(f"{c['id']} {c['title']}" for c in cs) + ".")
                    for c in cs:
                        r.add_control(c["id"])
                        if c["id"] not in all_ids:
                            all_ids.append(c["id"])
                else:
                    parts.append(f"No VERITRAIL control in Control Library v{VERSION} maps to {label[fw]} {ref}. {NO_SOURCE_MESSAGE}")
        else:
            fws = sorted(knowledge.detect_frameworks(text))
            for fw in fws:
                cs = knowledge.controls_for_framework(fw)
                crit = [c for c in cs if c["priority"] == "critical"]
                parts.append(f"{len(cs)} of {len(controls_by_id())} VERITRAIL controls carry indicative {label[fw]} mappings. "
                             f"Critical-priority ones: " + "; ".join(
                                 f"{c['id']} ({', '.join(map(str, c['mappings'][fw]))})" for c in crit) + ".")
                for c in crit:
                    r.add_control(c["id"])
                    if c["id"] not in all_ids:
                        all_ids.append(c["id"])
        # supplemental context from the compliance mapping document, if indexed
        res = invoke(ctx, "search_veritrail_knowledge", query=text, k=3, kinds=["compliance_mapping"])
        if res["results"] and res["band"] != "low":
            r.add_doc(res["results"][0]["source"])
        status = self._org_status(ctx, session, all_ids[:6])
        for cid in all_ids[:6]:
            st, basis = status[cid]
            r.claim(f"{cid}: organizational evidence status ({basis})", st, [cid])
        r.answer = parts[0] if parts else NO_SOURCE_MESSAGE
        r.details += parts[1:]
        r.details.append("Mappings are indicative VERITRAIL interpretations for readiness work, not official crosswalks or a "
                         "determination of conformity. " + (REG_NOTE if any(fw == "eu_ai_act" for fw, _ in refs) or "eu_ai_act" in knowledge.detect_frameworks(text) else ""))
        r.next_actions = ["Use the mapped controls as the evidence checklist for this framework area.",
                          "Run a guided use-case assessment to see which of these controls have evidence."]
        r.confidence, r.confidence_band = (1.0, "high") if all_ids else (0.0, "low")
        r.cta = CTA_BASELINE
        return r

    def _tier_question(self, ctx: ToolContext, session: dict, text: str) -> Response:
        r = Response("risk_tier")
        if session.get("risk"):
            risk = session["risk"]
            r.answer = (f"The preliminary risk tier for {session['profile'].get('name', 'this use case')} is **{risk['tier']}** "
                        f"(score {risk.get('score')}). It is Inferred from intake answers and requires human confirmation.")
            r.claim(f"Preliminary tier {risk['tier']}", EvidenceStatus.INFERRED.value, risk.get("citation_ids", ["EI-02"]))
            for cid in risk.get("citation_ids", ["EI-02"]):
                r.add_control(cid)
            return r
        prof = extract_profile(text)
        key = ["purpose", "decision_impact", "affected_parties", "data_sensitivity", "autonomy", "domain_category"]
        have = [k for k in key if k in prof]
        if len(have) >= 5:
            risk = invoke(ctx, "calculate_risk_tier", profile=prof)
            r.answer = (f"From your description, the preliminary tier is **{risk['tier']}** (score {risk['score']}). This is "
                        "Inferred from keywords and must be confirmed by a human.")
            r.claim(f"Preliminary tier {risk['tier']}", EvidenceStatus.INFERRED.value, risk.get("citation_ids", []))
            for cid in risk.get("citation_ids", []):
                r.add_control(cid)
            return r
        r.intent = "clarify"
        missing = [k for k in key if k not in prof]
        r.answer = ("I can't determine a risk tier without more information about the system. "
                    f"I still need: {', '.join(missing)}.")
        r.clarifying_question = ("Could you describe the system — what it does, who it affects, what data it uses and "
                                 "whether it can act on its own? Or say \"assess a use case\" for guided intake.")
        r.add_control("EI-02")
        r.add_control("GL-01")
        return r

    # ================================================================== inventory / logs / approvals
    def _inventory(self, ctx: ToolContext, text: str) -> Response:
        res = invoke(ctx, "search_ai_inventory", query="")
        r = Response("inventory")
        if not res["systems"]:
            r.answer = "No AI system records exist in the VERITRAIL inventory yet. Guided assessments create draft records (EI-01)."
        else:
            r.answer = f"{res['count']} AI system record(s) in the inventory:"
            r.details.append("\n".join(f"- {s['id']} — {s['name']} — status: {s['status']}; risk tier: "
                                       f"{s.get('risk_tier') or 'not confirmed'}" for s in res["systems"][:25]))
        r.add_control("EI-01")
        r.data = res
        return r

    def _runtime_logs(self, ctx: ToolContext, text: str) -> Response:
        q = re.sub(r"\b(show|search|find|list|runtime|logs?|guardrail|shield|me|the|for|recent)\b", " ", text, flags=re.I).strip()
        res = invoke(ctx, "search_runtime_logs", query=q if len(q) > 2 else "")
        r = Response("runtime_logs")
        r.answer = (f"{res['count']} runtime log record(s) matched (values redacted)." if res["count"]
                    else res["note"])
        r.data = res
        r.add_control("SE-08")
        r.add_control("IS-12")
        return r

    def _approvals_status(self, ctx: ToolContext) -> Response:
        r = Response("approvals_status")
        if ctx.user.role == "anonymous":
            return self._denied("approvals are not visible to anonymous users")
        items = [a for a in self.store.list("approvals")
                 if a.get("requested_by") == ctx.user.id or ctx.user.role in ("approver", "admin")]
        self.audit.append("agent.read.approvals", ctx.user.id, {"count": len(items)}, trace_id=ctx.trace_id)
        if not items:
            r.answer = "There are no approvals visible to you."
        else:
            r.answer = f"{len(items)} approval(s):"
            r.details.append("\n".join(f"- {a['approval_id']} — {a['type']} — {a['status']} — requested by {a['requested_by']}"
                                       for a in items[-25:]))
        r.add_control("IS-13")
        return r

    # ================================================================== guided assessment
    def _required_missing(self, profile: dict) -> list[str]:
        return [f["id"] for f in intake_fields() if f.get("required") and profile.get(f["id"]) in (None, "")]

    def _ask_field(self, session: dict, r: Response) -> None:
        missing = self._required_missing(session["profile"])
        fid = missing[0]
        f = intake_field(fid)
        session["asked_field"] = fid
        opts = f" Options: {', '.join(map(str, f['options']))}." if f.get("options") else ""
        r.clarifying_question = f"{f['prompt']}{opts}"
        req = [x for x in intake_fields() if x.get("required")]
        r.details.append(f"**Intake ({len(req) - len(missing)}/{len(req)} required fields known)** — {f['prompt']}{opts}")

    def _profile_table(self, session: dict) -> str:
        rows = [f"| {k} | {', '.join(v) if isinstance(v, list) else v} | {session['provenance'].get(k, 'User-asserted')} |"
                for k, v in session["profile"].items()]
        return "| Field | Value | Evidence status |\n|---|---|---|\n" + "\n".join(rows)

    def _start_guided(self, ctx: ToolContext, session: dict, text: str) -> Response:
        r = Response("assessment_intake")
        self._reset(session)
        session["state"] = "intake"
        head, sep, tail = text.partition(":")
        desc = tail.strip() if sep and len(head) <= 80 else text.strip()
        if not sep and len(desc.split()) <= 8 and START_RE.search(desc):
            desc = ""  # just a command such as "assess a use case"
        prof = extract_profile(desc) if len(desc.split()) >= 4 else {}
        session["profile"] = prof
        session["provenance"] = {k: EvidenceStatus.INFERRED.value for k in prof}
        if not self._can(ctx, CREATE_DRAFT):
            session["preview"] = True
        intro = ("Let's assess this AI use case. I'll gather intake facts, calculate a preliminary risk tier, select the "
                 "applicable question modules and then produce a gap register and report.")
        if session.get("preview"):
            intro += (" Your role allows a preview (intake, risk tier and recommended controls); recording answers and "
                      "generating reports require an assessor role.")
        if prof:
            r.answer = intro + " From your description I inferred the fields below (Inferred — correct any with \"field: value\")."
            r.details.append(self._profile_table(session))
        else:
            r.answer = intro
        r.add_control("EI-12")
        r.add_control("GL-01")
        if not prof:
            session["asked_field"] = "description"
            r.clarifying_question = ("Describe the use case in a few sentences: what it does, who uses it and is affected, what "
                                     "data and tools it uses, whether it can take actions, and which model/vendor it relies on.")
            return r
        return self._advance_intake(ctx, session, r)

    def _advance_intake(self, ctx: ToolContext, session: dict, r: Response) -> Response:
        if self._required_missing(session["profile"]):
            self._ask_field(session, r)
            return r
        return self._show_tier(ctx, session, r)

    def _intake_turn(self, ctx: ToolContext, session: dict, text: str) -> Response | None:
        r = Response("assessment_intake")
        prof, prov = session["profile"], session["provenance"]
        updated = []
        asked = session.get("asked_field")
        if asked == "description":
            cand = extract_profile(text)
            for k, v in cand.items():
                prof[k], prov[k] = v, EvidenceStatus.INFERRED.value
                updated.append(k)
            if updated:
                r.answer = "Thanks. I inferred the fields below (Inferred — correct any with \"field: value\")."
                r.details.append(self._profile_table(session))
                session.pop("asked_field", None)
                return self._advance_intake(ctx, session, r)
            if text.strip().endswith("?"):
                return None
            r.answer = "I couldn't extract any intake details from that."
            r.clarifying_question = "Please describe what the system does, who it affects, the data it uses and whether it takes actions."
            return r
        for k, v in parse_field_assignments(text).items():
            prof[k], prov[k] = v, EvidenceStatus.USER_ASSERTED.value
            updated.append(k)
        if asked and asked not in updated:
            v = parse_field_value(asked, text)
            if v is not None:
                prof[asked], prov[asked] = v, EvidenceStatus.USER_ASSERTED.value
                updated.append(asked)
        if not updated:
            if text.strip().endswith("?"):
                return None  # side question: answer it, then re-prompt
            f = intake_field(asked) if asked else None
            r.intent = "clarify"
            r.answer = "I couldn't match that to the intake question."
            if f:
                session["asked_field"] = asked
                opts = f" Please choose one of: {', '.join(map(str, f['options']))}." if f.get("options") else ""
                r.clarifying_question = f"{f['prompt']}{opts}"
            return r
        r.answer = "Recorded: " + ", ".join(f"{k} = {', '.join(prof[k]) if isinstance(prof[k], list) else prof[k]}" for k in updated) + "."
        session.pop("asked_field", None)
        return self._advance_intake(ctx, session, r)

    def _show_tier(self, ctx: ToolContext, session: dict, r: Response) -> Response:
        risk = invoke(ctx, "calculate_risk_tier", profile=session["profile"])
        session["risk"] = risk
        session["state"] = "tier_review"
        from .question_bank import applicable_questions, select_modules
        mods = select_modules(session["profile"], risk["tier"], risk.get("required_modules"))
        qs = applicable_questions(session["profile"], risk["tier"], risk.get("required_modules"))
        r.intent = "risk_tier"
        r.details.append(f"**Preliminary risk tier: {risk['tier']}** (score {risk.get('score')}; Inferred — requires human confirmation). "
                         f"{risk.get('rationale', '')}")
        if risk.get("triggers"):
            r.details.append("Triggers:\n" + "\n".join(f"- {t}" for t in risk["triggers"]))
        r.details.append("Applicable modules: " + "; ".join(f"{m['name']} ({m['reasons'][0]})" for m in mods)
                         + f". {len(qs)} questions in total.")
        r.claim(f"Preliminary risk tier {risk['tier']}", EvidenceStatus.INFERRED.value, risk.get("citation_ids", ["EI-02"]))
        for cid in risk.get("citation_ids", []):
            r.add_control(cid)
        if session.get("preview"):
            recs = invoke(ctx, "recommend_controls", profile=session["profile"], limit=8)
            r.details.append("Recommended controls for this profile:\n" + "\n".join(
                f"- {c['id']} {c['title']} ({c['priority']}; owner: {c['owner_role']})" for c in recs["controls"]))
            for c in recs["controls"]:
                r.add_control(c["id"])
            session["state"] = "preview_complete"
            r.next_actions = ["Ask an assessor to run the full assessment to record answers, produce the gap register and export a report.",
                              "Book a Governance Baseline to assess this and other priority systems with evidence."]
            r.cta = CTA_BASELINE
            return r
        r.clarifying_question = (f"Reply \"continue\" to create a draft AI system record and start the {len(qs)} questions, or correct "
                                 "any field first (e.g. \"autonomy: suggests\").")
        return r

    def _tier_review_turn(self, ctx: ToolContext, session: dict, text: str) -> Response | None:
        r = Response("assessment_intake")
        changes = parse_field_assignments(text)
        if not changes:  # a bare option value that belongs to exactly one select field
            norm = re.sub(r"[\s-]+", "_", text.strip().lower())
            owners = [f["id"] for f in intake_fields() if f["type"] == "select" and norm in [str(o).lower() for o in f["options"]]]
            if len(owners) == 1:
                changes = {owners[0]: parse_field_value(owners[0], norm)}
        if changes:
            for k, v in changes.items():
                session["profile"][k] = v
                session["provenance"][k] = EvidenceStatus.USER_ASSERTED.value
            r.answer = "Updated: " + ", ".join(f"{k} = {v}" for k, v in changes.items()) + ". Recalculating."
            return self._show_tier(ctx, session, r)
        if not AFFIRM_RE.match(text):
            return None
        # User confirmed the intake facts: inferred values become user-asserted.
        session["provenance"] = {k: EvidenceStatus.USER_ASSERTED.value for k in session["profile"]}
        sysrec = invoke(ctx, "create_ai_system_record", profile=session["profile"])["system"]
        st = invoke(ctx, "start_assessment", system_id=sysrec["id"], profile=session["profile"],
                    profile_provenance=session["provenance"])
        session.update(system_id=sysrec["id"], assessment_id=st["assessment_id"], state="questions", risk=st["risk"])
        appr = invoke(ctx, "request_human_approval", action="confirm_risk_tier", resource_id=sysrec["id"],
                      payload={"tier": st["risk"]["tier"], "to_tier": st["risk"]["tier"], "assessment_id": st["assessment_id"]},
                      reason=f"Confirm preliminary tier {st['risk']['tier']} for {sysrec['name']}")
        r.approval({**appr, "status": "pending"})
        r.intent = "assessment_started"
        r.answer = (f"Draft AI system record {sysrec['id']} and assessment {st['assessment_id']} created. The preliminary "
                    f"tier ({st['risk']['tier']}) needs human confirmation — I raised pending approval {appr['approval_id']} "
                    f"for the {st['risk'].get('approval_authority', 'approver')}.")
        r.add_control("EI-01")
        r.add_control("EI-02")
        return self._ask_next_question(ctx, session, r)

    def _ask_next_question(self, ctx: ToolContext, session: dict, r: Response) -> Response:
        a = self.store.get("assessments", session["assessment_id"])
        remaining = [q for q in a["questions"] if q not in a["responses"] and q not in session.get("skipped", [])]
        if not remaining:
            return self._finish_assessment(ctx, session, r)
        qid = remaining[0]
        q = get_question(qid)
        session["current_q"] = qid
        n = a["questions"].index(qid) + 1
        r.add_question(qid)
        for cid in q["controls"]:
            r.add_control(cid)
        r.details.append(f"**Question {n} of {len(a['questions'])} — {q['module_name']} ({qid})**\n{q['text']}\n"
                         f"Controls: {', '.join(q['controls'])} · Evidence expected: {'; '.join(q['evidence_expected'])}")
        r.clarifying_question = ("Answer implemented / partial / not implemented / unknown / not applicable, optionally with "
                                 "evidence references (e.g. \"implemented, evidence EV-104\"). Say \"skip\" to leave it unanswered.")
        return r

    def _question_turn(self, ctx: ToolContext, session: dict, text: str) -> Response | None:
        r = Response("assessment_question")
        aid = session["assessment_id"]
        qid = session.get("current_q")
        recorded = []
        m = REMAINING_RE.search(text)
        if m:
            ans = parse_answer(m.group(2))
            a = self.store.get("assessments", aid)
            for q in [q for q in a["questions"] if q not in a["responses"]]:
                invoke(ctx, "submit_assessment_response", assessment_id=aid, question_id=q, answer=ans)
                recorded.append(q)
            r.answer = f"Recorded \"{ans}\" for {len(recorded)} remaining question(s) (User-asserted)."
            return self._ask_next_question(ctx, session, r)
        bulk = BULK_RE.findall(text)
        if bulk:
            for q, rest in bulk:
                ans = parse_answer(rest)
                if ans:
                    invoke(ctx, "submit_assessment_response", assessment_id=aid, question_id=q.upper(), answer=ans,
                           evidence_refs=parse_evidence_refs(rest))
                    recorded.append(q.upper())
            if recorded:
                r.answer = f"Recorded {len(recorded)} answer(s): {', '.join(recorded)} (User-asserted)."
                return self._ask_next_question(ctx, session, r)
        if SKIP_RE.match(text) and qid:
            session.setdefault("skipped", []).append(qid)
            r.answer = f"Skipped {qid} — it will appear as an Inferred gap until answered."
            return self._ask_next_question(ctx, session, r)
        first_clause = re.split(r"[,;.—–]|\s-\s", text, maxsplit=1)[0]
        ans = parse_answer(first_clause) or (parse_answer(text) if len(text.split()) <= 12 else None)
        if ans and qid:
            refs = parse_evidence_refs(text)
            notes = text if len(text) > len(first_clause) + 2 else ""
            res = invoke(ctx, "submit_assessment_response", assessment_id=aid, question_id=qid, answer=ans,
                         evidence_refs=refs, notes=notes)
            r.answer = (f"Recorded {qid}: {answer_options()[ans]['label']}"
                        + (f" with evidence {', '.join(refs)} (pending named review)" if refs else "") + " — User-asserted.")
            for ref in refs:
                r.add_evidence(ref, "User-asserted, pending review")
            return self._ask_next_question(ctx, session, r)
        return None  # not an answer: let the router treat it as a side question

    def _finish_assessment(self, ctx: ToolContext, session: dict, r: Response) -> Response:
        aid = session["assessment_id"]
        g = invoke(ctx, "identify_gaps", assessment_id=aid)
        recs = invoke(ctx, "recommend_controls", assessment_id=aid, limit=5)
        session["state"] = "complete"
        session.pop("current_q", None)
        s = g["summary"]
        r.intent = "assessment_complete"
        r.details.append(f"**Assessment complete.** {s['answered']} of {s['questions']} questions answered; {s['gaps']} gaps: "
                         + ", ".join(f"{n} {k}" for k, n in s["by_severity"].items()) + ".")
        top = g["gaps"][:6]
        if top:
            r.details.append("Top gaps:\n" + "\n".join(
                f"- {x['gap_id']} [{x['severity']} · {x['evidence_status']}] {x['question_id']}: {x['recommended_action']} "
                f"({', '.join(x['controls'])}; owner: {x['owner_role']}; due {x['due_date']})" for x in top))
        for x in top:
            r.claim(f"{x['gap_id']} {x['question_id']} ({', '.join(x['controls'])})", x["evidence_status"], x["controls"])
            r.add_question(x["question_id"])
            r.missing_evidence.append(f"{x['question_id']}: {'; '.join(x['evidence_expected'][:2])}")
        for c in recs["controls"]:
            r.add_control(c["id"])
        r.next_actions = ["Say \"generate report\" for the Markdown/PDF/CSV/JSON readiness report.",
                          "Say \"create remediation tasks for critical gaps\" (you'll be asked to confirm).",
                          "Say \"draft runtime policy\" for guardrail recommendations (monitor mode).",
                          "Attach evidence and ask an approver to review it so findings can become Verified."]
        r.data = {"summary": s, "assessment_id": aid}
        return r

    # ================================================================== post-assessment intents
    def _resolve_assessment(self, session: dict, text: str) -> str | None:
        m = re.search(r"\basm_[a-z0-9]+\b", text)
        return m.group(0) if m else session.get("assessment_id")

    def _gaps(self, ctx: ToolContext, session: dict, text: str) -> Response:
        aid = self._resolve_assessment(session, text)
        r = Response("gap_analysis")
        if not aid:
            r.intent = "clarify"
            r.answer = "There is no assessment in this session to analyse."
            r.clarifying_question = "Which assessment (asm_…) should I analyse, or shall we start one? Say \"assess a use case\"."
            return r
        g = invoke(ctx, "identify_gaps", assessment_id=aid)
        s = g["summary"]
        r.answer = (f"Gap analysis for {aid} (tier {g['tier']}): {s['gaps']} gaps — "
                    + ", ".join(f"{n} {k}" for k, n in s["by_severity"].items()) + ".")
        r.details.append("| Gap | Severity | Evidence status | Question | Controls | Owner | Due |\n|---|---|---|---|---|---|---|\n" + "\n".join(
            f"| {x['gap_id']} | {x['severity']} | {x['evidence_status']} | {x['question_id']} | {', '.join(x['controls'])} | {x['owner_role']} | {x['due_date']} |"
            for x in g["gaps"][:20]))
        for x in g["gaps"][:20]:
            r.claim(f"{x['gap_id']} {x['question_id']}", x["evidence_status"], x["controls"])
            r.add_question(x["question_id"])
        r.data = {"summary": s}
        return r

    def _report(self, ctx: ToolContext, session: dict, text: str) -> Response:
        aid = self._resolve_assessment(session, text)
        r = Response("report")
        if not aid:
            r.intent = "clarify"
            r.answer = "There is no assessment in this session to report on."
            r.clarifying_question = "Which assessment (asm_…) should the report cover, or shall we start one?"
            return r
        res = invoke(ctx, "generate_report", assessment_id=aid)
        session["last_report_id"] = res["report_id"]
        r.answer = (f"Draft report {res['report_id']} generated for {aid} ({res['summary']['gaps']} gaps). Exports: "
                    + ", ".join(f"{k.upper()}: {v}" for k, v in res["paths"].items() if v) + ".")
        if res["errors"]:
            r.details.append("Export issues: " + "; ".join(res["errors"].values()))
        r.details.append("The report states readiness and evidence status only; sharing it externally requires human approval.")
        r.data = {"report_id": res["report_id"], "paths": res["paths"]}
        r.add_control("SE-05")
        return r

    def _tasks(self, ctx: ToolContext, session: dict, text: str) -> Response:
        aid = self._resolve_assessment(session, text)
        r = Response("remediation_tasks")
        if not aid:
            r.intent = "clarify"
            r.answer = "There is no assessment in this session, so there are no gaps to create tasks for."
            r.clarifying_question = "Which assessment (asm_…) should I use?"
            return r
        sev = [s for s in ("Critical", "High", "Medium", "Low") if re.search(rf"\b{s}\b", text, re.I)] or None
        gap_ids = re.findall(r"\bGAP-\d{3}\b", text.upper()) or None
        try:
            res = invoke(ctx, "create_remediation_task", assessment_id=aid, gap_ids=gap_ids, severities=sev, confirmed=False)
        except ToolInputError:
            g = invoke(ctx, "identify_gaps", assessment_id=aid)
            r.answer = ("No gaps match that request, so no tasks were proposed. Current gaps by severity: "
                        + ", ".join(f"{n} {k}" for k, n in g["summary"]["by_severity"].items()) + ".")
            r.clarifying_question = "Which severity or gap IDs (e.g. GAP-003) should the tasks cover?"
            return r
        session["pending_confirmation"] = {"kind": "remediation_tasks", "assessment_id": aid, "gap_ids": gap_ids, "severities": sev}
        r.answer = f"I'm ready to create {len(res['preview'])} remediation task(s). Nothing has been created yet."
        r.details.append("\n".join(f"- {p['gap_id']} [{p['severity']}] {p['title']} — {', '.join(p['controls'])}; owner: "
                                   f"{p['owner_role']}; due {p['due_date']}" for p in res["preview"]))
        r.clarifying_question = "Reply \"confirm\" to create these tasks, or \"cancel\"."
        r.data = {"status": "confirmation_required", "preview": res["preview"]}
        return r

    def _execute_confirmation(self, ctx: ToolContext, session: dict, pc: dict) -> Response:
        r = Response("remediation_tasks")
        if pc["kind"] == "remediation_tasks":
            res = invoke(ctx, "create_remediation_task", assessment_id=pc["assessment_id"], gap_ids=pc.get("gap_ids"),
                         severities=pc.get("severities"), confirmed=True)
            r.answer = f"Created {res['count']} remediation task(s): {', '.join(res['task_ids'])} (status: open)."
            r.data = res
            r.add_control("SE-06")
        return r

    def _draft_policy(self, ctx: ToolContext, session: dict) -> Response:
        r = Response("runtime_policy")
        aid = session.get("assessment_id")
        if aid:
            res = invoke(ctx, "draft_runtime_policy", assessment_id=aid)
        elif session.get("profile"):
            res = invoke(ctx, "draft_runtime_policy", profile=session["profile"])
        else:
            r.intent = "clarify"
            r.answer = "I need a use-case profile to draft a runtime policy."
            r.clarifying_question = "Shall we run a guided assessment first? Say \"assess a use case\"."
            return r
        if res.get("policy_id"):
            session["policy_id"] = res["policy_id"]
        r.answer = res["message"]
        r.details.append("Recommended guardrails:\n" + "\n".join(
            f"- {g['id']}: {g['title']} ({', '.join(g['controls'])})" for g in res["guardrails"]))
        if res.get("validation_errors"):
            r.details.append("Policy validation notes: " + "; ".join(map(str, res["validation_errors"][:5])))
        r.required_approvals.append({"action": "activate_runtime_policy",
                                     "why": "Activating or changing a production runtime policy requires human approval."})
        r.cta = CTA_SHIELD
        r.data = {k: res.get(k) for k in ("status", "policy_id", "mode", "environment")}
        return r
