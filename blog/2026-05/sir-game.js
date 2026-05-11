(() => {
  const host = document.querySelector('.fig1');
  if (!host) return;

  let started = false;
  function start() {
    if (started) return;
    started = true;
    actuallyStart();
  }
  if (host.classList.contains('scene-hidden') || host.offsetParent === null) {
    const obs = new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) { observer.disconnect(); start(); }
    });
    obs.observe(host);
  } else {
    start();
  }

  function actuallyStart() {
  const canvas = document.createElement('canvas');
  canvas.className = 'full-width';
  canvas.style.cursor = 'crosshair';
  canvas.style.background = 'transparent';
  canvas.style.display = 'block';
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = 500;
  const W = canvas.width, H = canvas.height;

  // ---- hex grid (pointy-top, odd-r offset) ----
  const HEX_SIZE = 30;
  const HEX_W = Math.sqrt(3) * HEX_SIZE;
  const ROW_STEP = HEX_SIZE * 1.5;
  const COLS = Math.floor((W - HEX_W) / HEX_W);
  const ROWS = Math.floor((H - HEX_SIZE * 2 - 10) / ROW_STEP) + 1;
  const gridW = HEX_W * COLS + HEX_W / 2;
  const ORIGIN_X = (W - gridW) / 2 + HEX_W / 2;
  const ORIGIN_Y = HEX_SIZE + 6;

  function hexCenter(c, r) {
    return {
      x: ORIGIN_X + c * HEX_W + (r & 1 ? HEX_W / 2 : 0),
      y: ORIGIN_Y + r * ROW_STEP,
    };
  }

  function hexNeighbors(c, r) {
    const evenRow = (r & 1) === 0;
    const off = evenRow
      ? [[-1,-1],[0,-1],[-1,0],[1,0],[-1,1],[0,1]]
      : [[ 0,-1],[1,-1],[-1,0],[1,0],[ 0,1],[1,1]];
    return off.map(([dc, dr]) => ({ c: c+dc, r: r+dr }))
              .filter(({c,r}) => c>=0 && c<COLS && r>=0 && r<ROWS);
  }

  function pickHex(px, py) {
    let best = null, bestD = Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = hexCenter(c, r);
        const d = (x-px)*(x-px) + (y-py)*(y-py);
        if (d < bestD) { bestD = d; best = { c, r, x, y }; }
      }
    }
    return best;
  }

  function drawHex(cx, cy, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI/2 + i * Math.PI/3;
      const px = cx + HEX_SIZE * Math.cos(a);
      const py = cy + HEX_SIZE * Math.sin(a);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  // ---- 1D Perlin noise (per-person seed) ----
  function makeNoise1D(seed) {
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let s = (seed * 2654435761) | 0;
    for (let i = 255; i > 0; i--) {
      s = ((s * 1664525) + 1013904223) | 0;
      const j = ((s >>> 0) % (i + 1));
      const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
    }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const fade = t => t*t*t*(t*(t*6 - 15) + 10);
    const lerp = (a, b, t) => a + t*(b - a);
    const grad = (h, x) => (h & 1 ? -x : x);
    return function (x) {
      const X = Math.floor(x) & 255;
      x -= Math.floor(x);
      const u = fade(x);
      return lerp(grad(p[X], x), grad(p[X+1], x-1), u);
    };
  }

  // ---- people ----
  const S = 0, I = 1, R = 2, D = 3, V = 4;
  const COLOR = ['#6b7380', '#e04040', '#7a9970', '#7a1818', '#3aa655'];
  const people = [];

  function spawnPerson(state) {
    const c = (Math.random() * COLS) | 0;
    const r = (Math.random() * ROWS) | 0;
    const { x: cx, y: cy } = hexCenter(c, r);
    return {
      x: cx + (Math.random() - 0.5) * HEX_SIZE * 0.7,
      y: cy + (Math.random() - 0.5) * HEX_SIZE * 0.5,
      tx: cx, ty: cy,
      cell: { c, r },
      state,
      noiseX: makeNoise1D((Math.random() * 65535) | 0),
      noiseY: makeNoise1D((Math.random() * 65535) | 0),
      idleSeed: Math.random() * 1000,
      walkTimer: 800 + Math.random() * 2400,
      speed: 0.022 + Math.random() * 0.02,
    };
  }

  function pickNewTarget(p) {
    let cell = p.cell;
    if (Math.random() < 0.55) {
      const nbrs = hexNeighbors(p.cell.c, p.cell.r);
      if (nbrs.length) cell = nbrs[(Math.random() * nbrs.length) | 0];
    }
    const { x, y } = hexCenter(cell.c, cell.r);
    p.tx = x + (Math.random() - 0.5) * HEX_SIZE * 0.7;
    p.ty = y + (Math.random() - 0.5) * HEX_SIZE * 0.5;
    p.cell = cell;
  }

  // ---- vaccination stations ----
  const STATION_BUDGET = 8;
  const SETUP_MS = 3000;                 // deployment time before active
  let stations = new Map();              // key "c,r" → { activeAt }
  let stationsLeft = STATION_BUDGET;
  const stationKey = (c, r) => `${c},${r}`;
  const hasStation = (c, r) => stations.has(stationKey(c, r));
  const stationAt = (c, r) => stations.get(stationKey(c, r));
  const isActive = (station, t) => station && t >= station.activeAt;

  // ---- disease ----
  const INFECTION_RADIUS = 28;
  const BETA  = 0.006;
  const GAMMA = 0.00004;
  const MU    = 0.000008;  // ~17% case fatality ratio (μ / (γ+μ))

  function step(dt, t) {
    for (const p of people) {
      if (p.state === D) continue;
      p.walkTimer -= dt;
      if (p.walkTimer <= 0) {
        pickNewTarget(p);
        p.walkTimer = 1400 + Math.random() * 2400;
      }
      const ns = t * 0.0008 + p.idleSeed;
      const nx = p.noiseX(ns);
      const ny = p.noiseY(ns);
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1.5) {
        const sp = p.speed * dt;
        p.x += (dx / dist) * sp + nx * 0.35;
        p.y += (dy / dist) * sp + ny * 0.35;
      } else {
        p.x += nx * 0.5;
        p.y += ny * 0.5;
      }
    }

    // Station vaccination: an S inside an *active* station hex becomes V.
    if (stations.size > 0) {
      for (const p of people) {
        if (p.state !== S) continue;
        const cell = pickHex(p.x, p.y);
        if (!cell) continue;
        const station = stationAt(cell.c, cell.r);
        if (!isActive(station, t)) continue;
        const dx = p.x - cell.x, dy = p.y - cell.y;
        if (dx*dx + dy*dy < HEX_SIZE * HEX_SIZE) p.state = V;
      }
    }

    // Pairwise infection (S near I).
    for (let i = 0; i < people.length; i++) {
      const A = people[i];
      if (A.state !== S) continue;
      for (let j = 0; j < people.length; j++) {
        if (i === j) continue;
        const B = people[j];
        if (B.state !== I) continue;
        const dx = A.x - B.x, dy = A.y - B.y;
        if (dx*dx + dy*dy < INFECTION_RADIUS * INFECTION_RADIUS) {
          if (Math.random() < BETA * dt) { A.state = I; break; }
        }
      }
    }

    // Recovery / death (mutually exclusive per tick).
    for (const p of people) {
      if (p.state !== I) continue;
      const u = Math.random();
      if (u < GAMMA * dt) p.state = R;
      else if (u < (GAMMA + MU) * dt) p.state = D;
    }
  }

  // ---- player action ----
  let placeFlash = null;       // green pulse on successful placement
  let removeFlash = null;      // orange pulse on station removal
  let invalidFlash = null;     // gray pulse on invalid placement
  let mouseX = -1, mouseY = -1, mouseInside = false;
  // Game starts paused; dialog.js dispatches 'sir-play' when it's the user's turn.
  let paused = true;
  let pausedAt = performance.now();
  // If dialog.js already requested play before this IIFE got to run, honor it.
  if (host.dataset.shouldPlay === 'true') {
    paused = false;
  }
  host.addEventListener('sir-play', () => { paused = false; });
  host.addEventListener('sir-pause', () => {
    if (!paused) { pausedAt = performance.now(); paused = true; }
  });
  let drag = null;             // { c, r, downX, downY, moved } when grabbing a station
  let downBtn = null;          // 'pause' | 'reset' | null

  const DRAG_THRESHOLD_PX = 5;

  // on-canvas buttons (top-right)
  const BTN_W = 72, BTN_H = 26, BTN_GAP = 8, BTN_PAD = 14;
  function pauseBtn() { return { x: W - BTN_W * 2 - BTN_GAP - BTN_PAD, y: 14, w: BTN_W, h: BTN_H }; }
  function resetBtn() { return { x: W - BTN_W - BTN_PAD,                y: 14, w: BTN_W, h: BTN_H }; }
  function hit(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  function overAnyButton(x, y) { return hit(pauseBtn(), x, y) || hit(resetBtn(), x, y); }

  function togglePause() {
    if (paused) { paused = false; }
    else { pausedAt = performance.now(); paused = true; }
  }

  function placeStation(c, r, t) {
    stations.set(stationKey(c, r), { activeAt: t + SETUP_MS });
  }
  function removeStation(c, r) {
    stations.delete(stationKey(c, r));
  }

  function pickHexUnderMouse(mx, my) {
    const cell = pickHex(mx, my);
    if (!cell) return null;
    if (Math.hypot(mx - cell.x, my - cell.y) > HEX_SIZE) return null;
    return cell;
  }

  function updateCursor() {
    if (overAnyButton(mouseX, mouseY)) { canvas.style.cursor = 'pointer'; return; }
    if (drag && drag.moved) { canvas.style.cursor = 'grabbing'; return; }
    const cell = pickHexUnderMouse(mouseX, mouseY);
    if (cell && hasStation(cell.c, cell.r)) { canvas.style.cursor = 'grab'; return; }
    canvas.style.cursor = 'crosshair';
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (W / rect.width);
    mouseY = (e.clientY - rect.top)  * (H / rect.height);
    mouseInside = true;
    if (drag) {
      const d = Math.hypot(mouseX - drag.downX, mouseY - drag.downY);
      if (d > DRAG_THRESHOLD_PX) drag.moved = true;
    }
    updateCursor();
  });

  canvas.addEventListener('mouseleave', () => {
    mouseInside = false;
    drag = null;     // cancel any in-progress drag
    downBtn = null;
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top)  * (H / rect.height);

    if (hit(pauseBtn(), mx, my)) { downBtn = 'pause'; return; }
    if (hit(resetBtn(), mx, my)) { downBtn = 'reset'; return; }
    downBtn = null;

    if (paused) return;
    const cell = pickHexUnderMouse(mx, my);
    if (!cell) return;
    if (hasStation(cell.c, cell.r)) {
      drag = { c: cell.c, r: cell.r, downX: mx, downY: my, moved: false };
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top)  * (H / rect.height);
    const t = performance.now();

    // Button releases.
    if (downBtn) {
      if (downBtn === 'pause' && hit(pauseBtn(), mx, my)) togglePause();
      if (downBtn === 'reset' && hit(resetBtn(), mx, my)) reset();
      downBtn = null;
      return;
    }
    if (paused) { drag = null; return; }

    // Drag-and-drop release.
    if (drag) {
      const target = pickHexUnderMouse(mx, my);

      if (!drag.moved) {
        // Click on station (no movement) → remove, refund budget.
        removeStation(drag.c, drag.r);
        stationsLeft++;
        removeFlash = { c: drag.c, r: drag.r, until: t + 360 };
      } else if (target && !hasStation(target.c, target.r)
                        && !(target.c === drag.c && target.r === drag.r)) {
        // Valid drop on empty hex → move station, restart setup timer.
        removeStation(drag.c, drag.r);
        placeStation(target.c, target.r, t);
        placeFlash = { c: target.c, r: target.r, until: t + 520 };
      } else {
        // Invalid drop (off-grid / occupied / same hex): silently cancel.
      }
      drag = null;
      updateCursor();
      return;
    }

    // No drag — click on empty hex tries to place a new station.
    const cell = pickHexUnderMouse(mx, my);
    if (!cell) return;
    if (hasStation(cell.c, cell.r)) return;  // can't reach (mousedown would have started a drag)

    if (stationsLeft <= 0) {
      invalidFlash = { c: cell.c, r: cell.r, until: t + 280 };
      return;
    }

    placeStation(cell.c, cell.r, t);
    stationsLeft--;
    placeFlash = { c: cell.c, r: cell.r, until: t + 520 };
  });

  function reset() {
    people.length = 0;
    const N = Math.max(40, Math.round(COLS * ROWS * 0.7));
    for (let i = 0; i < N; i++) people.push(spawnPerson(S));
    const nInfected = Math.max(3, Math.round(N * 0.05));
    for (let i = 0; i < nInfected; i++) people[i].state = I;
    stations = new Map();
    stationsLeft = STATION_BUDGET;
    placeFlash = null;
    removeFlash = null;
    invalidFlash = null;
  }

  // ---- station rendering ----
  function drawStationMark(x, y) {
    // Outer halo
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(58, 166, 85, 0.18)';
    ctx.fill();

    // Filled circle
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#3aa655';
    ctx.fill();

    // White cross
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
    ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function drawStationSetup(x, y, progress, t) {
    // Soft pulsing halo to communicate "warming up"
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.005);
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(154, 163, 176, ${0.10 + 0.06 * pulse})`;
    ctx.fill();

    // Gray track ring
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(110, 120, 135, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Green progress arc, clockwise from 12 o'clock
    ctx.beginPath();
    ctx.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = '#3aa655';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Muted center circle (not yet operational)
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#9aa3b0';
    ctx.fill();

    // Faded white cross
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
    ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function drawActivationPulse(x, y, sinceActive) {
    // Brief expanding green ring after a station comes online (~340ms)
    const dur = 340;
    if (sinceActive < 0 || sinceActive > dur) return;
    const a = 1 - sinceActive / dur;
    const r = 11 + (1 - a) * 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(58, 166, 85, ${a * 0.85})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function fillHexPath(cx, cy) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI/2 + i * Math.PI/3;
      const px = cx + HEX_SIZE * Math.cos(a);
      const py = cy + HEX_SIZE * Math.sin(a);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  // ---- render ----
  function render(t) {
    ctx.clearRect(0, 0, W, H);

    // Hex grid (with station tint, place flash, invalid flash overlays).
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = hexCenter(c, r);
        let fill = '#f5f6f8';
        if (hasStation(c, r)) fill = 'rgba(58, 166, 85, 0.10)';
        if (placeFlash && placeFlash.c === c && placeFlash.r === r && t < placeFlash.until) {
          const a = (placeFlash.until - t) / 520;
          fill = `rgba(58, 166, 85, ${0.35 * a + 0.10})`;
        } else if (removeFlash && removeFlash.c === c && removeFlash.r === r && t < removeFlash.until) {
          const a = (removeFlash.until - t) / 360;
          fill = `rgba(224, 140, 64, ${0.30 * a + 0.04})`;
        } else if (invalidFlash && invalidFlash.c === c && invalidFlash.r === r && t < invalidFlash.until) {
          const a = (invalidFlash.until - t) / 280;
          fill = `rgba(120, 128, 140, ${0.16 * a + 0.04})`;
        }
        drawHex(x, y, fill, '#d8dce2');
      }
    }

    // Station-placement pulse (thick green stroke).
    if (placeFlash && t < placeFlash.until) {
      const a = (placeFlash.until - t) / 520;
      const { x, y } = hexCenter(placeFlash.c, placeFlash.r);
      fillHexPath(x, y);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = `rgba(58, 166, 85, ${a})`;
      ctx.stroke();
    }

    // Station-removal pulse (orange stroke).
    if (removeFlash && t < removeFlash.until) {
      const a = (removeFlash.until - t) / 360;
      const { x, y } = hexCenter(removeFlash.c, removeFlash.r);
      fillHexPath(x, y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(224, 140, 64, ${a * 0.85})`;
      ctx.stroke();
    }

    // Invalid-click pulse (thin gray stroke).
    if (invalidFlash && t < invalidFlash.until) {
      const a = (invalidFlash.until - t) / 280;
      const { x, y } = hexCenter(invalidFlash.c, invalidFlash.r);
      fillHexPath(x, y);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(154, 163, 176, ${a * 0.55})`;
      ctx.stroke();
    }

    // Infection auras (under agents).
    for (const p of people) {
      if (p.state === I) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, INFECTION_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 64, 64, 0.06)';
        ctx.fill();
      }
    }

    // Agents.
    for (const p of people) {
      if (p.state === D) {
        ctx.strokeStyle = COLOR[D];
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y - 4); ctx.lineTo(p.x + 4, p.y + 4);
        ctx.moveTo(p.x + 4, p.y - 4); ctx.lineTo(p.x - 4, p.y + 4);
        ctx.stroke();
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
      if (p.state === S) {
        ctx.fillStyle = 'rgba(154, 163, 176, 0.22)';
        ctx.fill();
        ctx.strokeStyle = COLOR[S];
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = COLOR[p.state];
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Station markers (above agents — stations are persistent UI).
    for (const [key, station] of stations) {
      const [c, r] = key.split(',').map(Number);
      const isDragging = drag && drag.moved && drag.c === c && drag.r === r;
      const { x, y } = hexCenter(c, r);
      const remaining = station.activeAt - t;
      const setupProgress = Math.max(0, Math.min(1, 1 - remaining / SETUP_MS));
      const active = remaining <= 0;

      ctx.globalAlpha = isDragging ? 0.28 : 1;
      if (active) {
        drawStationMark(x, y);
        drawActivationPulse(x, y, t - station.activeAt);
      } else {
        drawStationSetup(x, y, setupProgress, t);
      }
      ctx.globalAlpha = 1;
    }

    // Drag preview: target highlight + ghost following the cursor.
    if (drag && drag.moved && mouseInside) {
      const target = pickHexUnderMouse(mouseX, mouseY);
      const validDrop = target
        && !hasStation(target.c, target.r)
        && !(target.c === drag.c && target.r === drag.r);

      if (target) {
        fillHexPath(target.x, target.y);
        ctx.fillStyle = validDrop
          ? 'rgba(58, 166, 85, 0.18)'
          : 'rgba(224, 64, 64, 0.10)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = validDrop
          ? 'rgba(58, 166, 85, 0.85)'
          : 'rgba(224, 64, 64, 0.55)';
        ctx.stroke();
      }

      // Ghost station follows the cursor.
      ctx.globalAlpha = 0.85;
      drawStationMark(mouseX, mouseY);
      ctx.globalAlpha = 1;
    }

    // ---- HUD ----
    let s = 0, i = 0, r = 0, d = 0, v = 0;
    for (const p of people) {
      if (p.state === S) s++;
      else if (p.state === I) i++;
      else if (p.state === R) r++;
      else if (p.state === D) d++;
      else v++;
    }

    // bottom HUD strip backdrop
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, H - 30, W, 30);

    ctx.font = '13px ui-monospace, monospace';
    ctx.textBaseline = 'alphabetic';
    let xOff = 12;
    const drawStat = (label, n, color) => {
      ctx.fillStyle = color;
      const text = `${label} ${n}`;
      ctx.fillText(text, xOff, H - 12);
      xOff += ctx.measureText(text).width + 18;
    };
    drawStat('susceptible', s, COLOR[S]);
    drawStat('infected',    i, COLOR[I]);
    drawStat('recovered',   r, COLOR[R]);
    drawStat('vaccinated',  v, COLOR[V]);
    drawStat('dead',        d, COLOR[D]);

    // Stations counter (right side of HUD).
    const counterText = `stations  ${stations.size} / ${STATION_BUDGET}`;
    const tw = ctx.measureText(counterText).width;
    ctx.fillStyle = stationsLeft > 0 ? COLOR[V] : '#9aa3b0';
    ctx.fillText(counterText, W - tw - 14, H - 12);

    if (i === 0) {
      ctx.font = '13px ui-monospace, monospace';
      const endStats = [
        ['susceptible', s, COLOR[S]],
        ['recovered',   r, COLOR[R]],
        ['vaccinated',  v, COLOR[V]],
        ['dead',        d, COLOR[D]],
      ];
      const items = endStats.map(([label, n, c]) => {
        const text = `${label} ${n}`;
        return { text, color: c, w: ctx.measureText(text).width };
      });
      const totalW = items.reduce((a, it) => a + it.w, 0) + (items.length - 1) * 18;
      const bw = Math.max(440, totalW + 60);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(W / 2 - bw / 2, 6, bw, 44);
      ctx.font = '14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3aa655';
      ctx.fillText('epidemic over', W / 2, 24);
      ctx.font = '13px ui-monospace, monospace';
      ctx.textAlign = 'left';
      let xs = W / 2 - totalW / 2;
      for (const it of items) {
        ctx.fillStyle = it.color;
        ctx.fillText(it.text, xs, 42);
        xs += it.w + 18;
      }
    }

    // ---- on-canvas buttons (always foreground) ----
    function drawBtn(b, label, hover) {
      ctx.fillStyle = hover ? '#e4e6eb' : '#f0f1f5';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#bdc1c8';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      ctx.fillStyle = '#333';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 0.5);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    const pb = pauseBtn(), rb = resetBtn();
    drawBtn(pb, paused ? 'play' : 'pause', mouseInside && hit(pb, mouseX, mouseY));
    drawBtn(rb, 'reset',                   mouseInside && hit(rb, mouseX, mouseY));

    if (paused) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#333';
      ctx.font = '20px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('paused', W / 2, H / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  // ---- loop ----
  let lastT = 0;
  function loop(t) {
    if (!lastT) lastT = t;
    const dt = Math.min(50, t - lastT);
    lastT = t;
    if (!paused) step(dt, t);
    render(paused ? pausedAt : t);
    requestAnimationFrame(loop);
  }

  reset();
  requestAnimationFrame(loop);
  }
})();
