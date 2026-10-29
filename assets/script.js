// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// Header shrink on scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) header.style.borderBottomColor = 'rgba(30,200,255,.25)';
  else header.style.borderBottomColor = '';
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Events modal
const eventsBtn = document.getElementById('eventsBtn');
const eventsModal = document.getElementById('eventsModal');
const eventsClose = document.getElementById('eventsClose');
if (eventsBtn && eventsModal && eventsClose) {
  eventsBtn.addEventListener('click', () => eventsModal.classList.add('open'));
  eventsClose.addEventListener('click', () => eventsModal.classList.remove('open'));
  eventsModal.addEventListener('click', (e) => {
    if (e.target === eventsModal) eventsModal.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') eventsModal.classList.remove('open');
  });
}

// Scroll reveal: elements with .reveal animate in when they enter the viewport
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  revealEls.forEach(el => io.observe(el));
}

// Gentle parallax on the Events trophies photo while it is on screen
const eventsPhoto = document.querySelector('.events-photo');
if (eventsPhoto && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const onScroll = () => {
    const r = eventsPhoto.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const progress = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;  // -1..1 around screen centre
    eventsPhoto.style.setProperty('--parallax', `${(progress * -24).toFixed(1)}px`);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Snack shop — click packets / drinks to build a list; it can be sent to the counter on WhatsApp
const snackListEl = document.getElementById('snackList');
if (snackListEl) {
  const emptyEl = document.getElementById('snackEmpty');
  const actionsEl = document.getElementById('snackActions');
  const sendEl = document.getElementById('snackSend');
  const items = document.querySelectorAll('.snack-item');
  const order = new Map(); // name -> qty, in the order items were first added

  const decode = (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };

  function render() {
    snackListEl.innerHTML = '';
    order.forEach((qty, name) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="sl-name"></span>
        <button type="button" class="sl-btn" data-act="dec" aria-label="One less">−</button>
        <span class="sl-qty">${qty}</span>
        <button type="button" class="sl-btn" data-act="inc" aria-label="One more">+</button>
        <button type="button" class="sl-btn" data-act="del" aria-label="Remove">✕</button>`;
      li.querySelector('.sl-name').textContent = name;
      li.dataset.name = name;
      snackListEl.appendChild(li);
    });
    const hasItems = order.size > 0;
    emptyEl.hidden = hasItems;
    actionsEl.hidden = !hasItems;

    items.forEach(btn => {
      const qty = order.get(decode(btn.dataset.name)) || 0;
      btn.classList.toggle('in-list', qty > 0);
      btn.querySelector('.item-count').textContent = qty || '';
    });

    const total = [...order.values()].reduce((sum, q) => sum + q, 0);
    document.querySelectorAll('[data-lcd]').forEach(l => { l.textContent = total ? `${total} IN LIST` : 'READY'; });

    const text = 'Hi Thunder! Snack order:\n' + [...order].map(([n, q]) => `• ${n} × ${q}`).join('\n');
    sendEl.href = 'https://wa.me/919082535250?text=' + encodeURIComponent(text);
  }

  items.forEach(btn => btn.addEventListener('click', () => {
    const name = decode(btn.dataset.name);
    order.set(name, (order.get(name) || 0) + 1);
    btn.classList.remove('added');
    void btn.offsetWidth; // restart the pop animation
    btn.classList.add('added');
    render();
  }));

  snackListEl.addEventListener('click', (e) => {
    const b = e.target.closest('.sl-btn');
    if (!b) return;
    const name = b.closest('li').dataset.name;
    const qty = order.get(name);
    if (b.dataset.act === 'inc') order.set(name, qty + 1);
    else if (b.dataset.act === 'dec' && qty > 1) order.set(name, qty - 1);
    else order.delete(name);
    render();
  });

  document.getElementById('snackClear').addEventListener('click', () => { order.clear(); render(); });
  render();
}

// Loading intro — a forked lightning strike from the sky into the gap between THU and DER,
// where the logo's bolt lands; then Tesla arcs crackle off the letters. CSS handles the logo bolt,
// letters and blackout.
const intro = document.getElementById('intro');
if (intro) {
  const canvas = document.getElementById('introCanvas');
  const ctx = canvas.getContext('2d');
  const gap = document.getElementById('introGap');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = null;
  let finished = false;

  const endIntro = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(rafId);
    intro.classList.add('done');
    document.body.classList.remove('intro-active');
  };
  intro.addEventListener('animationend', (e) => { if (e.target === intro) endIntro(); });
  document.getElementById('introSkip').addEventListener('click', endIntro);
  setTimeout(endIntro, 4600); // safety net if animationend never fires

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const rand = (a, b) => a + Math.random() * (b - a);

  // Jagged channel between two points (midpoint displacement)
  function channel(x1, y1, x2, y2, roughness, depth) {
    let pts = [[x1, y1], [x2, y2]];
    let offset = roughness;
    for (let d = 0; d < depth; d++) {
      const next = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const shift = rand(-offset, offset);
        next.push([(ax + bx) / 2 + (-(by - ay) / len) * shift, (ay + by) / 2 + ((bx - ax) / len) * shift], pts[i]);
      }
      pts = next;
      offset /= 2;
    }
    return pts;
  }

  // A full bolt: a main channel with a few forks, which fork again more thinly.
  // `forks` lists how many forks to grow at each level, e.g. [5, 2, 1]. Returns [{ pts, width }].
  function bolt(x1, y1, x2, y2, width, forks, level = 0) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const depth = Math.max(2, Math.min(7, Math.ceil(Math.log2(len / 9))));
    const pts = channel(x1, y1, x2, y2, len * 0.16, depth);
    const parts = [{ pts, width }];
    const count = forks[level] || 0;
    const dir = Math.atan2(y2 - y1, x2 - x1);
    for (let k = 0; k < count; k++) {
      const i = Math.floor(rand(0.1, 0.8) * (pts.length - 1));
      const [fx, fy] = pts[i];
      const remaining = len * (1 - i / (pts.length - 1));
      const a = dir + (Math.random() < 0.5 ? -1 : 1) * rand(0.4, 1.0);
      const l = Math.max(18, remaining * rand(0.3, 0.7));
      parts.push(...bolt(fx, fy, fx + Math.cos(a) * l, fy + Math.sin(a) * l, width * 0.5, forks, level + 1));
    }
    return parts;
  }

  // Bloom comes from the CSS drop-shadow filter on the canvas (GPU), so strokes stay cheap here
  function drawBolt(parts, alpha, progress = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = ctx.lineCap = 'round';
    for (const { pts, width } of parts) {
      const count = Math.max(2, Math.ceil(pts.length * progress));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < count; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      // violet halo → blue glow → white-hot core
      ctx.strokeStyle = `rgba(110,100,255,${alpha * 0.18})`;
      ctx.lineWidth = width * 6;
      ctx.stroke();
      ctx.strokeStyle = `rgba(110,200,255,${alpha * 0.55})`;
      ctx.lineWidth = width * 2.4;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = Math.max(0.7, width * 0.85);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Light burst at the strike point: soft bloom plus thin rays
  function drawBurst(x, y, radius, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(235,245,255,${alpha})`);
    g.addColorStop(0.18, `rgba(120,190,255,${alpha * 0.6})`);
    g.addColorStop(0.5, `rgba(80,90,255,${alpha * 0.18})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.strokeStyle = `rgba(190,225,255,${alpha * 0.2})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + rand(-0.08, 0.08);
      const r = radius * rand(0.5, 1.1);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * radius * 0.08, y + Math.sin(a) * radius * 0.08);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  const gapBox = () => {
    const r = gap.getBoundingClientRect();
    return { cx: r.left + r.width / 2, top: r.top, bottom: r.bottom, h: r.height };
  };

  // Tesla arcs: forked tendrils reaching outward from the letters — left off THU, right off DER,
  // some up and down off the top and bottom edges. Drawn behind the letters.
  const thu = document.getElementById('introThu');
  const der = document.getElementById('introDer');
  function teslaArc() {
    const left = Math.random() < 0.5;
    const r = (left ? thu : der).getBoundingClientRect();
    const out = left ? -1 : 1;
    const reach = r.height * rand(0.9, 2.6);
    let x, y, a;
    if (Math.random() < 0.55) {
      // off the outer side, spreading sideways like the reference
      x = left ? r.left + r.width * 0.08 : r.right - r.width * 0.08;
      y = rand(r.top + r.height * 0.2, r.bottom - r.height * 0.2);
      a = (left ? Math.PI : 0) + rand(-0.6, 0.6);
    } else {
      // off the top or bottom edge, leaning outward
      const top = Math.random() < 0.5;
      x = rand(r.left + r.width * 0.1, r.right - r.width * 0.1);
      y = top ? r.top + r.height * 0.1 : r.bottom - r.height * 0.1;
      a = (top ? -Math.PI / 2 : Math.PI / 2) + out * rand(0.3, 1.0) * (top ? 1 : -1);
    }
    return bolt(x, y, x + Math.cos(a) * reach, y + Math.sin(a) * reach, rand(1.2, 2), [2, 1]);
  }

  // Reduced motion: no strike or arcs — the CSS just shows the logo bolt and letters
  if (!reduceMotion) {
    const start = performance.now();
    const g0 = gapBox();
    // the strike always enters from the top-right and angles down into the gap
    const skyX = Math.min(innerWidth - 20, g0.cx + innerWidth * rand(0.22, 0.34));
    let strike = bolt(skyX, -40, g0.cx, g0.bottom, 3.4, [6, 2, 1]);
    let arcs = [], lastArcs = 0;

    const frame = (now) => {
      const t = now - start;
      const g = gapBox();
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      // 120–360ms: the strike races down from the sky
      if (t > 120 && t <= 360) drawBolt(strike, 1, (t - 120) / 240);

      // 360–900ms: impact — the strike flickers and fades as the logo bolt (CSS) lands in the gap
      if (t > 360 && t < 900) {
        if (Math.random() < 0.2) strike = bolt(skyX, -40, g.cx, g.bottom, 3.4, [6, 2, 1]);
        const fade = 1 - (t - 360) / 540;
        drawBolt(strike, fade * (Math.random() < 0.2 ? 0.25 : 1));
        drawBurst(g.cx, (g.top + g.bottom) / 2, g.h * rand(1.3, 1.5) * (0.6 + fade * 0.5), fade * 0.75);
      }

      // 1.55s until the blackout: arcs crackle off the letters, re-forming every ~65ms
      if (t > 1550 && t < 3250) {
        const master = t < 2850 ? Math.min(1, (t - 1550) / 150) : Math.max(0, 1 - (t - 2850) / 400);
        if (now - lastArcs > 65) {
          arcs = Array.from({ length: Math.round(rand(3, 6)) }, teslaArc);
          lastArcs = now;
        }
        arcs.forEach(a => drawBolt(a, master * rand(0.55, 1)));
      }

      if (t < 3300 && !finished) rafId = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    rafId = requestAnimationFrame(frame);
  }
}
