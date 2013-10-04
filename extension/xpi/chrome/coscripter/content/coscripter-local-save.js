/*
 This Program contains software licensed pursuant to the following :
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
var components = registry;
// Debug method for all files loaded into the sidebar is defined in sidebar.js
// The files coscripter-sidebar.js, coscripter-command-processor.js, coscripter-context.js, coscripter-local-save.js, 
//		coscripter-editor-richtextbox.js, coscripter-dom-utils.js
//		and coscripter-scratch-space-sidebar.js
// are all loaded into the sidebar coscripterWindow by coscripter-siderbar.xul. 

///////////////////////////////////////////////////
//////////////  coscripter-local-save.js  ///////////////
///////////////////////////////////////////////// 
// This file contains routines for loading and saving local files containing CoScripts and procedures
// A CoScript object is created which contains a script (aka a CoScripter Procedure object)
// If contextP() is true, additional contextual information is included about the recording and subsequent executions of the procedure
///////////////////////////////////////////////// 
//
//		Local Save
//			saveCurrentCoScriptLocally
//			deleteLocalProcedure
//
//		Local Load
//			loadLocalProcedure
//			getCurrentCoScriptForCurrentProcedure
//			addStepIdsToLines
//
//		Local Display
//			displayLocalScriptList
//
//		ScratchSpaces
//			loadSpaceLocally
//
//		UUID
//		CoScript Object
////////////////////////////////////////////////

//////////////////////////////////////////////////////
//
//		Local Save
//
//////////////////////////////////////////////////////
//			saveCurrentCoScriptLocally
function saveCurrentCoScriptLocally(){
	if (!currentProcedure || !currentCoScript) return;
	var u = components.utils()
	if (!currentCoScript.getUUID()) debug("saveCurrentCoScriptLocally: currentCoScript has no UUID")
	var uuid = currentCoScript.getUUID()
	//debug("saveCurrentCoScriptLocally. UUID is " + currentCoScript.getUUID())
	//ToDo: delete any unused scrapbook files if a script is unloaded and not saved
	
	// Populate the currentCoScript object prior to saving it to file
	currentCoScript.procedure = currentProcedure
	//debug("contextP is " + contextP())
	//if (contextP()) fillInStepList()	// reinstate this once JSON.stringify is working
	
	var title = currentProcedure.scriptjson.title
	if (!title) title = "no title"
	//var titleJSON = nativeJSON.encode(title)
	
	// Save to file
	var coScriptJSON = ""
	try {
		//debug("saveCurrentCoScriptLocally: " + uuid.slice(uuid.length-4, uuid.length))
		cleanCurrentCoScriptForLocalSave()
		// Use JSON.stringify instead of nativeJSON.encode once FFox's the filter bug is fixed: 
		// https://bugzilla.mozilla.org/show_bug.cgi?id=509184
		coScriptJSON = JSON.stringify(currentCoScript, filterOutFunctionsAndComponentsProperty)
		//coScriptJSON = nativeJSON.encode(currentCoScript)
	} catch (e) {
		debug("local-save: saveCurrentCoScriptLocally: Error encoding currentCoScript: " + e)
	}
	
	var coScriptFile = coScriptFolder.clone()
	coScriptFile.append("coscript" + currentCoScript.getUUID())
	fScriptStream.init(coScriptFile, 0x02 | 0x08 | 0x20, 0664, 0)
	fScriptStream.write(title, title.length)
	fScriptStream.write(coScriptJSON, coScriptJSON.length)
	fScriptStream.close()
	//debug("saveCurrentCoScriptLocally: done")
	
	// If the procedure has an id (ie it has been saved on koalescence)
	//add this coscript to the idUuidPairs file
	var id = currentProcedure.getId()
	if (id && uuid) {
		//debug("saveCurrentCoScriptLocally: adding id and uuid to pairs list: " + id + ", " + uuid)
		addIdUuidPair(id, uuid)
	}
}	// end of saveCurrentCoScriptLocally

function filterOutFunctionsAndComponentsProperty(key, value) {  
	if (key == "components") {  
		return undefined;  
	}  
	if (typeof(value) == "function") {  
		return undefined;  
	}  
	return value;
}

function fillInStepList(){
    var stepList = currentCoScript.stepList
    var lines = procedureInteractor.getLines()
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var stepId = line.getAttribute("stepId")
        if (stepId) stepList[i] = stepId
    }
}

// JSON can't handle methods, so I need to strip them out 
//-- in particular, all of the "component" properties that are scattered throughout CoScripter objects
// The new JSON method in FFox has a way to specify a filter function, but it currently has a bug so I can't use it.
function cleanCurrentCoScriptForLocalSave(){
	//debug("cleanCurrentCoScriptForLocalSave")
	var numberOfExecutions = 0;/*currentCoScript.scriptExecutions.length*/
	// CD 6/28/2010 currentCoScript.scriptExecutions is as far as I can tell always null
	if( currentCoScript.scriptExecutions != null ){
		numberOfExecutions = currentCoScript.scriptExecutions.length
	}
	for (var executionNumber=0; executionNumber<numberOfExecutions; executionNumber++) {
		var psl = currentCoScript.scriptExecutions[executionNumber].performedStepList
		for (var i=0; i<psl.length; i++) {
			var ps = psl[i]
			ps.command = null
			/* Seems that I don't need to save the command object
			if (ps.command) {
				ps.command.components = null
				if (ps.command.loc) ps.command.loc.components = null
				if (ps.command.string) {
					ps.command.string.components = null
					if (ps.command.string.targetLabel) ps.command.string.targetLabel.components = null
				}
				if (ps.command.targetSpec) {
					ps.command.targetSpec.components = null
					if (ps.command.targetSpec.targetLabel) ps.command.targetSpec.targetLabel.components = null
				}
				ps.command.originalEvent = null
			}
			*/
			if (ps.context) {
				ps.context.pageFolder = null
				// snapshots have already been saved locally
				ps.context.snapshotSmallNoHighlight = null
				ps.context.snapshotSmall = null
				ps.context.snapshotFull = null
			}
		}
	}
}

// JSON encode breaks on some instances of currentCoScript.scriptExecutions[*].performedStepList[*].command.originalEvent.target.parentNode)
// So I'm stripping out originalEvent.target.parentNode and originalEvent.target.ownerDocument.
// In fact, I doubt that I will need any of this in the future, so I'm stripping out the entire originalEvent for now (AC)
// But this might break, since you can save and continue using the coScript.
function cleanCurrentCoScriptForLocalSavePreviousVersion(){
	//debug("cleanCurrentCoScriptForLocalSave")
	var scriptExecution = {}
	
	if (!currentCoScript.scriptExecutions && !currentCoScript.currentInstantiation) return;	// localP and !contextP
	
	for (var i = 0; i < currentCoScript.scriptExecutions.length; i++) {
		scriptExecution = currentCoScript.scriptExecutions[i]
		cleanScriptExecution(scriptExecution)
	}
	
	if (currentCoScript.currentInstantiation) {
		scriptExecution = currentCoScript.currentInstantiation
		cleanScriptExecution(scriptExecution)
	}
	debug("starting removeComponentObjects in cleanCurrentCoScriptForLocalSave")
	removeComponentObjects(currentCoScript)
	debug("finished removeComponentObjects in cleanCurrentCoScriptForLocalSave")
	
	function cleanScriptExecution(scriptExecution){
		for (var j=0; j<scriptExecution.performedStepList.length; j++) {
			var performedStep = scriptExecution.performedStepList[j]
			//if (performedStep.command) performedStep.command = null
			if (performedStep.command) performedStep.command.originalEvent = null
			// Also strip out the snapshot object, because it's a big canvasElement complete with containing document (the CoS sidebar)
			if (performedStep.context && performedStep.context.snapshotSmallNoHighlight) performedStep.context.snapshotSmallNoHighlight = null
			if (performedStep.context && performedStep.context.snapshotSmall) performedStep.context.snapshotSmall = null
			if (performedStep.context && performedStep.context.snapshotFull) performedStep.context.snapshotFull = null
		}	
	}	// end of cleanScriptExecution, inside cleanCurrentCoScriptForLocalSave
	
	// Many objects in this project have a "components" property, created by the Registry component
	// It can't be saved as JSON, since methods are disallowed in JSON
	// Once I eventually track down all of the places where it appears, I can explicitly remove them in cleanScriptExecution and
	//avoid all of this checking and recursion. (AC)
	function removeComponentObjects(anObject){
		debug("entering removeComponentObjects. ")
		var prop
		var propList = []
		var aProp = null
		var val = ""
		var propListLength = 0
		if (typeof anObject == "object") {
			if (anObject.components) {
				anObject.components = null
			}
			for (prop in anObject) {
				propList.push(prop)
			}
			propListLength = propList.length
			for (k=0; k<propListLength; k++) {
				aProp = propList[k]
				if ((!aProp) || (typeof aProp != "string")) {
					continue;
				}
				if (aProp && (typeof aProp == "string") && (aProp == "components"))  {
					continue;
				}
				val = anObject[aProp]
				if ((typeof val == "object") && (val != null)) {
					removeComponentObjects(val)
				}
			}
		}
		debug("leaving removeComponentObjects.")
	}	// end of removeComponentObjects, inside cleanCurrentCoScriptForLocalSave
	
}	// end of cleanCurrentCoScriptForLocalSave
	
//unused
function getEditorLineNumberFromStepId(stepId){
    var lines = procedureInteractor.getLines()
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var lineStepId = line.getAttribute("stepId")
        if (lineStepId == stepId) return i
    }
	return -1
}


//			deleteLocalProcedure
// Called by clicking the red X icon for a line in the Welcome page's local script list
function deleteLocalProcedure(uuid){
	//debug("deleteLocalProcedure called with uuid " + uuid)
	var localScriptFile = getLocalScriptFile(uuid)
	if (localScriptFile.exists()) localScriptFile.remove(false);
	var dataFolder = getCoScriptDataFolder(uuid)
	if (dataFolder && dataFolder.exists()) dataFolder.remove(true);

	/*
    // If the procedure has an id (ie it has been saved on koalescence)
	//remove the entry in the idUuidPairs file
	// todo
	var pair = null
	for (pair in idUuidPairs) {
		var uuid = pair
	}
	*/
	
	loadWelcomePage(true)
}



//////////////////////////////////////////////////////
//
//		Local Load
//
//////////////////////////////////////////////////////
////////////////////
// Load a procedure from the local saved CoScript
////////////////////
//			loadLocalProcedure
// Called by clicking on the Load or Run icon for a line in the Welcome page's local script list
function loadLocalProcedure(uuid, runP){
	//debug("loadLocalProcedure called with uuid " + uuid)
	var scriptFile = getLocalScriptFile(uuid)
	var procedureJson = getCoScriptFileProcedure(scriptFile)

	initScriptMode();
	// This is convoluted so we can use loadProcedureData on a local script.
	// It calls getCurrentCoScriptForCurrentProcedure, which needs the uuid  
	loadProcedureData(procedureJson,runP, null, uuid)
}

function getLocalScriptFile(uuid){
	var localScriptFile = coScriptFolder.clone()
	localScriptFile.append("coscript" + uuid);
	/*
	if (!localScriptFile.exists() || localScriptFile.isDirectory()) 
		debug("getLocalScriptText: localScriptFile doesn't exist")
	*/
	localScriptFile.QueryInterface(CI.nsIFile)
	return localScriptFile
}

function getCoScriptDataFolder(uuid){
	var coScriptDataFolder = coscripterPageDataFolder.clone()
	coScriptDataFolder.append("coscript" + uuid);
	if (!coScriptDataFolder.exists() || !coScriptDataFolder.isDirectory()) return null
	coScriptDataFolder.QueryInterface(CI.nsIFile)
	return coScriptDataFolder
}

// Get the actual textual instruction steps for this CoScript's procedure
function getCoScriptFileProcedure(iFile){
	var data = ""
	var fstream = CC["@mozilla.org/network/file-input-stream;1"]
							.createInstance(CI.nsIFileInputStream)
	var sstream = CC["@mozilla.org/scriptableinputstream;1"]
							.createInstance(CI.nsIScriptableInputStream)
	fstream.init(iFile, -1, 0, 0)
	sstream.init(fstream)
	var str = sstream.read(4096)
	while (str.length > 0) {
		data += str
		str = sstream.read(4096)
	}
	sstream.close()
	fstream.close()

    try {	
		var titleEndIndex = data.indexOf("{")
		var data = data.substring(titleEndIndex)
		var coscripterObject = JSON.parse(data)
		var procedureObject = coscripterObject.procedure
		var procedureScript = procedureObject.scriptjson
		//var procedureBody = procedureScript.body
		//var procedureBodyHtml = procedureScript.body-html
		var procedureScriptJson = JSON.stringify(procedureScript)
    }
    catch (e) {
        debug("local-save: getCoScriptFileProcedure: Error converting JSON: " + e)
    }
	return procedureScriptJson
}


//			getCurrentCoScriptForCurrentProcedure
// Only called if contextP or localP is true. Creates the currentCoScript object that corresponds to the currentProcedure.
// Called by onNew() without a uuid (and no id). 
// Called by loadProcedureData, which is called 1) by loadLocalProcedure (which passes in the uuid) and
//  2) when a procedure is loaded from koalescence (possibly with a uuid).
// When we are saving to koalescence, onNew creates a new procedure that does not have an id.  The id only gets assigned when the procedure is saved, by saveProcedureToWiki
// This means that currentProcedure may or may not have an id.
function getCurrentCoScriptForCurrentProcedure(uuid){
    var u = components.utils()
	if (contextP()) currentCoScript = coscripter.components.abstracter().createNewCoScript()
	else currentCoScript = new CoScript

	if (uuid) {	// it's a local script, and the user clicked on its name in the sidebar's welcome page.
				//or, contextP is true and we are collecting context information
		currentCoScript.setUUID(uuid)
		loadLocalCoScriptData(uuid)
	}
	
	var id = currentProcedure.getId()	// you don't need an id until a Save is done, and the script came from the wiki or is going to the wiki
	//debug("getCurrentCoScriptForCurrentProcedure: called with id = "  + id + ", and uuid = " + uuid)

	if (!id && !uuid) {	// new script
		uuid = u.generateUUID()
		currentCoScript.setUUID(uuid)
		if (contextP()) {
			currentScriptExecutionNumber = 1;
			currentCoScript.setLargestScriptExecutionNumber(currentScriptExecutionNumber)
			currentCoScript.createNewScriptExecution()
		}
	}

	if (id && !uuid) {	// it was loaded from the wiki. Check whether we already have a corresponding uuid
		uuid = getUuidFromId(id)
		if (!uuid) {	// Create a new uuid in case we need it to create Context objects. 
						//  If we ever Save this script, then add this new uuid to idUuidPairs
			uuid = u.generateUUID()
			currentCoScript.setUUID(uuid)
			//idUuidPairs[id] = uuid
			//saveIdUuidPairs()
		}
		else {	// it was loaded previously. Read in the saved info.
			currentCoScript.setUUID(uuid)
			loadLocalCoScriptData(uuid)
		}
	}
	
	if (contextP() && id && uuid) {	// contextP will always save context info locally, so it's important to record any id/uuid pairing
		//debug("getCurrentCoScriptForCurrentProcedure: adding id and uuid to pairs list: " + id + ", " + uuid)
		addIdUuidPair(id, uuid)
	}
}	//	end of getCurrentCoScriptForCurrentProcedure

function loadLocalCoScriptData(uuid){
	// return;	// Had to remove this when JSON.stringify was failing
    //debug("loadLocalCoScriptData")
    var u = components.utils()
    var coScriptFile = getCoScriptFile(uuid)
    var data = u.readFile(coScriptFile)
    // strip out the initial title
    var jsonStartIndex = data.indexOf("{")
	if (jsonStartIndex == -1) jsonStartIndex = data.length
    var title = data.substring(0, jsonStartIndex)
    //debug("loadLocalCoScriptData: title is '" + title + "'")
    data = data.substring(jsonStartIndex)
    try {
        if (data.length != 0) {
            var dataObject = JSON.parse(data)
            for (var property in dataObject) {
                //if (u.inArrayP(property, ['target', 'targetWindow', 'mainChromeWindow'])) continue
                currentCoScript[property] = dataObject[property]
            }
        }
    }
    catch (e) {
        debug("local-save: loadLocalCoScriptData: Error decoding CoScriptFile: " + e)
    }
    if (contextP()) {
    	var largestScriptExecutionNumber = getLargestScriptExecutionNumberFromFileNumbers(uuid) // Since I'm having trouble writing out the file, get this important value explicitly
		currentCoScript.setLargestScriptExecutionNumber(largestScriptExecutionNumber)
	}
}

// Look at the local CoScripts folder and find the largest number of the scriptExecution folders for this script 
function getLargestScriptExecutionNumberFromFileNumbers(uuid){
	if (!uuid) return 0
	var u = components.utils()
	var largestFileNumber = 0
	var scriptPageDataFolder = coscripterPageDataFolder.clone()
	scriptPageDataFolder.append("coscript" + uuid)
    if (!scriptPageDataFolder.exists()) return 0
    do {
		largestFileNumber++
		var scriptExecutionFolder = scriptPageDataFolder.clone()
		scriptExecutionFolder.append("scriptExecution" + u.threeDigit(largestFileNumber))
		} while (scriptExecutionFolder.exists())
		return largestFileNumber - 1
}

function getCoScriptFile(uuid){
    var coScriptFile = coScriptFolder.clone()
    coScriptFile.append("coscript" + uuid)
    if (!coScriptFile.exists()) {
        //debug("context getCoScriptFile: coScriptFile doesn't exist")
        return false
    }
    else 
        return coScriptFile
}

// Each line in the Editor has a stepId which stays the same 
//even if the user edits the script and its line number changes.
// Called by loadProcedureData in sidebar
// Once uuids are used on koalescence, the stepList metadata will be stored there as well.
// In the meantime, we're ruined whenever another user changes a procedure on the server.
//			addStepIdsToLines
function addStepIdsToLines(){
    var stepList = currentCoScript.stepList
    for (var step in stepList) {
        if (isNaN(Number(step))) 
            continue;
        var editorLine = procedureInteractor.getLineWithNumber(step)
        if (editorLine) 
            editorLine.setAttribute("stepId", stepList[step])
    }
    // Create stepIds for any lines that don't yet have them (eg the first time a procedure is loaded)
    for (var i = 0; i < procedureInteractor.getLineCount(); i++) {
        editorLine = procedureInteractor.getLineWithNumber(i)
        var stepId = editorLine.getAttribute("stepId")
        if (!stepId) 
            makeNewStepIdForEditorLine(i)
    }
}

// Called by addStepIdsToLines above, which is called by loadProcedureData in sidebar when contextP is true
// Also called by completeGeneratedCommandForPbD in context.js
function makeNewStepIdForEditorLine(lineNumber){
    var newStepId = currentCoScript.largestStepId + 1
    currentCoScript.largestStepId = newStepId
    var editorLine = procedureInteractor.getLineWithNumber(lineNumber)
    editorLine.setAttribute("stepId", newStepId)
    return newStepId
}


//////////////////////////////////////////////////////
//		Local Display
//////////////////////////////////////////////////////

////////////////////
// Display a list of the local procedures in the Welcome Page
////////////////////
//			displayLocalScriptList
function displayLocalScriptList(welcomePage){
	//debug("displayLocalScriptList")
	var doc = welcomePage.contentDocument
	var divForTableElement = doc.getElementById("mineDiv")
	var scriptTableElement = doc.getElementById("mylocalscripts")
	//scriptTableElement.innerHTML = null
	var newTableElement = doc.createElement('table')
	newTableElement.setAttribute('width', "100%")
	
	getLocalScriptTitles()
	var li = null
	for (uuid in uuidTitlePairs) {
		var title = uuidTitlePairs[uuid]
		title = title.substring(0,40)
		//debug("uuidTitlePair is " + uuid + "|" + title)
		var row = doc.createElement("tr")
		row.innerHTML = "<td>" + title + "</td><td><img src='chrome://coscripter/skin/images/open-in-sidebar.gif' onclick='loadLocalScript(\"" + uuid + "\")'/><img src='chrome://coscripter/skin/images/run-in-sidebar.gif' onclick='loadLocalScript(\"" + uuid + "\", true)'/><img src='chrome://coscripter/skin/images/blank.png'/><img src='chrome://coscripter/skin/images/delete.png' width='12' height='12' style='vertical-align:30%' onclick='deleteLocalScript(\"" + uuid + "\")'/></td>"
		newTableElement.appendChild(row)
	}
	divForTableElement.replaceChild(newTableElement, scriptTableElement)
	newTableElement.setAttribute('id', "mylocalscripts")
	// sometimes the cursor remains as a wait cursor
	var welcomeBodyElement = doc.getElementById("welcomePageBody")
	welcomeBodyElement.style.cursor = 'default'
}

// sets the global uuidTitlePairs
function getLocalScriptTitles(){
	//debug("getLocalScriptTitles")
	var localScriptFiles = coScriptFolder.directoryEntries
	var file
	uuidTitlePairs = {}
	while (file = localScriptFiles.getNext()) {
		file.QueryInterface(CI.nsIFile)
		var fileName = file.leafName
		//debug("getLocalScriptTitles fileName is " + fileName)
		if (fileName && fileName.substring(0, 8) == "coscript") {
			var fileUUID = fileName.substring(8)
			fileTitle = getCoScriptFileTitle(file)
			if (fileTitle) uuidTitlePairs[fileUUID] = fileTitle
		}
    }
}

// Read Title from the contents of the file
// However, if the contents show that the user never explicitly saved this script,
//return false so that this entry won't be included in the list of Local Scripts displayed on the welcome page
function getCoScriptFileTitle(iFile){
	var fstream = CC["@mozilla.org/network/file-input-stream;1"]
							.createInstance(CI.nsIFileInputStream)
	var sstream = CC["@mozilla.org/scriptableinputstream;1"]
							.createInstance(CI.nsIScriptableInputStream)
	fstream.init(iFile, -1, 0, 0)
	sstream.init(fstream)
	var str = sstream.read(200)
	sstream.close()
	fstream.close()
	
	var savedPVal = null
	var savedPStartIndex = str.indexOf('savedP')
	if(savedPStartIndex != -1) savedPVal = str.substring(savedPStartIndex+8, savedPStartIndex+13)
	//debug("getCoScriptFileTitle has savedPVal of " + savedPVal)
	if(savedPVal == "false") return null
	
	var titleEndIndex = str.indexOf("{")
	var title = str.substring(0, titleEndIndex)
	return title
}


//////////////////////////////////////////////////////
//		ScratchSpaces
//////////////////////////////////////////////////////
//			displayLocalScratchSpaceList
function displayLocalScratchSpaceList(openSSFunction){
	//debug("displayLocalScratchSpaceList")
	var u = components.utils()
	var scratchSpaceList = document.getElementById("scratchspaces");
	scratchSpaceList.setAttribute("style", "");
	// Remove the "Loading..." item from the listbox
	while (scratchSpaceList.firstChild) {
		scratchSpaceList.removeChild(scratchSpaceList.firstChild);
	}
	var spaces = getLocalScratchSpaces()
	if (spaces == null) {
		var listItem = document.createElement("listitem");
		listItem.setAttribute("label", "Cannot load local scratchSpaces");
		scratchSpaceList.appendChild(listItem);
		scratchSpaceList.disabled = true;
		return;
	}
	
	for (var i = 0, n = spaces.length; i < n; i++) {
		var spaceInfo = spaces[i];
		var listItem = document.createElement("listitem");
		listItem.setAttribute("label", spaceInfo.title);
		listItem.setAttribute("value", spaceInfo.id);
		listItem.setAttribute("tooltiptext", spaceInfo.description);
		listItem.addEventListener("dblclick", openSSFunction, true)
		scratchSpaceList.appendChild(listItem);
	}
}

function getLocalScratchSpaces(){
	var spaces = []
	var localScratchSpaceFiles = scratchSpaceFolder.directoryEntries
	var file
	while (file = localScratchSpaceFiles.getNext()) {
		file.QueryInterface(CI.nsIFile)
		var fileName = file.leafName
		//debug("getLocalScriptTitles fileName is " + fileName)
		if (fileName && fileName.substring(0, 12) == "scratchSpace") {
			var fileUUID = fileName.substring(12)
			fileTitle = getLocalScratchSpaceFileTitle(file)
			var fileInfo = {description : "",
							id : fileUUID,
							title : fileTitle
							}
			spaces.push(fileInfo)
		}
    }
	return spaces
}

function getLocalScratchSpaceFile(uuid){
    var scratchSpaceFile = scratchSpaceFolder.clone()
    scratchSpaceFile.append("scratchSpace" + uuid)
    if (!scratchSpaceFile.exists()) {
        //debug("local-save: getLocalScratchSpaceFile: scratchSpaceFile doesn't exist")
        return false
    }
    else 
        return scratchSpaceFile
}

function getLocalScratchSpaceFileTitle(iFile){
	var fstream = CC["@mozilla.org/network/file-input-stream;1"]
							.createInstance(CI.nsIFileInputStream)
	var sstream = CC["@mozilla.org/scriptableinputstream;1"]
							.createInstance(CI.nsIScriptableInputStream)
	fstream.init(iFile, -1, 0, 0)
	sstream.init(fstream)
	var str = sstream.read(200)
	sstream.close()
	fstream.close()
	
	var titleEndIndex = str.indexOf("{")
	var title = str.substring(0, titleEndIndex)
	return title
}

//			loadSpaceLocally
// saveSpaceLocally is defined in the coscripter-scratch-space.js module
function loadSpaceLocally(scratchSpaceId){
    //debug("loadSpaceLocally")
    var u = components.utils()
    var scratchSpaceFile = getLocalScratchSpaceFile(scratchSpaceId)
    var data = u.readFile(scratchSpaceFile)
    // strip out the initial title
    var jsonStartIndex = data.indexOf("{")
	if (jsonStartIndex == -1) jsonStartIndex = data.length
    var title = data.substring(0, jsonStartIndex)
    //debug("loadSpaceLocally: title is '" + title + "'")
    data = data.substring(jsonStartIndex)
    try {
        if (data.length != 0) {
			var scratchSpaceData = JSON.parse(data)
			scratchSpaceData.tables = []
			var tables = JSON.parse(scratchSpaceData.tablesJson)
			for (var i = 0, n = tables.length; i < n; i++) {
				var table = tables[i];
				table.data = JSON.parse(table.dataJson);
				table.metaData = JSON.parse(table.metaDataJson);
				table.extractionElementsByUrl = table.extractionElementsByUrlJson ? JSON.parse(table.extractionElementsByUrlJson) : [];
				scratchSpaceData.tables.push(table)
			}
			var scratchSpace = ScratchSpaceUtils.createScratchSpace(scratchSpaceData);
			//scratchSpaceList.setAttribute("style", "");
			if (scratchSpace == null) {
				alert("Cannot load scratch space " + spaceItem.label + " from the server.");
			}
			else {
				window.top.coscripter.scratchSpaceUI.open(scratchSpace);
			}
        }
    }
    catch (e) {
        debug("local-save: loadSpaceLocally: Error decoding CoScriptFile: " + e)
    }
}


function deleteSpaceLocally(scratchSpaceId){
    var u = components.utils()
    var scratchSpaceFile = getLocalScratchSpaceFile(scratchSpaceId)
	if (!scratchSpaceFile) return false;
	scratchSpaceFile.remove(false)
	return true;
}



//////////////////////////////////////////////////////
//		UUID
//////////////////////////////////////////////////////

// When a procedure is loaded from Koalescence, there is metadata for its procedure id, 
//but not for the corresponding coScript's UUID. 
// There is a local 'idUuidPairs" file which lists the corresponding UUID for any procedure which has been previously loaded (or created) locally
function getUuidFromId(id){
	var u = components.utils()
    // Read in the idUuidPairs
	//debug("getUuidFromId:")
    var data = u.readFile(idUuidPairsFile)
	if (!data) return null
    idUuidPairs = JSON.parse(data)	// This is a global
    //debug("getUuidFromId: read in the uuid pairs file. Got " + idUuidPairs)
    // If the currentProcedure's id is in idUuidPairs, 
    //return the corresponding coScript UUID
    var uuid = idUuidPairs[id]
    return uuid
}

function addIdUuidPair(id, uuid){
	if (!id || !uuid) return;
	var u = components.utils()
	var idUuidPairs = {}
	
    // Read in the idUuidPairs file
	var data = u.readFile(idUuidPairsFile)
	//if (u.emptyObjectP(idUuidPairs)) debug("addIdUuidPair: idUuidPairs global object is empty")
	if (!data) {
		idUuidPairs[id] = uuid
		_saveIdUuidPairs(idUuidPairs)
	}
    else {
		idUuidPairs = JSON.parse(data)
		if (!idUuidPairs[id] || idUuidPairs[id] != uuid) {
	        idUuidPairs[id] = uuid
			_saveIdUuidPairs(idUuidPairs)
		}
    }
}

// _saveIdUuidPairs is a private method.  Use getPair (ie getUuidFromId) and setPair (ie addIdUuidPair).
function _saveIdUuidPairs(idUuidPairs){
    //save the procedure Id and coScript UUID  pairs to the local file	
	//debug("saveIdUuidPairs")
	if (!idUuidPairs) return;
	var u = components.utils()
    var idUuidPairsJSON = ""
	try {
		idUuidPairsJSON = JSON.stringify(idUuidPairs)	// For FFox 3.5+
		//debug("local-save: saveIdUuidPairs: idUuidPairsJSON is " + idUuidPairsJSON)
	} catch (e) {
		debug("local-save: saveIdUuidPairs: Error encoding idUuidPairs: " + e)
	}	  
	if (u.emptyObjectP(idUuidPairs)) {
		debug("local-save: saveIdUuidPairs: creating a new, empty idUuidPairsFile file")
	}
	else if (idUuidPairsJSON && idUuidPairsJSON.length < 38) {
		debug("local-save: saveIdUuidPairs: ERROR: about to trash the idUuidPairsFile file")
		return;
	}
	try {
	    fScriptStream.init(idUuidPairsFile, 0x02 | 0x08 | 0x20, 0664, 0)
	    fScriptStream.write(idUuidPairsJSON, idUuidPairsJSON.length)
	    fScriptStream.close()
	} catch (e) {
		debug("local-save: saveIdUuidPairs: Error writing idUuidPairs file: " + e)
	}	  
}


////////////////////////
//		CoScript Object
//**** NOTE: ****  THIS OBJECT IS ALSO DEFINED IN THE ABSTRACTER COMPONENT ****
//This version is used if contextP() is false
//That version is used if contextP() is true
//
/////////////////////////////////////////////////
//////////////	CoScript Object ////////////////
///////////////////////////////////////////////
// A CoScript object contains all executions (and recordings) of a script, 
//and a current instantiation created by generalizing the executions and instantiating the generalization in the current context.
// A CoScript is a more extensive object than a Procedure, which only deals with slop.
function CoScript(){
	this.UUID = null
	// When an external script is loaded, we create a CoScript for it, but it shouldn't show up in the list of local scripts until it has been explicitly saved locally
	this.savedP = false	// Has this script ever been saved locally?
	this.procedure = null
}


CoScript.prototype.getUUID = function() {
	return this.UUID
}

CoScript.prototype.setUUID = function(id) {
	this.UUID = id
}
