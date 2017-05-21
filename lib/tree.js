'use strict';

function removeFromArray (array, elem) {
  var idx = array.indexOf(elem);
  if (idx >= 0) {
    array.splice(idx, 1);
  }
  return array;
}

function _queue (root) {
  var queue = [ root ];
  var childPos = [];
  var ptr = 0;
  while (ptr < queue.length) {
    var node = queue[ptr];
    childPos[ptr] = queue.length;
    for (var i = node.children.length - 1; i >= 0; i--) {
      queue.push(node.children[i]);
    }
    ptr++;
  }
  return { queue: queue, childPos: childPos };
}

class Tree {
  /**
   * Creates a new tree node.
   *
   * @constructor
   * @param {String} data
   *    data associated with the node
   */
  constructor (data) {
    if (!data) data = '';

    this.children = [];
    this.parent = null;
    this.data = data;
  }

  /**
   * Appends a child to the list of children of this node.
   *
   * @param {Tree} child
   */
  append (child) {
    if (child.parent !== null) {
      removeFromArray(child.parent.children, child);
    }
    this.children.push(child);
    child.parent = this;
    return this;
  }

  /**
   * Adds a node as a first child of this node.
   *
   * @param {Tree} child
   *    node to add as a child
   */
  prepend (child) {
    if (child.parent !== null) {
      removeFromArray(child.parent.children, child);
    }
    this.children.splice(0, 0, child);
    child.parent = this;
    return this;
  }

  insert (child, position) {
    if (child.parent === this) {
      var currentPos = child.position();
      if (currentPos < position) position--;
    }

    if (child.parent !== null) {
      removeFromArray(child.parent.children, child);
    }
    this.children.splice(position, 0, child);
    child.parent = this;
    return this;
  }

  /**
   * Returns a queue containing this node and all its descendants in the order
   * of a breadth-first search (each parent before its children).
   *
   * @returns {Array}
   *    array of nodes
   */
  queue () {
    return _queue(this).queue;
  }

  /**
   * Checks if a node is a leaf (i.e., has no descendants).
   *
   * @returns {Boolean}
   */
  isLeaf () {
    return this.children.length === 0;
  }

  /**
   * Returns the root of the tree this node belongs to.
   *
   * @returns {Tree}
   */
  root () {
    var root = this;
    while (root.parent !== null) root = root.parent;
    return root;
  }

  /**
   * Detaches this node from its parent.
   */
  detach () {
    if (this.parent) {
      removeFromArray(this.parent.children, this);
    }
    this.parent = null;
  }

  /**
   * Calculates the zero-based position of this node among its siblings.
   *
   * @returns {Number}
   */
  position () {
    if (!this.parent) return -1;
    return this.parent.children.indexOf(this);
  }

  /**
   * Returns the siblings of the node (including the node itself). If the node
   * does not have a parent, its siblings is the node itself.
   *
   * @returns {Array<Tree>}
   */
  siblings () {
    if (!this.parent) return [ this ];
    return this.parent.children;
  }

  /**
   * Returns the depth of this node relative to the root of the tree
   * it belongs to.
   *
   * @returns {Number}
   */
  depth () {
    var depth = 0;
    var node = this;
    while (node.parent) {
      depth++;
      node = node.parent;
    }
    return depth;
  }

  /**
   * Recursively searches for a node with the given data atttached.
   *
   * @param matcher
   * @returns {Tree}
   *    node that matches the given data, or null if nothing found
   */
  find (matcher) {
    if (typeof matcher === 'function') {
      // Just what we need
    } else if (typeof matcher.test === 'function') {
      // E.g., regular expressions
      let pattern = matcher;
      matcher = data => pattern.test(data);
    } else {
      let reference = matcher;
      matcher = data => (data === reference);
    }

    var queue = [ this ];
    var ptr = 0;

    while (ptr < queue.length) {
      var node = queue[ptr];
      for (var child of node.children) {
        if (matcher(child.data)) return child;
        queue.push(child);
      }
      ptr++;
    }
    return null;
  }

  /**
   * Walks the tree, starting from leaves and proceeding to this node.
   * A callback function is called on each node being visited, allowing to transform
   * nodes if necessary. The callback function is called with 2 arguments:
   *
   *  - Current node being visited
   *  - Transformed children of the current node
   *
   * If the returned value of the callback is not `undefined`, the node is replaced
   * with this value and is supplied in the transformed form to the callback on the parent.
   */
  walk (fn) {
    var q = _queue(this);
    var queue = q.queue;
    for (var i = queue.length - 1; i >= 0; i--) {
      var slice = q.queue.slice(q.childPos[i],
        q.childPos[i] + queue[i].children.length).reverse();

      var result = fn(queue[i], slice);
      if (result !== undefined) queue[i] = result;
    }
    return queue[0];
  }
}

module.exports = Tree;
