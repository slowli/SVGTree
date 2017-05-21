'use strict';

const parse5 = require('parse5');
const curry = require('curry-chain/fn');
const htmlparser2 = parse5.treeAdapters.htmlparser2;

const SVGNS = 'http://www.w3.org/2000/svg';

const svgParser = Object.assign({}, htmlparser2, {
  createElement (tagName, namespace, attributes) {
    var elem = htmlparser2.createElement(tagName, SVGNS, attributes);

    elem.append = function (children) {
      if (!Array.isArray(children)) {
        children = [ children ];
      }
      for (var child of children) {
        if (typeof child === 'string') {
          child = htmlparser2.insertText(this, child);
        } else {
          htmlparser2.appendChild(this, child);
        }
      }
      return this;
    };

    elem.attr = function (name, value) {
      if (arguments.length === 1) {
        return this.attribs[name] || '';
      }

      // Unset attribute
      delete this.attribs[name];
      if (value === undefined || value === null) {
        return this;
      }

      if (name === 'style' && typeof value === 'object') {
        value = stringifyStyle(value);
      }

      htmlparser2.adoptAttributes(this, [{
        name: name,
        value: value.toString(),
        namespace: '',
        prefix: ''
      }]);

      return this;
    };

    elem.remove = function () {
      htmlparser2.detachNode(this);
    };

    elem.toString = function () {
      return stringify(this);
    };

    if (tagName === 'svg') {
      // add xmlns tag
      htmlparser2.adoptAttributes(elem, [{
        name: 'xmlns',
        value: SVGNS
      }]);
    }
    return elem;
  }
});

function parse (str) {
  var parsed = parse5.parseFragment(str, {
    treeAdapter: svgParser
  });
  return parsed.children[0];
}

function stringify (elem) {
  var doc = svgParser.createDocumentFragment();
  svgParser.appendChild(doc, elem);
  var str = parse5.serialize(doc, {
    treeAdapter: svgParser
  });
  svgParser.detachNode(elem);
  return str;
}

function stringifyStyle (style) {
  if (typeof style === 'string') return style;
  var s = '';
  for (var key in style) {
    s += `${key}: ${style[key]};`;
  }
  return s;
}

module.exports = {
  SVGNS: SVGNS,

  svgTag (tag) {
    return svgParser.createElement(tag, SVGNS, []);
  },

  chainable (fn) {
    return curry.fn(fn).with.language('with', 'and')
      .where.arg(0).has.sink('with').and
      .setter('withDefaults', (old, val) => Object.assign({}, val, old || {}));
  },

  stringify: stringify,
  parse: parse
};
