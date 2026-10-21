# AEGIS Website Content Plan

Version 3.0 · 21 October 2026 · Owner: Marketing Lead with Governance Content Lead · Status: Active

Source of truth for page copy: `content/website_pages/*.md` (front matter contract in `CONTRIBUTING.md` §4).
Site configuration: `app/website/site.yaml`. This plan defines the information architecture, page briefs, SEO
targets, conversion paths and content governance. The IA below reflects the pages currently in the repository.

## 1. Goals

| Goal | Measure (privacy-friendly events, no cookies) |
|---|---|
| Establish AEGIS as an evidence-first, credible AI governance voice | Engaged sessions on framework/compliance pages; returning visitors (aggregate) |
| Drive self-assessment completions | `assessment_started`, `assessment_completed`, completion rate |
| Convert to qualified conversations | Baseline bookings, demo requests, design-partner applications |
| Grow a nurture audience | Blueprint downloads, newsletter sign-ups |

No visitor-level tracking, no third-party analytics, no cookies (PRD-1-06).

## 2. Information architecture

```
/                                   Home
├── /framework/                     Framework overview
│   ├── /framework/pillars/ (+5 pillar pages: accountability, inventory, lifecycle, integrity-safety-security, stewardship-assurance)
│   ├── /framework/controls/        Control library (generated from controls.yaml)
│   ├── /framework/maturity-model/
│   ├── /framework/assessment-modules/
│   └── /framework/runbooks/
├── /solutions/                     Assess · Register · Control · Shield · Assurance · Agent
├── /compliance/                    Overview · NIST AI RMF · ISO/IEC 42001 · EU AI Act readiness · Gap-analysis method
├── /industries/                    Healthcare & pharma · Banking & FS · GCCs & IT services · SaaS & product · Public sector
├── /tools/                         Maturity self-assessment · Guardrail generator · Ask AEGIS · Risk triage · (planned) Agentic risk checker · (planned) EU AI Act readiness checker
├── /resources/                     Blueprint · Assessment templates · Policy packs · Runbooks · Whitepapers · Blog · Case studies
├── /contact/                       Contact · Book Governance Baseline · Request demo · Newsletter · Design-partner programme
├── /about/
└── /legal/                         Privacy · Terms · Responsible AI
```

### 2.1 Page inventory (current)

| Section | Slug | Template | Tool/form | Primary CTA | Secondary CTA |
|---|---|---|---|---|---|
| home | / | home | | assessment | baseline |
| framework | /framework/ | page | | blueprint | assessment |
| framework | /framework/pillars/ | page | | assessment | blueprint |
| framework | /framework/pillars/accountability/ | page | | baseline | blueprint |
| framework | /framework/pillars/inventory/ | page | | baseline | assessment |
| framework | /framework/pillars/lifecycle/ | page | | baseline | demo |
| framework | /framework/pillars/integrity-safety-security/ | page | | guardrails | baseline |
| framework | /framework/pillars/stewardship-assurance/ | page | | baseline | demo |
| framework | /framework/maturity-model/ | page | | assessment | baseline |
| framework | /framework/assessment-modules/ | page | | assessment | agent |
| framework | /framework/runbooks/ | page | | baseline | blueprint |
| solutions | /solutions/ | page | | baseline | demo |
| solutions | /solutions/assess/ | page | | assessment | baseline |
| solutions | /solutions/register/ | page | | baseline | demo |
| solutions | /solutions/control/ | page | | demo | baseline |
| solutions | /solutions/shield/ | page | | guardrails | demo |
| solutions | /solutions/assurance/ | page | | baseline | demo |
| solutions | /solutions/agent/ | page | | demo | baseline |
| compliance | /compliance/ | page | | baseline | assessment |
| compliance | /compliance/nist-ai-rmf/ | page | | assessment | baseline |
| compliance | /compliance/iso-42001/ | page | | baseline | blueprint |
| compliance | /compliance/eu-ai-act/ | page | | baseline | assessment |
| compliance | /compliance/gap-analysis/ | page | | baseline | agent |
| industries | /industries/ | page | | baseline | assessment |
| industries | /industries/healthcare-pharma/ | page | | baseline | assessment |
| industries | /industries/banking-financial-services/ | page | | baseline | demo |
| industries | /industries/gcc-it-services/ | page | | guardrails | baseline |
| industries | /industries/saas-product/ | page | | guardrails | assessment |
| industries | /industries/public-sector/ | page | | baseline | assessment |
| tools | /tools/ | page | | assessment | guardrails |
| tools | /tools/maturity-assessment/ | tool | maturity-assessment | baseline | agent |
| tools | /tools/guardrail-generator/ | tool | guardrail-generator | guardrails | demo |
| tools | /tools/ask-aegis/ | tool | ask-aegis | demo | agent |
| tools | /tools/risk-triage/ | tool | risk-triage | baseline | guardrails |
| tools | /tools/agentic-risk-checker/ | tool | waitlist (planned) | guardrails | assessment |
| tools | /tools/eu-ai-act-readiness-checker/ | tool | waitlist (planned) | assessment | baseline |
| resources | /resources/ | page | | blueprint | assessment |
| resources | /resources/blueprint/ | form | blueprint | assessment | baseline |
| resources | /resources/assessment-templates/ | page | | assessment | baseline |
| resources | /resources/policy-packs/ | page | | guardrails | baseline |
| resources | /resources/runbooks/ | page | | baseline | blueprint |
| resources | /resources/whitepapers/ | form | newsletter | blueprint | assessment |
| resources | /resources/blog/ (+3 articles) | page | | assessment | blueprint |
| resources | /resources/case-studies/ | page | | baseline | demo |
| contact | /contact/ | form | contact | baseline | demo |
| contact | /contact/book-governance-baseline/ | form | baseline | assessment | demo |
| contact | /contact/request-demo/ | form | demo | assessment | baseline |
| contact | /contact/newsletter/ | form | newsletter | assessment | blueprint |
| contact | /contact/design-partner-programme/ | form | contact | baseline | demo |
| company | /about/ | page | | demo | baseline |
| legal | /legal/privacy/, /legal/terms/, /legal/responsible-ai/ | page | | — / agent | — / demo |

## 3. Page briefs

Each brief: audience · job · key messages · proof · CTA · must-include · must-avoid. All pages: US spelling;
enterprise tone; evidence-first; none of the prohibited terms in `CONTRIBUTING.md` §5 (compliance, certification, guarantee or regulator-approval claims) about customers.

| Page | Audience | Job | Key messages | Proof / content blocks | CTA | Must include | Must avoid |
|---|---|---|---|---|---|---|---|
| Home | P1, P2, P3, P8 | Understand AEGIS in 10 seconds; start assessment | Know it, gate it, guard it, prove it; 5 pillars, 64 controls; runtime guardrails for agents; evidence labels | Pillar strip; how-it-works; tools teaser; "readiness, not certification" note | Self-assessment; Baseline | Disclaimer link; design-partner status honesty | Customer logos, invented metrics |
| Framework overview | P1, P2, P5 | Evaluate rigor | Pillars, six layers, lifecycle, evidence labels, risk tiers | Excerpts from `content/aegis_framework.md`; control library link | Blueprint; assessment | `{{disclaimer}}` | Claims of official framework endorsement |
| Pillar pages (×5) | P1, P2, P3 | Understand a pillar's controls | Purpose, outcomes, key controls, evidence, maturity indicators | `{{controls:…}}` from `content/pillars.md` | Baseline / guardrails | Real control IDs only | Paraphrased control IDs |
| Control library (generated) | P1, P5, P6 | Browse controls | Every control with evidence and indicative mappings | Generated from `controls.yaml` | Baseline | Mapping disclaimer | Edits outside YAML |
| Maturity model | P1, P8 | Understand scoring before assessing | 1–5 scale, 8 weighted domains, 5 levels, User-asserted | From `content/maturity_model.md` | Assessment | Formula and weights | Implying the score is an audit |
| Solutions (×6) | Persona per module | Map pain to module | Problem → capabilities → controls → outputs → limitations | One-pagers in `content/commercial/one_pagers/` | Per page | Limitations section | Unbuilt features presented as available |
| Compliance overview + NIST / ISO / EU pages | P2, P5 | Understand alignment and limits | Indicative mappings; coverage gaps; readiness indicators | `docs/COMPLIANCE_MAPPING.md` tables and §7 gaps | Baseline; assessment | Standard disclaimer; EU timelines "verify against current Official Journal text and amendments (e.g. 2025 Digital Omnibus proposals)" | Dates presented as settled; "compliance guaranteed" |
| Gap-analysis method | P2, P6 | Trust the method | Evidence labels, severities, SLAs (30/60/90/180) | `aegis_common.evidence` | Baseline | Label definitions | — |
| Industry pages (×5) | Sector leads | See sector relevance | Priority use cases, emphasized controls, regimes to consider (verify with counsel) | `content/industry_packs/*.yaml` | Baseline / guardrails | "Verify with counsel" | Legal conclusions |
| Maturity self-assessment tool | P8 | Get a baseline | 8 minutes; instant result; detailed report on email | Engine output | Baseline | User-asserted label; consent text | Collecting PII before value |
| Guardrail generator | P3, P4 | Draft runtime policy | Risk profile, tool matrix, draft policy-as-code | Shield Advisor | Guardrails / demo | "Draft — review before use" | Implied production readiness |
| Ask AEGIS (demo) | P8 | Try the copilot | Cited answers; declines unsupported questions | Agent | Demo | Limited-demo notice; no sensitive data | — |
| Risk triage | P7, P8 | Suggest a tier | Inferred tier, factors, requires human confirmation | `calculate_risk_tier` | Baseline | Inferred label | "Legal classification" wording |
| Planned tools (×2) | P8 | Join waitlist | Clearly "planned" | — | Waitlist | "Planned" in title | Pretending availability |
| Blueprint | All | Download master document | Operating model, control library, rollout | Gated PDF | Download | Consent; business email | — |
| Case studies | P8 | Check traction | Honest: pilots not started; design partners welcome | Pilot tracker status | Design-partner programme | No invented cases | Any unapproved name/metric |
| Contact forms (×5) | All | Convert | Short forms; what happens next | — | Submit | Consent; privacy link | Pre-ticked consent |
| Legal pages | All | Transparency | Privacy, terms, responsible AI | Templates flagged for legal review | — | "Legal review required" until reviewed | — |

## 4. SEO plan

Keyword volumes and difficulty have **not** been researched in this repository (no network access); validate with an
SEO tool before prioritizing. Clusters below are hypotheses based on buyer language.

| Cluster | Target pages | Example keywords (hypotheses) | Intent |
|---|---|---|---|
| AI governance framework | /framework/, /framework/pillars/ | "AI governance framework", "enterprise AI governance", "AI governance operating model" | Research |
| AI inventory | /solutions/register/, blog inventory article | "AI inventory", "AI system register", "shadow AI discovery" | Problem-aware |
| AI risk assessment | /solutions/assess/, /tools/risk-triage/ | "AI risk assessment template", "AI use case risk tiering", "AI impact assessment" | Solution-aware |
| Maturity | /tools/maturity-assessment/, /framework/maturity-model/ | "AI governance maturity model", "AI governance maturity assessment" | Tool |
| Agent guardrails | /solutions/shield/, /tools/guardrail-generator/, blog guardrails article | "AI agent guardrails", "LLM runtime guardrails", "policy as code for AI agents", "human in the loop approval agents" | Solution-aware |
| Framework readiness | /compliance/* | "NIST AI RMF mapping", "ISO 42001 readiness", "ISO 42001 Annex A controls", "EU AI Act readiness", "EU AI Act deployer obligations" | Research |
| Sector | /industries/* | "AI governance banking", "AI governance healthcare", "AI governance public sector" | Research |

On-page rules: one H1; title ≤ 60 chars where possible; meta description 120–160 chars; descriptive slugs; internal
links from every cluster page to the assessment and to the relevant solution; FAQ JSON-LD only for genuine FAQs;
never target "certification" or "compliance software" phrasing that implies AEGIS certifies.

## 5. Conversion paths

| Path | Entry | Steps | Conversion | Follow-up |
|---|---|---|---|---|
| A. Assessment-led (primary) | Home, maturity model, compliance pages, blog | Start assessment → instant preliminary result → business email + consent → full report | Lead with `lead_rules` tags | Tag-based nurture; `baseline_priority` → Baseline outreach |
| B. Baseline-led | Solutions, compliance, industries | Book Governance Baseline form | Baseline request | Scoping call within 2 business days |
| C. Guardrails-led (engineering) | Shield, guardrail generator, GCC/SaaS industry pages | Generate draft policy → request demo | Demo request (`shield_candidate`) | 45-min working session (demo script) |
| D. Content-led | Blog, blueprint | Download blueprint / newsletter | Subscriber | Monthly newsletter; assessment invite |
| E. Design partner | Case studies page, about | Design-partner programme form | Application | Qualification scorecard (`content/pilots/pilot_status_tracker.md`) |

Lead qualification rules and routing are defined in [GTM_PLAN](GTM_PLAN.md) §8 and match
`maturity_self_assessment.yaml` → `lead_rules`.

## 6. Content governance

| Item | Rule |
|---|---|
| Ownership | Marketing Lead owns pages; Governance Content Lead approves any page that mentions controls, frameworks, regulations or evidence |
| Single sources | Controls → `controls.yaml`; scoring → `maturity_self_assessment.yaml`; mappings → `docs/COMPLIANCE_MAPPING.md`; sector content → industry packs; pricing → never on the public site until validated |
| Automated checks (build) | Front-matter validation; unknown control IDs fail the build; `find_prohibited_claims()` on every page; meta-description length; internal links |
| Human review | Two-person review for compliance, industry and legal pages; legal review for regulatory statements and legal pages before public launch |
| External communications | Publishing is an external communication — requires human approval |
| Customer content | No customer names, logos, quotes or metrics without written approval and verified metrics (`content/commercial/case_study_template.md`) |
| Review cadence | Compliance and industry pages: quarterly and on material regulatory change; solutions pages: each release; blog: annual accuracy check; legal pages: on change and annually |
| Regulatory dates | Never stated as settled; always with "verify against current Official Journal text and amendments" (risk R-07) |
| Change log | Every page has `updated:` in front matter; material changes noted in release notes |
