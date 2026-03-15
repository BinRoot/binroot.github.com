---
title: Game of Sway
author: Nishant Shukla
date: March 15, 2026
subtitle: Quantum computing for the whole family!
---

## Play Sway

Grab some dice and let's play!

You'll need a d20, a grid, and black and white pieces.

::: {#d20-grid-pieces}
:::

The rules are simple:

- Start with an empty board.
- Two players take turns placing their piece on any open spot.
- Then, **it's the board's turn!** Every piece faces an existential crisis. Lonely pieces are easily swayed to the opposite color. Pieces surrounded by allies hold firm.
  - Roll a d20 for each piece on the board, and flip the color based on the number of friendly neighbors. The more friendly neighbors, the better chance the piece has to stay put.[^flipprob]
- The game ends when the board is full. The winner is the one with the most pieces.

Try it out! Place a piece on the board to begin.

::: {#game-component
  status-black="Black: place a stone on an empty cell."
  status-white="White: place a stone on an empty cell."
  status-black-ai="Thinking..."
  status-white-ai="Thinking..."
  status-sway="Sway!"
  label-black-turn="Black's turn"
  label-white-turn="White's turn"
  label-sway="Sway!"
  result-black-wins="Black wins!"
  result-white-wins="White wins!"
  result-tie="It's a tie!"
}
:::

Take a moment to see if you can figure out a winning strategy.

Think you've got it?

## Strategy

Before you say this is pure unadulterated chaos, I want you to know that at first, I also kept losing (no matter whether I played as black or white) and thought there was no strategy here.
It turns out[^itturnsout] that's exactly the evidence why some strategy must exist; otherwise, I should be winning 50% of all games. 
If stronger players keep beating weaker ones, there must be some exploitable structure hiding under the randomness.

So, I dreamt up the following rules-based AI strategies to play against each other.
Each one has a name and a rough description of how it decides on the best move:

- **Random**: Picks an empty cell uniformly at random.
- **Clusterer**: Greedily places each stone next to as many friendly stones as possible.
- **Fortress**: Claims corners and edges first, building inward.
- **Destabilizer**: Picks the move that maximally destabilizes the enemy, with light clustering as a tiebreaker.
- **Anti-cluster**: Places stones adjacent to enemy clusters to break up their friendly-neighbor connections.
- **Fork Builder**: Looks one move ahead to predict "How many strong follow-up moves does this placement create?"
- **Minimax**: For each candidate move, it simulates the opponent playing their deterministic Clusterer best response, then picks the move that minimizes the quality of that response.

Who do you think will win?

::: {#simulation-component}
:::


From the tournament results in the demo above, we see while some strategies _dominate_ others, the ranking between the top players is more nuanced.
This "Go with dice" knockoff is getting interesting.

But these are all hand-crafted heuristics... 

Can we find the _optimal_ strategy? That's going to require something a bit more... unconventional.

## Solving the game

Those strategies above were just a shot in the dark. Time to throw some compute at this thing. 

The board is only $8 \times 8$, so there's no more than 64 choices to make. 
But, for each possible choice, there's a surprisingly large number of outcomes due to the environmental randomness.
For example, after placing a piece on a board with 36 pieces, all 37 stones could have a nonzero probability of flipping, resulting in $2^{37}$ (over 137 billion) possible outcomes in just one look-ahead.

In order to build a strong AI player, the following techniques are available, but not all are feasible:

| Technique | Example | Application to Sway |
| --- | --- | --- |
| Compute the exact solution | Checkers solved in 2007 by the Chinook project[^chinook] | <span style="color:#c0392b">✘</span> Enumerating all possible game states is intractable |
| Decompose into independent subgames | Late-stage Go, Winning Ways[^winningways] book examples | <span style="color:#c0392b">✘</span> Neighborhood influence prevents generic decomposition |
| Linear programming / minimax solvers | Heads-up limit Texas Hold'em solved by Cepheus[^cepheus] | <span style="color:#c0392b">✘</span> Intractable number of variables/constraints |
| Find a closed-form trick | Nim's XOR-based formula[^spraguegrundy] | <span style="color:#d4a017">?</span> Possible, but game-specific tricks are all-or-nothing; no incremental progress until a proof is found, if one exists at all, and no guarantee it transfers to similar games |
| Learn value and policy priors | Go / AlphaZero[^alphazero] | <span style="color:#d4a017">?</span> Possible, if we can mitigate massive number of self-play iterations |
| Monte Carlo rollouts | Multi-armed bandit[^uct] | <span style="color:#d4a017">?</span> Possible, if we can mitigate massive number of rollouts |

Monte Carlo rollouts seem promising.[^mcts]
Basically, the technique is to gather data to better model the outcome probabilities.
The more data you gather (i.e. more samples you take) the better.

### Rollouts

Consider the following game state. 

::: {#sampling-component}
:::

Hit "sample" to visualize the tremendous number of immediate outcomes from a single state.

A single rollout plays the game to completion, but how many rollouts do we need to feel confident about picking a particular move?

Well, it depends on how chaotic the board state is. 
Board states with a higher variance of outcomes require more rollouts.
Specifically, given variance $\sigma^2$ and a desired precision $\epsilon$, the number of rollouts needed *per move* is on the order of[^chebyshev]

$$
O\left(\frac{\sigma^2}{\epsilon^2}\right)
$$

That could be a _lot_ of rollouts. 

Consider this early-game position. Press "Start rollouts" to run rollouts for every candidate move. Watch the top two moves emerge on the board and the gap between them narrow on the number line.

::: {#rollout-component}
:::

The variance in Sway is gnarly. The gap between good moves is tiny. The number of samples needed grows fast!

What if there were a way to sample all those outcomes at once?

## Quantum superposition

Here's the wild part. While a classical computer performs rollouts one by one, a quantum computer puts all those possible games into superposition, which is a single quantum state that encodes every outcome at once. 

Where classical Monte Carlo needs $O(\sigma^2/\epsilon^2)$ rollouts per move to estimate an expectation, fault-tolerant quantum amplitude estimation[^montanaro] can do it in $O(\sigma/\epsilon)$ oracle calls. That's a quadratic reduction! For example, 160,000 rollouts reduces to just 400!

It's not exactly that simple, though. Even if a powerful fault-tolerant quantum processing unit (QPU) existed, if the problem doesn't have the right structure, the QPU adds overhead for zero gain. More on that below.

Consider the GPU: it earns its place in a system because certain workloads (matrix multiplications, convolutions, ray tracing) map onto its massively parallel architecture so well that no amount of CPU clock speed can compete.

::: {#compute-stack-component}
:::

Remove that structural match and the GPU sits idle or, worse, slows things down.

Similarly, a fault-tolerant QPU also has its own strengths and weaknesses.
Amplitude amplification[^ampamp], amplitude estimation, quantum walks, and a handful of linear-algebra routines let a QPU replace time-consuming sampling as long as the problem already has the combinatorial structure those primitives exploit.

::: {#qpu}
:::

While most problems do not need a quantum computer, this one does!

## Quantum advantage

When does quantum mechanics reduce the fundamental work in AI search? Three conditions must hold at once:

1. **Sampling is inherent.** The environment is stochastic and no classical trick can eliminate the need to average over random outcomes. (Like the environment's turn in Sway)
2. **Precision is the bottleneck.** The differences between good and great decisions are tiny, forcing enormous sample counts. (We've just seen this in action above)
3. **The oracle must be worth building.** The dynamics are simple enough to compile into reversible, coherent transitions without drowning in overhead. (Sway's rules are simple enough to be built in a quantum circuit)

The usual benchmark problems fail at least one:

- Go is deterministic, doesn't need extreme precision, and is expensive to build. 
- The 2-arm bandit is stochastic, but tiny gaps are incidental to specific instances rather than an inherent feature of the problem, and each classical sample costs near-zero computation. The fixed overhead of fault-tolerant quantum error correction far exceeds that trivial per-sample cost.

Sway passes all three. The environment turn is irreducibly stochastic. The repeated Sway events attenuate the marginal impact of any single move. And the rules are local: each cell only checks its immediate neighbors, making the transition cheap to compile into reversible logic.



## Can't unsee it

Honestly, I don't know how far the ideas here stretch. 
But the pattern of "neighbors reinforce you, isolation makes you vulnerable, and the environment shakes things up" does seem to pop up in places beyond board games.[^votermodel] Here are a few that caught my eye:

::: {#applications-component
  title-0="Opinion dynamics"
  desc-0="People surrounded by like-minded friends hold firm. Isolated voices quietly change their tune."
  title-1="Market adoption"
  desc-1="Users stick with a product when everyone around them uses it too. Lone adopters drift away."
  title-2="Cultural competition"
  desc-2="Ideas survive in tight communities. A lone believer is easy to sway."
  title-3="Epidemic spread"
  desc-3="Dense clusters sustain transmission. Isolated cases burn out on their own."
}
:::

It's a toy game with toy rules. 
But it's interesting that the same tension between local stability and global randomness creates hard computational problems. 
If quantum speedups apply to one, maybe they apply to others. That's a question I'd love to see explored.








[^itturnsout]: James Somers, ["It Turns Out"](https://jsomers.net/blog/it-turns-out).
[^chinook]: Schaeffer, J. et al., ["Checkers Is Solved,"](https://www.science.org/doi/10.1126/science.1144079) *Science*, vol. 317, no. 5844, pp. 1518–1522, 2007.
[^winningways]: Berlekamp, E., Conway, J., and Guy, R., [*Winning Ways for your Mathematical Plays*](https://en.wikipedia.org/wiki/Winning_Ways_for_your_Mathematical_Plays), Academic Press, 1982.
[^cepheus]: Bowling, M. et al., ["Heads-up Limit Hold'em Poker is Solved,"](https://www.science.org/doi/10.1126/science.1259433) *Science*, vol. 347, no. 6218, pp. 145–149, 2015.
[^spraguegrundy]: Sprague, R., ["Über mathematische Kampfspiele,"](https://www.jstage.jst.go.jp/article/tmj1911/41/0/41_0_438/_article) *Tohoku Math. J.*, vol. 41, pp. 438–444, 1935. See also Grundy, P. M., "Mathematics and Games," *Eureka*, vol. 2, pp. 6–8, 1939.
[^alphazero]: Silver, D. et al., ["A General Reinforcement Learning Algorithm that Masters Chess, Shogi, and Go through Self-Play,"](https://www.science.org/doi/10.1126/science.aar6404) *Science*, vol. 362, no. 6419, pp. 1140–1144, 2018.
[^uct]: Kocsis, L. and Szepesvári, C., ["Bandit Based Monte-Carlo Planning,"](https://doi.org/10.1007/11871842_29) *ECML*, pp. 282–293, 2006.
[^mcts]: See my quick introduction to [Monte Carlo Tree Search](https://shukla.io/blog/2026-02/grammar.html).
[^chebyshev]: This follows from [Chebyshev's inequality](https://en.wikipedia.org/wiki/Chebyshev%27s_inequality). Chebyshev, P. L., "Des valeurs moyennes," *J. Math. Pures Appl.*, ser. 2, vol. 12, pp. 177–184, 1867.
[^montanaro]: Montanaro, A., ["Quantum Speedup of Monte Carlo Methods,"](https://doi.org/10.1098/rspa.2015.0301) *Proc. R. Soc. A*, vol. 471, no. 2181, 2015.
[^ampamp]: Brassard, G. et al., ["Quantum Amplitude Amplification and Estimation,"](https://doi.org/10.1090/conm/305/05215) *Contemporary Mathematics*, vol. 305, pp. 53–74, 2002.
[^votermodel]: The voter model captures this kind of dynamic. See also [Nano-governance](https://shukla.io/blog/2026-01/nano-gov.html) for a related exploration. See Clifford, P. and Sudbury, A., ["A Model for Spatial Conflict,"](https://doi.org/10.1093/biomet/60.3.581) *Biometrika*, vol. 60, no. 3, pp. 581–588, 1973. For a broader survey, see Castellano, C. et al., ["Statistical Physics of Social Dynamics,"](https://doi.org/10.1103/RevModPhys.81.591) *Rev. Mod. Phys.*, vol. 81, pp. 591–646, 2009.
[^flipprob]: A piece with 0, 1, 2, 3, or 4 friendly orthogonal neighbors flips with probability 4/20, 3/20, 2/20, 1/20, 0/20 respectively.

::: {#footer}
:::
