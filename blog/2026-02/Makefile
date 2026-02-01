all: grammar.html

grammar.html: grammar.md references.bib timeline.lua timeline.css highlight.css grammar.lua grammar-viz.css header.lua header.css anchor.lua anchor.css mermaid.lua mermaid-cli.mjs beautiful-mermaid/dist/index.js scfg-interactive.js scfg-interactive.css counter.html seo.html citations.css citations.js citations-script.html
	@# Single-file build for simple static hosting:
	@# 1) Pandoc generates a regular HTML file
	@# 2) We inline local CSS+JS into the final grammar.html (and remove polyfill.io; keep counter.dev)
	pandoc grammar.md -s --citeproc --mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js --highlight-style=pygments -L timeline.lua -L grammar.lua -L header.lua -L anchor.lua -L mermaid.lua -c https://cdn.simplecss.org/simple.min.css -c timeline.css -c highlight.css -c grammar-viz.css -c header.css -c anchor.css -c scfg-interactive.css -c citations.css -H counter.html -H seo.html -A citations-script.html -o .grammar.pandoc.html
	node scripts/make-standalone.mjs .grammar.pandoc.html grammar.html
	rm -f .grammar.pandoc.html

clean:
	rm -f grammar.html .grammar.pandoc.html

.PHONY: all clean
