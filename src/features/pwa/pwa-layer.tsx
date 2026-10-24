import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  AppWindow,
  CheckCircle,
  DownloadSimple,
  Export,
  Lightning,
  PlusSquare,
  WifiHigh,
  WifiSlash,
  X,
} from "@phosphor-icons/react";
import { INSTALL_SNOOZE_KEY, isEngaged, isSnoozed, type InstallPlatform } from "./pwa-core";
import {
  requestInstall,
  setInstallSheetOpen,
  snoozeInstall,
  useInstallState,
} from "./install-store";
import { setUpServiceWorker } from "./register";

// The installable-app layer, mounted once at the root for the website and the workspace:
// service-worker set-up, a polite install card, step-by-step install instructions where the
// browser has no prompt (iPhone, iPad, Safari on Mac), and connection / installed notices.

const PAGES_KEY = "veritrail-pages-seen";
const FIRST_SEEN_KEY = "veritrail-first-seen";

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function snoozedNow(): boolean {
  try {
    return isSnoozed(localStorage.getItem(INSTALL_SNOOZE_KEY), Date.now());
  } catch {
    return false;
  }
}

/** Distinct pages viewed and time on site in this tab, for the install card's timing. */
function useEngagement(pathname: string): boolean {
  const [engaged, setEngaged] = useState(false);
  useEffect(() => {
    const seen = new Set<string>(JSON.parse(readSession(PAGES_KEY) ?? "[]") as string[]);
    seen.add(pathname);
    writeSession(PAGES_KEY, JSON.stringify([...seen].slice(-20)));
    const first = Number(readSession(FIRST_SEEN_KEY)) || Date.now();
    writeSession(FIRST_SEEN_KEY, String(first));
    const check = () =>
      setEngaged(isEngaged({ pathname, pagesViewed: seen.size, elapsedMs: Date.now() - first }));
    check();
    const remaining = Math.max(0, 40_000 - (Date.now() - first));
    const timer = window.setTimeout(check, remaining + 50);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return engaged;
}

function AppIcon() {
  return (
    <img
      className="pwa-app-icon"
      src="/icons/icon-192.png"
      alt=""
      width={48}
      height={48}
      decoding="async"
    />
  );
}

const BENEFITS = [
  { icon: Lightning, text: "One tap to the self-assessment, risk triage and control library" },
  { icon: AppWindow, text: "Opens in its own window, without browser tabs and toolbars" },
  { icon: WifiSlash, text: "Pages you have read stay available offline" },
];

function InstallCard({ platform, onClose }: { platform: InstallPlatform; onClose: () => void }) {
  const manual = platform === "ios" || platform === "mac-safari";
  return (
    <section className="pwa-card" aria-labelledby="pwa-card-title" role="region">
      <AppIcon />
      <div className="pwa-card-body">
        <h2 id="pwa-card-title" className="pwa-card-title">
          Install the VERITRAIL app
        </h2>
        <p className="pwa-card-text">
          {platform === "ios"
            ? "Add VERITRAIL to your Home Screen: it opens full screen and keeps the pages you read for offline use."
            : "Get one-tap access to the self-assessment, the control library and your workspace — in its own window, and readable offline."}
        </p>
        <div className="pwa-card-actions">
          <button
            type="button"
            className="pwa-btn pwa-btn-primary"
            data-cta={manual ? "pwa-install-how" : "pwa-install-card"}
            onClick={() => {
              // After the browser dialog or the instructions, the card has done its job.
              void requestInstall().then(onClose);
            }}
          >
            {manual ? (
              "Show me how"
            ) : (
              <>
                <DownloadSimple weight="bold" aria-hidden="true" /> Install
              </>
            )}
          </button>
          <button
            type="button"
            className="pwa-btn pwa-btn-quiet"
            data-cta="pwa-install-not-now"
            onClick={() => {
              snoozeInstall();
              onClose();
            }}
          >
            Not now
          </button>
        </div>
      </div>
      <button
        type="button"
        className="pwa-icon-btn pwa-card-close"
        aria-label="Dismiss install suggestion"
        onClick={() => {
          snoozeInstall();
          onClose();
        }}
      >
        <X aria-hidden="true" />
      </button>
    </section>
  );
}

function Steps({ platform }: { platform: InstallPlatform }) {
  if (platform === "ios")
    return (
      <ol className="pwa-steps">
        <li>
          Tap the <strong>Share</strong> button{" "}
          <Export className="pwa-inline-icon" weight="bold" aria-hidden="true" /> in the browser
          toolbar — at the bottom on iPhone, at the top on iPad.
        </li>
        <li>
          Scroll down and choose <strong>Add to Home Screen</strong>{" "}
          <PlusSquare className="pwa-inline-icon" weight="bold" aria-hidden="true" />.
        </li>
        <li>
          Tap <strong>Add</strong>. VERITRAIL now opens full screen from your Home Screen.
        </li>
      </ol>
    );
  if (platform === "mac-safari")
    return (
      <ol className="pwa-steps">
        <li>
          In the menu bar, choose <strong>File › Add to Dock…</strong> (or click Share{" "}
          <Export className="pwa-inline-icon" weight="bold" aria-hidden="true" /> and choose{" "}
          <strong>Add to Dock</strong>).
        </li>
        <li>
          Click <strong>Add</strong>. VERITRAIL opens from the Dock in its own window.
        </li>
      </ol>
    );
  return (
    <ol className="pwa-steps">
      <li>
        Look for the install icon{" "}
        <DownloadSimple className="pwa-inline-icon" weight="bold" aria-hidden="true" /> at the right
        of the address bar, or open the browser menu.
      </li>
      <li>
        Choose <strong>Install VERITRAIL</strong> (in Edge:{" "}
        <strong>Apps › Install this site as an app</strong>; on Android:{" "}
        <strong>Add to Home screen</strong>).
      </li>
    </ol>
  );
}

function InstallSheet({ platform }: { platform: InstallPlatform }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInstallSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, []);
  return (
    <div className="pwa-sheet-backdrop" onClick={() => setInstallSheetOpen(false)}>
      <div
        className="pwa-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pwa-sheet-head">
          <AppIcon />
          <div>
            <p className="pwa-eyebrow">Install the app</p>
            <h2 id="pwa-sheet-title" className="pwa-sheet-title">
              {platform === "ios"
                ? "Add VERITRAIL to your Home Screen"
                : platform === "mac-safari"
                  ? "Add VERITRAIL to your Dock"
                  : "Install VERITRAIL"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="pwa-icon-btn"
            aria-label="Close"
            onClick={() => setInstallSheetOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <Steps platform={platform} />
        <ul className="pwa-benefits">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon weight="duotone" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="pwa-btn pwa-btn-primary pwa-sheet-done"
          onClick={() => setInstallSheetOpen(false)}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

type Notice = { kind: "offline" | "online" | "installed"; text: string } | null;

function useConnectionNotice(installed: boolean): [Notice, () => void] {
  const [notice, setNotice] = useState<Notice>(null);
  useEffect(() => {
    const offline = () =>
      setNotice({
        kind: "offline",
        text: "You're offline. Pages you have opened stay readable; forms and Cloud save will wait for a connection.",
      });
    const online = () => setNotice({ kind: "online", text: "Back online." });
    if (!navigator.onLine) offline();
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);
  useEffect(() => {
    if (installed)
      setNotice({
        kind: "installed",
        text: "VERITRAIL is installed. Open it from your home screen, dock or app list.",
      });
  }, [installed]);
  useEffect(() => {
    if (!notice || notice.kind === "offline") return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);
  return [notice, () => setNotice(null)];
}

export function PwaLayer() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const install = useInstallState();
  const engaged = useEngagement(pathname);
  const [dismissed, setDismissed] = useState(false);
  const [notice, clearNotice] = useConnectionNotice(install.installed);

  useEffect(() => {
    setUpServiceWorker((href) => void navigate({ href }));
    // Set up once per page load; navigate is stable for the router's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCard =
    install.canInstall && engaged && !dismissed && !install.sheetOpen && !snoozedNow();

  useEffect(() => {
    document.documentElement.toggleAttribute("data-install-card", showCard);
  }, [showCard]);

  return (
    <div className="pwa-layer">
      {showCard && <InstallCard platform={install.platform} onClose={() => setDismissed(true)} />}
      {install.sheetOpen && <InstallSheet platform={install.platform} />}
      <div className="pwa-toast-region" role="status" aria-live="polite">
        {notice && (
          <div className={`pwa-toast pwa-toast--${notice.kind}`}>
            {notice.kind === "offline" ? (
              <WifiSlash weight="duotone" aria-hidden="true" />
            ) : notice.kind === "online" ? (
              <WifiHigh weight="duotone" aria-hidden="true" />
            ) : (
              <CheckCircle weight="duotone" aria-hidden="true" />
            )}
            <span>{notice.text}</span>
            <button
              type="button"
              className="pwa-icon-btn"
              aria-label="Dismiss notice"
              onClick={clearNotice}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** "Install app" button for the site header; renders nothing where nothing can be offered. */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const { canInstall } = useInstallState();
  if (!canInstall) return null;
  return (
    <button
      type="button"
      className={`install-app-btn ${className}`}
      data-cta="pwa-install-header"
      onClick={() => void requestInstall()}
    >
      <DownloadSimple weight="bold" aria-hidden="true" />
      <span className="install-app-label">Install app</span>
    </button>
  );
}
