import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_CHANGES } from "@/data/content-changelog";
import { RELEASE, RELEASE_LABEL } from "@/data/release";

// The release version is recorded once (src/data/release.ts) and mirrored where it must stay in
// step: package.json, the public change log and the service worker's cache generation.

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
const sw = readFileSync(join(root, "public", "sw.js"), "utf8");

describe("release version", () => {
  it("is a semantic version that package.json carries too", () => {
    expect(RELEASE.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).toBe(RELEASE.version);
    expect(RELEASE_LABEL).toBe(`v${RELEASE.version} · ${RELEASE.name}`);
  });

  it("has a dated entry in the public content change log", () => {
    expect(RELEASE.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const entry = CONTENT_CHANGES.find(
      (c) => c.date === RELEASE.date && `${c.title} ${c.summary}`.includes(RELEASE.version),
    );
    expect(
      entry,
      `no change-log entry dated ${RELEASE.date} naming ${RELEASE.version}`,
    ).toBeDefined();
  });

  it("matches the service worker's cache generation (the major version)", () => {
    const major = RELEASE.version.split(".")[0];
    expect(sw).toMatch(new RegExp(`const VERSION = "v${major}";`));
  });
});
