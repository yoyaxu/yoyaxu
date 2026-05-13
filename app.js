const currency = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 });
const navItems = [
  { key: 'dashboard', label: 'Panel', icon: '📊' },
  { key: 'live', label: 'En vivo', icon: '🔴' },
  { key: 'clients', label: 'Clientes', icon: '👥' },
  { key: 'bets', label: 'Apuestas', icon: '🎫' },
  { key: 'transactions', label: 'Movimientos', icon: '💳' },
];
const bettingSites = [
  { name: 'SuperBets', url: 'https://www.superbets.do/', color: '#ff6b00' },
  { name: 'NetBet', url: 'https://sport.netbet.com/es/apuestas-en-vivo/', color: '#00a7ff' },
  { name: 'Apuesta Total', url: 'https://www.apuestatotal.com/apuestas-en-vivo', color: '#ef233c' },
  { name: 'Juancito Sport', url: 'https://www.juancitosport.com.do/apuestas-en-vivo/', color: '#24a148' },
];
const state = {
  section: 'dashboard',
  sport: 'Todos',
  clients: [
    { id: 1, name: 'Jonathan Pérez', phone: '809-555-1122', balance: 8500, status: 'Activo' },
    { id: 2, name: 'María Núñez', phone: '829-555-3344', balance: 3200, status: 'Activo' },
    { id: 3, name: 'Carlos Díaz', phone: '849-555-7788', balance: 0, status: 'Pausado' },
  ],
  bets: [
    { id: 1, clientId: 1, sport: 'Béisbol', league: 'MLB', event: 'Yankees vs Red Sox', market: 'Moneyline Yankees', amount: 1000, site: 'NetBet', odds: 1.85, status: 'Pendiente', createdAt: 'Hoy 2:45 PM' },
    { id: 2, clientId: 2, sport: 'Baloncesto', league: 'NBA', event: 'Celtics vs Knicks', market: 'Total Más de 214.5', amount: 500, site: 'SuperBets', odds: 1.92, status: 'Ganada', createdAt: 'Ayer 8:10 PM' },
    { id: 3, clientId: 1, sport: 'Fútbol', league: 'LaLiga', event: 'Real Madrid vs Valencia', market: 'Empate', amount: 700, site: 'Apuesta Total', odds: 3.1, status: 'Perdida', createdAt: 'Lun 4:20 PM' },
  ],
  liveEvents: [
    { id: 1, sport: 'Béisbol', league: 'MLB En Vivo', time: 'Entrada 5', home: 'Yankees', away: 'Red Sox', bestSite: 'NetBet', markets: [{ label: 'Ganador', home: 1.85, away: 2.05 }, { label: 'Carreras +7.5', home: 1.9, away: 1.86 }] },
    { id: 2, sport: 'Béisbol', league: 'LIDOM', time: '8:30 PM', home: 'Licey', away: 'Escogido', bestSite: 'Juancito Sport', markets: [{ label: 'Ganador', home: 1.72, away: 2.18 }] },
    { id: 3, sport: 'Baloncesto', league: 'NBA En Vivo', time: 'Q3 06:14', home: 'Celtics', away: 'Knicks', bestSite: 'SuperBets', markets: [{ label: 'Ganador', home: 1.58, away: 2.45 }, { label: 'Total +214.5', home: 1.92, away: 1.89 }] },
    { id: 4, sport: 'Fútbol', league: 'LaLiga', time: '65’', home: 'Real Madrid', away: 'Valencia', bestSite: 'Apuesta Total', markets: [{ label: '1X2', home: 1.44, draw: 4.2, away: 6.8 }] },
    { id: 5, sport: 'Tenis', league: 'ATP', time: 'Set 2', home: 'Alcaraz', away: 'Sinner', bestSite: 'NetBet', markets: [{ label: 'Ganador', home: 1.95, away: 1.86 }] },
  ],
};
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const sportIcon = (sport) => ({ Béisbol: '⚾', Baloncesto: '🏀', Fútbol: '⚽', Tenis: '🎾', Todos: '🏟️' }[sport] || '🏅');
const clientName = (id) => state.clients.find((client) => client.id === Number(id))?.name || 'Cliente eliminado';
const statusClass = (status) => status === 'Ganada' ? 'status won' : status === 'Perdida' ? 'status lost' : 'status pending';

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
  document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
}

function render() {
  renderNav();
  $('#pageTitle').textContent = navItems.find((item) => item.key === state.section)?.label || 'Panel';
  const views = { dashboard: dashboardView, live: liveView, clients: clientsView, bets: betsView, transactions: transactionsView };
  $('#viewRoot').innerHTML = views[state.section]();
  bindViewEvents();
}

function dashboardView() {
  const pending = state.bets.filter((bet) => bet.status === 'Pendiente');
  const balance = state.clients.reduce((sum, client) => sum + client.balance, 0);
  const activeClients = state.clients.filter((client) => client.status === 'Activo').length;
  const pendingAmount = pending.reduce((sum, bet) => sum + bet.amount, 0);
  const projectedProfit = pending.reduce((sum, bet) => sum + bet.amount * bet.odds, 0);
  return `
    <section class="page-grid">
      <article class="hero-card">
        <div><p class="eyebrow">Operación de hoy</p><h2>Controla balances, apuestas pendientes y mejores cuotas desde PC o celular.</h2><p>En escritorio tienes sidebar, paneles amplios y vista tipo casa de apuestas. En móvil tienes navegación inferior y tarjetas grandes.</p></div>
        <button class="hero-action" data-open-bet>Registrar jugada</button>
      </article>
      <div class="stats-grid">${stat('💰', 'Saldo clientes', currency.format(balance))}${stat('👥', 'Clientes activos', activeClients)}${stat('🎫', 'Pendiente apostado', currency.format(pendingAmount))}${stat('📈', 'Pago potencial', currency.format(projectedProfit))}</div>
      <section class="two-column"><section class="panel"><header><h2>Apuestas pendientes</h2><button data-section="bets">Ver todas</button></header>${pending.map(betCard).join('') || empty('No hay pendientes')}</section>${sitesPanel()}</section>
    </section>`;
}

function stat(icon, label, value) {
  return `<article class="stat-card"><span>${icon}</span><small>${label}</small><strong>${value}</strong></article>`;
}

function sitesPanel() {
  return `<section class="panel"><header><h2>Casas de apuestas</h2><button data-section="live">En vivo</button></header><div class="book-grid">${bettingSites.map((site) => `<a class="book-card" href="${site.url}" target="_blank" rel="noreferrer" style="--accent:${site.color}"><span>${site.name}</span><small>Abrir sitio ↗</small></a>`).join('')}</div></section>`;
}

function liveView() {
  const sports = ['Todos', ...new Set(state.liveEvents.map((event) => event.sport))];
  const events = state.sport === 'Todos' ? state.liveEvents : state.liveEvents.filter((event) => event.sport === state.sport);
  const groups = events.reduce((acc, event) => ({ ...acc, [event.sport]: [...(acc[event.sport] || []), event] }), {});
  return `
    <section class="live-layout">
      <aside class="sports-rail"><h3>Deportes</h3>${sports.map((sport) => `<button class="${state.sport === sport ? 'active' : ''}" data-sport="${sport}"><span>${sportIcon(sport)}</span><span>${sport}</span><b>${sport === 'Todos' ? state.liveEvents.length : state.liveEvents.filter((event) => event.sport === sport).length}</b></button>`).join('')}</aside>
      <div class="live-board"><div class="live-header"><div><p class="eyebrow">Inspirado en SuperBets, NetBet, Apuesta Total y Juancito</p><h2>Apuestas en vivo por deporte</h2></div><span class="pill"><i class="live-dot"></i>${events.length} eventos</span></div>
      ${Object.entries(groups).map(([sport, sportEvents]) => `<section class="sport-section"><h3>${sportIcon(sport)} ${sport} <small>${sportEvents.length} eventos</small></h3><div class="events-grid">${sportEvents.map(liveCard).join('')}</div></section>`).join('')}</div>
    </section>`;
}

function clientsView() {
  return `<section class="two-column align-start"><section class="panel"><header><h2>Nuevo cliente</h2></header><form class="stack-form" id="clientForm"><input name="name" placeholder="Nombre del cliente" required><input name="phone" placeholder="Teléfono / WhatsApp"><input name="balance" type="number" placeholder="Saldo inicial RD$"><button class="primary-button">Guardar cliente</button></form></section><section class="panel"><header><h2>Clientes registrados</h2></header><div class="cards-list">${state.clients.map((client) => `<article class="client-card"><div><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(client.phone)}</small></div><div class="righted"><b>${currency.format(client.balance)}</b><span class="${client.status === 'Activo' ? 'status won' : 'status lost'}">${client.status}</span></div></article>`).join('')}</div></section></section>`;
}

function betsView() {
  return `<section class="page-grid"><section class="panel"><header><h2>Historial de apuestas</h2><button data-open-bet>Nueva</button></header><div class="bets-grid">${state.bets.map(betCard).join('')}</div></section></section>`;
}

function transactionsView() {
  return `<section class="panel"><header><h2>Movimientos recientes</h2></header><div class="cards-list">${state.bets.map((bet) => `<button class="transaction-card" data-bet-id="${bet.id}"><span>${bet.status === 'Ganada' ? '✅' : bet.status === 'Perdida' ? '❌' : '⏳'}</span><div><strong>${escapeHtml(bet.event)}</strong><small>${clientName(bet.clientId)} · ${bet.createdAt}</small></div><b>${currency.format(bet.amount)}</b></button>`).join('')}</div></section>`;
}

function betCard(bet) {
  return `<button class="bet-card" data-bet-id="${bet.id}"><div class="bet-card-top"><span>${sportIcon(bet.sport)} ${escapeHtml(bet.league)}</span><span class="${statusClass(bet.status)}">${bet.status}</span></div><strong>${escapeHtml(bet.event)}</strong><small>${clientName(bet.clientId)} · ${escapeHtml(bet.market)}</small><div class="bet-metrics"><b>${currency.format(bet.amount)}</b><span>${escapeHtml(bet.site)} · ${bet.odds.toFixed(2)}x</span><b>${currency.format(bet.amount * bet.odds)}</b></div></button>`;
}

function liveCard(event) {
  return `<article class="live-event-card"><div class="bet-card-top"><span>${event.league}</span><span class="pill">${event.time}</span></div><h4>${event.home} vs ${event.away}</h4><small>Mejor cuota detectada: ${event.bestSite}</small>${event.markets.map((market) => `<div class="market-row"><span>${market.label}</span><button>${event.home} ${market.home}</button>${market.draw ? `<button>Empate ${market.draw}</button>` : ''}<button>${event.away} ${market.away}</button></div>`).join('')}<button class="outline-button" data-live-id="${event.id}">Usar para apuesta</button></article>`;
}

function empty(text) { return `<p class="empty-state">${text}</p>`; }

function bindViewEvents() {
  document.querySelectorAll('#viewRoot [data-section]').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
  document.querySelectorAll('[data-open-bet]').forEach((button) => button.addEventListener('click', () => openBetForm()));
  document.querySelectorAll('[data-bet-id]').forEach((button) => button.addEventListener('click', () => openBetDetail(Number(button.dataset.betId))));
  document.querySelectorAll('[data-sport]').forEach((button) => button.addEventListener('click', () => { state.sport = button.dataset.sport; render(); }));
  document.querySelectorAll('[data-live-id]').forEach((button) => button.addEventListener('click', () => openBetForm(state.liveEvents.find((event) => event.id === Number(button.dataset.liveId)))));
  $('#clientForm')?.addEventListener('submit', addClient);
}

function addClient(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.clients.unshift({ id: Date.now(), name: form.get('name').trim(), phone: form.get('phone').trim(), balance: Number(form.get('balance') || 0), status: 'Activo' });
  render();
}

function openBetForm(liveEvent) {
  const modal = $('#modalRoot');
  modal.innerHTML = `<div class="modal-backdrop"><form class="modal-card bet-form" id="betForm"><div class="form-head"><h2>Nueva apuesta</h2><button type="button" data-close>✕</button></div><div class="form-grid"><select name="clientId" required><option value="">Cliente</option>${state.clients.map((client) => `<option value="${client.id}">${client.name} · ${currency.format(client.balance)}</option>`).join('')}</select><select name="sport"><option ${liveEvent?.sport === 'Béisbol' ? 'selected' : ''}>Béisbol</option><option ${liveEvent?.sport === 'Baloncesto' ? 'selected' : ''}>Baloncesto</option><option ${liveEvent?.sport === 'Fútbol' ? 'selected' : ''}>Fútbol</option><option ${liveEvent?.sport === 'Tenis' ? 'selected' : ''}>Tenis</option></select><input name="league" placeholder="Liga" value="${escapeHtml(liveEvent?.league || '')}"><input name="event" placeholder="Evento / juego" required value="${escapeHtml(liveEvent ? `${liveEvent.home} vs ${liveEvent.away}` : '')}"><input name="market" placeholder="Tipo de apuesta" required><input name="amount" type="number" placeholder="Monto RD$" required><select name="site">${bettingSites.map((site) => `<option ${liveEvent?.bestSite === site.name ? 'selected' : ''}>${site.name}</option>`).join('')}<option>Manual</option></select><input name="odds" type="number" step="0.01" placeholder="Cuota decimal" required></div><button class="primary-button">Guardar y descontar saldo</button></form></div>`;
  modal.querySelector('[data-close]').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', (event) => { if (event.target.classList.contains('modal-backdrop')) closeModal(); });
  modal.querySelector('#betForm').addEventListener('submit', addBet);
}

function addBet(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const clientId = Number(form.get('clientId'));
  const amount = Number(form.get('amount'));
  const odds = Number(form.get('odds'));
  if (!clientId || amount <= 0 || odds <= 0) return;
  state.bets.unshift({ id: Date.now(), clientId, sport: form.get('sport'), league: form.get('league') || 'Manual', event: form.get('event'), market: form.get('market'), amount, site: form.get('site'), odds, status: 'Pendiente', createdAt: 'Ahora' });
  state.clients = state.clients.map((client) => client.id === clientId ? { ...client, balance: client.balance - amount } : client);
  closeModal();
  state.section = 'bets';
  render();
}

function openBetDetail(id) {
  const bet = state.bets.find((item) => item.id === id);
  if (!bet) return;
  $('#modalRoot').innerHTML = `<div class="modal-backdrop"><article class="modal-card"><header><div><p class="eyebrow">Detalle de apuesta</p><h2>${escapeHtml(bet.event)}</h2></div><button data-close>✕</button></header><div class="detail-grid">${detail('Cliente', clientName(bet.clientId))}${detail('Estado', bet.status)}${detail('Deporte', `${sportIcon(bet.sport)} ${bet.sport}`)}${detail('Mercado', bet.market)}${detail('Casa', bet.site)}${detail('Cuota', `${bet.odds.toFixed(2)}x`)}${detail('Apostado', currency.format(bet.amount))}${detail('Pago potencial', currency.format(bet.amount * bet.odds))}</div>${bet.status === 'Pendiente' ? `<div class="modal-actions"><button class="win-button" data-settle="Ganada">Marcar ganada</button><button class="lose-button" data-settle="Perdida">Marcar perdida</button></div>` : ''}</article></div>`;
  $('#modalRoot [data-close]').addEventListener('click', closeModal);
  document.querySelectorAll('[data-settle]').forEach((button) => button.addEventListener('click', () => settleBet(id, button.dataset.settle)));
}

function detail(label, value) { return `<div class="detail-item"><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`; }
function closeModal() { $('#modalRoot').innerHTML = ''; }
function settleBet(id, status) {
  const bet = state.bets.find((item) => item.id === id);
  if (!bet || bet.status !== 'Pendiente') return;
  bet.status = status;
  if (status === 'Ganada') state.clients = state.clients.map((client) => client.id === bet.clientId ? { ...client, balance: client.balance + bet.amount * bet.odds } : client);
  closeModal();
  render();
}

$('#newBetTop').addEventListener('click', () => openBetForm());
$('#floatingBet').addEventListener('click', () => openBetForm());
render();
