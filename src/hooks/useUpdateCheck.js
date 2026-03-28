import { useState, useEffect, useCallback } from 'react';

const CHECK_INTERVAL = 60 * 60 * 1000; // check every hour

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const applyUpdate = useCallback(() => {
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

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      onNewSW(reg);
      interval = setInterval(() => reg.update().catch(() => {}), CHECK_INTERVAL);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return () => clearInterval(interval);
  }, []);

  return { updateAvailable, applyUpdate };
}
