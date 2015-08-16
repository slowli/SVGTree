SVGTreeViewer
=========================

SVGTreeViewer is a widget using SVGTree library to create interactive trees.
Supported by all major browsers (Firefox, Google Chrome, and IE 11+).

Contents
--------------------------

  * **svgtree-viewer.js** - widget JS code
  * **svgtree-viewer.css** - supporting stylesheet
  * **icons.woff** - icon font for widget buttons
  * **demo-viewer.html** - demonstration of core capabilities of SVGTreeViewer
  
JS Dependencies
--------------------------

SVGTree.

Usage
---------------------------

To use the widget, include its script and stylesheet in the head section of the page 
together with SVGTree:

    <html>
    <head>
        <!-- other HTML -->
        <link rel="stylesheet" type="text/css" href="svgtree.css" />
		<link rel="stylesheet" type="text/css" href="svgtree-viewer.css" />
        <script src="svgtree.js"></script>
        <script src="svgtree-viewer.js"></script>
    </head>

Then, use SVGTreeViewer function to initialize the widget:

    <body>
		<!-- other elements -->
        <div id="tree"></div>
        <script>
        var notation = '((A,B)C,(D,E)F);',
            container = document.getElementById('tree');
        SVGTreeViewer(notation, container);
        </script>
    </body>
    </html>

The basic form of the function is

    SVGTreeViewer(notation, container, options)

where

  * `notation` is the [Newick format notation](https://en.wikipedia.org/Newick_format)
    for the displayed tree
  * `container` is the HTML element to hold the widget, normally an empty `<div>` element
  * `options` are the display options.

SVGTreeViewer widget supports all options of the SVGTree; they can be used to influence
the display of the tree. Additionally, the following options are supported:

  * **undo**

    Switches undo / redo capabilities of the widget. If undo option is true, a user can undo and redo
    actions that cause tree changes.

    Default value: `true`.

  * **newick**

    Switches the display of a Newick represenation of the displayed tree. If set to true, the user can view 
    Newick form of the tree and make changes to it provided the tree is modifiable.

    Default value: `true`.

  * **settings**

    Switches the display of the settings form. If set to true, the user can change basic display options
    of the tree (e.g., its orientation and node shape).

    Default value: `true`.

  * **footer**

    Switches the display of footer with buttons for node-specific actions (Add new child, Remove node, 
    Center plot on node). If set to false, the footer isn't displayed; the user still can modify the tree
    using keyboard combinations (e.g., Del to remove nodes). Footer is automatically hidden if the tree is read-only.

    Default value: `true`.

Examples
---------------------------
	
See **demo-viewer.html**.

