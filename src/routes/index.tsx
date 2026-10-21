import { createFileRoute } from "@tanstack/react-router";
import { getSitePage } from "@/features/site/pages";
import { SitePageView, sitePageHead } from "@/features/site/views";

const home = getSitePage("/");

export const Route = createFileRoute("/")({
  head: () => (home ? sitePageHead(home) : {}),
  component: () => (home ? <SitePageView page={home} /> : null),
});
