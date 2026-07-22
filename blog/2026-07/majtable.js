// Back the "all 8 cases" claim with the maj truth table. The a^b and a^c
// columns are the same intermediate values that b and c are left holding,
// so the table also previews the debt that uma repays. Cells are drawn in
// the crossword lattice style: ink lines, white cells, peach for the star.
(() => {
  const mount = document.querySelector('div.maj');
  if (!mount) return;

  const style = document.createElement('style');
  style.textContent = `
    .maj { margin: 1.8em 0; overflow-x: auto; }
    .maj table {
      border-collapse: collapse;
      margin: 0 auto;
      font: 600 0.9em/1 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
      color: #1a1a1a;
    }
    .maj th, .maj td {
      border: 2px solid #1a1a1a;
      min-width: 2.8em;
      padding: 0.55em 0.4em;
      text-align: center;
      background: #fff;
    }
    .maj th { background: #f0f1f5; }
    .maj .mj-hi { background: #fae5d3; }
    .maj th.mj-hi { color: #9a5b2d; }
  `;
  document.head.appendChild(style);

  const table = document.createElement('table');
  table.setAttribute('aria-label', 'Truth table for the maj operator over all eight input cases');

  const header = document.createElement('tr');
  ['a', 'b', 'c', 'a^b', 'a^c', 'maj'].forEach((h, i) => {
    const th = document.createElement('th');
    th.textContent = h;
    if (i === 5) th.className = 'mj-hi';
    header.appendChild(th);
  });
  table.appendChild(header);

  for (let i = 0; i < 8; i++) {
    const a = (i >> 2) & 1, b = (i >> 1) & 1, c = i & 1;
    const ab = a ^ b, ac = a ^ c;
    const maj = a ^ (ab & ac);
    const tr = document.createElement('tr');
    [a, b, c, ab, ac, maj].forEach((v, j) => {
      const td = document.createElement('td');
      td.textContent = v;
      if (j === 5) td.className = 'mj-hi';
      tr.appendChild(td);
    });
    table.appendChild(tr);
  }
  mount.appendChild(table);
})();
