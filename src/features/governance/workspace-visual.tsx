import { Calculator, ClipboardCheck, Gamepad2, ShieldCheck } from "lucide-react";
import governanceImage from "@/assets/service-governance.jpg";
import controlsImage from "@/assets/service-controls.jpg";
import assuranceImage from "@/assets/service-assurance.jpg";

const VISUALS = {
  checklist: { icon: ClipboardCheck, image: controlsImage, label: "Lifecycle review" },
  games: { icon: Gamepad2, image: governanceImage, label: "Governance practice" },
  calculators: { icon: Calculator, image: assuranceImage, label: "Decision support" },
  workspace: { icon: ShieldCheck, image: governanceImage, label: "Governance workspace" },
};

export function WorkspaceVisual({ section }: { section: keyof typeof VISUALS }) {
  const { icon: Icon, image, label } = VISUALS[section];
  return (
    <div className="mb-6 grid min-w-0 grid-cols-[1fr_96px] overflow-hidden border-y border-border bg-secondary sm:grid-cols-[1fr_240px]">
      <div className="flex min-w-0 items-center gap-3 px-4 py-5 sm:px-6">
        <Icon aria-hidden="true" className="size-8 shrink-0 text-primary" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-foreground sm:text-base">{label}</span>
      </div>
      <img src={image} alt="" className="h-24 w-full object-cover sm:h-28" decoding="async" />
    </div>
  );
}