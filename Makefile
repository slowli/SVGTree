##############################
# Builder for SVGTree. Creates minified versions of the library
# and supporting styles.
#
# (c) 2015, Alex Ostrovski
##############################

MINIFIER=yui-compressor
NAME=svgtree

all: $(NAME).min.js $(NAME).min.css

$(NAME).min.js: $(NAME).js
	$(MINIFIER) -o $@ $<

$(NAME).min.css: $(NAME).css
	$(MINIFIER) -o $@ $<

clean:
	rm -f $(NAME).min.js
	rm -f $(NAME).min.css
