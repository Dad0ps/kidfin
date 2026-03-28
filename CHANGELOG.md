# Changelog

All notable changes to KidFin are documented here.

## Version 1.0

### Features
- Jellyfin REST API integration (v10.8+) with admin authentication
- Single-pane poster grid with tap-to-play for movies
- Series detail view with episode list and thumbnails
- Collection (BoxSet) support -- tap to browse movies in a collection
- Full-screen HTML5 video player with play/pause, volume, and optional scrubbing
- HLS streaming for Safari/iOS, MP4 transcoding for Chrome/Firefox
- Closed captioning with CC track picker (SRT, VTT, ASS/SSA with tag cleanup)
- Autoplay next episode or collection item
- Playback reporting to Jellyfin (start, progress, stopped)
- PIN-protected parent dashboard (4-digit, rate-limited)
- Optional per-profile 2-digit PIN
- Per-profile library restrictions and age rating filters (G through TV-MA)
- Per-profile session time limits and bedtime cutoffs
- 14 avatar-mapped color themes with parent-overridable selection
- 3 font options per profile (Nunito, Atkinson Hyperlegible, OpenDyslexic)
- Per-profile text size slider (16px to 28px)
- Built-in update check with manual button and hourly auto-check
- PWA installable (standalone mode)
- Service worker for offline app shell caching
- Dockerized deployment with nginx and multi-stage build
- Interactive Proxmox LXC setup script
- Configurable port via environment variable

### Bug Fixes
- Fixed HLS endpoint for Safari/iOS streaming
- Fixed session timer timeout bug
- Fixed screen wake lock for video playback
- Fixed font scaling and layout scaling issues
- Fixed React hook dependency warnings
- Fixed profile PIN keypad input handling
- Removed broken watch history feature
- Removed dead code and stale references
- Stripped ASS/SSA formatting tags from subtitle display
- Replaced service worker update mechanism with version.json for HTTP compatibility
