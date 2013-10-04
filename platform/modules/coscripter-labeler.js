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
Contributor(s): Greg Little, Allen Cypher (acypher@us.ibm.com), Tessa Lau, Clemens Drews, James Lin, Jeffrey Nichols, Eser Kandogan, Jeffrey Wong, Gaston Cangiano, Jeffrey Bigham, Jalal Mahmud.

This Program also contains code packages known as chickenfoot 0.9 and developer.mozilla.org sample code that are licensed pursuant to the licenses listed below. 
chickenfoot 0.9 
The program known as chickenfoot 0.9 is licensed under the terms of the MIT license. Those terms are reproduced below for your reference.


The MIT License
Copyright (c) 2004-2007 Massachusetts Institute of Technology
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

Components.utils.import("resource://coscripter-platform/component-registry.js");
var EXPORTED_SYMBOLS = ["labeler"];

// ****************************************************************************************
// 
//	WEBTYPES
//		getXpathForWebType
//	Debugging functions
//
// Methods for finding elements that match some slop
//	findTargetElement and helpers
//		findTargetElementInFrame ***
//			findLinkElement
//			findButtonElement
//			findRegionElement
//		Scoring methods
//	findTargetWindow
//	listTargetMatches
//	findMatchingElements

//		findDisambiguator
//
// Methods for generating slop
//	getTargetAndType

//	getLabel and getLabel helper functions
//		getTableCellLabel
// LABELERS
//		TableCellLabeler
//		SelectionLabeler
//		TextBoxLabeler

//	getText
// ****************************************************************************************

const CC = Components.classes, CI = Components.interfaces, CIS = CI.nsISupports
var consoleService = CC['@mozilla.org/consoleservice;1']
			.getService(CI.nsIConsoleService);

var tagsForRegionElement=["td","tr","div","span","table","header","h1","h2","h3","h4","h5","h6","a","p"]; 

// ****************************************************************************************
// LABELER SUPER CLASS
// 
// This code must be included outside of the main object and before the definition
// of the labeler prototype.
//
// TODO: It should probably be wrapped better inside some namespace
// ****************************************************************************************

Labeler = function(options){
	this.labelers = options.labelers ;	
	this.labelerCondition = options.labelerCondition;
	this.name = options.name ;	
	
	return this;
}

TargetException = function(string, type){
	this.string = string ;
	this.type = type;
	return this ;
}

Labeler.prototype = {
	
	numberHeuristics : function(){
		return this.labelers.length
	},
	getLabel : function(element, version){
		if (version < 0 || version > this.numberHeuristics()) throw "Labeler version out of range"
		var label = this.labelers[version].apply(this, [element])
		if (this.DEBUGLABELER) this.d(this.name +'.getLabel found "' + label + '" for the ' + element.nodeName + ' element\n');
		return this.getUtils().trim(this.getUtils().stripSpaces(label));
	},
	getBestLabelFor : function(element){
		// get the best label by trying the labelers from best to worst 
		// and return the result of first labeler that has a decent one used in recording 
		if (this.DEBUGLABELER) this.d(this.name +' is trying to find a label for a ' + element.nodeName + ' element\n');
		for(var i =0 ; i< this.numberHeuristics();i++){
			var label = this.labelers[i].apply(this, [element]);
			if (label && typeof label == "object") {
				//debug("got an Object in getBestLabelFor")
				return label; // table labels are an array
			}
			label = this.getUtils().trim(this.getUtils().stripSpaces(label));
			if (this.DEBUGLABELER) this.d(this.name +'.getBestLabelFor found "' + label + '" for the ' + element.nodeName + ' element\n');
			if( this.isGoodLabel(label) ){
				if (this.DEBUGLABELER) this.d('good label, returning: ' + label + '\n');
				return label ;
			}
		}
		if (this.DEBUGLABELER) this.d(this.name +' did not find a label for a ' + element.nodeName + ' element\n');
		// TL: changing this to return null if we don't find a label, which
		// is different than ""
		return null;
	},
	isGoodLabel : function(label){
		return label!=null && label != "" ;
	},
	isLabelerFor : function(element){
		return this.labelerCondition.apply(this, [element]);
	}
}

function createWrappedFunction(obj, func)
{
	return function() {return func.apply(obj, arguments);};
}

// constructor for the labeler object
function CoScripterLabeler() {
	this.components = registry ;
	// Ensure that any methods and constants in the CoScripterLabeler
	// are appropriately shared with the Labeler objects
	Labeler.prototype.DEBUGLABELER = this.DEBUGLABELER;
	Labeler.prototype.DEBUGFTE = this.DEBUGFTE;
	Labeler.prototype.WEBTYPES = this.WEBTYPES;
	Labeler.prototype.getUtils = createWrappedFunction(this, this.getUtils);
	Labeler.prototype.d = createWrappedFunction(this, this.d);
	Labeler.prototype.getText = createWrappedFunction(this, this.getText);
	Labeler.prototype.getLabelForElementId = createWrappedFunction(this, this.getLabelForElementId);
	Labeler.prototype.filenameComponent = createWrappedFunction(this, this.filenameComponent);
	Labeler.prototype.getLabelHelperStrict = createWrappedFunction(this, this.getLabelHelperStrict);
	Labeler.prototype.getLabelLeft = createWrappedFunction(this, this.getLabelLeft);
	Labeler.prototype.getLabelLeftSibling = createWrappedFunction(this, this.getLabelLeftSibling);
	Labeler.prototype.getTableCellLabel = createWrappedFunction(this, this.getTableCellLabel);
	Labeler.prototype.getTableLabel = createWrappedFunction(this, this.getTableLabel);
	Labeler.prototype.getLeftSiblingWithText = createWrappedFunction(this, this.getLeftSiblingWithText);
	Labeler.prototype.getFirstSiblingWithText = createWrappedFunction(this, this.getFirstSiblingWithText);

	return this;
}

CoScripterLabeler.prototype = {

	getUtils : function(){
		return this.components.utils() ;
	},
	
	//	WEBTYPES
	WEBTYPES : {
		TEXTBOX : "textbox",
		TEXTAREA: "textarea",
		RADIOBUTTON : "radiobutton",
		CLOSEBUTTON : "closebutton",
		CHECKBOX : "checkbox",
		BUTTON : "button",
		LISTBOX : "listbox",
		LISTITEM : "listitem",
		LINK : "link",
		AREA : "area",
		REGION : "region",		
		ITEM : "item",
		SECTION : "section",
		XUL : "xul",
		TEXT: "text",

		ELEMENT: "element",		
		MENU : "menu",
		COMMAND : "command",
		TAB : "tab",
		DOJOWIDGET : "dojowidget",
		TEXTEDITOR : "texteditor",	// Dojo rich text editor
		SELECTION: "selection",
		MENUITEM : "menuitem", // Dijit menu
		
		TABLECELL: "cell",
		TABLE: "table", // a table in a content page
		SCRATCHTABLE: "scratchtable",
		SCRATCHSPACE: "scratchspace",	// eventually the scratch space will be able to have multiple tabs, each with multiple tables
		XPATH:	"xpath",
		
		NONUIELEMENT : "non-ui-element",
		OTHER : "other"
	},
	
	CHROMETYPES: {
		TAB: "tab",
		WINDOW: "window"
	},
	
	//		getXpathForWebType
	// this provides an xpath to search for all elements of a given webtype in a document
	getXpathForWebType : function(webType){
		switch(webType){
			case this.WEBTYPES.TEXTBOX:
			case this.WEBTYPES.TEXTAREA:
				return ["//TEXTAREA | //INPUT[not(@type) or @type='text' or @type='password' or @type='Text' or @type='Password' or @type='TEXT' or @type='PASSWORD' or @type='file' or @type='File' or @type='FILE']"
				,"//textarea | //input[not(@type) or @type='text' or @type='password' or @type='Text' or @type='Password' or @type='TEXT' or @type='PASSWORD' or @type='file' or @type='File' or @type='FILE']"];
			case this.WEBTYPES.RADIOBUTTON:
				return ["//INPUT[@type='radio' or @type='Radio' or @type='RADIO']", "//input[@type='radio' or @type='Radio' or @type='RADIO']"];
			case this.WEBTYPES.CLOSEBUTTON:
				return ["//SPAN[@statemodifier='CloseButton']", "//span[@statemodifier='CloseButton']"];
			case this.WEBTYPES.CHECKBOX:
				return ["//INPUT[translate(@type,'CHEKBOX','chekbox')='checkbox']|//*[contains(@class,'dijitToggleButton')]", "//input[translate(@type,'CHEKBOX','chekbox')='checkbox']|//*[contains(@class,'dijitToggleButton')]"];
				//return ["//INPUT[@type='checkbox' or @type='Checkbox' or @type='CheckBox' or @type='CHECKBOX']|//*[contains(@class,'dijitToggleButton')]"];
			case this.WEBTYPES.BUTTON:
				return ["//BUTTON", "//button", "//*[@localName='button']", "//INPUT[@type='submit' or @type='Submit' or @type='SUBMIT' or @type='image' or @type='Image' or @type='IMAGE' or @type='reset' or @type='Reset' or @type='RESET' or @type='button' or @type='Button' or @type='BUTTON']", "//input[@type='submit' or @type='Submit' or @type='SUBMIT' or @type='image' or @type='Image' or @type='IMAGE' or @type='reset' or @type='Reset' or @type='RESET' or @type='button' or @type='Button' or @type='BUTTON']", "//A[IMG]", "//a[IMG]", "//*[@onclick]", "//*[@wairole='button']", "//*[@role='button']", "//*[contains(@class,'dojoTabPaneTab')]"];
				//return ["//BUTTON", "//*[@localName='button']", "//INPUT[lower-case(@type)='submit' or @type='image' or @type='reset' or @type='button']", "//A[IMG]", "//*[@onclick]", "//*[@wairole='button']", "//*[@role='button']", "//*[contains(@class,'dojoTabPaneTab')]"];
				//return ["//BUTTON", "//*[@localName='button']", "//INPUT[lower-case(@type)='submit']", "//INPUT[@type='submit' or @type='Submit' or @type='image' or @type='reset' or @type='button']", "//A[IMG]", "//*[@onclick]", "//*[@wairole='button']", "//*[@role='button']", "//*[contains(@class,'dojoTabPaneTab')]"];
				//return ["//BUTTON", "//*[@localName='button']", "//INPUT[lower-case(@type)='submit']", "//INPUT[@type='submit' or @type='Submit' or @type='image' or @type='reset' or @type='button']", "//A[IMG]", "//*[@onclick]", "//*[@wairole='button']", "//*[@role='button']", "//*[contains(@class,'dojoTabPaneTab')]"];
			case this.WEBTYPES.LISTBOX:
				return ["//SELECT", "//select"];
			case this.WEBTYPES.LISTITEM:
				return ["//OPTION", "//option"];
			case this.WEBTYPES.LINK:
				return ["//A", "//a"];
			case this.WEBTYPES.AREA:
				return ["//AREA", "//area"];
			case this.WEBTYPES.REGION:
				return ["//REGION", "//region"];
			case this.WEBTYPES.ITEM:
				return ["//*[@onclick]|//*[@mxevent]"];	// //*[@dojoattachpoint]|
			case this.WEBTYPES.MENUITEM:
				return ['//*[contains(@class,"dijitMenuItem")]'];
			case this.WEBTYPES.SECTION:
				return ['//*[contains(@class,"dijitAccordionTitle")] | //*[contains(@class,"dijitTitlePaneTitle")]'];
			case this.WEBTYPES.XUL:
				return ["//*[contains(@nodeName,'xul:')]|//*[contains(@nodeName,'Xul:')]|//*[contains(@nodeName,'XUL:')]"];
			case this.WEBTYPES.TEXT:
				return ["//INPUT[@type='text' or @type='Text' or @type='TEXT']", "//input[@type='text' or @type='Text' or @type='TEXT']"];
				
			case this.WEBTYPES.ELEMENT:
			case this.WEBTYPES.MENU:	
			case this.WEBTYPES.COMMAND:
			case this.WEBTYPES.TAB:
			case this.WEBTYPES.DOJOWIDGET:
			case this.WEBTYPES.TEXTEDITOR:
			case this.WEBTYPES.SELECTION:
			case this.WEBTYPES.TABLECELL:
			case this.WEBTYPES.TABLE:
			case this.WEBTYPES.SCRATCHTABLE:
			case this.WEBTYPES.SCRATCHSPACE:
			case this.WEBTYPES.XPATH:
				this.debug("getXpathForWebType: Web type " + webType.toString() +  " should never call getXpathForWebType.\n It is handled without searching a content page.")
				return [];
				
			case this.WEBTYPES.NONUIELEMENT:
			case this.WEBTYPES.OTHER:
				return [];
			default:
				this.debug("getXpathForWebType: Unrecognized web type: " + webType ? webType.toString() : "null")
				// getDijitNode may return a targetType that we don't handle explicitly because we don't know about it, (e.g. "typeahead" Connections widget) (AC)
				// The alternative -- allowing this to throw an exception -- would require a rewrite of getDijitNode for cases where 
				return [];
		}
	},
	
	// **************************************************************************************** 
	// 
	//	Debugging functions
	//
	// ****************************************************************************************
	
	
	DEBUG : true,
	DEBUGFTE : false,
	DEBUGLABELER : false,
	
	d : function(msg) {
		if (this.DEBUG) {
			dump(msg);
			this.debug(msg)
		}
	},
	
	debug : function(msg) {
		return;		//comment out to turn on debugging
		consoleService.logStringMessage(msg);
	},
	
	// **************************************************************************************** 
	// 
	// End Debugging functions
	//
	// ****************************************************************************************
	
	// **************************************************************************************** 
	//
	//	findTargetElement and helpers
	//
	// ****************************************************************************************
	/* Given some parsed slop, find elements on the page that match it.
	// TL: This is a replacement for findMatchingElements that tries to be
	// smarter about using the parsed command to identify the element we want,
	// without having to iterate over everything and generate labels for
	// each widget on the page.
	*/
	findTargetElement : function(cmdWindow, command) {
		try {
			if (this.DEBUGFTE) this.d('FTE called with command, label: ' + command.getTargetLabel() + '\n');
			var matches = new Array();
			
			/* An array is used as an awkward way to resolve ordinal disambiguators.
			// The scoreAndAdd method returns a score of 1 and pushes an item onto the matches list
			//whenever a target matches the label but not the ordinal.
			//Then when the length of the matches list equals the ordinal, it returns a score of 2,
			//so matches.pop() is the element with the correct ordinal.
			// This should be improved at some point -- when we properly handle string disambiguators
			//as well as ordinal disambiguators. (AC)
			*/		
			if (command.getTargetType() == this.WEBTYPES.MENU) {
				this.findMenuElement(matches, cmdWindow, command);
				if (matches.length > 0) return matches.pop()
			}
			
			var found = this.findTargetElementHelper(matches, cmdWindow, command);
			if (found) {
				var ret = matches.pop();
				if (this.DEBUGFTE) this.d('FTE: returning: ' + ret + '\n');
				return ret;
			} else {
				if (this.DEBUGFTE) this.d('FTE: nothing found\n');
				return null;
			}
		} catch (e) {
			this.d("Reraising error in findTargetElement: " + e.toSource()
				+ "/" + e.toString() + '\n');
			throw e;
		}
	},
	
	/* TL: this is structured this way because frames can be nested inside of
	// frames, and we need to make sure we iterate through them all, not just
	// the top-level frames.  Thus for each of the top-level frames we need to
	// check whether *it* has sub-frames, and iterate over each of those as
	// well.
	*/
	findTargetElementHelper : function(matches, cmdWindow, command) {
		var u = this.getUtils()
		var found = false;
		// Each element in this array will be an object with target and score properties
		
		for (var i = 0; i < cmdWindow.frames.length; i++) {
			if (this.DEBUGFTE) this.d("-------------------------\n");
			if (this.DEBUGFTE) this.d('FTE in subframe #' + i + ': ' + cmdWindow.frames[i].document.location.href.toString() + '\n');
			if (this.findTargetElementHelper(matches, cmdWindow.frames[i], command)) {
				found = true;
				break;
			}
		}
		if (!found) {
			if (this.DEBUGFTE) this.d("-------------------------\n");
			if (this.DEBUGFTE) this.d('FTE in main frame: ' + cmdWindow.document.location.href.toString() + '\n');
			// ignore the return value from findTargetElementInFrame, and instead see if the "matches" array is any longer
			// this caused a BUG: "* turn on the tenth radiobutton" was matching the last of 6 buttons.  It pushed the 6 elements onto matches and then returned false (AC)
			// I changed findCheckboxOrRadioElement in case other methods depend on findTargetElementHelper ignoring the return value. This code needs to be cleaned up.
			var matchesLength = matches.length
			this.findTargetElementInFrame(matches, cmdWindow, command)
			found = (matches.length > matchesLength)
		}
		return found;
	},
	
	
	//////////////////////////////////////////////////////////
	//		findTargetElementInFrame ***
	//////////////////////////////////////////////////////////
	// Return true iff we found the desired element
	findTargetElementInFrame : function(matches, win, command) {
		var u = this.components.utils()
		var commands = this.components.commands()
		var matchingElements = []
		var matchingElement = null
		var xpath;
		if (this.DEBUGFTE) this.d("Finding target element with command: " + command.getSlop() + "\n");
		
		var commandAction = command.getAction();
		var targetType = command.getTargetType();

		var winTitle = win.document ? win.document.title : null
		if (win.contentDocument) winTitle = win.contentDocument.title
		this.debug("findTargetElementInFrame: win is " + winTitle + ". action and targetType are " + commandAction + " and " + targetType)

		if (command.targetSpec && command.targetSpec.javascriptVariableValue) {
			// I recently (July'11) allowed targetSpecs where javascript evaluates to an xpath
			// Evaluate the javascript now and put the result in command.targetSpec.xpath for use with the standard findXPathElement below
			var jsValue = command.targetSpec.javascriptVariableValue.getValue()
			if (jsValue.indexOf("x\"") != -1 || jsValue.indexOf("x'") != -1) {
				var firstQuoteIndex = jsValue.indexOf("x\"")
				if (firstQuoteIndex != -1) {
					var lastQuoteIndex = jsValue.lastIndexOf("\"")
				} else {
					firstQuoteIndex = jsValue.indexOf("x'")
					lastQuoteIndex = jsValue.lastIndexOf("\'")
				}
				var xpathString = jsValue.substring(firstQuoteIndex+2, lastQuoteIndex)
				command.targetSpec.xpath = xpathString
			}
		}
		
		if (command.targetSpec && command.targetSpec.xpath) {	 
			// TL: use XPath in command to identify target, not target label
			var xPathElement = this.findXPathElement(win.document,
				command.targetSpec.xpath);	 
			if (xPathElement) {  
				matches.push(xPathElement);
				return true;
			} else {
				return false;	 
			}
		}
		
		/* Get dojo (and other custom target) matches
		// Up to this point, findTargetElementInFrame has been written assuming that the targetType will be used to go to a
		//single routine, like findButtonElement. But dojo overloads many targetTypes, and I don't want to have to break
		//out every little piece of code for each targetType.
		//So I changed findTargetElementHelper to see if anything has been added to the "matches" array (AC)
		//	In theory, this could cause problems when finding an element by ordinal, 
		//but it's unlikely that a dojo element and a non-dojo element on the same page will have the same label (unless the label is null).
		*/
		matchingElements = u.findDojoWidgetTargets(command, win.document)
		if (matchingElements.length>0) {
			matchingElement = u.disambiguateMatchingTargets(command, matchingElements)
			matches.push(matchingElement)
			return true;
		}
		
		matchingElements = u.findXulTargets(command, win.document)
		if (matchingElements.length>0) {
			matchingElement = u.disambiguateMatchingTargets(command, matchingElements)
			matches.push(matchingElement)
			return true;
		}
		
		if (command.getAction() == commands.ACTIONS.COPY && command.sourceType == "scratchtable" || 
			command.getAction() == commands.ACTIONS.PASTE && command.destType == "scratchtable" || 
			(command.getAction() == commands.ACTIONS.CLICK && command.targetSpec && command.targetSpec.tableType == "scratchtable") ) 
		{
			// get the value in the scratch space cell with the given row and column numbers.
			var scratchSpaceUI = u.getCurrentScratchSpaceUI()
			var scratchSpaceEditor = scratchSpaceUI.getEditor()
			if (!scratchSpaceEditor || !command.targetSpec) return false;
			var rowCount = scratchSpaceEditor.getDataRowCount(0)
			var columnCount = scratchSpaceEditor.getDataColumnCount(0)
			var columnIndex = command.targetSpec.targetColumnLabel ? scratchSpaceEditor.getDataColumnIndex(0, command.targetSpec.targetColumnLabel.getValue()) + 1 : command.targetSpec.targetColumnNumber
			//var columnNumber = u.convertLetterToColumnNumber(command.columnLetter);
			// No row labels for now (AC)
			var rowIndex = command.targetSpec.targetRowNumber
			if (!columnIndex || !rowIndex) return false;
			if (rowIndex <= rowCount && columnIndex <= columnCount){
				// it's inconsistent to not set matchingElement to the cell element in the scratchSpaceEditor. 
				// But XUL tables are indirect and require accessor methods. So we keep the row and column indices in the targetSpec.
				// This will eventually fail when findTarget can find multiple matches to a scratchtable targetSpec. (AC)
				var cellReference = new commands.CellReference();
				cellReference.tableElement = scratchSpaceEditor;
				cellReference.rowIndex = rowIndex;
				cellReference.columnIndex = columnIndex;
				matchingElement = cellReference
				matches.push(matchingElement)
				return true
			}
			/* for extracting tables from web pages 
			else if (	command.sourceType == "webpage"  || command.destType == "webpage" || 
						command.sourceType == "textbox"  || command.destType == "textbox" || 
						command.sourceType == "text"  || command.destType == "text" 
					) {
				var currentContentWindow = u.getCurrentContentWindow(window)
				ssTarget = getLabeler().findTargetElement(currentContentWindow, command);
			}
			//var rootWindow = u.getWindowRoot(window)
			//target = getLabeler().findChromeElement(commandExecutionEnvironment, rootWindow, command); 
			*/
		}
		/* scratchtable targetLabels
		if (command.targetSpec && command.targetSpec.targetLabel && command.targetSpec.targetLabel == "scratchtable") { 
			command.targetSpec.targetLabel.literal = this.getTableCellValue(command.targetSpec.targetLabel)
		}
		*/

		if (targetType == this.WEBTYPES.LISTBOX) {
			var listbox_matches = new Array();
			if (this.findListboxElement(listbox_matches, win, command)) {
				if (this.DEBUGFTE) this.d("Found listbox, checking for option\n");
				if (commandAction == commands.ACTIONS.ASSERT ||
					commandAction == commands.ACTIONS.WAIT ||					
					commandAction == commands.ACTIONS.IF) {
					var cmdVal = command.getValue();
					if (cmdVal != null) {
						var firstMatch = listbox_matches.pop()
						if (this.findOptionElement(matches, win, firstMatch, command)) 
							return true;
						else {
							throw new TargetException(
								"target value not found",
								null);
						}
					}
					else {
						for (var i = 0; i <listbox_matches.length; i++)		
							matches.push(listbox_matches[i]);
						return true;
					}	
				}
				else {					
					if (this.findOptionElement(matches, win, listbox_matches.pop(), command)) 
						return true;
					else {
						throw new TargetException(
							"target value not found",
							null);
					}
				}		
			} else {
				return false;
			}
		} else if (targetType == this.WEBTYPES.LINK) {
			return this.findLinkElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.BUTTON) {
			return this.findButtonElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.AREA) {
			return this.findAreaElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.DOJOWIDGET) {
			return this.findDojoWidgetElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.ITEM) {
			return this.findOnClickElement(matches, win, command)	// nodes with onClick handlers use "item"
			// return this.findDojoWidgetElement(matches, win, command);	// I think this is now obsolete; findDojoWidgetTargets will find "item" matches
		} else if (targetType == this.WEBTYPES.CHECKBOX || targetType == this.WEBTYPES.RADIOBUTTON) {
			return this.findCheckboxOrRadioElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.TEXTBOX) {
				return this.findTextEntryElement(matches, win, command);		
		} else if (targetType == this.WEBTYPES.TEXT) {
			return this.findTextElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.SELECTION) {
			return this.findSelectionElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.SCRATCHSPACE) {
			return this.findScratchSpaceTableElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.TEXTAREA) {
			return this.findTextareaEntryElement(matches, win, command);
		} else if (targetType == this.WEBTYPES.REGION) {
			return this.findRegionElement(matches, win, command);
		//} else if (targetType == this.WEBTYPES.MENU) {
		//	return this.findMenuElement(matches, win, command);
		} else {
			if (commandAction == commands.ACTIONS.ASSERT ||
				commandAction == commands.ACTIONS.WAIT ||
				commandAction == commands.ACTIONS.CLIP ||
				commandAction == commands.ACTIONS.IF) {
				return this.findRegionElement(matches, win, command);
			}
		}
		if (this.DEBUGFTE) {
			this.d("Unsupported command: " + command.getSlop() + "\n");
			this.d("  -> action: " + commandAction + "\n");
			this.d("  -> target type: " + targetType + "\n");
		}
		return false;
	},	//end of findTargetElementInFrame
	
	// delete this (AC)
	getTableCellValue : function(variableValueObj) {
		// get the value in the scratch space cell with the given row and column numbers.
		var rowNumber = -1
		var columnLetter = ""
		var scratchSpaceUI = u.getCurrentScratchSpaceUI()
		var scratchSpaceEditor = scratchSpaceUI.getEditor()
		if (!scratchSpaceEditor) return false;
		var rowCount = scratchSpaceEditor.getDataRowCount(0)
		var columnCount = scratchSpaceEditor.getDataColumnCount(0)
		var columnNumber = u.convertLetterToColumnNumber(columnLetter);
		if (rowNumber <= rowCount && columnNumber <= columnCount){
			matchingElement = scratchSpaceEditor
			matches.push(matchingElement)
			return true
		}		
	},
	
	findXPathElement : function(doc, xpath) {
		try{
			var xpathExprs = xpath.split("/document()");
			var contextDoc = doc;
			var node = contextDoc.evaluate(xpathExprs[0], contextDoc, null, 9, null).singleNodeValue;
			for(var i = 1; i < xpathExprs.length && node != null; i++) {
				if (node.contentDocument == null) return null;
				contextDoc = node.contentDocument;
				node = contextDoc.evaluate(xpathExprs[i], contextDoc, null, 9, null).singleNodeValue;		
			}
			return node;
		}catch(e){this.debug("findXPathElement threw exception: " +e);}  
	},	
	
	//		findOptionElement
	// Once you have a set of candidate listboxes, find the specified option within those listboxes that the command says to select
	findOptionElement : function(matches, win, listbox, command) {
		if (this.DEBUGFTE) this.d('findOptionElement called with textvalue: ' + command.getTextvalue() + '\n');
	
		// try to find the right OPTION node inside this listbox
		var result = win.document.evaluate(".//OPTION", listbox, null,
			5, null);
		var elt;
		while (elt = result.iterateNext()) {
	//		if (this.getUtils().isVisible(elt)) {
				var optiontext = elt.textContent;
				if (this.DEBUGFTE) this.d("Trying OPTION with content: " + optiontext + '\n');
				if (optiontext != null) {
					optiontext = this.components.utils().trim(this.getUtils().stripSpaces(optiontext));
					var score = this.scoreTextEquality(command.getTextvalue(), optiontext);
					// NOTE threshold is used here
					if (score > 0) {
	//					this.d("Listox score: " + listbox.score + ' element score: ' + score + '\n');
						elt.score = score * listbox.score;
						if (elt.score > 0.9) {
							matches.push(elt);
							return true;
						}
					}
	//			}
			}
		}
	
		return false;
	},
	
	//			findLinkElement
	findLinkElement : function(matches, win, cmd) {
		try {
			/* Basically we only care about links whose anchor text matches
			// the target label.  So we construct a blazing-fast xpath that
			// searches for links whose text matches the target label.
			// Otherwise, if we have to iterate over all links and test each
			// label in JavaScript, this gets really slow when operating on
			// websites such as CNN, which can have hundreds of links.
			//
			// However, this fails when the <a> tag contains substructure, such
			// as <a><b>Forward</b> all calls</a>, because you cannot
			// contatenate all text in descendant nodes together into a single
			// string in order to compare it against the target string.  Thus
			// we change the test a bit to look for nodes whose anchor text
			// starts with the same prefix as the target label, and further
			// refine it by filtering out nodes whose descendants contain text
			// other than the target label.
			//
			// TODO: expand to anything with an onclick
			*/
			var targetLabel = cmd.getTargetLabel();
			/*		var xpath = "//A[starts-with(\"" + targetLabel +
				"\", normalize-space(descendant::text())) and " +
				"not(descendant::text()[not(contains(\"" + targetLabel + "\", normalize-space(self::text())))])"
				+ "]";
			// TL: OK, so the above xpath expression failed to ignore the text within noscript tags:
			// <a><noscript>foo</noscript> bar </a>
			// when the target label should be "bar".
			*/
			var xpath_list = this.getXpathForWebType(cmd.getTargetType());			
			for (var x_i=0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var doc = win.document;
				var result = doc.evaluate(xpath, doc, null, 5, null);
				var element;
				while (element = result.iterateNext()) {
					if (this.getUtils().isVisible(element)) {
						if (this.DEBUGFTE) {
							this.d('Evaluating link with text: ' + this.getText(element) + '\n');
							this.d('isVisible = ' + this.getUtils().isVisible(element) + '\n')
						}
						var label = this.getText(element);
						var score = this.scoreAndAdd(matches, cmd, label, element);
						if (score == 2) {
							return true;
						} else if (score == 1) {
							// it matches but it isn't the right ordinal
							continue;
						}
					}
				}
			}
			return false;
		} catch (e) {
			this.d("Error in findLinkElement: " + e + '\n');
		}
	},
	
	
	//			findButtonElement
	findButtonElement : function(matches, win, cmd) {
		try {
			var doc = win.document;
			var element;
			var myMatches = []
	
			// Iterate through the different xpaths in order
			var xpath_list = this.getXpathForWebType(cmd.getTargetType());
			for (var x_i = 0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var result = doc.evaluate(xpath, doc, null, 7, null);	// 7 is snapshot
				var score;

				for (var i=0; i<result.snapshotLength; i++) {
					element = result.snapshotItem(i)
					var elementFound = false;
					/* Choose the appropriate labeler for this type of element
					// 1. InputButtonLabeler
					// 2. ButtonLabeler
					// 3. DojoLabeler, since e.g. TitlePane is called a button
					// 4. ImageLabeler
					// 5. BackgroundImageLabeler
					*/					
					/* Extension ?
					 * if there is an extension that is responsible for this element
					 * AND that extension defines a custom labeler then return its label
					 */ 
					
					var elementLabeler;
					if (this.InputButtonLabeler.labelerCondition(element)) {
						elementLabeler = this.InputButtonLabeler;
					} else if (this.ButtonLabeler.labelerCondition(element)) {
						elementLabeler = this.ButtonLabeler;
					} else if (this.DojoLabeler.labelerCondition(element)) {	
					// } else if (this.DojoLabeler.labelerCondition(element) && (this.DojoLabeler.getBestLabelFor(element) != null)) {	
						elementLabeler = this.DojoLabeler;
					} else if (this.ImageLabeler.labelerCondition(element)) {
						elementLabeler = this.ImageLabeler;
					} else if (this.BackgroundImageLabeler.labelerCondition(element)) {
						elementLabeler = this.BackgroundImageLabeler;
					} else {
						// No labeler found
						continue;
					}
					
					if (!this.getUtils().visibleP(element)) continue;	// This skips over invisible elements. 
																// This can pose a problem since we don't handle Hover, 
																// and often the element you want to click on only becomes visible with a mouseOver (AC)
	
					var label = elementLabeler.getBestLabelFor(element);
					score = this.scoreAndAdd(myMatches, cmd, label, element);
					if (score == 2) {
						for (var j = 0; j <myMatches.length; j++)		
							matches.push(myMatches[j]);
						return true;
					} else if (score == 1) {
						continue;
					}
				}
			}
	
			// Didn't find anything
			return false;
		} catch (e) {
			this.d("Error in findButtonElement: " + e.toSource() + '/' +
				e.toString() + '\n');
		}
	},
	
	//			findRegionElement
	// Find a region area
	// Assumptions: only the match type "contains" is supported.  We do not
	// support "starts with", "ends with", or literal match
	// JM: this method is implemented following approach of clip command
	findRegionElement : function(matches, win, cmd) {
		try {
			var doc = win.document;
			var label = cmd.getTargetLabel(false);
			var parser = this.components.parser();
			if (cmd.targetSpec.getMatchType() != parser.ParserConstants.CONTAINS) {
				// Anything but CONTAINS is not supported
				this.d("findRegionElement does not support match type " +
					cmd.targetSpec.getMatchType());
				return;
			}

			var words = label.split(/\s+/);
			var u = this.getUtils();
			var wordXPaths = new Array();

			for (var i=0; i<words.length; i++) {
				wordXPaths.push("descendant::text()[contains(" + "self::text(),'" + words[i] + "')]");
			}

			var contains = wordXPaths.join(" and ");
			var targetType = cmd.getTargetType();
		
			if (targetType != "element") {			
				var xpath = "";				
				xpath = "//" + targetType + "[" + contains +
					" and not(descendant::" +
					targetType +
					"[" +
					contains +
					"]" + // Not component.
					")]";
				var nodes = u.getNodes(xpath, doc);				
				if (nodes != null) {
					for (var i = 0; i < nodes.length; i++) {
						matches.push(nodes[i]);
					}
				}
			} else { // target type == "element"				
				if (matches.length == 0) {					
					// TL: Jalal, why is this hardcoded as 15?
					// JM: fixed now.
					for (var count = 0; count < tagsForRegionElement.length; count++) {
						var xpathType = tagsForRegionElement[count];
						//this.getXpathForElementType(count);
						var xpath = "";						
						// TL: only contains is supported; I removed the
						// startswith case
						xpath = "//" + xpathType + "[" + contains +
							" and not(descendant::" +
							targetType +
							"[" +
							contains +
							"]" + // Not component.
							")]";
						
						var nodes = u.getNodes(xpath, doc);
						if (nodes != null) {
							for (var i = 0; i < nodes.length; i++) {
								matches.push(nodes[i]);
							}
							break;
						}			
					  } // end for	
				} // end matches.lenth == 0				
			}		// end else targettype == "element"			
			
			return (matches.length > 0);			
		} catch (e) {
			this.d("Error in findRegionElement: " + e + '\n');
		}
	},	

	
	// Find a dojo widget
	findDojoWidgetElement : function(matches, win, cmd) {
		// OBSOLETE. Now using findDojoWidgetTargets in utils (AC)
		return false; 
		try {
			var doc = win.document;
			var element;
	
			// Iterate through the different xpaths in order
			var xpath_list = this.getXpathForWebType(cmd.getTargetType());
			for (var x_i = 0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var result = doc.evaluate(xpath, doc, null, 5, null);
				var score;
				while (element = result.iterateNext()) {
					var elementFound = false;
					var elementLabeler;
					if (this.DojoLabeler.labelerCondition(element)) {
						elementLabeler = this.DojoLabeler;
					} else {
						// No labeler found
						continue;
					}
	
					var label = elementLabeler.getBestLabelFor(element);
					score = this.scoreAndAdd(matches, cmd, label, element);
					if (score == 2) {
						return true;
					} else if (score == 1) {
						continue;
					}
				}
			}
	
			// Didn't find anything
			return false;
		} catch (e) {
			this.d("Error in findDojoWidgetElement: " + e + '\n');
		}
	},
		
	// Find an imagemap area
	findAreaElement : function(matches, win, cmd) {
		try {
			var xpath_list = this.getXpathForWebType(cmd.getTargetType());
			var score;
			for (var x_i=0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var doc = win.document;
				var result = doc.evaluate(xpath, doc, null, 5, null);
				var element;
				while (element = result.iterateNext()) {
					var label = this.AreaLabeler.getBestLabelFor(element);
					score = this.scoreAndAdd(matches, cmd, label, element);
					if (score == 2) {
						return true;
					}
				}
			}
			return false;
		} catch (e) {
			this.d("Error in findAreaElement: " + e + '\n');
		}
	},
	
	// Find a listbox element that matches the specified command
	findListboxElement : function(matches, win, cmd) {
		try {
			var xpath_list = this.getXpathForWebType(cmd.getTargetType());
			var score;
			for (var x_i=0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var doc = win.document;
				var result = doc.evaluate(xpath, doc, null, 5, null);
				var element;
				while (element = result.iterateNext()) {
					var label = this.ListBoxLabeler.getBestLabelFor(element);
					score = this.scoreAndAdd(matches, cmd, label, element);
					if (score == 2) {
						return true;
					}
				}
			}
			return false;
		} catch (e) {
			this.d("Error in findListboxElement: " + e + '\n');
		}
	},
	
	// Find a menuitem element that matches the specified command
	findMenuElement : function(matches, win, cmd) {
		try {
				var u = this.getUtils()
				//win is the mainChromeWindow
				//var contentWindow = win.content
				var doc = win.document || win.ownerDocument	// added win.ownerDocument May'11 FF4 change? change in the way I get the mainChromeWindow?? (AC)
				if (!doc || !doc.getElementsByAttribute) return false;
				
				var menuString = cmd.targetSpec.getTargetLabel()
				var menuLabels = menuString.split(">")
				//for (var i=0; i<menuLabels.length; i++) {
				// For now, don't worry about duplicate menuitem names, and just search for the menuitem by name (AC)
				var menuLabel = menuLabels[menuLabels.length-1]
				//var mainMenubar = doc.getElementById("main-menubar")				
				var menuItemList = doc.getElementsByAttribute("label", menuLabel)
				var menuItem = null
				for (i=0; i<menuItemList.length; i++) {
					if (menuItemList[i].nodeName == "menuitem") {	// might want to look at key commands as well
						menuItem = menuItemList[i]
						break;
					} 
				}
				if (!menuItem) return false;
				
				var commandID = menuItem.command || menuItem.getAttribute("observes")
				// "cmd_find" "cmd_newNavigatorTab" "viewConsole2Sidebar"
				if(commandID) {
					var commandElement = doc.getElementById(commandID)
					// execute by commandElement.doCommand()
					// or commandElement.doCommand(commandElement.getAttribute("oncommand"))
					if (commandElement){
						matches.push(commandElement)
						return true;
					}	
				}
				
				var onCommand = menuItem.getAttribute("oncommand")
				// "toggleSidebar('viewConsole2Sidebar');"	
				if (onCommand) {
					// execute by menuItem.doCommand(onCommand)
					matches.push(menuItem)
					return true;
				}
				
				if (menuItem.doCommand) {
					matches.push(menuItem)
					return true;
				}
				
				/*
				var controller = menuItem.ownerDocument.commandDispatcher.getControllerForCommand(commandID)
				controller.isCommandEnabled(commandID)
				controller.doCommand(commandID)
				*/

				return false;
		} catch (e) {
			this.d("Error in findMenuElement: " + e + '\n');
		}
	},		
	
	// Find an element with an onClick handler that matches the specified command
	findOnClickElement : function(matches, win, cmd) {
		try {
			var xpath_list = this.getXpathForWebType(this.WEBTYPES.ITEM);
			var doc = win.document;
			var element;
			var score;
			for (var x_i=0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var result = doc.evaluate(xpath, doc, null, 5, null);
				while (element = result.iterateNext()) {
					var label = this.getLabel(element, this.WEBTYPES.ITEM)
					score = this.scoreAndAdd(matches, cmd, label, element);
					if (score == 2) {
						return true;
					}
				}
			}
			return false;
		} catch (e) {
			this.d("Error in findOnClickElement: " + e + '\n');
		}
	},
	
	findTextEntryElement : function(matches, win, cmd) {
		try {
			var xpath_list = this.getXpathForWebType(this.WEBTYPES.TEXTBOX);
			for (var x_i=0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var doc = win.document;
				var result = doc.evaluate(xpath, doc, null, 5, null);
				var element;
				while (element = result.iterateNext()) {
					var label = this.TextBoxLabeler.getBestLabelFor(element);
					var score = this.scoreAndAdd(matches, cmd, label, element);
					if (score == 2) {
						// A label trumps everything else
						return true;
					}
				}
			}	
			return false;
		} catch (e) {
			this.d("Error in findTextEntryElement: " + e + '\n');
		}
	},
	
	// JM
	findTextEntryElementWithTargetValue : function(matches, win, cmd, targetVal) {
		try {
			var xpath_list = this.getXpathForWebType(this.WEBTYPES.TEXTBOX);
			for (var x_i=0; x_i < xpath_list.length; x_i++) {
				var xpath = xpath_list[x_i];
				var doc = win.document;
				var result = doc.evaluate(xpath, doc, null, 5, null);
				var element;
				while (element = result.iterateNext()) {
					var label = this.TextBoxLabeler.getBestLabelFor(element);
					var tempmatches = new Array();
					var score = this.scoreAndAdd(matches, cmd, label, element);
					if (score == 2) {
						// A label trumps everything else
						if (element.value == targetVal) {
							//for (var i = 0; i <tempmatches.length; i++) 
								//matches.push(tempmatches[i]);
							return true;						
						}
						else {
							matches.pop();
							return false;
						}	
					}
				}
			}
	
			return false;
		} catch (e) {
			this.d("Error in findTextEntryElement: " + e + '\n');
		}
	},
	
	
	// Find a checkbox with the desired label
			//if (cmd.getTargetType() == this.WEBTYPES.CHECKBOX || cmd.getTargetType() == this.WEBTYPES.RADIOBUTTON) {
			//	xpath = this.getXpathForWebType(cmd.getTargetType());
	findCheckboxOrRadioElement : function(matches, win, cmd){
		try {
			var myMatches = []	// we used to just use 'matches'. But "* turn on the tenth radiobutton" was matching the last of 6 buttons
			// listboxes have always handled this correctly (AC)
			var xpath;
			if (cmd.getTargetType() == this.WEBTYPES.CHECKBOX) {
				xpath = "//INPUT[translate(@type,'CHEKBOX','chekbox')='checkbox']";
				//xpath = "//INPUT[@type='checkbox' or @type='Checkbox' or @type='CheckBox' or @type='CHECKBOX']";
			} else if (cmd.getTargetType() == this.WEBTYPES.RADIOBUTTON) {
				xpath = "//INPUT[@type='radio' or @type='Radio' or @type='RADIO']";
			} else {
				if (this.DEBUGFTE) this.d("Unsupported turn on type: " + cmd.getTargetType() + '\n');
				return false;
			}
			var doc = win.document;
			var element;
	
			// 5 is XPathResult.ORDERED_NODE_ITERATOR_TYPE
			var result = doc.evaluate(xpath, doc, null, 5, null);
			while (element = result.iterateNext()) {
				var labelfound = false;
				var label = this.CheckBoxLabeler.getBestLabelFor(element);
				var score = this.scoreAndAdd(myMatches, cmd, label, element);
				if (score == 2) {
					for (var i = 0; i <myMatches.length; i++)		
						matches.push(myMatches[i]);
					return true;
				}
			}
			return false;
		} 
		catch (e) {
			this.d("Error in findCheckboxOrRadioElement: " + e + '\n');
		}
	},
	
	
	//	findTextElement
	findTextElement : function (matches, win, cmd) {
		var ordinal = cmd.getOrdinal();
		var cardinal;
		if (ordinal == null) {
			cardinal = 1;
		}
		else {
			cardinal = this.getUtils().getCardinal(ordinal);
		}
		var doc = win.document;
		
		var label = cmd.getTargetLabel();
		// XPathResults.FIRST_ORDERED_NODE_TYPE = 9
		var xPathResult;
		xPathResult = doc.evaluate("(//text()[normalize-space(.) = '" + label + "'])[" + cardinal + "]", doc, null, 9, null);
		var anchorTextNode = xPathResult.singleNodeValue;
		if (anchorTextNode == null) {
			return false;
		}
	
		// XPathResults.FIRST_ORDERED_NODE_TYPE = 9
		xPathResult = doc.evaluate("following::text()[normalize-space(.) != ''][1]", anchorTextNode, null, 9, null);
		if (xPathResult == null) {
			return false;
		}
		matches.push(xPathResult.singleNodeValue);
		return true;
	},
	
	
	findScratchSpaceTableElement: function(matches, win, cmd) {
		if (cmd.tableUI) {
			var tableUI = cmd.tableUI;
			if (cmd.rowNum - 1 < tableUI.getDataRowCount() && tableUI.getDataColumnIndex(cmd.columnName, cmd.columnNameOccurrence) != -1) {
				matches.push(cmd.tableUI.getTree());
				return true;
			}
			else {
				return false;
			}
		}
	},
	
	findChromeElement: function(execEnv, window, command) {
		try {
			if (DEBUGFTE) {
				d('FTE called with command, label: ' + command.getTargetLabel() +
					'\n');
			}
			var matches = new Array();
			var found = this.findChromeElementHelper(matches, execEnv, window, command);
			if (found) {
				var ret = matches.pop();
				if (DEBUGFTE) d('FTE: returning: ' + ret + '\n');
				return ret;
			} else {
				if (DEBUGFTE) d('FTE: nothing found\n');
				return null;
			}
		} catch (e) {
			d("Error in findChromeElement: " + e + '\n');
		}
	},
	
	// Find a chrome element with the desired label 
	findChromeElementHelper: function(matches, execEnv, win, cmd) {
		try {
			var targetType = cmd.getTargetType(); 
			if (targetType === this.CHROMETYPES.TAB) {
				return this.findTabElement(matches, execEnv, win, cmd);
			}
			else {
				if (DEBUGFTE) d("Unsupported close on type: " + targetType + '\n');
				return false;
			}
		}
		catch (e) {
			d("Error in findChromeElementHelper: " + e + "\n");
		}
	},
	
	
	// Find a browser tab with the desired label
	findTabElement: function(matches, execEnv, win, cmd) {
		try {
			var ordinal = cmd.getOrdinal();
			if (ordinal != null) {
				var cardinal = this.getUtils().getCardinal(ordinal);
				var tab = execEnv.getTab(win, cardinal - 1);
				if (tab != null) {
					matches.push(tab);
					return true;
				}
				else {
					if (DEBUGFTE) d('FTE: nothing found\n');
					return false;
				}
			}
			else {
				if (DEBUGFTE) d("Currently, can only refer to tab based on position, not name\n");
				return false;
			}
		}
		catch (e) {
			d("Error in findTabElement: " + e + "\n");
		}
	},
	
	//		Scoring methods
	/*		Scoring methods
	// Count the fraction of words in target that are contained in candidate
	// If the words in target are {A} and the words in candidate are {B}, this
	// computes:  2 * |A \intersection B| / (|A| + |B|)
	// Thinking more, this would incorrectly not distinguish between the "foo
	// bar" button and the "bar foo" button.  So word ordering should be
	// important here.
	*/
	scoreTextEquality : function(target, candidate) {
		// prepare the strings
		candidate = this.getUtils().trim(this.getUtils().stripSpaces(candidate));
	
		/* The target may be a regular expression object
		// This is really stupid, but we can't check whether target is an instance of RegExp using "instanceof". */
		if (typeof(target.test) == "function") {
			// If it's a regex, then do a regex match against the target
			if (target.test(candidate)) {
				return 1.0;
			} else {
				return 0.0;
			}
		} else {
			// Otherwise, it's a literal string; check for literal equality
			target = this.getUtils().trim(this.getUtils().stripSpaces(target));
			if (candidate.toLowerCase() == target.toLowerCase()) {
				return 1.0;
			} else {
				return 0.0;
			}
		}
	},
	
	/* Utility function to add something to the "arr" return array if it scores
	// high enough.  Returns a tristate value: 0 if it does not match, 1 if it
	// does score high enough but is not the ordinal match we are looking for,
	// 2 if it scores high enough and is the ordinal match we are looking for. */
	scoreAndAdd : function(arr, cmd, candidateLabel, candidateElement) {
		var targetLabel = cmd.getTargetLabel();
		if (this.DEBUG && this.DEBUGFTE) {
			dump('Scoring <' + candidateLabel + '> against <' +
				targetLabel + '>\n');
		}
		var ordinal = cmd.getOrdinal();
		var cardinal;
		if (ordinal != null) cardinal = this.getUtils().getCardinal(ordinal);
		
		var targetDisambiguator = cmd.getDisambiguator();
		var candidateDisambiguator = ""
		if (targetDisambiguator){
			var targetRowLabel = this.getTableRowLabel(candidateElement)
			candidateDisambiguator = '"' + targetRowLabel + '"' + " row's"
		}
	
		if (targetLabel == null) {
			// No label specified; we always match!
			candidateElement.score = 1.0;

			if (targetDisambiguator) {
				if (candidateDisambiguator == targetDisambiguator) {
					arr.push(candidateElement);
					return 2;
				}
				else return 0;
			}
			
			arr.push(candidateElement);
			if (ordinal === null || arr.length >= cardinal) {
				if (arr.length > cardinal) if (this.DEBUGFTE) this.d('ERROR! should not be more matches than requested!\n');
				return 2;
			} else { return 1; }
		}
	
		if (candidateLabel) {
			var score = this.scoreTextEquality(targetLabel, candidateLabel);
			candidateElement.score = score;
			if (score > 0.9) {
				// this.d('High-scoring candidateElement with label: ' + candidateLabel + '\n');
				// this.d('And target text is: ' + candidateLabel + '\n');
				// this.d('And score: ' + score + '\n');

				if (targetDisambiguator) {
					if (candidateDisambiguator == targetDisambiguator) {
						arr.push(candidateElement);
						return 2;
					}
					else return 0;
				}
				
				arr.push(candidateElement);
				// We've been pushing matches onto arr. Check its length and compare to the desired ordinal
				if (ordinal === null || arr.length >= cardinal) {	
					if (arr.length > cardinal) if (this.DEBUGFTE) this.d('ERROR! should not be more matches than requested!\n');
					return 2;
				} else { return 1; }
			}
		}
		return 0;
	},
	
	// scoreTextOverlap is no longer used.
	scoreTextOverlap : function(target, candidate) {
		// prepare the strings
		target = this.getUtils().trim(this.getUtils().stripSpaces(target));
		candidate = this.getUtils().trim(this.getUtils().stripSpaces(candidate));
	
		var target_words = target.split(/\b\s*/);
		if (target_words.length == 0) return 0.0;
		var candidate_words = candidate.split(/\b\s*/);
		var score = 0;
		var hashmap = new Object();
		for (var i=0; i<target_words.length; i++) {
			hashmap[target_words[i]] = 1;
		}
		for (var j=0; j<candidate_words.length; j++) {
			if (hashmap[candidate_words[j]] == 1) {
				score += 1;
			} else {
			}
		}
	
		var ret = (score * 2.0) / (target_words.length + candidate_words.length);
		return ret;
	},
	
	// Return only the filename component of some URI
	// For example, filenameComponent("/images/submit.gif") => "submit.gif"
	filenameComponent : function(uri) {
		var components = uri.split('/');
		if (components.length > 1) {
			uri = components[components.length - 1];
		}
		return uri;
	},
	
	// ****************************************************************************************
	//	findTargetWindow
	// ****************************************************************************************
	// used by * go to ... window
	findTargetWindowByName : function(target) {
		// Go through the tabs of all of the main browser windows
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var chromeEnumerator = wm.getEnumerator("navigator:browser");
		//var chromeWindowList = u.enumeratorToList(chromeEnumerator)
		var foundWindow = null
		
		while (chromeEnumerator.hasMoreElements()) {
			var chromeWindow = chromeEnumerator.getNext()
			var tabBrowser = chromeWindow.gBrowser
			var tabList = tabBrowser.tabContainer.childNodes
			for (var i=0; i<tabList.length; i++) {
				var tab = tabList[i]
				var tabContentWindow = tab.linkedBrowser.contentWindow
				var tabContentDocument = tab.linkedBrowser.contentDocument
				var candidate = tabContentDocument.title
				var score = this.scoreTextEquality(target.getValue(), candidate)	// target is a variableValue object. target.getValue() may be a regular expression.
				if (score == 1.0){
					return tabContentWindow
				}
			}
		}

		
	},
		
	// ****************************************************************************************
	//	listTargetMatches
	// ****************************************************************************************
	/*	 A simplified version of slop interpreter's listCommands
	//	 Called at the end of command-generator's handleEvent to see if the slop it generated 
	//	matches more items on the page than just the target. 
	//	 Checks whether additional elements have the same targetDescription (ie Label and Type) as the target. */
	listTargetMatches : function(command, contentWindow) {
		var targetType = command.getTargetType()
		var targetLabel = command.getTargetLabel()
		// var targetType = this.getTargetType(target)
		//if (!targetLabel) targetLabel = this.getLabel(target)
		var matchingElements = []
		// Find all html elements on the page that a user can interact with.
		//Collect any elements that have the same type and label as the target. 
		this.findMatchingElements(command, contentWindow, matchingElements)
		return matchingElements
	},
	
	// ****************************************************************************************
	//	findMatchingElements
	// ****************************************************************************************
	/*	A simplified version of slop interpreter's createFormCommands
	//	Called by listTargetMatches above
	//	Also called by makeThisTheRunLine 3) a) to find matchingElements for a parsed command. */
	findMatchingElements: function(command, window, matchingElements){
		var u = this.getUtils()
		var targetType = command.getTargetType()
		var targetLabel = command.getTargetLabel()
		//this.debug("starting findMatchingElements")
		if (this.DEBUGFTE) 
			this.d('findMatchingElements called with window: ' + window.location.href + '\n');
		// recursively scrape for commands on frames nested beneath this window
		for (var i = 0; i < window.frames.length; i++) {
			//this.debug("recursive call to findMatchingElements")
			this.findMatchingElements(command, window.frames[i], matchingElements)
		}
		
		var document = window.document
		
		// get dojo (and other custom target) matches
		var action = "" // Later, we will pass in the action (AC)
		var dojoMatchingElements = u.findDojoWidgetTargets(command, document)
		var dojoMatchingElement = null
		while (dojoMatchingElements && (dojoMatchingElement = dojoMatchingElements.pop())) {
			if (!u.inArrayP(dojoMatchingElement, matchingElements)) 
				matchingElements.push(dojoMatchingElement)
		}
		
		var xulMatchingElements = u.findXulTargets(command, document)
		var xulMatchingElement = null
		while (xulMatchingElements && (xulMatchingElement = xulMatchingElements.pop())) {
			if (!u.inArrayP(xulMatchingElement, matchingElements)) 
				matchingElements.push(xulMatchingElement)
		}
		
		/* CD 1/18/08 Optimizing this xpath will make sites with lots of targets faster
		 // since search can be contained to a given target type
		 // Drawback: if getXpathForWebType does not include the target we're looking for
		 // stuff will go wrong bad:
		 // 1) the search for duplicates will not work and wrong ordinals will be created
		 // 2) slop will not find the specified target */
		var xpath_list = this.getXpathForWebType(targetType);
		for (var x_i = 0; x_i < xpath_list.length; x_i++) {
			var xpath = xpath_list[x_i];
			if (this.DEBUGFTE) 
				this.d("findMatchingElements, xpath for " + targetType + "=" + xpath + "\n");
			// this xpath will return a list of all of the html elements on the page (that the user can perform an action on)
			
			/*
			 var htmlElements = document.evaluate(xpath, document, null, 5, null)
			 //5 is XPathResult.ORDERED_NODE_ITERATOR_TYPE
			 var element
			 while (element = htmlElements.iterateNext()) {
			 */
			var htmlElements = document.evaluate(xpath, document, null, 7, null)
			//7 is XPathResult.ordered_node_snapshot_type
			var element
			for (i = 0; i < htmlElements.snapshotLength; i++) {
				element = htmlElements.snapshotItem(i)
				
				// we convert the element's tag type to a human-readable form (more importantly, a form that exists in the slop interpreter's *wordData* object), such as listitem
				var type = this.getTargetType(element)
				if (targetType && type != targetType) 
					continue;
				
				var label = this.getLabel(element)
				// Check to see if the target label equals the actual label computed by getLabel
				// If they're both strings, then if the strings are not equal, then continue because they don't match
				if (targetLabel && label && !u.equalSpaceNormalized(label, targetLabel)) 
					continue;
				/* TL: if the target label is not specified, then we should
				 // match anything of the correct type, regardless of what its label is.
				 // TargetLabel Label	Result
				 // null			null	match
				 // null			notnull match
				 // notnull		null	no match (continue)
				 // notnull		notnull (taken care of above) */
				if ((targetLabel != null) && (label == null)) 
					continue;
				
				// TL: only add it to matching elements list if we haven't found it already
				var found = false;
				for (var index = 0; index < matchingElements.length; index++) {
					if (matchingElements[index] == element) {
						found = true;
						break;
					}
				}
				if (found) 
					continue;
				//this.debug("findMatchingElements found element with id = " + element.getAttribute("id"))				
				matchingElements.push(element)
			}
		}
		//this.debug("returning from findMatchingElements with " + matchingElements.length + " elements")
	},
	//	end of findMatchingElements

	// JM: this is used from findRegionElement
	getXpathForElementType : function(testIndex){
		switch(testIndex){
			case 0:
				return "td";
			case 1:
				return "tr";
			case 2:
				return "table";
			case 3:
				return "div";
			case 4:
				return "span";
			case 5:
				return "anchor";				
			case 6:
				return "heading";
			case 7:
				return "h1";
			case 8:
				return "h2";
			case 9:
				return "h3";
			case 10:
				return "h4";
			case 11:
				return "h5";				
			case 12:
				return "h6";
			case 13:
				return "element";
			case 14:
				return "node";
			case 15:
				return "<p>";
			case 16:
				return "A";
			case 17:
				return "BUTTON";
			case 18:
				return "INPUT";
			case 19:
				return "SELECT";
			
			
			default:
				throw "Unrecognized element type given to getXpathForElementType";
		}
	},
	
	// Called by findMatchingElements above,
	//	slop-interpreter's createFormCommands, and command-generator's _onCommand for the Copy command
	// TL: if you change this method, be sure to make corresponding
	// changes to getXpathForWebType below, so that recording and playback
	// match up
	getTargetType : function(element) {
		var targetAndType = this.getTargetAndType(element)
		var targetType = ""
		if (targetAndType) targetType = targetAndType[1]
		return targetType
	},
	
	//		findDisambiguator
	// Called by post-processor in command-generator's handleEvent to disambiguate in a better way than just using an ordinal
	// Returns true if the targetSpec has been changed
	findDisambiguator : function(target, targetMatches, commandObj) { 
		// Minimal for now.
		// See if the target is in a row of a table, and if the row can be used as a disambiguator
		var targetRowLabel = this.getTableRowLabel(target)
		if (!targetRowLabel) return false
		var element = null
		while (element = targetMatches.pop()) {
			if (element == target) continue;
			var elementRowLabel = this.getTableRowLabel(element)
			if (elementRowLabel == targetRowLabel) return false
		}
		// Is it unique?
		// todo
		commandObj.targetSpec.disambiguator = '"' + targetRowLabel + '"' + " row's"
		return true
	},
	
	getTableRowLabel : function(element) {
		var u = this.getUtils()
		var doc = element.ownerDocument
		var iterator = doc.evaluate('ancestor-or-self::td', element, null, 5, null )
		var resultList = u.iteratorToList(iterator)
		var cell = resultList.pop()
		if (!cell) return false 
		var iterator = doc.evaluate('ancestor-or-self::tr', cell, null, 5, null )
		var resultList = u.iteratorToList(iterator)
		var cellRow = resultList.pop()
		if (!cellRow) return false	
		var iterator = doc.evaluate('descendant::td', cellRow, null, 5, null )
		var resultList = u.iteratorToList(iterator)
		var firstCell = resultList[0]
		if (!firstCell) return false	
		var firstCellLabel = u.trimAndStrip(firstCell.textContent)
		if (!firstCellLabel) return false
		return firstCellLabel
	},
	
	// ****************************************************************************************
	//
	//	getTargetAndType
	//
	// ****************************************************************************************
	//	 Used by command-generator in _onClick and _onChange to generate slop.
	// IMPORTANT: getTargetAndType returns an array of [newTarget, targetType], since often the appropriate target is a parent of the original target.
	// IMPORTANT: to handle widgets, getTargetAndType now also returns a dojoWidgetTargetSpec, which can include the label
	// event argument is optional: getXulNode sometimes needs to use the originalTarget
	getTargetAndType : function(target, event) {
		this.debug("getTargetAndType: target nodeName is " + target.nodeName)
		var u = this.getUtils()
		var coscripterPrefs = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("coscripter.")
		var targetType = ""
		
		/* Extension 
		for(ext in Extensions){
			if(ext.usesThisExtension(target)){
				return ext.getTargetAndType(target); // target(Node)  action(string {'click',...} type(string {'checkbox'...} and label(string {'foo'}
			}
		}
		*/
		
		//xul nodes
		var xulTargetSpec = u.getXulNode(target, event)
		if (xulTargetSpec) {
			return [target, this.WEBTYPES.XUL, xulTargetSpec]
		} 
					
		//dojo widgets
		var dojoWidgetTargetSpec = u.getDojoWidgetNode(target)
		if (dojoWidgetTargetSpec) {
			target = dojoWidgetTargetSpec.target
			return [target, this.WEBTYPES.DOJOWIDGET, dojoWidgetTargetSpec]
		} 
	
		var mainParent = u.getAncestorNamed(target, "A")
		if (mainParent && mainParent.childNodes) {	// clicked on a LINK
			target = mainParent
			targetType = this.WEBTYPES.LINK
			// TL: if the link has text, then we will treat it as a link,
			// otherwise it will be a button
			var text = this.getText(mainParent);
			if (!(text == null) && (u.trim(u.stripSpaces(text)) != "")) {
				targetType = this.WEBTYPES.LINK;
			} else {
				// Check for the presence of an image child
				var imageChild = u.getNode(".//IMG", mainParent);
				if (imageChild == null) {
					//this.debug("getTargetAndType: A tag has no text and no IMG children; assuming BUTTON anyway");
				}
				targetType = this.WEBTYPES.BUTTON;
			}
			return [mainParent, targetType]
		}
		
		mainParent = u.getAncestorNamed(target, "BUTTON")
		if (mainParent) {
			target = mainParent
			return [mainParent, this.WEBTYPES.BUTTON]
		}
		
		mainParent = u.getAncestorNamed(target, "INPUT")
		if (mainParent) {
			target = mainParent
			var type = target.getAttribute("type") || target.type
			if (type) switch (type.toLowerCase()) {
				case "submit" :
				case "reset" :
				case "image" :
				case "button" : return [target, this.WEBTYPES.BUTTON]
				case "checkbox" : return [target, this.WEBTYPES.CHECKBOX]
				case "radio" : return [target, this.WEBTYPES.RADIOBUTTON]
				case "password" :	// note: no special category for password fields (they are considered textboxes)
				case "file":        // TL: file upload boxes are textboxes too
	
				case "text" : return [target, this.WEBTYPES.TEXTBOX]
			}
	
		}  // end of INPUT case
		
		// handle INPUT listboxes, as well as listboxes that are not part of a Form
		mainParent = u.getAncestorNamed(target, "SELECT")
		if (mainParent) {
			target = mainParent
			return [mainParent, this.WEBTYPES.LISTBOX]
		}
		
		// handle INPUT textboxes, textboxes that are not part of a Form,
		// and imagemap AREAs
		var nodeName = target.nodeName.toLowerCase()
		if (nodeName) switch(nodeName){
			case "html:textarea" :
			case "textarea" : return [target, this.WEBTYPES.TEXTBOX]
			case "area" : return [target, this.WEBTYPES.AREA]
	
		}

		// TL: image buttons (make sure these are before the Dojo items)
		var style = target.ownerDocument.defaultView.getComputedStyle(target, null);
		if (style && style.backgroundImage != '' && style.backgroundImage != 'none') {
			return [target, this.WEBTYPES.BUTTON];
		}

		// arbitrary things with onclick handlers
		var clickparent = u.getParentWithOnclick(target)
		if (clickparent) {
			return [clickparent, this.WEBTYPES.ITEM];
		}
		
		// elements you can't interact with, and whose parents you can't interact with
		//NONUIELEMENT
		mainParent = u.getAncestorNamed(target, "HTML") || u.getAncestorNamed(target, "PAGE")
		if (mainParent) {
			//this.debug("getTargetAndType: click on a non-ui element")
			var recordAllClicksP = coscripterPrefs.prefHasUserValue('recordAllClicksP') ? coscripterPrefs.getBoolPref('recordAllClicksP') : false
			// (AC) We can't currently determine whether an element has any attached event listeners.
			// To make Cobra Table clicks work, if the click is in a table cell, record it.
			if (this.getTableCellLabel(target) && this.cobraPageP(target)) return [target, this.WEBTYPES.TABLECELL]
			else if (recordAllClicksP) {	// Check if the user pref is set to Record All Clicks
				return [target, this.WEBTYPES.XPATH]
			}
			else return [target, this.WEBTYPES.NONUIELEMENT]
		}
		
		return [target, this.WEBTYPES.OTHER]
	},
	//	end of getTargetAndType
	
		
	// **************************************************************************************** 
	// 
	//	getLabel and getLabel helper functions
	//
	// ****************************************************************************************
	// returns a label that hopefully a human would look at and say,
	// "yeah, that's a good label for that node!"
	// getLabel should be changed to take advantage of targetType. We are redoing that work. (AC)
	// I'm making the change now for XPath nodes, and will add others later.
	getLabel : function(node, targetType) {
		if (this.DEBUGLABELER) this.d("getLabel called for a " + node.nodeName + "\n");
		var u = this.getUtils();
		var label;
		if (targetType == this.WEBTYPES.XPATH) { 
				var xpath = u.getIdXPath(node)
				return xpath
			}
		var doc = node.ownerDocument;
		var labelers = [
			this.SelectionLabeler,
			this.LinkLabeler,
			this.TextLabeler,
			this.MenuLabeler,
			this.TabLabeler,
			this.LabelLabeler,
			this.XulLabeler,
			this.OptionFieldLabeler,
			this.TextBoxLabeler,
			//this.TableCellLabeler,
			this.TableLabeler,
			this.ButtonLabeler,
			this.InputButtonLabeler,
			this.ListBoxLabeler,
			this.AreaLabeler,
			this.ImageLabeler,		// we assume ImageLabeler comes after LinkLabeler
			this.CheckBoxLabeler,
			this.DojoLabeler,				// I'm changing DojoLabeler, so hopefully it can now come before BackgroundImageLabeler (AC)
			this.BackgroundImageLabeler,	// Must come before DojoLabeler
			this.XPathLabeler,
			this.OnClickLabeler,
			this.NonUIElementLabeler,
			this.OtherLabeler
		];
		for(var i=0;i<labelers.length;i++){
			if(labelers[i].isLabelerFor(node)){
				// TL: Clemens, I'm removing the regexEscape call here because I don't think it should be done in the labeler --
				// the labeler should always return the literal label.	If we need to make it regex-safe, we ought to do that someplace else.
				label = labelers[i].getBestLabelFor(node);
				// return u.truncateLabel(label)	// limit the length of a label  // Instead, labels are now truncated in TargetSpec.toSlop()  (AC)
				return label
			}
		}
		// removing the debug warning, since onClick handlers can be found on any node, and they may well not have a labeler
		//this.debug("No Labeler in getLabel for nodeName: " + node.nodeName)
		//throw '*** NOT GOOD, WE DID NOT FIND A LABEL***\n';
		return ""
	},
	// END of getLabel
	
	regexEscape : function(str){
		if(str === null){
			return null ;
		}
		var specialChars = "\\[]{}()*^!~-/?+,.:";
		for(var i = 0 ; i < specialChars.length; i++){
			str = str.replace(new RegExp("\\"+specialChars[i],"g"),"\\"+specialChars[i]);
		}
		return str ;
	},
	
	regexUnEscape : function(str){
		if(str === null){
			return null ;
		}
		var escapedString = "" ;
		var evalString = 'escapedString = \'' + str + '\';' ;
		eval(evalString);
		return escapedString ;
	},
	
	badLabelNodeNames : {"SCRIPT" : 1, "NOSCRIPT" : 1, "#comment" : 1},
	getLabelHelper : function(node, reverse) {
		var nextNode = reverse ? node.nextSibling : node.previousSibling
		if (nextNode) {
			var text = this.getText(nextNode)
			if (this.goodString(text) && !this.badLabelNodeNames[nextNode.nodeName]) {
				return text
			} else {
				return this.getLabelHelper(nextNode, reverse)
			}
		} else if (node.parentNode) {
			return this.getLabelHelper(node.parentNode, reverse)
		} else {
			return undefined
		}
	},
	
	getLabelHelperStrict_whiteRegex : /^(\#text|B|BR|STRONG|BIG|EM|I|SMALL|SUB|SUP|IMG|FONT|H4|H3|H2|H1|TT|U|STRIKE|TT|DFN|CODE|SAMP|KBD|VAR|A|BASEFONT|LABEL)$/,
	
	getLabelHelperStrict : function(node, reverse, maxDepth) {
		if (maxDepth == undefined) {
			maxDepth = 8
		}
		if (maxDepth <= 0) {
			return null
		}
		var nextNode = reverse ? node.nextSibling : node.previousSibling
		if (nextNode) {
			node = nextNode
		
			if (this.goodString(node.textContent)) {
				if (this.badLabelNodeNames[node.nodeName]) {
					return null
				}
			
				// first, make sure there is only white-listed nodes
				var nodes = this.getUtils().getNodes(".//*", node)
				for (var i = 0; nodes && i < nodes.length; i++) {
					var n = nodes[i]
					// Why are we filtering those nodes? CD 11/6/07
					if (!n.nodeName.match(this.getLabelHelperStrict_whiteRegex)) {
						return null
					}
				}
				
				return this.getText(node, true)
			} else {
				return this.getLabelHelperStrict(node, reverse, maxDepth - 1) // I realize this isn't strictly "depth", but this is what I want
			}
		} else if (node.parentNode) {
			return this.getLabelHelperStrict(node.parentNode, reverse, maxDepth - 1)
		} else {
			return null
		}
	},
	
	// Find text to the left of an element by examining the children of this element's parent, from left to right.  
	// Also try the grandparent of this node and the great-grandparent.
	// Best is a <label> previousSibling
	getLabelLeft : function(element, numParents) {
		var parentNode = element;
		if (numParents < 1) {
			return null;
		}
		if (element.previousElementSibling && element.previousElementSibling.tagName.toLowerCase() == "label"){	// added May2011 to handle express.com SIZE: pulldown (AC)
			return element.previousElementSibling.textContent
		}
		for (var i=0; i<numParents; i++) {
			if (parentNode.parentNode) {
				element = parentNode;
				parentNode = parentNode.parentNode;
			}
		}
	
		var str = null;
		for (var i = 0; i < parentNode.childNodes.length; i++) {
			var child = parentNode.childNodes[i];
			if (child == element) {
				if (str != null) {
					return str;
				} else {
					break;
				}
			}
			var label = this.getText(child, true); // the true mean use alt text
			if (label) {
				if (str === null) {
					str = this.getUtils().trim(label);
				} else {
					str += this.getUtils().trim(label);
				}
			}
		}
	
		// couldn't find anything
		return null;
	},
	
	// Find text to the left of an element by examining the left sibling of
	// this element's parent and all its descendants.  NumParents is how high
	// to walk up the tree before finding its left sibling; if it's 0, then
	// don't walk up at all (use the element's left sib), if it's 1, then use
	// the element's parent's left sib, etc.
	getLabelLeftSibling : function(element, numParents) {
		var str = null;
		var node = element;
	
		for (var i=0; i<numParents; i++) {
			if (node.parentNode) {
				node = node.parentNode;
			}
		}
	
		var leftSib = node.previousSibling;
		while (leftSib && leftSib.nodeName == "SCRIPT") leftSib = leftSib.previousSibling;
		while (leftSib && leftSib.nodeName == "#text") {
			var label = this.getText(leftSib, true);
			if (label) {
				return this.getUtils().trim(label);
			}
			leftSib = leftSib.previousSibling;
		}
		if (leftSib) {
			var label = this.getText(leftSib, true);
			if (label) {
				return this.getUtils().trim(label);
			}
			if (str) return str;	// Added May2011 because this code looked buggy.  Maybe I'm misreading it (AC)
		}
	
		// couldn't find anything
		return null;
	},
	
	// return the leftSibling if it has visible text; 
	//use the next node to the left if leftSibling has no visible text
	//	If there is no leftSibling, try the parent's leftSibling
	getLeftSiblingWithText: function(element) {
		var leftSibling = element.previousSibling
		while (!leftSibling && element != element.parentNode) {
			element = element.parentNode
			leftSibling = element.previousSibling
		}
		while (leftSibling) {
			if (this.getText(leftSibling, true)) return leftSibling
			leftSibling = leftSibling.previousSibling
		}
		return false
	},
	
	// return the text of the firstSibling if it has visible text; 
	//use the next node to the right if firstSibling has no visible text
	//	If there is no firstSibling, try the parent's firstSibling
	getFirstSiblingWithText: function(element) {
		var firstSibling = element.parentNode.childNodes[0]
		if (firstSibling == element) {
			element = element.parentNode
			firstSibling = element.parentNode.childNodes[0]
		}
		while (firstSibling) {
			if (this.getText(firstSibling, true) && (firstSibling != element)) return firstSibling
			firstSibling = firstSibling.nextSibling
		}
		return false
	},

	//		getTableCellLabel
	//If element is in a <td>, find labels for the row, column and table; or perhaps the cell above is the label of element
	//returns either a label, or an array of [columnLabel, rowLabel, tableNumber]
	getTableCellLabel: function(element) {
		var u = this.getUtils()
		var label, prevRow
		var columnLabel, rowLabel
		var doc = u.getDocumentWithEvaluate(element)
		if (!doc) return null
		
		var cell = u.getAncestorNamed(element, "td|th") //may want to limit how far up we look
		if (!cell) return null
		var row = u.getAncestorNamed(cell, "tr")
		if (!row) return null
		var rowCells = u.getNodes('descendant::td|th', row)
		var table = u.getAncestorNamed(row, "TABLE")
		if (!table) return null
		
		// Don't process tables used solely for layout
		var dataTableP = false
		// Indications that a table is being used for data:
		//	the first row is a <th> heading row
		//	visible vertical or horizontal borders
		//	the cell's row has the same structure as the preceding and following non-empty row.
		//		that is, the cells in each column have matching structure
		
		var prevRows = u.getNodes('preceding-sibling::tr', row)
		if (prevRows) prevRow = prevRows[prevRows.length-1]
		//var rowIndex = prevRows.length
		
		// Check in the first row for a heading for the cell's column
		//Later may want to give more prominence to tables with an initial <th> heading row
		var firstRow = prevRows ? prevRows[0] : row
		var prevCells = u.getNodes('preceding-sibling::td|th', cell)
		var columnIndex = prevCells ? prevCells.length : 0
		var columnHeadingCells = u.getNodes('descendant::td|th', firstRow)
		if (columnHeadingCells) {
			if (columnHeadingCells[0].nodeName == "th" || columnHeadingCells[0].nodeName == "TH") dataTableP = true
			// (AC) eventually need to handle colspans.  For now, give up if cell's row and first row aren't the same length
			if (columnHeadingCells.length != rowCells.length) return null
			columnLabel = u.trim(this.getText(columnHeadingCells[columnIndex]))
			// dont use rowIndex+1 since first row is headers
		}
		
		// check for text in the leftmost td cell of this row
		var firstCell = u.getNode('descendant::td|th', row)
		if (firstCell) {
			label = firstCell.textContent ? firstCell.textContent : this.getText(firstCell)
			rowLabel = u.trim(label)
		}
		
		// get an index for the table
		var tableNumber = 0
		var prevTables = u.getNodes('preceding-sibling::table', table)
		if (prevTables) {
			tableNumber = prevTables.length + 1
		}
		
		if (columnLabel && rowLabel) {
			return [columnLabel, rowLabel, tableNumber]
		}
		
		//check for text in the cell above
		if (!prevRow) return null
		var prevRowCells = u.getNodes('descendant::td', prevRow)
		if (!prevRowCells) return null
		var aboveCell = prevRowCells[columnIndex]
		if (aboveCell) {
			label = aboveCell.textContent ? aboveCell.textContent : this.getText(aboveCell)
			label = u.trim(label)
			if (label) return label
		}
		
		// double-check for a text label for cell (this should be covered elsewhere)
		//var label = getText(cell)
		//if (label) return u.trim(label)
		
		// couldn't find anything
		return null
	},	//end of getTableCellLabel
	
	
	cobraPageP: function(target) {
		var u = this.getUtils()
		return (target.ownerDocument && target.ownerDocument.baseURI && target.ownerDocument.baseURI.indexOf("cobra")!=-1)
	},
	
	getTableLabel: function(table) {
		var u = this.getUtils()
		// Special case of our table in a dojo dijitContentPane with a dijitTitlePane
		var tableLabel = ""
		var dijitContentPaneContainer = u.getNode("ancestor::div[contains(string(@class),'dijitContentPane')]", table)
		if (dijitContentPaneContainer) {
			var dojoWidgetTitleNode = u.getNode("descendant::span[contains(string(@dojoattachpoint),'titleNode')]", dijitContentPaneContainer)
			if (dojoWidgetTitleNode) tableLabel = dojoWidgetTitleNode.textContent
		}
		//if (!tableLabel) tableLabel = getLabel(table) // this caused an infinite loop 
		return tableLabel
	},
	
	getMenuLabelFromCommandID: function(commandID) {
		var u = this.getUtils()
		var menuLabel = ""


		return menuLabel
	},
	
	


	// ****************************************************************************************
	// LABELERS
	// Labelers are several classes that are responsible for finding all the different labels
	// for specific input elements. Each Labeler is responsible for only one type of element.
	// Each labeler contains a ranked list of functions to generate a label from that element 
	// and a predicateFunction that determines whether the labeler is able to provide a label 
	// for a given element.
	// The order of the labeler functions is important. The first function is the most preferred 
	// label and the last is the least preferred way.
	// ****************************************************************************************
			
	LinkLabeler : new Labeler({
		name: "Link Labeler",
		labelers: [
			function(element){
				var u = this.getUtils()
				var mainParent = u.getAncestorNamed(element, "A")
				var label = this.getText(element) || this.getText(mainParent)
				return label;
			}
		],
		labelerCondition : function(element){
			var u = this.getUtils()
			var mainParent = u.getAncestorNamed(element, "A")
			if (!mainParent) return false;
			var text = this.getText(mainParent);
			if (!(text == null) && (u.trim(u.stripSpaces(text)) != "")) {
				return true;
			} else {
				return false;
			}
		}
	}),
	
	TextLabeler : new Labeler({
		name: "Text Labeler",
		labelers: [		
			function(element){
				/*
				//Is this a text selection?
				if (element.ownerDocument.defaultView.getSelection()) {
					return null
				}
				*/
				// Search backwards until you find some non-whitespace text
				// XPathResult.FIRST_ORDERED_NODE_TYPE == 9
				var u = this.getUtils()
				var doc = u.getDocumentWithEvaluate(element)
				var result = doc.evaluate("preceding::text()[normalize-space(.) != ''][1]", element, null, 9, null)
				if (result == null) {
					return null
				}
				else {
					return result.singleNodeValue.nodeValue
				}
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "#text";
		},
		getTextOrdinal : function(element) {
			var u = this.getUtils()
			var doc = u.getDocumentWithEvaluate(element)
			// XPathResults.ORDERED_NODE_ITERATOR_TYPE = 5
			var resultsIter = doc.evaluate("//text()[. = '" + element.nodeValue + "']", element, null, 5, null)
			var result = resultsIter.iterateNext()
			var index = 1;
			while (result) {
				if (result == element) {
					return u.getOrdinal(index)
				}
				result = resultsIter.iterateNext()
				index++;
			}
			return null;
		}
	}),
	
	MenuLabeler : new Labeler({
		name: "Menu Item Labeler",
		labelers: [
			function(element){
				var label = ""
				var commandName = element.getAttribute("command") || ""
				commandName = commandName.replace(/^cmd_/, "")
				commandName = commandName.charAt(0).toUpperCase() + commandName.substring(1)
				if (element.nodeName == "menu") label = element.getAttribute("label")
				else label = commandName || element.getAttribute("label")
				return label;
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "menu" || element.nodeName == "menuitem"
		}
	}),
	
	TabLabeler : new Labeler({
		name: "Tab Labeler",
		labelers: [
			function(element){
				var label = ""
				var labelChildren = element.getElementsByTagName("label")
				if (labelChildren.length > 0) {
					label = labelChildren[0].value
				}
				return label;
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "tab";
		}
	}),
	
	LabelLabeler : new Labeler({
		name: "Label Labeler",
		labelers: [
			function(element){
				return element.value
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "xul:label";
		}
	}),
	
	XulLabeler : new Labeler({
		name: "Xul Labeler",
		labelers: [
			function(element){
				var label = element.label || element.value
				if (label) return label 
				var labelChildren = element.getElementsByTagName("label")
				if (labelChildren.length > 0) return labelChildren[0].value
			}
		],
		labelerCondition : function(element){
			return (element.nodeName.slice(0,4) == "xul:") || (element.nodeName == "tab") || (element.nodeName == "toolbarbutton")
		}
	}),
		
	OptionFieldLabeler : new Labeler({
		name: "Option Field Labeler",
		labelers: [
			function(element){
				var optiontext = element.textContent
				if (null != optiontext) {
					optiontext = this.getUtils().trim(this.getUtils().stripSpaces(optiontext));
				}
				if (this.DEBUGLABELER) this.d('OptionFieldLabeler label = ' +optiontext+'\n');
				return optiontext;
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "OPTION";
		}
	}),
	
	//		TableCellLabeler
	TableCellLabeler : new Labeler({
		name: "TableCell Labeler",
		labelers: [		
			function(element){
				var label = this.getTableCellLabel(element)
				if (label) return label
				else return false
			}
		],
		labelerCondition : function(element){
			var u = this.getUtils()
			return u.getAncestorNamed(element, "td|th");
		}
	}),
	
	TableLabeler : new Labeler({
		name: "Table Labeler",
		labelers: [		
			function(element){
				return this.getText(element)
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "TABLE";
		}
	}),
	
	ButtonLabeler : new Labeler({
		name: "Button Labeler",
		labelers: [
			function(element){
				var label = this.getText(element);
				return label;
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "BUTTON";
		}
	}),
	
	/*
	DojoButtonLabeler : new Labeler({
		name: "Dojo Button Labeler",
		labelers: [
			function(element){
				var label = this.getText(element);
				return label;
			}
		],
		labelerCondition : function(element){
			return (element.nodeName == "DIV" 
							&& element.getAttribute("dojoattachevent") 
							&& element.getAttribute("dojoattachevent").indexOf("buttonClick") != -1);
		}
	}),
	*/
	
	DojoLabeler : new Labeler({
		name: "Dojo Labeler",
		labelers: [
			function(element){
				var id, content, dojoattachpoint, className, wairole;
				if (element.hasAttribute("id")) id = element.getAttribute("id")
				if (element.hasAttribute("content")) content = element.getAttribute("content")
				if (element.hasAttribute("dojoattachpoint")) dojoattachpoint = element.getAttribute("dojoattachpoint")
				if (element.hasAttribute("class")) className = element.getAttribute("class")
				if (element.hasAttribute("wairole")) wairole = element.getAttribute("wairole")
				return null;
			}, 
			function(element){
				var label = ""
				var textNode = null;
				//if (element.className.indexOf("dijitTitlePaneTitle") != -1)
				if (element.hasAttribute("wairole")) {
					// see if there is a child TextNode (eg className contains 'dijitTitlePaneTextNode')
					textNode = this.getUtils().getDojoTextNode(element)
					if (textNode) label = this.getText(textNode)
				}
				else label = this.getText(element);
				return label;
			}
		],
		labelerCondition : function(element){
			return this.getUtils().hasDojoParentP(element);
		}
	}),
	
	InputButtonLabeler : new Labeler({
		name: "Input Button Labeler",
		labelers: [
			function(element){
				// Check for value attribute first
				if (element.hasAttribute("value")) {
					var label = this.getUtils().stripSpaces(element.getAttribute("value"));
					return label;
				}
			}, 
			function(element){
				// Technically the "correct" recorder should not use this, but
				// some older scripts do
				if (element.hasAttribute("title")) {
					var label = this.getUtils().stripSpaces(element.getAttribute("title"));
					return label;
				}
			},
			function(element){
				if(element.hasAttribute('type') && element.getAttribute('type').toLowerCase() == "image"){
					if(element.getAttribute('alt') != null ){
						return element.getAttribute('alt');
					}else if (element.hasAttribute('src')) {
						var img_path = element.getAttribute('src');
						var filename = this.filenameComponent(img_path);
						return filename;
					}
				}
			}
		]	,
		labelerCondition : function(element){
			// this labeler is resposible for all INPUT type buttons that are not of type image
			var result = ( element.nodeName == "INPUT" &&
				element.getAttribute('type') != null && 
				( element.getAttribute('type').toLowerCase() == "submit" ||				 
				  element.getAttribute('type').toLowerCase() == "button" ||				 
				  element.getAttribute('type').toLowerCase() == "image"  ||					 
				  element.getAttribute('type').toLowerCase() == "reset" ));
			return result;
		}
	}),
	
	
	ListBoxLabeler : new Labeler({
		name: "ListBox Labeler",
		labelers: [
			function(element){
				// Look for a label
				if (element.hasAttribute('id')) {
					var label = this.getLabelForElementId(element.ownerDocument, element.getAttribute('id'));
					if (label) {
						var labeltext = this.getText(label);
						if (labeltext && this.DEBUGFTE) this.d('Listbox has label: ' + labeltext + '\n');
						return labeltext;
					}
				}
			}, 
			function(element){
				// Next, look for text to the left of the listbox
				var strictLabel = this.getLabelHelperStrict(element, false, 1);
				if (strictLabel && this.DEBUGFTE)
					this.d('listbox strictlabel: ' + strictLabel + '\n');
				return strictLabel;
			}, 
			function(element){
				// Try our left siblings in the DOM tree
				var leftText = this.getLabelLeft(element, 1);
				if (leftText && this.DEBUGFTE)
					this.d('listbox leftText: ' + leftText + '\n');
				if (leftText) return leftText;
	
				leftText = this.getLabelLeft(element, 2);
				if (leftText && this.DEBUGFTE)
					this.d('listbox leftText: ' + leftText + '\n');
				return leftText;
			}, 
			function(element){
				// Try the first value in the listbox
				var option = element.ownerDocument.evaluate(".//OPTION", element, null, 9, null);
				if (option.resultType == 9) {
					var elt = option.singleNodeValue;
					if (elt) {
						var optiontext = this.getUtils().trimAndStrip(elt.textContent);
						if (optiontext != "") {
							return optiontext;
						}
					}
				}
			}, 
			function(element){
				// We're really desperate; try walking up the tree and finding
				// any text whatsoever
				var anyText = this.getLabelHelperStrict(element, false, 8);
				if (anyText && this.DEBUGFTE) this.d('anyText: ' + anyText + '\n');
				return anyText;
			}
		],
		labelerCondition : function(element){
			return element.nodeName == "SELECT";
		}
	}),

	//		SelectionLabeler
	SelectionLabeler : new Labeler({
		name: "Selection Labeler",
		labelers: [
			/*
				Best: selection is the textContent of the target, 2nd Best: the first word of the textContent, 3rd Best: a part of the textContent
				Best: target is in a list which is a row of a table, 2nd Best: list is a <ul> list, 3rd Best: list is items in a span
				Best: label is previous entry, which is also the first entry, 2nd Best: previous entry, 3rd Best: first entry
				Best: label ends in :
				
				Algorithm:	
					First see if the Selection is part of a cell of a table, using getTableCellLabel.
					Next, look at the textContent of the Selection's left sibling, and its leftmost sibling. If one ends in a ":", it's the label.
					Else, prefer the left sibling.
					Failing that, consider the Selection as part of the textContent of its parent, then grandparent. 
						Look at that ancestor's left- and leftmost- siblings.
					An improvement would be to see if a parent or grandparent is in a <ul> list, and to prefer that
			 */
			function(element){
				var label = this.getTableCellLabel(element)
				if (label) return label
				else return false
			}, 
			function(element){
				// Next, look at the textContent of the Selection's left sibling, and its leftmost sibling. 
				//If one ends in a ":", it's the label.
				var leftTextSibling = this.getLeftSiblingWithText(element)
				var leftSiblingText = leftTextSibling ? leftTextSibling.textContent : null
				var leftSiblingColonP = leftSiblingText ? leftSiblingText.match(/:[\s]*$/i) : null
				var firstTextSibling = this.getFirstSiblingWithText(element)
				var firstSiblingText = firstTextSibling ? this.getText(firstTextSibling, false) : null
				var firstSiblingColonP = firstSiblingText ? firstSiblingText.match(/:[\s]*$/i) : null
				var label = null
				if (leftSiblingColonP) label = leftSiblingText
				else if (firstSiblingColonP) label = firstSiblingText
				else if (firstSiblingText) label = firstSiblingText
				else if (leftSiblingText) label = leftSiblingText
				if (label) {
					return this.getUtils().trim(label);
				}
				return false;
			}, 
			function(element){
				// Try our left siblings in the DOM tree
				var leftText = this.getLabelLeft(element, 1);
				if (leftText && DEBUGFTE)
					d('listbox leftText: ' + leftText + '\n');
				if (leftText) return leftText;
	
				leftText = this.getLabelLeft(element, 2);
				if (leftText && DEBUGFTE)
					d('listbox leftText: ' + leftText + '\n');
				return leftText;
			}, 
			function(element){
				// Try the first value in the listbox
				var option = element.ownerDocument.evaluate(".//OPTION", element, null, 9, null);
				if (option.resultType == 9) {
					var elt = option.singleNodeValue;
					if (elt) {
						var optiontext = this.getUtils().trimAndStrip(elt.textContent);
						if (optiontext != "") {
							return optiontext;
						}
					}
				}
			}, 
			function(element){
				// We're really desperate; try walking up the tree and finding
				// any text whatsoever
				var anyText = this.getLabelHelperStrict(element, false, 8);
				if (anyText && DEBUGFTE) d('anyText: ' + anyText + '\n');
				return anyText;
			}
		],
		labelerCondition : function(element){
			var textNodeP = element.nodeName == "#text"
			var selectionP = element.ownerDocument.defaultView.getSelection()
			return (textNodeP && selectionP);
		}
	}), // end of SelectionLabeler

	
	// Labeler for <area> tags inside an imagemap
	AreaLabeler : new Labeler({
		name: "Area Labeler",
		labelers: [
			function(element) {
				// Look for an alt tag inside the AREA
				if (element.hasAttribute('alt')) {
					var label = element.getAttribute('alt');
					if (label && this.DEBUGLABELER) this.d("Area has alt: " + label + "\n");
					return label;
				}
			}
		],
		labelerCondition : function(element) {
			return element.nodeName == "AREA";
		}
	}),
	
	// Labeler for <a> tags that don't have any text in them but do contain
	// images
	ImageLabeler : new Labeler({
		name: "Image Labeler",
		labelers: [
			function(element){
				// TL: sometimes the <a> tag has a title attribute
				// which gets rendered as the hovertext for the image
				// button, so try that first.
				var u = this.getUtils();
				if (element.hasAttribute("title")) {
					var label = u.trimAndStrip(element.getAttribute("title"));
					if (label && this.DEBUGFTE)
						this.d('<A> containing img has title: ' + label + '\n');
					return label;
				}
			},
			function(element){
				// The only thing I've found so far is text in the grandparent
				// But I'll try alt text and title first
				// Loop through all image children of this <a> node
				var u = this.getUtils();
				var xpath = ".//IMG";
				var doc = u.getDocument(element);
				var result = doc.evaluate(xpath, element, null, 5, null);
				var elt;
				while (elt = result.iterateNext()) {
					if (elt.hasAttribute("title")) {
						var label = u.trimAndStrip(elt.getAttribute("title"));
						if (label && this.DEBUGFTE) this.d('Image has a title: ' + label + '\n');
						return label;
					}
				}
			}, 
			function(element){
				var u = this.getUtils();
				var xpath = ".//IMG";
				var doc = u.getDocument(element);
				var result = doc.evaluate(xpath, element, null, 5, null);
				var elt;
				while (elt = result.iterateNext()) {
					if (elt.hasAttribute("alt")) {
						var label = u.trimAndStrip(elt.getAttribute("alt"));
						if (label && this.DEBUGFTE) this.d('Image has alt text: ' + label + '\n');
						return label;
					}
				}
			}, 
			function(element){
				var u = this.getUtils();
				var xpath = ".//IMG";
				var doc = u.getDocument(element);
				var result = doc.evaluate(xpath, element, null, 5, null);
				var elt;
				while (elt = result.iterateNext()) {
					if (elt.hasAttribute('name')) {
						return elt.getAttribute('name');
					}
				}
			},
			function(element){
				// Otherwise, we try for text nearby
				// Look for text to the left
				var strictLabel = this.getLabelHelperStrict(element, false, 1);
				if (strictLabel && this.DEBUGFTE) this.d('Image has left text: ' + strictLabel + '\n');
				return strictLabel;
			}, 
			function(element){
				// Try our left siblings in the DOM tree
				var leftText = this.getLabelLeft(element, 1);
				if (leftText && this.DEBUGFTE) this.d('Image has left sibling text (height 1): ' + leftText + '\n');
				if (leftText) return leftText;
	
				leftText = this.getLabelLeft(element, 2);
				if (leftText && this.DEBUGFTE) this.d('Image has left sibling text (height 2): ' + leftText + '\n');
				if (leftText) return leftText;
	
				leftText = this.getLabelLeft(element, 3);
				if (leftText && this.DEBUGFTE) this.d('Image has left sibling text (height 3): ' + leftText + '\n');
				if (leftText) return leftText;

				return null;
			}, 
			function(element){
				if (element.parentNode.nodeName == "A") {
					// Try again with the parent <A> tag
					var strictLabel = this.getLabelHelperStrict(element.parentNode, false, 1);
					if (strictLabel && this.DEBUGFTE) this.d('Image has left text: ' + strictLabel + '\n');
					return strictLabel;
				}
			}, 
			function(element){
				// If we get here we're desperate, so try the image filename
				var u = this.getUtils();
				var xpath = ".//IMG";
				var doc = u.getDocument(element);
				var result = doc.evaluate(xpath, element, null, 5, null);
				var elt;
				while (elt = result.iterateNext()) {
					if (elt.hasAttribute('src')) {
						var img_path = elt.getAttribute('src');
						var filename = this.filenameComponent(img_path);
						return filename;
					}
				}
			}
		],
		// We assume that the LinkLabeler has already checked for the presence
		// of text in the link, so we don't check for that here to speed things
		// up.	What we check for is the presence of at least one <img> inside
		// the <a> tag.
		labelerCondition : function(element){
			var u = this.getUtils();
			var anchorParent = u.getAncestorNamed(element, "A");
			var imageChildren = anchorParent ? u.getNode(".//IMG", anchorParent) : null;
			return (imageChildren != null);
		}
	}), // end of ImageLabeler
	
	//		TextBoxLabeler
	TextBoxLabeler : new Labeler({
		name: "Textbox Labeler",
		labelers: [
			function(element){
				if (element.hasAttribute('id')) {
					var label = this.getLabelForElementId(element.ownerDocument, element.getAttribute('id'));
					if (label) {
						var labeltext = this.getText(label);
						if (this.DEBUGFTE) this.d('labeltext: ' + labeltext + '\n');
						return labeltext;
					}
				}
				return null;
			}, 
			function(element){
				// Look for a <label> node surrounding the target element
				// This finds the "first ordered node", whatever that means; if
				// there is more than one label enclosing the element I'm not
				// sure which one to use anyway.  If that happens maybe this
				// code should be changed to iterate and check them all.
				var parentLabel = element.ownerDocument.evaluate("ancestor::label", element, null, 9, null).singleNodeValue;
				if (parentLabel) {
					var labeltext = this.getText(parentLabel);
					if (this.DEBUGFTE) this.d('enclosing labeltext: ' + labeltext + '\n');
					return labeltext;
				}
				return null;
			}, 
			function(element){
				// Some text entry fields have a title, like the google
				// homepage
				if (element.hasAttribute("title")) {
					var label = this.getUtils().stripSpaces(element.getAttribute("title"));
					if (this.DEBUGFTE) this.d('title attribute: ' + label + '\n');
					if (label) return label;
				}
				return null;
			}, 
			function(element){
				try {
					// for tabpanels, use the label of the corresponding tab
					element = element.parentNode.parentNode
					//this.debug("TextBoxLabeler. element id is: " + element.id)
					var ancestors = element.ownerDocument.evaluate('ancestor::*', element, null, 7, null)
					var ans = ""
					for (var i=0; i<ancestors.snapshotLength; i++) ans += ">" + ancestors.snapshotItem(i).tagName
					//this.debug("TextBoxLabeler. ancestors are: " + ans)
					var tabpanels = element.ownerDocument.evaluate('ancestor::tabpanels', element, null, 9, null).singleNodeValue
					// the above doesn't work, so for now:
					var tabpanels = element.parentNode
					//this.debug("TextBoxLabeler. tabpanels has id: " + tabpanels.id)			
					if (!tabpanels) return null
					if (tabpanels.tagName != "tabpanels") return null
					//var myIndex = tabpanels.childNodes.indexOf(element)
					for (var myIndex=0; myIndex<tabpanels.childNodes.length; myIndex++) {
						if (tabpanels.childNodes[myIndex] == element) break
					}
					var tabbox = tabpanels.parentNode
					if (!tabbox || tabbox.nodeName != "tabbox") return null
					var tabs = tabbox._tabs // kludge for now until I get xpath working
					var myTab = tabs.childNodes[myIndex]
					var label = myTab.firstChild	// kludge for now until I get xpath working
					return label.value
				} catch (e) {
					return null;
				}
			}, 
			function(element){
				// Otherwise, look for text to the left
				// Try our left siblings in the DOM tree
				// We can't just use getLabelLeft because this covers the situation where you have:
				// <form> ... lots of stuff ...  My label: <input type="text"> </form>
				// And there's no parent node surrounding just the label and the textbox.
				// TL TODO: this should return null, not undefined
				var strictLabel = this.getLabelHelperStrict(element, false, 1);
				if (strictLabel && this.DEBUGFTE) this.d('strictLabel: ' + strictLabel + '\n');
				return strictLabel;
			}, 
			function(element){
				var siblingText = this.getLabelLeftSibling(element, 0);
				if (siblingText && this.DEBUGFTE) this.d('siblingText: ' + siblingText + '\n');
				if (siblingText) return siblingText;
	
				// This walks up the tree and looks at the full textual content
				// under the parent node
				var leftText = this.getLabelLeft(element, 1);
				if (leftText && this.DEBUGFTE) this.d('leftText: ' + leftText + '\n');
				if (leftText) return leftText;
	
				siblingText = this.getLabelLeftSibling(element, 1);
				if (siblingText && this.DEBUGFTE) this.d('siblingText: ' + siblingText + '\n');
				if (siblingText) return siblingText;
	
				// This walks up the tree and looks at the full textual content
				// under the grandparent node
				leftText = this.getLabelLeft(element, 2);
				if (leftText && this.DEBUGFTE) this.d('leftText: ' + leftText + '\n');
				if (leftText) return leftText;
	
				siblingText = this.getLabelLeftSibling(element, 2);
				if (siblingText && this.DEBUGFTE) this.d('siblingText: ' + siblingText + '\n');
				if (siblingText) return siblingText;
	
				return null;
			},
			function(element){
				var tableLabel = this.getTableLabel(element);
				if (tableLabel && this.DEBUGFTE) this.d('tableLabel: ' + tableLabel + '\n');
				return tableLabel;
			}, 
			function(element){
				// We're really desperate; try walking up the tree and finding
				// any text whatsoever
				if (this.DEBUGFTE) this.d('TextBoxLabeler falling back on anyText\n');
				var anyText = this.getLabelHelperStrict(element, false, 10);
				if (anyText && this.DEBUGFTE) this.d('anyText: ' + anyText + '\n');
				return anyText;
			}
		],
		labelerCondition : function(element){
			var nodeName = element.nodeName.toLowerCase()
			var inputNodeP = (nodeName == "input" || nodeName == "html:input")
			var elementType = element.getAttribute("type") ? element.getAttribute("type").toLowerCase() : null
			return (	inputNodeP && (elementType == null || elementType == "text" || elementType == "password" || elementType == "file")	//"file" is used by lotusText widgets
						|| nodeName == "textarea" || nodeName == "html:textarea" 
						|| nodeName == "textarea"
						|| element.getAttribute("targetType") == "textbox"	  // so widgets can use the TextBoxLabeler
					)
		}

	}), // end of TextBoxLabeler
	
	CheckBoxLabeler : new Labeler({
		name: "Checkbox Labeler",
		labelers: [
			function(element){
				// Look for a label
				if (element.hasAttribute('id')) {
					var label = this.getLabelForElementId(element.ownerDocument, element.getAttribute('id'));
					if (label) {
						var labeltext = this.getText(label);
						return labeltext;
					}
				}
				return null;
			}, 
			function(element){
				// Otherwise, look for text to the right
				var strictLabel = this.getLabelHelperStrict(element, true, 1);
				return strictLabel;
			}, 
			function(element){
				// and to the left
				var strictLabel = this.getLabelHelperStrict(element, false, 1);
				return strictLabel;
			}, 
			function(element){
				// And try siblings to the right
				var strictLabel = this.getLabelHelperStrict(element, true, 2);
				return strictLabel;
			}, 
			function(element){
				// and to the left
				var strictLabel = this.getLabelHelperStrict(element, false, 2);
				return strictLabel;
			},
			function(element){
				// and see if the checkbox is in the first column of a row of a table
				var rowCheckBoxP = element.parentNode && element.parentNode.nodeName && element.parentNode.nodeName.toLowerCase() == "td"
				
				var strictLabel = this.getLabelHelperStrict(element, false, 2);
				if (rowCheckBoxP) {
					var nextCell = element.parentNode.nextElementSibling
					if (nextCell) {
						var siblingTextContent = element.parentNode.nextElementSibling.textContent
						if (siblingTextContent && siblingTextContent != "") return siblingTextContent;
					}					
				}
				return false;
			}
		],
		labelerCondition : function(element){
			var inputCheckBoxP = element.nodeName == "INPUT" && element.getAttribute('type') != null && 
					(element.getAttribute('type').toLowerCase() == this.WEBTYPES.CHECKBOX || element.getAttribute('type').toLowerCase() == "radio")
			return inputCheckBoxP
		}
	}), // end of CheckBoxLabeler
	
	NonUIElementLabeler : new Labeler({
		name: "NonUIElement Labeler",
		labelers: [
			function(element){
				return "";
			}
		],
		labelerCondition : function(element){
			return element.targetType == this.WEBTYPES.NONUIELEMENT;
		}
	}),

	// If the div has a background image, try to use its image filename
	BackgroundImageLabeler : new Labeler({
		name: "BackgroundImageLabeler",
		labelers: [
			function(element) {
				if (this.DEBUGLABELER) this.d('BackgroundImageLabeler getting style for ' + element + '\n');
				var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
				var img_path = style.backgroundImage;
				img_path = img_path.replace(/^url\(([^\)]*)\)$/, "$1");
				img_path = this.filenameComponent(img_path);
				if (this.DEBUGLABELER) this.d('   image filename: ' + img_path + '\n');
				return img_path;
			}
		],
		labelerCondition : function(element) {
			var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
			return (style && style.backgroundImage != '' && style.backgroundImage != "none");
		}
	}),
	
	XPathLabeler : new Labeler({
		name: "XPath Labeler",
		labelers: [
			function(element){
				var u = this.getUtils();
				var label = u.getIdXPath(target)
				return label
			}
		],
		labelerCondition : function(element){
			return element.targetType == this.WEBTYPES.XPATH;
		}
	}),
		
	OnClickLabeler : new Labeler({
		name: "OnClick Labeler",
		labelers: [
			function(element){
				var textContent = element.textContent
				return (textContent && textContent != "") ? textContent : null
			}
		],
		labelerCondition : function(element){
			return (element.getAttribute("onClick") != null || element.getAttribute("mxevent") != null);	//mxevent is for Maximo.  Should be moved to custom code area
		}
	}),
		
	OtherLabeler : new Labeler({
		name: "Other Labeler",
		labelers: [
			function(element){
				return "";
			}
		],
		labelerCondition : function(element){
			return element.targetType == this.WEBTYPES.OTHER;
		}
	}),
	
	
	// **************************************************************************************** 
	// 
	// END OF LABELERS
	//
	// ****************************************************************************************
	
	
	// **************************************************************************************** 
	// 
	// DOM utility function only needed for labeling
	//
	// ****************************************************************************************
	
	//	getText
	// replacement for node.textContent; works a little better in a couple instances.
	// For example, it will include the "alt" text for images in the resulting string,
	// and it will put spaces between bits of text that are separated by formatting but not by any actual space characters 
	// (like <tr><td>Hello</td><td>World</td></tr>), for which textContent would return "HelloWorld"
	getText : function(node, useAltP) {
		var buf = []
		var bufStr	= ""
		var u = this.getUtils();
		function myPush(text) {
			text = text.replace(/<!\-\-(\-[^-]|[^-])*\-\->/g, "")  // remove comments
			// TL: Replace newlines and carriage returns with spaces
			text = text.replace(/[\r|\n]+/, ' ')
			text = u.trim(text)
			if (text.length > 0) {
				buf.push(text)
			}
		}
		var document = node.ownerDocument
		var pathElements, pathElement
	
		var textDescendantSelector =	". | descendant::text()[not(ancestor::noscript) and not(ancestor::style)]"
		// BUG #76788
		// This XPath selects all text nodes but avoids nodes within noscript tags. 
		// These can be alternate versions the heads of <A> tags and look ugly when put into the slop. 
		// We assume that most everyone has Javascript. If there is someone who has Javascript turned off 
		// AND they click on a link or button with a NOSCRIPT tag in it AND there is not other text, they might have a problem.
		
		var textPathElements = document.evaluate( textDescendantSelector , node, null, 0, null)
		
		pathElements = textPathElements
		var pathElementsList = []
		while (pathElement = pathElements.iterateNext()) {
			pathElementsList.push(pathElement)
		}
		for (var i = 0, n = pathElementsList.length; i < n; i++) {
			pathElement = pathElementsList[i]
			if ((pathElement.parentNode.nodeName != "OPTION" && pathElement.parentNode.nodeName != "INPUT" && pathElement.parentNode.nodeName != "TEXTAREA" && pathElement.parentNode.nodeName != "SELECT" && pathElement.parentNode.nodeName != "NOSCRIPT" && pathElement.parentNode.nodeName != "SCRIPT")) {
				// Excluded SELECT for the MLlisting bug which mislabelled the 'Number of properties per page' listbox. AC
				if (pathElement.nodeName == "#text") {
					myPush(this.getUtils().trim(pathElement.textContent))
				} else {
					if (pathElement.getAttribute && pathElement.getAttribute("alt")) {
						myPush(pathElement.getAttribute("alt"))
					}
				}
			}
		}
		if (buf.length>0) {
			return buf.join(" ")
		}
	
		if (!useAltP) return null;
		// Otherwise, try to find alt tags
		var altElements = document.evaluate(".//*[@alt]", node, null, 0, null)
	
		//used to be buf[0], which works badly for Cisco call forward.
		//the a link has first child a bold tag on "Forward" and second child a text node " all calls to a different number" 
		// scripts to test:
		// Forward All Phone Calls to Home:  
		//# click the �Forward� link
		//# turn on the �Forward all incoming calls on line 1� checkbox
		//test script: Check for Wii
		//# click the �Nintendo Wii��s �Nintendo Wii� link
		//Order business cards:
		//click "79847"'s order link
		//Adding stuff not in the SHI catalog (improved):
		//# "search by commodity's" search button
		
		
		buf = []
		pathElements = altElements
		while (pathElement = pathElements.iterateNext()) {
			if ((pathElement.parentNode.nodeName != "OPTION" && pathElement.parentNode.nodeName != "INPUT" && pathElement.parentNode.nodeName != "TEXTAREA" && pathElement.parentNode.nodeName != "SELECT")) {
				// Excluded SELECT for the MLlisting bug which mislabelled the 'Number of properties per page' listbox. AC
				if (pathElement.nodeName == "#text") {
					myPush(this.getUtils().trim(pathElement.textContent))
				} else {
					if (pathElement.getAttribute && pathElement.getAttribute("alt")) {
						myPush(pathElement.getAttribute("alt"))
					}
				}
			}
		}
		bufStr = buf.join(" ")
	
		if (buf.length>0) return buf[0]
		else return "" 
	},
	
	
	// Given an HTML element id, find a <label for="id">
	getLabelForElementId : function(doc, element_id) {
		xpath = "//LABEL[@for='" + element_id + "']";
		// 9 is XPathResult.FIRST_ORDERED_NODE_TYPE
		var labelresult = doc.evaluate(xpath, doc, null, 9, null);
		if (labelresult.resultType == 9) {
			return labelresult.singleNodeValue;
		}
		return null;
	},
	
	
	// **************************************************************************************** 
	// 
	// End of DOM utility function 
	//
	// ****************************************************************************************
	
	
	// **************************************************************************************** 
	// 
	// String utility function 
	//
	// ****************************************************************************************
	
	// makes sure a string is non-null, and has visible (non-whitespace) content
	goodString : function(s) {
		return s && s.match(/\S/)
	},
}
var labeler = new CoScripterLabeler();
