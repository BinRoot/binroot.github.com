---
pagetitle: "Lesson 3: Ship it | Quantum Oracle Engineering"
description: "Build a coherent Sway rollout from one worked trace: prepare a d20, decode legal moves without measuring, update colors, mark the payoff, and account for 169 qubits."
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

::: {#l3-context}
:::

<!--
Lesson 2 identified the sampling task. Today we build the circuit inside one coherent query.

**By the end, you should be able to trace a rank into a legal move, a die into a color change, and a terminal board into a payoff bit.**

We use one worked branch throughout: an empty 3×3 board, two rounds, four placements. The circuit contains a superposition of branches; the trace lets us inspect what its gates do to one of them.
-->

## The rollout in ten lines {#program}

::: {#l3-program line="0"}
:::

<!--
The familiar classical program is our map: place Black, place White, decide all flips from the same board, and finally compare the counts.

**We will build its dependencies first:** represent a cell, prepare randomness, decode a move, apply an event, then evaluate the result. The highlighted lines keep us oriented as we return to the program.
-->

## What does one call compute? {#contract}

::: {#l3-contract}
:::

<!--
The benchmark starts empty and randomizes all four placements uniformly over the legal cells. Each round ends with an independent die per cell. After two rounds, Black wins only when it outnumbers White; a tie is zero.

**This benchmark averages over first moves. To evaluate a candidate action i from Lesson 2, supply that first move and randomize the continuation.** Do not read the benchmark's aggregate .271 as the value of a particular candidate.

Inside A, prepare randomness coherently, make no measurements, and retain the records needed for A†. Temporary scratch returns to zero. One payoff bit is the output we estimate; the trajectory registers may still be entangled with it.
-->

## Which line is the hard one? {#vote-line}

::: {#l3-vote}
:::

<!--
Which line needs the most work to turn into a coherent circuit? Hands up for each.

Keep the answers in mind. We will return to them immediately after building the legal-move decoder.
-->

# Represent the state and prepare the randomness {#seg-board}

## Two qubits per cell {#cell-qubits}

::: {#l3-cell-qubits}
:::

<p class="l3-caption">One occupancy register; a new color register for each round.</p>

<!--
A cell has three states: empty, black, white. **One qubit stores occupancy and one stores color.** In these diagrams color 0 means Black and 1 means White; while empty, color is ignored.

This board is our trace after round 1. Black placed at cell 4; White placed at cell 1 and then flipped.

One instantaneous board takes eighteen qubits. Across two rounds, the layout retains one occupancy register and three color registers: **9 + 3×9 = 36 state qubits.** Occupancy can update in place because move indices are retained; Lesson 4 explains that choice.
-->

# Prepare a d20 before decoding a move {#seg-dice}

## Twenty faces on five qubits {#d20}

::: {#l3-selector m="20" w="5"}
:::

::: {.l3-code}
~~~python
from math import sqrt
from qiskit import QuantumCircuit, QuantumRegister
from qiskit.circuit.library import StatePreparation

die = QuantumRegister(5, "die")
qc = QuantumCircuit(die)
amplitudes = [1 / sqrt(20)] * 20 + [0] * 12
qc.append(StatePreparation(amplitudes), die)
~~~
:::

<!--
Five qubits have 32 basis states. A fair d20 needs **equal amplitude on 0 through 19 and zero on 20 through 31**. We encode the faces starting at zero, so die < 4 means four successful faces.

This is an executable preparation circuit. StatePreparation is a unitary gate with an inverse. Qiskit's Initialize also resets qubits, so it is not the operation to put inside this unitary oracle.

The whole A includes preparation; A† reverses it. During the rollout body the prepared die is read without being overwritten. Registers can be prepared just before their first use; placing preparation up front makes the randomness tape explicit.
-->

## Two shortcuts change the computation {#wrong-dice}

::: {#l3-wrong-dice}
:::

<!--
**Measuring the face and rerolling on rejection** introduces measurement inside A. That classical loop does not supply the coherent circuit we need. This does not rule out more elaborate coherent preparation methods.

Using Hadamards on all five qubits and keeping the same threshold changes a flip probability from 4/20 to 4/32. It simulates a different transition rule. Preparing the desired distribution avoids both problems.
-->

## Ninety qubits of dice {#dice-grid}

::: {#l3-dice-grid}
:::

<!--
Nine cells, two rounds, five qubits each: **ninety qubits of dice**. Empty cells have a die too; the occupied control prevents it from affecting the board.

The displayed values are the explicit tape for our worked branch. In round 1, cell 1 rolls zero and flips White to Black. In round 2, cells 4 and 6 roll one and two; we will calculate their thresholds later.

The tape has independent registers for every cell and round. We do not reuse one die across several events, which would correlate those events.
-->

# Lines 3 and 4: decode a legal move {#seg-pick}

## “Pick a random empty cell” {#pick}

::: {#l3-program line="3,4"}
:::

<!--
We can now prepare a random rank using the same state-preparation idea as the die.

**A rank is not a cell index.** Rank two means the third empty cell, and its position depends on the board. The next slides build that translation.
-->

## Random means a register {#selector}

::: {#l3-selector m="7" w="3"}
:::

<p class="l3-caption">Our trace: round 2, Black's rank is 2.</p>

<!--
At the start of round 2 there are seven empty cells. Prepare equal amplitude on ranks zero through six; rank seven has zero amplitude.

**The legal count is known here because each placement adds exactly one stone and events only change color.** Starting empty, the four placement counts are 9, 8, 7, 6. Their rank registers need 4, 3, 3, 3 qubits.

A fixed horizon alone does not make a model's legal count predictable. When the legal count varies between branches, preparation and the rollout policy need their own treatment.
-->

## Which cell does the rank select? {#no-measure}

::: {#l3-no-measure}
:::

<!--
Both branches have seven empty cells. The numbers on the boards are cell indices, starting at zero. **Before advancing, find the third empty cell in each board.**

Advance once to reveal: rank two selects cell three in our trace and cell four in the other branch.

The circuit must preserve both possibilities. Measuring which board we have would destroy the coherence needed by amplitude estimation. The decoder instead computes the board-dependent index within each branch.
-->

## Compare first, then increment {#scan}

::: {#l3-scan}
:::

<!--
Scan cells in index order. The prefix counter holds the number of empties **strictly before the current cell**.

At each cell, first compare the prefix with the rank. If the cell is empty and they match, record its index. Only then increment the prefix if the cell is empty.

Our trace selects cell three at prefix two. The counter eventually reaches seven while the move index stays three. Four counter qubits cover every possible occupancy mask on nine cells, including the empty board with nine empties.
-->

## The equality test as gates {#eq-gates}

::: {#l3-eq-gates}
:::

<!--
XOR the counter into scratch, XOR the rank on top, then flip the scratch bits. They are all one exactly when counter equals rank.

An MCX controlled on those bits and occupied = 0 toggles the match flag. The open control means zero; filled controls mean one. Use the match to write the cell index, then undo the equality scratch and match flag.

The picture uses two bits for legibility. **The real counter is four bits; shorter rank registers are zero-extended for comparison.**
-->

## Unwind before placing {#unwind}

::: {#l3-unwind}
:::

<!--
The counter still holds seven. Run its controlled increments backward while occupancy is unchanged, bringing it to zero.

**Keep the selected move index. Clear temporary selection scratch, then decode that index to place Black at cell three.** The index remains a record of which cell changed.

We have now implemented the correct ordering. Lesson 4 will deliberately reverse that ordering to show why it matters.
-->

## Every rank has a defined result {#no-library}

::: {#l3-no-library}
:::

<!--
This separate example has three empty cells. Ranks zero, one, and two select indices two, five, and six. **All larger ranks return sentinel N = 9**, which downstream placement treats as a no-op. That is what totalized means.

The output index needs four bits: positions zero through eight plus the sentinel. Initialize it to nine; on the unique match, XOR nine XOR the selected index into it. With no match, nine remains.

Today's preparation gives invalid ranks zero amplitude. A selector over full bitstrings would instead give the no-op branches positive probability, which is a different policy from uniform sampling among legal actions. **The decoder must have defined behavior either way.**
-->

## The decoder was the hard part {#vote-answer}

::: {#l3-vote-answer}
:::

<p class="l3-caption">Sequential scan: O(Nw) gates and O(w) reusable scratch, w = ⌈log₂(N + 1)⌉.</p>

<!--
Return to the opening vote now that the decoder is concrete.

The key extra work was translating a rank into an index when the validity mask itself depends on the branch. We built that block explicitly, including invalid ranks and scratch cleanup.

**The paper's sequential scan costs O(Nw) gates with O(w) reusable scratch.** That is an asymptotic bound, not an exact count of nine times four elementary gates. Other layouts and the paper's blocked decoder belong in a later resource discussion.

We have dealt with move selection. The remaining program lines count neighbors, decide flips, and evaluate the terminal board.
-->

# Lines 7 to 9: decide from one board, write the next {#seg-event}

## “Decide, then flip” {#decide}

::: {#l3-program line="7,8,9"}
:::

<!--
Black has landed at cell three. White's rank three then selects cell six. The board now has four stones.

Every event decision reads this same board. **We can process cells one at a time, provided every decision reads old colors and every flip writes new colors.**
-->

## A cell knows its neighbors {#neighborhood}

::: {#l3-neighborhood}
:::

<!--
Corners have two orthogonal neighbors, edges three, and the center four. The blue markers show neighbor positions, not occupied stones.

The number of friends can therefore range from zero to four. A three-qubit register is enough. Next we count the actual friends of the center stone in our trace.
-->

## Count the friends {#same-flags}

::: {#l3-same-flags}
:::

<!--
Our center stone is Black. The upper and left neighbors are Black; the other two positions are empty.

For each neighbor, test that both cells are occupied and their colors agree. The 00 and 11 color cases each use a four-control pattern. Count the same-color flags into the three-qubit counter.

**Cell four has c = 2 friends.** The die threshold is therefore 4 − 2 = 2.
-->

## Die below threshold, as control patterns {#compare}

::: {#l3-compare}
:::

<!--
The worked die is one, encoded 00001. With threshold two, faces zero and one pass.

These disjoint face patterns are the Boolean predicate die < 2. The next slide combines each face pattern with the required count and occupied bit into one control pattern. **We do not need to retain one comparison flag per threshold.**
-->

## Five cases, one flip flag {#multiplex}

::: {#l3-multiplex}
:::

<!--
The count may be in superposition. For each possible c, combine occupied = 1, count = c, and each face below 4 − c as a joint control pattern on one flip flag.

These cases are mutually exclusive. The rows are logical cases, not five allocated flag qubits. Four friends has threshold zero and contributes no toggles.

Our trace follows the c = 2, die = 1 case. The center stone's flip flag becomes one.
-->

## Read old colors, write new colors {#old-new}

::: {#l3-old-new}
:::

<!--
Copy the old color bits into a fresh zeroed color register using CNOTs. This copies computational-basis labels: in superposition the registers become entangled, not independent clones of an unknown quantum state.

Then each cell computes its flip flag from old colors, toggles its destination color, and clears its scratch. Logical simultaneity does not require storing all nine flags.

**In our trace, cells four and six flip.** The final board has Black at cells one, three, and six; White at cell four.

Keep one occupancy register and three nine-qubit color registers: 36 state qubits. Move records make occupancy updates reversible. Lesson 4 examines the information that has to survive.
-->

## Eight qubits borrowed from the shared pool {#scratch}

::: {#l3-scratch}
:::

<!--
The event uses four same-color flags, a three-bit count, and one flip flag: **eight qubits**. After each cell's destination color is toggled, reverse the flag and count computations.

The whole oracle shares a thirteen-qubit pool: rank-select needs thirteen, this event needs eight, and terminal counting uses the pool too. The pool size is the peak requirement, not the sum across blocks.

Only scratch returns to zero here. Dice, move indices, ranks, and retained colors are records that A† will use.
-->

## Assemble the two rounds {#round}

::: {#l3-round}
:::

<!--
One round is select-and-place Black, select-and-place White, then the event.

The first round's ranks 4 and 1 select cells 4 and 1. The second round's ranks 2 and 3 select cells 3 and 6. Its event produces the final board shown at right.

The Qiskit calls illustrate composition after the subcircuits and wire lists have been built. **Each round maps to its own rank, die, move-record, and destination-color registers.** Repeating a circuit on the same wire list would not supply fresh randomness or a fresh destination.
-->

# Line 10: mark the terminal payoff {#seg-payoff}

## Count the final colors {#counters}

::: {#l3-counters}
:::

<!--
The final program line returns Black > White. Scan the occupied cells, incrementing one counter for Black and the other for White.

Our trace gives **Black three, White one**. The counters are temporary: use them to toggle the payoff, then run their increments backward while the final board is unchanged.
-->

## A comparator includes unreachable inputs {#payoff-compare}

::: {#l3-payoff-compare}
:::

<!--
The comparator's truth table: forty-five blue entries where Black > White. A tie leaves the payoff at zero.

**Our rollout reaches only the outlined diagonal, the four-stone boards.** Our trace is (3, 1): payoff one.

A count of Black stones and the test Black > 2 would do the same job here. We keep the general comparator so its measured counts stay comparable.
-->

# Count the circuit and check the result {#seg-count}

## How many qubits? {#vote-qubits}

::: {#l3-vote-qubits}
:::

<!--
We already know the ninety dice qubits and thirty-six state qubits. Estimate the total after adding ranks, move records, shared scratch, and the payoff.

Ask people to explain one term in their estimate before advancing.
-->

## Where the 169 go {#qubit-map}

::: {#l3-qubit-map}
:::

<!--
90 dice + 36 state + 16 move records + 13 ranks + 13 scratch + 1 payoff = **169 qubits**.

The four move indices each use four bits. The rank widths are 4, 3, 3, 3. Scratch is shared across blocks; it is counted once. This is 155 record qubits, thirteen scratch, and one payoff.

The QCE26 benchmark reports 9,768 gates and depth 3,079 before decomposition into a native gate set. These are implementation-specific circuit counts, not runtime or a lower bound. State preparation is part of a full call; changing a preparation or comparator requires recounting.
-->

## Check the trace, then the distribution {#tested}

::: {#l3-tested}
:::

<!--
Our shared trace ends at Black three, White one, payoff one. The same explicit ranks and dice must produce that board in the classical rollout and the reversible body.

The reported validation compares 256 sampled branches bit for bit. The Monte Carlo result uses 1,000 seeded basis-circuit runs: .281 ± .028 is a 95% interval, containing the exact enumeration result .271.

**These are preparation-free basis emulations, not a full coherent simulation or hardware execution.** They check sampled transition and payoff behavior. Check preparation amplitudes and scratch restoration separately; matching sampled outputs alone does not establish either property.
-->

# Hand to Lesson 4 {#seg-handoff}

## It reverses. Does it simulate the right game? {#forward-only}

::: {#l3-forward}
:::

<!--
We implemented the forward choices: old and new colors apart, selection scratch cleared before placement, and explicit randomness retained.

A unitary and its exact inverse return the input even if the forward computation implements the wrong transition rule. **A round-trip test alone cannot catch the wrong game.**

Lesson 4 changes the ordering, compares the resulting boards, and explains why the records and cleanup boundaries we used today are needed.
-->

## Continue to Lesson 4 {#next .bare}

::: {#l3-qr}
:::

<!--
Continue directly to Lesson 4. Its first experiment asks whether changing the forward ordering changes the game, even when inversion is exact.

Section III of the QCE26 paper gives the decoder and composition statements. The course site remains available through the breadcrumb and QR code.
-->
