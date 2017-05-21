'use strict';

const helpers = require('./helpers');
const svgTag = helpers.svgTag;

function _marker (options) {
  const sz = options.size || this.owner.options.size;
  switch (options.type) {
    case 'circle':
      return svgTag('circle')
        .attr('r', sz / 2)
        .attr('cx', this.x)
        .attr('cy', this.y)
        .attr('fill', options.color);
    case 'square':
      return svgTag('rect')
        .attr('width', sz)
        .attr('height', sz)
        .attr('x', this.x - sz / 2)
        .attr('y', this.y - sz / 2)
        .attr('fill', options.color);
    default:
      throw new TypeError('Unknown marker type: ' + options.type);
  }
}

const marker = module.exports = helpers.chainable(_marker)
  .with.options('type', 'size', 'color').done();

// Aliases
marker.circle = marker.type('circle');
marker.square = marker.type('square');

marker.wrapper = function (options) {
  return svgTag('g')
    .attr('fill', options.marker.color)
    .append(this.items);
};
