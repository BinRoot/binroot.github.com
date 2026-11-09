rsi.html: rsi.md rsi.css rsi.lua rsi.template.html Makefile
	pandoc rsi.md -o rsi.html --standalone --wrap=none --lua-filter=rsi.lua --template=rsi.template.html --css=rsi.css?v=$(shell cksum rsi.css | cut -d' ' -f1) --mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js
