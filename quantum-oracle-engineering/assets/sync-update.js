// sync-update.js -- slide 28: everyone decides from the old board.
//
// Left: the synchronous event.  The pre-event board is ghosted, every stone
// rolls against that ghost, and the selected flips apply together.  Right,
// in red: the sequential mistake, where a stone flipped early changes its
// neighbour's count before the neighbour rolls.  Same dice, different
// result; Lesson 4 returns to the red frame as the self-flip trap.
(function () {
  const svg = document.getElementById('sync-update-fig');
  if (!svg) return;
  const L = window.L2;
  const N = 4, nb = L.sway.neighbors(N);
  const root = L.el('g', {}, svg);
  const start = Uint8Array.from([1, 1, 0, 2, 0, 1, 2, 2, 1, 0, 2, 0, 0, 1, 0, 2]);
  // dice chosen so the sequential order changes at least one decision
  const dice = Uint8Array.from([5, 2, 0, 3, 0, 1, 2, 7, 1, 0, 3, 0, 0, 2, 0, 9]);
  const sync = L.sway.event(start, nb, dice);
  const seq = Uint8Array.from(start);
  const seqSteps = [];
  for (let i = 0; i < N * N; i++) {
    if (!seq[i]) continue;
    const k = L.sway.friendly(seq, nb, i);              // reads the ALREADY-updated board
    if (dice[i] < 4 - k) { seq[i] = seq[i] === 1 ? 2 : 1; }
    seqSteps.push(Uint8Array.from(seq));
  }
  const occupied = [];
  for (let i = 0; i < N * N; i++) if (start[i]) occupied.push(i);

  const left = L.board(root, { N, size: 200, x: 60, y: 50, board: start });
  const ghost = L.board(root, { N, size: 200, x: 60, y: 50, board: start, ghost: true });
  ghost.g.setAttribute('opacity', 0);
  L.text(root, 'synchronous', 160, 276, { size: 14, fill: L.GREEN, weight: 700 });
  const right = L.board(root, { N, size: 200, x: 480, y: 50, board: start });
  const redFrame = L.el('rect', { x: 472, y: 42, width: 216, height: 216, rx: 10, fill: 'none', stroke: L.RED, 'stroke-width': 3, opacity: 0 }, root);
  L.text(root, 'sequential', 580, 276, { size: 14, fill: L.RED, weight: 700 });
  const diffs = [];
  for (let i = 0; i < N * N; i++) if (sync[i] !== seq[i]) diffs.push(i);
  const diffMarks = diffs.map((i) => L.el('circle', { cx: 480 + right.cx(i), cy: 50 + right.cy(i), r: right.r + 5, fill: 'none', stroke: L.RED, 'stroke-width': 2.5, 'stroke-dasharray': '4 3', opacity: 0 }, root));
  const arrow = L.text(root, 'same dice', 380, 150, { size: 13, fill: L.DIM });

  const setState = (t) => {
    // left: ghost appears, dice roll (0.4..1.6), flips apply together at 1.8
    ghost.g.setAttribute('opacity', t > 0.4 && t < 1.9 ? 0.55 : 0);
    left.g.setAttribute('opacity', t > 0.4 && t < 1.9 ? 0.35 : 1);
    const leftDone = t > 1.9;
    left.redraw(leftDone ? sync : start);
    if (!leftDone && t > 0.4) {
      // show which stones are marked to flip, as they roll one after another
      occupied.forEach((i, k) => {
        if (t > 0.5 + k * 0.14) {
          const flips = dice[i] < 4 - L.sway.friendly(start, nb, i);
          L.el('circle', { cx: left.cx(i), cy: left.cy(i), r: left.r + 4, fill: 'none', stroke: flips ? L.ORANGE : L.GREEN, 'stroke-width': 2 }, left.stones);
        }
      });
    }
    // right: sequential, one stone at a time from 2.4
    const stepIdx = Math.min(seqSteps.length, Math.max(0, Math.floor((t - 2.4) / 0.2)));
    right.redraw(stepIdx === 0 ? start : seqSteps[stepIdx - 1]);
    if (stepIdx > 0 && stepIdx <= occupied.length) {
      const i = occupied[stepIdx - 1];
      L.el('circle', { cx: right.cx(i), cy: right.cy(i), r: right.r + 4, fill: 'none', stroke: L.RED, 'stroke-width': 2 }, right.stones);
    }
    redFrame.setAttribute('opacity', L.win(t, 2.4, 0.3));
    const showDiff = t > 2.4 + occupied.length * 0.2 + 0.3;
    diffMarks.forEach((m) => m.setAttribute('opacity', showDiff ? 1 : 0));
  };
  L.timeline(svg, { T: 2.4 + occupied.length * 0.2 + 1.6, setState });
})();
