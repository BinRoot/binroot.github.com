---
pagetitle: "Lesson 4: Reversible by design | Quantum Oracle Engineering"
description: "Design and test a reversible quantum oracle: preserve the inputs cleanup needs, return borrowed scratch to zero, distinguish semantic correctness from invertibility, and build the full amplitude-estimation iterate. Includes executable Qiskit examples."
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

::: {#l4-context}
:::

<!--
Last time we built the rollout circuit. **Today we'll run it backward and see why we kept all that extra data.**

**The inverse is one line of code. Getting the forward computation right takes more work.**
-->

## One line of code {#one-line}

<div class="l2-fig"><svg class="l4-demo" data-scene="mirror" viewBox="0 0 760 260" width="1000"></svg></div>

<div class="l4-code">

```python
A_dagger = A.inverse()
```

</div>

<!--
**A.inverse() reverses the gate order and replaces each gate with its inverse.** Qiskit handles that part for us.

**It will also happily undo the wrong computation.** It has no idea what the Sway rules are, or whether we cleared our scratch at the right time.

A includes preparation, the rollout, and the payoff. This assumes a unitary circuit; measurements and resets stay outside it.
-->

## Three questions to answer {#two-habits}

<div class="l2-fig"><svg class="l4-demo" data-scene="objectives" viewBox="0 0 760 300" width="1000"></svg></div>

<!--
Lesson 3 made three choices: keep the old colors, clear the selector before placing a stone, put randomness in registers. Today each becomes a question about that circuit.

**What must the inverse still read? When can scratch return to zero? How do we check the circuit plays the right game?** The checks are small Qiskit circuits that run, on tiny boards.
-->

# Keep the inputs that undo needs {#seg-keep}

## Why three color registers? {#one-board}

<div class="l2-fig"><svg class="l4-demo" data-scene="boards" viewBox="0 0 760 300" width="1000"></svg></div>


<!--
Same moves and dice as Lesson 3. These pictures show the board at the round boundaries. Later placements can still write to the current color register.

**Two rounds use three color registers: 27 qubits.** Occupancy has its own nine qubits.

**Could we save 18 qubits by changing the colors in place?** Let's try it.
-->

## Predict the second stone {#find-bug}

<div class="l2-fig"><svg class="l4-demo" data-scene="predict" viewBox="0 0 760 300" width="1000"></svg></div>


<!--
Let's use just two stones: Black at cell 0, White at cell 1. Their dice are 0 and 3. Both have zero friendly neighbors.

**A stone flips when its die is less than 4 minus its friendly neighbors.** We're numbering cells and die faces from zero; the die has faces 0–19.

**Cell 0 flips to White. What should cell 1 do?** And what happens if it reads that neighbor after the flip?

Give everyone about 30 seconds before advancing.
-->

## Cell 1 read a flipped neighbor {#read-flipped}

<div class="l2-fig"><svg class="l4-demo" data-scene="inplace" viewBox="0 0 760 300" width="1000"></svg></div>

<!--
**Reading the old board, cell 1 should flip to Black.** White sees Black, so it has zero friends and 3 < 4.

**Update cell 0 first, and the same dice leave cell 1 White.** It now sees a White neighbor. One friend, so 3 < 3 is false.

**Every decision needs to read the old colors.** We can run the gates one after another and still follow that rule.
-->

## Cleanup can read a changed input too {#stranded}

<div class="l2-fig"><svg class="l4-demo" data-scene="stranded" viewBox="0 0 760 300" width="1000"></svg></div>


<!--
Here's another problem with changing the input. Start with two Black stones and a work bit at zero.

**The equality check writes 1 because the colors match.** Now flip the first stone and run the check again. The colors differ, so we XOR zero into the work bit.

**Changing the input before cleanup leaves the work bit at 1.** The second comparison is answering a different question.

Writing the new color somewhere else keeps the original comparison available to undo.
-->

## Occupancy can update in place {#occ-in-place}

::: {#l4-occ}
:::


<!--
Occupancy is simpler. These are the same four moves from Lesson 3: 4, 1, 3, 6. A color flip doesn't change whether a cell is occupied.

**Keep the move index, and we can undo the placement.** XOR the occupancy bit at that index again. The sentinel index does nothing.

**Going backward, remove the stone before clearing its move index.** Later operations have to be undone first, of course.
-->

## Two inputs, one visible result {#merge}

::: {#l4-merge}
:::

<!--
Both boards ask for rank zero, the first empty cell. That's cell 0 on the top board and cell 1 on the bottom.

**Both placements give the same visible board.** From that board alone, how would we know which input to go back to?

**The saved move index keeps the two cases distinct.** A unitary needs that distinction somewhere. It doesn't mean this is the only way to store it.
-->

## Records persist; scratch is borrowed {#keep-rule}

::: {#l4-records}
:::


<!--
**Records stay around until the inverse has finished using them.** That's our dice, boards, move indices, and ranks.

**Scratch goes back to zero before the next block borrows it.** We can clear it while the inputs that produced it are still available.

The selector borrows four bits each for its prefix, equality check, and temporary index, plus one match flag.

We copy the temporary index into a move record, then clear the temporary copy. This is our chosen storage layout; other designs could recompute some records.
-->

# Return scratch before the next borrower {#seg-zero}

## Thirteen qubits, borrowed repeatedly {#pool}

::: {#l4-pool}
:::


<!--
The selector needs 13 work qubits. One event cell needs eight. The payoff needs nine.

**The selector, event, and payoff can share the same 13 qubits.** The picture shows one borrower of each kind. Each dip to zero is a cleanup boundary.

The rollout repeats this pattern. Even neighboring event cells take turns borrowing the pool.

**The next block expects those qubits to be zero.** A circuit can still be reversible with dirty work, but the next borrower may compute the wrong result.
-->

## Place first, or clear the counter first? {#order-vote}

::: {#l4-order-ask}
:::


<!--
Back to round 2. Seven empty cells, rank two, and we've already saved cell 3 as the move.

**The scan leaves the counter at seven. Do we place the stone first, or clear the counter first?**

**What will the counter hold in each case?** Take a moment before advancing.

We're following just the counter here; the full selector clears its other work bits too.
-->

## Undo must see what do saw {#undo-reads}

::: {#l4-order-answer}
:::

<!--
**Place first, and the counter ends at one.** There are only six empty cells left: seven increments, six decrements.

**Clear the counter first, and it returns to zero. Then place using the saved index.** All seven empties were still there for the seven decrements. Clearing undoes only the scratch; the stone is the result, and the global inverse undoes it later.

**Undo has to see what do saw.** The downloadable demo runs both orders on this board with a real four-bit counter.
-->

## The next borrower assumes zero {#dirty-game}

<div class="l2-fig"><svg class="l4-demo" data-scene="dirty" viewBox="0 0 760 300" width="1000"></svg></div>

<!--
Try a new rank-two query on the same board, but start the counter at one.

**The clean counter picks cell 3. The dirty counter picks cell 2.** Every comparison is shifted by one.

**Rank zero doesn't find a match at all.** On this board the dirty counter never reaches zero or wraps around.

That's one leftover bit changing the next move. We're looking at the decoder here, not estimating a whole game's win rate.
-->

## Compute, copy the bit, uncompute {#payoff-cleanup}

<div class="l2-fig"><svg class="l4-demo" data-scene="payoff" viewBox="0 0 760 300" width="1000"></svg></div>

<!--
W counts Black, counts White, and checks whether Black has more stones.

```python
circuit.compose(W, inplace=True)
circuit.cx(win_flag, payoff)
circuit.compose(W.inverse(), inplace=True)
```

**Compute the win flag, copy it into the payoff, then undo W.** The payoff starts at zero, so a CNOT does the copy.

**All nine work bits return to zero. The board and payoff stay.** Keep the board unchanged until cleanup finishes.

On a superposition, that CNOT can entangle the payoff with the board. We're copying a Boolean result, not cloning an arbitrary quantum state.
-->

# Test the meaning as well as the inverse {#seg-reveal}

## Three checks, three different claims {#every-branch}

<div class="l2-fig"><svg class="l4-demo" data-scene="tests" viewBox="0 0 760 300" width="1000"></svg></div>


<!--
**First, does the circuit agree with the classical rules?** Check the output, the inputs we promised to keep, and every scratch bit. Our tiny event has only four color inputs, so we check all four.

**Then check amplitudes, including phases.** Probabilities alone can hide a phase error. The demo also checks a superposition of those four inputs.

**Finally, does forward followed by backward restore the input?**

demo.py checks these little circuits, not the full 169-qubit statevector. A few sampled full rollouts wouldn't prove the whole oracle correct.
-->

## A round trip can pass the wrong game {#backward-forward}

<div class="l2-fig"><svg class="l4-demo" data-scene="roundtrip" viewBox="0 0 760 300" width="1000"></svg></div>

<!--
Start Black, White. **The in-place circuit gives White, White. The game required White, Black.** Even the scratch comes out clean on this branch.

Now run its inverse. **We get the original input back perfectly.** Both the correct and wrong circuits pass that check.

**A passing round trip doesn't tell us we played the right game.** We still need the comparison against the rules.
-->

# Put the complete oracle into Q {#seg-backward}

## One preparation, then repeated turns {#turn-of-q}

<div class="l2-fig"><svg class="l4-demo" data-scene="iterate" viewBox="0 0 760 300" width="1000"></svg></div>


<!--
**Prepare A once. Then each turn goes: mark the payoff, run A backward, reflect about all zero, run A forward.** Read the boxes left to right.

The payoff mark is Z on the payoff qubit. The zero reflection includes every input register, including work and payoff. The usual overall minus sign only changes a global phase here.

**A includes the randomness preparation, rollout, and payoff.** We need the inverse of all of it. That's the Q rotation from Lesson 2.
-->

## After the phase mark, zero is not the goal {#phase-mark}

<div class="l2-fig"><svg class="l4-demo" data-scene="phase" viewBox="0 0 760 300" width="1000"></svg></div>


<!--
Here we use two uniform data bits. We win only when both are zero, so a = 1/4.

**After marking the payoff, should A backward give us all zero again?** Pause, then advance for the answer.

**Without the mark, yes. With the mark, this example gives all zero only a quarter of the time.** Here a = 1/4, so that probability is (1 − 2a)².

**The phase mark changed the state we're trying to undo.** The inverse still works.

Finish the turn with the zero reflection and A. The good probability goes from 1/4 to 1, just like Lesson 2.
-->

# Count the cost and review a design {#seg-count}

## Records and scratch: 169 qubits {#map}

::: {#l4-map}
:::


<!--
**169 qubits: 155 records, 13 scratch, one payoff.** This is the paper's 3×3, two-round layout. We haven't shown that it's the smallest possible allocation.

The records are 90 dice qubits, 36 for state, 16 for move indices, and 13 for ranks. State includes occupancy and all three color registers.

**Most of the storage is the history we're keeping.** Clearing scratch helps, but saving much more means finding a way to release or recompute some of those records.
-->

## Larger boards and longer rollouts {#growth}

<table class="l4-table">
<thead><tr><th>Board · rounds</th><th>Qubits</th><th>Gates</th></tr></thead>
<tbody>
<tr><td>3×3 · 2</td><td>169</td><td>9,768</td></tr>
<tr><td>5×5 · 5</td><td>916</td><td>76,720</td></tr>
<tr class="focus"><td>10×10 · 5</td><td>3,363</td><td>481,201</td></tr>
<tr class="focus"><td>10×10 · 10</td><td>6,503</td><td>793,901</td></tr>
<tr><td>20×20 · 10</td><td>25,189</td><td>6,072,641</td></tr>
</tbody>
</table>



<!--
These are counts for one forward call, from the paper's resource and scaling tables.

They're before native-gate decomposition and fault-tolerance overhead, so they aren't hardware timings.

**Look at the two 10×10 rows. Twice as many rounds nearly doubles the qubits.** The gate count grows too, though setup and payoff work don't double.

**We pay for those gates again when we run backward.** Q also needs its reflections.

Back to Lesson 1: **What does each oracle call cost?**
-->

## Review the order, not just the gate list {#five-of-five}

<div class="l2-fig"><svg class="l4-demo" data-scene="checklist" viewBox="0 0 760 300" width="1000"></svg></div>

<!--
One last check. **We compute a win flag, change the board, then undo the comparison. What goes wrong?**

Give everyone about 45 seconds to suggest a fix.

**Cleanup needs the original board. Copy the flag to payoff and undo the comparison before changing the board.** Or keep the old board until cleanup is done.

**Calling inverse() won't fix the order for us.**
-->

# Try it, then reduce the history {#seg-handoff}

## Run the examples {#next}

<div class="l4-code">

```sh
uv run demo.py
```

</div>

<div class="l4-links">
<a href="demo.py" download>Download demo.py</a><br>
<a href="../building-a-quantum-oracle/">Lesson 3</a> · <a href="../">Course</a>
</div>


<!--
**Download demo.py and run it with uv.** It'll install Qiskit and check the examples we've just used.

These are small circuits we can inspect, including the two bugs and one full turn of Q. The code doesn't simulate all 169 qubits.

**Next we'll look at garbage collection: which records can we release early, and what would we have to recompute?**
-->
