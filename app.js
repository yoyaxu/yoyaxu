const currency = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const navItems = [
  { key: 'dashboard', label: 'Panel', icon: '📊' },
  { key: 'compare', label: 'Comparador', icon: '⚖️' },
  { key: 'clients', label: 'Clientes', icon: '👥' },
  { key: 'bets', label: 'Jugadas', icon: '🎫' },
  { key: 'transactions', label: 'Resultados', icon: '💳' },
];
const bettingSites = [
  { key: 'sportspick', name: 'SportsPick / Fórmula 43', short: 'SportsPick', url: 'https://sportspick.site/app-sports/#/sportsbook/odds', color: '#ff8a00', access: 'Login manual' },
  { key: 'sportider', name: 'Sportider 365', short: '365', url: 'https://365.sportider.com/', color: '#31a8ff', access: 'Automático si endpoint público responde' },
  { key: 'juancito', name: 'Juancito Sport', short: 'Juancito', url: 'https://www.juancitosport.com.do/', color: '#20d47b', access: 'Login manual' },
  { key: 'betcris', name: 'Betcris', short: 'Betcris', url: 'https://www.betcris.do/', color: '#ef233c', access: 'API pagada o login manual' },
];
const state = {
  section: 'dashboard',
  sport: 'Todos',
  compareStake: 100,
  clientReferenceSite: 'juancito',
  betMode: 'single',
  parlayLegs: [],
  dataSource: 'Datos demo hasta cargar Sportider',
  isLoadingOdds: false,
  oddsError: '',
  lastUpdated: '',
  clients: [
    { id: 1, name: 'Jonathan Pérez', phone: '809-555-1122', balance: 850, status: 'Activo' },
    { id: 2, name: 'María Núñez', phone: '829-555-3344', balance: 320, status: 'Activo' },
    { id: 3, name: 'Carlos Díaz', phone: '849-555-7788', balance: 0, status: 'Pausado' },
  ],
  bets: [
    {
      id: 1,
      clientId: 1,
      sport: 'Béisbol',
      league: 'MLB',
      event: 'Yankees vs Red Sox',
      selection: 'Yankees ML',
      clientStake: 100,
      clientOdds: 213,
      recommendedSite: 'Sportider 365',
      bookSite: 'Sportider 365',
      bookOdds: 336,
      status: 'Pendiente',
      placementStatus: 'Colocada manualmente',
      createdAt: 'Hoy 2:45 PM',
      comparisonSnapshot: [
        { siteKey: 'sportspick', site: 'SportsPick', odds: 260 },
        { siteKey: 'sportider', site: 'Sportider 365', odds: 336 },
        { siteKey: 'juancito', site: 'Juancito Sport', odds: 213 },
        { siteKey: 'betcris', site: 'Betcris', odds: 245 },
      ],
    },
  ],
  prematchEvents: [
    {
      id: 101,
      sport: 'Béisbol',
      league: 'MLB pre-juego',
      startsAt: 'Hoy 8:30 PM',
      event: 'Yankees vs Red Sox',
      selections: [
        { name: 'Yankees ML', oddsBySite: { sportspick: 260, sportider: 336, juancito: 213, betcris: 245 } },
        { name: 'Red Sox ML', oddsBySite: { sportspick: -115, sportider: -105, juancito: -125, betcris: -110 } },
      ],
    },
    {
      id: 103,
      sport: 'Baloncesto',
      league: 'NBA pre-juego',
      startsAt: 'Viernes 9:00 PM',
      event: 'Celtics vs Knicks',
      selections: [
        { name: 'Celtics -4.5', oddsBySite: { sportspick: -110, sportider: -102, juancito: -115, betcris: -108 } },
        { name: 'Knicks +4.5', oddsBySite: { sportspick: -105, sportider: 100, juancito: -110, betcris: -103 } },
        { name: 'Más de 214.5', oddsBySite: { sportspick: 115, sportider: 121, juancito: 105, betcris: 112 } },
      ],
    },
    {
      id: 104,
      sport: 'Fútbol',
      league: 'LaLiga pre-juego',
      startsAt: 'Domingo 4:25 PM',
      event: 'Real Madrid vs Valencia',
      selections: [
        { name: 'Real Madrid', oddsBySite: { sportspick: -160, sportider: -145, juancito: -170, betcris: -155 } },
        { name: 'Empate', oddsBySite: { sportspick: 310, sportider: 325, juancito: 295, betcris: 305 } },
        { name: 'Valencia', oddsBySite: { sportspick: 510, sportider: 540, juancito: 480, betcris: 500 } },
      ],
    },
  ],
};
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const sportIcon = (sport) => ({ Béisbol: '⚾', Baloncesto: '🏀', Fútbol: '⚽', Tenis: '🎾', Todos: '🏟️' }[sport] || '🏅');
const siteByKey = (key) => bettingSites.find((site) => site.key === key);
const clientName = (id) => state.clients.find((client) => client.id === Number(id))?.name || 'Cliente eliminado';
const statusClass = (status) => status === 'Ganada' ? 'status won' : status === 'Perdida' ? 'status lost' : 'status pending';
const formatOdds = (odds) => Number.isFinite(Number(odds)) ? `${Number(odds) > 0 ? '+' : ''}${Number(odds)}` : '—';
const parseAmericanOdds = (value) => {
  const clean = String(value ?? '').trim().replace('+', '');
  if (!clean || clean === '—') return null;
  const odds = Number(clean);
  return Number.isFinite(odds) && odds !== 0 ? odds : null;
};
const toAmericanNumber = (value) => parseAmericanOdds(value);
const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || 'Horario pendiente');
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santo_Domingo' }).format(date);
};
const sportFromLeague = (leagueName = '') => {
  const league = leagueName.toUpperCase();
  if (league.includes('NBA') || league.includes('BASKET')) return 'Baloncesto';
  if (league.includes('NHL') || league.includes('HOCKEY')) return 'Hockey';
  if (league.includes('SOCCER') || league.includes('FUT') || league.includes('LIGA')) return 'Fútbol';
  if (league.includes('TENNIS') || league.includes('ATP') || league.includes('WTA')) return 'Tenis';
  return 'Béisbol';
};
const emptyOddsBySite = () => Object.fromEntries(bettingSites.map((site) => [site.key, null]));
function buildSelection(name, sportiderOdds) {
  return { name, oddsBySite: { ...emptyOddsBySite(), sportider: toAmericanNumber(sportiderOdds) } };
}
function normalizeSportiderEvents(payload) {
  const rawEvents = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.events) ? payload.events : [];
  return rawEvents
    .filter((event) => !event.hasStarted && Array.isArray(event.gameLine) && event.gameLine.length > 0)
    .map((event) => {
      const fullGame = event.gameLine.find((line) => line?.name === 'Full-Game') || event.gameLine[0] || {};
      const selections = [
        buildSelection(`${event.awayName || event.awayShortName || 'Visitante'} ML`, fullGame.awayMoney),
        buildSelection(`${event.homeName || event.homeShortName || 'Casa'} ML`, fullGame.homeMoney),
      ];

      if (fullGame.awayRunLine && fullGame.awayRunLinePrice) selections.push(buildSelection(`${event.awayShortName || event.awayName} ${fullGame.awayRunLine}`, fullGame.awayRunLinePrice));
      if (fullGame.homeRunLine && fullGame.homeRunLinePrice) selections.push(buildSelection(`${event.homeShortName || event.homeName} ${fullGame.homeRunLine}`, fullGame.homeRunLinePrice));
      if (fullGame.points && fullGame.priceOver) selections.push(buildSelection(`Más de ${fullGame.points}`, fullGame.priceOver));
      if (fullGame.points && fullGame.priceUnder) selections.push(buildSelection(`Menos de ${fullGame.points}`, fullGame.priceUnder));

      return {
        id: `sportider-${event.eventId}`,
        sport: sportFromLeague(event.leagueName || event.name),
        league: `${event.leagueName || 'Sportider'} pre-juego`,
        startsAt: formatDateTime(event.date),
        event: `${event.awayName || event.awayShortName || 'Visitante'} vs ${event.homeName || event.homeShortName || 'Casa'}`,
        selections: selections.filter((selection) => Number.isFinite(Number(selection.oddsBySite.sportider))),
      };
    })
    .filter((event) => event.selections.length > 0);
}
async function loadRealSportiderEvents() {
  state.isLoadingOdds = true;
  state.oddsError = '';
  render();

  const sources = ['/api/sportider/today-events', 'https://365.sportider.com/api/sportevent/today-events'];
  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${source} respondió ${response.status}`);
      const payload = await response.json();
      const events = normalizeSportiderEvents(payload.data || payload);
      if (!events.length) throw new Error('Sportider respondió sin juegos pre-juego disponibles');
      state.prematchEvents = events;
      state.dataSource = source.includes('/api/') ? 'Sportider 365 vía proxy local' : 'Sportider 365 directo';
      state.lastUpdated = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });
      state.oddsError = '';
      state.isLoadingOdds = false;
      render();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  state.isLoadingOdds = false;
  state.oddsError = `No pude cargar Sportider desde este entorno: ${lastError?.message || 'error desconocido'}. Puedes usar entrada manual para Juancito/SportsPick/Betcris.`;
  render();
}

function americanOddsProfit(amount, americanOdds) {
  const odds = Number(americanOdds);
  if (!Number.isFinite(odds) || odds === 0) return 0;
  return odds > 0 ? amount * (odds / 100) : amount * (100 / Math.abs(odds));
}
function americanOddsPayout(amount, americanOdds) {
  return Number(amount || 0) + americanOddsProfit(Number(amount || 0), americanOdds);
}
function americanToDecimal(americanOdds) {
  const odds = Number(americanOdds);
  if (!Number.isFinite(odds) || odds === 0) return 1;
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}
function bestSiteForSelection(selection) {
  const entries = bettingSites
    .map((site) => ({ ...site, odds: selection.oddsBySite[site.key] }))
    .filter((entry) => Number.isFinite(Number(entry.odds)));
  return entries.sort((a, b) => americanOddsPayout(state.compareStake, b.odds) - americanOddsPayout(state.compareStake, a.odds))[0];
}
function clientOddsForSelection(selection) {
  return Number.isFinite(Number(selection.oddsBySite[state.clientReferenceSite])) ? selection.oddsBySite[state.clientReferenceSite] : bestSiteForSelection(selection)?.odds ?? 100;
}
function recommendationForSelection(selection) {
  const best = bestSiteForSelection(selection);
  const clientOdds = clientOddsForSelection(selection);
  const clientPayout = americanOddsPayout(state.compareStake, clientOdds);
  const bookPayout = best ? americanOddsPayout(state.compareStake, best.odds) : clientPayout;
  return { best, clientOdds, clientPayout, bookPayout, companyProfit: bookPayout - clientPayout };
}
function getSelection(eventId, index) {
  const event = state.prematchEvents.find((item) => item.id === Number(eventId));
  return { event, selection: event?.selections[Number(index)] };
}
function parlayKey(eventId, selectionIndex) {
  return `${eventId}:${selectionIndex}`;
}
function selectedParlayLegs() {
  return state.parlayLegs.map((key) => {
    const [eventId, selectionIndex] = key.split(':');
    return getSelection(eventId, selectionIndex);
  }).filter((leg) => leg.event && leg.selection);
}
function calculateParlay() {
  const legs = selectedParlayLegs();
  if (legs.length < 2) return null;
  const rows = bettingSites.map((site) => {
    const decimals = legs.map(({ selection }) => selection.oddsBySite[site.key]).filter((odds) => Number.isFinite(Number(odds))).map(americanToDecimal);
    if (decimals.length !== legs.length) return null;
    const combinedDecimal = decimals.reduce((product, decimal) => product * decimal, 1);
    return { site, combinedDecimal, payout: state.compareStake * combinedDecimal };
  }).filter(Boolean).sort((a, b) => b.payout - a.payout);
  const reference = rows.find((row) => row.site.key === state.clientReferenceSite) ?? rows[0];
  const best = rows[0];
  return { legs, rows, reference, best, companyProfit: best.payout - reference.payout };
}

function setSection(section) {
  state.section = section;
  render();
}
function renderNav() {
  const navHtml = navItems.map((item) => `
    <button class="${state.section === item.key ? 'active' : ''}" data-section="${item.key}">
      <span>${item.icon}</span><small>${item.label}</small>
    </button>`).join('');
  $('#desktopNav').innerHTML = navHtml;
  $('#mobileNav').innerHTML = navHtml;
  document.querySelectorAll('#desktopNav [data-section], #mobileNav [data-section]').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
}
function render() {
  renderNav();
  $('#pageTitle').textContent = navItems.find((item) => item.key === state.section)?.label || 'Panel';
  const views = { dashboard: dashboardView, compare: compareView, clients: clientsView, bets: betsView, transactions: transactionsView };
  $('#viewRoot').innerHTML = views[state.section]();
  bindViewEvents();
}
function dashboardView() {
  const pending = state.bets.filter((bet) => bet.status === 'Pendiente');
  const balance = state.clients.reduce((sum, client) => sum + client.balance, 0);
  const activeClients = state.clients.filter((client) => client.status === 'Activo').length;
  const companyProfit = state.bets.reduce((sum, bet) => sum + companyProfitForBet(bet), 0);
  const topOpportunities = state.prematchEvents.flatMap((event) => event.selections.map((selection, index) => ({ event, selection, index, rec: recommendationForSelection(selection) }))).sort((a, b) => b.rec.companyProfit - a.rec.companyProfit).slice(0, 3);
  return `
    <section class="page-grid">
      <article class="hero-card">
        <div><p class="eyebrow">Comparador pre-juego</p><h2>Compara cuotas americanas en una sola pantalla y decide dónde conviene colocar la jugada.</h2><p>El encargado entra manualmente a la casa recomendada con su usuario; el sistema solo compara, registra y calcula utilidad.</p></div>
        <button class="hero-action" data-section="compare">Comparar ahora</button>
      </article>
      <div class="stats-grid">${stat('💰', 'Saldo clientes', currency.format(balance))}${stat('👥', 'Clientes activos', activeClients)}${stat('⚖️', 'Oportunidades', state.prematchEvents.length)}${stat('🏦', 'Utilidad registrada', currency.format(companyProfit))}</div>
      <section class="two-column"><section class="panel"><header><h2>Mejores oportunidades</h2><button data-section="compare">Ver comparador</button></header><div class="cards-list">${topOpportunities.map(({ event, selection, index, rec }) => opportunityCard(event, selection, index, rec)).join('')}</div></section>${sitesPanel()}</section>
      <section class="panel"><header><h2>Jugadas pendientes</h2><button data-section="bets">Ver todas</button></header><div class="bets-grid">${pending.map(betCard).join('') || empty('No hay jugadas pendientes')}</div></section>
    </section>`;
}
function stat(icon, label, value) {
  return `<article class="stat-card"><span>${icon}</span><small>${label}</small><strong>${value}</strong></article>`;
}
function sitesPanel() {
  return `<section class="panel"><header><h2>Casas de apuesta</h2><button data-section="compare">Comparar</button></header><div class="book-grid">${bettingSites.map((site) => `<a class="book-card" href="${site.url}" target="_blank" rel="noreferrer" style="--accent:${site.color}"><span>${site.name}</span><small>${site.access} ↗</small></a>`).join('')}</div></section>`;
}
function compareView() {
  const sports = ['Todos', ...new Set(state.prematchEvents.map((event) => event.sport))];
  const events = state.sport === 'Todos' ? state.prematchEvents : state.prematchEvents.filter((event) => event.sport === state.sport);
  const groups = events.reduce((acc, event) => ({ ...acc, [event.sport]: [...(acc[event.sport] || []), event] }), {});
  return `
    <section class="compare-layout">
      <aside class="sports-rail"><h3>Deportes</h3>${sports.map((sport) => `<button class="${state.sport === sport ? 'active' : ''}" data-sport="${sport}"><span>${sportIcon(sport)}</span><span>${sport}</span><b>${sport === 'Todos' ? state.prematchEvents.length : state.prematchEvents.filter((event) => event.sport === sport).length}</b></button>`).join('')}</aside>
      <div class="compare-board">
        <div class="compare-toolbar panel">
          <div><p class="eyebrow">Datos reales + entrada manual</p><h2>Comparador pre-juego</h2><small>${state.dataSource}${state.lastUpdated ? ` · Actualizado ${state.lastUpdated}` : ''}. Sportider puede cargarse automático; Juancito/SportsPick/Betcris se completan manualmente si requieren login.</small></div>
          <button class="refresh-button" data-refresh-odds ${state.isLoadingOdds ? 'disabled' : ''}>${state.isLoadingOdds ? 'Cargando...' : 'Actualizar juegos reales'}</button>
          <label>Monto cliente <input id="stakeInput" type="number" min="1" value="${state.compareStake}"></label>
          <label>Referencia cliente <select id="referenceSite">${bettingSites.map((site) => `<option value="${site.key}" ${state.clientReferenceSite === site.key ? 'selected' : ''}>${site.short}</option>`).join('')}</select></label>
          <div class="mode-toggle"><button class="${state.betMode === 'single' ? 'active' : ''}" data-mode="single">Simple</button><button class="${state.betMode === 'parlay' ? 'active' : ''}" data-mode="parlay">Combinada</button></div>
        </div>
        <p class="notice">Aviso: el sistema recomienda y registra. No inicia sesión ni ejecuta apuestas automáticamente; el encargado coloca la jugada manualmente en la página recomendada.</p>${state.oddsError ? `<p class="notice error">${escapeHtml(state.oddsError)}</p>` : ''}
        ${state.betMode === 'parlay' ? parlayPanel() : ''}
        ${Object.entries(groups).map(([sport, sportEvents]) => `<section class="sport-section"><h3>${sportIcon(sport)} ${sport} <small>${sportEvents.length} eventos pre-juego</small></h3>${sportEvents.map(comparisonCard).join('')}</section>`).join('')}
      </div>
    </section>`;
}
function opportunityCard(event, selection, selectionIndex, rec) {
  return `<article class="opportunity-card"><div><strong>${escapeHtml(selection.name)}</strong><small>${escapeHtml(event.event)} · ${event.startsAt}</small></div><div class="righted"><b>${rec.best?.short || '—'} ${formatOdds(rec.best?.odds)}</b><span class="profit ${rec.companyProfit >= 0 ? 'positive' : 'negative'}">Empresa ${currency.format(rec.companyProfit)}</span></div><button class="outline-button" data-use-selection="${event.id}:${selectionIndex}">Registrar recomendación</button></article>`;
}
function comparisonCard(event) {
  return `<article class="comparison-card"><div class="comparison-head"><div><h4>${escapeHtml(event.event)}</h4><small>${escapeHtml(event.league)} · ${event.startsAt}</small></div><a href="${bettingSites[0].url}" target="_blank" rel="noreferrer">Abrir casas ↗</a></div><div class="comparison-table"><div class="comparison-row table-head"><span>Selección</span>${bettingSites.map((site) => `<span>${site.short}</span>`).join('')}<span>Mejor / Empresa</span></div>${event.selections.map((selection, index) => comparisonRow(event, selection, index)).join('')}</div></article>`;
}
function comparisonRow(event, selection, selectionIndex) {
  const rec = recommendationForSelection(selection);
  const selected = state.parlayLegs.includes(parlayKey(event.id, selectionIndex));
  return `<div class="comparison-row"><span class="selection-name">${state.betMode === 'parlay' ? `<input type="checkbox" data-parlay-leg="${event.id}:${selectionIndex}" ${selected ? 'checked' : ''}>` : ''}${escapeHtml(selection.name)}</span>${bettingSites.map((site) => oddsCell(event, selection, selectionIndex, site, rec.best)).join('')}<span class="recommendation"><b>${rec.best?.short || '—'} ${formatOdds(rec.best?.odds)}</b><small>Cliente ${currency.format(rec.clientPayout)} · Página ${currency.format(rec.bookPayout)}</small><em class="profit ${rec.companyProfit >= 0 ? 'positive' : 'negative'}">Empresa ${currency.format(rec.companyProfit)}</em><button data-use-selection="${event.id}:${selectionIndex}">Usar línea</button></span></div>`;
}
function oddsCell(event, selection, selectionIndex, site, best) {
  const odds = selection.oddsBySite[site.key];
  const isBest = best?.key === site.key;
  return `<label class="odds-cell ${isBest ? 'best' : ''}"><input aria-label="${site.short} ${selection.name}" data-odds-event="${event.id}" data-selection-index="${selectionIndex}" data-site-key="${site.key}" value="${Number.isFinite(Number(odds)) ? formatOdds(odds) : ''}"><small>${site.access}</small></label>`;
}
function parlayPanel() {
  const result = calculateParlay();
  if (!result) return `<section class="panel parlay-panel"><header><h2>Combinada</h2></header><p class="empty-state">Selecciona 2 o más líneas para comparar una combinada por página.</p></section>`;
  return `<section class="panel parlay-panel"><header><h2>Combinada seleccionada</h2><button data-register-parlay>Registrar combinada</button></header><div class="parlay-grid"><div>${result.legs.map(({ event, selection }) => `<p><strong>${escapeHtml(selection.name)}</strong><br><small>${escapeHtml(event.event)}</small></p>`).join('')}</div><div class="parlay-results">${result.rows.map((row) => `<div class="parlay-site ${row.site.key === result.best.site.key ? 'best' : ''}"><span>${row.site.short}</span><b>${currency.format(row.payout)}</b></div>`).join('')}</div><div class="company-box"><small>Empresa gana estimado</small><strong>${currency.format(result.companyProfit)}</strong><span>vs referencia ${result.reference.site.short}</span></div></div></section>`;
}
function clientsView() {
  return `<section class="two-column align-start"><section class="panel"><header><h2>Nuevo cliente</h2></header><form class="stack-form" id="clientForm"><input name="name" placeholder="Nombre del cliente" required><input name="phone" placeholder="Teléfono / WhatsApp"><input name="balance" type="number" placeholder="Saldo inicial US$"><button class="primary-button">Guardar cliente</button></form></section><section class="panel"><header><h2>Clientes registrados</h2></header><div class="cards-list">${state.clients.map((client) => `<article class="client-card"><div><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(client.phone)}</small></div><div class="righted"><b>${currency.format(client.balance)}</b><span class="${client.status === 'Activo' ? 'status won' : 'status lost'}">${client.status}</span></div></article>`).join('')}</div></section></section>`;
}
function betsView() {
  return `<section class="page-grid"><section class="panel"><header><h2>Jugadas registradas</h2><button data-open-bet>Manual</button></header><div class="bets-grid">${state.bets.map(betCard).join('')}</div></section></section>`;
}
function transactionsView() {
  return `<section class="panel"><header><h2>Resultados y utilidad</h2></header><div class="cards-list">${state.bets.map((bet) => `<button class="transaction-card" data-bet-id="${bet.id}"><span>${bet.status === 'Ganada' ? '✅' : bet.status === 'Perdida' ? '❌' : '⏳'}</span><div><strong>${escapeHtml(bet.selection || bet.event)}</strong><small>${clientName(bet.clientId)} · ${bet.placementStatus}</small></div><b>${currency.format(companyProfitForBet(bet))}</b></button>`).join('')}</div></section>`;
}
function companyProfitForBet(bet) {
  return americanOddsPayout(bet.clientStake, bet.bookOdds) - americanOddsPayout(bet.clientStake, bet.clientOdds);
}
function betCard(bet) {
  const companyProfit = companyProfitForBet(bet);
  return `<button class="bet-card" data-bet-id="${bet.id}"><div class="bet-card-top"><span>${sportIcon(bet.sport)} ${escapeHtml(bet.league)}</span><span class="${statusClass(bet.status)}">${bet.status}</span></div><strong>${escapeHtml(bet.selection || bet.event)}</strong><small>${clientName(bet.clientId)} · ${escapeHtml(bet.event)}</small><div class="bet-metrics"><span>Cliente ${formatOdds(bet.clientOdds)}: <b>${currency.format(americanOddsPayout(bet.clientStake, bet.clientOdds))}</b></span><span>${escapeHtml(bet.bookSite)} ${formatOdds(bet.bookOdds)}: <b>${currency.format(americanOddsPayout(bet.clientStake, bet.bookOdds))}</b></span><span class="profit ${companyProfit >= 0 ? 'positive' : 'negative'}">Empresa ${currency.format(companyProfit)}</span></div></button>`;
}
function empty(text) { return `<p class="empty-state">${text}</p>`; }
function bindViewEvents() {
  document.querySelectorAll('#viewRoot [data-section]').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
  document.querySelectorAll('[data-open-bet]').forEach((button) => button.addEventListener('click', () => openBetForm()));
  document.querySelectorAll('[data-bet-id]').forEach((button) => button.addEventListener('click', () => openBetDetail(Number(button.dataset.betId))));
  document.querySelectorAll('[data-sport]').forEach((button) => button.addEventListener('click', () => { state.sport = button.dataset.sport; render(); }));
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { state.betMode = button.dataset.mode; render(); }));
  document.querySelectorAll('[data-refresh-odds]').forEach((button) => button.addEventListener('click', loadRealSportiderEvents));
  document.querySelectorAll('[data-use-selection]').forEach((button) => button.addEventListener('click', () => {
    const [eventId, selectionIndex] = button.dataset.useSelection.split(':');
    const { event, selection } = getSelection(eventId, selectionIndex);
    openBetForm({ event, selection, selectionIndex: Number(selectionIndex) });
  }));
  document.querySelectorAll('[data-parlay-leg]').forEach((input) => input.addEventListener('change', () => toggleParlayLeg(input.dataset.parlayLeg)));
  document.querySelectorAll('[data-odds-event]').forEach((input) => input.addEventListener('change', () => updateOdds(input)));
  $('#stakeInput')?.addEventListener('change', (event) => { state.compareStake = Math.max(1, Number(event.target.value || 1)); render(); });
  $('#referenceSite')?.addEventListener('change', (event) => { state.clientReferenceSite = event.target.value; render(); });
  $('[data-register-parlay]')?.addEventListener('click', openParlayForm);
  $('#clientForm')?.addEventListener('submit', addClient);
}
function updateOdds(input) {
  const { event, selection } = getSelection(input.dataset.oddsEvent, input.dataset.selectionIndex);
  const odds = parseAmericanOdds(input.value);
  if (!event || !selection || odds === null) {
    input.value = Number.isFinite(Number(selection?.oddsBySite[input.dataset.siteKey])) ? formatOdds(selection.oddsBySite[input.dataset.siteKey]) : '';
    return;
  }
  selection.oddsBySite[input.dataset.siteKey] = odds;
  render();
}
function toggleParlayLeg(key) {
  state.parlayLegs = state.parlayLegs.includes(key) ? state.parlayLegs.filter((item) => item !== key) : [...state.parlayLegs, key];
  render();
}
function addClient(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.clients.unshift({ id: Date.now(), name: form.get('name').trim(), phone: form.get('phone').trim(), balance: Number(form.get('balance') || 0), status: 'Activo' });
  render();
}
function openBetForm(context = {}) {
  const selection = context.selection;
  const event = context.event;
  const rec = selection ? recommendationForSelection(selection) : null;
  const clientOdds = rec?.clientOdds ?? 100;
  const bookOdds = rec?.best?.odds ?? 100;
  const bookSite = rec?.best?.name ?? bettingSites[0].name;
  const snapshot = selection ? bettingSites.map((site) => ({ siteKey: site.key, site: site.name, odds: selection.oddsBySite[site.key] })).filter((item) => Number.isFinite(Number(item.odds))) : [];
  const modal = $('#modalRoot');
  modal.innerHTML = `<div class="modal-backdrop"><form class="modal-card bet-form" id="betForm"><div class="form-head"><h2>Registrar recomendación</h2><button type="button" data-close>✕</button></div><p class="notice">El encargado debe entrar manualmente a la página recomendada y colocar la jugada con su usuario.</p><div class="form-grid"><select name="clientId" required><option value="">Cliente</option>${state.clients.map((client) => `<option value="${client.id}">${client.name} · ${currency.format(client.balance)}</option>`).join('')}</select><select name="sport"><option ${event?.sport === 'Béisbol' ? 'selected' : ''}>Béisbol</option><option ${event?.sport === 'Baloncesto' ? 'selected' : ''}>Baloncesto</option><option ${event?.sport === 'Fútbol' ? 'selected' : ''}>Fútbol</option><option>Tenis</option></select><input name="league" placeholder="Liga" value="${escapeHtml(event?.league || '')}"><input name="event" placeholder="Evento / juego" required value="${escapeHtml(event?.event || '')}"><input name="selection" placeholder="Equipo / selección" required value="${escapeHtml(selection?.name || '')}"><input name="clientStake" type="number" placeholder="Monto cliente US$" required value="${state.compareStake}"><input name="clientOdds" placeholder="Cuota cliente (+213)" required value="${formatOdds(clientOdds)}"><select name="bookSite">${bettingSites.map((site) => `<option ${bookSite === site.name ? 'selected' : ''}>${site.name}</option>`).join('')}</select><input name="bookOdds" placeholder="Cuota página (+260)" required value="${formatOdds(bookOdds)}"><select name="placementStatus"><option>Recomendada / pendiente de colocar</option><option selected>Colocada manualmente</option><option>No colocada</option></select><input name="snapshot" type="hidden" value='${escapeHtml(JSON.stringify(snapshot))}'></div><button class="primary-button">Guardar jugada y comparación</button></form></div>`;
  modal.querySelector('[data-close]').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', (eventClick) => { if (eventClick.target.classList.contains('modal-backdrop')) closeModal(); });
  modal.querySelector('#betForm').addEventListener('submit', addBet);
}
function openParlayForm() {
  const result = calculateParlay();
  if (!result) return;
  const event = { sport: 'Combinada', league: 'Parlay pre-juego', event: result.legs.map((leg) => leg.selection.name).join(' + ') };
  const selection = { name: `Combinada ${result.legs.length} equipos`, oddsBySite: Object.fromEntries(result.rows.map((row) => [row.site.key, Math.round((row.combinedDecimal - 1) * 100)])) };
  openBetForm({ event, selection });
}
function addBet(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const clientId = Number(form.get('clientId'));
  const clientStake = Number(form.get('clientStake'));
  const clientOdds = parseAmericanOdds(form.get('clientOdds'));
  const bookOdds = parseAmericanOdds(form.get('bookOdds'));
  if (!clientId || clientStake <= 0 || clientOdds === null || bookOdds === null) return;
  let comparisonSnapshot = [];
  try { comparisonSnapshot = JSON.parse(form.get('snapshot') || '[]'); } catch { comparisonSnapshot = []; }
  state.bets.unshift({
    id: Date.now(),
    clientId,
    sport: form.get('sport'),
    league: form.get('league') || 'Manual',
    event: form.get('event'),
    selection: form.get('selection'),
    clientStake,
    clientOdds,
    recommendedSite: form.get('bookSite'),
    bookSite: form.get('bookSite'),
    bookOdds,
    status: 'Pendiente',
    placementStatus: form.get('placementStatus'),
    createdAt: 'Ahora',
    comparisonSnapshot,
  });
  state.clients = state.clients.map((client) => client.id === clientId ? { ...client, balance: client.balance - clientStake } : client);
  closeModal();
  state.section = 'bets';
  render();
}
function openBetDetail(id) {
  const bet = state.bets.find((item) => item.id === id);
  if (!bet) return;
  const clientPayout = americanOddsPayout(bet.clientStake, bet.clientOdds);
  const bookPayout = americanOddsPayout(bet.clientStake, bet.bookOdds);
  const companyProfit = bookPayout - clientPayout;
  $('#modalRoot').innerHTML = `<div class="modal-backdrop"><article class="modal-card"><header><div><p class="eyebrow">Detalle de jugada</p><h2>${escapeHtml(bet.selection || bet.event)}</h2></div><button data-close>✕</button></header><div class="detail-grid">${detail('Cliente', clientName(bet.clientId))}${detail('Estado', bet.status)}${detail('Colocación', bet.placementStatus)}${detail('Evento', bet.event)}${detail('Cuota cliente', formatOdds(bet.clientOdds))}${detail('Cliente cobra', currency.format(clientPayout))}${detail('Página colocada', bet.bookSite)}${detail('Página paga', currency.format(bookPayout))}${detail('Empresa gana', currency.format(companyProfit))}${detail('Login', 'Manual por encargado')}</div>${snapshotHtml(bet)}${bet.status === 'Pendiente' ? `<div class="modal-actions"><button class="win-button" data-settle="Ganada">Marcar ganada</button><button class="lose-button" data-settle="Perdida">Marcar perdida</button></div>` : ''}</article></div>`;
  $('#modalRoot [data-close]').addEventListener('click', closeModal);
  document.querySelectorAll('[data-settle]').forEach((button) => button.addEventListener('click', () => settleBet(id, button.dataset.settle)));
}
function snapshotHtml(bet) {
  if (!bet.comparisonSnapshot?.length) return '';
  return `<section class="snapshot"><h3>Comparación usada</h3><div class="snapshot-grid">${bet.comparisonSnapshot.map((item) => `<div class="snapshot-item ${item.site === bet.bookSite ? 'best' : ''}"><small>${escapeHtml(item.site)}</small><strong>${formatOdds(item.odds)}</strong></div>`).join('')}</div></section>`;
}
function detail(label, value) { return `<div class="detail-item"><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`; }
function closeModal() { $('#modalRoot').innerHTML = ''; }
function settleBet(id, status) {
  const bet = state.bets.find((item) => item.id === id);
  if (!bet || bet.status !== 'Pendiente') return;
  bet.status = status;
  if (status === 'Ganada') state.clients = state.clients.map((client) => client.id === bet.clientId ? { ...client, balance: client.balance + americanOddsPayout(bet.clientStake, bet.clientOdds) } : client);
  closeModal();
  render();
}

$('#newBetTop').addEventListener('click', () => openBetForm());
$('#floatingBet').addEventListener('click', () => openBetForm());
render();
loadRealSportiderEvents();
