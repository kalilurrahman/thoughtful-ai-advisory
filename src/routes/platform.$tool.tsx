import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPlatformTool } from "@/features/platform/catalog";
import { PlatformToolView, platformToolHead } from "@/features/platform/views";
import { SiteNotFound } from "@/features/site/views";

export const Route = createFileRoute("/platform/$tool")({
  loader: ({ params }) => {
    if (!getPlatformTool(params.tool)) throw notFound();
    return { slug: params.tool };
  },
  head: ({ loaderData }) => platformToolHead(loaderData?.slug ?? ""),
  component: PlatformToolRoute,
  notFoundComponent: SiteNotFound,
});

function PlatformToolRoute() {
  const { slug } = Route.useLoaderData();
  return <PlatformToolView slug={slug} />;
}
