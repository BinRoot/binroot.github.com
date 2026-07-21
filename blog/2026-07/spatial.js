// Syntax highlighting for ```spatial code blocks — the 2D expression language.
// A 1D highlighter can't see the interesting part, so this one is column-aware:
// each `@@` (or a vertical `^`, `<`, `>`) is paired with the identifier that
// overlaps its columns on an adjacent line — its toggle target. Operators and targets that
// chain through each other vertically form one group, and every group gets its
// own color, so each toggle chain reads as one colored thread through the
// expression. Declarations of a target name (`t1 = 0`) join its group too.
// Hovering any member of a group lights up the whole thread.
(() => {
  const PAIR = [
    { ink: '#c65a11', tint: '#fae5d3' },
    { ink: '#8250df', tint: '#eee5fd' },
    { ink: '#0969da', tint: '#dcecfc' },
    { ink: '#bf3989', tint: '#fbdff0' },
  ];

  const css = [
    '.sp-num { color: #40a070; }',
    '.sp-punct { color: #687078; }',
    '.sp-op { color: #687078; font-weight: 600; }',
    '.sp-tok { border-radius: 4px; transition: background 0.15s ease, box-shadow 0.15s ease; }',
    // `<` and `>` used vertically render rotated a quarter turn, so `a` over
    // `<` over `b` really is `a < b` turned on its side.
    '.sp-rot { display: inline-block; transform: rotate(90deg); }',
  ];
  PAIR.forEach((p, i) => {
    css.push(`.sp-pair-${i} { color: ${p.ink}; font-weight: 600; }`);
    // box-shadow spread paints a halo without any layout shift, so the
    // column alignment the language depends on stays intact.
    css.push(`.sp-pair-${i}.sp-hot { background: ${p.tint}; box-shadow: 0 0 0 3px ${p.tint}; }`);
  });
  const style = document.createElement('style');
  style.textContent = css.join('\n');
  document.head.appendChild(style);

  // Group 1 is the operators (these pair with a vertically aligned target);
  // named operators like maj/uma must come before the identifier group.
  const TOKEN = /(@@|\bmaj\b|\buma\b|[\^<>@])|([A-Za-z_][A-Za-z0-9_]*)|(\d+)|(:=|[=()])/g;
  const overlaps = (a, b) => a.start < b.end && b.start < a.end;

  const tokenize = (text) => {
    const tokens = [];
    text.split('\n').forEach((lineText, line) => {
      for (const m of lineText.matchAll(TOKEN)) {
        tokens.push({
          id: tokens.length,
          line,
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          type: m[1] ? 'op' : m[2] ? 'ident' : m[3] ? 'num' : 'punct',
        });
      }
    });
    return tokens;
  };

  document.querySelectorAll('pre.spatial code, pre.spatial').forEach((code) => {
    if (code.querySelector('code')) return; // handle the inner element only
    const text = code.textContent.replace(/\n$/, '');
    const tokens = tokenize(text);

    // Union column-overlapping (operator, adjacent-line identifier) pairs.
    const parent = tokens.map((t) => t.id);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const union = (a, b) => { parent[find(a)] = find(b); };
    tokens.filter((t) => t.type === 'op').forEach((op) => {
      tokens
        .filter((t) => t.type === 'ident' && Math.abs(t.line - op.line) === 1 && overlaps(t, op))
        .forEach((t) => union(op.id, t.id));
    });

    // A component is a toggle chain when it ties an operator to a target.
    const groupOf = new Map(); // token id -> group index
    const nameGroup = new Map(); // target name -> group index
    tokens.forEach((t) => {
      const members = tokens.filter((o) => find(o.id) === find(t.id));
      if (groupOf.has(t.id) || !members.some((o) => o.type === 'op') ||
          !members.some((o) => o.type === 'ident')) return;
      const g = nameGroup.size ? Math.max(...nameGroup.values()) + 1 : 0;
      members.forEach((o) => {
        groupOf.set(o.id, g);
        if (o.type === 'ident' && !nameGroup.has(o.text)) nameGroup.set(o.text, g);
      });
    });
    // Declarations elsewhere in the block adopt their target's group.
    tokens.forEach((t) => {
      if (t.type === 'ident' && !groupOf.has(t.id) && nameGroup.has(t.text)) {
        groupOf.set(t.id, nameGroup.get(t.text));
      }
    });

    // Rebuild the block, wrapping only the tokens that carry styling.
    code.textContent = '';
    const lines = text.split('\n');
    let cursor = { line: 0, col: 0 };
    const flushTo = (line, col) => {
      let gap = '';
      while (cursor.line < line) {
        gap += lines[cursor.line].slice(cursor.col) + '\n';
        cursor = { line: cursor.line + 1, col: 0 };
      }
      gap += lines[line].slice(cursor.col, col);
      cursor = { line, col };
      if (gap) code.appendChild(document.createTextNode(gap));
    };
    tokens.forEach((t) => {
      flushTo(t.line, t.start);
      const g = groupOf.get(t.id);
      const cls = g !== undefined ? `sp-tok sp-pair-${g % PAIR.length}`
        : t.type === 'num' ? 'sp-num'
        : t.type === 'op' ? 'sp-op'
        : t.type === 'punct' ? 'sp-punct' : '';
      if (!cls) return; // plain identifiers stay bare text
      const span = document.createElement('span');
      // A paired comparator is being used vertically — turn the glyph itself.
      span.className = g !== undefined && (t.text === '<' || t.text === '>')
        ? cls + ' sp-rot' : cls;
      if (g !== undefined) span.dataset.spG = String(g);
      span.textContent = t.text;
      code.appendChild(span);
      cursor.col = t.end;
    });
    flushTo(lines.length - 1, lines[lines.length - 1].length);
    code.appendChild(document.createTextNode('\n'));

    // Hovering one member of a chain lights up the whole chain.
    code.querySelectorAll('[data-sp-g]').forEach((span) => {
      const mates = code.querySelectorAll(`[data-sp-g="${span.dataset.spG}"]`);
      span.addEventListener('mouseenter', () => mates.forEach((m) => m.classList.add('sp-hot')));
      span.addEventListener('mouseleave', () => mates.forEach((m) => m.classList.remove('sp-hot')));
    });
  });
})();
