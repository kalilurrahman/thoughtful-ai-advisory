import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { advise, policyYamlHeader, toYaml, validatePolicy } from "@/features/site/engines/shield";
import { pyRound } from "@/features/site/engines/shield/py";
import fixtures from "./fixtures/shield-parity.json";

interface ShieldCase {
  id: string;
  profile: Record<string, unknown>;
  expected: Record<string, unknown>;
}

const data = fixtures as unknown as { fixed_date: string; cases: ShieldCase[] };

const OP_WEIGHT: Record<string, number> = {
  read: 1,
  write: 2,
  export: 3,
  external_send: 3,
  delete: 4,
  payment: 4,
};

/**
 * Python picks the highest-impact operation from a set, so ties (delete/payment,
 * export/external_send) depend on hash order. Replace the name with its weight class.
 */
function normaliseTies(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value).replace(
      /highest-impact operation: ([a-z_]+)/g,
      (_m, op: string) => `highest-impact operation: <weight ${OP_WEIGHT[op] ?? op}>`,
    ),
  );
}

function headerOf(yamlText: string): string {
  return yamlText.split("\n").slice(0, 2).join("\n");
}

describe("runtime shield advisor parity with aegis_shield.advisor.advise", () => {
  it("has fixtures", () => {
    expect(data.cases.length).toBeGreaterThanOrEqual(8);
  });

  describe.each(data.cases.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    const actual = advise(c.profile, { today: data.fixed_date }) as unknown as Record<
      string,
      unknown
    >;
    const expected = c.expected;

    it("returns the same sections and keys", () => {
      expect(Object.keys(actual)).toEqual(Object.keys(expected));
    });

    it("matches every section except the serialized policy", () => {
      const strip = (o: Record<string, unknown>) => {
        const { policy_yaml: _y, policy_json: _j, ...rest } = o;
        return normaliseTies(rest);
      };
      expect(strip(actual)).toEqual(strip(expected));
    });

    it("serializes the same policy as YAML (parsed) with the same header", () => {
      const ours = actual["policy_yaml"] as string;
      const theirs = expected["policy_yaml"] as string;
      expect(headerOf(ours)).toBe(headerOf(theirs));
      expect(parse(ours)).toEqual(parse(theirs));
      expect(parse(ours)).toEqual(expected["policy"]);
    });

    it("serializes the same policy JSON text", () => {
      expect(actual["policy_json"]).toBe(expected["policy_json"]);
    });

    it("produces a valid draft policy in observe mode with no approvals", () => {
      const policy = actual["policy"] as Record<string, unknown>;
      expect(validatePolicy(policy)).toEqual([]);
      expect(policy["status"]).toBe("draft");
      expect((policy["rollout"] as Record<string, unknown>)["mode"]).toBe("observe");
      expect((policy["approval"] as Record<string, unknown>)["approved_by"]).toEqual([]);
    });
  });
});

describe("shield helpers", () => {
  it("rounds like Python round()", () => {
    expect(pyRound(2.125, 2)).toBe(2.12);
    expect(pyRound(2.775, 2)).toBe(2.77);
    expect(pyRound(0.7 * (15 / 4) + 0.3 * 4, 2)).toBe(3.83);
    expect(pyRound(1.0, 2)).toBe(1);
  });

  it("keeps the generated YAML header and quotes YAML 1.1 booleans", () => {
    const result = advise({ app_name: "yes", tools: ["on:read"] }, { today: "2000-01-01" });
    const text = toYaml(result.policy);
    expect(text.startsWith(policyYamlHeader(result.policy))).toBe(true);
    expect(text).toContain("- 'yes'");
    expect(text).toContain("tool: 'on'");
  });

  it("never labels anything Verified", () => {
    for (const c of data.cases) {
      const r = advise(c.profile, { today: data.fixed_date });
      expect(r.evidence.items.some((i) => i.status === "Verified")).toBe(false);
      expect(r.requires_human_approval).toBe(true);
    }
  });
});
