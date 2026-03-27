import { getServerUrl, getAccessToken, getAdminUserId } from '../utils/storage';

function getAuthHeader() {
  const token = getAccessToken();
  return `MediaBrowser Token="${token}", Client="KidFin", Device="Browser", DeviceId="kidfin-web", Version="1.0.0"`;
}

async function apiFetch(path, options = {}) {
  const serverUrl = getServerUrl().replace(/\/+$/, '');
  const res = await fetch(`${serverUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': getAuthHeader(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Jellyfin API error: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function authenticateByName(serverUrl, username, password) {
  const url = serverUrl.replace(/\/+$/, '');
  const res = await fetch(`${url}/Users/AuthenticateByName`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="KidFin", Device="Browser", DeviceId="kidfin-web", Version="1.0.0"`,
    },
    body: JSON.stringify({ Username: username, Pw: password }),
  });
  if (!res.ok) {
    throw new Error('Authentication failed. Check your credentials and server URL.');
  }
  return res.json();
}

export async function getItems(params = {}) {
  const userId = getAdminUserId();
  const query = new URLSearchParams({
    Recursive: 'true',
    Fields: 'Overview,Genres,OfficialRating,PrimaryImageAspectRatio',
    ...params,
  });
  return apiFetch(`/Users/${userId}/Items?${query}`);
}

export async function getItemById(itemId) {
  const userId = getAdminUserId();
  return apiFetch(`/Users/${userId}/Items/${itemId}?Fields=MediaStreams,Overview,Genres,OfficialRating`);
}

export function getSubtitleUrl(itemId, subtitleIndex) {
  const serverUrl = getServerUrl().replace(/\/+$/, '');
  const token = getAccessToken();
  return `${serverUrl}/Videos/${itemId}/${itemId}/Subtitles/${subtitleIndex}/Stream.vtt?api_key=${token}`;
}

export async function getEpisodes(seriesId, params = {}) {
  const userId = getAdminUserId();
  const query = new URLSearchParams({
    userId,
    Fields: 'Overview,PrimaryImageAspectRatio',
    ...params,
  });
  return apiFetch(`/Shows/${seriesId}/Episodes?${query}`);
}

export async function getVirtualFolders() {
  return apiFetch('/Library/VirtualFolders');
}

export async function reportPlaybackStart(itemId, positionTicks = 0) {
  return apiFetch('/Sessions/Playing', {
    method: 'POST',
    body: JSON.stringify({ ItemId: itemId, PositionTicks: positionTicks }),
  });
}

export async function reportPlaybackProgress(itemId, positionTicks, isPaused = false) {
  return apiFetch('/Sessions/Playing/Progress', {
    method: 'POST',
    body: JSON.stringify({ ItemId: itemId, PositionTicks: positionTicks, IsPaused: isPaused }),
  });
}

export async function reportPlaybackStopped(itemId, positionTicks) {
  return apiFetch('/Sessions/Playing/Stopped', {
    method: 'POST',
    body: JSON.stringify({ ItemId: itemId, PositionTicks: positionTicks }),
  });
}

export function getImageUrl(itemId, type = 'Primary', params = {}) {
  const serverUrl = getServerUrl().replace(/\/+$/, '');
  const defaults = type === 'Primary' ? { maxHeight: 400 } : type === 'Backdrop' ? { maxWidth: 1280 } : {};
  const query = new URLSearchParams({ ...defaults, ...params });
  return `${serverUrl}/Items/${itemId}/Images/${type}?${query}`;
}

function isSafari() {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua);
}

export function getStreamUrl(itemId) {
  const serverUrl = getServerUrl().replace(/\/+$/, '');
  const token = getAccessToken();
  const userId = getAdminUserId();

  if (isSafari()) {
    // Safari/iOS: use Jellyfin's HLS endpoint
    const params = new URLSearchParams({
      api_key: token,
      DeviceId: 'kidfin-web',
      MediaSourceId: itemId,
      VideoCodec: 'h264',
      AudioCodec: 'aac',
      MaxStreamingBitrate: '20000000',
      TranscodingMaxAudioChannels: '2',
      SegmentContainer: 'ts',
      MinSegments: '1',
      BreakOnNonKeyFrames: 'true',
    });
    return `${serverUrl}/Videos/${itemId}/master.m3u8?${params}`;
  }

  // Chrome/Firefox/Edge: use direct stream with transcoding fallback
  const params = new URLSearchParams({
    api_key: token,
    Container: 'mp4,webm',
    VideoCodec: 'h264,h265,vp9',
    AudioCodec: 'aac,mp3,opus',
    MaxStreamingBitrate: '20000000',
    TranscodingContainer: 'mp4',
    TranscodingProtocol: 'http',
  });
  return `${serverUrl}/Videos/${itemId}/stream.mp4?${params}`;
}

export function getDirectStreamUrl(itemId) {
  const serverUrl = getServerUrl().replace(/\/+$/, '');
  const token = getAccessToken();
  return `${serverUrl}/Videos/${itemId}/stream?static=true&api_key=${token}`;
}
