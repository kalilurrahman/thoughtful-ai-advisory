---
title: "One-pager — VERITRAIL Industry Packs"
audience: Sector compliance and risk leads
version: 1.0.0
effective_date: 2026-10-21
---

# VERITRAIL Industry Packs

**Start from your sector's real use cases, not a blank template.**

## What a pack contains

| Component | Example (BFSI pack) |
|---|---|
| Priority use cases with default risk-tier hints (confirmed per system by your approver) | Credit decisioning — High; internal productivity assistants — Low |
| Emphasized controls with sector rationale | IS-05 fairness testing for customer decisions; IS-13 human approval for payments agents |
| Additional evidence expectations | Mapping of VERITRAIL tiers to model-risk tiers (FS-EV-01) |
| Sector regimes to consider — described generally, flagged "verify with counsel" | Model risk management guidance; fair lending rules; operational-resilience rules |
| Recommended runtime policy packs | `pack-financial-operations-agent` (approval-gated payments); `pack-customer-support-agent`; `pack-baseline` |
| Pilot discovery questions | "Can any agent move money, change limits or contact customers?" |

## Available packs (v1.0.0, draft for pilot validation)

| Pack | File |
|---|---|
| Healthcare & Pharma | `content/industry_packs/healthcare_pharma.yaml` |
| Banking, Financial Services & Insurance | `content/industry_packs/bfsi.yaml` |
| Global Capability Centers & IT Services | `content/industry_packs/gcc_it_services.yaml` |
| SaaS & AI Product Companies | `content/industry_packs/saas_product.yaml` |
| Public Sector | `content/industry_packs/public_sector.yaml` |

## How packs are used

- **Assess:** discovery questions and use-case library seed inventory workshops and deep-dives.
- **Register:** default tier hints pre-populate preliminary tiers (always Inferred until confirmed).
- **Control/Assurance:** sector evidence expectations extend evidence requests.
- **Shield:** recommended policy packs start runtime policy drafting.

## Important limits

Packs prompt the right questions; they do not determine which laws apply. Every sector regime listed must be verified
with qualified counsel, and regulatory dates must be checked against current official texts. Packs are reviewed
quarterly and are marked "draft for pilot validation" until validated with design partners.

## Commercials

Add-on per pack per year (hypothesis to validate in pilots — see `pricing_models.md`).
