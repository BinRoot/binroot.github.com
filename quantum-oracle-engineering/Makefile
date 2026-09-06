MATHJAX    := https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js
# assets/*.js are dependencies because inject.lua stamps each fragment's
# script src with a content hash of the file it references.
SLIDE_DEPS := slides.lua slides.css slides.js inject.lua \
  $(wildcard assets/*.html) $(wildcard assets/*.js)

# Content hash of the shared assets, appended to their URLs so an edited
# stylesheet or script is never served from a stale browser cache.
ASSET_VER  := $(shell cat slides.css slides.js | cksum | cut -d' ' -f1)

# Same treatment for the landing page's own scripts, spliced into a generated
# copy of the header at build time.
PAGE_VER   := $(shell cat signup.js spotlight.js | cksum | cut -d' ' -f1)

# A deck is any subdirectory holding a slides.md, so a directory is named for
# its lesson's title.  The slug is the URL, and nothing encodes lesson order:
# reordering the course renames nothing.
DECK_MD   := $(wildcard */slides.md)
DECK_HTML := $(patsubst %/slides.md,%/index.html,$(DECK_MD))

PAGES := index.html $(DECK_HTML)

# The course's mathematics, set in real LaTeX and rendered to SVGs of paths at
# build time.  Build time rather than MathJax at run time because the tutorial
# commits to running with networking disabled and the MathJax above is a CDN
# URL; --no-fonts turns every glyph into a path, so the results carry no font
# dependency either.  Drop a .tex in assets/ and it gets an .svg beside it.
EQ_TEX := $(wildcard assets/*.tex)
EQ_SVG := $(patsubst %.tex,%.svg,$(EQ_TEX))

all: $(EQ_SVG) $(PAGES)

assets/%.svg: assets/%.tex
	cd assets && latex -interaction=nonstopmode -halt-on-error $*.tex >/dev/null
	cd assets && dvisvgm --no-fonts --exact --bbox=4pt -o $*.svg $*.dvi >/dev/null 2>&1
	cd assets && rm -f $*.aux $*.log $*.dvi

index.html: index.md header.html signup.js spotlight.js
	sed -E 's/src="([a-z]+\.js)"/src="\1?v=$(PAGE_VER)"/g' header.html > header.gen.html
	pandoc $< -o $@ --standalone --shift-heading-level-by=-1 -H header.gen.html

# Two blanked template variables: `mathjax` would otherwise inject a polyfill.io
# script tag (the MathJax script itself still comes through), and `document-css`
# would inject pandoc's default stylesheet, whose `body { max-width: 36em }`
# fights the full-bleed slide layout.  `slug` becomes the canonical URL, which
# slides.lua emits along with the rest of the <head>.
# auto_identifiers is off for decks: slide ids are permalinks, so every id
# must be an explicit, deliberate `{#slug}`; slides.lua rejects slides that
# arrive without one, rather than letting pandoc invent a fragile slug from
# the title text.  `description-meta` is blanked because slides.lua emits the
# description tag itself (pandoc's template would duplicate it).
%/index.html: %/slides.md $(SLIDE_DEPS) $(EQ_SVG)
	pandoc -f markdown-auto_identifiers $< -o $@ --standalone --wrap=none \
	  --lua-filter=inject.lua --lua-filter=slides.lua \
	  --metadata slug=$* --metadata assets=$(ASSET_VER) --metadata lang=en \
	  --mathjax=$(MATHJAX) \
	  --variable=mathjax= --variable=document-css= --variable=description-meta=

# Every Sway number in the Lesson 2 deck comes from one seeded generator,
# which reproduces the paper's Table II by enumeration before it writes
# anything.  Not part of `all`: it takes ~15 s and its output is committed.
sway-data:
	node gen/sway-gen.mjs > assets/sway-data.js

clean:
	rm -f $(PAGES) header.gen.html $(EQ_SVG)

.PHONY: all clean sway-data
