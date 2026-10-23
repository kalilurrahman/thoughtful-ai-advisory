---
title: "Pilot B kit index"
pilot: B
version: 1.0.0
effective_date: 2026-10-21
status: Not started — awaiting design-partner recruitment
---

# Pilot B kit — AI-forward organization with LLM apps and agents

Every artefact required for Pilot B, with Pilot B-specific tailoring. Shared templates live in `../templates/`.

| # | Artefact | File | Pilot B tailoring |
|---|---|---|---|
| 1 | Pilot plan | [`pilot_plan.md`](pilot_plan.md) | Agent governance, runtime guardrails, developer adoption, policy-as-code |
| 2 | Success-metrics scorecard | [`success_metrics_scorecard.md`](success_metrics_scorecard.md) / [`.csv`](success_metrics_scorecard.csv) | Signals S4, S5, S9 |
| 3 | Onboarding checklist | [`onboarding_checklist.md`](onboarding_checklist.md) | Runtime-safety gate (VERITRAIL never activates partner policy) |
| 4 | Data-access & privacy safeguards | [`../templates/data_access_privacy_safeguards.md`](../templates/data_access_privacy_safeguards.md) | Tool manifests and config excerpts are redacted; no production prompts leave partner environment |
| 5 | AI inventory workshop kit | [`../templates/inventory_workshop_kit.md`](../templates/inventory_workshop_kit.md) + [`intake CSV`](../templates/ai_inventory_intake_template.csv) | Engineering-led; feature-level LLM inventory; API-key and coding-assistant discovery prompts |
| 6 | Maturity assessment session guide | [`../templates/maturity_assessment_session_guide.md`](../templates/maturity_assessment_session_guide.md) | 60-minute calibration focused on security, data, oversight |
| 7 | Deep-dive plan (5 systems) | [`../templates/deep_dive_assessment_plan.md`](../templates/deep_dive_assessment_plan.md) | Weighted to GenAI/agentic systems; sessions 2a–2b expanded |
| 8 | Agent review protocol (2) | [`../templates/agent_review_protocol.md`](../templates/agent_review_protocol.md) | **Core** — both agents reviewed; Shield Advisor drafts policies |
| 9 | Gap register template | [`../templates/gap_register_template.csv`](../templates/gap_register_template.csv) | Engineering owners; link findings to policy rules |
| 10 | Remediation roadmap template | [`../templates/remediation_roadmap_template.md`](../templates/remediation_roadmap_template.md) | Rollout stages as roadmap milestones |
| 11 | Runtime Shield recommendations | [`../templates/runtime_shield_recommendations_template.md`](../templates/runtime_shield_recommendations_template.md) | **Core** — one per reviewed agent, with draft policy attached |
| 12 | Executive readiness report | [`../templates/executive_readiness_report_template.md`](../templates/executive_readiness_report_template.md) | Section 7 (agents and runtime) expanded; engineering leadership audience |
| 13 | Feedback survey | [`../templates/feedback_survey.md`](../templates/feedback_survey.md) | Section E and F weighted; engineers included |
| 14 | Commercial follow-on proposal | [`../templates/commercial_follow_on_proposal.md`](../templates/commercial_follow_on_proposal.md) | Typical next step: Shield (+ Register for agents) |
| 15 | Industry pack | `content/industry_packs/{saas_product,gcc_it_services}.yaml` | Use the partner's sector |
