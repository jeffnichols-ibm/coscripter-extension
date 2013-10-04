/*
This Program contains software licensed pursuant to the following : 
MOZILLA PUBLIC LICENSE
Version 1.1
The contents of this file are subject to the Mozilla Public License
Version 1.1 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License at
http: //www.mozilla.org/MPL/

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
furnished to do so, subject to the following conditions : 
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
// Debug method for all files loaded into the sidebar is defined in sidebar.js
//debug('parsing coscripter-command-processor.js')

// coscripter-sidebar.js, coscripter-command-processor.js, coscripter-context.js, 
// coscripter-editor-richtextbox.js, and coscripter-dom-utils.js 
//are all loaded into the sidebar coscripterWindow by coscripter-siderbar.xul. 

///////////////////////////////////////////////// 
// This file contains routines for displaying recorded CoScripter script commands.
///////////////////////////////////////////////// 
//		receiveRecordedCommand     Callback from command-generator component
//		skipCommand
//		insertCommand
//			createWindowDescriptorForDisplay
////////////////////////////////////////////////


////////////////////////////////
//		receiveRecordedCommand     Callback from command-generator component
////////////////////////////////
// *** This is the CallBack used by the command-generator component to pass on each CoScripter Command object that it generates 
//whenever it receives a UI event from YULE.
//  (It's called receiveRecordedCommand because YULE is recording events. 
//   The event may be a recording of a user action, an execution of a CoScripter action, 
//   or a user action that auto-advances the current script)
function receiveRecordedCommand(cmd) {  
	var u = registry.utils()
	var ExecutionEngine = registry.executionEngine()
	currentActionNumber += 1
	if (recording) {

		if ( firstCommandP() && !gotoP(cmd)){	//if first command is not a goto, insert a goto
			/* Create a new goto command
			// TL: grab the URL out of the current browser's location bar, not out of the document containing the recordedCommand's target,
			// because it could be a frame in a frameset (bug #75013)
			// This was failing when the ScrapBook is used, so now contextRecorder gets the url before calling ScrapBook
			// TODO: workaround for context recording:
			//	recordedCommand.gotoCommandUrl ? recordedCommand.gotoCommandUrl  : 
			*/
			var gotoCommand = getCommands().createGotoFromParams(null, u.getBrowserDocument(u.getChromeWindowForWindow(window)).location.href)
			if (gotoCommand.getLocation() != "about:blank") insertCommand(gotoCommand)
		}
		
		// Insert recorded command
		insertCommand(cmd)
		
	}	
	/* DISABLED auto-advance. 
	 * It checks cmd.getTargetLabel, which calls getValue() of the variableValue, which simply returns this.dbval without doing a lookup.
	 * This is bad now that we compile entire scripts. We had been assuming that each command was created just before execution and then discarded.
	 * So, we now have stale values sitting around causing problems.
	 * Need access to 'database' to evaluate cmd.getTargetLabel, but it's not available to receiveRecordedCommand
	 else {	//not recording
		// Track user actions and advance cursor if necessary
		if (sameCommandP(cmd, ExecutionEngine.currentCommand)) {
			// Highlight this step
			u.highlightThenDo(procedureInteractor.getCurrentLine(),
				function() {
					ExecutionEngine.advanceStep(false); // Advance to the next step, entering nested blocks
				});
		}
	}	// end of not recording
	*/
}	// end of receiveRecordedCommand

// Test whether two commands are similar enough for the cursor to advance, when the editor is currently pointing at currentCmd and the user performs recordedCmd
function sameCommandP(recordedCmd, currentCmd) {
	if (!currentCmd) return false;
	// Any two goto steps match
	var goToAction = getCommands().ACTIONS.GOTO
	if ((recordedCmd.getAction() == goToAction) && (currentCmd.getAction() == goToAction)) {
		var recordedLoc = recordedCmd.loc.literal
		var currentLoc = currentCmd.loc.literal
		var recordedDomainMatch = recordedLoc.match(/(.*\:\/\/)?([^\/]*)/)
		var currentDomainMatch = currentLoc.match(/(.*\:\/\/)?([^\/]*)/)
		var recordedDomain = recordedDomainMatch ? recordedDomainMatch[2] : null
		var currentDomain = currentDomainMatch ? currentDomainMatch[2] : null
		return (recordedDomain && recordedDomain == currentDomain);
		}
	// Otherwise compare the action, target label, and target type
	if (recordedCmd.getAction() == currentCmd.getAction() &&
		recordedCmd.getTargetLabel() == currentCmd.getTargetLabel() &&
		recordedCmd.getTargetType() == currentCmd.getTargetType())
		return true;
	if ((currentCmd.getAction() == getParserComponent().ParserConstants.YOU) && (
			sameCommandP(recordedCmd, currentCmd.nestedCommand)))
		return true;
	return false;
}

function firstCommandP() {
	var cln = procedureInteractor.getCurrentLineNumber();
	for ( var i = 0; i <= cln; i++ ) {
	  var line = procedureInteractor.getLineWithNumber(i);
	  if ( !isLineComment(line) ) {
	      var linetext = procedureInteractor.getLineText(line);
	      linetext = this.components.utils().trim(linetext);
	      if ( linetext == "" ) continue; // Skip empty lines           
	      return false;
	  }
	}
	return true;
}

function gotoP(cmd) {
	// Slightly kludgy. We can treat an "Open Location" menu command as a GoTo command, because it will probably be followed by a loadURIEvent (AC)
	var targetLabel = cmd.targetSpec && cmd.targetSpec.targetLabel ? cmd.targetSpec && cmd.targetSpec.targetLabel && cmd.targetSpec.targetLabel.literal : null
	return (cmd.getAction() == getCommands().ACTIONS.GOTO) || (targetLabel && targetLabel.indexOf("File>Open Location") != -1)
}

//		skipCommand
function skipCommand(command) {
	var sidebarBundle = document.getElementById("bundle-coscripter-sidebar") 	 
	var clipNode = sidebarBundle.getString("clipNode") 	 
    
	// The Recorder currently sends "Enter" keypresses, in case a "submit" doesn't generate a button click
	// Don't record the keypress if the click was just recorded
	if (command.getAction() == getCommands().ACTIONS.ENTER &&
		command.getValue() == "\n" &&
		previousCommand && (
			previousCommand.getAction() == getCommands().ACTIONS.CLICK ||
			previousCommand.getAction() == getCommands().ACTIONS.GOTO))
		return true;
		
	// Pasting into a textbox also generates an Enter command.  
	// When this happens, discard the Enter command.
	if (command.getAction() == getCommands().ACTIONS.ENTER &&
		previousCommand && previousCommand.getAction() == getCommands().ACTIONS.PASTE) {
			var commandSlop = command.toSlop()
			var prevCommandSlop = previousCommand.toSlop()
			var intoIndex = commandSlop.indexOf("into")
			var prevIntoIndex = prevCommandSlop.indexOf("into")
			if (commandSlop.slice(intoIndex, commandSlop.length) == prevCommandSlop.slice(prevIntoIndex, prevCommandSlop.length)){
				return true;					
			}
		}
		
	// * select the "Clip content into CoScript" menu is a CoScripter internal action that shouldn't be recorded
	if (command.getAction() == getCommands().ACTIONS.SELECT &&
		command.targetSpec &&  command.targetSpec.targetType ==  "menu" 
		&& command.targetSpec.targetLabel && command.targetSpec.targetLabel.literal == clipNode){
		 return true;
	}

	/* Do not record chrome commands
	if ( command.targetArea == "chrome" && 
			command.targetType != "toolbar item" &&
			command.targetType != "tab"  && 
			command.targetType != "menu"  && 
			command.targetType != "menuitem" &&
			command.action != getCommands().ACTIONS.GOTO ) 
		return true;
	*/	

	//if ( command.targetLabel == "tab-close-button" || command.targetLabel == "CoScripter" ) return true
	
	// Do not record a "File>Open Location" command, since it will probably be followed by a loadURIEvent.
	// This is a poor man's version of converting a recording sequence of '1) cmd-L 2) enter url into the Address Bar 3) Type "enter" key' 
	//into the higher-level command 'go to url'.  Fixes bug # 117781
	var targetLabel = command.targetSpec && command.targetSpec.targetLabel ? command.targetSpec && command.targetSpec.targetLabel && command.targetSpec.targetLabel.literal : null
	if (targetLabel && targetLabel.indexOf("File>Open Location") != -1) return true

	// Do not record sidebar commands
	if ( command.targetArea == "coscripterSidebar" ) return true
	// Do not record error console commands
	if ( command.windowDescriptor == "Error Console") return true
	// Do not record debugger commands
	if ( command.windowDescriptor == "JavaScript Debugger") return true
	
	// Do not skip anything else
	return false
}

//		insertCommand
// Add the textual description of this command to the sidebar's Editor area
function insertCommand(command) {
	//debug("in command-processor insertCommand") 
	var pI = procedureInteractor
	var windowDescriptor = null
	var lineIndent = null
	if (skipCommand(command)) return;
	
	// Generate command text
	try {
		command.variabilize(coscripter.db);
		var commandText = command.toSlop();
	} catch (e) {
		dump('Error making slop: ' + e.toSource() + '\n');
		debug('Error making slop: ' + e.toSource() + '\n');
	}
	commandText = cleanCommandTextForInteractor(commandText)
	
	//debug("insertCommand: commandText is " + commandText) 
    // Dijit Enter commands sometimes fire both DOM and Dojo onChange events. Don't include a duplicate command.
    if (command.getAction() == getCommands().ACTIONS.ENTER && pI.getCurrentLineText() == commandText) return;
	
	// shift-select and control-select commands for multi-select listboxes will generate two "select" commands. The first one is incorrect and needs to be removed.
    if (previousCommand && previousCommand.getAction() == getCommands().ACTIONS.SELECT && command.getAction() == getCommands().ACTIONS.SELECT && command.specialKey) {
			windowDescriptor = createWindowDescriptorForDisplay(command)
			commandText += windowDescriptor
			pI.replaceCurrentLine(commandText)
			pI.moveCursorLineEnd()
			edited = true
			updateSidebarTitle()
			return;
	}

	//If the scratchtable is involved, combine an adjacent copy and paste pair into an 'enter' command 
	//Useful when running a script in the background, so the clipboard doesn't interfere with the foreground activity.
    if (previousCommand) {
		//debug("prevCommand and command are " + previousCommand.getAction() + " " + command.getAction())
		if (previousCommand.getAction() == getCommands().ACTIONS.COPY && command.getAction() == getCommands().ACTIONS.PASTE) {
			var commands = this.components.commands()
			var copyFromScratchtableP = (previousCommand.hasTargetSpec() && previousCommand.targetSpec.tableType == commands.TARGETAREATYPE.SCRATCHTABLE)
			var pasteIntoScratchtableP = (command.hasTargetSpec() && command.targetSpec.tableType == commands.TARGETAREATYPE.SCRATCHTABLE)
			pasteIntoScratchtableP = (pasteIntoScratchtableP && !(previousCommand.hasTargetSpec() && previousCommand.targetSpec.targetType == commands.TARGETAREATYPE.TEXT))	// Don't want to deal with parsing "put the ... text" commands for now (AC)
			if (copyFromScratchtableP || pasteIntoScratchtableP){
				var previousCommandText = cleanCommandTextForInteractor(previousCommand.toSlop())
				var commandTarget = commandText.slice(commandText.search(/paste/i)+5)
				var newCommandName = pasteIntoScratchtableP ? getCommands().ACTIONS.PUT : getCommands().ACTIONS.ENTER
				var newCommandText = previousCommandText.replace(getCommands().ACTIONS.COPY, newCommandName) + commandTarget
				windowDescriptor = createWindowDescriptorForDisplay(command)
				newCommandText += windowDescriptor
				pI.replaceCurrentLine(newCommandText)
				pI.moveCursorLineEnd()
				edited = true
				updateSidebarTitle()
				return;
			}
		}
	}
	
	previousCommand = command;
	
	// Add a new empty line
	if ( pI.getCurrentLineText() != "" ) {
		lineIndent = pI.getCurrentLineIndent()
		pI.moveCursorLineEnd()	// Move to end of line
		pI.insertLine("", true)	// Insert a new line 
	}
	
	// Add indent if none exists
	var currentline = pI.getCurrentLine()
	if ( !pI.hasLineIndent(currentline) ) {
		CoscripterDomUtils.removeClass(currentline, "comment")
		if (lineIndent != null) pI.setCurrentLineIndent(lineIndent)
		else pI.increaseLineIndent(currentline)
	}
	
	// Add the window descriptor
	windowDescriptor = createWindowDescriptorForDisplay(command)
	commandText += windowDescriptor
	
	// Add the text to the interactor;    
	pI.insertText(commandText)
	pI.moveCursorLineEnd()
	
	edited = true
	updateSidebarTitle()
	//debug("finished insertCommand") 
}

//			createWindowDescriptorForDisplay
// During Recording, determine what to include in the slop for the current line,
//   based on what window descriptors are shown for previous lines
function createWindowDescriptorForDisplay(command){
	// ToDo: parse any edited line and get its windowId (AC)
	if(!command.hasTargetSpec()) return ""
	var targetSpec = command.targetSpec
	var windowId = targetSpec.getWindowId()
	var windowDescriptor = targetSpec.getWindowDescriptor()
	
	var pI = procedureInteractor
	var currentLineNumber = pI.getCurrentLineNumber()
	var currentLine = pI.getCurrentLine()
	
	if (targetSpec.getWindowType() == "dialog") return windowDescriptor
	
	currentLine.setAttribute("windowId", windowId)
	for (var i=currentLineNumber-1; i>0; i--) {
		var prevLine = pI.getLineWithNumber(i)
		var prevWindowId = prevLine.getAttribute("windowId")
		if (prevWindowId) break;
	}
	
	if (prevWindowId) {
		if (windowId == prevWindowId) return ""
		else return windowDescriptor
	}
	else {
		if (windowId == 0) return ""	//the original window (I hope (AC))
		else return windowDescriptor
	}	
}

/*
 * NOT USED

//			setCurrentCommandWindowDescriptorFromDisplay
// During execution, since window descriptors are elided from slop if they can be determined from
//  the slop of prior commands in the editor window, this function looks at the 
//  previous slop to determine the window descriptor for the current command
function setCurrentCommandWindowDescriptorFromDisplay(){
	var u = this.components.utils()
	var currentCommand = this.currentCommand
	var targetSpec = currentCommand.targetSpec
	var windowId = null
	var windowName = null
	var windowType = null
	var windowDescriptor = null
	
	var pI = procedureInteractor
	var currentLineNumber = pI.getCurrentLineNumber()

	for (var i=currentLineNumber; i>0; i--) {
		var line = pI.getLineWithNumber(i)
		var lineText = pI.getLineText(line)
		lineText = u.trim(lineText)
		
		if (lineText.indexOf("in the dialog box") == lineText.length-"in the dialog box".length) {
			targetSpec.isDialogP = true
			targetSpec.windowType = "dialog"
			return
		}
		if (lineText.indexOf("in the dialog") == lineText.length-"in the dialog".length) {
			targetSpec.isDialogP = true
			targetSpec.windowType = "dialog"
			return
		}
		// in the "Preferences" window
		var res = lineText.match(/in the (\"([^"\\]|\\.)*")|(\'([^\'\\]|\\.)*\') window/)
		if (res) {
			targetSpec.windowName = res[1].slice(1,res[1].length-1)
			return
		}
		if (lineText.indexOf("in the main window") == lineText.length-"in the main window".length) {
			targetSpec.windowId = 0
			return
		}
		// in window #2; in window 2
		res = lineText.match(/in window #?([0-9]+)/)
		if (res) {
			targetSpec.windowId = res[1]
			return
		}
	}
	
	targetSpec.windowId = 0
}
*/


function cleanCommandTextForInteractor(commandText) {
	commandText = this.components.utils().trim(commandText)	// Remove extra white spaces
	commandText = commandText.replace(new RegExp("\n", "g"), '\\n')	// Escape newlines
	return commandText
}


//
var debugCallbacks = false ;
function debugCallback(e){
	dump('advancestep callback called topic:' + e.topic + ' currentCommand: ' + e.currentCommand + '\n');
};
if(debugCallbacks){
	this.addEventListener('advancestep',debugCallback);
	this.addEventListener('previewcurrentstep',debugCallback);
}
//


///////////////////////////
//		executeModalCommands
///////////////////////////// 
// Called by yule when a dialog is created, so that we can continue executing commands in the dialog
function executeModalCommands(event){
	try {
		if (recording) return;
		//debug("begin executeModalCommands")
		//if (recordDialogsP()) this.executeDialogCommand()
		this.executeDialogCommand()
		//debug("end executeModalCommands")
		return;
	} catch(e) {
		dump("executeModalCommands failed")
	}
}

function ExecutionException(string){
	this.string = string ;
	return this ;
}


function getParserComponent(){
    return coscripter.components.parser();
}

// get access to the coscripter-command component which
// contains type information for the various command objects
function getCommands(){
    return coscripter.components.commands();    
}

//debug('done parsing coscripter-command-processor.js')