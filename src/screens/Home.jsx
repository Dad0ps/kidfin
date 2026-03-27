import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAllItems } from '../hooks/useJellyfin';
import Card from '../components/Card';
import Player from '../components/Player';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { currentProfile } = useApp();
  const { items, loading } = useAllItems();
  const [playingId, setPlayingId] = useState(null);

  if (!currentProfile) {
    navigate('/profiles');
    return null;
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
