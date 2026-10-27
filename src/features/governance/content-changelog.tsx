import { CalendarDays, History } from "lucide-react";
import { CONTENT_CHANGES } from "@/data/content-changelog";
import {
  contentUpdatedAt,
  formatContentDate,
  recentContentChanges,
} from "./content-changelog-model";

export function ContentUpdateDate() {
  const updatedAt = contentUpdatedAt(CONTENT_CHANGES);
  if (!updatedAt) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
      <span>
        Content last updated: <time dateTime={updatedAt}>{formatContentDate(updatedAt)}</time>
      </span>
      <a href="#content-change-log" className="text-primary underline underline-offset-4">
        View change log
      </a>
    </p>
  );
}

export function ContentChangelog() {
  return (
    <section
      id="content-change-log"
      aria-labelledby="content-change-log-heading"
      className="scroll-mt-24 border-t border-border pt-6"
    >
      <div className="flex items-center gap-2">
        <History aria-hidden="true" className="size-5 shrink-0 text-primary" />
        <h2 id="content-change-log-heading">Content change log</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Public content and guidance updates. Private workspace edits and assessment records are not
        included.
      </p>
      <ol className="mt-4 list-none p-0">
        {recentContentChanges(CONTENT_CHANGES).map((change) => (
          <li
            key={change.id}
            className="grid min-w-0 gap-2 border-b border-border py-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4"
          >
            <time dateTime={change.date} className="text-sm tabular-nums text-muted-foreground">
              {formatContentDate(change.date)}
            </time>
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{change.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{change.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
