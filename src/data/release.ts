// The release the deployed site carries. One source for the watermark in the site footer, the
// workspace sidebar and report previews. Keep `version` equal to package.json "version" and add
// a dated entry to src/data/content-changelog.ts for every release (src/test/release.test.ts
// checks both); bump the service worker's cache VERSION (public/sw.js) to the major so an
// installed app drops pages cached by the previous design.

export const RELEASE = {
  /** Semantic version of the deployed release. */
  version: "2.0.0",
  /** The release's name: the design system it shipped. */
  name: "Assurance",
  /** Date the release reached the live site (ISO, editorial). */
  date: "2026-11-14",
} as const;

/** "v2.0.0 · Assurance" for footers and metadata lines. */
export const RELEASE_LABEL = `v${RELEASE.version} · ${RELEASE.name}`;
