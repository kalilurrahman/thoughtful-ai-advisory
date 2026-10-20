import { describe, expect, it } from "vitest";
import { SOURCES } from "@/data/governance";

describe("resource register integrity", () => {
  it("keeps source records compatible with string-only workspace snapshots", () => {
    for (const source of SOURCES) {
      for (const value of Object.values(source)) expect(typeof value).toBe("string");
    }
  });

  it("uses unique secure external links and keeps authored advice separate", () => {
    const links = SOURCES.filter((s) => s.url !== "#").map((s) => s.url);
    expect(new Set(links).size).toBe(links.length);
    for (const link of links) expect(new URL(link).protocol).toBe("https:");
    for (const source of SOURCES.filter((s) => s.url === "#")) expect(source.tier).toBe("C");
  });
});
