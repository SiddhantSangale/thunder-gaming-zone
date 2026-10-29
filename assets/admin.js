// Admin dashboard logic — depends on booking-data.js being loaded first.
// NOTE: prototype-only auth. Credentials are hardcoded client-side; replace with
// real server-side authentication before this ever goes live.

const TZ_ADMIN_USER = 'admin';
const TZ_ADMIN_PASS = 'thunder2026';
const TZ_ADMIN_SESSION_KEY = 'tz_admin_session';

const loginWrap = document.getElementById('loginWrap');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

const filterDate = document.getElementById('filterDate');
const allDatesBtn = document.getElementById('allDatesBtn');

let currentFilterDate = new Date().toISOString().slice(0, 10);
filterDate.value = currentFilterDate;

function showDashboard() {
  loginWrap.style.display = 'none';
  dashboard.style.display = '';
  logoutBtn.style.display = '';
  renderDashboard();
}

function showLogin() {
  loginWrap.style.display = '';
  dashboard.style.display = 'none';
  logoutBtn.style.display = 'none';
}

if (sessionStorage.getItem(TZ_ADMIN_SESSION_KEY) === 'true') {
  showDashboard();
} else {
  showLogin();
}

loginBtn.addEventListener('click', attemptLogin);
document.getElementById('adminPass').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') attemptLogin();
});

function attemptLogin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  if (user === TZ_ADMIN_USER && pass === TZ_ADMIN_PASS) {
    sessionStorage.setItem(TZ_ADMIN_SESSION_KEY, 'true');
    loginError.textContent = '';
    showDashboard();
  } else {
    loginError.textContent = 'Incorrect username or password.';
  }
}

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(TZ_ADMIN_SESSION_KEY);
  showLogin();
});

filterDate.addEventListener('change', () => {
  currentFilterDate = filterDate.value;
  renderDashboard();
});

allDatesBtn.addEventListener('click', () => {
  currentFilterDate = null;
  filterDate.value = '';
  renderDashboard();
});

function renderDashboard() {
  const all = tzGetBookings().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const todays = currentFilterDate ? all.filter(b => b.date === currentFilterDate) : all;

  renderStats(all);
  Object.keys(TZ_STATION_CONFIG).forEach(type => renderSlotGrid(type, todays));
  renderTable(todays);
}

function renderStats(all) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysBookings = all.filter(b => b.date === today);
  const revenue = all.reduce((sum, b) => sum + (b.total || 0), 0);

  document.getElementById('adminStats').innerHTML = `
    <div class="stat-card"><span class="stat-num">${all.length}</span><span class="stat-label">Total bookings</span></div>
    <div class="stat-card"><span class="stat-num">${todaysBookings.length}</span><span class="stat-label">Today's bookings</span></div>
    ${Object.entries(TZ_STATION_CONFIG).map(([type, cfg]) => `<div class="stat-card"><span class="stat-num">${todaysBookings.filter(b => b.type === type).length}</span><span class="stat-label">${cfg.icon} ${cfg.label} today</span></div>`).join('')}
    <div class="stat-card"><span class="stat-num">₹${revenue}</span><span class="stat-label">Est. total revenue</span></div>
  `;
}

function renderSlotGrid(type, bookings) {
  const cfg = TZ_STATION_CONFIG[type];
  const grid = document.getElementById(type + 'SlotGrid');
  const occLabel = document.getElementById(type + 'Occ');
  const bookedSlots = new Set(bookings.filter(b => b.type === type).map(b => b.slot));
  occLabel.textContent = currentFilterDate ? `${bookedSlots.size}/${cfg.slots} booked on ${currentFilterDate}` : '';

  grid.innerHTML = '';
  for (let i = 1; i <= cfg.slots; i++) {
    const btn = document.createElement('div');
    btn.className = 'seat ' + (bookedSlots.has(i) ? 'booked' : 'available');
    btn.textContent = cfg.icon + ' ' + i;
    grid.appendChild(btn);
  }
}

function renderTable(bookings) {
  const body = document.getElementById('bookingsBody');
  const noBookings = document.getElementById('noBookings');
  body.innerHTML = '';

  if (!bookings.length) {
    noBookings.style.display = '';
    return;
  }
  noBookings.style.display = 'none';

  bookings.forEach(b => {
    const cfg = TZ_STATION_CONFIG[b.type];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.date}</td>
      <td>${tzFormatTime12(b.time)}</td>
      <td>${cfg.icon} ${cfg.label}</td>
      <td>${b.slot}</td>
      <td>${b.duration}${b.duration === 1 ? ' hr' : ' hrs'}</td>
      <td>${b.players}</td>
      <td>${b.name}</td>
      <td><a href="tel:${b.phone}">${b.phone}</a></td>
      <td>₹${b.total}</td>
      <td><button type="button" class="btn-cancel" data-id="${b.id}">Cancel</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Cancel this booking?')) {
        tzDeleteBooking(btn.dataset.id);
        renderDashboard();
      }
    });
  });
}

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (confirm('Delete ALL demo bookings? This cannot be undone.')) {
    tzSaveBookings([]);
    renderDashboard();
  }
});
