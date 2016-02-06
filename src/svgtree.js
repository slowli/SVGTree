/*
 * Handy JavaScript library for drawing trees using scalable vector graphics (SVG).
 *
 * (c) 2015, Alex Ostrovski
 */

(function(window){

// Add classList field for SVG elements in Internet Explorer
if (!('classList' in SVGElement.prototype)) {

	var _ClassList = function(element) {
		this._element = element;
	};

	_ClassList.prototype = {
		constructor: _ClassList,
		
		_getClasses: function() {
			var className = this._element.className.baseVal.trim();
			return (className === '') ? [] : className.split(/\s+/);
		},
		
		_setClasses: function(classes) {
			this._element.className.baseVal = classes.join(' ');
		},

		add: function(name) {
			var classes = this._getClasses();
			for (var i = 0; i < classes.length; i++) {
				if (classes[i] == name) return;
			}
			classes.push(name);
			this._setClasses(classes);
		},

		remove: function(name) {
			var classes = this._getClasses();
			for (var i = 0; i < classes.length; i++) {
				if (classes[i] == name) {
					classes.splice(i, 1);
					this._setClasses(classes);
					return;
				}
			}
		},

		toggle: function(name, force) {
			var add = (force === undefined) ? !this.contains(name) : force;
			if (add) {
				this.add(name);
			} else {
				this.remove(name);
			}
		},

		contains: function(name) {
			var classes = this._getClasses();
			for (var i = 0; i < classes.length; i++) {
				if (classes[i] == name) {
					return true;
				}
			}
			return false;
		},

		toString: function() {
			return this._getClasses().join(' ');
		}
	};

	var _classList = function() {
		if (!this._classList) {
			this._classList = new _ClassList(this);
		}
		return this._classList;
	};
	
	Object.defineProperty(SVGElement.prototype, 'classList', {
		get: _classList,
		enumerable: true,
		configurable: true
	});
}

// Add remove() method for HTML elements in IE

if (!('remove' in Element.prototype)) {
	Element.prototype.remove = function() {
		if (this.parentNode) {
			this.parentNode.removeChild(this);
		}
	};
}

/**
 * Returns the client position of the upper left corner of an HTML element,
 * not counting its borders.
 * 
 * @return {Object}
 */
function innerClientPos(element) {
	var rect = element.getBoundingClientRect(),
		compStyle = window.getComputedStyle(element);
		
	return {
		left: rect.left + parseFloat(compStyle['border-left-width']),
		top: rect.top  + parseFloat(compStyle['border-top-width'])
	};
}

/**
 * Creates a new tree node.
 * 
 * @constructor
 * @param {String} data
 *    data associated with the node
 */
function Tree(data) {
	if (!data) data = '';
	
	this.children = [];
	this.children.remove = function(elem) {
		idx = this.indexOf(elem);
		if (idx >= 0) {
			this.splice(idx, 1);
		}
	};
	this.parent = null;
	this.data = data;
}

/**
 * Tokenizer for Newick format.
 */
Tree.Token = {
	SEMICOLON: 0,
	COMMA: 1,
	PAR_LEFT: 2,
	PAR_RIGHT: 3,
	
	escape: function(text) {
		var escaped = '';
		for (var pos = 0; pos < text.length; pos++) {
			if ('(),;\\'.indexOf(text[pos]) < 0) {
				escaped += text[pos];
			} else {
				escaped += '\\' + text[pos];
			}
		}
		return escaped;
	},
	
	unescape: function(symbol, strict) {
		if (strict && (!symbol || ('(),;\\'.indexOf(symbol) < 0))) {
			throw 'Invalid location of backslash \\';
		}
		return symbol;
	},
	
	tokenize: function(text, strict) {
		var tokens = [], pos = 0;
			
		while (pos < text.length) {
			switch (text[pos]) {
				case ';': tokens.push(Tree.Token.SEMICOLON); break;
				case ',': tokens.push(Tree.Token.COMMA); break;
				case '(': tokens.push(Tree.Token.PAR_LEFT); break;
				case ')': tokens.push(Tree.Token.PAR_RIGHT); break;
				default:
					var symbol = (text[pos] == '\\') ? 
						Tree.Token.unescape(text[pos + 1]) : text[pos];
					if (typeof(tokens[tokens.length - 1]) == 'string') {
						tokens[tokens.length - 1] += symbol;
					} else {
						tokens.push(symbol);
					}
					
					if (text[pos] == '\\') pos++;
			}
			
			pos++;
		}
		
		return tokens;
	}
};

Tree.prototype = {
	constructor: Tree,

	/**
	 * Appends a child to the list of children of this node.
	 * 
	 * @param {Tree} child
	 */
	append: function(child) {
		if (child.parent !== null) {
			child.parent.children.remove(child);
		}
		this.children.push(child);
		child.parent = this;
	},
	
	/**
	 * Adds a node as a first child of this node.
	 * 
	 * @param {Tree} child
	 *    node to add as a child
	 */
	prepend: function(child) {
		if (child.parent !== null) {
			child.parent.children.remove(child);
		}
		this.children.splice(0, 0, child);
		child.parent = this;
	},
	
	insert: function(child, position) {
		if (child.parent == this) {
			var currentPos = child.position();
			if (currentPos < position) position--;
		}
		
		if (child.parent !== null) {
			child.parent.children.remove(child);
		}
		this.children.splice(position, 0, child);
		child.parent = this;
	},
	
	/**
	 * Parses Newick format representation of a tree.
	 * 
	 * @param {String} text
	 *    tree representation
	 * @param {Function} factory
	 *    optional factory for creating nodes; it is called with one parameter - node data
	 * @returns {Tree}
	 *    this tree
	 */
	parse: function(text, factory) {
		if (factory === undefined) {
			factory = function(data) {
				return new Tree(data);
			};
		}
		
		var tokens = Tree.Token.tokenize(text),
			pos = tokens.length - 1,
			parent = null, node = null;

		while (pos >= 0) {
			if ((pos < tokens.length - 1) && (tokens[pos + 1] == Tree.Token.PAR_LEFT)) {
				// Node may not be here
			} else {
				var data = (typeof(tokens[pos]) == 'string') ? tokens[pos] : '';
				if (typeof(tokens[pos]) == 'string') pos--;

				if (parent === null) {
					this.data = data; node = this;
				} else {
					node = factory(data);
					parent.prepend(node);
				}
			}

			if (tokens[pos] == Tree.Token.PAR_LEFT) {
				if (pos > 0) parent = parent.parent;
			} else if (tokens[pos] == Tree.Token.PAR_RIGHT) {
				parent = node;
			} else if ((tokens[pos] == Tree.Token.COMMA) || (tokens[pos] == Tree.Token.SEMICOLON)) {
				// Do nothing
			}

			pos--;
		}
		
		return this;
	},
	
	/**
	 * Creates a Newick format representation of this node and all descendant nodes.
	 * 
	 * @returns {String}
	 */
	newick: function() {
		return this._recurrentNewick() + ';';
	},

	_recurrentNewick: function() {
		var s = '';
		if (this.children.length > 0) {
			s += '(';
			for (var i = 0; i < this.children.length; i++) {
				var child = this.children[i];
				s += child._recurrentNewick();
				if (i < this.children.length - 1) s += ',';
			}
			s += ')';
		}
		return s + Tree.Token.escape(this.data);
	},
	
	/**
	 * Returns a queue containing this node and all its descendants in the order
	 * of a breadth-first search (each parent before its children).
	 * 
	 * @returns {Array}
	 *    array of nodes
	 */
	queue: function() {
		var queue = [ this ],
			ptr = 0;
		while (ptr < queue.length) {
			var node = queue[ptr];
			for (var i = 0; i < node.children.length; i++) {
				queue.push(node.children[i]);
			}
			ptr++;
		}
		return queue;
	},
	
	/**
	 * Checks if a node is a leaf (i.e., has no descendants). 
	 * 
	 * @returns {Boolean}
	 */
	isLeaf: function() {
		return this.children.length === 0;
	},
	
	/**
	 * Returns the root of the tree this node belongs to.
	 * 
	 * @returns {Tree}
	 */
	root: function() {
		var root = this;
		while (root.parent !== null) root = root.parent;
		return root;
	},
	
	/**
	 * Detaches this node from its parent.
	 */
	detach: function() {
		if (this.parent) {
			this.parent.children.remove(this);
		}
		this.parent = null;
	},
	
	/**
	 * Calculates the zero-based position of this node among its siblings.
	 *
	 * @returns {Number}
	 */
	position: function() {
		if (!this.parent) return -1;
		return this.parent.children.indexOf(this);
	},
	
	/**
	 * Returns the depth of this node relative to the root of the tree
	 * it belongs to.
	 * 
	 * @returns {Number}
	 */
	depth: function() {
		var depth = 0, node = this;
		while (node.parent) {
			depth++;
			node = node.parent;
		}
		return depth;
	},
	
	/**
	 * Recursively searches for a node with the given data atttached.
	 *
	 * @param matcher
	 * @returns {Tree}
	 *    node that matches the given data, or null if nothing found
	 */
	find: function(matcher) {
		if (typeof(matcher) == 'function') {
			// Just what we need
		} else if (typeof(matcher.test) == 'function') {
			// E.g., regular expressions
			matcher = (function(val) {
				return function(data) { return val.test(data); };
			})(matcher);
		} else {
			matcher = (function(val) { 
				return function(data) { return data == val; };
			})(matcher);
		}
	
		var queue = [ this ],
			ptr = 0;
			
		while (ptr < queue.length) {
			var node = queue[ptr];
			for (var i = 0; i < node.children.length; i++) {
				var child = node.children[i];
				if (matcher(child.data)) return child;
				queue.push(child);
			}
			ptr++;
		}
		
		return null;
	}
};

// Classes for elements
var _hoverCls = 'hover',
	_selectedCls = 'selected';

/** Content type for drag operations. */
var SVGTree_contentType = 'application/x-newick';

/**
 * Creates an SVG tag.
 *
 * @param {String} tag
 *    name of a tag
 */
function svgTag(tag) {
	return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function SVGTreeNode(data, owner) {
	Tree.call(this, data);
	
	this.x = 0;
	this.y = 0;
	
	this.svgEdge = null;
	this.svgNode = svgTag('g');
	this.svgMarker = null;
	this.svgLabel = svgTag('text');
	var labelGroup = svgTag('g');
	labelGroup.classList.add('label');
	labelGroup.appendChild(this.svgLabel);
	this.svgNode.appendChild(labelGroup);
	
	this._renderedMarker = null; // currently rendered marker type
	this.collapsed = false;
	this.owner = owner;
}

SVGTreeNode.prototype = Object.create(Tree.prototype);

SVGTreeNode.prototype.parse = function(data) {
	var ctx = this;
	Tree.prototype.parse.call(this, data, function(data) {
		return new SVGTreeNode(data, ctx.owner);
	});
	return this;
};

/**
 * Renders a circle for a tree node.
 */
SVGTreeNode.prototype.circleMarker = function() {
	var svgMarker = svgTag('circle');
	svgMarker.setAttribute('r', 4);
	return svgMarker;
};

/**
 * Renders a square for a tree node.
 */
SVGTreeNode.prototype.squareMarker = function() {	
	var sz = 8;
	var svgMarker = svgTag('rect');
	svgMarker.setAttribute('width', sz);
	svgMarker.setAttribute('height', sz);
	return svgMarker;
};

SVGTreeNode.prototype._positionMarker = function() {
	var marker = this.svgMarker;
	switch (this._renderedMarker) {
		case 'circle':
			marker.setAttribute('cx', this.x);
			marker.setAttribute('cy', this.y);
			break;
		case 'square':
			var sz = 8;
			marker.setAttribute('x', this.x - sz / 2);
			marker.setAttribute('y', this.y - sz / 2);
			break;
	}
};

/**
 * Sets the marker for this node.
 * 
 * @param {String} marker
 *    one of 'circle', 'square', or null. 
 *    null (the default value) means to inherit the marker type from the owner
 */
SVGTreeNode.prototype.setMarker = function(marker) {
	var markerFunc = null;
	this.marker = marker;
	
	if (marker === null) marker = this.owner.options.nodes;
	if (marker === this._renderedMarker) {
		// Only reposition the marker
		this._positionMarker();
		return;
	}
	
	if (this.svgMarker) this.svgMarker.remove();
	switch (marker) {
		case 'circle':
			this.svgMarker = this.circleMarker(); break;
		case 'square':
			this.svgMarker = this.squareMarker(); break;
		default: 
			throw 'Unknown marker type: ' + marker;
	}
	
	this._renderedMarker = marker;
	this._positionMarker();
	this.setMarkerColor(this._markerColor);
	this.svgMarker.classList.add('marker');
	this.svgNode.appendChild(this.svgMarker);
};

SVGTreeNode.prototype.setMarkerColor = function(color) {
	this._markerColor = color;
	if (this.svgMarker) {
		this.svgMarker.style.stroke = this.svgMarker.style.fill = color;
	}
};

/**
 * Renders tree node text horizontally.
 */
SVGTreeNode.prototype.hLabel = function() {
	var leftMargin = 10, topMargin = 4;
	
	var svgLabel = this.svgLabel;
	var x = this.x + leftMargin,
		y = this.y + topMargin;
	svgLabel.setAttribute('x', x);
	svgLabel.setAttribute('y', y);
	svgLabel.style.setProperty('text-anchor', 'start');
};

SVGTreeNode.prototype.centeredHLabel = function() {
	var topMargin = 20;
	
	var svgLabel = this.svgLabel;
	svgLabel.setAttribute('x', this.x);
	svgLabel.setAttribute('y', this.y + topMargin);
	svgLabel.style.setProperty('text-anchor', 'middle');
};

/**
 * Renders tree node text vertically.
 */
SVGTreeNode.prototype.vLabel = function() {
	var topMargin = 18, leftMargin = -4;
	
	var svgLabel = this.svgLabel,
		x = this.x + leftMargin,
		y = this.y + topMargin;
	
	y -= 10;
	svgLabel.parentNode.setAttribute('transform', 'rotate(' + [90, x, y].join(' ') + ')');
	svgLabel.setAttribute('x', x);
	svgLabel.setAttribute('y', y);
};

SVGTreeNode.prototype._updateLabel = function() {
	var label = this.svgLabel, options = this.owner.options;
	label.textContent = this.data;
	
	var summary = label.querySelector('tspan');
	if (this.collapsed) {
		if (!summary) {
			summary = svgTag('tspan');
			summary.classList.add('summary');
			summary.textContent = options.summary(this);
			
			if (this.data.length > 0) {
				label.textContent += ' ';
			}
			label.appendChild(summary);
		}
	} else if (summary) {
		summary.remove();
	}
	
	if (options.labelBackgrounds) {
		var background = this.svgLabelBg,
			box = label.getBBox();
		if (!background) {
			// Create background for the label
			background = this.svgLabelBg = svgTag('rect');
			background.classList.add('label-bg');
			label.parentNode.insertBefore(background, label);
		}
		
		background.setAttribute('x', box.x - 2);
		background.setAttribute('y', box.y - 2);
		background.setAttribute('width', box.width + 4);
		background.setAttribute('height', box.height + 4);
		background.setAttribute('display', (box.width === 0) ? 'none' : 'inline');
	}
};

/**
 * Renders a straight line for a tree edge.
 */
SVGTreeNode.prototype.directEdge = function() {
	var parent = this.parent,
		svgEdge = this.svgEdge ? this.svgEdge : svgTag('polyline');
	svgEdge.setAttribute('points', [parent.x, parent.y, this.x, this.y].join(' '));
	this.svgEdge = svgEdge;
};

/**
 * Renders a pair of lines (|-) for a tree edge.
 */
SVGTreeNode.prototype.vhEdge = function() {
	var parent = this.parent,
		svgEdge = this.svgEdge ? this.svgEdge : svgTag('polyline');
	svgEdge.setAttribute('points', [
		parent.x, parent.y, parent.x, this.y, this.x, this.y
	].join(' '));
	this.svgEdge = svgEdge;
};

/**
 * Renders a pair of lines (-|) for a tree edge.
 */
SVGTreeNode.prototype.hvEdge = function() {
	var parent = this.parent,
		svgEdge = this.svgEdge ? this.svgEdge : svgTag('polyline');
	svgEdge.setAttribute('points', [
		parent.x, parent.y, this.x, parent.y, this.x, this.y
	].join(' '));
	this.svgEdge = svgEdge;
};

/**
 * Recursively determines leaf-related positions of the nodes of the tree.
 * E.g., if the tree is rendered horizontally, this position determines the Y coordinate.
 * 
 * @param {Number} start
 *    starting leaf position to assign to leaf nodes
 * @returns {Number}
 *    updated leaf position
 */
SVGTreeNode.prototype._setLeafPositions = function(start) {
	if (!start) start = 0;

	if (this.isLeaf() || this.collapsed) {
		this._leafPosition = start;
		start++;
	} else {
		// Median
		var ch = this.children, len = ch.length;
		for (var i = 0; i < len; i++) {
			start = ch[i]._setLeafPositions(start);
		}
		
		if (len % 2 == 1) {
			this._leafPosition = ch[(len - 1) / 2]._leafPosition;
		} else {
			this._leafPosition = (ch[len / 2 - 1]._leafPosition +
				ch[len / 2]._leafPosition) / 2;
		}
	}
	return start;
};

/**
 * Sets the position of this node in SVG coordinates.
 * 
 * @param {Object} options
 *    display options
 */
SVGTreeNode.prototype._setCoordinates = function(options) {
	var x = this.depth(), 
		y = this._leafPosition;	
	delete this._leafPosition;
	
	x = options.depthDistance * x;
	y = options.leafDistance * y;
	
	if (options.orientation == 'h') {
		this.x = x; this.y = y;
	} else {
		this.x = y; this.y = x;
	}
};

SVGTreeNode.prototype.removeSVG = function(complete) {
	var queue = this.queue();
	for (var i = 0; i < queue.length; i++) {
		var node = queue[i];
		if (node.svgEdge) node.svgEdge.remove();
		if (node.svgNode) node.svgNode.remove();
		if (node.htmlTarget) node.htmlTarget.remove();
		
		if (complete) {
			// XXX Is it really needed?
			node.svgEdge = null;
			//node._renderedMarker = null;
		}
	}
};

/**
 * Returns a queue containing this node and all its descendants in the order
 * of a breadth-first search (each parent before its children).
 * 
 * @returns {Array}
 *    array of nodes
 */
SVGTreeNode.prototype.visualQueue = function() { 
	var queue = [ this ];
	ptr = 0;
	while (ptr < queue.length) {
		var node = queue[ptr];
		
		if (!node.collapsed) {
			for (var i = 0; i < node.children.length; i++) {
				queue.push(node.children[i]);
			}
		}
		ptr++;
	}
	
	return queue;
};

SVGTreeNode.prototype._calculateMargins = function() {
	this._leftMargin = [ this._leafPosition ];
	this._rightMargin = [ this._leafPosition ];
	if (this.collapsed) return;
	
	if (this.children.length > 0) {
		this._leftMargin[0] = this.children[0]._leafPosition;
	}
	if (this.children.length > 0) {
		var L = this.children.length;
		this._rightMargin[0] = this.children[L - 1]._leafPosition;
	}
	
	for (var i = 0; i < this.children.length; i++) {
		var margin = this.children[i]._leftMargin;
		var d;
		for (d = 0; d < margin.length; d++) {
			if (d + 1 >= this._leftMargin.length) {
				this._leftMargin[d + 1] = margin[d];
			} else {
				this._leftMargin[d + 1] = Math.min(margin[d], this._leftMargin[d + 1]);
			}
		}
		
		margin = this.children[i]._rightMargin;
		for (d = 0; d < margin.length; d++) {
			if (d + 1 >= this._rightMargin.length) {
				this._rightMargin[d + 1] = margin[d];
			} else {
				this._rightMargin[d + 1] = Math.max(margin[d], this._rightMargin[d + 1]);
			}
		}
	}
};

/**
 * Realignes the nodes after assigning initial leaf positions using 
 * the corresponding recursive function.
 * The main idea is simple: each node is moved closer to the central (pivot) child 
 * of its parent. To determine the maximal possible shift, we keep track of positions 
 * of the leftmost and rightmost descendants of each node at each relative depth
 * (depth = 0 corresponds to the node itself, depth = 1 to its children, etc.).
 */
SVGTreeNode.prototype._realign = function() {
	var MAX = 1000000;
	var L, pivot, i, d, queue;
	
	if (!this.collapsed && !this.isLeaf()) {
		var ch = this.children;
		L = ch.length;
		
		pivot = (L % 2 == 1) ? ((L - 1) / 2) : (L / 2 - 1);
		for (i = pivot; i >= 0; i--) ch[i]._realign();
		for (i = pivot + 1; i < L; i++) ch[i]._realign();
		
		if (L % 2 === 0) {
			this._leafPosition = (ch[pivot]._leafPosition + ch[pivot + 1]._leafPosition) / 2;
		} else {
			this._leafPosition = ch[pivot]._leafPosition;
		}
	}
	
	if (this.parent === null) {
		queue = this.visualQueue();
		for (i = 0; i < queue.length; i++) {
			var node = queue[i];

			delete node._leftMargin;
			delete node._rightMargin;
		}

		return;
	}
	
	this._calculateMargins();
	
	var pos = this.position(), siblings = this.parent.children;
	L = siblings.length;
	pivot = (L % 2 == 1) ? ((L - 1) / 2) : (L / 2 - 1);
	
	if (pos == pivot) {
		// No need for re-alignment
	} else {
		// Move node right or left according to the marginal positions of its siblings

		var thisMargin = (pos < pivot) ? this._rightMargin : this._leftMargin,
			dir = (pos < pivot) ? 1 : -1,
			shift = MAX;
		
		for (var si = pos + dir; (si >= 0) && (si < siblings.length); si += dir) {
			var sibling = siblings[si],
				siblingMargin = (pos < pivot) ? sibling._leftMargin : sibling._rightMargin;
			
			if (siblingMargin) {
				for (d = 0; d < siblingMargin.length; d++) {
					var margin = (d < thisMargin.length) ? thisMargin[d] : -dir * MAX;
					shift = Math.min(shift, dir * (siblingMargin[d] - margin) - 1);
				}
			}
		}		
		shift *= dir;
		
		this._leafPosition += shift;
		for (d = 0; d < this._leftMargin.length; d++) {
			this._leftMargin[d] += shift;
		}
		for (d = 0; d < this._rightMargin.length; d++) {
			this._rightMargin[d] += shift;
		}
		
		// TODO This takes much time; could it be done better?
		queue = this.visualQueue();
		for (i = 1; i < queue.length; i++) {
			queue[i]._leafPosition += shift;
		}
	}
};

/**
 * Recursively adds or removes a class to all visible nodes and connecting edges
 * starting from a certain node. 
 * 
 * @param {String} class
 *    class to add or remove
 * @param {Boolean} force
 *    true to add a class, false to remove it
 */
SVGTreeNode.prototype.toggleClass = function(cls, force) {
	var queue = this.visualQueue();
	for (var i = 0; i < queue.length; i++) {
		queue[i].svgNode.classList.toggle(cls, force);
		if (queue[i].svgEdge) {
			queue[i].svgEdge.classList.toggle(cls, force);
		}
	}
};

/**
 * Collapses this node, hiding all of its descendants.
 */
SVGTreeNode.prototype.collapse = function() {
	if ((this.children.length === 0) || this.collapsed) return;
	
	this.removeSVG();
	this.svgNode.classList.remove(_hoverCls);
	this.collapsed = true;
	this.owner.render();
	return this;
};

/**
 * Expands this node, revealing its descendants.
 */
SVGTreeNode.prototype.expand = function() {
	if ((this.children.length === 0) || !this.collapsed) return;

	this.svgNode.classList.remove(_hoverCls);
	this.collapsed = false;
	this.owner.render();
	return this;
};

/**
 * Toggles the collapsed state of this node.
 */
SVGTreeNode.prototype.toggle = function() {
	if (this.collapsed) {
		return this.expand();
	} else {
		return this.collapse();
	}
};

/**
 * Removes this node and all its descendants from the tree.
 */
SVGTreeNode.prototype.remove = function() {
	this.removeSVG();
	if (this.parent) {
		this.parent.children.remove(this);
		this.parent = null;
	}
	this.owner._notifyChange();
	this.owner.render();
};

/**
 * Sets data (~label) for this node.
 */
SVGTreeNode.prototype.setData = function(data) {
	if (this.data == data) return;

	this.data = data;
	this.owner._notifyChange();
	this.owner.render(this);
};

/**
 * Inserts content as a child of this node at a specific position.
 * The content may be either an existing node or a text in Newick format.
 */
SVGTreeNode.prototype.insertContent = function(node, position) {
	if (position === undefined) position = this.children.length;
	if (typeof(node) == 'number') {
		position = node; node = ';';
	} else if (node === undefined) {
		node = ';';
	}
	
	var oldPosition = null;
	
	if (typeof(node) == 'string') {
		node = this.owner.parse(node);
	} else {
		if (node.parent == this) oldPosition = node.position();
	
		// Check if the node being inserted is the ancestor of the new parent node.
		// If it is so, we must use special processing.
		var queue = node.queue();
		for (var i = 0; i < queue.length; i++) {
			if (queue[i] == this) {
				var nodePos = node.position(), nodeParent = node.parent;
				this.detach();
				node.detach();
				if (nodeParent) {
					nodeParent.insert(this, nodePos);
				} else {
					this.owner.root = this;
					this.svgEdge.remove();
					this.svgEdge = null;
				}
				break;
			}
		}
	}
	this.insert(node, position);
	
	if (node.position() !== oldPosition) {
		this.owner._notifyChange();
		this.owner.render();
	}
	
	return node;
};

SVGTreeNode.prototype.createTarget = function(options) {
	var target;
	
	if (this.htmlTarget) {
		target = this.htmlTarget;
	} else {
		target = document.createElement('div');
		if (options._canDragNodes) {
			target.setAttribute('draggable', true);
		}
		target.classList.add('svgtree-target');
		this.htmlTarget = target;
		this._addTargetListeners(options);
	}
	
	var rect = this.offsetPos(),
		cx = rect.left,
		cy = rect.top;
	
	// This assumes a target has 'margin-left' and 'margin-top' CSS properties specified
	// in a way that coordinates (0, 0) correspond to the center of the target.
	
	target.style.left = cx + 'px';
	target.style.top = cy + 'px';
	this.htmlTarget = target;
};

/**
 * Returns the client coordinates of the center of the marker for this node 
 * relative to the offset parent (SVG tree container).
 * 
 * @returns {Object}
 */
SVGTreeNode.prototype.offsetPos = function() {
	return {
		'left': this.x - this.owner._offsetLeft,
		'top':  this.y - this.owner._offsetTop
	};
};

/**
 * Adds event listeners to the HTML target corresponding to this node.
 *
 * @param {Object} options
 */
SVGTreeNode.prototype._addTargetListeners = function(options) {
	var self = this;
	
	if (options._canDragNodes) {
		this.htmlTarget.addEventListener('dragstart', function(event) {
			self._ondragstart(event);
		});
		this.htmlTarget.addEventListener('dragend', function(event) {
			self._ondragend(event);
		});
		this.htmlTarget.addEventListener('dragenter', function(event) {
			self._ondragenter(event);
		});
		this.htmlTarget.addEventListener('dragover', function(event) {
			self._ondragover(event);
		});
		this.htmlTarget.addEventListener('dragleave', function(event) {
			self._ondragleave(event);
		});
		this.htmlTarget.addEventListener('drop', function(event) {
			self._ondrop(event);
		});
	}
		
	if (options._canSelectNodes) {
		this.htmlTarget.addEventListener('click', function(event) {
			if (self.owner.selectedNode === self) {
				if (options._canCollapseNodes) self.toggle();
			} else {
				self.owner.select(self);
			}
		});
		this.htmlTarget.addEventListener('mouseenter', function(event) {
			self.svgNode.classList.add(_hoverCls);			
		});
		this.htmlTarget.addEventListener('mouseleave', function(event) {
			self.svgNode.classList.remove(_hoverCls);
		});
		
		// User should be able to select nodes by clicking the label
		this.svgNode.addEventListener('click', function(event) {
			if (self.owner.selectedNode === self) {
				if (options._canCollapseNodes) self.toggle();
			} else {
				self.owner.select(self);
			}
		});
	}
};

/**
 * Checks if this node is not currently displayed in SVG element.
 */
SVGTreeNode.prototype.isDetached = function() {
	return !this.root().svgNode.parentNode;
};

SVGTreeNode.prototype._ondragstart = function(event) {
	var dragAsText = this.owner.options.dragAsText,
		rearrange = this.owner.options._dragToRearrange;

	this.owner.select(this);
	if (this.owner.nodeInput) {
		this.owner.nodeInput.style.display = 'none';
	}
	this.owner._dragNode = this;
	this.owner.svgWrapper.classList.add('svgtree-drag');
	
	event.dataTransfer.effectAllowed = rearrange ? 'move' : 'copyMove';
	try {
		event.dataTransfer.setData(SVGTree_contentType, this.newick());
		if (dragAsText) {
			event.dataTransfer.setData('text/plain', this.newick());
		}
	} catch(e) {
		event.dataTransfer.setData('Text', this.newick());
	}
	
	this.htmlTarget.classList.add('drag');
	this.toggleClass('drag', true);
};

SVGTreeNode.prototype._ondragend = function(event) {
	this.htmlTarget.classList.remove('drag');
	this.owner.root.toggleClass('drag', false);
	this.owner.svgWrapper.classList.remove('svgtree-drag');
	this.owner.select(this);
	
	if ((this.owner._dragNode !== null) && (event.dataTransfer.dropEffect == 'move')) {
		// Node wasn't removed yet (dragged to a different tree or another target),
		// we should remove it now
		this.remove();
	}
	this.owner._dragNode = null;
};

SVGTreeNode.prototype._ondragenter = function(event) {
	var rearrange = this.owner.options._dragToRearrange;
	
	if (rearrange) {
		if (this._isRearrangable(this.owner._dragNode)) return;
		event.dataTransfer.dropEffect = 'move';
	} else {
		event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move';
	}
	
	event.preventDefault();
};

/**
 * Checks if this node can be rearranged with another node.
 */
SVGTreeNode.prototype._isRearrangable = function(node) {
	if (!node || !this.parent) return;

	var siblings = this.parent.children;
	for (var i = 0; i < siblings.length; i++) {
		if (siblings[i] == node) {
			return true;
		}
	}
	return false;
};

/**
 * Checks whether a node can be inserted at the specified position 
 * relative to this node.
 */
SVGTreeNode.prototype._checkInsertionPoint = function(point, event) {
	var rearrange = this.owner.options._dragToRearrange;
	if (rearrange && (point == 'child')) return false;

	if ((this.parent === null) && (point != 'child')) return false;
		
	if (event.dataTransfer.dropEffect == 'copy') {
		// Copies of trees may be put anywhere (except as siblings of the root)
		return true;
	}
	
	var dragNode = this.owner._dragNode;
	if (dragNode !== null) {
		if (this == dragNode) {
			return false;
		} else if ((point != 'child') && (this.parent == dragNode)) {
			// Results in an attempt to add a node as its own child
			return false;
		}
	}
	
	return true;
};

SVGTreeNode.prototype._ondragover = function(event) {
	var rearrange = this.owner.options._dragToRearrange;
	if (rearrange) {
		if (!this._isRearrangable(this.owner._dragNode)) return;
		event.dataTransfer.dropEffect = 'move';
	} else {
		event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move';
	}

	var types = event.dataTransfer.types,
		insertionPt = this.owner._insertionPoint,
		dragAsText = this.owner.options.dragAsText;
	
	for (var i = 0; i < types.length; i++) {
		if ((types[i] == 'Text') || 
			(types[i] == SVGTree_contentType) || 
			(dragAsText && (types[i] == 'text/plain'))) {

			var point = this.owner._getInsertionPoint(event);
				
			if (!this._checkInsertionPoint(point, event)) {
				// Hide insertion point
				this.svgNode.classList.remove('drop-move');
				this.svgNode.classList.remove('drop-copy');
				insertionPt.classList.remove('drop-move');
				insertionPt.classList.remove('drop-copy');
				// IE 11 starts flickering if the point is hidden via display: none or visibility: hidden
				insertionPt.setAttribute('transform', 'translate(-1000 -1000)'); 
				
				return;
			}
			event.preventDefault();
				
			var cls = 'drop-' + event.dataTransfer.dropEffect;
			if (!this.svgNode.classList.contains(cls)) {
				this.svgNode.classList.remove('drop-move');
				this.svgNode.classList.remove('drop-copy');
				this.svgNode.classList.add(cls);
				
				insertionPt.classList.remove('drop-move');
				insertionPt.classList.remove('drop-copy');
				insertionPt.classList.add(cls);
			}
			
			insertionPt.setAttribute('transform', 
				'translate(' + this.x + ' ' + this.y + ')' +
				' rotate(' + this.owner._rotation(point) + ')');
			
			break;
		}
	}
};

SVGTreeNode.prototype._ondragleave = function(event) {
	this.svgNode.classList.remove('drop-copy');
	this.svgNode.classList.remove('drop-move');
	var insertionPt = this.owner._insertionPoint;
	insertionPt.setAttribute('transform', 'translate(-1000 -1000)');
};

SVGTreeNode.prototype._ondrop = function(event) {
	event.preventDefault();
	this._ondragleave(event);
	
	var effect = event.dataTransfer.dropEffect;
	if (effect == 'none') {
		// Bug (?) in Chromium
		var rearrange = this.owner.options._dragToRearrange;
		effect = event.dataTransfer.dropEffect = 
				event.ctrlKey && !rearrange ? 'copy' : 'move';
	}
	
	var point = this.owner._getInsertionPoint(event), 
		dropData = null,
		types = event.dataTransfer.types;
		
	for (var i = 0; i < types.length; i++) {
		if ((types[i] == 'Text') || 
			(types[i] == 'text/plain') || 
			(types[i] == SVGTree_contentType)) {

			dropData = event.dataTransfer.getData(types[i]);
			break;
		}
	}
	
	if (this.owner._dragNode && (effect == 'move')) {
		dropData = this.owner._dragNode;
	}
	
	switch (point) {
		case 'before':
			this.parent.insertContent(dropData, this.position());
			break;
		case 'after':
			this.parent.insertContent(dropData, this.position() + 1);
			break;
		case 'child':
			this.insertContent(dropData);
			break;
	}
	
	this.owner._dragNode = null;
};


/**
 * @param {Object} options
 */
function SVGTree(newick, container, options) {
	this.root = null;
	
	this.options = SVGTree_defaults();
	this.setOptions(options);
	this._createElements(container);
	
	this.selectedNode = null;
	this.onselect = this.options.onselect;
	this.onrender = this.options.onrender;
	this.onchange = this.options.onchange;
	this.setContent(newick, false);
}

/**
 * Default options for SVGTree initialization.
 */
function SVGTree_defaults() {
	return {
		orientation: 'v',
		nodes: 'circle',
		edges: 'angular',
		leafDistance: 40,
		depthDistance: 50,
		padding: 30,
		size: 'keep',
		
		interaction: false,
		dragAsText: false,
		targetSize: 25,
		
		labelBackgrounds: true,
		
		summary: function(node) {
			var nDescendants = node.queue().length - 1;
			return '(' + nDescendants + ')';
		},
		
		// Event listeners
		onrender: function() { },
		onselect: function(node) { },
		onchange: function() { }
	};
}

/**
 * Rotations of insertion point marker depending on tree orientation.
 */
var SVGTree_rotations = {
	v: {
		after: 0,
		child: 90,
		before: 180
	},
	h: {
		after: 90,
		before: 270,
		child: 0
	}
};

SVGTree.processOptions = function(options, defaults) {
	if (!defaults) defaults = SVGTree_defaults();
	if (!options) options = { };
	var fullOptions = { };
	
	for (var field in defaults) {
		if (!(field in options)) {
			fullOptions[field] = defaults[field];
		} else {
			fullOptions[field] = options[field];
		}
	}
	
	var actions = fullOptions.interaction || [];
	
	fullOptions._canSelectNodes = actions.length > 0;
	fullOptions._canCollapseNodes = actions.indexOf('collapse') >= 0;
	fullOptions._canDragNodes = (actions.indexOf('drag') >= 0) || 
			(actions.indexOf('rearrange') >= 0);
	fullOptions._canEditNodes = actions.indexOf('edit') >= 0; 
	fullOptions._canAddNodes = actions.indexOf('add') >= 0; 
	fullOptions._canRemoveNodes = actions.indexOf('remove') >= 0;
	
	fullOptions._dragToRearrange = (actions.indexOf('rearrange') >= 0) && 
			(actions.indexOf('drag') < 0);
	
	return fullOptions;
};

SVGTree.prototype = {
	constructor: SVGTree,
	
	find: function(data) {
		return this.root.find(data);
	},
	
	/**
	 * Completes options with default values.
	 * 
	 * @param {Object} options
	 *    tree display options
	 * @returns {Object}
	 *    complete options
	 */
	setOptions: function(options) {
		this.options = SVGTree.processOptions(options, this.options);
		
		if (this.svg) {
			this.svgWrapper.classList.toggle('svgtree-h', this.options.orientation == 'h');
			this.svgWrapper.classList.toggle('svgtree-v', this.options.orientation == 'v');
			this.root.removeSVG(true);
			this.render();
			if (this.selectedNode) this.select(this.selectedNode);
		}
	},

	/**
	 * Renders the tree.
	 *
	 * @param {SVGTreeNode} node
	 *    (optional) a specific node that was changed
	 */
	render: function(node) {
		var queue = node ? [ node ] : this.root.visualQueue(),
			options = this.options;
		
		if (!node) {
			this.root._setLeafPositions();
			this.root._realign();
			
			for (var i = queue.length - 1; i >= 0; i--) {
				queue[i]._setCoordinates(options);
			}
		} else {
			// We don't need to reposition nodes if we are rendering a single node
		}
		
		this._createEdges(queue, options);
		this._createNodes(queue, options);
		this._createLabels(queue, options);
		
		// We can't use svg.getBBox() because of a 'hidden' insertion point marker
		// (and IE 11 starts flickering during drag'n'drop
		// if we use display:none or visibility:hidden to hide it).
		
		this._setSize();
		
		if (options._canSelectNodes) {
			// We need to reposition all targets, even if only one label has changed
			queue = this.root.visualQueue();
			this._createTargets(queue, options);
		}
		if (this.selectedNode && this.selectedNode.isDetached()) {
			this.select(null);
		}
		if (this.nodeInput && this.selectedNode) {
			var pos = this.selectedNode.offsetPos();
			this.nodeInput.style.left = pos.left + 'px';
			this.nodeInput.style.top = pos.top + 'px';
		}
		
		if (this.onrender) this.onrender.call(this);
	},
	
	/**
	 * Changes the size and the view box of the SVG element according to the display options.
	 */
	_setSize: function() {
		var svg = this.svg,
			options = this.options,
			svgChildren = [ this._getGroup(svg, 'edges'), this._getGroup(svg, 'nodes') ],
			minX = 100000000, minY = 100000000, 
			maxX = -100000000, maxY = -100000000, 
			padding = options.padding;

		for (var i = 0; i < svgChildren.length; i++) {
			var box = svgChildren[i].getBBox();
			maxX = Math.max(maxX, box.x + box.width);
			maxY = Math.max(maxY, box.y + box.height);
			minX = Math.min(minX, box.x);
			minY = Math.min(minY, box.y);
		}
		minX -= padding; minY -= padding;
		maxX += padding; maxY += padding;
		
		var transform = [];
		if (options.size === 'fit') {
			transform = [ minX, minY, maxX - minX, maxY - minY ];
			svg.style.width = (maxX - minX) + 'px';
			svg.style.height = (maxY - minY) + 'px';
		} else {
			var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2,
				width, height;
				
			if (options.size === 'keep') {
				var style = getComputedStyle(svg);
				width = parseFloat(style.width);
				height = parseFloat(style.height);
			} else {
				width = options.size[0];
				height = options.size[1];
				svg.style.width = width + 'px';
				svg.style.height = height + 'px';
			}

			transform = [ cx - width / 2, cy - height / 2, width, height ];
		}
		svg.setAttribute('viewBox', transform.join(' '));
		
		var wrapperPos = innerClientPos(this.svgWrapper),
			svgPos = innerClientPos(this.svg);
			
		this._offsetLeft = transform[0] - (svgPos.left - wrapperPos.left);
		this._offsetTop = transform[1] - (svgPos.top - wrapperPos.top);
		
		// Round offsets to half a pixel (otherwise, the targets appear not centered 
		// on node markers in some cases)
		this._offsetLeft = Math.round(this._offsetLeft * 2) / 2;
		this._offsetTop = Math.round(this._offsetTop * 2) / 2;
	},

	/**
	 * Creates a group holding SVG elements for a specific element type (e.g., nodes).
	 * If the element is already present in the rendering container, it is returned.
	 * 
	 * @param {SVGElement} svg
	 *    SVG element to use for rendering
	 * @param {String} name
	 *    name of the group 
	 * @returns {SVGElement}
	 *    SVG <g> element
	 */
	_getGroup: function(svg, name) {
		var group = svg.querySelector('.' + name);
		if (!group) {
			group = svgTag('g');
			group.setAttribute('class', name);
			svg.appendChild(group);
		}
		return group;
	},

	/**
	 * Creates SVG elements for the nodes in this tree. 
	 * 
	 * @param {Array} queue
	 *    list of nodes to render
	 * @param {Object} options
	 *    tree display options
	 */
	_createNodes: function(queue, options) {
		var nodes = this._getGroup(this.svg, 'nodes');
		for (var i = 0; i < queue.length; i++) {
			var node = queue[i];
			node.setMarker(node.marker ? node.marker : null);
			
			if (!node.svgNode.parentNode) {
				nodes.appendChild(node.svgNode);
			}
			
			node.svgNode.classList.toggle('collapsed', node.collapsed);
		}
	},

	/**
	 * Creates SVG elements for the edges in this tree. 
	 * 
	 * @param {Array} queue
	 *    list of nodes to render
	 * @param {Object} options
	 *    tree display options
	 */
	_createEdges: function(queue, options) {
		var createEdge = null;
		switch (options.edges) {
			case 'straight':
				createEdge = SVGTreeNode.prototype.directEdge;
				break;
			case 'angular':
				createEdge = (options.orientation == 'h') ? 
						SVGTreeNode.prototype.vhEdge : SVGTreeNode.prototype.hvEdge;
				break;
		}
		
		var edges = this._getGroup(this.svg, 'edges');
		for (var i = 1; i < queue.length; i++) {
			var node = queue[i],
				newEdge = !node.svgEdge || !node.svgEdge.parentNode;
			createEdge.call(node);
			if (newEdge) edges.appendChild(queue[i].svgEdge);
		}
		
		return edges;
	},

	/**
	 * Creates SVG elements for the node labels in this tree. 
	 * 
	 * @param {Array} queue
	 *    list of nodes to render
	 * @param {Object} options
	 *    tree display options
	 */
	_createLabels: function(queue, options) {
		
		var createLabel = (options.orientation == 'v') ? 
				SVGTreeNode.prototype.centeredHLabel : SVGTreeNode.prototype.hLabel;
		
		for (var i = 0; i < queue.length; i++) {
			var node = queue[i];
				
			createLabel.call(node);
			node._updateLabel();
		}
	},
	
	/**
	 * Creates HTML targets for nodes of the tree to enable drag and double-click operations 
	 * (SVG elements don't support them).
	 *
	 * @param {Array} queue
	 *    list of nodes to render
	 * @param {Object} options
	 *    tree display options
	 */
	_createTargets: function(queue, options) {
		for (var i = 0; i < queue.length; i++) {
			var node = queue[i],
				newTarget = !node.htmlTarget || !node.htmlTarget.parent;
				
			node.createTarget(options);
			if (newTarget) this.svgWrapper.appendChild(node.htmlTarget);
		}
	},
	
	/**
	 * Sets the content of this tree.
	 */
	setContent: function(text, notify) {
		if (notify === undefined) notify = true;
	
		if (this.root) this.root.removeSVG();
		this.root = this.parse(text);
		if (notify) this._notifyChange();
		this.render();
	},
	
	/**
	 * Parses a text into a tree in Newick format. 
	 * In case of a parsing error, the text is transformed into a single node 
	 * containing all of the text.
	 *
	 * @param {String} text
	 */
	parse: function(text) {
		try {
			return new SVGTreeNode(null, this).parse(text);
		} catch(e) {
			return new SVGTreeNode(text, this);
		}
	},
	
	_createElements: function(container) {
		if (container instanceof SVGElement) {
			this.svg = container;
			this.svgWrapper = container = document.createElement('div');
		} else {
			this.svgWrapper = container;
			this.svg = svgTag('svg');
			container.appendChild(this.svg);
		}
		
		container.classList.add('svgtree-wrap');
		container.classList.add('svgtree-' + this.options.orientation);
		container.classList.toggle('svgtree-interactive', this.options._canSelectNodes);
		
		this.svg.classList.add('svgtree');
		
		if (this.options._canCollapseNodes || 
			this.options._canAddNodes || 
			this.options._canRemoveNodes) {

			container.setAttribute('tabindex', '0');
			
			var self = this;
			container.addEventListener('keydown', function(event) {
				self._onkeydown(event);
			});
		}
		
		if (this.options._canEditNodes) {
			container.classList.add('svgtree-editable');
		
			this.nodeInput = document.createElement('input');
			this.nodeInput.setAttribute('type', 'text');
			this.nodeInput.classList.add('svgtree-input');
			container.appendChild(this.nodeInput);
			
			var ctx = this;
			this.nodeInput.addEventListener('change', function() {
				ctx.selectedNode.setData(this.value);
			});
		}
		
		if (this.options._canDragNodes) {
			// Create a marker for insertion points
			if (this.svg.querySelector('.insert')) {
				// Assume the path is set by the user
				return;
			}
			
			var pt = this._insertionPoint = svgTag('path');
			pt.classList.add('insert');
			pt.setAttribute('d', 'M-15,-5 L-15,5 L0,5 L0,12.5 L20,0 L0,-12.5 L0,-5 Z');
			pt.setAttribute('transform', 'translate(-1000 -1000)');
			this.svg.appendChild(pt);
		}
	},
	
	select: function(node) {
		if (this.selectedNode) {
			this.selectedNode.svgNode.classList.remove(_selectedCls);
			this.selectedNode.htmlTarget.classList.remove(_selectedCls);
			
			if (this.options._canEditNodes) {
				//!this.selectedNode.svgLabel.style.visibility = 'visible';
			}
		}
		
		if (node) {
			node.svgNode.classList.add(_selectedCls);
			node.htmlTarget.classList.add(_selectedCls);

			if (this.options._canEditNodes) {
				// Display a text input
				var pos = node.offsetPos();
				this.nodeInput.style.left = pos.left + 'px';
				this.nodeInput.style.top = pos.top + 'px';
				this.nodeInput.value = node.data;
				this.nodeInput.style.display = 'block';
			}
		} else {
			if (this.options._canEditNodes) {
				this.nodeInput.style.display = 'none';
			}
		}
		
		this.selectedNode = node;
		if (this.onselect) {
			this.onselect.call(this, node);
		}
	},
	
	_onkeydown: function(event) {
		if (!this.selectedNode) return;
		if (event.target == this.nodeInput) return;
		
		switch (event.keyCode) {
			case 46: // Delete
				if (!this.options._canRemoveNodes) return;
				this.selectedNode.remove();
				event.preventDefault();
				return;
			case 45: // Insert
				if (!this.options._canAddNodes) return;
				this.selectedNode.insertContent();
				event.preventDefault();
				return;
			case 32: // Spacebar
			case 13: // Enter
				if (!this.options._canCollapseNodes) return;
				this.selectedNode.toggle();
				event.preventDefault();
				return;
		}
	},
	
	_notifyChange: function() {
		if (this.onchange) this.onchange.call(this);
	},
	
	/**
	 * Determines the direction of insertion of new tree nodes.
	 *
	 * @param {DragEvent} event
	 *    drag event to determine the direction
	 * @returns {String}
	 *    one of 'before', 'after', or 'child'
	 */
	_getInsertionPoint: function(event) {
		var targetSize = this.options.targetSize,
			rect = event.target.getBoundingClientRect(),
			x = event.clientX - rect.left, 
			y = event.clientY - rect.top;
			
		if (this.options.orientation == 'h') {
			var tmp = x; x = y; y = tmp;
		}
		
		if (y > 0.67 * targetSize) {
			return 'child';
		} else if (x < 0.5 * targetSize) {
			return 'before';
		} else {
			return 'after';
		}
	},
	
	_rotation: function(point) {
		return SVGTree_rotations[this.options.orientation][point];
	}
};

window.Tree = Tree;
window.SVGTree = SVGTree;

})(window);