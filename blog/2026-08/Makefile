qoe.html: qoe.md header.html collage.js scripts.html
	sed -E "s/src=\"([a-z0-9]+\.js)\"/src=\"\1?v=$$(date +%s)\"/g" scripts.html > scripts.gen.html
	pandoc qoe.md -o qoe.html --standalone --include-in-header=header.html --include-after-body=scripts.gen.html

gym.html: gym.md convergence-map.html pareto.html lightbox.html counter.html head.html footer.html
	sed -e '/<!--CONVERGENCE-MAP-->/r convergence-map.html' -e '/<!--CONVERGENCE-MAP-->/d' \
	    -e '/<!--PARETO-->/r pareto.html' -e '/<!--PARETO-->/d' \
	    -e '/<!--LIGHTBOX-->/r lightbox.html' -e '/<!--LIGHTBOX-->/d' gym.md > gym.gen.md
	pandoc gym.gen.md -o gym.html --standalone --shift-heading-level-by=1 --highlight-style=tango --mathml \
	    --include-in-header=head.html \
	    --include-after-body=footer.html --include-after-body=counter.html
