// A small SIR illustration. This is separate from the paper's validation data.
// S -> I depends on infected neighbors; I -> R is absorbing. Vaccination is S -> R.
// Both candidate arms reuse the same random tape per future for a fair illustration.
(function () {
  const svg = document.getElementById('l2-intervention-fig');
  if (!svg) return;
  const L = window.L2, N = 4, H = 6, nb = L.sway.neighbors(N);
  const colors = [L.GRAY, L.RED, L.GREEN], labels = ['susceptible', 'infected', 'recovered / vaccinated'];
  const initial = Array(16).fill(0); initial[1] = 1; initial[9] = 1;
  const candidates = [5, 10];
  let run = 1, step = 0, futures;
  function simulate(first, seed) {
    const rnd = L.prng(seed), frames = [];
    let board = initial.slice(); board[first] = 2; frames.push(board.slice());
    for (let h = 0; h < H; h++) {
      const rankDraw = rnd();
      if (h > 0) {
        const eligible = board.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
        if (eligible.length) board[eligible[Math.floor(rankDraw * eligible.length)]] = 2;
      }
      const next = board.slice();
      for (let i = 0; i < board.length; i++) {
        const infection = rnd(), recovery = rnd();
        if (board[i] === 0) {
          const infected = nb[i].filter(j => board[j] === 1).length;
          if (infection < 1 - Math.pow(0.75, infected)) next[i] = 1;
        } else if (board[i] === 1 && recovery < 0.2) next[i] = 2;
      }
      board = next; frames.push(board.slice());
    }
    return frames;
  }
  function paint() {
    svg.textContent = '';
    const g = L.el('g', {}, svg);
    candidates.forEach((candidate, k) => {
      const x = 65 + k * 375, board = futures[k][step];
      L.text(g, `Vaccinate ${k ? 'B' : 'A'} first`, x + 105, 20, { size: 19, weight: 700, fill: L.BLUE });
      for (let i = 0; i < 16; i++) {
        const px = x + (i % N) * 62, py = 62 + Math.floor(i / N) * 54;
        nb[i].filter(j => j > i).forEach(j => L.el('line', { x1: px, y1: py, x2: x + j % N * 62, y2: 62 + Math.floor(j / N) * 54, stroke: L.FAINT, 'stroke-width': 2 }, g));
      }
      board.forEach((v, i) => {
        const px = x + i % N * 62, py = 62 + Math.floor(i / N) * 54;
        L.el('circle', { cx: px, cy: py, r: 17, fill: colors[v], stroke: '#fff', 'stroke-width': 2 }, g);
        L.text(g, ['S', 'I', 'R'][v], px, py, { size: 13, fill: '#fff', weight: 700 });
        if (i === candidate) {
          L.el('circle', { cx: px, cy: py, r: 22, fill: 'none', stroke: L.BLUE, 'stroke-width': 2 }, g);
          L.text(g, k ? 'B' : 'A', px + 31, py, { size: 14, weight: 700, fill: L.BLUE });
        }
      });
      const count = board.filter(v => v === 1).length;
      L.text(g, `${count} infected` + (step === H ? ` → outcome ${count <= 2 ? 1 : 0}` : ''), x + 105, 260, { size: 18, weight: 600 });
    });
    [70, 265, 440].forEach((x, i) => {
      L.el('circle', { cx: x, cy: 309, r: 6, fill: colors[i] }, g);
      L.text(g, labels[i], x + 14, 309, { size: 13, anchor: 'start', fill: L.DIM });
    });
    document.getElementById('l2-epi-status').textContent = `Future ${run} · step ${step} of ${H}`;
    document.getElementById('l2-epi-step').disabled = step === H;
  }
  function reset() { step = 0; futures = candidates.map(c => simulate(c, 20260907 + run)); paint(); }
  document.getElementById('l2-epi-step').addEventListener('click', () => { step = Math.min(H, step + 1); paint(); });
  document.getElementById('l2-epi-reset').addEventListener('click', () => { run++; reset(); });
  // Space activates a focused demo button instead of advancing the deck.
  // Deferred fragment scripts register before the deck's DOMContentLoaded handler.
  window.addEventListener('keydown', event => {
    if (event.key !== ' ' || !event.target.matches?.('#l2-epi-step, #l2-epi-reset')) return;
    event.preventDefault(); event.stopImmediatePropagation(); event.target.click();
  }, true);
  reset();
})();
