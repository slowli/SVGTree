'use strict';

const Tree = require('../tree');
const newick = require('../newick');

module.exports = class SVGTreeNode extends Tree {
  static parse (text) {
    return newick(text, data => new this(data));
  }

  constructor (data, owner) {
    super(data);

    this.x = 0; // SVG coordinates of the center of the node
    this.y = 0;
    this.owner = owner;
    this._svg = {}; // SVG elements owned by this node (marker, edge, label, etc.)
  }

  _setCoordinates (options) {
    var x = this.pos.depth;
    var y = this.pos.sibling;

    x *= options.depthDistance;
    y *= options.leafDistance;

    if (options.orientation === 'h') {
      this.x = x; this.y = y;
    } else {
      this.x = y; this.y = x;
    }
  }

  /**
   * Removes this node and all its descendants from the tree.
   */
  remove () {
    this.detach();
    this.removeSVG();
    if (this.owner) this.owner._notifyChange(this, 'removed');
  }

  /**
   * Sets data (~label) for this node.
   */
  setData (data) {
    if (this.data === data) return;

    this.data = data;
    if (this.owner) this.owner._notifyChange(this, 'data set');
  }

  /**
   * Inserts content as a child of this node at a specific position.
   * The content may be either an existing node or a text in Newick format.
   */
  insertContent (node, position) {
    if (position === undefined) position = this.children.length;
    if (typeof node === 'number') {
      position = node; node = ';';
    } else if (node === undefined) {
      node = ';';
    }

    var oldPosition = null;

    if (typeof node === 'string') {
      node = this.owner.parse(node);
    } else {
      if (node.parent === this) oldPosition = node.position();

      // Check if the node being inserted is the ancestor of the new parent node.
      // If it is so, we must use special processing.
      for (var child of node.queue()) {
        if (child === this) {
          var nodePos = node.position();
          this.detach();
          node.detach();
          if (node.parent) {
            node.parent.insert(this, nodePos);
          } else {
            this.owner.root = this;
            this._svg.edge.remove(); // ???
            this._svg.edge = null;
          }
          break;
        }
      }
    }
    this.insert(node, position);

    if (node.position() !== oldPosition) {
      if (this.owner) this.owner._notifyChange(this, 'repositioned');
    }

    return node;
  }

  removeSVG () {
    for (var node of this.queue()) {
      for (var key in node._svg) {
        node._svg[key].remove();
      }
    }
  }
};
