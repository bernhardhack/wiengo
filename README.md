# WienGo

Live Vienna public transport companion: real-time departures, route planning,
and on-map journey tracking. Built on Wiener Linien open data (no API key).

## Architecture

| Piece | Where it runs | File |
|---|---|---|
| App (single HTML file) | GitHub Pages | `index.html` |
| CORS proxy | Cloudflare Workers | `proxy-worker.js` → deployed at `https://wiengo.bernhard-hack.workers.dev` |

The proxy exists because wienerlinien.at sends no CORS headers, so browsers
can't call it directly. It only forwards to `wienerlinien.at` (host
allowlist), caches the static stop CSV for a day, and adds a 10-second cache
on realtime calls to keep request rates polite.

The proxy URL is baked into `index.html` (`PROXY_URL` constant at the top of
the script) — no configuration needed on deploy.

## Updating the app

1. Replace `index.html` with the new version
   (repo → **Add file → Upload files**, or `git add / commit / push`).
2. GitHub Pages redeploys automatically within a minute.
3. Hard-refresh on the phone — browsers cache aggressively.

If the proxy ever needs changing: edit the worker in the Cloudflare dashboard
(Workers & Pages → wiengo → Edit code), paste the new `proxy-worker.js`,
Deploy. The app only needs touching if the worker URL changes.

## Features

**Departures** — search any stop (or 📍 nearest / nearby chips), live
countdowns refreshed every 30 s, realtime vs. scheduled indicator, second
departure per line, active disruption notices.

**Route planning** — up to 3 realtime options from the Wiener Linien EFA
endpoint. From/To both accept 📍 My location; empty fields suggest the five
nearest stations on focus; ✕ clears a field. Each option card shows times,
duration, changes, and walking distances; tap the selected card to expand
per-leg details: line, **direction of travel** ("towards …"), boarding /
intermediate / alighting stops with times, stop count.

**Map** — route drawn with real geometry in official line colors, walking
legs dashed, intermediate stations as tappable dots, tap any stop name in
the details to pan to it, ⤢ expands the map for navigation. Journey mode
follows your GPS dot along the route with progress bar, next-station
readout, and an off-route distance warning.

## Data sources

| Feature | Source |
|---|---|
| Stop directory | `wienerlinien-ogd-haltepunkte.csv` (grouped by DIVA station ID, cached 7 days in the browser) |
| Live departures | `ogd_realtime/monitor?diva=…` |
| Routing | `ogd_routing/XML_TRIP_REQUEST2` (EFA, JSON output, realtime enabled) |
| Map | Leaflet + CARTO dark tiles |
| Position | `navigator.geolocation.watchPosition` (needs HTTPS — GitHub Pages provides it) |

License: Stadt Wien / Wiener Linien open data, CC BY 4.0 (data.gv.at).

## Troubleshooting

- **"Could not reach the Wiener Linien API"** → test the chain directly:
  `https://wiengo.bernhard-hack.workers.dev/?u=` + URL-encoded
  `https://www.wienerlinien.at/ogd_realtime/monitor?diva=60200657`
  JSON back = proxy fine, check the browser console. Error back = redeploy
  the worker.
- **Route expands but no intermediate stop list** → the EFA response omitted
  `stopSeq`; capture the raw JSON from the URL above (routing variant) for a
  parser fix.
- **GPS not working** → HTTPS + location permission granted for the site.
- **Old version still showing after update** → hard-refresh; Pages deploys
  can also take a minute or two.
