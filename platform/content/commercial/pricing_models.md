---
title: "AEGIS pricing models and packaging"
version: 0.1.0
status: HYPOTHESIS — to validate in pilots
effective_date: 2026-10-21
owner: AEGIS Commercial Lead
---

# AEGIS pricing models and packaging

> **Every price on this page is a hypothesis to validate in pilots.** Ranges are illustrative planning assumptions,
> not market data, not quotes and not list prices. They have not been tested with buyers. Pilot feedback survey
> section G and follow-on negotiations will validate or replace them. Do not share figures externally without the
> commercial lead's approval. Currency: USD, annual unless stated.

## 1. Pricing principles

1. **Price on the value metric the buyer controls.** AI systems governed (Register), governance users or business units
   (Control), environments/agents/governed actions (Shield), enterprise scope (Assurance).
2. **Land small, fixed and low-risk.** The Governance Baseline is fixed-fee and fixed-scope, with a credit toward the
   first-year subscription when converted.
3. **Free for the people being governed.** Business owners, approvers and viewers do not consume paid seats — paid seats
   are for governance operators, so adoption is not taxed.
4. **No price on safety basics.** Human-approval workflows, audit logging and evidence labels are in every tier.
5. **Transparent overages.** Usage-based components show included volumes and overage rates up front.

## 2. Land-and-expand path

```
Governance Baseline ──► Register ──► Control ──► Shield ──► Assurance ──► Managed Governance Service
 (fixed fee, 4–6 wks)   (system of    (policies,   (runtime    (evidence,     (AEGIS-operated
                         record)       gates)       guardrails) testing)        governance ops)
```

Pilot B-type buyers may enter at Shield (+ Register for agents) instead of Register.

## 3. Module pricing models (hypotheses)

| Module | Pricing model | Illustrative range (hypothesis) | Included | Notes / what to validate |
|---|---|---|---|---|
| **Governance Baseline** | Fixed fee per engagement | 25,000 – 60,000 per engagement | Inventory ≤ 25 systems, maturity baseline with evidence, 5 deep-dives, ≤ 2 agent reviews, gap register, roadmap, exec report | Validate scope-to-price fit; design-partner pilots may be no-fee or discounted with a conversion credit |
| **Register** | Per AI system per year, with platform minimum | 150 – 400 per system; minimum 15,000 – 25,000 | Inventory, tiering, ownership, attestation, shadow-AI reconciliation imports | Validate per-system vs. banded pricing; does "AI system" counting feel fair to buyers? |
| **Control** | Per governance user, or per business unit | 1,200 – 3,000 per governance user, or 10,000 – 25,000 per BU | Policy library, approval gates, exceptions, lifecycle workflow; unlimited free approvers/viewers | Validate which metric buyers prefer (survey G3) |
| **Shield** | Per environment + per agent; optional usage tier | 12,000 – 30,000 per environment (incl. up to 5 agents); 2,000 – 6,000 per additional agent; usage tier 0.50 – 2.00 per 1,000 governed actions above included volume | Advisor, policy-as-code, approvals, limits, kill switch, decision logs | Validate environment vs. agent vs. action metric; developer-led buyers may prefer usage |
| **Assurance** | Enterprise subscription | 40,000 – 120,000 per year | Evidence repository, control testing, incident module, evidence packs, KPI reporting | Validate whether internal audit/second line hold budget |
| **Agent** | Premium tier uplift, or usage-based | +20% – 30% of platform subscription, or per-report / per-session usage | Ask AEGIS, guided assessments, gap analysis, report drafting with citations | Validate willingness to pay separately vs. expectation that it is bundled |
| **Industry packs** | Add-on per pack per year | 8,000 – 20,000 per pack | Sector use-case library, emphasized controls, evidence, discovery questions, policy packs | Validate whether packs drive selection or are expected free |
| **Managed Governance Service** | Monthly retainer | 8,000 – 25,000 per month | AEGIS-operated intake triage, assessments, evidence collection, reporting | Validate demand from teams without governance headcount |

## 4. Packaged tiers (hypotheses)

| Tier | Modules | Typical buyer | Illustrative annual range (hypothesis) |
|---|---|---|---|
| **Essentials** | Assess + Register (+ Agent basic: Ask AEGIS) | First AI governance hire; 10–50 AI systems | 20,000 – 45,000 |
| **Professional** | Essentials + Control + Agent premium | Governance function in regulated mid-market / BU of large enterprise | 50,000 – 120,000 |
| **Enterprise** | Professional + Shield + Assurance + 1 industry pack | Regulated enterprise with agents; 100+ AI systems | 120,000 – 350,000 |
| **Shield-first** | Shield + Register (agents only) + Agent basic | AI-forward SaaS/GCC platform teams | 25,000 – 80,000 |
| **Managed** | Any tier + Managed Governance Service | Teams without governance headcount | Tier + retainer |

## 5. Discounting and credits (rules)

| Rule | Hypothesis |
|---|---|
| Baseline-to-platform credit | Up to 100% of the Baseline fee credited against year-1 subscription if signed within 60 days of readout |
| Design-partner terms | Pilot no-fee or ≤ 50% of Baseline price, in exchange for structured feedback; never in exchange for publicity without separate written approval |
| Multi-year | 5% – 10% for 2–3 year terms |
| Approval | Any discount above 20% requires commercial lead approval and is logged |

## 6. What pilots must tell us

| Question | Source | Decision it informs |
|---|---|---|
| Which module would they buy first? | Survey G2 | Land offer |
| Which pricing metric feels fair? | Survey G3, sponsor interview | Value metric per module |
| Which budget pays? | Survey G4 | Buyer persona and sales motion |
| What is AEGIS worth vs. alternatives? | Survey G5, negotiation | Price levels |
| Did the follow-on proposal close, at what price and with what objections? | CRM, `objection_handling.md` log | Range revision |

## 7. Change log

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-10-21 | Initial hypotheses from Blueprint v2.0 pricing models; no market validation yet |
