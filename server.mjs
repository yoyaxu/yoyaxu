import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const SPORTIDER_TODAY_EVENTS = 'https://365.sportider.com/api/sportevent/today-events';
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

async function fetchSportiderTodayEvents() {
  const response = await fetch(SPORTIDER_TODAY_EVENTS, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ApuestasPRO/0.1 (+local operator odds comparator)',
    },
  });

  if (!response.ok) {
    throw new Error(`Sportider respondió ${response.status}`);
  }

  return response.json();
}

async function serveStatic(pathname, res) {
  const safePath = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(process.cwd(), safePath);
  const content = await readFile(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' });
  res.end(content);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/api/sportider/today-events') {
      const data = await fetchSportiderTodayEvents();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ source: SPORTIDER_TODAY_EVENTS, fetchedAt: new Date().toISOString(), data }));
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 500;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message || 'Error interno' }));
  }
}).listen(PORT, () => {
  console.log(`ApuestasPRO preview: http://localhost:${PORT}`);
});
