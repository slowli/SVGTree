'use strict';
/* eslint-env node, mocha */

const expect = require('chai').expect;

const newick = require('../lib/newick');
const Token = newick.Token;
const Tree = require('../lib/tree');

describe('newick parser', function () {
  describe('Token', function () {
    [
      'SEMICOLON',
      'COMMA',
      'PAR_LEFT',
      'PAR_RIGHT'
    ].forEach(val => {
      it('should declare token constant ' + val, function () {
        expect(Token).to.have.property(val);
      });
    });

    describe('escape', function () {
      [
        '',
        'Testing',
        'Long Long Text с символами не из ASCII'
      ].forEach(str => {
        it(`should leave text without special symbols "${str}" intact`, function () {
          expect(Token.escape(str)).to.equal(str);
        });
      });

      it('should transform "("', function () {
        expect(Token.escape('(')).to.equal('\\(');
        expect(Token.escape('Abc(')).to.equal('Abc\\(');
      });

      it('should tranform ")"', function () {
        expect(Token.escape(')')).to.equal('\\)');
        expect(Token.escape('a)b')).to.equal('a\\)b');
      });

      it('should transform ","', function () {
        expect(Token.escape('apple, and banana')).to.equal('apple\\, and banana');
      });

      it('should transform ";"', function () {
        expect(Token.escape('apple; banana')).to.equal('apple\\; banana');
      });

      it('should transform "\\"', function () {
        expect(Token.escape('\\ XXX \\')).to.equal('\\\\ XXX \\\\');
      });
    });

    describe('unescape', function () {
      var ch;

      for (ch of '(),;\\') {
        it(`should unescape character ${ch}`, function () {
          expect(Token.unescape(ch)).to.equal(ch);
        });
      }

      for (ch of 'Ab!3Щ') {
        it(`should throw error when unescaping character ${ch} in strict mode`, function () {
          expect(() => Token.unescape(ch, true)).to.throw(Error);
        });

        it(`should unescape character ${ch} in lax mode`, function () {
          expect(Token.unescape(ch)).to.equal(ch);
        });
      }
    });

    describe('tokenize', function () {
      it('should tokenize an empty string as an empty array', function () {
        expect(Token.tokenize('')).to.deep.equal([]);
      });

      it('should tokenize a string without special chars as a single string', function () {
        expect(Token.tokenize('Lorem ipsum')).to.deep.equal([ 'Lorem ipsum' ]);
      });

      it('should tokenize a tree of height 2', function () {
        expect(Token.tokenize('(apple,banana)cider;')).to.deep.equal([
          Token.PAR_LEFT,
          'apple',
          Token.COMMA,
          'banana',
          Token.PAR_RIGHT,
          'cider',
          Token.SEMICOLON
        ]);
      });

      it('should tokenize a tree with escape chars', function () {
        expect(Token.tokenize('(app\\,le,ba\\(na\\)na)ci\\;der;')).to.deep.equal([
          Token.PAR_LEFT,
          'app,le',
          Token.COMMA,
          'ba(na)na',
          Token.PAR_RIGHT,
          'ci;der',
          Token.SEMICOLON
        ]);
      });
    });
  });

  it('should parse an empty tree', function () {
    var parsed = newick('');
    expect(parsed).to.be.instanceof(Tree)
      .and.have.deep.property('children.length', 0);
    expect(parsed).to.have.property('data', '');
  });

  it('should parse an empty tree written as ";"', function () {
    var parsed = newick(';');
    expect(parsed).to.be.instanceof(Tree)
      .and.have.deep.property('children.length', 0);
    expect(parsed).to.have.property('data', '');
  });

  it('should parse a single-element tree', function () {
    var parsed = newick('apple;');
    expect(parsed).to.be.instanceof(Tree)
      .and.have.deep.property('children.length', 0);
    expect(parsed).to.have.property('data', 'apple');
  });

  var simpleNewick = '(a,b)c;';
  it(`should parse a simple tree "${simpleNewick}"`, function () {
    var parsed = newick(simpleNewick);
    expect(parsed).to.be.instanceof(Tree);
    expect(parsed.data).to.equal('c');
    expect(parsed.children).to.have.property('length', 2);
    expect(parsed.children[0]).to.be.instanceof(Tree)
      .and.have.property('data', 'a');
    expect(parsed.children[1]).to.be.instanceof(Tree)
      .and.have.property('data', 'b');
  });

  it('should parse a tree with empty data labels', function () {
    var parsed = newick('(a,,)');
    expect(parsed.data).to.equal('');
    expect(parsed.children).to.have.property('length', 3);
    expect(parsed.children[0]).to.have.property('data', 'a');
    expect(parsed.children[2]).to.have.property('data', '');
  });

  it('should parse a tree with escaped chars', function () {
    var parsed = newick('(app\\;le,ba\\,\\(na\\)na)\\,lem\\\\on;');
    expect(parsed.data).to.equal(',lem\\on');
    expect(parsed.children).to.have.property('length', 2);
    expect(parsed.children[0]).to.have.property('data', 'app;le');
    expect(parsed.children[1]).to.have.property('data', 'ba,(na)na');
  });

  [
    '(',
    'apple(banana',
    '(,(()banana,,)lemon',
    '((a);'
  ].forEach(str => {
    it(`should not parse a tree with excessive "("-s: "${str}"`, function () {
      expect(() => newick(str)).to.throw(TypeError);
    });
  });

  [
    ')',
    'apple)banana',
    '(,())banana,,)lemon',
    'b)()a);'
  ].forEach(str => {
    it(`should not parse a tree with excessive ")"-s: "${str}"`, function () {
      expect(() => newick(str)).to.throw(TypeError);
    });
  });

  [
    'banana()apple',
    'banana();',
    '(ban(),(a,na),())'
  ].forEach(str => {
    it(`should not parse a tree with unexpected text nodes: "${str}"`, function () {
      expect(() => newick(str)).to.throw(TypeError);
    });
  });

  [
    'apple,',
    ',apple',
    ',,apple',
    ',',
    ',,',
    'apple,banana',
    '(,(le)mon,)apple,()banana'
  ].forEach(str => {
    it(`should not parse a tree with multiple top-level elements: "${str}"`, function () {
      expect(() => newick(str)).to.throw(TypeError);
    });
  });
});
