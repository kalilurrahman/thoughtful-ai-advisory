<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

<div align="center">

# 🛡️ VERITRAIL · AI Governance Advisory & Assurance Platform

**Enterprise-grade AI risk management, governance capabilities, safety controls, and regulatory compliance.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-thoughtful--ai--governance.lovable.app-0066CC?style=for-the-badge&logo=react)](https://thoughtful-ai-governance.lovable.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-kalilurrahman%2Fthoughtful--ai--advisory-black?style=for-the-badge&logo=github)](https://github.com/kalilurrahman/thoughtful-ai-advisory)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-FF4154?style=for-the-badge)](https://tanstack.com/router)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20%26%20Installable-5A0FC8?style=for-the-badge&logo=pwa)](https://thoughtful-ai-governance.lovable.app/)

[Live Demo](https://thoughtful-ai-governance.lovable.app/) • [Video Walkthrough](#-video-walkthrough--interactive-demo) • [Landing Showcase](#-public-landing-site-showcase) • [Workspace Showcase](#-operational-governance-workspace-showcase) • [TILLER Pillars](#-the-6-tiller-governance-pillars) • [Export Studio](#-enterprise-multi-format-audit-export-engine) • [Architecture & Routes](#-platform-architecture--full-route-map) • [Quick Start](#-quick-start--local-development)

</div>

---

## 💡 Overview

**VERITRAIL** is an all-in-one, enterprise-ready AI governance platform, landing site, and assurance workspace built for AI safety teams, compliance officers, risk managers, and engineering leaders establishing operational AI controls aligned with global standards (**NIST AI RMF 1.0**, **EU AI Act**, and **ISO/IEC 42001:2023**).

VERITRAIL integrates a full public marketing & content site, a 64-control governance library, in-browser interactive rule engines (Maturity Assessment, Risk Triage, Guardrail Generator, Ask VERITRAIL), and an operational governance workspace (TILLER Assessment Studio, AI System Inventory, Incident Register, Release Gate Reviews, Action Tracking, and Multi-Format Audit Deliverable Studio).

> **Naming Note.** The platform was previously named _AEGIS_ and its assessment studio _GOVERN_. To avoid confusion with established industry frameworks (e.g. Forrester AEGIS and NIST AI RMF GOVERN function), the platform is **VERITRAIL** and the assessment studio is **TILLER**. The six workspace pillars spell **TILLER** (**T**rust, **I**nventory, **L**ifecycle, **L**awfulness, **E**ngineering, **R**untime).

---

## 🎬 Video Walkthrough & Interactive Demo

Watch VERITRAIL in action—navigating the public marketing landing site, exploring the 64-control library, testing client-side AI risk rule engines, and managing systems inside the operational workspace:

> 📹 *[`./docs/assets/landing-demo.webm`](./docs/assets/landing-demo.webm)*

---

## 📸 Public Landing Site Showcase

### 🏠 Landing Page (Light & Dark Theme)

VERITRAIL provides a responsive, beautifully styled landing experience complete with executive metrics, interactive trust widgets, framework pillars, and real-time governance counters.

| Light Mode Landing | Dark Mode Landing |
| :----------------: | :---------------: |
| ![Landing Light](./docs/assets/uplift/after-home-desktop.jpg) | ![Landing Dark](./docs/assets/uplift/after-home-dark.jpg) |

| Hero & Key Stats Section | Governance Framework & Pillars |
| :----------------------: | :----------------------------: |
| ![Landing Home](./docs/assets/landing-home.png) | ![Landing Framework](./docs/assets/landing-framework.png) |

---

### 📚 64-Control Governance Library & Article Reading Experience

Explore granular controls mapped across NIST AI RMF (`GOVERN`, `MAP`, `MEASURE`, `MANAGE`), EU AI Act Articles, and ISO/IEC 42001 clauses. Includes cross-linked definitions, interactive cards, and inline illustrations.

| 64-Control Library Grid | Article & Reading Experience |
| :---------------------: | :--------------------------: |
| ![64-Control Library](./docs/assets/landing-controls.png) | ![Article View](./docs/assets/uplift/after-article-desktop.jpg) |

---

### ⚡ Client-Side Interactive AI Governance Engines

Zero-latency, client-side TypeScript rule engines held in fixture-tested parity with Python reference implementations via automated exported test fixtures.

| 📊 In-Browser Maturity Assessment Engine | 🤖 Ask VERITRAIL AI Assistant & Knowledge Hub |
| :---------------------------------------: | :-------------------------------------------: |
| ![Maturity Assessment](./docs/assets/landing-tools-maturity.png) | ![Ask VERITRAIL](./docs/assets/landing-tools-ask-veritrail.png) |

* **Maturity Assessment**: Multi-step evaluation generating maturity index scores and targeted improvement roadmaps.
* **Risk Triage Engine**: Risk tiering against VERITRAIL tiers (Minimal, Limited, High-risk, Prohibited-review) with EU AI Act cross-references and explainable decision rationale.
* **Guardrail Generator**: Automated policy rule synthesis based on model deployment parameters.
* **Ask VERITRAIL**: Searchable governance assistant querying curated regulatory guidance and framework controls.

---

## 🛠️ Operational Governance Workspace Showcase

The **TILLER Governance Workspace** equips cross-functional risk teams with real-time auditing, system inventory management, decision logging, incident response tracking, and audit report exports.

| 🖥️ TILLER Workspace Overview | 📊 Governance Dashboard & Maturity Radar |
| :--------------------------: | :-------------------------------------: |
| ![Workspace Overview](./docs/assets/landing-workspace.png) | ![Desktop Overview](./docs/assets/desktop-overview.png) |

| 🗂️ AI Systems Inventory & Triage | 🛡️ Guardrails Policy Synthesis |
| :-------------------------------: | :-----------------------------: |
| ![Desktop Inventory](./docs/assets/desktop-inventory.png) | ![Desktop Guardrails](./docs/assets/desktop-guardrails.png) |

| 🚦 Release Gate Reviews & Checkpoints | ⚖️ Decision & Governance Rationale Log |
| :-----------------------------------: | :-------------------------------------: |
| ![Desktop Gates](./docs/assets/desktop-gates.png) | ![Desktop Decisions](./docs/assets/desktop-decisions.png) |

| 🚨 Incident & Near-Miss Register | 📋 Remediation & Action Tracking |
| :------------------------------: | :------------------------------: |
| ![Desktop Incidents](./docs/assets/desktop-incidents.png) | ![Desktop Actions](./docs/assets/desktop-actions.png) |

| 📡 Continuous Monitoring & Telemetry | ⚙️ Platform Admin & Simulation Console |
| :----------------------------------: | :-----------------------------------: |
| ![Desktop Monitoring](./docs/assets/desktop-monitoring.png) | ![Desktop Platform Console](./docs/assets/desktop-platform.png) |

| 📖 Interactive Playbook Reader | 📄 Audit Deliverables & Export Studio |
| :----------------------------: | :------------------------------------: |
| ![Desktop Playbook](./docs/assets/desktop-playbook.png) | ![Desktop Export Studio](./docs/assets/desktop-export.png) |

---

## 📑 Enterprise Multi-Format Audit Export Engine

VERITRAIL features a client-side deliverable generation engine that converts workspace governance state into publication-ready corporate documents without exposing raw confidential data to external services.

| Format | Output Type | Generated Deliverable Features |
| :--- | :--- | :--- |
| 📄 **PDF** | Executive One-Pager & Evidence Pack | Vector styled executive summaries, maturity band gauges, pillar radar visuals, and gap lists created via `jspdf`. |
| 📊 **Excel (XLSX)** | Comprehensive Scorecard Workbook | Structured multi-tab workbooks containing raw calculation models, control status, evidence links, and score formulas via `exceljs`. |
| 📽️ **PowerPoint (PPTX)** | Board Presentation Deck | Native vector slide presentations formatted for board reviews, displaying pillar visual benchmarks via `pptxgenjs`. |
| 📝 **Word (DOCX)** | Formal Compliance Manual | Structured compliance documentation complete with table of contents, control matrices, and sign-off sections via `docx`. |

---

## 🏛️ The 6 TILLER Governance Pillars

The workspace evaluates AI systems across six fundamental operational dimensions that spell **TILLER**:

```
                       ┌───────────────────────────────────────────────┐
                       │          T I L L E R   P I L L A R S          │
                       └───────────────────────┬───────────────────────┘
                                               │
    ┌──────────────┬──────────────┬────────────┴─┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼              ▼
┌────────┐    ┌────────┐    ┌──────────┐   ┌────────────┐  ┌───────────┐  ┌─────────┐
│ Trust  │    │Inven-  │    │Lifecycle │   │ Lawfulness │  │Engineerin-│  │ Runtime │
│        │    │ tory   │    │          │   │            │  │   ging    │  │         │
└────────┘    └────────┘    └──────────┘   └────────────┘  └───────────┘  └─────────┘
```

1. **T — Trust**: Human agency, explainability, transparency, stakeholder communication, and oversight protocols.
2. **I — Inventory**: Centralized AI asset tracking, system owners, risk classifications, data lineage, and third-party vendor tracking.
3. **L — Lifecycle**: Stage-gated development workflows, evaluation checkpoints, deployment criteria, and release sign-offs.
4. **L — Lawfulness**: Strict compliance mapping for EU AI Act obligations, NIST AI RMF functions, and ISO/IEC 42001 clauses.
5. **E — Engineering**: Technical robustness, prompt injection defense, red-teaming validation, bias testing, and safety guardrails.
6. **R — Runtime**: Live performance monitoring, telemetry, incident and near-miss logging, and automated feedback loops.

---

## 📱 Multi-Device & Mobile Responsiveness

VERITRAIL is engineered from the ground up for seamless operation across desktop workstations, tablets, and smartphones. Headers and navigation bars remain strictly on a single row at every viewport size (360px+).

| Tablet Viewport (768px - Workspace) | Mobile Viewport (375px - Overview) | Mobile Viewport (375px - Playbook) |
| :---------------------------------: | :--------------------------------: | :--------------------------------: |
| ![Tablet Workspace](./docs/assets/tablet-overview.png) | ![Mobile Overview](./docs/assets/mobile-overview.png) | ![Mobile Playbook](./docs/assets/mobile-playbook.png) |

---

## 📲 Installable App (PWA) & Offline Capabilities

VERITRAIL functions as a full **Progressive Web App (PWA)**, providing native-like app capabilities across desktop and mobile browsers.

* **One-Click Installation**: Prompts on Chrome, Edge, Android, iOS Safari, and macOS Dock. Shortcuts point directly to Self-Assessment, Risk Triage, Control Library, Ask VERITRAIL, and the TILLER Workspace.
* **Offline-First Reading**: Production service worker (`public/sw.js`) caches visited pages, illustrations, and client-side rule engines for instant offline access.
* **Smart Search (⌘K / Ctrl+K)**: Instant fuzzy search across every page, FAQ, governance control ID, glossary definition, and workspace tool.
* **Appearance — themes & fonts**: Three colour themes — **Broadsheet** (VERITRAIL teal), **Midnight Gold** and **Financial Slate**, inspired by financial risk interfaces — each in light and dark with an **Auto** mode that follows the device (the default), plus three fonts (**Editorial serif**, **KR Tools** DM Sans + Cormorant Garamond, **Modern sans** Inter). Applied before first paint, remembered per browser, WCAG AA in every theme.

| Mobile Home View | Workspace Install Card | iPhone Installation Guide |
| :--------------: | :--------------------: | :-----------------------: |
| ![Mobile Home](./docs/assets/uplift/after-home-mobile.jpg) | ![Workspace Install](./docs/assets/uplift/install-card-workspace.jpg) | ![iPhone Install](./docs/assets/uplift/install-flow-iphone.jpg) |

| Broadsheet · Light · Editorial serif | Midnight Gold · Dark · KR Tools | Financial Slate · Light · Modern sans |
| :--: | :--: | :--: |
| ![Broadsheet theme](./docs/assets/appearance/broadsheet-light-serif.jpg) | ![Midnight Gold theme](./docs/assets/appearance/gold-dark-kr.jpg) | ![Financial Slate theme](./docs/assets/appearance/slate-light-sans.jpg) |
| **Workspace · Midnight Gold** | **Workspace · Financial Slate dark** | **Appearance panel** |
| ![Workspace in Midnight Gold](./docs/assets/appearance/gold-dark-kr-workspace.jpg) | ![Workspace in Financial Slate](./docs/assets/appearance/slate-dark-sans-workspace.jpg) | ![Appearance panel](./docs/assets/appearance/panel-desktop.jpg) |

---

## 🌐 Platform Architecture & Full Route Map

VERITRAIL pairs a content-driven marketing website with client-side interactive governance engines, an operational workspace, and PostgreSQL persistence with security RLS.

```
                  ┌───────────────────────────────────────────────┐
                  │          VERITRAIL Public Landing Site        │
                  │   (Markdown + Frontmatter Content Engine)     │
                  └───────────────────────┬───────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
│  64-Control Library   │   │ Interactive Rule Engines  │   │ Compliance Standards  │
│  (NIST / EU AI / ISO) │   │ (Maturity, Risk, Ask AI)  │   │  (EU Act, NIST RMF)   │
└───────────────────────┘   └───────────────────────────┘   └───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │         TILLER Governance Workspace           │
                  │  (System Inventory, Assessment, Audits, Gates)│
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │   Supabase PostgreSQL & Security RLS Layers   │
                  └───────────────────────────────────────────────┘
```

### Complete Route & Feature Navigation Map

| Section | Route Path | Component / Source Path | Key Features & Capabilities |
| :--- | :--- | :--- | :--- |
| **Landing** | `/` | `src/routes/index.tsx` | Executive metrics, framework pillars, ROI breakdown, trust badges |
| **64 Controls** | `/framework/controls` | `src/routes/framework.controls.index.tsx` | Searchable control matrix, NIST/EU Act/ISO crosswalks |
| **Control Detail** | `/framework/controls/$controlId` | `src/routes/framework.controls.$controlId.tsx` | Deep control specs, implementation guidance, evidence requirements |
| **Compliance Guides**| `/compliance/*` | `platform/content/website_pages/` | In-depth regulatory analyses (EU AI Act, NIST AI RMF, ISO 42001) |
| **Maturity Tool** | `/tools/maturity-assessment` | `src/features/site/engines/` | In-browser 5-stage maturity evaluation and roadmap generator |
| **Risk Triage Tool** | `/calculators` | `src/routes/calculators.tsx` | Zero-latency EU AI Act & NIST risk tiering calculator |
| **Ask VERITRAIL** | `/advisor` | `src/routes/advisor.tsx` | Vectorized AI governance assistant & regulatory knowledge base |
| **Workspace Home** | `/workspace` | `src/routes/workspace.tsx` | Workspace overview, TILLER radar chart, readiness indicators |
| **System Inventory** | `/inventory` | `src/routes/inventory.tsx` | Comprehensive AI model catalog, owner tagging, risk tiering |
| **TILLER Studio** | `/assess` | `src/routes/assess.tsx` | Interactive 6-pillar assessment studio & score calculator |
| **Guardrails Studio** | `/guardrails` | `src/routes/guardrails.tsx` | Automated safety prompt and policy rule generator |
| **Decision Log** | `/decisions` | `src/routes/decisions.tsx` | Governance decision rationale register and audit log |
| **Incident Register**| `/incidents` | `src/routes/incidents.tsx` | AI incident & near-miss tracking, severity classification |
| **Action Tracking** | `/actions` | `src/routes/actions.tsx` | Remediation task manager, owners, and target dates |
| **Release Gates** | `/gates` | `src/routes/gates.tsx` | Stage-gate compliance sign-offs prior to production deployment |
| **Monitoring** | `/monitoring` | `src/routes/monitoring.tsx` | Live telemetry, drift tracking, and continuous monitoring |
| **Audit Exports** | `/export` | `src/routes/export.tsx` | One-click deliverable exporter (PDF, XLSX, PPTX, DOCX) |
| **Admin Console** | `/platform` | `src/routes/platform.index.tsx` | Local admin suite, rule validator, and simulation tools |
| **Templates** | `/templates` | `src/routes/templates.tsx` | Downloadable AI policy, model card, and agreement templates |
| **Glossary** | `/glossary` | `src/routes/glossary.tsx` | Underlined interactive AI governance definitions and terms |
| **Revision Register**| `/changes` | `src/routes/changes.tsx` | Curated public release notes and revision log |

---

## 🔒 Security Architecture & Data Privacy

* **Row-Level Security (RLS)**: PostgreSQL databases isolated via RLS policies ensuring tenant workspace data and submitted leads (`site_leads`) are completely protected.
* **Privacy by Design**: Client-side demo interactions remain local to the user's browser until explicitly saved via an authenticated Cloud session.
* **Atomic Workspace Saving**: Server functions utilize atomic SQL functions (`save_aegis_workspace`) to prevent partial state updates and race conditions.

---

## 🛠️ Complete Tech Stack

| Component | Tech / Library | Description |
| :-------- | :------------- | :---------- |
| **Frontend Framework** | [React 19](https://react.dev/) & [TanStack Start](https://tanstack.com/router) | Fullstack SSR + CSR framework powered by TanStack Router |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | Strict type safety across client, server, and governance engines |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) | High-contrast design tokens, accessible primitives; Broadsheet, Midnight Gold and Financial Slate themes |
| **Data Visualization** | [Recharts](https://recharts.org/) | SVG radar & bar charts for maturity scores and system risk distributions |
| **Database & Auth** | [Supabase](https://supabase.com/) & [Drizzle ORM](https://orm.drizzle.team/) | Row-Level Security (RLS), atomic workspace saving, PostgreSQL migrations |
| **Export Engines** | `exceljs`, `pptxgenjs`, `jspdf`, `docx` | One-click generation of client-ready XLSX, PPTX, PDF, and Word audit reports |
| **Testing** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | 980+ unit tests, engine parity validation, and smoke tests |

---

## 📁 Repository Structure

```
thoughtful-ai-advisory/
├── docs/
│   ├── product/                  # PRD, capabilities index, use cases & epics
│   ├── veritrail/                # VERITRAIL release reports & UX uplift guides
│   └── assets/                   # High-res screenshots, PWA images & video walkthrough
├── platform/                     # Python platform reference engines & governed content
│   └── content/
│       ├── controls/             # 64-control YAML library definition
│       └── website_pages/        # Governed Markdown marketing content
├── public/                       # PWA manifest, service worker (sw.js), icons
├── scripts/                      # Sitemap generator, product doc compiler, social image generator
├── src/
│   ├── components/               # Radix UI + Tailwind design system components
│   ├── data/                     # Governance seed data, rules & playbook chapters
│   ├── features/
│   │   ├── site/                 # Public site engines, search, reading layout & forms
│   │   ├── governance/           # TILLER workspace state, inventory & assessment studio
│   │   └── pwa/                  # Service worker registration & install stores
│   └── routes/                   # File-based TanStack Router pages
├── package.json                  # Scripts & dependencies
└── vite.config.ts                # Vite build configuration
```

---

## 🚀 Quick Start & Local Development

### Prerequisites

* **Node.js**: `v20.0.0` or higher (`v22` recommended)
* **Package Manager**: `bun` (`v1.2+`) or `npm` (`v10+`)

### Setup Instructions

1. **Clone the repository**:
   ```sh
   git clone https://github.com/kalilurrahman/thoughtful-ai-advisory.git
   cd thoughtful-ai-advisory
   ```

2. **Install dependencies**:
   ```sh
   bun install
   ```

3. **Start local development server**:
   ```sh
   bun run dev
   ```
   *Open [http://localhost:8080/](http://localhost:8080/) in your browser.*

4. **Run Vitest suite & smoke checks**:
   ```sh
   bun x vitest run
   bun run test:smoke
   ```

5. **Build for production**:
   ```sh
   bun run build
   ```

---

## 📄 License & Contributing

* **Contributions**: Pull requests, issue reports, and governance control refinements are warmly welcomed! Please check existing issues before submitting a PR.

---

<div align="center">

**Built with ❤️ for AI Governance, Safety, and Trust.**

</div>
