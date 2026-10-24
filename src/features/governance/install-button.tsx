import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { requestInstall, useInstallState } from "@/features/pwa/install-store";

/**
 * Workspace header entry point to install the app. Uses the shared install state, so it shows
 * the browser's dialog where there is one and step-by-step instructions on iPhone, iPad and Safari.
 */
export function InstallButton() {
  const { canInstall } = useInstallState();
  if (!canInstall) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Install the VERITRAIL app"
      title="Install the VERITRAIL app"
      onClick={() => void requestInstall()}
    >
      <DownloadSimple weight="duotone" />
    </Button>
  );
}
