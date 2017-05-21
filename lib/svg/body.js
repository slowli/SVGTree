'use strict';

const helpers = require('./helpers');
const svgTag = helpers.svgTag;

var body = function (options) {
  // TODO padding
  return svgTag('svg')
    .append(this.edges)
    .append(this.markers)
    .append(this.labels);
};
body = helpers.chainable(body).with.option('padding').done();

module.exports = body;
