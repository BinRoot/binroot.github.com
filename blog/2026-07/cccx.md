---
title: Spatial languages
pagetitle: "Spatial languages: writing code in 2D"
author: "[Nishant Shukla](https://shukla.io)"
date: 2026-07-22
description: "Writing code in 2D: a spatial programming language with vertical operands, quantum uncomputation puzzles, and a 3-bit adder in a single 2D expression."
keywords:
  - spatial programming language
  - 2D programming language
  - quantum computing
  - uncomputation
  - borrowed ancilla
  - Toffoli gate
  - CCCX
  - reversible computing
  - ripple-carry adder
  - Qiskit
  - Befunge
  - Orca
  - Hexagony
  - ladder logic
---

I guess expressions don't really need to read left-to-right on a line.

Why can't `a < b` be written vertically too?

```spatial
a
<
b
```

All this time we've been writing expressions in 1D space, but what happens when we unlock an extra dimension?

Of course the IDE and parser need to play nicely for all this to work.
Even then, what's the point? Well, let's take a look at these examples below.

## 3-arity functions

We don't really see 3-arity functions written in infix notation much.

For example, in Python (and most other languages), you can `and` 3+ things at once:

```python
x and y and z
```
Technically, that's just composing multiple binary functions together.

Even this shortcut in Python to simplify `(a < b) and (b < c)` is more of the same thing:

```python
a < b < c
```

Now, let me introduce you to a funny little operator I've been playing with called `andFlip`, which motivates the need for a true 3-arity infix notation. First, here's the definition of the function:

```python
def andFlip(args):
    if args[0] and args[1]:
        args[2] = not args[2]
    return args[2]
```

It takes 2 inputs and flips the target if both inputs are true. 

There's just no good way to write this with infix notation.
But let's try anyways! 

Define `@@` to be the infix symbol for the `andFlip` operator. What does it look like in practice?

### Method 1: the standard way

One option is to curry `andFlip`: the infix `@@` takes 2 args and returns a function awaiting the 3rd, like so:

```python
(a1 @@ a2) a3
```

Yeah, that's alright. It works. But...

### Method 2: the goofy way

Forget what you know about code for a second. 
If I could flick a magic wand, I'd wish for the 3-arity notation to look like this:

```spatial
   a3
a1 @@ a2
```

Might as well make use of the y-axis, right?

It makes chaining so much easier:

```spatial
t1 = 0
t2 = 0

   t1    t2
(x @@ y) @@ z
```

In the chain, `x @@ y` toggles `t1`, and `t1` continues the chain `t1 @@ z`, which toggles `t2`.

That's a successful three-way toggle, where all `x`, `y`, and `z` must be true for the target to toggle.

Btw, since we're working in 2D space now, the following expression,

```spatial
  t1
x @@ y
```

is equivalent to:

```spatial
x @@ y
  t1
```


### Example: my chicken coop door

Consider the automatic door I've installed on my chicken coop.

![The coop's automatic door (right) and its controller box](coop.jpg)

With just a photometer and its internal clock, the microcontroller tracks:

- `x` -- the photometer crossed its dusk/dawn threshold
- `y` -- the reading has held steady for five minutes
- `z` -- the gate has not recently toggled

The door toggles only when all three line up. A passing cloud trips `x` but never outlasts `y`, so the door stays put.

<div class="coopchart"></div>

The coop's controller is the same chained expression from above:

```spatial
t1 = 0
t2 = 0

   t1    t2
(x @@ y) @@ z
```

You might be wondering, why not just write `x and y and z`? Because then the door would mirror the sensors, swinging right back the moment a condition fades. `@@` toggles in place: the door moves once and stays, and the partial answer lands in `t1`, a scratch bit. 

Spatial languages get even more fascinating when we introduce vertical chaining!

## Vertical chaining

That mutable variable `t1` disqualifies the expression from being called a "pure function". But can we fake it? Can we reset `t1` back, all within the same expression?

I'd like to introduce vertical chaining through two puzzles.

### Puzzle 1: reset `t1` back to 0

As mentioned, in the chaining examples above, the variable `t1` is mutable. 

Here's a puzzle: how can we reset it back to `0`, so the expression "appears" immutable?

You may be tempted to just append the statement `t1 = 0` and call it a day, but the goal of the puzzle is to do it all within the same expression.

Give it a shot before you scroll down!

::: hexpath
:::

Here's the answer. Since `t1` can be reset by repeating the same thing that was used to toggle it, we can combine expressions into a larger 2D one, like so:

```spatial
t1 = 0
t2 = 0

(x @@ y) @@ z
   t1    t2
(x @@ y)
```

Ok, I'm probably blowing your mind right now.

The data flow is still as you'd expect in a programming language, left-to-right and top-to-bottom.
If `x` and `y` are true, the first `x @@ y` flips `t1` and then the second `x @@ y` resets it.
Otherwise, both leave `t1` untouched. 

This puzzle actually models the `CCCX` gate in quantum computing, where [uncomputing](https://en.wikipedia.org/wiki/Uncomputation) the intermediate `t1` value within the same circuit is an important requirement.


### Puzzle 2: reset the temporary variable back to the original value

If `t1` starts off with an unknown boolean value `n`, then it gets more complicated.

```spatial
t1 = n
t2 = 0

   t1    t2
(x @@ y) @@ z
```

The same trick above to reset `t1` back to its original value won't work.

See for yourself: when `t1 = 1` and `x`, `y`, and `z` are all true, then `t2` remains `0`, which is incorrect.

```spatial
t1 = 1
t2 = 0

(1 @@ 1) @@ 1
   t1    t2
(1 @@ 1)
```

So, what's the answer?

::: hexpath
:::

Tada!

```spatial
t1 = n
t2 = 0

   t1    t2
(x @@ y) @@ z
   t1    t2
(x @@ y) @@ z
```

Absolutely legendary. This single 2D expression resets `t1` back to `n` while producing the correct result for `t2`. 

This puzzle is inspired by the concept of resetting a [borrowed ancilla](https://arxiv.org/abs/quant-ph/9503016) in quantum computing. `t1` is the "borrowed" or "dirty" value that remains unchanged. 

Here's the same circuit in Qiskit:

```python
from qiskit import QuantumCircuit, QuantumRegister

x = QuantumRegister(1, "x")
y = QuantumRegister(1, "y")
z = QuantumRegister(1, "z")
t1 = QuantumRegister(1, "t1")  # starts in unknown state n
t2 = QuantumRegister(1, "t2")  # target, starts at 0

qc = QuantumCircuit(x, y, z, t1, t2)

qc.ccx(x, y, t1)
qc.ccx(t1, z, t2)
qc.ccx(x, y, t1)
qc.ccx(t1, z, t2)
```

I'd argue that the Qiskit implementation is harder to follow, because of the back-and-forth variable tracking.

By the way, here's the corresponding quantum circuit diagram:

:::qcircuit
```
wires: x, y, z, t1 = n, t2 = 0
outputs: x, y, z, n, x·y·z
ccx x y t1
ccx t1 z t2
ccx x y t1
ccx t1 z t2
```
:::

In some ways, this circuit diagram is easier to follow, but probably not scalable.

The spatial language syntax is the best of both worlds.

## Defining new operators

First, meet `@@`'s little sibling. A single `@` takes one condition instead of two: `x @ y` flips `y` whenever `x` is true.

With `@` and `@@` in hand, we can define new operators, spatially. The left side of `:=` is a shape, and the right side is what that shape rewrites to:

```spatial
b maj c        (a @ b) @@ (a @ c)
  a       :=            a
```

This strange operator flips both `b` and `c` when `a` is true, and then flips `a` if both sides came out true. 
That computes `a ^ ((a^b) & (a^c))` into `a`, which happens to equal the majority of the three inputs, which is why this operator is called `maj`.

:::maj
:::

And `maj` is no arbitrary choice. It's the MAJ gate from the [classic quantum ripple-carry adder](https://arxiv.org/abs/quant-ph/0410184), where the majority of (carry, bit, bit) is the next carry.

You may have noticed that `maj` leaves `b` and `c` dirty, holding `a^b` and `a^c`, the same kind of mess as our borrowed `t1`.
To clean up, we'll also introduce `uma`, the partner operator. The name comes from the same adder paper, "UnMajority and Add": it un-majorities `c`, restores `a`, and adds the sum onto `b`:

```spatial
c uma b        ((b @@ a) @ a) @ b
  a       :=        c
```

Let's see what happens when we wire them up.

## 3-bit adder

We can build a 3-bit adder out of three `maj`s that ripple the carry up through the `a` wires, with the final `@` dropping the carry-out on `c3`, and finally one line of `uma`s resetting all the scratch wires:

```spatial
c0 = 0
c3 = 0

(b2 maj (b1 maj (b0 maj c0))) @ c3
    a2      a1      a0
((  .       uma b2) uma b1) uma b0
                            c0
```

That's a full 3-bit adder in a single 2D expression that also cleans up after itself. The `b` wires now hold `a + b`, `c3` holds the carry-out, and `c0` and the `a` wires come back exactly as we found them. (Set `c0 = 1` and you get `a + b + 1` for free.)

Notice the two lines mirror each other. The top nests rightward down to `b0` and ripples the carry back up; the bottom nests leftward down to `b2` and unwinds back out. The shared `a1` and `a0` labels are the pivots, each serving the `maj` above it and the `uma` below it, and the `.` is a vertical pipe, standing for whatever wire sits directly above it, here `a2`. The carry chain is stitched together vertically: the uncompute touches the compute, just like in the puzzles. 

## Speedrunning other spatial languages

Here's a quick tour of a few more spatial languages.

### Befunge

The grandparent of 2D languages ([Befunge](https://esolangs.org/wiki/Befunge), 1993): the instruction pointer physically travels the grid, and `>v<^` steer it. Hello world bounces off the walls:

```befunge
>              v
v"Hello World!"<
>:v
^,_@
```

### Orca

[Orca](https://100r.co/site/orca.html) is a livecoding sequencer where every letter is an operator that reads its neighbors: `A` adds the value to its left and the value to its right, and writes the sum directly below itself. Sound familiar?

```orca
1A2
.3.
```

### Racket #2d

A real, shipping language extension: [Racket's `#2dcond`](https://docs.racket-lang.org/2d/) is a `cond` evaluated in two dimensions. The left column tests `b`, the top row tests `a`, and the cell where both are true runs.

```racket2d
#lang 2d racket

(require 2d/cond)

(define (same? a b)
  #2dcond
  ╔═════════════╦═══════════════════════╦═════════════╗
  ║             ║       (pair? a)       ║ (number? a) ║
  ╠═════════════╬═══════════════════════╬═════════════╣
  ║ (pair? b)   ║ (and (same? (car a)   ║     #f      ║
  ║             ║             (car b))  ║             ║
  ║             ║      (same? (cdr a)   ║             ║
  ║             ║             (cdr b))) ║             ║
  ╠═════════════╬═══════════════════════╬═════════════╣
  ║ (number? b) ║          #f           ║   (= a b)   ║
  ╚═════════════╩═══════════════════════╩═════════════╝)
```

### Hexagony

[Hexagony](https://esolangs.org/wiki/Hexagony) runs on a pointy-topped hexagonal grid, like a certain background you may have noticed. Six instruction pointers start at the six corners. Hello world:

```hexagony
   H ; e ;
  l ; d ; *
 ; r ; o ; W
l ; ; o ; * 4
 3 3 ; @ . >
  ; 2 3 < \
   4 ; * /
```

### Ladder logic

[Ladder logic](https://en.wikipedia.org/wiki/Ladder_logic) is how PLCs run factories (and, done properly, chicken coop doors): each rung is a relay circuit read rail-to-rail, and parallel branches are OR. This classic seal-in rung computes `Run = (Start OR Run) AND (NOT Stop)`:

```ladder
--+----[ ]--+----[\]----( )
  |   Start |   Stop    Run
  |         |
  +----[ ]--+
       Run
```

And an honorable mention for the most successful spatial language of all time: the spreadsheet, where every formula lives at a 2D coordinate and reads its neighbors.

## "This Is Water"

If you know me, you know I love bringing up the [Sapir-Whorf hypothesis](https://en.wikipedia.org/wiki/Linguistic_relativity), which proposes that language shapes the way you think:

- [Some Australian Aboriginal languages](https://en.wikipedia.org/wiki/Guugu_Yimithirr_language) have no words for left and right, only compass directions, so their speakers always know which way north is. 
- Russian has two separate words for blue, so Russians are [faster at telling two blues apart](https://pmc.ncbi.nlm.nih.gov/articles/PMC1876524/) when the shades straddle that word boundary. 
- Haskell is purely functional, so you start recognizing monads everywhere you go. That sort of thing.

Likewise, I believe technology shapes which languages emerge. 

- A shell terminal forces us to write commands left-to-right, so we think of code horizontally instead of vertically. 
- Most keyboards are built for English and the standard ASCII symbols, so we think in those symbols :). 

Being aware of our biases is a justified mental exercise, at least according to David Foster Wallace, who delivered a commencement speech titled *[This Is Water](https://en.wikipedia.org/wiki/This_Is_Water)*. Though his speech was less about ancilla uncomputation in quantum circuits and maybe more about growing up and being compassionate, you get the point. By challenging our habits, we can explore new ideas.
