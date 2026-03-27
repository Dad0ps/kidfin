import { useState, useRef } from 'react';
import styles from './PinPad.module.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function PinPad({ onSubmit, onCancel, title = 'Enter Parent PIN' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const attempts = useRef(0);
  const lockTimer = useRef(null);

  function startLockout() {
    setLocked(true);
    setLockCountdown(LOCKOUT_SECONDS);
    lockTimer.current = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(lockTimer.current);
          setLocked(false);
          attempts.current = 0;
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleDigit(d) {
    if (locked || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      const ok = onSubmit(next);
      if (ok === false) {
        attempts.current += 1;
        if (attempts.current >= MAX_ATTEMPTS) {
          setError(`Too many attempts. Wait ${LOCKOUT_SECONDS}s.`);
          setPin('');
          startLockout();
        } else {
          setError(`Wrong PIN (${MAX_ATTEMPTS - attempts.current} tries left)`);
          setPin('');
        }
      }
    }
  }

  function handleDelete() {
    if (locked) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.pad} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${styles.dot} ${i < pin.length ? styles.filled : ''}`} />
          ))}
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {locked && <div className={styles.lockout}>Locked for {lockCountdown}s</div>}
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
            <button
              key={i}
              className={`${styles.key} ${key === null ? styles.empty : ''}`}
              onClick={() => {
                if (key === 'del') handleDelete();
                else if (key !== null) handleDigit(String(key));
              }}
              disabled={key === null || locked}
            >
              {key === 'del' ? '⌫' : key}
            </button>
          ))}
        </div>
        <button className={styles.cancel} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
