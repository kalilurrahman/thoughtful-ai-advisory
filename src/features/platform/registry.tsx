import type { ComponentType } from "react";
import { AdminConsole } from "./admin-console";
import { AgentConsole } from "./agent-console";
import { ContentChecks } from "./content-checks";
import { PilotRehearsal } from "./pilot-rehearsal";
import { PolicySimulator } from "./policy-simulator";
import { RoiCalculator } from "./roi-calculator";
import { SamplesGallery } from "./samples-gallery";

// Components for each Platform console tool, keyed by catalog slug.

export const PLATFORM_COMPONENTS: Record<string, ComponentType> = {
  agent: AgentConsole,
  "policy-simulator": PolicySimulator,
  "pilot-rehearsal": PilotRehearsal,
  "roi-calculator": RoiCalculator,
  samples: SamplesGallery,
  "content-checks": ContentChecks,
  admin: AdminConsole,
};
