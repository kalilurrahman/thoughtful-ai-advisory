import { useEffect, useState } from "react";
import { WorkspaceVisual } from "./workspace-visual";
import { Link } from "@tanstack/react-router";
import { ArrowRight, GameController } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GOVERNANCE_GAMES } from "./games/catalog";
import {
  loadGamePreferences,
  saveGamePreferences,
  type GamePreferences,
} from "./games/preferences";

export function GamesScreen() {
  const [preferences, setPreferences] = useState<GamePreferences>(() => loadGamePreferences());
  useEffect(() => saveGamePreferences(preferences), [preferences]);
  return (
    <>
      <section className="checklist-intro">
        <WorkspaceVisual section="games" />
        <h2>AI Governance Games</h2>
        <p>
          Practice governance decisions through short, scenario-based exercises. Scores are
          session-only learning feedback—not compliance ratings, approvals, or evidence of
          operational controls.
        </p>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {GOVERNANCE_GAMES.map((game) => (
          <article
            key={game.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground"
          >
            <div className="flex items-start gap-3">
              <GameController
                weight="duotone"
                aria-hidden="true"
                className="mt-1 size-7 shrink-0 text-primary"
              />
              <div className="min-w-0">
                <small className="text-xs uppercase tracking-wide text-muted-foreground">
                  {game.category}
                </small>
                <h2 className="mt-1 text-xl font-semibold leading-tight">{game.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{game.description}</p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild className="flex-1 sm:flex-none">
                <Link
                  to="/checklist"
                  hash={game.anchor}
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      recentlyPlayed: [
                        game.id,
                        ...current.recentlyPlayed.filter((id) => id !== game.id),
                      ].slice(0, 5),
                    }))
                  }
                >
                  Play <ArrowRight />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                aria-pressed={preferences.favorites.includes(game.id)}
                onClick={() =>
                  setPreferences((current) => ({
                    ...current,
                    favorites: current.favorites.includes(game.id)
                      ? current.favorites.filter((id) => id !== game.id)
                      : [...current.favorites, game.id],
                  }))
                }
              >
                {preferences.favorites.includes(game.id) ? "Remove favorite" : "Favorite"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      {preferences.favorites.length > 0 && (
        <section className="checklist-phase">
          <h2>Your favorites</h2>
          <p>Saved only in this browser. This does not record scores or governance evidence.</p>
          <ul>
            {GOVERNANCE_GAMES.filter((game) => preferences.favorites.includes(game.id)).map(
              (game) => (
                <li key={game.id}>
                  {game.title} · {game.category}
                </li>
              ),
            )}
          </ul>
        </section>
      )}
      {preferences.recentlyPlayed.length > 0 && (
        <section className="checklist-phase">
          <h2>Recently opened</h2>
          <ul>
            {preferences.recentlyPlayed
              .map((id) => GOVERNANCE_GAMES.find((game) => game.id === id))
              .filter((game) => game !== undefined)
              .map((game) => (
                <li key={game.id}>{game.title}</li>
              ))}
          </ul>
        </section>
      )}
      <p className="footnote">
        More game formats can be added here as they are merged into the product. Exercises are
        educational and do not replace professional, legal, or regulatory review.
      </p>
    </>
  );
}
