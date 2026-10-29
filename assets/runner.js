// Volt Run — an endless runner on the console screen in the Arcade section.
// Volt (a little bolt-powered robot) jumps over lag-spike blocks and grabs ⚡ bolts for bonus points.
(function () {
  const canvas = document.getElementById('runnerCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const GROUND = H - 46;
  const PX = 4; // size of one "pixel" in the art

  const HI_KEY = 'tz_volt_run_hi';
  let hi = 0;
  try { hi = Number(localStorage.getItem(HI_KEY)) || 0; } catch (e) { /* storage blocked: session-only high score */ }

  const player = { x: 70, y: GROUND, w: 7 * PX, h: 9 * PX, vy: 0, onGround: true };
  let state = 'ready';            // ready | running | over
  let speed, distance, bonus, obstacles, bolts, nextGap, frameT = 0, overAt = 0;
  let stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * (GROUND - 90), s: Math.random() < 0.2 ? 2 : 1 }));
  const city = Array.from({ length: 14 }, (_, i) => ({ x: i * 60, w: 36 + Math.random() * 30, h: 40 + Math.random() * 70 }));

  function reset() {
    speed = 320; distance = 0; bonus = 0;
    obstacles = []; bolts = []; nextGap = 380;
    player.y = GROUND; player.vy = 0; player.onGround = true;
  }
  reset();

  const score = () => Math.floor(distance / 12) + bonus;

  function jump() {
    if (state === 'ready') { state = 'running'; return; }
    if (state === 'over') {
      if (performance.now() - overAt > 450) { reset(); state = 'running'; }
      return;
    }
    if (player.onGround) { player.vy = -760; player.onGround = false; }
  }

  // --- spawning ---
  function spawn() {
    const tall = 1 + Math.floor(Math.random() * 3);          // 1-3 blocks high
    const wide = Math.random() < 0.25 ? 2 : 1;
    obstacles.push({ x: W + 10, w: wide * 6 * PX, h: tall * 5 * PX });
    if (Math.random() < 0.55) bolts.push({ x: W + 10 + 90 + Math.random() * 120, y: GROUND - 90 - Math.random() * 50, got: false });
    nextGap = 260 + Math.random() * 260 + speed * 0.35;
  }

  // --- update ---
  function update(dt) {
    if (state !== 'running') return;
    speed = Math.min(760, speed + 9 * dt);
    const dx = speed * dt;
    distance += dx;

    player.vy += 2300 * dt;
    player.y += player.vy * dt;
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }

    nextGap -= dx;
    if (nextGap <= 0) spawn();
    obstacles.forEach(o => { o.x -= dx; });
    bolts.forEach(b => { b.x -= dx; });
    obstacles = obstacles.filter(o => o.x + o.w > -10);
    bolts = bolts.filter(b => b.x > -20 && !b.got);

    // collisions (slightly forgiving hitbox)
    const px = player.x + 5, py = player.y - player.h + 6, pw = player.w - 10, ph = player.h - 8;
    for (const o of obstacles) {
      if (px < o.x + o.w && px + pw > o.x && py + ph > GROUND - o.h) { gameOver(); return; }
    }
    for (const b of bolts) {
      if (Math.abs(b.x - (player.x + player.w / 2)) < 22 && Math.abs(b.y - (player.y - player.h / 2)) < 26) { b.got = true; bonus += 25; }
    }
    city.forEach(c => { c.x -= dx * 0.25; if (c.x + c.w < 0) c.x += 14 * 60; });
    stars.forEach(s => { s.x -= dx * 0.05; if (s.x < 0) s.x += W; });
  }

  function gameOver() {
    state = 'over'; overAt = performance.now();
    if (score() > hi) { hi = score(); try { localStorage.setItem(HI_KEY, String(hi)); } catch (e) { /* ignore */ } }
  }

  // --- drawing ---
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  function drawPlayer() {
    const x = player.x, y = player.y - player.h;
    const run = state === 'running' && player.onGround ? Math.floor(frameT * 10) % 2 : 0;
    rect(x + PX, y, 5 * PX, PX, '#1e9bff');                 // head top
    rect(x, y + PX, 7 * PX, 3 * PX, '#1e9bff');             // head
    rect(x + 4 * PX, y + 2 * PX, 2 * PX, PX, '#e7f5ff');    // visor
    rect(x + PX, y + 4 * PX, 5 * PX, 3 * PX, '#0b5fb5');    // body
    rect(x + 3 * PX, y + 4 * PX, PX, PX, '#ffd43b');        // bolt on chest
    rect(x + 2 * PX, y + 5 * PX, 2 * PX, PX, '#ffd43b');
    rect(x + 3 * PX, y + 6 * PX, PX, PX, '#ffd43b');
    rect(x + 6 * PX, y + 5 * PX, PX, PX, '#1e9bff');        // arm
    // legs alternate while running
    rect(x + (run ? PX : 2 * PX), y + 7 * PX, PX, 2 * PX, '#e7f5ff');
    rect(x + (run ? 5 * PX : 4 * PX), y + 7 * PX, PX, 2 * PX, '#e7f5ff');
    rect(x + 3 * PX, y - PX, PX, PX, '#ffd43b');            // antenna spark
  }

  function drawObstacle(o) {
    const top = GROUND - o.h;
    for (let yy = top; yy < GROUND; yy += 5 * PX) {
      for (let xx = o.x; xx < o.x + o.w; xx += 6 * PX) {
        rect(xx, yy, 6 * PX - 2, 5 * PX - 2, '#ff4d6d');
        rect(xx + PX, yy + PX, 2 * PX, PX, '#ffb3c1');
        rect(xx + 3 * PX, yy + 3 * PX, 2 * PX, PX, '#a3123a');
      }
    }
    if (Math.floor(frameT * 8) % 2) rect(o.x - PX, top + PX * 2, PX, PX, '#ff4d6d');   // glitch flicker
  }

  function drawBolt(b) {
    const x = b.x, y = b.y + Math.sin(frameT * 6 + b.x) * 3;
    ctx.fillStyle = '#ffd43b';
    [[1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4]].forEach(([cx, cy]) => ctx.fillRect(Math.round(x + cx * PX), Math.round(y + cy * PX), PX, PX));
  }

  function draw() {
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#060b1f'); g.addColorStop(1, '#14204a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => rect(s.x, s.y, s.s, s.s, 'rgba(200,220,255,.8)'));
    city.forEach(c => {
      rect(c.x, GROUND - c.h, c.w, c.h, '#1b2a5c');
      for (let wy = GROUND - c.h + 8; wy < GROUND - 8; wy += 12)
        for (let wx = c.x + 6; wx < c.x + c.w - 6; wx += 10)
          if ((wx * 7 + wy * 3) % 5 < 2) rect(wx, wy, 4, 4, '#ffd43b55');
    });
    // ground
    rect(0, GROUND, W, H - GROUND, '#0b1230');
    rect(0, GROUND, W, PX, '#1ec8ff');
    const off = (distance * 0.9) % 32;
    for (let x = -off; x < W; x += 32) rect(x, GROUND + 12, 14, PX, '#1e3a7a');

    bolts.forEach(drawBolt);
    obstacles.forEach(drawObstacle);
    drawPlayer();

    // HUD
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'right'; ctx.fillStyle = '#e7f5ff';
    ctx.fillText(String(score()).padStart(5, '0'), W - 14, 26);
    ctx.fillStyle = '#74c0fc'; ctx.fillText('HI ' + String(hi).padStart(5, '0'), W - 110, 26);

    ctx.textAlign = 'center';
    if (state === 'ready') {
      ctx.fillStyle = '#ffd43b'; ctx.font = '18px "Press Start 2P", monospace'; ctx.fillText('VOLT RUN', W / 2, H / 2 - 34);
      ctx.fillStyle = '#e7f5ff'; ctx.font = '10px "Press Start 2P", monospace'; ctx.fillText('PRESS A / SPACE / TAP TO START', W / 2, H / 2 - 8);
    } else if (state === 'over') {
      ctx.fillStyle = '#ff4d6d'; ctx.font = '18px "Press Start 2P", monospace'; ctx.fillText('GAME OVER', W / 2, H / 2 - 34);
      ctx.fillStyle = '#e7f5ff'; ctx.font = '10px "Press Start 2P", monospace'; ctx.fillText('PRESS A TO PLAY AGAIN', W / 2, H / 2 - 8);
    }
  }

  // --- loop: only runs while the console is on screen ---
  let visible = false, last = 0, raf = null;
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now; frameT += dt;
    update(dt); draw();
    raf = visible ? requestAnimationFrame(loop) : null;
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }, { threshold: 0.2 }).observe(canvas);
  document.fonts && document.fonts.ready.then(draw);
  draw();

  // --- input ---
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  document.querySelectorAll('[data-runner="jump"]').forEach(b => b.addEventListener('pointerdown', (e) => {
    e.preventDefault(); b.classList.add('pressed'); jump();
  }));
  document.querySelectorAll('[data-runner]').forEach(b => {
    ['pointerup', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('pressed')));
  });
  document.addEventListener('keydown', (e) => {
    if (!visible || !['Space', 'ArrowUp', 'KeyW'].includes(e.code)) return;
    if (e.target.closest('input, textarea, button, a')) return;
    e.preventDefault();   // don't scroll the page while playing
    jump();
  });
})();
