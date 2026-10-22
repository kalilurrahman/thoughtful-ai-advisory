import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { workspaceNav } from "@/features/site/pages";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("maps every practitioner menu destination to a real workspace route", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const item of workspaceNav.items) {
      expect(router.matchRoutes(item.url).at(-1)?.routeId).toBe(item.url);
    }
    expect(workspaceNav.items.some((item) => item.url === "/assess")).toBe(true);
    expect(workspaceNav.items.some((item) => item.url === "/actions")).toBe(true);
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("registers the AI incident-management route", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/incidents").at(-1)?.routeId).toBe("/incidents");
  });

  it("registers the live governance lifecycle checklist route", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/checklist").at(-1)?.routeId).toBe("/checklist");
  });

  it("serves the public website and moves the workspace overview to /workspace", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/").at(-1)?.routeId).toBe("/");
    expect(router.matchRoutes("/workspace").at(-1)?.routeId).toBe("/workspace");
    expect(router.matchRoutes("/tools/risk-triage").at(-1)?.routeId).toBe("/$");
    expect(router.matchRoutes("/framework/controls").at(-1)?.routeId).toBe("/framework/controls/");
    expect(router.matchRoutes("/framework/controls/is-11").at(-1)?.routeId).toBe(
      "/framework/controls/$controlId",
    );
    expect(router.matchRoutes("/inventory").at(-1)?.routeId).toBe("/inventory");
  });
});
