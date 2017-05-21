'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const Tree = require('../lib/tree');
const newick = require('../lib/newick');
const layout = require('../lib/layout');

const SAMPLES = require('./layouts.json');

function expectLayout (tree, expectedLayout) {
  var layout = tree.walk((v, ch) => {
    var l = {
      sibling: v.pos.sibling,
      depth: v.pos.depth
    };
    if (ch.length > 0) l.children = ch;
    return l;
  });
  expect(layout).to.deep.equal(expectedLayout);
}

describe('layout', function () {
  describe('lame algorithm', function () {
    it('should work trivially for a single-node tree', function () {
      var tree = new Tree('abc');
      layout(tree, { algorithm: 'lame' });
      expect(tree.pos.sibling).to.equal(0);
      expect(tree.pos.depth).to.equal(0);
    });

    it('should assign positions to a node with 2 children', function () {
      var tree = newick('(a,b)c');
      layout(tree, { algorithm: 'lame' });

      expect(tree.pos).to.deep.equal({ sibling: 0.5, depth: 0 });
      expect(tree.children[0].pos).to.deep.equal({ sibling: 0, depth: 1 });
      expect(tree.children[1].pos).to.deep.equal({ sibling: 1, depth: 1 });
    });

    it('should assign positions to a node with 3 children', function () {
      var tree = newick('(a,b,c)d');
      layout(tree, { algorithm: 'lame' });

      expect(tree.pos).to.deep.equal({ sibling: 1, depth: 0 });
      expect(tree.children[0].pos).to.deep.equal({ sibling: 0, depth: 1 });
      expect(tree.children[1].pos).to.deep.equal({ sibling: 1, depth: 1 });
      expect(tree.children[2].pos).to.deep.equal({ sibling: 2, depth: 1 });
    });

    it('should assign positions to a node with complex descendants', function () {
      var tree = newick('((0,1)a,(2,3,4)b,(5)c)d');
      layout(tree, { algorithm: 'lame' });

      expect(tree.pos).to.deep.equal({ sibling: 2.75, depth: 0 });
      for (var i = 0; i < 6; i++) {
        expect(tree.find('' + i).pos).to.deep.equal({ sibling: i, depth: 2 });
      }
      expect(tree.find('a').pos).to.deep.equal({ sibling: 0.5, depth: 1 });
      expect(tree.find('b').pos).to.deep.equal({ sibling: 3, depth: 1 });
      expect(tree.find('c').pos).to.deep.equal({ sibling: 5, depth: 1 });
    });
  });

  describe('compact algorithm', function () {
    it('should work trivially for a single-node tree', function () {
      var tree = new Tree('abc');
      layout(tree, { algorithm: 'compact' });
      expect(tree.pos.sibling).to.equal(0);
      expect(tree.pos.depth).to.equal(0);
    });

    it('should assign positions to a node with 2 children', function () {
      var tree = newick('(a,b)c');
      layout(tree, { algorithm: 'compact' });

      expect(tree.pos).to.deep.equal({ sibling: 0.5, depth: 0 });
      expect(tree.children[0].pos).to.deep.equal({ sibling: 0, depth: 1 });
      expect(tree.children[1].pos).to.deep.equal({ sibling: 1, depth: 1 });
    });

    it('should assign positions to a node with 3 children', function () {
      var tree = newick('(a,b,c)d');
      layout(tree, { algorithm: 'compact' });

      expect(tree.pos).to.deep.equal({ sibling: 1, depth: 0 });
      expect(tree.children[0].pos).to.deep.equal({ sibling: 0, depth: 1 });
      expect(tree.children[1].pos).to.deep.equal({ sibling: 1, depth: 1 });
      expect(tree.children[2].pos).to.deep.equal({ sibling: 2, depth: 1 });
    });

    SAMPLES.forEach(sample => {
      it('should compact the tree ' + sample.tree, function () {
        var tree = newick(sample.tree);
        layout(tree, { algorithm: 'compact' });
        expectLayout(tree, sample.expected);
      });
    });
  });
});
