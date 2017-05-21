'use strict';

const Tree = require('./tree');

/**
 * Tokenizer for Newick format.
 */
const Token = {
  SEMICOLON: 0,
  COMMA: 1,
  PAR_LEFT: 2,
  PAR_RIGHT: 3,

  escape (text) {
    var escaped = '';
    for (var ch of text) {
      if ('(),;\\'.indexOf(ch) < 0) {
        escaped += ch;
      } else {
        escaped += '\\' + ch;
      }
    }
    return escaped;
  },

  unescape (symbol, strict) {
    if (strict && (!symbol || ('(),;\\'.indexOf(symbol) < 0))) {
      throw new TypeError('Invalid location of backslash \\');
    }
    return symbol;
  },

  tokenize (text, strict) {
    var tokens = [];
    var pos = 0;

    while (pos < text.length) {
      switch (text[pos]) {
        case ';': tokens.push(Token.SEMICOLON); break;
        case ',': tokens.push(Token.COMMA); break;
        case '(': tokens.push(Token.PAR_LEFT); break;
        case ')': tokens.push(Token.PAR_RIGHT); break;
        default:
          var symbol = (text[pos] === '\\')
            ? Token.unescape(text[pos + 1]) : text[pos];
          if (typeof tokens[tokens.length - 1] === 'string') {
            tokens[tokens.length - 1] += symbol;
          } else {
            tokens.push(symbol);
          }
          if (text[pos] === '\\') pos++;
      }
      pos++;
    }
    return tokens;
  }
};

/**
 * Parses Newick format representation of a tree.
 *
 * @param {String} text
 *    tree representation
 * @param {Function=} factory
 *    factory for creating nodes; it is called with one parameter - node data.
 *    By default, the built-in Tree is used
 * @returns {Tree}
 *    the parsed tree
 */
function newick (text, factory) {
  if (factory === undefined) {
    factory = data => new Tree(data);
  }

  var tokens = Token.tokenize(text);
  if (tokens[tokens.length - 1] === Token.SEMICOLON) {
    tokens.length--;
  }

  var pos = tokens.length - 1;
  var parent = null;
  var root = null;
  var node = null;
  var dataSet = false;

  if (tokens[0] === Token.COMMA) {
    // This case is not caught by another check that throws the same exception
    throw new TypeError('Multiple top-level elements');
  }

  while (pos >= 0) {
    if (pos < tokens.length - 1 && tokens[pos + 1] === Token.PAR_LEFT) {
      // There shouldn't be a node here. If there erroneously is, we catch this case
      // in the `swicth` later
    } else {
      // This creates an implicit string token if necessary
      var data = (typeof tokens[pos] === 'string') ? tokens[pos] : '';
      if (typeof tokens[pos] === 'string') pos--;

      if (parent === null) {
        if (dataSet) {
          // We attempt to set data again for the same root node.
          // This can only happen if there are multiple top-level nodes in the tree.
          throw new TypeError('Multiple top-level elements');
        }
        root = factory(data); node = root; dataSet = true;
      } else {
        node = factory(data);
        parent.prepend(node);
      }
    }

    switch (tokens[pos]) {
      case Token.PAR_LEFT:
        if (!parent) throw new TypeError('Excessive opening parenthesis');
        parent = parent.parent;
        break;
      case Token.PAR_RIGHT:
        parent = node;
        break;
      case Token.COMMA:
      case undefined: // may occur if the first and the only token is a string
        // Do nothing
        break;
      case Token.SEMICOLON:
        throw new TypeError('Semicolon may occur only as the last character in the Newick notation');
      default:
        throw new TypeError('Unexpected text element');
    }

    pos--;
  }

  if (parent !== null) {
    throw new TypeError('Excessive closing parenthesis');
  }

  if (root === null) {
    // No information passed, returning a default isolated node
    root = factory();
  }
  return root;
}

function stringify (tree) {
  tree.visit((v, children) => {
    children = (children.length > 0) ? '(' + children.join(',') + ')' : '';
    return children + Token.escape(v.data);
  });
}

newick.stringify = stringify;
newick.Token = Token;
module.exports = newick;
