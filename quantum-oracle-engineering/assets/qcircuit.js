// Render `:::qcircuit` blocks as SVG quantum-circuit diagrams. The div holds
// a code block with a tiny spec — which also doubles as the no-JS fallback:
//
//   wires: x, y, z, t1 = n, t2 = 0    ← one entry per wire, top to bottom
//   outputs: x, y, z, n, x·y·z        ← optional right-edge labels, same order
//   ccx x y t1                        ← one gate per line: controls…, target
//
// Every gate line is drawn the same way: a filled dot on each control wire, an
// ⊕ on the target wire (the last name), and a vertical line tying them together.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const ROW = 44;        // vertical gap between wires
  const COL = 72;        // horizontal gap between gate columns
  const R_CTRL = 4.5;    // control-dot radius
  const R_TARG = 10;     // ⊕ radius
  const INK = '#2d3140'; // gates and labels
  const WIRE = '#8a90a0';

  const el = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  };

  const line = (x1, y1, x2, y2, w) =>
    el('line', { x1, y1, x2, y2, stroke: INK, 'stroke-width': w });

  const label = (x, y, text, anchor) => {
    const t = el('text', {
      x, y,
      'text-anchor': anchor,
      'dominant-baseline': 'central',
      fill: INK,
      'font-family': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      'font-size': 15,
    });
    t.textContent = text;
    return t;
  };

  const parse = (text) => {
    const wires = [];
    const outputs = [];
    const gates = [];
    text.split('\n').forEach((raw) => {
      const s = raw.trim();
      if (!s) return;
      if (s.startsWith('wires:')) {
        s.slice(6).split(',').forEach((w) => wires.push(w.trim()));
      } else if (s.startsWith('outputs:')) {
        s.slice(8).split(',').forEach((o) => outputs.push(o.trim()));
      } else {
        const args = s.split(/\s+/).slice(1); // drop the mnemonic (x/cx/ccx)
        if (args.length) {
          gates.push({ controls: args.slice(0, -1), target: args[args.length - 1] });
        }
      }
    });
    return { wires, outputs, gates };
  };

  const render = ({ wires, outputs, gates }) => {
    const svg = el('svg', { role: 'img' });
    svg.setAttribute(
      'aria-label',
      'Quantum circuit on wires ' + wires.join(', ') + ' with ' + gates.length + ' gates'
    );

    // Wires are named by their first token, so `t1 = n` is addressable as `t1`.
    const rowOf = {};
    wires.forEach((w, i) => { rowOf[w.split(/[=\s]/)[0]] = i; });
    const wireY = (i) => i * ROW;
    const wireEnd = gates.length * COL;

    wires.forEach((w, i) => {
      svg.appendChild(el('line', {
        x1: 0, y1: wireY(i), x2: wireEnd, y2: wireY(i),
        stroke: WIRE, 'stroke-width': 1.5,
      }));
      svg.appendChild(label(-14, wireY(i), w, 'end'));
      if (outputs[i]) svg.appendChild(label(wireEnd + 14, wireY(i), outputs[i], 'start'));
    });

    gates.forEach((g, j) => {
      const gx = (j + 0.5) * COL;
      const ys = g.controls.concat(g.target).map((w) => wireY(rowOf[w]));
      const ty = wireY(rowOf[g.target]);
      // The connector runs to the far edge of the ⊕ when the target sits at
      // either end, forming the vertical stroke of its cross.
      const top = Math.min(...ys) - (ty <= Math.min(...ys) ? R_TARG : 0);
      const bottom = Math.max(...ys) + (ty >= Math.max(...ys) ? R_TARG : 0);
      svg.appendChild(line(gx, top, gx, bottom, 1.8));
      g.controls.forEach((w) => {
        svg.appendChild(el('circle', { cx: gx, cy: wireY(rowOf[w]), r: R_CTRL, fill: INK }));
      });
      svg.appendChild(el('circle', {
        cx: gx, cy: ty, r: R_TARG, fill: 'none', stroke: INK, 'stroke-width': 1.8,
      }));
      svg.appendChild(line(gx - R_TARG, ty, gx + R_TARG, ty, 1.8));
    });

    return svg;
  };

  document.querySelectorAll('div.qcircuit').forEach((box) => {
    const src = box.querySelector('pre') || box;
    const spec = parse(src.textContent);
    if (!spec.wires.length || !spec.gates.length) return;

    const svg = render(spec);
    box.textContent = '';
    box.appendChild(svg);

    // Fit the viewBox around whatever the labels turned out to measure, then
    // let CSS scale it down responsively (but never up past natural size).
    const bb = svg.getBBox();
    const pad = 8;
    svg.setAttribute('viewBox',
      [bb.x - pad, bb.y - pad, bb.width + 2 * pad, bb.height + 2 * pad].join(' '));
    svg.style.cssText =
      'display:block; margin:1.6em auto; width:100%; height:auto;' +
      'max-width:' + Math.ceil(bb.width + 2 * pad) + 'px;';
  });
})();
