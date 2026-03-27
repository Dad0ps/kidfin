import { useRef, useEffect, useState, useCallback } from 'react';
import { getStreamUrl } from '../api/jellyfin';
import { reportPlaybackStart, reportPlaybackProgress, reportPlaybackStopped } from '../api/jellyfin';
import { useApp } from '../context/AppContext';
import { getServerUrl, getAccessToken } from '../utils/storage';
import styles from './Player.module.css';

function ticksFromSeconds(s) {
  return Math.round(s * 10000000);
}

function getDirectStreamUrl(itemId) {
  const serverUrl = getServerUrl().replace(/\/+$/, '');
  const token = getAccessToken();
  return `${serverUrl}/Videos/${itemId}/stream?static=true&api_key=${token}`;
}

export default function Player({ itemId, onExit, onEnded }) {
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const { parentSettings } = useApp();
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [triedFallback, setTriedFallback] = useState(false);

  const streamUrl = getStreamUrl(itemId);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {});
    reportPlaybackStart(itemId).catch(() => {});

    progressInterval.current = setInterval(() => {
      if (video && !video.paused) {
        reportPlaybackProgress(itemId, ticksFromSeconds(video.currentTime)).catch(() => {});
      }
    }, 10000);

    return () => {
      stopReporting();
      reportPlaybackStopped(itemId, ticksFromSeconds(video.currentTime)).catch(() => {});
    };
  }, [itemId, stopReporting]);

  function handleVideoError() {
    const video = videoRef.current;
    if (!triedFallback) {
      setTriedFallback(true);
      setError(null);
      if (video) {
        video.src = getDirectStreamUrl(itemId);
        video.load();
        video.play().catch(() => {});
      }
    } else {
      setError('Unable to play this video. The format may not be supported by your browser.');
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
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

  return (
    <div className={styles.player}>
      <video
        ref={videoRef}
        src={streamUrl}
        className={styles.video}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleVideoError}
        autoPlay
        playsInline
      />
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
