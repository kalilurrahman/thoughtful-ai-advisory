import type { ContentChange } from "@/features/governance/content-changelog-model";

// Editorial dates, not visit/save timestamps. Add an entry for each published content revision.
// Historical dates are verified against repository commits 39568a0, 4f24938 and 8763950.
export const CONTENT_CHANGES: readonly ContentChange[] = [
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
