'use strict';

/**
 * Compact tree layout algorithm adapted from http://dirk.jivas.de/papers/buchheim02improving.pdf.
 */

/**
 * Retrieves layout variables from a tree node, initializing them if necessary.
 *
 * @param {Tree} node
 * @returns {Object}
 */
function layoutVars (node) {
  if (!node.__layout) {
    node.__layout = {
      prelim: 0,
      modifier: 0,
      change: 0,
      shift: 0
    };
  }
  return node.__layout;
}

/**
 * Deletes layout variables associated with a tree node.
 *
 * @param {Tree} node
 */
function deleteLayoutVars (node) {
  delete node.__layout;
}

/**
 * Executes shifts on the node's children, spacing them out if necessary.
 * See the paper by Buchheim et al. for more details.
 *
 * @param {Tree} node
 */
function executeShifts (node) {
  var shift = 0;
  var change = 0;
  var children = node.children;

  for (var i = children.length - 1; i >= 0; i--) {
    var lVars = layoutVars(children[i]);
    lVars.prelim += shift;
    lVars.modifier += shift;
    change += lVars.change;
    shift += lVars.shift + change;
  }
}

/**
 * Traverses the left contour of a tree, using the `thread` layout variable
 * to speed up lookups.
 *
 * @param {Tree} node
 */
function nextLeft (node) {
  return node.isLeaf() ? layoutVars(node).thread : node.children[0];
}

/**
 * Traverses the right contour of a tree, using the `thread` layout variable
 * to speed up lookups.
 *
 * @param {Tree} node
 */
function nextRight (node) {
  return node.isLeaf() ? layoutVars(node).thread : node.children[node.children.length - 1];
}

/**
 * Moves a subtree to the `shift` distance of its left sibling `reference`,
 * evenly spacing out all siblings in between.
 *
 * This method uses `change` and `shift` layout variables instead of directly modifying
 * the sibling positions to get O(1) performance. These variables are later used
 * by {@link #executeShifts} to space out sibilings.
 *
 * @param {Tree} reference
 * @param {Tree} tree
 * @param {Number} shift
 */
function moveSubtree (reference, tree, shift) {
  var subtrees = tree.position() - reference.position();
  layoutVars(tree).change -= shift / subtrees;
  layoutVars(tree).shift += shift;
  layoutVars(reference).change += shift / subtrees;
  layoutVars(tree).prelim += shift;
  layoutVars(tree).modifier += shift;
}

/**
 * Gets the left of the greatest uncommon ancestors of `left` and `right`.
 *
 * @param {Tree} left
 * @param {Tree} right
 * @param {Tree} default_
 */
function ancestor (left, right, default_) {
  var ancestor = layoutVars(left).ancestor;
  if (ancestor && ancestor.parent === right.parent) {
    return ancestor;
  }
  return default_;
}

/**
 * Finds the minimum sibling position of the node by traversing the right contour
 * of the left siblings of the node and the left contour of the node itself.
 *
 * @param {Tree} node to align
 * @param {Tree} leftSibling the left sibling of the node
 * @param {Tree} defaultAncestor
 */
function apportion (node, leftSibling, defaultAncestor) {
  if (!leftSibling) {
    return defaultAncestor;
  }
  var inRight = node;
  var outRight = node;
  var inLeft = leftSibling;
  var outLeft = node.siblings()[0];

  var inRightShift = layoutVars(inRight).modifier;
  var outRightShift = layoutVars(outRight).modifier;
  var inLeftShift = layoutVars(inLeft).modifier;
  var outLeftShift = layoutVars(outLeft).modifier;

  while (nextRight(inLeft) && nextLeft(inRight)) {
    inLeft = nextRight(inLeft);
    inRight = nextLeft(inRight);
    outLeft = nextLeft(outLeft);
    outRight = nextRight(outRight);

    layoutVars(outRight).ancestor = node;
    var shift = (layoutVars(inLeft).prelim + inLeftShift) -
      (layoutVars(inRight).prelim + inRightShift) + 1;

    if (shift > 0) {
      moveSubtree(ancestor(inLeft, node, defaultAncestor), node, shift);
      inRightShift += shift;
      outRightShift += shift;
    }

    inLeftShift += layoutVars(inLeft).modifier;
    inRightShift += layoutVars(inRight).modifier;
    outLeftShift += layoutVars(outLeft).modifier;
    outRightShift += layoutVars(outRight).modifier;
  }

  if (nextRight(inLeft) && !nextRight(outRight)) {
    layoutVars(outRight).thread = nextRight(inLeft);
    layoutVars(outRight).modifier += inLeftShift - outRightShift;
  }

  if (nextLeft(inRight) && !nextLeft(outLeft)) {
    layoutVars(outLeft).thread = nextLeft(inRight);
    layoutVars(outLeft).modifier += inRightShift - outLeftShift;
    defaultAncestor = node;
  }

  return defaultAncestor;
}

module.exports = function (tree, options) {
  /**
   * The main step of the algorithm. Walks the tree from leaves to the root,
   * spacing the children with `executeShifts` and positions the node itself
   * with `apportion`.
   */
  function firstWalk (node, children) {
    var layout = layoutVars(node);
    var leftSibling = node.siblings()[node.position() - 1];

    if (node.isLeaf()) {
      layout.prelim = leftSibling ? (layoutVars(leftSibling).prelim + 1) : 0;
    } else {
      executeShifts(node);
      var coord = options.positionParent(children.map(layout => layout.prelim));

      if (leftSibling) {
        layout.prelim = layoutVars(leftSibling).prelim + 1;
        layout.modifier = layout.prelim - coord;
      } else {
        layout.prelim = coord;
      }
    }

    var parentVars = node.parent ? layoutVars(node.parent) : {};
    parentVars.defaultAncestor = apportion(node, leftSibling, parentVars.defaultAncestor || node);

    return layout;
  }

  tree.walk(firstWalk);
  tree.walkFromRoot((v, mod) => {
    mod = mod || 0;
    v.pos = { sibling: layoutVars(v).prelim + mod, depth: v.depth() };
    mod += layoutVars(v).modifier;
    deleteLayoutVars(v);
    return mod;
  });
};
