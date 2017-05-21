'use strict';

const layout = require('./layout');
const newick = require('./newick');
const SVGTreeNode = require('./svg/svg-node');
const elements = require('./svg');
const helpers = require('./svg/helpers');

const DEFAULTS = require('./defaults');

// TODO probably move to `svg/index.js`
function renderSVG (tree) {
  var svgOptions = tree.options;
  var svgBody = elements.getRenderer('body', svgOptions.body);
  var groups = {};

  var queue = tree.root.queue(); // TODO visible
  for (var elementName of [ 'edge', 'marker', 'label' ]) {
    var explicitOptions = elements.explicitOptions(svgOptions[elementName]);
    var defaultFn = elements.getRenderer(elementName, explicitOptions);
    var items = [];

    for (var node of queue) {
      var fn = defaultFn;
      if (node[elementName]) {
        // There are specific settings for the node
        var options = (typeof node[elementName] === 'object')
          ? Object.assign({}, explicitOptions, node[elementName])
          : node[elementName].withDefaults(explicitOptions);
        fn = elements.getRenderer(elementName, options);
      }
      var elem = fn.call(node, tree.options);

      if (!elem) continue;
      node._svg[elementName] = elem;
      items.push(elem);
    }

    var wrapper = elements[elementName].wrapper.call({
      items: items
    }, tree.options);
    groups[elementName + 's'] = wrapper;
  }

  return svgBody.call(groups, tree.options);
}

class SVGTree {
  constructor (newick, options) {
    this.root = null;
    this.options = Object.assign({ }, DEFAULTS);
    this.setOptions(options);

    this.selectedNode = null;
    this.setContent(newick, false);
  }

  /**
   * Completes options with default values.
   *
   * @param {Object} options
   *    tree display options
   * @returns {Object}
   *    complete options
   */
  setOptions (options) {
    this.options = Object.assign({ }, options, this.options);

    if (this.svg) {
      this.root.removeSVG();
      this.root.render();
      if (this.selectedNode) this.select(this.selectedNode);
    }
  }

  /**
   * Sets the content of this tree.
   */
  setContent (text, notify) {
    if (notify === undefined) notify = true;

    if (this.root) this.root.removeSVG();
    this.root = newick(text, data => new SVGTreeNode(data, this));
    if (notify) this._notifyChange(); // ???
  }

  /**
   * Renders the tree or its part.
   *
   * @param {SVGTreeNode} [node]
   *    (optional) a specific node that was changed
   */
  render (node) {
    var queue = node ? [ node ] : this.root.queue();
    var options = this.options;

    if (!node) {
      layout(this.root, this.options.layout);
      for (var i = queue.length - 1; i >= 0; i--) {
        queue[i]._setCoordinates(options);
      }
    } else {
      // We don't need to reposition nodes if we are rendering a single node
    }

    return renderSVG(this);
  }

  renderToString () {
    return helpers.stringify(this.render());
  }
}

for (var name in elements) {
  SVGTree[name] = elements[name];
}

module.exports = SVGTree;
