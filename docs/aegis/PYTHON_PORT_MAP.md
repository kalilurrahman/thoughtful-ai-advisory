# AEGIS Python → hosted site map

Lovable runs no Python. Every Python capability in `platform/` that a user can run has
a TypeScript port that runs on the hosted site — in the browser, or as a TanStack
server function where data must be shared. Ports are held to the Python behaviour by
parity fixtures that `platform/scripts/export_*_parity_fixtures.py` export from the
Python reference implementation (see `src/test/`).

| Python | Hosted equivalent | Where to run it |
| --- | --- | --- |
| `app/assessment-engine/aegis_assessment/engine.py` | `src/features/site/engines/assessment-engine.ts`, `assessment-report.ts` | `/tools/maturity-assessment` |
| `app/assessment-engine/aegis_assessment/risk_tier.py` | `src/features/site/engines/risk-tier.ts` | `/tools/risk-triage` |
| `app/runtime-shield/aegis_shield/{advisor,profile,generator,examples}.py` | `src/features/site/engines/shield/` | `/tools/guardrail-generator` |
| `app/runtime-shield/aegis_shield/{render,samples,integrations,__main__}.py` | `src/features/platform/policy-engine/`, guardrail generator downloads | `/tools/guardrail-generator`, `/platform/policy-simulator` |
| `app/policy-engine/aegis_policy/*` (engine, detectors, params, versioning, loader, schema, constants) | `src/features/platform/policy-engine/`, `src/features/site/engines/shield/schema.ts` | `/platform/policy-simulator` |
| `app/agent/aegis_agent/*` (orchestrator, knowledge, safety, compose, question_bank, tools, approvals, store, gaps, reporting, extraction, config, sample_run) | `src/features/site/engines/ask-aegis/`, `src/features/platform/agent/` | `/tools/ask-aegis` (viewer), `/platform/agent` (all roles) |
| `app/agent/aegis_agent/llm.py` | Deterministic adapter only (no LLM provider is configured) | — |
| `app/common/aegis_common/audit.py`, `ids.py` | `src/features/platform/audit.ts` | used by the agent, simulator, pilot and admin console |
| `app/common/aegis_common/{evidence,redaction,content}.py` | `src/features/site/content.ts`, `src/features/site/engines/ask-aegis/safety.ts` | all tools |
| `app/reports/aegis_reports/{pdf,exporters,maturity}.py` | `src/features/platform/reports/` | report downloads in every tool |
| `app/api/aegis_api/server.py` (leads, analytics, risk-tier, shield, agent endpoints) | `src/features/site/leads.functions.ts`, `src/features/platform/analytics.functions.ts`; the tool endpoints became browser engines | forms, analytics |
| `app/api/aegis_api/integrations.py` (CRM / e-mail adapters) | `src/features/platform/integrations.server.ts` (webhook, HubSpot; SMTP is unavailable on the Workers runtime) | runs after a lead is stored, when configured |
| `app/admin/aegis_admin/cli.py` | `src/features/platform/admin.functions.ts`, `admin-console.tsx` | `/platform/admin` (sign-in + `site_admins`) |
| `content/commercial/roi_calculator.py` | `src/features/platform/roi/` | `/platform/roi-calculator` |
| `scripts/pilot_dry_run.py` | `src/features/platform/pilot/` | `/platform/pilot-rehearsal` |
| `scripts/generate_samples.py` | `src/features/platform/samples/` | `/platform/samples` |
| `scripts/check_content.py`, `scripts/check_website_pages.py` | `src/features/platform/checks/` (+ `src/test/platform-content-checks.test.ts`) | `/platform/content-checks` |

## Build-time tooling that the hosted site replaces (not run on the site)

| Python | Replaced by |
| --- | --- |
| `app/website/aegis_website/*`, `app/website/build.py` (static site generator, SEO, shortcodes, safe Markdown, forms, checks) | The React site: `src/features/site/` (`pages.ts`, `markdown.tsx`, `views.tsx`, `forms.tsx`) and `src/test/site-pages.test.ts` |
| `app/website/aegis_website/ogimage.py` | The generated image is committed as `public/og-default.png` |
| `scripts/draw_architecture.py`, `scripts/render_diagrams.sh` | Diagrams are committed in `platform/docs/diagrams/` |
| `scripts/package.py` | Deliverable zips are not needed for the hosted site |
| `scripts/export_*_parity_fixtures.py` | Developer tooling that keeps the ports honest; run locally with Python |

The Python code remains the reference implementation. Run it locally with
`cd platform && make install && make test`.
