'use strict';
/* eslint-env node, mocha */

const expect = require('chai')
  .use(require('sinon-chai'))
  .expect;
const sinon = require('sinon');

const SVGTreeNode = require('../../lib/svg/svg-node');
const layout = require('../../lib/layout');

describe('SVGTreeNode', function () {
  describe('_setCoordinates', function () {
    function getXY (node) {
      return node.walk((v, children) => v.isLeaf()
        ? { x: v.x, y: v.y }
        : { x: v.x, y: v.y, children: children }
      );
    }

    it('should set coordinates for an isolated node', function () {
      var tree = new SVGTreeNode('abc');
      tree.pos = { sibling: 0, depth: 0 };
      tree._setCoordinates({
        orientation: 'v',
        leafDistance: 40,
        depthDistance: 50
      });
      expect(tree).to.have.property('x', 0);
      expect(tree).to.have.property('y', 0);
    });

    it('should set coordinates for a simple tree in vertical mode', function () {
      var tree = SVGTreeNode.parse('(a,b)c');
      tree.pos = { sibling: 0.5, depth: 0 };
      tree.children[0].pos = { sibling: 0, depth: 1 };
      tree.children[1].pos = { sibling: 1, depth: 1 };

      tree.queue().forEach(v => {
        v._setCoordinates({
          orientation: 'v',
          leafDistance: 40,
          depthDistance: 50
        });
      });
      expect(tree.x).to.equal(20);
      expect(tree.y).to.equal(0);
      expect(tree.children[0].x).to.equal(0);
      expect(tree.children[0].y).to.equal(50);
      expect(tree.children[1].x).to.equal(40);
      expect(tree.children[1].y).to.equal(50);
    });

    it('should set coordinates for a simple tree in horizontal mode', function () {
      var tree = SVGTreeNode.parse('(a,b)c');
      tree.pos = { sibling: 0.5, depth: 0 };
      tree.children[0].pos = { sibling: 0, depth: 1 };
      tree.children[1].pos = { sibling: 1, depth: 1 };

      tree.queue().forEach(v => {
        v._setCoordinates({
          orientation: 'h',
          leafDistance: 40,
          depthDistance: 50
        });
      });
      expect(tree.x).to.equal(0);
      expect(tree.y).to.equal(20);
      expect(tree.children[0].x).to.equal(50);
      expect(tree.children[0].y).to.equal(0);
      expect(tree.children[1].x).to.equal(50);
      expect(tree.children[1].y).to.equal(40);
    });

    it('should set coordinates for a complex tree in vertical mode', function () {
      var tree = SVGTreeNode.parse('((1,2,3)a,4)b');
      layout(tree, { algorithm: 'lame' });
      tree.walk(v => {
        v._setCoordinates({
          orientation: 'v',
          leafDistance: 40,
          depthDistance: 50
        });
      });

      var expected = {
        x: 80,
        y: 0,
        children: [
          {
            x: 40,
            y: 50,
            children: [
              { x: 0, y: 100 },
              { x: 40, y: 100 },
              { x: 80, y: 100 }
            ]
          },
          { x: 120, y: 50 }
        ]
      };
      expect(getXY(tree)).to.deep.equal(expected);
    });
  });

  describe('parse', function () {
    it('should return SVGTreeNode instances for nodes', function () {
      var tree = SVGTreeNode.parse('(a,b)c');
      expect(tree).to.be.instanceof(SVGTreeNode);
      expect(tree.children[0]).to.be.instanceof(SVGTreeNode);
      expect(tree.children[1]).to.be.instanceof(SVGTreeNode);
    });
  });

  describe('constructor', function () {
    it('should give x and y properties to a node', function () {
      var node = new SVGTreeNode('abc');
      expect(node).to.have.property('x', 0);
      expect(node).to.have.property('y', 0);
    });
  });

  describe('remove', function () {
    it('should remove SVG elements from the SVG element tree', function () {
      var node = new SVGTreeNode('abc');
      node._svg.marker = { remove: sinon.stub().returns() };
      node._svg.edge = { remove: sinon.stub().returns() };
      node.remove();
      expect(node._svg.marker.remove).to.have.been.calledOnce;
      expect(node._svg.edge.remove).to.have.been.calledOnce;
    });

    it('should remove SVG elements of descendants from the SVG element tree', function () {
      var node = SVGTreeNode.parse('(a,b)c');
      node.children[0]._svg = {
        marker: { remove: sinon.stub().returns() }
      };
      node.children[1]._svg = {
        edge: { remove: sinon.stub().returns() }
      };
      node.remove();
      expect(node.children[0]._svg.marker.remove).to.have.been.calledOnce;
      expect(node.children[1]._svg.edge.remove).to.have.been.calledOnce;
    });

    it('should notify the owner about the change', function () {
      var node = new SVGTreeNode('abc');
      node.owner = {
        _notifyChange: sinon.stub().returns()
      };
      node.remove();
      expect(node.owner._notifyChange).to.have.been.calledOnce
        .and.calledWith(node, 'removed');
    });
  });
});
