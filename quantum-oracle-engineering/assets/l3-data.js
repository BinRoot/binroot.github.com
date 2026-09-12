// One reproducible branch, shared by Lesson 3's circuit illustrations.
// Board labels: 0 empty, 1 black, 2 white. Dice are encoded as 0..19.
(function () {
  const N = 3, neighbors = window.L2.sway.neighbors(N);
  const tape = [
    { ranks: [4, 1], dice: [19, 0, 19, 19, 19, 19, 19, 19, 19] },
    { ranks: [2, 3], dice: [19, 19, 19, 19, 1, 19, 2, 19, 19] }
  ];
  let board = Array(N * N).fill(0);
  const rounds = tape.map(({ ranks, dice }) => {
    const start = board.slice(), moves = [];
    ranks.forEach((rank, player) => {
      const empty = board.flatMap((v, i) => v ? [] : [i]);
      const cell = empty[rank];
      moves.push(cell); board[cell] = player + 1;
    });
    const before = board.slice();
    const friends = before.map((v, i) => v ? neighbors[i].filter(j => before[j] === v).length : 0);
    const flips = before.map((v, i) => Boolean(v && dice[i] < 4 - friends[i]));
    board = before.map((v, i) => flips[i] ? 3 - v : v);
    return { start, ranks, moves, dice, before, friends, flips, after: board.slice() };
  });
  const final = board.slice(), black = final.filter(v => v === 1).length, white = final.filter(v => v === 2).length;
  window.L3 = { N, neighbors, rounds, final, black, white, payoff: Number(black > white),
    event: rounds[1], focus: 4, scanBoard: rounds[1].start, rank: rounds[1].ranks[0],
    alternate: [1, 0, 1, 0, 0, 0, 0, 0, 0] };
})();
