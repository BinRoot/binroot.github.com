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

::: {.lesson data-lesson="qoe-lesson-01" style="--accent: #456AAD"}
### Myth 1. "Quantum computing is a natural fit for AI."

<figure class="art"><img src="img/myth01.png" alt="A robot scratching its head while holding a quantum processor chip" width="600" height="600" loading="lazy"></figure>

- most AI problems don't qualify
- CPU, GPU, **QPU**: different jobs
- the speedup is narrow: **sampling**
- **three questions** to ask first
- famous overpromises, dissected
- knowing when to walk away

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson data-lesson="qoe-lesson-02" style="--accent: #4D8C55"}
### Myth 2. "Monte Carlo gets a quadratic quantum speedup."

<figure class="art"><img src="img/myth02.png" alt="Two dice tumbling across a green felt table" width="600" height="600" loading="lazy"></figure>

- the folklore, with **fine print**
- the trick: **precision on averages**
- **Go** flunks: wrong kind of dice
- **bandits** flunk: too cheap to matter
- so we invented a game
- **close calls** are where quantum wins

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson data-lesson="qoe-lesson-03" style="--accent: #C35523"}
### Myth 3. "It's just an implementation detail."

<figure class="art"><img src="img/myth03.png" alt="An open crate of machine parts sitting on an unread blueprint" width="600" height="600" loading="lazy"></figure>

- "**assume the oracle exists**," says every paper
- we stop assuming and build it
- a game board made of qubits
- all the randomness, **loaded up front**
- picking moves without **skewing the odds**
- the **scratch work** starts piling up

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson data-lesson="qoe-lesson-04" style="--accent: #F03836"}
### Myth 4. "Reversibility is just bookkeeping."

<figure class="art"><img src="img/myth04.png" alt="A cassette tape with its ribbon spooled out in a loop behind it" width="600" height="600" loading="lazy"></figure>

- the finished circuit must **run backward**
- every cell updates **at once**, or bugs
- the **self-flip trap**
- **snapshot** the board, then swap
- one qubit holds the score
- the full bill, in qubits

<button class="coming" disabled>Coming Sept 1</button>
:::

::: {.lesson data-lesson="qoe-lesson-05" style="--accent: #7E874C"}
### Myth 5. "Data you never read can't hurt you."

<figure class="art"><img src="img/myth05.png" alt="A trash can overflowing with bags that nobody has hauled away" width="600" height="600" loading="lazy"></figure>

- there is **no delete**
- leftover junk stays **tied to your answer**
- and quietly poisons it
- forgetting means **undoing history**
- compute, use, **uncompute**
- clean scratch still doesn't mean right answer

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-06" style="--accent: #B6D792"}
### Myth 6. "Measurement destroys the computation."

<figure class="art"><img src="img/myth06.png" alt="A cracked jar of water patched with bandages, still leaking" width="600" height="600" loading="lazy"></figure>

- the rule every course teaches
- production circuits break it daily
- **measure the garbage** on purpose
- patch the damage with **phase fixes**
- **cheapest eraser** there is
- **machine-checked** rules for when it's safe

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-07" style="--accent: #761D01"}
### Myth 7. "If every step is classical, the process is classical."

<figure class="art"><img src="img/myth07.png" alt="Interlocking gears packed edge to edge with no room to spare" width="600" height="600" loading="lazy"></figure>

- every step runs fine classically
- all of them together: **impossible**
- the **memory bill** grows per step
- **zero or linear**, nothing between
- a **tabletop test** catches fakers
- fakers fail it fast

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-08" style="--accent: #D9EB4E"}
### Myth 8. "If you've tested every input, it works."

<figure class="art"><img src="img/myth08.png" alt="A basket of red apples with one rotten apple hidden in the middle" width="600" height="600" loading="lazy"></figure>

- circuits that ace every test, wrongly
- **hidden phases**, invisible to truth tables
- full checking costs **2^n**
- three tiny cautionary circuits
- returning a **borrowed qubit** isn't enough
- you need **proof, not vibes**

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-09" style="--accent: #966B55"}
### Myth 9. "If you return it as you found it, no harm done."

<figure class="art"><img src="img/myth09.png" alt="A hand pulling a book from a shelf, red light spilling from the gap" width="600" height="600" loading="lazy"></figure>

- **contracts** for things nobody may inspect
- clean, borrowed, **conditionally clean**
- promises checked where blocks meet
- the compiler keeps a **ledger**
- Rust's **borrow checker**, but for qubits
- mismatched promises, no deal

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-10" style="--accent: #9598CA"}
### Myth 10. "The tools will catch up."

<figure class="art"><img src="img/myth10.png" alt="Pages flying off a clipboard faster than anyone can file them" width="600" height="600" loading="lazy"></figure>

- checkers read circuits **gate by gate**
- works great, until **Toffoli** walks in
- then rulebooks blow up exponentially
- a **theorem**, not a hunch
- **escape hatch**: one proof per circuit family
- know which side of the wall you're on

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-11" style="--accent: #92BBA8"}
### Myth 11. "Someone would have noticed by now."

<figure class="art"><img src="img/myth11.png" alt="A sealed jar of identical blue pills with a single red one inside" width="600" height="600" loading="lazy"></figure>

- nobody can eyeball a quantum circuit
- so every block ships with a **seal**
- a **proof kernel** replays it in milliseconds
- strangers' code, safely composed
- catches sneaky changes between versions
- **npm, but with receipts**

<button disabled>Coming soon</button>
:::

::: {.lesson data-lesson="qoe-lesson-12" style="--accent: #9F4668"}
### Myth 12. "Scale is all you need."

<figure class="art"><img src="img/myth12.png" alt="An oversized box balanced on a stack of much smaller ones" width="600" height="600" loading="lazy"></figure>

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
</svg>
