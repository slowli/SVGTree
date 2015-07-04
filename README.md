SVGTree
=========================

A handy JavaScript library for drawing trees using scalable vector graphics (SVG).
Supported by all major browsers (Firefox, Google Chrome, and IE 11+).

Contents
--------------------------

  * **svgtree.js** - SVGTree library
  * **svgtree.css** - supporting stylesheet for displaying trees
  * **demo.html**, **demo.css** - demonstration of core capabilities of SVGTree
  
JS Dependencies
--------------------------

None.

Usage
---------------------------

To use the library, include its main script and stylesheet in the head section of the page:

    <html>
    <head>
        <!-- other HTML -->
        <link rel="stylesheet" type="text/css" href="svgtree.css" />
        <script src="svgtree.js"></script>
    </head>

Then, use SVGTree constructor to initialize the tree:

    <body>
		<!-- other elements -->
        <div id="tree"></div>
        <script>
        var notation = '((A,B)C,(D,E)F);',
            container = document.getElementById('tree');
        new SVGTree(notation, container);
        </script>
    </body>
    </html>

The basic form of the constructor is

    new SVGTree(notation, container, options)

where

  * `notation` is the [Newick format notation](https://en.wikipedia.org/Newick_format)
    for the tree
  * `container` is the HTML element to hold the tree, normally an empty `<div>` element
  * `options` are the display options.

Recognized options:

  * **orientation**

    Determines the orientation of the tree. One of the following:

      - `'h'` (children below their ancestors)
      - `'v'` (children to the right of their ancestors)

    Default value: `'v'`.

  * **nodes**

    Determines the shape of node markers. Allowed values are `'circle'`
    and `'square'`.

    Default value: `'circle'`.

  * **edges**

    Determines the shape of edges in the tree. Allowed values are `'straight'`
    and `'angular'`.

    Default value: `'angular'`.

  * **size**

    Determines the size of the <svg> element containing the tree.
    Either an array of two values that determine the width and the height
    of the <svg> element in pixels, or one of the two strings:
	
      - `'fit'` to resize the <svg> element to fit the entire tree after each rendering operation
      - `'keep'` to keep the size of the <svg> element set externally (e.g., in a stylesheet).

    Default value: `'keep'`.

  * **interaction**

    Determines how a user can interact with the tree. An array of zero or more strings:

      - `'collapse'` - user can collapse and expand nodes
      - `'rearrange'` - user can rearrange siblings
      - `'edit'` - user can edit node labels
      - `'add'` - user can add new nodes into the tree by pressing insert key
      - `'remove'` - user can remove nodes from the tree by pressing delete key
      - `'drag'` - user can use drag'n'drop to move or copy portions of the tree
        (note that the nodes can be dragged between two trees on the same HTML page)

    A special value `false` is equivalent to an empty array (no interactions allowed).

    Default value: `false`.

  * **dragAsText**

    Allows to drag text from outside sources. The dragged text is interpreted as Newick form 
	of a subtree to be added to the tree. In case the Newick form is malformed, 
	the text is used to create a single node.
			
	The same option allows dropping nodes anywhere on the HTML page or other applications
	where the text input is expected. The dropped text is the Newick representation 
	of the dragged subtree.

Examples
---------------------------
	
See **demo.html**.

