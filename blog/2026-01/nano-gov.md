---
title: Nano Governments
author: Nishant Shukla
date: January 11, 2026
keywords:
  - political science
  - governments
  - Rousseau
  - The Social Contract
  - democracy
  - oligarchy
  - magistrates
  - sovereign
  - bias-variance decomposition
  - vector embeddings
  - microfoundation
mathcolor:
  blue:
    math:
      - '\vec{\mu}'
      - "v_M"
      - 'X_M'
    text:
      - magistrates
      - magistrate
  red:
    math:
      - '\vec{\sigma}'
      - "v_S"
      - 'X_S'
    text:
      - subjects
      - subject
      - sovereign
  green:
    math:
      - '\vec{p-notused}'
    text:
      - person-notused
      - people-notused
      - individual-notused
  orange:
    math:
      - '\vec{\rho}'
    text:
      - person
      - public
  purple:
    math:
      - '\vec{\gamma}'
    text:
      - government
      - governments
  cyan:
    math:
      - '\vec{\upsilon}'
    text:
      - latent
  gray:
    math:
      - '\operatorname{Cov}'
      - '\operatorname{tr}'
      - '\mathbb{E}'
      - '\mathrm{Cost}'
      - '\mathcal{L}'
      - '\sum'
      - '\cup'
      - '\cap'
---

In Cyberpunk 2077, players noticed that the 3D models of children were just those of adults scaled down in size[^1].
These uncanny figures roamed Night City with unexpected body proportions and aged facial structures.
You know, some things don't scale down naturally: a mobile app is not just a smaller website, a short story is not just a shorter novel, and a bathtub is not just a mini pool.

## Political Science at a nanoscale

Similarly, political science at a nano-scale breaks down as well.
How exactly does it "break down" and when must we draw a line between the "macro" and "nano" governments?

[![](./nasuh.webp)](https://publicdomainreview.org/collection/the-maps-of-matrakci-nasuh-ottoman-polymath/)

I admit, I've set up a problem that I have no business probing into, since I am no authority on this topic.
My interests are strictly in inventing mathematical formulations for the sake of it, to see where it leads,
to experiment in a sandbox of the mind, and if lucky, to gain new insights on social dynamics.

So before we touch any equations, here are a couple of examples of how small groups of people often organize themselves into familiar patterns:

- A friend planning a BBQ might appear as a benevolent autocrat, where one leader orchestrates the evening.
- Classmates working on a group project may resemble an oligarchy, where a few decide the plan and carry it out: "he'll be late, so let's start without him."
- Coworkers picking a place to eat tend to vote, like a direct democracy (aside: RIP Foursquare[^2].)

Can we predict how a stranded crew of astronauts on Mars would organize themselves? Assume, of course, that all communication with the mainland has been cut off (say, due to software that cannot adapt to change[^3]).

Let's use Rousseau's _The Social Contract_[^4] as a starting point, keeping in mind that it is by no means on par with modern political philosophy.
He introduces language to describe governments, while warning us about the limitations of "mathematical precision."

> "...although I have borrowed ... the language of mathematics, I am still well aware that mathematical precision has no place in moral calculations" (105).

Foolishly, we'll proceed anyway.

## Will of the people

Let's represent a person's will by a vector $\vec{p}$, in some arbitrary vector space (say $\mathbb{R}^{3}$ for simplicity).

Now, if LLMs have shown us anything, it is that vector embeddings are a good enough mechanism to store natural language.
If a body of text can be embedded in a semantic vector space, then we can borrow that manifold for our purposes too,
because we assume the will is legible through written text, much like the letter of the law,
with the same limitation: it strips away the contextual information behind whatever produced the text.

Anyway, back to a couple more definitions. The list of individual wills is $P = (\vec p_1,\dots,\vec p_n)$.

<div id="demo_010_population" class="figure"><div id="demo_010_tooltip" class="tooltip"></div></div>
<script type="module" src="./demo_010_population.js"></script>

A legitimate government aligns with the will of the people.
For it to function, someone needs to carry out the administration and enforcement duties. 

## Introducing the magistrates


Rousseau calls this role the magistrate: the "man or body charged with that administration" (102).

Thus, we divide the public into two groups of wills:

1. the wills of the sovereign $S$ (those who make the laws)
2. the wills of the magistrates $M$ (those who administer and enforce the laws)

Define the vector embedding such that the will of the public is the mean will of the population:

$$
\vec{\rho} = \frac{1}{n} \sum_{i=1}^{n} \vec{p}_i.
$$

Likewise, the sovereign will is written $\vec{\sigma}$, and the magistrates' will is $\vec{\mu}$.

In the demo below, try adding a few magistrates and observe how that affects the variance within a group and the distance between groups. You may intuit variance as "friction to get anything done" and distance as "conflict of interest between the two bodies."

<div id="demo_020_division" class="figure"><div id="demo_020_tooltip" class="tooltip"></div></div>
<script type="module" src="./demo_020_division.js"></script>

There are many more ways to partition $P$ into $M$ and $S$ than shown in the demo, on the order of $2^n$ to be more precise.
So, we treat them as random variables over all partitions, such that:

$$
\mathbb{E}[\vec{\sigma}] = \vec{\rho},
\qquad
\mathbb{E}[\vec{\mu}] = \vec{\rho}.
$$

## Microfoundation

It sounds like what you'd call the backbone of a conspiracy theory, or if you ask my wife, a tiny bit of makeup to even out the complexion of a face. 
Not quite. We're actually talking about "microeconomic foundations": you can ground large-scale behavior of a group in individual-level behavior[^5].

For example, as if the will of a person wasn't already a complex enough topic, the will of a group is even more controversial.
Instead of averaging all the wills of people in a group to predict how they would act, let's zoom in to the individuals.

Applying microfoundations, the voice of the sovereign $X_S$ at any time can be estimated through turnout or sampling.
The voice of the magistrates $X_M$ at any time can be estimated by a few delegates, or a random sample.


$X_S$ is a noisy signal of $\vec{\sigma}$, and $X_M$ is a noisy signal of $\vec{\mu}$:


$$
\mathbb{E}[X_S \mid S] = \vec{\sigma},
\qquad
\mathbb{E}[X_M \mid M] = \vec{\mu}.
$$



## Formulation of a government

A government's will $\vec{\gamma}$ is a tug-of-war between the voice of the sovereign $X_S$ and the voice of the magistrates $X_M$. It lives somewhere between the two points.
Given some $t \in \mathbb{R}$ where $0 \leq t \leq 1$, define

$$
\vec{\gamma}(t) = t X_M + (1 - t) X_S.
$$


In the demo below, hover over a partition to see a visual representation of $\vec{\gamma}(t)$.

<div id="demo_025_partitions" class="figure"></div>
<script type="module" src="./demo_025_partitions.js"></script>

The government's will $\vec{\gamma}(t)$ is also an unbiased estimator of the public will:

$$
\begin{aligned}
\mathbb{E}[\vec{\gamma}(t)]
&= \mathbb{E}\!\left[\, t X_M + (1-t) X_S \,\right] \\
&= t\,\mathbb{E}[X_M] + (1-t)\,\mathbb{E}[X_S] \\
&= t\,\mathbb{E}\!\left[\mathbb{E}[X_M \mid M]\right] + (1-t)\,\mathbb{E}\!\left[\mathbb{E}[X_S \mid S]\right] \\
&= t\,\mathbb{E}[\vec{\mu}] + (1-t)\,\mathbb{E}[\vec{\sigma}] \\
&= t \vec{\rho} + (1-t)\vec{\rho} \\
&= \vec{\rho}.
\end{aligned}
$$


We define the cost of a government as the mean squared error relative to the public will:

$$
\mathrm{Cost}(t) = \mathbb{E}\big[ \| \vec{\gamma}(t) - \vec{\rho} \|^2 \big].
$$

By the bias-variance decomposition for squared loss:


$$
\mathrm{Cost}(t)
=
\underbrace{\big\| \mathbb{E}[\vec{\gamma}(t)] - \vec{\rho} \big\|^2}_{\text{illegitimacy}}
\;+\;
\underbrace{\operatorname{tr}\big(\operatorname{Cov}(\vec{\gamma}(t))\big)}_{\text{ineffectiveness}}.
$$

So minimizing $\mathrm{Cost}(t)$ means choosing a government that is both:

- legitimate (aligned to the public will)
- effective (not unstable due to noise).

Since $\mathbb{E}[\vec{\gamma}(t)] = \vec{\rho}$, the cost simplifies to just the variance term

$$
\mathrm{Cost}(t) = \operatorname{tr}\big(\operatorname{Cov}(\vec{\gamma}(t))\big).
$$

Assuming the two bodies' estimation errors are uncorrelated, by the covariance rule for a linear combination[^6], and the linearity rule of a trace[^7], we get

$$
\begin{aligned}
\mathrm{Cost}(t) &= t^2 v_M + (1 - t)^2 v_S \\
\text{where}\quad
v_M &= \operatorname{tr}(\operatorname{Cov}(X_M)), \\
v_S &= \operatorname{tr}(\operatorname{Cov}(X_S)).
\end{aligned}
$$

The optimal government is at $\frac{d \mathrm{Cost}}{dt} = 2 t v_M + 2(t - 1)v_S = 0$, or simply

$$
t = \frac{v_S}{v_S + v_M}.
$$

Neat, we've derived the phenomenon that a body with more internal disagreement is less effective!
This can also be interpreted as: the higher the variance of a body, the less influence it has on the government.
The influence of the individual diminishes as the population increases. The inverse is true as well, which leads to Rousseau's conclusion that a small magistrate rules with more power.

> "...government slackens to the extent that the magistrates are multiplied..." (109).

## Comparing governments

The best government carries out actions _swiftly_ in the interest of the people.
In expectation over partitions, $\vec{\gamma}$ is in the interest of the people, because it achieves the equilibrium point between the magistrates and the sovereign.
But, the effectiveness of carrying out actions is largely a property of the magistrates.
Let $w_M$ be defined as the within-group variance of the magistrates, which is interpreted as the "friction" among the magistrates to get anything done.

The loss function of a government is a function of alignment (distance to $\vec{\rho}$) and effectiveness ($w_M$). Let $\lambda$ be a hyperparameter. Then, we define the loss as

$$
\mathcal{L}(\vec{\gamma}) = \| \vec{\gamma} - \vec{\rho} \|^2 + \lambda w_M.
$$

In the demo below, we can better see the intuition that having too many chefs in the kitchen (i.e. too many magistrates) will lead to suboptimal governments.

<div id="demo_030_optimal_government" class="figure"></div>
<script type="module" src="./demo_030_optimal_government.js"></script>

After playing with the demo above for long enough, you may start to notice that the loss function of governments with 15+ people all end up looking practically the same. It's always just a line sloped slightly up and to the right. In fact, most of the time the optimal government is found when the magistrates make up only a tiny fraction of the population.

Whereas for a population count of 9 or fewer, we instead see that the local optima occur when about half of the population is part of the magistrates.

## Regime split

Most notably, the optimal fraction of the population that should be part of the magistrates is not a smooth transition from nano governments to macro governments.
This brings us back to our initial point: a nano government is not simply a smaller government.
There is a clear split between the two.

In the demo below, the x-axis is the population size, and the y-axis is the ratio of magistrates that make up the optimal government.

<div id="demo_040_optimal_magistrates" class="figure"></div>
<script type="module" src="./demo_040_optimal_magistrates.js"></script>

There are two regimes! 
Instead of a smooth transition, we see a clear boundary between the small and the big!
This is our first evidence that nano governments are a beast of their own.

Note, the term _regime_ in the context of statistical models was first introduced to me by my Ph.D. advisor Song-Chun Zhu[^8].
Coincidentally, and maybe even obviously, _regime_ also has a political meaning, which a stronger writer than myself would avoid using to squash confusion.

## Discussion and further study

The catalyst for writing this post was my surprise at reading Rousseau's argument that a bigger group of magistrates is not more powerful. 
After operationalizing the claim, I think I finally understand what he meant.
Moreover, as a fun consequence of this exploration, we see that there's a fascinating regime split between the nanoscale and the traditional scale.

From the demos above, I've noticed that optimal nano governments usually take the form of dipoles, or two separate clusters. Like a bow-tie, it has dense clusters on either side, joined at a point in the middle.
Surprisingly, in this regime, the sovereign and the magistrates can have completely opposite wills, but as long as both bodies are dense, the government will ends up near the population will, while keeping within-body variance of the magistrates low.

There's more to investigate:

a. In this article, we used $\mathbb{R}^3$ because it's easier to visualize. How does the nano government regime boundary change as the dimension increases?
b. How can we train an embedding model such that the will of the population is indeed simply the arithmetic mean of the vectors?
c. What systematic ways are there to identify an optimal value of the hyperparameter $\lambda$?
d. What if an individual is a member of both the magistrates and the sovereign? How does that affect the formulation and regime boundary?
e. Does any of this theory hold up in the real world?
f. Why is there a regime split?
g. We made it this far without mentioning any of the tenets of game theory. What makes the study of nano governments different from the study of game theory? After all, both deal with the analysis of agents.

## Meta

I was hoping to finish this post a couple of weeks ago during the holidays. 
Early on, I knew Emacs would be my editor, Markdown my source, and Pandoc my compiler.
The math was getting sloppy and hard to read, so I spent a few cycles on a Lua plugin to syntax highlight $\LaTeX$.
That honestly made a world of difference, so much so that I started color-coding all interactive demos as well.

Before LLMs, generating one-off experimental demos to analyze simulations meant subscribing to a framework (whether it be Jupyter Notebooks, Wolfram Mathematica, MATLAB, etc.). 
I was curious, and pleasantly surprised that JavaScript and Three.js were pretty much all I needed for small-scale experiments. 
Many demos were culled in the making of this post, so that the ones that survived the cut are worth your time.

Happy New Year!

[^1]:
    Elise Nelson, "What Is Going On With the Cyberpunk 2077 Children?", SVG, December 31, 2020,
    [https://www.svg.com/304858/what-is-going-on-with-the-cyberpunk-2077-children/](https://www.svg.com/304858/what-is-going-on-with-the-cyberpunk-2077-children/) (accessed December 29, 2025).

[^2]:
    Sarah Perez, "Farewell to Foursquare’s app," TechCrunch, October 22, 2024,
    [https://techcrunch.com/2024/10/22/farewell-to-foursquares-app/](https://techcrunch.com/2024/10/22/farewell-to-foursquares-app/) (accessed December 29, 2025).

[^3]:
    Nishant Shukla, "An Introduction to Task-Oriented Programming," freeCodeCamp, December 23, 2019,
    [https://www.freecodecamp.org/news/dmpl/](https://www.freecodecamp.org/news/dmpl/) (accessed January 4, 2026).

[^4]:
    Jean-Jacques Rousseau, _The Social Contract_, trans. Maurice Cranston, intro. Maurice Cranston
    (Penguin Classics, 2003). ISBN 9780140442014.

[^5]: 
    Robert E. Lucas Jr., "Econometric policy evaluation: A critique," _Carnegie-Rochester Conference Series on Public Policy_ 1 (1976): 19–46, https://doi.org/10.1016/S0167-2231(76)80003-6,
    [https://www.sciencedirect.com/science/article/pii/S0167223176800036](https://www.sciencedirect.com/science/article/pii/S0167223176800036) (accessed January 10, 2026).

[^6]:
    Wikipedia contributors, "Covariance," _Wikipedia_, last edited December 12, 2025,
    [https://en.wikipedia.org/wiki/Covariance#Covariance_of_linear_combinations](https://en.wikipedia.org/wiki/Covariance#Covariance_of_linear_combinations) (accessed December 29, 2025).

[^7]:
    Wikipedia contributors, "Trace (linear algebra)," _Wikipedia_, last edited November 20, 2025,
    [https://en.wikipedia.org/wiki/Trace\_(linear_algebra)#Basic_properties](<https://en.wikipedia.org/wiki/Trace_(linear_algebra)#Basic_properties>) (accessed December 29, 2025).

[^8]:
    Ying Nian Wu, Cheng-En Guo, and Song-Chun Zhu, "From Information Scaling of Natural Images to Regimes of Statistical Models,"
    _Quarterly of Applied Mathematics_ 66, no. 1 (March 2008): 81–122, https://doi.org/10.1090/S0033-569X-07-01063-2,
    [https://escholarship.org/content/qt0d78z39s/...1b2f9365551a33008aa75ec070284626.pdf](https://escholarship.org/content/qt0d78z39s/qt0d78z39s_noSplash_1b2f9365551a33008aa75ec070284626.pdf)
    (accessed January 5, 2026).
