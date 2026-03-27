> **AI Disclaimer:** This project was generated with the assistance of Claude (Anthropic). All code, configuration, and documentation should be reviewed before production use.

# KidFin

**Version 0.001**

A kid-friendly web frontend for Jellyfin media servers. KidFin provides a simple, colorful interface where children can browse and watch content from a family Jellyfin instance without navigating the full Jellyfin UI.

## Features

- Connects to any standard Jellyfin server (v10.8+) via REST API
- Child profiles with per-profile library restrictions and age rating filters
- PIN-protected parent dashboard for managing profiles and settings
- Single-pane poster grid layout -- click to play, no menus to navigate
- Full-screen HTML5 video player with optional scrubbing and autoplay
- Playback reporting back to Jellyfin (resume, progress, stopped)
- Installable as a PWA (standalone mode, no browser URL bar)
- No backend required -- all data comes from Jellyfin and localStorage
- Zero outbound connections to third parties -- all traffic stays between the browser and your Jellyfin server
- Self-hosted font (Nunito) included, no external CDN dependencies

## Tech Stack

- React (Vite)
- React Router v6
- CSS Modules
- Jellyfin REST API
- nginx (production serving via Docker)

## Requirements

- A running Jellyfin server (v10.8+)
- A Jellyfin admin account for initial setup
- Docker and Docker Compose (for deployment)
- Node.js 20+ (for local development only)

## Quick Start (Docker)

```bash
git clone <repo-url> KidFin
cd KidFin
docker compose up -d --build
```

KidFin will be available at `http://your-server-ip:3000`.

To change the port, edit `docker-compose.yml` and update the `ports` mapping.

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

## Project Structure

```
src/
  api/           # Jellyfin API client
  components/    # Card, Shelf, Player, Modal, PinPad, ProfileCard
  screens/       # Setup, ProfileSelect, Home, Detail, ParentDashboard
  context/       # React context for app state
  hooks/         # Data fetching and profile management hooks
  utils/         # Rating comparison logic, localStorage helpers
  App.jsx        # Router and route definitions
  main.jsx       # Entry point
```

## Content Filtering

Each child profile can be restricted to a specific Jellyfin library and a maximum age rating. Rating enforcement order:

```
G < TV-Y < TV-Y7 < TV-G < TV-PG < PG < PG-13 < TV-14 < R < TV-MA
```

Items with no rating are treated as allowed (assumes the library is curated).

## Parent Dashboard

Accessible from the profile select screen via the parent button (PIN required).

- Add, edit, and delete child profiles
- Set allowed library and max age rating per profile
- Toggle scrubbing in the video player
- Toggle autoplay next episode
- Change parent PIN
- View watch history per profile

## Security Notes

- All traffic goes directly from the browser to your Jellyfin server. No data is sent to any third party.
- Authentication tokens are stored in the browser's localStorage. This is standard for backend-less SPAs.
- The parent PIN is a child deterrent, not a security boundary. It is stored client-side.
- Video stream URLs include the API token as a query parameter. This is required because HTML5 video elements cannot use custom HTTP headers. The Referrer-Policy header is set to limit leakage.
- The Docker container runs nginx as a non-root user with read-only filesystem and no-new-privileges.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) are configured in nginx.

## PWA Installation

When installed as a PWA, KidFin runs in standalone mode with no browser URL bar, back button, or address bar. This prevents children from navigating away.

- iOS/iPadOS: Safari > Share > Add to Home Screen
- Android: Chrome > Menu > Add to Home Screen
- Desktop: Chrome/Edge will show an install icon in the address bar

## License

This project is not currently licensed for redistribution. All rights reserved.
