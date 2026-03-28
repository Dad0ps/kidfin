import { useState, useEffect, useCallback } from 'react';

const CHECK_INTERVAL = 60 * 60 * 1000; // check every hour

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const applyUpdate = useCallback(() => {
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage('skipWaiting');
      }
    });
  }, []);

  const checkForUpdate = useCallback(() => {
    if (!('serviceWorker' in navigator)) {
      setStatus('Service worker not supported');
      return;
    }
    setChecking(true);
    setStatus(null);
    navigator.serviceWorker.getRegistration()
      .then((reg) => {
        if (!reg) {
          setStatus('No service worker registered');
          setChecking(false);
          return;
        }
        return reg.update().then(() => {
          if (reg.waiting) {
            setUpdateAvailable(true);
          } else {
            setStatus('You are on the latest version');
          }
        });
      })
      .catch(() => setStatus('Could not reach server'))
      .finally(() => setChecking(false));
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

  return { updateAvailable, checking, status, applyUpdate, checkForUpdate };
}
