'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const helpers = require('../../lib/svg/helpers');

describe('svgTag', function () {
  it('should return tag with the specified name', function () {
    var tag = helpers.svgTag('text');
    expect(tag).to.have.property('children');
    expect(tag).to.have.property('tagName', 'text');
  });

  it('should declare namespace for the tag', function () {
    var tag = helpers.svgTag('circle');
    expect(tag).to.have.property('namespace', 'http://www.w3.org/2000/svg');
  });

  it('should support attribute setting', function () {
    var tag = helpers.svgTag('circle');
    tag.attr('cx', 10);
    tag.attr('cy', 20);
    expect(tag.attribs.cx).to.equal('10');
    expect(tag.attribs.cy).to.equal('20');
  });

  it('should support attribute setting in a chain', function () {
    var tag = helpers.svgTag('circle');
    tag.attr('cx', 10).attr('cy', 20);
    expect(tag.attribs.cx).to.equal('10');
    expect(tag.attribs.cy).to.equal('20');
  });

  it('should support attribute reassignment', function () {
    var tag = helpers.svgTag('circle');
    tag.attr('cx', 10);
    expect(tag.attribs.cx).to.equal('10');
    tag.attr('cx', -100);
    expect(tag.attribs.cx).to.equal('-100');
  });

  it('should support appending child elements', function () {
    var tag = helpers.svgTag('g');
    var circle = helpers.svgTag('circle');
    tag.append(circle);
    expect(tag.children).to.have.length(1);
    expect(tag.children[0]).to.equal(circle);
  });

  it('should support appending text content', function () {
    var tag = helpers.svgTag('g');
    tag.append('text');
    expect(tag.children).to.have.length(1);
    expect(tag.children[0]).to.have.property('type', 'text');
    expect(tag.children[0].data).to.equal('text');
  });

  it('should support appending multiple child elements', function () {
    var tag = helpers.svgTag('g');
    var circle = helpers.svgTag('circle');
    var rect = helpers.svgTag('rect');
    tag.append([circle, rect]);
    expect(tag.children).to.have.length(2);
    expect(tag.children[0]).to.equal(circle);
    expect(tag.children[1]).to.equal(rect);
  });
});

describe('parse', function () {
  it('should parse an SVG element', function () {
    var tag = helpers.parse('<circle />');
    expect(tag).to.have.property('children');
    expect(tag).to.have.property('tagName', 'circle');
    expect(tag.children).to.have.length(0);
  });

  it('should parse an SVG element with attributes', function () {
    var tag = helpers.parse('<circle r="8" cx="10" cy="20" />');
    expect(tag).to.have.property('tagName', 'circle');
    expect(tag.attr('r')).to.equal('8');
    expect(tag.attr('cx')).to.equal('10');
    expect(tag.attr('cy')).to.equal('20');
  });

  it('should parse an SVG element with embedded elements', function () {
    var tag = helpers.parse('<text font-size="11">A <tspan stroke="gray">(1)</tspan></text>');
    expect(tag).to.have.property('tagName', 'text');
    expect(tag.attr('font-size')).to.equal('11');
    expect(tag.children.length).to.equal(2);
    expect(tag.children[0].type).to.equal('text');
    expect(tag.children[1].tagName).to.equal('tspan');
    expect(tag.children[1].attr('stroke')).to.equal('gray');
  });
});
