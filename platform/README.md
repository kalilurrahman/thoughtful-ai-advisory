> **In this repository:** `platform/` is the VERITRAIL Python reference implementation and governed content. Lovable does **not** run any Python. The deployed website (`src/`) bundles the Markdown/YAML in `platform/content` at build time and runs TypeScript ports of the engines in the browser. To run the Python code, use a local Python 3.11+ environment (`make install && make test`).

# VERITRAIL Enterprise AI Governance

**Govern every AI system, agent, and decision with evidence.**

This repository holds the VERITRAIL launch build:
- the enhanced website
- the AI Governance Maturity Self-Assessment (lead magnet)
- the VERITRAIL Agent MVP (governance copilot)
- the Runtime Shield Advisor and policy-as-code engine
- the design-partner pilot kit
- the commercial kit

It is built in bounded increments under the VERITRAIL operating principles: evidence-driven, citation-first, governance-safe and transparent.

> VERITRAIL supports governance readiness, control implementation and evidence collection. It does **not** certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.

> **Naming.** This platform was previously called *AEGIS*. Python packages (`veritrail_*`), environment variables (`VERITRAIL_*`, formerly `AEGIS_*`), the policy schema id (`veritrail.policy/v1`) and output file names follow the new name. Set the `VERITRAIL_*` variables wherever `AEGIS_*` values were configured before.

![VERITRAIL solution architecture](docs/diagrams/01_solution_architecture.png)

## Quick start

```bash
make install        # PyYAML, Markdown, Jinja2, reportlab, pytest (Python 3.11+; Node 22 for JS parity tests)
make check          # content integrity + prohibited-claim scan
make test           # full test suite
make site           # build the static website → app/website/dist
make serve          # website + API on http://127.0.0.1:8080
make samples        # regenerate synthetic sample reports + pilot dress rehearsal
make package        # build deliverable zips into /mnt/session/outputs
```

Agent CLI: `PYTHONPATH=$(ls -d app/*/ | tr '\n' ':') python3 -m veritrail_agent` · Shield CLI: `python3 -m veritrail_shield --help` · Admin: `python3 -m veritrail_admin.cli --help`

## What's in the box

| Phase | Deliverable | Where |
|---|---|---|
| Foundation | 64-control library, 5 pillars, indicative NIST AI RMF / ISO/IEC 42001 / EU AI Act mappings | `content/controls/controls.yaml`, `docs/COMPLIANCE_MAPPING.md` |
| 1 Website | Static site: framework, solutions, compliance, industries, tools, resources, contact. SEO, structured data, a11y checks | `app/website/`, `content/website_pages/` |
| 2 Self-assessment | 24 questions, 8 weighted domains, instant score, business-email gate, MD/PDF report, CRM/email adapters | `content/assessment_templates/`, `app/assessment-engine/`, `app/api/`, `app/reports/` |
| 3 VERITRAIL Agent | Ask VERITRAIL, guided use-case assessment, gap analysis, reports (MD/PDF/CSV/JSON), 14 least-privilege tools, approvals, audit | `app/agent/`, `docs/AGENT_DESIGN.md` |
| 4 Runtime Shield | Advisor (risk profile, tool matrix, rules) → versioned YAML/JSON policy. Engine with 7 decisions and 5 rollout modes | `app/runtime-shield/`, `app/policy-engine/`, `content/policy_packs/` |
| 5 Pilots | Pilot A/B plans, metrics, onboarding, safeguards, workshop kits, templates, feedback survey, proposals, synthetic dress rehearsal | `content/pilots/`, `docs/PILOT_PLAYBOOK.md`, `output/sample_reports/pilot_dry_run/` |
| 6 Commercial | Pricing hypotheses, one-pagers, proposal template, ROI calculator, demo script, objection handling, case-study template, 90-day onboarding | `content/commercial/`, `docs/GTM_PLAN.md` |

## Documentation
- Product: [PRODUCT_REQUIREMENTS](docs/PRODUCT_REQUIREMENTS.md) · [ROADMAP](docs/ROADMAP.md) · [BACKLOG](docs/BACKLOG.md) · [STATUS](STATUS.md)
- Architecture: [TECHNICAL_ARCHITECTURE](docs/TECHNICAL_ARCHITECTURE.md) · [DATA_MODEL](docs/DATA_MODEL.md) · [API_SPECIFICATION](docs/API_SPECIFICATION.md) · [diagrams](docs/diagrams/)
- Components: [AGENT_DESIGN](docs/AGENT_DESIGN.md) · [RUNTIME_SHIELD_DESIGN](docs/RUNTIME_SHIELD_DESIGN.md)
- Governance content: [COMPLIANCE_MAPPING](docs/COMPLIANCE_MAPPING.md) · [veritrail_framework](content/veritrail_framework.md) · [pillars](content/pillars.md) · [maturity_model](content/maturity_model.md)
- Go-to-market: [WEBSITE_CONTENT_PLAN](docs/WEBSITE_CONTENT_PLAN.md) · [GTM_PLAN](docs/GTM_PLAN.md) · [PILOT_PLAYBOOK](docs/PILOT_PLAYBOOK.md)
- Governance of the build: [RISK_REGISTER](docs/RISK_REGISTER.md) · [DECISION_LOG](docs/DECISION_LOG.md) · [CONTRIBUTING (conventions & contracts)](CONTRIBUTING.md)
- Master document: [VERITRAIL Launch & Enhancement Blueprint v3.0](output/VERITRAIL_Launch_and_Enhancement_Blueprint_v3.md)

## Repository layout
```
docs/       design, product, compliance, pilot and GTM documents + diagrams/
content/    governed content: controls, assessment templates, policy & industry packs, website pages, pilots, commercial
app/        website · agent · assessment-engine · policy-engine · runtime-shield · reports · admin · api · common
tests/      unit · integration · agent-evaluation · policy-engine · security
output/     blueprint + synthetic sample reports
scripts/    checks, sample generation, pilot dress rehearsal, diagrams, packaging
```

## Honest status
Everything that can be built and tested without customers is built and tested. Pilot execution and commercial validation are **blocked until real design partners sign**. All sample outputs use fictional organizations and are labelled synthetic. See [STATUS.md](STATUS.md) for completed, in-progress and blocked work, plus assumptions, open questions, risks and next actions.
