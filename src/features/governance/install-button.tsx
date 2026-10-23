import { useEffect, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt && !ios) return null;
  return (
    <span className="install-wrap">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Install app"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            setPrompt(null);
          } else setShowTip((v) => !v);
        }}
      >
        <DownloadSimple weight="duotone" />
      </Button>
      {showTip && <span className="install-tip" role="status">Tap Share, then “Add to Home Screen”.</span>}
    </span>
  );
}
