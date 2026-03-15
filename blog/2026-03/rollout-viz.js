import { createGrid, friendlyNeighbors, d20Threshold, swayStep, countStones } from './engine.js';
import { drawBoard, drawStone } from './board-renderer.js';

const N = 8;

// ─── 4v4 early-game board ─────────────────────────────────────────────
const baseGrid = createGrid(N);
const seed = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,1,0,0,0,0],
  [0,0,2,1,0,0,0,0],
  [0,0,1,2,1,0,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
];
for (let r = 0; r < N; r++)
  for (let c = 0; c < N; c++)
    baseGrid[r][c] = seed[r][c];

// All candidate moves for Black
const moves = [];
for (let r = 0; r < N; r++)
  for (let c = 0; c < N; c++)
    if (baseGrid[r][c] === 0) moves.push({ r, c, id: `${r},${c}` });

const NUM_MOVES = moves.length;

// Per-move trackers (Welford)
const trackers = moves.map(() => ({ n: 0, mean: 0, m2: 0 }));
function addSample(t, x) {
  t.n++;
  const d = x - t.mean;
  t.mean += d / t.n;
  t.m2 += d * (x - t.mean);
}
function getVar(t) {
  return t.n < 2 ? 0 : t.m2 / (t.n - 1);
}

// Total rollout count
let totalSamples = 0;

// ─── Draw the board ───────────────────────────────────────────────────
const boardCanvas = document.getElementById('rollout-board');
const boardCtx = boardCanvas.getContext('2d');
const cellPx = 32;
const boardPadding = 16;
const totalPx = cellPx * N + boardPadding * 2;
const dpr = window.devicePixelRatio || 1;
boardCanvas.width = totalPx * dpr;
boardCanvas.height = totalPx * dpr;
boardCanvas.style.width = totalPx + 'px';
boardCanvas.style.height = totalPx + 'px';
boardCanvas.style.maxWidth = '100%';
boardCanvas.style.height = 'auto';
boardCanvas.style.aspectRatio = '1 / 1';
boardCtx.scale(dpr, dpr);

function drawBoardState() {
  drawBoard(boardCtx, baseGrid, N, cellPx, boardPadding);

  // Highlight top 2 moves if we have enough data
  const sorted = getRankedMoves();
  if (sorted.length >= 2 && sorted[0].t.n >= 3) {
    for (let rank = 0; rank < 2; rank++) {
      const m = sorted[rank];
      const cx = boardPadding + m.c * cellPx + cellPx / 2;
      const cy = boardPadding + m.r * cellPx + cellPx / 2;
      const radius = cellPx * 0.38;
      boardCtx.beginPath();
      boardCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      boardCtx.strokeStyle = rank === 0 ? '#E05545' : '#5B8DEF';
      boardCtx.lineWidth = 2.5;
      boardCtx.setLineDash([4, 3]);
      boardCtx.stroke();
      boardCtx.setLineDash([]);
      boardCtx.fillStyle = rank === 0 ? '#E05545' : '#5B8DEF';
      boardCtx.font = "bold 10px 'Ubuntu', sans-serif";
      boardCtx.textAlign = 'center';
      boardCtx.fillText(rank === 0 ? '#1' : '#2', cx, cy + 3.5);
    }
  }
}
drawBoardState();

// ─── Full rollout from a given grid ───────────────────────────────────
function fullRollout(startGrid) {
  const grid = startGrid.map(row => new Uint8Array(row));
  let turn = 2; // White moves next after Black placed
  while (true) {
    const empty = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] === 0) empty.push([r, c]);
    if (empty.length === 0) break;
    const [mr, mc] = empty[Math.floor(Math.random() * empty.length)];
    grid[mr][mc] = turn;
    swayStep(grid, N);
    turn = turn === 1 ? 2 : 1;
  }
  const { b, w } = countStones(grid, N);
  return b - w;
}

// ─── Helper: average per-move variance ────────────────────────────────
function getPerMoveStats() {
  let varSum = 0, meanSum = 0, count = 0;
  for (const t of trackers) {
    if (t.n >= 2) {
      varSum += getVar(t);
      meanSum += t.mean;
      count++;
    }
  }
  return {
    avgVar: count > 0 ? varSum / count : 0,
    avgMean: count > 0 ? meanSum / count : 0,
    count
  };
}

// ─── Helper: get moves sorted by current mean ─────────────────────────
function getRankedMoves() {
  return moves.map((m, i) => ({ ...m, t: trackers[i], idx: i }))
    .filter(m => m.t.n >= 1)
    .sort((a, b) => b.t.mean - a.t.mean);
}

// ─── 1. Scatter plot ──────────────────────────────────────────────────
const scatterCanvas = document.getElementById('rollout-scatter');
const sctx = scatterCanvas.getContext('2d');
let scInited = false;
let SCW, SCH;
const scatterDots = [];
const SCATTER_MAX = 500;

function initScatter() {
  if (scInited) return;
  scInited = true;
  const scDispW = scatterCanvas.clientWidth || 340;
  const scDispH = scatterCanvas.clientHeight || 260;
  scatterCanvas.width = scDispW * dpr;
  scatterCanvas.height = scDispH * dpr;
  scatterCanvas.style.width = scDispW + 'px';
  scatterCanvas.style.height = scDispH + 'px';
  sctx.scale(dpr, dpr);
  SCW = scDispW;
  SCH = scDispH;
}

function drawScatter() {
  initScatter();
  sctx.clearRect(0, 0, SCW, SCH);
  sctx.fillStyle = '#f0f0f0';
  sctx.fillRect(0, 0, SCW, SCH);

  const margin = { l: 36, r: 10, t: 10, b: 24 };
  const pw = SCW - margin.l - margin.r;
  const ph = SCH - margin.t - margin.b;

  // Axes
  sctx.strokeStyle = '#bbb';
  sctx.lineWidth = 1;
  sctx.beginPath();
  sctx.moveTo(margin.l, margin.t);
  sctx.lineTo(margin.l, margin.t + ph);
  sctx.lineTo(margin.l + pw, margin.t + ph);
  sctx.stroke();

  // Y-axis labels
  sctx.fillStyle = '#888';
  sctx.font = "10px 'Ubuntu Mono', monospace";
  sctx.textAlign = 'right';
  for (const v of [-60, -30, 0, 30, 60]) {
    const y = margin.t + ph / 2 - (v / 64) * (ph / 2);
    sctx.fillText(v.toString(), margin.l - 4, y + 3);
    sctx.strokeStyle = '#ddd';
    sctx.beginPath();
    sctx.moveTo(margin.l, y);
    sctx.lineTo(margin.l + pw, y);
    sctx.stroke();
  }

  sctx.fillStyle = '#888';
  sctx.textAlign = 'center';
  sctx.fillText(totalSamples > 0 ? `${totalSamples.toLocaleString()} samples` : 'sample #', margin.l + pw / 2, SCH - 4);

  if (scatterDots.length === 0) return;

  // Dots
  const visibleDots = scatterDots.slice(-SCATTER_MAX);
  for (let i = 0; i < visibleDots.length; i++) {
    const x = margin.l + ((i + 1) / (SCATTER_MAX + 1)) * pw;
    const y = margin.t + ph / 2 - (visibleDots[i] / 64) * (ph / 2);
    const age = i / visibleDots.length;
    sctx.globalAlpha = 0.3 + 0.7 * age;
    sctx.fillStyle = '#1d7484';
    sctx.beginPath();
    sctx.arc(x, y, 2, 0, Math.PI * 2);
    sctx.fill();
  }
  sctx.globalAlpha = 1;
}

// ─── 2. Ranking chart ─────────────────────────────────────────────────
const raceCanvas = document.getElementById('rollout-race');
const rctx = raceCanvas.getContext('2d');
let rcInited = false;
let RCW, RCH;

function initRace() {
  if (rcInited) return;
  rcInited = true;
  const rcDispW = raceCanvas.clientWidth || 340;
  const rcDispH = raceCanvas.clientHeight || 180;
  raceCanvas.width = rcDispW * dpr;
  raceCanvas.height = rcDispH * dpr;
  raceCanvas.style.width = rcDispW + 'px';
  raceCanvas.style.height = rcDispH + 'px';
  rctx.scale(dpr, dpr);
  RCW = rcDispW;
  RCH = rcDispH;
}

function drawRanking() {
  initRace();
  rctx.clearRect(0, 0, RCW, RCH);
  rctx.fillStyle = '#f0f0f0';
  rctx.fillRect(0, 0, RCW, RCH);

  const sorted = getRankedMoves();
  if (sorted.length < 2) {
    rctx.fillStyle = '#999';
    rctx.font = "12px 'Ubuntu', sans-serif";
    rctx.textAlign = 'center';
    rctx.fillText('Waiting for rollouts...', RCW / 2, RCH / 2);
    return;
  }

  const margin = { l: 40, r: 40, t: 30, b: 80 };
  const pw = RCW - margin.l - margin.r;
  const lineY = margin.t + 40;

  // X-range from all means
  const allMeans = sorted.map(m => m.t.mean);
  const xMin = Math.min(...allMeans) - 0.5;
  const xMax = Math.max(...allMeans) + 0.5;
  const xRange = xMax - xMin || 1;
  function toX(v) { return margin.l + ((v - xMin) / xRange) * pw; }

  // Number line axis
  rctx.strokeStyle = '#bbb';
  rctx.lineWidth = 1;
  rctx.beginPath();
  rctx.moveTo(margin.l, lineY);
  rctx.lineTo(margin.l + pw, lineY);
  rctx.stroke();

  // Tick marks
  rctx.fillStyle = '#888';
  rctx.font = "9px 'Ubuntu Mono', monospace";
  rctx.textAlign = 'center';
  const tickStep = Math.max(0.5, Math.round(xRange / 8 * 2) / 2);
  for (let v = Math.ceil(xMin / tickStep) * tickStep; v <= xMax; v += tickStep) {
    const x = toX(v);
    rctx.beginPath();
    rctx.moveTo(x, lineY - 3);
    rctx.lineTo(x, lineY + 3);
    rctx.stroke();
    rctx.fillText(v.toFixed(1), x, lineY + 14);
  }

  // Axis label
  rctx.fillStyle = '#888';
  rctx.font = "9px 'Ubuntu Mono', monospace";
  rctx.textAlign = 'center';
  rctx.fillText('mean score', margin.l + pw / 2, lineY + 26);

  // Draw all moves as dots on the number line
  for (let i = sorted.length - 1; i >= 0; i--) {
    const m = sorted[i];
    const x = toX(m.t.mean);
    const isTop2 = i < 2;
    rctx.fillStyle = i === 0 ? '#E05545' : i === 1 ? '#5B8DEF' : '#bbb';
    rctx.globalAlpha = isTop2 ? 1.0 : 0.35;
    rctx.beginPath();
    rctx.arc(x, lineY, isTop2 ? 6 : 3.5, 0, Math.PI * 2);
    rctx.fill();
    rctx.globalAlpha = 1;
  }

  // Labels for #1 and #2 — push apart if overlapping
  const m1 = sorted[0], m2 = sorted[1];
  let lx1 = toX(m1.t.mean), lx2 = toX(m2.t.mean);
  const minLabelGap = 70;
  const actualGap = Math.abs(lx1 - lx2);
  if (actualGap < minLabelGap) {
    const mid = (lx1 + lx2) / 2;
    const sign = lx1 >= lx2 ? 1 : -1;
    lx1 = mid + sign * minLabelGap / 2;
    lx2 = mid - sign * minLabelGap / 2;
  }

  rctx.font = "10px 'Ubuntu Mono', monospace";
  rctx.textAlign = 'center';
  rctx.fillStyle = '#E05545';
  rctx.fillText(`#1 (${m1.r},${m1.c})`, lx1, lineY - 22);
  rctx.fillText(m1.t.mean.toFixed(2), lx1, lineY - 11);
  rctx.fillStyle = '#5B8DEF';
  rctx.fillText(`#2 (${m2.r},${m2.c})`, lx2, lineY - 22);
  rctx.fillText(m2.t.mean.toFixed(2), lx2, lineY - 11);

  // Gap bracket below the line
  const dx1 = toX(m1.t.mean), dx2 = toX(m2.t.mean);
  const gap = Math.abs(m1.t.mean - m2.t.mean);
  const midX = (dx1 + dx2) / 2;
  const bracketY = lineY + 34;

  rctx.strokeStyle = '#aaa';
  rctx.lineWidth = 1.5;
  rctx.beginPath();
  rctx.moveTo(Math.min(dx1, dx2), bracketY);
  rctx.lineTo(Math.max(dx1, dx2), bracketY);
  rctx.stroke();
  for (const x of [dx1, dx2]) {
    rctx.beginPath();
    rctx.moveTo(x, bracketY - 4);
    rctx.lineTo(x, bracketY + 4);
    rctx.stroke();
  }

  rctx.fillStyle = '#666';
  rctx.font = "bold 11px 'Ubuntu Mono', monospace";
  rctx.textAlign = 'center';
  rctx.fillText(`gap = ${gap.toFixed(3)}`, midX, bracketY + 16);
  rctx.font = "10px 'Ubuntu Mono', monospace";
  rctx.fillText(`ε = gap/2 = ${(gap / 2).toFixed(3)}`, midX, bracketY + 28);
}

// ─── 3. Budget calculator ─────────────────────────────────────────────
const epsValEl = document.getElementById('rollout-eps-val');
const sigma2El = document.getElementById('rollout-sigma2');
const barsEl = document.getElementById('rollout-bars');

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function updateBudget() {
  const { avgVar, count } = getPerMoveStats();
  const v = avgVar;
  const sigma = Math.sqrt(v);

  sigma2El.textContent = count > 0 ? v.toFixed(1) : '—';

  const sorted = getRankedMoves();
  if (sorted.length < 2 || count === 0 || v === 0) {
    epsValEl.textContent = '—';
    barsEl.innerHTML = '';
    return;
  }

  const gap = Math.abs(sorted[0].t.mean - sorted[1].t.mean);
  const eps = gap / 2;

  if (eps < 1e-6) {
    epsValEl.textContent = '≈ 0 (tied)';
    barsEl.innerHTML = '';
    return;
  }

  epsValEl.textContent = eps.toFixed(3);

  const classical = Math.ceil(v / (eps * eps)) * NUM_MOVES;
  const quantum = Math.ceil(sigma / eps) * NUM_MOVES;

  const maxVal = classical;
  const barH = 60;
  const cH = barH;
  const qH = Math.max(2, (quantum / maxVal) * barH);

  barsEl.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; flex:1; justify-content:flex-end;">
      <div style="font-size:0.7rem; color:#B07ADB; margin-bottom:2px;">${formatNum(classical)}</div>
      <div style="width:100%; max-width:120px; height:${cH}px; background:#B07ADB; border-radius:3px 3px 0 0;"></div>
      <div style="font-size:0.68rem; color:#888; margin-top:2px;">Classical σ²/ε² × ${NUM_MOVES}</div>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; flex:1; justify-content:flex-end;">
      <div style="font-size:0.7rem; color:#4EC9B0; margin-bottom:2px;">${formatNum(quantum)}</div>
      <div style="width:100%; max-width:120px; height:${qH}px; background:#4EC9B0; border-radius:3px 3px 0 0;"></div>
      <div style="font-size:0.68rem; color:#888; margin-top:2px;">Quantum σ/ε × ${NUM_MOVES}</div>
    </div>
  `;
}

// ─── Layout transition (FLIP animation) ──────────────────────────────
const boardCell = document.getElementById('rollout-board-cell');
const revealPanels = document.querySelectorAll('.rollout-reveal');
let revealed = false;

function revealGrid() {
  if (revealed) return;
  revealed = true;

  // 1. Snapshot the board's current position
  const firstRect = boardCanvas.getBoundingClientRect();

  // 2. Collapse the board cell to one column so the grid can reflow
  boardCell.style.transition = 'none';
  boardCell.style.gridColumn = '1';

  // 3. Reveal the hidden panels (display them, but keep invisible)
  revealPanels.forEach(p => {
    p.style.display = 'flex';
  });

  // 4. Force reflow to get the final position
  boardCell.offsetHeight;

  // 5. Snapshot the board's target position
  const lastRect = boardCanvas.getBoundingClientRect();

  // 6. Compute the FLIP transform: translate + scale from old to new
  const dx = firstRect.left - lastRect.left;
  const dy = firstRect.top - lastRect.top;
  const sw = firstRect.width / lastRect.width;
  const sh = firstRect.height / lastRect.height;

  // 7. Apply the inverse transform (board appears in old position)
  boardCanvas.style.transition = 'none';
  boardCanvas.style.transformOrigin = 'top left';
  boardCanvas.style.transform = `translate(${dx}px, ${dy}px) scale(${sw}, ${sh})`;

  // 8. Force reflow, then animate to identity
  boardCanvas.offsetHeight;
  boardCanvas.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  boardCanvas.style.transform = 'translate(0, 0) scale(1, 1)';

  // 9. Fade in the other panels with a slight delay
  revealPanels.forEach(p => {
    p.style.opacity = '1';
  });

  // 10. Clean up after transition
  boardCanvas.addEventListener('transitionend', function cleanup() {
    boardCanvas.removeEventListener('transitionend', cleanup);
    boardCanvas.style.transform = '';
    boardCanvas.style.transition = '';
    boardCanvas.style.transformOrigin = '';
    boardCell.style.transition = '';

    // Init canvases now that they're visible
    drawScatter();
    drawRanking();
    updateBudget();
  }, { once: true });
}

// ─── Rollout engine ───────────────────────────────────────────────────
let running = false;
const toggleBtn = document.getElementById('rollout-toggle');
let batchTimer = null;
let roundRobin = 0;

function runBatch() {
  if (!running) return;

  const BATCH = 4;
  for (let i = 0; i < BATCH; i++) {
    const moveIdx = roundRobin % NUM_MOVES;
    roundRobin++;

    const m = moves[moveIdx];
    const grid = baseGrid.map(row => new Uint8Array(row));
    grid[m.r][m.c] = 1;
    swayStep(grid, N);
    const score = fullRollout(grid);

    addSample(trackers[moveIdx], score);
    totalSamples++;

    scatterDots.push(score);
    if (scatterDots.length > SCATTER_MAX) scatterDots.shift();
  }

  drawScatter();
  drawRanking();
  drawBoardState();
  updateBudget();

  batchTimer = requestAnimationFrame(runBatch);
}

toggleBtn.addEventListener('click', () => {
  if (!revealed) {
    revealGrid();
  }

  running = !running;
  toggleBtn.textContent = running ? 'Pause' : 'Continue rollouts';
  if (running) {
    batchTimer = requestAnimationFrame(runBatch);
  } else if (batchTimer) {
    cancelAnimationFrame(batchTimer);
  }
});

// Initial draw — just the board
drawBoardState();
