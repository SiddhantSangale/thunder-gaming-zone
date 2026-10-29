// Shared booking data layer — used by booking.html and admin.html.
// Prototype only: bookings persist in this browser's localStorage, not a real backend.

const TZ_BOOKINGS_KEY = 'tz_bookings';

const TZ_STATION_CONFIG = {
  ps5: { label: 'PS5 Lounge', icon: '🎮', slots: 4, rate: { 1: 90, 2: 45, 3: 45, 4: 45 } },
  pc:  { label: 'RTX 4060 PC', icon: '🖥️', slots: 6, rate: 50 },
  sim: { label: 'Racing Simulator', icon: '🏎️', slots: 2, rate: 90 },
  vr:  { label: 'VR & MetaBat', icon: '🥽', slots: 1, rate: 150 }
};

// Hourly start times the zone accepts bookings for (09:00 to 22:00, closes 23:00)
const TZ_TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = 9 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

function tzGetBookings() {
  try {
    return JSON.parse(localStorage.getItem(TZ_BOOKINGS_KEY)) || [];
  } catch {
    return [];
  }
}

function tzSaveBookings(bookings) {
  localStorage.setItem(TZ_BOOKINGS_KEY, JSON.stringify(bookings));
}

function tzAddBooking(booking) {
  const bookings = tzGetBookings();
  bookings.push(booking);
  tzSaveBookings(bookings);
  return booking;
}

function tzDeleteBooking(id) {
  tzSaveBookings(tzGetBookings().filter(b => b.id !== id));
}

function tzTimeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Does [startA, startA+durA) overlap [startB, startB+durB)?
function tzRangesOverlap(startA, durA, startB, durB) {
  const aStart = tzTimeToMinutes(startA), aEnd = aStart + durA * 60;
  const bStart = tzTimeToMinutes(startB), bEnd = bStart + durB * 60;
  return aStart < bEnd && bStart < aEnd;
}

function tzIsSlotBooked(type, slot, date, time, duration, excludeId) {
  return tzGetBookings().some(b =>
    b.id !== excludeId &&
    b.type === type && b.slot === slot && b.date === date &&
    tzRangesOverlap(b.time, b.duration, time, duration)
  );
}

function tzEstimateTotal(type, duration, players) {
  const cfg = TZ_STATION_CONFIG[type];
  if (type === 'ps5') {
    const perPerson = cfg.rate[Math.min(players, 4)] || cfg.rate[4];
    return perPerson * players * duration;
  }
  return cfg.rate * duration;
}

function tzFormatTime12(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function tzGenId() {
  return 'TZ' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}
