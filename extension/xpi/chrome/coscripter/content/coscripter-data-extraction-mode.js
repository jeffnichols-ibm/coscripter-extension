/*
This Program contains software licensed pursuant to the following: 
MOZILLA PUBLIC LICENSE
Version 1.1
The contents of this file are subject to the Mozilla Public License
Version 1.1 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS"
basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
License for the specific language governing rights and limitations
under the License.
The Original Code is IBM.
The Initial Developer of the Original Code is IBM Corporation.
Portions created by IBM Corporation are Copyright (C) 2007
IBM Corporation. All Rights Reserved.
Contributor(s): Greg Little, Allen Cypher (acypher@us.ibm.com), Tessa Lau, Clemens Drews, James Lin, Jeffrey Nichols, Eser Kandogan, Jeffrey Wong, Gaston Cangiano, Jeffrey Bigham.

This Program also contains a code package known as 'inheritance methods' that is licensed pursuant to the license listed below. 
inheritance methods
The program known as 'inheritance methods' is licensed under the terms below. Those terms are reproduced below for your reference.

Copyright (c) 2000-2004, Kevin Lindsey
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.

    - Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

    - Neither the name of this software nor the names of its contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

This Program also contains a code package known as developer.mozilla.org sample code that is licensed pursuant to the license listed below. 
developer.mozilla.org sample code 
The program known as developer.mozilla.org sample code is licensed under the terms below. Those terms are reproduced below for your reference.

The MIT License
Copyright (c) 2007 Mozilla
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions: 
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software. 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
// Debug method for all coscripter files loaded into Firefox's mainChromeWindow is coscripter.debug, defined in coscripter-browser-overlay.js

// coscripter-scratch-space-browser-overlay.js, coscripter-scratch-space-editor.js and coscripter-data-extraction-mode.js are all loaded into Firefox's mainChromeWindow by coscripter-scratch-space-browser-overlay.xul
//
// This file contains routines for interactively selecting elements in the first row of a content table, and
//	extracting the data from the rest of the rows of the table (and placing them in a Vegemite table)
///////////////////////////////////////////////////
////  coscripter-data-extraction-mode.js  ////////
///////////////////////////////////////////////// 
///////////////////////////////////////////////// 
//		
// Constants
// General Methods
// Extraction Toolbar
// Extraction
//		addExtractionElement
//		extract
// Row Guessing Heuristics
//		guessAtRows
// Stupid Text Extraction
// XPath Generation
// Clipping Methods
//		onPerformContentSelection
// Element Highlighting
//
////////////////////////////////////////////////

function CoScripterDataExtraction(chromeWindow) {

	// useful variable to keep track of
	this._window = chromeWindow;
	
	this.utils = this._window.coscripter.components.utils()
	
	// extraction mode variables
	this._extractionActive = false;
	this._extractionBrowser = null;
	this._extractionScratchSpaceUI = null;

	this._extractionElements = [];	// each extractionElement contains XPath information about a column in the content page's table that is to be extracted
	this._matchRows = [];
	
	// clipping member variables
	this.interactiveSelectMode = false;
	this.focusElem = null;
	this.interactiveHighlightNode = null;	// the element created by highlightNode in utils that covers up the element under the mouse
	this.callbackMethod = null;
	
	this.mouseOverHandler = null;
	this.mouseClickHandler = null;
	this.keyPressHandler = null;
}

CoScripterDataExtraction.prototype = {

	///////////////////////////////////////////////////////////////////////////
	// Constants
	///////////////////////////////////////////////////////////////////////////

	STORED_BACKGROUND_COLOR_ATTRIB : "custom-attrib-previous-background-color",
	STORED_MOUSEOVER_SELECTION_PREVIOUS_COLOR_ATTRIB : "custom-attrib-previous-mouseover-color",
	EXTRACTION_TOOLBAR_ID : "vegemite-extraction-toolbar",


	///////////////////////////////////////////////////////////////////////////
	// General Methods
	///////////////////////////////////////////////////////////////////////////

	inExtractionMode : function()
	{
		return this._extractionActive;
	},
	
	startExtractionMode : function(browser, scratchSpaceUI)
	{
		if (this.inExtractionMode())
			//throw new Error("can't enter extraction mode twice");
			this.exitExtractionMode();
			
		this._extractionActive = true;
		this._extractionBrowser = browser;
		this._extractionScratchSpaceUI = scratchSpaceUI;
		this._extractionElements = [];
		this._matchRows = [];
		
		//this.createAndShowExtractionToolbar();
	},
	
	exitExtractionMode : function()
	{
		if (!this.inExtractionMode())
			throw new Error("not in extraction mode");

		this.removeSelectionListeners();

		this._extractionActive = false;
		this._extractionBrowser = null;
		this._extractionScratchSpaceUI = null;
		
		this.removeExtractionToolbar();
	},
	
	
	///////////////////////////////////////////////////////////////
	// Extraction Toolbar
	///////////////////////////////////////////////////////////////
	
	createAndShowExtractionToolbar : function()
	{
		var doc = this._window.document;
		var extractionObj = this;

		// create the toolbar
		var toolbar = doc.createElement("toolbar");
		toolbar.setAttribute("id", this.EXTRACTION_TOOLBAR_ID);		

		// add data button
		var addDataButton = doc.createElement("toolbarbutton");
		addDataButton.setAttribute("label", "Add Data");
		addDataButton.addEventListener("click", function() {extractionObj.onAddDataClicked.apply(extractionObj, arguments)}, true);
		toolbar.appendChild(addDataButton);
		
		// extract button
		var extractButton = doc.createElement("toolbarbutton");
		extractButton.setAttribute("label", "Click items in first row...");
		extractButton.addEventListener("click", function() {extractionObj.onExtractClicked.apply(extractionObj, arguments)}, true);
		toolbar.appendChild(extractButton);
		
		// insert the toolbar in the browser tab before the browser
		this._extractionBrowser.parentNode.insertBefore(toolbar, this._extractionBrowser);
	},
	
	removeExtractionToolbar : function()
	{
		var doc = this._window.document;
		
		// get toolbar
		var toolbar = doc.getElementById(this.EXTRACTION_TOOLBAR_ID);
		
		if (toolbar != null)
			toolbar.parentNode.removeChild(toolbar);
	},


	//////////////////////////////////////////////////
	// Extraction
	//////////////////////////////////////////////////
	
	onAddDataClicked : function(event)
	{
		var extractionObj = this;
				
		this.onPerformContentSelection(function() {extractionObj.onElementSelected.apply(extractionObj, arguments);});
	},
	
	onElementSelected : function(element, doc)
	{
		if (element != null)
		{
			this.addExtractionElement(element, doc);
		}
	},
	
	//		addExtractionElement
	addExtractionElement: function(element, doc)
	{
		var extractionObj = this;

		this._extractionElements.push(this.createElementObject(element));

		this.addPermanentHighlight(element, "#F9FFB3");
		
		this.guessAtRows();
		
		this.onPerformContentSelection(function() {extractionObj.onElementSelected.apply(extractionObj, arguments);});		
	},

	onExtractClicked : function(event)
	{
		extract();
	},
	
	//		extract
	// called interactively by "Import Data from Web Page..." button, and programatically by the "* extract" CoScripter command
	extract: function(overwriteP) {	
		var editor = this._extractionScratchSpaceUI.getEditor();
		//var currentTable = editor.getCurrentTableIndex();
		var currentTable = 0 // above line in programmattic call sometimes evaluates to undefined
		this.clearHighlight()	// just in case some large element is still selected

		// determine the column to start with
		var startColumnIndex = 0;			
		// add sufficient columns
		var columnsNeeded = this._extractionElements.length - (editor.getDataColumnCount(currentTable) - startColumnIndex);
		for(var i = 0; i < columnsNeeded; i++) editor.addColumn(currentTable);
	
		// unless we are overwriting, determine the row to start with, so that we will append to the current data
		var startRowIndex = 0;
		if (!overwriteP && !editor.initialTableP(currentTable) && (editor.getDataRowCount(currentTable) != 1))	// editor.getDataRowCount uses the editor's treeBoxObject, not the underlying table data
			startRowIndex = editor.getDataRowCount(currentTable)				
		// add sufficient rows
		var rowsNeeded = this._matchRows.length - (editor.getDataRowCount(currentTable) - startRowIndex);
		for(var i = 0; i < rowsNeeded; i++) editor.addRow(currentTable);

		// get a URI object corresponding to the location of the current page
		var origURI = this.getNSURIFromString(this._extractionBrowser.contentDocument.location.toString());
		
		// Keep the extractionElement information so the table can be re-extracted later with an "* extract table" command
		var scratchSpace = this._extractionScratchSpaceUI.scratchSpace
		var tableIndex = editor.getCurrentTableIndex()
		var table = scratchSpace.getTables()[tableIndex]
		table.newExtractionElementsByUrl.push({ url : origURI, extractionElements : this._extractionElements })	// keep temporarily in newExtractionElementsByUrl. Then append to extractionElementsByUrl when the editor data is saved to the table.
		// this._extractionElements is an array of extractionElements, where each extractionElement is an object with properties element, parentList, xpath, and xpathSnippet
		
		// enter the data
		for(var i = 0; i < this._matchRows.length; i++)
		{
			var row = this._matchRows[i];
			for(var j = 0; j < row.length; j++)
			{
				// TODO: textContent is probably wrong
				if (row[j] != null)
				{
					editor.setData(currentTable, startRowIndex+i, startColumnIndex+j, this.utils.trim(this.getTextContent(row[j])));
					if (row[j].nodeName.toLowerCase() == "a" && row[j].hasAttribute('href'))
					{
						var url = origURI.resolve(row[j].getAttribute('href'))
						editor.setMetaData(currentTable, startRowIndex+i, startColumnIndex+j, url);
					}
					this.clearPermanentHighlight(row[j]);
				}
			}
		}
	
		this.exitExtractionMode();
	},

	getNSURIFromString : function(urlString, baseUrl)
	{
		var url = Components.classes["@mozilla.org/network/standard-url;1"]
		                        .createInstance(Components.interfaces.nsIStandardURL);
		url.init(url.URLTYPE_STANDARD, 0, urlString, null, baseUrl);
		
		return url.QueryInterface(Components.interfaces.nsIURI);
	},
	
	createExtractionScript: function() {
		// Create extraction script
		var currentUrl = this._extractionBrowser.contentDocument.location.toString();
		var extractProcedureBody = [];
		extractProcedureBody.push('* go to ' + currentUrl);
		extractProcedureBody.push('* begin extraction');
		for (var i = 0, n = this._extractionElements.length; i < n; i++) {
			var extractedElement = this._extractionElements[i];
			extractProcedureBody.push('* click on x"' + extractedElement.xpath + '"');
		}
		extractProcedureBody.push('* end extraction');
		
		var sidebar = this.utils.getCoScripterWindow(this._window);
		var extractProcedure = sidebar.createProcedure();
		extractProcedure.setBody(extractProcedureBody.join('\n'))
		extractProcedure.setTitle("Import data from " + this._extractionBrowser.contentDocument.title);
		extractProcedure.setPrivate(true);
		sidebar.saveProcedureToWiki(extractProcedure, true);
	},
	

	//////////////////////////////////////////////////
	// Row Guessing Heuristics
	//////////////////////////////////////////////////

	createElementObject : function(element)
	{
		var elemObj = {};
		var doc = element.ownerDocument;

		// element		
		elemObj.element = element;

		// create the parent list
		elemObj.parentList = [];
		var parent = element.parentNode;
		while(parent != null && parent != doc.documentElement)
		{
			elemObj.parentList.unshift(parent);
			parent = parent.parentNode;
		}

		// generate an xpath
		elemObj.xpath = this.buildXPathForNode(element, false);
		
		return elemObj;
	},

	//		guessAtRows
	guessAtRows : function()
	{
		for(var i = 0; i < this._matchRows.length; i++)
		{
			for(var j = 0; j < this._matchRows[i].length; j++)
			{
				var found = false;
				for(var k = 0; k < this._extractionElements.length; k++)
				{
					if (this._matchRows[i][j] == this._extractionElements[k].element)
					{
						found = true;
						break;
					}
				}
				
				if (!found)
					this.clearPermanentHighlight(this._matchRows[i][j]);
			}
		}

		var commonParent = this.determineCommonParent(this._extractionElements);
		if (commonParent == null)
			return;
			
		var doc = commonParent.ownerDocument;
		
		var matchCount = [];
		var matchParent = commonParent;
		while(matchParent != matchParent.ownerDocument.documentElement)
		{
			var matchObj = {parent : matchParent, count : 0}
			matchCount.unshift(matchObj);
		
			// grab some xpath values
			var parentXpath = this.buildXPathForNode(matchParent, false);
			var lastIndex = parentXpath.lastIndexOf('[');
			var parentXpathNoIndex = parentXpath.substring(0, lastIndex+1);
			var index = parseInt(parentXpath.substring(lastIndex+1, parentXpath.length-1));
				
			// generate child xpath snippets
			for(var i = 0; i < this._extractionElements.length; i++)
			{
				var elemObj = this._extractionElements[i];
				elemObj.xpathSnippet = elemObj.xpath.substring(parentXpath.length);
			}
			
			var matchParentParent = matchParent.parentNode;
			var nodeCount = 0;
			for(var i = 0; i < matchParentParent.childNodes.length; i++)
			{
				var child = matchParentParent.childNodes[i];
				if (child.nodeName == matchParent.nodeName)
				{
					nodeCount++;
					if (nodeCount >= index && child != matchParent)
					{
						var matchXpathPrefix = parentXpathNoIndex + nodeCount + "]";
						for(var j = 0; j < this._extractionElements.length; j++)
						{
							var matchXpath = matchXpathPrefix + this._extractionElements[j].xpathSnippet;
							var matchElem = this.evaluateXPath(matchXpath, doc);
							if (matchElem != null)
								matchObj.count++;
						}
					}
				}
			}

			//alert(parentXpath + " : " + matchObj.count);
			matchParent = matchParent.parentNode;
		}
		
		var maxMatch = matchCount[0];
		for(var i = 1; i < matchCount.length; i++)
		{
			if (matchCount[i].count > maxMatch.count)
			{
				maxMatch = matchCount[i];
			}
		}
		
		if (maxMatch.count > 0)
		{
			this._matchRows = [];
		
			// we found a matching parent
			matchParent = maxMatch.parent;

			// grab some xpath values
			var parentXpath = this.buildXPathForNode(matchParent, false);
			var lastIndex = parentXpath.lastIndexOf('[');
			var parentXpathNoIndex = parentXpath.substring(0, lastIndex+1);
			var index = parseInt(parentXpath.substring(lastIndex+1, parentXpath.length-1));
				
			// generate child xpath snippets
			for(var i = 0; i < this._extractionElements.length; i++)
			{
				var elemObj = this._extractionElements[i];
				elemObj.xpathSnippet = elemObj.xpath.substring(parentXpath.length);
			}
			
			var matchParentParent = matchParent.parentNode;
			var nodeCount = 0;
			for(var i = 0; i < matchParentParent.childNodes.length; i++)
			{
				var child = matchParentParent.childNodes[i];
				if (child.nodeName == matchParent.nodeName)
				{
					nodeCount++;
					if (nodeCount >= index)
					{
						var matchElems = [];
						var matchXpathPrefix = parentXpathNoIndex + nodeCount + "]";
						var allNull = true;
						for(var j = 0; j < this._extractionElements.length; j++)
						{
							var matchXpath = matchXpathPrefix + this._extractionElements[j].xpathSnippet;
							var matchElem = this.evaluateXPath(matchXpath, doc);
							matchElems.push(matchElem);
							if (matchElem != null)
							{
								allNull = false;
								if (child != matchParent)
								{
									this.addPermanentHighlight(matchElem, "#EEEEEE");
								}
							}						
						}
					
						if (!allNull)
							this._matchRows.push(matchElems);
					}
				}
			}
		}
	},
	
	determineCommonParent : function(aryElemObjs)
	{
		if (aryElemObjs.length == 1)
			return aryElemObjs[0].element.parentNode;
	
		var minLength = aryElemObjs[0].parentList.length;
		for(var i = 1; i < aryElemObjs.length; i++)
		{
			if (aryElemObjs[i].parentList.length < minLength)
			{
				minLength = aryElemObjs[i].parentList.length;
			}
		}
		
		var parent = null;
		for(var i = (minLength-1); i >= 0; i--)
		{
			var parent = aryElemObjs[0].parentList[i];
			var found = true;
			for(var j = 1; j < aryElemObjs.length; j++)
			{
				if (parent != aryElemObjs[j].parentList[i])
				{
					found = false;
					break;
				}
			}
			
			if (found)
			{
				return parent;
			}
		}
		
		return null;
	},


	//////////////////////////////////////////////////
	// Stupid Text Extraction
	//////////////////////////////////////////////////

	getTextContent : function(elem)
	{
		var textContent = "";
		for(var i = 0; i < elem.childNodes.length; i++)
		{
			if (elem.childNodes[i].nodeType == elem.TEXT_NODE)
			{
				textContent += elem.childNodes[i].textContent + " ";
			}
		}
		
		return textContent;
	},

	//////////////////////////////////////////////////
	// XPath Generation
	//////////////////////////////////////////////////
	
	buildXPathForNode : function(node, useIds, foundId)
	{
		if (useIds == null)
			useIds = true;

		if (foundId == null)
			foundId = false;

		if (node.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul")
		{
			return "";
		}

		var parent = node.parentNode;
		var path = "";

		if (parent == null)
		{
			if (node.defaultView != null &&
				node.defaultView.frameElement != null &&
				node.defaultView.frameElement.namespaceURI != "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul")
			{
				path = this.buildXPathForNode(node.defaultView.frameElement, useIds, false);
				path += "/document()";
			}
		}
		else if (parent == node)
		{
			return "";
		}
		else
		{
			path = this.buildXPathForNode(parent, useIds, foundId || 
											(node.nodeType == 1 && node.hasAttribute("id")));

			if (!useIds || !foundId)
			{
				if (node.nodeType == 1) // Node.ELEMENT_NODE
				{
					if (useIds && node.hasAttribute("id"))
					{
						path += "//*[@id = \"" + node.getAttribute("id") + "\"]";
					}
					else
					{
						path += "/" + node.nodeName;

						var index = 1;
						if (node.nodeName.toLowerCase() != "html")
						{
							var n = node.previousSibling;
							while (n != null)
							{
								// TL: check the previous sibling's node type as well as the node
								// name for a match.  I saw one page where the previousSibling was
								// a Document node whose nodename was HTML, even though this
								// didn't exist as an <html> node in the page.
								if ((n.nodeName == node.nodeName) && (n.nodeType == node.nodeType))
									index++;

								n = n.previousSibling;
							}
						}

						path += "[" + index + "]";
					}
				}
				else if (node.nodeType == 2) // Node.ATTRIBUTE_NODE
				{
					path += "/@" + node.nodeName;
				}
				else if (node.nodeType == 3) // Node.TEXT_NODE
				{
					path += "/text()";

					var index = 1;
					var n = node.previousSibling;
					while (n != null)
					{
						if (n.nodeType == node.nodeType)
							index++;

						n = n.previousSibling;
					}

					path += "[" + index + "]";
				}	
			}
		}

		return path;
	},

	buildXPathForNodeInContext : function(node, contextNode)
	{
		var parent = node.parentNode;
		var path = "";

		if (node != contextNode)
		{
			if (parent == null)
			{	
				// we'll assume this is a document node
				path = this.buildXPathForNodeInContext(node.defaultView.frameElement, contextNode);
				path += "/document()";
			}
			else if (parent == node)
			{
			return "";
			}
			else
			{
				path = this.buildXPathForNodeInContext(parent, contextNode);

				if (node.nodeType == 1) // Node.ELEMENT_NODE
				{
					path += "/" + node.nodeName;
				}
				else if (node.nodeType == 2) // Node.ATTRIBUTE_NODE
				{
					path += "/@" + node.nodeName;
				}
				else if (node.nodeType == 3) // Node.TEXT_NODE
				{
					path += "/text()";
				}

				var index = 1;
				var n = node.previousSibling;
				while (n != null)
				{
					if (n.nodeName == node.nodeName)
						index++;

					n = n.previousSibling;
				}

				path += "[" + index + "]";
			}
		}

		return path;
	},

	evaluateXPath : function(xpath, doc, contextNode)
	{
		var xpathExprs = xpath.split("/document()");

		var contextDoc = doc;
		var node = contextDoc.evaluate(xpathExprs[0], contextDoc, null, 9, null).singleNodeValue;

		for(var i = 1; i < xpathExprs.length && node != null; i++)
		{
			if (node.contentDocument == null)
				return null;

			contextDoc = node.contentDocument;
			node = contextDoc.evaluate(xpathExprs[i], contextDoc, null, 9, null).singleNodeValue;
		}

		return node;
	},
	
	
	//////////////////////////////////////////////////
	// Clipping Methods
	//////////////////////////////////////////////////
	
	//		onPerformContentSelection
	onPerformContentSelection : function(callback)
	{
		var extractionObj = this;
	
		this.interactiveSelectMode = true;
		this.callbackMethod = callback;

		this.mouseMoveHandler = function() {extractionObj.onMouseMove.apply(extractionObj, arguments)};
		this._extractionBrowser.contentDocument.addEventListener("mousemove", this.mouseMoveHandler, false);

		this.keyPressHandler = function() {extractionObj.onKeyPress.apply(extractionObj, arguments)};
		this._window.addEventListener("keypress", this.keyPressHandler, false);
	},

	removeSelectionListeners : function()
	{
		this._window.removeEventListener("keypress", this.keyPressHandler, false);
		this._extractionBrowser.contentDocument.removeEventListener("mousemove", this.mouseMoveHandler, false);
	},

	onKeyPress : function(e)
	{
		if (e.keyCode == 27) {	// cancel the content selection
			this.interactiveSelectMode = false;	
			this.removeSelectionListeners();
			this.clearHighlight();	// clear the highlight		
			if (this.focusElem != null) this.focusElem = null;
			
			// call the callback with parameters indicating the selection was cancelled
			this.callbackMethod(null, null);
		}
	},
	
	onMouseMove : function(e)
	// It's very likely that the target of this mouse move event is our own interactiveHighlightNode
	// So remove the interactiveHighlightNode, find the element under the mouse, and create a new interactiveHighlightNode to highlight it
	{
		var extractionObj = this;
		var mouseX = e.clientX
		var mouseY = e.clientY
		
		this.clearHighlight()

		var target = this._extractionBrowser.contentDocument.elementFromPoint(mouseX, mouseY)
		if (!target || target.tagName == "HTML") return;
		this.addHighlight(target);	// sets this.interactiveHighlightNode
		this.focusElem = target;
		
		this.highlightNodeClickHandler = function() {extractionObj.onHighlightNodeClick.apply(extractionObj, arguments)};
		this.interactiveHighlightNode.addEventListener("click", this.highlightNodeClickHandler, false);
	},
  
	onHighlightNodeClick : function(e)
	// The user clicked on the interactiveHighlightNode, meaning that they want to select the node beneath it
	{
		if (this.interactiveSelectMode){
			// attempt to prevent this event from being processed by the rest of the page
			e.preventDefault();
			e.stopPropagation();

			this.clearHighlight();
			
			// Set focusElem again, in case the mouse click was programmatic (i.e., there's no mousemove first)
			var focusElem = this._extractionBrowser.contentDocument.elementFromPoint(e.clientX, e.clientY)
			if (this.focusElem != focusElem){
				coscripter.debug("coscripter-data-extraction-mode.js: onHighlightNodeClick: focusElem not set")
				this.focusElem = focusElem
			}

			this.interactiveSelectMode = false;
			this.removeSelectionListeners();
		
			if (this.focusElem != null) {	// call the callback
				this.callbackMethod(this.focusElem, this.focusElem.ownerDocument);
				this.focusElem = null;
			}			
		}
	},
    

	//////////////////////////////////////////////////
	// Element Highlighting
	//////////////////////////////////////////////////

	addHighlight : function(elem, color)
	{
		if (color == undefined)
			color = "#F9C463";	// wasF9C463
	
		if (elem.style.display == "none") return;
	
		/* the previous code styled the actual content element. This approach was not effective at stopping clicks from being acted on by the web page.
		elem.style.setProperty("-moz-outline-style", "solid", "important");
		elem.style.setProperty("-moz-outline-width", "3px", "important");
		elem.style.setProperty("-moz-outline-color", "red", "important");	// was E87E1C
		elem.setAttribute(this.STORED_MOUSEOVER_SELECTION_PREVIOUS_COLOR_ATTRIB, elem.style.getPropertyValue("background-color"));
		elem.style.setProperty("background-color", color, "important");
		*/
		
		this.clearHighlight()	// Clear any previous highlightNode
		var highlightNode = this.utils.highlightNode(elem, color)
		this.interactiveHighlightNode = highlightNode
	},

	clearHighlight : function(){
		// Removes the interactiveHighlightNode
		var highlightNode = this.interactiveHighlightNode
		if (highlightNode) {
			highlightNode.parentNode.removeChild(highlightNode)
			this.interactiveHighlightNode = null
		}
		/* the previous code reset the properties of the styled content element
		{
			if (elem != null &&	elem.style.display != "none" &&
				elem.hasAttribute(this.STORED_MOUSEOVER_SELECTION_PREVIOUS_COLOR_ATTRIB))
			{
				elem.style.removeProperty("-moz-outline-style");
				elem.style.removeProperty("-moz-outline-width");
				elem.style.removeProperty("-moz-outline-color");
				
				elem.style.setProperty("background-color",
									   elem.getAttribute(this.STORED_MOUSEOVER_SELECTION_PREVIOUS_COLOR_ATTRIB),
									   "important");
									  
									   
				elem.removeAttribute(this.STORED_MOUSEOVER_SELECTION_PREVIOUS_COLOR_ATTRIB);
			}
			*/
	},  

	addPermanentHighlight : function(elem, color)
	{
		if (color == undefined) color = "#F9C463";
	
		if (elem.style.display == "none") return;
	
		elem.style.setProperty("-moz-outline-style", "solid", "important");
		elem.style.setProperty("-moz-outline-width", "3px", "important");
		elem.style.setProperty("-moz-outline-color", "red", "important");
	
		if (!elem.hasAttribute(this.STORED_BACKGROUND_COLOR_ATTRIB))
		{
			elem.setAttribute(this.STORED_BACKGROUND_COLOR_ATTRIB, elem.style.getPropertyValue("background-color"));
		}
		
		elem.style.setProperty("background-color", color, "important");
	
	},

	clearPermanentHighlight : function(elem)
	{
		if (elem != null &&	elem.style.display != "none" &&
			elem.hasAttribute(this.STORED_BACKGROUND_COLOR_ATTRIB))
		{
			elem.style.removeProperty("-moz-outline-style");
			elem.style.removeProperty("-moz-outline-width");
			elem.style.removeProperty("-moz-outline-color");
		
			elem.style.setProperty("background-color",
								   elem.getAttribute(this.STORED_BACKGROUND_COLOR_ATTRIB),
								   "important");
								   
			elem.removeAttribute(this.STORED_BACKGROUND_COLOR_ATTRIB);
		
		}
	},  
}

// construct the data extraction object and save it on the global coscripter object
coscripter.DataExtraction = new CoScripterDataExtraction(window);
