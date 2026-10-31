import { Link } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThreadRow } from "./assistant-model";

export function ThreadList({
  threads,
  threadId,
  busy,
  onSelect,
  onDelete,
}: {
  threads: ThreadRow[];
  threadId?: string | undefined;
  busy: boolean;
  onSelect?: (() => void) | undefined;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Button asChild variant="outline" disabled={busy}>
        <Link to="/assistant" onClick={onSelect}>
          <MessageSquarePlus aria-hidden /> New conversation
        </Link>
      </Button>
      <ul className="flex flex-col gap-1">
        {threads.map((thread) => (
          <li key={thread.id} className="flex min-w-0 items-center gap-1">
            <Link
              to="/assistant/$threadId"
              params={{ threadId: thread.id }}
              onClick={onSelect}
              aria-current={thread.id === threadId ? "page" : undefined}
              className={`min-w-0 flex-1 rounded-md px-2 py-3 text-sm break-words hover:bg-muted ${thread.id === threadId ? "bg-muted font-medium" : ""}`}
            >
              {thread.title}
            </Link>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              aria-label={`Delete conversation ${thread.title}`}
              title="Delete conversation"
              onClick={() => onDelete(thread.id)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
