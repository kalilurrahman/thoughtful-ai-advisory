import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTROLS, PILLARS } from "@/data/governance";
import { useGovernance } from "@/features/governance/store";

export function WorkspaceGateway() {
  const { dispatch } = useGovernance();
  return (
    <section className="workspace-gateway" aria-labelledby="workspace-heading">
      <div className="container">
        <div className="workspace-gateway-heading">
          <div>
            <p className="eyebrow">Practitioner workspace · NIST AI RMF mapping</p>
            <h2 id="workspace-heading">GOVERN assessment & assurance studio</h2>
          </div>
          <Button asChild variant="outline" className="btn btn-secondary">
            <Link to="/workspace">
              Open workspace <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="workspace-pillar-grid">
          {PILLARS.map((pillar, index) => (
            <Button key={pillar.letter} asChild variant="ghost" className="workspace-pillar-link">
              <Link
                to="/assess"
                onClick={() => {
                  const questionIndex = CONTROLS.findIndex((control) => control.p === index);
                  if (questionIndex >= 0) dispatch({ type: "question", qi: questionIndex });
                }}
              >
                <strong className="workspace-pillar-letter">{pillar.letter}</strong>
                <span className="workspace-pillar-name">
                  {pillar.name}
                  <small>NIST · {pillar.nist.toUpperCase()}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ))}
        </div>
        <nav className="workspace-shortcuts" aria-label="Practitioner shortcuts">
          <Link to="/inventory">AI inventory</Link>
          <Link to="/guardrails">Guardrails</Link>
          <Link to="/gates">Release readiness</Link>
          <Link to="/incidents">Incidents</Link>
          <Link to="/actions">Corrective actions</Link>
          <Link to="/export">Reports & audit pack</Link>
          <Link to="/more">
            All workspace tools <ArrowRight aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </section>
  );
}
