import { useState, useEffect, useCallback } from 'react';

const CHECK_INTERVAL = 60 * 60 * 1000; // check every hour

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const applyUpdate = useCallback(() => {
    const waiting = navigator.serviceWorker?.controller?.scriptURL
      ? undefined
      : null;

    // Tell the waiting SW to activate
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage('skipWaiting');
      }
    });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let interval;

    function onNewSW(reg) {
      if (reg.waiting) {
        setUpdateAvailable(true);
        return;
      }
      // Listen for a new SW that installs while the page is open
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    }

    // Check the existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      onNewSW(reg);

      // Periodic manual check
      interval = setInterval(() => reg.update().catch(() => {}), CHECK_INTERVAL);
    });

    // Reload when the new SW takes over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return () => clearInterval(interval);
  }, []);

  return { updateAvailable, applyUpdate };
}
