##############################
# Builder for SVGTree. Creates minified versions of the library
# and supporting styles.
#
# (c) 2015, Alex Ostrovski
##############################

MINIFIER=yui-compressor
NAME=svgtree
VERSION=0.2
VERSDIR=versions

.PHONY: viewer

all: $(NAME).min.js $(NAME).min.css viewer

$(NAME).min.js: $(NAME).js
	$(MINIFIER) -o $@ $<

$(NAME).min.css: $(NAME).css
	$(MINIFIER) -o $@ $<
	
viewer:
	@echo Building viewer...
	cd viewer && $(MAKE) all && cd ..

archive: all
	cp $(NAME).js $(VERSDIR)/$(NAME)-$(VERSION).js
	cp $(NAME).css $(VERSDIR)/$(NAME)-$(VERSION).css
	cp $(NAME).min.js $(VERSDIR)/$(NAME)-$(VERSION).min.js
	cp $(NAME).min.css $(VERSDIR)/$(NAME)-$(VERSION).min.css
	cd viewer && $(MAKE) archive && cd ..

clean:
	rm -f *.min.js
	rm -f *.min.css
	cd viewer && $(MAKE) clean && cd ..
