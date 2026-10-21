# AI Governance Advisory · AEGIS

[![Live Demo](https://img.shields.io/badge/Live%20Demo-thoughtful--ai--governance.lovable.app-0066CC?style=for-the-badge&logo=react)](https://thoughtful-ai-governance.lovable.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-kalilurrahman%2Fai--governance--advisory-black?style=for-the-badge&logo=github)](https://github.com/kalilurrahman/ai-governance-advisory)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-FF4154?style=for-the-badge)](https://tanstack.com/router)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**AEGIS** is an interactive, enterprise-grade AI governance playbook and assurance workspace designed for organizations establishing operational AI risk management, governance capabilities, safety controls, and regulatory compliance.

Whether you are building across strategy, product development, risk management, cybersecurity, data privacy, procurement, or operations, AEGIS provides structured workflows aligned with international governance standards (including NIST AI RMF, EU AI Act, and ISO/IEC 42001).

---

## 🌟 Live Demo & Resources

- **Hosted Web Application**: [https://thoughtful-ai-governance.lovable.app/](https://thoughtful-ai-governance.lovable.app/)
- **GitHub Repository**: [https://github.com/kalilurrahman/ai-governance-advisory](https://github.com/kalilurrahman/ai-governance-advisory)

---

## 📸 Multi-Device Interface Showcase

AEGIS features a responsive UI designed for desktop workstations, tablets, and mobile devices.

### Desktop Workstation View

| Overview & Maturity Index | Interactive Playbook Reader |
| :---: | :---: |
| ![Desktop Overview](./docs/assets/desktop-overview.png) | ![Desktop Playbook](./docs/assets/desktop-playbook.png) |

| AI Systems Inventory | Incident & Near-Miss Register |
| :---: | :---: |
| ![Desktop Inventory](./docs/assets/desktop-inventory.png) | ![Desktop Incidents](./docs/assets/desktop-incidents.png) |

### Tablet & Mobile Responsive View

| Tablet Viewport (768px) | Mobile Viewport (375px - Overview) | Mobile Viewport (375px - Playbook) |
| :---: | :---: | :---: |
| ![Tablet Overview](./docs/assets/tablet-overview.png) | ![Mobile Overview](./docs/assets/mobile-overview.png) | ![Mobile Playbook](./docs/assets/mobile-playbook.png) |

---

## 🌐 Public AEGIS Website & Platform Artefacts

The repository now ships the full **AEGIS public website** alongside the governance workspace, plus the AEGIS launch-build platform it was generated from.

| Area | Route(s) | Source |
| :--- | :--- | :--- |
| Marketing home | `/` | `platform/content/website_pages/index.md` |
| Framework, pillars, maturity model, runbooks | `/framework/...` | `platform/content/website_pages/framework-*.md` |
| 64-control library (generated) | `/framework/controls`, `/framework/controls/:id` | `platform/content/controls/controls.yaml` |
| Solutions, compliance, industries, resources, legal, about | `/solutions/...`, `/compliance/...`, … | `platform/content/website_pages/*.md` |
| Interactive tools (run in the browser) | `/tools/maturity-assessment`, `/tools/risk-triage`, `/tools/guardrail-generator`, `/tools/ask-aegis` | TypeScript ports of the Python reference engines in `src/features/site/engines/` |
| Lead forms (demo, baseline, blueprint, contact, newsletter, design partner, waitlist) | `/contact/...`, `/resources/blueprint` | `src/features/site/forms.tsx` → `submitLead` server function → `site_leads` table |
| Governance workspace (previously at `/`) | `/workspace` + existing workspace routes | `src/features/governance/` |

- **Single source of truth.** Pages are Markdown with YAML front matter and are bundled at build time; editing `platform/content/...` updates the site. Shortcodes `{{cta:key}}`, `{{disclaimer}}` and `{{controls:ID,ID}}` are supported.
- **Engine parity.** The browser tools are ports of the Python engines and are tested against fixtures exported from the Python reference implementation (`platform/scripts/export_*_parity_fixtures.py`).
- **Leads.** `drizzle/migrations/0007_aegis_site_leads.sql` adds an RLS-locked `site_leads` table written only by the server function (service role). If the database is unavailable, forms say that nothing was recorded.
- **Sitemap.** Regenerate with `node scripts/generate-sitemap.mjs https://your-domain` after changing pages or the production domain.
- **Platform (`platform/`).** The Python launch build: agent, policy engine, runtime shield, assessment engine, API, admin CLI, content, docs, diagrams, tests and synthetic sample reports. It is reference material and is not part of the Lovable build. See `platform/README.md` and `docs/aegis/AEGIS_STATUS_REPORT.md`.

---

## ⚙️ Key Features & Functional Modules

### 📖 1. Interactive 12-Chapter AI Governance Playbook
- **Comprehensive Lifecycle Coverage**: 12 structured chapters covering Mandate, System Inventory, Risk Classification, Data Governance, Algorithmic Transparency, Human Oversight, Security & Safety, Vendor/Supplier Due Diligence, Continuous Monitoring, Incident Response, Transparency Disclosures, and Continuous Improvement.
- **Search & Filter**: Real-time full-text search and category filtering across all playbook content.
- **Personalized Notes & Progress**: Track chapter completion and record private, browser-persisted notes that can be exported as structured Markdown files.

### 🛡️ 2. GOVERN Assessment & Maturity Index
- **NIST AI RMF Alignment**: 12 evidence-aware controls mapped across `GOVERN`, `MAP`, `MEASURE`, and `MANAGE` functions.
- **Maturity Scoring**: Real-time maturity classification (Initial, Developing, Established, Advanced) based on weightings and verified evidence attachments.

### 📋 3. AI System Inventory & Risk Classifier
- **System Registration**: Register and manage internal and commercial AI models, services, and pipelines.
- **Risk Tiering**: Automated classification into High, Medium, or Low risk tiers based on business context, data sensitivity, and autonomy.
- **Filter & Export**: Search across ownership, data types, and suppliers; export full system inventories to spreadsheet-compatible CSV files.

### 🚨 4. Incident & Near-Miss Register
- **Lifecycle Tracking**: Log AI incidents and near-misses, link specific inventory systems, assign response owners, and maintain containment notes.
- **Audit History**: Timestamped status transition timeline (Triage -> Containment -> Remediation -> Closed).
- **Multi-Tenant Security**: Persisted via organization-scoped Supabase Row Level Security (RLS) and atomic SQL save/restore functions.

### 🔁 AI Change Impact Reviews
- **Pre-implementation review**: Register material changes to intended use, affected populations, model/provider, data, autonomy, controls, or deployment context.
- **Impact screen**: Record safety, privacy, security, fairness, rights, and operational impacts; high or critical ratings are explicitly escalated for accountable review.
- **Approval workflow**: Preserve reviewer, rationale, and status history; incomplete impact ratings block approval, and implementation cannot be recorded before approval.
- **Evidence and ownership**: Include change records and workflow history in the governance evidence-pack previews and live lifecycle checklist.

### 📈 Operational AI Monitoring
- **Owned monitoring plans**: Define a measurable signal, domain, unit, threshold, breach direction, accountable owner, cadence, and next due date for each system.
- **Manual observations with history**: Record dated values, evidence references and review notes; breach and overdue states are derived from the stored plan and latest observation.
- **Human follow-up**: Surface breach investigation prompts and link to incident intake; no incident classification or response is automated.
- **Honest scope**: The workspace is a manual governance record, not a telemetry connector or live alerting system.

### 🚦 5. Guardrails & Pre-Launch Release Gates
- **Risk-Based Controls**: Automated blocker identification based on system risk tier before deployment.
- **Gatekeeper Sign-off**: Verify prerequisite safety guardrails and regulatory compliance criteria prior to production releases.

### 📑 6. Governance Starter Templates
- **8 Adaptable Starter Documents**: Includes Governance Charters, AI Lifecycle Role Descriptions, Intake Forms, Impact Assessments, Supplier Due Diligence Questionnaires, Release Approval Templates, Monitoring Plans, and Incident Response Playbooks.
- **In-Browser Editing & Markdown Export**: Customize templates directly in the workspace and download formatted Markdown files.

### 🧮 7. Calculators, Knowledge Hub & Audit Packs
- **Risk & ROI Calculators**: Specialized calculation models for risk tier determination and governance budget estimates.
- **Knowledge Library**: Curated, verified external references, regulatory frameworks, and benchmark standards.
- **Audit Pack Preview**: Generate consolidated governance packages and compliance summaries for internal or external auditors.

---

## 🛠️ Complete Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework & Runtime** | [React 19](https://react.dev/) | Modern UI component rendering with Server/Client capabilities |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | End-to-end type safety and contract definitions |
| **Fullstack Framework** | [TanStack Start](https://tanstack.com/router) | SSR framework powered by TanStack Router and Nitro |
| **Routing** | [TanStack Router](https://tanstack.com/router) | Type-safe file-based client and server routing |
| **Build & Bundler** | [Vite 8](https://vitejs.dev/) / [Rolldown](https://rolldown.rs/) | Fast module bundling and HMR development server |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework with custom design tokens |
| **UI Components** | [Radix UI Primitives](https://www.radix-ui.com/) | Accessible, unstyled UI primitives (Dialog, Dropdown, Tabs, Accordion) |
| **Icons** | [Lucide React](https://lucide.dev/) & [Phosphor Icons](https://phosphoricons.com/) | Scalable icon sets for UI actions and navigation |
| **Data Visualization** | [Recharts](https://recharts.org/) | Responsive SVG charting library for governance maturity scores |
| **Form Management** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) | Performant form state handling with runtime schema validation |
| **Backend & Auth** | [Supabase](https://supabase.com/) & [@lovable.dev/cloud-auth-js](https://lovable.dev) | Authentication and PostgreSQL database with Row Level Security (RLS) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Drizzle ORM](https://orm.drizzle.team/) | Relational database schema migrations and query builder |
| **Testing** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | Unit testing runner and browser automation for E2E verification |
| **Code Quality** | [ESLint 9](https://eslint.org/) & [Prettier](https://prettier.io/) | Linting, formatting, and code style enforcement |

---

## 🏗️ Architecture & Data Model

- **State Management**: A unified, reducer-backed React Context state (`src/features/governance/governance-context.tsx`) acts as the single source of truth for workspace assessments, system inventory, incidents, and guardrails across all routes.
- **Cloud Sync & Persistence**: Signed-in users sync state to Supabase PostgreSQL using atomic database functions (`0002_aegis_ai_incident_register.sql`). Cross-organization isolation is strictly enforced via Row Level Security (RLS) based on `organization_id`.
- **Public Unauthenticated Mode**: Visitors can explore demo data and test tools entirely in-browser without authentication.
- **Rule Engine & Constants**: Pure governance formulas, classifiers, and seed data live in `src/data/` and `src/features/governance/model.ts`, ensuring isolated, deterministic testability.

---

## 📁 Repository Structure

```
ai-governance-advisory/
├── docs/
│   ├── aegis/                      # AEGIS launch status report
│   └── assets/                     # Screenshots and visual media
├── platform/                       # AEGIS Python platform, governed content & docs (not built by Lovable)
├── drizzle/                        # Drizzle ORM migration files
├── public/                         # Static assets, manifests, and icons
├── src/
│   ├── components/                 # Reusable UI components (Radix + Tailwind)
│   ├── data/                       # Playbook content, seed data, and rules
│   │   ├── playbook.ts             # Source of truth for 12 playbook chapters
│   │   └── templates.ts            # Governance document starters
│   ├── features/
│   │   └── governance/             # Core business logic, hooks, and views
│   │       ├── governance-context.tsx  # Workspace reducer & state context
│   │       ├── model.ts            # Assessment scoring & classification formulas
│   │       └── screens-playbook.tsx# Playbook reader component
│   ├── routes/                     # TanStack file-based routes
│   │   ├── index.tsx               # Public website home
│   │   ├── $.tsx                   # All other public website pages
│   │   ├── workspace.tsx           # Governance workspace dashboard
│   │   ├── playbook.tsx            # Playbook view
│   │   ├── inventory.tsx           # AI System Inventory view
│   │   ├── incidents.tsx           # Incident Register view
│   │   └── ...                     # Additional workspace modules
│   ├── styles.css                  # Tailwind CSS configuration and theme rules
│   ├── router.tsx                  # TanStack Router instance setup
│   └── start.ts                    # TanStack Start server handler
├── supabase/                       # Supabase SQL migrations and RLS policies
├── package.json                    # Project dependencies and npm scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
└── vitest.config.ts                # Vitest test runner setup
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
   npm install
   ```

3. **Start the local development server**:
   ```sh
   npm run dev
   ```
   The application will be accessible at `http://localhost:8080/`.

4. **Run Unit Tests**:
   ```sh
   npm run test
   ```

5. **Build for Production**:
   ```sh
   npm run build
   ```

6. **Preview Production Build**:
   ```sh
   npm run preview
   ```

---

## 🗄️ Database & Cloud Deployment

When deploying or connecting your own Supabase instance:

1. Ensure migrations in `supabase/` and `drizzle/` are applied to your database.
2. In particular, migration `0002_aegis_ai_incident_register.sql` creates the organization-owned `ai_incidents` table and configures Row Level Security (RLS) policies along with the atomic workspace save function.
3. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, feedback, and issue reports are welcome! Please feel free to open an issue or submit a pull request on [GitHub](https://github.com/kalilurrahman/ai-governance-advisory).
