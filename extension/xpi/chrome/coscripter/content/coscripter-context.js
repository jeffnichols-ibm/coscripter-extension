/*
 This Program contains software licensed pursuant to the following :
 MOZILLA PUBLIC LICENSE
 Version 1.1
 The contents of this file are subject to the Mozilla Public License
 Version 1.1 (the "License"); you may not use this file except in
 compliance with the License. You may obtain a copy of the License at
 http : //www.mozilla.org/MPL/
 Software distributed under the License is distributed on an "AS IS"
 basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 License for the specific language governing rights and limitations
 under the License.
 The Original Code is IBM.
 The Initial Developer of the Original Code is IBM Corporation.
 Portions created by IBM Corporation are Copyright (C) 2007
 IBM Corporation. All Rights Reserved.
 Contributor(s) : Greg Little, Allen Cypher (acypher@us.ibm.com), Tessa Lau, Clemens Drews, James Lin, Jeffrey Nichols, Eser Kandogan, Jeffrey Wong, Gaston Cangiano, Jeffrey Bigham.
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
// coscripter-sidebar.js, coscripter-command-processor.js, coscripter-context.js, coscripter-local-save.js, 
// coscripter-editor-richtextbox.js, and coscripter-dom-utils.js 
//are all loaded into the sidebar coscripterWindow by coscripter-siderbar.xul. 

///////////////////////////////////////////////////
//////////////  coscripter-context.js  ///////////////
///////////////////////////////////////////////// 
// This file  contains routines for programming by demonstration
//
//	contextP() (defined in sidebar.js) tells if Context Recording is turned on.
// When the contextRecorder component is present and the user has set about:config's coscripter.contextP to true, 
// Context Recording is turned on. 
//  If contextP() is true, whenever 1) recording is on, or 2) a step is executed, 
// (auto-advance will be handled specially later, with an initial quick test of whether the user action might match the current step)
// sidebar.js subscribes receiveGeneratedCommandForPbD (defined below) to receive the CoScripter Command objects 
// that are generated by command-generator (from click and change events sent to it by yule).
//
//  The CoScript object (defined in the abstracter.js component) is a richer object than the Procedure object (defined in sidebar.js) 
// for keeping information about a script. 
//  It keeps a ScriptExecution object for every time a script is created or executed.
//  A ScriptExecution keeps a PerformedAction for each recording or execution of a step.
//  The contextRecorder component contains the methods for adding context information to a PerformedAction. 
//  It gathers XPath information, 
// the contentDocument's innerHTML (or, previously, call the ScrapBook extension to save the DOM) 
// and a snapshot of the contentWindow.
//
//  This information can be used by PbD to better infer a good interpretation to perform a script step in the current context
//  A CoScript object can be serialized and saved locally by saveCurrentCoScriptLocally in local-save.js

/////////////////////////////////////////////////
//		
//		PerformedStep Command Processor
//			receiveGeneratedCommandForPbD
//			processGeneratedCommandForPbD
//			completeGeneratedCommandForPbD
//			moveScrapBookFolder
//			saveSnapshotsToFile
//			saveDOMToFile
//
//		Interpreting
//
//		Executing
//
////////////////////////////////////////////////

function ScrapBookWritingP(){
    if (coscripter.components.contextRecorder()) {
        var coscripterPrefs = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("coscripter.")
        return coscripterPrefs.prefHasUserValue('ScrapBookWritingP') ? coscripterPrefs.getBoolPref('ScrapBookWritingP') : false
    }
    return false
}

function ScrapBookReadingP(){
    if (coscripter.components.contextRecorder()) {
        var coscripterPrefs = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("coscripter.")
        return coscripterPrefs.prefHasUserValue('ScrapBookReadingP') ? coscripterPrefs.getBoolPref('ScrapBookReadingP') : false
    }
    return false
}


//////////////////////////////////////////////////////
//		PerformedStep Command Processor
//////////////////////////////////////////////////////

//			receiveGeneratedCommandForPbD
// *** This is the CallBack from pbd-command-generator to report each command object it creates from a UIEvent from yule
// It is the PbD analog of receiveRecordedCommand in command-processor.js
function receiveGeneratedCommandForPbD(command){
	// If recording, make a new PerformedStep, insert it in the currentCoScript, 
	//add the command to it, gather and add context information, and present it to the user in the sidebar.
	// If executing, add context information.
	var u = coscripter.components.utils()
	// If this is simply a user action, return.  For now, I am not handling auto-advance (AC)
	if (recording && firstCommandP() && !(command.type == getCommands().ACTIONS.GOTO)) { // If first command is not a goto, 
		// insert a goto command.
		// TL: grab the URL out of the current browser's location bar, not out of the document containing the recordedCommand's target,
		// because it could be a frame in a frameset (bug #75013)
		// AC: This was failing when the ScrapBook is used, so now contextRecorder gets the url before calling ScrapBook
		var gotoCommand = getCommands().createGotoFromParams(command.originalEvent, u.getBrowserDocument(u.getChromeWindowForNode(command.getTarget())).location.href);
		processGeneratedCommandForPbD(gotoCommand)
	}
	processGeneratedCommandForPbD(command)
}

//			processGeneratedCommandForPbD
function processGeneratedCommandForPbD(command){
    //debug("processGeneratedCommandForPbD with command type " + command.type)
	var contextRecorder = coscripter.components.contextRecorder()
	var abstracter = coscripter.components.abstracter()
	
    var performedStep = abstracter.createNewPerformedStep()
    performedStep.command = command
    performedStep.scriptExecutionNumber = currentScriptExecutionNumber
    performedStep.UUID = currentCoScript.getUUID()	// it's convenient for the step to have ready access to the UUID of the CoScript it is in.
    
    currentActionNumber += 1
    performedStep.actionNumber = currentActionNumber
    currentCoScript.getCurrentScriptExecution().performedStepList.push(performedStep)
    
    if (command.type == getCommands().ACTIONS.GOTO) 
        completeGeneratedCommandForPbD(performedStep) // no need to record any context
    else {
		// ** Main routines are here: 
		// 1) addContextInfoToPerformedStep, and then 
		// 2) completeGeneratedCommandForPbD
		if (!ScrapBookWritingP()) {
    		contextRecorder.addContextInfoToPerformedStep(performedStep)
			completeGeneratedCommandForPbD(performedStep)
		} else {
		    // In the contextRecorder component, if ScrapBookWritingP,
		    // addContextInfoToPerformedStep calls callScrapBook, which captures in the background.
		    // When it completes, it calls completeGeneratedCommandForPbD below
			performedStep.callback = function(pStep){completeGeneratedCommandForPbD(pStep)}
		}
	}
}


//			completeGeneratedCommandForPbD
// If ScrapBookWritingP, completeGeneratedCommandForPbD is called as a callback
function completeGeneratedCommandForPbD(performedStep){
    var command = performedStep.command
    if (recording) 
        insertCommand(command) // Insert a textual description of the generated command in a new line in the sidebar editor 
    if (recording) {
        var currentLineNumber = procedureInteractor.getCurrentLineNumber()
        command.editorLineNumber = currentLineNumber
        var newStepId = makeNewStepIdForEditorLine(currentLineNumber)
        performedStep.stepId = newStepId
    }
    // Need to find the stepId of this step in the Script in order to associate this PerformedStep with the correct Script Step.
    // But this event came from yule, and yule has no idea which line in the editor was executed to create this event,
    // or even that the event was caused by CoScripter executing a step, as opposed to it being a user action.
    // For now, I kludge this by having command-processor pass the lineNumber to pbd-command-generator whenever a Script Step is being executed.
    else { //Add a test to see if we are executing, as opposed to this being a user action. (I'm postponing handling auto-advance for the moment)
        // save this event as an instance of use of this step of the script
        try {
            var pbdCommandGenerator = getPbDCommandGenerator()
            var scriptLineNumber = pbdCommandGenerator.getScriptLineNumber()
            if (!scriptLineNumber) scriptLineNumber = 0
            var editorLine = procedureInteractor.getLineWithNumber(scriptLineNumber)
            var stepId = editorLine.getAttribute("stepId")
            if (!stepId) 
                stepId = makeNewStepIdForEditorLine(scriptLineNumber)
            performedStep.stepId = stepId
            newStepId = stepId
        }
        catch (e) {
            debug("context: completeGeneratedCommandForPbD: Error with editorLine: " + e)
        }
    }
    //if (recording && performedStep.context) 
    if (performedStep.context) { //goto has no context
        saveSnapshotsToFile(performedStep.context, performedStep.stepId)
        saveDOMToFile(performedStep.context, performedStep.stepId)
    }
    if (ScrapBookWritingP()) {
        var commandComponent = Components.classes["@coscripter.ibm.com/coscripter-command;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
        if (!(command.type.toString() == commandComponent.ACTIONS.GOTO)) {
            if (!performedStep.context.pageFolder) 
                debug("context: completeGeneratedCommandForPbD: performedStep.context.pageFolder is null")
            else {
                var pageFolder = performedStep.context.pageFolder.clone()
                // Postpone moving the folder, since this step is what causes all of the painful timing problems (AC)
                moveScrapBookFolder(pageFolder, newStepId)
            }
        }
    }
} // end of processGeneratedCommandForPbD

    /*
        // Track user actions and advance cursor if necessary
        if (sameCommandP(command, CommandProcessor.currentCommand)) {
             recordedCommand.editorLineNumber = CommandProcessor.currentCommand.editorLineNumber
             debug("receiveGeneratedCommandForPbD user action saveExecution for line " + recordedCommand.editorLineNumber + " for command " + recordedCommand.action)
             saveExecutionContext(recordedCommand)
            // Highlight this step
            u.highlightThenDo(procedureInteractor.getCurrentLine(), function(){
                // Advance to the next step, entering nested blocks
                CommandProcessor.advanceStep(false);
            });
            // CommandProcessor.advanceStep(false);
        }
    */

function skipCommandForPbD(command){	//not used
    // Do not record chrome commands
    if (command.getTargetArea() == "chrome" && command.getAction() != getCommands().ACTIONS.GOTO) 
        return true
    if (command.getTargetLabel() == "tab-close-button" || command.getTargetLabel() == "CoScripter") 
        return true
    // Do not record sidebar commands
    if (command.getTargetArea() == "coscripterSidebar") 
        return true
     // Do not record error console commands
     if ( command.windowDescriptor == "Error Console") return true
     // Do not record debugger commands
     if ( command.windowDescriptor == "JavaScript Debugger") return true
    // Do not skip anything else
    return false
}

//			moveScrapBookFolder
function moveScrapBookFolder(sbPageFolder, stepId){
    if (!sbPageFolder) {
        debug("command-processor's moveScrapBookFolder has no sbPageFolder")
        return;
    }
	var u = components.utils()
    // move the scrapbook folder for this DOM into the CoScripter folder
    var currentScriptExecutionFolder = coscripterPageDataFolder.clone()
    currentScriptExecutionFolder.append("coscript" + currentCoScript.getUUID())
    currentScriptExecutionFolder.append("scriptExecution" + u.threeDigit(currentScriptExecutionNumber))
    if (!currentScriptExecutionFolder.exists()) currentScriptExecutionFolder.create(CI.nsIFile.DIRECTORY_TYPE, 0755)
    
    var sbDataFolder = sbPageFolder.parent // get the pointer before moving sbPageFolder
    var sbPageFolderName = sbPageFolder.leafName
    
    try {
		var actionFolder = currentScriptExecutionFolder.clone()
		actionFolder.append("Action" + u.threeDigit(currentActionNumber))
		if (!actionFolder.exists()) sbPageFolder.moveTo(currentScriptExecutionFolder, "Action" + u.threeDigit(currentActionNumber))	// params are parentDir and Name
		else {
			var versionNumber = 0
			do {
				versionNumber++
				actionFolder = currentScriptExecutionFolder.clone()
				actionFolder.append("Action" + u.threeDigit(currentActionNumber) + "-" + u.threeDigit(versionNumber))
			} while (!actionFolder.exists())
			sbPageFolder.moveTo(currentScriptExecutionFolder, "Action" + u.threeDigit(currentActionNumber) + "-" + u.threeDigit(versionNumber))
		}
    } 
    catch (e) {
        debug('moveTo error in moveScrapBookFolder: ' + e)
    }
    try {
        // create a replacement dummy folder in the scrapbook data folder so that ScrapBook won't crash
        var sbDummyFolder = sbDataFolder.clone()
        sbDummyFolder.append(sbPageFolderName)
        if (sbDummyFolder.exists()) 
            return;
        sbDummyFolder.create(CI.nsIFile.DIRECTORY_TYPE, 0755)
        // add dummy index.html and favicon files
        var contentDir = getCoScripterExtensionContentFolder()
        var dummyIndexFile = contentDir.clone()
        dummyIndexFile.append("sbRemoved.html")
        dummyIndexFile.copyTo(sbDummyFolder, "index.html")
        var dummyFaviconFile = contentDir.clone()
        dummyFaviconFile.append("coscripter-favicon.ico")
        dummyFaviconFile.copyTo(sbDummyFolder, "favicon.ico")
    } 
    catch (e) {
        debug('creation of sb dummy folder error in moveScrapBookFolder: ' + e)
    }
}

//			saveSnapshotsToFile
function saveSnapshotsToFile(context, stepId){
	var u = components.utils()
    var currentScriptExecutionFolder = coscripterPageDataFolder.clone()
    currentScriptExecutionFolder.append("coscript" + currentCoScript.getUUID())
    currentScriptExecutionFolder.append("scriptExecution" + u.threeDigit(currentScriptExecutionNumber))
    if (!currentScriptExecutionFolder.exists()) currentScriptExecutionFolder.create(CI.nsIFile.DIRECTORY_TYPE, 0755)

    try {
		/*
		var snapshotSmallNoHighlightFile = currentScriptExecutionFolder.clone()
	    snapshotSmallNoHighlightFile.append("Action" + u.threeDigit(stepId) + "snapshotSmallNoHighlight.png")
		if (!snapshotSmallNoHighlightFile.exists()) u.saveImageToFile(context.snapshotSmallNoHighlight, snapshotSmallNoHighlightFile, true)
		*/
				
		var snapshotSmallFile = currentScriptExecutionFolder.clone()
	    snapshotSmallFile.append("Action" + u.threeDigit(stepId) + "snapshotSmall.png")
		if (!snapshotSmallFile.exists()) u.saveImageToFile(context.snapshotSmall, snapshotSmallFile, true)

		var snapshotFullFile = currentScriptExecutionFolder.clone()
	    snapshotFullFile.append("Action" + u.threeDigit(stepId) + "snapshotFull.png")
		if (!snapshotFullFile.exists()) u.saveImageToFile(context.snapshotFull, snapshotFullFile, true)		
    } 
    catch (e) { debug('saveSnapshotToFile error: ' + e) }
}

//			saveDOMToFile
function saveDOMToFile(context, stepId){
	var u = components.utils()
    var currentScriptExecutionFolder = coscripterPageDataFolder.clone()
    currentScriptExecutionFolder.append("coscript" + currentCoScript.getUUID())
    currentScriptExecutionFolder.append("scriptExecution" + u.threeDigit(currentScriptExecutionNumber))
    if (!currentScriptExecutionFolder.exists()) currentScriptExecutionFolder.create(CI.nsIFile.DIRECTORY_TYPE, 0755)

    try {
		var domFile = currentScriptExecutionFolder.clone()
	    domFile.append("Action" + u.threeDigit(stepId) + ".html")
		if (!domFile.exists()) u.saveString(domFile, context.DOM)		
    } 
    catch (e) { debug('saveDOMToFile error: ' + e) }
}

function getCoScripterExtensionContentFolder(){
    const coscripterId = "{353396a4-6910-4b95-9ec8-37978867618b}"
    var extMgr = CC["@mozilla.org/extensions/manager;1"].getService(CI.nsIExtensionManager)
    var ext = extMgr.getInstallLocation(coscripterId)
    var contentDir = ext.getItemLocation(coscripterId)
    contentDir.append("chrome")
    contentDir.append("coscripter")
    contentDir.append("content")
    return contentDir
}


//////////////////////////////////////////////////////
//
//		Interpreting
//
//////////////////////////////////////////////////////





//////////////////////////////////////////////////////
//
//		Executing
//
//////////////////////////////////////////////////////




