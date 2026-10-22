import { lazy, type ComponentType } from "react";

// Components for each Platform console tool, keyed by catalog slug. Each tool (and its
// engine) loads only on its own page.

export const PLATFORM_COMPONENTS: Record<string, ComponentType> = {
  agent: lazy(() => import("./agent-console").then((m) => ({ default: m.AgentConsole }))),
  "policy-simulator": lazy(() =>
    import("./policy-simulator").then((m) => ({ default: m.PolicySimulator })),
  ),
  "pilot-rehearsal": lazy(() =>
    import("./pilot-rehearsal").then((m) => ({ default: m.PilotRehearsal })),
  ),
  "roi-calculator": lazy(() => import("./roi-calculator").then((m) => ({ default: m.RoiCalculator }))),
  samples: lazy(() => import("./samples-gallery").then((m) => ({ default: m.SamplesGallery }))),
  "content-checks": lazy(() =>
    import("./content-checks").then((m) => ({ default: m.ContentChecks })),
  ),
  admin: lazy(() => import("./admin-console").then((m) => ({ default: m.AdminConsole }))),
};
