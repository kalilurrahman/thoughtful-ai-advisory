---
title: "Objection-handling guide"
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Commercial Lead
---

# Objection-handling guide

Principles: acknowledge, ask a clarifying question, answer with something verifiable (a control, a demo step, a
document), and never overclaim. VERITRAIL has no customers or measured results yet — never imply otherwise.

| # | Objection | Clarify | Response | Proof to offer |
|---|---|---|---|---|
| 1 | "We already have a GRC tool." | "Does it hold your AI inventory, agent tool permissions and runtime decisions today?" | VERITRAIL complements GRC: it provides the AI-specific system of record (EI-01, EI-07), tiering (EI-02), runtime evidence (IS-12, SE-08) and evidence labels that can be exported to GRC via CSV/JSON. | Control library page; export demo |
| 2 | "Our model risk team already does this." | "Does MRM cover GenAI apps, vendor AI features and agents with tools?" | Keep MRM as the validation authority; VERITRAIL extends inventory and tiering to GenAI and agents and maps VERITRAIL tiers to MRM tiers (BFSI pack FS-EV-01). | BFSI industry pack |
| 3 | "We'll build it ourselves." | "What's the plan for the control library, mappings, agent guardrails and evidence?" | Building is possible; the cost is maintaining 64 controls, mappings, a policy engine and evidence trails as regulations change. Use the ROI calculator with their numbers to compare. | `roi_calculator.py`; compliance mapping doc |
| 4 | "Can you promise we will satisfy the EU AI Act?" | "Which obligations concern you most?" | No — and anyone who promises that should worry you. VERITRAIL supports readiness and evidence; legal determination stays with counsel and, where relevant, notified bodies. Show the coverage-gap section. | `docs/COMPLIANCE_MAPPING.md` §7 |
| 5 | "We can't share data with a startup." | "What data would you be worried about?" | Default is metadata-only; no production data goes to external LLMs; NDA/DPA, least-privilege roles, retention and deletion are agreed in Week 1. | `data_access_privacy_safeguards.md` |
| 6 | "Runtime guardrails will slow our developers." | "Where has friction hurt you before?" | Rollout starts in Observe (log only), then Warn, Protect, Enforce. Policies are code in your repo. Pilot B measures friction (survey E, signal S4). | Shield demo; rollout table |
| 7 | "The self-assessment is just self-reported." | — | Correct — and labelled User-asserted. The Baseline validates answers against evidence and reports both scores. | Maturity model §6 |
| 8 | "Who else uses you?" | — | "We're pre-pilot and recruiting design partners. We won't show logos we don't have." Offer a design-partner role with influence on the roadmap. | Pilot plans |
| 9 | "AI answers can hallucinate — why trust your Agent?" | "What would you need to see?" | Every recommendation must cite a control; when unsupported the Agent says so verbatim; prohibited compliance claims are blocked; pilots measure citation accuracy (S7). | Agent demo steps (c) and (d) |
| 10 | "Too expensive." | "Compared with what — headcount, consultants, an audit finding?" | Start with the fixed-fee Baseline; use the ROI calculator with conservative assumptions; pricing is per value metric they control. | ROI worked example (incl. its sensitivity caveats) |
| 11 | "Not a priority this year." | "What would make it one — audit, customer, regulator, an incident?" | Offer the free self-assessment and a nurture path; agree a trigger to revisit. | Self-assessment |
| 12 | "Your regulatory content will go stale." | — | Quarterly review cadence, versioned control library, regenerated mappings, and explicit "verify against current Official Journal text" caveats. Risk tracked as R-07. | `docs/RISK_REGISTER.md` |
| 13 | "We need on-prem / our cloud." | "Which data would leave your environment?" | MVP is stdlib-based with no third-party CDNs; deployment model to be confirmed per customer — do not promise a model not yet supported. Log as a requirement. | Backlog item |

## Objection log

Record every objection heard in pilots and sales calls (date, persona, objection, response used, outcome) in the CRM.
Review monthly; update this guide and `pricing_models.md` from the patterns.
