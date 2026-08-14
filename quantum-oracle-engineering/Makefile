MATHJAX    := https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js
SLIDE_DEPS := slides.lua slides.css slides.js

# Content hash of the shared assets, appended to their URLs so an edited
# stylesheet or script is never served from a stale browser cache.
ASSET_VER  := $(shell cat slides.css slides.js | cksum | cut -d' ' -f1)

# Same treatment for the landing page's own scripts, spliced into a generated
# copy of the header at build time.
PAGE_VER   := $(shell cat signup.js spotlight.js | cksum | cut -d' ' -f1)

# A deck is any subdirectory holding a slides.md, so directory names stay free
# to be keyword slugs.  The slug is the URL, and nothing encodes lesson order:
# reordering the course renames nothing.
DECK_MD   := $(wildcard */slides.md)
DECK_HTML := $(patsubst %/slides.md,%/index.html,$(DECK_MD))

PAGES := index.html $(DECK_HTML)

all: $(PAGES)

index.html: index.md header.html signup.js spotlight.js
	sed -E 's/src="([a-z]+\.js)"/src="\1?v=$(PAGE_VER)"/g' header.html > header.gen.html
	pandoc $< -o $@ --standalone --shift-heading-level-by=-1 -H header.gen.html

# Two blanked template variables: `mathjax` would otherwise inject a polyfill.io
# script tag (the MathJax script itself still comes through), and `document-css`
# would inject pandoc's default stylesheet, whose `body { max-width: 36em }`
# fights the full-bleed slide layout.  `slug` becomes the canonical URL, which
# slides.lua emits along with the rest of the <head>.
%/index.html: %/slides.md $(SLIDE_DEPS)
	pandoc $< -o $@ --standalone --wrap=none --lua-filter=slides.lua \
	  --metadata slug=$* --metadata assets=$(ASSET_VER) --mathjax=$(MATHJAX) \
	  --variable=mathjax= --variable=document-css=

clean:
	rm -f $(PAGES) header.gen.html

.PHONY: all clean
