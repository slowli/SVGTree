SVGTree
=========================

A handy JavaScript library for drawing trees using scalable vector graphics (SVG).
Supported by all major browsers (Firefox, Google Chrome, and IE 11+).

Contents
--------------------------
  * **src/** - Source files 
  * **src/svgtree.js** - SVGTree library
  * **src/svgtree.css** - supporting stylesheet for displaying trees
  * **src/svgtree-viewer.js** - SVGTree viewer widget
  * **src/icons.woff** - icons used in the viewer widget
  * **src/svtgree-viewer.css** - stylesheet for displaying the viewer widget
  * **views/** - Jade view templates
  
JS Dependencies
--------------------------

None.

Building
---------------------------

The library uses Grunt the automated builds. Build modes:

  * **test** - runs JSHint
  * **pub** - runs JSHint, then creates public versions of the SVGTree library and styles in the **public/** directory.
    After the task is completed, the Node server can be launched with the `npm start` command.
  * **static** - same as **pub** + creates the static website version in the **static-html/** directory.
  * **clean** - cleans the build by removing temporary files, as well as **public/** and  **static-html/** directories.

Usage
---------------------------

See demo pages of the local web server ([http://localhost:4000/](http://localhost:4000/) by default) for examples of usage.

