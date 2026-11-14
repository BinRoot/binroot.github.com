---
title: Preventing an AI catastrophe
pagetitle: Preventing an AI Catastrophe with Pattern Theory
author: Nishant Shukla
date: 2026-11-15
lang: en
description-meta: The 1983 Petrov false alarm and Ulf Grenander’s Pattern Theory offer a lens for AI agents that compare predictions with real-world observations before acting.
canonical_url: https://shukla.io/blog/2026-11/analysis-by-synthesis.html
og_image: https://shukla.io/blog/2026-11/petrov.jpg
---

## Petrov

Look out the window and point at the sky.
Go on, point somewhere and with your eyes trace a line upwards.
Beyond that horizon, an intercontinental ballistic missile is arcing your way.
At least, that's what the screen inside your bunker says: the Americans have launched. Your name is Petrov, Lieutenant Colonel of Soviet Air Defence Forces.
A siren howls with utmost urgency.

:::dice
13 -- Your heart pounds. The sirens seem to recede into a muffled blur as you reason that the early warning system must be mistaken.
else -- You panic. You freeze up. You cannot muster the courage to even blink.
:::

In reality, Petrov didn't freeze. He reported his assessment that the warning was false.
The alarm cleared, and no retaliatory strike followed.

This happened on September 26, 1983.

> "the [early warning] satellite had been fooled by the sun’s rays reflecting off clouds high over North Dakota, which had two launch areas"
> Source: [The Economist, “Midnight and counting” (30 September 2017)](https://www.economist.com/obituary/2017/09/30/obituary-stanislav-petrov-was-declared-to-have-died-on-september-18th)

<figure>
<img src="petrov.jpg" alt="Stanislav Petrov at home in 2016">
<figcaption class="photo-credit"><a href="https://commons.wikimedia.org/wiki/User:Queery-54">Queery-54</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></figcaption>
</figure>

Petrov rolled a natural 20 that day.

> Some of his doubts were logical: the newness of
> the system, and the too-swift passage of the message through the 30 layers of
> verification he had set up himself. Other doubts were vaguer: a funny gut feeling,
> and a sense that he knew better than a machine. Even so, his decision to declare a
> false alarm was a 50-50 guess, no better.
> Source: [The Economist, “Midnight and counting” (30 September 2017)](https://www.economist.com/obituary/2017/09/30/obituary-stanislav-petrov-was-declared-to-have-died-on-september-18th)

Did the sensors betray us? Were the machines immoral? Should the Soviets have invested in model alignment? No, the satellite did its job and it wasn't misaligned. It just had no model of the world. Safe agentic behavior is on everyone's mind nowadays, yet we often conflate alignment with basic epistemics. Funny enough, nearly four months before the Soviet nuclear false alarm, the movie _WarGames_ hit theaters in June 1983 with an uncannily similar premise.

<figure>
<img class="movie-poster" src="https://cdn.posteritati.com/posters/000/000/049/087/war-games-md-web.jpg" alt="The 1983 theatrical poster for WarGames">
<figcaption class="photo-credit"><a href="https://posteritati.com/poster/30644/war-games-1983-us-one-sheet-poster">Theatrical poster</a> · © MGM/UA</figcaption>
</figure>

In both Petrov's case and the movie, humans played a critical role as guardrails for their automated systems.

## Grenander

During the week of _WarGames_' wide release, Ulf Grenander presented “Reflections on Global Tendencies in Mathematics” at a conference in Lund called _An Inventory of Present Thinking about Parts and Wholes_. After all, computers were changing mathematical practice rapidly around this time. 
Wait, since [Math 2.0](https://teorth.github.io/tao-web/slides/math-2-0-caltech-2026.pdf) is taken, let's call his take Math 1.5.

<figure>
<img src="grenander.jpg" alt="Ulf Grenander">
<figcaption class="photo-credit"><a href="https://commons.wikimedia.org/wiki/File:Professor_Ulf_Grenander.jpg">Svenskt Porträttarkiv</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></figcaption>
</figure>

Petrov's false alarm took place in September, months after Grenander's June presentation, and [details of the incident did not become public until the 1990s](https://www.chathamhouse.org/sites/default/files/2022-03/2022-03-07-nuclear-decision-making-unal-et-al_0.pdf). Much of Grenander's mathematical framework, developed during the Cold War, centered on probabilistic pattern representations and inference from signals. These ideas also offer a useful lens for thinking about early-warning systems. One powerful idea is that pattern analysis and pattern synthesis should share a common probabilistic model.

> Pattern analysis = Pattern synthesis.
> (Attributed to Grenander (1983, §5.3) in [“Bayesian Computation and Stochastic Systems”](https://www2.stat.duke.edu/~sschmid/Courses/Stat376/Papers/BCSSStatSci1995.pdf))

Bottom-up signals from sensors may fire an alert warning Petrov of incoming missiles, first one and then four more.

Top-down understanding is the process of synthesizing or simulating a world that could produce those signals, and comparing those synthetic predictions against the observed readings:

- Why would the United States open a nuclear war with one missile, followed by only four more, rather than an overwhelming first strike?
- Why should he trust a relatively new warning system rushing through verification?
- Why wasn't there corroborating evidence from ground radar?

To understand a signal, model what could have produced it.
Grenander's compositional and probabilistic framework for representing hidden structures and inferring them from noisy observations was called Pattern Theory.

Whatever happened to Pattern Theory? Six weeks earlier in 1983 gives a clue.

## Hermès

<figure>
<img src="https://static-prod.rtl.lu/dims4/default/6a66561/2147483647/strip/true/crop/640x427%2B0%2B0/resize/1224x817%21/quality/90/?url=https%3A%2F%2Frtl-luxembourg-new-production-web.s3.eu-central-1.amazonaws.com%2Fbrightspot%2Fe1%2Fb1%2F90620cb0e569095ca0815a8d3238%2F8fe20b2cd0c4dd01dfa9990391cc6cba.jpeg" alt="Corinne Hermès in a portrait">
<figcaption class="photo-credit">© RTL Today</figcaption>
</figure>

Six weeks before the Lund conference and _WarGames_' wide release, Munich hosted the 28th edition of the Eurovision Song Contest.

Corinne Hermès stunned us with her song "Si la vie est cadeau", representing Luxembourg and winning 1st place. 

She sings:

<div style="position: relative; width: 100%; max-width: 560px; aspect-ratio: 16 / 9;">
<iframe src="https://www.youtube.com/embed/F8y5xc8UodE" title="Corinne Hermès performing ‘Si la vie est cadeau’ at Eurovision 1983" style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

> Cadeau donné, cadeau repris, cadeau volé

It translates to “a gift given, a gift taken back, a gift stolen.”

In fact, in her later interviews after the competition, Hermès does not explicitly say that Grenander's Pattern Theory was the gift.

But that's how I read it. Three years later, Rumelhart, Hinton, and Williams popularized [backpropagation](https://www-isl.stanford.edu/~widrow/papers/c1992backpropagationand.pdf), and the field went all-in on training neural networks directly from inputs to labels. Grenander was doing the opposite: modeling the generative structure first, then inferring it by sampling. In his [1985 IIASA report](https://pure.iiasa.ac.at/id/eprint/2589/1/XB-85-406.pdf), he cast pattern inference as stochastic relaxation, repeatedly resampling local parts of a pattern in a Markov chain (alongside Stuart and Donald Geman's Gibbs sampling at Brown), and later developed [jump-diffusion](https://doi.org/10.1111/j.2517-6161.1994.tb02000.x) with Michael Miller. As hardware scaled, end-to-end curve fitting won out, and Pattern Theory faded into the background.

Maybe it's cliche now, but you may have heard the phrase "the map is not the territory." 
To me, it means the patterns we analyze and the signals our sensors capture are only projections of reality, not to be confused with reality itself.

I think that's what Hermès gets at a few bars earlier when she sings:

> Alors pourquoi m'avoir promis la terre entière? ... Je ne voulais pas d'un bonheur imaginaire.

“So why did you promise me the whole world? ... I didn't want an imaginary happiness.”

To which Claude responds, “That was an honest mistake, and you're right to push back on that.”

When you push back on an LLM, it rewrites its answer rather than checking the world, because it has no world to check. In that sense, an LLM's output resembles the alert from the Soviet satellite. Petrov had a rich generative model of the world in his head that let him doubt the sensor readings. That loop is called _analysis by synthesis_, and Pattern Theory was one way to formalize it.

## Analysis by synthesis

Consider a grid world, where an agent can use optical sensors to measure distance to obstacles.

<img src="grid-world.svg" alt="A grid world with brick walls, a purple square, and a blue observation path.">

The blue vision cone represents the measurement of sensor signals: rays cast outward until they hit an obstacle.

In a text-based agent, prompts, tool outputs, and model completions take the place of those distance readings, and the agent treats text as the environment itself.

<img src="grid-world-text.svg" alt="A purple square with blue text signals stopping at two red barriers.">

The LLM is the sensor.
I've seen related questions raised in [a paper that models language as a sensor](https://arxiv.org/pdf/2606.08666) and in [an argument that LLMs do not yet transmit testimonial knowledge](https://www.cambridge.org/core/journals/episteme/article/assertion-without-a-speaker-testimony-tracking-and-large-language-models/6F19C8DC4ECBD9FA0E43BA300DA45AF1). 
When the sensor becomes the planner, we confuse the signals with reality, mistaking sunlight on clouds for a launch.
A trustworthy agentic system shall reconstruct a generative explanation of reality that predicts observations it has never seen.

For example, the agent reconstructs a possible world and predicts the sensor readings that world would produce. It compares those predictions with the real readings, then uses the mismatches to decide what to investigate next.

<img src="analysis-by-synthesis-loop.svg" alt="Predicted and actual sensor readings are compared. Mismatches guide what to investigate next, leading to new observations and a revised reconstruction.">

The agent uses its model to decide what to measure next.

Hermès sang “cadeau donné, cadeau repris, cadeau volé.” I think we still have this gift. We've gotten remarkably good at teaching machines to synthesize. Maybe we're in a better position now to revisit what Grenander wanted to do with that ability: understand.

## Related reading

- [Grammar models are back, baby!](../2026-02/grammar.html) connects top-down generation from hidden structure with bottom-up inference from observations.
- [Who benchmarks the benchmark?](../2026-08/gym.html) shows how misleading observations and broken environments can make an agent appear to fail.

<footer class="article-footer">
  <nav aria-label="Contact, profiles, and RSS">
    <ul class="footer-links">
      <li><a href="mailto:nishant@shukla.io">Email</a></li>
      <li><a href="https://github.com/binroot">GitHub</a></li>
      <li><a href="https://www.linkedin.com/in/shuklanx/">LinkedIn</a></li>
      <li><a href="../rss.xml">RSS</a></li>
    </ul>
  </nav>
</footer>
