import { useState, useEffect, useRef, useCallback } from 'react';

function isInBedtime(bedtimeStart, bedtimeEnd) {
  if (!bedtimeStart || !bedtimeEnd) return false;

  const now = new Date();
  const [startH, startM] = bedtimeStart.split(':').map(Number);
  const [endH, endM] = bedtimeEnd.split(':').map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Bedtime spans midnight (e.g. 20:00 - 07:00)
  if (startMinutes > endMinutes) {
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
  // Same-day range (e.g. 13:00 - 15:00)
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

export function useSessionTimer(profile) {
  const sessionLimit = profile?.sessionLimit || 0; // minutes, 0 = no limit
  const bedtimeStart = profile?.bedtimeStart || '';
  const bedtimeEnd = profile?.bedtimeEnd || '';

  const [minutesLeft, setMinutesLeft] = useState(sessionLimit || null);
  const [expired, setExpired] = useState(false);
  const [bedtime, setBedtime] = useState(false);
  const startTime = useRef(Date.now());

  // Check bedtime on mount and every 30 seconds
  useEffect(() => {
    if (!bedtimeStart || !bedtimeEnd) {
      setBedtime(false);
      return;
    }

    function check() {
      setBedtime(isInBedtime(bedtimeStart, bedtimeEnd));
    }

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [bedtimeStart, bedtimeEnd]);

  // Session countdown
  useEffect(() => {
    if (!sessionLimit) {
      setMinutesLeft(null);
      setExpired(false);
      return;
    }

    startTime.current = Date.now();
    setExpired(false);
    setMinutesLeft(sessionLimit);

    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 60000);
      const remaining = sessionLimit - elapsed;
      setMinutesLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(id);
      }
    }, 15000); // check every 15 seconds

    return () => clearInterval(id);
  }, [sessionLimit]);

  const isLocked = expired || bedtime;
  const lockReason = bedtime ? 'bedtime' : expired ? 'timer' : null;

  return { minutesLeft, isLocked, lockReason };
}
