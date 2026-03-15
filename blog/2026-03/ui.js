import {
  createGrid, friendlyNeighbors, d20Threshold,
  swayStep, countStones, isBoardFull,
  strategyRandom, strategyClustery, strategyAntiCluster,
  strategyFortress, strategyDestabilizer, strategyForkBuilder,
  strategyMinimax
} from './engine.js';
import { drawBoard, animatedSway as sharedAnimatedSway } from './board-renderer.js';

const S = window.game_component_strings || {};
const str = (key, fallback) => S[key] ?? fallback;

const AI_STRATEGIES = {
  random: strategyRandom,
  clustery: strategyClustery,
  anticluster: strategyAntiCluster,
  fortress: strategyFortress,
  destabilizer: strategyDestabilizer,
  forkbuilder: strategyForkBuilder,
  minimax: strategyMinimax,
};

// ─── State ───────────────────────────────────────────────────────────
let N, p2mode, humanColor;
let grid;
let gameId = 0; // incremented on each startGame to cancel stale timeouts
let round, phase; // phase: 'black' | 'white' | 'sway' | 'done'
let cellPx, padding;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ─── Settings menu ──────────────────────────────────────────────────
const cogBtn = document.getElementById('cogBtn');
const settingsMenu = document.getElementById('settingsMenu');

cogBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!settingsMenu.contains(e.target) && e.target !== cogBtn) {
    settingsMenu.classList.remove('open');
  }
});

document.getElementById('gridSize').addEventListener('change', () => { settingsMenu.classList.remove('open'); startGame(); });
document.getElementById('gridSize').addEventListener('click', (e) => { e.stopPropagation(); });
document.getElementById('p2mode').addEventListener('change', () => { settingsMenu.classList.remove('open'); startGame(); });
document.getElementById('p2mode').addEventListener('click', (e) => { e.stopPropagation(); });
const humanColorEl = document.getElementById('humanColor');
humanColorEl.addEventListener('change', () => { settingsMenu.classList.remove('open'); startGame(); });
humanColorEl.addEventListener('click', (e) => { e.stopPropagation(); });

// ─── Start / restart ────────────────────────────────────────────────
window.startGame = function startGame() {
  N = parseInt(document.getElementById('gridSize').value);
  p2mode = document.getElementById('p2mode').value;
  humanColor = document.getElementById('humanColor').value; // 'black' or 'white'

  gameId++;
  grid = createGrid(N);
  round = 1;
  phase = 'black';

  const dpr = window.devicePixelRatio || 1;
  const maxPx = Math.min(window.innerWidth - 40, 560);
  padding = 28;
  cellPx = Math.floor((maxPx - padding * 2) / N);
  const totalPx = cellPx * N + padding * 2;
  canvas.width = totalPx * dpr;
  canvas.height = totalPx * dpr;
  canvas.style.width = totalPx + 'px';
  canvas.style.height = totalPx + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  document.getElementById('result-overlay').classList.remove('show');

  updateUI();
  draw();

  // If human is white, AI moves first as black
  if (humanColor === 'white' && p2mode !== 'human') {
    const id = gameId;
    setTimeout(() => {
      if (gameId !== id) return;
      aiMove(1);
      draw();
      phase = 'white';
      updateUI();
    }, 300);
  }
};

// ─── Drawing ─────────────────────────────────────────────────────────
function draw(skipCells) {
  drawBoard(ctx, grid, N, cellPx, padding, skipCells);
}

// ─── UI helpers ──────────────────────────────────────────────────────
function updateUI() {
  const { b, w } = countStones(grid, N);
  document.getElementById('scoreBlack').textContent = b;
  document.getElementById('scoreWhite').textContent = w;


  const st = document.getElementById('statusText');
  if (phase === 'black') {
    const isAI = p2mode !== 'human' && humanColor === 'white';
    st.textContent = isAI
      ? str('status-black-ai', 'Black (AI) is thinking...')
      : str('status-black', 'Black: place a stone on an empty cell.');
  } else if (phase === 'white') {
    const isAI = p2mode !== 'human' && humanColor === 'black';
    st.textContent = isAI
      ? str('status-white-ai', 'White (AI) is thinking...')
      : str('status-white', 'White: place a stone on an empty cell.');
  } else if (phase === 'sway') {
    st.textContent = str('status-sway', 'Sway — rolling d20 for each stone...');
  }
}

// ─── Sway animation ──────────────────────────────────────────────────
function animatedSway() {
  return sharedAnimatedSway(ctx, grid, N, cellPx, padding, (skipSet) => {
    draw(skipSet);
    if (!skipSet) updateUI();
  });
}

// ─── AI ──────────────────────────────────────────────────────────────
function aiMove(color) {
  const fn = AI_STRATEGIES[p2mode];
  if (!fn) return;
  const c = color || (humanColor === 'black' ? 2 : 1);
  const move = fn(grid, N, c);
  if (move) grid[move[0]][move[1]] = c;
}

// ─── Click handler ───────────────────────────────────────────────────
function isHumanTurn() {
  if (p2mode === 'human') return true;
  if (humanColor === 'black') return phase === 'black';
  return phase === 'white';
}

canvas.addEventListener('click', (e) => {
  if (phase === 'sway' || phase === 'done') return;
  if (!isHumanTurn()) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor((x - padding) / cellPx);
  const row = Math.floor((y - padding) / cellPx);
  if (row < 0 || row >= N || col < 0 || col >= N) return;
  if (grid[row][col] !== 0) return;

  const color = phase === 'black' ? 1 : 2;
  grid[row][col] = color;
  draw();

  if (phase === 'black') {
    phase = 'white';
    updateUI();
    if (!isHumanTurn()) {
      const id = gameId;
      setTimeout(() => {
        if (gameId !== id) return;
        aiMove(2);
        draw();
        triggerSway();
      }, 300);
    }
  } else {
    // White just moved, trigger sway
    triggerSway();
  }
});

function triggerSway() {
  phase = 'sway';
  updateUI();
  draw();

  const T = 1;

  setTimeout(async () => {
    for (let t = 1; t <= T; t++) {
      document.getElementById('statusText').textContent =
        str('status-sway', `Sway ${t} of ${T} — rolling d20 for each stone...`);
      await animatedSway();
    }

    const boardFull = isBoardFull(grid, N);
    if (boardFull) {
      endGame();
    } else {
      round++;
      phase = 'black';
      updateUI();
      draw();

      // If AI plays black, make its move
      if (p2mode !== 'human' && humanColor === 'white') {
        const id = gameId;
        setTimeout(() => {
          if (gameId !== id) return;
          aiMove(1);
          draw();
          phase = 'white';
          updateUI();
        }, 300);
      }
    }
  }, 350);
}

// ─── End game ────────────────────────────────────────────────────────
function endGame() {
  phase = 'done';
  const { b, w } = countStones(grid, N);
  updateUI();

  const overlay = document.getElementById('result-overlay');
  const title = document.getElementById('resultTitle');
  const scores = document.getElementById('resultScores');

  if (b > w) title.textContent = str('result-black-wins', 'Black wins!');
  else if (w > b) title.textContent = str('result-white-wins', 'White wins!');
  else title.textContent = str('result-tie', "It's a tie!");

  scores.textContent = str('result-scores', `Black ${b} - ${w} White`);
  overlay.classList.add('show');
}

// ─── Hover highlight ─────────────────────────────────────────────────
canvas.addEventListener('mousemove', (e) => {
  if (phase === 'sway' || phase === 'done') { canvas.style.cursor = 'default'; return; }
  if (!isHumanTurn()) { canvas.style.cursor = 'default'; return; }

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor((x - padding) / cellPx);
  const row = Math.floor((y - padding) / cellPx);
  if (row < 0 || row >= N || col < 0 || col >= N || grid[row][col] !== 0) {
    canvas.style.cursor = 'default';
    draw();
    return;
  }

  canvas.style.cursor = 'pointer';
  draw();

  const cx = padding + col * cellPx + cellPx / 2;
  const cy = padding + row * cellPx + cellPx / 2;
  const r = cellPx * 0.38;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = humanColor === 'black' ? '#222' : '#f5f5f5';
  ctx.fill();
  ctx.globalAlpha = 1;
});

canvas.addEventListener('mouseleave', () => { draw(); });

// ─── Close button ────────────────────────────────────────────────────
document.getElementById('resultClose').addEventListener('click', () => {
  document.getElementById('result-overlay').classList.remove('show');
});

// ─── Auto-start ──────────────────────────────────────────────────────
startGame();
