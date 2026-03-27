import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAllItems } from '../hooks/useJellyfin';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { applyTheme, getThemeForProfile } from '../utils/themes';
import { applyFont } from '../utils/fonts';
import Card from '../components/Card';
import Player from '../components/Player';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { currentProfile } = useApp();
  const { items, loading } = useAllItems();
  const { minutesLeft, isLocked, lockReason } = useSessionTimer(currentProfile);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    if (currentProfile) {
      applyTheme(getThemeForProfile(currentProfile));
      if (currentProfile.font) applyFont(currentProfile.font);
    }
  }, [currentProfile]);

  if (!currentProfile) {
    navigate('/profiles');
    return null;
  }

  if (isLocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockIcon}>
          {lockReason === 'bedtime' ? '🌙' : '⏰'}
        </div>
        <h1 className={styles.lockTitle}>
          {lockReason === 'bedtime' ? 'Time for Bed!' : 'Time\'s Up!'}
        </h1>
        <p className={styles.lockText}>
          {lockReason === 'bedtime'
            ? `It's bedtime now. Come back tomorrow!`
            : `You've used all your screen time for this session.`}
        </p>
        <button className="btn-primary" onClick={() => navigate('/profiles')}>
          Back to Profiles
        </button>
      </div>
    );
  }

  function handleCardClick(item) {
    if (item.Type === 'Series') {
      navigate(`/detail/${item.Id}`);
    } else {
      setPlayingId(item.Id);
    }
  }

  if (playingId) {
    return (
      <Player
        itemId={playingId}
        onExit={() => setPlayingId(null)}
        onEnded={() => setPlayingId(null)}
        userInitiated
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.avatar}>{currentProfile.avatar || '😊'}</span>
          <span className={styles.name}>{currentProfile.name}</span>
          {minutesLeft !== null && (
            <span className={styles.timer}>
              {minutesLeft}m left
            </span>
          )}
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/profiles')}>
          Switch Profile
        </button>
      </header>

      <main className={styles.grid}>
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))
          : items.map((item) => (
              <Card key={item.Id} item={item} onClick={() => handleCardClick(item)} />
            ))}
        {!loading && items.length === 0 && (
          <p className={styles.empty}>Nothing here yet!</p>
        )}
      </main>
    </div>
  );
}
