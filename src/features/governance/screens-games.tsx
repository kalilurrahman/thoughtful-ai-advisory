import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, GameController } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GOVERNANCE_GAMES } from "./games/catalog";

export function GamesScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All skills");
  const categories = ["All skills", ...new Set(GOVERNANCE_GAMES.map((game) => game.category))];
  const games = useMemo(
    () =>
      GOVERNANCE_GAMES.filter((game) => {
        const matchesCategory = category === "All skills" || game.category === category;
        const searchable =
          `${game.title} ${game.description} ${game.category} ${game.tags.join(" ")}`.toLowerCase();
        return matchesCategory && searchable.includes(query.trim().toLowerCase());
      }),
    [category, query],
  );
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
      <section className="checklist-phase" aria-label="Find a governance game">
        <label htmlFor="game-search">Search games</label>
        <input
          id="game-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search frameworks, skills, topics…"
        />
        <label htmlFor="game-category">Skill area</label>
        <select
          id="game-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <p aria-live="polite">
          {games.length} game{games.length === 1 ? "" : "s"} found
        </p>
      </section>
      <div className="checklist-phases">
        {games.map((game) => (
          <section className="checklist-phase" key={game.id}>
            <article className="checklist-task">
              <GameController weight="duotone" />
              <div>
                <small>{game.category}</small>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <small>
                  {game.difficulty} · about {game.minutes} min · {game.tags.join(" · ")}
                </small>
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
