import { useEffect, useMemo, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Breadcrumbs } from "./layout";
import { SectionArt } from "./illustrations";
import { PageHeader, ogImageFor, siteHead } from "./views";
import { TRAINING_PATH } from "./pages";
import {
  COURSE_SITE,
  fetchCourses,
  formatBytes,
  moduleAvailability,
  moduleHtmlUrl,
  offlineFileName,
  recordEvent,
  type Course,
  type CourseModule,
} from "@/lib/courseForge";

// /training — VERITRAIL's interactive courses, generated in the OpenMAIC studio and stored by
// course-forge. The lesson is one self-contained HTML file framed with sandbox="allow-scripts"
// only (no allow-same-origin), so it runs its decision simulation and quiz but cannot read this
// page's storage. Nothing AI-generated plays before a human review unless the deployment opts
// in with VITE_COURSE_SHOW_DRAFTS=1, and then it carries a visible draft note.

type LoadState =
  { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; courses: Course[] };

export const trainingHead = () =>
  siteHead({
    title: "Training — interactive AI governance courses",
    description:
      "Short interactive courses for AI governance stakeholders: a launch decision simulation, a knowledge check and an AI launch risk register you leave with. Plays in the browser; downloadable for offline use.",
    image: ogImageFor("resources"),
    path: TRAINING_PATH,
  });

export function TrainingView() {
  const search = useSearch({ strict: false }) as { course?: string; module?: string };
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const courseSlug = search.course ?? "";
  const moduleParam = Number(search.module ?? "1");

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((courses) => {
        if (!cancelled) setState({ kind: "ready", courses });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const course = useMemo(
    () =>
      state.kind === "ready" ? (state.courses.find((c) => c.slug === courseSlug) ?? null) : null,
    [state, courseSlug],
  );
  const module = useMemo(
    () => course?.modules.find((m) => m.sequence === moduleParam) ?? course?.modules[0] ?? null,
    [course, moduleParam],
  );

  useEffect(() => {
    if (course && module)
      recordEvent("module_opened", {
        courseId: course.id,
        moduleId: module.id,
        version: module.version,
      });
  }, [course, module]);

  const open = (slug: string) =>
    void navigate({ to: TRAINING_PATH, search: { course: slug, module: "1" } as never });
  const back = () => void navigate({ to: TRAINING_PATH, search: {} as never });

  return (
    <div className="tpl-training">
      <Breadcrumbs
        crumbs={[
          { label: "Home", url: "/" },
          ...(course
            ? [
                { label: "Training", url: TRAINING_PATH },
                {
                  label: course.title,
                  url: `${TRAINING_PATH}?course=${course.slug}`,
                  current: true,
                },
              ]
            : [{ label: "Training", url: TRAINING_PATH, current: true }]),
        ]}
      />
      <PageHeader
        eyebrow="Resources"
        h1={course ? course.title : "Training"}
        lead={
          course && module
            ? `Module ${module.sequence}: ${module.title}${module.durationMinutes ? ` · about ${module.durationMinutes} min` : ""}`
            : "Short, practical modules with one decision simulation, one knowledge check and a template you leave with. Each plays in the browser and can be downloaded as a single file for offline use."
        }
        meta={course ? undefined : `Site key ${COURSE_SITE}`}
        art={<SectionArt kind="resources" />}
      />
      <div className="container page-body">
        {state.kind === "loading" && <p role="status">Loading courses…</p>}
        {state.kind === "error" && (
          <p className="notice" role="alert">
            The course service did not answer ({state.message}). The rest of VERITRAIL is
            unaffected; try again in a minute.
          </p>
        )}
        {state.kind === "ready" && !course && <CourseList courses={state.courses} onOpen={open} />}
        {state.kind === "ready" && course && module && (
          <Player course={course} module={module} onBack={back} />
        )}
      </div>
    </div>
  );
}

function badge(availability: ReturnType<typeof moduleAvailability>): string {
  if (availability.kind === "approved") return "Reviewed";
  if (availability.kind === "generating") return "Generating";
  return "Draft · in review";
}

function CourseList({ courses, onOpen }: { courses: Course[]; onOpen: (slug: string) => void }) {
  if (courses.length === 0) return <p>No courses are listed for this site yet.</p>;
  return (
    <ul
      className="card-grid training-list"
      style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}
    >
      {courses.map((c) => {
        const first = c.modules[0];
        const availability = first ? moduleAvailability(first) : ({ kind: "generating" } as const);
        const playable = "playable" in availability && availability.playable;
        return (
          <li key={c.id} className="card" style={{ padding: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{c.title}</h2>
              <span className="glossary-tag">{badge(availability)}</span>
            </div>
            {c.outcome && <p>{c.outcome}</p>}
            {c.primaryInteraction && (
              <p>
                <strong>Practice:</strong> {c.primaryInteraction}
              </p>
            )}
            {c.deliverable && (
              <p>
                <strong>You leave with:</strong> {c.deliverable}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "0.75rem",
              }}
            >
              {first?.durationMinutes ? <span>about {first.durationMinutes} min</span> : null}
              <button
                type="button"
                className="button"
                style={{ marginLeft: "auto" }}
                disabled={!playable}
                onClick={() => onOpen(c.slug)}
              >
                {availability.kind === "generating"
                  ? "Being generated"
                  : playable
                    ? "Start"
                    : "In review"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Player({
  course,
  module,
  onBack,
}: {
  course: Course;
  module: CourseModule;
  onBack: () => void;
}) {
  const availability = moduleAvailability(module);
  const src = moduleHtmlUrl(module);
  const playable = Boolean(src) && "playable" in availability && availability.playable;
  return (
    <article aria-label={`${course.title}, module ${module.sequence}`}>
      <p>
        <button type="button" className="button" onClick={onBack}>
          ← All courses
        </button>
      </p>
      {availability.kind !== "approved" && (
        <p className="notice" role="note">
          Draft. This module was generated with AI assistance and has not yet been reviewed by a
          subject expert. Treat its content as a starting point, not as advice.
        </p>
      )}
      {playable && src ? (
        <iframe
          title={`${course.title} — ${module.title}`}
          src={src}
          sandbox="allow-scripts"
          loading="lazy"
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            minHeight: "28rem",
            border: "1px solid var(--line, #ccc)",
            borderRadius: "0.75rem",
            background: "#000",
          }}
        />
      ) : (
        <p>This module is not available to play yet.</p>
      )}
      <p
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          fontSize: "0.9rem",
        }}
      >
        {playable && src && (
          <>
            <a
              href={src}
              download={offlineFileName(course, module)}
              onClick={() =>
                recordEvent("offline_download", {
                  courseId: course.id,
                  moduleId: module.id,
                  version: module.version,
                })
              }
            >
              Download for offline use{module.bytes ? ` (${formatBytes(module.bytes)})` : ""}
            </a>
            <a href={src} target="_blank" rel="noopener noreferrer">
              Open full screen
            </a>
          </>
        )}
        {module.sha256 && (
          <span>
            version {module.version} · sha256 {module.sha256.slice(0, 12)}…
          </span>
        )}
        {module.review?.reviewer && module.review.reviewedOn && (
          <span>
            Reviewed by {module.review.reviewer} on {module.review.reviewedOn}
          </span>
        )}
      </p>
    </article>
  );
}
