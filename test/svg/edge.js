'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const edge = require('../../lib/svg/edge');
const straight = edge.straight;
const angular = edge.angular;
const bezier = edge.bezier;

// Extracts points from an SVG path. Hacky, but will do for testing
function extractPoints (path) {
  path = path.match(/d="([^"]*)"/)[1];
  var coordinates = path.split(/\s+/)
    .map(x => parseInt(x))
    .filter(x => !isNaN(x));
  var points = [];
  for (var i = 0; i < coordinates.length; i += 2) {
    points.push([ coordinates[i], coordinates[i + 1] ]);
  }
  return points;
}

describe('edges', function () {
  describe('straight', function () {
    it('should create an SVG path with 2 points', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + straight.call(node)).to.contain('<path')
        .and.match(/ d=".*10 20.*"/)
        .and.match(/ d=".*40 -30.*"/)
        .and.not.contain(' stroke=')
        .and.not.contain(' stroke-width=');
    });

    it('should support color customization', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + straight.color('blue').call(node)).to.contain('<path')
        .and.match(/ d=".*10 20.*"/)
        .and.match(/ d=".*40 -30.*"/)
        .and.contain(' stroke="blue"')
        .and.not.contain(' stroke-width=');
    });

    it('should support width customization', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + straight.width(2).call(node)).to.contain('<path')
        .and.match(/ d=".*10 20.*"/)
        .and.match(/ d=".*40 -30.*"/)
        .and.contain(' stroke-width="2"')
        .and.not.contain(' stroke=');
    });
  });

  describe('angular', function () {
    it('should create an SVG path with 4 points', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      var edge = '' + angular.with({ orientation: 'v' }).call(node);
      expect(edge).to.contain('<path')
        .and.not.contain(' stroke=')
        .and.not.contain(' stroke-width=');

      var points = extractPoints(edge);
      expect(points).to.have.length(4);
      var ends = [points[0], points[points.length - 1]];
      var middles = points.slice(1, 3);
      expect(ends.some(pt => pt[0] === 10 && pt[1] === 20)).to.be.ok;
      expect(ends.some(pt => pt[0] === 40 && pt[1] === -30)).to.be.ok;
      expect(middles.some(pt => pt[0] === 10)).to.be.ok;
      expect(middles.some(pt => pt[0] === 40)).to.be.ok;
    });

    it('should create a different SVG path for horizontal orientation', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      var edge = '' + angular.with({ orientation: 'h' }).call(node);
      var points = extractPoints(edge);
      expect(points).to.have.length(4);
      var ends = [points[0], points[points.length - 1]];
      var middles = points.slice(1, 3);
      expect(ends.some(pt => pt[0] === 10 && pt[1] === 20)).to.be.ok;
      expect(ends.some(pt => pt[0] === 40 && pt[1] === -30)).to.be.ok;
      expect(middles).to.satisfy(arr => arr.some(pt => pt[1] === 20));
      expect(middles).to.satisfy(arr => arr.some(pt => pt[1] === -30));
    });

    it('should support color customization', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + angular.color('blue').call(node)).to.contain('<path')
        .and.contain(' stroke="blue"')
        .and.not.contain(' stroke-width=');
    });

    it('should support width customization', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + angular.width(2).call(node)).to.contain('<path')
        .and.contain(' stroke-width="2"')
        .and.not.contain(' stroke=');
    });
  });

  describe('bezier', function () {
    it('should create an SVG path with 4 points', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      var edge = '' + bezier.call(node, { orientation: 'v' });
      expect(edge).to.contain('<path')
        .and.not.contain(' stroke=')
        .and.not.contain(' stroke-width=');

      var points = extractPoints(edge);
      expect(points).to.have.length(4);
      var ends = [points[0], points[points.length - 1]];
      expect(ends.some(pt => pt[0] === 10 && pt[1] === 20)).to.be.ok;
      expect(ends.some(pt => pt[0] === 40 && pt[1] === -30)).to.be.ok;
    });

    it('should create a different SVG path for horizontal orientation', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      var edge = '' + bezier.call(node, { orientation: 'h' });
      expect(edge).to.contain('<path');
      expect(edge).to.not.equal(bezier.call(node, { orientation: 'v' }));
    });

    it('should support color customization', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + bezier.color('blue').call(node)).to.contain('<path')
        .and.contain(' stroke="blue"');
    });

    it('should support width customization', function () {
      var node = { x: 10, y: 20, parent: { x: 40, y: -30 } };
      expect('' + bezier.width(2).call(node)).to.contain('<path')
        .and.contain(' stroke-width="2"');
    });
  });
});
