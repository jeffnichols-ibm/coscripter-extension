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
Contributor(s): Clemens Drews <cdrews@almaden.ibm.com> 

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
Components.utils.import("resource://coscripter-platform/component-registry.js")
var EXPORTED_SYMBOLS = ["executionEnvironment"]
const nsISupports = Components.interfaces.nsISupports	// XPCOM registration constant
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false,
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage("coscripter-exec-env.js: " + msg )
	if(Preferences.DO_DUMP_DEBUGGING) dump("coscripter-exec-env.js: " + msg + "\n")
}
//debug('parsing coscripter-exec-env.js')

///////////////////////////////////////
//	EXECUTION ENVIRONMENT
//
//	callThenDoThis
//	Goto
//	Select
//	Click
//	Copy
//	Paste
//	Extract
//
//	findTarget
//	preview
//		PREVIEW
//	clearPreview
//
///////////////////////////////////////


function getExecutionEnvironment(){
	return executionEnvironment 
}

function ExecutionEnvironment(){
    this.components = registry 
	this.db = null
	this.scratchSpace = null
	
	this.mainChromeWindow = null	// The main chrome window containing the CoScripter sidebar where this script is executing
	this.mainBrowserWindow = null	// I don't get this. Evidently, in FF4, the change that puts the address bar inside the tabbrowser has changed the definition of mainChromeWindow.
									// For instance, mainChromeWindow != u.getChromeWindowForWindow(mainChromeWindow.contentWindow)
									// the former is a browser and the latter is browser.xul ??
									// For instance, mainChromeWindow.coscripter does not exist:  it's in mainBrowserWindow.coscripter  (AC)
    return this
}

ExecutionEnvironment.prototype ={
	// coscripter-sidebar calls 'initialize' in createExecutionEngineWithCallBacks
	initialize: function(mainChromeWindow, db, scratchSpace){
		this.setMainChromeWindow(mainChromeWindow)
		this.db = db
		this.scratchSpace = scratchSpace
	},
	
	setMainChromeWindow: function(theWindow){
		this.mainChromeWindow = theWindow
		if (theWindow.contentWindow) this.mainBrowserWindow = this.components.utils().getChromeWindowForWindow(theWindow.contentWindow)
	},
	
	getMainChromeWindow: function(){
		return this.mainChromeWindow
	},
	
	getMainBrowserWindow: function(){
		return this.mainBrowserWindow
	},
	
	//	callThenDoThis
	// Use this instead of direct calls to thenDoThis in execution-engine, exec-env, and some commands in command.js (like the 'comment' command)
	// The direct calls were not using window.setTimeout to give up control. This was causing nested calls to executeStep.
	callThenDoThis: function(thenDoThis){
		var u = this.components.utils()
		var mainBrowserWindow = this.getMainBrowserWindow()
		u.betterThenDoThis(mainBrowserWindow, thenDoThis)
	},
	
	goDoCommand: function(commandName){	// commandName is a string, such as "cmd_paste"
		try {
			var currentChromeWindow = this.components.utils().getCurrentChromeWindow()
			var controller = currentChromeWindow.top.document.commandDispatcher.getControllerForCommand(commandName)
			if ( controller && controller.isCommandEnabled(commandName)) controller.doCommand(commandName)
		} catch (e) {
			dump("goDoCommand: " + e.toSource() + "/" + e.toString() + '\n')
			debug("goDoCommand: An error occurred executing the " + commandName + " command\n" + e.toSource() + "/" + e.toString() + '\n')
		}
	},

	//	Goto	
	Goto : function (url, coScripterChromeWindow, thenDoThis){
		var u = this.components.utils()
		var labeler = this.components.labeler()
		//var currentChromeWindow = this.components.utils().getCurrentChromeWindow()
		var mainChromeWindow = this.mainChromeWindow
		var currentContentBrowser = coScripterChromeWindow ? u.getCurrentContentBrowser(coScripterChromeWindow) : u.getCurrentContentBrowser(mainChromeWindow)
		this.components.utils().goToUrl(currentContentBrowser, url, thenDoThis, false) 
	},
	
	GoToWindow : function (targetWindow, thenDoThis, options){
		var u = this.components.utils()
		var currentChromeWindow = u.getCurrentChromeWindow()
		var currentContentBrowser = u.getCurrentContentBrowser(currentChromeWindow)
		
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator)
		var chromeEnumerator = wm.getEnumerator("navigator:browser")
		//var chromeWindowList = u.enumeratorToList(chromeEnumerator)
		var foundWindow = null
		
		while (chromeEnumerator.hasMoreElements()) {
			var chromeWindow = chromeEnumerator.getNext()
			var tabBrowser = chromeWindow.gBrowser
			var tabList = tabBrowser.tabContainer.childNodes
			for (var i=0; i<tabList.length; i++) {
				var tab = tabList[i]
				var tabContentWindow = tab.linkedBrowser.contentWindow
				if (tabContentWindow == targetWindow){
					tabBrowser.selectedTab = tab
					tabBrowser.ownerDocument.defaultView.focus()
				}
			}
		}

		u.betterThenDoThis(currentChromeWindow, thenDoThis)
		
		/*
		var targetChromeWindow = u.getChromeWindowForWindow(targetWindow)
		targetChromeWindow.focus()
		targetChromeWindow.gBrowser.selectedTab = targetWindow
		//targetWindow = tab.linkedBrowser.contentWindow
		*/
	},
	
	Enter : function (target,text,thenDoThis,options){
		this.components.utils().enter(text, target, thenDoThis, options) 
	},
	
	/*
	Append : function (target,text,thenDoThis){
		var targetWindow = this.components.utils().getChromeWindowForNode(target)
		this.components.utils().highlightThenDo(target, function() {
			target.innerHTML = target.innerHTML + text
			this.components.utils().betterThenDoThis(targetWindow, thenDoThis)
		})
	},
	*/
	
	//	Select
	Select : function (option, thenDoThis, specialKey, turnonP, options){
		if (option.getAttribute("oncommand") || option.doCommand) {
			option.doCommand()	// menu command
			if (thenDoThis) this.callThenDoThis(thenDoThis)
		}
		else this.components.utils().select(option, thenDoThis, specialKey, (turnonP==null)?true : turnonP, options) 
	},
	
	ExpandOrCollapse : function (option, turnonP, thenDoThis){
		this.components.utils().expandOrCollapse(option, turnonP, thenDoThis)
	},
	
	//	Click
	Click : function (target,thenDoThis,ctrlP,shiftP,options){
		this.components.utils().click(target, thenDoThis, ctrlP, shiftP, options) 
	},
	
	//	Mouseover
	Mouseover : function (target,thenDoThis,ctrlP,shiftP,options){
		this.components.utils().mouseover(target, thenDoThis, ctrlP, shiftP, options) 
	},
	
	OpenNewTab : function (thenDoThis) {
		this.components.utils().openNewTab(window, thenDoThis)
	},
	
	Close : function (target, thenDoThis) {
		if (target.className == 'tabbrowser-tab') {
			this.components.utils().closeTab(window, target, thenDoThis)
		}
	},
	
	SwitchTo: function (target, thenDoThis) {
		if (target.className == 'tabbrowser-tab') {
			this.components.utils().selectTab(window, target, thenDoThis)
		}
	},
	
	//	Copy
	Copy : function (target, thenDoThis, options) {	//trunk version has no 'value' parameter
		if (target.tableElement) { // scratch space
			var scratchSpaceUI = target.tableElement.scratchSpaceUI
			var scratchSpaceEditor = scratchSpaceUI.getEditor()
			//var rowCount = scratchSpaceEditor.getDataRowCount(0)	//to verify that I have the correct Editor pointer
			var data = scratchSpaceEditor.getData(0, parseInt(target.rowIndex) - 1, parseInt(target.columnIndex) - 1)
			this.sendToClipboard(data)
		}
		else if (target.tagName == "INPUT") this.sendToClipboard(target.value)
		else if (target.textContent) this.sendToClipboard(target.textContent)	
		// trunk version Assumes target is a textbox
		if (thenDoThis) this.callThenDoThis(thenDoThis)
	},
	
	//	Paste
	Paste : function (target, thenDoThis, options) {
		var contents = this.getClipboardContents()
		if (contents == null) return;
		contents = this.components.utils().trimAndStrip(contents)
		var u = this.components.utils()
		if (target.tableElement && target.tableElement.scratchSpace){	// vegemite spreadsheet
			var scratchSpaceUI = target.tableElement.scratchSpaceUI
			var scratchSpaceEditor = scratchSpaceUI.getEditor()
			//var rowCount = scratchSpaceEditor.getDataRowCount(0)	//to verify that I have the correct Editor pointer
			scratchSpaceEditor.setData(0, parseInt(target.rowIndex)-1, parseInt(target.columnIndex)-1, contents)
			//u.betterThenDoThis(window, thenDoThis)
			if (thenDoThis) this.callThenDoThis(thenDoThis)
		}
		else u.enter(contents, target, thenDoThis, options)
	},
	
	//	Open scratchtable
	Open : function (tableName, thenDoThis, options){
		var u = this.components.utils()
		var coScripterWindow = u.getCurrentCoScripterWindow()
		var scratchSpaceList = coScripterWindow.document.getElementById("scratchspaces")
		var selectedItem = null
		for (var i = 0; i < scratchSpaceList.children.length; i++) {
			var spaceItem = scratchSpaceList.children[i]
			var spaceTitle = spaceItem.getAttribute("label") // this is the "title" of the scratchspace
			if (tableName == spaceTitle) {
				selectedItem = spaceItem
				break;
			}
		}
		if (selectedItem) {
			if (true){
				coScripterWindow.loadSpaceLocally(spaceItem.getAttribute("value"), coScripterWindow.ScratchSpaceUtils)
			}
			else coScripterWindow.ScratchSpaceUtils.loadSpaceFromServer(spaceItem.value, function(scratchSpace) {
				if (scratchSpace == null) {
					alert("Cannot load scratch space " + spaceItem.label + " from the server.")
				}
				else {
					coScripterWindow.coscripter.scratchSpaceUI.open(scratchSpace)
				}
			})
		}
		if (thenDoThis) this.callThenDoThis(thenDoThis)
	},

	getScratchSpaceEditor : function() {
		var u = this.components.utils()

		var scratchSpaceUI = u.getCurrentScratchSpaceUI()
		var scratchSpaceEditor = scratchSpaceUI.getEditor()
		return scratchSpaceEditor
	},
	
	defaultToSelectingAllScratchtableRows : function() {
		// If no rows have been explicitly selected by the user, 
		//the default is to iterate over all of the rows in the scratchtable
		var scratchSpaceEditor = this.getScratchSpaceEditor()		
		var scratchtableSelectedRows = scratchSpaceEditor.getSelectedRows(0)
		if (scratchtableSelectedRows.length == 0){
			scratchSpaceEditor.toggleSelectAll(0)
		}
	},
	
	determineNextScratchtableRowNumber : function(rowNumber) {
		// rowNumber is 1-based (the way users see it)
		// entries in scratchtableSelectedRows are 0-based (they are indices into an array)
		// get the next checkmarked row.
		// Returns false if there is none
		var u = this.components.utils()
		var scratchSpaceEditor = this.getScratchSpaceEditor()		
		var scratchtableSelectedRows = scratchSpaceEditor.getSelectedRows(0)
		if (rowNumber == 0) {	// get the first selected row
			return (scratchtableSelectedRows.length == 0) ? false : scratchtableSelectedRows[0]+1
		}
		var indexInTable = u.inArrayAtIndex(rowNumber-1, scratchtableSelectedRows)	
		if (indexInTable == -1) return false	// inArrayAtIndex returns -1 if no match
		indexInTable += 1
		if(indexInTable>=scratchtableSelectedRows.length) {
			return false	// repeat has finished looping through all rows
		}
		else var newScratchtableRowNumber = scratchtableSelectedRows[indexInTable]+1
		return newScratchtableRowNumber
	},
	
	ChangeTableText: function(tableUI, row, column, text, thenDoThis) {
		// table is a VegemiteTableUI
		tableUI.setData(row, column, text)
		if (thenDoThis) this.callThenDoThis(thenDoThis)
	},
	
	ChangeActivityTableText: function(cell, text, thenDoThis) {
		if(cell.firstChild && cell.firstChild.nodeName == "INPUT") {
			this.components.utils().highlightThenDo(cell, function() {
				cell.firstChild.value = text
				if (thenDoThis) this.callThenDoThis(thenDoThis)
			})			
		}
		this.components.utils().highlightThenDo(cell, function() {
			cell.childNodes[0].nodeValue = text
			if (thenDoThis) this.callThenDoThis(thenDoThis)
		})
	},
	
	BeginExtraction: function(thenDoThis) {
		var w = window
		var c = w.top.coscripter
		var d = c.DataExtraction
		// start extracting
		d.startExtractionMode(w.top.gBrowser.selectedBrowser, c.scratchSpaceUI)
		d.onPerformContentSelection(function() {d.onElementSelected.apply(d, arguments)})
		if (thenDoThis) this.callThenDoThis(thenDoThis)
	},
	
	EndExtraction: function(thenDoThis) {
		var w = window
		var c = w.top.coscripter
		var d = c.DataExtraction
		// stop extracting
		d.extract()
		if (thenDoThis) this.callThenDoThis(thenDoThis)
	},
	
	//	Extract
	Extract : function (tableName, overwriteP, thenDoThis){
		if (tableName) this.Open(tableName)	
		// if no tableName is specified, use the currently open table
			
		var u = this.components.utils()
		var labeler = this.components.labeler()
		var coScripterWindow = u.getCurrentCoScripterWindow()
		var ScratchSpaceUtils = coScripterWindow.ScratchSpaceUtils
		var scratchSpaceUI = u.getCurrentScratchSpaceUI()
		var scratchSpaceEditor = scratchSpaceUI.getEditor()		
		//var tableIndex = scratchSpaceEditor.getCurrentTableIndex() // The script * go to "http://movies.netflix.com/Queue?qtype=DD" * extract the "my DVD queue" scratchtable returns 'undefined' for this step
		var tableIndex = 0
		var scratchSpace = scratchSpaceUI.scratchSpace
		var table = scratchSpace.getTables()[tableIndex]
		var extractionElementsByUrl = table.extractionElementsByUrl	// ** Before overwriting, get the extractionElementsByUrl from the saved table data
		
		// if overwriteP, replace the current table in the current scratchspace with a brand new initial table and empty scratchSpaceUI
		if (overwriteP) {
			var jTable = JSON.stringify(ScratchSpaceUtils.INITIAL_TABLE)	// use JSON to make a copy of INITIAL_TABLE
			var initialTable = JSON.parse(jTable)
			var newTable = scratchSpace.newTable(table.id, table.title, initialTable.data, initialTable.metaData, extractionElementsByUrl, table.scripts, table.notes, table.log);
			var oldTable = scratchSpace.tables.splice(tableIndex,1,newTable)[0]
			// load the tree into the editor
			scratchSpaceEditor.refreshTable(tableIndex)
		}
		
		var extractionElements = []
		// Find the most recent set of extractionElements for the current page's url and use them
		var currentURI = this.getNSURIFromString(this.getMainChromeWindow().contentDocument.location.toString());
		for (var i=0; i<extractionElementsByUrl.length; i++) {
			if (extractionElementsByUrl[i].url.spec == currentURI.spec) {
				extractionElements = extractionElementsByUrl[i].extractionElements
			}
		}
		if (extractionElements.length == 0) {
			throw "No extraction information saved for page: " + currentURI.spec
		}
		
		var DataExtractor = this.mainBrowserWindow.coscripter.DataExtraction
		DataExtractor.startExtractionMode(this.mainBrowserWindow.gBrowser.selectedBrowser, this.mainBrowserWindow.coscripter.scratchSpaceUI)
		DataExtractor._extractionElements = []
		for (var i=0; i<extractionElements.length; i++) {
			var extractionElement = extractionElements[i]
			var contentDocument = u.getContentWindow(this.getMainBrowserWindow()).document
			var element = labeler.findXPathElement(contentDocument, extractionElement.xpath)
			DataExtractor._extractionElements.push(DataExtractor.createElementObject(element));
		}
		DataExtractor.guessAtRows();
		DataExtractor.extract(overwriteP)
		// Restore the pre-extraction table; If the user does a Save, the table data will be overwritten by the newly extracted data in the editor.
		//scratchSpace.tables.splice(tableIndex,1,oldTable)
		// Can't get this to work.  There is a delayed scratch-space-browser-overlay call to _setDockedPaneVisible which calls the editor's refresh method, which updates the editor with the (old) contents of the table data. So instead I need to immediately save after the extraction.
		scratchSpaceUI.saveButtonPressed()
		
		if (thenDoThis) this.callThenDoThis(thenDoThis)
	},

	getNSURIFromString : function(urlString, baseUrl)
	{
		var url = Components.classes["@mozilla.org/network/standard-url;1"]
		                        .createInstance(Components.interfaces.nsIStandardURL);
		url.init(url.URLTYPE_STANDARD, 0, urlString, null, baseUrl);
		
		return url.QueryInterface(Components.interfaces.nsIURI);
	},
	
	Find : function(searchTerm, thenDoThis, options){
		var utils = this.components.utils()
		var currentChromeWindow = utils.getCurrentChromeWindow()
		var win = currentChromeWindow

		win.gFindBar.startFind.apply(win.gFindBar, [win.gFindBar.FIND_NORMAL])
		win.gFindBar._findField.value = searchTerm
		win.gFindBar._find.apply(win.gFindBar, [searchTerm])
		if (thenDoThis != null) if (thenDoThis) this.callThenDoThis(thenDoThis)
	},
	
	FindAgain : function(previousP, thenDoThis, options)
	{
		var utils = this.components.utils()
		var currentChromeWindow = utils.getCurrentChromeWindow()
		var win = currentChromeWindow

		win.gFindBar._findAgain.apply(win.gFindBar, [previousP])
		if (thenDoThis != null) if (thenDoThis) this.callThenDoThis(thenDoThis)
	},

	Goforward : function(thenDoThis){
	},
	
	Goback : function(thenDoThis){
	},
	
	Reload : function(thenDoThis){
	},
		
	sendToClipboard : function(text) {
		this.components.utils().sendToClipboard(text)
	},

	getClipboardContents : function() {
		return this.components.utils().getClipboardContentsAsText()
	},
	
	// Returns the (index)th tab, where 0 is the first tab.
	getTab : function(window, index) {
		return this.components.utils().getTab(window, index)
	},
	
	getSelection : function() {
		var utils = this.components.utils()
		var currentChromeWindow = utils.getCurrentChromeWindow()
		var currentContentWindow = utils.getCurrentContentWindow(currentChromeWindow)
		var selection = currentContentWindow.getSelection()
		return selection.toString()
	},
	

	///////////////////////////
	//	findTarget
	// /////////////////////////
	findTarget : function(command){
		var u = this.components.utils()
		var labeler = this.components.labeler()
		
		// If the command specifies a window, find that window. Othewise, use the window containing the script that is executing
		var targetWindow = this.findWindow(command.windowSpec)
		
		// Check if the command is a menu command
		if (command.targetSpec && command.targetSpec.targetType == "menu") {
			targetWindow = this.getMainChromeWindow()
		}
		
		var target = null
		try {
			target = labeler.findTargetElement(targetWindow, command)
		} catch (e) {
			if (e=="target value not found")
				throw e
		}
		return target
	},
	
	findWindow : function(windowSpec){
		var u = this.components.utils()
		var labeler = this.components.labeler()
		
		var mainChromeWindow = this.getMainChromeWindow()
		var mainContentWindow = u.getCurrentContentWindow(mainChromeWindow)
		var currentChromeWindow = u.getCurrentChromeWindow()
		var currentContentWindow = u.getCurrentContentWindow(currentChromeWindow)

		if(!windowSpec) return mainContentWindow

		var targetWindow = null
		// tabOrWindow, indexOrId, value
		// findWindow("tab", "index", Number(windowSpec.number.getValue())
		// gBrowser.tabContainer.advanceSelectedTab(1, true)
		var windowOrTab = windowSpec.windowOrTab
		var poundsignP = windowSpec.poundsignP
		var number = windowSpec.number ? Number(windowSpec.number.getValue()) : null
		
		if (windowOrTab == "tab" && poundsignP == true && number != null){
			var tab = currentChromeWindow.gBrowser.tabContainer.childNodes[number-1]
			if (tab) targetWindow = tab.linkedBrowser.contentWindow
		}
		
		if (windowSpec.windowName != ""){
			var windowNameObject = 	windowSpec.windowName	//	a variableValue object
			targetWindow = labeler.findTargetWindowByName(windowNameObject)
		}
		
		return targetWindow
	},

	///////////////////////////
	//	preview
	// /////////////////////////
	preview : function(command, options){
		var utils = this.components.utils()
		var node = null
		try {
			if (command.hasTargetSpec()) {
				node = command.findTarget(this)
			}
		} catch (e) {
            debug('exec-env.preview error: ' + e)
			dump("exec-env.preview error: " + e.toSource() + "/" + e.toString() + '\n')
		}	
		
		 if (node != null && node.tableElement && node.tableElement.scratchSpace) return {};

		var doc
		if (node != null) {
			doc = node.ownerDocument
		} else {
			// No target node, so we'll create one for bubblehelp
			var currentChromeWindow = this.components.utils().getCurrentChromeWindow()
			var currentContentWindow = this.components.utils().getCurrentContentWindow(currentChromeWindow)
			doc = currentContentWindow.document
		}

		var previewConf = null
		
		var stepNum = command.getLineNumber()
		var totalSteps = command.getTotalLines()
		var slopID = 'slop' + stepNum

		var coscripterPrefs = utils.getCoScripterPrefs()
		var drawBubbles = coscripterPrefs.prefHasUserValue('showBubbleHelp') && coscripterPrefs.getBoolPref('showBubbleHelp')

		if (node != null && !(utils.xulNodeP(node))) {
			var highlightOptions = {}

			// Vegemite: if node is a XUL tree, then detect the right cell
			if (command.target && command.target.tableElement) {
				// +1 to account for column headers
				highlightOptions.rowIndex = command.target.rowIndex + 1
				// +2 to account for the checkbox column and the row headers
				highlightOptions.columnIndex = command.target.columnIndex + 2
				return null	// preview highlighting not yet implemented for scratch spaces
			}
			
			// Highlight the SELECT node if the target is an OPTION
			if (node.nodeName == "OPTION") {
				node = node.parentNode
			}

			// make sure we can see the node we are previewing
			utils.ensureVisible(node)
			
			// Highlight the node, and if the command has some special desires about how to highlight itself, 
			// give it a go (e.g. see EnterCommand's preview method in command.js)
			var color
			if (null != options && null != options['color']) {
				color = options['color']
			} else {
				color = command.canExecute() ? "green" : "red"
			}

			// Draw the big preview if the preference is enabled
			if (drawBubbles) {
				// Draw a spotlight with the big arrow box.
				previewConf = this.components.coscripterPreview().
					createAnchoredBubble(node, command.getSlop(), stepNum,
						totalSteps, slopID)
			} else {
				// Otherwise, draw only the traditional preview
				previewConf = {
					target : node 
				}
			}
			
			var div = utils.highlightNode(node, color, highlightOptions)	//		PREVIEW --  Highlight Node
			previewConf.div = div
			previewConf.overHandler = function(e) {
				utils.setVisible(div, false)
				// if this is a decorated textBox div, remove the text
				// Preview the first time the user mouses over
				if (div.childNodes[1]) div.childNodes[1].value = ""
			}
			previewConf.outHandler = function(e) {
				utils.setVisible(div, true)
			}

			/* we want the user to be able to click the thing that is highlighted if they want to,
			// but this is impossible when there is a div blocking the mouse commands 
			// (and I don't know a good way to forward them to the node beneath them),
			// so instead, we handle mouse events to hide the div whenever the user hovers their mouse over it*/         
			div.addEventListener("mouseover", previewConf.overHandler, false)
			node.addEventListener("mouseout", previewConf.outHandler, false)
			node.addEventListener("focus", previewConf.overHandler, false)
			node.addEventListener("blur", previewConf.outHandler, false)

			if(null!= options && null != options['overlaytext']){
				var decorateOptions = {}
				for (var prop in highlightOptions) {
					decorateOptions[prop] = highlightOptions[prop]
				}
				decorateOptions.canExecute = true
				this.decorateTextBox(div,options['overlaytext'],node,{canExecute : true})
			}
		} else {
			var slop = command.getSlop()

			if (drawBubbles) {
				try {
					previewConf = this.components.coscripterPreview().createUnanchoredBubble(doc, slop, stepNum, totalSteps, slopID)
				} catch (e) {
					// TL: sometimes createUnanchoredBubble can be called before the document has finished loading, which
					// causes bubble creation to fail; I haven't figured out why, but I'm trapping the exception here anyway
					previewConf = {}
				}
			} else {
				previewConf = {}
			}
		}

		if(!options.fromrefresh && !options.recording) {
			var focusNode = doc.getElementById(slopID)
			if(focusNode) {
				focusNode.focus()
				focusNode.scrollIntoView(false)
			}
		}

		return previewConf
	},	//	end of preview

	//	clearPreview
	clearPreview : function(previewConfig){
        try{
            if(null != previewConfig){
				if(previewConfig.target != null &&
					("targetmargin" in previewConfig)) {
					previewConfig.target.style.margin = previewConfig.targetmargin
				}
				if (previewConfig.divs) {
					for(divname in previewConfig.divs) {
						var div = previewConfig.divs[divname]
						if(divname == "node") {
							div.parentNode.replaceChild(div.firstChild, div)
						} else {
							div.parentNode.removeChild(div)
						}
					}
                }

				if (previewConfig.target != null) {
					previewConfig.target.removeEventListener("mouseout", previewConfig.outHandler, false)      
				}
				if (previewConfig.div) {
					previewConfig.div.parentNode.removeChild(previewConfig.div)
				}
            }
        }catch(e){
            debug('this.clearPreview : ' + e)
			dump("clearPreview: " + e.toSource() + "/" + e.toString() + '\n')
        }
	},
	
	decorateTextBox : function(div, text, target, pc) {
		var doc = div.ownerDocument
		var textarea1 = doc.createElement("input")
		var textarea2 = doc.createElement("input")
		
		textarea1.value = ""
		textarea2.value = text

		if (!pc.canExecute) {
			textarea2.style.color = "red"
		}
		else {
			textarea2.style.color = "green"
		}
		
		div.style.opacity = 1
		var pos = this.components.utils().getNodePosition(target, pc)
		div.style.left = "" + (pos.x - 3) + "px"
		div.style.top = "" + (pos.y - 3) + "px"
		div.style.width = "" + (pos.w + 6) + "px"	
		div.style.height = "" + (pos.h + 6) + "px"
		
		textarea1.style.position = "absolute"
		textarea1.style.top = "3px"
		textarea1.style.left = "3px"
		textarea1.style.width = "" + (pos.w) + "px"
		textarea1.style.height = "" + (pos.h) + "px"
		
		textarea2.style.position = "absolute"
		textarea2.style.top = "3px"
		textarea2.style.left = "3px"
		textarea2.style.width = "" + (pos.w) + "px"
		textarea2.style.height = "" + (pos.h) + "px"
		
		div.appendChild(textarea1)
		div.appendChild(textarea2)
		
		textarea2.style.opacity = 0.5
	},
	
	getCurrentBrowser :  function (){
		var utils = this.components.utils()    
		var currentBrowser = utils.getCurrentContentBrowser(utils.getCurrentChromeWindow())
		return currentBrowser 
	},

	getWindow : function() {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
		                            .getService(Components.interfaces.nsIWindowMediator)
		var browserWindow = wm.getMostRecentWindow("navigator:browser")
		return browserWindow
	}
}

var executionEnvironment = new ExecutionEnvironment()
//debug('done parsing coscripter-exec-env.js')
