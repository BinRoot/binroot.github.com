# The QCE26 talk, built the way the course decks are.  The course's slide
# grammar, stylesheet, script, fragment injector and PDF export are used in
# place from ../quantum-oracle-engineering, so this folder holds only the
# talk: slides.md, the filter that gives it a talk's <head>, and the two
# files the site serves, slides.html and slides.pdf.
COURSE  := ../quantum-oracle-engineering
MATHJAX := https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js

# Content hash of the shared assets, appended to their URLs so an edited
# stylesheet or script is never served from a stale browser cache.
ASSET_VER := $(shell cat $(COURSE)/slides.css $(COURSE)/slides.js | cksum | cut -d' ' -f1)

# A fragment (`::: {#name}` in the markdown) is looked up beside slides.md,
# then in assets/.
SLIDE_DEPS := slides.lua $(COURSE)/slides.lua $(COURSE)/inject.lua \
  $(COURSE)/slides.css $(COURSE)/slides.js \
  $(wildcard assets/*.html) $(wildcard assets/*.js)

# Figures set in real LaTeX (the paper's own TikZ) and rendered to SVGs of
# paths at build time, the way the course builds its equations: --no-fonts
# turns every glyph into a path, so the result carries no font dependency.
# Drop a .tex in assets/ and it gets an .svg beside it.
FIG_TEX := $(wildcard assets/*.tex)
FIG_SVG := $(patsubst %.tex,%.svg,$(FIG_TEX))

all: $(FIG_SVG) slides.html

assets/%.svg: assets/%.tex
	cd assets && latex -interaction=nonstopmode -halt-on-error $*.tex >/dev/null
	cd assets && dvisvgm --no-fonts --exact --bbox=4pt -o $*.svg $*.dvi >/dev/null 2>&1
	cd assets && rm -f $*.aux $*.log $*.dvi

# The course's deck rule, minus `slug`: the canonical URL is this page, and
# slides.lua knows it.  The course Makefile documents the blanked template
# variables.
slides.html: slides.md $(SLIDE_DEPS) $(FIG_SVG)
	pandoc -f markdown-auto_identifiers $< -o $@ --standalone --wrap=none \
	  --lua-filter=$(COURSE)/inject.lua --lua-filter=slides.lua \
	  --metadata assets=$(ASSET_VER) --metadata lang=en \
	  --mathjax=$(MATHJAX) \
	  --variable=mathjax= --variable=document-css= --variable=description-meta=

# One page per slide, every step revealed.  Served from the site root so the
# page's ../quantum-oracle-engineering/ references resolve.  Not part of
# `all`: it drives a browser, and the result is committed.
pdf: slides.pdf

slides.pdf: slides.html $(COURSE)/gen/pdf.mjs
	node $(COURSE)/gen/pdf.mjs --root .. qce26/slides.pdf qce26/slides.html

clean:
	rm -f slides.html $(FIG_SVG)

.PHONY: all pdf clean
