/*
 * Embedded Templates For Ajax (ET4A)
 * Copyright (c) 2006, IBM Corp.
 * Copyright (c) 2006, Stephen Farrell <sfarrell@almaden.ibm.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of the IBM Corp. nor the names of its
 *     contributors may be used to endorse or promote products derived from
 *     this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

// define some special css classes
//document.write("\n<style>\n.template {display:none}\n.include {display:none}\n</style>\n");


// declare the IBM.ET4A namespace
var IBM;

if (!IBM) {
	IBM = {};
}

if (!IBM.ET4A) {
	IBM.ET4A = {};
}

// IBM.ET4A.Template is the templating engine itself
// "root" can an element or its id.
IBM.ET4A.Template = function(root, options) {
	if (!window.templates)
		window.templates = [];
	window.templates.push(this);

	if (typeof root == "string")
		root = document.getElementById(root);
		
	if (!options)
		options = {};

	IBM.ET4A._initTemplate(root);
	var orig = root.cloneNode(true);
        IBM.ET4A._setHasOrigPointers(orig, root);

	var bound = false;

	var bindCount = 0;

	this.getRoot = function() { return root; }
	
	this.getOptions = function() { return options; }


	// Take care of template listeners
	var templateListeners = IBM.ET4A.templateListeners.slice(0);

	if (options && options.templateListener)
		templateListeners.push(options.templateListener);
	var moreListeners = []; // if init returns an object, add it as a listener
	for(var i = 0, ni = templateListeners.length; i < ni; i++) {
		if (typeof templateListeners[i].init == "function") {
			var l = templateListeners[i].init.apply(templateListeners[i],[this, root]);
			if (l) 
				moreListeners.push(l);
		}
	}
	for(var i = 0, ni = moreListeners.length; i < ni; i++)
		templateListeners.push(moreListeners[i]);

	// Take care of behavior handlers
	var behaviorHandlers = IBM.ET4A.util.cloneObject(IBM.ET4A.behaviorHandlers);
	if (options && options.behaviorHandlers) {
		for (name in options.behaviorHandlers) {
			behaviorHandlers[name] = options.behaviorHandlers[name];
		}
	}

	var profiling = {
		totalTime: 0,
		dispatchTime: 0,
		dispatchCount: 0,
		handleArrayTime: 0,
		handleObjectTime: 0,
		attributesTime: 0,
		parseClassTime: 0,
		attributesHits: 0,
		parseClassHits: 0
	};

	
	this.getProfiling = function() { return profiling };

	// Main function.  This binds some data to the template.
	// This function can be called more than once.  If so, it
	// it resets the template before binding the new data.
	this.bind = function(data) {
		var start = new Date().getTime();

		if (!root._et4a_bindcount)
			bindCount = root._et4a_bindcount = 1;
		else
			bindCount = ++root._et4a_bindcount;

		for(var i = 0, ni = templateListeners.length; i < ni; i++)
			if (typeof templateListeners[i].beforeBind == "function")
				templateListeners[i].beforeBind.apply(templateListeners[i],[root, data]);

		if (bound)
			unbind.apply(this);

		if (typeof options.callback == "function")
			data = options.callback(data);

		//
		// save a reference to the data bound to root
		// for rebinding
		//
		this.rootData = data;

		//
		// when bind data to the root of the template,
		// it's as if the root had a bind="" param that matched
		// the data, like
		//   <div bind="root">
		// and
		//   {root: data}
		//
		data = bindInternal.apply(this, [root, data]); 
		dispatch.apply(this, [root, data]);
		bound = true;

		if (data != null && root.className != null)
			root.className = root.className.replace(/\btemplate\b/, "");

		for(var i = 0, ni = templateListeners.length; i < ni; i++)
			if (typeof templateListeners[i].bound == "function")
				templateListeners[i].bound.apply(templateListeners[i],[root, data]);

		profiling.totalTime = new Date().getTime() - start;
	};

	this.rebind = function(tmpl) {
		if(tmpl) {
			if(typeof tmpl == "object") { // && instanceof Element
				orig = tmpl;
			} else if (typeof tmpl == "string") {
				orig.innerHTML = tmpl;
			}
			IBM.ET4A._initTemplate(tmpl);
			root = tmpl.cloneNode(true);
                        IBM.ET4A._setHasOrigPointers(orig, root);
			bound = false;
		}
		this.bind(this.rootData);
	};

	this.clear = function() {
		this.bind();
	};


	// This function is used to fetch data from a URL.  It internally does
	// a bind(), either directly on the resulting data, or, if a callback is
	// provided, and what that callback returns.	
	this.fetch = function(url, callback, opts) {
		if (bound)
			unbind.apply(this);
		for(var i = 0, ni = templateListeners.length; i < ni; i++) 
			if (typeof templateListeners[i].fetch == "function")
				data = templateListeners[i].fetch.apply(templateListeners[i], [root, url, opts]);
		var template = this;
		IBM.ET4A.fetchData(url, function(val) {
			if (typeof callback == "function")
				val = callback(val);
			template.bind.apply(template, [val]);
		}, opts);
	};

	function bindInternal(node, data) {
		data = applyBehavior(node, data);
		for(var i = 0, ni = templateListeners.length; i < ni; i++) 
			if (typeof templateListeners[i].bind == "function")
				data = templateListeners[i].bind.apply(templateListeners[i], [node, data]);
		return data;
	}

	function applyBehavior(node, data) {
		var behaviors = IBM.ET4A.parseBehaviors(node);
		if (!behaviors.length)
			return data;

		//var precheck = domPreCheck(node);
			
		for(var i = 0, ni = behaviors.length; i < ni; i++) {
			var fn = behaviorHandlers[behaviors[i].name];
			if (typeof fn == "function") {
				data = fn.apply(this, [node, data, behaviors[i].params, bindCount > 1]);	
			}
		}
		IBM.ET4A._initTemplate(node);

		//domPostCheck(node, precheck);

		return data;
	}

	/*
	function domPreCheck(node) {
		var parent = node.parentNode;
		var nsiblings = node.parentNode.childNodes.length - 1;
		return {parent: parent, nsiblings: nsiblings};
	}

	function domPostCheck(node, precheck) {
		if (node._et4a_is_rebind_safe)
			return;
		var parent = node.parentNode;
		while(parent != precheck.parent) {
			console.log("dirty p: ");
			console.log(parent);
			parent._et4a_dirty = bindCount;
			parent = parent.parentNode;
		}
		var nsiblings = parent.childNodes.length - 1;
		if (precheck.nsiblings != nsiblings) {
			console.log("dirty ns");
			node.parentNode._et4a_dirty = bindCount;
		}
			
	}
	*/


	//
	// Looks at the type of the data and calls some other
	// method to handle it
	//
	function dispatch(node, data) {
	
		// accounting
		var start = new Date().getTime();
		profiling.dispatchCount++;

		/*
		if (node._et4a_dirty && node._et4a_dirty < bindCount) {
			console.log("found dirty..." + node._et4a_dirty);
			node._et4a_dirty = null;
			var orig = IBM.ET4A._orig(node);
			var clone = orig.cloneNode(true);
			IBM.ET4A._setHasOrigPointers(orig, clone);
			node.parentNode.replaceChild(clone, node);
			node = clone;
		}
		*/

		for(var i = 0, ni = templateListeners.length; i < ni; i++) 
			if (typeof templateListeners[i].before == "function")
				data = templateListeners[i].before.apply(templateListeners[i], [node, data]);


		if (typeof data == "object" && data !== null) {
			if (node.nodeType != Node.ELEMENT_NODE)
				return;

			if (data instanceof Array)
				handleArray.apply(this,[node, data]);
			else
				handleObject.apply(this,[node, data]);
				
		} else if (typeof data == "function") {
			// inlined handleFunction()

			if (node.nodeType != Node.ELEMENT_NODE)
				return;

			for(var i = 0, ni = templateListeners.length; i < ni; i++) 
				if (typeof templateListeners[i].bindFunction == "function")
					data = templateListeners[i].bindFunction.apply(templateListeners[i], [node, data]);

			node._et4a_function_prev = node._et4a_function;
			node._et4a_function = data;

			var fn = data;
			data = fn(node, options.object);

			// I think I should always grab the orig node for
			// functions TODO
			dispatch.apply(this, [node, data]);
		} else {
			// inlined handleValue()
			if (node.nodeType != Node.ELEMENT_NODE) {
				throw "Cannot bind value to text node directly";
			}

			for(var i = 0, ni = templateListeners.length; i < ni; i++) 
				if (typeof templateListeners[i].handleValue == "function")
					data = templateListeners[i].handleValue.apply(templateListeners[i], [node, data]);

			node._et4a_value_prev = node._et4a_value;
			node._et4a_value = data;


			var target;
			if (node._et4a_value_prev === undefined) {
				if (node.hasChildNodes())
					target = selectTargetElementForValue.apply(this, [node, "handleValue"]);
				else {
					target = node;
					node.appendChild(document.createTextNode(""));
				}
			} else {
				if (node._et4a_value_prev != node._et4a_value) {
					// find the target node and
					// excise the old value

					target = selectTargetElementForValue.apply(this, [node, "handleValue"]);
					target.firstChild.deleteData(0, ("" + node._et4a_value_prev).length); // need length of string value
				} else {
					// old and new values are the
					// same; we're done.  leave 'target'
					// undefined
				}
			}

			if (target && data !== undefined) {
				// firstChild of target is always
				// a text node.  this is ensured
				// by selectTargetElementForValue
				// and insertTextLeafs and some 
				// hack in handleArray
				target.firstChild.insertData(0, data);
			}
		}
		for(var i = 0, ni = templateListeners.length; i < ni; i++) 
			if (typeof templateListeners[i].after == "function")
				data = templateListeners[i].after.apply(templateListeners[i], [node, data]);


		profiling.dispatchTime += new Date().getTime() - start;
	}

	function childNodesAsArray(node) {
		var array = [];
		for(var i = 0, ni = node.childNodes.length; i < ni; i++)
			array[i] = node.childNodes[i];
		return array;
	}

	function cloneEachNodeForArray(nodes) {
		var clones = [];
		for(var i = 0, ni = nodes.length; i < ni; i++) {
			clones[i] = nodes[i].cloneNode(true);
			if (clones[i].nodeType == Node.ELEMENT_NODE)
				IBM.ET4A._setHasOrigPointers(IBM.ET4A._orig(nodes[i]), clones[i]);
		}
		return clones;
	}


	var DPPE = ["prefix", "delimiter", "postfix", "empty"];

	function getDelimPrePost(node, behavior) {
		if (node._et4a_dpp) // REBINDING
			return node._et4a_dpp;

		node._et4a_dpp = {};
		node._et4a_delims = [];
		for (var i = 0, ni = DPPE.length; i < ni; i++) {
			var behavior2 = DPPE[i];
			var frag;
			var dppattr = node.getAttribute(behavior2);
			if (dppattr) {
				frag = document.createElement("span");
				frag.appendChild(document.createTextNode(dppattr));
			} else {
				frag = IBM.ET4A.findElementByBehavior(node, behavior2);
				if (frag)
					frag.parentNode.removeChild(frag);
			}
			node._et4a_dpp[behavior2] = frag;
		}
		return node._et4a_dpp;
	}

	function handleArray(node, array) {
		var start = new Date().getTime();

		node._et4a_array_prev = node._et4a_array;
		node._et4a_array = array.slice(0);

		for(var i = 0, ni = templateListeners.length; i < ni; i++) 
			if (typeof templateListeners[i].handleArray == "function")
				array = templateListeners[i].handleArray.apply(templateListeners[i], [node, array]);


		var dpp = getDelimPrePost(node);
		if (array.length == 0) {
			node._et4a_array_children = [];
			
			while(node.hasChildNodes())
				node.removeChild(node.firstChild);
			if (dpp['empty'])
				node.appendChild(dpp['empty']);
			return;
		}
		if (dpp['empty'] && dpp['empty'].parentNode)
			dpp['empty'].parentNode.removeChild(dpp['empty']);

		// Ensure that there is a suitable element to clone
		// for each element of the array.  It's not ok to
		// just clone a text node b/c we cannot store
		// the previous data bound to a text node on all
		// browsers. 
		var onode = IBM.ET4A._orig(node);
		var elt_child = false;
		for(var i = 0, ni = node.childNodes.length; i < ni && !elt_child; i++) {
			if (node.childNodes[i].nodeType == Node.ELEMENT_NODE)
				elt_child = true;
				
		}
		if (!elt_child) {
			var ospan = document.createElement("span");
			ospan.appendChild(document.createTextNode(""));
			onode.appendChild(ospan);
			var span = ospan.cloneNode(true);
			IBM.ET4A._setHasOrigPointers(ospan, span);
			node.appendChild(span);
		}

		// REBINDING
		// TODO detect minor changes in array, e.g., offset
		// due to insertion
		var cloneoffset = -1;
		if (node._et4a_array_prev !== undefined) {

			for(var i = array.length - 1, ni = node._et4a_delims.length; i < ni; i++) {
				var d = node._et4a_delims[i];
				if (d.parentNode)
					d.parentNode.removeChild(d);
			}
			node._et4a_delims = node._et4a_delims.slice(0, array.length - 1);

			if(array.length < node._et4a_array_prev.length) {
				cloneoffset = array.length + 1; // don't clone
				
				// remove excess nodes
				for(var i = array.length, ni = node._et4a_array_prev.length; i < ni; i++) {
					for(var j = 0, nj = node._et4a_array_children[i].length; j < nj; j++)
						node.removeChild(node._et4a_array_children[i][j]);
						// TODO break references?
				}
			} else {
				cloneoffset = node._et4a_array_prev.length - 1;
			}

		}
		node._et4a_array_children_prev = node._et4a_array_children;
		node._et4a_array_children = [];

		var nodes, clones;
		if (node._et4a_array_prev === undefined) {
			if (array.length > 0)
				nodes = childNodesAsArray(node);
			if (array.length > 1)
				clones = cloneEachNodeForArray(nodes);
		} else {
			// REBINDING
			if (array.length - 1 > cloneoffset) {
				var o = IBM.ET4A._orig(node);
                                var oclone = o.cloneNode(true);
                                IBM.ET4A._setHasOrigPointers(o, oclone);
				// Remove delims from clones (icky, and
				// I can't remember why)
				for(var i = 0, ni = DPPE.length; i < ni; i++) {
					var dppn = IBM.ET4A.findElementByBehavior(oclone, DPPE[i]);
					if (dppn)
						dppn.parentNode.removeChild(dppn);
				}

                                clones = cloneEachNodeForArray(childNodesAsArray(oclone));
			}
		}

		for(var i = 0, ni = array.length; i < ni; i++) {

			if (node._et4a_array_prev === undefined) {
				if (i == 0) {
					if (dpp['prefix'] !== undefined) {
						node.appendChild(dpp['prefix']);
					}
				} else if (i < array.length - 1) {
					nodes = cloneEachNodeForArray(clones);
				} else {
					nodes = clones;
				}
			} else {
				// REBINDING
				if (i > cloneoffset) {
					nodes = cloneEachNodeForArray(clones);
				} else {
					nodes = node._et4a_array_children_prev[i];
				}
			}
		
			// REBINDING maintain map of which children
			// correspond to which array elements
			node._et4a_array_children.push(nodes);

			var lastnode;
			if (typeof array[i] == "object") {
				for(var j = 0, nj =  nodes.length; j < nj; j++) {
					if (i > cloneoffset)
						node.appendChild(nodes[j]);
					if (nodes[j].nodeType == Node.ELEMENT_NODE) {
						dispatch.apply(this, [nodes[j], array[i]]);
						lastnode = nodes[j];
					}
				}
			} else { // value

				if (i > cloneoffset || nodes.length == 0) {
					if (nodes.length == 0)
						nodes[0] = document.createTextNode("");
					for(var j = 0, nj = nodes.length; j < nj; j++)
						node.appendChild(nodes[j]);
				}

				var t = selectTargetElementForValue.apply(this, [nodes, "handleArray"]); 
				dispatch.apply(this,[t, array[i]]);
				lastnode = t;
			}

			// handle delimiter
			if (i >= cloneoffset && i != array.length - 1 && dpp['delimiter'] !== undefined) {
				var delimclone = dpp['delimiter'].cloneNode(true);
				if (!lastnode.nextSibling)
					node.appendChild(delimclone);
				else
					node.insertBefore(delimclone, lastnode.nextSibling);
				node._et4a_delims.push(delimclone);
			}

			// handle postfix
			if (i == array.length - 1 && dpp['postfix'] !== undefined) {
				var post = dpp['postfix'];
				if (post.parentNode)
					post.parentNode.removeChild(post);
				node.appendChild(post);
			}

		}
		profiling.handleArrayTime += new Date().getTime() - start;
	}

	// Return the node where to stick a value (string/int/etc)
	function selectTargetElementForValue(node_or_nodes, usage) {
		var nodes;
		if (node_or_nodes instanceof Array) {
			nodes = node_or_nodes;
		} else {
			var node = node_or_nodes;
			if (node.hasChildNodes())
				nodes = childNodesAsArray(node);
			else {
				node.appendChild(document.createTextNode(""));
				return node;
			}
		}

		if (nodes.length == 0) {
			alert(usage);
			throw "selecttargetelementforvalue w/empty array";
		}
		for(var i = 0, ni = nodes.length; i < ni; i++) {
			if (nodes[i].nodeType == Node.ELEMENT_NODE && !IBM.ET4A.emptyTags[nodes[i].tagName.toLowerCase()]) {
				return selectTargetElementForValue.apply(this,[nodes[i], usage + "R"]);
			}
		}
		return nodes[0].parentNode;
	}



	function elementEvent(node, obj, fn) {
		return function(evt) {
			fn(node, obj, evt);
		}
	}

	function parseBindAttributes(str) {
		// TODO handle quotes
		var bas = [];
		if (str == null)
			return bas;
		var parts = str.split(/\s*;\s*/);
		for(var i = 0, ni = parts.length; i < ni; i++) {
			var colon = parts[i].indexOf(":");
			if (colon > -1)
				bas.push({
					name: IBM.ET4A.util.trim(parts[i].substring(0, colon)),
					value: IBM.ET4A.util.trim(parts[i].substring(colon + 1)).split(/\s*,\s*/)
					});
			else
				; // warning?
		}
		return bas;
	}

	function bindAttributes(node, obj) {
		var onode = IBM.ET4A._orig(node);

		var bindattrs = parseBindAttributes(node.getAttribute("bindAttributes"));
		for(var i = 0, ni = bindattrs.length; i < ni; i++) {
			var k = bindattrs[i].name;
			// TODO var interpolation in bindattrs
			var v = obj[bindattrs[i].value];
			var origattr = onode.getAttribute(k);
			if (origattr)
				origattr = origattr + " ";
			else
				origattr = "";
			if (v != undefined) {
				if (k == "class")
					node.className = origattr + v;
				else if (typeof v == "function") {
					node[k] = elementEvent(node, obj, v);
				} else {
					node.setAttribute(k, origattr + v);
				}
			}
		}
	}

	function handleObjectDispatchToChildren(node, obj) {
		// iterate on a copy
		var ch = []; 
		for(var i = 0, ni = node.childNodes.length; i < ni; i++) 
			ch[i] = node.childNodes[i];
		for(var i = 0, ni = ch.length; i < ni; i++)
			if (ch[i].nodeType == Node.ELEMENT_NODE)
				dispatch.apply(this, [ch[i], obj]);
	}

	function handleObject(node, obj) {
		var start = new Date().getTime();

		// always bind attributes. doesn't affect traversal
		bindAttributes(node, obj);

		
		var bindkey = node.getAttribute("bind");
		if (bindkey === null) {
			handleObjectDispatchToChildren.apply(this, [node, obj]);
		} else {
			// call OBJECT listeners
			for(var i = 0, ni = templateListeners.length; i < ni; i++) 
				if (typeof templateListeners[i].handleObject == "function")
					obj = templateListeners[i].handleObject.apply(templateListeners[i], [node, obj]);


			// maintain previous state for REBINDING
			node._et4a_object_prev = node._et4a_object;
			node._et4a_object = obj;

			// this is the value bound here
			var cur = obj[bindkey];

			// handle REBINDING OBJECTS
			var onode = IBM.ET4A._orig(node);
			if (node._et4a_object_prev !== undefined) {
				var prev = node._et4a_object_prev[bindkey];
				if (prev !== undefined && cur === undefined) {
					// The only case to handle here is the one
					// where the previous binding had data
					// here, but the current one does not.
					var o = onode.cloneNode(true);
					IBM.ET4A._setHasOrigPointers(onode, o);
					o._et4a_object = obj;
					node.parentNode.replaceChild(o, node);
				}
			}
		
			cur = bindInternal.apply(this, [node, cur]);

			// binding null is the same as binding an
			// empty array
			if (cur == null)
				cur = [];

			if (typeof cur == "object" && !(cur instanceof Array)) 
				handleObjectDispatchToChildren.apply(this, [node, cur]);
			else 
				dispatch.apply(this, [node, cur]);
		}
		
		profiling.handleObjectTime += new Date().getTime() - start;
	}



	function unbind() {
		bound = false;
	}
}

// these are the empty tags in HTML 4.0
IBM.ET4A.emptyTags = {area:1, base:1, basefont:1, br:1, col:1, frame:1, hr:1, img:1, input:1, isindex:1, link:1, meta:1, param:1};



IBM.ET4A.templateListeners = [ { afterDispatch: function(node, data) {
		if (node.tagName == "IMG") {
			if (!node.src) {
				node.style.display="none";
			} else if (navigator.appVersion.match(/\bMSIE\b/)) {
				// IE seems to need reminding that the image
				// src has changed
				setTimeout(function() { 
					node.src = node.src 
				}, 10);
			}
		}
		return data;
	}
}
];

// A template listener is a property list with any of these functions:
// 	init(template, root) called when template constructed.  If
//           it returns an object, that object is added to the listener
//           list
// 	handleObject(node, object)
// 	handleArray(node, array)
// 	handleValue(node, value)
//	bind(node,data) called when bind="" cases data to be bound to a node
//	after(node,data) called after each node is traversed
//	before(node,data) called before each node is traversed
// 	done(root,data) called after entire template is bound
// Their return value is ignored
IBM.ET4A.addTemplateListener = function(handler) {
	IBM.ET4A.templateListeners.push(handler);
};



// Behavior handler stuff
IBM.ET4A.setBehaviorHandler = function(name, handler) {
	IBM.ET4A.behaviorHandlers[name] = handler;
};

IBM.ET4A.behaviorHandlers = {
	"hide-if-null": function(node,data) {
		if (data == null)
			node.style.display = "none";
		else
			node.style.display = "";
		return data;
	}
}; 

IBM.ET4A.hasBehavior = function(node, behavior) {
	var behaviors = IBM.ET4A.parseBehaviors(node);
	for(var i = 0, ni = behaviors.length; i < ni; i++) {
		if (behaviors[i].name == behavior)
			return true;
	}
	return false;
}

IBM.ET4A.findElementsByBehavior = function(node, behavior) {
	var elts = [];
	// inefficient to declare inline?
	var iter = function(node) {
		if (IBM.ET4A.hasBehavior(node, behavior))
			elts.push(node);
		for(var i = 0, ni = node.childNodes.length; i < ni; i++) {
			iter(node.childNodes[i], behavior);
		}
	}
	iter(node, behavior);
	return elts;
}

IBM.ET4A.findElementByBehavior = function(node, behavior) {
	var elts = IBM.ET4A.findElementsByBehavior(node, behavior);
	return elts.length > 0 ? elts[0] : undefined;
};

IBM.ET4A.parseBehaviors = function(node) {
	// TODO handle quotes

	if (node.nodeType != Node.ELEMENT_NODE) 
		return [];

	if (node._behaviors !== undefined)
		return node._behaviors;
	node._behaviors = [];

	var bhv = node.getAttribute("behavior");
	if (!bhv)
		return node._behaviors;

	var bhvs = bhv.split(/;/);
	for(var i = 0, j = bhvs.length; i < j; i++) {
		var idx = bhvs[i].indexOf(':');
		var b = idx == -1 ? bhvs[i] : bhvs[i].substring(0, idx);
		var params = bhvs[i].substring(idx+1);
		params = params.replace(/(?:^\s+|\s+$)/g, "");
		var p;
		if (idx > -1) {
			p = params.split(/\s*,\s*/);
		}
		node._behaviors.push({name: b, params: p});
	}
	return node._behaviors;
}

IBM.ET4A.resetNode = function(node) {
	var orig = IBM.ET4A._orig(node);
	var clone = orig.cloneNode(true);
	IBM.ET4A._setHasOrigPointers(orig, clone);
	node.parentNode.replaceChild(clone, node);
}


// Data fetching routines

IBM.ET4A.callbackCounter = 0;

IBM.ET4A.fetchData = function(url, callback, options) {
	var script = document.createElement('script');
	var callbackname = options && options.callbackname ? options.callbackname : "_et4a_callback_" + IBM.ET4A.callbackCounter++;
	window[callbackname] = function(val) {
		callback.apply(options ? options.context : null, [val]);
		// cleanup
		if (!options || !options.callbackname)
			window[callbackname] = null;
		script.parentNode.removeChild(script);
	};
	script.src = url + (url.indexOf("?") == -1 ? "?" : "&") + "callback=" + callbackname;
	if (options && options.anticache)
		src.src += "&anticache=" + new Date().getTime();
	script.type = 'text/javascript';
	script.charset = "utf-8"; // right??
	document.body.appendChild(script);
};


IBM.ET4A.getNodeObject = function(node) {
	return node._et4a_object;
};

IBM.ET4A.getNodeFunction = function(node) {
	return node._et4a_function;
};

IBM.ET4A.getNodeArray = function(node) {
	return node._et4a_array;
};

IBM.ET4A.getNodeValue = function(node) {
	return node._et4a_value;
};


IBM.ET4A.include = function(include, options) {
	var node;
	if (typeof include == "string") {
		if (include.charAt(0) == "#") {
			node = document.getElementById(include.substring(1));
		} else { 
			// hinclude?
		}
	} else {
		node = include;
	}
	if (node) {
		if (!options || options.init === undefined || options.init) {
			IBM.ET4A._initTemplate(node);
		}
		var clone = node.cloneNode(true);
		clone.removeAttribute("id");
		if (clone.className != null)
			clone.className = clone.className.replace(/\binclude\b/, "");
		return clone;
	}
	return null;
};



// Stick this in the data tree to spec the template to include.
// The include is a reference to a template, either as a DOM
// node, a "#id" to refer to a fragment by id, or a URL (not
// implemented yet).
IBM.ET4A.including = function(include, data) {
	return function(node) {
		node.appendChild(IBM.ET4A.include(include));
		return data;
	}
};

IBM.ET4A._initTemplate = function(node) {
	IBM.ET4A.traverse(node, function(node) {
		
		// only init once
		if (node._et4a_init_once)
			return;
		node._et4a_init_once = true;

		// process includes
		if (typeof node.getAttribute("include") == "string") {
			var inc = IBM.ET4A.include(node.getAttribute("include"), {init:false});
			if (inc) {
				node.removeAttribute("include");
				node.appendChild(inc);
			}
		}
		// rewrite bindLink as bind + bindAttributes
		var bl = node.getAttribute("bindLink");
		if (bl != null) {
			var link = bl.split(/\s+/);
			var attrs = [];
			attrs.push({name:"href", value:link[0]});
			if (link.length > 1)
				node.setAttribute("bind", link[1]);
			if (link.length > 2)
				attrs.push({name:"rel", value:link[2]});
			if (link.length > 3)
				attrs.push({name:"title", value:link[3]});
			IBM.ET4A.appendBindAttributes(node, attrs);
		}
/*
		var bi = node.getAttribute("bindImage");
		if (bi != null) {
			var image = bi.split(/\s+/);
			var attrs = [];
			attrs.push({name:"src", value:image[0]});
			if (image.length > 1)
				attrs.push({name:"alt", value:image[1]});
			if (image.length > 2)
				attrs.push({name:"title", value:image[2]});
			IBM.ET4A.appendBindAttributes(node, attrs);
		}
*/
	});
}

IBM.ET4A.appendBindAttributes = function(node, attrs) {
	var old = node.getAttribute("bindAttributes");
	if (old == null)
		old = "";
	var head = "";
	for(var i = 0, ni = attrs.length; i < ni; i++) {
		head += attrs[i].name + ":" + attrs[i].value + ";";
	}
	node.setAttribute("bindAttributes", head + old);
}


IBM.ET4A.traverse = function(node, callback) {
	callback(node);
	for(var i = 0, ni = node.childNodes.length; i < ni; i++)
		if (node.childNodes[i].nodeType == Node.ELEMENT_NODE)
			IBM.ET4A.traverse(node.childNodes[i], callback);
}

IBM.ET4A._processIncludes = function(node) {
	if (typeof node.getAttribute("include") == "string") {
		var inc = IBM.ET4A.include(node.getAttribute("include"), {init:false});
		if (inc)  
			node.appendChild(inc);
	}
	for(var i = 0, ni = node.childNodes.length; i < ni; i++)
		if (node.childNodes[i].nodeType == Node.ELEMENT_NODE)
			IBM.ET4A._processIncludes(node.childNodes[i]);
};


IBM.ET4A._setHasOrigPointers = function(orig, node) {
	if (orig.nodeType == Node.ELEMENT_NODE) {
		// IE trips this and FF does not.  I don't know
		// why.
		//if (node._et4a_is_orig)
			//throw "Attempt to set orig to orig";
		orig._et4a_is_orig = true;
		if (!node._et4a_has_orig)
			node._et4a_has_orig = orig;
		for(var i = 0, ni = orig.childNodes.length; i < ni; i++)
			IBM.ET4A._setHasOrigPointers(orig.childNodes[i], node.childNodes[i]);
	}
}

IBM.ET4A._orig = function(node) {
	if (node.nodeType != Node.ELEMENT_NODE)
		throw "cannot fetch orig of non-element node";
	// there is not an orig if the template is included inline
	//if (!node._et4a_has_orig)
		//throw "_orig when no orig";
	return node._et4a_has_orig ? node._et4a_has_orig : node;
};

// Related utilities
IBM.ET4A.util = {
	// Generic event watching wrapper for IE/Mozilla compatibility
	watchEvent: function(element, name, observer, useCapture) {
		if (element.addEventListener) element.addEventListener(name, observer, useCapture);
		else if (element.attachEvent) element.attachEvent('on' + name, observer);
	},

	cloneObject: function(source) {
		var CLONE_PROPERTY = "__et4a__clone";
		var clone = cloneHelper(source);
		removeCloneRefs(source);
		return clone;
		
		function cloneHelper(source) {
			if (source === undefined) {
				return undefined;
			}
			else if (source == null) {
				return null;
			}

			var clone;
			if (IBM.ET4A.util.isArray(source)) {
				clone = [];
			}
			else {
				clone = {};
			}
			source[CLONE_PROPERTY] = clone;

			for (var i in source) {
				if (i != CLONE_PROPERTY) {
					if (source[i] != null && source[i][CLONE_PROPERTY] != undefined) {
						clone[i] = source[i][CLONE_PROPERTY];
					}
					else if (typeof source[i] == 'object') {
						clone[i] = cloneHelper(source[i]);
					}
					else {
						clone[i] = source[i];
					}
				}
			}

			return clone;
		}
		
		function removeCloneRefs(o) {
			if (o == null) {
				return;
			}
			if (typeof o[CLONE_PROPERTY] != "undefined") {
				delete o[CLONE_PROPERTY];
				for (var i in o) {
					removeCloneRefs(o[i]);
				}
			}
		}
		return null;
	},

	indexOf: function(array, value) {
		var result = -1;
		for(var i = 0, ni = array.length; result == -1 && i < ni; i++) {
			if (array[i] == value) {
				result = i;
				break;
			}
		}
		return result;
	},

	arrayContains: function(array, value) {
		return IBM.ET4A.util.indexOf(array, value) != -1;
	},
	
	isFunction: function(a) {
		return typeof a == 'function';
	},
	
	isObject: function(a) {
		return (a && typeof a == 'object') || IBM.ET4A.util.isFunction(a);
	},

	isArray: function(obj) {
		return IBM.ET4A.util.isObject(obj) && obj.constructor == Array;
	},

	trim: function(str) {
		var l = 0, r = str.length;
		for(var i = 0, ni = str.length; i < ni; i++) {
			l = i;
			if (str.charAt(i) != ' ')
				break;
		}	

		for(var i = 0, ni = str.length; i < ni; i++) {
			r = ni - i;
			if (str.charAt(ni - i - 1) != ' ')
				break;
		}	
		return str.substring(l, r);
	}
};

// give push() method to arrays if necessary (e.g., IE)
if (!Array.prototype.push) {
	Array.prototype.push = function (element) {
		this[this.length] = element;
	}
}

if (typeof Node == "undefined") {
	Node = {
		ELEMENT_NODE: 1,
		ATTRIBUTE_NODE: 2,
		TEXT_NODE: 3
	}
}

