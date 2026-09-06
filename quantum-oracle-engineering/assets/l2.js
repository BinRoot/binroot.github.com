// l2.js -- shared helpers for the Lesson 2 deck's figures.
//
// Every Lesson 2 fragment loads this first (deferred scripts run in document
// order, and the fragment that carries it sits on slide 1).  It holds the
// palette, the SVG helpers, the autoplay timeline every animated figure uses,
// a step observer for figures that react to the deck's incremental reveals,
// the seeded PRNG and the Sway engine (same semantics as gen/sway-gen.mjs),
// and small drawers for boards, dice and gate-level circuits.  Nothing here
// touches the DOM on its own.
(function () {
  if (window.L2) return;

  const ns = 'http://www.w3.org/2000/svg';
  const L2 = {
    ns,
    INK: '#2d3140', DIM: '#7a7f88', RULE: '#bbb', FAINT: '#d8d5cd', GRAY: '#9aa0a8',
    WIRE: '#8a90a0', BLUE: '#456AAD', GREEN: '#4D8C55', RED: '#c0392b',
    GOLD: '#F2BF80', ORANGE: '#D95032', PURPLE: '#7c5cbf', BG: '#faf8f4',
    WOOD: '#c8a96e', WOODLINE: '#8b7040',
    FONT: "'Ubuntu Web', 'Ubuntu', system-ui, sans-serif",
    MONO: "'Ubuntu Web Mono', 'Ubuntu Mono', ui-monospace, Menlo, monospace"
  };

  // ── SVG helpers ─────────────────────────────────────────────────────
  L2.el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v !== undefined && v !== null) node.setAttribute(k, String(v));
    }
    if (parent) parent.appendChild(node);
    return node;
  };
  L2.text = (parent, s, x, y, o) => {
    o = o || {};
    const t = L2.el('text', {
      x, y, 'text-anchor': o.anchor || 'middle',
      'dominant-baseline': o.baseline || 'middle',
      fill: o.fill || L2.INK, 'font-size': o.size || 14,
      'font-weight': o.weight || 400,
      'font-style': o.italic ? 'italic' : 'normal',
      'font-family': o.mono ? L2.MONO : o.serif ? 'Georgia, "Times New Roman", serif' : L2.FONT,
      opacity: o.opacity
    }, parent);
    t.textContent = s;
    return t;
  };
  L2.lerp = (a, b, u) => a + (b - a) * u;
  L2.clamp01 = (u) => Math.max(0, Math.min(1, u));
  L2.ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  L2.outQuart = (u) => 1 - Math.pow(1 - u, 4);
  L2.backOut = (u, s) => {
    const k = s === undefined ? 2.2 : s, p = u - 1;
    return 1 + (k + 1) * p * p * p + k * p * p;
  };
  // 0 before t0, 1 after t0 + d, eased between.
  L2.win = (t, t0, d, easeFn) => (easeFn || L2.ease)(L2.clamp01((t - t0) / (d || 0.4)));
  L2.reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  L2.fmt = (x, d) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);

  // ── Autoplay timeline ───────────────────────────────────────────────
  // A figure hands over setState(t) and a duration.  The timeline plays when
  // the slide becomes current, resets when it is left, renders the final
  // frame under reduced motion, and freezes while the tab is hidden.
  L2.timeline = (host, opt) => {
    const T = opt.T, setState = opt.setState;
    const slide = host.closest ? host.closest('.slide') : null;
    const api = { playing: false, elapsed: 0, slide, T };
    L2._timelines.push(api);
    const reduced = L2.reduced();
    let last = performance.now();
    api.play = () => { api.playing = true; paintButton(); };
    api.pause = () => { api.playing = false; paintButton(); };
    api.restart = () => { api.elapsed = 0; api.playing = true; setState(0); paintButton(); };
    api.seek = (t) => { api.elapsed = t; setState(t); };

    // ── the control: replay for a one-shot figure, pause/play for a loop ──
    // Drawn into the figure's own SVG at its bottom-right corner, in viewBox
    // units, above everything the figure drew.  Mouse clicks never flip the
    // slide; the no-nav class keeps taps from doing so either.
    let button = null, glyph = null;
    if (host.tagName && host.tagName.toLowerCase() === 'svg' && opt.button !== false) {
      const vb = host.viewBox && host.viewBox.baseVal;
      const W = vb && vb.width ? vb.x + vb.width : 760, Hh = vb && vb.height ? vb.y + vb.height : 300;
      const cx = W - 22, cy = Hh - 20;
      button = L2.el('g', { class: 'no-nav l2-replay', cursor: 'pointer', role: 'button', 'aria-label': opt.loop ? 'pause or play' : 'replay' }, host);
      L2.el('circle', { cx, cy, r: 13, fill: '#fff', stroke: L2.RULE, 'stroke-width': 1.4 }, button);
      glyph = L2.el('g', { transform: `translate(${cx},${cy})` }, button);
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opt.loop) { api.playing ? api.pause() : api.play(); }
        else api.restart();
      });
    }
    const paintButton = () => {
      if (!glyph) return;
      glyph.textContent = '';
      if (opt.loop) {
        if (api.playing) {
          L2.el('rect', { x: -5.5, y: -6, width: 4, height: 12, rx: 1, fill: L2.INK }, glyph);
          L2.el('rect', { x: 1.5, y: -6, width: 4, height: 12, rx: 1, fill: L2.INK }, glyph);
        } else {
          L2.el('polygon', { points: '-4,-6.5 7,0 -4,6.5', fill: L2.INK }, glyph);
        }
        button.setAttribute('opacity', api.playing ? 0.35 : 1);
      } else {
        L2.replayGlyph(glyph, 6.5);
        button.setAttribute('opacity', api.playing ? 0.35 : 1);
      }
    };

    // Reduced motion (and print) get one still: opt.still if the figure names
    // its most informative moment, else the final frame.  The control still
    // works: a click plays the figure once, since the click is the request.
    if (reduced) {
      const still = opt.still !== undefined ? opt.still : T;
      setState(still); api.static = true; api.elapsed = still;
      paintButton();
      if (button) {
        let armed = false;
        button.addEventListener('click', () => {
          if (armed) return; armed = true;
          api.elapsed = 0; api.playing = true; last = performance.now();
          const frame = (now) => {
            if (!api.playing) { armed = false; return; }
            requestAnimationFrame(frame);
            if (!Number.isFinite(now)) now = performance.now();
            api.elapsed += Math.max(0, Math.min((now - last) / 1000, 0.1)); last = now;
            if (api.elapsed >= T) { api.elapsed = T; api.playing = false; setState(still); paintButton(); armed = false; return; }
            setState(api.elapsed);
          };
          requestAnimationFrame(frame);
        });
      }
      return api;
    }

    setState(0);
    const enter = () => { if (opt.manual) return; api.restart(); };
    if (slide) {
      if (slide.classList.contains('current')) enter();
      new MutationObserver(() => {
        if (slide.classList.contains('current')) {
          if (!api.playing && api.elapsed === 0) enter();
        } else { api.playing = false; api.elapsed = 0; setState(0); paintButton(); }
      }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    } else enter();
    paintButton();
    const frame = (now) => {
      requestAnimationFrame(frame);
      // Some headless and embedded browsers hand rAF no timestamp.
      if (!Number.isFinite(now)) now = performance.now();
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
      last = now;
      if (document.hidden || !api.playing) return;
      api.elapsed += dt;
      if (api.elapsed >= T) {
        if (opt.loop) api.elapsed = 0;
        else { api.elapsed = T; api.playing = false; paintButton(); }
      }
      setState(api.elapsed);
    };
    requestAnimationFrame(frame);
    return api;
  };
  // Every timeline registers here so `p` can replay whatever is on screen.
  L2._timelines = [];
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'p' || e.metaKey || e.ctrlKey || e.altKey) return;
    let hit = false;
    L2._timelines.forEach((t) => {
      if (t.slide && t.slide.classList.contains('current') && t.restart) { t.restart(); hit = true; }
    });
    if (hit) e.preventDefault();
  });

  // ── Step observer ───────────────────────────────────────────────────
  // cb(n) fires with the number of `.step.shown` elements in the slide,
  // whenever that number changes.  Figures use it to react to the deck's
  // arrow-key reveals without owning any navigation.
  L2.steps = (host, cb) => {
    const slide = host.closest('.slide');
    if (!slide) return;
    let lastN = -1;
    const check = () => {
      const n = slide.querySelectorAll('.step.shown').length;
      if (n !== lastN) { lastN = n; cb(n); }
    };
    new MutationObserver(check).observe(slide, {
      attributes: true, subtree: true, attributeFilter: ['class'] });
    check();
  };
  L2.isCurrent = (host) => {
    const slide = host.closest('.slide');
    return !!(slide && slide.classList.contains('current'));
  };
  L2.onCurrent = (host, cb) => {
    const slide = host.closest('.slide');
    if (!slide) return;
    const fire = () => cb(slide.classList.contains('current'));
    new MutationObserver(fire).observe(slide, { attributes: true, attributeFilter: ['class'] });
    fire();
  };

  // ── PRNG ────────────────────────────────────────────────────────────
  L2.prng = (seed) => {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ── Sway engine (paper semantics; mirrors gen/sway-gen.mjs) ─────────
  const sway = {};
  sway.EMPTY = 0; sway.BLACK = 1; sway.WHITE = 2;
  sway.neighbors = (N) => {
    const nb = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const l = [];
      if (r > 0) l.push((r - 1) * N + c);
      if (r < N - 1) l.push((r + 1) * N + c);
      if (c > 0) l.push(r * N + c - 1);
      if (c < N - 1) l.push(r * N + c + 1);
      nb.push(l);
    }
    return nb;
  };
  sway.friendly = (board, nb, i) => {
    const col = board[i];
    if (col === 0) return 0;
    let k = 0;
    for (const j of nb[i]) if (board[j] === col) k++;
    return k;
  };
  sway.threshold = (c) => Math.max(0, 4 - c);        // flip if die < threshold
  sway.empties = (board) => {
    const out = [];
    for (let i = 0; i < board.length; i++) if (board[i] === 0) out.push(i);
    return out;
  };
  sway.rollDice = (n, rnd) => {
    const d = new Uint8Array(n);
    for (let i = 0; i < n; i++) d[i] = Math.floor(rnd() * 20);
    return d;
  };
  sway.event = (board, nb, dice) => {
    const next = Uint8Array.from(board);
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) continue;
      if (dice[i] < 4 - sway.friendly(board, nb, i)) next[i] = board[i] === 1 ? 2 : 1;
    }
    return next;
  };
  sway.count = (board) => {
    let b = 0, w = 0;
    for (const v of board) { if (v === 1) b++; else if (v === 2) w++; }
    return { b, w };
  };
  sway.payoff = (board) => { const { b, w } = sway.count(board); return b > w ? 1 : 0; };
  sway.rollout = (start, N, nb, H, firstMove, rnd) => {
    let board = Uint8Array.from(start);
    for (let h = 0; h < H; h++) {
      let e = sway.empties(board);
      const bcell = (h === 0 && firstMove >= 0) ? firstMove : e[Math.floor(rnd() * e.length)];
      board[bcell] = 1;
      e = sway.empties(board);
      board[e[Math.floor(rnd() * e.length)]] = 2;
      board = sway.event(board, nb, sway.rollDice(N * N, rnd));
    }
    return sway.payoff(board);
  };
  L2.sway = sway;

  // ── Board drawer ────────────────────────────────────────────────────
  // Draws an N x N Sway board into `parent` with its top-left at (x, y) and
  // side `size`.  Returns cell geometry so callers can animate on top.
  L2.board = (parent, o) => {
    const N = o.N, size = o.size, x = o.x || 0, y = o.y || 0;
    const cell = size / N, pad = cell / 2;
    const g = L2.el('g', { transform: `translate(${x},${y})` }, parent);
    L2.el('rect', { x: 0, y: 0, width: size, height: size, rx: Math.max(4, cell * 0.14),
      fill: o.ghost ? '#e6dfd0' : L2.WOOD, stroke: o.stroke || L2.WOODLINE, 'stroke-width': 1.2,
      opacity: o.ghost ? 0.7 : 1 }, g);
    for (let i = 0; i < N; i++) {
      const p = pad + i * cell;
      L2.el('line', { x1: p, y1: pad, x2: p, y2: size - pad, stroke: L2.WOODLINE, 'stroke-width': 1, opacity: 0.8 }, g);
      L2.el('line', { x1: pad, y1: p, x2: size - pad, y2: p, stroke: L2.WOODLINE, 'stroke-width': 1, opacity: 0.8 }, g);
    }
    const stones = L2.el('g', {}, g);
    const cx = (i) => pad + (i % N) * cell, cy = (i) => pad + Math.floor(i / N) * cell;
    const r = cell * 0.38;
    const api = { g, stones, cx, cy, r, cell, size, N };
    api.stone = (i, color, extra) => L2.stone(stones, cx(i), cy(i), r, color, extra);
    api.redraw = (board) => {
      stones.textContent = '';
      for (let i = 0; i < board.length; i++) if (board[i]) api.stone(i, board[i]);
    };
    if (o.board) api.redraw(o.board);
    return api;
  };
  L2.stone = (parent, cx, cy, r, color, extra) => {
    const black = color === 1;
    const s = L2.el('circle', Object.assign({ cx, cy, r,
      fill: black ? '#222' : '#f5f5f5', stroke: black ? '#555' : '#aaa', 'stroke-width': 1.4 }, extra || {}), parent);
    return s;
  };

  // A d20 read as a flat icon: a hexagonal silhouette with an inner
  // triangle, and the rolled face in the middle.
  L2.die = (parent, x, y, s, face, o) => {
    o = o || {};
    const g = L2.el('g', { transform: `translate(${x},${y})` }, parent);
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      pts.push((s * Math.cos(a)).toFixed(1) + ',' + (s * Math.sin(a)).toFixed(1));
    }
    L2.el('polygon', { points: pts.join(' '), fill: o.fill || '#fff', stroke: o.stroke || L2.INK,
      'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g);
    const tri = [90, 210, 330].map((d) => {
      const a = d * Math.PI / 180;
      return (s * 0.62 * Math.cos(a)).toFixed(1) + ',' + (s * 0.62 * Math.sin(a)).toFixed(1);
    });
    L2.el('polygon', { points: tri.join(' '), fill: 'none', stroke: o.stroke || L2.INK,
      'stroke-width': 1, opacity: 0.55 }, g);
    if (face !== undefined && face !== null) {
      L2.text(g, String(face), 0, 1, { size: s * 0.72, weight: 700, fill: o.ink || L2.INK });
    }
    return g;
  };

  // ── Replay glyph: an open circular arrow, head tangent to the arc ────
  // Drawn from geometry rather than hand-placed points, so the head sits on
  // the arc's end and points along it.  Gap at the top, arc runs clockwise.
  L2.replayGlyph = (parent, r) => {
    const rad = (d) => d * Math.PI / 180;
    const s = rad(-55), e = rad(-125);                     // start upper right, end upper left, 290 degrees clockwise
    const P = (a) => [r * Math.cos(a), r * Math.sin(a)];
    const [x1, y1] = P(s), [x2, y2] = P(e);
    L2.el('path', { d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      fill: 'none', stroke: L2.INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, parent);
    // tangent direction of clockwise travel at the end point, and its normal
    const dx = -Math.sin(e), dy = Math.cos(e);
    const nx = -dy, ny = dx;
    const h = 4.2, w = 3.2;
    const tip = [x2 + dx * h, y2 + dy * h];
    const b1 = [x2 + nx * w, y2 + ny * w], b2 = [x2 - nx * w, y2 - ny * w];
    L2.el('polygon', { points: [tip, b1, b2].map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' '), fill: L2.INK }, parent);
  };

  // ── Typeset math label: {base, sup, sub, upright} in the equation serif ──
  L2.mathText = (parent, x, y, m, o) => {
    o = o || {};
    const t = L2.el('text', { x, y, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': 'middle', fill: o.fill || L2.INK,
      'font-family': 'Georgia, "Times New Roman", serif', 'font-size': o.size || 18, 'font-style': m.upright ? 'normal' : 'italic' }, parent);
    const b = L2.el('tspan', {}, t); b.textContent = m.base;
    if (m.sup) { const s = L2.el('tspan', { 'baseline-shift': 'super', 'font-size': (o.size || 18) * 0.62, 'font-style': 'normal' }, t); s.textContent = m.sup; }
    if (m.sub) { const s = L2.el('tspan', { 'baseline-shift': 'sub', 'font-size': (o.size || 18) * 0.62, 'font-style': 'normal' }, t); s.textContent = m.sub; }
    return t;
  };

  // ── Circuit drawer ──────────────────────────────────────────────────
  // spec: { x, y, wires: ['|0>', ...], colW, rowH, ops: [...] }
  // op kinds:
  //   { t: 'box', w: [i0, i1], label, fill, stroke, dash }  box spanning wires
  //   { t: 'h', w: i }                                        Hadamard
  //   { t: 'meas', w: i }                                     meter
  //   { t: 'cbox', c: i, w: [i0, i1], label }                 controlled box
  //   { t: 'gap', k: 0.5 }                                    spacer
  // Returns { g, colX: [...], wireY(i), ops: [{node, spec}] }.
  L2.circuit = (parent, spec) => {
    const colW = spec.colW || 64, rowH = spec.rowH || 40;
    const g = L2.el('g', { transform: `translate(${spec.x || 0},${spec.y || 0})` }, parent);
    const wires = spec.wires, n = wires.length;
    const wireY = (i) => i * rowH;
    let xcur = 0;
    const colX = [], ops = [];
    // measure total width first
    const widths = spec.ops.map((op) => (op.t === 'gap' ? colW * (op.k || 0.5) : colW * (op.wmul || 1)));
    const total = widths.reduce((a, b) => a + b, 0);
    const labelW = spec.labelW === undefined ? 44 : spec.labelW;
    // wires
    for (let i = 0; i < n; i++) {
      const y = wireY(i);
      if (wires[i] && wires[i].bundle) {
        L2.el('line', { x1: labelW, y1: y - 3, x2: labelW + total, y2: y - 3, stroke: L2.WIRE, 'stroke-width': 1.3 }, g);
        L2.el('line', { x1: labelW, y1: y + 3, x2: labelW + total, y2: y + 3, stroke: L2.WIRE, 'stroke-width': 1.3 }, g);
      } else {
        L2.el('line', { x1: labelW, y1: y, x2: labelW + total, y2: y, stroke: L2.WIRE, 'stroke-width': 1.5 }, g);
      }
      const lab = typeof wires[i] === 'string' ? wires[i] : wires[i].label;
      if (lab) L2.text(g, lab, labelW - 8, y, { anchor: 'end', size: spec.fontSize || 14, mono: !spec.serif, serif: !!spec.serif, fill: L2.DIM });
    }
    xcur = labelW;
    spec.ops.forEach((op, k) => {
      const w = widths[k];
      const cx = xcur + w / 2;
      colX.push(cx);
      const node = L2.el('g', { class: op.cls || '' }, g);
      if (op.t === 'box' || op.t === 'cbox') {
        const [i0, i1] = op.w.length === 2 ? op.w : [op.w[0], op.w[0]];
        const y0 = wireY(Math.min(i0, i1)) - rowH * 0.36, y1 = wireY(Math.max(i0, i1)) + rowH * 0.36;
        const bw = Math.min(w - 10, op.bw || w - 14);
        if (op.t === 'cbox') {
          const cy = wireY(op.c);
          L2.el('line', { x1: cx, y1: cy, x2: cx, y2: cy < y0 ? y0 : y1, stroke: L2.INK, 'stroke-width': 1.8 }, node);
          L2.el('circle', { cx, cy, r: 4.5, fill: L2.INK }, node);
        }
        L2.el('rect', { x: cx - bw / 2, y: y0, width: bw, height: y1 - y0, rx: 4,
          fill: op.fill || '#fff', stroke: op.stroke || L2.INK, 'stroke-width': 1.6,
          'stroke-dasharray': op.dash ? '5 3' : null }, node);
        if (op.math) {
          // a typeset label: italic serif base with an upright superscript or subscript
          L2.mathText(node, cx, (y0 + y1) / 2, op.math, { size: op.size || 18, fill: op.ink || L2.INK });
        } else if (op.label) {
          const lines = Array.isArray(op.label) ? op.label : [op.label];
          lines.forEach((s, li) => L2.text(node, s, cx, (y0 + y1) / 2 + (li - (lines.length - 1) / 2) * 15,
            { size: op.size || spec.fontSize || 14, mono: !op.sans, fill: op.ink || L2.INK, weight: op.weight || 400 }));
        }
      } else if (op.t === 'h') {
        const y = wireY(op.w);
        L2.el('rect', { x: cx - 13, y: y - 13, width: 26, height: 26, rx: 3, fill: '#fff', stroke: L2.INK, 'stroke-width': 1.6 }, node);
        L2.text(node, 'H', cx, y, { size: 14, mono: true });
      } else if (op.t === 'meas') {
        const y = wireY(op.w);
        L2.el('rect', { x: cx - 15, y: y - 13, width: 30, height: 26, rx: 3, fill: '#fff', stroke: L2.INK, 'stroke-width': 1.6 }, node);
        L2.el('path', { d: `M ${cx - 9} ${y + 6} A 9 9 0 0 1 ${cx + 9} ${y + 6}`, fill: 'none', stroke: L2.INK, 'stroke-width': 1.4 }, node);
        L2.el('line', { x1: cx, y1: y + 6, x2: cx + 7, y2: y - 6, stroke: L2.INK, 'stroke-width': 1.4 }, node);
      } else if (op.t === 'ctrl') {
        // plain control dot + target ⊕ (CNOT-style)
        const cy = wireY(op.c), ty = wireY(op.w);
        L2.el('line', { x1: cx, y1: cy, x2: cx, y2: ty + (ty > cy ? 9 : -9), stroke: L2.INK, 'stroke-width': 1.8 }, node);
        L2.el('circle', { cx, cy, r: 4.5, fill: L2.INK }, node);
        L2.el('circle', { cx, cy: ty, r: 9, fill: 'none', stroke: L2.INK, 'stroke-width': 1.8 }, node);
        L2.el('line', { x1: cx - 9, y1: ty, x2: cx + 9, y2: ty, stroke: L2.INK, 'stroke-width': 1.8 }, node);
      }
      ops.push({ node, spec: op, x: cx, w });
      xcur += w;
    });
    return { g, colX, wireY, ops, width: labelW + total, height: rowH * (n - 1) };
  };

  // ── The good/bad quarter-circle shared by slides 7 to 11 ────────────────
  // One coordinate system for the whole mechanism sequence, so the state
  // vector visibly persists from slide to slide.
  L2.quarter = (parent, o) => {
    const cx = o.cx, cy = o.cy, R = o.R;
    const g = L2.el('g', {}, parent);
    L2.el('path', { d: `M ${cx + R} ${cy} A ${R} ${R} 0 0 0 ${cx} ${cy - R}`, fill: 'none',
      stroke: L2.RULE, 'stroke-width': 1.5 }, g);
    L2.el('line', { x1: cx, y1: cy, x2: cx + R + 18, y2: cy, stroke: L2.GRAY, 'stroke-width': 1.5, opacity: 0.8 }, g);
    L2.el('line', { x1: cx, y1: cy, x2: cx, y2: cy - R - 18, stroke: L2.BLUE, 'stroke-width': 1.5, opacity: 0.55 }, g);
    L2.text(g, '|bad⟩', cx + R + 26, cy, { anchor: 'start', size: 16, fill: L2.GRAY, serif: true });
    L2.text(g, '|good⟩', cx, cy - R - 30, { size: 16, fill: L2.BLUE, serif: true });
    const api = { g, cx, cy, R };
    // state vector at angle theta (radians from the |bad> axis)
    api.vector = (theta, opts) => {
      opts = opts || {};
      // opacity lives on the group, so callers can fade the whole vector
      const gg = L2.el('g', { opacity: opts.opacity }, g);
      const x = cx + R * Math.cos(theta), y = cy - R * Math.sin(theta);
      L2.el('line', { x1: cx, y1: cy, x2: x, y2: y, stroke: opts.color || L2.INK,
        'stroke-width': opts.width || 3, 'stroke-linecap': 'round' }, gg);
      L2.el('circle', { cx: x, cy: y, r: opts.dot || 5, fill: opts.color || L2.INK }, gg);
      gg.setTheta = (th) => {
        const xx = cx + R * Math.cos(th), yy = cy - R * Math.sin(th);
        gg.children[0].setAttribute('x2', xx); gg.children[0].setAttribute('y2', yy);
        gg.children[1].setAttribute('cx', xx); gg.children[1].setAttribute('cy', yy);
      };
      return gg;
    };
    // arc from angle a to b at radius r
    api.arc = (a, b, r, opts) => {
      opts = opts || {};
      const p = L2.el('path', { fill: 'none', stroke: opts.color || L2.GOLD,
        'stroke-width': opts.width || 5, 'stroke-linecap': 'round', opacity: opts.opacity }, g);
      p.setArc = (a2, b2) => {
        const x1 = cx + r * Math.cos(a2), y1 = cy - r * Math.sin(a2);
        const x2 = cx + r * Math.cos(b2), y2 = cy - r * Math.sin(b2);
        const large = Math.abs(b2 - a2) > Math.PI ? 1 : 0;
        const sweep = b2 > a2 ? 0 : 1;
        p.setAttribute('d', Math.abs(b2 - a2) < 1e-4 ? '' :
          `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`);
      };
      p.setArc(a, b);
      return p;
    };
    return api;
  };

  // ── The four worlds from the Sway post's "Can't unsee it" figure ────
  // One rule (neighbours reinforce, isolation exposes, the environment
  // shakes), four skins.  Boards and palettes are the blog's; the themed
  // drawer paints them at any size so the strip can recur through the deck.
  L2.WORLDS = [
    { title: 'Opinion dynamics', desc: 'like-minded neighbours hold firm; isolated voices change their tune',
      t: { bg: '#e8d8c4', grid: '#b89f78', a: '#c0392b', aS: '#8e2a1e', b: '#2980b9', bS: '#1a5276' },
      board: [2, 2, 0, 0, 1, 0, 2, 2, 1, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1] },
    { title: 'Market adoption', desc: 'users stay where everyone uses it; lone adopters drift away',
      t: { bg: '#d4e6dc', grid: '#8cbfa3', a: '#27ae60', aS: '#1a7a40', b: '#e67e22', bS: '#a35a18' },
      board: [0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0, 2, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2] },
    { title: 'Cultural competition', desc: 'ideas survive in tight communities; a lone believer is easy to sway',
      t: { bg: '#dbd4ee', grid: '#a99bc8', a: '#8e44ad', aS: '#6a2980', b: '#f39c12', bS: '#b87409' },
      board: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 2, 0, 1, 1, 0] },
    { title: 'Epidemic spread', desc: 'dense clusters sustain transmission; isolated cases burn out',
      t: { bg: '#f5d5d5', grid: '#c9a0a0', a: '#e74c3c', aS: '#a93226', b: '#7f8c8d', bS: '#5a6364' },
      board: [0, 0, 0, 2, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0] }
  ];
  L2.themedBoard = (parent, o) => {
    const N = o.N || 6, size = o.size, t = o.theme;
    const cell = size / N, pad = cell / 2;
    const g = L2.el('g', { transform: `translate(${o.x || 0},${o.y || 0})` }, parent);
    L2.el('rect', { x: 0, y: 0, width: size, height: size, rx: Math.max(3, cell * 0.2), fill: t.bg }, g);
    for (let i = 0; i < N; i++) {
      const p = pad + i * cell;
      L2.el('line', { x1: p, y1: pad, x2: p, y2: size - pad, stroke: t.grid, 'stroke-width': 0.8 }, g);
      L2.el('line', { x1: pad, y1: p, x2: size - pad, y2: p, stroke: t.grid, 'stroke-width': 0.8 }, g);
    }
    const stones = L2.el('g', {}, g);
    const api = { g, stones, cx: (i) => pad + (i % N) * cell, cy: (i) => pad + Math.floor(i / N) * cell, r: cell * 0.36 };
    api.redraw = (board) => {
      stones.textContent = '';
      for (let i = 0; i < board.length; i++) {
        if (!board[i]) continue;
        L2.el('circle', { cx: api.cx(i), cy: api.cy(i), r: api.r, fill: board[i] === 1 ? t.a : t.b,
          stroke: board[i] === 1 ? t.aS : t.bS, 'stroke-width': 1.1 }, stones);
      }
    };
    if (o.board) api.redraw(o.board);
    return api;
  };


  // ── The binary game tree slides 6 and 7 share ────────────────────────
  // H levels of binary branching drawn left to right: the root is the stone,
  // the leaves stand against the horizon wall.  Leaf payoffs come from one
  // seed, so slide 6's jar settles toward the same a that slide 7's payoff
  // qubit shows.  frac[h][i] is the share of leaves under node (h, i) that
  // pay 1, which slide 7 uses to tint every branch by its amplitude.
  L2.gameTree = (parent, o) => {
    const H = o.H, X0 = o.X0, X1 = o.X1, YTOP = o.YTOP, YBOT = o.YBOT;
    const dx = (X1 - X0) / H;
    const nodeX = (h) => X0 + h * dx;
    const nodeY = (h, i) => YTOP + (i + 0.5) * ((YBOT - YTOP) / Math.pow(2, h));
    const g = L2.el('g', {}, parent);
    for (let h = 1; h <= H; h++) for (let i = 0; i < Math.pow(2, h); i++) {
      L2.el('line', { x1: nodeX(h - 1), y1: nodeY(h - 1, i >> 1), x2: nodeX(h), y2: nodeY(h, i),
        stroke: L2.RULE, 'stroke-width': 1.1, opacity: 0.75 }, g);
    }
    for (let h = 1; h <= H; h++) for (let i = 0; i < Math.pow(2, h); i++) {
      L2.el('circle', { cx: nodeX(h), cy: nodeY(h, i), r: h === H ? 1.8 : 2.2, fill: L2.RULE }, g);
    }
    const rnd = L2.prng(o.seed === undefined ? 2026 : o.seed);
    const leafBit = [];
    for (let i = 0; i < Math.pow(2, H); i++) leafBit.push(rnd() < 0.62 ? 1 : 0);
    const a = leafBit.reduce((s, b) => s + b, 0) / leafBit.length;
    const frac = [];
    for (let h = 0; h <= H; h++) frac.push([]);
    for (let i = 0; i < Math.pow(2, H); i++) frac[H][i] = leafBit[i];
    for (let h = H - 1; h >= 0; h--) for (let i = 0; i < Math.pow(2, h); i++) frac[h][i] = (frac[h + 1][2 * i] + frac[h + 1][2 * i + 1]) / 2;
    return { g, H, dx, nodeX, nodeY, leafBit, a, frac, YMID: (YTOP + YBOT) / 2 };
  };
  // a blend between two hex colours, for tinting by amplitude
  L2.mix = (c0, c1, f) => {
    const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const a = p(c0), b = p(c1);
    return 'rgb(' + a.map((v, i) => Math.round(L2.lerp(v, b[i], L2.clamp01(f)))).join(',') + ')';
  };

  window.L2 = L2;
})();
