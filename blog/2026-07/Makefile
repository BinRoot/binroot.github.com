cccx.html: cccx.md qcircuit.js spatial.js crossword.js chickenwire.js speedrun.js scripts.html header.html
	sed -E "s/src=\"([a-z0-9]+\.js)\"/src=\"\1?v=$$(date +%s)\"/g" scripts.html > scripts.gen.html
	pandoc cccx.md -o cccx.html --standalone --include-after-body=scripts.gen.html --include-in-header=header.html
