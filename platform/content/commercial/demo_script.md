---
title: "Demo script — 20-minute and 45-minute versions"
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Commercial Lead with VERITRAIL Product Lead
---

# VERITRAIL demo script

Flow for both versions: **website → self-assessment → VERITRAIL Agent → Shield Advisor → report.**

## Demo rules (read before every demo)

1. Use **synthetic data only** — the demo personas below are fictional. Never use a prospect's real system names or data
   in a shared environment.
2. Never say or imply that VERITRAIL makes an organization compliant or certified. Say "readiness", "evidence", "alignment
   indicators". If asked, use the line in §5.
3. Never claim existing customers, results or statistics. VERITRAIL is pre-pilot; say so if asked.
4. Show limitations honestly when they come up — buyers trust demos that show where the product stops.
5. Run the pre-demo checklist (§4) 30 minutes before.

**Synthetic persona used in both versions:** "Northwind Lending" (fictional), a mid-size lender with ~40 AI systems,
an AI policy in draft, and a customer-service agent that can issue refunds and send emails.

---

## 20-minute version (first meeting, executive audience)

| Time | Screen | Talk track | Proof point to land |
|---|---|---|---|
| 0:00–2:00 | Website home | "Three questions every board is asking: what AI do we run, how risky is it, can we prove it's governed? VERITRAIL answers them with evidence." Show the five pillars briefly. | Framework is concrete: 5 pillars, 64 controls |
| 2:00–7:00 | `/tools/maturity-assessment/` | Answer the 24 questions quickly using pre-agreed Northwind answers (inventory 2, agents untested 2). Show the instant indicative score and level. "Everything here is User-asserted — self-reported." | Score, level, domain bars, critical flags (FLAG-NO-INVENTORY, FLAG-AGENTS-UNTESTED) |
| 7:00–11:00 | `/tools/ask-veritrail/` (VERITRAIL Agent) | Ask: "What should we do first about our agents?" Show cited controls (IS-11, IS-13, IS-14). Then ask: "Are we EU AI Act compliant?" Show the agent declining to make a compliance determination and pointing to readiness indicators. | Citations; refusal to make compliance claims |
| 11:00–16:00 | `/tools/guardrail-generator/` (Shield Advisor) | Describe the refund agent. Show the tool matrix: refunds → REQUIRE_HUMAN_APPROVAL above a threshold; deletes → DENY; unknown tools → default deny. Show rollout Observe → Warn → Protect → Enforce → Contain. | Concrete, reviewable policy-as-code |
| 16:00–18:30 | Report | Open the maturity report (PDF/Markdown): strengths, gaps, 30/60/90 plan, recommended controls, framework readiness indicators with disclaimer. | Board-ready, honest output |
| 18:30–20:00 | Close | "The fastest way to replace self-reported answers with evidence is a Governance Baseline: fixed scope, 4–6 weeks, inventory, deep-dives, agent reviews, executive report." | Next step: scoping call |

---

## 45-minute version (working session, governance + security + engineering)

| Time | Segment | Detail | Controls to mention |
|---|---|---|---|
| 0:00–5:00 | Discovery recap | Confirm their triggers, scale, agents, sector. Pick the industry pack. | — |
| 5:00–10:00 | Website & framework | Pillars, six layers, control library page; open one control (e.g. IS-13) and show owner, evidence and indicative mappings. Show the compliance mapping page and its disclaimers and coverage gaps. | IS-13; mapping caveats |
| 10:00–17:00 | Self-assessment | Complete with Northwind answers; explain scoring (weights 12/14/14/12/14/12/12/10, levels Initial → Optimized); show flags, 30/60/90 plan and recommended modules. Explain User-asserted vs. Verified. | EI-01, GL-02, IS-04 |
| 17:00–25:00 | VERITRAIL Agent | (a) Ask VERITRAIL with citations; (b) guided use-case intake for the refund agent → preliminary tier High (Inferred) with factor-by-factor rationale; (c) attempt to change the tier → pending human approval created; (d) ask an out-of-scope question → "No supporting evidence or framework source is available." | EI-02, IS-13, SE-08 |
| 25:00–35:00 | Shield Advisor & policy engine | Generate the refund-agent policy; walk YAML (tool rules, redaction, limits, kill switch scope, logging level). Evaluate three sample requests: normal lookup → ALLOW; refund above threshold → REQUIRE_HUMAN_APPROVAL; prompt containing an account number → REDACT. Toggle Observe vs. Enforce and show the difference. | IS-11, IS-12, IS-04, IS-15, IS-16 |
| 35:00–40:00 | Reports & evidence | Maturity report, gap register CSV, audit-log hash-chain verification. | SE-05, SE-08 |
| 40:00–45:00 | Next steps | Pilot or Governance Baseline: show the 6-week plan and success metrics; agree a scoping call; send the self-assessment link to their wider team. | — |

---

## 4. Pre-demo checklist

- [ ] Local or demo environment running (website, API, agent); health check `/api/health` passes
- [ ] Northwind answers sheet ready; browser cache cleared; no real prospect data on screen
- [ ] Shield Advisor profile for the refund agent pre-filled as backup
- [ ] Sample report opens (synthetic, labelled)
- [ ] Industry pack for the prospect's sector open in a tab
- [ ] Fallback: screenshots in case of environment failure (never fabricate outputs live)

## 5. Lines for tricky moments

| Moment | Say |
|---|---|
| "So this makes us compliant?" | "No tool can do that. VERITRAIL gives you readiness indicators and evidence mapped indicatively to NIST AI RMF, ISO/IEC 42001 and the EU AI Act. Your counsel, auditors or certification body make the determination." |
| "Who else uses this?" | "We're recruiting design partners now. We'd rather show you the product working than quote logos we don't have." |
| Agent gives a weak answer | "Good catch — that's exactly what the pilot measures. Every answer must carry a citation you can check; let's look at the cited control." Log it for the agent evaluation set. |
| "What about EU AI Act deadlines?" | "Dates must be verified against the current Official Journal text — there were 2025 Commission proposals to change high-risk timelines, and we don't present dates as settled without legal confirmation." |
