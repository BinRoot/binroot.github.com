// gates.js -- slides 10 to 13: the screening line.
//
// One machine, seen four times.  A belt carries problem tiles left to right
// past three gate positions.  An installed gate either passes a tile or
// kicks it down a chute to its own stop sign; positions not yet installed
// show as bare bolt plates, so the audience can see what is coming.  At the
// far right is the build bay, where the one survivor becomes a circuit.
//
//   slide 10 (data-gates="1"): gate one slams in, most tiles get kicked, the
//                              rest queue in the empty span downstream
//   slide 11 (data-gates="2"): gate two slams in and sees only what gate
//                              one passed
//   slide 12 (data-gates="3"): gate three slams in; one tile reaches the bay
//   slide 13 (data-gates="4"): the whole line runs, no install beat
//
// Left to right IS the flowchart topology, so the corner mini-map and the
// handout can be schematics of this machine rather than a second picture of
// the same test.  No words anywhere: the questions live in the slide titles,
// and each gate is identified by a pictogram (a die, a narrow-gap mark, a
// circuit chip).
//
// Motion rules for energy, applied here first and worth copying to the older
// figures: anticipation before a big move, a fast attack into a slow settle
// (easeOutQuart / backOut rather than symmetric easing), squash on impact,
// dust and flash at every landing, a jolt through the whole scene when the
// gate hits, and beats that overlap instead of queueing.
//
// One script, many figures on one page: it initialises every .gates-fig it
// finds and guards against running twice, since each fragment brings its own
// script tag.
(function () {
  if (window.__gatesInit) return;
  window.__gatesInit = true;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const GRAY = '#9aa0a8';
  const WIRE = '#8a90a0';
  const ACCENT = '#456AAD';
  const STOPRED = '#c0392b';
  const GREEN = '#4D8C55';
  const GOLD = '#F2BF80';

  const BELT_Y = 158, BELT_X0 = 16, BELT_X1 = 712;
  const GATE_X = [220, 400, 580];
  const STOP_Y = 250;
  const BAY_X = 676;
  const SPEED = 150;                // px per second on the belt: brisk
  const T_END = 9.5;

  const TILES = [
    { icon: 'go', dies: 1 },
    { icon: 'slot', dies: 1 },
    { icon: 'knot', dies: 1 },
    { icon: 'mol', dies: 1 },
    { icon: 'maze', dies: 1 },
    { icon: 'graph', dies: 2 },
    { icon: 'go', dies: 3 },
    { icon: 'diegrid', dies: 0 }
  ];

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    parent.appendChild(node);
    return node;
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  // Fast attack, long settle.
  const outQuart = (u) => 1 - Math.pow(1 - u, 4);
  // Overshoots its mark and comes back: the difference between placing an
  // object and slamming one.
  const backOut = (u, s) => {
    const k = s === undefined ? 2.2 : s;
    const p = u - 1;
    return 1 + (k + 1) * p * p * p + k * p * p;
  };

  const drawIcon = (kind, g) => {
    const line = (x1, y1, x2, y2, c, w) => el('line', {
      x1, y1, x2, y2, stroke: c || INK, 'stroke-width': w || 1.3 }, g);
    if (kind === 'go') {
      [-4, 4].forEach((d) => { line(d, -8, d, 8, RULE); line(-8, d, 8, d, RULE); });
      el('circle', { cx: -4, cy: -4, r: 2.6, fill: INK }, g);
      el('circle', { cx: 4, cy: 4, r: 2.6, fill: '#fff', stroke: INK,
        'stroke-width': 1 }, g);
    } else if (kind === 'slot') {
      el('rect', { x: -8, y: -6, width: 16, height: 12, rx: 2,
        fill: 'none', stroke: INK, 'stroke-width': 1.3 }, g);
      [-5, -1, 3].forEach((x) => el('rect', { x, y: -3, width: 3, height: 6,
        fill: GRAY }, g));
    } else if (kind === 'knot') {
      el('path', { d: 'M -8 4 C -4 -8, 2 -9, 3 -3 C 4 3, -6 1, -1 6 ' +
        'C 3 9, 7 3, 8 -4', fill: 'none', stroke: INK,
        'stroke-width': 1.5 }, g);
    } else if (kind === 'mol') {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 2 + i * Math.PI / 3;
        pts.push((7 * Math.cos(a)).toFixed(1) + ',' +
                 (-7 * Math.sin(a)).toFixed(1));
      }
      el('polygon', { points: pts.join(' '), fill: 'none', stroke: INK,
        'stroke-width': 1.3 }, g);
      el('circle', { cx: 0, cy: 0, r: 3, fill: 'none', stroke: INK,
        'stroke-width': 1.1 }, g);
    } else if (kind === 'maze') {
      el('path', { d: 'M -8 -6 h 10 v 5 h -6 v 5 h 10', fill: 'none',
        stroke: INK, 'stroke-width': 1.4 }, g);
      el('path', { d: 'M -8 7 h 5', fill: 'none', stroke: INK,
        'stroke-width': 1.4 }, g);
    } else if (kind === 'graph') {
      line(-6, -5, 5, -6, WIRE); line(-6, -5, -2, 5, WIRE);
      line(5, -6, 7, 4, WIRE); line(-2, 5, 7, 4, WIRE);
      [[-6, -5], [5, -6], [-2, 5], [7, 4]].forEach(([x, y]) =>
        el('circle', { cx: x, cy: y, r: 2.4, fill: INK }, g));
    } else {
      [-4, 4].forEach((d) => { line(d, -8, d, 8, RULE); line(-8, d, 8, d, RULE); });
      el('rect', { x: 1, y: 1, width: 8, height: 8, rx: 1.5,
        fill: ACCENT }, g);
      el('circle', { cx: 5, cy: 5, r: 1.3, fill: '#fff' }, g);
    }
  };

  const gateIcon = (which, g) => {
    if (which === 0) {
      el('rect', { x: -7, y: -7, width: 14, height: 14, rx: 3,
        fill: ACCENT }, g);
      [[-3, -3], [3, 3], [0, 0]].forEach(([x, y]) =>
        el('circle', { cx: x, cy: y, r: 1.4, fill: '#fff' }, g));
    } else if (which === 1) {
      el('line', { x1: -3, y1: -8, x2: -3, y2: 8, stroke: INK,
        'stroke-width': 2 }, g);
      el('line', { x1: 3, y1: -8, x2: 3, y2: 8, stroke: INK,
        'stroke-width': 2 }, g);
      el('path', { d: 'M -9 0 h 4 m 10 0 h 4', stroke: INK,
        'stroke-width': 1.4, fill: 'none' }, g);
    } else {
      el('rect', { x: -8, y: -6, width: 16, height: 12, rx: 2,
        fill: '#fff', stroke: INK, 'stroke-width': 1.4 }, g);
      [-2, 2].forEach((y) => el('line', { x1: -5, y1: y, x2: 5, y2: y,
        stroke: WIRE, 'stroke-width': 1.1 }, g));
      el('circle', { cx: -2, cy: -2, r: 1.6, fill: INK }, g);
    }
  };

  const init = (svg) => {
    const G = Math.min(4, Math.max(1, +svg.dataset.gates || 1));
    const installed = Math.min(3, G);
    const isFull = G >= 4;
    // Anticipation, slam, settle: 0.0 -> 0.14 -> 0.30 -> 0.5
    const ANTIC = 0.14, SLAM = 0.30, HIT = SLAM;
    const T0 = isFull ? 0.25 : 0.55;      // first tile enters
    const STEP = 0.42;                    // entries overlap
    const root = el('g', {}, svg);        // everything, so the scene can jolt

    // ── Belt ──
    el('rect', { x: BELT_X0, y: BELT_Y + 6, width: BELT_X1 - BELT_X0,
      height: 7, rx: 3, fill: '#e2e4e8', stroke: RULE,
      'stroke-width': 1 }, root);
    const ticks = [];
    for (let x = BELT_X0 + 8; x < BELT_X1; x += 18) {
      ticks.push(el('line', { x1: x, y1: BELT_Y + 7, x2: x,
        y2: BELT_Y + 12, stroke: '#c4c8cf', 'stroke-width': 1.4 }, root));
    }

    // ── Gate positions ──
    const gates = GATE_X.map((gx, i) => {
      const on = i < installed;
      el('rect', { x: gx - 26, y: BELT_Y - 2, width: 52, height: 9, rx: 2,
        fill: '#d5d8dd', stroke: RULE, 'stroke-width': 1 }, root);
      [-20, 20].forEach((d) => el('circle', { cx: gx + d, cy: BELT_Y + 2.5,
        r: 1.6, fill: '#a9aeb6' }, root));

      const chute = el('g', { opacity: on ? 1 : 0 }, root);
      el('path', { d: `M ${gx - 6} ${BELT_Y + 12} L ${gx - 40} ${STOP_Y - 20} ` +
        `M ${gx + 12} ${BELT_Y + 12} L ${gx - 22} ${STOP_Y - 20}`,
        stroke: '#cfd3d9', 'stroke-width': 3, fill: 'none',
        'stroke-linecap': 'round' }, chute);
      const signG = el('g', {}, chute);
      const oct = [];
      for (let k = 0; k < 8; k++) {
        const a = Math.PI / 8 + k * Math.PI / 4;
        oct.push((13 * Math.cos(a)).toFixed(1) + ',' +
                 (13 * Math.sin(a)).toFixed(1));
      }
      el('polygon', { points: oct.join(' '), fill: STOPRED,
        opacity: 0.9 }, signG);
      el('rect', { x: -7, y: -1.6, width: 14, height: 3.2, rx: 1,
        fill: '#fff', opacity: 0.92 }, signG);

      const gate = el('g', { opacity: on ? 1 : 0 }, root);
      [-24, 24].forEach((d) => el('rect', { x: gx + d - 4, y: BELT_Y - 62,
        width: 8, height: 62, rx: 2, fill: '#c9ced6', stroke: RULE,
        'stroke-width': 1 }, gate));
      el('rect', { x: gx - 32, y: BELT_Y - 76, width: 64, height: 18, rx: 4,
        fill: '#eceef2', stroke: RULE, 'stroke-width': 1.2 }, gate);
      const badge = el('g', { transform: 'translate(' + gx + ',' +
        (BELT_Y - 40) + ')' }, gate);
      gateIcon(i, badge);
      // A flash across the gate mouth each time it acts.
      const flash = el('rect', { x: gx - 24, y: BELT_Y - 58, width: 48,
        height: 56, rx: 3, fill: GOLD, opacity: 0 }, root);
      // Dust at the gate's feet and at the pile.
      const puffs = [0, 1, 2].map(() => el('circle', { cx: 0, cy: 0, r: 3,
        fill: '#cfd3d9', opacity: 0 }, root));
      return { gx, on, gate, chute, signG, flash, puffs,
               newest: i === installed - 1 && !isFull };
    });

    // ── Build bay ──
    const bay = el('g', {}, root);
    el('rect', { x: BAY_X - 34, y: BELT_Y - 40, width: 68, height: 46, rx: 6,
      fill: '#fbfbfc', stroke: RULE, 'stroke-width': 1.4 }, bay);
    const circuit = el('g', { opacity: 0.22 }, bay);
    [-10, 0, 10].forEach((dy) => el('line', { x1: BAY_X - 24,
      y1: BELT_Y - 17 + dy, x2: BAY_X + 24, y2: BELT_Y - 17 + dy,
      stroke: WIRE, 'stroke-width': 1.3 }, circuit));
    [[-8, -10, 0], [8, 0, 10]].forEach(([x, a, b]) => {
      el('line', { x1: BAY_X + x, y1: BELT_Y - 17 + a, x2: BAY_X + x,
        y2: BELT_Y - 17 + b, stroke: INK, 'stroke-width': 1.4 }, circuit);
      el('circle', { cx: BAY_X + x, cy: BELT_Y - 17 + a, r: 2.4,
        fill: INK }, circuit);
      el('circle', { cx: BAY_X + x, cy: BELT_Y - 17 + b, r: 4.5,
        fill: 'none', stroke: INK, 'stroke-width': 1.4 }, circuit);
    });
    const bayRing = el('circle', { cx: BAY_X, cy: BELT_Y - 17, r: 20,
      fill: 'none', stroke: GREEN, 'stroke-width': 2.5, opacity: 0 }, root);

    // ── Tiles ──
    const queueAt = (n) => GATE_X[installed - 1] + 54 + n * 28;
    let queued = 0;
    const perGate = [0, 0, 0];
    const plan = TILES.map((t) => {
      const rejects = t.dies > 0 && t.dies <= installed;
      if (rejects) {
        const gi = t.dies - 1;
        return { t, kind: 'reject', gate: gi, slot: perGate[gi]++ };
      }
      if (installed === 3) return { t, kind: 'bay' };
      return { t, kind: 'queue', slot: queued++ };
    });

    const sprites = plan.map((p) => {
      const g = el('g', { opacity: 0 }, root);
      const streak = el('rect', { x: -34, y: -3, width: 26, height: 6,
        rx: 3, fill: GOLD, opacity: 0 }, g);
      const body = el('g', {}, g);
      el('rect', { x: -12, y: -12, width: 24, height: 24, rx: 4,
        fill: '#fff', stroke: INK, 'stroke-width': 1.3 }, body);
      drawIcon(p.t.icon, body);
      return { g, body, streak };
    });

    const setState = (t) => {
      // ── Install: wind up, slam, overshoot, and shake the room ──
      let shake = 0;
      gates.forEach((gt) => {
        if (!gt.on) return;
        if (!gt.newest) { gt.gate.setAttribute('opacity', 1); return; }
        let dy, sy = 1;
        if (t < ANTIC) {
          dy = lerp(-52, -60, t / ANTIC);         // anticipation: lifts
        } else if (t < SLAM) {
          dy = lerp(-60, 0, outQuart((t - ANTIC) / (SLAM - ANTIC)));
        } else {
          const s = clamp01((t - SLAM) / 0.34);
          dy = (1 - backOut(s)) * -9;             // settles past its mark
          sy = 1 + 0.10 * (1 - s) * Math.cos(s * 12);
        }
        gt.gate.setAttribute('opacity', t > 0.02 ? 1 : 0);
        gt.gate.setAttribute('transform', 'translate(0,' + dy +
          ') scale(1,' + sy.toFixed(3) + ')');
        gt.chute.setAttribute('opacity', clamp01((t - HIT) / 0.2));
        const since = t - HIT;
        if (since > 0 && since < 0.45) {
          shake = 7 * Math.exp(-9 * since) * Math.sin(70 * since);
          gt.puffs.forEach((pf, k) => {
            const u = clamp01((since - k * 0.04) / 0.4);
            pf.setAttribute('cx', gt.gx + (k - 1) * 26 - 4);
            pf.setAttribute('cy', BELT_Y + 10 - u * 12);
            pf.setAttribute('r', 3 + u * 13);
            pf.setAttribute('opacity', 0.45 * (1 - u));
          });
        } else {
          gt.puffs.forEach((pf) => pf.setAttribute('opacity', 0));
        }
      });
      root.setAttribute('transform', 'translate(0,' + shake.toFixed(2) + ')');

      // Belt spins up rather than switching on.
      const speedU = clamp01((t - HIT) / 0.35);
      const scroll = (t * 60 * speedU) % 18;
      ticks.forEach((tk, i) => {
        let x = BELT_X0 + 8 + i * 18 + scroll;
        if (x > BELT_X1) x -= (BELT_X1 - BELT_X0);
        tk.setAttribute('x1', x);
        tk.setAttribute('x2', x);
      });

      let arrivedAt = -1;
      const gateHit = [0, 0, 0];
      plan.forEach((p, i) => {
        const s = sprites[i];
        const t0 = T0 + i * STEP;
        const dt = t - t0;
        if (dt <= 0) { s.g.setAttribute('opacity', 0); return; }
        s.g.setAttribute('opacity', 1);

        const stopX = p.kind === 'reject' ? GATE_X[p.gate]
          : p.kind === 'bay' ? BAY_X : queueAt(p.slot);
        const travel = (stopX - BELT_X0) / SPEED;

        if (dt < travel) {                        // riding, stretched
          const x = BELT_X0 + dt * SPEED;
          s.g.setAttribute('transform', 'translate(' + x + ',' +
            (BELT_Y - 14) + ')');
          s.body.setAttribute('transform', 'scale(1.06,0.95)');
          s.streak.setAttribute('opacity', 0.35);
          return;
        }
        s.streak.setAttribute('opacity', 0);

        if (p.kind !== 'reject') {                // parked or delivered
          const land = clamp01((dt - travel) / 0.22);
          s.g.setAttribute('transform', 'translate(' + stopX + ',' +
            (BELT_Y - 14) + ')');
          const sq = 1 - 0.22 * Math.sin(Math.PI * land);
          s.body.setAttribute('transform',
            'scale(' + (2 - sq).toFixed(3) + ',' + sq.toFixed(3) + ')');
          if (p.kind === 'bay' && dt > travel) arrivedAt = t0 + travel;
          return;
        }

        // Kicked out: fast, spinning, with a squash on landing.
        const u = clamp01((dt - travel) / 0.42);
        const gx = GATE_X[p.gate];
        const px = gx - 31 + ((p.slot % 3) - 1) * 15;
        const py = STOP_Y - 30 - Math.floor(p.slot / 3) * 13;
        const fly = outQuart(u);
        s.g.setAttribute('transform', 'translate(' +
          lerp(gx, px, fly) + ',' +
          lerp(BELT_Y - 14, py, u * u) + ') rotate(' + (u * 210) +
          ') scale(' + lerp(1, 0.8, u) + ')');
        const bounce = u > 0.86 ? Math.sin((u - 0.86) / 0.14 * Math.PI) : 0;
        s.body.setAttribute('transform',
          'scale(' + (1 + 0.25 * bounce) + ',' + (1 - 0.25 * bounce) + ')');
        if (u > 0.02 && u < 0.5) gateHit[p.gate] = 1;
        if (u > 0.84 && u < 1) gateHit[p.gate] = Math.max(gateHit[p.gate], 0.6);
      });

      // Gates flash as they act; the stop signs shudder as tiles land.
      gates.forEach((gt, i) => {
        gt.flash.setAttribute('opacity', 0.5 * gateHit[i]);
        const w = gateHit[i] > 0.5 ? 0 : 0;
        gt.signG.setAttribute('transform', 'translate(' + (gt.gx - 31) + ',' +
          STOP_Y + ') rotate(' + (gateHit[i] > 0.5
            ? 6 * Math.sin(t * 40) * gateHit[i] : w) + ')');
      });

      // The bay snaps on when the survivor lands.
      if (arrivedAt > 0) {
        const a = clamp01((t - arrivedAt) / 0.45);
        circuit.setAttribute('opacity', 1);
        bayRing.setAttribute('r', 20 + 26 * a);
        bayRing.setAttribute('opacity', 0.8 * (1 - a));
      } else {
        circuit.setAttribute('opacity', 0.22);
        bayRing.setAttribute('opacity', 0);
      }
    };

    // ── Replay control ──
    const RB = { x: 380, y: 284, r: 14 };
    const replay = el('g', { class: 'no-nav', cursor: 'pointer',
      role: 'button', 'aria-label': 'replay' }, svg);
    el('circle', { cx: RB.x, cy: RB.y, r: RB.r, fill: '#fff', stroke: RULE,
      'stroke-width': 1.5 }, replay);
    el('path', { d: 'M 4 -6.93 A 8 8 0 1 1 -6.93 -4', fill: 'none',
      stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round',
      transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);
    el('polygon', { points: '6.6,-5.4 5.25,-9.1 2.75,-4.8', fill: INK,
      transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState(T_END);
      replay.setAttribute('display', 'none');
      return;
    }

    let playing = false, elapsed = 0, last = performance.now();
    const play = () => { elapsed = 0; playing = true; };
    replay.addEventListener('click', play);

    const slide = svg.closest('.slide');
    if (slide) {
      setState(0);
      if (slide.classList.contains('current')) play();
      new MutationObserver(() => {
        if (slide.classList.contains('current')) {
          if (!playing && elapsed === 0) play();
        } else {
          playing = false;
          elapsed = 0;
          setState(0);
        }
      }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    } else {
      play();
    }

    const frame = (now) => {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      replay.setAttribute('opacity', playing ? 0.4 : 1);
      if (document.hidden || !playing) return;
      elapsed += dt;
      if (elapsed >= T_END) { elapsed = T_END; playing = false; }
      setState(elapsed);
    };
    requestAnimationFrame(frame);
  };

  document.querySelectorAll('svg.gates-fig').forEach(init);
})();
