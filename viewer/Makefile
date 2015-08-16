##############################
# Builder for SVGTreeViewer. Creates minified versions of the viewer plugin
# and supporting styles.
#
# (c) 2015, Alex Ostrovski
##############################

MINIFIER=yui-compressor
NAME_V=svgtree-viewer
ICONS=icons.woff
VERSION=0.2
VERSDIR=../versions

all: $(NAME_V).min.js $(NAME_V).min.css
	
$(NAME_V).min.js: $(NAME_V).js
	$(MINIFIER) -o $@ $<
	
$(NAME_V).min.css: $(NAME_V).css $(ICONS)
	base64 -w0 $(ICONS) \
		| xargs -I '{}' sed -e s%$(ICONS)?refresh%data:application/font-woff\;base64,'{}'% $< \
		| $(MINIFIER) --type css -o $@

archive: all
	cp $(NAME_V).js $(VERSDIR)/$(NAME_V)-$(VERSION).js
	cp $(NAME_V).css $(VERSDIR)/$(NAME_V)-$(VERSION).css
	cp $(NAME_V).min.js $(VERSDIR)/$(NAME_V)-$(VERSION).min.js
	cp $(NAME_V).min.css $(VERSDIR)/$(NAME_V)-$(VERSION).min.css

clean:
	rm -f *.min.js
	rm -f *.min.css
