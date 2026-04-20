
// ═══════════════════════════════════════
//  CONFIG & DATA
// ═══════════════════════════════════════
const CONFIG = {
  minCustomers: 1,
  maxCustomers: 6,
  drinkProbability: 0.7,
  tickMinutes: 15,
  openingHour: 11,
  closingHour: 23,
};

function totalRounds() {
  return (CONFIG.closingHour - CONFIG.openingHour) * (60 / CONFIG.tickMinutes);
}

// ── DEMAND CURVE (control points: [decimalHour, multiplier]) ──
const DEMAND_POINTS = [
  [11.00, 0.30], [11.50, 0.50], [11.75, 0.70],
  [12.00, 1.40], [12.50, 1.80], [13.00, 1.60], [13.50, 1.00],
  [14.00, 0.50], [14.50, 0.30], [15.00, 0.20],
  [16.00, 0.20], [16.50, 0.25], [17.00, 0.40],
  [17.50, 0.70], [18.00, 1.20], [18.50, 1.60],
  [19.00, 2.00], [19.50, 2.00], [20.00, 1.80],
  [20.50, 1.40], [21.00, 1.00], [21.50, 0.70],
  [22.00, 0.50], [22.50, 0.35], [23.00, 0.30],
];
const MAX_MULTIPLIER = 2.0;

function interpolateDemand(hour) {
  const pts = DEMAND_POINTS;
  if (hour <= pts[0][0]) return pts[0][1];
  if (hour >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (hour >= pts[i][0] && hour <= pts[i + 1][0]) {
      const t = (hour - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
    }
  }
  return 0.5;
}

function getClockHour(round) {
  return CONFIG.openingHour + (round - 1) * CONFIG.tickMinutes / 60;
}

function formatClock(decHour) {
  const h = Math.floor(decHour);
  const m = Math.round((decHour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getPeriod(hour) {
  if (hour < 11.75) return { label: 'Opening', emoji: '🌅', color: '#78909c' };
  if (hour < 13.75) return { label: 'Lunch Rush', emoji: '🔥', color: '#ff7043' };
  if (hour < 14.50) return { label: 'Post-Lunch', emoji: '🍽️', color: '#a1887f' };
  if (hour < 17.25) return { label: 'Afternoon Lull', emoji: '😴', color: '#78909c' };
  if (hour < 18.00) return { label: 'Pre-Dinner', emoji: '🌆', color: '#ffb74d' };
  if (hour < 20.75) return { label: 'Dinner Rush', emoji: '🔥🔥', color: '#ef5350' };
  if (hour < 22.00) return { label: 'Evening', emoji: '🌙', color: '#90a4ae' };
  return { label: 'Last Call', emoji: '🔔', color: '#78909c' };
}

function effectiveRange(mult) {
  const lo = Math.max(0, Math.round(CONFIG.minCustomers * mult));
  const hi = Math.max(lo, Math.round(CONFIG.maxCustomers * mult));
  return [lo, hi];
}

// ── RECIPES & MENU ──
const PIZZA_RECIPES = {
  "Margherita":        { flour:250, sauce:80, cheese:125 },
  "Diavola":           { flour:250, sauce:80, cheese:125, salami:50 },
  "Prosciutto":        { flour:250, sauce:80, cheese:125, ham:60 },
  "Quattro Formaggi":  { flour:250, sauce:60, cheese:200 },
  "Vegetariana":       { flour:250, sauce:80, cheese:100, vegetables:120 },
  "Tonno":             { flour:250, sauce:80, cheese:100, tuna:70 },
};
const PIZZA_PRICES = {
  "Margherita":14.50,"Diavola":18.00,"Prosciutto":17.50,
  "Quattro Formaggi":19.00,"Vegetariana":16.00,"Tonno":17.00,
};
const DRINK_MENU = {
  "Cola":       { price:4.50, stockKey:"cola", units:1 },
  "Fanta":      { price:4.50, stockKey:"fanta", units:1 },
  "Water":      { price:3.00, stockKey:"water", units:1 },
  "Beer":       { price:6.00, stockKey:"beer", units:1 },
  "House Wine": { price:8.00, stockKey:"house_wine", units:1 },
};

const DEFAULT_INVENTORY = {
  flour:30000, sauce:12000, cheese:18000,
  salami:4000, ham:4000, vegetables:5000, tuna:3000,
  cola:48, fanta:36, water:60, beer:48, house_wine:30,
};
let INITIAL_INVENTORY = { ...DEFAULT_INVENTORY };

const INV_LABELS = {
  flour:"Flour",sauce:"Sauce",cheese:"Cheese",salami:"Salami",
  ham:"Ham",vegetables:"Vegetables",tuna:"Tuna",
  cola:"Cola",fanta:"Fanta",water:"Water",beer:"Beer",house_wine:"House Wine",
};
const INV_UNITS = {
  flour:"g",sauce:"g",cheese:"g",salami:"g",ham:"g",vegetables:"g",tuna:"g",
  cola:"btl",fanta:"btl",water:"btl",beer:"btl",house_wine:"btl",
};

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
let state = {};
function initState() {
  state = {
    round: 0, cash: 0, served: 0, lost: 0,
    inventory: { ...INITIAL_INVENTORY },
    history: [], closed: false, dayOver: false,
  };
}

// ═══════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════
const randInt = (a, b) => a >= b ? a : Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmtCHF = n => `CHF ${n.toFixed(2)}`;

function availablePizzas() {
  return Object.keys(PIZZA_RECIPES).filter(p =>
    Object.entries(PIZZA_RECIPES[p]).every(([i, q]) => (state.inventory[i] || 0) >= q));
}
function availableDrinks() {
  return Object.keys(DRINK_MENU).filter(d =>
    (state.inventory[DRINK_MENU[d].stockKey] || 0) >= DRINK_MENU[d].units);
}

// ═══════════════════════════════════════
//  SIMULATION
// ═══════════════════════════════════════
function generateOrder() {
  const pizzas = availablePizzas();
  if (!pizzas.length) return null;
  const pizza = pick(pizzas);
  const used = { ...PIZZA_RECIPES[pizza] };
  let price = PIZZA_PRICES[pizza];
  let drink = null;
  if (Math.random() < CONFIG.drinkProbability) {
    const drinks = availableDrinks();
    if (drinks.length) {
      drink = pick(drinks);
      const info = DRINK_MENU[drink];
      price += info.price;
      used[info.stockKey] = (used[info.stockKey] || 0) + info.units;
    }
  }
  return { pizza, drink, totalPrice: price, ingredientsUsed: used };
}

function simulateTick() {
  const clockHour = getClockHour(state.round + 1);
  const mult = interpolateDemand(clockHour);
  const [effMin, effMax] = effectiveRange(mult);
  const n = randInt(effMin, effMax);
  const orders = [];
  let roundLost = 0;

  for (let i = 0; i < n; i++) {
    const order = generateOrder();
    if (!order) { state.lost++; roundLost++; continue; }
    for (const [k, v] of Object.entries(order.ingredientsUsed)) state.inventory[k] -= v;
    state.cash += order.totalPrice;
    state.served++;
    orders.push(order);
  }

  state.round++;
  const rev = orders.reduce((s, o) => s + o.totalPrice, 0);
  const period = getPeriod(clockHour);

  state.history.push({
    round: state.round, customers: orders.length, lost: roundLost,
    revenue: rev, cumulative: state.cash,
    time: formatClock(clockHour), phase: period.emoji + ' ' + period.label,
  });

  if (!availablePizzas().length) state.closed = true;
  if (state.round >= totalRounds()) state.dayOver = true;

  return { orders, roundLost, roundRevenue: rev, mult, effMin, effMax };
}

// ═══════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════
function flashKPIs() {
  document.querySelectorAll('.kpi-card').forEach(c => {
    c.classList.add('flash');
    setTimeout(() => c.classList.remove('flash'), 600);
  });
}

function renderKPIs() {
  const tr = totalRounds();
  const clockHour = state.round > 0 ? getClockHour(state.round) : CONFIG.openingHour;
  const period = getPeriod(clockHour);
  document.getElementById('vClock').textContent = formatClock(clockHour);
  document.getElementById('vRound').textContent = `${state.round} / ${tr}`;
  document.getElementById('vPhase').textContent = `${period.emoji} ${period.label}`;
  document.getElementById('vPhase').style.color = period.color;
  document.getElementById('vRevenue').textContent = fmtCHF(state.cash);
  document.getElementById('vServed').textContent = state.served;
  document.getElementById('vLost').textContent = state.lost;
  document.getElementById('vAvg').textContent = fmtCHF(state.served ? state.cash / state.served : 0);
}

function renderDemandCurve() {
  const tr = totalRounds();
  const barsEl = document.getElementById('demandBars');
  let html = '';
  for (let r = 1; r <= tr; r++) {
    const hour = getClockHour(r);
    const mult = interpolateDemand(hour);
    const heightPct = (mult / MAX_MULTIPLIER) * 100;
    let cls = 'future';
    if (r < state.round) cls = 'past';
    else if (r === state.round) cls = state.closed && !state.dayOver ? 'stock-out' : 'current';
    html += `<div class="demand-bar ${cls}" style="height:${heightPct}%" title="${formatClock(hour)} — ×${mult.toFixed(2)}"></div>`;
  }
  barsEl.innerHTML = html;

  // Time labels
  const labelsEl = document.getElementById('demandLabels');
  let labels = '';
  for (let h = CONFIG.openingHour; h <= CONFIG.closingHour; h += 2) {
    labels += `<span>${String(h).padStart(2, '0')}:00</span>`;
  }
  labelsEl.innerHTML = labels;

  // Phase info
  const phaseEl = document.getElementById('demandPhase');
  if (state.round === 0) {
    phaseEl.innerHTML = 'Press <b>Next Round</b> to open the doors at 11:00.';
  } else if (state.dayOver || state.closed) {
    phaseEl.innerHTML = state.dayOver ? '✅ Business day complete.' : '🚫 Closed early — out of stock.';
  } else {
    const nextHour = getClockHour(state.round + 1);
    const mult = interpolateDemand(nextHour);
    const [lo, hi] = effectiveRange(mult);
    const period = getPeriod(nextHour);
    phaseEl.innerHTML = `Next: <b>${formatClock(nextHour)}</b> — ${period.emoji} <b>${period.label}</b> — Demand ×${mult.toFixed(1)} — Expected <b>${lo}–${hi}</b> customers`;
  }
}

function renderInventory() {
  const g = document.getElementById('inventoryGrid');
  g.innerHTML = '';
  for (const [key, max] of Object.entries(INITIAL_INVENTORY)) {
    const cur = state.inventory[key];
    const pct = Math.max(0, cur / max * 100);
    const lvl = pct > 40 ? 'good' : pct > 15 ? 'mid' : 'low';
    g.innerHTML += `<div class="inv-item">
      <div class="inv-item-header">
        <span class="inv-item-name">${INV_LABELS[key]}</span>
        <span class="inv-item-qty">${cur}${INV_UNITS[key]} / ${max}${INV_UNITS[key]}</span>
      </div>
      <div class="inv-bar"><div class="inv-bar-fill ${lvl}" style="width:${pct}%"></div></div>
    </div>`;
  }
}

function renderMenu() {
  const ap = availablePizzas(), ad = availableDrinks();
  document.getElementById('menuPizzas').innerHTML = Object.keys(PIZZA_RECIPES)
    .map(p => `<span class="menu-tag ${ap.includes(p)?'available':'sold-out'}">${p} — ${fmtCHF(PIZZA_PRICES[p])}</span>`).join('');
  document.getElementById('menuDrinks').innerHTML = Object.keys(DRINK_MENU)
    .map(d => `<span class="menu-tag ${ad.includes(d)?'available':'sold-out'}">${d} — ${fmtCHF(DRINK_MENU[d].price)}</span>`).join('');
}

function renderOrders(result) {
  const info = document.getElementById('roundInfo');
  const list = document.getElementById('ordersList');
  if (!result) {
    info.innerHTML = 'Waiting for the first customers...';
    list.innerHTML = '';
    return;
  }
  const { orders, roundLost, roundRevenue, mult, effMin, effMax } = result;
  const clockStr = formatClock(getClockHour(state.round));
  info.innerHTML = `<b>${clockStr}</b> — ${orders.length} served, ${roundLost} lost — <b style="color:#66bb6a">${fmtCHF(roundRevenue)}</b> <span style="color:#78909c;font-size:0.82rem;">(range: ${effMin}–${effMax}, ×${mult.toFixed(1)})</span>`;
  list.innerHTML = orders.map((o, i) => {
    const items = [`🍕 ${o.pizza}`];
    if (o.drink) items.push(`🥤 ${o.drink}`);
    return `<div class="order-entry" style="animation-delay:${i * 0.05}s">
      <div class="order-items">${items.map(t => `<span>${t}</span>`).join('')}</div>
      <div class="order-price">${fmtCHF(o.totalPrice)}</div>
    </div>`;
  }).join('');
  if (roundLost > 0) list.innerHTML += `<div class="order-entry" style="color:#ef5350">
    <span>😞 ${roundLost} customer${roundLost > 1 ? 's' : ''} left — nothing available</span></div>`;
}

function renderHistory() {
  document.getElementById('historyBody').innerHTML = state.history.slice().reverse().map(h => `<tr>
    <td>${h.round}</td><td>${h.time}</td><td style="font-size:0.8rem">${h.phase}</td>
    <td>${h.customers}${h.lost ? ` <span style="color:#ef5350">(+${h.lost})</span>` : ''}</td>
    <td style="color:#66bb6a">${fmtCHF(h.revenue)}</td>
    <td style="color:#81c784;font-weight:600">${fmtCHF(h.cumulative)}</td>
  </tr>`).join('');
}

function renderBanners() {
  const btnNext = document.getElementById('btnNext');
  const bannerStock = document.getElementById('bannerStockOut');
  const bannerDay = document.getElementById('bannerDayOver');
  bannerStock.style.display = 'none';
  bannerDay.style.display = 'none';

  if (state.dayOver) {
    btnNext.disabled = true;
    bannerDay.style.display = 'block';
    const rating = state.lost === 0 ? '⭐⭐⭐' : state.lost <= 5 ? '⭐⭐' : '⭐';
    document.getElementById('dayOverStats').innerHTML = `
      <div class="banner-stat"><span class="banner-stat-value" style="color:#66bb6a">${fmtCHF(state.cash)}</span>Revenue</div>
      <div class="banner-stat"><span class="banner-stat-value">${state.served}</span>Served</div>
      <div class="banner-stat"><span class="banner-stat-value" style="color:#ef5350">${state.lost}</span>Lost</div>
      <div class="banner-stat"><span class="banner-stat-value" style="color:#66bb6a">${fmtCHF(state.served ? state.cash / state.served : 0)}</span>Avg Order</div>
      <div class="banner-stat"><span class="banner-stat-value">${rating}</span>Rating</div>`;
  } else if (state.closed) {
    btnNext.disabled = true;
    bannerStock.style.display = 'block';
  } else {
    btnNext.disabled = false;
  }
}

function renderAll(result) {
  renderKPIs();
  renderDemandCurve();
  renderInventory();
  renderMenu();
  renderOrders(result);
  renderHistory();
  renderBanners();
}

// ═══════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════
function openSettings() {
  document.getElementById('sMinCust').value = CONFIG.minCustomers;
  document.getElementById('sMaxCust').value = CONFIG.maxCustomers;
  document.getElementById('sDrinkProb').value = CONFIG.drinkProbability;
  document.getElementById('sFlour').value = INITIAL_INVENTORY.flour;
  document.getElementById('sSauce').value = INITIAL_INVENTORY.sauce;
  document.getElementById('sCheese').value = INITIAL_INVENTORY.cheese;
  document.getElementById('sSalami').value = INITIAL_INVENTORY.salami;
  document.getElementById('sHam').value = INITIAL_INVENTORY.ham;
  document.getElementById('sVegetables').value = INITIAL_INVENTORY.vegetables;
  document.getElementById('sTuna').value = INITIAL_INVENTORY.tuna;
  document.getElementById('sCola').value = INITIAL_INVENTORY.cola;
  document.getElementById('sFanta').value = INITIAL_INVENTORY.fanta;
  document.getElementById('sWater').value = INITIAL_INVENTORY.water;
  document.getElementById('sBeer').value = INITIAL_INVENTORY.beer;
  document.getElementById('sWine').value = INITIAL_INVENTORY.house_wine;
  document.getElementById('settingsOverlay').classList.add('open');
}
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }

function saveSettings() {
  CONFIG.minCustomers = Math.max(0, +document.getElementById('sMinCust').value || 0);
  CONFIG.maxCustomers = Math.max(CONFIG.minCustomers + 1, +document.getElementById('sMaxCust').value || 6);
  CONFIG.drinkProbability = Math.min(1, Math.max(0, +document.getElementById('sDrinkProb').value || 0.7));
  INITIAL_INVENTORY.flour = +document.getElementById('sFlour').value || 30000;
  INITIAL_INVENTORY.sauce = +document.getElementById('sSauce').value || 12000;
  INITIAL_INVENTORY.cheese = +document.getElementById('sCheese').value || 18000;
  INITIAL_INVENTORY.salami = +document.getElementById('sSalami').value || 4000;
  INITIAL_INVENTORY.ham = +document.getElementById('sHam').value || 4000;
  INITIAL_INVENTORY.vegetables = +document.getElementById('sVegetables').value || 5000;
  INITIAL_INVENTORY.tuna = +document.getElementById('sTuna').value || 3000;
  INITIAL_INVENTORY.cola = +document.getElementById('sCola').value || 48;
  INITIAL_INVENTORY.fanta = +document.getElementById('sFanta').value || 36;
  INITIAL_INVENTORY.water = +document.getElementById('sWater').value || 60;
  INITIAL_INVENTORY.beer = +document.getElementById('sBeer').value || 48;
  INITIAL_INVENTORY.house_wine = +document.getElementById('sWine').value || 30;
  closeSettings();
  resetSimulation();
}

// ═══════════════════════════════════════
//  ACTIONS
// ═══════════════════════════════════════
function resetSimulation() { initState(); renderAll(null); }
function nextRound() {
  if (state.closed || state.dayOver) return;
  const result = simulateTick();
  renderAll(result);
  flashKPIs();
}

initState();
renderAll(null);
