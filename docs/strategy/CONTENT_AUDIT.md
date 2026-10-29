# VERITRAIL content audit — duplication, originality, terminology and product conflicts

| | |
|---|---|
| **Date** | 2026-10-29 |
| **Scope** | 57 website pages and FAQs (`platform/content/website_pages`), 64-control library, glossary, framework docs, industry and policy packs, the workspace app's content (`src/data`, workspace screens), plans and billing copy, README and product docs |
| **Method** | Scripted near-duplicate analysis (sentences, 5-word shingles, page containment, SEO fields); exact-phrase web searches on distinctive passages; web searches on product names and regulatory status; two independent read-throughs (website vs itself; app vs website and docs); every High finding re-checked in the code |
| **Status** | Findings and recommendations; nothing in this report has been changed yet |

## 1. Verdict

| Area | Result |
|---|---|
| Internal duplication | **Clean.** No duplicate titles, H1s, descriptions or nav labels; 2 repeated sentences (legal template banner; blog byline); highest page-to-page overlap 19% (assessment modules vs risk triage, a shared intake table). |
| Plagiarism (external copying) | **No copying found** in the passages tested — 8 exact-phrase searches on the most generic-sounding passages returned no source. One short phrase from ISO's public abstract of ISO/IEC 42001 is used without attribution. This was a sample, not a full scan (see §3). |
| Name conflicts on the web | **Action needed.** "VeriTrail" is a published Microsoft Research AI method, and VERITRAIL is a filed trademark of Bureau Veritas; "Tiller" is an established finance-software brand. |
| Regulatory currency | **Out of date.** The EU AI Act Digital Omnibus was adopted as Regulation (EU) 2026/1744; six places still call it a 2025 "proposal" and list superseded dates. |
| Product vs website consistency | **Material conflicts.** Three unrelated scoring systems share the word "maturity"; the app relabels VERITRAIL tiers with EU AI Act category names; legal pages describe AI processing the code does not do. |
| Core framework numbers on the website | **Consistent.** 64 controls, 5 pillars, 8 domains, 24 questions, tiers, evidence labels, rollout modes, Baseline scope — the same everywhere. |

## 2. Internal duplication

Corpus: 1,373 text units — 1,039 page paragraphs and FAQs, 231 app strings (playbook, templates, workspace data), 65 control texts, 38 glossary definitions.

| Check | Finding |
|---|---|
| Exact duplicate sentences (12+ words) in 2+ places | 2: the "Template — legal review required" banner (`legal-terms.md`, `legal-subscription-terms.md`) and an identical byline "published 21 October 2026, about 8 minutes to read" on two blog posts. Both acceptable; consider varying the blog dates/read times if they are not accurate. |
| Near-duplicate paragraphs (Jaccard ≥ 0.45) | 2: the intake-field table in `framework-assessment-modules.md` and `tools-risk-triage.md` (0.48), and the two legal banners. |
| Page overlap (share of the smaller page's 5-word phrases) | Highest pairs: assessment modules ↔ risk triage 19%; `framework-runbooks` ↔ `resources-runbooks` 15%; `resources-blog` ↔ `resources` 10%. No page is a near-copy of another. |
| Search keyword cannibalisation | Low risk. The two runbooks pages and the two EU AI Act pages (`compliance-eu-ai-act`, `tools-eu-ai-act-readiness-checker`) target similar queries; give each a distinct intent in its title/description. |
| Boilerplate | Most repeated 10-word phrases are deliberate: "NIST AI RMF, ISO/IEC 42001 and the EU AI Act" (5 pages) and the Official Journal verification caveat (4 pages). |
| App content vs website | 1 shared phrase — ISO's scope statement (see §3). The playbook and templates are written independently of the website. |

**Recommendation:** no de-duplication work needed. Link the runbooks pages to each other, and make one the canonical page.

## 3. Originality and external copying

**Method.** For each non-legal page the most distinctive generic sentence (18–40 words, not mentioning VERITRAIL) was extracted. The 8 most "textbook-sounding" were searched as exact phrases (EU AI Act overview, NIST MANAGE description, ISO 42001 structure, inventory blog, Register, public sector, healthcare, Agent).

**Result.** No verbatim source found for any of them; results only made the same points in different words. Descriptions of the standards are paraphrases of common knowledge, which is expected for this subject.

| Item | Risk | Recommendation |
|---|---|---|
| `compliance-iso-42001.md:23` and `src/data/governance.ts:446` use ISO's own scope sentence ("requirements for establishing, implementing, maintaining and continually improving an AI management system") | Low — short phrase from ISO's public abstract | Attribute it ("ISO describes the standard as…") or paraphrase. Never quote ISO clause text beyond titles: ISO standards are copyrighted paid documents, unlike EU law and NIST publications. |
| NIST AI RMF function descriptions (`compliance-nist-ai-rmf.md`) closely follow NIST's wording | Low — NIST publications are US government works | Keep the citation to NIST AI 100-1 on the page. |
| Medical-device definition wording (`industries-healthcare-pharma.md`) mirrors regulator wording (EU MDR, TGA) | None — legal definitions | Keep the "for example under the EU Medical Device Regulation" attribution. |

**Limit.** This was a sample of 8 of 52 candidate passages, not a full scan. Before launch, run the whole site through a commercial plagiarism checker (for example Copyscape or Originality.ai) and keep the report. That is also useful evidence if a competitor later claims the content was copied *from* them.

## 4. Product names and terms on the web

| Term | What exists already | Risk | Recommendation |
|---|---|---|---|
| **VERITRAIL** | [VeriTrail — Microsoft Research](https://www.microsoft.com/en-us/research/publication/veritrail-closed-domain-hallucination-detection-with-traceability/): a published method for detecting hallucinations in AI output, with traceability — the same field. A [VERITRAIL trademark filing by Bureau Veritas](https://trademarks.justia.com/category/transportation-and-storage/2018/november/21/) (2018, scientific testing apparatus). | **High** for brand clearance — same name in AI assurance, plus an existing filing in a nearby trademark class | Commission a trademark clearance search (India, EU, US, UK) for software and SaaS classes 9 and 42 **before** further brand spend, Dodo merchant onboarding or app-store listings. Have a fallback name ready. |
| **TILLER** (workspace studio) | [Tiller Money](https://tiller.com/why-tiller/), a well-known spreadsheet finance app (Seattle, since 2014). | Medium — different market, but an established software brand | Use TILLER descriptively ("the TILLER check") rather than as a standalone product mark, or rename. Clearance search alongside VERITRAIL. |
| **Runtime Shield** | Crowded generic space: [Palo Alto Networks AI Runtime Security](https://www.paloaltonetworks.com/blog/?p=333194), [Island AI Runtime Protection](https://www.island.io/ai/ai-runtime-protection), [Datadog AI Guard](https://www.datadoghq.com/product-preview/ai-security/), "AI Shield". | Low (descriptive) — weak as a brand | Fine as a module name; don't rely on it as a mark. |
| **Governance Baseline** | No product uses this as a named offering; consultancies use "baseline" generically. | None | Keep. |
| **AEGIS / GOVERN** (retired names) | 0 remaining uses on the website. | — | Done. The workspace still shows legacy letters G/O/V/E/R/N; see §6. |

## 5. Regulatory currency

The Digital Omnibus on AI was adopted as **Regulation (EU) 2026/1744**: published in the Official Journal on 24 July 2026 and in force from 27 July 2026. It moves stand-alone Annex III high-risk obligations to **2 December 2027** and Annex I product-embedded systems to **2 August 2028** ([AI Act Monitor](https://www.aiactblog.nl/en/ai-act-monitor/digital-omnibus-2026-1744-in-force), [Orrick](https://www.orrick.com/en/Insights/2026/07/EU-AI-Act-Update-Digital-Omnibus-Finalizes-8-Compliance-Changes), [artificialintelligenceact.eu](https://artificialintelligenceact.eu/ai-act-explorer/digital-omnibus/)). Confirm against the EUR-Lex text before publishing.

| Location | Problem |
|---|---|
| `compliance-eu-ai-act.md:17` (FAQ), `:31`, `:33` | Calls the Omnibus "2025 proposals"; lists "August 2026" for Annex III, which is superseded; says post-2025 changes were not verified |
| `compliance.md:63`, `tools-eu-ai-act-readiness-checker.md:32`, `resources-blog-readiness-is-not-compliance.md:49`, `legal-responsible-ai.md:58`, `veritrail_framework.md:218` | Same "2025 Digital Omnibus proposals" caveat |
| `compliance-eu-ai-act.md:25,52` | AI literacy (Art. 4) wording; check against the adopted text, which changed Article 4 |
| Pages say the library is "reviewed quarterly" (`framework.md:17`, `legal-responsible-ai.md:57`, `contact-newsletter.md:23`) | The stale caveat contradicts that promise |

**Recommendation:** one dated regulatory refresh of these 7 places plus the glossary's "high-risk AI system" entry (add the Annex I route). Record it in the content change log (`src/data/content-changelog.ts`) and set a calendar for the quarterly review the site promises. Have a qualified EU AI Act specialist sign it off (open question OQ-06).

## 6. Product vs website conflicts

### 6.1 Three scoring systems, none mapped

| | Website framework | Website maturity tool | Workspace "TILLER" |
|---|---|---|---|
| Structure | 5 pillars, 64 controls | 8 domains, 24 questions | 6 "pillars", 12 controls |
| Answer scale | — | 1–5 | 0–4 |
| Levels | Initial <40 · Developing 40–59 · Defined 60–74 · Managed 75–89 · Optimized 90+ | same | Nascent <30 · Emerging <50 · Established <70 · Managed 70–84 · Optimized 85+ (`model.ts:30-39`) |
| Evidence | Verified needs a named reviewer | User-asserted | User picks None/Claimed/Partial/**Verified** themselves (`governance.ts:221`) |

A score of 72 is "Defined" on the site and "Managed" in the app. The homepage shows "64 controls / 5 pillars" next to the six-pillar TILLER gateway (`home.tsx:89-90`, `workspace-gateway.tsx:15`). TILLER appears on no website page. `tools.md:16` claims the tools use "the same … scoring rules as the VERITRAIL platform". The glossary defines a pillar as one of five, and TILLER as having six.

**Recommendation (High):**
- Keep the 64-control framework as canonical.
- Present TILLER as a 12-question quick check whose six areas are called "lenses", not pillars.
- Map each TILLER question to the control IDs it covers, and show them in the app.
- Use the website's five level names and thresholds in the app, or rename the app's output "readiness index".
- Add one paragraph explaining TILLER to `framework.md` and the workspace gateway.

### 6.2 Other conflicts (ranked)

| Sev. | Conflict | Evidence | Fix |
|---|---|---|---|
| High | Inventory relabels VERITRAIL tiers as EU AI Act categories (Low→"Minimal", Medium→"Limited", High→"High-risk", Prohibited-review→"Prohibited"). That implies a legal classification and drops the "review" hedge. | `screens-operations.tsx:79-86` | Show VERITRAIL tier names; any EU category only as a separate, human-confirmed field |
| High | Users can mark their own evidence "Verified"; the overview counts it as verified. The framework requires a named reviewer. | `governance.ts:221`, `screens-core.tsx:93-95` vs `veritrail_framework.md:216` | Rename the self-selected status "Evidence attached", or require reviewer name and date |
| High | Legal pages describe AI the code doesn't use, and miss the AI it does. Ask VERITRAIL and the Agent are deterministic (no model, no network), yet the Responsible AI and privacy pages say AI interprets questions and drafts answers and mention [30-day] conversation retention. The workspace advisor, which **does** call an external model, isn't listed. | `legal-responsible-ai.md:24`, `legal-privacy.md:49,67` vs `ask-veritrail/orchestrator.ts:5`, `advisor.functions.ts` | Rewrite the AI table and privacy rows to match the code |
| High | The full maturity report is promised "by email", but the code never sends e-mail; the tool itself says so. | `tools.md:22` vs `integrations.server.ts:356`, `maturity-assessment.tsx:887` | "full report to download (business e-mail required)" |
| High | Plans list limits and features that aren't enforced or built: AI-system and workspace limits, evidence storage, watermark, Business "integrations", Enterprise "Runtime Shield … assurance testing". Only seats and the advisor allowance are enforced. *This came from my own billing work.* | `src/data/plans.ts` | Mark these "coming soon", or enforce them before selling. Don't list features that aren't built |
| High | Paid checkout exists while the legal pages are live drafts: privacy has 23 [placeholders], terms 8, subscription terms 7, including the refund policy. | `legal-*.md` | Complete the pages and get legal review before switching Dodo to live mode |
| High | Solution pages describe Shield, Assurance and the evidence repository as deployed, in the present tense; in the app they are demo or synthetic. | `solutions-shield.md:25,114`, `solutions-assurance.md:28-30`, `index.md:20` | Add an availability label per module (Available / Preview / Design partners) |
| Medium | Two different "six layers" lists | `index.md:45-52` vs `veritrail_framework.md:109-116` | One list |
| Medium | "High-risk" means both the VERITRAIL High tier (10 table cells) and the EU AI Act category | e.g. `framework-pillars-stewardship-assurance.md:47`, `index.md:36` | "High-tier" for VERITRAIL; "high-risk" only for the Act |
| Medium | Policy packs page lists an "IT operations agent" pack that doesn't exist, and omits 3 that do | `resources-policy-packs.md:40` vs `platform/content/policy_packs/` | Align the table with the files |
| Medium | Self-serve plans and Dodo checkout appear only in the legal pages; marketing pages describe software sold through an engagement | `solutions.md:48`, `contact-design-partner-programme.md` vs `legal-subscription-terms.md` | Add a plans and modules-by-plan statement to `/solutions` and `/plans` |
| Medium | Legacy GOVERN letters still shown: the advisor shows `E1` (= Lawfulness L3) beside TILLER code `E1` (= Engineering); roadmap tags "V · Govern", "N · Manage" | `screens-advisor.tsx:74,159,176`, `governance.ts:972,1027-1104` | Show TILLER codes only |
| Medium | "Free snapshot" links to the TILLER workspace, while the site's "Assess" means the 24-question tool | `screens-resources.tsx:573` vs `solutions-assess.md:60` | Point it to `/tools/maturity-assessment/` |
| Medium | CRM/HubSpot lead push is not disclosed in the privacy notice | `leads.functions.ts:11` vs `legal-privacy.md:53` | List the CRM as a processor |
| Medium | Shield "evaluates every prompt, response and tool call", but its own limitations section says agents that bypass it aren't covered | `solutions-shield.md:25` vs `:130` | "…every call routed through Shield" |
| Medium | Absolute claims: "Govern **every** AI system…", "**prove** responsible AI continuously" | `index.md:3-4`, `solutions-assurance.md:3` | "evidence"/"demonstrate"; drop "every" |
| Low | Medium-tier approver has three versions; key controls per domain differ between the page and the framework doc | `solutions-control.md:60`, `framework-pillars-lifecycle.md:66`, `veritrail_framework.md:74,180` | One source of truth |
| Low | Governance Baseline description and credit differ between the site and `/plans`; the credit only appears on the Enterprise plan | `solutions.md:48` vs `plans-screen.tsx`, `plans.ts:108` | One shared description |
| Low | Stale product docs: PRD FR-42 "Assess, Govern and Assure plans", FR-41 "one workspace per user", "56 pages"; the roadmap doc still cites "$499" | `PRD.md:117,189,190`, `COMMERCIALIZATION_ROADMAP.md:57,103` | Update |
| Low | Screen names differ: `/gates` is "Release readiness", "Release gates" or "Release gate"; `/templates` and `/more` have two names each | `shell.tsx`, `screens-resources.tsx` | One name per screen |
| Low | "We see" experience claims with no published customers | `resources-blog-runtime-guardrails-for-ai-agents.md:67` vs `resources-case-studies.md` | "A common failure is…" |

### 6.3 README

| Sev. | Problem | Fix |
|---|---|---|
| Medium | Badge and clone URL point to `kalilurrahman/ai-governance-advisory`; the repository is `kalilurrahman/thoughtful-ai-advisory` (`README.md:21,249`) | Correct the URLs |
| Medium | Claims an MIT licence; there is no LICENSE file (`README.md:279`) | Add the licence you intend, or remove the claim. Decide deliberately: an open-source licence lets anyone reuse the content and code |
| Medium | "Automated classification against Risk Tiers (Unacceptable, High, Specific Transparency, Minimal)" and "client-ready … audit reports" (`README.md:191,205`); no engine does this, and the reports are labelled previews | Remove or reword |
| Low | "100% parity", a placeholder video URL, `/workspace/*` routes | "fixture-tested parity"; link `docs/assets/landing-demo.webm`; real routes |

## 7. Terminology and house style

| Issue | Count / location | Recommendation |
|---|---|---|
| "an VERITRAIL" | 17 occurrences in `platform/content`, including titles and H1s (`contact-book-governance-baseline.md:2,3`, `contact-request-demo.md:2`, `index.md:27`, `tools-guardrail-generator.md:5`) | "a VERITRAIL" |
| US vs UK spelling mixed | organization 44 / organisation 3 (all in the glossary, which feeds the tooltips); programme 34; labelled 25; modelling 10; minimisation 5; behaviour 1 vs behavior 8 | Pick one (US matches most pages) and add a style rule to the content checks |
| "VERITRAIL Enterprise" as the product name vs "Enterprise" as a plan | `index.md:2,4`, `resources-blueprint.md`, `framework.md:84` | "VERITRAIL" for the product; "Enterprise" only for the plan |
| "Module" means product modules and assessment modules | `solutions.md:16` vs `framework-assessment-modules.md` | Always "assessment module" for the second |
| Answer label "Initial / ad hoc" reuses the level name "Initial" | `framework-maturity-model.md:55` | "Ad hoc" |
| "evidence label" 22 vs "evidence status" 20 | site-wide | Choose one |
| Rollout shown as "Observe → … → Contain"; the same blog says Contain is not a step | `resources-blog-runtime-guardrails-for-ai-agents.md:65,82`, `solutions-shield.md:107` | "Observe → Warn → Protect → Enforce, with Contain for incidents" |

## 8. What is consistent (no action)

- Control counts, pillar names and order, maturity model weights and questions, critical flags, tier names, the five evidence labels, rollout modes and the seven Shield decisions are identical across pages, glossary, YAML and framework docs.
- Governance Baseline scope (4–6 weeks, up to 25 systems, 5 deep-dives, 2 agent reviews) is the same in 10+ places.
- NIST AI RMF and ISO/IEC 42001 reference IDs are valid.
- No outright "compliant", "certified" or "guarantee" claims; every such word appears in a negation.
- Planned tools, whitepapers and downloadable packs are correctly labelled "Planned" or "Coming soon".
- No internal links point to missing pages.
- Workspace numbers are internally consistent: 21 guardrails at 6/18/21, tier floors 70/55/40, 12 playbook chapters, 8 templates.

## 9. Prioritised fix list

**P0 — before taking payments or launching publicly**
1. Trademark clearance for VERITRAIL (and TILLER); decide whether to keep the name.
2. Complete and legally review the privacy notice, terms and subscription terms (refund policy). Make the AI-processing rows match the code: deterministic Ask VERITRAIL; LLM-based workspace advisor; CRM processor.
3. Remove or mark "coming soon" the plan limits and features that aren't enforced or built.
4. Fix the "report by email" promise and the absolute claims ("every", "prove").
5. Add availability labels to the Shield, Assurance and evidence-repository descriptions.

**P1 — next content release**
6. EU AI Act refresh for Regulation (EU) 2026/1744, in all 7 places plus the glossary, with a change-log entry.
7. Reconcile the frameworks: TILLER as a 12-question check mapped to the 64 controls; one set of level names and bands; self-selected "Verified" renamed.
8. Stop relabelling tiers as EU AI Act categories; show TILLER codes only.
9. Fix the README (URLs, licence, overclaims).
10. Align the policy-packs table, the six-layers list and the Medium-tier approver.

**P2 — house style**
11. "an VERITRAIL" → "a VERITRAIL" (17); one spelling standard enforced by `check_website_pages.py` and its TypeScript port; "High-tier" vs "high-risk"; one name per screen; "assessment module".
12. Full commercial plagiarism scan of the whole site; keep the report.
