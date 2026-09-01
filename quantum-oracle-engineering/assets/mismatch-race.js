// mismatch-race.js -- slide 8's race: the overhead trap.
//
// Eight INDEPENDENT blocks, run twice.  Top lane: the CPU works through them
// one at a time, 0.55 s each, done at 4.4 s.  Bottom lane: the row travels
// to the GPU (2.5 s), which processes all eight AT ONCE, every lane lit,
// done in a single 0.55 s flash, then travels back (2.5 s), finishing at
// 5.55 s.  The accelerator computed eight times faster and still lost: the
// job was too small to pay for the trip.  That is the trap worth teaching;
// obviously-wrong offloads teach nothing.  One visual rule: white block =
// not yet processed, blue = processed.  Clock bars under both lanes keep
// score.  Fixed timeline; reduced motion renders the outcome frame.
(function () {
  const svg = document.getElementById('mismatch-race');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const WIRE = '#8a90a0';
  const RULE = '#bbb';
  const DIM = '#888';
  const GREEN = '#4D8C55';
  const RED = '#c0392b';
  const ACCENT = '#456AAD';

  const N = 8, STEP = 0.55;
  const BLOCK_X0 = 130, BLOCK_DX = 34;
  const TOP_Y = 62, BOT_Y = 182;
  const CLOCK_TOP = 116, CLOCK_BOT = 268;
  const CLOCK_X0 = 130, CLOCK_RATE = 92; // px per second
  const GPU = { x: 560, y: 152, w: 110, h: 74 };
  const SHIP = 2.5;                        // travel time, each way
  const FLASH = 0.55;                      // the GPU does everything at once
  const DONE_TOP = N * STEP;               // 4.4 s
  const PROC_END = SHIP + FLASH;           // 3.05 s
  const DONE_BOT = PROC_END + SHIP;        // 5.55 s
  const T = 8.0;
  // Slide the row right until its last block touches the GPU's doorstep.
  const ROW_SHIFT = GPU.x - 24 - (BLOCK_X0 + (N - 1) * BLOCK_DX + 11);

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const text = (s, x, y, size) => {
    const t = el('text', {
      x, y, 'text-anchor': 'start', fill: DIM,
      'font-size': size, 'font-weight': 600,
      'font-family': "'Ubuntu', sans-serif"
    });
    t.textContent = s;
    return t;
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

  // ── Scenery ─────────────────────────────────────────────────────────
  text('CPU', 36, TOP_Y + 5, 13);
  text('CPU + GPU', 36, BOT_Y + 5, 13);

  // Independent blocks: no arrows, no chain.  The bottom row lives in a
  // group so it can travel.
  const row = (y, parent) => {
    const blocks = [];
    for (let i = 0; i < N; i++) {
      blocks.push(el('rect', {
        x: BLOCK_X0 + i * BLOCK_DX - 11, y: y - 8, width: 22, height: 16,
        rx: 3, fill: '#fff', stroke: INK, 'stroke-width': 1.4
      }, parent));
    }
    return blocks;
  };
  const topBlocks = row(TOP_Y, null);
  const botGroup = el('g', {});
  const botBlocks = row(BOT_Y, botGroup);

  // The GPU: six lanes, and this time the job lights all of them.
  el('rect', { x: GPU.x, y: GPU.y, width: GPU.w, height: GPU.h, rx: 6,
    fill: '#f7f7f7', stroke: RULE, 'stroke-width': 1.5 });
  const lanes = [];
  for (let i = 0; i < 6; i++) {
    const y = GPU.y + 11 + i * 10.5;
    el('line', { x1: GPU.x + 10, y1: y, x2: GPU.x + GPU.w - 10, y2: y,
      stroke: '#ddd', 'stroke-width': 2 });
    lanes.push(el('line', { x1: GPU.x + 10, y1: y, x2: GPU.x + 10,
      y2: y, stroke: GREEN, 'stroke-width': 3, opacity: 0 }));
  }

  // Clock bars: elapsed wall time per lane.
  [CLOCK_TOP, CLOCK_BOT].forEach((y) => el('line', {
    x1: CLOCK_X0, y1: y, x2: CLOCK_X0 + DONE_BOT * CLOCK_RATE + 14, y2: y,
    stroke: '#eee', 'stroke-width': 6, 'stroke-linecap': 'round' }));
  const topClock = el('line', { x1: CLOCK_X0, y1: CLOCK_TOP,
    x2: CLOCK_X0, y2: CLOCK_TOP,
    stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' });
  const botClock = el('line', { x1: CLOCK_X0, y1: CLOCK_BOT,
    x2: CLOCK_X0, y2: CLOCK_BOT,
    stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' });

  const mark = (x, y, good) => {
    const g = el('g', { opacity: 0 });
    el('circle', { cx: x, cy: y, r: 9, fill: good ? GREEN : RED }, g);
    el('path', {
      d: good
        ? `M ${x - 4} ${y} l 3 3.5 l 5.5 -6.5`
        : `M ${x - 3.5} ${y - 3.5} l 7 7 m 0 -7 l -7 7`,
      stroke: '#fff', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round'
    }, g);
    return g;
  };
  const topMark = mark(CLOCK_X0 + DONE_TOP * CLOCK_RATE + 16, CLOCK_TOP, true);
  const botMark = mark(CLOCK_X0 + DONE_BOT * CLOCK_RATE + 16, CLOCK_BOT, false);

  const setState = (t) => {
    // Top lane: one core, one block at a time.
    topBlocks.forEach((b, i) => {
      b.setAttribute('fill', t >= STEP * (i + 1) ? ACCENT : '#fff');
    });
    topClock.setAttribute('x2', CLOCK_X0 + Math.min(t, DONE_TOP) * CLOCK_RATE);
    topMark.setAttribute('opacity', t >= DONE_TOP ? 1 : 0);

    // Bottom lane: travel out, one all-lanes flash, travel back.
    let shift;
    if (t <= SHIP) shift = ROW_SHIFT * ease(clamp01(t / SHIP));
    else if (t <= PROC_END) shift = ROW_SHIFT;
    else shift = ROW_SHIFT * (1 - ease(clamp01((t - PROC_END) / SHIP)));
    botGroup.setAttribute('transform', 'translate(' + shift + ',0)');

    // Every block turns blue in the same instant: the GPU is not the
    // bottleneck and never was.
    const blueAll = t >= PROC_END;
    botBlocks.forEach((b) => b.setAttribute('fill', blueAll ? ACCENT : '#fff'));

    // The flash is a fast left-to-right sweep across all six lanes at once:
    // one parallel wave of work crossing the device.
    const flashing = t > SHIP && t < PROC_END;
    const sweep = clamp01((t - SHIP) / FLASH);
    lanes.forEach((l) => {
      l.setAttribute('opacity', flashing ? 0.9 : 0);
      l.setAttribute('x2', lerp(GPU.x + 10, GPU.x + GPU.w - 10, sweep));
    });

    botClock.setAttribute('x2', CLOCK_X0 + Math.min(t, DONE_BOT) * CLOCK_RATE);
    botMark.setAttribute('opacity', t >= DONE_BOT ? 1 : 0);
  };

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(DONE_BOT);
    return;
  }

  const start = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const tt = ((now - start) / 1000) % T;
    svg.setAttribute('opacity', tt > T - 0.5 ? (T - tt) / 0.5 : 1);
    setState(Math.min(tt, DONE_BOT));
  };
  requestAnimationFrame(frame);
})();
