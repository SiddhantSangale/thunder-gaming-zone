// Booking page logic — depends on booking-data.js being loaded first.

const state = {
  type: 'ps5',
  date: '',
  time: '',
  duration: 1,
  seat: null,
  players: 1
};

const dateInput = document.getElementById('bkDate');
const typeTabs = document.getElementById('typeTabs');
const timeSlotsEl = document.getElementById('timeSlots');
const durValue = document.getElementById('durValue');
const seatGrid = document.getElementById('seatGrid');
const playersStep = document.getElementById('playersStep');
const playersValue = document.getElementById('playersValue');
const bkError = document.getElementById('bkError');

const sumType = document.getElementById('sumType');
const sumDate = document.getElementById('sumDate');
const sumTime = document.getElementById('sumTime');
const sumDuration = document.getElementById('sumDuration');
const sumSeat = document.getElementById('sumSeat');
const sumPlayers = document.getElementById('sumPlayers');
const sumTotal = document.getElementById('sumTotal');

// Init date to today, min today
const today = new Date().toISOString().slice(0, 10);
dateInput.value = today;
dateInput.min = today;
state.date = today;

function renderTimeSlots() {
  timeSlotsEl.innerHTML = '';
  TZ_TIME_SLOTS.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot' + (t === state.time ? ' active' : '');
    btn.textContent = tzFormatTime12(t);
    btn.addEventListener('click', () => {
      state.time = t;
      state.seat = null;
      const maxDuration = Math.floor((23 * 60 - tzTimeToMinutes(t)) / 60);
      if (state.duration > maxDuration) {
        state.duration = Math.max(1, maxDuration);
        durValue.textContent = state.duration + (state.duration === 1 ? ' hr' : ' hrs');
      }
      renderTimeSlots();
      renderSeatGrid();
      updateSummary();
    });
    timeSlotsEl.appendChild(btn);
  });
}

function renderSeatGrid() {
  const cfg = TZ_STATION_CONFIG[state.type];
  seatGrid.innerHTML = '';
  if (!state.time) {
    seatGrid.innerHTML = '<p class="seat-hint">Pick a start time to see available stations.</p>';
    return;
  }
  for (let i = 1; i <= cfg.slots; i++) {
    const booked = tzIsSlotBooked(state.type, i, state.date, state.time, state.duration);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seat' + (booked ? ' booked' : state.seat === i ? ' selected' : ' available');
    btn.disabled = booked;
    btn.textContent = cfg.icon + ' ' + i;
    btn.addEventListener('click', () => {
      state.seat = i;
      renderSeatGrid();
      updateSummary();
    });
    seatGrid.appendChild(btn);
  }
}

function updateSummary() {
  const cfg = TZ_STATION_CONFIG[state.type];
  sumType.textContent = cfg.label;
  sumDate.textContent = state.date ? new Date(state.date + 'T00:00').toDateString() : '—';
  sumTime.textContent = state.time ? tzFormatTime12(state.time) : '—';
  sumDuration.textContent = state.duration + (state.duration === 1 ? ' hr' : ' hrs');
  sumSeat.textContent = state.seat ? cfg.icon + ' Station ' + state.seat : '—';
  sumPlayers.textContent = state.players;
  sumTotal.textContent = '₹' + tzEstimateTotal(state.type, state.duration, state.type === 'ps5' ? state.players : 1);
}

// Date change
dateInput.addEventListener('change', () => {
  state.date = dateInput.value || today;
  state.seat = null;
  renderSeatGrid();
  updateSummary();
});

// Type tabs
typeTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.type-tab');
  if (!btn) return;
  typeTabs.querySelectorAll('.type-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.type = btn.dataset.type;
  state.seat = null;
  playersStep.style.display = state.type === 'ps5' ? '' : 'none';
  renderSeatGrid();
  updateSummary();
});

// Duration stepper
document.getElementById('durMinus').addEventListener('click', () => {
  if (state.duration > 1) {
    state.duration--;
    durValue.textContent = state.duration + (state.duration === 1 ? ' hr' : ' hrs');
    renderSeatGrid();
    updateSummary();
  }
});
document.getElementById('durPlus').addEventListener('click', () => {
  const maxDuration = state.time ? (23 * 60 - tzTimeToMinutes(state.time)) / 60 : 4;
  if (state.duration < Math.min(4, maxDuration)) {
    state.duration++;
    durValue.textContent = state.duration + (state.duration === 1 ? ' hr' : ' hrs');
    renderSeatGrid();
    updateSummary();
  }
});

// Players stepper
document.getElementById('playersMinus').addEventListener('click', () => {
  if (state.players > 1) {
    state.players--;
    playersValue.textContent = state.players;
    updateSummary();
  }
});
document.getElementById('playersPlus').addEventListener('click', () => {
  if (state.players < 4) {
    state.players++;
    playersValue.textContent = state.players;
    updateSummary();
  }
});

// Confirm booking
const confirmModal = document.getElementById('confirmModal');
const confirmClose = document.getElementById('confirmClose');
const confirmDone = document.getElementById('confirmDone');

document.getElementById('confirmBtn').addEventListener('click', () => {
  bkError.textContent = '';
  const name = document.getElementById('bkName').value.trim();
  const phone = document.getElementById('bkPhone').value.trim();

  if (!state.time) { bkError.textContent = 'Please choose a start time.'; return; }
  if (!state.seat) { bkError.textContent = 'Please pick a station.'; return; }
  if (!name) { bkError.textContent = 'Please enter your name.'; return; }
  if (!/^[0-9]{10}$/.test(phone)) { bkError.textContent = 'Please enter a valid 10-digit phone number.'; return; }

  // Re-check availability right before saving (avoids a stale-selection race)
  if (tzIsSlotBooked(state.type, state.seat, state.date, state.time, state.duration)) {
    bkError.textContent = 'That station was just booked by someone else — please pick another.';
    renderSeatGrid();
    return;
  }

  const cfg = TZ_STATION_CONFIG[state.type];
  const players = state.type === 'ps5' ? state.players : 1;
  const booking = {
    id: tzGenId(),
    type: state.type,
    slot: state.seat,
    date: state.date,
    time: state.time,
    duration: state.duration,
    players,
    name,
    phone,
    total: tzEstimateTotal(state.type, state.duration, players),
    createdAt: new Date().toISOString()
  };
  tzAddBooking(booking);

  document.getElementById('confirmRef').textContent = booking.id;
  document.getElementById('confirmSummary').innerHTML = `
    <li><span>Setup</span><strong>${cfg.label}</strong></li>
    <li><span>Date</span><strong>${new Date(booking.date + 'T00:00').toDateString()}</strong></li>
    <li><span>Time</span><strong>${tzFormatTime12(booking.time)} · ${booking.duration}${booking.duration === 1 ? ' hr' : ' hrs'}</strong></li>
    <li><span>Station</span><strong>${cfg.icon} Station ${booking.slot}</strong></li>
    <li><span>Total</span><strong>₹${booking.total}</strong></li>
  `;
  confirmModal.classList.add('open');
});

confirmClose.addEventListener('click', () => confirmModal.classList.remove('open'));
confirmDone.addEventListener('click', () => {
  confirmModal.classList.remove('open');
  state.seat = null;
  document.getElementById('bkName').value = '';
  document.getElementById('bkPhone').value = '';
  renderSeatGrid();
  updateSummary();
});

// Initial render
playersStep.style.display = state.type === 'ps5' ? '' : 'none';
renderTimeSlots();
renderSeatGrid();
updateSummary();
