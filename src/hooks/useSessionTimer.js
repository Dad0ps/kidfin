import { useState, useEffect, useRef } from 'react';

const SESSION_START_KEY = 'kidfin_sessionStart';

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

function getSessionStart(profileId) {
  try {
    const data = JSON.parse(sessionStorage.getItem(SESSION_START_KEY));
    if (data && data.profileId === profileId) return data.time;
  } catch {}
  return null;
}

function setSessionStart(profileId) {
  const time = Date.now();
  sessionStorage.setItem(SESSION_START_KEY, JSON.stringify({ profileId, time }));
  return time;
}

export function useSessionTimer(profile) {
  const sessionLimit = profile?.sessionLimit || 0;
  const profileId = profile?.id || '';
  const bedtimeStart = profile?.bedtimeStart || '';
  const bedtimeEnd = profile?.bedtimeEnd || '';

  // Restore session start from sessionStorage, or create new
  const startTime = useRef(
    sessionLimit ? (getSessionStart(profileId) || setSessionStart(profileId)) : Date.now()
  );

  const [minutesLeft, setMinutesLeft] = useState(sessionLimit || null);
  const [expired, setExpired] = useState(false);
  const [bedtime, setBedtime] = useState(() => isInBedtime(bedtimeStart, bedtimeEnd));

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

    // Use existing start time (survives page refresh via sessionStorage)
    const existing = getSessionStart(profileId);
    if (existing) {
      startTime.current = existing;
    } else {
      startTime.current = setSessionStart(profileId);
    }

    function tick() {
      const elapsedMs = Date.now() - startTime.current;
      const elapsedMin = elapsedMs / 60000;
      const remaining = sessionLimit - elapsedMin;
      setMinutesLeft(Math.max(0, Math.ceil(remaining)));
      if (remaining <= 0) {
        setExpired(true);
      }
    }

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [sessionLimit, profileId]);

  // Real-time expiry check on every render
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
