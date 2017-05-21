'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const Tree = require('../lib/tree');

describe('Tree', function () {
  describe('constructor', function () {
    it('should create an empty tree if called without args', function () {
      var tree = new Tree();
      expect(tree.children).to.deep.equal([]);
      expect(tree.parent).to.be.null;
      expect(tree.data).to.equal('');
    });

    it('should create an leaf with specified data', function () {
      var tree = new Tree('apple');
      expect(tree.children).to.deep.equal([]);
      expect(tree.parent).to.be.null;
      expect(tree.data).to.equal('apple');
    });
  });

  describe('append', function () {
    it('should append child into a childless tree', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      tree.append(child);
      expect(tree.children).to.deep.equal([ child ]);
    });

    it('should set parent to self in a child', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      tree.append(child);
      expect(child.parent).to.equal(tree);
    });

    it('should append child into a tree with children', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child);
      tree.append(anotherChild);
      expect(tree.children).to.deep.equal([ child, anotherChild ]);
    });

    it('should remove child from the previous parent', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherTree = new Tree('lemon');
      anotherTree.append(child);
      expect(anotherTree.children).to.deep.equal([ child ]);

      tree.append(child);
      expect(tree.children).to.deep.equal([ child ]);
      expect(anotherTree.children).to.deep.equal([]);
      expect(child.parent).to.equal(tree);
    });

    it('should rearrange children when called on existing child', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild).append(child);
      expect(tree.children).to.deep.equal([ anotherChild, child ]);
    });
  });

  describe('prepend', function () {
    it('should append child into a childless tree', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      tree.prepend(child);
      expect(tree.children).to.deep.equal([ child ]);
    });

    it('should set parent to self in a child', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      tree.prepend(child);
      expect(child.parent).to.equal(tree);
    });

    it('should prepend child into a tree with children', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.prepend(child);
      tree.prepend(anotherChild);
      expect(tree.children).to.deep.equal([ anotherChild, child ]);
    });

    it('should remove child from the previous parent', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherTree = new Tree('lemon');
      anotherTree.prepend(child);
      expect(anotherTree.children).to.deep.equal([ child ]);

      tree.prepend(child);
      expect(tree.children).to.deep.equal([ child ]);
      expect(anotherTree.children).to.deep.equal([]);
      expect(child.parent).to.equal(tree);
    });

    it('should rearrange children when called on existing child', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.prepend(child).prepend(anotherChild).prepend(child);
      expect(tree.children).to.deep.equal([ child, anotherChild ]);
    });
  });

  describe('isLeaf', function () {
    it('should return true on an isolated node', function () {
      var tree = new Tree('apple');
      expect(tree.isLeaf()).to.be.true;
    });

    it('should return true on a leaf node', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);
      expect(child.isLeaf()).to.be.true;
      expect(anotherChild.isLeaf()).to.be.true;
    });

    it('should return false on a branch node', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);
      expect(tree.isLeaf()).to.be.false;
    });
  });

  describe('root', function () {
    it('should return self on isolated node', function () {
      var tree = new Tree('apple');
      expect(tree.root()).to.equal(tree);
    });

    it('should return root on a leaf node', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);
      expect(child.root()).to.equal(tree);
      expect(anotherChild.root()).to.equal(tree);
    });
  });

  describe('position', function () {
    it('should return -1 on an isolated node', function () {
      var tree = new Tree('apple');
      expect(tree.position()).to.equal(-1);
    });

    it('should work with leaf nodes', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);
      expect(child.position()).to.equal(0);
      expect(anotherChild.position()).to.equal(1);
    });
  });

  describe('depth', function () {
    it('should return 0 on an isolated node', function () {
      var tree = new Tree('apple');
      expect(tree.depth()).to.equal(0);
    });

    it('should return 0 on a root node', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);
      expect(tree.depth()).to.equal(0);
    });

    it('should work with leaf nodes', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);
      expect(child.depth()).to.equal(1);
      expect(anotherChild.depth()).to.equal(1);
    });
  });

  describe('find', function () {
    it('should work with a string', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);

      expect(tree.find('banana')).to.equal(child);
    });

    it('should work with a regexp', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);

      expect(tree.find(/^le/)).to.equal(anotherChild);
    });

    it('should work with a function matcher', function () {
      var tree = new Tree('apple');
      var child = new Tree('banana');
      var anotherChild = new Tree('lemon');
      tree.append(child).append(anotherChild);

      expect(tree.find(data => data.length > 5)).to.equal(child);
    });
  });

  describe('walk', function () {
    it('should leave nodes intact if the callback does not return a value', function () {
      var tree = new Tree('a');
      tree.append(new Tree('b'));
      tree.append(new Tree('c'));

      tree.walk((v, children) => {
        if (v.data === 'a') {
          expect(children).to.deep.equal(tree.children);
        }
      });
    });

    it('should be able to enumerate all nodes in a tree', function () {
      var tree = new Tree('a');
      tree.append(new Tree('b'));
      tree.append(new Tree('c'));

      var nodes = [];
      tree.walk(v => { nodes.push(v.data); });
      expect(nodes).to.deep.equal(['b', 'c', 'a']);
    });

    it('should be able to count nodes in the tree', function () {
      var tree = new Tree('a');
      tree.append(new Tree('b').append(new Tree('c')).append(new Tree('d')));
      tree.append(new Tree('e'));

      var w = tree.walk((v, ch) => 1 + ch.reduce((x, y) => x + y, 0));
      expect(w).to.equal(5);
    });

    it('should be able to find the maximum node in the tree', function () {
      var tree = new Tree(1);
      tree.append(new Tree(5).append(new Tree(2)).append(new Tree(6)));
      tree.append(new Tree(4));

      var w = tree.walk((v, ch) => Math.max(v.data, Math.max.apply(null, ch)));
      expect(w).to.equal(6);
    });

    it('should be able to find the sum over nodes in the tree', function () {
      var tree = new Tree(1);
      tree.append(new Tree(5).append(new Tree(2)).append(new Tree(6)));
      tree.append(new Tree(4));

      var w = tree.walk((v, ch) => v.data + ch.reduce((x, y) => x + y, 0));
      expect(w).to.equal(18);
    });

    it('should be able to convert nodes into an array', function () {
      var tree = new Tree('a');
      tree.append(new Tree('b').append(new Tree('c')).append(new Tree('d')));
      tree.append(new Tree('e'));

      var w = tree.walk((v, ch) => {
        var arr = [ v.data ];
        ch.forEach(u => Array.prototype.push.apply(arr, u));
        return arr;
      });
      expect(w).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
    });

    it('should be able to convert nodes into an object', function () {
      var tree = new Tree('a');
      tree.append(new Tree('b').append(new Tree('c')).append(new Tree('d')));
      tree.append(new Tree('e'));

      var w = tree.walk((v, ch) => ch.length
        ? { data: v.data, children: ch }
        : { data: v.data }
      );
      expect(w).to.deep.equal({
        data: 'a',
        children: [
          {
            data: 'b',
            children: [
              { data: 'c' },
              { data: 'd' }
            ]
          },
          { data: 'e' }
        ]
      });
    });

    it('should be able to aggregate all values in the tree', function () {
      var tree = new Tree('a');
      tree.append(new Tree('b'));
      tree.append(new Tree('c'));

      var w = tree.walk((v, ch) => v.data + ch.join(''));
      expect(w).to.equal('abc');
    });
  });
});
