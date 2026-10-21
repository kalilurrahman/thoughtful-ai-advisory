---
title: "Accountability & Operating Model (AO) — AEGIS Framework pillar"
h1: "Pillar 1: Accountability & Operating Model"
slug: /framework/pillars/accountability/
description: "AEGIS AO controls define AI policy, an executive forum with authority to stop use cases, RACI, risk appetite, AI literacy, escalation and prohibited uses."
section: framework
nav_label: "Accountability (AO)"
nav_order: 16
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: blueprint
faq:
  - q: "Do we need a Chief AI Officer to meet the AO controls?"
    a: "No. The controls require named accountability and decision rights, not a specific job title. Many organizations assign the AI Governance Lead role to an existing risk, data or technology leader and charter a cross-functional forum."
  - q: "What is the single most important AO control?"
    a: "AO-02. A forum with documented authority to approve, restrict or stop AI use cases is what turns policy into decisions. Without it, the other controls have no escalation point."
updated: 2026-10-21
---

**Core question: who owns AI risk, who decides, and how is governance resourced?**

The Accountability & Operating Model pillar establishes the decision structure every other control depends on. It is the pillar most often "done on paper": a policy exists, but nobody can show a decision the governance forum actually made, or which role approved the last high-risk deployment. AEGIS treats accountability as something you evidence through decisions, not documents.

## What good looks like

- An approved, versioned AI governance policy with a named executive owner, reviewed at least annually.
- A cross-functional forum — business, technology, risk, legal, privacy, security — with written authority to **approve, restrict or stop** AI use cases, and minutes that show it has done so.
- A RACI that names who is responsible across the lifecycle, including who performs human oversight.
- A leadership-approved risk appetite that translates into risk-tier criteria used at intake.
- A list of prohibited and restricted uses that every use case is screened against.
- Role-based AI literacy for staff, operators and decision-makers, with completion tracked.

## Controls in this pillar

| Control | Objective | Priority / scope | Evidence that demonstrates it |
|---|---|---|---|
| AO-01 AI governance policy | Documented, approved, versioned policy setting scope, principles, risk appetite linkage and accountabilities | Critical / all AI | Approved policy with version and approval record; communication record; annual review minutes |
| AO-02 Executive accountability and AI governance forum | Cross-functional forum with documented authority to approve, restrict or stop AI use cases | Critical / all AI | Terms of reference; membership; decision log showing approve/restrict/stop decisions |
| AO-03 AI roles, responsibilities and RACI | Roles for business, technology, risk, legal, privacy and security across the lifecycle | High / all AI | RACI matrix; role descriptions; human-oversight role assignments |
| AO-04 AI risk appetite and tolerance | Leadership-approved appetite, tolerance thresholds and risk-tier criteria | High / all AI | Risk appetite statement; tier criteria; approval record |
| AO-05 AI literacy and role-based training | Role-based AI literacy and responsible-use training | High / all AI | Curriculum; completion records by role; effectiveness metrics |
| AO-06 Escalation paths and decision rights | How AI issues and incidents are escalated, to whom, and how fast | High / all AI | Escalation matrix; concern-reporting channel; sample escalations |
| AO-07 Regulatory and contractual obligations register | AI-relevant legal, regulatory, contractual and customer obligations by jurisdiction and system | High / all AI | Obligations register; legal review records; obligation-to-system mapping |
| AO-08 Responsible AI principles and objectives | Measurable responsible-AI objectives aligned to values and appetite | Medium / all AI | Principles; objectives with metrics; leadership approval |
| AO-09 Third-party AI accountability | Accountability for vendor AI, including provider/deployer/customer responsibility allocation | Medium / third-party | Responsibility allocation (RACI or contract schedule); vendor AI owners |
| AO-10 Prohibited and restricted AI use policy | Prohibited, restricted and conditionally permitted uses; every use case screened | Critical / all AI | Prohibited/restricted list; intake screening records |
| AO-11 Stakeholder engagement and feedback | Feedback from affected individuals, users and internal stakeholders acted on | Medium / high-risk | Feedback channel; feedback log; actions taken |
| AO-12 Governance resourcing | Budget, people and tooling sufficient for the organization's scale | Medium / all AI | Governance budget; staffing plan; tooling inventory |

{{controls:AO-01,AO-02,AO-04,AO-10}}

## Common failure modes

- **A forum with no teeth.** The forum reviews slide decks but has never restricted or stopped anything. AEGIS asks for a decision log, because the evidence for AO-02 is the decisions themselves.
- **Risk appetite that never reaches intake.** The board approves an appetite statement, but tier criteria at intake are improvised. AO-04 is only effective when it feeds EI-02 tiering and GL-01 triage.
- **Training as a one-off.** A single e-learning module is not role-based literacy. Operators who supervise AI decisions need different training from developers or executives (AO-05).
- **Vendor AI as nobody's problem.** Embedded AI features in purchased software are often unowned. AO-09 assigns accountability and clarifies who is the provider and who is the deployer.

## How AEGIS helps

- The [maturity self-assessment](/tools/maturity-assessment/) scores this area through questions STR-Q1 to STR-Q3 and HUM-Q3, and raises a critical flag when there is no policy or accountable owner.
- [AEGIS Control](/solutions/control/) provides policy templates, a forum charter, RACI and escalation matrices, and records forum decisions as evidence.
- The [AEGIS Agent](/solutions/agent/) can draft a RACI or obligations register from your inputs — as a draft for human review, with each line citing the relevant control.

## Indicative framework alignment

AO controls map indicatively to NIST AI RMF GOVERN 1 and GOVERN 2 (for example, AO-01 to GOVERN 1.1 and 1.2; AO-05 to GOVERN 2.2), to ISO/IEC 42001 clauses 4–7 and Annex A.2–A.4 (AO-01 to clause 5.2 and A.2.2; AO-02 to 5.1, 5.3 and A.3.2), and to EU AI Act articles including Art. 4 (AI literacy, AO-05) and Art. 5 (prohibited practices, AO-10). See [NIST AI RMF](/compliance/nist-ai-rmf/), [ISO/IEC 42001](/compliance/iso-42001/) and [EU AI Act readiness](/compliance/eu-ai-act/).

{{disclaimer}}

## Next step

Most organizations can stand up the critical AO controls within the first 30 days of a programme. A Governance Baseline validates what you already have and drafts what you do not.

{{cta:baseline}}
