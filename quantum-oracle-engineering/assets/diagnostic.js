// diagnostic.js -- the one-line tests, written as tests.
//
//   <premise>
//        ↓
//   <question>
//
//        yes                      no
//   <yes gloss>              <no gloss>
//   keep going / build it    stop here
//
// One script draws every svg.diagnostic-fig on the page, and the words come
// from the svg's data attributes (data-premise, data-question, data-yes,
// data-no, and data-pass for the passing verdict), so each of the three
// questions closes on the same card with its own text.
//
// This design was the sixth for Question 1's card and the first that is not
// wordless.  Five wordless cuts failed the same way: a rule the room applies
// to domains it offers is words, and a slide that shows the one line is the
// slide that does the job.  The check and stop sign are the gates' own marks,
// so the reader can see which branch survives the question.
(function () {
  const figs = document.querySelectorAll('svg.diagnostic-fig');
  if (!figs.length) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const DIM = '#888';
  const RULE = '#d8dbe1';
  const GRAY = '#9aa0a8';
  const ACCENT = '#456AAD';
  const GREEN = '#4D8C55';
  const STOPRED = '#c0392b';

  const CX = 380;
  const T_END = 2.6;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A die face, 3 or 5 pips, in whichever ink the branch owns.
  const PIPS = {
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]]
  };

  figs.forEach((svg) => {
    if (svg.dataset.built) return;          // the script is included once per card
    svg.dataset.built = '1';
    const D = svg.dataset;

    const el = (name, attrs, parent) => {
      const node = document.createElementNS(ns, name);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      (parent || svg).appendChild(node);
      return node;
    };
    const text = (s, x, y, size, fill, weight, parent) => {
      const t = el('text', {
        x, y, 'text-anchor': 'middle', fill: fill || DIM, 'font-size': size,
        'font-weight': weight || 600, 'font-family': "'Ubuntu', sans-serif"
      }, parent);
      t.textContent = s;
      return t;
    };
    const die = (cx, cy, s, value, colour, parent) => {
      el('rect', {
        x: cx - s / 2, y: cy - s / 2, width: s, height: s, rx: s * 0.18,
        fill: colour, 'fill-opacity': 0.12, stroke: colour, 'stroke-width': 2
      }, parent);
      PIPS[value].forEach(([px, py]) => el('circle', {
        cx: cx - s / 2 + px * s, cy: cy - s / 2 + py * s, r: s * 0.082,
        fill: colour
      }, parent));
    };

    const root = el('g', {});
    const ask = el('g', { opacity: 0 }, root);
    const answers = el('g', { opacity: 0 }, root);

    // ── The premise, and the question it forces ───────────────────────
    text(D.premise || '', CX, 34, 15, DIM, 600, ask);
    el('line', { x1: CX, y1: 48, x2: CX, y2: 68, stroke: RULE,
      'stroke-width': 1.5 }, ask);
    el('polygon', { points: '0,0 -5,-8 5,-8', fill: RULE,
      transform: 'translate(' + CX + ',70)' }, ask);
    text(D.question || '', CX, 108, 30, INK, 700, ask);

    // ── The two answers, and what each one means ──────────────────────
    const BRANCH = [
      { x: 196, verdict: 'yes', gloss: D.yes || '', colour: ACCENT, pips: 5, pass: true },
      { x: 564, verdict: 'no', gloss: D.no || '', colour: GRAY, pips: 3, pass: false }
    ];
    const TOP = 140, H = 132, W = 300;

    BRANCH.forEach((b) => {
      const g = el('g', {}, answers);
      el('rect', {
        x: b.x - W / 2, y: TOP, width: W, height: H, rx: 8,
        fill: b.colour, 'fill-opacity': 0.05, stroke: b.colour,
        'stroke-opacity': 0.45, 'stroke-width': 1.5
      }, g);
      die(b.x - 96, TOP + 46, 40, b.pips, b.colour, g);
      text(b.verdict, b.x + 22, TOP + 40, 24, INK, 700, g);
      text(b.gloss, b.x + 22, TOP + 64, 14, DIM, 600, g);

      // The gates' own marks: which branch survives this question.
      const my = TOP + 100;
      if (b.pass) {
        el('circle', { cx: b.x - 52, cy: my, r: 11, fill: GREEN,
          opacity: 0.9 }, g);
        el('path', { d: 'M ' + (b.x - 57.5) + ' ' + my + ' l 4 4.5 l 7.5 -9',
          fill: 'none', stroke: '#fff', 'stroke-width': 2.2,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        text(D.pass || 'keep going', b.x + 22, my + 6, 15, GREEN, 700, g);
      } else {
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const a = Math.PI / 8 + i * Math.PI / 4;
          pts.push((b.x - 52 + 11 * Math.cos(a)).toFixed(1) + ',' +
                   (my + 11 * Math.sin(a)).toFixed(1));
        }
        el('polygon', { points: pts.join(' '), fill: STOPRED,
          opacity: 0.85 }, g);
        el('rect', { x: b.x - 58, y: my - 1.5, width: 12, height: 3,
          fill: '#fff', opacity: 0.9 }, g);
        text('stop here', b.x + 22, my + 6, 15, STOPRED, 700, g);
      }
    });

    // ── Reveal: the question first, then the two answers ──────────────
    const setState = (t) => {
      ask.setAttribute('opacity', clamp01(t / 0.6));
      answers.setAttribute('opacity', clamp01((t - 1.0) / 0.7));
    };

    if (reduced) { setState(T_END); return; }

    let playing = false, elapsed = 0, last = performance.now();
    const play = () => { elapsed = 0; playing = true; };

    const slide = svg.closest('.slide');
    if (slide) {
      setState(0);
      if (slide.classList.contains('current')) play();
      new MutationObserver(() => {
        if (slide.classList.contains('current')) {
          if (!playing && elapsed === 0) play();
        } else { playing = false; elapsed = 0; setState(0); }
      }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    } else { play(); }

    const frame = (now) => {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (document.hidden || !playing) return;
      elapsed += dt;
      if (elapsed >= T_END) { elapsed = T_END; playing = false; }
      setState(elapsed);
    };
    requestAnimationFrame(frame);
  });
})();
