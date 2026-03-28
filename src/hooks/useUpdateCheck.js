import { useState, useEffect, useCallback } from 'react';

const CHECK_INTERVAL = 60 * 60 * 1000; // check every hour

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const checkForUpdate = useCallback(() => {
    setChecking(true);
    setStatus(null);
    fetch('/version.json?_=' + Date.now())
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.buildTime !== __BUILD_TIME__) {
          setUpdateAvailable(true);
        } else {
          setStatus('You are on the latest version');
        }
      })
      .catch(() => setStatus('Could not reach server'))
      .finally(() => setChecking(false));
  }, []);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/version.json?_=' + Date.now())
        .then((res) => res.ok && res.json())
        .then((data) => {
          if (data && data.buildTime !== __BUILD_TIME__) {
            setUpdateAvailable(true);
          }
        })
        .catch(() => {});
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { updateAvailable, checking, status, applyUpdate, checkForUpdate };
}
