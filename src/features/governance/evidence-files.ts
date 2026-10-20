import { maturityLabel, reportCaveats, type EvidenceReport } from "./evidence-report";
import { isThresholdBreach, monitoringState } from "./monitoring-model";

export type ExportFormat = "PDF" | "DOCX" | "XLSX" | "PPTX";

function reportLines(report: EvidenceReport) {
  const lines = [
    `AEGIS AI governance preview | ${report.workspace}`,
    `Pack: ${report.pack} | Version: ${report.version} | Generated: ${report.generatedAt}`,
    `Index: ${report.index} (${report.maturity}) | Release gate: ${report.gate} | Workspace tier: ${report.tier}`,
    `Verified evidence: ${report.evidenceVerified} of ${report.assessment.length} controls | AI systems: ${report.inventoryCount} | Open actions: ${report.openActions}`,
    "",
    "PILLAR SCORES",
    ...report.pillars.map((pillar) => `${pillar.name}: ${pillar.score}%`),
    "",
    "ASSESSMENT RESPONSES AND EVIDENCE",
    ...report.assessment.flatMap((item) => [
      `${item.id} | ${item.pillar} | Weight: ${item.weight} | Score: ${item.score} (${maturityLabel(item.score)}) | Evidence: ${item.evidenceStatus} | Snapshot: ${item.snapshotAt}`,
      item.control,
      `Evidence link: ${item.evidenceLink} | Attachment reference: ${item.attachment}`,
      `Reviewer notes: ${item.reviewerNotes}`,
      "",
    ]),
    "AI SYSTEM INVENTORY",
    ...report.inventory.map(
      (item) =>
        `${item.name} | ${item.tier} risk | ${item.status} | ${item.kind} | Owner: ${item.owner} | Vendor: ${item.vendor} | Data: ${item.data}`,
    ),
    "",
    "ROADMAP AND OWNERS",
    ...report.roadmap.map(
      (item) =>
        `Phase ${item.phase} | ${item.status} | ${item.title} | Owner: ${item.owner} | Effort: ${item.effort}`,
    ),
    "",
    "INCIDENT REGISTER",
    ...(report.incidents.length
      ? report.incidents.map(
          (item) =>
            `${item.detectedAt} | ${item.severity} | ${item.status} | ${item.title} | System: ${item.system} | Owner: ${item.owner} | ${item.summary} | Response: ${item.response}`,
        )
      : ["No incidents recorded in this workspace snapshot."]),
    "GOVERNANCE DECISION REGISTER",
    ...(report.decisions.length
      ? report.decisions.flatMap((decision) => [
          `${decision.system} | ${decision.outcome} | ${decision.lifecycle} | Decided: ${decision.decidedAt} | Review by: ${decision.reviewBy ?? "Not scheduled"} | Approver: ${decision.approver}`,
          `Rationale: ${decision.rationale}`,
          `Conditions: ${decision.conditions || "None recorded"}`,
          `History: ${decision.history.map((event) => `${event.action} ${event.changedAt}`).join("; ") || "No changes"}`,
          "",
        ])
      : ["No governance decisions recorded in this workspace snapshot."]),
    "AI CHANGE REVIEW REGISTER",
    ...(report.changeReviews.length
      ? report.changeReviews.flatMap((review) => [
          `${review.system} | ${review.status} | Submitted: ${review.submittedAt} | Requested by: ${review.requestedBy} | Target: ${review.targetDate ?? "Not set"}`,
          `Change: ${review.summary} | Areas: ${review.categories.join(", ")}`,
          `Impact ratings: ${Object.entries(review.impacts)
            .map(([area, level]) => `${area}: ${level}`)
            .join("; ")}`,
          `Impact rationale: ${review.impactRationale}`,
          `Reviewer: ${review.reviewer || "Not recorded"} | Outcome note: ${review.decisionRationale || "Not recorded"}`,
          `History: ${review.history.map((event) => `${event.status} by ${event.actor} at ${event.changedAt}: ${event.note}`).join("; ")}`,
          "",
        ])
      : ["No AI system change reviews recorded in this workspace snapshot."]),
    "OPERATIONAL MONITORING PLANS AND OBSERVATIONS",
    ...(report.monitoringPlans.length
      ? report.monitoringPlans.flatMap((plan) => {
          const latest = [...plan.observations].sort((a, b) =>
            b.measuredAt.localeCompare(a.measuredAt),
          )[0];
          return [
            `${plan.system} | ${plan.metric} | ${plan.domain} | ${monitoringState(plan, report.generatedAt.slice(0, 10))} | Owner: ${plan.owner} | Cadence: ${plan.cadence} | Next due: ${plan.nextDue}`,
            `Threshold: ${plan.breachDirection} ${plan.threshold} ${plan.unit} | Latest manual observation: ${latest ? `${latest.value} ${plan.unit} on ${latest.measuredAt} by ${latest.recordedBy}${isThresholdBreach(plan, latest.value) ? " — BREACH" : " — within threshold"}` : "None recorded"}`,
            `Method and escalation notes: ${plan.notes || "None recorded"}`,
            `Observation history: ${plan.observations.map((item) => `${item.measuredAt}: ${item.value} ${plan.unit} by ${item.recordedBy}${item.evidenceReference ? ` [${item.evidenceReference}]` : ""}${item.notes ? ` (${item.notes})` : ""}`).join("; ") || "No observations"}`,
            "",
          ];
        })
      : ["No monitoring plans recorded in this workspace snapshot."]),
    "",
    "VERSION HISTORY AND SIGN-OFF",
    `v${report.version} | Preview generated ${report.generatedAt}`,
    "Reviewer: ____________________  Role: ____________________  Date: ____________________",
    "Decision / sign-off: ______________________________________________________________",
    "",
    "LIMITATIONS AND REVIEW NOTES",
    ...reportCaveats,
  ];
  return lines;
}

async function makePdf(report: EvidenceReport) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 42;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  for (const line of reportLines(report)) {
    const isHeading =
      /^(PILLAR SCORES|ASSESSMENT RESPONSES AND EVIDENCE|AI SYSTEM INVENTORY|ROADMAP AND OWNERS|INCIDENT REGISTER|GOVERNANCE DECISION REGISTER|AI CHANGE REVIEW REGISTER|OPERATIONAL MONITORING PLANS AND OBSERVATIONS|VERSION HISTORY AND SIGN-OFF|LIMITATIONS AND REVIEW NOTES)$/.test(
        line,
      );
    const size = isHeading ? 12 : 9;
    pdf.setFont("helvetica", isHeading ? "bold" : "normal");
    pdf.setFontSize(size);
    const wrapped = pdf.splitTextToSize(line || " ", width) as string[];
    for (const text of wrapped) {
      if (y + size + 4 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(text, margin, y);
      y += size + (isHeading ? 7 : 4);
    }
  }
  return pdf.output("blob");
}

async function makeDocx(report: EvidenceReport) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const paragraphs = reportLines(report).map((line, index) => {
    if (index === 0) return new Paragraph({ text: line, heading: HeadingLevel.TITLE });
    if (
      [
        "PILLAR SCORES",
        "ASSESSMENT RESPONSES AND EVIDENCE",
        "AI SYSTEM INVENTORY",
        "ROADMAP AND OWNERS",
        "INCIDENT REGISTER",
        "GOVERNANCE DECISION REGISTER",
        "AI CHANGE REVIEW REGISTER",
        "OPERATIONAL MONITORING PLANS AND OBSERVATIONS",
        "VERSION HISTORY AND SIGN-OFF",
        "LIMITATIONS AND REVIEW NOTES",
      ].includes(line)
    ) {
      return new Paragraph({
        text: line,
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: ["ASSESSMENT RESPONSES AND EVIDENCE"].includes(line),
      });
    }
    if (/^[GOVERN]\d\s\|/.test(line)) {
      return new Paragraph({ children: [new TextRun({ text: line, font: "Aptos", size: 20 })] });
    }
    return new Paragraph({ text: line });
  });
  return Packer.toBlob(new Document({ sections: [{ children: paragraphs }] }));
}

async function makeXlsx(report: EvidenceReport) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AEGIS AI Governance Playbook (demo preview)";
  workbook.created = new Date(report.generatedAt);
  const overview = workbook.addWorksheet("Overview");
  overview.addRows([
    ["AEGIS AI governance preview", report.workspace],
    ["Pack", report.pack],
    ["Version", `v${report.version}`],
    ["Generated at", report.generatedAt],
    ["AEGIS Index", report.index],
    ["Maturity band", report.maturity],
    ["Release gate (workspace)", report.gate],
    ["Risk tier (workspace)", report.tier],
    ["Verified evidence controls", report.evidenceVerified],
    ["AI systems", report.inventoryCount],
    ["Open roadmap actions", report.openActions],
    ["Preview limitation", reportCaveats.join(" ")],
  ]);
  overview.getColumn(1).width = 32;
  overview.getColumn(2).width = 100;
  const addSheet = (
    name: string,
    columns: { header: string; key: string; width: number }[],
    rows: object[],
  ) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173B36" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + columns.length)}1` };
    return sheet;
  };
  addSheet(
    "Assessment Evidence",
    [
      { header: "Control ID", key: "id", width: 12 },
      { header: "Pillar", key: "pillar", width: 30 },
      { header: "Control", key: "control", width: 68 },
      { header: "Weight", key: "weight", width: 14 },
      { header: "Score", key: "score", width: 10 },
      { header: "Maturity", key: "maturity", width: 14 },
      { header: "Evidence status", key: "evidenceStatus", width: 16 },
      { header: "Snapshot at", key: "snapshotAt", width: 28 },
      { header: "Evidence link", key: "evidenceLink", width: 38 },
      { header: "Attachment reference (demo)", key: "attachment", width: 32 },
      { header: "Reviewer notes", key: "reviewerNotes", width: 48 },
    ],
    report.assessment.map((item) => ({ ...item, maturity: maturityLabel(item.score) })),
  );
  addSheet(
    "AI Inventory",
    [
      { header: "System", key: "name", width: 30 },
      { header: "Risk tier", key: "tier", width: 14 },
      { header: "Status", key: "status", width: 20 },
      { header: "Type", key: "kind", width: 26 },
      { header: "Owner", key: "owner", width: 24 },
      { header: "Vendor", key: "vendor", width: 26 },
      { header: "Data classification", key: "data", width: 24 },
    ],
    report.inventory,
  );
  addSheet(
    "Roadmap",
    [
      { header: "Phase", key: "phase", width: 10 },
      { header: "Action", key: "title", width: 64 },
      { header: "Owner", key: "owner", width: 24 },
      { header: "Effort", key: "effort", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ],
    report.roadmap,
  );
  addSheet(
    "Incidents",
    [
      { header: "Detected", key: "detectedAt", width: 16 },
      { header: "Title", key: "title", width: 36 },
      { header: "System", key: "system", width: 28 },
      { header: "Severity", key: "severity", width: 14 },
      { header: "Status", key: "status", width: 14 },
      { header: "Owner", key: "owner", width: 24 },
      { header: "Summary", key: "summary", width: 60 },
      { header: "Response", key: "response", width: 60 },
    ],
    report.incidents,
  );
  addSheet(
    "AI Change Reviews",
    [
      { header: "System", key: "system", width: 30 },
      { header: "Status", key: "status", width: 20 },
      { header: "Requested by", key: "requestedBy", width: 26 },
      { header: "Target date", key: "targetDate", width: 16 },
      { header: "Submitted at", key: "submittedAt", width: 28 },
      { header: "Change areas", key: "categoriesText", width: 48 },
      { header: "Summary", key: "summary", width: 60 },
      { header: "Impact ratings", key: "impactsText", width: 52 },
      { header: "Impact rationale", key: "impactRationale", width: 60 },
      { header: "Reviewer", key: "reviewer", width: 26 },
      { header: "Decision rationale", key: "decisionRationale", width: 60 },
      { header: "Workflow history", key: "historyText", width: 64 },
    ],
    report.changeReviews.map((review) => ({
      ...review,
      categoriesText: review.categories.join("; "),
      impactsText: Object.entries(review.impacts)
        .map(([area, level]) => `${area}: ${level}`)
        .join("; "),
      historyText: review.history
        .map((event) => `${event.status} by ${event.actor} at ${event.changedAt}: ${event.note}`)
        .join("; "),
    })),
  );
  addSheet(
    "Monitoring Plans",
    [
      { header: "System", key: "system", width: 30 },
      { header: "Metric", key: "metric", width: 30 },
      { header: "Domain", key: "domain", width: 20 },
      { header: "Plan status", key: "status", width: 14 },
      { header: "Owner", key: "owner", width: 24 },
      { header: "Cadence", key: "cadence", width: 16 },
      { header: "Next due", key: "nextDue", width: 16 },
      { header: "Breach direction", key: "breachDirection", width: 26 },
      { header: "Threshold", key: "threshold", width: 14 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Latest measured", key: "latestMeasured", width: 24 },
      { header: "State at export", key: "stateAtExport", width: 20 },
      { header: "Latest evidence ref", key: "latestEvidence", width: 40 },
      { header: "Observation history", key: "observationsText", width: 70 },
      { header: "Method / notes", key: "notes", width: 60 },
    ],
    report.monitoringPlans.map((plan) => {
      const latest = [...plan.observations].sort((a, b) =>
        b.measuredAt.localeCompare(a.measuredAt),
      )[0];
      return {
        ...plan,
        stateAtExport: monitoringState(plan, report.generatedAt.slice(0, 10)),
        latestMeasured: latest
          ? `${latest.value} ${plan.unit} on ${latest.measuredAt} by ${latest.recordedBy}${isThresholdBreach(plan, latest.value) ? " — BREACH" : " — within threshold"}`
          : "None recorded",
        latestEvidence: latest?.evidenceReference ?? "",
        observationsText: plan.observations
          .map(
            (item) =>
              `${item.measuredAt}: ${item.value} ${plan.unit} by ${item.recordedBy}; ${item.notes}`,
          )
          .join(" | "),
      };
    }),
  );
  addSheet(
    "Governance Decisions",
    [
      { header: "System", key: "system", width: 30 },
      { header: "Disposition", key: "outcome", width: 24 },
      { header: "Lifecycle", key: "lifecycle", width: 16 },
      { header: "Decision date", key: "decidedAt", width: 16 },
      { header: "Review by", key: "reviewBy", width: 16 },
      { header: "Approver", key: "approver", width: 28 },
      { header: "Rationale", key: "rationale", width: 64 },
      { header: "Conditions", key: "conditions", width: 64 },
      { header: "History", key: "historyText", width: 42 },
    ],
    report.decisions.map((decision) => ({
      ...decision,
      historyText: decision.history.map((event) => `${event.action} ${event.changedAt}`).join("; "),
    })),
  );
  addSheet(
    "Version & Sign-off",
    [
      { header: "Field", key: "field", width: 34 },
      { header: "Value", key: "value", width: 100 },
    ],
    [
      { field: "Current preview version", value: `v${report.version}` },
      { field: "Generated at", value: report.generatedAt },
      { field: "Reviewer", value: "" },
      { field: "Reviewer role", value: "" },
      { field: "Review date", value: "" },
      { field: "Decision / sign-off", value: "" },
      { field: "Version history limitation", value: reportCaveats[2] },
      { field: "Preview limitations", value: reportCaveats.join(" ") },
    ],
  );
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function makePptx(report: EvidenceReport) {
  const { default: pptxgen } = await import("pptxgenjs");
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "AEGIS AI Governance Playbook (demo preview)";
  pptx.subject = `${report.pack} for ${report.workspace}`;
  pptx.title = `AEGIS AI Governance | ${report.workspace}`;
  const addSlide = (title: string, body: string[]) => {
    const slide = pptx.addSlide();
    slide.background = { color: "F5F7F5" };
    slide.addText(title, {
      x: 0.55,
      y: 0.4,
      w: 12.2,
      h: 0.55,
      fontFace: "Aptos Display",
      fontSize: 23,
      bold: true,
      color: "173B36",
    });
    slide.addText(body.join("\n"), {
      x: 0.65,
      y: 1.2,
      w: 12,
      h: 5.65,
      fontFace: "Aptos",
      fontSize: 13,
      breakLine: false,
      valign: "top",
      color: "263331",
      margin: 0.08,
      paraSpaceAfter: 8,
      fit: "shrink",
    });
    slide.addText(`DEMO PREVIEW  |  v${report.version}  |  ${report.generatedAt}`, {
      x: 0.65,
      y: 7.12,
      w: 12,
      h: 0.2,
      fontFace: "Aptos",
      fontSize: 8,
      color: "64716E",
    });
  };
  addSlide(`AI Governance | ${report.workspace}`, [
    report.pack,
    `Index ${report.index} - ${report.maturity}`,
    `Workspace release gate: ${report.gate}`,
    `Risk tier: ${report.tier}`,
    `Generated ${report.generatedAt}`,
    "Internal working preview - not signed or certified",
  ]);
  addSlide("Executive snapshot", [
    `Verified evidence: ${report.evidenceVerified} / ${report.assessment.length} controls`,
    `AI systems in inventory: ${report.inventoryCount}`,
    `Open roadmap actions: ${report.openActions}`,
    ...reportCaveats,
  ]);
  addSlide(
    "Pillar scores",
    report.pillars.map((pillar) => `${pillar.name}: ${pillar.score}%`),
  );
  for (let i = 0; i < report.assessment.length; i += 4) {
    const items = report.assessment.slice(i, i + 4);
    addSlide(
      `Assessment evidence | ${i + 1}-${i + items.length}`,
      items.flatMap((item) => [
        `${item.id} | ${item.pillar} | ${item.weight} | ${item.score} (${maturityLabel(item.score)}) | ${item.evidenceStatus}`,
        item.control,
        `Evidence link: ${item.evidenceLink} | Attachment (demo): ${item.attachment}`,
        `Reviewer notes: ${item.reviewerNotes} | Snapshot: ${item.snapshotAt}`,
      ]),
    );
  }
  if (!report.inventory.length)
    addSlide("AI system inventory", ["No AI systems are registered in this workspace snapshot."]);
  for (let i = 0; i < report.inventory.length; i += 5) {
    addSlide(
      `AI system inventory | ${i + 1}-${Math.min(i + 5, report.inventory.length)}`,
      report.inventory
        .slice(i, i + 5)
        .map(
          (item) =>
            `${item.name} | ${item.tier} | ${item.status} | ${item.kind} | Owner: ${item.owner} | Vendor: ${item.vendor} | Data: ${item.data}`,
        ),
    );
  }
  if (!report.roadmap.length)
    addSlide("Roadmap and owners", ["No roadmap actions are recorded in this workspace snapshot."]);
  for (let i = 0; i < report.roadmap.length; i += 7) {
    addSlide(
      `Roadmap and owners | ${i + 1}-${Math.min(i + 7, report.roadmap.length)}`,
      report.roadmap
        .slice(i, i + 7)
        .map(
          (item) =>
            `Phase ${item.phase} | ${item.status} | ${item.title} | Owner: ${item.owner} | Effort: ${item.effort}`,
        ),
    );
  }
  for (let i = 0; i < report.incidents.length; i += 4) {
    addSlide(
      `Incident register | ${i + 1}-${Math.min(i + 4, report.incidents.length)}`,
      report.incidents
        .slice(i, i + 4)
        .map(
          (item) =>
            `${item.detectedAt} | ${item.severity} | ${item.status} | ${item.title} | System: ${item.system} | Owner: ${item.owner} | ${item.summary} | Response: ${item.response}`,
        ),
    );
  }
  if (!report.incidents.length)
    addSlide("Incident register", ["No incidents recorded in this workspace snapshot."]);
  if (!report.decisions.length)
    addSlide("Governance decision register", [
      "No governance decisions recorded in this workspace snapshot.",
    ]);
  for (let i = 0; i < report.decisions.length; i += 4) {
    addSlide(
      `Governance decisions | ${i + 1}-${Math.min(i + 4, report.decisions.length)}`,
      report.decisions
        .slice(i, i + 4)
        .flatMap((decision) => [
          `${decision.system} | ${decision.outcome} | ${decision.lifecycle} | Decided: ${decision.decidedAt} | Review by: ${decision.reviewBy ?? "Not scheduled"} | Approver: ${decision.approver}`,
          `Rationale: ${decision.rationale}`,
          `Conditions: ${decision.conditions || "None recorded"}`,
          `History: ${decision.history.map((event) => `${event.action} ${event.changedAt}`).join("; ") || "No changes"}`,
        ]),
    );
  }
  if (!report.changeReviews.length)
    addSlide("AI change review register", [
      "No AI system change reviews recorded in this workspace snapshot.",
    ]);
  for (let i = 0; i < report.changeReviews.length; i += 3) {
    addSlide(
      `AI change reviews | ${i + 1}-${Math.min(i + 3, report.changeReviews.length)}`,
      report.changeReviews.slice(i, i + 3).flatMap((review) => [
        `${review.system} | ${review.status} | Requested by ${review.requestedBy} | Target: ${review.targetDate ?? "Not set"}`,
        `Change: ${review.summary} | Areas: ${review.categories.join(", ")}`,
        `Impacts: ${Object.entries(review.impacts)
          .map(([area, level]) => `${area}: ${level}`)
          .join("; ")}`,
        `Rationale: ${review.impactRationale}`,
        `Reviewer: ${review.reviewer || "Not recorded"} | Note: ${review.decisionRationale || "Not recorded"}`,
        `History: ${review.history.map((event) => `${event.status} by ${event.actor} at ${event.changedAt}`).join("; ")}`,
      ]),
    );
  }
  if (!report.monitoringPlans.length)
    addSlide("Operational monitoring", [
      "No monitoring plans recorded in this workspace snapshot.",
      reportCaveats[6] ?? "",
    ]);
  for (let i = 0; i < report.monitoringPlans.length; i += 3) {
    addSlide(
      `Operational monitoring | ${i + 1}-${Math.min(i + 3, report.monitoringPlans.length)}`,
      report.monitoringPlans.slice(i, i + 3).flatMap((plan) => {
        const latest = [...plan.observations].sort((a, b) =>
          b.measuredAt.localeCompare(a.measuredAt),
        )[0];
        return [
          `${plan.system} | ${plan.metric} (${plan.domain}) | ${monitoringState(plan, report.generatedAt.slice(0, 10))} | Owner: ${plan.owner} | Cadence: ${plan.cadence} | Next due: ${plan.nextDue}`,
          `Threshold: ${plan.breachDirection} ${plan.threshold} ${plan.unit} | Latest: ${latest ? `${latest.value} ${plan.unit} on ${latest.measuredAt} by ${latest.recordedBy}${isThresholdBreach(plan, latest.value) ? " — BREACH" : " — within threshold"}` : "No observation"}`,
          `Method: ${plan.notes || "Not recorded"}`,
          `History: ${plan.observations.map((item) => `${item.measuredAt}: ${item.value} ${plan.unit} by ${item.recordedBy}`).join("; ") || "No observations"}`,
        ];
      }),
    );
  }
  addSlide("Version and reviewer sign-off", [
    `Version v${report.version} preview generated at ${report.generatedAt}`,
    "Reviewer: ____________________    Role: ____________________    Date: ____________________",
    "Decision / sign-off: ______________________________________________________________",
    ...reportCaveats,
  ]);
  const output = await pptx.write({ outputType: "blob" });
  if (!(output instanceof Blob))
    throw new Error("PowerPoint preview generation did not return a file.");
  return output;
}

export async function generateEvidenceFile(report: EvidenceReport, format: ExportFormat) {
  switch (format) {
    case "PDF":
      return makePdf(report);
    case "DOCX":
      return makeDocx(report);
    case "XLSX":
      return makeXlsx(report);
    case "PPTX":
      return makePptx(report);
  }
}
