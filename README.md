# WienGo — Live Setup

Two files, three steps.

## 1. Deploy the proxy (~2 min, free)

Browsers can't call `wienerlinien.at` directly (no CORS headers), so the app
routes everything through a tiny proxy you control.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Worker**
2. Paste the contents of `proxy-worker.js`, hit **Deploy**
3. Copy your worker URL, e.g. `https://wiengo-proxy.you.workers.dev`

The proxy only forwards to `wienerlinien.at` (host allowlist), caches the
static stop CSV for a day, and adds a 10-second cache on realtime calls to
stay well within polite request rates.

## 2. Configure the app

Open `wiengo-live.html` and set the constant at the top of the `<script>`:

```js
const PROXY_URL = 'https://wiengo-proxy.you.workers.dev';
```

## 3. Run it

- **On your phone / for GPS:** host the file anywhere with HTTPS
  (GitHub Pages, Netlify drop, Cloudflare Pages — drag & drop is enough).
  Geolocation requires a secure context, so `https://` is what makes the
  "follow along route" mode work on mobile.
- **Quick desktop test:** just open the file in a browser. Everything except
  geolocation may work from `file://` depending on the browser.

## What it uses

| Feature | Source |
|---|---|
| Stop directory | `wienerlinien-ogd-haltepunkte.csv` (open data, grouped by DIVA station ID, cached 7 days in the browser) |
| Live departures | `ogd_realtime/monitor?diva=…` — real countdowns, realtime vs. scheduled flag, disruption notices |
| Routing | `ogd_routing/XML_TRIP_REQUEST2` (EFA, JSON output) — up to 3 trips with realtime, incl. walking legs and geometry |
| Map | Leaflet + CARTO dark tiles |
| Your position | `navigator.geolocation.watchPosition` — nearest-stop pick, nearby chips, live dot, progress + next stop along the selected route |

No API key needed for any of it; Wiener Linien dropped the key requirement.
Data license: Stadt Wien / Wiener Linien, CC BY 4.0 (data.gv.at).

## Troubleshooting

- **Yellow "Setup needed" banner** → `PROXY_URL` is still empty.
- **"Could not reach the Wiener Linien API"** → open
  `{PROXY_URL}/?u=` + URL-encoded
  `https://www.wienerlinien.at/ogd_realtime/monitor?diva=60200657`
  in a browser tab. If that returns JSON, the proxy is fine and the issue is
  in the page (check the console). If not, redeploy the worker.
- **No routes found** → the EFA endpoint occasionally returns oddly shaped
  JSON; the parser is deliberately tolerant, but if a specific origin/
  destination pair reliably fails, tell me the pair and I'll adapt the parser.
- **GPS not working on phone** → make sure you're on `https://` and location
  permission is granted for the site.
