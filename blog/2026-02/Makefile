all: grammar.html

grammar.html: grammar.md references.bib timeline.lua timeline.css highlight.css grammar.lua grammar-viz.css header.lua header.css anchor.lua anchor.css mermaid.lua mermaid-cli.mjs beautiful-mermaid/dist/index.js scfg-interactive.js scfg-interactive.css
	pandoc grammar.md -s --citeproc --mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js --highlight-style=pygments -L timeline.lua -L grammar.lua -L header.lua -L anchor.lua -L mermaid.lua -c https://cdn.simplecss.org/simple.min.css -c timeline.css -c highlight.css -c grammar-viz.css -c header.css -c anchor.css -c scfg-interactive.css -o grammar.html

clean:
	rm -f grammar.html

.PHONY: all clean
