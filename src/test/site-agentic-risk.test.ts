import { describe, expect, it } from "vitest";
import { AGENT_AREAS, checkAgentRisk } from "@/features/site/engines/agentic-risk";
import { getControl } from "@/features/site/content";

const allYes = Object.fromEntries(AGENT_AREAS.map((a) => [a.key, "yes"])) as Record<string, "yes">;

describe("agentic AI risk checker engine", () => {
  it("cites only controls that exist in the library", () => {
    for (const a of AGENT_AREAS) for (const id of a.controls) expect(getControl(id)).toBeDefined();
  });

  it("labels a fully covered, supervised agent ready for supervised operation", () => {
    const r = checkAgentRisk({ name: "Triage bot", autonomy: "acts_with_approval", ...allYes });
    expect(r.readiness_pct).toBe(100);
    expect(r.posture).toBe("Ready for supervised operation");
    expect(r.critical_gaps).toEqual([]);
    expect(r.evidence_status).toBe("Inferred");
    expect(r.requires_human_confirmation).toBe(true);
    expect(r.areas.every((a) => a.status === "User-asserted")).toBe(true);
    expect(r.next_actions).toEqual([]);
  });

  it("marks approvals, containment and least privilege critical for an autonomous agent", () => {
    const r = checkAgentRisk({
      name: "Refund agent",
      autonomy: "acts_autonomously",
      ...allYes,
      approvals: "no",
      inventory: "no",
    });
    expect(r.posture).toBe("Not ready for autonomous operation");
    expect(r.critical_gaps).toEqual(["High-impact actions"]);
    const approvals = r.areas.find((a) => a.key === "approvals")!;
    expect(approvals.status).toBe("Critical gap");
    expect(approvals.critical).toBe(true);
    const inventory = r.areas.find((a) => a.key === "inventory")!;
    expect(inventory.status).toBe("Missing evidence");
    expect(inventory.critical).toBe(false);
    // Critical actions come first.
    expect(r.next_actions[0]).toContain("IS-13");
    expect(r.next_actions[1]).toContain("EI-07");
  });

  it("treats write-capable tools and untrusted input as exposure", () => {
    const r = checkAgentRisk({
      name: "Mail agent",
      autonomy: "suggests",
      untrusted_input: "yes",
      tools: ["crm_read", "send_email"],
      ...allYes,
      injection_testing: "no",
      least_privilege: "partial",
    });
    expect(r.write_capable_tools).toEqual(["send_email"]);
    expect(r.exposure).toContain("Reads untrusted content");
    expect(r.areas.find((a) => a.key === "injection_testing")!.status).toBe("Critical gap");
    expect(r.areas.find((a) => a.key === "least_privilege")!.status).toBe("Inferred");
    expect(r.posture).toBe("Not ready for autonomous operation");
  });

  it("needs controls when answers are missing but nothing is critical", () => {
    const r = checkAgentRisk({ name: "Draft helper", autonomy: "suggests" });
    expect(r.readiness_pct).toBe(0);
    expect(r.critical_gaps).toEqual([]);
    expect(r.missing_fields).toHaveLength(AGENT_AREAS.length);
    expect(r.posture).toBe("Needs controls before expansion");
    expect(r.areas.every((a) => a.status === "Missing evidence")).toBe(true);
  });

  it("does not mutate the input and defaults the name", () => {
    const profile = { tools: ["send_email"], approvals: "yes" as const };
    const r = checkAgentRisk(profile);
    expect(profile).toEqual({ tools: ["send_email"], approvals: "yes" });
    expect(r.name).toBe("Unnamed agent");
    expect(r.citation_ids).toEqual(
      expect.arrayContaining([
        "EI-07",
        "IS-11",
        "IS-13",
        "IS-14",
        "IS-01",
        "IS-15",
        "IS-16",
        "SE-08",
      ]),
    );
  });
});
