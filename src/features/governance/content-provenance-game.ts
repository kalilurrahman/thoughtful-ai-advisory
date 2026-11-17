export type ContentProvenanceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CONTENT_PROVENANCE_ROUNDS: ContentProvenanceRound[] = [
  {
    id: "marked-at-copy",
    scenario:
      "Images leave the generator through a screenshot tool, so the provenance metadata never reaches the file that gets published.",
    choices: [
      "Mark at generation and test each export path, adding visible disclosure wherever the mark cannot survive",
      "Add the metadata to the download button and assume most users use it",
      "Accept that screenshots are outside the marking policy",
    ],
    best: 0,
    assurance: "Marking covers export paths",
    feedback:
      "A mark that only exists on the download path is not marking: test each export path and add visible disclosure where it fails.",
  },
  {
    id: "converted-away",
    scenario:
      "A signed image is converted to another format by the publishing platform, and the provenance manifest is dropped without anyone noticing.",
    choices: [
      "Test survival through the formats and channels you publish to, and treat a dropped mark as a publishing defect",
      "Re-sign the image after publication so the manifest is restored",
      "Rely on the platform to preserve metadata because it usually does",
    ],
    best: 0,
    assurance: "Verified survival",
    feedback:
      "Provenance survives only the paths you test: check the formats and channels you publish to and treat a dropped mark as a defect.",
  },
  {
    id: "no-visible-fallback",
    scenario:
      "An audio clip is machine-marked, but a listener has no way to know it is synthetic because no audible or visible disclosure is given.",
    choices: [
      "Add a visible or audible disclosure wherever a machine-readable mark cannot be read by the audience",
      "Rely on the inaudible mark because detection tools can read it",
      "Publish with a footnote on a separate page about AI use generally",
    ],
    best: 0,
    assurance: "Audience-visible disclosure",
    feedback:
      "A mark only machines can read does not inform the audience: add visible or audible disclosure where the mark cannot travel to them.",
  },
  {
    id: "stripped-unnoticed",
    scenario:
      "A partner strips provenance from syndicated content and republishes it as original material, and nothing in the pipeline notices.",
    choices: [
      "Detect unlabeled or stripped output on ingest and handle it under an agreed remedy rather than letting it pass",
      "Ask the partner to add the label back when convenient",
      "Stop syndicating entirely to remove the risk",
    ],
    best: 0,
    assurance: "Detection and remedy",
    feedback:
      "Marking without detection is faith: detect stripped or unlabeled content on ingest and apply an agreed remedy.",
  },
  {
    id: "channel-register",
    scenario:
      "A new distribution channel launches and nobody can say whether content published there is required to carry a label.",
    choices: [
      "Keep a register of channels and formats where marking or disclosure is required, and review it when a channel is added",
      "Apply the same treatment everywhere on the assumption that one rule covers all channels",
      "Wait for a complaint before deciding what the new channel needs",
    ],
    best: 0,
    assurance: "Registered obligations",
    feedback:
      "Obligations vary by channel and format: keep a register and review it when a channel is added, rather than after a complaint.",
  },
];

export function contentProvenanceScore(answers: Record<string, number>) {
  const done = CONTENT_PROVENANCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CONTENT_PROVENANCE_ROUNDS.length,
  };
}
