const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const places = [
  { id: 'chai-code', name: 'The Chai & Code Cafe', category: 'cafe', distanceKm: 0.15, keywords: 'cafe coffee chai quiet study student discount menu', detail: 'BMSIT Main Gate · Cafe & student offers' },
  { id: 'smashzone', name: 'SmashZone Badminton Arena', category: 'sports', distanceKm: 0.8, keywords: 'badminton sports fitness court slots booking', detail: 'Avalahalli Main Road · Courts and sample slots' },
  { id: 'aval lake', name: 'Avalahalli Lake Bird Sanctuary & Walking Trail', category: 'outdoors', distanceKm: 1.2, keywords: 'lake outdoors walking trail hangout nature birds', detail: 'Near Singanayakanahalli Road · Walking trail' },
  { id: 'rmz-galleria', name: 'RMZ Galleria Mall & Supermart', category: 'shopping', distanceKm: 2.4, keywords: 'mall mart shopping groceries stores food court', detail: 'Yelahanka New Town · Stores and essentials' }
];
const posts = [
  { id: 'hackavalahalli', title: 'HackAvalahalli kickoff at The Chai & Code Cafe', category: 'Club Event', distanceKm: 0.15 },
  { id: 'smashzone-buddy', title: 'Anyone up for badminton at SmashZone today?', category: 'Collab / Buddy Up', distanceKm: 0.8 },
  { id: 'lake-walk', title: 'Saturday lake clean-up and evening walk', category: 'Community', distanceKm: 1.2 }
];
const analytics = { demo: true, business: 'Sample Business', period: 'Last 7 Days', metrics: { profileViews: 1284, offerSaves: 86, directionTaps: 143, offerClaims: 32 }, reach: [54, 73, 61, 103, 84, 125, 93] };
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function serveStatic(urlPath, res) {
  let requested = decodeURIComponent(urlPath);
  if (requested === '/') requested = '/index.html';
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) return send(res, 403, { error: 'Forbidden path' });
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, { error: 'Not found' });
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(res, 500, { error: 'Unable to read file' });
      send(res, 200, data, types[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    });
  });
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, service: 'LocalLoop demo API' });
  if (req.method === 'GET' && url.pathname === '/api/places') {
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();
    const radius = Math.max(0, Number(url.searchParams.get('radius') || 25));
    const category = (url.searchParams.get('category') || '').toLowerCase();
    const result = places.filter(p => p.distanceKm <= radius && (!category || p.category === category) && (!query || `${p.name} ${p.category} ${p.keywords} ${p.detail}`.toLowerCase().includes(query)));
    return send(res, 200, { demo: true, radiusKm: radius, count: result.length, places: result });
  }
  if (req.method === 'GET' && url.pathname === '/api/posts') return send(res, 200, { demo: true, posts });
  if (req.method === 'GET' && url.pathname === '/api/analytics') return send(res, 200, analytics);
  if (req.method !== 'GET') return send(res, 405, { error: 'This prototype API is read-only' });
  serveStatic(url.pathname, res);
});
server.listen(PORT, '127.0.0.1', () => console.log(`LocalLoop prototype running at http://127.0.0.1:${PORT}`));
