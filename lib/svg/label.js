'use strict';

const helpers = require('./helpers');
const svgTag = helpers.svgTag;

function centeredLabel (options) {
  if (!this.data) return;

  var x = this.x;
  var y = this.y + options.fontSize * 1.25 + 4;
  return svgTag('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('font-size', options.fontSize)
    .attr('fill', options.color)
    .attr('style', options.style)
    .append(this.data);
}

const label = module.exports = helpers.chainable(centeredLabel)
  .with.options('fontSize', 'color', 'style').done();

// Aliases
label.centered = label;

label.wrapper = function (options) {
  return svgTag('g')
    .append(this.items);
};
