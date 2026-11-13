// VERITRAIL product marks (docs/design/assurance/README.md §6): one SVG per product layer plus
// the TILLER mark, served from public/brand. They are drawn in the brand colours (navy, teal,
// light teal, seal, white) and shown at 32–44px beside the product's name; third-party
// frameworks are never shown as logos, only as typographic labels.

export type ProductMarkId =
  "register" | "assess" | "control" | "shield" | "assurance" | "agent" | "policy" | "tiller";

export const PRODUCT_MARKS: Record<ProductMarkId, { src: string; name: string }> = {
  register: { src: "/brand/product-register.svg", name: "VERITRAIL Register" },
  assess: { src: "/brand/product-assess.svg", name: "VERITRAIL Assess" },
  control: { src: "/brand/product-control.svg", name: "VERITRAIL Control" },
  shield: { src: "/brand/product-shield.svg", name: "VERITRAIL Shield" },
  assurance: { src: "/brand/product-assurance.svg", name: "VERITRAIL Assurance" },
  agent: { src: "/brand/product-agent.svg", name: "VERITRAIL Agent" },
  policy: { src: "/brand/product-policy.svg", name: "VERITRAIL policy engine" },
  tiller: { src: "/brand/tiller-mark.svg", name: "TILLER workspace" },
};

/** The product mark of a public page: the solutions pages, by their path. */
export function markForPath(path: string): ProductMarkId | undefined {
  const m = /^\/solutions\/([a-z-]+)\/?$/.exec(path);
  const id = m?.[1];
  return id && id in PRODUCT_MARKS ? (id as ProductMarkId) : undefined;
}

/** The product mark of a Platform console tool, by its catalog slug. */
export const PLATFORM_TOOL_MARKS: Record<string, ProductMarkId> = {
  agent: "agent",
  "policy-simulator": "policy",
  "pilot-rehearsal": "shield",
  "roi-calculator": "assess",
  samples: "register",
  "content-checks": "control",
  admin: "assurance",
};

/** A product mark at 32–44px. Decorative unless `label` names the product for screen readers. */
export function ProductMark({
  id,
  size = 36,
  label,
  className,
}: {
  id: ProductMarkId;
  size?: 32 | 36 | 40 | 44;
  label?: boolean;
  className?: string | undefined;
}) {
  const mark = PRODUCT_MARKS[id];
  return (
    <img
      src={mark.src}
      width={size}
      height={size}
      alt={label ? mark.name : ""}
      aria-hidden={label ? undefined : true}
      decoding="async"
      className={className ?? "product-mark"}
    />
  );
}
