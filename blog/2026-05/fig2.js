(() => {
  const host = document.querySelector('.fig2');
  if (!host) return;

  // Side-by-side display: hex diagram on the left, validity-bit row on the right.
  // The wrapper carries data-no-type so dialog.js's typing animator skips it
  // and only animates the prose paragraphs inside .fig2.
  const wrap = document.createElement('div');
  wrap.dataset.noType = 'true';
  wrap.style.cssText = 'display: flex; gap: 28px; justify-content: center; align-items: center; flex-wrap: wrap; margin: 0.6em 0 1em;';

  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 160;
  canvas.style.background = 'transparent';
  canvas.style.flexShrink = '0';
  wrap.appendChild(canvas);

  // Binary-mask bit row, styled to match the debugger views in select-visuals.js.
  const bitRow = document.createElement('div');
  bitRow.style.cssText = 'display: flex; gap: 4px;';
  const validity = [true, false, false, true, true, false, true];
  validity.forEach((v) => {
    const cell = document.createElement('div');
    cell.style.cssText = `width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid #bdc1c8; font-family: ui-monospace, monospace; font-size: 13px; border-radius: 3px; background: ${v ? '#dff0e2' : '#f6f7fa'}; color: ${v ? '#1d6a36' : '#888'}; font-weight: 600;`;
    cell.textContent = v ? '1' : '0';
    bitRow.appendChild(cell);
  });
  wrap.appendChild(bitRow);

  host.prepend(wrap);

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const s = 22;
  const HW = Math.sqrt(3) * s;
  const ROW_STEP = 1.5 * s;
  const cx = W / 2;
  const cy1 = H / 2;
  const cy0 = cy1 - ROW_STEP;
  const cy2 = cy1 + ROW_STEP;

  const hexes = [
    { n: 0, x: cx - HW / 2, y: cy0, valid: true  },
    { n: 1, x: cx + HW / 2, y: cy0, valid: false },
    { n: 2, x: cx - HW,     y: cy1, valid: false },
    { n: 3, x: cx,          y: cy1, valid: true  },
    { n: 4, x: cx + HW,     y: cy1, valid: true  },
    { n: 5, x: cx - HW / 2, y: cy2, valid: false },
    { n: 6, x: cx + HW / 2, y: cy2, valid: true  },
  ];

  function hexPath(cx_, cy_) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const px = cx_ + s * Math.cos(a);
      const py = cy_ + s * Math.sin(a);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  // Draw invalid hexes first so valid (green) strokes win at shared edges.
  const ordered = [...hexes].sort((a, b) => (a.valid ? 1 : 0) - (b.valid ? 1 : 0));
  for (const h of ordered) {
    hexPath(h.x, h.y);
    if (h.valid) {
      ctx.fillStyle = 'rgba(58, 166, 85, 0.14)';
      ctx.fill();
      ctx.strokeStyle = '#3aa655';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#f5f6f8';
      ctx.fill();
      ctx.strokeStyle = '#d8dce2';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = h.valid ? '#1d6a36' : '#9aa0aa';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(h.n), h.x, h.y);
  }
})();
