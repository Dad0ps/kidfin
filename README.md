> **AI Disclaimer:** This project was generated with the assistance of Claude (Anthropic). All code, configuration, and documentation should be reviewed before production use.

# KidFin

**Version 1.0**

A kid-friendly web frontend for Jellyfin media servers. KidFin provides a simple, colorful interface where children can browse and watch content from a family Jellyfin instance without navigating the full Jellyfin UI. No backend required -- the browser talks directly to your Jellyfin server.

## Features

**Content**
- Connects to any standard Jellyfin server (v10.8+) via REST API
- Single-pane poster grid -- tap to play, no menus to navigate
- Movies play instantly on tap, series show an episode list with thumbnails
- Collections (BoxSets) open a detail view listing all movies in the collection
- Full-screen HTML5 video player with play/pause, volume, and optional scrubbing
- HLS streaming for Safari/iOS, MP4 transcoding for Chrome/Firefox with direct stream fallback
- Closed captioning support (text-based subtitles with ASS/SSA tag cleanup)
- Autoplay next episode or collection item (configurable)
- Playback reporting back to Jellyfin (resume, progress, stopped)

**Parental Controls**
- PIN-protected parent dashboard (4-digit, rate-limited: 5 attempts, 30-second lockout)
- Optional per-profile 2-digit PIN to prevent siblings from accessing each other's profiles
- New profiles default to G rating -- parents can raise it per profile
- Child profiles with per-profile library restrictions and age rating filters
- Per-profile session time limits (30min, 1hr, 1.5hr, 2hr, 3hr)
- Per-profile bedtime cutoff (from/to time, supports overnight spans)
- Bedtime enforced at profile select and during playback
- Session timer persists across page refresh
- Lockout screens for expired sessions and bedtime

**Accessibility**
- Closed captioning (CC) support -- text-based subtitle tracks (SRT, VTT, ASS/SSA) with automatic formatting tag cleanup
- CC track picker in the video player with per-track language labels
- Atkinson Hyperlegible font option -- designed by the Braille Institute for maximum character distinction
- OpenDyslexic font option -- designed to reduce letter swapping for readers with dyslexia
- Font selection is per-profile and configurable by the parent
- Per-profile text size slider (16px to 28px) with live preview for visually impaired users
- Minimum 16px text throughout the app, large touch targets, high contrast on dark background
- All fonts self-hosted (SIL Open Font License), no external dependencies

**Personalization**
- 14 avatar-mapped color themes (Unicorn, Puppy, Space, etc.)
- Parent-overridable theme per profile with live preview
- 3 font options per profile: Nunito (default), Atkinson Hyperlegible (easy read), OpenDyslexic (dyslexia friendly)
- Profile avatar ring colors match the active theme

**Privacy and Security**
- Zero outbound connections to third parties -- all traffic stays between the browser and your Jellyfin server
- Self-hosted fonts (Nunito, Atkinson Hyperlegible, OpenDyslexic), no external CDN
- Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and HSTS headers
- Dot-file access blocked in nginx
- Docker container runs with no-new-privileges and resource limits
- PIN-protected routes (direct URL navigation to parent dashboard requires PIN)

**Updates**
- Built-in update check compares the running app against the deployed version on the server
- Manual "Check for updates" button in the parent dashboard with status feedback
- Automatic hourly background check -- parents see a banner when an update is available
- No external connections -- checks `/version.json` on the same server KidFin is hosted on
- Works over plain HTTP (no service worker or HTTPS required)

**Deployment**
- Installable as a PWA (standalone mode, no browser URL bar)
- Dockerized with nginx (multi-stage build, pinned image versions)
- Interactive Proxmox LXC setup script with input sanitization
- Configurable port via environment variable
- Works on Chrome, Firefox, Safari, and iPad

## Tech Stack

- React 19 (Vite 8)
- React Router v7
- CSS Modules
- Jellyfin REST API
- nginx 1.27 (production serving via Docker)
- Node 20 (build only)

## Requirements

- A running Jellyfin server (v10.8+)
- A Jellyfin admin account for initial setup
- Docker and Docker Compose (for deployment)
- Node.js 20+ (for local development only)

## Deployment

### Docker (any Linux host)

```bash
git clone https://github.com/0xCoffeeCat/kidfin.git
cd kidfin
docker compose up -d --build
```

KidFin will be available at `http://your-server-ip:3000`.

To change the port:

```bash
KIDFIN_PORT=8080 docker compose up -d --build
```

Or create a `.env` file in the project root:

```
KIDFIN_PORT=8080
```

### Proxmox LXC

An interactive setup script is included that creates a dedicated LXC container, installs Docker, and deploys KidFin. Run it on your Proxmox host:

```bash
curl -sL https://raw.githubusercontent.com/0xCoffeeCat/kidfin/main/setup-lxc.sh | bash
```

Or clone first and run locally:

```bash
git clone https://github.com/0xCoffeeCat/kidfin.git
bash kidfin/setup-lxc.sh
```

The script prompts for all configuration (container ID, IP, gateway, port, resources) with sensible defaults. For non-interactive use, set variables beforehand:

```bash
CTID=210 IP=192.168.1.50/24 GATEWAY=192.168.1.1 KIDFIN_PORT=3000 bash setup-lxc.sh
```

### Bare metal / VM (no Docker)

```bash
git clone https://github.com/0xCoffeeCat/kidfin.git
cd kidfin
npm install
npm run build
```

Serve the `dist/` directory with any static file server (nginx, caddy, apache). An nginx config is included at `nginx.conf`.

### Reverse proxy

If running behind a reverse proxy (nginx, caddy, traefik), point it at KidFin's port. No WebSocket passthrough needed -- KidFin uses only standard HTTP requests.

```nginx
location / {
    proxy_pass http://kidfin-host:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Updating

```bash
cd kidfin
git pull
docker compose up -d --build
```

After rebuilding, connected clients will detect the new version automatically (within one hour) or manually via the "Check for updates" button in the parent dashboard.

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` by default.

## Initial Setup

1. Open KidFin in a browser
2. Enter your Jellyfin server URL (e.g. `http://192.168.1.10:8096`)
3. Enter Jellyfin admin credentials to authenticate
4. Use the parent dashboard (default PIN: `1234`) to create child profiles
5. Assign each profile an allowed library and maximum age rating
6. Configure session limits, bedtime, theme, and font per profile

## Project Structure

```
src/
  api/           # Jellyfin API client (auth, items, episodes, collections, streaming, subtitles)
  components/    # Card, Player, Modal, PinPad, ProfileCard
  screens/       # Setup, ProfileSelect, Home, Detail, ParentDashboard
  context/       # React context for app state (profiles, settings, PIN auth)
  hooks/         # useJellyfin (data fetching), useProfiles (CRUD), useSessionTimer, useUpdateCheck
  utils/         # ratings.js, storage.js, themes.js, fonts.js
  App.jsx        # Router and route definitions
  main.jsx       # Entry point and service worker registration
```

## Content Filtering

Each child profile can be restricted to a specific Jellyfin library and a maximum age rating. Rating enforcement order:

```
G < TV-Y < TV-Y7 < TV-G < TV-PG < PG < PG-13 < TV-14 < R < TV-MA
```

Items with no rating are treated as allowed (assumes the library is curated by the parent).

## Parent Dashboard

Accessible from the profile select screen or the home screen via PIN entry.

Profiles are displayed as expandable cards -- tap to expand and edit settings inline. All changes save instantly.

Per profile:
- Name, avatar, and color theme
- Optional 2-digit profile PIN (prevents siblings from accessing each other's profiles)
- Allowed Jellyfin library
- Max age rating (defaults to G, configurable up to TV-MA)
- Session time limit (30min to 3hr, or no limit)
- Bedtime cutoff (from/to time, supports overnight spans like 8PM-7AM)
- Font (Nunito, Atkinson Hyperlegible, OpenDyslexic)
- Text size (16px to 28px slider)

Global settings:
- Allow/disallow scrubbing in the video player
- Autoplay next episode on/off
- Check for updates
- Change parent PIN

## Security Notes

- All traffic goes directly from the browser to your Jellyfin server. No data is sent to any third party.
- Authentication tokens are stored in the browser's localStorage. This is standard for backend-less SPAs.
- The parent PIN is a child deterrent, not a security boundary. It is stored client-side. A user with access to browser developer tools can read or modify it.
- Video stream URLs include the API token as a query parameter. This is required because HTML5 video elements cannot use custom HTTP headers.
- Session timers and bedtime checks use the device clock. They cannot be enforced against a user who modifies the system time.
- The Docker container runs with no-new-privileges, resource limits (256MB, 0.5 CPU), and a healthcheck.
- Security headers configured in nginx: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Strict-Transport-Security.
- Dot-file access is blocked in nginx.
- The Proxmox setup script sanitizes all user input and does not use `eval()`.

## PWA Installation

When installed as a PWA, KidFin runs in standalone mode with no browser URL bar, back button, or address bar. This prevents children from navigating away from the app.

- iOS/iPadOS: Safari > Share > Add to Home Screen
- Android: Chrome > Menu > Add to Home Screen
- Desktop: Chrome/Edge will show an install icon in the address bar

## Known Limitations

- **Screen dimming on iPad/iOS:** iOS does not allow web apps to prevent the screen from dimming during video playback over HTTP. The Screen Wake Lock API requires HTTPS. If using KidFin on a dedicated iPad, set Auto-Lock to Never: Settings > Display & Brightness > Auto-Lock > Never.
- **Image-based subtitles (PGS/VOBSUB):** Browsers only support text-based subtitle formats. Image-based subtitles will not appear. If your media only has PGS subtitles, configure Jellyfin to burn them in via server-side transcoding.
- **Parental controls are client-side:** All restrictions (PIN, session limits, bedtime, content filtering) run in the browser. They are effective against young children but not against a user with developer tools access. For server-enforced restrictions, configure Jellyfin user permissions directly.

## License

This project is not currently licensed for redistribution. All rights reserved.
