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
// Debug method for all files loaded into the sidebar is defined in sidebar.js
//debug('parsing coscripter-command-processor.js')

// coscripter-testsidebar.js, coscripter-sidebar.js, coscripter-command-processor.js, coscripter-context.js, 
// coscripter-editor-richtextbox.js, and coscripter-dom-utils.js 
//are all loaded into the sidebar coscripterWindow by coscripter-testsidebar.xul. 

///////////////////////////////////////////////// 
//    This file runs tests of individual commands that are loaded into the testsidebar
///////////////////////////////////////////////// 
//		
//	onVerifyTestCase
//	verifyCaseN
//	loadTestPageAndVerify
//
//	verify.
//	checkForMatchingTargets
//	receiveRecordedCommand
//	checkForMatchingSlop
//	reportStatus
//
//	Test Cases
//		loadTestcasesFromServer
//		displayTestCase
//		updateTestcase
//		onCaptureTestcase
//		deleteTestcase
//		saveTestcase
//
//	Utility functions
//		getXPathElement
///////////////////////////////////////////////// 

var CSTest = {
    components : registry,
	autowaitSecondsRemaining : null,
	currentTestCase : null,
	testAll : false,
	stop : false,

	onTestSidebarLoad: function() {
		var u = this.components.utils()
		var executionEnvironment = this.components.executionEnvironment()
		var contentBrowser = u.setInitialContentBrowser(window)
		
		executionEnvironment.initialize(contentBrowser)
		CSTest.loadTestcasesFromServer()
	},
	
	onTestSidebarUnload: function() {
	},
	
	///////////////////////////////
	//	onVerifyTestCase
	///////////////////////////////
	onVerifyTestCase: function(){
		CSTest.stop = false
		CSTest.testAll = false 
		var tree = document.getElementById("testcase_tree")
		
		// Populate our text boxes with data about this target
		var testcase = tree.view.getItemAtIndex(tree.currentIndex).testcase_data
		CSTest.currentTestCase = testcase
		tree.view.getItemAtIndex(tree.currentIndex).testcase_data.status=""
		tree.view.setCellText(tree.currentIndex, tree.columns.getNamedColumn("status_column"),"")
		testcase.verify = {}
		CSTest.loadTestPageAndVerify()
	},
	
	onVerifyAll:function(){
		CSTest.stop = false
		CSTest.testAll = true 
		var tree = document.getElementById("testcase_tree")
		
		for(var i=0 ; i<tree.view.rowCount ; i++){
			var testcase = tree.view.getItemAtIndex(i).testcase_data
			tree.view.getItemAtIndex(i).testcase_data.status=""
			tree.view.setCellText(i, tree.columns.getNamedColumn("status_column"),"")
			testcase.verify = {}
		}
		
		if(tree.view.rowCount>0){
			CSTest.verifyCaseN(0)
		}			
	},
	
	onVerifyRest:function(){
		CSTest.stop = false
		CSTest.testAll = true 
		var tree = document.getElementById("testcase_tree")
		
		var startIndex = tree.currentIndex
		for(var i=startIndex ; i<tree.view.rowCount ; i++){
			var testcase = tree.view.getItemAtIndex(i).testcase_data
			tree.view.getItemAtIndex(i).testcase_data.status=""
			tree.view.setCellText(i, tree.columns.getNamedColumn("status_column"),"")
			testcase.verify = {}
		}
		
		if(tree.view.rowCount>startIndex){
			CSTest.verifyCaseN(startIndex)
		}			
	},
	
	onStopVerify:function(){
		CSTest.stop = true 
	},
	
	
	///////////////////////////////
	//	verifyCaseN
	///////////////////////////////
	verifyCaseN:function(n){
		//debug("verifyCaseN with n = " + n + ", and testall = " + CSTest.testAll.toString())
		if (CSTest.stop) return;
		var tree = document.getElementById("testcase_tree")
		if(n<tree.view.rowCount){
			CSTest.ensureRowIsVisible(n)
			tree.view.selection.select(n)
			var testcase = tree.view.getItemAtIndex(n).testcase_data

			debug('-------------------------------\n')
			debug('Verifying test case #' + testcase.id + ': ' + testcase.name + '\n')

			CSTest.currentTestCase = testcase
			tree.view.getItemAtIndex(n).testcase_data.status=""
			tree.view.setCellText(n, tree.columns.getNamedColumn("status_column"),"")
			testcase.verify = {}
			CSTest.loadTestPageAndVerify()
		}
	},
	

	///////////////////////////////
	//	loadTestPageAndVerify
	///////////////////////////////
	loadTestPageAndVerify:function(){
		var u = CSTest.components.utils()
		var selectedTabBrowser = u.getBrowser(window.top)
		var testcase = CSTest.currentTestCase

		// Add a timeout so that if the page never finishes loading, we can abort and go on to the next testcase
		// TL: temporarily turning off until the other testsidebar bugs are resolved
		//CSTest.setTimeout()

		// Load the page in the main browser
		try {
			// Tell the browser to stop loading whatever it's currently loading
			debug('Telling browser to stop\n')
			selectedTabBrowser.stop()
			var webProgress = selectedTabBrowser.webProgress
			debug('browser is loading: ' + selectedTabBrowser.webProgress.isLoadingDocument + '\n')
			debug('browser url: ' + selectedTabBrowser.currentURI.spec + '\n')

			debug('Telling browser to load url: ' + testcase.url + '\n')
			u.goToUrl(selectedTabBrowser, testcase.url, CSTest.verify, false)
		} catch (e) {
			debug("goToUrl threw exception: " + e.toString() + "/" +
				e.toSource() + "\n")
		}
	},

	/* ----------------------------------------------------------------*/
	/**
	 * Timeout used to abort a test if it takes too long
	 */
	setTimeout : function() {
		CSTest.timeoutCallbackId = window.setTimeout(CSTest.testTimedOut,
			15000)
		//debug('*** timeoutCallbackId ' + CSTest.timeoutCallbackId)
	},

	clearTimeout : function() {
		//debug(' ' + CSTest.timeoutCallbackId + ' cleared\n')
		if (CSTest.timeoutCallbackId != null) {
			window.clearTimeout(CSTest.timeoutCallbackId)
			CSTest.timeoutCallbackId = null
		}
 	},

	// A test timed out, so report that it failed and continue on
	testTimedOut : function() {
		// Remove the listener
		// TL: might it be possible that we have not yet added this listener?  If so, will calling removeListener fail?
		//debug(' timed out\n')
		CSTest.components.commandGenerator().removeListener(CSTest.receiveRecordedCommand)
		var testcase = CSTest.currentTestCase
		testcase.status = "Test timed out"
		CSTest.reportStatus()
	},

	/* ----------------------------------------------------------------*/

	///////////////////////////////
	//	verify.
	///////////////////////////////
	verify : function(){
		// 1) Check whether the specified xpath can be found
		var u = CSTest.components.utils()
		var compiler = CSTest.components.compiler()
		var parserComponent = CSTest.components.parser()
		var doc = u.getBrowserDocument(window)
		debug('in Verify, current page: ' + doc.location.href + '\n')
		try{
			var testcase = CSTest.currentTestCase
			var w = getCurrentContentWindow()
			var xPathElement = CSTest.getXPathElement()
			if(xPathElement == null) {
				testcase.status += "XPath Element not found"
				CSTest.clearTimeout()
				CSTest.reportStatus()
				return;
			}
			var hilightNode = xPathElement
			if(testcase.act == "select"){
				while(hilightNode.nodeName != "SELECT" && hilightNode.parentNode != hilightNode){
					hilightNode = hilightNode.parentNode 
				}
			}
			CSTest.highlightNode(hilightNode,"#0000ff")// hilight the xPathElement blue
		}catch(e){
			testcase.status += "XPath Element not found due to exception: " + e.toSource()
			CSTest.clearTimeout()
			CSTest.reportStatus()
			return;
		}
		
		// 2) Check whether the slop can be parsed
		//parse the slop and create the commandObject
		var currentModifiedSlop = compiler.cleanSlop(testcase.slop)
		var parser = new parserComponent.Parser(currentModifiedSlop)
		try {
			var command = parser.parse()
			command.coScripterChromeWindow = u.getCoScripterChromeWindow(window)
		} catch (e) {
			debug("verify: parse failed: " + currentModifiedSlop)
			testcase.status += "Parse failed with exception " + e.toSource()
			CSTest.clearTimeout()
			CSTest.reportStatus()
			return;
		}
		
		/*
		// Wait until the target is available
		try {
			if (command.autoWait() == true) {	// currentCommand has a target that we may have to wait for
				if (CSTest.autowait(command) ==  true) {	// returns true if the target was not found and we need to wait
					return;	// autowait will call verify() again after 1 second (and ultimately fail after AUTOWAIT_PERIOD seconds)
				}
			}
		} catch(e) {
			// Let developers know something failed here
			dump("Error waiting for step to be executable: " + e.toSource() + '/' + e.toString() + '\n')
		}
		
		// If we reach this point, we have found the target
		//debug("findTargetAndExecuteStep has found the target")
		this.autowaitSecondsRemaining = null
		*/

		// 3) Check whether the command is executable
		// If it is, canExecute() finds the target and fills in command.target 
		if(!command.canExecute()) {
			testcase.status += "The command is not executable"
			CSTest.clearTimeout()
			CSTest.reportStatus()
			return;		
		}
		
		// 4) Check whether command.target matches the xpath element
		var matchP = CSTest.checkForMatchingTargets(command)
		if (!matchP) {
			CSTest.clearTimeout()
			CSTest.reportStatus()
			return;
		}
		
		// 5) Execute the command
		// 		CSTest.receiveRecordedCommand will get the command generated by the commandGenerator component when yule receives the executed event
		// 6) checkForMatchingSlop will be called by receiveRecordedCommand, and that is the final check.
		CSTest.components.commandGenerator().addListener(CSTest.receiveRecordedCommand)
		try{
			var options = {isRunning: true, win : window}
			debug('Executing command: ' + currentModifiedSlop + '\n')
			command.execute(null, options)
		}catch(e){
			testcase.status += "Slop execution threw exception: " + e.toSource() 
			CSTest.clearTimeout()
			CSTest.reportStatus()
			return;
		}
		
		return;
	},	// end of verify
	
	//	checkForMatchingTargets
	checkForMatchingTargets:function(command){
		var testcase = CSTest.currentTestCase
				
		// compare the target generated from the slop with the testcase's xPathElement
		try{	
			var targetElement = command.targetElement
			var xPathElement = CSTest.getXPathElement()
			var matchP = ( targetElement == xPathElement ) /// this has to be '===' since you can't get access to the XPCWrapped objects themselves
			testcase.verify.target = matchP
			testcase.verify.aTarget = (targetElement != null)
			//CSTest.currentTestCase.verify = testcase.verify
			//debug("testSidebar: targets " + (testcase.verify.target ? "match" : "do not match"))
			if(matchP) {
				return true
			} else {
				return false
			}
			if(xPathElement != null){
				//CSTest.highlightNode(targetElement,"#00ff00","5px")// hilight the expected target blue
			}
		}catch(e){
			testcase.verify.target = false
			debug("exception in checkForMatchingTargets: " + e.toSource())
			return false
		}
	},
	
	///////////////////////////////
	//	receiveRecordedCommand
	///////////////////////////////
	// callback from commandGenerator, which is invoked when verify executes the command and yule detects the resulting event
	receiveRecordedCommand:function(command){
		// ignore the initial "go to". We always go to the target url before executing the test command
		// TL TODO: why ignore the goto?  is this a bug?

		if (command.type == "go to") {
			debug("***!!!*** received GOTO in testSidebar receiveRecordedCommand\n")
			return;
		}
		CSTest.components.commandGenerator().removeListener(CSTest.receiveRecordedCommand)
		CSTest.clearTimeout()
		
		// 6) check whether the generated slop matches the expected slop
		var matchingSlopP = CSTest.checkForMatchingSlop(command)

		// Wrap this inside a window.setTimeout call to flush out the pending listener callback from the last execute call
		// TL: we don't need to use a window.setTimeout now, because I changed betterThenDoThis() to not require a thenDoThis; 
		//instead we pass null to execute() above.
		CSTest.reportStatus()
	},
		
	//	checkForMatchingSlop
	// Called by receiveRecordedCommand
	checkForMatchingSlop:function(command){
		var testcase = CSTest.currentTestCase
		var generated_slop = command.toSlop()
		
		// Don't test if the "don't verify" textbox is checked
		if (!testcase.verify_slop) {
			testcase.verify.toslop = true
			testcase.verify.slop = generated_slop
			return true
		}
		
		// Check whether the slop for this recording of the execution of the synthetic event that coscripter generated from the test slop 
		//matches the slop specified in the testcase
		try {
			// Call the toSlop() method
			testcase.verify.toslop = (generated_slop == testcase.slop)
			testcase.verify.slop = generated_slop
			return (generated_slop == testcase.slop)
		} catch (e) {
			testcase.verify.toslop = false
			testcase.verify.slop = "ERROR"
			return false
		}
	},


	///////////////////////////////
	//	reportStatus
	///////////////////////////////
	reportStatus:function(){
		// This method is called whenever we know that the test has succeeded or failed
		// Report the result and see whether the next testcase should be run
		//debug("testSidebar: in reportStatus")
		var testcase = CSTest.currentTestCase

		// Determine the result		
		if (testcase.status == "") {
			var success = testcase.verify.target && testcase.verify.toslop
			
			if(success){
				testcase.status = "verify ok"	
			}else{
				if(testcase.verify.aTarget == null){
					testcase.status = "No target found" 
				}else{
					testcase.status = testcase.verify.target ? "" : "Correct target not found"
				}
				testcase.status += testcase.verify.toslop ? "" : " toSlop() does not match; got \"" + testcase.verify.slop + "\""
			}
		}
		
		// Report the result
		var tree = document.getElementById("testcase_tree")
		// use the currentCase state to determine which tree item to update
		var index = testcase.index
		tree.view.getItemAtIndex(index).testcase_data = testcase 
		tree.view.setCellText(index, tree.columns.getNamedColumn("status_column"), testcase.status)

		// Start the next testcase
		if(index < ( tree.view.rowCount-1 ) && CSTest.testAll){
			index += 1 
			CSTest.verifyCaseN(index)
		}else{
			CSTest.testAll = false 
		}
	},
	
	/* autowait
	/////////////////////////////////
	//		autowait
	////////////////////////////////
	//
	// Wait for the target specified in the command to appear on the page.
	// Return true if we are waiting (i.e. the target is not there), or false if the target has been found.
	//
	autowait : function(cmd) {
		//debug('Looking for target on page... ')
		try {
			var execEnv = this.components.executionEnvironment()
			var mainChromeWindow = execEnv.getMainChromeWindow()
			var autowaitWindow = mainChromeWindow.setTimeout ? mainChromeWindow : mainChromeWindow.contentWindow
			if (cmd.findTarget() === null) {
				//debug('autowait: findTarget not found')
				if (this.autowaitSecondsRemaining === null) {	// first time autowaiting
					this.autowaitSecondsRemaining = AUTOWAIT_PERIOD // wait AUTOWAIT_PERIOD seconds before giving up
				}
				else {	// not first time
					if (this.autowaitSecondsRemaining === 0) {	// We waited, but it never showed up
						this.autowaitSecondsRemaining = null
						// Invoke the error callback to notify interested parties that this step failed to execute				
						var cmdType = cmd.getAction()
						if (cmdType == this.components.commands().ACTIONS.ASSERT) {
							if (!cmd.canExecute()) 
								this.call(this.EVENTS.ERROR, [this.currentStepNumber, cmd, "Assertion Failed: " + cmd.toSlop()])
							else 
								return false
						}
						else {
							this.call(this.EVENTS.ERROR, [this.currentStepNumber, cmd, "target not found: " + cmd.targetSpec.toSlop()])
						}
						return true
					}	// end of We waited, but it never showed up
					else {	// We're in the middle of an autowait and we still haven't found it
						this.autowaitSecondsRemaining = this.autowaitSecondsRemaining - 1
					}
				}	// end of not first time
				
				// Try again in a second
				var _this = this
				this.autowaitTimeoutID = autowaitWindow.setTimeout(function(){
													_this.verify.apply(_this, [])
														}, 1000)
				return true
			}
			else {	// cmd.findTarget is not null
				//debug('found!\n')
				return false
			}
		} catch (e) {
			dump("autowait error: " + e.toSource() + "/" + e.toString() + '\n')
			debug("autowait error: " + e.toString())
		}	
	},
	*/

	
	///////////////////////////////
	//	Test Cases
	///////////////////////////////

	///////////////////////////////
	//		loadTestcasesFromServer
	///////////////////////////////
	loadTestcasesFromServer: function(selectedRow) {
		var u = CSTest.components.utils()
		try {
			var testcaseAPI = u.getKoalescenceAPIFunction("testcase")
			var ret = u.loadWebPage(testcaseAPI)

			var nativeJSON = CC["@mozilla.org/dom/json;1"].createInstance(CI.nsIJSON)
			var testcases = nativeJSON.decode(ret)
			
			var listbox = document.getElementById("testcase_list")
			// Remove old contents
			u.removeAllChildren(listbox)
			
			for (var i=0; i<testcases.length; i++) {
				testcases[i].index = i
				var treeitem = CSTest.makeTreeItemFromTestcase(testcases[i])
				listbox.appendChild(treeitem)
			}
			
			// if selectedRow is set and != -1, then select that row in the tree after recreating it
			if (selectedRow && selectedRow > -1) {
				debug('trying to reselect row ' + selectedRow)
				var tree = document.getElementById("testcase_tree")
				tree.view.selection.select(selectedRow)
			}
		} catch (e) {debug(e)}
	},

	///////////////////////////////
	//		displayTestCase
	///////////////////////////////
	// When the user clicks on a row in the table, display it in the textboxes
	displayTestCase: function(row) {
		try {
			var tree = document.getElementById("testcase_tree")
			// If it's not really selected, return
			if (!tree.view.selection.isSelected(row)) return;
			var testcase = tree.view.getItemAtIndex(tree.currentIndex).testcase_data	
			
			var namebox = document.getElementById("testcase_Name")
			var urlbox = document.getElementById("testcase_URL")
			var xpathbox = document.getElementById("testcase_XPath")
			var slopbox = document.getElementById("testcase_Slop")
			var dontVerifyCheckbox = document.getElementById("testcase_dontVerify")
			var actbox = document.getElementById("testcase_Action")
			var textbox = document.getElementById("testcase_Text")
			
			namebox.value = testcase.name
			urlbox.value = testcase.url
			xpathbox.value = testcase.xpath
			slopbox.value = testcase.slop
			dontVerifyCheckbox.setAttribute("checked", !testcase.verify_slop)
			actbox.value = testcase.act || ""
			textbox.value = testcase.text || ""
		} catch (e) {
			debug("Error in displayTestCase: " + e)
		}
	},
	
	///////////////////////////////
	//		updateTestcase
	///////////////////////////////
	// Update the current testcase
	updateTestcase: function() {
		var u = CSTest.components.utils()
		// Only works if a row in the tree is selected
		var tree = document.getElementById("testcase_tree")
		if (!tree.view.selection.isSelected(tree.currentIndex)) {
			alert("Click on a testcase first")
			return;
		}

		// Clear out the other textboxes
		var slopbox = document.getElementById("testcase_Slop")
		var dontVerifyCheckbox = document.getElementById("testcase_dontVerify")
		var xpathbox = document.getElementById("testcase_XPath")
		var actbox = document.getElementById("testcase_Action")
		var textbox = document.getElementById("testcase_Text")
		slopbox.value = ""
		dontVerifyCheckbox.setAttribute("checked", "false")
		xpathbox.value = ""
		actbox.value = ""
		textbox.value = ""
		
		// Load the page in the main browser
    	var doc = u.getBrowserDocument(window)
		var urlbox = document.getElementById("testcase_URL")
		doc.location.href = urlbox.value

		// Wait for the document to finish loading, then add our event listeners
		u.betterThenDoThis(window, function() {
			var doc = u.getBrowserDocument(window)
			doc.addEventListener("mouseover", CSTest.highlightTarget, false)
			doc.addEventListener("mouseout", CSTest.unhighlightTarget, false)
			// doc.addEventListener("click", CSTest.captureTarget, true)
			coscripter.components.commandGenerator().addListener(CSTest.recordAction)
		})
	},
	
	///////////////////////////////
	//		onCaptureTestcase
	///////////////////////////////
	// Capture a new testcase
	onCaptureTestcase: function() {
		var u = CSTest.components.utils()
    	var doc = u.getBrowserDocument(window)
	    var cururl = doc.location.href.toString()
		var urlbox = document.getElementById("testcase_URL")
		urlbox.value = cururl
		
		doc.addEventListener("mouseover", CSTest.highlightTarget, false)
		doc.addEventListener("mouseout", CSTest.unhighlightTarget, false)
		// doc.addEventListener("click", CSTest.captureTarget, true)
		coscripter.components.commandGenerator().addListener(CSTest.recordAction)
		
		// Unselect anything in the tree so that it gets created as a new one
		var tree = document.getElementById("testcase_tree")
		tree.view.selection.clearSelection()
		// Clear out the other textboxes
		var namebox = document.getElementById("testcase_Name")
		var slopbox = document.getElementById("testcase_Slop")
		var dontVerifyCheckbox = document.getElementById("testcase_dontVerify")
		var xpathbox = document.getElementById("testcase_XPath")
		var actbox = document.getElementById("testcase_Action")
		var textbox = document.getElementById("testcase_Text")
		namebox.value = ""
		slopbox.value = ""
		dontVerifyCheckbox.setAttribute("checked", "false")
		xpathbox.value = ""
		actbox.value = ""
		textbox.value = ""
	},
	
	// Called by updateTestcase and onCaptureTestcase 
	recordAction: function(recordedCommand) {
		try {
			var u = CSTest.components.utils()
			// DEATHTOME if (skipCommand(recordedCommand)) return
			var slopbox = document.getElementById("testcase_Slop")
			// Generate the slop and display it
			slopbox.value = recordedCommand.toSlop()
			// It's recordable, since it's being recorded
			var dontVerifyCheckbox = document.getElementById("testcase_dontVerify")
			dontVerifyCheckbox.setAttribute("checked", "false")
			
			// Populate the XPath box
			var xpathbox = document.getElementById("testcase_XPath")
			// if we recorded a select, we need to get the option out
			var target = recordedCommand.getTarget()
			if (u.stringContains(target.nodeName, "SELECT")) {
				target = target[target.selectedIndex]
			}
			xpathbox.value = CSTest.BuildXPathForNode(target)
			// Populate action and text
			var actbox = document.getElementById("testcase_Action")
			actbox.value = recordedCommand.getAction()
			var textbox = document.getElementById("testcase_Text")
			if (recordedCommand.string) {
				textbox.value = recordedCommand.string.getValue()
			}
			
			// Stop recording
			coscripter.components.commandGenerator().removeListener(CSTest.recordAction)
			// Remove our event listeners
			var doc = u.getBrowserDocument(window)
			doc.removeEventListener("mouseover", CSTest.highlightTarget, false)
			doc.removeEventListener("mouseout", CSTest.unhighlightTarget, false)
			// unhighlight target
			CSTest.unhighlightNode(recordedCommand.getTarget())
		} catch (e) {
			debug("Error in recordAction: " + e)
		}
	},
	
	///////////////////////////////
	//		deleteTestcase
	///////////////////////////////
	deleteTestcase: function() {
		var u = CSTest.components.utils()
		if (!window.confirm("Delete testcase?")) return;
		var tree = document.getElementById("testcase_tree")
		var testcase = tree.view.getItemAtIndex(tree.currentIndex).testcase_data
		var params = {}
		var testcaseURL = u.getKoalescenceAPIFunction("testcase")
		var ret = u.deleteRequest(testcaseURL + '/' +testcase.id, params)
		if (ret === null) {
			alert("Error deleting testcase from server")
		} else if (ret[0] != 200) {
			alert("Error deleting testcase: " + ret[1])
		} 

		var item = tree.view.getItemAtIndex(testcase.index)
		item.parentNode.removeChild(item)
		var oldindex = testcase.index
		CSTest.renumberTestcaseIndices()
		if (oldindex >= tree.view.rowCount) {
			oldindex = tree.view.rowCount - 1
		}
		CSTest.ensureRowIsVisible(oldindex)
		tree.view.selection.select(oldindex)
	},

	///////////////////////////////
	//		saveTestcase
	///////////////////////////////
	// save the current testcase to server
	saveTestcase: function() {
		var u = CSTest.components.utils()
		try {
			var params = {}
			var namebox = document.getElementById("testcase_Name")
			var urlbox = document.getElementById("testcase_URL")
			var xpathbox = document.getElementById("testcase_XPath")
			var slopbox = document.getElementById("testcase_Slop")
			var dontVerifyCheckbox = document.getElementById("testcase_dontVerify")
			var actbox = document.getElementById("testcase_Action")
			var textbox = document.getElementById("testcase_Text")
			params.name = namebox.value
			params.url = urlbox.value
			params.xpath = xpathbox.value
			params.slop = slopbox.value
			params.verify_slop = (!dontVerifyCheckbox.hasAttribute("checked")).toString()
			params.act = actbox.value
			params.text = textbox.value
			if (!params.url || "" == u.trim(params.url)) {
				alert("No URL specified, not saving!")
				return;
			}
			
			// Save as an existing testcase if a row in the tree is selected
			var tree = document.getElementById("testcase_tree")
			var oldrowindex = null
			if (tree.view.selection.isSelected(tree.currentIndex)) {
				params.id = tree.view.getItemAtIndex(tree.currentIndex).testcase_data['id']
				oldrowindex = tree.view.getItemAtIndex(tree.currentIndex).testcase_data.index
			}
			
			var testcaseURL = u.getKoalescenceAPIFunction("testcase")
			var ret = u.post(testcaseURL, params)
			if (ret === null) {
				alert("Error saving testcase to server")
			} else if (ret[0] != 200) {
				alert("Error saving testcase: " + ret[1])
			} else {
				// Save succeeded
				var nativeJSON = CC["@mozilla.org/dom/json;1"].createInstance(CI.nsIJSON)
				var scriptdata = nativeJSON.decode(ret[1])
				CSTest.setStatus("Testcase saved with id " + scriptdata['id'])

				// insert it into the tree
				var listbox = document.getElementById("testcase_list")
				var tree = document.getElementById("testcase_tree")
				if (oldrowindex == null) {
					// at the end as a new entry
					scriptdata.index = tree.view.rowCount
					var treeitem = CSTest.makeTreeItemFromTestcase(scriptdata)
					listbox.appendChild(treeitem)
				} else {
					scriptdata.index = oldrowindex
					tree.view.getItemAtIndex(oldrowindex).testcase_data = scriptdata
					// clear out the old test result
					tree.view.setCellText(oldrowindex, tree.columns.getNamedColumn("status_column"),"")
					tree.view.setCellText(oldrowindex, tree.columns.getNamedColumn("name_column"), scriptdata.name)
				}
				// select it
				CSTest.ensureRowIsVisible(scriptdata.index)
				tree.view.selection.select(scriptdata.index)
			}
		} catch (e) {
			debug("Error in saveTestcase: " + e)
		}
	},


	///////////////////////////////
	//	Utility functions
	///////////////////////////////
	//		getXPathElement
	getXPathElement:function(){
		try{
			var w = getCurrentContentWindow()
			var contextDoc = w.document
			var testcase = CSTest.currentTestCase
			var xpath = testcase.xpath
			var xpathExprs = xpath.split("/document()")

			var node = contextDoc.evaluate(xpathExprs[0], contextDoc, null, 9, null).singleNodeValue
			for(var i = 1; i < xpathExprs.length && node != null; i++)
			{
				if (node.contentDocument == null)
					return null
				
				contextDoc = node.contentDocument
				node = contextDoc.evaluate(xpathExprs[i], contextDoc, null, 9, null).singleNodeValue		
			}			
			return node
		}catch(e){
			debug("CSTest.checkXPathElement threw exception: " + e.toSource())
		}  
	},

	ensureRowIsVisible: function(index) {
		var tree = document.getElementById("testcase_tree")
		// ensure it's visible
		var box = tree.boxObject
		box.QueryInterface(Components.interfaces.nsITreeBoxObject)
		box.ensureRowIsVisible(index)
	},
	
	highlightTarget: function(event) {
		var target = event.target
		CSTest.highlightNode(target)
	},
	highlightNode: function(node,color,width,style){
		node.style.setProperty("-moz-outline-style", style?style:"solid", "important")
		node.style.setProperty("-moz-outline-width", width?width:"2px", "important")
		node.style.setProperty("-moz-outline-color", color?color:"#ff0000", "important")
	},
	unhighlightTarget: function(event) {
		var target = event.target
		CSTest.unhighlightNode(target)
	},
	unhighlightNode:function(node){
		node.style.removeProperty("-moz-outline-style")
		node.style.removeProperty("-moz-outline-width")
		node.style.removeProperty("-moz-outline-color")
	},

  	BuildXPathForNode: function(node) {
		if (node.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") {
        	return ""
    	}
    	var parent = node.parentNode
   		var path = ""
		
    	if (parent === null) {
    		if (node.defaultView !== null &&
				node.defaultView.frameElement !== null &&
				node.defaultView.frameElement.namespaceURI != "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul")
			{
			path = CSTest.BuildXPathForNode(node.defaultView.frameElement)
			path += "/document()"
			}
    	}
    	else if (parent == node) {
			return ""
		} else {
			path = CSTest.BuildXPathForNode(parent)

			if (node.nodeType == 1) { // Node.ELEMENT_NODE
          		path += "/" + node.nodeName
      		} else if (node.nodeType == 2) { // Node.ATTRIBUTE_NODE
          		path += "/@" + node.nodeName
      		} else if (node.nodeType == 3) { // Node.TEXT_NODE
          		path += "/text()"
      		}

      		var index = 1
      		if (node.nodeName.toLowerCase() != "html") {
         		var n = node.previousSibling
          		while (n !== null) {
            		// TL: check the previous sibling's node type as well as the node name for a match.
					// I saw one page where the previousSibling was a Document node whose nodename was HTML, even though this didn't exist as an <html> node in the page.
            		if ((n.nodeName == node.nodeName) && (n.nodeType == node.nodeType)) {
              			index++
					}
           		n = n.previousSibling
          		}
      		}
      		path += "[" + index + "]"
    	}
    	return path
  	},
	
	makeTreeItemFromTestcase: function(testcase) {
		var treeitem = document.createElement("treeitem")
		treeitem.testcase_data = testcase
		var treerow = document.createElement("treerow")
		treeitem.appendChild(treerow)
		var treecell = document.createElement("treecell")
		treecell.setAttribute("label", testcase.id)
		treerow.appendChild(treecell)
		treecell = document.createElement("treecell")
		treecell.setAttribute("label", testcase.name)
		treerow.appendChild(treecell)
		treecell = document.createElement("treecell")
		treecell.setAttribute("label", "")
		treerow.appendChild(treecell)
		return treeitem
	},
	
	renumberTestcaseIndices: function() {
		var tree = document.getElementById("testcase_tree")
		for (var i=0; i<tree.view.rowCount; i++) {
			var tcdata = tree.view.getItemAtIndex(i).testcase_data
			tcdata.index = i
		}
	},
	
	// --------------------------------------------------------
	//	Statusbar functions
	setStatus: function(msg) {
		var u = CSTest.components.utils()
		var status = document.getElementById("statusbar")
		u.removeAllChildren(status)
		status.appendChild(document.createTextNode(msg))     
	}
}

/* Debugging why some test cases are failing with XPath errors during Verify All, even though they pass individually.
This is what happens when we run test cases N and N+1.
1. load test page N
2. check for xpath
3. execute click on page N
	-> queues page load, browser starts loading page N'
4. load test page N+1
	-> browser.stop()
	-> go to page N+1
    -> betterThenDoThis
	-> window.setTimeout
		-> click to page N' processed
		-> page N' starts loading
	-> is page loading?
		-> yes, page N' is loading
		-> page N' finishes loading
5. check for xpath N+1
*/
