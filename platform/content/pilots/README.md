---
title: "AEGIS pilot kits"
version: 1.0.0
effective_date: 2026-10-21
owner: AEGIS Delivery Lead
---

# AEGIS pilot kits

> Status: both pilots **Not started — awaiting design-partner recruitment** (see
> [`pilot_status_tracker.md`](pilot_status_tracker.md)). The playbook that ties everything together is
> [`docs/PILOT_PLAYBOOK.md`](../../docs/PILOT_PLAYBOOK.md).

```
content/pilots/
├── README.md                                   # this file
├── pilot_status_tracker.md                     # status, recruitment criteria, outreach, qualification
├── design_partner_qualification_scorecard.csv
├── pilot_a/                                    # regulated enterprise (20–100 AI systems)
│   ├── kit_index.md · pilot_plan.md · onboarding_checklist.md
│   └── success_metrics_scorecard.md · success_metrics_scorecard.csv
├── pilot_b/                                    # AI-forward SaaS / GCC / enterprise with LLM apps and agents
│   ├── kit_index.md · pilot_plan.md · onboarding_checklist.md
│   └── success_metrics_scorecard.md · success_metrics_scorecard.csv
└── templates/                                  # shared, with Pilot A/B tailoring noted in each kit index
    ├── data_access_privacy_safeguards.md       # W1
    ├── inventory_workshop_kit.md               # W2 (agenda, facilitator script, discovery prompts)
    ├── ai_inventory_intake_template.csv        # W2 (fields match the risk-tier engine)
    ├── maturity_assessment_session_guide.md    # W3
    ├── deep_dive_assessment_plan.md            # W4 (5 systems)
    ├── agent_review_protocol.md                # W4 (up to 2 agents)
    ├── gap_register_template.csv               # W5
    ├── remediation_roadmap_template.md         # W5
    ├── runtime_shield_recommendations_template.md  # W5
    ├── executive_readiness_report_template.md  # W6
    ├── feedback_survey.md                      # W6
    └── commercial_follow_on_proposal.md        # W6
```

Rules that apply to every artefact: cite real AEGIS control IDs; label evidence (Verified / User-asserted / Inferred /
Missing evidence / Critical gap); never state that a partner is compliant or certified; metadata-only by default and
no production data into external LLMs; high-impact actions require named human approval; never publish partner names
or results without written approval.
