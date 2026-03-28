import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useItemDetail, useEpisodes, useCollectionItems } from '../hooks/useJellyfin';
import { getImageUrl } from '../api/jellyfin';
import Player from '../components/Player';
import { useApp } from '../context/AppContext';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { applyTheme, getThemeForProfile } from '../utils/themes';
import { applyFont, applyFontSize } from '../utils/fonts';
import styles from './Detail.module.css';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { parentSettings, currentProfile } = useApp();
  const { minutesLeft, isLocked, lockReason } = useSessionTimer(currentProfile);
  const { item, loading, error } = useItemDetail(id);
  const isSeries = item?.Type === 'Series';
  const isCollection = item?.Type === 'BoxSet';
  const { episodes, loading: epLoading } = useEpisodes(isSeries ? id : null);
  const { items: collectionItems, loading: colLoading } = useCollectionItems(isCollection ? id : null);
  const [playingId, setPlayingId] = useState(null);
  const [nextUp, setNextUp] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (currentProfile) {
      applyTheme(getThemeForProfile(currentProfile));
      if (currentProfile.font) applyFont(currentProfile.font);
      if (currentProfile.fontSize) applyFontSize(currentProfile.fontSize);
    }
  }, [currentProfile]);

  if (!currentProfile) {
    return (
      <div className={styles.loading}>
        <p style={{ color: 'white', fontSize: 20 }}>No profile selected</p>
        <button className="btn-primary" onClick={() => navigate('/profiles')}>Go Back</button>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className={styles.loading}>
        <div style={{ fontSize: 96 }}>
          {lockReason === 'bedtime' ? '🌙' : '⏰'}
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900 }}>
          {lockReason === 'bedtime' ? 'Time for Bed!' : "Time's Up!"}
        </h1>
        <p style={{ fontSize: 20, color: 'var(--text-secondary)' }}>
          {lockReason === 'bedtime'
            ? "It's bedtime now. Come back tomorrow!"
            : "You've used all your screen time for this session."}
        </p>
        <button className="btn-primary" onClick={() => navigate('/profiles')}>
          Back to Profiles
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.loading}>
        <p style={{ fontSize: 20, color: 'var(--text-primary)' }}>
          {error || 'Item not found'}
        </p>
        <button className="btn-primary" onClick={() => navigate('/home')}>Go Back</button>
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

  const playableList = isCollection ? collectionItems : episodes;

  function findNextItem(currentId) {
    const idx = playableList.findIndex((i) => i.Id === currentId);
    if (idx >= 0 && idx < playableList.length - 1) {
      return playableList[idx + 1].Id;
    }
    return null;
  }

  const cancelAutoplay = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setNextUp(null);
    setCountdown(0);
    setPlayingId(null);
  }, []);

  const skipToNext = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const next = nextUp;
    setNextUp(null);
    setCountdown(0);
    if (next) setPlayingId(next);
  }, [nextUp]);

  function handleEnded() {
    if (parentSettings.autoplayNext) {
      const next = findNextItem(playingId);
      if (next) {
        setPlayingId(null);
        setNextUp(next);
        setCountdown(10);
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(countdownRef.current);
              setNextUp(null);
              setPlayingId(next);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
        return;
      }
    }
    setPlayingId(null);
  }

  if (nextUp && !playingId) {
    return (
      <div className={styles.autoplayOverlay}>
        <div className={styles.autoplayText}>Next up in {countdown}...</div>
        <div className={styles.autoplayActions}>
          <button className="btn-primary" onClick={skipToNext}>Play Now</button>
          <button className="btn-secondary" onClick={cancelAutoplay}>Stop</button>
        </div>
      </div>
    );
  }

  if (playingId) {
    return (
      <Player
        key={playingId}
        itemId={playingId}
        onExit={() => setPlayingId(null)}
        userInitiated
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
        {isCollection ? (
          colLoading ? (
            <p className={styles.epLoading}>Loading movies...</p>
          ) : (
            <div className={styles.epList}>
              {collectionItems.map((movie) => (
                <button
                  key={movie.Id}
                  className={styles.epCard}
                  onClick={() => handlePlayEpisode(movie.Id)}
                >
                  <img
                    src={getImageUrl(movie.Id, 'Primary', { maxHeight: 120 })}
                    alt=""
                    className={styles.epThumb}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className={styles.epInfo}>
                    <div className={styles.epName}>{movie.Name}</div>
                    {movie.ProductionYear && (
                      <div className={styles.epOverview}>{movie.ProductionYear}</div>
                    )}
                  </div>
                  <div className={styles.epPlay}>▶</div>
                </button>
              ))}
            </div>
          )
        ) : (
          epLoading ? (
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
                          onError={(e) => {
                            if (!e.target.dataset.fallback) {
                              e.target.dataset.fallback = '1';
                              e.target.src = getImageUrl(ep.Id, 'Thumb', { maxHeight: 120 });
                            } else {
                              e.target.style.display = 'none';
                            }
                          }}
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
          )
        )}
      </div>
    </div>
  );
}
