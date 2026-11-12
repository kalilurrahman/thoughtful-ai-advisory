import { useEffect, useState } from "react";
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
        <h2>AI Governance Games</h2>
        <p>
          Practice governance decisions through short, scenario-based exercises. Scores are
          session-only learning feedback—not compliance ratings, approvals, or evidence of
          operational controls.
        </p>
      </section>
      <div className="checklist-phases">
        {GOVERNANCE_GAMES.map((game) => (
          <section className="checklist-phase" key={game.id}>
            <article className="checklist-task">
              <GameController weight="duotone" />
              <div>
                <small>{game.category}</small>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
              </div>
              <Button asChild>
                <Link
                  to="/checklist"
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
            </article>
          </section>
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
