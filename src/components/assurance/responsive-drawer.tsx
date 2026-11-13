import { useEffect, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PHONE = "(max-width: 639px)";

/** True below 640px (the bottom-nav layout); false on the server and on wider screens. */
export function usePhoneLayout(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const q = window.matchMedia(PHONE);
    const update = () => setPhone(q.matches);
    update();
    if (typeof q.addEventListener === "function") q.addEventListener("change", update);
    else q.addListener(update);
    return () => {
      if (typeof q.removeEventListener === "function") q.removeEventListener("change", update);
      else q.removeListener(update);
    };
  }, []);
  return phone;
}

export interface ResponsiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A details panel: a vaul bottom sheet on phones, a right-hand Radix Dialog sheet
 * (width min(440px, 100%)) elsewhere. Both trap focus and close on Esc and on the scrim.
 */
export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDrawerProps) {
  const phone = usePhoneLayout();
  if (phone)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={cn(
            "max-h-[92dvh] rounded-t-sheet border-border bg-card text-card-foreground shadow-[var(--drawer-shadow)]",
            className,
          )}
        >
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
            <DrawerTitle className="font-serif text-[22px] font-semibold leading-tight text-foreground">
              {title}
            </DrawerTitle>
            {description ? (
              <DrawerDescription className="text-sm text-muted-foreground">
                {description}
              </DrawerDescription>
            ) : (
              <DrawerDescription className="sr-only">Details</DrawerDescription>
            )}
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-[min(440px,100%)] flex-col gap-3 overflow-y-auto border-border bg-card p-5 text-card-foreground shadow-[var(--drawer-shadow)] sm:max-w-[440px] [&>button]:hidden",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <SheetTitle className="font-serif text-[22px] font-semibold leading-tight text-foreground">
            {title}
          </SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X weight="bold" className="size-5" />
          </button>
        </div>
        {description ? (
          <SheetDescription className="text-sm text-muted-foreground">
            {description}
          </SheetDescription>
        ) : (
          <SheetDescription className="sr-only">Details</SheetDescription>
        )}
        {children}
      </SheetContent>
    </Sheet>
  );
}
