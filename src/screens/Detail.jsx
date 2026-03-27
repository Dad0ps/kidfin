import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useItemDetail, useEpisodes } from '../hooks/useJellyfin';
import { getImageUrl } from '../api/jellyfin';
import Player from '../components/Player';
import { useApp } from '../context/AppContext';
import styles from './Detail.module.css';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { parentSettings } = useApp();
  const { item, loading } = useItemDetail(id);
  const isSeries = item?.Type === 'Series';
  const { episodes, loading: epLoading } = useEpisodes(isSeries ? id : null);
  const [playingId, setPlayingId] = useState(null);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.loading}>
        <p>Item not found</p>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const backdropUrl = getImageUrl(item.Id, 'Backdrop');
  const posterUrl = getImageUrl(item.Id, 'Primary');

  const seasonGroups = {};
  episodes.forEach((ep) => {
    const s = ep.ParentIndexNumber || 1;
    if (!seasonGroups[s]) seasonGroups[s] = [];
    seasonGroups[s].push(ep);
  });

  function handlePlayEpisode(epId) {
    setPlayingId(epId);
  }

  function findNextEpisode(currentId) {
    const idx = episodes.findIndex((ep) => ep.Id === currentId);
    if (idx >= 0 && idx < episodes.length - 1) {
      return episodes[idx + 1].Id;
    }
    return null;
  }

  function handleEnded() {
    if (parentSettings.autoplayNext) {
      const next = findNextEpisode(playingId);
      if (next) {
        setPlayingId(next);
        return;
      }
    }
    setPlayingId(null);
  }

  if (playingId) {
    return (
      <Player
        key={playingId}
        itemId={playingId}
        onExit={() => setPlayingId(null)}
        onEnded={handleEnded}
      />
    );
  }

  const overview = item.Overview
    ? item.Overview.length > 300
      ? item.Overview.slice(0, 300) + '...'
      : item.Overview
    : '';

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} style={{ backgroundImage: `url(${backdropUrl})` }}>
        <div className={styles.backdropOverlay} />
      </div>

      <button className={styles.backBtn} onClick={() => navigate('/home')}>
        ← Back
      </button>

      <div className={styles.detail}>
        <img src={posterUrl} alt={item.Name} className={styles.poster} />
        <div className={styles.info}>
          <h1 className={styles.title}>{item.Name}</h1>
          <div className={styles.meta}>
            {item.ProductionYear && <span>{item.ProductionYear}</span>}
            {item.OfficialRating && (
              <span className={styles.ratingBadge}>{item.OfficialRating}</span>
            )}
          </div>
          {overview && <p className={styles.overview}>{overview}</p>}
        </div>
      </div>

      <div className={styles.episodes}>
        {epLoading ? (
          <p className={styles.epLoading}>Loading episodes...</p>
        ) : (
          Object.entries(seasonGroups)
            .sort(([a], [b]) => a - b)
            .map(([season, eps]) => (
              <div key={season} className={styles.season}>
                <h2 className={styles.seasonTitle}>Season {season}</h2>
                <div className={styles.epList}>
                  {eps.map((ep) => (
                    <button
                      key={ep.Id}
                      className={styles.epCard}
                      onClick={() => handlePlayEpisode(ep.Id)}
                    >
                      <img
                        src={getImageUrl(ep.Id, 'Primary', { maxHeight: 120 })}
                        alt=""
                        className={styles.epThumb}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className={styles.epNumber}>E{ep.IndexNumber}</div>
                      <div className={styles.epInfo}>
                        <div className={styles.epName}>{ep.Name}</div>
                        {ep.Overview && (
                          <div className={styles.epOverview}>
                            {ep.Overview.length > 120
                              ? ep.Overview.slice(0, 120) + '...'
                              : ep.Overview}
                          </div>
                        )}
                      </div>
                      <div className={styles.epPlay}>▶</div>
                    </button>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
