'use strict';

const helpers = require('./helpers');
const svgTag = helpers.svgTag;

function mix (a, b, q) {
  return a * q + b * (1.0 - q);
}

function renderEdge (type, node, parent, options) {
  if (!parent) return;
  if (!options) options = {};

  var points = [];
  var px = parent.x;
  var py = parent.y;
  var x = node.x;
  var y = node.y;
  var t;

  if (options.orientation === 'h') {
    t = py; py = px; px = t;
    t = y; y = x; x = t;
  }

  switch (type) {
    case 'straight':
      points = ['M', px, py, 'L', x, y];
      break;
    case 'angular':
      points = [
        'M', px, py,
        'L', px, mix(py, y, 0.8), x, mix(py, y, 0.8),
        'L', x, y
      ];
      break;
    case 'bezier':
      if (px === x || py === y) {
        points = ['M', px, py, 'L', x, y];
      } else {
        points = [
          'M', px, py,
          'Q', mix(px, x, 0.95), mix(py, y, 0.8), mix(px, x, 0.5), mix(py, y, 0.75),
          'T', x, y
        ];
      }
      break;
  }

  if (options.orientation === 'h') {
    for (var i = 0; i < points.length; i++) {
      if (typeof points[i] === 'number') {
        t = points[i];
        points[i] = points[i + 1];
        points[i + 1] = t;
        i++;
      }
    }
  }

  return svgTag('path')
    .attr('d', points.join(' '))
    .attr('stroke', options.color)
    .attr('stroke-width', options.width);
}

const edge = module.exports = helpers.chainable(function (options) {
  return renderEdge(options.type, this, this.parent, options);
}).with.options('type', 'color', 'width').done();

// Aliases
edge.straight = edge.type('straight');
edge.angular = edge.type('angular');
edge.bezier = edge.type('bezier');

edge.wrapper = function (options) {
  return svgTag('g')
    .attr('fill', 'none')
    .attr('stroke', options.edge.color)
    .attr('stroke-width', options.edge.width)
    .append(this.items);
};
