import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export interface FilterTabItem {
  id: string;
  label: string;
  count?: number;
}

export interface FilterTabsProps {
  items: FilterTabItem[];
  value: string;
  onChange?: (id: string) => void;
  /** Accessible name of the group ("Filter by risk tier"). */
  label?: string;
  className?: string;
}

/**
 * Segmented filter with counts, on a sunken track; the active segment is the card surface with
 * the card shadow. Scrolls horizontally on phones. One item is always selected.
 */
export function FilterTabs({ items, value, onChange, label, className }: FilterTabsProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onChange?.(next)}
      aria-label={label}
      className={cn(
        "flex max-w-full gap-1 overflow-x-auto rounded-control bg-secondary p-[3px] [scrollbar-width:thin]",
        className,
      )}
    >
      {items.map((it) => (
        <ToggleGroupPrimitive.Item
          key={it.id}
          value={it.id}
          className="inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-badge px-3 text-[13px] font-medium leading-none text-muted-foreground transition-colors duration-120 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[var(--workspace-shadow)] motion-reduce:transition-none"
        >
          {it.label}
          {it.count !== undefined && (
            <span className="font-mono text-[11px] font-medium text-muted-foreground [[data-state=on]_&]:text-primary">
              {it.count}
            </span>
          )}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
