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

# AI Governance Advisory · VERITRAIL Platform & Landing Site

[![Live Demo](https://img.shields.io/badge/Live%20Demo-thoughtful--ai--governance.lovable.app-0066CC?style=for-the-badge&logo=react)](https://thoughtful-ai-governance.lovable.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-kalilurrahman%2Fai--governance--advisory-black?style=for-the-badge&logo=github)](https://github.com/kalilurrahman/ai-governance-advisory)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-FF4154?style=for-the-badge)](https://tanstack.com/router)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**VERITRAIL** is an interactive, enterprise-grade AI governance platform, landing site, and assurance workspace designed for organizations establishing operational AI risk management, governance capabilities, safety controls, and regulatory compliance.

VERITRAIL integrates a full public marketing & content site, a 64-control governance library, in-browser interactive rule engines (Maturity Assessment, Risk Triage, Guardrail Generator, Ask VERITRAIL), and an operational governance workspace aligned with international standards (NIST AI RMF, EU AI Act, and ISO/IEC 42001).

> **Naming.** The platform was previously called _AEGIS_ and its assessment studio _GOVERN_. Both names collide with established industry terms (Forrester's AEGIS framework and the NIST AI RMF GOVERN function), so the platform is now **VERITRAIL** and the assessment studio is **TILLER**. References to _GOVERN_, _MAP_, _MEASURE_ and _MANAGE_ that remain in control mappings refer to the NIST AI RMF functions. Code identifiers, routes (`/tools/ask-veritrail`), Python packages (`veritrail_*`) and environment variables (`VERITRAIL_*`, formerly `AEGIS_*`) follow the new name; already-applied database migrations keep their original file names, and migration 0009 renames the workspace save function. The six workspace pillars spell TILLER (Trust, Inventory, Lifecycle, Lawfulness, Engineering, Runtime); controls display codes T1 … R2 while the ids that saved workspace snapshots key answers on stay unchanged.

---

## 🌟 Live Demo & Resources

- **Hosted Landing & Platform Web App**: [https://thoughtful-ai-governance.lovable.app/](https://thoughtful-ai-governance.lovable.app/)
- **GitHub Repository**: [https://github.com/kalilurrahman/ai-governance-advisory](https://github.com/kalilurrahman/ai-governance-advisory)
- **Interactive Video Walkthrough**: [Watch VERITRAIL Platform Video Demo](./docs/assets/landing-demo.webm)

---

## 🎬 Video Walkthrough & Interactive Demo

Experience VERITRAIL in action—exploring the public landing site, framework, 64-control library, in-browser tools, and governance workspace:

https://github.com/user-attachments/assets/landing-demo.webm

_(Note: Click on `./docs/assets/landing-demo.webm` to watch or download the recording locally)_

---

## 📸 Public Landing Site & Interactive Tools Showcase

VERITRAIL features a comprehensive public landing site with dedicated sections for framework pillars, compliance standards, industry solutions, an interactive 64-control library, and client-side AI risk engines.

### Landing Page & Governance Framework

|                Landing Site Home Page                |               Governance Framework Overview                |
| :--------------------------------------------------: | :--------------------------------------------------------: |
| ![Landing Site Home](./docs/assets/landing-home.png) | ![Framework Overview](./docs/assets/landing-framework.png) |

### 64-Control Library & Interactive Tools

|               64-Control Governance Library               |               In-Browser AI Maturity Assessment Engine                |
| :-------------------------------------------------------: | :-------------------------------------------------------------------: |
| ![64-Control Library](./docs/assets/landing-controls.png) | ![Maturity Assessment Tool](./docs/assets/landing-tools-maturity.png) |

|            Ask VERITRAIL AI Assistant & Knowledge Hub            |          Operational Governance Workspace Overview           |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
| ![Ask VERITRAIL Tool](./docs/assets/landing-tools-ask-veritrail.png) | ![Governance Workspace](./docs/assets/landing-workspace.png) |

---

## 📱 Multi-Device Workspace Showcase

VERITRAIL features a responsive UI designed for desktop workstations, tablets, and mobile devices across both public content pages and the operational workspace.

### Desktop Workstation View

|                Overview & Maturity Index                |               Interactive Playbook Reader               |
| :-----------------------------------------------------: | :-----------------------------------------------------: |
| ![Desktop Overview](./docs/assets/desktop-overview.png) | ![Desktop Playbook](./docs/assets/desktop-playbook.png) |

|                   AI Systems Inventory                    |               Incident & Near-Miss Register               |
| :-------------------------------------------------------: | :-------------------------------------------------------: |
| ![Desktop Inventory](./docs/assets/desktop-inventory.png) | ![Desktop Incidents](./docs/assets/desktop-incidents.png) |

### Tablet & Mobile Responsive View

|                Tablet Viewport (768px)                |          Mobile Viewport (375px - Overview)           |          Mobile Viewport (375px - Playbook)           |
| :---------------------------------------------------: | :---------------------------------------------------: | :---------------------------------------------------: |
| ![Tablet Overview](./docs/assets/tablet-overview.png) | ![Mobile Overview](./docs/assets/mobile-overview.png) | ![Mobile Playbook](./docs/assets/mobile-playbook.png) |

---

## 🌐 Public VERITRAIL Website & Platform Architecture

The repository ships the full **VERITRAIL public landing website** alongside the governance workspace, plus the VERITRAIL launch-build platform from which it was generated.

| Area                         | Route(s)                                                                                                               | Source File(s) / Engine                                                           |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Marketing Home**           | `/`                                                                                                                    | `platform/content/website_pages/index.md`                                         |
| **Framework & Pillars**      | `/framework`, `/framework/pillars/*`, `/framework/runbooks`                                                            | `platform/content/website_pages/framework-*.md`                                   |
| **64-Control Library**       | `/framework/controls`, `/framework/controls/:id`                                                                       | `platform/content/controls/controls.yaml`                                         |
| **Compliance Guides**        | `/compliance`, `/compliance/eu-ai-act`, `/compliance/nist-ai-rmf`, `/compliance/iso-42001`, `/compliance/gap-analysis` | `platform/content/website_pages/compliance*.md`                                   |
| **Industry Solutions**       | `/solutions`, `/industries/*`                                                                                          | `platform/content/website_pages/solutions.md`, `industries-*.md`                  |
| **Interactive Tools Engine** | `/tools/maturity-assessment`, `/tools/risk-triage`, `/tools/guardrail-generator`, `/tools/ask-veritrail`                   | Client-side TypeScript ports in `src/features/site/engines/`                      |
| **Lead Submissions**         | `/contact`, `/contact/request-demo`, `/resources/blueprint`                                                            | `src/features/site/forms.tsx` → `submitLead` server function → `site_leads` table |
| **Governance Workspace**     | `/workspace`, `/workspace/*`                                                                                           | `src/features/governance/`                                                        |

### Key Architectural Highlights

- **Single Source of Truth**: Content pages are authored in Markdown with YAML front matter (`platform/content/...`) and bundled at build time. Supports custom shortcodes like `{{cta:key}}`, `{{disclaimer}}`, and `{{controls:ID,ID}}`.
- **Zero-Latency In-Browser Engines**: Interactive tools run entirely on the client side, parity-tested against Python reference engine exported fixtures (`platform/scripts/export_*_parity_fixtures.py`).
- **Secure Lead Capture**: Lead forms submit via server function (`submitLead`) directly to the Supabase PostgreSQL `site_leads` table protected by strict Row Level Security (RLS).
- **SEO & Sitemap Automation**: Dynamic sitemap generation script (`scripts/generate-sitemap.mjs`) builds valid sitemap XML for all landing and content pages.

---

## ⚙️ Key Features & Functional Modules

### 🏛️ 1. Public Landing Site & 64-Control Library

- **Structured Framework**: Covers Mandate, Governance Pillars, Maturity Models, and Operational Runbooks.
- **Interactive Control Catalog**: Search, filter, and inspect 64 granular governance controls mapped across NIST AI RMF, EU AI Act, and ISO/IEC 42001.

### ⚡ 2. Client-Side Interactive AI Governance Engines

- **Maturity Assessment Tool**: Step-by-step evaluation generating maturity index scores and improvement roadmaps.
- **Risk Triage Engine**: Automated classification of AI model use cases into Low, Medium, High, or Prohibited risk categories.
- **Guardrail Generator**: Custom safety, privacy, and operational policy rules based on deployment parameters.
- **Ask VERITRAIL Assistant**: In-browser knowledge search engine referencing curated governance frameworks and regulatory guidelines.

### 📖 3. Interactive 12-Chapter AI Governance Playbook

- **Comprehensive Lifecycle Coverage**: 12 structured chapters covering Mandate, System Inventory, Risk Classification, Data Governance, Algorithmic Transparency, Human Oversight, Security & Safety, Vendor Due Diligence, Continuous Monitoring, Incident Response, Transparency Disclosures, and Continuous Improvement.
- **Personalized Notes & Markdown Export**: Track chapter completion and export browser-persisted notes.

### 🛡️ 4. TILLER Assessment & Maturity Index

- **NIST AI RMF Alignment**: Evidence-aware controls mapped across `GOVERN`, `MAP`, `MEASURE`, and `MANAGE`.
- **Maturity Scoring**: Real-time scoring (Initial, Developing, Established, Advanced) based on weightings and verified evidence attachments.

### 📋 5. AI System Inventory & Risk Classifier

- **System Registration**: Manage internal and commercial AI models, services, and agentic pipelines.
- **Explainable Use-Case Triage**: Capture purpose, decision impact, affected people, data, autonomy, domain, tools, external actions, EU exposure, vendor and GenAI use; save the inferred result, rationale, missing facts and review triggers with each inventory record. New entries remain Under review pending human confirmation.
- **Risk Tiering & CSV Export**: Spreadsheet-compatible inventory export includes the structured triage profile, evidence status, rule score, drivers and review triggers.

### 🚨 6. Incident & Near-Miss Register

- **Lifecycle Tracking**: Log AI incidents and near-misses, link specific inventory systems, assign response owners, and record containment timeline.
- **Multi-Tenant Security**: Persisted via organization-scoped Supabase Row Level Security (RLS).

---

## 🛠️ Complete Tech Stack

| Domain                  | Technology / Library                                                                  | Description                                                          |
| :---------------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------- |
| **Framework & Runtime** | [React 19](https://react.dev/)                                                        | Modern UI component rendering with Server/Client capabilities        |
| **Language**            | [TypeScript 5.8](https://www.typescriptlang.org/)                                     | End-to-end type safety and contract definitions                      |
| **Fullstack Framework** | [TanStack Start](https://tanstack.com/router)                                         | SSR framework powered by TanStack Router and Nitro                   |
| **Routing**             | [TanStack Router](https://tanstack.com/router)                                        | Type-safe file-based client and server routing                       |
| **Build & Bundler**     | [Vite 8](https://vitejs.dev/) / [Rolldown](https://rolldown.rs/)                      | Fast module bundling and HMR development server                      |
| **Styling & Design**    | [Tailwind CSS v4](https://tailwindcss.com/)                                           | Utility-first CSS framework with custom design tokens                |
| **UI Components**       | [Radix UI Primitives](https://www.radix-ui.com/)                                      | Accessible UI primitives (Dialog, Dropdown, Tabs, Accordion)         |
| **Icons**               | [Lucide React](https://lucide.dev/) & [Phosphor Icons](https://phosphoricons.com/)    | Scalable icon sets for UI actions and navigation                     |
| **Data Visualization**  | [Recharts](https://recharts.org/)                                                     | Responsive SVG charting library for governance maturity scores       |
| **Form Management**     | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)             | Performant form state handling with runtime schema validation        |
| **Backend & Auth**      | [Supabase](https://supabase.com/) & [@lovable.dev/cloud-auth-js](https://lovable.dev) | Authentication and PostgreSQL database with Row Level Security (RLS) |
| **Database & ORM**      | [PostgreSQL](https://www.postgresql.org/) & [Drizzle ORM](https://orm.drizzle.team/)  | Relational database schema migrations and query builder              |
| **Testing**             | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)                 | Unit testing runner and browser automation for E2E verification      |
| **Code Quality**        | [ESLint 9](https://eslint.org/) & [Prettier](https://prettier.io/)                    | Linting, formatting, and code style enforcement                      |

---

## 📁 Repository Structure

```
ai-governance-advisory/
├── docs/
│   ├── veritrail/                      # VERITRAIL launch status report
│   └── assets/                     # Screenshots, media assets & demo video
│       ├── landing-home.png        # Landing site main showcase
│       ├── landing-framework.png   # Framework page screenshot
│       ├── landing-controls.png    # 64-control library screenshot
│       ├── landing-tools-*.png     # Interactive tool screenshots
│       └── landing-demo.webm       # Video demo recording
├── platform/                       # VERITRAIL Python platform, governed content & docs
│   └── content/
│       ├── website_pages/          # Markdown content pages for public landing site
│       └── controls/               # 64-control YAML library definition
├── drizzle/                        # Drizzle ORM migration files
├── public/                         # Static assets, manifests, and icons
├── scripts/                        # Sitemap generation & build automation scripts
├── src/
│   ├── components/                 # Reusable UI components (Radix + Tailwind)
│   ├── data/                       # Playbook content, seed data, and governance rules
│   ├── features/
│   │   ├── site/                   # Landing site pages, Markdown parser & engines
│   │   └── governance/             # Core workspace logic, hooks, and screens
│   ├── routes/                     # TanStack file-based routes
│   │   ├── index.tsx               # Public landing site home
│   │   ├── $.tsx                   # Public website page router
│   │   ├── workspace.tsx           # Governance workspace dashboard
│   │   └── ...                     # Workspace module routes
│   └── start.ts                    # TanStack Start server handler
├── package.json                    # Project dependencies and scripts
└── vite.config.ts                  # Vite build configuration
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js**: v20.0.0 or higher (v22 recommended)
- **Package Manager**: `npm` (v10+) or `bun` (v1.2+)

### Installation & Run

1. **Clone the repository**:

   ```sh
   git clone https://github.com/kalilurrahman/ai-governance-advisory.git
   cd ai-governance-advisory
   ```

2. **Install dependencies**:

   ```sh
   bun install   # or npm install
   ```

3. **Start the local development server**:

   ```sh
   bun run dev   # or npm run dev
   ```

   The application will be accessible at `http://localhost:8080/`.

4. **Run Unit & Engine Tests**:

   ```sh
   bun x vitest run   # or npm run test
   ```

5. **Build for Production**:
   ```sh
   bun run build
   ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, feedback, and issue reports are welcome! Please feel free to open an issue or submit a pull request on [GitHub](https://github.com/kalilurrahman/ai-governance-advisory).
