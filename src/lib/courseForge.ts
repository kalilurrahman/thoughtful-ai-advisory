// Client for the course-forge API (the Railway service that stores the OpenMAIC-generated
// courses for every KR site; see brightpath-advisors/deploy/course-forge/README.md).
// Framework-free on purpose so it can be unit-tested without a DOM.

export const COURSE_API_BASE: string =
  (import.meta.env["VITE_COURSE_API_BASE"] as string | undefined)?.replace(/\/+$/, "") ||
  "https://course-forge-production.up.railway.app";

/** Which site's courses this deployment lists. */
export const COURSE_SITE: string =
  (import.meta.env["VITE_COURSE_SITE"] as string | undefined) || "thoughtful-ai";

/**
 * Drafts are shown only when the deployment opts in. The platform rule (BRS BR-06) is that
 * nothing AI-generated reaches learners without a human review, so the default lists a
 * draft course as "in review" and does not play it.
 */
export const SHOW_DRAFTS: boolean = import.meta.env["VITE_COURSE_SHOW_DRAFTS"] === "1";

export interface CourseReview {
  reviewer: string;
  reviewedOn: string | null;
  verdict: string | null;
}

export interface CourseModule {
  id: string;
  sequence: number;
  title: string;
  learningOutcome: string | null;
  durationMinutes: number | null;
  status: string;
  version: number;
  latestHtmlUrl: string | null;
  offlineHtmlUrl: string | null;
  sha256: string | null;
  bytes: number | null;
  requiresNetwork: boolean | null;
  review: CourseReview | null;
  publishedAt: string | null;
  generatedAt: string | null;
}

export interface Course {
  id: string;
  site: string;
  slug: string;
  title: string;
  audience: string | null;
  outcome: string | null;
  primaryInteraction: string | null;
  deliverable: string | null;
  status: string;
  currentVersion: number;
  updatedAt: string;
  modules: CourseModule[];
}

export type ModuleAvailability =
  | { kind: "generating" }
  | { kind: "in_review"; playable: boolean }
  | { kind: "approved"; playable: true };

/** What the page may do with a module, from its review state and the deployment's draft policy. */
export function moduleAvailability(
  module: CourseModule,
  showDrafts: boolean = SHOW_DRAFTS,
): ModuleAvailability {
  if (!module.latestHtmlUrl) return { kind: "generating" };
  const approved =
    module.review?.verdict === "approved" ||
    module.status === "published" ||
    module.status === "approved";
  if (approved) return { kind: "approved", playable: true };
  return { kind: "in_review", playable: showDrafts };
}

export function moduleHtmlUrl(module: CourseModule, base: string = COURSE_API_BASE): string | null {
  if (!module.latestHtmlUrl) return null;
  return module.latestHtmlUrl.startsWith("http")
    ? module.latestHtmlUrl
    : `${base}${module.latestHtmlUrl}`;
}

/** A stable, human-readable file name for the offline download. */
export function offlineFileName(course: Course, module: CourseModule): string {
  return `${course.slug}-m${module.sequence}-v${module.version}.html`;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fetchCourses(
  site: string = COURSE_SITE,
  base: string = COURSE_API_BASE,
  fetchImpl: typeof fetch = fetch,
): Promise<Course[]> {
  const res = await fetchImpl(`${base}/v1/courses?site=${encodeURIComponent(site)}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`course API answered ${res.status}`);
  const body = (await res.json()) as { courses?: Course[] };
  return Array.isArray(body.courses) ? body.courses : [];
}

/**
 * Count an event. Properties are numbers and booleans only, by the API's contract; no free
 * text ever leaves the page. Failures are swallowed: analytics must never break the lesson.
 */
export function recordEvent(
  event: string,
  detail: {
    courseId?: string;
    moduleId?: string;
    version?: number;
    properties?: Record<string, number | boolean>;
  } = {},
  base: string = COURSE_API_BASE,
  site: string = COURSE_SITE,
  fetchImpl: typeof fetch = fetch,
): void {
  try {
    void fetchImpl(`${base}/v1/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ site, event, ...detail }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* never surface */
  }
}
