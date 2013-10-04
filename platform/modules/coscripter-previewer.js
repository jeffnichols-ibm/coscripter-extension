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
var EXPORTED_SYMBOLS = ["previewer", "periodicPreviewer", "statusDisplay"]
const nsISupports = Components.interfaces.nsISupports	// XPCOM registration constant
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage("coscripter-previewer.js: " + msg )
	if(Preferences.DO_DUMP_DEBUGGING) dump("coscripter-previewer.js: " + msg + "\n")
}
//debug('parsing coscripter-previewer.js')

// DEBUG FLAG to disable periodic previewing
// Please leave this as false unless you are debugging!
var DEBUG_DISABLE_PERIODIC_PREVIEW = false

///////////////////////////////////////////////// 
//	Previewer
//		previewStep
//		clearPreview
//
//	PeriodicPreviewer
//		refresh
//		restart
//		stop
//
//	StatusDisplay
//		determineInterpretationStatus
//		displayStatus
//
////////////////////////////////////////////////

function getPreviewer(){
	return previewer
}

/////////////////////////////////
//	Previewer
////////////////////////////////
function Previewer() {
    this.components = registry	// Component registry
	//  Eventually remove the db from Previewer and move it to the Execution Environment
	this.db = null	// the personalDB to be used for filling in variables
	this.previousPreviewCommand = null
	this.currentCommand = null
	this.wrappedJSObject = this
	return this
}

Previewer.prototype = {
	//		previewStep
	previewStep : function(stepnum) {
		// if no stepnum is provided, use the sidebar's currentCommand
		debug("hi I am in preview step");
		var execEnv = this.components.executionEnvironment()
		var u = this.components.utils()
		var parserComponent = this.components.parser()
		
		var mainChromeWindow = execEnv.getMainChromeWindow()
		var coScripterWindow = u.getCoScripterWindow(mainChromeWindow)
		var procedureInteractor = coScripterWindow.procedureInteractor
		var pI = procedureInteractor
		
		this.clearPreview()	
		
		if (!stepnum) stepnum = pI.getCurrentLineNumber()
		
		debug("current line number is " + stepnum);
		var line = pI.getLineWithNumber(stepnum)
		if(this.isLineComment(line)) return;
		var slop = pI.getLineText(line)
		if (!slop) return;
		
		// TL: turn the current-line box a different color depending on how we have parsed the step
		var modifiedSlop = this.massageSlopForParser(slop)
		var parser = new parserComponent.Parser(modifiedSlop)
		var targetValNotFound = null
		pI.forceScrollIntoView()
		try {
			var cmd = parser.parse()
			this.currentCommand = cmd
			if (this.db) cmd.fillInVars(this.db)
			if (cmd.getAction() == parserComponent.ParserConstants.YOU) pI.colorCurrentLine("orange")
			else if (!cmd.canExecute()) {
				pI.colorCurrentLine("red")
				periodicPreviewer.stop()
				periodicPreviewer.restart()
			}
			else pI.colorCurrentLine("green")
		} catch (e) {
			debug('previewStep Exception: ' + e.toSource() + '\n')
			
			pI.colorCurrentLine("red")
			if (e == "target value not found") targetValNotFound = true
		}
		this.previousPreviewCommand = cmd
		if (coScripterWindow.recording) return; // Now that we have parsed the current step and colored the box appropriately, return before previewing if we are in recording mode.
		if (cmd) cmd.preview({'fromrefresh': false, recording: coScripterWindow.recording})
		
		var status = statusDisplay.determineInterpretationStatus(cmd)
		debug('previewStep: status is  ' + status + '\n')
			
		if (targetValNotFound) status = targetValNotFound
		statusDisplay.displayStatus(status, cmd)
	},

	//		clearPreview
	clearPreview : function() {
		if (this.previousPreviewCommand) this.previousPreviewCommand.clearPreview()
		this.previousPreviewCommand = null
	},

	massageSlopForParser : function(slop) {
		// Remove extra white spaces
		slop = this.components.utils().trim(slop)
		// Replace left and right quotation marks with double quotes
		slop = slop.replace(new RegExp(unescape("[%u201C%u201D]"), "g"), '"')
		// Replace \u2013 with -
		// JM: I commented the following step to solve the Bug "Fariz" mentioned. now it does not convert \x13 to -
		//slop = slop.replace(new RegExp("\u2013", "g"), "-")
		// Replace \n with RETURN
		slop = slop.replace(new RegExp("\\\\n", "g"), "\n")
		return slop
	},
	
	isLineComment : function(line) {
		var execEnv = this.components.executionEnvironment()
		var u = this.components.utils()
		var mainChromeWindow = execEnv.getMainChromeWindow()
		var coScripterWindow = u.getCoScripterWindow(mainChromeWindow)
		
		return coScripterWindow.CoscripterDomUtils.isClass(line, "comment");
	}

}	// end of Previewer methods


/////////////////////////////////
//	PeriodicPreviewer
////////////////////////////////
function PeriodicPreviewer() {
	debug("create PeriodicPreviewer object")
	this.components = registry
	this.nextRefresh = 0	// delay in milliseconds until next refresh
	this.timeoutId = -1
}

PeriodicPreviewer.prototype = {
	nextRefresh : 0,

	getRefresh : function() {
		return this.nextRefresh
	},

	setRefresh : function(r) {
		this.nextRefresh = r
	},

	//		refresh
	// periodically check for a target until it is found
	refresh : function() {
		debug("in PeriodicPreviewer refresh")
		if (DEBUG_DISABLE_PERIODIC_PREVIEW) return;
		var execEnv = this.components.executionEnvironment()
		var u = this.components.utils()
		var mainChromeWindow = execEnv.getMainChromeWindow()
		var coScripterWindow = u.getCoScripterWindow(mainChromeWindow)

		//var chromeWindow = execEnv.getMainChromeWindow()
		//var contentWindow = chromeWindow.contentWindow
		// check for an existing timeout and clear it if necessary
		if (this.timeoutId != -1) {
			coScripterWindow.clearTimeout(this.timeoutId)
			this.timeoutId = -1
		}
		
		try {
			if (true) { // To aid in ging of PbD code, use if(!contextP()) (AC)
				//processCurrentLine(true)
				debug("refresh: checking for Target with nextRefresh = " + this.nextRefresh)
				debug("currentCommand is  " + previewer.currentCommand.toSlop())
				if (!previewer.currentCommand.hasTargetSpec() || previewer.currentCommand.findTarget() != null) {
					// We don't need a target or we found a target: no need to continue refreshing
					return;
				}
			}
		} catch (e) {
			debug("exception in refresh: " + e.toSource() + "/" + e.toString() + '\n')
		}	
		this.nextRefresh = this.nextRefresh * 2
		debug("PeriodicPreviewer refresh: nextRefresh is now " + this.nextRefresh)
		// value of 0 disables refresh
		if (this.nextRefresh > 0 && this.nextRefresh <= 64000) {
			this.timeoutId = coScripterWindow.setTimeout(function() {
																periodicPreviewer.refresh()
															}, 
														this.nextRefresh)
		} else {
			// give up
			this.stop()
		} 
	},
	
	//		restart
	restart : function() {
		debug("in PeriodicPreviewer restart")
		this.setRefresh(500)
		this.refresh()
	},

	//		stop
	stop : function() {
		debug("in PeriodicPreviewer stop")
		var execEnv = this.components.executionEnvironment()
		var u = this.components.utils()
		var mainChromeWindow = execEnv.getMainChromeWindow()
		var coScripterWindow = u.getCoScripterWindow(mainChromeWindow)
		//var chromeWindow = execEnv.getMainChromeWindow()
		//var contentWindow = chromeWindow.contentWindow
		this.nextRefresh = 0
		// check for an existing timeout and clear it if necessary
		if (this.timeoutId != -1) {
			coScripterWindow.clearTimeout(this.timeoutId)
			this.timeoutId = -1
		}
	}
}


/////////////////////////////////
//	StatusDisplay
////////////////////////////////
function StatusDisplay() {
    this.components = registry	// Component registry
	//  Eventually remove the db from Previewer and move it to the Execution Environment
	this.db = null	// the personalDB to be used for filling in variables
	this.previousPreviewCommand = null

	this.wrappedJSObject = this
	return this
}

StatusDisplay.prototype = {
	//		determineInterpretationStatus
	determineInterpretationStatus : function(command) {
		var parserComponent = this.components.parser()
		var parserConstants = parserComponent.ParserConstants
		var commands = this.components.commands()
		var status = null
		
		try {
			if (!command) {
				status = EXECUTION_PARSE_ERROR
			}
			else 
				if (command.getAction() == parserConstants.YOU) {
					status = EXECUTION_REQUIRES_USER_ACTION
				}
				else 
					if (command.canExecute() == false) {
						if (command.hasNeededVars() == false) {
							status = EXECUTION_REQUIRES_USER_DATA
						}
						else 
							if (command.getAction() ==commands.ACTIONS.UNEXECUTABLE) {
								status = EXECUTION_PARSE_ERROR
							}
							else 
								if (command.findTarget() == null) {
									if (command.getAction() == parserConstants.IF) {
										status = EXECUTION_SUCCEEDED
									}
									else {
										//if (command.getErrorMsg() != null && command.getErrorMsg() == getCommands().ERRORMSG.TARGET_VAL_NOTFOUND) 
										status = EXECUTION_TARGET_NOT_FOUND
									}
								}
								else {
									status = EXECUTION_FAILED
								}
					}
					else {
						status = EXECUTION_SUCCEEDED
					}
		} catch(e) {
			if (e == "target value not found") {
				status = EXECUTION_TARGET_VALUE_NOT_FOUND			
			}	
		}	
		return status
	},
	
	//		displayStatus
	displayStatus : function(status,command) {
		var execEnv = this.components.executionEnvironment()
		var u = this.components.utils()
		var mainChromeWindow = execEnv.getMainChromeWindow()
		var coScripterWindow = u.getCoScripterWindow(mainChromeWindow)

		var sidebarBundle = coScripterWindow.document.getElementById("bundle-coscripter-sidebar")
		var ready = sidebarBundle.getString("status.ready")
		var doYourself = sidebarBundle.getString("status.doYourself")
		var noVariable = sidebarBundle.getString("status.noVariable")
		var addIt = sidebarBundle.getString("status.addIt")
		var done = sidebarBundle.getString("status.done")
		var noInterpretations = sidebarBundle.getString("status.noInterpretations")
		var cantDoCommand1 = sidebarBundle.getString("status.cantDoCommand1")
		var cantDoCommand2 = sidebarBundle.getString("status.cantDoCommand2")
		var dontUnderstand = sidebarBundle.getString("status.dontUnderstand")
		var clickStepOrRun = sidebarBundle.getString("clickStepOrRun")
	
		var msg = null
		var c = ""
		if ( status == EXECUTION_REQUIRES_USER_ACTION ) {
			msg = doYourself 
			c = "error"
		}
		else if ( status == EXECUTION_REQUIRES_USER_DATA ) {
			msg = noVariable + " '"  + command.getVarNames() + "' " + addIt
			c = "error"
		}
		else if ( status == EXECUTION_COMPLETED ) {
			msg = done
			c = "information"
		}
		else if ( status == EXECUTION_FAILED ) {
			msg = noInterpretations
			c = "error"
		}
		else if ( status == EXECUTION_TARGET_NOT_FOUND ) {
			var targetSpec = command.targetSpec
			if (targetSpec) msg = cantDoCommand1 + " " + command.targetSpec.toSlop() + " " + cantDoCommand2
			else msg = "Target not found"
			c = "error"
		}
		else if ( status == EXECUTION_TARGET_VALUE_NOT_FOUND ) {
			msg = cantDoCommand1 + " " + command.string + " " + cantDoCommand2 + " In " + command.targetSpec.toSlop()
			c = "error"
		}
		else if( status == EXECUTION_PARSE_ERROR){
			msg = dontUnderstand
			c = "error" 
		}
		else if (status == EXECUTION_SUCCEEDED){
			msg = clickStepOrRun
			c = ""
		}
	
		if (msg != null) {
			this.setStatus(msg, c)
		}
	},
	
	setStatus : function(msg, c) {
		var execEnv = previewer.components.executionEnvironment()
		var u = previewer.components.utils()
		var mainChromeWindow = execEnv.getMainChromeWindow()
		
		var statusLabel = u.getStatusLabel(mainChromeWindow)
		if (!statusLabel) return;
		
		var style = ""
		if ( c == "error" ) 
			style = "color : red; font-weight : bold;"
		else if ( c == "information" ) 
			style = "color : blue;"
		else
			style = "color : black;"
	
		//	var color = "background-color : #EEEEEE; " + style
		statusLabel.setAttribute("style", style)
		statusLabel.setAttribute('value', msg)
		statusLabel.setAttribute('tooltiptext', msg)
	}
}

var EXECUTION_FAILED = 0
var EXECUTION_SUCCEEDED = 1
var EXECUTION_COMPLETED = 2
var EXECUTION_REQUIRES_USER_ACTION = 3
var EXECUTION_REQUIRES_USER_DATA = 4
var EXECUTION_SKIPPED_COMMENT = 5
var EXECUTION_NULL_ACTION = 6
var EXECUTION_TARGET_NOT_FOUND = 7
var EXECUTION_PARSE_ERROR = 8
var EXECUTION_TARGET_VALUE_NOT_FOUND = 9

var statusDisplay = new StatusDisplay()
var previewer = new Previewer()
var periodicPreviewer = new PeriodicPreviewer()
//debug("done parsing coscripter-previewer.js")
