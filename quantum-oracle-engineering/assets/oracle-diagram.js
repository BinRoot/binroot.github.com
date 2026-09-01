(function () {
  const W = 1020;
  const H = 560;
  const svgNS = "http://www.w3.org/2000/svg";
  const font = "Helvetica, Arial, sans-serif";

  function el(parent, name, attrs = {}, text) {
    const node = document.createElementNS(svgNS, name);
    for (const [k, v] of Object.entries(attrs))
      if (v != null) node.setAttribute(k, String(v));
    if (text != null) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  const colors = {
    A: { bg: "#dbeafe", border: "#7db8f0", text: "#1e3a5f", boxBg: "#f0f6ff" },
    B: { bg: "#fff0e0", border: "#e8a860", text: "#6b3010", boxBg: "#fff8f0" },
    C: { bg: "#d8f5e0", border: "#6cc88a", text: "#14532d", boxBg: "#f0faf4" },
  };

  function buildDiagram(svg) {
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);

    el(svg, "rect", { x: 0, y: 0, width: W, height: H, fill: "white", rx: 4 });

    // layout
    const labelW = 190;
    const outputW = 80;
    const padT = 18;
    const padB = 56;
    const phaseGap = 6;
    const headerH = 30;
    const bodyTop = padT + headerH + 8;
    const bodyH = H - bodyTop - padB;

    const totalPhaseW = W - labelW - outputW - 2 * phaseGap;
    const pW = { A: totalPhaseW * 0.34, B: totalPhaseW * 0.40, C: totalPhaseW * 0.26 };
    const pX = {
      A: labelW,
      B: labelW + pW.A + phaseGap,
      C: labelW + pW.A + pW.B + 2 * phaseGap,
    };

    // phase bands
    for (const [phase, x] of Object.entries(pX)) {
      el(svg, "rect", {
        x, y: bodyTop, width: pW[phase], height: bodyH,
        fill: colors[phase].bg, stroke: colors[phase].border,
        "stroke-width": 1.2, rx: 6,
      });
    }

    // title
    el(svg, "text", {
      x: labelW + totalPhaseW / 2 + phaseGap, y: padT - 2,
      fill: "#1a1a2e", "font-size": 15, "font-weight": 700,
      "text-anchor": "middle", "dominant-baseline": "middle",
      "font-family": font,
    }, "Rollout Oracle (one call)");

    // phase headers
    const headers = {
      A: "A: Legal-Action Indexing",
      B: "B: Stochastic Transition",
      C: "C: Terminal Evaluation",
    };
    for (const [phase, label] of Object.entries(headers)) {
      el(svg, "text", {
        x: pX[phase] + pW[phase] / 2, y: padT + headerH / 2 + 2,
        fill: colors[phase].text, "font-size": 14, "font-weight": 700,
        "text-anchor": "middle", "dominant-baseline": "middle",
        "font-family": font,
      }, label);
    }

    // register rows
    const rowH = 58;
    const rowGap = 14;
    const rows = [
      { id: "board",    label: "Board state",         sub: "(H+1)\u00b7N + H\u00b7N qubits", phases: "ABC" },
      { id: "selector", label: "Move-rank registers", sub: "2H\u00b7w qubits",               phases: "A" },
      { id: "dice",     label: "Randomness registers", sub: "H\u00b7N\u00b75 qubits",        phases: "B" },
      { id: "ancilla",  label: "Reusable ancillae",   sub: "N + 2w + d + O(1) qubits",       phases: "ABC" },
      { id: "terminal", label: "Evaluation registers", sub: "2w + 1 qubits",                  phases: "C" },
    ];

    const rowStartY = bodyTop + 16;

    rows.forEach((row, i) => {
      const y = rowStartY + i * (rowH + rowGap);
      const yMid = y + rowH / 2;

      el(svg, "text", {
        x: labelW - 16, y: yMid - 8,
        fill: "#1a1a2e", "font-size": 14, "font-weight": 700,
        "text-anchor": "end", "font-family": font,
      }, row.label);
      el(svg, "text", {
        x: labelW - 16, y: yMid + 10,
        fill: "#555570", "font-size": 11,
        "text-anchor": "end", "font-family": font,
      }, row.sub);

      const active = row.phases.split("");
      const xStart = pX[active[0]] + 4;
      const last = active[active.length - 1];
      const xEnd = pX[last] + pW[last] - 4;

      el(svg, "line", {
        x1: xStart, y1: yMid, x2: xEnd, y2: yMid,
        stroke: "#aab0c0", "stroke-width": 1.5,
        "stroke-dasharray": undefined,
      });
    });

    function ym(idx) {
      return rowStartY + idx * (rowH + rowGap) + rowH / 2;
    }

    function op(phase, rowIdx, xFrac, wFrac, lines) {
      const c = colors[phase];
      const bx = pX[phase] + pW[phase] * xFrac;
      const bw = pW[phase] * wFrac;
      const yMid = ym(rowIdx);
      const lineH = 15;
      const boxH = Math.max(34, lines.length * lineH + 12);
      const boxY = yMid - boxH / 2;

      el(svg, "rect", {
        x: bx, y: boxY, width: bw, height: boxH,
        fill: c.boxBg, stroke: c.border, "stroke-width": 1.2, rx: 5,
      });

      const textStartY = boxY + (boxH - lines.length * lineH) / 2 + lineH / 2 + 2;
      lines.forEach((txt, i) => {
        el(svg, "text", {
          x: bx + bw / 2, y: textStartY + i * lineH,
          fill: c.text, "font-size": i === 0 ? 12 : 11,
          "font-weight": i === 0 ? 700 : 400,
          "text-anchor": "middle", "dominant-baseline": "middle",
          "font-family": font,
        }, txt);
      });
    }

    // quantum preparation block — distinct style
    function qop(phase, rowIdx, xFrac, wFrac, lines) {
      const bx = pX[phase] + pW[phase] * xFrac;
      const bw = pW[phase] * wFrac;
      const yMid = ym(rowIdx);
      const lineH = 15;
      const boxH = Math.max(34, lines.length * lineH + 12);
      const boxY = yMid - boxH / 2;

      el(svg, "rect", {
        x: bx, y: boxY, width: bw, height: boxH,
        fill: "#f3e8ff", stroke: "#a855f7", "stroke-width": 2, rx: 5,
        "stroke-dasharray": "6 3",
      });

      const textStartY = boxY + (boxH - lines.length * lineH) / 2 + lineH / 2 + 2;
      lines.forEach((txt, i) => {
        el(svg, "text", {
          x: bx + bw / 2, y: textStartY + i * lineH,
          fill: "#6b21a8", "font-size": i === 0 ? 12 : 11,
          "font-weight": i === 0 ? 700 : 400,
          "text-anchor": "middle", "dominant-baseline": "middle",
          "font-family": font,
        }, txt);
      });
    }

    function dots(phase, rowIdx, leftEnd, rightStart) {
      const c = colors[phase];
      const cx = pX[phase] + pW[phase] * ((leftEnd + rightStart) / 2);
      el(svg, "text", {
        x: cx, y: ym(rowIdx) - 16,
        fill: c.text, "font-size": 14, "font-weight": 400,
        "text-anchor": "middle", "dominant-baseline": "middle",
        "font-family": font, "font-style": "italic",
      }, "\u22ef");
    }

    // ── Phase A ──
    op("A", 0, 0.03, 0.40, ["set occupancy", "(round 1)"]);
    dots("A", 0, 0.43, 0.56);
    op("A", 0, 0.56, 0.40, ["set occupancy", "(round H)"]);

    qop("A", 1, 0.03, 0.40, ["select move", "(round 1)"]);
    dots("A", 1, 0.43, 0.56);
    qop("A", 1, 0.56, 0.40, ["select move", "(round H)"]);

    op("A", 3, 0.06, 0.36, ["prefix count", "\u2192 reset |0\u27E9"]);
    dots("A", 3, 0.42, 0.58);
    op("A", 3, 0.58, 0.36, ["prefix count", "\u2192 reset |0\u27E9"]);

    // ── Phase B ──
    op("B", 0, 0.02, 0.42, ["conditional", "color flip (r=1)"]);
    dots("B", 0, 0.44, 0.54);
    op("B", 0, 0.54, 0.42, ["conditional", "color flip (r=H)"]);

    qop("B", 2, 0.02, 0.42, ["prepare", "Uniform(20)"]);
    dots("B", 2, 0.44, 0.54);
    qop("B", 2, 0.54, 0.42, ["prepare", "Uniform(20)"]);

    op("B", 3, 0.02, 0.42, ["neighbor count", "\u2192 threshold"]);
    dots("B", 3, 0.44, 0.54);
    op("B", 3, 0.54, 0.42, ["neighbor count", "\u2192 threshold"]);

    // ── Phase C ──
    op("C", 0, 0.06, 0.88, ["read final board"]);
    op("C", 3, 0.06, 0.88, ["uncompute counters"]);
    op("C", 4, 0.06, 0.42, ["count black", "count white"]);
    op("C", 4, 0.54, 0.40, ["B > W", "\u2192 payoff bit"]);

    // ── Output arrow + label (in dedicated right margin) ──
    const payoffY = ym(4);
    const defs = el(svg, "defs");
    const marker = el(defs, "marker", {
      id: "arr", markerWidth: 10, markerHeight: 7,
      refX: 9, refY: 3.5, orient: "auto",
    });
    el(marker, "path", { d: "M0 0 L10 3.5 L0 7z", fill: "#1e3a5f" });

    const phaseEnd = pX.C + pW.C;
    const arrStart = phaseEnd + 8;
    const arrEnd = phaseEnd + 26;
    el(svg, "line", {
      x1: arrStart, y1: payoffY, x2: arrEnd, y2: payoffY,
      stroke: "#1e3a5f", "stroke-width": 2.5, "marker-end": "url(#arr)",
    });

    const labelCx = arrEnd + 30;
    el(svg, "text", {
      x: labelCx, y: payoffY - 8,
      fill: "#1e3a5f", "font-size": 12, "font-weight": 700,
      "text-anchor": "middle", "font-family": font,
    }, "to IQAE /");
    el(svg, "text", {
      x: labelCx, y: payoffY + 8,
      fill: "#1e3a5f", "font-size": 12, "font-weight": 700,
      "text-anchor": "middle", "font-family": font,
    }, "Grover");

    // ── Bottom annotations ──
    const footY = H - padB + 20;
    el(svg, "text", {
      x: W / 2, y: footY,
      fill: "#2a2a3e", "font-size": 12, "text-anchor": "middle",
      "font-family": font, "font-weight": 600,
    }, "Qubits: q_shared + H\u00b7q_round          Gates: H\u00b7(4c_sel\u00b7Nw + c_sway\u00b7N) + 2c_count\u00b7Nw + c_cmp\u00b7(N+1)\u00b2\u00b72w");
    el(svg, "text", {
      x: W / 2, y: footY + 18,
      fill: "#555570", "font-size": 11, "text-anchor": "middle",
      "font-family": font,
    }, "Dashed boxes are quantum (superposition preparation).  Solid boxes are classical reversible gates.  Vertically aligned blocks execute together.");
  }

  function downloadSVG(svg) {
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", svgNS);
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rollout_oracle_diagram.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById("oracle-diagram");
    if (!svg) return;
    buildDiagram(svg);
    const btn = document.getElementById("download-svg");
    if (btn) btn.addEventListener("click", () => downloadSVG(svg));
  });
})();
