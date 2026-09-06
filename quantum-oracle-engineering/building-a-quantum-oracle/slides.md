---
pagetitle: "Lesson 3: Ship it | Quantum Oracle Engineering"
description: "Building a rollout oracle line by line: a board made of qubits, randomness loaded up front, picking a legal move without measuring, a d20 on five qubits, and the 169-qubit count. Lesson 3 of Quantum Oracle Engineering, taught live at IEEE Quantum Week 2026."
image: img/myth03.png
image-alt: "An open crate of machine parts sitting on an unread blueprint"
---

# Open the crate {#seg-open}

## Quantum Oracle Engineering {#title .center}

### Lesson 3: Ship it

<img src="../img/myth03.png" width="600" height="600" class="boil"
     alt="An open crate of machine parts sitting on an unread blueprint"
     style="display:block; margin:0.4em auto 0; width:auto; max-height:40vh; max-width:100%;">

<p class="step" style="font-family:Georgia,serif; font-style:italic; color:#55534e; margin:0.6em auto 0;">“It's just an implementation detail.”</p>

::: {#boil-filter}
:::

::: {#l2-style}
:::

<!--
Lesson 2 chose the problem and justified the query model. Today we build one query: a circuit that plays one Sway rollout coherently on a 3 by 3 board, two rounds, and reports one bit.

Press once for the myth: "It's just an implementation detail." **By the end you will know which detail, and why it took a new primitive.**

Same controls: arrows, arrow keys, or scroll.
-->

## The rollout in ten lines {#program}

::: {#l3-program line="0"}
:::

<!--
Here is the whole rollout, ten lines. **Every number in Lesson 2 came out of this function.** A board, two placements, a die per stone, a threshold, a flip, a comparison.

A classical programmer reads it and sees nothing hard. Today we translate it line by line into a circuit that can run backward, and we find out which lines resist.
-->

## Which line is the hard one? {#vote-line}

::: {#l3-vote}
:::

<!--
Before we start, a vote: which of these four lines is the hardest to make coherent? Hands up for each.

Most rooms pick the die. **Hold your answer; slide 32 settles it.**
-->

## Four rules that kill four habits {#rules}

::: {#l3-rules}
:::

<!--
The contract from Lesson 2, as four rules. Each one kills a habit a classical program has: peeking, rolling as you go, overwriting, leaving notes behind.

**Today meets the first two head-on. Lesson 4 meets the other two.**
-->

# Line 1: the board {#seg-board}

## Two qubits per cell {#cell-qubits}

::: {#l3-cell-qubits}
:::

<!--
A cell has three states: empty, black, white. Two qubits per cell: **one for occupied, one for color.**

Nine cells, eighteen qubits per board. The color qubit means nothing while the occupancy qubit is zero, and the circuit never reads it then.
-->

## A fresh board every round {#board-copies}

::: {#l3-board-copies}
:::

<!--
Lesson 2's simulator overwrote its board every round. This one may not.

**Every round writes a fresh copy of the board.** Two rounds, three boards. Take it as today's rule; Lesson 4 shows what breaks when you skip it.
-->

## A cell knows its neighbors {#neighborhood}

::: {#l3-neighborhood}
:::

<!--
A stone's flip odds depend on its friendly orthogonal neighbors. Corners have two neighbors, edges three, the center four.

So the count runs from zero to four: **a three-qubit register holds it.** Every cell will borrow that register, count, use the count, and give it back.
-->

# Lines 3 and 4: pick a random empty cell {#seg-pick}

## “Pick a random empty cell” {#pick}

::: {#l3-program line="3,4"}
:::

<!--
Line three. In a classical program, one call to the random number generator and one array index.

**Here it is the hardest line in the function**, and the next six slides are about it.
-->

## Random means a register {#selector}

::: {#l3-selector m="9" w="4"}
:::

<!--
Random means a register. The move is chosen by a rank r, held in a small register prepared in an equal superposition over the legal count.

**Under a fixed horizon the legal count is known in advance:** nine, then eight, then seven, then six. Four, three, three, three qubits, uniform over the first m of their states. Remember this state; it comes back for the dice.
-->

## You may not measure the board {#no-measure}

::: {#l3-no-measure}
:::

<!--
The rank says "the r-th empty cell." Which cell that is depends on the board, and the board is in superposition: in one branch the fourth empty cell is here, in another it is there.

**You may not measure to find out.** The decoding has to happen inside the superposition, correct in every branch at once. That is a totalized coherent rank-select, and it is the primitive this oracle needed.
-->

## Count the empties as you go {#scan}

::: {#l3-scan}
:::

<!--
The decoder is a scan. Walk the cells left to right with a counter of empties seen so far.

**At a cell that is empty and whose counter equals r, write that cell's index into the move register.** The index is the move. The counter unwinds first; then one controlled gate reads the index and flips that cell's occupancy, and color for White.
-->

## The equality test as gates {#eq-gates}

::: {#l3-eq-gates}
:::

<!--
The equality test, as gates. XOR the counter into a scratch register, XOR the rank on top, flip every bit: **the scratch reads all ones only where counter equals rank.**

One multi-controlled X, controlled on all ones and the cell being empty, sets the mark. Then undo the XORs so the scratch is clean for the next cell.
-->

## Unwind the counter {#unwind}

::: {#l3-unwind}
:::

<!--
After the scan the counter holds the number of empties. It has to go back to zero, because the next placement needs it.

**Run the scan's increments backward and the counter unwinds.** Then the stone lands. Compute, use, uncompute. Lesson 5 makes that a discipline; today it is a habit.
-->

## No library has this block {#no-library}

::: {#l3-no-library}
:::

<!--
Adders, comparators, Fourier transforms: standard blocks, in every library. **Select the r-th set bit of a register that is itself in superposition: no block.**

The scan costs the number of cells times the counter width, per placement. Nine times four here. It is the block that had to be built.
-->

# Line 6: roll a d20 {#seg-dice}

## “Roll a d20” {#roll}

::: {#l3-program line="6"}
:::

<!--
Line six. Roll a d20 for every stone.

The same idea as the move: **the die is a register, prepared before anything runs, read and never written.**
-->

## Twenty faces on five qubits {#d20}

::: {#l3-selector m="20" w="5"}
:::

<!--
Five qubits give thirty-two states. A fair d20 wants twenty. **Prepare an equal superposition over the first twenty of the thirty-two**, amplitude one over root twenty each.

The same state preparation as the move selector, with m equal to twenty. Prepared once, it is a read-only tape.
-->

## Two fixes that break the game {#wrong-dice}

::: {#l3-wrong-dice}
:::

<!--
Two tempting fixes, both wrong.

Reroll on a bad face: **rerolling is measuring**, and measuring is forbidden inside.

Use all thirty-two faces and scale nothing: a threshold of four on thirty-two faces is one flip in eight, not one in five. **That is a different game**, and Lesson 2's numbers are gone.
-->

## Ninety qubits of dice {#dice-grid}

::: {#l3-dice-grid}
:::

<!--
Every stone rolls, so every cell gets a die, every round. Nine cells, two rounds, five qubits each: **ninety qubits of dice.**

Hold that number; it is more than half the machine.
-->

# Lines 7 to 9: decide, then flip {#seg-event}

## “Decide, then flip” {#decide}

::: {#l3-program line="7,8,9"}
:::

<!--
Lines seven to nine. Count friends, compare the die, mark, and flip every marked stone together.

**Every decision reads the board as it was before anyone flipped.**
-->

## Count the friends {#same-flags}

::: {#l3-same-flags}
:::

<!--
For each neighbor: both cells occupied and the colors equal. **One four-control pattern per neighbor sets a same-color flag.**

Count the flags into the three-qubit register. That count is c, the number of friends.
-->

## Die below threshold, as gates {#compare}

::: {#l3-compare}
:::

<!--
The die flips the stone when it reads below four minus c. **Below a threshold is a toggle for each face beneath it:** three faces for threshold three, two for two, one for one.

Five qubits, one flag. A comparator, built out of controlled X gates.
-->

## One flag per possible count {#multiplex}

::: {#l3-multiplex}
:::

<!--
The threshold depends on c, so build one comparison flag per possible count. **The flip fires when the count matches c, that flag is set, and the cell is occupied.**

Five lanes into one flag. Four friends has no lane: threshold zero, never flips.
-->

## The old board decides, the new board receives {#old-new}

::: {#l3-old-new}
:::

<!--
The colors are copied into the next round's register first. **The flip flag toggles the new copy; every decision reads the old one.**

That is why every round got a fresh board on slide 6. Lesson 4 shows the circuit that skips this step and what it gets wrong.
-->

## Thirteen qubits, reused nine times {#scratch}

::: {#l3-scratch}
:::

<!--
Same-color flags, the count, the comparison flags, one work qubit: thirteen qubits of scratch. **Every cell fills them, uses them, and empties them again**, so the next cell can borrow the same thirteen.

The first pile of scratch. Small, because every block returns it.
-->

## One round, three blocks {#round}

::: {#l3-round}
:::

<!--
One round: select and place Black, select and place White, the event. **Three blocks, composed, reusable.** Two rounds is two copies.

The Qiskit shape: build each block as its own circuit, compose them, turn the round into an instruction.
-->

# Line 10: return black > white {#seg-payoff}

## “Return black > white” {#return}

::: {#l3-program line="10"}
:::

<!--
Line ten. The only line that leaves a mark: **one bit, black outnumbers white.**
-->

## Two counters {#counters}

::: {#l3-counters}
:::

<!--
Scan the final board once. Occupied and black increments one counter, occupied and white the other.

**Both counters are scratch too.** Lesson 4 gets to how they are cleaned.
-->

## Every pair of totals, at once {#payoff-compare}

::: {#l3-payoff-compare}
:::

<!--
The board is in superposition, so the two totals are too: **every pair of counts is a branch of the same state.** The circuit has to flip the payoff in the winning branches and leave the others alone, in one pass.

Forty-five winning pairs, one multi-controlled pattern each. **At this size, the last line of the program is the costliest block in the oracle.** A tie is not a win.
-->

# The count {#seg-count}

## How many qubits? {#vote-qubits}

::: {#l3-vote-qubits}
:::

<!--
Second vote, hands up.

Most rooms guess low. **Dice do not feel like qubits until you count them.**
-->

## Where the 169 go {#qubit-map}

::: {#l3-qubit-map}
:::

<!--
More than half the machine is dice. Then the boards, the move records, and the rank registers. **Everything but thirteen qubits is a record the inverse will need.** The scratch is the thirteen, borrowed and returned by every block.

**The gates are mostly multi-controlled X, two to eight controls each**, counted before decomposition to a native gate set.
-->

## Shipped means tested {#tested}

::: {#l3-tested}
:::

<!--
Shipped means tested. Two checks.

**Branch by branch:** fix a seed, run the classical rollout and the circuit on the same seed, compare the final boards bit for bit. Every sampled branch agrees.

**In aggregate:** the circuit's win rate, .281 plus or minus .028, against the exact .271 from enumeration. Inside the interval.
-->

# Hand to Lesson 4 {#seg-handoff}

## The hard line was the innocent one {#vote-answer}

::: {#l3-vote-answer}
:::

<!--
The vote from slide 3, answered. The die was bookkeeping, the count was routine, the comparison was expensive but standard.

**Picking an empty cell was the one line with no block to buy.** The hard line was the innocent one.
-->

## Everything ran forward {#forward-only}

::: {#l3-forward}
:::

<!--
Everything today ran forward. Amplitude estimation needs the whole thing backward, and **one wrong ordering breaks that without an error message.**

The checklist: round semantics defined; old and new state apart; selection scratch erased before the board changes; every branch from read-only randomness; runs backward after the payoff is marked. **Three of five today.** Lesson 4 takes the other two.
-->

## Continue to Lesson 4 {#next .bare}

::: {#l3-qr}
:::

<!--
Two pre-reads again: the playable Sway game, and Section III of the QCE26 paper, which is this lesson in theorem form. Click the link to open Lesson 4.
-->

