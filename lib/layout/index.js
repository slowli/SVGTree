'use strict';

const objectAssign = Object.assign || require('object-assign');

const PARENT_POS = {
  start (children) {
    return children[0];
  },

  nearStart (children) {
    return children[0] + (children.length > 1 ? 0.5 : 0);
  },

  end (children) {
    return children[children.length - 1];
  },

  nearEnd (children) {
    return children[children.length - 1] - (children.length > 1 ? 0.5 : 0);
  },

  center (children) {
    return (children[0] + children[children.length - 1]) / 2;
  },

  median (children) {
    const len = children.length;
    return len % 2 === 0
      ? (children[len / 2 - 1] + children[len / 2]) / 2
      : children[len / 2];
  }
};

const DEFAULTS = {
  algorithm: 'lame',
  positionParent: 'center'
};

module.exports = function (tree, options) {
  options = objectAssign({}, DEFAULTS, options);

  var algo = null;
  switch (options.algorithm) {
    case 'lame':
      algo = require('./lame');
      break;
    case 'compact':
      algo = require('./compact');
      break;
    default:
      throw new TypeError('Unknown layout algorithm: ' + algo);
  }

  if (PARENT_POS[options.positionParent]) {
    options.positionParent = PARENT_POS[options.positionParent];
  }

  return algo(tree, options);
};
