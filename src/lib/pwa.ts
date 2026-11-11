let deferredPrompt: any = null;

export function initPWA(onInstallableChange?: (canInstall: boolean) => void) {
  if (typeof window === "undefined") return;

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Tehseen OS Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    });
  }

  // Capture install prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (onInstallableChange) {
      onInstallableChange(true);
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    if (onInstallableChange) {
      onInstallableChange(false);
    }
    console.log("Tehseen OS installed successfully!");
  });
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === "accepted";
}
