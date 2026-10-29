import type { ContentChange } from "@/features/governance/content-changelog-model";

// Editorial dates, not visit/save timestamps. Add an entry for each published content revision.
// Historical dates are verified against repository commits 39568a0, 4f24938 and 8763950.
export const CONTENT_CHANGES: readonly ContentChange[] = [
  {
    id: "eu-ai-act-digital-omnibus",
    date: "2026-10-29",
    title: "EU AI Act pages updated for Regulation (EU) 2026/1744",
    summary:
      "All EU AI Act references now cite the adopted Digital Omnibus (Regulation (EU) 2026/1744, in force 27 July 2026). Annex III high-risk obligations apply from 2 December 2027 and Annex I product-embedded systems from 2 August 2028. The 'reviewed quarterly' claim is removed from public pages. The glossary entry for high-risk AI system now covers both the Annex III and Annex I routes.",
  },
  {
    id: "plan-limits-coming-soon",
    date: "2026-10-29",
    title: "Plan limits: unenforced features marked coming soon",
    summary:
      "AI-system limits, evidence storage, watermarked reports, Runtime Shield, priority support and data residency are now labelled 'coming soon' on each plan where they are not yet enforced.",
  },
  {
    id: "legal-ai-processing-accuracy",
    date: "2026-10-29",
    title: "Legal pages: AI-processing rows corrected",
    summary:
      "The Responsible AI statement and privacy notice now accurately describe which features use an external model (workspace advisor, site assistant) and which are deterministic (Ask VERITRAIL demo, risk triage, guardrail generator, maturity assessment). The CRM processor is disclosed. The ISO 42001 scope sentence is attributed.",
  },
  {
    id: "plans-and-subscription-terms",
    date: "2026-10-29",
    title: "Plans, subscription terms and privacy notice",
    summary:
      "Plans now list Free, Team, Business and Enterprise; new subscription, cancellation and refund terms describe online billing through Dodo Payments; the privacy notice covers accounts, team workspaces, the AI advisor and paid plans.",
  },
  {
    id: "public-change-log",
    date: "2026-10-27",
    title: "Public content change log",
    summary:
      "The governance overview now includes dated summaries of recent updates and a visible last-content-update date.",
  },
  {
    id: "decision-guidance",
    date: "2026-10-24",
    title: "Decision correction and withdrawal guidance",
    summary:
      "Product guidance now describes correcting or withdrawing governance decisions with a reason while retaining the original record and its evidence history.",
  },
  {
    id: "roadmap-guidance",
    date: "2026-10-24",
    title: "Remediation roadmap guidance",
    summary:
      "Workspace documentation was expanded to cover adding, editing, reassigning, moving and deleting remediation items across the four roadmap phases.",
  },
  {
    id: "platform-naming",
    date: "2026-10-23",
    title: "VERITRAIL and TILLER naming",
    summary:
      "Platform and product documentation adopted VERITRAIL for the platform and TILLER for the assessment studio, replacing the earlier AEGIS and GOVERN names.",
  },
];
