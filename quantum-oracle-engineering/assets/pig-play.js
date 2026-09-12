// pig-play.js -- Lesson 1, slide 2: play Pig from scratch, before the rules
// are said aloud.  You roll and hold; the other player holds at 20, the same
// fixed policy pig.js gives both simulated players later in the deck, so the
// opponent met here is the one the rollouts assume.  Rolls come from
// Math.random: this is a game, not a figure, and no number downstream
// depends on it.
(function () {
  const root = document.getElementById('pig-play');
  if (!root) return;
  const GOAL = 100, HOLD = 20;
  const $ = (id) => document.getElementById(id);
  const meEl = $('pig-me'), opEl = $('pig-op'), meName = $('pig-me-name'), opName = $('pig-op-name');
  const die = $('pig-die'), turnEl = $('pig-turn'), rollBtn = $('pig-roll'), holdBtn = $('pig-hold');
  const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const L = window.L2;
  let S;

  // The same cube the deck's Pig figures draw; face 0 is an unrolled die.
  function drawDie(face, bust) {
    die.textContent = '';
    L.d6(die, 50, 50, 46, face, bust
      ? { fill: L.RED, stroke: L.RED, ink: '#fff' }
      : { fill: '#fff', stroke: L.INK, ink: L.INK });
  }

  function reset() {
    S = { me: 0, op: 0, turn: 0, mine: true, busy: false, over: false };
    drawDie(0);
    paint();
  }

  function paint(bust) {
    meEl.textContent = S.me;
    opEl.textContent = S.op;
    meName.classList.toggle('on', S.mine && !S.over);
    opName.classList.toggle('on', !S.mine && !S.over);
    turnEl.classList.toggle('bust', !!bust);
    if (S.over) turnEl.textContent = S.me >= GOAL ? 'you win' : 'they win';
    else turnEl.textContent = bust ? '+0' : S.turn ? '+' + S.turn : '';
    rollBtn.textContent = S.over ? 'again' : 'roll';
    rollBtn.disabled = S.busy;
    holdBtn.disabled = S.busy || S.over || !S.mine || S.turn === 0;
  }

  const d6 = () => 1 + Math.floor(Math.random() * 6);
  const wait = (ms) => new Promise((r) => setTimeout(r, quick ? 0 : ms));

  // A roll tumbles through a few faces before it lands.
  async function tumble(final) {
    for (let i = 0; i < 4; i++) {
      drawDie(1 + (final + i * 2 + 1) % 6);
      await wait(45);
    }
    drawDie(final, final === 1);
  }

  async function myRoll() {
    if (S.over) { reset(); return; }
    if (!S.mine || S.busy) return;
    S.busy = true; paint();
    const d = d6();
    await tumble(d);
    if (d === 1) {
      S.turn = 0; paint(true);
      await wait(800);
      return theirTurn();
    }
    S.turn += d;
    if (S.me + S.turn >= GOAL) return bank();
    S.busy = false; paint();
  }

  function myHold() {
    if (!S.mine || S.busy || S.turn === 0) return;
    bank();
  }

  async function bank() {
    S.me += S.turn; S.turn = 0; S.busy = true;
    if (S.me >= GOAL) { S.over = true; S.busy = false; paint(); return; }
    paint();
    await wait(500);
    theirTurn();
  }

  // Hold at 20, one visible roll at a time, then the die comes back to you.
  async function theirTurn() {
    S.mine = false; S.busy = true; S.turn = 0; paint();
    await wait(400);
    for (;;) {
      const d = d6();
      await tumble(d);
      if (d === 1) { S.turn = 0; paint(true); await wait(800); break; }
      S.turn += d; paint();
      await wait(450);
      if (S.turn >= HOLD || S.op + S.turn >= GOAL) {
        S.op += S.turn; S.turn = 0; paint();
        if (S.op >= GOAL) { S.over = true; S.busy = false; paint(); return; }
        await wait(500);
        break;
      }
    }
    S.mine = true; S.busy = false; drawDie(0); paint();
  }

  rollBtn.addEventListener('click', myRoll);
  holdBtn.addEventListener('click', myHold);
  // Space activates a focused button instead of advancing the deck.  Deferred
  // fragment scripts register before the deck's DOMContentLoaded handler.
  window.addEventListener('keydown', (event) => {
    if (event.key !== ' ' || !event.target.matches?.('#pig-roll, #pig-hold')) return;
    event.preventDefault(); event.stopImmediatePropagation(); event.target.click();
  }, true);
  reset();
})();
