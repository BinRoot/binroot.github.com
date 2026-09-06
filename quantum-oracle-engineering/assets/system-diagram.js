(function () {
  const W = 600;
  const H = 320;
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

  function buildDiagram(svg) {
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    el(svg, "rect", { x: 0, y: 0, width: W, height: H, fill: "white" });

    const defs = el(svg, "defs");
    const mkr = el(defs, "marker", {
      id: "a", markerWidth: 8, markerHeight: 6, refX: 7, refY: 3, orient: "auto",
    });
    el(mkr, "path", { d: "M0 0 L8 3 L0 6z", fill: "#1e293b" });

    // ── Input: grid with k candidate first moves ──
    const gridSize = 4;
    const cellSize = 10;
    const cellGap = 2;
    const gridW = gridSize * (cellSize + cellGap) - cellGap;
    const gridX = 18;
    const gridMidY = 130;
    const gridY = gridMidY - gridW / 2;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        el(svg, "rect", {
          x: gridX + c * (cellSize + cellGap),
          y: gridY + r * (cellSize + cellGap),
          width: cellSize, height: cellSize,
          fill: "#f1f5f9", stroke: "#cbd5e1", "stroke-width": 0.8, rx: 1,
        });
      }
    }
    const candidates = [[0, 2], [1, 0], [1, 3], [2, 1], [3, 3]];
    candidates.forEach(([r, c]) => {
      el(svg, "rect", {
        x: gridX + c * (cellSize + cellGap),
        y: gridY + r * (cellSize + cellGap),
        width: cellSize, height: cellSize,
        fill: "#1e293b", rx: 1,
      });
    });
    el(svg, "text", {
      x: gridX + gridW / 2, y: gridY - 10,
      fill: "#1e293b", "font-size": 11, "font-weight": 700,
      "text-anchor": "middle", "font-family": font,
    }, "k first moves");

    // arrow from grid
    const gridRight = gridX + gridW;
    el(svg, "line", {
      x1: gridRight + 6, y1: gridMidY, x2: gridRight + 22, y2: gridMidY,
      stroke: "#1e293b", "stroke-width": 1.8, "marker-end": "url(#a)",
    });

    // ── Level 1 (outer): Max-Finding ──
    const L1x = gridRight + 28;
    const L1y = 16;
    const L1w = 400;
    const L1h = 240;

    el(svg, "rect", {
      x: L1x, y: L1y, width: L1w, height: L1h,
      fill: "white", stroke: "#1e293b", "stroke-width": 1.2, rx: 8,
    });
    el(svg, "text", {
      x: L1x + 14, y: L1y + 18,
      fill: "#1e293b", "font-size": 13, "font-weight": 700, "font-family": font,
    }, "Max-Finding (D\u00fcrr\u2013H\u00f8yer)");
    el(svg, "text", {
      x: L1x + L1w - 14, y: L1y + 18,
      fill: "#475569", "font-size": 11, "font-weight": 600,
      "text-anchor": "end", "font-family": font,
    }, "\u221ak comparisons");

    // ── Level 2 (middle): IQAE ──
    const L2x = L1x + 16;
    const L2y = L1y + 34;
    const L2w = L1w - 32;
    const L2h = 170;

    el(svg, "rect", {
      x: L2x, y: L2y, width: L2w, height: L2h,
      fill: "#fafafa", stroke: "#475569", "stroke-width": 1.4, rx: 6,
    });
    el(svg, "text", {
      x: L2x + 14, y: L2y + 18,
      fill: "#1e293b", "font-size": 12, "font-weight": 700, "font-family": font,
    }, "IQAE (amplitude estimation)");
    el(svg, "text", {
      x: L2x + L2w - 14, y: L2y + 18,
      fill: "#475569", "font-size": 11, "font-weight": 600,
      "text-anchor": "end", "font-family": font,
    }, "1/\u03b5 calls per arm");

    // ── Level 3 (inner): Rollout Oracle ──
    const L3x = L2x + 16;
    const L3y = L2y + 34;
    const L3w = L2w - 32;
    const L3h = 100;
    const L3midY = L3y + L3h / 2;

    el(svg, "rect", {
      x: L3x, y: L3y, width: L3w, height: L3h,
      fill: "white", stroke: "#1e293b", "stroke-width": 2, rx: 4,
    });
    el(svg, "text", {
      x: L3x + L3w / 2, y: L3y + 18,
      fill: "#1e293b", "font-size": 14, "font-weight": 700,
      "text-anchor": "middle", "font-family": font,
    }, "Rollout Oracle");
    el(svg, "text", {
      x: L3x + L3w / 2, y: L3y + 34,
      fill: "#475569", "font-size": 10,
      "text-anchor": "middle", "font-family": font,
    }, "coherent H-round simulation");

    // inside L3: |0⟩ → U → payoff wire
    const wireY = L3y + 62;
    const uW = 40;
    const uH = 26;
    const uX = L3x + L3w / 2 - uW / 2;
    const wireLeft = uX - 30;
    const wireRight = uX + uW + 30;

    el(svg, "line", {
      x1: wireLeft, y1: wireY, x2: wireRight, y2: wireY,
      stroke: "#94a3b8", "stroke-width": 1.3,
    });
    el(svg, "rect", {
      x: uX, y: wireY - uH / 2, width: uW, height: uH,
      fill: "#f1f5f9", stroke: "#1e293b", "stroke-width": 1.5, rx: 3,
    });
    el(svg, "text", {
      x: uX + uW / 2, y: wireY + 1,
      fill: "#1e293b", "font-size": 13, "font-weight": 700,
      "text-anchor": "middle", "dominant-baseline": "middle", "font-family": font,
    }, "U");

    // |0⟩
    el(svg, "text", {
      x: wireLeft - 4, y: wireY,
      fill: "#1e293b", "font-size": 12, "font-weight": 600,
      "text-anchor": "end", "dominant-baseline": "middle", "font-family": font,
    }, "|0\u27E9");

    // payoff
    el(svg, "text", {
      x: wireRight + 4, y: wireY,
      fill: "#1e293b", "font-size": 11, "font-weight": 600,
      "text-anchor": "start", "dominant-baseline": "middle", "font-family": font,
    }, "payoff");

    // L3 cost
    el(svg, "text", {
      x: L3x + L3w / 2, y: L3y + L3h - 8,
      fill: "#475569", "font-size": 10,
      "text-anchor": "middle", "font-family": font,
    }, "O(HNw + N\u00b2w) gates");

    // ── Output: grid with single best move ──
    const outGridX = L1x + L1w + 28;
    const outGridY = gridMidY - gridW / 2;

    // arrow from L1 to output
    el(svg, "line", {
      x1: L1x + L1w + 4, y1: gridMidY, x2: outGridX - 6, y2: gridMidY,
      stroke: "#1e293b", "stroke-width": 1.8, "marker-end": "url(#a)",
    });

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        el(svg, "rect", {
          x: outGridX + c * (cellSize + cellGap),
          y: outGridY + r * (cellSize + cellGap),
          width: cellSize, height: cellSize,
          fill: "#f1f5f9", stroke: "#cbd5e1", "stroke-width": 0.8, rx: 1,
        });
      }
    }
    el(svg, "rect", {
      x: outGridX + 1 * (cellSize + cellGap),
      y: outGridY + 2 * (cellSize + cellGap),
      width: cellSize, height: cellSize,
      fill: "#1e293b", rx: 1,
    });
    el(svg, "text", {
      x: outGridX + gridW / 2, y: outGridY - 10,
      fill: "#1e293b", "font-size": 11, "font-weight": 700,
      "text-anchor": "middle", "font-family": font,
    }, "\u03b5-optimal move");

    // ── Bottom: total cost ──
    el(svg, "text", {
      x: W / 2, y: H - 30,
      fill: "#1e293b", "font-size": 13, "font-weight": 700,
      "text-anchor": "middle", "font-family": font,
    }, "Total: O(\u221ak / \u03b5) oracle calls");
    el(svg, "text", {
      x: W / 2, y: H - 12,
      fill: "#475569", "font-size": 11,
      "text-anchor": "middle", "font-family": font,
    }, "each call: O(HNw + N\u00b2w) gates");
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
    a.download = "system_diagram.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById("system-diagram");
    if (!svg) return;
    buildDiagram(svg);
    const btn = document.getElementById("download-svg");
    if (btn) btn.addEventListener("click", () => downloadSVG(svg));
  });
})();
