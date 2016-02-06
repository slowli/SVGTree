/*
 * Widget for displaying a SVGTree together with additional functionality such as undo.  
 *
 * (c) 2015, Alex Ostrovski
 */

(function(window) {

/**
 * Injects undo / redo functionality into an object.
 * The object must have the following methods:
 * <ul>
 *    <li>getState - returns the current state of the object
 *    <li>setState - sets the state of the object using a state previously returned 
 *    by getState
 *    <li>onchange - event called each time the object is changed
 * </ul>
 */
function UndoFixture(object) {
	if (!object.getState) {
		throw 'Object does not have getState() method';
	}
	if (!object.setState) {
		throw 'Object does not have setState() method';
	}
	if (!object.onchange) {
		throw 'Object does not define onchange event';
	}
	
	object.onchange = (function(originalOnChange) {
		return function() {
			this._pastStates.splice(this._pastStatePointer + 1, this._pastStates.length);
			this._pastStates.push(this.getState());
			this._pastStatePointer = this._pastStates.length - 1;
			
			if (originalOnChange) originalOnChange.call(this);
		};
	})(object.onchange);
	
	object.undo = function() {
		if (this._pastStatePointer > 0) {
			this.setState(this._pastStates[--this._pastStatePointer]);
		}
	};
	object.canUndo = function() {
		return (this._pastStatePointer > 0);
	};
	
	object.redo = function() {
		if (this._pastStatePointer < this._pastStates.length - 1) {
			this.setState(this._pastStates[++this._pastStatePointer]);
		}
	};
	object.canRedo = function() {
		return (this._pastStatePointer < this._pastStates.length - 1);
	};
	
	// init past states
	object._pastStates = [ object.getState() ];
	object._pastStatePointer = 0;
}

SVGTreeViewer_defaults = {
	undo: true,
	newick: true,
	settings: true,
	footer: true
};

function setRadioButton(form, field, value) {
	form.querySelector('input[type="radio"][name="' + field + '"][value="' + value + '"]').checked = true;
}

function getRadioButton(form, field) {
	var buttons = form.querySelectorAll('input[type="radio"][name="' + field + '"]');
	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i].checked) {
			return buttons[i].value;
		}
	}
	return null;
}

function localize(text, strings) {
	for (var key in strings) {
		text = text.replace(new RegExp('\\$' + key), strings[key]);
	}
	return text;
}

var nWidgets = 0;

/**
 * Creates a new instance of the viewer widget.
 * 
 * @constructor
 * @param {String} tree
 *    Newick notation of the tree to display
 * @param {HTMLElement} container
 *    Containing element (an empty DIV would suffice)
 * @param {Object} params
 *    widget parameters
 */
function SVGTreeViewer(tree, container, params) {

	container.innerHTML = localize(SVGTreeViewer_template, SVGTreeViewer.localization);
	container.classList.add('svgtree-viewer');
	
	var treeContainer = container.querySelector('.svgtree-wrap'),
		title = container.querySelector('h3'),
		nodePanel = container.querySelector('.svgtree-node-ops'),
		addBtn = container.querySelector('.svgtree-op-add'),
		removeBtn = container.querySelector('.svgtree-op-rem'),
		locationBtn = container.querySelector('.svgtree-op-loc'),
		nodeControls = nodePanel.querySelectorAll('button,input'),
		undoBtn = container.querySelector('.svgtree-op-undo'),
		redoBtn = container.querySelector('.svgtree-op-redo'),
		newickBtn = container.querySelector('.svgtree-op-nwck'),
		settingsBtn = container.querySelector('.svgtree-op-opt'),
		newickText = container.querySelector('.svgtree-newick'),
		settingsForm = container.querySelector('.svgtree-settings'),
		settingsContent = settingsForm.querySelector('.svgtree-set-cont');
		
	var showingNewick = false,
		showingSettings = false; 
		
	function onselect(node) {
		for (var i = 0; i < nodeControls.length; i++) {
			nodeControls[i].disabled = (node === null);
		}
		removeBtn.disabled = (node === null) || (node.parent === null);
	}
	
	function onchange() {
		if (this.canUndo) {
			undoBtn.disabled = !this.canUndo();
			redoBtn.disabled = !this.canRedo();
		}
	}
	
	function onrender() {
		var h = parseFloat(getComputedStyle(treeContainer).height),
			scroll = treeContainer.parentNode,
			parentH = scroll.clientHeight,
			margin = Math.max(0, (parentH - h) / 2);
		
		treeContainer.style.marginTop = margin + 'px';
		
		var hidden = (scroll.scrollWidth == scroll.clientWidth) && 
				(scroll.scrollHeight == scroll.clientHeight);
		locationBtn.style.display = hidden ? 'none' : 'inline-block';
	}
	
	function undo() {
		tree.undo();
		if (showingNewick) newickText.value = tree.root.newick();
		undoBtn.disabled = !tree.canUndo();
		redoBtn.disabled = !tree.canRedo();
	}
	
	function redo() {
		tree.redo();
		if (showingNewick) newickText.value = tree.root.newick();
		undoBtn.disabled = !tree.canUndo();
		redoBtn.disabled = !tree.canRedo();
	}
	
	function toggleNewickForm() {
		tree.select(null);
		
		if (showingNewick) {
			newickText.style.display = 'none';
			if (tree.root.newick() != newickText.value) {
				tree.setContent(newickText.value);
			}
		} else {
			newickText.value = tree.root.newick();
			newickText.style.display = 'block';
		}
		
		newickBtn.classList.toggle('selected');
		showingNewick = !showingNewick;
	}
	
	function toggleSettingsForm(event) {
		if ((event.target !== settingsForm) && (event.target !== settingsBtn)) {
			return false;
		}
		
		settingsForm.style.display = showingSettings ? 'none' : 'block';
		
		undoBtn.style.display = !showingSettings ? 'none' : 'inline-block';
		redoBtn.style.display = !showingSettings ? 'none' : 'inline-block';
		
		if (showingSettings) {
			params.orientation = getRadioButton(settingsForm, 'orientation');
			params.nodes = getRadioButton(settingsForm, 'nodes');
			params.edges = getRadioButton(settingsForm, 'edges');
			tree.setOptions(params);
		} else {
			setRadioButton(settingsForm, 'orientation', tree.options.orientation);
			setRadioButton(settingsForm, 'nodes', tree.options.nodes);
			setRadioButton(settingsForm, 'edges', tree.options.edges);
			settingsContent.style.marginTop = (-settingsContent.clientHeight / 2) + 'px';
		}
		
		settingsBtn.classList.toggle('selected');
		showingSettings = !showingSettings;
	}
	
	function onAddBtnClick() {
		tree.selectedNode.insertContent();
	}
	
	function onRemoveBtnClick() {
		tree.selectedNode.remove();
	}
	
	function onLocationBtnClick() {
		var pos = tree.selectedNode.offsetPos(),
			scroll = tree.svgWrapper.parentNode;
		
		pos.left -= scroll.clientWidth / 2;
		pos.top -= scroll.clientHeight / 2;
		
		scroll.scrollLeft = Math.max(0, pos.left);
		scroll.scrollTop = Math.max(0, pos.top);
	}
	
	function processParams(params) {
		if (!params) params = {};
		params.size = 'fit';
		params.onselect = onselect;
		params.onchange = onchange;
		params.onrender = onrender;
		
		// Fill missing parameters
		var fullParams = params, field;
		for (field in params) {
			fullParams[field] = params[field];
		}
		for (field in SVGTreeViewer_defaults) {
			if (!(field in params)) {
				fullParams[field] = SVGTreeViewer_defaults[field];
			}
		}
		
		return fullParams;
	}

	function init() {
		params = processParams(params);
		
		// Some manipulations are better to perform before the three is created
		
		var treeOptions = SVGTree.processOptions(params);
		var readonly = !treeOptions._canAddNodes &&  
			!treeOptions._canRemoveNodes && 
			!treeOptions._canEditNodes && 
			!treeOptions._canDragNodes;
		if (readonly) {
			newickText.setAttribute('readonly', true);
			params.undo = false;
		}
		if (!treeOptions._canSelectNodes) {
			params.footer = false;
		}
		
		title.textContent = container.getAttribute('title');
		container.setAttribute('title', '');
		
		if (!treeOptions._canAddNodes) addBtn.remove();
		if (!treeOptions._canRemoveNodes) removeBtn.remove();
		if (!params.footer) {
			nodePanel.parentNode.remove();
			container.classList.add('no-footer');
		}
		
		tree = new SVGTree(tree, treeContainer, params);
		
		if (params.undo) {
			tree.getState = function() { 
				return this.root.newick(); 
			};
			tree.setState = function(state) { 
				this.setContent(state, false);
			};
			
			UndoFixture(tree);
			undoBtn.disabled = true;
			redoBtn.disabled = true;			
			undoBtn.addEventListener('click', undo);
			redoBtn.addEventListener('click', redo);
		} else {
			undoBtn.remove();
			redoBtn.remove();
		}
		
		addBtn.addEventListener('click', onAddBtnClick);
		removeBtn.addEventListener('click', onRemoveBtnClick);
		locationBtn.addEventListener('click', onLocationBtnClick);
		
		// Tree controls
		if (params.newick) {
			newickBtn.addEventListener('click', toggleNewickForm);
		} else {
			newickBtn.remove();
			newickText.remove();
		}
		
		if (params.settings) {
			settingsBtn.addEventListener('click', toggleSettingsForm);
			settingsForm.addEventListener('click', toggleSettingsForm);
		} else {
			settingsBtn.remove();
			settingsForm.remove();
		}
		
		var labels = container.querySelectorAll('label[for]');
		for (var i = 0; i < labels.length; i++) {
			var id = labels[i].htmlFor;
			container.querySelector('#' + id).id += '-' + nWidgets;
			labels[i].htmlFor += '-' + nWidgets;
		}
		nWidgets++;
		
		onselect(null);
	}
	
	init();	
	this.tree = tree;
}

SVGTreeViewer_template = [
	'<header>',
		'<div class="svgtree-tree-ops">',
			'<button type="button" class="svgtree-op-undo" title="$undo_hint"></button>',
			'<button type="button" class="svgtree-op-redo" title="$redo_hint"></button>',
			'<button type="button" class="svgtree-op-opt" title="$settings_hint"></button>',
			'<button type="button" class="svgtree-op-nwck" title="$newick_hint"></button>',
		'</div>',
		'<h3></h3>',
	'</header>',
	'<div class="svgtree-main">',
		'<div class="svgtree-scroll">',
			'<div class="svgtree-wrap" style="min-width: 100%;"></div>',
		'</div>',
		'<footer>',
			'<div class="svgtree-node-ops">',
				'<button type="button" class="svgtree-op-loc" title="$loc_hint"></button>',
				'<button type="button" class="svgtree-op-add" title="$add_hint"></button>',
				'<button type="button" class="svgtree-op-rem" title="$remove_hint"></button>',
			'</div>',
		'</footer>',
		
		'<textarea class="svgtree-newick" spellcheck="false"></textarea>',
		'<form class="svgtree-settings">',
			'<div class="svgtree-set-cont">',
			'<div>',
				'<label class="section">$orientation</label>',
				'<input type="radio" id="orientation-h" name="orientation" value="h" checked="true" />',
				'<label for="orientation-h">$orientation_h</label>',
				'<input type="radio" id="orientation-v" name="orientation" value="v" />',
				'<label for="orientation-v">$orientation_v</label>',
			'</div>',
			'<div>',
				'<label class="section">$nodes</label>',
				'<input type="radio" id="nodes-square" name="nodes" value="square" checked="true" />',
				'<label for="nodes-square">$nodes_square</label>',
				'<input type="radio" id="nodes-circle" name="nodes" value="circle" />',
				'<label for="nodes-circle">$nodes_circle</label>',
			'</div>',
			'<div>',
				'<label class="section">$edges</label>',
				'<input type="radio" id="edges-straight" name="edges" value="straight" checked="true" />',
				'<label for="edges-straight">$edges_straight</label>',
				'<input type="radio" id="edges-angular" name="edges" value="angular" />',
				'<label for="edges-angular">$edges_angular</label>',
			'</div>',
			'</div>',
		'</form>',
	'</div>'
].join('\n');

SVGTreeViewer.localization = {
	undo_hint: 'Undo the latest change',
	redo_hint: 'Repeat the undone change',
	settings_hint: 'Display settings',
	newick_hint: 'Newick format for the tree',
	add_hint: 'Add a new child of the selected node',
	remove_hint: 'Remove the selected node and all its descendants',
	loc_hint: 'Center the plot on the selected node',
	settings: 'Display settings',
	orientation: 'Orientation',
	orientation_h: 'horiz.',
	orientation_v: 'vert.',
	nodes: 'Node Shape',
	nodes_square: 'square',
	nodes_circle: 'round',
	edges: 'Edge Shape',
	edges_straight: 'straight',
	edges_angular: 'angular'
};

window.SVGTreeViewer = SVGTreeViewer;

})(window);