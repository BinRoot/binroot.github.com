all: grammar.html

grammar.html: grammar.md references.bib timeline.lua timeline.css highlight.css grammar.lua grammar-viz.css header.lua header.css anchor.lua anchor.css mermaid.lua mermaid-cli.mjs beautiful-mermaid/dist/index.js scfg-interactive.js scfg-interactive.css counter.html
	pandoc grammar.md -s --citeproc --mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js --highlight-style=pygments -L timeline.lua -L grammar.lua -L header.lua -L anchor.lua -L mermaid.lua -c https://cdn.simplecss.org/simple.min.css -c timeline.css -c highlight.css -c grammar-viz.css -c header.css -c anchor.css -c scfg-interactive.css -H counter.html -o grammar.html

# Self-contained single-file build for simple static hosting.
# Inlines local CSS+JS and removes polyfill.io (keeps counter.dev).
grammar-standalone.html: grammar.html timeline.css highlight.css grammar-viz.css header.css anchor.css scfg-interactive.css scfg-interactive.js scripts/make-standalone.mjs
	node scripts/make-standalone.mjs grammar.html grammar-standalone.html

clean:
	rm -f grammar.html

.PHONY: all clean
