'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const label = require('../../lib/svg/label');
const centered = label.centered;

describe('labels', function () {
  describe('centered', function () {
    it('should return an SVG element', function () {
      var node = { x: 10, y: 20, data: 'some text' };
      var svg = centered.call(node, { fontSize: 12 });
      expect('' + svg).to.contain('<text')
        .and.contain(' font-size="12"')
        .and.contain('>some text</text>')
        .and.not.contain(' fill=');
    });

    it('should serialize style attribute', function () {
      var node = { x: 10, y: 20, data: 'some text' };
      var svg = centered.call(node, { fontSize: 10, style: { 'font-weight': 'bold' } });
      expect('' + svg).to.contain('<text')
      .and.contain(' font-size="10"')
      .and.contain(' style="font-weight: bold;"');
    });
  });
});
