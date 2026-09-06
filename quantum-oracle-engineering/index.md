# Quantum Oracle Engineering

## A Programmer's Guide to Building the Right Oracle

::: {.venue}
[IEEE Quantum Week 2026 (QCE26)](https://qce.quantum.ieee.org/2026/), Toronto, Canada.
:::

<div class="spectrum" aria-hidden="true"></div>

::: {.intro}
Most quantum speedup claims depend on an oracle that exists only on paper.
This course teaches the craft of building practical quantum circuits from scratch.
:::

::: {.subscribe}
<form class="subscribe-form">
<input type="email" required autocomplete="email" inputmode="email" enterkeyhint="send" placeholder="you@example.com" aria-label="Email address">
<button type="submit">Notify me</button>
</form>
:::

::::: {.lessons}

<p class="act">Choose the problem, build the oracle</p>

:::: {.act-group}

::: {.lesson data-lesson="qoe-lesson-01" style="--accent: #456AAD"}
### 1. A different computer

<figure class="art"><a href="a-different-computer/" tabindex="-1" aria-hidden="true"><img src="img/myth01.png" alt="A robot scratching its head while holding a quantum processor chip" width="600" height="600" loading="lazy"></a></figure>

- **CPU, GPU, QPU**: three devices, three workloads
- the QPU's job: **fewer samples** for an average
- **Θ(1/ε)** queries in place of **Θ(1/ε²)** samples
- **three questions**: task randomness, precision, oracle cost
- Grover on a database loses to **data loading**
- break-even: **t_oracle < t_roll / (C·P·g)**

<div class="act"><a class="deck" href="a-different-computer/">View slides</a></div>
:::

::: {.lesson data-lesson="qoe-lesson-02" style="--accent: #4D8C55"}
### 2. The Monte Carlo speedup

<figure class="art"><img src="img/myth02.png" alt="Two dice tumbling across a green felt table" width="600" height="600" loading="lazy"></figure>

- a **query count** is not a runtime
- the payoff qubit's angle **encodes the win probability**
- **amplitude estimation** reads that angle to precision ε
- best of k arms: **Ω(k/ε²)** samples vs **Õ(√k/ε)** queries
- **Go** fails question 1, the **bandit** fails question 3
- **Sway**: gaps of 10⁻⁴ on a 32×32 board
- the same oracle shape fits an **epidemic model**

<button class="coming" disabled>Coming Sept 8</button>
:::

::: {.lesson data-lesson="qoe-lesson-03" style="--accent: #C35523"}
### 3. Ship it

<figure class="art"><img src="img/myth03.png" alt="An open crate of machine parts sitting on an unread blueprint" width="600" height="600" loading="lazy"></figure>

- the contract: board, two moves, randomness tape, **payoff qubit**
- one round: Black places, White places, **every stone rolls**
- the **register layout** in Qiskit
- a uniform move choice over the **legal cells**
- the d20 as a **5-bit comparison** against a neighbor count
- 3×3, two rounds: **169 qubits**

<button class="coming" disabled>Coming Sept 15</button>
:::

::: {.lesson data-lesson="qoe-lesson-04" style="--accent: #F03836"}
### 4. Reversible by design

<figure class="art"><img src="img/myth04.png" alt="A cassette tape with its ribbon spooled out in a loop behind it" width="600" height="600" loading="lazy"></figure>

- amplitude estimation runs the rollout **forward and backward**
- decide from the old board, write to a **shadow board**, keep the old one
- **in-place updates** read a neighbor that already flipped
- erase **move-selection scratch** before the board changes
- one **payoff qubit**, everything else inverted
- the **qubit and gate count** as the board grows

<button class="coming" disabled>Coming Sept 22</button>
:::

::::

<p class="act">Make it correct</p>

:::: {.act-group}

::: {.lesson data-lesson="qoe-lesson-05" style="--accent: #7E874C"}
### 5. Garbage collection

<figure class="art"><img src="img/myth05.png" alt="A trash can overflowing with bags that were never hauled away" width="600" height="600" loading="lazy"></figure>

- reversible circuits have **no delete**
- entangled scratch **breaks interference**
- **Bennett**: compute, copy out, uncompute
- the inverse must see the **same inputs** as the forward pass
- **peak scratch** sets the qubit count
- clean scratch is **necessary, not sufficient**

<button class="coming" disabled>Coming Sept 29</button>
:::

::: {.lesson data-lesson="qoe-lesson-06" style="--accent: #B6D792"}
### 6. Measure to erase

<figure class="art"><img src="img/myth06.png" alt="A cracked jar of water patched with bandages, still leaking" width="600" height="600" loading="lazy"></figure>

- the textbook says **never measure** mid-circuit
- compilers measure scratch to **reclaim qubits**
- Gidney's **AND†**: an X-basis measurement instead of a Toffoli
- a random sign, fixed by **one phase gate**
- **half the T gates** of an adder
- safe when scratch holds a **basis function** of the data

<button class="coming" disabled>Coming Oct 6</button>
:::

::: {.lesson data-lesson="qoe-lesson-07" style="--accent: #761D01"}
### 7. Calling conventions

<figure class="art"><img src="img/myth07.png" alt="Interlocking gears meshing edge to edge, every tooth having to fit its neighbor" width="600" height="600" loading="lazy"></figure>

- three scratch classes: **clean, borrowed, conditionally clean**
- Qiskit passes the reuse condition as **unchecked convention**
- a block can **destroy its own condition**
- two correct blocks, one **unguaranteed boundary**
- **restoration types**: Hoare contracts over subspaces
- a 12-bit oracle: **20 qubits to 13**

<button class="coming" disabled>Coming Oct 13</button>
:::

::: {.lesson data-lesson="qoe-lesson-08" style="--accent: #D9EB4E"}
### 8. Proof-carrying circuits

<figure class="art"><img src="img/myth11.png" alt="A sealed jar of identical blue pills with a single red one inside" width="600" height="600" loading="lazy"></figure>

- truth tables **cannot see a phase**
- full-basis checking costs **2ⁿ**
- certificates replayed by a **Lean kernel**
- gate-by-gate checking needs **closure** under the gate set
- past **Toffoli**, assertions grow exponentially
- **one theorem per family**, checked in milliseconds

<button class="coming" disabled>Coming Oct 20</button>
:::

::::

<p class="act">Count it, test it, judge it</p>

:::: {.act-group}

::: {.lesson data-lesson="qoe-lesson-09" style="--accent: #966B55"}
### 9. Where the quantum lives

<figure class="art"><img src="img/myth09.png" alt="A hand pulling a book from a shelf, red light spilling from the gap" width="600" height="600" loading="lazy"></figure>

- a process that runs **step by step**
- between any two steps, **classical bits** would do
- no one classical carrier works for **all steps at once** (Bisio)
- the **SHIFTS channel**: one qubit in, two out, built to show it
- the quantum lives in the **memory between steps**

<button class="coming" disabled>Coming Oct 27</button>
:::

::: {.lesson data-lesson="qoe-lesson-10" style="--accent: #9598CA"}
### 10. All or nothing

<figure class="art"><img src="img/myth12.png" alt="One oversized box balanced on a stack of small ones: each piece is cheap, the whole is not" width="600" height="600" loading="lazy"></figure>

- running n copies **does not amortize**
- quantum memory: **zero or linear** in n, nothing between
- **log n and √n** scalings ruled out
- the same law for **preparing states**
- SHIFTS: at least **0.03 qubits per copy**
- a **theorem**, with constants

<button class="coming" disabled>Coming Nov 3</button>
:::

::: {.lesson data-lesson="qoe-lesson-11" style="--accent: #92BBA8"}
### 11. Test, don't trust

<figure class="art"><img src="img/myth08.png" alt="A basket of red apples with one rotten apple hidden in the middle" width="600" height="600" loading="lazy"></figure>

- a test with **single-qubit measurements** only
- a correct device passes **every time**
- q qubits of memory pass with probability at most **2^q^(1 − γ)^n^**
- too little memory fails **exponentially fast**
- the device stays a **black box**

<button class="coming" disabled>Coming Nov 10</button>
:::

::: {.lesson data-lesson="qoe-lesson-12" style="--accent: #9F4668"}
### 12. Audit the next claim

<figure class="art"><img src="img/myth10.png" alt="Pages flying off a clipboard faster than anyone can check them" width="600" height="600" loading="lazy"></figure>

- the AI era's assumption: **compute closes every gap**
- the **1/g² wall**: tiny gaps, irreducible randomness
- **weak baselines**, query counts sold as runtimes
- **ignored parallelism**, solver randomness as task randomness
- oracle cost hidden behind **"assume oracle access"**
- the three questions on a **headline claim**, live

<button class="coming" disabled>Coming Nov 17</button>
:::

::::

:::::

::: {.agenda}
### Live Tutorial Agenda

Session 1 (90 minutes): Lessons 1 and 2, identifying a problem worth accelerating.

Session 2 (90 minutes): Lessons 3 and 4, building the rollout oracle.

For practitioners and researchers comfortable with qubits, controlled gates,
and circuit diagrams.
:::

::: {.pagefoot}
Taught by [Nishant Shukla](https://shukla.io) · Art by [Lazybuns](https://lazybunsart.carrd.co)
:::

<!-- The boil: noise displacing the artwork a couple of pixels, reseeded four
     times a second, so a pointed-at illustration wobbles the way hand-drawn
     animation does.  It has to live in the body; an <svg> in <head> ends the
     head element as far as the parser is concerned. -->
<svg class="filters" aria-hidden="true" focusable="false">
  <!-- Mid grey means "displace by nothing", so the map is grey everywhere and
       noisy only well inside the drawn frame, which every illustration puts
       26px (4.3%) from its edge.  The blurred rectangle fades the noise back
       to grey before it reaches the ink, so the frame and the margin outside
       it hold still while the picture inside them moves.  sRGB interpolation
       is required, not decoration: in the default linearRGB, #808080 is not
       the neutral value and the whole image drifts to one side.
       primitiveUnits are object-bound so every length below is a fraction of
       the card and the effect holds its proportions at any width.  Do not
       write these as percentages: a percentage subregion is ignored here, the
       flood silently covers the whole region, and the mask stops working with
       no error anywhere.  The displacement scale is a fraction too, so 0.007
       is the ~2px it reads as on a 290px card. -->
  <filter id="boil" x="0" y="0" width="100%" height="100%"
          color-interpolation-filters="sRGB" primitiveUnits="objectBoundingBox">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4" result="raw">
      <animate attributeName="seed" values="1;2;3;4" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/>
    </feTurbulence>
    <!-- feTurbulence writes noise into the alpha channel too; force it opaque
         so the rectangle below is the only thing masking it. -->
    <feColorMatrix in="raw" type="matrix" result="noise"
                   values="1 0 0 0 0
                           0 1 0 0 0
                           0 0 1 0 0
                           0 0 0 0 1"/>
    <feFlood flood-color="#808080" result="still"/>
    <feFlood flood-color="#ffffff" x="0.08" y="0.08" width="0.84" height="0.84" result="inside"/>
    <feGaussianBlur in="inside" stdDeviation="0.025" result="edge"/>
    <feComposite in="noise" in2="edge" operator="in" result="inner"/>
    <feComposite in="inner" in2="still" operator="over" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.007" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <!-- The same boil, retuned for the narrow layout, where the artwork renders
       at 16em instead of a 290px card.  Two numbers differ and they have to,
       because both resist being made proportional:
       `scale` is a fraction of the element, so it already shrinks with the
       art, but the smaller render also squeezes a 600px source harder, which
       smooths the ink and leaves less edge for a displacement to move.  The
       result measured 0.28x as much frame-to-frame motion as the desktop card.
       `baseFrequency` ignores primitiveUnits and stays in user space, so a
       smaller element gets fewer, larger noise cells across it, turning a boil
       into a slow warp.  Raising it restores the cell count.
       0.008 and 0.020 were picked by sweeping both against the desktop card
       and measuring motion between two seeds; this pair lands at 0.95x.  A
       filter cannot inherit another's primitives, so the chain is repeated. -->
  <filter id="boil-narrow" x="0" y="0" width="100%" height="100%"
          color-interpolation-filters="sRGB" primitiveUnits="objectBoundingBox">
    <feTurbulence type="fractalNoise" baseFrequency="0.020" numOctaves="2" seed="4" result="raw">
      <animate attributeName="seed" values="1;2;3;4" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/>
    </feTurbulence>
    <feColorMatrix in="raw" type="matrix" result="noise"
                   values="1 0 0 0 0
                           0 1 0 0 0
                           0 0 1 0 0
                           0 0 0 0 1"/>
    <feFlood flood-color="#808080" result="still"/>
    <feFlood flood-color="#ffffff" x="0.08" y="0.08" width="0.84" height="0.84" result="inside"/>
    <feGaussianBlur in="inside" stdDeviation="0.025" result="edge"/>
    <feComposite in="noise" in2="edge" operator="in" result="inner"/>
    <feComposite in="inner" in2="still" operator="over" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.008" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
