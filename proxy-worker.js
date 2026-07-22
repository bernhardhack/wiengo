/**
 * WienGo CORS proxy — Cloudflare Worker
 * -------------------------------------
 * wienerlinien.at sends no CORS headers, so browsers can't call it directly.
 * This worker forwards requests and adds them.
 *
 * Deploy (free, ~2 minutes):
 *   1. https://dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. Paste this file, Deploy
 *   3. Copy the worker URL (e.g. https://wiengo-proxy.you.workers.dev)
 *      into PROXY_URL at the top of wiengo-live.html
 *
 * Usage from the app:  {WORKER_URL}/?u=<url-encoded wienerlinien.at URL>
 */

const ALLOWED_HOSTS = new Set(['www.wienerlinien.at', 'wienerlinien.at', 'gbfs.nextbike.net']);

// Cache static open-data files for a day; realtime stays fresh.
const CACHEABLE = /\/ogd_realtime\/doku\/|station_information/;

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (request.method !== 'GET')
      return cors(new Response('GET only', { status: 405 }));

    const target = new URL(request.url).searchParams.get('u');
    if (!target) return cors(new Response('Missing ?u=', { status: 400 }));

    let url;
    try { url = new URL(target); } catch {
      return cors(new Response('Bad URL', { status: 400 }));
    }
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname))
      return cors(new Response('Host not allowed', { status: 403 }));

    const upstream = await fetch(url.toString(), {
      headers: { 'User-Agent': 'WienGo/1.0 (personal transit app)' },
      cf: CACHEABLE.test(url.pathname)
        ? { cacheTtl: 86400, cacheEverything: true }
        : { cacheTtl: 10, cacheEverything: true }, // brief cache softens rate limits
    });

    const res = new Response(upstream.body, upstream);
    return cors(res);
  },
};

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', '*');
  return res;
}
