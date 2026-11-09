analysis-by-synthesis.html: analysis-by-synthesis.md Makefile article.css dice.css dice.js dice-style.html dice-script.html dice-box/dice-box.es.min.js
	pandoc analysis-by-synthesis.md -o analysis-by-synthesis.html --standalone --include-in-header=dice-style.html --include-after-body=dice-script.html

.PHONY: clean
clean:
	rm -f analysis-by-synthesis.html
