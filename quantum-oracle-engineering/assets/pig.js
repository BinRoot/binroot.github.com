// pig.js -- Lesson 1's running example, the dice game Pig, for the figures.
//
// Rules: roll a d6 as often as you like; each roll adds to a turn total,
// except a 1, which wipes the turn total and ends the turn; hold to add the
// turn total to your score; first to 100 wins.  Both simulated players follow the fixed
// strategy "hold at 20", so a rollout estimates a move's win rate under that
// strategy, not against perfect play.  The rollout and the PRNG match
// gen/pig-gen.mjs bit for bit, so the traces the slides play are the ones
// the generated numbers (window.PIG_DATA) were computed from.
(function () {
  if (window.PIG) return;
  const GOAL = 100, HOLD = 20;
  const prng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // one rollout from (i, j, k): my score, opponent's score, my turn total; the
  // first action is forced, then hold-at-20 for both.  Returns the outcome
  // and a trace of every die and every hold, for the animation.
  const rollout = (i, j, k, first, rnd) => {
    let me = i, op = j, turn = k, mine = true, forced = first; const trace = [];
    for (;;) {
      const act = forced || (turn >= HOLD ? 'hold' : 'roll'); forced = null;
      if (act === 'hold') {
        if (mine) me += turn; else op += turn;
        trace.push({ who: mine ? 'me' : 'op', hold: turn, me, op });
        if (me >= GOAL) return { win: 1, trace }; if (op >= GOAL) return { win: 0, trace };
        turn = 0; mine = !mine; continue;
      }
      const d = 1 + Math.floor(rnd() * 6);
      if (d === 1) { trace.push({ who: mine ? 'me' : 'op', die: d, turn: 0, me, op, bust: true }); turn = 0; mine = !mine; continue; }
      turn += d;
      trace.push({ who: mine ? 'me' : 'op', die: d, turn, me, op });
      if ((mine ? me : op) + turn >= GOAL) { if (mine) me += turn; else op += turn; trace.push({ who: mine ? 'me' : 'op', hold: turn, me, op }); return { win: mine ? 1 : 0, trace }; }
    }
  };
  window.PIG = { GOAL, HOLD, prng, rollout };
})();
