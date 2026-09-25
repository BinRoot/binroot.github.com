---
title: The Greatest Pun
pagetitle: "The Greatest Pun: JavaScript's ${{ }} tagged template literal"
author-meta: Nishant Shukla
date-meta: 2026-09-26
lang: en
description: "JavaScript's ${{ name }} looks like a Mustache template but parses as an object literal inside a tagged template literal. The pun behind Helicone's prompt tag."
keywords:
  - tagged template literal
  - JavaScript template literal
  - tag function
  - Mustache syntax
  - object shorthand
  - prompt template
  - Helicone
  - hprompt
  - Shakespeare puns
  - play on words
---

Shakespeare's chock-full of puns, no doubt as a sign of his mastery and love of words. 

Rarely can you swap two words to form a [[correct]{.w} [grammatically]{.w}]{.swap tabindex="0" role="button" aria-pressed="false"} sentence, yet he played with words like a magician.

:::quote
Better a witty fool than a foolish wit.

_Twelfth Night_
:::

In the example above, the noun "fool" flips to the adjective "foolish", while the adjective "witty" flips to the noun "wit".
The simplest puns leverage the rules of grammar to change the meaning of words. 

Then there are puns that play with phrases in a way that leverages context _outside_ the grammar to change the meaning. Here's one of my favorites:

:::quote
Put out the light, and then put out the light.

_Othello_
:::

The first phrase literally means to extinguish a candle, but the second is a metaphor for killing someone (in this case, Desdemona). 

The formal dictionary definition of a pun usually talks about the "humorous" effect.

:::dictionary
**pun** [/pʌn/]{.pron} _noun_
:   The use of a word in such a way as to suggest two or more meanings or different associations, or of two or more words of the same or nearly the same sound with different meanings, so as to produce a **humorous** effect; a play on words.

[Oxford English Dictionary](https://www.oed.com/dictionary/pun_n1?tab=meaning_and_use#27873500)
:::

::: hinge
Now, I very well believe humor is in the eye of the human. What's funny to me isn't always funny to you. But I'd like to introduce you to the greatest pun I've ever discovered. It isn't in English. Natural languages and programming languages have one property in common: [grammar](/blog/2026-02/grammar.html). You've already seen what a pun can do with that.
:::

## Tagged Template Literal

First, a quick background on the grammar. In JavaScript, there's a thing called a _tagged template literal_ that lets you do powerful string manipulation like this:

```js
const systemPrompt = dedent`
	You are a code review agent.
	
	Follow these steps:
		1. Before reviewing the PR, find recent related PRs.
		2. ...
		3. ...
		4. ...
`;
```

In this code, `dedent` is the [tag function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates), which processes the template literal to remove excessive indentation. A tag function receives the literal's text pieces and the evaluated `${...}` values as separate arguments, so it can do whatever it likes with each.


## Templating Languages

Most templating languages let you write the template in the same medium as the end product: text with holes where the variables go. Any time your controls live in the same system they are controlling, things get interesting. There is some Gödel incompleteness side-quest worth exploring here. But I digress. Here's a quick example of a template:

```
hi {{ name }}
```

The `{{ }}` syntax is very common. In fact, the following templating languages use it:

- [Mustache](https://mustache.github.io/)
- [Handlebars](https://handlebarsjs.com/)
- [Jinja2](https://jinja.palletsprojects.com/)
- [Django templates](https://docs.djangoproject.com/en/stable/ref/templates/language/)
- [Liquid](https://shopify.github.io/liquid/)
- [Angular templates](https://angular.dev/guide/templates)
- [Vue templates](https://vuejs.org/guide/essentials/template-syntax.html)


## Prompt Template Literal

Check this out. We can define a tag function called `prompt` that looks like it's accepting `{{ }}` templates. 

```js
const userPrompt = prompt`
  Please review my code.
    - Link to PR: ${{ url }}
    - Extra notes: ${{ notes }}
    - Timestamp: ${{ time }}
`;

```

It looks familiar and easy on the eyes, right? Behind the scenes, it's producing a string that will be processed by an observability tool (Helicone) to help analyze the prompts.

```xml
Please review my code.
  - Link to PR: <prompt id="url">https://github.com/etc/etc</prompt>
  - Extra notes: <prompt id="notes">Only review the unit test files</prompt>
  - Timestamp: <prompt id="time">2026-09-26</prompt>
```

In my opinion, the cool part is that the apparent `{{ }}` template syntax emerges in our JavaScript code by coincidence: `${...}` evaluates whatever is inside it, and JavaScript's `{ name }` object shorthand is equivalent to `{ name: name }`. The tag function, `prompt`, now has all it needs to annotate the string properly. 

```{=html}
<figure class="parse">
<svg viewBox="0 0 260 128" role="img" aria-label="The string ${{ url }} bracketed two ways: you see the double braces as a template hole; JavaScript sees an object literal inside a substitution.">
  <!-- The human reading is drawn in red ink, by hand; the machine reading in
       editor blue, by ruler. -->
  <text class="lbl pen" x="138.5" y="12" text-anchor="middle">you see</text>
  <path class="pen-stroke" d="M60.6,33.2 C60.1,29.4 59.7,26.1 62.2,24.8 C92,23.5 150,24.5 214.6,24.1 C217.2,24.2 217.5,28.2 216.6,32.6"/>
  <!-- One glyph per 17-unit cell (the x list), so the brackets land on the
       right characters in any monospace face. -->
  <text class="code hero" x="53.5 70.5 87.5 104.5 121.5 138.5 155.5 172.5 189.5 206.5" y="62" text-anchor="middle">${{ url }}</text>
  <path class="brk" d="M81,76 V81 Q81,84 84,84 H193 Q196,84 196,81 V76"/>
  <path class="brk" d="M43,92 V97 Q43,100 46,100 H214 Q217,100 217,97 V92"/>
  <text class="lbl mach" x="130" y="120" text-anchor="middle">JavaScript sees</text>
</svg>
</figure>
```

JavaScript sees one thing, and you see another. The `{{ url }}` syntax lives in your head. 

_... crickets ..._

Alright, maybe I overplayed the pun, but I'm absolutely proud of it. I worked with Justin from Helicone on this back in 2024. It was an idea I'd been using internally, which Justin then made official in the SDK ([Justin's PR](https://github.com/Helicone/helicone/pull/1410), [my PR](https://github.com/Helicone/helicone/pull/1427)). I thought the pun was funny. Justin was happy to include it.

A pun is one string with two parses. In [Grammar models are back, baby!](/blog/2026-02/grammar.html) I take that seriously and hand back a probability distribution over them. In [Spatial languages](/blog/2026-07/cccx.html) I make it worse and hand the parser a second dimension.
