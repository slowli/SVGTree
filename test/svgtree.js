'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const SVGTree = require('..');

describe('SVGTree', function () {
  it('should create a tree from a Newick notation', function () {
    var tree = new SVGTree('(a,b)c');
    expect(tree.root).to.have.property('data', 'c');
    expect(tree.root.find('a')).to.have.property('data', 'a');
    expect(tree.root.children[1]).to.have.property('data', 'b');
  });

  it('should create a tree from a Newick notation', function () {
    var tree = new SVGTree('((1,2,3,4,5,()6),7,()8,((13,14,15)10,11,12)9)');
    tree.root.find('9').label = { color: 'green' };
    tree.root.find('8').marker = { type: 'square' };
    tree.root.find('5').edge = { color: 'blue', width: 1.5 };
    tree.root.find('2').edge = SVGTree.edge.straight.with.color('red');
    tree.root.find('15').marker = SVGTree.marker.square.with({ size: 16 });
    var svg = tree.render();
    expect(svg.name).to.equal('svg');
  });
});
