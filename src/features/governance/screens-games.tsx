import { Link } from "@tanstack/react-router";
import { ArrowRight, GameController } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GOVERNANCE_GAMES } from "./games/catalog";

export function GamesScreen() {
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
                <Link to="/checklist">
                  Play <ArrowRight />
                </Link>
              </Button>
            </article>
          </section>
        ))}
      </div>
      <p className="footnote">
        More game formats can be added here as they are merged into the product. Exercises are
        educational and do not replace professional, legal, or regulatory review.
      </p>
    </>
  );
}
