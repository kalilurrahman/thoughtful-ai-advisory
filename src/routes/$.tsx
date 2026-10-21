import { createFileRoute, notFound } from "@tanstack/react-router";
import { getSitePage } from "@/features/site/pages";
import { SiteNotFound, SitePageView, siteHead, sitePageHead } from "@/features/site/views";

// Every public website page authored in platform/content/website_pages/*.md.
export const Route = createFileRoute("/$")({
  loader: ({ params }) => {
    const page = getSitePage(`/${params._splat ?? ""}`);
    if (!page) throw notFound();
    return { path: page.path };
  },
  head: ({ loaderData }) => {
    const page = loaderData ? getSitePage(loaderData.path) : undefined;
    return page
      ? sitePageHead(page)
      : siteHead({
          title: "Page not found",
          description: "The page you requested could not be found.",
          noindex: true,
        });
  },
  component: SitePageRoute,
  notFoundComponent: SiteNotFound,
});

function SitePageRoute() {
  const { path } = Route.useLoaderData();
  const page = getSitePage(path);
  return page ? <SitePageView page={page} /> : <SiteNotFound />;
}
