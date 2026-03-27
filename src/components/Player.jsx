import { useRef, useEffect, useState, useCallback } from 'react';
import { getStreamUrl, getDirectStreamUrl, getItemById, getSubtitleUrl } from '../api/jellyfin';
import { reportPlaybackStart, reportPlaybackProgress, reportPlaybackStopped } from '../api/jellyfin';
import { useApp } from '../context/AppContext';
import styles from './Player.module.css';

function ticksFromSeconds(s) {
  return Math.round(s * 10000000);
}

export default function Player({ itemId, onExit, onEnded, userInitiated = false }) {
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const { parentSettings } = useApp();
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(!userInitiated);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [triedFallback, setTriedFallback] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [activeSubtitle, setActiveSubtitle] = useState(-1);
  const [showCCMenu, setShowCCMenu] = useState(false);

  const streamUrl = getStreamUrl(itemId);

  // Fetch subtitle tracks
  useEffect(() => {
    getItemById(itemId).then((item) => {
      if (!item?.MediaStreams) return;
      const subs = item.MediaStreams
        .filter((s) => s.Type === 'Subtitle')
        .map((s) => ({
          index: s.Index,
          language: s.DisplayTitle || s.Language || `Track ${s.Index}`,
          codec: s.Codec,
          isTextBased: ['srt', 'vtt', 'ass', 'ssa', 'subrip', 'webvtt'].includes((s.Codec || '').toLowerCase()),
        }));
      setSubtitles(subs);
    }).catch(() => {});
  }, [itemId]);

  const stopReporting = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const handleExit = useCallback(() => {
    const video = videoRef.current;
    stopReporting();
    if (video) {
      reportPlaybackStopped(itemId, ticksFromSeconds(video.currentTime)).catch(() => {});
    }
    onExit();
  }, [itemId, onExit, stopReporting]);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().then(() => {
      setPlaying(true);
      setWaiting(false);
      reportPlaybackStart(itemId).catch(() => {});

      if (!progressInterval.current) {
        progressInterval.current = setInterval(() => {
          if (video && !video.paused) {
            reportPlaybackProgress(itemId, ticksFromSeconds(video.currentTime)).catch(() => {});
          }
        }, 10000);
      }
    }).catch(() => {
      setWaiting(true);
      setPlaying(false);
    });
  }, [itemId]);

  // Keep screen awake during playback
  useEffect(() => {
    let wakeLock = null;
    let noSleepVideo = null;

    async function keepAwake() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          return;
        } catch {}
      }

      noSleepVideo = document.createElement('video');
      noSleepVideo.setAttribute('playsinline', '');
      noSleepVideo.setAttribute('webkit-playsinline', '');
      noSleepVideo.setAttribute('muted', '');
      noSleepVideo.muted = true;
      noSleepVideo.loop = true;
      noSleepVideo.style.position = 'fixed';
      noSleepVideo.style.top = '-1px';
      noSleepVideo.style.left = '-1px';
      noSleepVideo.style.width = '1px';
      noSleepVideo.style.height = '1px';
      noSleepVideo.style.opacity = '0.01';
      noSleepVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0AAAA1m1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2YzU4Ljk3';
      document.body.appendChild(noSleepVideo);
      noSleepVideo.play().catch(() => {});
    }

    keepAwake();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') keepAwake();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release().catch(() => {});
      if (noSleepVideo) {
        noSleepVideo.pause();
        noSleepVideo.remove();
      }
    };
  }, []);

  useEffect(() => {
    startPlayback();

    return () => {
      const video = videoRef.current;
      stopReporting();
      if (video) {
        reportPlaybackStopped(itemId, ticksFromSeconds(video.currentTime)).catch(() => {});
      }
    };
  }, [itemId, stopReporting, startPlayback]);

  // Apply subtitle track — fetch, clean ASS/SSA tags, and load as blob
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Remove existing tracks
    const existing = video.querySelectorAll('track');
    existing.forEach((t) => t.remove());

    let blobUrl = null;

    if (activeSubtitle >= 0) {
      const url = getSubtitleUrl(itemId, activeSubtitle);
      fetch(url)
        .then((res) => res.text())
        .then((vtt) => {
          // Strip ASS/SSA override tags like {\i1}, {\b0}, {\an8}, {\pos(x,y)}, etc.
          const cleaned = vtt.replace(/\{\\[^}]*\}/g, '');
          const blob = new Blob([cleaned], { type: 'text/vtt' });
          blobUrl = URL.createObjectURL(blob);

          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.src = blobUrl;
          track.default = true;
          video.appendChild(track);
          if (video.textTracks.length > 0) {
            video.textTracks[0].mode = 'showing';
          }
        })
        .catch(() => {});
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [activeSubtitle, itemId]);

  function handleSubtitleSelect(index) {
    setActiveSubtitle(index);
    setShowCCMenu(false);
  }

  function handleTapToPlay() {
    startPlayback();
  }

  function handleVideoError() {
    const video = videoRef.current;
    if (!triedFallback) {
      setTriedFallback(true);
      setError(null);
      if (video) {
        video.src = getDirectStreamUrl(itemId);
        video.load();
        video.play().then(() => {
          setPlaying(true);
          setWaiting(false);
        }).catch(() => {
          setWaiting(true);
        });
      }
    } else {
      setError('Unable to play this video. The format may not be supported by your browser.');
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function handleVolumeChange(e) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setError(null);
    }
  }

  function handlePlaying() {
    setPlaying(true);
    setWaiting(false);
  }

  function handleEnded() {
    stopReporting();
    reportPlaybackStopped(itemId, ticksFromSeconds(duration)).catch(() => {});
    if (onEnded) onEnded();
  }

  function handleScrub(e) {
    if (!parentSettings.allowScrubbing) return;
    const video = videoRef.current;
    if (video) {
      video.currentTime = parseFloat(e.target.value);
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const textSubtitles = subtitles.filter((s) => s.isTextBased);
  const hasSubtitles = textSubtitles.length > 0;

  return (
    <div className={styles.player} onClick={() => showCCMenu && setShowCCMenu(false)}>
      <video
        ref={videoRef}
        src={streamUrl}
        className={styles.video}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleVideoError}
        onPlaying={handlePlaying}
        playsInline
        webkit-playsinline=""
        crossOrigin="anonymous"
      />
      {waiting && !error && (
        <button className={styles.tapToPlay} onClick={handleTapToPlay}>
          <div className={styles.bigPlay}>▶</div>
          <div className={styles.tapText}>Tap to Play</div>
        </button>
      )}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button className="btn-primary" onClick={handleExit}>Go Back</button>
        </div>
      )}
      <div className={styles.controls}>
        <button className={styles.backBtn} onClick={handleExit}>
          ← Back
        </button>
        <button className={styles.playBtn} onClick={togglePlay}>
          {playing ? '⏸' : '▶'}
        </button>
        {parentSettings.allowScrubbing && (
          <div className={styles.scrubber}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleScrub}
              className={styles.scrubBar}
            />
            <span className={styles.time}>{formatTime(duration)}</span>
          </div>
        )}
        {hasSubtitles && (
          <div className={styles.ccWrap}>
            <button
              className={`${styles.ccBtn} ${activeSubtitle >= 0 ? styles.ccActive : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowCCMenu(!showCCMenu); }}
            >
              CC
            </button>
            {showCCMenu && (
              <div className={styles.ccMenu} onClick={(e) => e.stopPropagation()}>
                <button
                  className={`${styles.ccOption} ${activeSubtitle === -1 ? styles.ccOptionActive : ''}`}
                  onClick={() => handleSubtitleSelect(-1)}
                >
                  Off
                </button>
                {textSubtitles.map((sub) => (
                  <button
                    key={sub.index}
                    className={`${styles.ccOption} ${activeSubtitle === sub.index ? styles.ccOptionActive : ''}`}
                    onClick={() => handleSubtitleSelect(sub.index)}
                  >
                    {sub.language}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={styles.volumeWrap}>
          <span>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeBar}
          />
        </div>
      </div>
    </div>
  );
}
