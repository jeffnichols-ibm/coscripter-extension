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
Components.utils.import("resource://coscripter-platform/component-registry.js");
var EXPORTED_SYMBOLS = ["commands"];
const nsISupports = Components.interfaces.nsISupports;	// XPCOM registration constant
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false,
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage("coscripter-command.js: " + msg );
	if(Preferences.DO_DUMP_DEBUGGING) dump("coscripter-command.js: " + msg + "\n");
}
//debug('parsing coscripter-command.js');

///////////////////////////////////////
//
// ACTIONS
// TARGETAREATYPE
// Command Object
//	findTarget
//	canExecute
//
// =========== GOTO ==================
//					goforward, reload, toggle
// ======= ExpandCollapse ============
// ============== CREATE TAB ===============
// =========== REPEAT ====================
// =========== IF ====================
// =========== CLIP ==================
// =========== ENTER =================
// =========== PUT =================
// =========== INCREMENT =================
// =========== CLICK =================
// =========== MOUSEOVER =================
//					switch, close tab
// =========== SELECT ================
// =========== Turn ==================
// =========== Open ==================
// =========== Pause =================
// =========== Comment ===============
// =========== You Command============
// =========== COPY ==================
// =========== PASTE =================
//					begin extraction, end extraction
// =========== Extract ==================
// =========== FIND ==================
// =========== Unexecutable  Command==
//
// =========== TargetSpec ============
// =========== TableTargetSpec =======
//					CellReference
// =========== DojoWidgetTargetSpec =======
//
// =========== VariableValue =========
//
///////////////////////////////////////


function CoScripterCommand()
{
	// nothing to do for this object
	return this;
}


// ********************************************************************
// **************** Inheritance Convenience Methods *******************
// ********************************************************************

/** Inheritance convenience class adopted under BSD license from:
 * 		http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
 *		http://www.kevlindev.com/license.txt 
 * Example of Use:
 * 		JSInheritance.extend(MouseEvent, Event);
 * 		MouseEvent.superClass.funcName.call(this[, params]);
 * 		MouseEvent.baseConstructor.call(this[, params]);
 * @param subClass
 * @param baseClass
 */
JSInheritance = {};
JSInheritance.extend = function(subClass, baseClass) {
   function inheritance() {}
   inheritance.prototype = baseClass.prototype;

   subClass.prototype = new inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}

// ====================================================================
// End Inheritance convenience methods
// ====================================================================


// ACTIONS
CoScripterCommand.prototype.ACTIONS = {
	ASSERT:'verify',
	NEGATION:'negate',
	CLICK:'click',
	MOUSEOVER:'mouseover',
	CLIP:'clip',
	COPY:'copy',
	ENTER:'enter',
	PUT:'put',
	INCREMENT:'increment',
	APPEND:'append',
	OPEN:'open',
	GOTO:'go to',
	GOFORWARD:'go forward',
	SWITCH:'switch',
	CREATE:'create',
	RELOAD:'reload',
	EXPANDCOLLAPSE:'expandcollapse',
	TOGGLE:'toggle',
	CLOSE:'close',
	PASTE:'paste',
	PAUSE:'pause',
	SELECT:'select',
	TURN:'turn',
	WAIT:'wait',
	YOU:'you',
	BEGIN_EXTRACTION: 'begin extraction',
	END_EXTRACTION: 'end extraction',
	EXTRACT: 'extract',
	UNEXECUTABLE:'unexecutable',
	FIND:'find',
	REPEAT:'repeat',
	IF:'if',
	ELSE:'else'
};

// TARGETAREATYPE
CoScripterCommand.prototype.TARGETAREATYPE = {
	WEBPAGE : "webpage",
	TABLE : "table",
	SCRATCHTABLE : "scratchtable",
	TEXTBOX : "textbox",
	TEXT : "text",
	XPATH : "xpath"
}

// Command Specific Error Msg
CoScripterCommand.prototype.ERRORMSG = {
	TARGET_VAL_NOTFOUND:'target value not found',
	TARGET_NOT_FOUND:'target not found'	
};



// ====================================================================
// Command Object
// ====================================================================

CoScripterCommand.prototype.Command = function(slop,execEnv){
    this.components = registry;
	this.execEnv = execEnv;
	this.coScripterChromeWindow = null;	// So we know what window to use to execute this command. Set by previewCurrentStep in command-processor. So far, only used by goto.
	this.type = null;	//e.g. CLICK, ENTER, GOTO, REPEAT

	this.originalEvent = null ;
	this.slop = slop ;
	this.string = null ;	// for commands with a text argument, such as * enter "Janet" into the "First Name" textbox
	this.targetSpec = null ;
	// this.targetElement should only be used by the ExecutionEngine for the targetElement that is going to be used when executing this command
	// Previewer and any other uses should call findTarget directly and not store the result in this.targetElement
	// There have been problems in execution when stale values are stored as the targetElement
	this.targetElement = null ;
	
	this.indent = -1 ;	// 0 is comment.  'indent' is the number of *s
    this.lineNumber = -1 ;
	
    this.totalLines = -1 ;	// used by bubble help

	this.errorMsg = null; // JM: HACK to get correct error msg
	this.hidePasswordValue = false; // TL: HACK to generate correct slop for "enter your password" commands
	return this;
}

CoScripterCommand.prototype.Command.prototype = {
	// the action to be performed, also used as the command type
	// ENTER, GOTO, SELECT, CLICK
	getAction : function(){
		return this.type;
	},

	// return the original event generated by our listener framework (if available)
	getOriginalEvent : function(){
		return this.originalEvent;
	},

	// will only work if the original event is available
	getTarget : function(){
		throw "generic command.getTarget called. (AC) wants to get rid of this method"
		if (this.originalEvent){
			return this.originalEvent.target;
		}
		return null;
	},
	
	// if present: 1st, 2nd, 3rd ...
	getOrdinal : function(){
		if(this.targetSpec){
			return this.targetSpec.getOrdinal()
		}	
		return null;
	},

	getDisambiguator : function(){
		if(this.targetSpec){
			return this.targetSpec.getDisambiguator()
		}	
		return null;
	},

	// the type of the target element: link, button, textbox, ...
	getTargetType : function(){
		if(this.targetSpec){
			return this.targetSpec.getTargetType();
		}
		return null;
	},
	
	getErrorMsg : function() {
		return this.errorMsg;
	},

	hasTargetSpec : function()
	{
		return (this.targetSpec != null);
	},

	hasTargetDisambiguator : function()
	{
		return (this.targetSpec != null && this.targetSpec.getDisambiguator() != null);
	},

	hasTargetLabel : function()
	{
		return (this.targetSpec != null && this.targetSpec.getTargetLabel() != null);
	},
	
	// the label of the target (e.g. the "Do somthing" button)
	// All commands -- other than Copy and Paste of TableTargets -- have a VariableValue object as their targetSpec 
	getTargetLabel : function(useRegExp){
		if(this.targetSpec && this.targetSpec.targetLabel){
			return this.targetSpec.targetLabel.getValue(useRegExp);
		}
		return null;
	},
	
	// the textvalue to enter in a search box or to select from a listbox
	getTextvalue : function(){
		// TODO: raise error if needed variables are unset
		// TODO: see if VariableValue.getValue() can be used instead of this
		return this.string.getValue();
	},

	// the original slop
	getSlop : function(){
		return this.slop ;
	},
	
	toSlop :function(database){
		return "toSlop called on abstract command";
	},

	// the original slop
	toString : function(){
		return this.slop ;
	},
	
	// When recording a new command, check if a literal matches a database entry or an entry in the first row of the scratchtable
	variabilize : function(database) {
		// don't do anything by default
	},

	// Whether this command needs variable values to be filled in
	needsVars : function(){
		return false;
	},

	fillInVars : function(database) {
		// don't do anything
	},
	
	// Whether this command has the requisite variables present in the personal database or scratchspace
	hasNeededVars : function(){
		return true;
	},
	
	preview : function(options){
		/* Possible options to be set in the hash:
		   options = { 'color' : 'red', 'overlaytext' : 'displayme' }
		   options can also be null if you don't need to override anything
		*/
		this.clearPreview();
		this.previewConfig = this.execEnv.preview(this, options);
    },
	
	/////////////////
	//	canExecute
	/////////////////
	canExecute : function(){
		// dump('Command.canExecute: ' + this.getSlop() + '\n')
		var hasNeededTargets = (!this.hasTargetSpec() || this.findTarget() != null);
		var hasNeededVars = this.hasNeededVars();
		
		return (hasNeededTargets && hasNeededVars);
	},
	
	/////////////////
	//	findTarget
	/////////////////
	findTarget : function(){
		if (!this.hasTargetSpec()) throw "findTarget called on a command that has no targetSpec. Use command.hasTargetSpec() first"
		var targetElement = this.execEnv.findTarget(this)
		this.targetElement = targetElement;
		return targetElement;
	},
	
	execute : function(thenDoThis, options){
		/* The options hashmap may contain parameters that affect execution
		// Available known parameters:
		// color : the color of the execution animation
		*/
		//dump('Command.execute called on the generic Command Object\n')
		throw "Command.execute called on the generic Command Object";
	},

	getVarNames : function(){
		// TL: this should probably be implemented on each subclass of Command
		var varNames = [] ;
		if(this.string && this.string.needsVars()) {
			varNames.push(this.string.dbkey);
		}  
		if(this.targetSpec !=null && this.targetSpec.needsVars() && this.targetSpec.targetLabel){
			varNames.push(this.targetSpec.targetLabel.dbkey);
		}
		if(this.url !=null && this.url.needsVars() && this.url.dbkey){
			varNames.push(this.url.dbkey);
		}
		return varNames ;
	},
	
	clearPreview : function(){
		if(null != this.previewConfig){
			this.execEnv.clearPreview(this.previewConfig);
		}
		this.previewConfig = null ;
	},

	// Accessors for the indentation level of this command
	setIndent : function(indent) {
		this.indent = indent;
	},
	
	getIndent : function() {
		return this.indent;
	},
	
	setLineNumber : function(nr){
		this.lineNumber = nr ;
		// TL: Setting it for the nested command as well because it's required to make bubble help work for YOU commands
		if (this.nestedCommand) {
			this.nestedCommand.lineNumber = nr;
		}
	},
	
	getLineNumber : function(){
		return this.lineNumber  ;
	},
	
	setTotalLines : function(lines){
		this.totalLines = lines ;
		// TL: Setting it for the nested command as well because it's required to make bubble help work for YOU commands
		if (this.nestedCommand) {
			this.nestedCommand.totalLines = lines;
		}
	},
	
	getTotalLines : function(){
		return this.totalLines ;
	},

	// Whether to do autowait before this command or not
	// If autoWait is true, it means that the command has a targetSpec, and you may need to wait for the target to come into existence
	// Note that some commands have a targetSpec, but you can always tell instantly whether the target exists, such as "go to tab #2"
	autoWait : function() {
		return false;
	}

}	// end of Command


// ===================================
// =========== GOTO ==================
// ===================================
// go to "google.com"
// go to "http://www.google.com"
// go to your "search engine"
//
// go to window 2 -- this syntax refers to windows/tabs in the order in which they are encountered by the script. 
//					So "window 1" is always the initial window. window/tab are interchangeable and mean the same thing.
// go to window # 2 -- the browser windows in z-order starting with the frontmost
// go to tab # 2 -- the tabs in the current browser window, numbered from left to right
// go to the "Faces" window -- the window title. window/tab are interchangeable and mean the same thing.
// go to the window that contains "Amazon"
CoScripterCommand.prototype.createGotoFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.GotoCommand(slop,execEnv);
}

// Called by command-processor's receiveRecordedCommand to create an initial "go to" in a newly recorded script
CoScripterCommand.prototype.createGotoFromParams = function(originalEvent, location){
	var gotoCmd = new CoScripterCommand.prototype.GotoCommand();
	
	gotoCmd.originalEvent = originalEvent;
	gotoCmd.url = new CoScripterCommand.prototype.VariableValue(location);
	
	// this must be done explicitly for every command created from params
	gotoCmd.execEnv = gotoCmd.components.executionEnvironment();
	
	return gotoCmd;
}

CoScripterCommand.prototype.GotoCommand = function(slop,execEnv){
	CoScripterCommand.prototype.GotoCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.GOTO ;
	
	// either url or targetSpec is null
	this.url = null;
	this.targetSpec = null;
	
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.GotoCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.GotoCommand.prototype.hasTargetSpec = function(){
	// There are two types of goTo commands:go to a url, or go to a window or tab.
	// either url or targetSpec is null.  In fact, the targetSpec might get filled in with  null target, 
	//so hasTargetSpec checks whether the url is filled in to determine which type of goTo this is.
	return (this.url ? false : true)
}

CoScripterCommand.prototype.GotoCommand.prototype.toString = function(){
	return this.toSlop();
}

CoScripterCommand.prototype.GotoCommand.prototype.toSlop = function(){
	if (!this.hasTargetSpec()) return this.getAction() + " " + this.url.toSlop();	// TEMPORARY: in this case, it works
	else return this.getAction() + " " + this.targetSpec.toSlop()
}

CoScripterCommand.prototype.GotoCommand.prototype.variabilize = function(database) {
	if (!this.hasTargetSpec()) this.url.variabilize(database);
	else this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.GotoCommand.prototype.needsVars = function() {
	if (!this.hasTargetSpec()) return this.url.needsVars();
	else return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.GotoCommand.prototype.fillInVars = function(database) {
	if (!this.hasTargetSpec()) this.url.fillInVars(database);
	else this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.GotoCommand.prototype.hasNeededVars = function() {
	if (!this.hasTargetSpec()) return this.url.hasNeededVars();
	else return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.GotoCommand.prototype.preview = function(options){
	this.clearPreview();
	// Don't show a preview for either goto url or goto window
}

/* examples:
// go to window 2 -- this syntax refers to windows/tabs in the order in which they are encountered by the script. 
//					So "window 1" is always the initial window. window/tab are interchangeable and mean the same thing.
// go to window # 2 -- the browser windows in z-order starting with the frontmost
// go to tab # 2 -- the tabs in the current browser window, numbered from left to right
// go to the "Faces" window -- the window title. window/tab are interchangeable and mean the same thing.
// go to the window that contains "Amazon"
*/
CoScripterCommand.prototype.GotoCommand.prototype.findTarget = function(){
	if (!this.targetSpec) throw "GotoCommand's findTarget called, but the command has no targetSpec. Use command.hasTargetSpec() before calling findTarget"
		
	var targetElement = this.execEnv.findWindow(this.targetSpec)
	return targetElement;
}

CoScripterCommand.prototype.GotoCommand.prototype.execute = function(thenDoThis, options){
	if (!this.hasTargetSpec()) {
		var loc = this.getLocation();
		var coScripterChromeWindow = this.coScripterChromeWindow
		this.execEnv.Goto(this.location2URL(loc), coScripterChromeWindow, thenDoThis, options);
	}
	else this.execEnv.GoToWindow(this.targetElement, thenDoThis, options);
}

CoScripterCommand.prototype.GotoCommand.prototype.location2URL = function(locStr){
		var urlStart = /^([a-zA-Z]+)\:/ ;
		if(!urlStart.test(locStr)){
			if (/ /.test(locStr)) {
				/* TL: I don't know if anyone else needs this, but I do.
				   When I type a string into my location bar, it defaults to a google search on that string.
				   However, CoScripter records only my search terms and not the google search url
				*/
				locStr = 'http://www.google.com/search?q=' +
					encodeURIComponent(locStr);
			} else {
				locStr = "http://" + locStr;
			}
		}
		return locStr;
}

CoScripterCommand.prototype.GotoCommand.prototype.getLocation = function(){
	return this.url.getValue();
}

// TL: warning, this might not actually set the location: 
//if a variable is being used, that could override this setting
CoScripterCommand.prototype.GotoCommand.prototype.setLocation = function(loc) {
	this.url = new CoScripterCommand.prototype.VariableValue(loc);
}

CoScripterCommand.prototype.GotoCommand.prototype.autoWait = function(){
	return false;
}


// ==============================================
// =========== GO FORWARD/BACKWARD ==============
// ==============================================
CoScripterCommand.prototype.createGoforwardFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.GoforwardCommand(slop,execEnv);
}

CoScripterCommand.prototype.createGoforwardFromParams = function(originalEvent, direction){
	var gofwdCmd = new CoScripterCommand.prototype.GoforwardCommand();
	
	gofwdCmd.direction=direction;
	gofwdCmd.originalEvent = originalEvent;
	
	// this must be done explicitly for every command created from params
	gofwdCmd.execEnv = gofwdCmd.components.executionEnvironment();
	
	return gofwdCmd;
}

CoScripterCommand.prototype.GoforwardCommand = function(slop,execEnv){
	CoScripterCommand.prototype.GoforwardCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.GOFORWARD;
	this.direction = this.FORWARD;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.GoforwardCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.GoforwardCommand.prototype.FORWARD = 'forward'
CoScripterCommand.prototype.GoforwardCommand.prototype.BACK = 'back'

CoScripterCommand.prototype.GoforwardCommand.prototype.hasTargetSpec = function(){
	return false;
}

CoScripterCommand.prototype.GoforwardCommand.prototype.toString = function(){
	return this.direction == this.FORWARD ? this.getAction() : "go back";
}

// TEMPORARY: in this case, it works
CoScripterCommand.prototype.GoforwardCommand.prototype.toSlop = function(){
	return this.toString();
}

CoScripterCommand.prototype.GoforwardCommand.prototype.variabilize = function(database) {
	return;
}

CoScripterCommand.prototype.GoforwardCommand.prototype.needsVars = function() {
	return false;
}

CoScripterCommand.prototype.GoforwardCommand.prototype.fillInVars = function(database) {
	return;
}

CoScripterCommand.prototype.GoforwardCommand.prototype.hasNeededVars = function() {
	return true;
}

CoScripterCommand.prototype.GoforwardCommand.prototype.preview = function(options){
}

CoScripterCommand.prototype.GoforwardCommand.prototype.canExecute = function(){
	var browser = this.execEnv.getCurrentBrowser();
	var chromeWindow = this.components.utils().getChromeWindowForNode(browser);
	if(this.direction==this.FORWARD){
		return chromeWindow.getWebNavigation().canGoForward
	}else{
		return chromeWindow.getWebNavigation().canGoBack
	}	 
} 

CoScripterCommand.prototype.GoforwardCommand.prototype.execute = function(thenDoThis, options){
	var browser = this.execEnv.getCurrentBrowser();
	var utils = this.components.utils();
	var chromeWindow = utils.getChromeWindowForNode(browser);
	if(this.direction==this.FORWARD){
		chromeWindow.getWebNavigation().goForward()
	}else{
		//go back
		chromeWindow.getWebNavigation().goBack()
	}
	utils.betterThenDoThis(chromeWindow, thenDoThis);
}

CoScripterCommand.prototype.GoforwardCommand.prototype.setDirection = function(direction) {
	this.direction=direction;
}

CoScripterCommand.prototype.GoforwardCommand.prototype.autoWait = function(){
	return false;
}


// ==================================
// =========== RELOAD  ==============
// ==================================
CoScripterCommand.prototype.createReloadFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.ReloadCommand(slop,execEnv);
}

CoScripterCommand.prototype.createReloadFromParams = function(originalEvent){
	var reloadCmd = new CoScripterCommand.prototype.ReloadCommand();
	
	reloadCmd.originalEvent = originalEvent;
	
	// this must be done explicitly for every command created from params
	reloadCmd.execEnv = reloadCmd.components.executionEnvironment();
	
	return reloadCmd;
}

CoScripterCommand.prototype.ReloadCommand = function(slop,execEnv){
	CoScripterCommand.prototype.ReloadCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.RELOAD;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.ReloadCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ReloadCommand.prototype.hasTargetSpec = function(){
	return false;
}

CoScripterCommand.prototype.ReloadCommand.prototype.toString = function(){
	return this.getAction() ;
}

// TEMPORARY: in this case, it works
CoScripterCommand.prototype.ReloadCommand.prototype.toSlop = function(){
	return this.toString();
}

CoScripterCommand.prototype.ReloadCommand.prototype.variabilize = function(database) {
	return;
}

CoScripterCommand.prototype.ReloadCommand.prototype.needsVars = function() {
	return false;
}

CoScripterCommand.prototype.ReloadCommand.prototype.fillInVars = function(database) {
	return;
}

CoScripterCommand.prototype.ReloadCommand.prototype.hasNeededVars = function() {
	return true;
}

CoScripterCommand.prototype.ReloadCommand.prototype.preview = function(options){
}

CoScripterCommand.prototype.ReloadCommand.prototype.canExecute = function(){
	// dump('ReloadCommand.canExecute\n')
	return true;
} 

CoScripterCommand.prototype.ReloadCommand.prototype.execute = function(thenDoThis, options){
	var browser = this.execEnv.getCurrentBrowser();
	var utils = this.components.utils();
	var chromeWindow = utils.getChromeWindowForNode(browser);
	browser.reload();
	utils.betterThenDoThis(chromeWindow, thenDoThis);
}

CoScripterCommand.prototype.ReloadCommand.prototype.autoWait = function(){
	return false;
}


//===================================
//=========== Toggle ================
//===================================
CoScripterCommand.prototype.createToggleFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.ToggleCommand(slop,execEnv);
}

CoScripterCommand.prototype.createToggleFromParams = function(originalEvent, label, type){
	var toggleCmd = new CoScripterCommand.prototype.ToggleCommand();
	
	toggleCmd.originalEvent = originalEvent;
	toggleCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	toggleCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
	toggleCmd.targetSpec.targetType = type;
	
	// this must be done explicitly for every command created from params
	toggleCmd.execEnv = toggleCmd.components.executionEnvironment();

	return toggleCmd;
}

CoScripterCommand.prototype.ToggleCommand = function(slop,execEnv){
	CoScripterCommand.prototype.ToggleCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.TOGGLE;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.ToggleCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ToggleCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and toggle it ";
}

CoScripterCommand.prototype.ToggleCommand.prototype.toSlop = function(){
	return "toggle the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.ToggleCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.ToggleCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.ToggleCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.ToggleCommand.prototype.hasNeededVars = function() {
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.ToggleCommand.prototype.execute = function(thenDoThis, options){
	throw "toggleCommand.execute has not been implemented"
	// this.execEnv.Toggle(this.targetElement,thenDoThis, this.turnon, options); Need to figure out how to toggle
}

CoScripterCommand.prototype.ToggleCommand.prototype.autoWait = function(){
	return true;
}


//===================================
// ======= ExpandCollapse ============
//===================================
CoScripterCommand.prototype.createExpandCollapseFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.ExpandCollapseCommand(slop,execEnv);
}

CoScripterCommand.prototype.createExpandCollapseFromParams = function(originalEvent, label, type, expand){
	
	var expandCollapseCmd = new CoScripterCommand.prototype.ExpandCollapseCommand();
	
	expandCollapseCmd.originalEvent = originalEvent;
	expandCollapseCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	expandCollapseCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
	expandCollapseCmd.targetSpec.targetType = type;
	expandCollapseCmd.expand = expand ;
	
	// this must be done explicitly for every command created from params
	expandCollapseCmd.execEnv = expandCollapseCmd.components.executionEnvironment();
	
	return expandCollapseCmd;
}

CoScripterCommand.prototype.ExpandCollapseCommand = function(slop,execEnv){
	CoScripterCommand.prototype.ExpandCollapseCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.EXPANDCOLLAPSE;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.ExpandCollapseCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and expand/collapse it";
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.toSlop = function(){
	return (this.turnon?"expand":"collapse") + " the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.hasNeededVars = function() {
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: expand/collapse ' + this.turnon + ' the ' + this.targetSpec.getTargetLabel() + '\n');
	this.execEnv.ExpandOrCollapse(this.targetElement, this.turnon, thenDoThis);
}

CoScripterCommand.prototype.ExpandCollapseCommand.prototype.autoWait = function(){
	return true;
}


// =========================================
// ============== CREATE TAB ===============
// =========================================
CoScripterCommand.prototype.createCreateFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.CreateCommand(slop,execEnv);
}

CoScripterCommand.prototype.createCreateFromParams = function(originalEvent, isTab){
	var createCmd = new CoScripterCommand.prototype.CreateCommand();
	createCmd.isTab = true;
	
	// this must be done explicitly for every command created from params
	createCmd.execEnv = createCmd.components.executionEnvironment();
	
	return createCmd;
}

CoScripterCommand.prototype.CreateCommand = function(slop,execEnv){
	CoScripterCommand.prototype.CreateCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.CREATE;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.CreateCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.CreateCommand.prototype.hasTargetSpec = function(){
	return false;
}

CoScripterCommand.prototype.CreateCommand.prototype.toString = function(){
	return this.getAction() + " new " + (this.isTab ? "tab" : "window");
}

CoScripterCommand.prototype.CreateCommand.prototype.toSlop = function(){
	return this.toString();
}

CoScripterCommand.prototype.CreateCommand.prototype.variabilize = function(database) {
	return;
}

CoScripterCommand.prototype.CreateCommand.prototype.needsVars = function() {
	return false;
}

CoScripterCommand.prototype.CreateCommand.prototype.fillInVars = function(database) {
	return;
}

CoScripterCommand.prototype.CreateCommand.prototype.hasNeededVars = function() {
	return true;
}

CoScripterCommand.prototype.CreateCommand.prototype.preview = function(options){
}

CoScripterCommand.prototype.CreateCommand.prototype.canExecute = function(){
	return true;
} 

CoScripterCommand.prototype.CreateCommand.prototype.execute = function(thenDoThis, options){
	//this.execEnv.Create(thenDoThis);
}

CoScripterCommand.prototype.CreateCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== REPEAT ====================
// ===================================
CoScripterCommand.prototype.RepeatCommand = function(slop,execEnv){
	CoScripterCommand.prototype.RepeatCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.REPEAT;
	this.firstIterationP = true;	// also set to true by advanceStep
									// true if Step or Run from a step above this one made this the current command
									// false if an iteration ended and a new iteration is about to start
									// defaults to true.  If the user clicks on this step in the editor, the value of firstIterationP isn't changed
									// Set by advanceStep in command-processor
									// advanceStep halts iteration after the final step in the final iteration
	this.currentScratchtableRowNumber = -1;	// The row in the scratchtable that is being used for the current iteration.
								// It is advanced when Step or Run executes this "repeat" command. 
								// It is set to the next selected (with a check mark) row in the scratchtable.
	this.terminatedP = false;	// set by Repeat command's execute method
	this.infiniteLoopP = false
	this.iterationVariable = null;	// optional. Can be a personal DB variable or a scratchtable cell. 
									// Used to make the iteration variable accessible, so its value can be viewed or modified.
	// If there is an iterationVariable, either dbKey or cellReference will be filled in
	this.dbKey = null;	// variableValue
	this.cellReference = null;	// scratchtable Reference 
	this.database = null	// get a pointer to the personal database from fillInVars. Used by this.dbKey.
	return this;
}

JSInheritance.extend(CoScripterCommand.prototype.RepeatCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.RepeatCommand.prototype.toString = function(){
	var withClause = ""
	if (this.dbKey) withClause = " with " + this.dbKey.toString()
	if (this.cellReference) withClause = " with " + this.cellReference.toString()
	return this.getAction() + withClause;
}

CoScripterCommand.prototype.RepeatCommand.prototype.toSlop = function(){	
    return this.toString();
}

CoScripterCommand.prototype.RepeatCommand.prototype.variabilize = function(database) {
	// For a variableValue, takes this.literal and tries to find a database key that has it as a value; if so, sets this up as a variable.
	if (this.dbKey) this.dbKey.variabilize(database);
	if (this.cellReference) this.cellReference.variabilize(database);
}

CoScripterCommand.prototype.RepeatCommand.prototype.needsVars = function() {
	return ((this.dbKey && this.dbKey.needsVars()) || (this.cellReference && this.cellReference.needsVars()));
}

CoScripterCommand.prototype.RepeatCommand.prototype.fillInVars = function(database) {
	this.database = database	// get a pointer to the database for use in execute
	if (this.dbKey) this.dbKey.fillInVars(database);
	if (this.cellReference) this.cellReference.fillInVars(database);
}

CoScripterCommand.prototype.RepeatCommand.prototype.hasNeededVars = function() {
	return ((this.dbKey && this.dbKey.hasNeededVars()) || (this.cellReference && this.cellReference.hasNeededVars()) || (!this.dbKey && !this.cellReference));
}

CoScripterCommand.prototype.RepeatCommand.prototype.canExecute = function(){
	return this.hasNeededVars() ;
} 

CoScripterCommand.prototype.RepeatCommand.prototype.evaluate = function() {
	debug("Called 'evaluate' for RepeatCommand")
	return true;
}

CoScripterCommand.prototype.RepeatCommand.prototype.execute = function(thenDoThis, options){
	var u = this.components.utils()
	var executionEngine = this.components.executionEngine()
	var executionEnvironment = this.components.executionEnvironment()

	// set executionEngine.repeatStepData: currentScratchtableRowNumber, infiniteLoopP, terminatedP, and possibly firstIterationP 
	executionEngine.setInfiniteLoopP()
	if (!executionEngine.repeatStepData.infiniteLoopP) {
		var nextScratchtableRowNumber = this.getNextScratchtableRowNumber()	// determine which row of the scratchtable to use in this iteration
		if (nextScratchtableRowNumber) {
			executionEngine.repeatStepData.terminatedP = false
			executionEngine.updateScratchtableRowNumberReferences(nextScratchtableRowNumber)	// change the scratchtableRowNumber in every command inside this Repeat loop
			executionEngine.repeatStepData.currentScratchtableRowNumber = nextScratchtableRowNumber
			this.updateTheWithVariable(nextScratchtableRowNumber)
		} else {	// loop has terminated
			executionEngine.repeatStepData.terminatedP = true
		}
	}
	
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.RepeatCommand.prototype.getNextScratchtableRowNumber = function() {
	var u = this.components.utils()
	var executionEngine = this.components.executionEngine()
	var executionEnvironment = this.components.executionEnvironment()

	var currentScratchtableRowNumber = null	// these are scratchtable rows, not command lines
	if (executionEngine.repeatStepData.firstIterationP){
		executionEngine.repeatStepData.firstIterationP = false
		executionEnvironment.defaultToSelectingAllScratchtableRows()	// if no rows have been explicitly selected by the user, the default is to iterate over all of the rows in the scratchtable
		currentScratchtableRowNumber = 0
	}
	else currentScratchtableRowNumber = executionEngine.repeatStepData.currentScratchtableRowNumber
	
	var nextScratchtableRowNumber = executionEnvironment.determineNextScratchtableRowNumber(currentScratchtableRowNumber)
	return nextScratchtableRowNumber	
}

CoScripterCommand.prototype.RepeatCommand.prototype.updateTheWithVariable = function(newValue) {
	// update the WITH variable
	if (this.cellReference) {
		this.cellReference.setValue(newValue)
	}
	if (this.dbKey) {
		this.setPersonalDBValue(this.database, this.dbKey, newValue)
	}
}

CoScripterCommand.prototype.RepeatCommand.prototype.setPersonalDBValue = function(database, dbKey, value) {
	var keyName = dbKey.getValue()
	if (!keyName) return;
	database.changeEntry(keyName, value);
}

CoScripterCommand.prototype.RepeatCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== IF ====================
// ===================================
// Used for If, Wait, and Assert/Verify commands
CoScripterCommand.prototype.IfCommand = function(slop,execEnv){
	// There are two kinds of If commands: existence test and comparison test.
	CoScripterCommand.prototype.IfCommand.baseConstructor.call(this, slop,execEnv);	
	this.type = CoScripterCommand.prototype.ACTIONS.IF
	this.token = null;		//set by IfCommand in strict-parser
	this.result = null;		// IF command evaluates to true or false
	
	this.positive = true;	// If there is, or If there is not
	this.textCommandP = false;	// Is this an 'if there is (not) text "foo" ...' command?
	this.selectionP = false;	// Is this an 'if there is (not) a selection' command?
	this.targetSpec = null;
	
	this.matchType = null;	//matchType is null for existence tests.
	this.leftSide = null;	//variableValue
	this.rightSide = null;	//variableValue
	
	return this;
}

JSInheritance.extend(CoScripterCommand.prototype.IfCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.IfCommand.prototype.getAction = function(){	
	return this.token.str	//token is passed in to IfCommand by the parse() method. It is an object with 'type' and 'str' properties e.g. type='wait' and str='wait until' 
}

CoScripterCommand.prototype.IfCommand.prototype.getValue = function() {
	return this.result
}

CoScripterCommand.prototype.IfCommand.prototype.setValue = function(value) {
	this.result = value
}

CoScripterCommand.prototype.IfCommand.prototype.toSlop = function(){
	var commands = this.components.commands()
	if (!this.matchType){	// existence test
		if (this.selectionP) return this.getAction() + " there is " + (this.positive ? "a" : "no") + " " + "selection";
		else return this.getAction() + " there is " + (this.positive ? "a" : "no") + " " + this.targetSpec.toSlop();
	}
	else {					// comparison test
		return this.getAction() + " " + this.leftSide.toSlop() + " " + this.matchType + " " + this.rightSide.toSlop()
	}
}

CoScripterCommand.prototype.IfCommand.prototype.toString = function(){	
	return this.toSlop()
}

CoScripterCommand.prototype.IfCommand.prototype.variabilize = function(database) {
	if (this.selectionP) return;
	if (!this.matchType){	// existence test
		this.targetSpec.variabilize(database)
	}
	else {					// comparison test
		this.leftSide.variabilize(database)
		this.rightSide.variabilize(database)
	}	
}

CoScripterCommand.prototype.IfCommand.prototype.needsVars = function() {
	if (this.selectionP) return false;
	if (!this.matchType){	// existence test
		return this.targetSpec.needsVars();
	}
	else {					// comparison test
		return this.leftSide.needsVars() || this.rightSide.needsVars()
	}	
}

CoScripterCommand.prototype.IfCommand.prototype.fillInVars = function(database) {
	if (this.selectionP) return;
	if (!this.matchType){	// existence test
		this.targetSpec.fillInVars(database)
	}
	else {					// comparison test
		this.leftSide.fillInVars(database)
		this.rightSide.fillInVars(database)
	}	
}

CoScripterCommand.prototype.IfCommand.prototype.hasNeededVars = function() {
	if (this.selectionP) return true;
	if (!this.matchType){	// existence test
		return this.targetSpec.hasNeededVars();
	}
	else {					// comparison test
		return this.leftSide.hasNeededVars() || this.rightSide.hasNeededVars()
	}	
}

CoScripterCommand.prototype.IfCommand.prototype.canExecute = function() {
	if (this.selectionP) return true;
	if (!this.matchType){	// existence test
		return this.targetSpec.hasNeededVars();
	}
	else {					// comparison test
		return this.leftSide.hasNeededVars() && this.rightSide.hasNeededVars()
	}	
}

// Return true or false depending on whether the condition holds
CoScripterCommand.prototype.IfCommand.prototype.evaluate = function() {
	var parser = this.components.parser()
	var labeler = this.components.labeler()
	var result = true
	var target = null

	if (this.selectionP) {
		target = this.execEnv.getSelection()
		var hasTarget = (target != "")
		result = this.positive ? hasTarget : !hasTarget
	} else if (!this.matchType){	// existence test
		target = this.findTarget();
		var hasTarget = (target != null)
		// Is this an "if there is (not) text" command? If so, check the text, not just the target.
		if (this.textCommandP) {
			if (!hasTarget) result = false;	// a text command always evaluates to False if the target doesn't exist
			else {
				var commandText = this.string.getValue();	// this.getValue();
				var targetText = target.value ? target.value.toString() : ""
				result = this.positive ? (commandText == targetText) : (commandText != targetText)		
			}
		} else {
			result = this.positive ? hasTarget : !hasTarget
		}
	}
	else {					// comparison test
		var leftValue = labeler.regexEscape(this.leftSide.getValue())
		var rightValue = labeler.regexEscape(this.rightSide.getValue())
		var comparisonValue = null	// Ignoring any NOT, the Boolean value of the comparison
		if (this.matchType == parser.ParserConstants.CONTAINS)
			comparisonValue = (leftValue.search(".*" + rightValue + ".*") != -1)
		else if (this.matchType == parser.ParserConstants.STARTSWITH)
			comparisonValue = (leftValue.search("^" + rightValue + ".*") != -1)
		else if (this.matchType == parser.ParserConstants.ENDSWITH)
			ccomparisonValue = (leftValue.search(".*" + rightValue + "$") != -1)
		else if (this.matchType == parser.ParserConstants.EQUALS)
			comparisonValue = (leftValue.search("^" + rightValue + "$") != -1)
		else if (this.matchType == parser.ParserConstants.EQUALSIGN)
			comparisonValue = (Number(leftValue) == Number(rightValue)) ? true : false;
		else if (this.matchType == parser.ParserConstants.GREATERTHANSIGN)
			comparisonValue = (Number(leftValue) > Number(rightValue)) ? true : false;
		else if (this.matchType == parser.ParserConstants.LESSTHANSIGN)
			comparisonValue = (Number(leftValue) < Number(rightValue)) ? true : false;
		result = this.positive ? comparisonValue : !comparisonValue
	}
	this.setValue(result)
	return result
}

CoScripterCommand.prototype.IfCommand.prototype.execute = function(thenDoThis, options){	
	// For an "if" command, commandExecutedCallback (which is thenDoThis) 
	//looks at this.result (which is set by IfCommand's evaluate method) to decide what to do.
	var utils = this.components.utils();
	var browser = null, chromeWindow = null;
	if (this.canExecute()) {
		this.evaluate()
		
		switch(this.getAction()) {
			case "if" :
			case "assert" :
			case "verify" : 				
				if (thenDoThis != null) thenDoThis();
				return;				
			case "wait until" :
				if (this.getValue() == true) {
					if (thenDoThis != null) {
						browser = this.execEnv.getCurrentBrowser();
						chromeWindow = utils.getChromeWindowForNode(browser);
						// Added a pause because Jalal found cases where clicks in ISC (Integrated Solutions Console for WAS) 
						//didn't work immediately after waitUntil became true (AC)
						chromeWindow.setTimeout(thenDoThis, 1000);
					}
				} else {
					// Save off a pointer to the current "this" context, because inside the setTimeout callback, "this" will point to the
					// window and not to the WaitCommand.  Then we use "apply" to run the WaitCommand's execute function with the proper "this" context.
					var __this = this;
					browser = this.execEnv.getCurrentBrowser();
					chromeWindow = utils.getChromeWindowForNode(browser);
					chromeWindow.setTimeout(function() {
						CoScripterCommand.prototype.IfCommand.prototype.execute.apply(__this, [thenDoThis, options]);
					}, 100);
				}
				return;	
		}
	} 
	else throw "If command failure for " + this.toSlop();	
}

CoScripterCommand.prototype.IfCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== ELSE ====================
// ===================================
CoScripterCommand.prototype.ElseCommand = function(slop,execEnv){
	CoScripterCommand.prototype.ElseCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.ELSE;
	return this;
}

JSInheritance.extend(CoScripterCommand.prototype.ElseCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ElseCommand.prototype.toString = function(){	
	return "else";
}

CoScripterCommand.prototype.ElseCommand.prototype.toSlop = function(){	
    return this.getAction();
}

CoScripterCommand.prototype.ElseCommand.prototype.needsVars = function() {
	return false;
}

CoScripterCommand.prototype.ElseCommand.prototype.hasNeededVars = function() {
	return true;
}

CoScripterCommand.prototype.ElseCommand.prototype.canExecute = function(){
	return true;
}

CoScripterCommand.prototype.ElseCommand.prototype.evaluate = function() {
	return true;
}

CoScripterCommand.prototype.ElseCommand.prototype.execute = function(thenDoThis, options){
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.ElseCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== CLIP ==================
// ===================================
CoScripterCommand.prototype.createClipFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.ClipCommand(slop,execEnv);
}

// TL: currently only an xpath-based clip can be created
CoScripterCommand.prototype.createClipFromParams = function(originalEvent, target){

	var clipCmd = new CoScripterCommand.prototype.ClipCommand();
	
	// this must be done explicitly for every command created from params
	clipCmd.execEnv = clipCmd.components.executionEnvironment();

	// Populate the target spec with an xpath
	clipCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	clipCmd.targetSpec.xpath = clipCmd.components.utils().getIdXPath(target);
	
	return clipCmd;
}

CoScripterCommand.prototype.ClipCommand = function(slop,execEnv){
	CoScripterCommand.prototype.ClipCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.CLIP ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.ClipCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ClipCommand.prototype.hasTargetSpec = function(){
	return true;
}

CoScripterCommand.prototype.ClipCommand.prototype.toString = function(){
	return this.getAction() + " the " + this.targetSpec.toString();
}

// TEMPORARY: may not work
CoScripterCommand.prototype.ClipCommand.prototype.toSlop = function(){
	return this.toString();
}

CoScripterCommand.prototype.ClipCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.ClipCommand.prototype.hasNeededVars = function() {
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.ClipCommand.prototype.preview = function(options){
	this.clearPreview();
	this.previewConfig = this.execEnv.preview(this, options);
}

// Evaluate the clip region and return its innerHTML
CoScripterCommand.prototype.ClipCommand.prototype.evaluate = function(){
	dump('trying to find region:' + this.targetSpec.toString() + '\n');
	var u = this.components.utils()
	var target = this.findTarget();
	if (target != null) u.highlightThenDo(target, function(){})
	return target;
}

CoScripterCommand.prototype.ClipCommand.prototype.execute = function(thenDoThis, options){
	dump("Setting system clipboard\n");
	var target = this.evaluate();
	this.components.utils().copyHTMLToSystemClipboard(target);
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.ClipCommand.prototype.getLocation = function(){
	return this.loc.getValue();
}

CoScripterCommand.prototype.ClipCommand.prototype.autoWait = function(){
	return true;
}


// ===================================
// =========== ENTER =================
// ===================================
CoScripterCommand.prototype.createEnterFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.EnterCommand(slop,execEnv);
}

CoScripterCommand.prototype.createEnterFromParams = function(originalEvent, label, type, textToEnter, isPassword){
	var enterCmd = new CoScripterCommand.prototype.EnterCommand();
	enterCmd.initializeCommandFromParams(originalEvent, label, type, textToEnter, isPassword);
	
	// this must be done explicitly for every command created from params
	enterCmd.execEnv = enterCmd.components.executionEnvironment();
	return enterCmd;
}

CoScripterCommand.prototype.EnterCommand = function(slop,execEnv){
	CoScripterCommand.prototype.EnterCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.ENTER ;
	// The isPassword variable indicates whether the target is a password field or not.  
	// It is not used in this file, but it is consulted by the FilterPassword filter to determine whether to hide the password during slop generation.
	this.isPassword = false;
	this.string = new CoScripterCommand.prototype.VariableValue("");
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.EnterCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.EnterCommand.prototype.initializeCommandFromParams = function(originalEvent, label, type, textToEnter, isPassword){
    this.originalEvent = originalEvent;
	this.string = new CoScripterCommand.prototype.VariableValue(textToEnter);
	this.isPassword = isPassword;
	if (type == this.components.labeler().WEBTYPES.DOJOWIDGET){
	    var targetSpec = label	// kludge: the targetSpec was passed in using the 'label' parameter
	    var targetLabel = new CoScripterCommand.prototype.VariableValue(targetSpec.targetLabel)
	    this.targetSpec = targetSpec 
	    this.targetSpec.targetLabel = targetLabel
	} else {
		this.targetSpec = new CoScripterCommand.prototype.TargetSpec();
		this.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
		this.targetSpec.targetType = type;
	}
}

CoScripterCommand.prototype.EnterCommand.prototype.getValue = function() {
	return this.string.getValue();
}
CoScripterCommand.prototype.EnterCommand.prototype.setValue = function(value) {
	this.string = new CoScripterCommand.prototype.VariableValue(value);
}

CoScripterCommand.prototype.EnterCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and enter '"  + escape(this.string) + "'";
}

CoScripterCommand.prototype.EnterCommand.prototype.toSlop = function(){
	var t;
	// TL: the optional FilterPassword filter will set the hidePasswordValue flag to true if we are supposed to hide the password (HACK)
	if (this.hidePasswordValue) {
		t = "your password";
	} else {
		t = this.string.toSlop();
	}
	return this.getAction() + " " + t + " into the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.EnterCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
	this.string.variabilize(database);
}

CoScripterCommand.prototype.EnterCommand.prototype.needsVars = function() {
	return this.string.needsVars() || this.targetSpec.needsVars();
}

CoScripterCommand.prototype.EnterCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
	this.string.fillInVars(database);
}

CoScripterCommand.prototype.EnterCommand.prototype.hasNeededVars = function() {
	return this.string.hasNeededVars() && this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.EnterCommand.prototype.preview = function(options){
	if (null == options) options = {};
	this.clearPreview();

	options['overlaytext'] = this.getPreviewString();
	
	this.previewConfig = this.execEnv.preview(this, options);
}

CoScripterCommand.prototype.EnterCommand.prototype.execute = function(thenDoThis, options){
	//this.targetElement = this.findTarget();
	var value = this.string.getValue();
	//dump('EXECUTE: enter ' + value + ' into ' + this.targetSpec.getTargetLabel() + '\n');
	this.execEnv.Enter(this.targetElement,value,thenDoThis,options);
}

CoScripterCommand.prototype.EnterCommand.prototype.getPreviewString = function(){
	/* needsVar?	hasVar?	isPass?	isSecret?	display
	// N			-		Y		-			****
	// N			-		N		-			text
	// Y			N		-		-			""
	// Y			Y		N		N			var
	// Y			Y		N		Y			****
	// Y			Y		Y		N			****
	// Y			Y		Y		Y			****
	//
	// TL: this table is not 100% implemented yet.  When needsVar=N and
	// isPass=Y, it still displays text instead of stars.  This is because
	// at this point in the code, we do not know anything about the target
	// yet, whether it is a password box or not.  That check does not
	// happen until commandExecutionEnvironment.preview gets called.
	//
	// So, effectively, isPassword is only set and consulted when slop is
	// being generated, not during playback.  This is a bug.
	*/
	var previewString = "" ;
	var stars = "********";
	if (this.string.needsVars()) {
		if (this.string.hasNeededVars()) {
			if (this.isPassword==true || this.string.isSecret()) {
				previewString = stars;
			} else {
				previewString = this.string.getValue();
			}
		} else {
			previewString = '';
		}
	} else {
		if (this.isPassword == true) {
			previewString = stars;
		} else {
			previewString = this.string.getValue();
		}
	}
	return previewString ;
}

CoScripterCommand.prototype.EnterCommand.prototype.autoWait = function(){
	return true;
}


// ===================================
// =========== PUT =================
// ===================================
// Put a value into the Personal DB or a scratchtable
// * put "28" into your "age"
// * put "28" into the cell in column 2 of row 3 of the scratchtable
// * put the clipboard into your "age"
// * put the clipboard into the cell in column 2 of row 3 of the scratchtable
CoScripterCommand.prototype.createPutFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.PutCommand(slop,execEnv);
}

CoScripterCommand.prototype.createPutFromParams = function(originalEvent, label, type, textToPut, isPassword){
	var putCmd = new CoScripterCommand.prototype.PutCommand();
		
	putCmd.initializeCommandFromParams(originalEvent, label, type, textToPut, isPassword);
	
	// this must be done explicitly for every command created from params
	putCmd.execEnv = putCmd.components.executionEnvironment();
	
	return putCmd;
}

CoScripterCommand.prototype.PutCommand = function(slop,execEnv){
	CoScripterCommand.prototype.PutCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.PUT ;
	this.string = new CoScripterCommand.prototype.VariableValue("");
	this.clipboardP = false	// for * put the clipboard ... commands
	this.database = null	// get a pointer to the personal database from fillInVars
	// either dbKey or cellReference will be filled in
	this.dbKey = null;	// variableValue
	this.cellReference = null;	// scratchtable Reference 
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.PutCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.PutCommand.prototype.initializeCommandFromParams = function(originalEvent, label, type, textToPut, isPassword){
    this.originalEvent = originalEvent;
	this.string = new CoScripterCommand.prototype.VariableValue(textToPut);
}

CoScripterCommand.prototype.PutCommand.prototype.getValue = function() {
	return this.string.getValue();
}
CoScripterCommand.prototype.PutCommand.prototype.setValue = function(value) {
	this.string = new CoScripterCommand.prototype.VariableValue(value);
}

CoScripterCommand.prototype.PutCommand.prototype.toString = function(){	
	var theString = this.clipboardP ? "the clipboard" : escape(this.string)
	var targetSlop = ""
	if (this.dbKey) targetSlop = this.dbKey.toString()
	else if (this.cellReference) targetSlop = this.cellReference.toString()
	return "put '"  + theString + "' into " + targetSlop;
}

CoScripterCommand.prototype.PutCommand.prototype.toSlop = function(){
	var theString = this.clipboardP ? "the clipboard" : this.string.toSlop()
	var targetSlop = ""
	if (this.dbKey) targetSlop = this.dbKey.toSlop();
	if (this.cellReference) targetSlop = this.cellReference.toSlop();
	return this.getAction() + " " + theString + " into " + targetSlop;
}

CoScripterCommand.prototype.PutCommand.prototype.variabilize = function(database) {
	if (this.dbKey) this.dbKey.variabilize(database);
	if (this.cellReference) this.cellReference.variabilize(database);
	if (!this.clipboardP) this.string.variabilize(database);
}

CoScripterCommand.prototype.PutCommand.prototype.needsVars = function() {
	var stringNeedsVars = this.clipboardP ? false : this.string.needsVars()
	return stringNeedsVars && ((this.dbKey && this.dbKey.needsVars()) || (this.cellReference && this.cellReference.needsVars()));
}

CoScripterCommand.prototype.PutCommand.prototype.fillInVars = function(database) {
	this.database = database	// get a pointer to the database for use in execute
	if (this.dbKey) this.dbKey.fillInVars(database);
	if (this.cellReference) this.cellReference.fillInVars(database);
	if (!this.clipboardP) this.string.fillInVars(database);
}

CoScripterCommand.prototype.PutCommand.prototype.hasNeededVars = function() {
	var stringHasNeededVars = this.clipboardP ? true : this.string.hasNeededVars()
	return stringHasNeededVars && ((this.dbKey && this.dbKey.hasNeededVars()) || (this.cellReference && this.cellReference.hasNeededVars()));
}

CoScripterCommand.prototype.PutCommand.prototype.preview = function(options){
	this.clearPreview();
	this.previewConfig = this.execEnv.preview(this, options);
}

CoScripterCommand.prototype.PutCommand.prototype.canExecute = function(){
	// dump('GotoCommand.canExecute\n')
	return this.hasNeededVars() ;
} 

CoScripterCommand.prototype.PutCommand.prototype.execute = function(thenDoThis, options){
	var value = null
	if (this.clipboardP) {
		value = this.execEnv.getClipboardContents()
	} else {
		value = this.string.getValue();
	}
	if (this.cellReference) {
		this.cellReference.setValue(value)
	}
	if (this.dbKey) {
		this.setPersonalDBValue(this.database, this.dbKey, value)
	}
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.PutCommand.prototype.setPersonalDBValue = function(database, dbKey, value) {
	var keyName = dbKey.getValue()
	if (!keyName) return;
	database.changeEntry(keyName, value);
}

CoScripterCommand.prototype.PutCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== INCREMENT =================
// ===================================
// Increment/Decrement a variable in the Personal DB or a cell in the scratchtable
// * increment your "age" by 2
// * increment the cell in column 2 of row 3 of the scratchtable by your "age"
CoScripterCommand.prototype.IncrementCommand = function(slop,execEnv){
	CoScripterCommand.prototype.IncrementCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.INCREMENT;
	this.positiveP = true;	// false for Decrement command
	this.amount = new CoScripterCommand.prototype.VariableValue("");	// the value of the increment
	this.database = null	// get a pointer to the personal database from fillInVars
	// either dbKey or cellReference will be filled in
	this.dbKey = null;	// variableValue
	this.cellReference = null;	// scratchtable Reference 
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.IncrementCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.IncrementCommand.prototype.getAction = function(){
	return this.positiveP ? this.type : "Decrement"
}

CoScripterCommand.prototype.IncrementCommand.prototype.toString = function(){	
	var targetSlop = ""
	if (this.dbKey) targetSlop = this.dbKey.toString()
	else if (this.cellReference) targetSlop = this.cellReference.toString()
	return "increment '"  + targetSlop + "' by " + escape(this.amount);
}

CoScripterCommand.prototype.IncrementCommand.prototype.toSlop = function(){
	var targetSlop = ""
	if (this.dbKey) targetSlop = this.dbKey.toSlop();
	if (this.cellReference) targetSlop = this.cellReference.toSlop();
	return this.getAction() + " " + targetSlop + " by " + this.amount.toSlop();
}

CoScripterCommand.prototype.IncrementCommand.prototype.variabilize = function(database) {
	if (this.dbKey) this.dbKey.variabilize(database);
	if (this.cellReference) this.cellReference.variabilize(database);
	this.amount.variabilize(database);
}

CoScripterCommand.prototype.IncrementCommand.prototype.needsVars = function() {
	return this.amount.needsVars() && ((this.dbKey && this.dbKey.needsVars()) || (this.cellReference && this.cellReference.needsVars()));
}

CoScripterCommand.prototype.IncrementCommand.prototype.fillInVars = function(database) {
	this.database = database	// get a pointer to the database for use in execute
	if (this.dbKey) this.dbKey.fillInVars(database);
	if (this.cellReference) this.cellReference.fillInVars(database);
	this.amount.fillInVars(database);
}

CoScripterCommand.prototype.IncrementCommand.prototype.hasNeededVars = function() {
	return this.amount.hasNeededVars() && ((this.dbKey && this.dbKey.hasNeededVars()) || (this.cellReference && this.cellReference.hasNeededVars()));
}

CoScripterCommand.prototype.IncrementCommand.prototype.preview = function(options){
	this.clearPreview();
	this.previewConfig = this.execEnv.preview(this, options);
}

CoScripterCommand.prototype.IncrementCommand.prototype.canExecute = function(){
	// dump('GotoCommand.canExecute\n')
	return this.hasNeededVars() ;
} 

CoScripterCommand.prototype.IncrementCommand.prototype.execute = function(thenDoThis, options){
	var amount = this.amount.getValue();
	if (!this.positiveP) amount = -1 * amount
	if (this.cellReference) {
		var currentValue = Number(this.cellReference.getValue())
		amount = Number(amount)
		if (isNaN(currentValue) || isNaN(amount)) throw new Exception('IncrementCommand given a non-number: ' + currentValue + " or " + amount);
		this.cellReference.setValue(currentValue + amount)
	}
	if (this.dbKey) {
		this.incrementPersonalDBValue(this.database, this.dbKey, amount)
	}
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.IncrementCommand.prototype.incrementPersonalDBValue = function(database, dbKey, amount) {
	var keyName = dbKey.getValue()
	if (!keyName) return;
	var keyValue = { key : keyName, value : "" }
	database.lookupAlgorithm3Entry(keyValue)
	var currentValue = Number(keyValue.value)
	amount = Number(amount)
	if (isNaN(currentValue) || isNaN(amount)) return;
	database.changeEntry(keyName, currentValue + amount);
}

CoScripterCommand.prototype.IncrementCommand.prototype.autoWait = function(){
	return false;
}

//====================================
//=========== Append =================
//====================================
CoScripterCommand.prototype.createAppendFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.AppendCommand(slop,execEnv);
}

CoScripterCommand.prototype.createAppendFromParams = function(originalEvent, label, type, textToEnter, isPassword, textBefore){
	var appendCmd = new CoScripterCommand.prototype.AppendCommand();
		
	appendCmd.initializeCommandFromParams(originalEvent, label, type, textToEnter, isPassword);
	
	// this must be done explicitly for every command created from params
	appendCmd.execEnv = appendCmd.components.executionEnvironment();
		
	return appendCmd;
}

CoScripterCommand.prototype.AppendCommand = function(slop,execEnv){
	CoScripterCommand.prototype.AppendCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.APPEND;
	// This variable indicates whether the target is a password field or not.
	// It is not used in this file, but it is consulted by the
	// FilterPassword filter to determine whether to hide the password during slop generation.
	this.isPassword = false;
	this.string = new CoScripterCommand.prototype.VariableValue("");
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.AppendCommand, CoScripterCommand.prototype.EnterCommand);

CoScripterCommand.prototype.AppendCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and append '"  + escape(this.string) + "'";
}

CoScripterCommand.prototype.AppendCommand.prototype.toSlop = function(){
	var t;
	// TL: the optional FilterPassword filter will set the
	// hidePasswordValue flag to true if we are supposed to hide the
	// password (HACK)
	if (this.hidePasswordValue) {
		t = "your password";
	} else {
		t = this.string.toSlop();
	}
	return this.getAction() + " " + t + " to the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.AppendCommand.prototype.execute = function(thenDoThis, options){
	//this.targetElement = this.findTarget();
	var oldValue = this.targetElement.value;
	var newValue = oldValue + this.string.getValue(); // Space in between? Prob not?
	//dump('EXECUTE: append ' + value + ' into ' + this.targetSpec.getTargetLabel() + '\n');
	this.execEnv.Enter(this.targetElement,newValue,thenDoThis,options);
}

CoScripterCommand.prototype.AppendCommand.prototype.getPreviewString = function(){
	// CD 10/1/2009 Should AppendCommand actually support passwords? 
	//    like append your password to the foo textbox??? not really eh?
	/* needsVar?	hasVar?	isPass?	isSecret?	display
	// N			-		Y		-			****
	// N			-		N		-			text
	// Y			N		-		-			""
	// Y			Y		N		N			var
	// Y			Y		N		Y			****
	// Y			Y		Y		N			****
	// Y			Y		Y		Y			****
	//
	// TL: this table is not 100% implemented yet.  When needsVar=N and
	// isPass=Y, it still displays text instead of stars.  This is because
	// at this point in the code, we do not know anything about the target
	// yet, whether it is a password box or not.  That check does not
	// happen until commandExecutionEnvironment.preview gets called.
	//
	// So, effectively, isPassword is only set and consulted when slop is
	// being generated, not during playback.  This is a bug.
	*/
	var oldVal = this.findTarget().value ;
	var previewString = "" ;
	var stars = "********";
	if (this.string.needsVars()) {
		if (this.string.hasNeededVars()) {
			if (this.isPassword==true || this.string.isSecret()) {
				previewString = stars;
			} else {
				previewString = oldVal + this.string.getValue() ;
			}
		} else {
			previewString = '';
		}
	} else {
		if (this.isPassword == true) {
			previewString = stars;
		} else {
			previewString = oldVal + this.string.getValue();
		}
	}
	return previewString ;
}


// ===================================
// =========== CLICK =================
// ===================================
CoScripterCommand.prototype.createClickFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.ClickCommand(slop,execEnv);
}

CoScripterCommand.prototype.createClickFromParams = function(originalEvent, label, type, ctrlP){
	var clickCmd = new CoScripterCommand.prototype.ClickCommand();
	var utils = clickCmd.components.utils();
	var labeler = clickCmd.components.labeler();
	
	clickCmd.originalEvent = originalEvent;
	clickCmd.controlP = ctrlP;
	
	if (type == labeler.WEBTYPES.TABLECELL){ // use a special TableTargetSpec
		clickCmd.targetSpec = new CoScripterCommand.prototype.TableTargetSpec()
		clickCmd.targetSpec.targetColumnLabel = new CoScripterCommand.prototype.VariableValue(label[0])
		clickCmd.targetSpec.targetColumnNumber = new CoScripterCommand.prototype.VariableValue(label[1])
		clickCmd.targetSpec.targetRowNumber = new CoScripterCommand.prototype.VariableValue(label[2])
		//clickCmd.targetSpec.targetTableLabel = new CoScripterCommand.prototype.VariableValue(String(label[3]))
		clickCmd.targetSpec.targetLabel = clickCmd.targetSpec.getTargetLabel()
		clickCmd.targetSpec.targetType = type;
	}
	else if (type == labeler.WEBTYPES.DOJOWIDGET){
		clickCmd.targetSpec = label	// the targetSpec was passed in using the 'label' parameter
		clickCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(clickCmd.targetSpec.targetLabel)
		clickCmd.targetSpec.subcomponentLabel = new CoScripterCommand.prototype.VariableValue(clickCmd.targetSpec.subcomponentLabel)
		//clickCmd.targetSpec.targetType = type;	// the CA barWidget breaks in handleEvent's postprocessing call to listTargetMatches if the
												// targetType is null.  But I think the DojoWidgetTargetSpec's toSlop method
												// relies on it being null for some kinds of dojowidgets.  (AC)
		if (clickCmd.targetSpec.action) clickCmd.type = clickCmd.targetSpec.action
	}
	else {
		clickCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
		clickCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
		clickCmd.targetSpec.targetType = type;
		if (originalEvent != null)
		{
			clickCmd.targetSpec.clickLoc = this.getClickLoc(originalEvent, utils)
		}
	}
	
	// this must be done explicitly for every command created from params
	clickCmd.execEnv = clickCmd.components.executionEnvironment();

	return clickCmd;
}

CoScripterCommand.prototype.ClickCommand = function(slop,execEnv){
	CoScripterCommand.prototype.ClickCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.CLICK ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.ClickCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ClickCommand.prototype.getAction = function(){
	if (this.type == "click" && this.controlP == true) return "control-click"
    else return this.type;
}

CoScripterCommand.prototype.ClickCommand.prototype.getTargetType = function(){
	if(this.targetSpec){
		if(this.targetSpec.getTargetType) return this.targetSpec.getTargetType();
		return this.targetSpec.targetAreaType
	}
	return null;
}

CoScripterCommand.prototype.ClickCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and " + this.controlP?"control-":""  + "click it";
}

CoScripterCommand.prototype.ClickCommand.prototype.toSlop = function(){
	var targetSlop = ""
	if (this.targetSpec.widgetClass) {	// dojoTargetSpec.toSlop figures out the entire command's slop
		this.targetSpec.action = this.getAction()
		targetSlop = this.targetSpec.toSlop()
		return targetSlop
	}
	
	if (targetSlop.slice(0,2) == '\"/') {	//XPath
		theText = this.getAction() + " x" + targetSlop.substring(0,targetSlop.length-6) 	// remove ' xpath' from the end
		theText += " at (" + this.targetSpec.getClickLocX() + "," + this.targetSpec.getClickLocY()  + ")"
		return theText
	}
	return this.getAction() + " the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.ClickCommand.prototype.variabilize = function(database) {
	//kludge: don't variabilize table cells for now (AC)
	if (this.targetSpec.targetType != "cell") this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.ClickCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.ClickCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.ClickCommand.prototype.hasNeededVars = function() {
 	if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE ||
		this.targetSpec.tableType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) 
			return true;	//having a target is good enough until we add VariableValues for row and column references
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.ClickCommand.prototype.execute = function(thenDoThis, options){
	//debug('execute: click ' + this.targetSpec.getTargetLabel() + '\n');
 	if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE ||
		this.targetSpec.tableType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) 
	{
		// go to the url of this link
		var cellReference = this.targetElement
		var url = cellReference.tableElement.getMetaData(cellReference.tableIndex, cellReference.rowIndex-1, cellReference.columnIndex-1)
		this.execEnv.Goto(url, this.coScripterChromeWindow, thenDoThis,options);
	}
	else {
		//debug("execute click on target of type: " + this.targetElement.nodeName)
		//this.targetElement = this.findTarget()
		if (!this.targetElement) {
			throw new Exception("ClickCommand's execute method does not have a targetElement");
		}
		if (this.targetSpec.xpath) { // Need a way to specify *where* to click on the target
			// I'm using the "options" parameter, since I don't want to add a this.clickLoc parameter to this.execEnv.Click (AC)
			options.clickLoc = this.targetSpec.clickLoc
		}
		this.clearPreview()	// need finer-tuned event notification in exec-engine, so we can Preview the next line as soon as we advance to it, but before we are about to execute it in _run.
		this.execEnv.Click(this.targetElement, thenDoThis, this.controlP, false, options);
	}
}

CoScripterCommand.prototype.getClickLoc = function(theEvent, utils){
	var boundingRect = theEvent.target.getBoundingClientRect()
	var clientX = boundingRect.left
	var clientY = boundingRect.top
	var x = theEvent.x
	var y = theEvent.y
	var loc = {}
	loc.x = (clientX - x).toFixed(0)
	loc.y = (clientY - y).toFixed(0)
	//debug("getClickLoc: previously got " + loc.x + "," + loc.y)

	var position = utils.getNodePosition(theEvent.target)
	loc.x = position.x.toFixed(0)
	loc.y = position.y.toFixed(0)
	//debug("getClickLoc: now we get " + loc.x + "," + loc.y)
	return loc
},

CoScripterCommand.prototype.ClickCommand.prototype.autoWait = function(){
	return true;
}


// ===================================
// =========== MOUSEOVER =================
// ===================================
// Mouseover is not recordable, just executable
CoScripterCommand.prototype.createMouseoverFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.MouseoverCommand(slop,execEnv);
}

CoScripterCommand.prototype.createMouseoverFromParams = function(originalEvent, label, type, ctrlP){
	var mouseoverCmd = new CoScripterCommand.prototype.MouseoverCommand();
	var utils = mouseoverCmd.components.utils();
	var labeler = mouseoverCmd.components.labeler();
	
	mouseoverCmd.originalEvent = originalEvent;
	mouseoverCmd.controlP = ctrlP;
	
	if (type == labeler.WEBTYPES.TABLECELL){ // use a special TableTargetSpec
		mouseoverCmd.targetSpec = new CoScripterCommand.prototype.TableTargetSpec()
		mouseoverCmd.targetSpec.targetColumnLabel = new CoScripterCommand.prototype.VariableValue(label[0])
		mouseoverCmd.targetSpec.targetColumnNumber = new CoScripterCommand.prototype.VariableValue(label[1])
		mouseoverCmd.targetSpec.targetRowNumber = new CoScripterCommand.prototype.VariableValue(label[2])
		//mouseoverCmd.targetSpec.targetTableLabel = new CoScripterCommand.prototype.VariableValue(String(label[3]))
		mouseoverCmd.targetSpec.targetLabel = mouseoverCmd.targetSpec.getTargetLabel()
		mouseoverCmd.targetSpec.targetType = type;
	}
	else if (type == labeler.WEBTYPES.DOJOWIDGET){
		mouseoverCmd.targetSpec = label	// the targetSpec was passed in using the 'label' parameter
		mouseoverCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(mouseoverCmd.targetSpec.targetLabel)
		mouseoverCmd.targetSpec.subcomponentLabel = new CoScripterCommand.prototype.VariableValue(mouseoverCmd.targetSpec.subcomponentLabel)
		//mouseoverCmd.targetSpec.targetType = type;	// the CA barWidget breaks in handleEvent's postprocessing call to listTargetMatches if the
												// targetType is null.  But I think the DojoWidgetTargetSpec's toSlop method
												// relies on it being null for some kinds of dojowidgets.  (AC)
		if (mouseoverCmd.targetSpec.action) mouseoverCmd.type = mouseoverCmd.targetSpec.action
	}
	else {
		mouseoverCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
		mouseoverCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
		mouseoverCmd.targetSpec.targetType = type;
		if (originalEvent != null)
		{
			mouseoverCmd.targetSpec.clickLoc = this.getClickLoc(originalEvent, utils)
		}
	}
	
	// this must be done explicitly for every command created from params
	mouseoverCmd.execEnv = mouseoverCmd.components.executionEnvironment();

	return mouseoverCmd;
}

CoScripterCommand.prototype.MouseoverCommand = function(slop,execEnv){
	CoScripterCommand.prototype.MouseoverCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.CLICK ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.MouseoverCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.MouseoverCommand.prototype.getAction = function(){
	if (this.type == "mouseover" && this.controlP == true) return "control-mouseover"
    else return this.type;
}

CoScripterCommand.prototype.MouseoverCommand.prototype.getTargetType = function(){
	if(this.targetSpec){
		if(this.targetSpec.getTargetType) return this.targetSpec.getTargetType();
		return this.targetSpec.targetAreaType
	}
	return null;
}

CoScripterCommand.prototype.MouseoverCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and " + this.controlP?"control-":""  + "mouseover it";
}

CoScripterCommand.prototype.MouseoverCommand.prototype.toSlop = function(){
	var targetSlop = ""
	if (this.targetSpec.widgetClass) {	// dojoTargetSpec.toSlop figures out the entire command's slop
		this.targetSpec.action = this.getAction()
		targetSlop = this.targetSpec.toSlop()
		return targetSlop
	}
	
	if (targetSlop.slice(0,2) == '\"/') {	//XPath
		theText = this.getAction() + " x" + targetSlop.substring(0,targetSlop.length-6) 	// remove ' xpath' from the end
		theText += " at (" + this.targetSpec.getClickLocX() + "," + this.targetSpec.getClickLocY()  + ")"
		return theText
	}
	return this.getAction() + " the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.MouseoverCommand.prototype.variabilize = function(database) {
	//kludge: don't variabilize table cells for now (AC)
	if (this.targetSpec.targetType != "cell") this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.MouseoverCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.MouseoverCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.MouseoverCommand.prototype.hasNeededVars = function() {
 	if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE ||
		this.targetSpec.tableType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) 
			return true;	//having a target is good enough until we add VariableValues for row and column references
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.MouseoverCommand.prototype.execute = function(thenDoThis, options){
	//debug('execute: mouseover ' + this.targetSpec.getTargetLabel() + '\n');
	//debug("execute mouseover on target of type: " + this.targetElement.nodeName)
	//this.targetElement = this.findTarget()
	if (!this.targetElement) {
		throw new Exception("MouseoverCommand's execute method does not have a targetElement");
	}
	if (this.targetSpec.xpath) { // Need a way to specify *where* to mouseover on the target
		// I'm using the "options" parameter, since I don't want to add a this.clickLoc parameter to this.execEnv.Mouseover (AC)
		options.clickLoc = this.targetSpec.clickLoc
	}
	this.clearPreview()	// need finer-tuned event notification in exec-engine, so we can Preview the next line as soon as we advance to it, but before we are about to execute it in _run.
	this.execEnv.Mouseover(this.targetElement, thenDoThis, this.controlP, false, options);
}

CoScripterCommand.prototype.MouseoverCommand.prototype.autoWait = function(){
	return true;
}


// ===================================
// =========== SWITCH ================
// ===================================
CoScripterCommand.prototype.createSwitchFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.SwitchCommand(slop,execEnv);
}

CoScripterCommand.prototype.createSwitchFromParams = function(originalEvent, label, type, ctrlP){
	var switchCmd = new CoScripterCommand.prototype.SwitchCommand();
	
	switchCmd.originalEvent = originalEvent;
	switchCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	switchCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
	switchCmd.targetSpec.targetType = type;
	switchCmd.controlP = ctrlP;
	
	// this must be done explicitly for every command created from params
	switchCmd.execEnv = switchCmd.components.executionEnvironment();
	
	return switchCmd;
}

CoScripterCommand.prototype.SwitchCommand = function(slop,execEnv){
	CoScripterCommand.prototype.SwitchCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.SWITCH ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.SwitchCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.SwitchCommand.prototype.toString = function(){	
	return "switch to tab '" + this.targetSpec.toString() + "'";
}

CoScripterCommand.prototype.SwitchCommand.prototype.toSlop = function(){
	return this.getAction() + " to the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.SwitchCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.SwitchCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.SwitchCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.SwitchCommand.prototype.hasNeededVars = function() {
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.SwitchCommand.prototype.canExecute = function(){
	// dump('SwitchCommand.canExecute\n')
	// TODO: (findTab !=null){return true ;}else{ return false;}
	return true; // for now
}

CoScripterCommand.prototype.SwitchCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: switch ' + this.targetSpec.getTargetLabel() + '\n');
	this.targetTab = this.findTarget()// hmm findTab?
	this.execEnv.Switch(this.targetTab,thenDoThis, this.controlP, options);
}

CoScripterCommand.prototype.SwitchCommand.prototype.autoWait = function(){
	// TL: Someday this could be true if we write code that knows how to detect
	// that the specified tab exists; for now, return false
	return false;
}


// ====================================
// =========== CLOSE (TAB) ============
// ====================================
CoScripterCommand.prototype.createCloseFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.CloseCommand(slop,execEnv);
}

CoScripterCommand.prototype.createCloseFromParams = function(originalEvent, label, type){
	var switchCmd = new CoScripterCommand.prototype.CloseCommand();
	
	switchCmd.originalEvent = originalEvent;
	switchCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	switchCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
	switchCmd.targetSpec.targetType = type;
	
	// this must be done explicitly for every command created from params
	switchCmd.execEnv = switchCmd.components.executionEnvironment();
	
	return switchCmd;
}

CoScripterCommand.prototype.CloseCommand = function(slop,execEnv){
	CoScripterCommand.prototype.CloseCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.CLOSE ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.CloseCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.CloseCommand.prototype.toString = function(){	
	return "close tab '" + this.targetSpec.toString() + "'";
}

CoScripterCommand.prototype.CloseCommand.prototype.toSlop = function(){
	return this.getAction() + " the " + this.targetSpec.toSlop() + ' tab';
}

CoScripterCommand.prototype.CloseCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.CloseCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.CloseCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.CloseCommand.prototype.hasNeededVars = function() {
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.CloseCommand.prototype.canExecute = function(){
	// dump('CloseCommand.canExecute\n')
	// TODO: (findTab !=null){return true ;}else{ return false;}
	return true; // for now
}

CoScripterCommand.prototype.CloseCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: close ' + this.targetSpec.getTargetLabel() + '\n');
	this.targetTab = this.findTarget()// hmm findTab?
	this.execEnv.Close(this.targetTab,thenDoThis, this.controlP, options);
}

CoScripterCommand.prototype.CloseCommand.prototype.autoWait = function(){
	// TL: for now
	return false;
}


// ===================================
// =========== SELECT ================
// ===================================
CoScripterCommand.prototype.createSelectFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.SelectCommand(slop,execEnv);
}

CoScripterCommand.prototype.createSelectFromParams = function(originalEvent, label, type, itemTextToSelect, specialKey){
	var selectCmd = new CoScripterCommand.prototype.SelectCommand();
	var utils = selectCmd.components.utils();
	var text = utils.trimAndStrip(itemTextToSelect)
	
	selectCmd.originalEvent = originalEvent;
	selectCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	selectCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
	selectCmd.targetSpec.targetType = type;
	// This is a secondary target spec to describe the item to be selected from the listbox
	selectCmd.string = new CoScripterCommand.prototype.VariableValue(text);
	selectCmd.specialKey = specialKey	// "control" or "shift"
	
	// this must be done explicitly for every command created from params
	selectCmd.execEnv = selectCmd.components.executionEnvironment();

	return selectCmd;
}

CoScripterCommand.prototype.SelectCommand = function(slop,execEnv){
	CoScripterCommand.prototype.SelectCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.SELECT ;
	this.menuP = false	// is this a menu command? e.g. select the "File>New Tab" menu
	this.specialKey = null	// "control" or "shift" if that key was held down when the option was selected
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.SelectCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.SelectCommand.prototype.toString = function(){
	if (this.menuP) return "select the '" + this.targetSpec.toString()
	else return "find target '" + this.targetSpec.toString() + "' and select  '"  + escape(this.string)+ "'";
}

CoScripterCommand.prototype.SelectCommand.prototype.toSlop = function(){
	var textValue;
	
	if (this.targetSpec.targetType == "menu") {
		return "select the " + this.targetSpec.toSlop();
	}

	if(this.string.getMatchType()== this.components.parser().ParserConstants.CONTAINS){
		textValue = 'the item that contains ' + this.string;
	}else if(this.string.getMatchType()== this.components.parser().ParserConstants.STARTSWITH){
		textValue = "the item that starts with " + this.string;
	}else if(this.string.getMatchType()== this.components.parser().ParserConstants.ENDSWITH){
		textValue = "the item that ends with " + this.string;
	}else if(this.string.getMatchType()== this.components.parser().ParserConstants.EQUALS){
		textValue = "the item that equals " + this.string;
	} else {
		if (this.string.getValue() && typeof(this.string.getValue().test) == "function") {
			// It's a regular expression
			textValue = 'r"' + this.string.getValue().source + '"';
		} else {
			// Otherwise, it's a plain VariableValue; use the normal
			// toString() method on VariableValues to determine the value
			// (including database variables if necessary)
			textValue = this.string;
		}
	}
	var commandName = "select "
	if (this.specialKey == "shift") commandName = "shift-" + commandName
	if (this.specialKey == "control") commandName = "control-" + commandName
	return commandName + textValue + " from the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.SelectCommand.prototype.variabilize = function(database) {
	if (!this.menuP) this.string.variabilize(database);
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.SelectCommand.prototype.needsVars = function() {
	if (this.menuP) return this.targetSpec.needsVars()
	else return this.string.needsVars() && this.targetSpec.needsVars();
}

CoScripterCommand.prototype.SelectCommand.prototype.fillInVars = function(database) {
	if (!this.menuP) this.string.fillInVars(database);
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.SelectCommand.prototype.hasNeededVars = function() {
	if (this.menuP) return this.targetSpec.hasNeededVars()
	else return this.string.hasNeededVars() && this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.SelectCommand.prototype.execute = function(thenDoThis, options){
	//this.targetElement = this.findTarget();
	//dump('EXECUTE: select ' + this.string.getValue() + ' from ' + this.targetSpec.getTargetLabel() + '\n');
	this.execEnv.Select(this.targetElement, thenDoThis, this.specialKey, true, options);
}

CoScripterCommand.prototype.SelectCommand.prototype.autoWait = function(){
	return true;
}


// ===================================
// =========== Turn ==================
// ===================================
CoScripterCommand.prototype.createTurnFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.TurnCommand(slop,execEnv);
}

CoScripterCommand.prototype.createTurnFromParams = function(originalEvent, label, type, turnOnP){
	var turnCmd = new CoScripterCommand.prototype.TurnCommand();
	
	turnCmd.originalEvent = originalEvent;
	turnCmd.turnon = turnOnP;
	turnCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
	turnCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
	turnCmd.targetSpec.targetType = type;
	
	// this must be done explicitly for every command created from params
	turnCmd.execEnv = turnCmd.components.executionEnvironment();

	return turnCmd;
}

CoScripterCommand.prototype.TurnCommand = function(slop,execEnv){
	CoScripterCommand.prototype.TurnCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.TURN;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.TurnCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.TurnCommand.prototype.toString = function(){	
	return "find target '" + this.targetSpec.toString() + "' and turn it  '"  + this.turnon?"on":"off" + "'";
}

CoScripterCommand.prototype.TurnCommand.prototype.toSlop = function(){
	return "turn " + (this.turnon?"on":"off") + " the " + this.targetSpec.toSlop();
}

CoScripterCommand.prototype.TurnCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.TurnCommand.prototype.needsVars = function() {
	return this.targetSpec.needsVars();
}

CoScripterCommand.prototype.TurnCommand.prototype.fillInVars = function(database) {
	this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.TurnCommand.prototype.hasNeededVars = function() {
	return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.TurnCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: turn ' + this.turnon + ' the ' + this.targetSpec.getTargetLabel() + '\n');
	//this.targetElement = this.findTarget();
	this.execEnv.Select(this.targetElement, thenDoThis, this.specialKey, this.turnon, options);
}

CoScripterCommand.prototype.TurnCommand.prototype.autoWait = function(){
	return true;
}


// ===================================
// =========== Open ==================
// ===================================
// Open a scratchtable
CoScripterCommand.prototype.createOpenFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.OpenCommand(slop,execEnv);
}

CoScripterCommand.prototype.createOpenFromParams = function(originalEvent, tableName){
	var openCmd = new CoScripterCommand.prototype.OpenCommand();
	
	openCmd.originalEvent = originalEvent;
	openCmd.tableName = tableName;
	
	// this must be done explicitly for every command created from params
	openCmd.execEnv = openCmd.components.executionEnvironment();

	return openCmd;
}

CoScripterCommand.prototype.OpenCommand = function(slop, execEnv){
	CoScripterCommand.prototype.OpenCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.OPEN;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.OpenCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.OpenCommand.prototype.toString = function(){	
	return "open the " + this.tableName.toString() + " scratchtable";
}

CoScripterCommand.prototype.OpenCommand.prototype.toSlop = function(){
	return "open the " + this.tableName.toString() + " scratchtable";
}

CoScripterCommand.prototype.OpenCommand.prototype.canExecute = function(){
	// ought to check whether the table exists
	return true;
} 

CoScripterCommand.prototype.OpenCommand.prototype.execute = function(thenDoThis, options){
	this.execEnv.Open(this.tableName, thenDoThis, options);
}

CoScripterCommand.prototype.OpenCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== Pause ==================
// ===================================
CoScripterCommand.prototype.createPauseFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.PauseCommand(slop,execEnv);
}

CoScripterCommand.prototype.createPauseFromParams = function(originalEvent, pauseLengthInSeconds){
	var pauseCmd = new CoScripterCommand.prototype.PauseCommand();
	
	pauseCmd.originalEvent = originalEvent;
	pauseCmd.pauseLength = pauseLengthInSeconds;
	
	// this must be done explicitly for every command created from params
	pauseCmd.execEnv = pauseCmd.components.executionEnvironment();

	return pauseCmd;
}

CoScripterCommand.prototype.PauseCommand = function(slop,execEnv){
	CoScripterCommand.prototype.PauseCommand.baseConstructor.call(this, slop,execEnv);
	this.pauseLength = 5;
	this.type = CoScripterCommand.prototype.ACTIONS.PAUSE;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.PauseCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.PauseCommand.prototype.toString = function(){	
	return "pause for " + this.pauseLength.toString() + "seconds";
}

CoScripterCommand.prototype.PauseCommand.prototype.toSlop = function(){
	return "pause " + this.pauseLength + " seconds";
}

CoScripterCommand.prototype.PauseCommand.prototype.canExecute = function(){
	return true;
} 

CoScripterCommand.prototype.PauseCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: pause ' + this.pauseLength + ' seconds\n');
	var mainChromeWindow = this.execEnv.getMainBrowserWindow()
	mainChromeWindow.setTimeout(thenDoThis, this.pauseLength * 1000);
}

CoScripterCommand.prototype.PauseCommand.prototype.autoWait = function(){
	return false;
}


// ========================================
// =========== Comment ====================
// ========================================
CoScripterCommand.prototype.createCommentFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.CommentCommand(slop,execEnv);
}

CoScripterCommand.prototype.CommentCommand = function(slop, execEnv) {
	CoScripterCommand.prototype.CommentCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.COMMENT;
	return this;
}

JSInheritance.extend(CoScripterCommand.prototype.CommentCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.CommentCommand.prototype.toString = function(){	
	return "comment: " + this.getSlop();
}

CoScripterCommand.prototype.CommentCommand.prototype.preview = function(){}

CoScripterCommand.prototype.CommentCommand.prototype.canExecute = function(){
	return true;
} 

CoScripterCommand.prototype.CommentCommand.prototype.execute = function(thenDoThis, options){
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.CommentCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== You Command============
// ===================================
CoScripterCommand.prototype.YouCommand = function(slop,execEnv,nestedCommand){
	CoScripterCommand.prototype.YouCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.YOU;
	this.nestedCommand = nestedCommand;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.YouCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.YouCommand.prototype.toString = function(){	
	return this.slop;
}

CoScripterCommand.prototype.YouCommand.prototype.toSlop = function(){
	return this.toString();
}

CoScripterCommand.prototype.YouCommand.prototype.needsVars = function() {
	if (this.nestedCommand != null) {
		return this.nestedCommand.needsVars();
	} else {
		return false;
	}
}

CoScripterCommand.prototype.YouCommand.prototype.fillInVars = function(database) {
	if (this.nestedCommand != null) {
		return this.nestedCommand.fillInVars(database);
	} else {
		return false;
	}
}

CoScripterCommand.prototype.YouCommand.prototype.hasNeededVars = function() {
	if (this.nestedCommand != null) {
		return this.nestedCommand.hasNeededVars();
	} else {
		return true;
	}
}

CoScripterCommand.prototype.YouCommand.prototype.preview = function(color){	
	if (this.nestedCommand != null) {
		var options = { 'color' : 'orange' };
		this.nestedCommand.preview(options);
	}
}

CoScripterCommand.prototype.YouCommand.prototype.canExecute = function(){
	return true;
} 

CoScripterCommand.prototype.YouCommand.prototype.execute = function(thenDoThis, options){
	// This is a no-op. If the user clicks Step or Run in the sidebar, exec-engine's findTargetAndExecuteStep moves to the next step.
	// If exec-engine's stepExecutedCallback encounters a You command, it runs the YOU_COMMAND callback. CoScripter implements this to Stop execution.
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.YouCommand.prototype.clearPreview = function(){
	if (this.nestedCommand != null) {
		this.nestedCommand.clearPreview();
	}
}

CoScripterCommand.prototype.YouCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== COPY ==================
// ===================================
CoScripterCommand.prototype.createCopyFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.CopyCommand(slop, execEnv);
}

CoScripterCommand.prototype.createCopyFromParams = function(originalEvent, label, type){
	var copyCmd = new CoScripterCommand.prototype.CopyCommand()
	var labeler = copyCmd.components.labeler()
		
	copyCmd.originalEvent = originalEvent
	if ((type != copyCmd.components.labeler().WEBTYPES.TABLECELL) && (type != copyCmd.components.labeler().WEBTYPES.SCRATCHTABLE)) {
		copyCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec()
		copyCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label)
		copyCmd.targetSpec.targetType = type
	}
	else { // use a special TableTargetSpec
		// NOTE recorder.js has additional code for a table cell with a simple label
		// _onCommand in command-generator sets
		// 	label = [treeColumnName, (treeColumn + 1), (treeRow + 1), "scratchtable"]
		copyCmd.targetSpec = new CoScripterCommand.prototype.TableTargetSpec()
		if (label[0]) copyCmd.targetSpec.targetColumnLabel = new CoScripterCommand.prototype.VariableValue(label[0])
		else copyCmd.targetSpec.targetColumnNumber = label[1]
		copyCmd.targetSpec.targetRowNumber = label[2]
		// copyCmd.targetSpec.targetTableLabel = new CoScripterCommand.prototype.VariableValue(String(label[3])) // used once we have multiple scratchtables
		copyCmd.targetSpec.targetLabel = copyCmd.targetSpec.getTargetLabel()	
		copyCmd.targetSpec.targetType = labeler.WEBTYPES.TABLECELL;
		copyCmd.targetSpec.tableType = labeler.WEBTYPES.SCRATCHTABLE;
	}
	
	// this must be done explicitly for every command created from params
	copyCmd.execEnv = copyCmd.components.executionEnvironment();

	return copyCmd
}

CoScripterCommand.prototype.CopyCommand = function(slop,execEnv){
	CoScripterCommand.prototype.CopyCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.COPY ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.CopyCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.CopyCommand.prototype.WEBPAGE = "webpage";
CoScripterCommand.prototype.CopyCommand.prototype.TABLE = "table";
CoScripterCommand.prototype.CopyCommand.prototype.TEXTBOX = "textbox";

CoScripterCommand.prototype.CopyCommand.prototype.toString = function(){
	//TODO other cases
	return "copy '" + (this.targetSpec ? this.targetSpec.toString() : "") + "'";
}

CoScripterCommand.prototype.CopyCommand.prototype.toSlop = function(){
	var targetSlop = this.targetSpec.toSlop()
	var theText = " the "
	return this.getAction() + theText + targetSlop;
}

CoScripterCommand.prototype.CopyCommand.prototype.variabilize = function(database) {
	//kludge: don't variabilize table cells for now (AC)
	if (this.targetSpec.targetType != "cell") this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.CopyCommand.prototype.needsVars = function() {
	if (this.targetSpec) {
		return this.targetSpec.needsVars();
	}
	else {
		return false;
	}
}

CoScripterCommand.prototype.CopyCommand.prototype.fillInVars = function(database) {
	if (this.targetSpec) this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.CopyCommand.prototype.hasNeededVars = function() {
	return true;	//having a target is good enough until we add VariableValues for row and column references
	//return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.CopyCommand.prototype.preview = function(options){
	this.clearPreview();
	this.previewConfig = this.execEnv.preview(this, options);
}

/*
CoScripterCommand.prototype.CopyCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: copy ' + (this.targetSpec ? this.targetSpec.getTargetLabel() : '') + '\n');
	if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.TEXT){
		//this.targetElement = this.findTarget()
		this.execEnv.Copy(this.targetElement,thenDoThis,options);		
	}else if(this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.WEBPAGE){
		throw new Exception('not implemented');
	}else if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) {
		this.execEnv.Copy(this.targetElement, thenDoThis, options);
	}else if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.TABLE){
		// doCommand into the scratchSpace table cell
		throw new Exception('not implemented'); 
	}else if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.TEXTBOX){
		//this.targetElement = this.findTarget()
		this.execEnv.Copy(this.targetElement, thenDoThis, options);
	}else if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.XPATH){
		//this.targetElement = this.findTarget()
		this.execEnv.Copy(this.targetElement, thenDoThis, options);
	}else{
		throw new Exception ('unexpected CopyCommand argument type: expected WEBPAGE, TABLE, TEXTBOX or TEXT');
	}
}
*/

CoScripterCommand.prototype.CopyCommand.prototype.execute = function(thenDoThis, options){
	if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) {	// autoWait returned false, so we need to get the target now
		this.targetElement = this.findTarget()
	}
	this.execEnv.Copy(this.targetElement, thenDoThis, options)
}

CoScripterCommand.prototype.CopyCommand.prototype.autoWait = function(){
	if (this.sourceType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) return false;
	return true;
}


// ===================================
// =========== PASTE =================
// ===================================
CoScripterCommand.prototype.createPasteFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.PasteCommand(slop,execEnv);
}

CoScripterCommand.prototype.createPasteFromParams = function(originalEvent, label, type){
	var pasteCmd = new CoScripterCommand.prototype.PasteCommand();
	var labeler = pasteCmd.components.labeler()
	
	pasteCmd.originalEvent = originalEvent;
	if (type == labeler.WEBTYPES.SCRATCHTABLE) {
		pasteCmd.targetSpec = new CoScripterCommand.prototype.TableTargetSpec();
		if (label[0]) pasteCmd.targetSpec.targetColumnLabel = new CoScripterCommand.prototype.VariableValue(label[0])
		else pasteCmd.targetSpec.targetColumnNumber = label[1]
		pasteCmd.targetSpec.targetRowNumber = label[2]
		// pasteCmd.targetSpec.targetTableLabel = new CoScripterCommand.prototype.VariableValue(String(label[3])) // used once we have multiple scratchtables
		pasteCmd.targetSpec.targetLabel = pasteCmd.targetSpec.getTargetLabel()	
		pasteCmd.targetSpec.targetType = labeler.WEBTYPES.TABLECELL;
		pasteCmd.targetSpec.tableType = labeler.WEBTYPES.SCRATCHTABLE;
	}
	else {
		pasteCmd.targetSpec = new CoScripterCommand.prototype.TargetSpec();
		pasteCmd.targetSpec.targetLabel = new CoScripterCommand.prototype.VariableValue(label);
		pasteCmd.targetSpec.targetType = type;
	}
	// this must be done explicitly for every command created from params
	pasteCmd.execEnv = pasteCmd.components.executionEnvironment();
	
	return pasteCmd;
}

CoScripterCommand.prototype.PasteCommand = function(slop,execEnv){
	CoScripterCommand.prototype.PasteCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.PASTE ;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.PasteCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.PasteCommand.prototype.WEBPAGE = "webpage";
CoScripterCommand.prototype.PasteCommand.prototype.TABLE = "table";

CoScripterCommand.prototype.PasteCommand.prototype.toString = function(){	
	return "'Paste '"  + escape(this.execEnv.getClipboardContents()) + "' into '" + this.targetSpec.toString();
}

CoScripterCommand.prototype.PasteCommand.prototype.toSlop = function(){
	var targetSlop = this.targetSpec.toSlop()
	var intoText = " into the "
	return this.getAction() + intoText + targetSlop;
}

CoScripterCommand.prototype.PasteCommand.prototype.variabilize = function(database) {
	this.targetSpec.variabilize(database);
}

CoScripterCommand.prototype.PasteCommand.prototype.needsVars = function() {
	if (this.targetSpec) {
		return this.targetSpec.needsVars();
	}
	else {
		return false;
	}
}

CoScripterCommand.prototype.PasteCommand.prototype.fillInVars = function(database) {
	if (this.targetSpec) this.targetSpec.fillInVars(database);
}

CoScripterCommand.prototype.PasteCommand.prototype.hasNeededVars = function() {
	return true;	//having a target is good enough until we add VariableValues for row and column references
	//return this.targetSpec.hasNeededVars();
}

CoScripterCommand.prototype.PasteCommand.prototype.preview = function(options){
	this.clearPreview();
	var contents = this.execEnv.getClipboardContents();
	if (options == null) {
		options = {};
	}
	options.overlaytext = contents;
	this.previewConfig = this.execEnv.preview(this, options);
}

CoScripterCommand.prototype.PasteCommand.prototype.findTarget = function(){
		var targetElement = this.execEnv.findTarget(this)
		if (this.destType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) {
			// Comment in findTargetElementInFrame: 
			// it's inconsistent to not set matchingElement to the cell element in the scratchSpaceEditor. 
			// But XUL tables are indirect and require accessor methods. So we keep the row and column indices in the targetSpec.
			targetElement.rowNumber = this.rowNumber
			targetElement.columnNumber = this.columnNumber
		}
		this.targetElement = targetElement;
		return targetElement;
}
	
CoScripterCommand.prototype.PasteCommand.prototype.execute = function(thenDoThis, options){
  	//dump('EXECUTE: paste into ' + (this.targetSpec ? this.targetSpec.getTargetLabel() : '') + '\n');
	if(this.destType == CoScripterCommand.prototype.TARGETAREATYPE.WEBPAGE ){
		//this.targetElement = this.findTarget()
		this.execEnv.Paste(this.targetElement, thenDoThis, options);
	}else if (this.destType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) {
		this.targetElement = this.findTarget()	// since hasNeededVars returns true, findTarget hasn't been called yet
		this.execEnv.Paste(this.targetElement, thenDoThis, options);
	}else if (this.destType == CoScripterCommand.prototype.TARGETAREATYPE.TABLE){
		// paste into the table cell
		throw new Exception('not implemented'); 
	}else{
		throw new Exception ('unexpected PasteCommand argument type: expected WEBPAGE, TABLE, TEXTBOX or TEXT');
	}
}

CoScripterCommand.prototype.PasteCommand.prototype.autoWait = function(){
	if (this.destType == CoScripterCommand.prototype.TARGETAREATYPE.SCRATCHTABLE) return false;
	return true;
}


// ===================================
// =========== Begin Extraction ======
// ===================================
CoScripterCommand.prototype.createBeginExtractionFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.BeginExtractionCommand(slop,execEnv);
}

CoScripterCommand.prototype.createBeginExtractionFromParams = function(originalEvent) {
	var beginExtractionCmd = new CoScripterCommand.prototype.BeginExtractionCommand();
	beginExtractionCmd.originalEvent = originalEvent;
	
	// this must be done explicitly for every command created from params
	beginExtractionCmd.execEnv = beginExtractionCmd.components.executionEnvironment();
	
	return beginExtractionCmd;
}

CoScripterCommand.prototype.BeginExtractionCommand = function(slop,execEnv){
	CoScripterCommand.prototype.BeginExtractionCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.BEGIN_EXTRACTION;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.BeginExtractionCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.BeginExtractionCommand.prototype.toString = function(){	
	return "begin extraction";
}

CoScripterCommand.prototype.BeginExtractionCommand.prototype.toSlop = function(){
	return "begin extraction";
}

CoScripterCommand.prototype.BeginExtractionCommand.prototype.canExecute = function(){
	return true;
} 

CoScripterCommand.prototype.BeginExtractionCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: begin extraction\n');
	this.execEnv.BeginExtraction(thenDoThis, options);
}

CoScripterCommand.prototype.BeginExtractionCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== End Extraction ========
// ===================================
CoScripterCommand.prototype.createEndExtractionFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.EndExtractionCommand(slop,execEnv);
}

CoScripterCommand.prototype.createEndExtractionCommandFromParams = function(originalEvent) {
	var endExtractionCmd = new CoScripterCommand.prototype.EndExtractionCommand();
	endExtractionCmd.originalEvent = originalEvent;
	
	// this must be done explicitly for every command created from params
	endExtractionCmd.execEnv = endExtractionCmd.components.executionEnvironment();
	
	return endExtractionCmd;
}

CoScripterCommand.prototype.EndExtractionCommand = function(slop,execEnv){
	CoScripterCommand.prototype.EndExtractionCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.END_EXTRACTION;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.EndExtractionCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.EndExtractionCommand.prototype.toString = function(){	
	return "end extraction";
}

CoScripterCommand.prototype.EndExtractionCommand.prototype.toSlop = function(){
	return "end extraction";
}

CoScripterCommand.prototype.EndExtractionCommand.prototype.canExecute = function(){
	return true;
} 

CoScripterCommand.prototype.EndExtractionCommand.prototype.execute = function(thenDoThis, options){
	//dump('EXECUTE: end extraction\n');
	this.execEnv.EndExtraction(thenDoThis, options);
}

CoScripterCommand.prototype.EndExtractionCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== Extract ==================
// ===================================
// re-extracts the table on the current content page, using XPaths saved from the original interactive extraction.
CoScripterCommand.prototype.createExtractFromSlop = function(slop, execEnv){
	var extractCmd = new CoScripterCommand.prototype.ExtractCommand(slop,execEnv);
	var tableStringMatch = slop.match(/the\s+(\S+)\s+scratchtable/i)
	extractCmd.tableName = "untitled"
	if (tableStringMatch) {
		extractCmd.tableName = tableStringMatch[1].slice(1,tableStringMatch[1].length-1)
	}
	return extractCmd
}

CoScripterCommand.prototype.createExtractFromParams = function(originalEvent, tableName, overwriteP){
	var extractCmd = new CoScripterCommand.prototype.ExtractCommand();
	
	extractCmd.originalEvent = originalEvent;
	extractCmd.tableName = tableName;
	extractCmd.overwriteP = overwriteP;
	
	// this must be done explicitly for every command created from params
	extractCmd.execEnv = extractCmd.components.executionEnvironment();

	return extractCmd;
}

CoScripterCommand.prototype.ExtractCommand = function(slop, execEnv){
	CoScripterCommand.prototype.ExtractCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.EXTRACT;
	
	this.overwriteP = true
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.ExtractCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.ExtractCommand.prototype.toString = function(){	
	return "extract the " + this.tableName.toString() + " scratchtable";
}

CoScripterCommand.prototype.ExtractCommand.prototype.toSlop = function(){
	return "extract the \"" + this.tableName.toString() + "\" scratchtable";
}

CoScripterCommand.prototype.ExtractCommand.prototype.canExecute = function(){
	// ought to check whether the table exists and there is an xPath for this page
	return true;
} 

CoScripterCommand.prototype.ExtractCommand.prototype.execute = function(thenDoThis, options){
	// This will open the table and optionally overwrite any existing data
	this.execEnv.Extract(this.tableName, this.overwriteP, thenDoThis, options);
}

CoScripterCommand.prototype.ExtractCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== Find ==================
// ===================================
CoScripterCommand.prototype.createFindFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.FindCommand(slop,execEnv);
}

CoScripterCommand.prototype.createFindFromParams = function(originalEvent, continueP, searchTerm, previousP){
	var findCmd = new CoScripterCommand.prototype.FindCommand();

	findCmd.originalEvent = originalEvent;
	findCmd.continueFlag = continueP; 
	if (searchTerm) findCmd.searchTerm.setVarOrVal(searchTerm)	
	findCmd.previousFlag = previousP; 
	
	// this must be done explicitly for every command created from params
	findCmd.execEnv = findCmd.components.executionEnvironment();
	return findCmd;
}

CoScripterCommand.prototype.FindCommand = function(slop,execEnv){
	CoScripterCommand.prototype.FindCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.FIND;
	
	this.originalEvent = null;
	this.continueFlag = false;	// indicates whether this is a new search or a continuation of a previous search
	this.searchTerm = new CoScripterCommand.prototype.VariableValue();	// if not a continuation, then this contains the term to search for
	this.previousFlag = false;	// if a continuation, then whether we are searching forward or backward
	
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.FindCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.FindCommand.prototype.isContinuation = function(){
	return this.continueFlag;
}

CoScripterCommand.prototype.FindCommand.prototype.isPrevious = function(){
	return this.previousFlag;
}

CoScripterCommand.prototype.FindCommand.prototype.toString = function(){
	return this.toSlop()
}

CoScripterCommand.prototype.FindCommand.prototype.toSlop = function(){
	if (!this.continueFlag)
	{	
		return "search for \"" + this.searchTerm.toString() + "\" on the current page";
	}
	else if (!this.previousFlag)
	{
		return "search for next";
	}
	else
	{
		return "search for previous";
	}
}

CoScripterCommand.prototype.FindCommand.prototype.hasTargetSpec = function(){
	return false;
}

CoScripterCommand.prototype.FindCommand.prototype.variabilize = function(database) {
	this.searchTerm.variabilize()
}

CoScripterCommand.prototype.FindCommand.prototype.needsVars = function() {
	return this.searchTerm.needsVars()
}

CoScripterCommand.prototype.FindCommand.prototype.fillInVars = function(database) {
	this.searchTerm.fillInVars(database)
}

CoScripterCommand.prototype.FindCommand.prototype.hasNeededVars = function() {
	return this.searchTerm.hasNeededVars()
}

CoScripterCommand.prototype.FindCommand.prototype.preview = function(options){
	this.clearPreview();
}

CoScripterCommand.prototype.FindCommand.prototype.canExecute = function(){
	return this.searchTerm.hasNeededVars()
}

CoScripterCommand.prototype.FindCommand.prototype.findTarget = function(){
	return null;
}

CoScripterCommand.prototype.FindCommand.prototype.execute = function(thenDoThis, options){
//	dump('EXECUTE: ' + this.toString() + '\n');
	if (!this.continueFlag)
	{	
		this.execEnv.Find(this.searchTerm.getValue(), thenDoThis, options);
	}
	else
	{
		this.execEnv.FindAgain(this.previousFlag, thenDoThis, options);
	}
}

CoScripterCommand.prototype.FindCommand.prototype.autoWait = function(){
	return false;
}


// ===================================
// =========== Unexecutable  Command==
// ===================================
 CoScripterCommand.prototype.createUnexecutableFromSlop = function(slop, execEnv){
	return new CoScripterCommand.prototype.UnexecutableCommand(slop,execEnv);
}

CoScripterCommand.prototype.UnexecutableCommand = function(slop,execEnv){
	CoScripterCommand.prototype.UnexecutableCommand.baseConstructor.call(this, slop,execEnv);
	this.type = CoScripterCommand.prototype.ACTIONS.UNEXECUTABLE;
	return this ;
}

JSInheritance.extend(CoScripterCommand.prototype.UnexecutableCommand, CoScripterCommand.prototype.Command);

CoScripterCommand.prototype.UnexecutableCommand.prototype.toString = function(){	
	return "Unexecutable: " + this.slop;
}

CoScripterCommand.prototype.UnexecutableCommand.prototype.preview = function(options){	
}

CoScripterCommand.prototype.UnexecutableCommand.prototype.canExecute = function(){
	return false;
} 

CoScripterCommand.prototype.UnexecutableCommand.prototype.execute = function(thenDoThis, options){
	throw "Unexecutable command"
	if (thenDoThis != null) {
		this.execEnv.callThenDoThis(thenDoThis)
	}
}

CoScripterCommand.prototype.UnexecutableCommand.prototype.autoWait = function(){
	return false;
}
// ----------------------------------------------------------------------
// End of command definitions
// ----------------------------------------------------------------------


// ===================================
// =========== TargetSpec ============
// ===================================
CoScripterCommand.prototype.TargetSpec = function(){
	this.disambiguator = null ;
	this.ordinal = null ; 
	this.targetLabel = null; // a VariableValue
	this.targetType = null;	// e.g. "radiobutton"
	this.clickLoc = null;	// e.g. {x:10, y:50} for XPaths, so we know the location of the click
	this.windowSpec = null;	// an optional description of the window containing the target
	this.components = registry ;
	return this ;
}

CoScripterCommand.prototype.TargetSpec.prototype = {
	toString : function(){
		return this.toSlop();
 	},

	getDisambiguator : function(){
		return this.disambiguator;
	},

	getTargetLabel : function(){
		return this.targetLabel.getValue();
	},

	getOrdinal : function(){
		if (this.ordinal) return this.ordinal.getValue();
		return null
	},

	getTargetType : function(){
		return this.targetType;
	},
	
	getClickLoc : function(){
		return this.clickLoc;
	},
	
	getClickLocX : function(){
		return this.getClickLoc().x;
	},
	
	getClickLocY : function(){
		return this.getClickLoc().y;
	},
	
	getMatchType : function() {
		return this.targetLabel.getMatchType();
	},

	setMatchType : function(match) {
		return this.targetLabel.setMatchType(match);
	},
	
	getWindowName : function(){
		if (!this.windowSpec) return ""
		return this.windowSpec.windowName
	},

	getWindowNumber : function(){
		if (!this.windowSpec) return ""
		return this.windowSpec.windowNumber
	},

	getWindowId : function(){
		if (!this.windowSpec) return ""
		return this.windowSpec.windowId
	},

	getWindowType : function(){
		if (!this.windowSpec) return ""
		return this.windowSpec.windowType
	},

	getWindowDescriptor : function(){
		if (!this.windowSpec) return ""
		return this.windowSpec.windowDescriptor
	},

	toSlop : function(){
		var parser = this.components.parser()
		var labeler = this.components.labeler()
		var u = this.components.utils()
		
		if (this.xpath) return "x\"" + this.xpath + "\"";
		
		var str = "";
		// disambiguator from command-generator's handleEvent's postprocessing call to labeler.findDisambiguator
		if (this.disambiguator != null) str += this.disambiguator + " ";		
		
		// ordinal
		if (this.ordinal != null) str += u.getOrdinal(this.getOrdinal()) + " ";
			
		// Construct the target label and target type phrase  e.g. "submit" button
		var targetType = this.getTargetType();
		if (targetType === null) targetType = "target";
		
		var matchType = this.targetLabel.getMatchType();
		var matchString = ""
		var labelSlop = this.targetLabel.toSlop()
		if (matchType === null) {	// Not a regular expression
			if (labelSlop == "" || labelSlop == "\"\"") {	// omit an empty label
				str += targetType;
			} else if (this.targetLabel.tableTargetSpec != null) { // tableTargetSpecs read better with the "that equals" syntax
				str += targetType + this.matchTypeToString(parser.ParserConstants.EQUALS) + labelSlop
			} else if (labelSlop.length > u.MAX_LABEL_LENGTH) {	// The label is very long, so truncate it and make a "starts with" label
				var shortLabel = labelSlop[0] + labelSlop.substring(1, u.MAX_LABEL_LENGTH) + labelSlop[0]	// labelSlop[0] is a quote mark
				str += targetType + " that starts with " + shortLabel;
			} else {
				str += labelSlop + " " + targetType;
			}
		} else str += targetType + this.matchTypeToString(matchType) + labelSlop;
				
		/* toSlop does not add the window descriptor, since it is often not displayed in the editor window
		// (When it is implied by previous commands, or when there is only one window)
		// Call getWindowDescriptor whenever it is needed */
		return str;
	},
	
	variabilize : function(database) {
		this.targetLabel.variabilize(database);
		//if (this.ordinal) this.ordinal.variabilize(database); It's a  bad idea to variablilize the ordinal. For instance, if any db entry has a value of 2, "second" will be replaced by a variable
		// It's ok for the user to write a command that uses a variable for the ordinal, but we shouldn't record one.
	},

	needsVars : function() {
		return this.targetLabel.needsVars() || (this.ordinal && this.ordinal.needsVars());
	},
	
	fillInVars : function(database) {
		this.targetLabel.fillInVars(database)
		if (this.ordinal) this.ordinal.fillInVars(database);
	},

	hasNeededVars : function() {
		return this.targetLabel.hasNeededVars() && ((this.ordinal == null) || this.ordinal.hasNeededVars());
	},

	matchTypeToString : function (matchType){
		var parser = this.components.parser()
		switch(matchType){
			case parser.ParserConstants.CONTAINS:
				return " that contains ";
			case parser.ParserConstants.STARTSWITH:
				return " that starts with ";
			case parser.ParserConstants.ENDSWITH:
				return " that ends with ";			
			case parser.ParserConstants.EQUALS:
				return " that equals ";			
			case "=":
				return "=";			
			case ">":
				return ">";			
			case "<":
				return "<";						
		}
		return null;
	},
	
}

// ===================================
// =========== WindowSpec ============
// ===================================
// I'm currently using WindowSpec for the goto command, 
//but it should now be used to hold the window descriptors found optionally at the end of slop commands
//getWindowDescriptor, for example, is from the code for slop commands
CoScripterCommand.prototype.WindowSpec = function(){
	this.disambiguator = null ;
	this.ordinal = null ; 
	this.windowId = null	// number assigned by yule, in the order they are encountered 
	this.dialogP = false	// true if the target is in a dialog box. Eventually this can be improved to specify *which* dialog box
	
	this.windowOrTab = null;	//set to "window" or "tab"
	this.poundsignP = false;	
	this.number = null;			// variableValue. The window or tab number
	this.name = ""	// variableValue. document.title

	this.components = registry;
	return this ;
}

CoScripterCommand.prototype.WindowSpec.prototype = {
	getDisambiguator : function(){
		return this.disambiguator;
	},

	getOrdinal : function(){
		return this.ordinal;
	},

	getWindowName : function(){
		return (this.windowName ? this.windowName.toSlop() : "")
	},

	getWindowNumber : function(){
		return (this.windowNumber ? this.windowNumber.toSlop() : "")
	},

	getWindowId : function(){
		return this.windowId;
	},

	getWindowType : function(){
		//return this.windowType;
		return this.windowOrTab
	},

	getWindowDescriptor : function(){
		// used by commands with a window descriptor at the end of their slop
		// so this isn't currently used by goto commands, but the two should eventually be merged.
		if (this.getWindowName()) {
			var windowDescriptor = " in the \"" + this.getWindowName() + "\" window";
		} else if (this.getWindowId() == 0) {
			windowDescriptor = " in the main window";
		} else if (this.getWindowId() != null) {
			windowDescriptor = " in window #" + this.getWindowId();
		} else {
			windowDescriptor = "";
		}
		if (this.getWindowType() == "dialog") {
			windowDescriptor = " in the dialog";
		}
		if (this.getWindowId() == "BrowserPreferences") {
			windowDescriptor = " in the \"BrowserPreferences\" window";
		}
		return windowDescriptor;
	},

	toString : function(){
		return this.toSlop();
 	},

	toSlop : function(){
		// I'm currently using WindowSpec for the goto command, 
		//    but it should eventually also be merged with the window descriptors found optionally at the end of slop commands (AC)
		//    getWindowDescriptor, for example, is from the code for slop commands
		// go to window 2 -- this syntax refers to windows/tabs in the order in which they are encountered by the script. 
		//					So "window 1" is always the initial window. window/tab are interchangeable and mean the same thing.
		// go to window # 2 -- the browser windows in z-order starting with the frontmost
		// go to tab # 2 -- the tabs in the current browser window, numbered from left to right
		// go to the "Faces" window -- by window title. window/tab are interchangeable and mean the same thing.
		// go to the window that contains "Amazon"
		var parser = this.components.parser()
		var u = this.components.utils()
		
		var str = "";
		// disambiguator from command-generator's handleEvent's postprocessing call to labeler.findDisambiguator
		if (this.disambiguator != null) str += this.disambiguator + " ";		
		// ordinal
		if (this.ordinal != null) str += u.getOrdinal(this.getOrdinal()) + " ";

		var windowName = this.getWindowName()
		var number = this.getWindowNumber()
		var windowType = this.getWindowType()
		
		if (windowName) {	// either number or windowName is null
			str += " the "
			var matchType = this.windowName.getMatchType();
			str += windowType + " " + this.matchTypeToString(matchType) + " " + windowName
		}
		
		if (number != null)  {
			str += windowType + (this.poundsignP ? " #" : "") + number
		}
		
		return str;
	},
	
	variabilize : function(database) {
		if (this.windowName) this.windowName.variabilize(database);
		if (this.number) this.number.variabilize(database);
	},

	needsVars : function() {
		return (
				(this.windowName) ?  this.windowName.needsVars() : false ||
				(this.number) ?  this.number.needsVars() : false
			)
	},
	
	fillInVars : function(database) {
		if (this.windowName) this.windowName.fillInVars(database);
		if (this.number) this.number.fillInVars(database);
	},

	hasNeededVars : function() {
		return (
				(this.windowName) ?  this.windowName.hasNeededVars() : true &&
				(this.number) ?  this.number.hasNeededVars() : true
			)
	},

	matchTypeToString : function (matchType){
		var parser = this.components.parser()
		switch(matchType){
			case parser.ParserConstants.CONTAINS:
				return " that contains ";
			case parser.ParserConstants.STARTSWITH:
				return " that starts with ";
			case parser.ParserConstants.ENDSWITH:
				return " that ends with ";			
			case parser.ParserConstants.EQUALS:
				return " that equals ";			
			case "=":
				return "=";			
			case ">":
				return ">";			
			case "<":
				return "<";						
		}
		return null;
	},

}	// end of WindowSpec


// ===================================
// =========== TableTargetSpec =======
// ===================================
CoScripterCommand.prototype.TableTargetSpec = function(){
	this.components = registry ;
	this.disambiguator = null ;
	this.ordinal = null ; 

	this.targetLabel = null; // not used
	this.targetType = null;	//Components.labeler.WEBTYPES.TABLECELL;
	this.tableType = null;	//Components.labeler.WEBTYPES.SCRATCHTABLE or Components.labeler.WEBTYPES.TABLE (table in a content page)

	this.clickLoc = null;	// e.g. {x:10, y:50} for XPaths, so we know the location of the click
	this.windowId = null
	this.windowType = ""	// e.g. content, dialog
	this.windowName = ""	// document.title
	this.tabNumber = null	// e.g. for a tabbed browser
	this.isDialogP = false	// true if the target is in a dialog box. Eventually this can be improved to specify *which* dialog box

	this.targetColumnLabel = null;	// a variableValue.  EITHER the targetColumnLabel OR the targetColumnNumber should be non-null.
	this.targetColumnNumber = null;	// a number literal	// (AC) I want to change this to a VVO that evaluates to a number. So 'the "3" column' is different from 'the number 3 column' (which equals 'column 3')
	this.targetRowLabel = null;		// a variableValue. EITHER the targetRowLabel OR the targetRowNumber should be non-null.
									// We don't record any row labels -- we always use the row number.
									//But a user could specify a value in *any cell* in a row as a label for that row. This hasn't been implemented yet. (AC)
	this.targetRowNumber = null;	// a number VVO 
	// targetTableLabel: For the time being, there is just a single scratchtable. But eventually there will be multiple scratchtables and content tables (AC)
	this.targetTableLabel = null;	
	
	return this ;
}

CoScripterCommand.prototype.TableTargetSpec.prototype = {
	getDisambiguator : function(){
		return this.disambiguator;
	},

	getOrdinal : function(){
		if (this.ordinal) return this.ordinal.getValue();
		return null
	},

	getTargetLabel : function(){
		return ""	// not used
	},

	getTargetType : function(){
		return this.targetType;
	},
	
	getTableType : function(){
		return this.tableType
	},
	
	getClickLoc : function(){
		return this.clickLoc;
	},
	
	getClickLocX : function(){
		return this.getClickLoc().x;
	},
	
	getClickLocY : function(){
		return this.getClickLoc().y;
	},
	
	getWindowName : function(){
		return this.windowName
	},

	getWindowId : function(){
		return this.windowId;
	},

	getWindowType : function(){
		return this.windowType;
	},

	getWindowDescriptor : function(){
		if (this.getWindowName()) {
			var windowDescriptor = " in the \"" + this.getWindowName() + "\" window";
		} else if (this.getWindowId() == 0) {
			windowDescriptor = " in the main window";
		} else if (this.getWindowId() != null) {
			windowDescriptor = " in window #" + this.getWindowId();
		} else {
			windowDescriptor = "";
		}
		if (this.getWindowType() == "dialog") {
			windowDescriptor = " in the dialog";
		}
		if (this.getWindowId() == "BrowserPreferences") {
			windowDescriptor = " in the \"BrowserPreferences\" window";
		}
		return windowDescriptor;
	},
	
	getRowNumber : function(){
		var u = this.components.utils()
		if (this.targetRowNumber) return u.getNumValue(this.targetRowNumber)
		if (this.targetRowLabel) return u.getNumValue(this.targetRowLabel)
		return null
	},

	getColumnNumber : function(){
		var u = this.components.utils()
		var columnNumber
		var scratchSpaceUI = u.getCurrentScratchSpaceUI()
		var scratchSpaceEditor = scratchSpaceUI.getEditor()
		if (!scratchSpaceEditor) throw "CoScripter command's TableTargetSpec called, but there is no open scratchspace"
		if (this.targetColumnNumber) columnNumber = u.getNumValue(this.targetColumnNumber-1)
		else if (this.targetColumnLabel) {
			var columnLabel = u.getStrValue(this.targetColumnLabel)
			columnNumber =  scratchSpaceEditor.getDataColumnIndex(0, columnLabel)
		} 
		if (columnNumber == -1) throw "CoScripter command's TableTargetSpec referenced non-existent column name: " + columnLabel
		return columnNumber + 1
	},

	getValue : function(){	// TableTargetSpec
		var u = this.components.utils()
		var scratchSpaceUI = u.getCurrentScratchSpaceUI()
		var scratchSpaceEditor = scratchSpaceUI.getEditor()
		if (!scratchSpaceEditor) throw "CoScripter command's TableTargetSpec called, but there is no open scratchspace"
		var rowNumber = this.getRowNumber()
		var columnNumber = this.getColumnNumber()
		var scratchtableCellValue = scratchSpaceEditor.getData(0, rowNumber-1, columnNumber-1)
		return scratchtableCellValue;
	},
	
	setValue : function(value){	// TableTargetSpec
		var u = this.components.utils()
		var scratchSpaceUI = u.getCurrentScratchSpaceUI()
		var scratchSpaceEditor = scratchSpaceUI.getEditor()
		if (!scratchSpaceEditor) throw "CoScripter command's TableTargetSpec called, but there is no open scratchspace"
		var rowNumber = this.getRowNumber()
		var columnNumber = this.getColumnNumber()
		scratchSpaceEditor.setData(0, rowNumber-1, columnNumber-1, value)
	},
	
	toString : function(){
		return this.toSlop();
 	},

	toSlop : function(){
		var u = this.components.utils()
		var str = "";
		if (this.ordinal != null) str += u.getOrdinal(this.getOrdinal()) + " ";	// ordinal	
		/*
		// paste into scratchtable already has a label generated, so use it (AC)
		if (this.targetLabel != null) {
			str += "cell in " + this.targetLabel
		}	
		else str += "cell in " + this.columnSlop() + " of " + this.rowSlop()
		*/
		str += "cell in " + this.columnSlop() + " of " + this.rowSlop()
		str += " of the " + this.getTableType()
		return str;
	},
	
	variabilize : function(database) {
		if (this.targetColumnLabel) this.targetColumnLabel.variabilize(database);
		if (this.targetRowLabel) this.targetRowLabel.variabilize(database);
		if (this.ordinal) this.ordinal.variabilize(database);
	},

	needsVars : function() {
		return (
				(this.targetColumnLabel) ?  this.targetColumnLabel.needsVars() : false ||
				(this.targetRowLabel) ?  this.targetRowLabel.needsVars() : false || 
				(this.ordinal) ?  this.ordinal.needsVars() : false
			)
	},
	
	fillInVars : function(database) {
		if (this.targetColumnLabel) this.targetColumnLabel.fillInVars(database);
		if (this.targetRowLabel) this.targetRowLabel.fillInVars(database);
		if (this.ordinal) this.ordinal.fillInVars(database);
	},

	hasNeededVars : function() {
		return (
				(this.targetColumnLabel) ?  this.targetColumnLabel.hasNeededVars() : true &&
				(this.targetRowLabel) ?  this.targetRowLabel.hasNeededVars() : true && 
				(this.ordinal) ?  this.ordinal.hasNeededVars() : true
			)
	},

	columnSlop : function(){
		var str = "";
		if (this.targetColumnLabel) {	// either the label should be filled in with a variableValue, or there should be a targetColumnNumber literal.
			str += "the \"" + this.targetColumnLabel.getValue() + "\" column";
		} else if (this.targetColumnNumber) {
			str += "column " + this.targetColumnNumber;
			} else str += " the column";
		return str;
	},

	rowSlop : function(){
		var str = "";
		if (this.targetRowLabel) {	// either the label should be filled in with a variableValue, or there should be a targetRowNumber literal.
			str += "the " + this.targetRowLabel.getValue() + " row";
		} else if (this.targetRowNumber) {
			str += "row " + this.targetRowNumber
			} else str += " the row";
		return str;
	},
}	// TableTargetSpec


// ===================================
//					CellReference
// ===================================
// labeler.findTarget generally returns a pointer to a DOM element
// But XUL table cells are referenced by the DOM table element plus a columnIndex and a rowIndex
// So this special CellReference object is a way to refer to xul table cells
CoScripterCommand.prototype.CellReference = function(){
	this.tableElement = null;	// e.g. u.getCurrentScratchSpaceUI().getEditor()
	this.tableIndex = 0;	// since for now we are only using a single scratchtable (AC)
	this.rowIndex = null;
	this.columnIndex = null;
}


// ===================================
// =========== DojoWidgetTargetSpec =======
// ===================================
// Use the DojoWidgetTargetSpec for a target that is a (subcomponent of a) Dojo Widget
// Examples of generated command text:
// * click the body of the "Who Brings What" documentWorklet
// * uncheck the checkbox of the "New Todo" todoWorklet
// * enter "Allen's Home Page" into the "title" textbox of the "New Link" linkWorklet
// * select the "small" entry in the "fontSize" listbox of the "Who Brings What" documentWorklet
// * expand the "coyote point" entry in the "Allen Cypher's CoScripts" feedWorklet
// * expand "Princeton"'s "Graduate Students" entry in the "People" treeWidget of the "Universities" documentWorklet 
//		("Princeton"'s is a subcomponentDisambiguator)
CoScripterCommand.prototype.DojoWidgetTargetSpec = function(){
	// properties of all targetSpecs
	this.disambiguator = null ;
	this.ordinal = null ; 
	this.action = "";  //e.g. "click" or ["collapse", "expand"]
	this.turnOnP = false;   // if the widget has two states, is the current action turning it on (opening, etc)?
	this.targetValue = "";	// e.g. "x-small", "sandy brown"
	this.targetLabel = null; // e.g. "coyote point", "fontSize" the text string used in a generated command to label this widgetNode
	this.targetType = null;	// e.g. "button", "slider" the text string used in a generated command to name this type of UI element
	this.target = null;	// self or a parent which is a subcomponent of the widget
	this.clickLoc = null;	// e.g. {x:10, y:50} for XPaths, so we know the location of the click
	this.windowId = null
	this.windowType = ""	// e.g. content, dialog
	this.windowName = ""	// document.title
	this.tabNumber = null	// e.g. for a tabbed browser
	this.isDialogP = false	// true if the target is in a dialog box. Eventually this can be improved to specify *which* dialog box
	this.components = registry ;

	// For dijits -- not sure if I'll use these.
	//this.wairole = null;	// "button" for TitlePane dojoWidget
	
	//  dojo-widget properties
	this.widgetClass = "";		// e.g. "lconn.dogear.SearchBar"
	                       // the value of the node's dojotype parameter or the widget's declaredClass 
							// 	Not sure I will always be able to get this. If not, it's a unique name given by the person 
							//     who writes the code to generate coscripter commands for this custom widget
    this.widgetType = "";   // e.g. "CurrencyTextBox" For a dijit, typically the last part of the widgetClass
    // hopefully a widget will never need a widgetName which is different from both targetType and widgetType (AC)
    //this.widgetName = "";   // the text string used in a generated command to name this type of widget e.g. "documentWorklet"
	this.subcomponentName = "";	// the text string used in a generated command to label this type of subcomponent of this widget e.g. "button"
	this.subcomponentLabel = "";	// the text label used in a generated command to label this type of subcomponent e.g. "addComment"
									// When the subcomponentName is not a common, overloaded name, like "button" 
									//	the subcomponentLabel will be null e.g. when subcomponentName = "body" in a documentWorklet
	this.multipleP = false;		// can there be more than one of this type of subcomponent in this widget?
	this.makeVisible = null;	// If a user action is required to make this subcomponent visible, the value of makeVisible is an array with
							//	index 0 is a string naming the event, such as "onmouseenters", and
							//	index 1 is the target of that event
									
	// this instance of the widget
	this.subcomponentNode = null;	// the html node that is the target 
	this.widgetNode = null;		// the html node for the dojo widget that contains this subcomponent target node
	this.widgetDisambiguator = "";	// If this widget instance is not uniquely identified by its widgetLabel and targetType,
											//    this is the text string the handleEvent postprocessor in command-generator created to disambiguate this node.
	this.subcomponentDisambiguator = "";	// If multipleP is true, this subcomponent node may not be uniquely identified by its subcomponentName and subcomponentLabel,
											//    This is the text string used to disambiguate this subcomponent instance.
											//	(If subcomponentLabel is null, this will be used as the label in the generated command text
											//		So far, this hasn't occurred: any subcomponent with a special subcomponentName like "body" has so far never appeared more than once in its widget.) 
	this.initialState = null;	// e.g. current color, checkbox turned on, current text. 
	this.newState = null;		// after this event is executed
	// this.subcomponentWidgetTargetSpec = null;	// if the value of this instance of the subcomponent is itself a widget, this is a pointer to its widgetTargetSpec
	// this.parentWidgetTargetSpec = null;	// if this instance of the widget is being used as a subcomponent of some other widget, this is a pointer to its widgetTargetSpec
	return this ;
}

CoScripterCommand.prototype.DojoWidgetTargetSpec.prototype = {
    getAction : function(){
		if (typeof this.action == "object") {
			return this.turnOnP ? this.action[1] : this.action[0]
		}
        else return this.action;
    },

    getDisambiguator : function(){
        return this.disambiguator;
    },

	getTargetLabel : function(){
		return this.targetLabel
	},

	getOrdinal : function(){
		if (this.ordinal) return this.ordinal.getValue();
		return null
	},

	getTargetType : function(){
		return this.targetType;
	},
	
	getClickLoc : function(){
		return this.clickLoc;
	},
	
	getClickLocX : function(){
		return this.getClickLoc().x;
	},
	
	getClickLocY : function(){
		return this.getClickLoc().y;
	},
	
	getWindowName : function(){
		return this.windowName
	},

	getWindowId : function(){
		return this.windowId;
	},

	getWindowType : function(){
		return this.windowType;
	},

	getWindowDescriptor : function(){
		if (this.getWindowName()) {
			var windowDescriptor = " in the \"" + this.getWindowName() + "\" window";
		} else if (this.getWindowId() == 0) {
			windowDescriptor = " in the main window";
		} else {
			windowDescriptor = " in window #" + this.getWindowId();
		}
		if (this.getWindowType() == "dialog") {
			windowDescriptor = " in the dialog";
		}
		if (this.getWindowId() == "BrowserPreferences") {
			windowDescriptor = " in the \"BrowserPreferences\" window";
		}
		return windowDescriptor;
	},

	toString : function(){
		return this.toSlop();
 	},

	toSlop : function(){
		var u = this.components.utils()
		var str = "";
		var type = this.subcomponentName || this.targetType
		
		// (AC) This method needs to be cleaned up:  it has evolved slowly as new widgets were added and is now convoluted.
		// Click commands assume that widget targetSpecs figure out the entire slop, which is a good idea.
		// CAssistantArtifactNode is particularly tricky: it is based on the inline editor dijit and requires a click in the widget to
		//create the INPUT node. So toSlop has to handle both a click and an enter command for this widget.
		// When cleaning up, it might be good to make Enter commands (and all commands) assume that widget targetSpecs figure out the entire slop.
		if (this.widgetClass == "artifactNode" && this.action == "click") return "click the " + this.targetLabel + " textbox"
		if (this.targetType == "textbox") {
            var targetLabelSlop = (this.targetLabel && (typeof this.targetLabel == "object")) ? this.targetLabel.toSlop() : this.targetLabel; 
			str += targetLabelSlop + " " + type
			return str;
		}

        var targetValueSlop = (this.targetValue && (typeof this.targetValue == "object")) ? this.targetValue.toSlop() : this.targetValue; 
		
		switch (type) {
				case "listbox" : str += "select " + targetValueSlop + "in"
					break;
                case "textbox" : str += "enter" + targetValueSlop + "into"
                    break;
                case "item" : 
                case "section" : 
                case "checkbox" : 
                case "color" : 
                case "menuitem" : 
                case "tab" : 
				    str += this.getAction()
                    break;
				default : str += "click"
				}
		//labelSlop = this.subcomponentLabel ? "\"" + this.subcomponentLabel.toSlop() + "\"" : this.subcomponentLabel
		var subcomponentSlop = ""
        var subcomponentLabelSlop = (this.subcomponentLabel && (typeof this.subcomponentLabel == "object")) ? this.subcomponentLabel.toSlop() : this.subcomponentLabel; 
		if (subcomponentLabelSlop && subcomponentLabelSlop != '""') subcomponentSlop = " the " + subcomponentLabelSlop + " " + type
        else if (this.subcomponentName) subcomponentSlop = " the " + type
		// targetType of tabContainer is null, since it is used for layout and we don't want it included in the generated command
		// targetType is, eg "section"
		var mainTargetSlop = ""
		if (this.targetType != "") {
			if (this.widgetDisambiguator) mainTargetSlop =  " the \"" + this.widgetDisambiguator + "\"'s " + this.targetLabel.toSlop() + " " + this.targetType
			else if (this.ordinal) mainTargetSlop =  " the " + u.getOrdinal(this.getOrdinal()) + " " + this.targetLabel.toSlop() + " " + this.targetType
			else mainTargetSlop =  " the " + this.targetLabel.toSlop() + " " + this.targetType
		}
		var targetSlop = ""
		if (!mainTargetSlop) targetSlop = subcomponentSlop
		else if (!subcomponentSlop) targetSlop = mainTargetSlop
		else targetSlop = subcomponentSlop + " of " + mainTargetSlop
		
		return str + targetSlop;
	},
	
	variabilize : function(database) {
		if (this.subcomponentLabel && (typeof this.subcomponentLabel == "object")) this.subcomponentLabel.variabilize(database);
		if (this.targetLabel && (typeof this.targetLabel == "object")) this.targetLabel.variabilize(database);
		if (this.targetValue && (typeof this.targetValue == "object")) this.targetValue.variabilize(database);
	},

	needsVars : function() {
		return (this.subcomponentLabel.needsVars() && this.targetLabel.needsVars() && this.targetValue.needsVars())
	},
	
	fillInVars : function(database) {
		this.subcomponentLabel.fillInVars(database);
		this.targetLabel.fillInVars(database);
		this.targetValue.fillInVars(database);
	},

	hasNeededVars : function() {
		return (this.subcomponentLabel.hasNeededVars() && this.targetLabel.hasNeededVars() && this.targetValue.hasNeededVars())
	},

}	// DojoWidgetTargetSpec


// ===================================
// =========== VariableValue =========
// ===================================
// A variableValue can be a stringLiteral, personalDBValue, regexp (every label on the content page is tested against the regexp to see if it matches), 
//javascript (which evaluates to a string), a scratchtableCell's textContent, or a target element's textContent.
// Note that a regexp only makes sense when the variableValue is used as a label or in an IF comparison.  The other main use of a variableValue is as text to enter into a textbox.
// One of literal, dbkey, javascript, or tableTargetSpec will be filled in.
CoScripterCommand.prototype.VariableValue = function(literal) {
	if (typeof(literal) != "undefined")
		this.literal = literal;	// e.g. "submit"  // For a regexp, this.literal.test is "function"
	else
		this.literal = null;
	this.dbkey = null;
	this.dbval = null;
	this.secret = false;	// default to "not secret"
	this._needsvar = false;
	this._matchtype = null;
	this.targetAreaType = null;	//used by getValue.  set by strict-parser's parseVariableValue to commandComponent.TARGETAREATYPE.SCRATCHTABLE
	this.tableTargetSpec = null;	// used when the Variable is a cell in a table (this is the equivalent of a dbkey).
	this.javascript = null;
    this.components = registry;
	return this;
}

CoScripterCommand.prototype.VariableValue.prototype = {
	setMatchType : function(type) {
		this._matchtype = type;
	},

	getMatchType : function(type) {
		return this._matchtype;
	},

	isSecret : function() {
		return this.secret;
	},

	// variableValue is used for labels. In that case, the value can come from a literal, the personal db, a regexp, javascript
	//or the text value of a target element, including a scratchtable.
	// That value can either be used directly or after a partial match phrase such as "contains" or "ends with" (AC)
	getValue : function(useRegExp) {	// VariableValue
		var parser = this.components.parser()
		var labeler = this.components.labeler()
		var commands = this.components.commands()
		if (typeof(useRegExp) == "undefined") {
			/**
			 * Return the value of this variable when needed for execution.
			 * The "useRegExp" flag, if false, will not encase the value in a
			 * RegExp object (which is necessary for the findRegionElement method
			 * in the labeler).  The default behavior is to return a RegExp object
			 * in some conditions.
			 */
			useRegExp = true;	// default if not specified
		}

		var varValue = null
		if (this._needsvar) {	// db value
			varValue = this.dbval;
		} else if (this.literal !== null && typeof(this.literal.test) == "function") { // regexp
			varValue = this.literal;
		} else if (this.tableTargetSpec) {
			varValue = this.tableTargetSpec.getValue();
		} else if (this.javascript) {
			varValue = this.evaluateJavascript()
		} else {	// stringLiteral
			varValue =  this.literal;
		}
		
		// check for a partial match phrase
		if (this.getMatchType() != null && useRegExp) {
			var matchTypeRegexp = this.matchTypeToRegexp(this.getMatchType(), varValue)
			if (!matchTypeRegexp) throw "variableValue getValue Exception: unknown matchtype "
			return matchTypeRegexp
		}
		else return varValue
	},

	// Returns the sloppy version of this variable reference
	/* isPassword?  needVar?		secret key?     result
	// Y              N				-				"your password"
	// N              N				-				literal string
	// Y              Y				Y				your "dbkey"
	// Y              Y				N				your "dbkey"
	// N              Y				N				your "dbkey" (e.g.  "value")
	// N              Y				Y				your "dbkey"
	*/
	toString : function() {
		if (this.dbkey != null) {
			var ret = 'your "' + this.dbkey + '"'; 
			/* don't include "e.g." any more -- it's too likely to be info the script creator doesn't want to share (AC)
			if (!this.secret && !isPassword) {
				ret += ' (e.g., ' + this.literal + ')';
			}
			*/
			return ret;
		} else {
			if (null == this.literal) {
				return "";
			} else {
				// this.literal can either be a string or a RegExp object
				// This is really stupid, but we can't check that using "instanceof".
				if (typeof(this.literal.test) == "function") {
					// If it's a regex
					return 'r"' + this.escapeQuotes(this.literal.source) + '"';
				} else {
					if (this.tableTargetSpec) {	// table cell
						return "the " + this.tableTargetSpec.toString()
					} else {
						if (this.javascript) {	// javascript
							return 'j"' + this.escapeQuotes(this.javascript) + '"'
						} else {
							// Otherwise it's a string
							return "\"" + this.escapeQuotes(this.literal) + "\"";
						}
					}
				}
			}
		}
	},

	toSlop : function() {
		return this.toString();
	},

	// Takes this.literal and tries to find a database key that has it as a value; if so, sets this up as a variable.
	// (AC) For a tab dijit this.literal' is an object, which seems right.
	// So in that case I use its textContent.  
	variabilize : function(database) {
		if (this.literal != null) {
			var literalValue = (typeof this.literal == 'object') ? this.literal.textContent : this.literal
			var dbEntry = database.inverseLookupEntry(this.literal);
			if ( dbEntry ) {
				this.dbkey = dbEntry.ident.string;	//e.g. "work email"
				this.secret = dbEntry.secret;
				this._needsvar = true;
			} else {	// check the cells in the first row of the scratchtable
				var u = this.components.utils()
				var scratchSpaceUI = u.getCurrentScratchSpaceUI()
				if (!scratchSpaceUI) return;
				var scratchSpaceEditor = scratchSpaceUI.getEditor()
				if (!scratchSpaceEditor) return;
				for (var columnNumber=0; columnNumber<scratchSpaceEditor.getDataColumnCount(0); columnNumber++) {
					var scratchtableCellValue = scratchSpaceEditor.getData(0, 0, columnNumber)
					if (scratchtableCellValue == literalValue){
						this.tableTargetSpec = new CoScripterCommand.prototype.TableTargetSpec()
						this.tableTargetSpec.targetRowNumber = 1
						var columnLabel = new CoScripterCommand.prototype.VariableValue(scratchSpaceEditor.getDataColumnName(0, columnNumber))
						this.tableTargetSpec.targetColumnLabel = columnLabel
						this.tableTargetSpec.tableType = this.components.labeler().WEBTYPES.SCRATCHTABLE
						this.targetAreaType = this.components.commands().TARGETAREATYPE.SCRATCHTABLE
						this._needsvar = true;
						return;
					}
				}
			}
		}
	},	// end of variabilize() for VariableValue

	// Set the needsvar variable, which determines whether this reference is a literal (false) or needs a database variable to be complete (true)
	setNeedVar : function(val) {
		this._needsvar = val;
	},
	
	needsVars : function() {
		return this._needsvar;
	},

	fillInVars : function(database) {
		// Look up this.dbkey in the database and retrieve the value
		if (this._needsvar && this.dbkey != null) {
			var entry = { key : this.dbkey, value : "" };
			database.lookupAlgorithm3Entry(entry);
			if (entry.value) {
				this.dbval = entry.value;
				this.secret = entry.secret;	// FYI, entry.secret is whether it was secret or not
			}
		} else if (this._needsvar && this.tableTargetSpec != null){
			var u = this.components.utils()
			var scratchSpaceUI = u.getCurrentScratchSpaceUI()
			var scratchSpaceEditor = scratchSpaceUI.getEditor()
			var columnNumber = scratchSpaceEditor.getDataColumnIndex(0, this.tableTargetSpec.targetColumnLabel.toString(), 1) + 1
			var cellValue = scratchSpaceEditor.getData(tableIndex, 1, columnNumber)
			this.dbval = cellValue
		}
	},

	// Returns true iff this variable has the values needed
	hasNeededVars : function() {
		if (!this._needsvar) return true;	// If we don't need a variable, always return true
		return (this.dbval != null);	// Otherwise return true iff the value was found
	},

	escapeQuotes : function(s) {
		if (s != null)
			return s.replace("\"", "\\\"", "g");
		else
			return s;
	},

	setVarOrVal : function(val) {
		if (this._needsvar) {
			this.dbkey = val;
		} else {
			this.literal = String(val);
		}
	},

	matchTypeToRegexp : function(matchType, varValue) {
		var labeler = this.components.labeler()
		var parser = this.components.parser()
		var matchTypeRegexp = null
		if (matchType == parser.ParserConstants.CONTAINS) {
			matchTypeRegexp = new RegExp(".*" + labeler.regexEscape(varValue) + ".*");
		} else if (matchType == parser.ParserConstants.STARTSWITH) {
			matchTypeRegexp = new RegExp("^" + labeler.regexEscape(varValue) + ".*");
		} else if (matchType == parser.ParserConstants.ENDSWITH) {
			matchTypeRegexp = new RegExp(".*" + labeler.regexEscape(varValue) + "$" );
		} else if (matchType == parser.ParserConstants.EQUALS) {
			matchTypeRegexp = new RegExp("^" + labeler.regexEscape(varValue) + "$" );
		}
		return matchTypeRegexp
	},

	evaluateJavascript : function() {
		try{
			var sandbox = Components.utils.Sandbox("http://www.example.com/");
			var evalResult = "";
			sandbox.testVal = 16
			sandbox.testStr = "36"
			// Add personalDB to the sandbox
			var personalDBArray = this.components.databaseXpcom().databaseToArray()
			sandbox.personalDB = personalDBArray
			// Add scratchtable array to the sandbox
			var u = this.components.utils()
			var scratchSpaceUI = u.getCurrentScratchSpaceUI()
			var scratchSpaceEditor = scratchSpaceUI ? scratchSpaceUI.getEditor() : null
			if (scratchSpaceEditor) {
				var scratchtableArray = []
				for (var rowNumber=0; rowNumber<scratchSpaceEditor.getDataRowCount(0); rowNumber++) {
					var scratchtableRow = []
					for (var columnNumber=0; columnNumber<scratchSpaceEditor.getDataColumnCount(0); columnNumber++) {
						var columnName = scratchSpaceEditor.getDataColumnName(0, columnNumber)
						var scratchtableCellValue = scratchSpaceEditor.getData(0, rowNumber, columnNumber)
						scratchtableRow[columnName] = scratchtableCellValue
					}
					scratchtableArray[rowNumber+1] = scratchtableRow
				}
				sandbox.scratchtable = scratchtableArray
			}
			evalResult = Components.utils.evalInSandbox(this.javascript,sandbox)
			return evalResult
		}catch(e){
			throw "error in CoScripter command's VariableValue's evaluateJavascript: " + e.toString()
		}
	},

}	//  end of VariableValue

var commands = new CoScripterCommand();
//debug('done parsing coscripter-command.js');
