import type { ComponentType } from "react";
import { AdminConsole } from "./admin-console";
import { ContentChecks } from "./content-checks";
import { RoiCalculator } from "./roi-calculator";
import { SamplesGallery } from "./samples-gallery";

// Components for each Platform console tool, keyed by catalog slug.

function Pending() {
  return (
    <div className="notice notice--info">
      <p>This module is being enabled.</p>
    </div>
  );
}

export const PLATFORM_COMPONENTS: Record<string, ComponentType> = {
  agent: Pending,
  "policy-simulator": Pending,
  "pilot-rehearsal": Pending,
  "roi-calculator": RoiCalculator,
  samples: SamplesGallery,
  "content-checks": ContentChecks,
  admin: AdminConsole,
};
