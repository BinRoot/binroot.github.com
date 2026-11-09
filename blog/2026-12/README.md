Edit `rsi.md`, then run `make` to regenerate `rsi.html`.

The equation is written in LaTeX in `rsi.md` and rendered with Pandoc's MathJax option, as in the other posts. Its labels are regular Markdown, with arrows positioned after typesetting and on resize. It explains parametric and non-parametric improvement, so the table's column headers are bare names. The discovery and direct optimization definitions are ordinary Markdown bullet points; the table's row headers are bare names too.

Definitions preserve Markdown formatting, links, and standard Pandoc footnotes. All prose, lists, and blocks render where they appear in `rsi.md`; the filter only formats the paper table.

Keep group labels bold with a trailing colon, and each paper as a link followed by its parenthesized publication year. Separate groups with `<br>`. All four paper cells group papers by publication year: 2026, 2025, and 2024 and earlier. Papers whose main finding is a way self-improvement fails go first, under a `Failure reports` group, instead of under their year. A group may start with an italic caption right after its label, which renders as a hint on the heading, shown on hover, tap or keyboard focus; the `Failure reports` groups use one to explain the term where readers first see it.

`rsi.lua` formats the table; `rsi.template.html` supplies the page and math renderer; `rsi.css` controls typography and the mobile layout. Publish `rsi.html` and `rsi.css` together. The build needs Pandoc 3.x and Make.
