'use strict';

/**
 * Recursively determines leaf-related positions of the nodes of the tree.
 * E.g., if the tree is rendered horizontally, this position determines the Y coordinate.
 *
 * @param {Tree} tree
 */
module.exports = function lameLayout (tree, options) {
  var pos = 0;
  tree.walk((node, children) => {
    if (!node.pos) node.pos = {};

    if (node.isLeaf()) {
      node.pos.sibling = pos;
      pos++;
    } else {
      node.pos.sibling = options.positionParent(children);
    }

    node.pos.depth = node.depth();

    return node.pos.sibling;
  });
};
