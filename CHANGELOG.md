# Changelog

All notable changes to KidFin are documented here.

## Version 1.02

### Features
- Collection (BoxSet) support -- tap a collection to browse and play its movies
- Built-in update check with manual button and hourly auto-check via version.json
- Build timestamp and version number displayed in parent dashboard
- Disconnect from Jellyfin button in parent dashboard (preserves profiles)
- Clear All Profiles button with confirmation
- Delete profile now requires confirmation
- Parent PIN setup step added to initial setup flow with default PIN disclosure
- Session timer pulses red when 5 minutes or less remain
- Autoplay countdown between episodes with Play Now and Stop buttons
- Bedtime rejection is now a full-screen overlay with a dismiss button
- Loading state shows "Finding your shows..." text above skeleton grid
- Subtitle menu now has a "Subtitles" label for clarity

### Fixes
- Fixed React hooks ordering in Detail screen that caused a crash when navigating to series or collections
- Service worker cache name now auto-generated per build, preventing stale cached assets from breaking updates
- PIN setup skip button no longer blocked by form validation
- Removed HSTS header that forced HTTPS after first visit, breaking HTTP-only deployments
- Fixed parent dashboard re-locking when background actions triggered re-renders
- Player error message changed to kid-friendly language
- Empty library message now says "Ask a grown-up to add shows for you!"
- PIN lockout messages rewritten to be friendlier
- Parent button renamed to "Parent Settings" to avoid confusion
- Edit Profile button de-emphasized to prevent accidental taps by kids

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
