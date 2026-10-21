import { createFileRoute, notFound } from "@tanstack/react-router";
import { getControl } from "@/features/site/content";
import { ControlView, SiteNotFound, controlHead } from "@/features/site/views";

export const Route = createFileRoute("/framework/controls/$controlId")({
  loader: ({ params }) => {
    const control = getControl(params.controlId);
    if (!control) throw notFound();
    return { id: control.id };
  },
  head: ({ loaderData }) => controlHead(loaderData?.id ?? ""),
  component: ControlRoute,
  notFoundComponent: SiteNotFound,
});

function ControlRoute() {
  const { id } = Route.useLoaderData();
  const control = getControl(id);
  return control ? <ControlView control={control} /> : <SiteNotFound />;
}
