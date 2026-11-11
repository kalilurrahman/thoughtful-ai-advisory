import { describe, expect, it, vi } from "vitest";
import {
  fetchCourses,
  formatBytes,
  moduleAvailability,
  moduleHtmlUrl,
  offlineFileName,
  recordEvent,
  type Course,
  type CourseModule,
} from "@/lib/courseForge";

const module = (over: Partial<CourseModule> = {}): CourseModule => ({
  id: "m1",
  sequence: 1,
  title: "Module",
  learningOutcome: null,
  durationMinutes: 15,
  status: "technical_review",
  version: 1,
  latestHtmlUrl: "/v1/modules/m1/latest.html",
  offlineHtmlUrl: "/v1/modules/m1/versions/1/offline.html",
  sha256: "abc",
  bytes: 2_500_000,
  requiresNetwork: false,
  review: null,
  publishedAt: null,
  generatedAt: null,
  ...over,
});

describe("moduleAvailability", () => {
  it("is generating while no export exists", () => {
    expect(moduleAvailability(module({ latestHtmlUrl: null }), true)).toEqual({
      kind: "generating",
    });
  });
  it("keeps an unreviewed export unplayable unless drafts are enabled", () => {
    expect(moduleAvailability(module(), false)).toEqual({ kind: "in_review", playable: false });
    expect(moduleAvailability(module(), true)).toEqual({ kind: "in_review", playable: true });
  });
  it("plays an approved export whatever the draft policy", () => {
    const m = module({
      review: { reviewer: "A. Expert", reviewedOn: "2026-11-12", verdict: "approved" },
    });
    expect(moduleAvailability(m, false)).toEqual({ kind: "approved", playable: true });
  });
});

describe("urls and names", () => {
  it("prefixes relative html urls with the API base", () => {
    expect(moduleHtmlUrl(module(), "https://api.example")).toBe(
      "https://api.example/v1/modules/m1/latest.html",
    );
    expect(moduleHtmlUrl(module({ latestHtmlUrl: null }))).toBeNull();
  });
  it("names the offline file by slug, module and version", () => {
    const course = { slug: "gcc-course" } as Course;
    expect(offlineFileName(course, module({ sequence: 2, version: 3 }))).toBe(
      "gcc-course-m2-v3.html",
    );
  });
  it("formats bytes", () => {
    expect(formatBytes(null)).toBe("");
    expect(formatBytes(512 * 1024)).toBe("512 KB");
    expect(formatBytes(2_500_000)).toBe("2.4 MB");
  });
});

describe("fetchCourses / recordEvent", () => {
  it("reads the courses array and encodes the site", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe("https://api.example/v1/courses?site=gcc");
      return {
        ok: true,
        json: async () => ({ courses: [{ slug: "x", modules: [] }] }),
      } as unknown as Response;
    }) as unknown as typeof fetch;
    const courses = await fetchCourses("gcc", "https://api.example", fetchImpl);
    expect(courses).toHaveLength(1);
  });
  it("sends only the site, event and the structured detail", () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof fetch;
    recordEvent(
      "module_opened",
      { moduleId: "m1", version: 1, properties: { seconds: 3 } },
      "https://api.example",
      "gcc",
      fetchImpl,
    );
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(init.body))).toEqual({
      site: "gcc",
      event: "module_opened",
      moduleId: "m1",
      version: 1,
      properties: { seconds: 3 },
    });
  });
});
