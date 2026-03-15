import {
  playGame,
  strategyRandom,
  strategyClustery,
  strategyAntiCluster,
  strategyFortress,
  strategyDestabilizer,
  strategyMinimax,
  strategyForkBuilder
} from './engine.js';

const STRATS = [
  { name: 'Fork Builder', fn: strategyForkBuilder },
  { name: 'Minimax', fn: strategyMinimax },
  { name: 'Clusterer', fn: strategyClustery },
  { name: 'Destabilizer', fn: strategyDestabilizer },
  { name: 'Fortress', fn: strategyFortress },
  { name: 'Anti-cluster', fn: strategyAntiCluster },
  { name: 'Random', fn: strategyRandom },
];
const S = STRATS.length;

// ─── DOM refs ────────────────────────────────────────────────────────
const runBtn = document.getElementById('simRunBtn');
const progressEl = document.getElementById('sim-progress');
const vizEl = document.getElementById('sim-viz');

// ─── Tab switching ───────────────────────────────────────────────────
document.getElementById('viz-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.viz-tab');
  if (!tab) return;
  document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('.viz-panel').forEach(p => p.style.display = 'none');
  document.getElementById(`viz-${tab.dataset.tab}`).style.display = '';
  if (tab.dataset.tab === 'bracket') {
    requestAnimationFrame(() => drawBracketConnectors());
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────
function winRateColor(pct) {
  if (pct <= 50) {
    const t = pct / 50;
    return `hsl(${t * 40}, ${60 - t * 50}%, ${20 + t * 5}%)`;
  } else {
    const t = (pct - 50) / 50;
    return `hsl(${40 + t * 100}, ${10 + t * 50}%, ${25 + t * 10}%)`;
  }
}

function combinedWinRate(results, i, j) {
  const ab = results[i][j];
  const ba = results[j][i];
  const iWins = ab.bWins + ba.wWins;
  const total = ab.bWins + ab.wWins + ab.ties + ba.bWins + ba.wWins + ba.ties;
  return total > 0 ? iWins / total : 0.5;
}

// ─── 1. Heatmap ──────────────────────────────────────────────────────
let heatmapCells = {};

function initHeatmap() {
  const panel = document.getElementById('viz-heatmap');
  let html = '<p class="viz-note">Row = black player, Column = white player. Cell = black\'s win rate.</p>';
  html += '<table class="heatmap-table"><tr><th></th>';
  for (let j = 0; j < S; j++) html += `<th class="hm-head">${STRATS[j].name}</th>`;
  html += '</tr>';
  for (let i = 0; i < S; i++) {
    html += `<tr><th class="hm-head hm-row-head">${STRATS[i].name}</th>`;
    for (let j = 0; j < S; j++) {
      if (i === j) html += '<td class="hm-cell hm-diag">&mdash;</td>';
      else html += `<td class="hm-cell" id="hm-${i}-${j}">...</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  panel.innerHTML = html;
  heatmapCells = {};
  for (let i = 0; i < S; i++)
    for (let j = 0; j < S; j++)
      if (i !== j) heatmapCells[`${i},${j}`] = document.getElementById(`hm-${i}-${j}`);
}

function updateHeatmapCell(i, j, r) {
  const total = r.bWins + r.wWins + r.ties;
  const pct = total > 0 ? (r.bWins / total * 100) : 50;
  const cell = heatmapCells[`${i},${j}`];
  if (!cell) return;
  cell.textContent = pct.toFixed(0) + '%';
  cell.style.background = winRateColor(pct);
  cell.style.color = Math.abs(pct - 50) > 15 ? '#fff' : '#aaa';
}

// ─── 2. Elo Rankings ─────────────────────────────────────────────────
function computeElo(results) {
  const elo = new Array(S).fill(1500);
  for (let iter = 0; iter < 50; iter++) {
    const delta = new Array(S).fill(0);
    for (let i = 0; i < S; i++) {
      for (let j = 0; j < S; j++) {
        if (i === j) continue;
        const r = results[i][j];
        const total = r.bWins + r.wWins + r.ties;
        if (total === 0) continue;
        const score = (r.bWins + r.ties * 0.5) / total;
        const expected = 1 / (1 + Math.pow(10, (elo[j] - elo[i]) / 400));
        delta[i] += 20 * (score - expected);
      }
    }
    for (let i = 0; i < S; i++) elo[i] += delta[i];
  }
  return elo;
}

function renderElo(results) {
  const panel = document.getElementById('viz-elo');
  const elo = computeElo(results);
  const ranked = STRATS.map((s, i) => ({ name: s.name, elo: Math.round(elo[i]) }))
    .sort((a, b) => b.elo - a.elo);

  const maxElo = Math.max(...ranked.map(r => r.elo));
  const minElo = Math.min(...ranked.map(r => r.elo));
  const range = maxElo - minElo || 1;

  let html = '<p class="viz-note">Elo ratings computed from all round-robin results (50 iterations).</p>';
  ranked.forEach((r, idx) => {
    const width = 20 + ((r.elo - minElo) / range) * 75;
    const hue = ((r.elo - minElo) / range) * 140;
    html += `
      <div class="elo-row">
        <span class="elo-rank">#${idx + 1}</span>
        <span class="elo-name">${r.name}</span>
        <div class="elo-track">
          <div class="elo-bar" style="width:${width}%;background:hsl(${hue},50%,40%)">${r.elo}</div>
        </div>
      </div>`;
  });
  panel.innerHTML = html;
}

// ─── 3. Tournament Bracket ───────────────────────────────────────────
function renderBracket(results) {
  const panel = document.getElementById('viz-bracket');

  const agg = STRATS.map((s, i) => {
    let wins = 0, total = 0;
    for (let j = 0; j < S; j++) {
      if (i === j) continue;
      wins += combinedWinRate(results, i, j);
      total++;
    }
    return { idx: i, name: s.name, rate: wins / total };
  }).sort((a, b) => b.rate - a.rate);

  const seeds = agg.map(a => a.idx);

  function matchWinner(a, b) {
    return combinedWinRate(results, a, b) >= 0.5 ? a : b;
  }

  function slotHTML(idx, opIdx, isWinner) {
    const wr = (combinedWinRate(results, idx, opIdx) * 100).toFixed(0);
    return `<div class="bk-slot ${isWinner ? 'winner' : ''}">`
      + `<span class="bk-name">${STRATS[idx].name}</span>`
      + `<span class="bk-pct">${wr}%</span></div>`;
  }

  function matchHTML(idxA, idxB, winnerId) {
    return `<div class="bk-match">`
      + slotHTML(idxA, idxB, winnerId === idxA)
      + slotHTML(idxB, idxA, winnerId === idxB)
      + `</div>`;
  }

  const playInW = matchWinner(seeds[3], seeds[4]);
  const semi1W  = matchWinner(seeds[0], playInW);
  const semi2W  = matchWinner(seeds[1], seeds[2]);
  const champion = matchWinner(semi1W, semi2W);

  panel.innerHTML = `
    <p class="viz-note">Single-elimination bracket, seeded by overall win rate.</p>
    <div class="bk-bracket">
      <div class="bk-round">
        <div class="bk-round-label">Play-in</div>
        <div class="bk-matches bk-r0">
          ${matchHTML(seeds[3], seeds[4], playInW)}
        </div>
      </div>
      <div class="bk-connector bk-c0"></div>
      <div class="bk-round">
        <div class="bk-round-label">Semis</div>
        <div class="bk-matches bk-r1">
          ${matchHTML(seeds[0], playInW, semi1W)}
          ${matchHTML(seeds[1], seeds[2], semi2W)}
        </div>
      </div>
      <div class="bk-connector bk-c1"></div>
      <div class="bk-round">
        <div class="bk-round-label">Final</div>
        <div class="bk-matches bk-r2">
          ${matchHTML(semi1W, semi2W, champion)}
        </div>
      </div>
    </div>`;

}

function drawBracketConnectors() {
  const panel = document.getElementById('viz-bracket');
  if (!panel) return;
  panel.querySelectorAll('.bk-connector').forEach(c => {
    const bracket = panel.querySelector('.bk-bracket');
    const canvas = document.createElement('canvas');
    const w = c.getBoundingClientRect().width || 24;
    const h = bracket.getBoundingClientRect().height;
    if (h === 0) return;
    canvas.width = w * 2; canvas.height = h * 2;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    c.innerHTML = '';
    c.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1.5;

    const prev = c.previousElementSibling;
    const next = c.nextElementSibling;
    if (!prev || !next) return;
    const leftMatches = prev.querySelectorAll('.bk-match');
    const rightMatches = next.querySelectorAll('.bk-match');
    const cRect = c.getBoundingClientRect();

    const leftYs = [...leftMatches].map(lm => {
      const r = lm.getBoundingClientRect();
      return r.top + r.height / 2 - cRect.top;
    });
    const rightYs = [...rightMatches].map(rm => {
      const r = rm.getBoundingClientRect();
      return r.top + r.height / 2 - cRect.top;
    });

    if (leftYs.length >= 2 && rightYs.length >= 1) {
      const topY = leftYs[0];
      const botY = leftYs[leftYs.length - 1];
      const midY = rightYs[0];
      const mid = w / 2;

      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(mid, topY);
      ctx.lineTo(mid, botY);
      ctx.lineTo(0, botY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mid, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();
    } else if (leftYs.length === 1 && rightYs.length >= 1) {
      const ly = leftYs[0];
      const ry = rightYs[0];
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w / 2, ly);
      ctx.lineTo(w / 2, ry);
      ctx.lineTo(w, ry);
      ctx.stroke();
    }
  });
}

// ─── 4. Stacked Overall Bars ─────────────────────────────────────────
function renderStacked(results) {
  const panel = document.getElementById('viz-stacked');

  const agg = STRATS.map((s, i) => {
    let wins = 0, losses = 0, ties = 0;
    for (let j = 0; j < S; j++) {
      if (i === j) continue;
      // As black
      wins += results[i][j].bWins;
      losses += results[i][j].wWins;
      ties += results[i][j].ties;
      // As white
      wins += results[j][i].wWins;
      losses += results[j][i].bWins;
      ties += results[j][i].ties;
    }
    const total = wins + losses + ties;
    return {
      name: s.name, wins, losses, ties, total,
      winPct: total ? wins / total * 100 : 0,
      lossPct: total ? losses / total * 100 : 0,
      tiePct: total ? ties / total * 100 : 0,
    };
  }).sort((a, b) => b.winPct - a.winPct);

  let html = '<p class="viz-note">Aggregate record across all opponents (both as black and white).</p>';
  agg.forEach(a => {
    html += `
      <div class="stacked-row">
        <span class="stacked-name">${a.name}</span>
        <div class="stacked-track">
          <div class="stacked-seg win-seg" style="width:${a.winPct}%"></div>
          <div class="stacked-seg tie-seg" style="width:${a.tiePct}%"></div>
          <div class="stacked-seg loss-seg" style="width:${a.lossPct}%"></div>
        </div>
        <span class="stacked-pct">${a.winPct.toFixed(1)}% W</span>
      </div>`;
  });
  html += `<div class="stacked-legend">
    <span><span class="legend-dot" style="background:#27ae60"></span> Wins</span>
    <span><span class="legend-dot" style="background:#555"></span> Ties</span>
    <span><span class="legend-dot" style="background:#c0392b"></span> Losses</span>
  </div>`;
  panel.innerHTML = html;
}

// ─── Run simulation ──────────────────────────────────────────────────
let running = false;

runBtn.addEventListener('click', async () => {
  if (running) return;
  running = true;
  runBtn.textContent = 'Running...';
  runBtn.style.opacity = '0.6';

  const N = parseInt(document.getElementById('simN').value);
  const gamesPerMatchup = parseInt(document.getElementById('simGames').value);
  const BATCH = 10;

  const results = Array.from({ length: S }, () =>
    Array.from({ length: S }, () => ({ bWins: 0, wWins: 0, ties: 0 }))
  );

  vizEl.style.display = '';
  initHeatmap();

  const totalMatchups = S * (S - 1);
  let completedMatchups = 0;

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      if (i === j) continue;
      const r = results[i][j];

      for (let g = 0; g < gamesPerMatchup; g += BATCH) {
        const batch = Math.min(BATCH, gamesPerMatchup - g);
        for (let b = 0; b < batch; b++) {
          const res = playGame(N, STRATS[i].fn, STRATS[j].fn);
          if (res.winner === 'black') r.bWins++;
          else if (res.winner === 'white') r.wWins++;
          else r.ties++;
        }

        const done = completedMatchups * gamesPerMatchup + g + batch;
        const total = totalMatchups * gamesPerMatchup;
        progressEl.textContent = `${done.toLocaleString()} / ${total.toLocaleString()} games  (${STRATS[i].name} vs ${STRATS[j].name})`;
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      completedMatchups++;
      updateHeatmapCell(i, j, r);
      renderElo(results);
      renderBracket(results);
      renderStacked(results);
    }
  }

  progressEl.textContent = `Done — ${(totalMatchups * gamesPerMatchup).toLocaleString()} games on ${N}\u00d7${N} grid.`;
  runBtn.textContent = 'Run tournament';
  runBtn.style.opacity = '1';
  running = false;
});
