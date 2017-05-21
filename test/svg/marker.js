'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const marker = require('../../lib/svg/marker');
// markers don't really work without setting size, so setting it here
const circle = marker.circle.size(8);
const square = marker.square.size(8);

describe('markers', function () {
  describe('circle', function () {
    it('should render an SVG circle', function () {
      var node = { x: 10, y: 20 };
      expect('' + circle.call(node)).to.contain('<circle')
        .and.contain(' cx="10"')
        .and.contain(' cy="20"')
        .and.contain(' r="4"')
        .and.not.contain(' fill=');
    });

    it('should support color customization', function () {
      var node = { x: 10, y: 20 };
      var customCircle = circle.color('#ff0');
      expect('' + customCircle.call(node)).to.contain('<circle')
        .and.contain(' cx="10"')
        .and.contain(' cy="20"')
        .and.contain(' r="4"')
        .and.contain(' fill="#ff0"');
    });

    it('should support size customization', function () {
      var node = { x: 10, y: 20 };
      var customCircle = circle.size(16);
      expect('' + customCircle.call(node)).to.contain('<circle')
        .and.contain(' cx="10"')
        .and.contain(' cy="20"')
        .and.contain(' r="8"')
        .and.not.contain(' fill=');
    });

    it('should support complete customization', function () {
      var node = { x: 10, y: 20 };
      var customCircle = circle.size(16).color('blue');
      expect('' + customCircle.call(node)).to.contain('<circle')
        .and.contain(' cx="10"')
        .and.contain(' cy="20"')
        .and.contain(' r="8"')
        .and.contain(' fill="blue"');
    });
  });

  describe('square', function () {
    it('should render an SVG square', function () {
      var node = { x: 10, y: 20 };
      expect('' + square.call(node)).to.contain('<rect')
        .and.contain(' x="6"')
        .and.contain(' y="16"')
        .and.contain(' width="8"')
        .and.contain(' height="8"')
        .and.not.contain(' fill=');
    });

    it('should support color customization', function () {
      var node = { x: 10, y: 20 };
      var customSquare = square.color('#ff0');
      expect('' + customSquare.call(node)).to.contain('<rect')
        .and.contain(' x="6"')
        .and.contain(' y="16"')
        .and.contain(' width="8"')
        .and.contain(' height="8"')
        .and.contain(' fill="#ff0"');
    });

    it('should support size customization', function () {
      var node = { x: 10, y: 20 };
      var customSquare = square.size(20);
      expect('' + customSquare.call(node)).to.contain('<rect')
        .and.contain(' x="0"')
        .and.contain(' y="10"')
        .and.contain(' width="20"')
        .and.contain(' height="20"')
        .and.not.contain(' fill=');
    });
  });
});
