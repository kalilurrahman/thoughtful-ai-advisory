import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Brain, ShieldCheck, UsersThree } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const tracks = [
  {
    icon: BookOpen,
    name: "Framework fluency",
    description:
      "Practice mapping governance activities to NIST AI RMF, ISO/IEC 42001, and EU AI Act concepts.",
    skill: "Framework literacy",
  },
  {
    icon: ShieldCheck,
    name: "Incident readiness",
    description:
      "Rehearse containment, escalation, and recovery decisions in a fictional AI incident.",
    skill: "Operational response",
  },
  {
    icon: Brain,
    name: "Evidence judgment",
    description:
      "Learn to distinguish policy intent, unsupported claims, and current traceable evidence.",
    skill: "Assurance quality",
  },
  {
    icon: UsersThree,
    name: "Change and supplier review",
    description:
      "Explore how model, data, purpose, oversight, and vendor changes affect review scope.",
    skill: "Lifecycle governance",
  },
];

export function AcademyScreen() {
  return (
    <>
      <section className="checklist-intro">
        <h2>Governance Learning Arcade</h2>
        <p>
          Short scenario-based practice for AI governance teams. Exercises are for learning and
          discussion; they are not compliance ratings, legal advice, certification, or evidence of
          operational control.
        </p>
      </section>
      <div className="checklist-phases">
        {tracks.map(({ icon: Icon, name, description, skill }) => (
          <section className="checklist-phase" key={name}>
            <div className="checklist-task">
              <Icon weight="duotone" />
              <div>
                <h2>{name}</h2>
                <p>{description}</p>
                <small>Skill area · {skill}</small>
              </div>
              <Button asChild variant="outline">
                <Link to="/checklist">
                  Open exercises <ArrowRight />
                </Link>
              </Button>
            </div>
          </section>
        ))}
      </div>
      <section className="checklist-phase">
        <h2>How to use the arcade</h2>
        <p>
          Discuss each scenario with the relevant product, technical, risk, privacy, security, and
          legal owners. Compare answers with your approved policies and current source material.
          Record real decisions and evidence in the appropriate workspace workflow—not in a game
          score.
        </p>
        <Button asChild>
          <Link to="/checklist">
            Go to checklist exercises <ArrowRight />
          </Link>
        </Button>
      </section>
    </>
  );
}
