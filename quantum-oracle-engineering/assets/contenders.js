// contenders.js -- the three contenders and the scoreboard they fill in.
//
// One figure in four states, so slide 3 and slide 38 are the same picture,
// empty and then complete.  There is no counting mechanic anywhere here:
// the room's predictions are taken aloud.
//
//   data-mode="open"    slide 3: the three contenders, large, and nothing
//                       else (a Go position, a two-lever bandit, the
//                       close-calls board with its die)
//   data-mode="go"      unused since the Go card slide was cut: the Go picture comes forward, the others
//                       recede
//   data-mode="bandit"  slide 14: the bandit comes forward
//   data-mode="matrix"  slide 38: the same board with every slot filled, one
//                       press per row, then the green "build next" outline
(function () {
  if (window.__contendersInit) return;
  window.__contendersInit = true;
  const L = window.L2;

  const COL_X = [190, 390, 590];
  const PIC = 132;                       // picture side
  const PIC_Y = 20;                      // picture top
  const ROW0 = PIC_Y + PIC + 62, RH = 36;
  const QS = ['still sampling?', 'precision?', 'worth building?'];
  const NAMES = ['Go', 'two-arm bandit', 'close-calls game'];

  // ── the three pictures, each drawn into a PIC x PIC box at (0,0) ──
  const picGo = (g) => {
    const s = PIC / 9;
    L.el('rect', { x: 0, y: 0, width: PIC, height: PIC, rx: 6, fill: L.WOOD, stroke: L.WOODLINE }, g);
    for (let i = 0; i < 9; i++) {
      L.el('line', { x1: s / 2 + i * s, y1: s / 2, x2: s / 2 + i * s, y2: PIC - s / 2, stroke: L.WOODLINE, 'stroke-width': 0.8 }, g);
      L.el('line', { x1: s / 2, y1: s / 2 + i * s, x2: PIC - s / 2, y2: s / 2 + i * s, stroke: L.WOODLINE, 'stroke-width': 0.8 }, g);
    }
    [[2, 2, 1], [2, 6, 2], [3, 3, 1], [3, 4, 2], [4, 2, 2], [4, 5, 1], [5, 3, 1], [5, 6, 2], [6, 4, 1], [6, 6, 2], [1, 4, 2], [7, 2, 1]]
      .forEach(([r, c, col]) => L.stone(g, s / 2 + c * s, s / 2 + r * s, s * 0.44, col));
  };
  const picBandit = (g) => {
    L.el('rect', { x: 0, y: 0, width: PIC, height: PIC, rx: 6, fill: '#f6f6f8', stroke: L.RULE }, g);
    [38, 94].forEach((x) => {
      L.el('rect', { x: x - 22, y: 46, width: 44, height: 70, rx: 5, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g);
      L.el('rect', { x: x - 13, y: 60, width: 26, height: 18, rx: 3, fill: '#eceef2', stroke: L.RULE }, g);
      L.el('line', { x1: x + 14, y1: 50, x2: x + 14, y2: 18, stroke: L.INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      L.el('circle', { cx: x + 14, cy: 14, r: 7, fill: L.RED }, g);
      L.el('rect', { x: x - 6, y: 94, width: 12, height: 6, rx: 2, fill: L.GRAY }, g);
    });
  };
  const picClose = (g) => {
    const D = window.SWAY_DATA;
    L.board(g, { N: D ? D.N : 5, size: PIC, x: 0, y: 0, board: D ? D.board : null });
    L.die(g, PIC - 22, PIC - 22, 16, 20, { fill: L.BLUE, stroke: '#2f4a7a', ink: '#fff' });
  };
  const PICS = [picGo, picBandit, picClose];

  const init = (svg) => {
    const mode = svg.dataset.mode || 'open';
    const root = L.el('g', {}, svg);
    const cols = COL_X.map((x, i) => {
      const g = L.el('g', {}, root);
      PICS[i](L.el('g', {}, g));
      L.text(g, NAMES[i], PIC / 2, PIC + 24, { size: 15, weight: 700 });
      return { g, x };
    });
    const place = (c, scale, dx, dy) => {
      c.g.setAttribute('transform', `translate(${c.x - PIC / 2 * scale + (dx || 0)},${PIC_Y + (dy || 0)}) scale(${scale})`);
    };

    if (mode === 'go' || mode === 'bandit') {
      const which = mode === 'go' ? 0 : 1;
      const setState = (t) => {
        const u = L.win(t, 0.3, 0.9, L.backOut);
        cols.forEach((c, i) => {
          const isIt = i === which;
          const k = isIt ? L.lerp(1, 1.7, u) : L.lerp(1, 0.8, u);
          const dx = isIt ? L.lerp(0, 390 - c.x, u) : L.lerp(0, (i < which ? -70 : 70), u);
          place(c, k, dx, isIt ? L.lerp(0, 20, u) : 50);
          c.g.setAttribute('opacity', isIt ? 1 : L.lerp(1, 0.25, u));
        });
      };
      L.timeline(svg, { T: 1.6, setState });
      return;
    }

    // scoreboard rows (slide 38 only): a question label at the left, one slot per contender
    const board = L.el('g', {}, root);
    QS.forEach((q, j) => {
      const y = ROW0 + j * RH;
      L.text(board, `Q${j + 1}`, 40, y, { anchor: 'start', size: 12, fill: L.DIM, mono: true });
      L.text(board, q, 68, y, { anchor: 'start', size: 13, fill: L.DIM });
      L.el('line', { x1: 40, y1: y + RH / 2, x2: 720, y2: y + RH / 2, stroke: L.FAINT }, board);
    });
    const slots = [];
    COL_X.forEach((x) => QS.forEach((q, j) => {
      slots.push(L.el('circle', { cx: x, cy: ROW0 + j * RH, r: 9, fill: 'none', stroke: L.RULE, 'stroke-width': 1.5, 'stroke-dasharray': '3 3', opacity: 0.6 }, board));
    }));

    if (mode === 'open') {
      // slide 3: just the three, large, centred; no scoreboard
      board.setAttribute('display', 'none');
      const setState = (t) => {
        cols.forEach((c, i) => {
          const u = L.win(t, 0.2 + i * 0.25, 0.7, L.backOut);
          place(c, 1.45, (i - 1) * 40, L.lerp(-PIC - 120, 22, u));
          c.g.setAttribute('opacity', t > 0.2 + i * 0.25 ? 1 : 0);
        });
      };
      L.timeline(svg, { T: 1.6, setState });
      return;
    }

    // matrix: the same board, filled in one row per press
    cols.forEach((c) => place(c, 1, 0, 0));
    const CELLS = [
      ['no', '—', '—'],
      ['yes', 'close only', 'no'],
      ['yes', 'by design', 'built, costly']
    ];
    const COLOR = { no: L.RED, yes: L.GREEN, '—': L.GRAY };
    QS.forEach((q, j) => {
      const g = L.el('g', { class: 'step' }, root);
      const y = ROW0 + j * RH;
      COL_X.forEach((x, i) => {
        const s = CELLS[i][j];
        const key = s.split(',')[0].split(' ')[0];
        L.el('rect', { x: x - 78, y: y - 13, width: 156, height: 26, rx: 13, fill: L.BG }, g);
        L.text(g, s, x, y, { size: s.length > 12 ? 11.5 : 15, weight: s.length > 12 ? 500 : 700, fill: COLOR[key] || L.INK });
      });
    });
    const box = L.el('g', { class: 'step' }, root);
    L.el('rect', { x: COL_X[2] - 90, y: PIC_Y - 10, width: 180, height: ROW0 + 3 * RH - PIC_Y - 14, rx: 12, fill: 'none', stroke: L.GREEN, 'stroke-width': 3 }, box);
    L.el('rect', { x: COL_X[2] - 52, y: ROW0 + 3 * RH - 26, width: 104, height: 24, rx: 12, fill: L.GREEN }, box);
    L.text(box, 'build next', COL_X[2], ROW0 + 3 * RH - 14, { size: 13, weight: 700, fill: '#fff' });
  };

  document.querySelectorAll('svg.contenders-fig').forEach(init);
})();
