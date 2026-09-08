---
pagetitle: "Lesson 2: The Monte Carlo speedup | Quantum Oracle Engineering"
description: "From epidemic intervention to Sway: a reusable simulator structure, amplitude estimation, and the cost of building a coherent rollout oracle. Lesson 2 of Quantum Oracle Engineering."
image: img/myth02.png
image-alt: "Two dice tumbling across a green felt table"
---


# A decision worth simulating {#seg-reopen}

## Quantum Oracle Engineering {#title .center}

### Lesson 2: The Monte Carlo speedup

<img src="../img/myth02.png" width="600" height="600" class="boil"
     alt="Two dice tumbling across a green felt table"
     style="display:block; margin:0.4em auto 0; width:auto; max-height:40vh; max-width:100%;">

<p class="step" style="font-family:Georgia,serif; font-style:italic; color:#55534e; margin:0.6em auto 0;">“Monte Carlo gets a quadratic quantum speedup.”</p>

::: {#boil-filter}
:::

::: {#l2-style}
:::

::: {#l2-context}
:::

<!--
Today we'll start with an intervention problem and build up to its quantum version. Sway will give us a small simulator we can inspect completely.

The aim is to learn a construction we can reuse: choose valid actions, simulate random changes, and evaluate the outcome.

The quantum timing discussion assumes a fault-tolerant computer. Today we establish what we can build and what its cost depends on.
-->

## Which intervention should we choose? {#intervention}

::: {#l2-intervention}
:::

<!--
Suppose we can vaccinate at A or B. Which choice gives us a better chance of keeping the infected count below a threshold?

Step through one future, then try another. The same choice can lead to different outcomes. Later vaccinations follow a fixed policy in both cases.

This is a small illustrative model. We would need many runs to estimate either choice's success probability.
-->

## What does the simulator need? {#simulator-parts}

::: {#l2-simulator-parts}
:::

<!--
One simulated future is a rollout. We choose a first action, follow a fixed policy for later actions, and record whether the final state meets our objective.

The same structure appears in many planning problems. Each model supplies its own valid actions, random updates, and score.
-->

## Three questions, no free passes {#three-questions}

::: {#gates-4-compact}
:::

- still sampling?
- precision?
- worth building?

<!--
Does the best classical method still need samples? Does getting enough precision take most of the work? Can we build an oracle at a reasonable cost?

We'll check each problem against these questions.
-->

## We'll build it first in Sway {#one-rule}

::: {#l2-model-map}
:::

<!--
Here is the connection to the game we'll use. Both examples have a changing state, actions whose validity depends on that state, random transitions, and a final test.

Sway makes those pieces easy to see and check. We'll carry the construction back to the epidemic model after learning the game.
-->

# Learn the simulator {#seg-sway}

## Call it Sway {#sway}

::: {#sway-reveal}
:::

<!--
Sway has two players placing stones on a grid. Random events can change a stone's color, and friendly neighbors reduce that chance.

The counter below starts sampling two moves while we explain the rules. It runs at a limited demonstration rate.
-->

## Black, White, then the board {#sway-round}

::: {#sway-round}
:::

<!--
Black places a stone, then White places one. Every stone rolls a twenty-sided die. An orange die marks a stone that will change color, and all changes happen together.

The blog game continues until the board fills. Here we use a fixed number of rounds so the circuit has a fixed shape.
-->

## Friends make a stone harder to sway {#flip-table}

::: {#flip-table}
:::

<!--
A stone with no friendly neighbors flips on four of the twenty die faces. Each friendly neighbor removes one of those faces. With four friendly neighbors, it stays its color.

Edge and corner cells have fewer neighbors, so they always have some chance of flipping.
-->

## Everyone decides from the old board {#sync-update}

::: {#sync-update}
:::

<!--
On the left, every stone uses the board as it was at the start of the event. We apply all color changes together.

On the right, updating one stone early changes the neighbor count for the next stone. That gives a different result with the same dice. In Lesson 4, we'll make sure our circuit preserves the original board while computing the updates.
-->

## How do we score a rollout? {#scoring}

::: {#l2-sway-score}
:::

<!--
We stop after a fixed number of rounds and count the stones. Black gets an outcome of 1 only if it has more stones than White. Ties count as 0.

The quantity we're estimating is the chance of that outcome under our chosen policy for later moves.
-->

## Follow one Sway rollout {#rollout-sway}

::: {#rollout-sway}
:::

<!--
Fix the first move, then simulate the remaining rounds. In this browser example, both players choose later moves uniformly among the legal cells.

At the end, record the payoff bit. Reset the board and repeat with fresh random choices. The average estimates Black's win probability under this policy.

Each possible first move is one candidate action, also called an arm.
-->

## Where would you play? {#vote}

::: {#vote-board}
:::

<!--
It's Black's turn. Which of these three moves would you choose?

The first reveal shows the friendly-neighbor counts. The second shows win-rate estimates from 40,000 seeded rollouts per move, with 95% intervals.

Neighbor counts give us a guess. The estimates help us check it, though two of the intervals still overlap.
-->

## How good does the chosen move need to be? {#selection}

::: {#eps-band}
:::

<!--
We choose a tolerance ε. Any action within ε of the best value is acceptable. The selector's guarantee is to return such an action with probability at least two thirds; higher confidence requires extra work.

If we need the unique winner, ε must be smaller than its gap to the runner-up. Otherwise, either of two close moves may be good enough.
-->

## Close calls can be designed and measured {#close-call}

::: {#sway-race-full}
:::

<!--
These two estimates have been accumulating while we explained the game. Check whether their intervals still overlap.

The demo is deliberately rate-limited. It illustrates sampling uncertainty; elapsed time here is not a hardware benchmark.

Next we'll compare these live estimates with a larger, seeded sample.
-->

## Close moves need more evidence {#sway-q2}

::: {#sway-q2}
:::

<!--
These estimates use 400,000 rollouts per move. The easy pair has an estimated gap near 0.04. The closer pair is about 0.006 apart.

We use g for the gap and ε for our chosen tolerance. With ε = 0.003, only the leading move among these candidates qualifies if the estimated gap holds.

These measurements describe this board and policy. They don't establish the cost of every Sway position.
-->

# Estimate a probability with a circuit {#seg-mechanism}

## A coherent rollout keeps every branch {#coherent-rollout}

::: {#coherent-rollout}
:::

<!--
Now represent the possible paths in a quantum state. The circuit stores random choices in qubits and computes the payoff without measuring.

Call that circuit A. We also need its inverse, A†, which undoes the computation. Amplitude estimation uses both directions to estimate the payoff probability.

This tree is a schematic of the interface.
-->

## A probability becomes an angle {#angle}

::: {#ae-circle-1}
:::

<!--
We can group the losing paths along one axis and the winning paths along the other.

Here, x and y are amplitudes. Their squares give the loss and win probabilities, so x² + y² = 1. That puts the state on this circle.

The angle θ tells us the win probability: a = sin²θ. If we can estimate θ, we can calculate a.
-->

## Two reflections make a rotation {#rotation}

::: {#ae-circle-2}
:::

<!--
Reflect across the losing axis, then across the initial state. Together, those reflections rotate the state by 2θ. We call this operation Q.

Q uses A and A†, along with the reflections shown here. We can implement these operations even when the original win probability is unknown.

For a worked example, a = 1/4 gives θ = 30°. One Q takes the state to 90°. We choose a known angle here so we can check the geometry.
-->

## Every turn of Q adds 2θ {#accumulate}

::: {#ae-circle-3}
:::

<!--
Start this worked example at θ = 10°. Each Q adds 20°, so one, two, and four applications take the state to 30°, 50°, and 90°.

A slightly different starting angle would accumulate a different rotation. That growing difference helps us estimate an unknown probability.

Each row starts with a fresh preparation. Each Q costs a rollout forward and backward; measuring the payoff gives one result. Repeated results help us estimate the original angle.
-->

## Nearby probabilities become easier to distinguish {#noise-vs-phase}

::: {#noise-vs-phase}
:::

<!--
Think of two possible values for the unknown probability. On the left, sampling uncertainty shrinks roughly as 1/√M. On the right, a small difference in rotation accumulates across coherent queries.

The diagram illustrates the scaling near these probabilities. Reaching error ε takes order 1/ε² classical samples or 1/ε coherent queries at fixed confidence. The next slide explains how we read an estimate.
-->

## Run, measure, refine {#interference}

::: {#l2-iqae}
:::

<!--
Iterative amplitude estimation chooses how many times to apply Q, then measures the payoff bit. We repeat that circuit to estimate its outcome probability and narrow the possible values of θ.

The current interval guides the next choice, so we can handle the ambiguity from rotations wrapping around the circle. We finish when the probability estimate is precise enough.

IQAE keeps the near-quadratic query improvement, up to logarithmic factors. The appendix shows the original Fourier-based readout.
-->

## The access contract {#contract}

::: {#contract}
:::

<!--
The algorithm needs a bounded payoff, a coherent circuit A, and its inverse. Random choices must be prepared inside the circuit, and measurements must wait until the coherent sequence finishes.

An ordinary sampling service gives us a bounded result, but it doesn't provide the circuit access we need.
-->

# Check the access and count the work {#seg-screen}

## Go: compare against the best classical method {#solver-dice}

::: {#solver-dice}
:::

<!--
In Go, the same move from the same position always gives the same next position. Monte Carlo tree search introduces randomness as a way to explore that tree.

Classical methods can also use pruning, learned move preferences, and value estimates. We would need to compare against those before claiming a speedup from fewer rollouts. For this course, we set Go aside at Question 1. Other quantum approaches to game trees need their own analysis.
-->

## Two arms with nearly equal rewards {#bandit}

::: {#card-bandit}
:::

<!--
Imagine two slot-machine arms with win probabilities 1/2 and 1/2 + ε. We want to find the better arm by pulling them.

When ε is small, distinguishing them takes order 1/ε² pulls per arm. This gives us a sampling problem where precision can be expensive. Arms with a large gap are much easier to compare.
-->

## The sampled bandit lacks an inverse {#missing-inverse}

::: {#contract-missing}
:::

<!--
An ordinary arm gives us a fresh result each time we pull it. The interface supplies no way to apply A†.

A reversible reward circuit would provide a different kind of access, and the quantum algorithm could use it. The ordinary sampled bandit stops at Question 3. For a simple simulated coin, cheap classical samples also make the timing comparison difficult.
-->

## Choosing among k actions {#nested-bills}

::: {#rings}
:::

<!--
We have explained how to estimate one action's value. Finding a good action among k candidates adds another layer.

The quantum best-arm construction combines amplitude estimation with a search over candidates. The rings show the cost of that search, the estimates it needs, and the rollout circuit inside each estimate.
-->

## The quantum composition {#composition}

::: {#composition}
:::

<!--
The coherent best-arm construction uses roughly √k/ε oracle calls, with logarithmic factors hidden by the tilde. The appendix gives the corresponding classical sampling lower bound for a hard family.

This is a bound for the full selection algorithm under its access assumptions. The interval-based readout we just saw explains probability estimation; the coherent selection wrapper also has to meet its own requirements.

Runtime depends on the cost of implementing each call.
-->

## Check the classical alternatives {#sway-q1}

::: {#l2-classical-check}
:::

<!--
Small Sway boards can be enumerated exactly. Larger instances need a comparison against the strongest classical methods we can use.

A large number of possible futures motivates sampling, but doesn't prove that sampling is necessary. The hard-family theorem in the appendix has specific assumptions. Each application still needs this check.
-->

# Reuse the construction {#seg-transfer}

## What carries over to the epidemic model? {#transfer}

::: {#l2-transfer}
:::

<!--
The model supplies three operations: identify valid actions, update the state, and evaluate the outcome.

The circuit design has common work around them: decode action choices, keep randomness in registers, preserve enough information to reverse updates, and clear temporary work.

The epidemic model has a different transition rule and payoff, so its resource counts differ too.
-->

## Two models, checked {#sway-q3}

::: {#l2-validation}
:::

<!--
The course paper reports implementations for both Sway and an epidemic model. On small instances, the tested branches agree with classical rollouts, and aggregate results agree with exact enumeration.

This is evidence that the construction carries across models. The larger compiled counts are in the appendix. Establishing a speed advantage also requires a full resource and timing comparison.
-->

## What would one close comparison cost? {#far-line}

::: {#far-line}
:::

<!--
For a separate timing scenario, assume a gap of 0.0001, five milliseconds per classical rollout, and overhead C = 10. This is a fixed pairwise comparison; it omits the search among k actions.

The model gives 5.8 days on one core or 8.3 minutes on a thousand cores with perfect scaling. A coherent call must take less than five milliseconds to beat the latter.

At one millisecond per call, the quantum estimate is 100 seconds. At 100 milliseconds, it is 2.8 hours. The gap and timings are assumptions, separate from the measured 5×5 example.
-->

## What we can reuse {#verdict}

::: {#l2-summary}
:::

<!--
The construction applies when we can implement valid-action selection, stochastic transitions, and payoff evaluation reversibly at a manageable cost.

Sway gives us a small example to learn on. The epidemic implementation shows how those pieces change in another model.

For a new application, we still check the classical alternatives, the required precision, and the cost of the quantum circuit.
-->

## Zoom into one query {#zoom}

::: {#rings-zoom}
:::

<!--
Let's look inside one oracle call. We need qubits for the board, move selection, dice, temporary work, and the payoff.

In Lesson 3, we'll build those pieces into a circuit.
-->

## Continue to Lesson 3 {#next}

::: {#l2-handoff}
:::

<!--
Continue to Lesson 3 to build the rollout circuit. The remaining slides are optional: the sampling lower bound, assumptions behind the theorem, an alternative readout, and larger resource counts.
-->

# Optional: the sampling lower bound {#seg-proof}

## A family of almost-identical worlds {#hard-family}

::: {#hard-family}
:::

<!--
To prove a lower bound, we construct several similar problems with different best arms.

In the starting problem, arm zero wins with probability 1/2 + 4ε. All other arms win with probability 1/2. In problem j, we raise arm j to 1/2 + 6ε, making it the winner.
-->

## One pull reveals only ε² of evidence {#one-pull}

::: {#evidence-meter}
:::

<!--
Each pull gives only a little evidence about whether an arm's probability has changed. In this construction, that information is at most 96ε² per pull.

The proof requires at least ln(2)/3 total evidence. Dividing gives a lower bound of ln(2)/(288ε²) expected pulls per contender. The constant is machine-checked, and the bound also covers algorithms that choose their next arm based on earlier results.
-->

## Every contender must be ruled out {#every-contender}

::: {#evidence-meters}
:::

<!--
Any contender could be the arm whose probability changed. An algorithm that works across the whole family has to check each one.

There are k − 1 contenders, each requiring order 1/ε² pulls. Adding them gives the classical lower bound for this sampling model.
-->

## What the theorem does, and does not, say {#theorem-scope}

::: {#ledger}
:::

<!--
We have a quantum upper bound and a classical lower bound for the constructed family, each under its stated access model.

The robustness result allows factors to vary when their combined influence stays below ε. The best action stays the same across those configurations. Under the modularity assumption, the lower bound extends too.

Coherent access is an assumption. Classical shortcuts, error-correction costs, and runtime still need separate checks. Lessons 3 and 4 build the oracle.
-->

# Optional: readout and resource details {#seg-details}

## The Fourier-based readout {#fourier-readout}

::: {#ae-circle-4}
:::

<!--
The original amplitude-estimation circuit uses controlled powers of Q and an inverse Fourier transform. Measurement yields a phase estimate, which determines the payoff probability.

This is an alternative to the iterative readout in the main lesson. It introduces an extra phase register.
-->

## A simple model of fading influence {#gap-decay}

::: {#gap-decay}
:::

<!--
Hold a stone's friendly-neighbor count fixed. With flip probability p, its expected contribution to the color margin is multiplied by 1 − 2p per event.

For two friends, that factor is 0.8, and 0.8⁴⁰ is about 0.00013. This calculation concerns an expected color margin. It does not determine the gap between two moves' win probabilities on a full board.

Neighbor counts change during the game. We measure action-value gaps separately.
-->

## Larger compiled circuits {#resource-counts}

::: {#sway-q3}
:::

<p class="l2-note"><a href="#next">Back to Lesson 3 and course links</a></p>

<!--
These are circuit counts before gate decomposition and error-correction overhead. The small validation cases and the larger compiled-only cases are shown separately.

A 20×20 Sway board over ten rounds uses about six million gates in this implementation. Converting that count into time requires a hardware model.
-->
