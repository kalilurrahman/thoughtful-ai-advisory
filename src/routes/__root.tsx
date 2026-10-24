import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useMatches,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { GovernanceProvider } from "@/features/governance/store";
import { GovernanceShell } from "@/features/governance/shell";
import { SiteLayout } from "@/features/site/layout";
import { PwaLayer } from "@/features/pwa/pwa-layer";
import { PWA_INIT_SCRIPT } from "@/features/pwa/pwa-core";
import "@lovable.dev/cloud-auth-js/styles.css";
import appCss from "../styles.css?url";
import siteCss from "../features/site/site.css?url";
import pwaCss from "../features/pwa/pwa.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { THEME_INIT_SCRIPT } from "../lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "VERITRAIL — Enterprise AI governance, runtime guardrails and evidence" },
      {
        name: "description",
        content:
          "VERITRAIL helps enterprises inventory AI, assess risk, govern the lifecycle, protect LLM apps and agents at runtime, and evidence responsible AI continuously.",
      },
      { name: "author", content: "VERITRAIL" },
      // Installed-app (PWA) metadata; the manifest carries the rest.
      { name: "application-name", content: "VERITRAIL" },
      { name: "apple-mobile-web-app-title", content: "VERITRAIL" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:title", content: "VERITRAIL — Enterprise AI governance" },
      {
        property: "og:description",
        content: "Govern every AI system, agent, and decision with evidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    // Applies the viewer's light/dark preference (and theme-color) before first paint, and
    // captures the browser's one-off install prompt before React hydrates.
    scripts: [{ children: THEME_INIT_SCRIPT }, { children: PWA_INIT_SCRIPT }],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "stylesheet", href: siteCss },
      { rel: "stylesheet", href: pwaCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // THEME_INIT_SCRIPT may add the `dark` class before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Routes that belong to the public VERITRAIL website; every other route is the workspace.
const SITE_ROUTE_IDS = new Set<string>([
  "/",
  "/$",
  "/framework/controls/",
  "/framework/controls/$controlId",
  "/platform/",
  "/platform/$tool",
]);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const leafRouteId = useMatches({ select: (matches) => matches.at(-1)?.routeId ?? "" });
  const isSite = SITE_ROUTE_IDS.has(leafRouteId);

  return (
    <QueryClientProvider client={queryClient}>
      <GovernanceProvider>
        {isSite ? (
          <SiteLayout>
            <Outlet />
          </SiteLayout>
        ) : (
          <GovernanceShell>
            <Outlet />
          </GovernanceShell>
        )}
        <PwaLayer />
      </GovernanceProvider>
    </QueryClientProvider>
  );
}
