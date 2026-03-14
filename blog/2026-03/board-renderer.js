import { friendlyNeighbors, d20Threshold } from './engine.js';

// Draw the board (grid lines + stones). skipCells is an optional Set of "r,c" keys to omit.
export function drawBoard(ctx, grid, N, cellPx, padding, skipCells) {
  const w = ctx.canvas.width;
  ctx.clearRect(0, 0, w, w);

  ctx.fillStyle = '#c8a96e';
  ctx.fillRect(0, 0, w, w);

  ctx.strokeStyle = '#8b7040';
  ctx.lineWidth = 1;
  for (let i = 0; i < N; i++) {
    const x = padding + i * cellPx + cellPx / 2;
    ctx.beginPath(); ctx.moveTo(x, padding + cellPx / 2); ctx.lineTo(x, padding + (N - 1) * cellPx + cellPx / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padding + cellPx / 2, x); ctx.lineTo(padding + (N - 1) * cellPx + cellPx / 2, x); ctx.stroke();
  }

  const r = cellPx * 0.38;
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      if (grid[row][col] === 0) continue;
      if (skipCells && skipCells.has(row + ',' + col)) continue;
      drawStone(ctx, grid[row][col], col, row, cellPx, padding);
    }
  }
}

// Draw a single stone at grid position (row, col).
export function drawStone(ctx, color, col, row, cellPx, padding, opts) {
  const cx = padding + col * cellPx + cellPx / 2;
  const cy = padding + row * cellPx + cellPx / 2;
  const r = cellPx * 0.38;
  const { strokeColor, strokeWidth } = opts || {};

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (color === 1) {
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.strokeStyle = strokeColor || '#555';
  } else {
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();
    ctx.strokeStyle = strokeColor || '#bbb';
  }
  ctx.lineWidth = strokeWidth || 1.5;
  ctx.stroke();
}

// Animate sway flips. Rolls dice, runs the flip animation, mutates grid, then resolves.
// Returns a promise that resolves with { flipping } (array of { r, c, flipped: true }).
export function animatedSway(ctx, grid, N, cellPx, padding, drawCallback) {
  return new Promise((resolve) => {
    const cells = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] !== 0) cells.push({ r, c });

    if (cells.length === 0) { resolve({ flipping: [] }); return; }

    const flipping = cells.map(({ r, c }) => {
      const k = friendlyNeighbors(grid, N, r, c);
      const threshold = d20Threshold(k);
      const roll = Math.floor(Math.random() * 20) + 1;
      return { r, c, flipped: roll <= threshold };
    }).filter(d => d.flipped);

    if (flipping.length === 0) { resolve({ flipping: [] }); return; }

    const FLIP_ANIM_MS = 700;
    const origColors = {};
    const flipSet = new Set();
    for (const d of flipping) {
      origColors[d.r + ',' + d.c] = grid[d.r][d.c];
      flipSet.add(d.r + ',' + d.c);
    }

    // Draw base board without flipping stones
    if (drawCallback) drawCallback(flipSet);
    else drawBoard(ctx, grid, N, cellPx, padding, flipSet);

    const staticImage = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const startTime = performance.now();
    const stoneR = cellPx * 0.38;

    function animateFlips(now) {
      const t = Math.min((now - startTime) / FLIP_ANIM_MS, 1);
      const pastHalf = t >= 0.5;
      const scaleX = Math.abs(Math.cos(t * Math.PI));

      ctx.putImageData(staticImage, 0, 0);

      for (const d of flipping) {
        const scx = padding + d.c * cellPx + cellPx / 2;
        const scy = padding + d.r * cellPx + cellPx / 2;
        const key = d.r + ',' + d.c;
        const oldColor = origColors[key];
        const newColor = oldColor === 1 ? 2 : 1;
        const showColor = pastHalf ? newColor : oldColor;

        ctx.save();
        ctx.translate(scx, scy);
        ctx.scale(Math.max(scaleX, 0.03), 1);

        ctx.beginPath();
        ctx.arc(0, 0, stoneR, 0, Math.PI * 2);
        if (showColor === 1) {
          ctx.fillStyle = '#222';
          ctx.fill();
          ctx.strokeStyle = '#555';
        } else {
          ctx.fillStyle = '#f5f5f5';
          ctx.fill();
          ctx.strokeStyle = '#bbb';
        }
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        if (scaleX < 0.2) {
          ctx.save();
          ctx.strokeStyle = '#ffdd57';
          ctx.shadowColor = '#ffdd57';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(scx, scy - stoneR);
          ctx.lineTo(scx, scy + stoneR);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (t < 1) {
        requestAnimationFrame(animateFlips);
      } else {
        for (const d of flipping) {
          const key = d.r + ',' + d.c;
          grid[d.r][d.c] = origColors[key] === 1 ? 2 : 1;
        }
        if (drawCallback) drawCallback(null);
        else drawBoard(ctx, grid, N, cellPx, padding);
        resolve({ flipping });
      }
    }

    requestAnimationFrame(animateFlips);
  });
}
