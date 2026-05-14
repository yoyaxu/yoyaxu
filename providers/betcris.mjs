const BETCRIS_URL = 'https://be.betcris.do/category/flat/FCE76739-FFAC-4FFC-94D0-EEEE19F837FB';
const SESSION_DIR = process.env.BETCRIS_SESSION_DIR || '.auth/betcris';
const READ_COOLDOWN_MS = Number(process.env.BETCRIS_READ_COOLDOWN_MS || 90_000);

let browserContext;
let page;
let lastReadAt = 0;
let lastStatus = {
  status: 'idle',
  message: 'Betcris no conectado',
  lastUpdated: '',
  eventsLoaded: 0,
};

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const error = new Error('Playwright no está instalado. Ejecuta `npm install` para habilitar login asistido de Betcris.');
    error.code = 'PLAYWRIGHT_MISSING';
    throw error;
  }
}

async function ensurePage() {
  if (page && !page.isClosed()) return page;

  const { chromium } = await loadPlaywright();
  browserContext = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: process.env.BETCRIS_HEADLESS === 'true',
    viewport: { width: 1440, height: 950 },
    locale: 'es-DO',
  });
  page = browserContext.pages()[0] || await browserContext.newPage();
  return page;
}

async function gotoBetcris() {
  const activePage = await ensurePage();
  await activePage.goto(BETCRIS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await activePage.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  return activePage;
}

async function fillFirstVisible(pageToUse, selectors, value) {
  for (const selector of selectors) {
    const locator = pageToUse.locator(selector).first();
    if (await locator.count().catch(() => 0)) {
      try {
        await locator.fill(value, { timeout: 3_000 });
        return true;
      } catch {}
    }
  }
  return false;
}

async function clickFirstVisible(pageToUse, selectors) {
  for (const selector of selectors) {
    const locator = pageToUse.locator(selector).first();
    if (await locator.count().catch(() => 0)) {
      try {
        await locator.click({ timeout: 3_000 });
        return true;
      } catch {}
    }
  }
  return false;
}

function mapStatus(status, message, eventsLoaded = 0) {
  lastStatus = {
    status,
    message,
    eventsLoaded,
    lastUpdated: new Date().toISOString(),
  };
  return lastStatus;
}

export async function getBetcrisStatus() {
  return lastStatus;
}

export async function assistedBetcrisLogin({ username, password } = {}) {
  if (!username || !password) {
    const error = new Error('Usuario y contraseña son requeridos para iniciar sesión en Betcris.');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const activePage = await gotoBetcris();

  await clickFirstVisible(activePage, [
    'button:has-text("Login")',
    'button:has-text("Ingresar")',
    'a:has-text("Login")',
    'a:has-text("Ingresar")',
  ]);

  const userFilled = await fillFirstVisible(activePage, [
    'input[name="username"]',
    'input[name="userName"]',
    'input[name="login"]',
    'input[type="email"]',
    'input[type="text"]',
  ], username);

  const passFilled = await fillFirstVisible(activePage, [
    'input[name="password"]',
    'input[type="password"]',
  ], password);

  if (!userFilled || !passFilled) {
    const error = new Error('No encontré los campos de login de Betcris. Abre la sesión manualmente y vuelve a intentar leer odds.');
    error.code = 'LOGIN_FORM_NOT_FOUND';
    mapStatus('login_required', error.message);
    throw error;
  }

  await clickFirstVisible(activePage, [
    'button[type="submit"]',
    'button:has-text("Ingresar")',
    'button:has-text("Login")',
    'button:has-text("Entrar")',
  ]);

  await activePage.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await activePage.waitForTimeout(2_000);

  return mapStatus('connected', 'Sesión Betcris iniciada o reutilizada. Lista para intentar lectura de odds.');
}

function americanFromText(value) {
  const match = String(value || '').match(/[+-]\d{2,4}/);
  return match ? Number(match[0]) : null;
}

function inferSport(league = '') {
  const text = league.toUpperCase();
  if (text.includes('NBA') || text.includes('BASKET')) return 'Baloncesto';
  if (text.includes('SOCCER') || text.includes('FUT') || text.includes('LIGA')) return 'Fútbol';
  if (text.includes('TENNIS') || text.includes('ATP') || text.includes('WTA')) return 'Tenis';
  if (text.includes('NHL') || text.includes('HOCKEY')) return 'Hockey';
  return 'Béisbol';
}

async function extractVisibleOdds(activePage) {
  return activePage.evaluate(() => {
    const text = document.body.innerText || '';
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const oddPattern = /^[+-]\d{2,4}$/;
    const rows = [];

    for (let index = 0; index < lines.length; index += 1) {
      if (!oddPattern.test(lines[index])) continue;
      const selection = lines[index - 1] || '';
      const eventName = [lines[index - 3], lines[index - 2]].filter(Boolean).join(' vs ');
      const league = lines.slice(Math.max(0, index - 8), index).find((line) => /MLB|NBA|NFL|NHL|Liga|Soccer|Tennis|ATP|WTA|Fútbol|Baseball/i.test(line)) || 'Betcris';
      if (selection && eventName) rows.push({ eventName, selection, league, odds: Number(lines[index]) });
    }

    return rows.slice(0, 200);
  });
}

export async function fetchBetcrisPregameEvents({ force = false } = {}) {
  const now = Date.now();
  if (!force && lastReadAt && now - lastReadAt < READ_COOLDOWN_MS) {
    return { status: lastStatus, events: [], throttled: true };
  }

  const activePage = await gotoBetcris();
  lastReadAt = now;

  const rows = await extractVisibleOdds(activePage);
  const grouped = new Map();

  for (const row of rows) {
    const key = `${row.league}::${row.eventName}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: `betcris-${key}`,
        sport: inferSport(row.league),
        league: `${row.league} pre-juego`,
        startsAt: 'Horario Betcris',
        event: row.eventName,
        selections: [],
      });
    }
    grouped.get(key).selections.push({
      name: row.selection,
      oddsBySite: { sportspick: null, sportider: null, juancito: null, betcris: row.odds },
    });
  }

  const events = [...grouped.values()].filter((event) => event.selections.length);
  mapStatus(events.length ? 'connected' : 'no_events', events.length ? `Betcris leído: ${events.length} eventos.` : 'Sesión abierta, pero no pude extraer eventos visibles de Betcris.', events.length);
  return { status: lastStatus, events };
}

export async function closeBetcrisSession() {
  if (browserContext) await browserContext.close().catch(() => {});
  browserContext = undefined;
  page = undefined;
  lastReadAt = 0;
  return mapStatus('idle', 'Sesión Betcris cerrada');
}
