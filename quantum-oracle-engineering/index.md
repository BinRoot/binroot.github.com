# Quantum Oracle Engineering

## A Programmer's Guide to Building the Right Oracle

::: {.venue}
A tutorial at [IEEE Quantum Week 2026 (QCE26)](https://qce.quantum.ieee.org/2026/), Toronto.
Taught by [Nishant Shukla](https://shukla.io).
:::

::: {.intro}
Most quantum speedup claims depend on an oracle that exists only on paper.
This course teaches the craft of building practical quantum circuits from scratch.
Each lesson debunks a commonly held belief.
:::

:::: {.lessons}

::: {.lesson}
### Myth 1. "Quantum computing is a natural fit for AI."

- most AI problems don't qualify
- CPU, GPU, **QPU**: different jobs
- the speedup is narrow: **sampling**
- **three questions** to ask first
- famous overpromises, dissected
- knowing when to walk away

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson}
### Myth 2. "Monte Carlo gets a quadratic quantum speedup."

- the folklore, with **fine print**
- the trick: **precision on averages**
- **Go** flunks: wrong kind of dice
- **bandits** flunk: too cheap to matter
- so we invented a game
- **close calls** are where quantum wins

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson}
### Myth 3. "It's just an implementation detail."

- "**assume the oracle exists**," says every paper
- we stop assuming and build it
- a game board made of qubits
- all the randomness, **loaded up front**
- picking moves without **skewing the odds**
- the **scratch work** starts piling up

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson}
### Myth 4. "Reversibility is just bookkeeping."

- the finished circuit must **run backward**
- every cell updates **at once**, or bugs
- the **self-flip trap**
- **snapshot** the board, then swap
- one qubit holds the score
- the full bill, in qubits

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson}
### Myth 5. "Data you never read can't hurt you."

- there is **no delete**
- leftover junk stays **tied to your answer**
- and quietly poisons it
- forgetting means **undoing history**
- compute, use, **uncompute**
- clean scratch still doesn't mean right answer

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 6. "Measurement destroys the computation."

- the rule every course teaches
- production circuits break it daily
- **measure the garbage** on purpose
- patch the damage with **phase fixes**
- **cheapest eraser** there is
- **machine-checked** rules for when it's safe

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 7. "If every step is classical, the process is classical."

- every step runs fine classically
- all of them together: **impossible**
- the **memory bill** grows per step
- **zero or linear**, nothing between
- a **tabletop test** catches fakers
- fakers fail it fast

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 8. "If you've tested every input, it works."

- circuits that ace every test, wrongly
- **hidden phases**, invisible to truth tables
- full checking costs **2^n**
- three tiny cautionary circuits
- returning a **borrowed qubit** isn't enough
- you need **proof, not vibes**

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 9. "If you return it as you found it, no harm done."

- **contracts** for things nobody may inspect
- clean, borrowed, **conditionally clean**
- promises checked where blocks meet
- the compiler keeps a **ledger**
- Rust's **borrow checker**, but for qubits
- mismatched promises, no deal

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 10. "The tools will catch up."

- checkers read circuits **gate by gate**
- works great, until **Toffoli** walks in
- then rulebooks blow up exponentially
- a **theorem**, not a hunch
- **escape hatch**: one proof per circuit family
- know which side of the wall you're on

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 11. "Someone would have noticed by now."

- nobody can eyeball a quantum circuit
- so every block ships with a **seal**
- a **proof kernel** replays it in milliseconds
- strangers' code, safely composed
- catches sneaky changes between versions
- **npm, but with receipts**

<button disabled>Coming soon</button>
:::

::: {.lesson}
### Myth 12. "Scale is all you need."

- the **reigning faith** of the AI era
- what the evidence says
- where quantum could fit in AI
- **chapter 1's questions**, aimed at the hype
- **wall-clock math**, not vibes
- how to judge the **next miracle**

<button disabled>Coming soon</button>
:::

::::

::: {.agenda}
### Live Tutorial Agenda

Session 1 (90 minutes): Myths 1 and 2, identifying a problem worth accelerating.

Session 2 (90 minutes): Myths 3 and 4, building the rollout oracle.

For practitioners and researchers comfortable with qubits, controlled gates,
and circuit diagrams. A pre-read on amplitude estimation is included in the materials.
:::

::: {.pagefoot}
[Nishant Shukla](https://shukla.io) · [nishant@shukla.io](mailto:nishant@shukla.io)
:::
