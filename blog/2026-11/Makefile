analysis-by-synthesis.html: analysis-by-synthesis.md Makefile article.css dice.css dice.js dice-style.html seo.html article-navigation.html dice-script.html counter.html dice-box/dice-box.es.min.js
	pandoc analysis-by-synthesis.md -o analysis-by-synthesis.html --standalone --include-in-header=seo.html --include-in-header=dice-style.html --include-before-body=article-navigation.html --include-after-body=dice-script.html --include-after-body=counter.html

.PHONY: clean
clean:
	rm -f analysis-by-synthesis.html
