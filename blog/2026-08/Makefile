qoe.html: qoe.md header.html collage.js scripts.html
	sed -E "s/src=\"([a-z0-9]+\.js)\"/src=\"\1?v=$$(date +%s)\"/g" scripts.html > scripts.gen.html
	pandoc qoe.md -o qoe.html --standalone --include-in-header=header.html --include-after-body=scripts.gen.html
