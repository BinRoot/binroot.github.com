rank-select.html: rank-select.md template.html references.bib
	pandoc -f markdown+hard_line_breaks-implicit_figures rank-select.md -o rank-select.html --template=template.html --highlight-style=pygments --wrap=none --citeproc --bibliography=references.bib --mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js
