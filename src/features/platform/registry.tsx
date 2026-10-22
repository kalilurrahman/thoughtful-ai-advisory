import type { ComponentType } from "react";

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
  "roi-calculator": Pending,
  samples: Pending,
  "content-checks": Pending,
  admin: Pending,
};
