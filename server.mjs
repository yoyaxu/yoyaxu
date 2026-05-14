import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import {
  assistedBetcrisLogin,
  closeBetcrisSession,
  fetchBetcrisPregameEvents,
  getBetcrisStatus,
} from './providers/betcris.mjs';

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

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(payload));
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

    if (req.method === 'OPTIONS') {
      writeJson(res, 204, {});
      return;
    }

    if (url.pathname === '/api/sportider/today-events') {
      const data = await fetchSportiderTodayEvents();
      writeJson(res, 200, { source: SPORTIDER_TODAY_EVENTS, fetchedAt: new Date().toISOString(), data });
      return;
    }

    if (url.pathname === '/api/betcris/status') {
      writeJson(res, 200, await getBetcrisStatus());
      return;
    }

    if (url.pathname === '/api/betcris/login' && req.method === 'POST') {
      const status = await assistedBetcrisLogin(await readJson(req));
      writeJson(res, 200, status);
      return;
    }

    if (url.pathname === '/api/betcris/pregame-events') {
      const result = await fetchBetcrisPregameEvents({ force: url.searchParams.get('force') === '1' });
      writeJson(res, 200, result);
      return;
    }

    if (url.pathname === '/api/betcris/logout' && req.method === 'POST') {
      writeJson(res, 200, await closeBetcrisSession());
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    const status = error.code === 'BAD_REQUEST' ? 400 : error.code === 'ENOENT' ? 404 : error.code === 'PLAYWRIGHT_MISSING' ? 501 : 500;
    writeJson(res, status, { error: error.message || 'Error interno', code: error.code || 'INTERNAL_ERROR' });
  }
}).listen(PORT, () => {
  console.log(`ApuestasPRO preview: http://localhost:${PORT}`);
});
