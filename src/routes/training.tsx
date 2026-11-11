import { createFileRoute } from "@tanstack/react-router";
import { TrainingView, trainingHead } from "@/features/site/training-view";

// Interactive courses from the course-forge API (site key thoughtful-ai).
export const Route = createFileRoute("/training")({
  validateSearch: (search: Record<string, unknown>) => ({
    course: typeof search["course"] === "string" ? search["course"] : undefined,
    module: typeof search["module"] === "string" ? search["module"] : undefined,
  }),
  head: trainingHead,
  component: TrainingView,
});
