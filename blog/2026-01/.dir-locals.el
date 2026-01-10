((markdown-mode
  (markdown-command . ("pandoc" "-f" "markdown" "-t" "html5" "-s"
                       "--mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js"
                       "--template=template.html"
                       "--lua-filter=mathcolor.lua"
                       "--lua-filter=links_newtab.lua"
		       "--toc"
                       ))
  (markdown-command-needs-filename . nil)))
