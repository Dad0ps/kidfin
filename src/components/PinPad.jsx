import { useState } from 'react';
import styles from './PinPad.module.css';

export default function PinPad({ onSubmit, onCancel, title = 'Enter Parent PIN' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      const ok = onSubmit(next);
      if (ok === false) {
        setError('Wrong PIN');
        setPin('');
      }
    }
  }

  function handleDelete() {
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
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
            <button
              key={i}
              className={`${styles.key} ${key === null ? styles.empty : ''}`}
              onClick={() => {
                if (key === 'del') handleDelete();
                else if (key !== null) handleDigit(String(key));
              }}
              disabled={key === null}
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
