---
pagetitle: "Lesson 4: Reversible by design | Quantum Oracle Engineering"
description: "Running the finished circuit backward is one line of code. The design that makes it mean something is not: the in-place update that changes the game, the counter that must unwind before the stone lands, records against scratch, and the qubit count as the board grows. Lesson 4 of Quantum Oracle Engineering, taught live at IEEE Quantum Week 2026."
image: img/myth04.png
image-alt: "A cassette tape with its ribbon spooled out in a loop behind it"
---

# Rewind {#seg-open}

## Quantum Oracle Engineering {#title .center}

### Lesson 4: Reversible by design

<img src="../img/myth04.png" width="600" height="600" class="boil"
     alt="A cassette tape with its ribbon spooled out in a loop behind it"
     style="display:block; margin:0.4em auto 0; width:auto; max-height:40vh; max-width:100%;">

<p class="step" style="font-family:Georgia,serif; font-style:italic; color:#55534e; margin:0.6em auto 0;">“Reversibility is just bookkeeping.”</p>

::: {#boil-filter}
:::

::: {#l2-style}
:::

<!--
Lesson 3 built the rollout and ran it forward. Today we run it backward, and find out why that is the easy part.

Press once for the myth: "Reversibility is just bookkeeping." **Half of it is. The wrong half.**

Same controls: arrows, arrow keys, or scroll.
-->

## One line of code {#one-line}

::: {#l4-mirror}
:::

<!--
Here is the bookkeeping. **One call, and the whole rollout runs backward:** the gate list reversed, every gate replaced by its inverse. Qiskit does it for any unitary and never complains.

So if backward is one line, what fills a lesson? Two forward habits that backward cannot fix.
-->

## Two habits left {#two-habits}

::: {#l4-checklist-three}
:::

<!--
Lesson 3's checklist, three of five. Peeking and rolling as you go are dead.

**Overwriting and leaving notes behind are still standing.** Both fall today, and the second item, old and new apart, gets the reason Lesson 3 owed you.
-->

# Why backward {#seg-backward}

## Forward once, backward once {#turn-of-q}

::: {#l4-turn}
:::

<!--
Why backward at all. Lesson 2's rotation, one turn: **A forward, a reflection, A backward, a reflection.**

Every turn of Q plays the rollout once forward and once in reverse. Hundreds of turns, and every one needs the reverse to be exact.
-->

# Rule one: keep what the outcome does not determine {#seg-keep}

## Why three boards? {#one-board}

::: {#l4-one-board}
:::

<!--
A tempting shortcut. Lesson 3 kept a fresh color board for every round: twenty-seven qubits for three boards.

**Why not one board, flipped in place?** Eighteen qubits back, and a shorter circuit. Let's build it.
-->

## Find the bug {#find-bug}

::: {#l4-inplace-run}
:::

<!--
Same board, same dice, two circuits. Left, the shortcut: each stone flips the moment it decides. Right, Lesson 3's version.

**The boards come out different.** Thirty seconds: where is the bug? Hands up for the die, the neighbor read, the flag, or nothing at all.
-->

## Cell two read a flipped neighbor {#read-flipped}

::: {#l4-inplace-diagnose}
:::

<!--
The neighbor read. **Cell two counted its friends after cell one had already flipped.** Later stones see a board the rules never defined.

Exact enumeration: the two games differ by four thousandths of win rate. Below the noise of a classical estimate, and larger than the gaps Lesson 2 set out to resolve.
-->

## You already know this bug {#life}

::: {#l4-life}
:::

<!--
You have met this bug. Conway's Life, updated in place, reads cells that already changed, and the toad on the right stops being a toad.

**Every cellular automaton needs two buffers.** The quantum version adds one clause: the old buffer cannot be freed.
-->

## The comparison is stranded {#stranded}

::: {#l4-stranded}
:::

<!--
The second failure hides in the scratch. The bits that count friends compare each neighbor against the cell's own color.

**Flip the color, then uncompute them, and they compare against a different color.** They do not return to zero. The next cell borrows dirty qubits.
-->

## Occupancy updates in place, and that is fine {#occ-in-place}

::: {#l4-occ}
:::

<!--
Not every in-place update is a sin. Occupancy is one register for the whole rollout, and it only ever gains stones.

**The move index says where, so the step can be undone.** In place is fine when a record of the change is kept.
-->

## Two boards, one result {#merge}

::: {#l4-merge}
:::

<!--
Why the move index must stay. Two boards, the same rank, the same result.

**From the result alone you cannot tell which move was made**, so a circuit that forgot the index could not run backward. Two paths into one state is the shape of every irreversible step.
-->

## Keep what the outcome does not determine {#keep-rule}

::: {#l4-records}
:::

<!--
The rule under both bugs. **Keep what the outcome does not determine**: old colors, move indices, dice, ranks.

Everything the kept data determines is scratch, and scratch must return to zero before anyone borrows it. Records against scratch. The rest of the lesson is the second column.
-->

# Rule two: scratch returns to zero before it is borrowed {#seg-zero}

## Thirteen qubits, borrowed by every block {#pool}

::: {#l4-pool}
:::

<!--
Thirteen qubits of scratch, shared. **Rank-select borrows all thirteen; the event borrows eight for each cell; the payoff count borrows them too.**

Every block returns them at zero. The pool is why the count is 169 and not several hundred.
-->

## Place first, or unwind first? {#order-vote}

::: {#l4-order-ask}
:::

<!--
Second vote. The scan fills the counter, the move register takes the index, and a stone has to land.

**Unwind the counter before the stone, or after?** Left or right. Hands up.
-->

## Undo must see what do saw {#undo-reads}

::: {#l4-order-answer}
:::

<!--
After loses. The scan counted five empties; after the stone landed the unwind finds four, and the counter ends at one.

**Undo must see what do saw.** Lesson 3 unwound first without saying why. Now you know why.
-->

## Dirty scratch, wrong game {#dirty-game}

::: {#l4-dirty}
:::

<!--
What one leftover does. The next placement starts its count at one, picks the cell before the one it meant, and rank zero places nothing. Then two. Then three.

**Exact enumeration: Black wins .439 instead of .271.** The circuit runs. Nothing raises.
-->

## Every branch is a classical run {#every-branch}

::: {#l4-branch}
:::

<!--
How you catch both. **Every branch of the rollout is a classical run**: a basis state in, a basis state out.

Fix a seed, run the circuit as a permutation, compare the board, and check every scratch bit is zero. Linearity carries what the seeds show to the superposition.
-->

# The myth {#seg-reveal}

## Backward cannot catch a forward bug {#backward-forward}

::: {#l4-roundtrip}
:::

<!--
The myth, settled. Run the shortcut forward and backward: every register returns to zero, as it must, because the inverse of a unitary is exact.

**The round trip passes and the answer is wrong.** Reversibility is a discipline for the forward pass. The backward pass is bookkeeping.
-->

# The count {#seg-count}

## Records and scratch, 169 {#map}

::: {#l4-map}
:::

<!--
The 169, relabeled. Dice, boards, move indices, ranks: 155 records the inverse will read. Thirteen scratch, borrowed and returned. One payoff.

**Everything but fourteen qubits is the memory of a decision.**
-->

## Grow the board {#growth}

::: {#l4-growth}
:::

<!--
Grow the board and the records grow with it: cells times rounds. Scratch grows with the logarithm.

**A full 19 by 19 game is about four hundred thousand qubits, and twenty-eight of them are scratch.** The records are the cost, and Lesson 5 asks whether any can be returned early.
-->

# Hand to Lesson 5 {#seg-handoff}

## Five of five {#five-of-five}

::: {#l4-checklist-five}
:::

<!--
Five of five. Round semantics, old and new apart, scratch erased before the board changes, read-only randomness, runs backward after the payoff is marked.

**The last two were today's**, and the second is now justified rather than decreed.
-->

## Continue to Lesson 5 {#next .bare}

::: {#l4-qr}
:::

<!--
Pre-reads: the playable Sway game, and Section III of the QCE26 paper for the register layout. Click the link to open Lesson 5.
-->
