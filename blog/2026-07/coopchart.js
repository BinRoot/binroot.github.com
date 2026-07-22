// Replay the coop's evening on a timing chart. The whole story sits in ghost
// gray while a cursor sweeps left to right, inking the traces back in and
// dropping a caption on each beat: a cloud trips x but y never confirms it,
// dusk holds, y confirms after five minutes, all three line up, the door
// toggles, and z resets because the gate just moved. The sweep runs once
// when the chart scrolls into view; a small replay control appears after.
(() => {
  const mount = document.querySelector('div.coopchart');
  if (!mount) return;

  const T_MAX = 96; // one evening, in arbitrary ticks
  const SIGS = [
    ['x', [[12, 20], [32, 68]]], // cloud pulse, then the dusk crossing
    ['y', [[48, 76]]],           // confirms five minutes into dusk
    ['z', [[0, 49], [80, 96]]],  // the toggle itself kills z one tick later
  ];
  const DOOR = [[0, 1], [48, 0], [96, 0]]; // open until the toggle
  const BAND = [48, 49]; // the instant all three are high, gone right away
  const EVENTS = [
    { t: 17, at: 13, top: 6,   text: 'a passing cloud trips x',      brief: 'cloud trips x' },
    { t: 24, at: 24, top: 56,  text: 'y never confirms it',          brief: 'y not confirmed' },
    { t: 36, at: 50, top: 6,   text: 'dusk: x crosses and holds',    brief: 'dusk: x holds' },
    { t: 49, at: 60, top: 56,  text: 'steady five minutes: y is in', brief: 'y held 5 min' },
    { t: 49.5, at: 48.5, top: 210, text: 'all three high: toggle',   brief: 'all high: toggle', up: true },
    { t: 56, at: 66, top: 102, text: 'z: recently toggled',          brief: 'z: reset' },
  ];
  const INK = '#1a1a1a', PEACH = '#fae5d3', ACCENT = '#9a5b2d',
        GHOST = '#dfded8', CHIP = '#f0f1f5', CURSOR = '#8a90a0';
  const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  const H = 232, X0 = 48, DUR = 11;

  const style = document.createElement('style');
  style.textContent = `
    .coopchart { position: relative; margin: 1.8em 0; }
    .coopchart canvas { display: block; }
    .cc-note {
      position: absolute;
      transform: translateX(-50%);
      font: 11px/1.3 ${MONO};
      color: ${ACCENT};
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.45s ease;
      pointer-events: none;
    }
    .cc-note.cc-on { opacity: 1; }
    .cc-note::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 100%;
      height: 7px;
      border-left: 1px solid #c9a06a;
    }
    .cc-note.cc-up::after { top: auto; bottom: 100%; }
    .cc-replay {
      position: absolute;
      right: 0;
      bottom: 6px;
      font: 11px/1 ${MONO};
      color: #8a90a0;
      background: none;
      border: none;
      padding: 4px 6px;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, color 0.2s ease;
    }
    .cc-replay.cc-show { opacity: 1; pointer-events: auto; }
    .cc-replay:hover, .cc-replay:focus-visible { color: #1a1a1a; }
    @media (prefers-reduced-motion: reduce) {
      .cc-note, .cc-replay { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', "Timing chart of the coop's evening: a "
    + 'passing cloud trips x but y never confirms it; at dusk x crosses and '
    + 'holds, y confirms after five minutes, all three signals line up and '
    + 'the door toggles closed; z resets right after.');
  mount.appendChild(canvas);
  const notes = EVENTS.map((ev) => {
    const el = document.createElement('span');
    el.className = ev.up ? 'cc-note cc-up' : 'cc-note';
    el.setAttribute('aria-hidden', 'true');
    mount.appendChild(el);
    return el;
  });
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cc-replay';
  btn.textContent = '↻ replay';
  mount.appendChild(btn);

  const hi = (segs, t) => segs.some(([a, b]) => t >= a && t < b);

  // Flatten high/low segments into [t, level] breakpoints from 0 to T_MAX.
  const breakpoints = (segs) => {
    const bps = [[0, hi(segs, 0) ? 1 : 0]];
    const edges = [];
    segs.forEach(([a, b]) => {
      if (a > 0) edges.push([a, 1]);
      if (b < T_MAX) edges.push([b, 0]);
    });
    edges.sort((p, q) => p[0] - q[0]);
    edges.forEach((e) => bps.push(e));
    bps.push([T_MAX, hi(segs, T_MAX - 0.01) ? 1 : 0]);
    return bps;
  };
  const TRACES = SIGS.map(([name, segs]) => [name, breakpoints(segs)]);

  const rowHi = (i) => 26 + i * 46;
  const rowLo = (i) => rowHi(i) + 24;

  let W = 0, ctx = null, tx = null;
  const layout = () => {
    const w = Math.min(576, mount.clientWidth || 576);
    if (w === W) return false;
    W = w;
    const brief = W < 470;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tx = (t) => X0 + t * (W - 62) / T_MAX;
    EVENTS.forEach((ev, i) => {
      notes[i].textContent = brief ? ev.brief : ev.text;
      notes[i].style.left = tx(ev.at) + 'px';
      notes[i].style.top = ev.top + 'px';
    });
    return true;
  };

  const drawTrace = (bps, clipT, yHi, yLo, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    let lv = bps[0][1];
    ctx.moveTo(tx(0), lv ? yHi : yLo);
    for (let i = 1; i < bps.length; i++) {
      const [t, l] = bps[i];
      ctx.lineTo(tx(Math.min(t, clipT)), lv ? yHi : yLo);
      if (t >= clipT) { ctx.stroke(); return; }
      if (l !== lv) { ctx.lineTo(tx(t), l ? yHi : yLo); lv = l; }
    }
    ctx.lineTo(tx(Math.min(T_MAX, clipT)), lv ? yHi : yLo);
    ctx.stroke();
  };

  const drawChip = (label, yCenter) => {
    ctx.font = '600 12px ' + MONO;
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = CHIP;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, yCenter - 10, w, 20, 4);
    else ctx.rect(8, yCenter - 10, w, 20);
    ctx.fill();
    ctx.fillStyle = '#40434c';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, 14, yCenter + 1);
  };

  const doorBps = DOOR;
  let lastP = 0;
  const draw = (p) => {
    lastP = p;
    const clipT = p * T_MAX;
    ctx.clearRect(0, 0, W, H);
    if (clipT > BAND[0]) {
      // The alignment is a single beat, so keep the sliver visible even
      // when the column is narrow.
      const bw = Math.max(tx(Math.min(clipT, BAND[1])) - tx(BAND[0]), 4);
      ctx.fillStyle = PEACH;
      ctx.fillRect(tx(BAND[0]), rowHi(0) - 8, bw, rowLo(3) - rowHi(0) + 16);
    }
    TRACES.forEach(([name, bps], i) => {
      drawChip(name, rowHi(i) + 12);
      drawTrace(bps, T_MAX, rowHi(i), rowLo(i), GHOST);
      drawTrace(bps, clipT, rowHi(i), rowLo(i), INK);
    });
    drawChip('door', rowHi(3) + 12);
    drawTrace(doorBps, T_MAX, rowHi(3), rowLo(3), GHOST);
    drawTrace(doorBps, clipT, rowHi(3), rowLo(3), INK);
    // The door row is a position, not a condition; say so on its levels.
    ctx.font = '10px ' + MONO;
    ctx.fillStyle = CURSOR;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    if (clipT > 12) ctx.fillText('open', tx(6), rowHi(3) - 5);
    if (clipT > 64) ctx.fillText('closed', tx(56), rowLo(3) + 13);
    if (p < 1) {
      ctx.strokeStyle = CURSOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx(clipT), 10);
      ctx.lineTo(tx(clipT), H - 10);
      ctx.stroke();
    }
    EVENTS.forEach((ev, i) => notes[i].classList.toggle('cc-on', clipT >= ev.t));
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, t0 = 0;
  const frame = (now) => {
    if (!t0) t0 = now;
    const el = (now - t0) / 1000;
    if (el >= DUR) {
      draw(1);
      btn.classList.add('cc-show');
      return;
    }
    draw(el / DUR);
    raf = requestAnimationFrame(frame);
  };
  const play = () => {
    cancelAnimationFrame(raf);
    btn.classList.remove('cc-show');
    t0 = 0;
    raf = requestAnimationFrame(frame);
  };
  btn.addEventListener('click', play);

  layout();
  if (reduced) {
    // No motion unless asked: land on the finished frame, and let the
    // replay control run the sweep as an explicit request.
    draw(1);
    btn.classList.add('cc-show');
  } else {
    draw(0);
    // Run once, the first time the chart scrolls into view.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          play();
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });
    io.observe(mount);
  }
  window.addEventListener('resize', () => {
    if (layout()) draw(lastP);
  });
})();
