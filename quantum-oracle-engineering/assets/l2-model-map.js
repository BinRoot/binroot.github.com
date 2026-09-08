// The same three positions recur in the introduction and the transfer.
// Miniatures show one valid action and one illustrative random event;
// the stopping rule remains H steps, not one event.
(function () {
  if (window.__l2ModelMap) return;
  window.__l2ModelMap = true;
  const L = window.L2;
  function miniature(parent, model, stage, x, y) {
    const g = L.el('g', { transform: `translate(${x},${y})` }, parent);
    const initial = model === 'sway' ? [1, 2, 0, 1, 0, 2, 0, 0, 0] : [0, 1, 0, 0, 0, 0, 0, 0, 2];
    const chosen = initial.slice(); chosen[4] = model === 'sway' ? 1 : 2;
    let after;
    if (model === 'sway') {
      const dice = Array(9).fill(19); dice[4] = 0;
      after = Array.from(L.sway.event(chosen, L.sway.neighbors(3), dice));
    } else { after = chosen.slice(); after[0] = 1; after[1] = 2; }
    const state = stage === 0 ? chosen : after;
    if (stage === 2) {
      // A terminal test has a visible output, rather than a third copy of
      // the transition diagram. These are illustrative final-state counts.
      if (model === 'sway') {
        const count = L.sway.count(state);
        [count.b, count.w].forEach((n, row) => {
          for (let i = 0; i < n; i++) L.stone(g, 12 + i * 28, 16 + row * 29, 10, row + 1);
          L.text(g, String(n), 112, 16 + row * 29, { size: 18, weight: 600 });
        });
        L.el('rect', { x: 7, y: 68, width: 100, height: 36, rx: 18, fill: '#e7e5df' }, g);
        L.text(g, 'payoff 0', 57, 87, { size: 21, weight: 600 });
      } else {
        L.el('circle', { cx: 4, cy: 23, r: 10, fill: L.RED }, g);
        L.text(g, '1 infected', 20, 23, { anchor: 'start', size: 18 });
        L.text(g, 'threshold = 2', 55, 51, { size: 16 });
        L.el('rect', { x: 7, y: 68, width: 100, height: 36, rx: 18, fill: L.BLUE }, g);
        L.text(g, 'payoff 1', 57, 87, { size: 21, weight: 600, fill: '#fff' });
      }
      return g;
    }
    if (model === 'sway') {
      const b = L.board(g, { N: 3, size: 104, board: state });
      L.el('circle', { cx: b.cx(4), cy: b.cy(4), r: b.r + 4, fill: 'none', stroke: stage === 0 ? L.BLUE : L.ORANGE, 'stroke-width': 2.5 }, g);
    } else {
      for (let i = 0; i < 9; i++) {
        const cx = 16 + i % 3 * 36, cy = 16 + Math.floor(i / 3) * 36;
        [i % 3 < 2 ? i + 1 : -1, i < 6 ? i + 3 : -1].filter(j => j >= 0).forEach(j => {
          L.el('line', { x1: cx, y1: cy, x2: 16 + j % 3 * 36, y2: 16 + Math.floor(j / 3) * 36, stroke: L.FAINT, 'stroke-width': 2 }, g);
        });
      }
      state.forEach((v, i) => {
        const cx = 16 + i % 3 * 36, cy = 16 + Math.floor(i / 3) * 36;
        L.el('circle', { cx, cy, r: 14, fill: [L.GRAY, L.RED, L.GREEN][v] }, g);
        L.text(g, ['S', 'I', 'R'][v], cx, cy, { size: 14, fill: '#fff', weight: 700 });
      });
      L.el('circle', { cx: 52, cy: 52, r: 18, fill: 'none', stroke: L.BLUE, 'stroke-width': 2 }, g);
    }
    return g;
  }
  const labels = {
    sway: ['Place on an empty cell', 'Roll → change color', 'Black > White → 1'],
    epidemic: ['Vaccinate an S site', 'Infect / recover', 'Infected ≤ threshold → 1']
  };
  const operations = {
    sway: ['empty-cell mask', 'color-flip rule + d20', 'compare stone counts'],
    epidemic: ['susceptible-site mask', 'infection + recovery rules', 'compare count to threshold']
  };
  document.querySelectorAll('svg.l2-model-fig').forEach(svg => {
    const mode = svg.dataset.mode, root = L.el('g', {}, svg);
    const X = [205, 470, 735], titles = ['Choose', 'Update', 'Score'];
    titles.forEach((s, i) => L.text(root, s, X[i], 25, { size: 24, weight: 600, fill: [L.BLUE, L.ORANGE, L.GREEN][i] }));
    [337, 602].forEach(x => L.text(root, '→', x, mode === 'compare' ? 195 : 140, { size: 30, fill: L.WIRE }));
    if (mode === 'transfer') {
      L.el('rect', { x: 58, y: 51, width: 810, height: 219, rx: 18, fill: 'none', stroke: L.WIRE, 'stroke-width': 2 }, root);
      L.text(root, 'Shared reversible circuit', 455, 301, { size: 22, weight: 600 });
      L.text(root, 'randomness registers  ·  reversible updates  ·  cleared scratch', 455, 337, { size: 18, fill: L.INK });
      const slots = X.map((x, i) => ['sway', 'epidemic'].map(model => {
        const g = L.el('g', {}, root);
        miniature(g, model, i, x - 52, 76);
        L.text(g, model === 'sway' ? 'Sway' : 'Epidemic', x, 202, { size: 18, weight: 600, fill: model === 'sway' ? L.INK : L.BLUE });
        L.text(g, operations[model][i], x, 238, { size: 16, fill: L.INK });
        return g;
      }));
      L.beats(svg, { stops: [0, 1, 2, 3], labels: ['Start with Sway', 'Swap action selection', 'Swap transition rules', 'Swap the score'],
        draw: t => slots.forEach((pair, i) => {
          const u = L.clamp01(t - i);
          pair[0].setAttribute('opacity', 1 - u); pair[1].setAttribute('opacity', u);
        }) });
    } else if (mode === 'compare') {
      const columns = X.map((x, i) => {
        const g = L.el('g', {}, root);
        ['sway', 'epidemic'].forEach((model, r) => {
          miniature(g, model, i, x - 52, 61 + r * 160);
          L.text(g, labels[model][i], x, 187 + r * 160, { size: 17, fill: L.INK });
        });
        return g;
      });
      L.text(root, 'Sway', 16, 107, { anchor: 'start', size: 18, weight: 600 });
      L.text(root, 'Epidemic', 16, 269, { anchor: 'start', size: 18, weight: 600 });
      L.beats(svg, { stops: [0, 1, 2], labels: ['Choose a valid action', 'Apply random updates', 'Evaluate the final state'],
        draw: t => columns.forEach((g, i) => g.setAttribute('opacity', i === 0 ? 1 : 0.12 + 0.88 * L.clamp01(t - i + 1))) });
    } else {
      const columns = X.map((x, i) => {
        const g = L.el('g', {}, root);
        miniature(g, 'epidemic', i, x - 52, 68);
        L.text(g, ['One candidate action', 'Random events, H steps', 'Objective met? 1 or 0'][i], x, 207, { size: 18 });
        return g;
      });
      const tally = L.el('g', {}, root);
      [1, 0, 1, 1, 0].forEach((bit, i) => {
        L.el('circle', { cx: 250 + i * 48, cy: 283, r: 18, fill: bit ? L.BLUE : '#e7e5df' }, tally);
        L.text(tally, String(bit), 250 + i * 48, 283, { size: 22, fill: bit ? '#fff' : L.INK, weight: 700 });
      });
      L.text(tally, '→  average = 3/5', 612, 283, { size: 23, mono: true });
      L.text(tally, 'Same starting state + action. A fresh future each time.', 450, 334, { size: 19 });
      L.beats(svg, { stops: [0, 1, 2, 3], labels: ['Choose', 'Simulate', 'Score', 'Repeat and average'],
        draw: t => {
          columns.forEach((g, i) => g.setAttribute('opacity', i === 0 ? 1 : 0.12 + 0.88 * L.clamp01(t - i + 1)));
          tally.setAttribute('opacity', L.clamp01(t - 2));
        } });
    }
  });
})();
