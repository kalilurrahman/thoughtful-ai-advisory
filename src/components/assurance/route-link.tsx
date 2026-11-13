import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";

export interface RouteLinkProps {
  to: string;
  className?: string | undefined;
  children: ReactNode;
  "data-gate"?: string;
  "aria-label"?: string;
}

/**
 * A router Link that degrades to a plain anchor when no router is mounted (unit tests render
 * screens with the governance context alone), so primitives never require a RouterProvider.
 */
export function RouteLink({ to, className, children, ...rest }: RouteLinkProps) {
  const router = useRouter({ warn: false });
  if (!router)
    return (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    );
  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  );
}
