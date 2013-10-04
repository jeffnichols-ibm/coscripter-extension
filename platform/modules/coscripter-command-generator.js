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
//dump('Parsing coscripter-command-generator.js component\n');

// /////////////////////////////////////
// We are using a pipeline architecture for the event
// listening framework. An approximate diagram is shown
// below:
//
// --------    ---------------    -----------    --------------
// |      |    | coscripter- |    |         |    |coscripter- |
// | YULE |--->| command-    |--->| filters |--->|command-    |-->UI
// |      |    | generator   |    |         |    |processor   |
// --------    ---------------    -----------    --------------
//
// This module, coscripter-command-generator, takes events
// generated from the YULE framework and converts them into
// CoScripter command objects.
//
// These command objects are defined in coscripter-command.js.
//
// The pipeline includes an optional set of filters that post-process the
// results of the command-generator before they are delivered to the
// command-processor.  For example, one filter hides the password in Enter
// commands so that it is not displayed in the slop.
//
// For PbD (i.e. when the 'contextP' preference is true), there is only going to be one Listener to receive CoScripter command objects from the CoScripterCommandGenerator,
// That Listener is only going to listen while recording, or executing a step, (I'll later do something special about auto-advance),
// so unlike the non-pbd approach, I don't need to attach a listener when New is clicked or a script is loaded into the sidebar.
// (which is when registerToReceiveRecordedCommands is called)
// /////////////////////////////////////
// ///////////////////////////////////////////////
//		
// init
// Listener Management
// startNotification
// addListener
// handleEvent
//	_onGoto
//		getCustomTargetInfo
// _onClick
// _onAssert
//	_onCoScripterDojoOnChange
//	_onChange
//	_onCommand
//	_onFocus
//
// other XPCOM components
//
// ///////////////////////////////////////////////

Components.utils.import("resource://coscripter-platform/component-registry.js")
var EXPORTED_SYMBOLS = ["commandGenerator"]
const nsISupports = Components.interfaces.nsISupports	// XPCOM registration constant
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage("coscripter-command-generator.js: " + msg )
	if(Preferences.DO_DUMP_DEBUGGING) dump("coscripter-command-generator.js: " + msg + "\n")
}

debug('parsing');

// Command Generator
function CoScripterCommandGenerator() {

	//////////////////////////////////////////
	// Define Member Variables Here
	// ////////////////////////////////////////

    // Component registry
    this.components = registry;

	// a list of the listeners to this component
	this._listeners = []; 
	
	// this callback registered with YULE
	this._yuleCallbackMethod = null;
	
	// a flag that controls whether we are notifying our
	// listeners when we receive events
	this._notifying = true;

	// variables for tracking the previous value of a text box
	// before it is changed
	this._currentTextbox = null;
	this._textboxTextBefore = "";

	// this variable stores a find command that is waiting for a timeout
	// to elapse before recording
	this._findCommandInWaiting = null;

	// a flag to make sure we don't initialize more than once
	this._initialized = false;

	// initialize the object
	this._initialize();

    this.wrappedJSObject = this;

    
    return this;
}


CoScripterCommandGenerator.prototype = {

	///////////////////////////////////////////////////////////////////
	// Constants
	// /////////////////////////////////////////////////////////////////
  

	// /////////////////////////////////////////////////////////////////
	// Member Methods
	// /////////////////////////////////////////////////////////////////
  
  	// init
  	//
  	// This method sets up the connection between this component and YULE
  	_initialize : function()
  	{
  		this._subscribe();
  	},
  	
	// subscribe to receive certain types of events from YULE
  	_subscribe : function()
  	{
  		// do nothing if we are already subscribed
  		if (this._yuleCallbackMethod == null)
  		{  	
	  		var yule = this.components.yule()
	  		
	  		var commandGenerator = this;
	  		this._yuleCallbackMethod = function(event)
	  		{
	  			commandGenerator.handleEvent.apply(commandGenerator, [event]);
	  		}
	  		
	  		// TODO: Add any additional events that are needed
	  		// TODO: Make sure this line matches the line in unsubscribe
	  		this.components.yule().subscribe(  this._yuleCallbackMethod, "mousedown", "click", "change" , "find", "PageNavigationEvent", "ReloadEvent", "TabChangeEvent", "command", "LoadURIEvent", "focus");
	  	}
  	},
  	
  	_unsubscribe : function()
  	{
  		// do nothing if we are not subscribed
  		if (this._yuleCallbackMethod != null)
  		{  			
  			// TODO: Make sure this line matches the one above in subscribe
	  		this.components.yule().unsubscribe(this._yuleCallbackMethod, "mousedown", "click", "change", "find", "PageNavigationEvent", "ReloadEvent", "TabChangeEvent", "command", "LoadURIEvent", "focus");
			this._yuleCallbackMethod = null;
  		}
  	},


	////////////////////////////////////////////////////////////////////////////////
	// Listener Management Methods
	
	// For instance, command-processor's receiveRecordedCommand method is a listener
	
	// startNotification
	startNotification : function()
	{
		this._notifying = true;
	},

	stopNotification : function()
	{
		this._notifying = false;
	},
	
	//	addListener
	addListener : function(listener)
	{
		// vegemite mistakenly registers twice
		if (!this.components.utils().inArrayP(listener, this._listeners)) 
		{
			var oldLength = this._listeners.length;
		
			this._listeners.push(listener);
			
			// subscribe if we didn't previously have any listeners
			if (oldLength == 0)
			{
				this._subscribe();
			}
		}
	},
	
	removeListener : function(listener)
	{
		var foundListener = null;
		var idx = this._listeners.indexOf(listener);
		if (idx >= 0)
		{
			foundListener = this._listeners.splice(idx, 1);

			// unsubscribe if we have no listeners
			if (this._listeners.length == 0)
			{
				this._unsubscribe();
			}
		}
		
		return foundListener;
	},
	
	_clearAllListeners : function()
	{
		this._listeners = [];
		this._unsubscribe();
	},

	_notifyListeners : function(commandObj)
	{
		//this.debug("coscripter-command-generator:  _notifyListeners: # listeners is " + this._listeners.length)
		var numberOfListeners = this._listeners.length
		for(var i = 0; i < numberOfListeners; i++)
		{
			(this._listeners[i])(commandObj);
		}
	},


	////////////////////////////////////////////////////////////////////////////////
	// Handles events as they arrive from YULE, creates corresponding CoScripter Command
	// objects, and notifies any listeners (e.g. receiveRecordedCommand is a listener) with these objects as they are created.
	// 'event' is a Yule Event object, which contains:
	// a reference to the target (which itself contains a reference to the target's contentWindow),
	// the "type" of the event (e.g. "click" or "LocationBarChangeEvent"), and
	// a Yule-generated browserID (which is unique for the FFox session).
	//
	// handleEvent
  	handleEvent : function(event)
  	{
  		// don't bother processing if we aren't notifying anyone
  		if (!this._notifying || this._listeners.length == 0) return;
		//this.debug("generator is handling an event of type " + event.type)
		var commandObj = null;
		var commands = this.components.commands();
		var u = this.components.utils();

		// dispatch any waiting find notifications if one is waiting
		if (this._findCommandInWaiting != null && event.type != "find")
		{
			this._notifyListeners(this._findCommandInWaiting);
			this._findCommandInWaiting = null;
		}

		// get labels
		// get ordinals
		var eventType = event.type
		switch(eventType)
		{
			//case "mouseover":
				//commandObj = this._onAssert(event);
				//break;

			case "click":
				commandObj = this._onClick(event);
				break;
				
			case "mousedown":
				commandObj = this._onMouseDown(event);
				break;
				
			case "change":
			    commandObj = this._onChange(event);
			    break;
			    
			case "CoScripterDojoOnChange":
			    commandObj = this._onCoScripterDojoOnChange(event);
			    break;
			    
			case "focus":
				// this doesn't currently return a command object
				// (just saves data for a later change event)				
				this._onFocus(event);				
				break;
				
			case "LocationBarChangeEvent":
			case "LoadURIEvent":
				commandObj = this._onGoto(event);
				break;	
			
			case "find":
				commandObj = this._onFind(event);
				break;

			case "PageNavigationEvent":
				// NOTE: This code skips out on the post-processing step below,
				// because it may need to generate multiple command objects and
				// none of these objects have labels
				commandObj = commands.createGoforwardFromParams(event, 
				                          event.isForward() ? 
				                              commands.GoforwardCommand.prototype.FORWARD : 
				                              commands.GoforwardCommand.prototype.BACK );

				// notify our listeners about the first event
				this._notifyListeners(commandObj);

				// notify them about any subsequent events
				if (event.hasMoreThanOneStep())
				{
					for(var i = 1; i < event.getNumberOfSteps(); i++)
					{
						this._notifyListeners(commandObj);
					}
				}
				
				// skip post-processing below
				commandObj = null;
				
				break;

			case "ReloadEvent":
				commandObj = commands.createReloadFromParams(event);
				break;
				
			case "TabChangeEvent":
				break;
			
			case "command":
				commandObj = this._onCommand(event);
				break;
				
			default:
				// do nothing for now
				break;  		
		}
		
		//if(commandObj)this.debug("commandObj has action/label/targetType = " + commandObj.getAction() + "/" + commandObj.getTargetLabel() + "/" + commandObj.getTargetType())
		
		// TL: this must be the root document if the page has frames, otherwise ordinal generation will not work correctly.
		var u = this.components.utils()
		var contentWindow = null
		
		if (event.target && event.target.ownerDocument && event.target.ownerDocument.defaultView) {
			contentWindow = u.getWindowRoot(event.target.ownerDocument.defaultView)
		}
		
		// Get information about the window
		if (commandObj && commandObj.hasTargetSpec()) {
			var targetSpec = commandObj.targetSpec
			targetSpec.windowId = event.windowID
		    try {
		        //if (contentWindow && contentWindow.document.documentElement.nodeName == "dialog"){
		        if (contentWindow && contentWindow.document.documentElement && contentWindow.document.documentElement.baseURI
							 && contentWindow.document.documentElement.baseURI.indexOf("commonDialog.xul") == "commonDialog.xul".length){
		           targetSpec.windowType = "dialog"
				   this.debug("handleEvent has dialog baseURI")
		        }
				if (contentWindow) {
					targetSpec.windowName = contentWindow.name || contentWindow.document.title	// Note that this gives the FFox Pref window the name "Preferences" (AC)
					//targetSpec.windowType = contentWindow.document.documentElement.nodeName	// this produced unwanted "dialog" types for pref windows
				}
				commandObj.tabNumber = null	// todo
		    } catch (e) {
				this.debug('command-generator: Error getting window information: ' + e + '\n');
		    }
		}
		
		// perform any command object post-processing and notify our 
		// listeners if we have an obj to give them
		var labeler = this.components.labeler()
		if (commandObj != null && commandObj.targetSpec != null && commandObj.targetSpec.targetType != "ignore" )
		{
			if (commandObj.hasTargetSpec() && 
				// commandObj.targetSpec.targetType != "item" && 
				commandObj.targetSpec.targetType != "menu" && // skip for menus
				commandObj.targetSpec.targetType != "menuitem" && // skip for menus
				!(commandObj.originalEvent && commandObj.originalEvent.target.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") && // skip for xul elements (for now) (AC)
				commandObj.targetSpec.targetType != labeler.WEBTYPES.SCRATCHTABLE && // skip for vegeTables
				commandObj.targetSpec.targetType != labeler.WEBTYPES.TABLECELL && // we have already calculated a unique ordinal for the table of any tableCell, so we can bypass this code (AC)
				commandObj.targetSpec.targetType != "xpath" &&	// XPaths are unique, so bypass this code
				commandObj.getAction() != commands.ACTIONS.GOTO &&
				!(commandObj.targetSpec.widgetClass && commandObj.targetSpec.widgetClass == "actionBar") && 	// don't postprocess dojo widgets until Clemens' new parse code has been checked in (AC)
				contentWindow != null )					// don't postprocess dialogs for now (AC)
			{	
				var targetMatches = labeler.listTargetMatches(commandObj, contentWindow);
				if (targetMatches && targetMatches.length > 1) {  
					// TODO:JWN: Here we have discovered that our current descriptor does not uniquely identify our target on the page.
					// Currently, we simply compute an ordinal value and update the current target specifier in the command object. A better solution would
					// be to write a new findDisambiguator method that takes the current targetSpec and returns a new one.
					// (AC) Added a disambiguator for targets in a table. Updates commandObj.targetSpec so that it is unique
					//var newSpecP = labeler.findDisambiguator(event.target, targetMatches, commandObj)	// return value indicates whether commandObj.targetSpec has been changed 
					var newSpecP = false
					if (!newSpecP ) {
						for (var i = 0; i < targetMatches.length; i++) {
							if (targetMatches[i] == event.target) {
								commandObj.targetSpec.ordinal = new commands.VariableValue()	
								commandObj.targetSpec.ordinal.setVarOrVal(i+1);
								break;
							}
						}
					}
				}
			}
			if (commandObj) {
				// notify listeners
				//this.debug("coscripter-command-generator: handleEvent: handling " + commandObj.getAction() +" "+ commandObj.getTargetLabel() +" "+ commandObj.getTargetType() )
				this._notifyListeners(commandObj);
			}
		}else if(commandObj != null){
			//this.debug("coscripter-command-generator: handleEvent: ELSE")
			this._notifyListeners(commandObj);
		}
		
  	},	// end of handleEvent

	//	_onGoto
	_onGoto : function(event)
	{
		var commands = this.components.commands();

		return commands.createGotoFromParams(event, event.getURL());
	},
	
	//	_onFind
	_onFind : function(event)
	{
		var commands = this.components.commands();
		
		var commandObj = commands.createFindFromParams(event, event.continueFlag, event.searchTerm, event.previousFlag);
		
		if (!commandObj.isContinuation())
		{
			var commandGenerator = this;
			this._findCommandInWaiting = commandObj;
						
			var timeout = { 
				notify : function(timer) {
					if (commandGenerator._findCommandInWaiting == commandObj)
					{
						commandGenerator._notifyListeners(commandObj);
						commandGenerator._findCommandInWaiting = null;
					}
				}
			}
			
			var timer = Components.classes["@mozilla.org/timer;1"]
			                      .createInstance(Components.interfaces.nsITimer);
			timer.initWithCallback(timeout, 1000, 0);
		}
		else
		{
			if (this._findCommandInWaiting != null)
			{
				this._notifyListeners(this._findCommandInWaiting);
				this._findCommandInWaiting = null;
			}
			
			return commandObj;
		}
	},

	// _onMouseDown
	_onMouseDown : function(event)
	{
		var target = event.target
		var commandObj = null;
		
		// kludge for the FFox Extensions dialog, until mouseDown is fully implemented (AC)
		// mousedown on a richlistitem suppresses the following click event
		if (target.nodeName == "richlistitem") {
			//this.debug("mousedown on a " + event.target.nodeName)
			commandObj = this._onClick(event)
			//this.debug("onMouseDown: returning " + commandObj.getAction() +" "+ commandObj.getTargetLabel() +" "+ commandObj.getTargetType() )
		}

		return commandObj;
	},
	
	//		getCustomTargetInfo
	//getCustomTargetInfo : function(customTargetSpec, targetType, targetLabel){
	getCustomTargetInfo : function(customTargetSpec, targetType, targetLabel){
		var u = this.components.utils();
		var customTargetType = customTargetSpec.targetType
		/* Inline editor dijits
        if (targetType == "dojowidget" && customTargetSpec.action == "enter") {
			// Inline editor dijits require you to click in the widget to create the INPUT node
			targetType = customTargetType
		}
		*/

        if (targetType == "dojowidget" && customTargetType 
				 && !(u.inListP(customTargetType, ["item", "section", "tab", "checkbox", "menuitem", "color", "textbox", "closebutton"]) || customTargetSpec.widgetType == "ComboButton")
			) {
            targetType = customTargetType
        }
        if (targetType == "xul" && customTargetType 
				&& !(u.inListP(customTargetType, ["aspecialtype"]))
			) {
            targetType = customTargetType
        }
		
		targetLabel = customTargetSpec.targetLabel
		//this.debug("\ngetCustomTargetInfo: targetType and targetlabel are: " + targetType + ", " + targetLabel)
		
		/* ignore low-level widget clicks
		 * 	//Lots of clicks in widgets are low-level and should be ignored
		 * if (!dojoWidgetTargetSpec.targetType || dojoWidgetTargetSpec.targetType == "textbox"){ 
		 * 		dojoWidgetTargetSpec.targetType = "ignore" 
		 * }
		 */
		return [targetType, targetLabel]
	},

	// _onClick
	_onClick : function(event)
	{
		var u = this.components.utils();
		var labeler = this.components.labeler();
		var commands = this.components.commands();
		var commandObj = null;
		//this.debug("click a " + event.target.nodeName + " node")
		
		/* Core code. Get target, type and label
		// For dojo, getTargetAndType returns [target, WEBTYPES.DOJOWIDGET, dojoWidgetTargetSpec]
		// The targetSpec includes the label and other information
		// xul also returns a targetSpec as the third argument, since it immediately determines the label and action
		//this.debug("onClick topWindow has title: " + u.getTopWindow().document.title)
		// NOTE: getTargetAndType may return a new target that is one of target's ancestors,
		// for instance when target is a child of a BUTTON, INPUT, or OPTION node
		*/
		var targetAndType = labeler.getTargetAndType(event.target, event)	
		if (!targetAndType) return null;
		
		var target = targetAndType[0]
		var targetType = targetAndType[1]
		var customTargetSpec = targetAndType[2]
		var targetLabel = ""
		var textValue = ""
		var turnOnP = null
				
		/* !!WARNING!! (AC) Make sure no downstream code relies on having the original target stored in event.
		   I needed to do this because the post-processing code in handleEvent uses event.target to check for duplicates. */
		event.target = target
		
		if (customTargetSpec != null) {
			var result = this.getCustomTargetInfo(customTargetSpec, targetType, targetLabel)
			targetType = result[0]
			targetLabel = result[1]
			turnOnP = customTargetSpec.turnOnP
		}
		else {
			targetLabel = labeler.getLabel(target, targetType)	
			// getLabel should be changed to take advantage of targetType. We seem to be redoing that work. (e.g. for a node with an HTML parent)
			//this.debug("onClick: targetType and targetlabel are: " + targetType + ", " + targetLabel)
			turnOnP = target.checked
		}
		
		switch(targetType)
		{
			case labeler.WEBTYPES.NONUIELEMENT:
				//commandObj = commands.createClickFromParams(event, targetLabel, targetType, event.controlKeyDown);
				break;
				
			case labeler.WEBTYPES.TEXTBOX:
			case labeler.WEBTYPES.OTHER:
				// do nothing...a null command object will be returned
				break;

			case labeler.WEBTYPES.CHECKBOX:
			case labeler.WEBTYPES.RADIOBUTTON:
				// create a turn command object
				commandObj = commands.createTurnFromParams(event, targetLabel, targetType, turnOnP);
				break;

			case labeler.WEBTYPES.LISTBOX:
				/* create a select command object
				// NOTE:JWN: These changes are picked up by the change event, which works both for keyboard and mouse changes of a listbox.
				// For now, I'm commenting out this code because it seems rather unnecessary.
				 * if (event.target.nodeName == "OPTION") { var textToSelect =
				 * u.trim(event.target.textContent); commandObj =
				 * commands.createSelectFromParams(event, targetLabel,
				 * targetType, textToSelect); }
				 */
				if (event.target.nodeName == "SELECT" && event.target.multiple && (event.controlKeyDown || event.shiftKeyDown)) {	// handle multiple selections in a listbox
					var selectedIndex = target.selectedIndex
					var optionElement = event.originalTarget
					var optionIndex = optionElement.index
					var optionText = optionElement.text
					//var optionSelectedP = optionElement.selected	// I'll record ctl-click on the option whether it selects or deselects
					// Record a control-click or shift-click on this option. The onChange handler will record an incorrect "Select" command on the first selected item, and it will need to be removed in command-processor
					commandObj = commands.createSelectFromParams(event, targetLabel, targetType, optionText, event.controlKeyDown ? "control" : "shift");
				}
				else if (targetAndType[1] == "xul") {
					textValue = customTargetSpec.textValue
					commandObj = commands.createSelectFromParams(event, targetLabel, targetType, textValue);
				}
				break;
				
			case labeler.WEBTYPES.DOJOWIDGET:
				// we've already determined the targetSpec, so pass it instead of targetLabel
				commandObj = commands.createClickFromParams(event, customTargetSpec, targetType, target.checked);
				break;

			case "ignore":
					return null;
				break;

			default:
				// this is a normal click event 
				// xul is under development -- don't record clicks that have no label
				if (targetType == "xul" && !targetLabel) return null;
				commandObj = commands.createClickFromParams(event, targetLabel, targetType, event.controlKeyDown);
				break;
		}

		//this.debug("onClick: returning " + commandObj.getAction() +" "+ commandObj.getTargetLabel() +" "+ commandObj.getTargetType() )		
		return commandObj;
	},
	
    // _onAssert
	_onAssert : function(event)
	{
		var u = this.components.utils();
		var labeler = this.components.labeler();
		var commands = this.components.commands();

		var commandObj = null;
		var targetLabel = ""
		var customTargetSpec = null

		// Core code. Get target, type and label
		// For dojo, getTargetAndType returns [target, WEBTYPES.DOJOWIDGET, dojoWidgetTargetSpec]
		// The targetSpec includes the label and other information
		// xul also returns a targetSpec as the third argument, since it immediately determines the label and action
		//debug("onClick topWindow has title: " + u.getTopWindow().document.title)
		var targetAndType = labeler.getTargetAndType(event.target)	
		if (!targetAndType) return null;
		// NOTE: getTargetAndType may return a new target that is one of
		// target's ancestors,
		// for instance when target is a child of a BUTTON, INPUT, or OPTION
		// node
		var target = targetAndType[0]
		event.target = target	// !!WARNING!! (AC) Make sure no downstream code
			// relies on having the originalTarget stored in event.
			// I needed to do this because the post-processing code in handleEvent uses
			// event.target to check for duplicates.
		var targetType = targetAndType[1]
		if (targetAndType[2]) {
            customTargetSpec = targetAndType[2]
			var customTargetType = customTargetSpec.targetType
            if (targetType == "dojowidget" && customTargetType && !(u.inListP(customTargetType, ["item", "section", "tab", "checkbox", "menuitem", "color"]) || customTargetSpec.widgetType == "ComboButton")) {
            //if (dojoTargetType && !u.inListP(dojoTargetType, ["item", "section", "tab", "checkbox"])) {
                targetType = customTargetType
            }
            if (targetType == "xul" && customTargetType && !(u.inListP(customTargetType, ["aspecialtype"]))) {
            //if (dojoTargetType && !u.inListP(dojoTargetType, ["item", "section", "tab", "checkbox"])) {
                targetType = customTargetType
            }
			targetLabel = customTargetSpec.targetLabel


			/*
			 * if (!dojoWidgetTargetSpec.targetType ||
			 * dojoWidgetTargetSpec.targetType == "textbox"){ //Lots of clicks
			 * in widgets are low-level and should be ignored
			 * dojoWidgetTargetSpec.targetType = "ignore" }
			 */
			
		}
		else targetLabel = labeler.getLabel(target, targetType)	// getLabel should be 
			// changed to take advantage of targetType. We seem to be redoing that work. 
			// (e.g. for a node with an HTML parent)

		switch(targetType)
		{
			case labeler.WEBTYPES.NONUIELEMENT:
				// ToDo: There might be a programatically added onclick handler, so the click needs to be recorded.			
			case labeler.WEBTYPES.TEXTBOX:
			commandObj = commands.createAssertFromParams(event, targetLabel, targetType);
			break;
			case labeler.WEBTYPES.OTHER:
				// do nothing...a null command object will be returned
				break;

			case labeler.WEBTYPES.CHECKBOX:
			case labeler.WEBTYPES.RADIOBUTTON:
				// create a turn command object
				//commandObj = commands.createTurnFromParams(event, targetLabel, targetType, target.checked);
				commandObj = commands.createAssertFromParams(event, targetLabel, targetType);
				break;

			case labeler.WEBTYPES.LISTBOX:
				// create a select command object
				// NOTE:JWN: These changes are picked up by the change event, which works both for keyboard and mouse changes of a listbox.
				// For now, I'm commenting out this code because it seems rather unnecessary.
				/*
				 * if (event.target.nodeName == "OPTION") { var textToSelect =
				 * u.trim(event.target.textContent); commandObj =
				 * commands.createSelectFromParams(event, targetLabel,
				 * targetType, textToSelect); }
				 */
				commandObj = commands.createAssertFromParams(event, targetLabel, targetType);
				break;
				
			case labeler.WEBTYPES.DOJOWIDGET:
				// we've already determined the targetSpec, so pass it instead of targetLabel
				//commandObj = commands.createClickFromParams(event, customTargetSpec, targetType, target.checked);
				break;

			default:
				// this is a normal click event 
				commandObj = commands.createAssertFromParams(event, targetLabel, targetType);
				break;
		}
		
		return commandObj;
	},

	//	_onCoScripterDojoOnChange
    _onCoScripterDojoOnChange : function(event)
    {
        var u = this.components.utils();
        var labeler = this.components.labeler();
        var commands = this.components.commands();
		var commandObj = null;
        var target = event.target;
		var targetSpec = null;
		var newValue = target.getAttribute("CoScripterDojoOnChangeNewLabel")
		
		// CA richtexteditor is constantly sending dijit onChange events
		// Bold button's class is: "dijit dijitLeft dijitInline dijitButton dijitToggleButton"
		if (target.getAttribute("class").indexOf("dijitToggleButton") != -1) {
			this.debug("CA richText problem button in _onCoScripterDojoOnChange")
			return null
		}
		
        var targetAndType = labeler.getTargetAndType(target);
        if (!targetAndType) return null;
		target = targetAndType[0];
        targetSpec = targetAndType[2];
		
		if (targetSpec.widgetClass == "dijit.form.ToggleButton" || targetSpec.widgetClass == "dijit.layout._StackButton") {
                //Lots of onChange events in widgets have already been handled by the DOM onChange or onClick event and should be ignored
                targetSpec.targetType = "ignore"
		}
		
		// some dojo widgets get their label assigned by getTargetAndType
		// if not, use the regular getLabel method
		if (!targetSpec.targetLabel) {targetSpec.targetLabel = labeler.getLabel(target)}
		targetSpec.targetValue = newValue

        var targetType = labeler.WEBTYPES.DOJOWIDGET
        var textToEnter = newValue
        this._currentTextbox = ""

        // create an enter command object
        commandObj = commands.createEnterFromParams(event, targetSpec, targetType, textToEnter, false);
        return commandObj;
    },

	
	//	_onChange
	_onChange : function(event)
	{
		//this.debug("onChange: " + event.target.nodeName)
		var u = this.components.utils();
		var labeler = this.components.labeler();
		var commands = this.components.commands();
		var commandObj = null;

		var target = event.target;
		var targetLabel = ""
		var targetType = ""
		var targetArea = "content";
		var isPassword = false;
		var textToEnter = "";

		var targetAndType = labeler.getTargetAndType(target, event);
		if (targetAndType){
			var customTargetSpec = targetAndType[2];
			if (customTargetSpec && customTargetSpec.widgetClass) {
	    	    // check if this is a dojo widget that will be handled by dojo's onChange method (_onCoScripterDojoOnChange)
				if (customTargetSpec.widgetClass == "artifactNode") {
					commandObj = commands.createEnterFromParams(event, customTargetSpec, labeler.WEBTYPES.DOJOWIDGET, customTargetSpec.textToEnter, isPassword);
					return commandObj
				} else return null;
			}
 			// if (customTargetSpec.widgetClass == "dijit.form.ToggleButton")
		}

		// these parameters are not currently saved in the command object
		var textBefore = ""
		var textAfter = ""

		// now make sure this is a textbox type thing,
		// and create some appropriate slop
		var ancestor = u.getAncestorNamed(target, "INPUT")
		if (ancestor) {
			textToEnter = ancestor.value
			var type = ancestor.type || ancestor.getAttribute("type")
			if (type) type = type.toLowerCase()
			
			switch(type)
			{
				case "password":
					isPassword = true;
					// NOTE:JWN: intentionally falling through
					
				case "text":
				case "file":
				case "image":
					targetLabel = labeler.getLabel(target)
					targetType = labeler.WEBTYPES.TEXTBOX
					textToEnter = target.value
					textBefore = this._textboxTextBefore
					textAfter = target.value
					this._currentTextbox = ""

					// create an enter command object
					if( textBefore != null && textBefore != "" && textAfter.indexOf(textBefore)==0){
						// this would also be the place to add prepend etc ...
						commandObj = commands.createAppendFromParams(event, targetLabel, targetType, textToEnter, isPassword);
					}else{
						commandObj = commands.createEnterFromParams(event, targetLabel, targetType, textToEnter, isPassword);
					}
					
					break;
				
				default:
					// don't do anything in any other cases
					return null;
			}
			
		}
		else if (u.stringContains(target.nodeName, "text")) {
			targetLabel = labeler.getLabel(target)
			targetType = labeler.WEBTYPES.TEXTBOX
			textToEnter = target.value
			textBefore = this._textboxTextBefore
			textAfter = target.value
			this._currentTextbox = ""

			// create an enter command object
			commandObj = commands.createEnterFromParams(event, targetLabel, targetType, textToEnter, isPassword);
		}
		else if (u.stringContains(target.nodeName, "SELECT")) {
			targetLabel = labeler.getLabel(target)
			targetType = labeler.WEBTYPES.LISTBOX
			var itemTextToSelect = target[target.selectedIndex].textContent
			
			// create a select command object
			commandObj = commands.createSelectFromParams(event, targetLabel, targetType, itemTextToSelect);
		}
				
		return commandObj;
	},	// end of _onChange
	
	//	_onCommand
	_onCommand : function(event)
	{
		//this.debug("coscripter-command-generator:  _onCommand: received a " + event.target.id + " command")
		var u = this.components.utils();
        var labeler = this.components.labeler();
        var commands = this.components.commands();
        var commandObj = null;
		
		var target = event.target;
		var targetArea = "content";
		
		var commandID = target.id
		var chromeWindow = target.ownerDocument.defaultView
		if (!chromeWindow) return;
		if (!chromeWindow.gBrowser) return;
		var contentWindow = chromeWindow.gBrowser.contentWindow
		if (!contentWindow) return;
		if (target.className && target.className.indexOf("unified-nav-") != -1) return;	// The pulldown next to the Prev and Next arrows. Already handled by "go back" commands
		
		switch(commandID)
		{
			case "cmd_copy":
			case "cmd_cut":
			case "cmd_paste":
				// So far, only copying a text selection or a link is implemented. 
				// Should eventually handle Highlight non-ui-elements (AC)
				
				// add a conditional here to check if the content of this window is a scratch space
				var targetLabel = null		// labeler.getLabel(target)
				var targetType = null		// labeler.WEBTYPES.TEXT
				var uniqueDescriptor = null 
				var findUniqueDescriptorP = false
				
				var selection = contentWindow.getSelection()
				var selectionTarget = selection.anchorNode
				var focusTarget = chromeWindow.document.commandDispatcher.focusedElement
				var scratchSpaceEditor = u.getAncestorWithId(focusTarget, "coscripterScratchSpaceEditor")	// this is the xul element
				var someTextSelected = (selectionTarget != null) && (selection.focusNode != null)

				if (!scratchSpaceEditor && someTextSelected && commandID == "cmd_copy") {
					//  Prefer a nearby label over the actual text of the selection
					targetLabel = labeler.getLabel(selectionTarget)
					if ((typeof targetLabel == "object") && (targetLabel != null)) {
						targetType = labeler.WEBTYPES.TABLECELL	// table labels are an array
					}
					else {
						// get the xpath of the selection
						targetType = labeler.WEBTYPES.TEXT
					}
					commandObj = commands.createCopyFromParams(event, targetLabel, targetType);
				}
	
				if (focusTarget && commandID == "cmd_copy") {
					var focusTargetType = labeler.getTargetType(focusTarget)
					selectionTarget = focusTarget.parentNode
					var tree = null;
					var treeRow = -1;
					var treeColumn = -1;
					var treeColumnName = ""
			
					if (selectionTarget.parentNode && selectionTarget.parentNode.className == "tree-input") {
						// VegeTable cell
						tree = selectionTarget.parentNode.parentNode.parentNode.QueryInterface(Components.interfaces.nsIDOMXULElement);
						var treeBoxObject = tree.boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject)
						var treeView = treeBoxObject.view;
						
						// treeRow is offset by 1 to account for column headers.
						// treeColumn is offset by 2 to account for the checkbox
						// column and rowNumber column.
						treeRow = treeView.selection.currentIndex - 1; 
						treeColumn = treeView.selection.currentColumn.index - 2;
						treeColumnName = treeView.getCellText(0, treeBoxObject.columns[treeColumn + 2]);
						//targetLabel = "column " + (treeColumn + 1) + " of row " + (treeRow + 1)
						targetLabel = [treeColumnName, (treeColumn + 1), (treeRow + 1), "scratchtable"]
						// so that labeler doesn't get called
						targetType = labeler.WEBTYPES.SCRATCHTABLE;
					}
					else if (focusTargetType == labeler.WEBTYPES.TEXTBOX) {
						targetLabel = labeler.getLabel(focusTarget)
						targetType = labeler.WEBTYPES.TEXTBOX
					}
					commandObj = commands.createCopyFromParams(event, targetLabel, targetType);
				}
				
				if (focusTarget && commandID == "cmd_paste") {
					if (scratchSpaceEditor) {
						// VegeTable cell
						//this.debug("paste command has a scratch table target")
						tree = u.getAncestorWithId(focusTarget, "coscripter-scratch-space-table-editor-0")
						var treeBoxObject = tree.boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject)
						var treeView = treeBoxObject.view;
						
						// treeRow is offset by 1 to account for column headers.
						// treeColumn is offset by 2 to account for the checkbox
						// column and rowNumber column.
						treeRow = treeView.selection.currentIndex - 1; 
						treeColumn = treeView.selection.currentColumn.index - 2;
						treeColumnName = treeView.getCellText(0, treeBoxObject.columns[treeColumn + 2]);
	
						targetLabel = [treeColumnName, (treeColumn + 1), (treeRow + 1), "scratchtable"]
						// so that labeler doesn't get called
						targetType = labeler.WEBTYPES.SCRATCHTABLE;
		 				commandObj = commands.createPasteFromParams(event, targetLabel, targetType);
					}
					else {
						targetLabel = labeler.getLabel(focusTarget)
						targetType = labeler.WEBTYPES.TEXTBOX
						commandObj = commands.createPasteFromParams(event,  targetLabel, targetType);
					}
				}
				break;
				
			default:
				// only handles menu commands for now (AC)
				// should eventually handle other events with a doCommand() method
				var doc = chromeWindow.document
				var mainMenubar = doc.getElementById("main-menubar")				
				var menuItemList = doc.getElementsByAttribute("command", commandID)
				var menuItem = null
				for (var i=0; i<menuItemList.length; i++) {
					if (menuItemList[i].nodeName == "menuitem") {
						menuItem = menuItemList[i]
						break;
					} 
				}
				// sometimes the target is the menuitem
				if (!menuItem && target.nodeName == "menuitem") menuItem = target
				
				if (menuItem) {
					var menuLabel = menuItem.label
					var menuString = menuLabel
					var parentContainer = menuItem.parentContainer
					while (parentContainer && parentContainer.label) {
						menuString = parentContainer.label + ">" + menuString
						parentContainer = parentContainer.parentContainer
					}
					targetType = labeler.WEBTYPES.MENU
				}
				if (menuLabel && u.inArrayP(menuLabel, ["Back", "Forward", "Reload"])) break;	// already handled by specific events
				if (menuLabel) commandObj = commands.createSelectFromParams(event, menuString, targetType)
				break;
		}
		
		return commandObj		
	},	//  end of _onCommand


    //  _onCoScripterDojoOnFocus
    _onCoScripterDojoOnFocus : function(event)
    {
        var u = this.components.utils();
        var labeler = this.components.labeler();
        var commands = this.components.commands();
        var commandObj = null;
        var target = event.target;
        var targetSpec = null;
        var oldValue = target.getAttribute("CoScripterDojoOnFocusOldLabel")
        
        this._textboxTextBefore = oldValue;
		
        // create an enter command object
        commandObj = commands.createEnterFromParams(event, targetSpec, targetType, textToEnter, false);
        return commandObj;
    },


	//	_onFocus
	_onFocus : function(event)
	{
		var u = this.components.utils();
        var labeler = this.components.labeler();
        var target = event.target;
		var targetType = "";
		if (!target.ownerDocument) return;
		
		var targetAndType = labeler.getTargetAndType(target);
		if (targetAndType) {
			// called on elements with tags of INPUT and html:textarea; type is text and textarea
			targetType = targetAndType[1];
			if (targetType == labeler.WEBTYPES.TEXTBOX){
				this._currentTextbox = targetAndType[0];
				this._textboxTextBefore = target.value;
			}
		}
	},
  	
  	
	////////////////////////////////////////////////////////////////////////////////
	// Methods to grab references to
	// other XPCOM components
	
	debug : function(msg) 
	{
	  debug(msg);
	}
}	// end of CoScripterCommandGenerator.prototype

var commandGenerator = new CoScripterCommandGenerator();

debug('done parsing');
