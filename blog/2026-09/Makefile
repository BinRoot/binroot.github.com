pun.html: pun.md header.html footer.html scripts.html links.lua
	pandoc pun.md -o pun.html --standalone --lua-filter=links.lua --include-in-header=header.html --include-after-body=footer.html --include-after-body=scripts.html
