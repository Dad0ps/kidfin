import { useState, useEffect, useRef } from 'react';

function isInBedtime(bedtimeStart, bedtimeEnd) {
  if (!bedtimeStart || !bedtimeEnd) return false;

  const now = new Date();
  const [startH, startM] = bedtimeStart.split(':').map(Number);
  const [endH, endM] = bedtimeEnd.split(':').map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

export function useSessionTimer(profile) {
  const sessionLimit = profile?.sessionLimit || 0;
  const bedtimeStart = profile?.bedtimeStart || '';
  const bedtimeEnd = profile?.bedtimeEnd || '';

  const [minutesLeft, setMinutesLeft] = useState(sessionLimit || null);
  const [expired, setExpired] = useState(false);
  const [bedtime, setBedtime] = useState(() => isInBedtime(bedtimeStart, bedtimeEnd));
  const startTime = useRef(Date.now());

  // Check bedtime on mount and every 15 seconds
  useEffect(() => {
    if (!bedtimeStart || !bedtimeEnd) {
      setBedtime(false);
      return;
    }

    function check() {
      setBedtime(isInBedtime(bedtimeStart, bedtimeEnd));
    }

    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [bedtimeStart, bedtimeEnd]);

  // Session countdown — check every 5 seconds
  useEffect(() => {
    if (!sessionLimit) {
      setMinutesLeft(null);
      setExpired(false);
      return;
    }

    startTime.current = Date.now();
    setExpired(false);
    setMinutesLeft(sessionLimit);

    function tick() {
      const elapsedMs = Date.now() - startTime.current;
      const elapsedMin = elapsedMs / 60000;
      const remaining = sessionLimit - elapsedMin;
      setMinutesLeft(Math.max(0, Math.ceil(remaining)));
      if (remaining <= 0) {
        setExpired(true);
      }
    }

    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [sessionLimit]);

  // Compute isLocked with real-time check so there's no gap between
  // interval ticks where expired should be true but isn't yet
  let realtimeExpired = expired;
  if (sessionLimit && !expired) {
    const elapsedMs = Date.now() - startTime.current;
    if (elapsedMs >= sessionLimit * 60000) {
      realtimeExpired = true;
    }
  }

  const isLocked = realtimeExpired || bedtime;
  const lockReason = bedtime ? 'bedtime' : realtimeExpired ? 'timer' : null;

  return { minutesLeft, isLocked, lockReason };
}
