PAGES := index.html $(patsubst %/index.md,%/index.html,$(wildcard */index.md))

all: $(PAGES)

%.html: %.md header.html
	pandoc $< -o $@ --standalone --shift-heading-level-by=-1 -H header.html

clean:
	rm -f $(PAGES)

.PHONY: all clean
