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
var EXPORTED_SYMBOLS = ["executionEngine"]
const nsISupports = Components.interfaces.nsISupports	// XPCOM registration constant
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
var debugFilename = 'execution-engine';
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage(debugFilename + ": " + msg )
	if(Preferences.DO_DUMP_DEBUGGING) dump(debugFilename + ": " + msg + "\n")
}
function errorMsg(msg){
	consoleService.logStringMessage(debugFilename + ": CoScripter Error Thrown: " + msg )
}
//debug('parsing coscripter-execution-engine.js')

// CONFIGURATION
// How long to wait for an "if there is a" target to appear before we conclude that it will never appear
const AUTOWAIT_PERIOD = 30

///////////////////////////////////////////////// 
//	ExecutionEngine
//		loadScript
//		moveToFirstStep
//		setCurrentStepNumber
//		doStep
//		doRun
//		call
//
//		findTargetAndExecuteStep
//		executeStep
//		stepExecutedCallback
//		executeDialogCommand
//		advanceStep
//		findTargetOrWait
//
//		utility methods
//		event listeners
////////////////////////////////////////////////

function getExecutionEngine(){
	return executionEngine
}

/////////////////////////////////
//	ExecutionEngine
////////////////////////////////
// Step execution and control flow are handled by the executionEngine.
// It is intended to be compatible with CoScripter, CoTester, and CoCo.
// Any application-dependent ExecutionEngine behavior is handled through callbacks to the engine's EVENTS
function ExecutionEngine() {
    this.components = registry	// Component registry
	//  Eventually remove the db from ExecutionEngine and move it to the Execution Environment
	this.db = null	// the personalDB to be used for filling in variables
	
	// Possible events you can listen for
	this.EVENTS = {
		CURRENT_STEP_SET	: 'current_step_set',	// current_step_set(stepNumber, cmd) this step is now the current step
		STEP_READY			: 'step_ready',			// step_ready(stepNumber, cmd, executable_details) this step has been parsed and checked to see if it is executable; executable_details is an object that provides info about whether it parsed and its target was found
		STEP_EXECUTED		: 'step_executed',		// step_executed(stepNumber, cmd) this step completed execution
		STEPPED				: 'stop_running',		// while single-stepping, a step has been completed
		SCRIPT_FINISHED		: 'script_finished',	// script_finished() the script has finished executing
		SLOP_CHANGED		: 'slop_changed',		// 'repeat' steps change the slop to show the current row #
		YOU_COMMAND			: 'you_command',		// you_command(cmd, continueMethod) a you step has been encountered by stepExecutedCallback. You must call continueMethod() when ready to continue execution.
													// If findTargetAndExecuteStep encounters a you step, it executes it. This enables the user to resume execution by clicking Step or Run in the CoScripter sidebar.
		CLIP_COMMAND		: 'clip_command',		// clip_command(cmd, domnode) the domnode is the result of the clip
		ERROR 				: 'error',				// error(stepNumber, cmd, error_details) there was an error on the specified step; error_details is an object that provides more info
	}
	
	// values for this.currentState
	this.STATES = {
		NEW_STEP				: 'new step',			// 
		WAITING_FOR_TARGET		: 'waiting for target',		// 
		FOUND_TARGET			: 'found target',			// or there is no target
		EXECUTING				: 'executing',				// 
		ADVANCE_STEP			: 'advance step',			// 
		DONE		 			: 'done',					// 
		ERROR					: 'error'					// step failed to execute properly
	}
	
	this.repeatStepData = {	// eventually move this inside the repeat step, so we can handle nested repeats
		currentScratchtableRowNumber : null,
		infiniteLoopP : false,
		terminatedP : false,
		firstIterationP : false
	}
		
	this._cb = new Array()	// Callback map

	this.stepList = []	// List of command objects (created by the compiler)
	
	// A 'step' is a step in this.stepList. steps are 0-based. stepNumber is an index into this.stepList, and it corresponds to line numbers in the text editor and the Procedure's body lines.
	this.currentStepNumber = 0
	this.currentStep = null
	this.currentState = null	// new step; waiting for target; found target; executing; done; 

	this.inRunModeP = false	// true when a script is set to run automatically. (not Stepping or Stopped. It may be executing a Pause or Wait step, or Waiting for a You step to be performed manually)
	this.stopP = false		// set to true when you want to stop Running
	// TL: adding yet another bit of state (yuck) to handle one specific case where control never returns to our code after we synthesize a click event on a radiobutton.  
	//See bug [#88674] Execution hangs on a "turn on radio button" step (also in M3), and bug [#104308] Recording stops working when a step is interrupted.
	this.stepBeingExecuted = false
	
	this.autowaitTimeoutID = null	// the timeoutID from window.setTimeout which can be used to clear the timeout. The autowait is used to wait until the step's target appears on the current page
	this.autowaitSecondsRemaining = null

	this.wrappedJSObject = this
	return this
}

ExecutionEngine.prototype ={
	//		loadScript
	loadScript : function(cmd_list, db, currentStepNumber) {
		// currentStepNumber is optional.  If supplied, this is a ReLoad because the script has been edited, so repeatStepData should not be reset
		this.stepList = cmd_list
		this.db = db ? db : null

		// Initialize state variables
		this.stopP = false
		this.inRunModeP = false
		this.autowaitSecondsRemaining = null
		
		if (!currentStepNumber){
			this.currentState = null
			this.moveToFirstStep()
			this.currentState = null
			this.repeatStepData = {
				currentScratchtableRowNumber : null,
				infiniteLoopP : false,
				terminatedP : false,
				firstIterationP : false
				}
		} 
		else this.setCurrentStepNumber(currentStepNumber)
	},
	
	//		moveToFirstStep
	moveToFirstStep : function(){	// Set the current step to the first executable step
		this.setCurrentStepNumber(0)
	},

	//		setCurrentStepNumber
	// A 'step' is a command object stored in this.stepList. It has an 'indent' and a 'lineNumber' that matches its position in this.stepList
	setCurrentStepNumber : function(stepNumber) {
		if (this.currentState && this.currentState != this.STATES.DONE) {	
			// doStep or doRun can be called by the user at any time.  They will call setCurrentStepNumber.
			// If there is currently an outstanding autowaitTimeoutID, cancel it.
			this.clearAutowaitTimeout()
			//debug("ExecutionEngine.setCurrentStepNumber called with currentState = " + this.currentState + " for stepNumber " + stepNumber)
		}
		this.currentStepNumber = stepNumber
		this.currentStep =  this.stepList[stepNumber]
		this.currentState = this.STATES.NEW_STEP
		this.call(this.EVENTS.CURRENT_STEP_SET, [stepNumber])
	},
	
	//		doStep
	doStep : function(currentLineNumber){	// Run only the current step
		var execEnv = this.components.executionEnvironment()
		this.stopP = false
		this.inRunModeP = false
		if (currentLineNumber != null) this.setCurrentStepNumber(currentLineNumber)
		this.findTargetAndExecuteStep()
	},
	
	//		doRun
	doRun : function(currentLineNumber){	// Start running all steps
		var execEnv = this.components.executionEnvironment()
		this.stopP = false
		this.inRunModeP = true
		if (currentLineNumber != null) this.setCurrentStepNumber(currentLineNumber)
		this.findTargetAndExecuteStep()
	},
	
	//		doStop
	doStop : function(){	// Tells ExecutionEngine to Stop Running 
		this.stopP = true
	},
	
	/**
	 * Callback on error during step execution.  Pass it on to the error callback we were initialized with
	 */
	_error : function(e) {
		errorMsg("_error: uncaught error in execution: " + e.toSource() + "/" + e.toString() + '\n')
		this.currentState = this.STATES.ERROR
		this.call(this.EVENTS.ERROR, [this.currentStepNumber, this.cmd, e])
	},

	//		call
	call : function(name, args) {
		this._callback(name, args)
	},

	/**
	 * Call the named callback if it has been specified during initialization.  If not, do nothing.
	 */
	_callback : function(name, args) {
		if (this._cb[name]) {
			this._cb[name].apply(null, args)
		}
	},
	
	
	////////////////////////////////////
	//		findTargetAndExecuteStep
	////////////////////////////////////
	// This is the main method in the ExecutionEngine.
	// It is called initially by doStep or doRun.
	// It calls findTargetOrWait, and if a target is not initially found and we need to wait, it is called again after 1 second by findTargetOrWait
	// When running, once the target is found and the step is executed, it gets called on the next step by stepExecutedCallback (which uses advanceStep to determine the next step)
	findTargetAndExecuteStep : function() {
		//debug("findTargetAndExecuteStep starting.")
		//if (this.currentStep) debug("currentStep is " + this.currentStep.getSlop())
		
		var timestamp = new Date()
		var mins = timestamp.getMinutes()
		var seconds = timestamp.getSeconds()
		//debug("Timestamp: " + mins + "min "  + seconds + "sec")
		
		var commands = this.components.commands()
		var execEnv = this.components.executionEnvironment()
		var previewer = this.components.previewer()
		
		if(!this.currentStep) return;
		if (this.stopP == true) {
			this.stopP == false
			return;
		}
		
		if (this.db) this.currentStep.fillInVars(this.db)
		if (!this.currentStep.hasNeededVars()) {
			this.currentState = this.STATES.ERROR
			this.call(this.EVENTS.ERROR, [this.currentStepNumber, this.currentStep, "Step does not have needed variables in PersonalDB or scratchspace"])
			return;
		}

		// Wait until the target is available
		var targetElement = null
		try {
			if (this.currentStep.autoWait() == true) {	// currentStep has a target that we may have to wait for
				//debug("findTargetAndExecuteStep calling findTargetOrWait")
				
				targetElement = this.findTargetOrWait()
				if (!targetElement) {	// findTargetOrWait returns false if the target was not found and we need to wait
					//debug("findTargetAndExecuteStep needs to wait. Returning, and findTargetOrWait will call findTargetAndExecuteStep again after 1 second.")
					this.currentStep.targetElement = null
					return;	// findTargetOrWait will call findTargetAndExecuteStep again after 1 second (and ultimately fail after AUTOWAIT_PERIOD seconds)
				}
				else {	// the target was found. 
					this.currentStep.targetElement = targetElement		// Just to make sure that a stale target isn't used for execution
				}
			}
			else {
				this.currentState = this.STATES.FOUND_TARGET
				//debug("findTargetAndExecuteStep does not need to wait")
			}
		} catch(e) {
			errorMsg("findTargetAndExecuteStep: Error waiting for target to be available: " + e.toSource() + '/' + e.toString() + '\n')
		}
		//debug("findTargetAndExecuteStep has found any needed target")
		
		// Execute step
		this.call(this.EVENTS.STEP_READY, [this.currentStepNumber, this.currentStep])	// Callback before a step executes
		try
		{
			//debug('**Executing step: ' + this.currentStep.getSlop())
			this.stepBeingExecuted = true	// TL: set stepBeingExecuted to true so that if we go to a different state before stepExecutedCallback is invoked (e.g., by user clicking Home or closing the sidebar) we can finish cleaning up after the step
			previewer.clearPreview()	// Clear preview *before* executing, to make sure CoScripter's highlight rectangle doesn't interfere
			if (!this.inRunModeP && (this.currentStep.getAction() == commands.ACTIONS.PAUSE || this.currentStep.getAction() == commands.ACTIONS.WAIT)) {	 // If we are Stepping, don't execute PAUSE and WAIT steps
				this.stepExecutedCallback()	//call thenDoThis to continue processing
				return;
			}
			
			///////////////////////////
			// executeStep //
			///////////////////////////
			this.executeStep()

			//debug("... executed")
		}catch(e){
			errorMsg("in findTargetAndExecuteStep currentStep.execute threw exception : "+ e.toSource() + '\n')
			if (e == "target value not found") this.stepExecutedCallback()
		}
	},	// end of findTargetAndExecuteStep
	
	
	////////////////////////////////////////
	//		executeStep
	////////////////////////////////////////
	executeStep : function() {
		var cmd = this.currentStep
		var _this2 = this
		
		try {
			var theCallback = function(){_this2.stepExecutedCallback()}
			var options = {isRunning : this.inRunModeP, win : cmd.execEnv.getMainChromeWindow()}
			
			/////////////
			// Execute //
			/////////////
			this.currentState = this.STATES.EXECUTING
			cmd.execute(theCallback, options)
			
		} catch (e) {
			errorMsg("executeStep: " + e.toSource() + "/" + e.toString() + '\n')
			this.call(this.EVENTS.ERROR, [this.currentStepNumber, cmd, e])
		}
	},	// end of executeStep


	////////////////////////////////////////
	//		stepExecutedCallback
	////////////////////////////////////////
	// This will be called after any step has been executed
	stepExecutedCallback : function() {  
		//debug("in stepExecutedCallback")
		//if (this.currentStep) debug("stepExecutedCallback Starting: for executed step " + this.currentStep.getSlop())
		if (!this.components) {
			throw "stepExecutedCallback has undefined this.components"
		}
		var u = this.components.utils()
		var execEnv = this.components.executionEnvironment()
		var commands = this.components.commands()
		var stepAvailable
		//this.cleanupAfterStepExecution()	// First, clean up after executing the last step
		
		var executedStepNumber = this.currentStepNumber
		var executedStep = this.currentStep
		var executedStepAction = executedStep.getAction()
		
		// Don't do anything if we aren't in the middle of executing a step
		if (executionEngine.stepBeingExecuted == false) {
			throw "stepExecutedCallback called when executionEngine.stepBeingExecuted == false"
			//return;
		}
		executionEngine.stepBeingExecuted = false;	// Reset the flag
		this.call(this.EVENTS.STEP_EXECUTED, [this.currentStepNumber, this.currentStep])

		if (executedStepAction == commands.ACTIONS.CLIP) {	// CLIP step
			this.call(this.EVENTS.CLIP_COMMAND, [this.currentStep, this.currentStep.evaluate()])
		}
		
		this.currentState = this.STATES.ADVANCE_STEP
		
		//////////////////////
		//	ADVANCE STEP	//
		//////////////////////
		if (executedStepAction == commands.ACTIONS.IF) {	// IF step
			var evalStatus = executedStep.getValue()	// evaluate() was also called when this If step was executed, so it's probably unnecessary to re-revaluate
			stepAvailable = this.advanceStep(!evalStatus)
		} else {
			stepAvailable = this.advanceStep(false)
			//debug("stepExecutedCallback advanced Step. currentStep is now " + this.currentStep.getSlop())
		}
		
		this.currentState = this.STATES.DONE
		var newStep = this.currentStep
		var newStepAction = newStep.getAction()
		
		//debug("stepExecutedCallback: stepAvailable is " + stepAvailable)
		if (this.inRunModeP && stepAvailable) {	
			if (newStepAction == commands.ACTIONS.YOU) {
				this.call(this.EVENTS.YOU_COMMAND, [this.currentStep, this.findTargetAndExecuteStep])
				return;
			}
			if (newStepAction == commands.ACTIONS.UNEXECUTABLE) {	// parse error
				this.call(this.EVENTS.ERROR, [this.currentStepNumber, newStep, "Parse error: " + newStep.getSlop()])
				return;
			}
				
			// Execute the remaining steps of the procedure
			//debug("stepExecutedCallback calling findTargetAndExecuteStep for " + newStep.getSlop())
			
			//////////////////////////////
			// findTargetAndExecuteStep //
			//////////////////////////////
			this.findTargetAndExecuteStep()
			
			//debug("stepExecutedCallback returned from call to findTargetAndExecuteStep for " + newStep.getSlop())
		} else {
			if ( !stepAvailable ) {	// We've finished executing the script
				debug("stepExecutedCallback: We've finished executing the script")
				this.call(this.EVENTS.SCRIPT_FINISHED, [])
				this.moveToFirstStep()
			} else {	// There is a step available, but we are not automatically executing it
				debug("stepExecutedCallback: There is a step available, but we are not automatically executing it")
				this.call(this.EVENTS.STEPPED, [])
			}
		}
	},	// end of stepExecutedCallback
	
	
	//		executeDialogCommand
	// this is a copy of stepExecutedCallback, used only by executeModalCommands when yule handles an event in a dialog box
	executeDialogCommand : function() {  
		//debug("in executeDialogCommand")
		//if (this.currentStep) debug("executeDialogCommand Starting: for executed step " + this.currentStep.getSlop())
		if (!this.components) {
			throw "executeDialogCommand has undefined this.components"
		}
		var u = this.components.utils()
		var execEnv = this.components.executionEnvironment()
		var commands = this.components.commands()
		var stepAvailable
		//this.cleanupAfterStepExecution()	// First, clean up after executing the last step
		
		var executedStepNumber = this.currentStepNumber
		var executedStep = this.currentStep
		var executedStepAction = executedStep.getAction()
		
		// Don't do anything if we aren't in the middle of executing a step
		if (executionEngine.stepBeingExecuted == false) {
			throw "executeDialogCommand called when executionEngine.stepBeingExecuted == false"
			//return;
		}
		executionEngine.stepBeingExecuted = false;	// Reset the flag
		this.call(this.EVENTS.STEP_EXECUTED, [this.currentStepNumber, this.currentStep])

		if (executedStepAction == commands.ACTIONS.CLIP) {	// CLIP step
			this.call(this.EVENTS.CLIP_COMMAND, [this.currentStep, this.currentStep.evaluate()])
		}
		
		this.currentState = this.STATES.ADVANCE_STEP
		
		//////////////////////
		//	ADVANCE STEP	//
		//////////////////////
		if (executedStepAction == commands.ACTIONS.IF) {	// IF step
			var evalStatus = executedStep.getValue()	// evaluate() was also called when this If step was executed, so it's probably unnecessary to re-revaluate
			stepAvailable = this.advanceStep(!evalStatus)
		} else {
			stepAvailable = this.advanceStep(false)
			//debug("executeDialogCommand advanced Step. currentStep is now " + this.currentStep.getSlop())
		}
		
		this.currentState = this.STATES.DONE
		var newStep = this.currentStep
		var newStepAction = newStep.getAction()
		
		//debug("executeDialogCommand: stepAvailable is " + stepAvailable)
		if (this.inRunModeP && stepAvailable) {	
			if (newStepAction == commands.ACTIONS.YOU) {
				this.call(this.EVENTS.YOU_COMMAND, [this.currentStep, this.findTargetAndExecuteStep])
				return;
			}
			if (newStepAction == commands.ACTIONS.UNEXECUTABLE) {	// parse error
				this.call(this.EVENTS.ERROR, [this.currentStepNumber, newStep, "Parse error: " + newStep.getSlop()])
				return;
			}
				
			// Execute the remaining steps of the procedure
			//debug("executeDialogCommand calling findTargetAndExecuteStep for " + newStep.getSlop())
			
			//////////////////////////////
			// findTargetAndExecuteStep //
			//////////////////////////////
			this.findTargetAndExecuteStep()
			
			//debug("executeDialogCommand returned from call to findTargetAndExecuteStep for " + newStep.getSlop())
		} else {
			if ( !stepAvailable ) {	// We've finished executing the script
				debug("executeDialogCommand: We've finished executing the script")
				this.call(this.EVENTS.SCRIPT_FINISHED, [])
				this.moveToFirstStep()
			} else {	// There is a step available, but we are not automatically executing it
				debug("executeDialogCommand: There is a step available, but we are not automatically executing it")
				this.call(this.EVENTS.STEPPED, [])
			}
		}
	},	// end of executeDialogCommand

	////////////////////////////////////////
	//		advanceStep
	////////////////////////////////////////
	// Finds the next step that is not a comment (or the end of script occurs)
	// Handles If, Else, and Repeat blocks
	// Returns true if another step is available for execution
	advanceStep : function(skipNestedBlockP) {
		var startingStep = this.getCurrentStep()
		var startingStepNumber = this.currentStepNumber
		var startingStepIndent = this.getCurrentStepIndent()
		
		if (this.repeatStepData.terminatedP){ // we just executed a Repeat statement which determined that its Repeat block has already terminated
			var stepNumberOfNextSibling = this.getStepNumberOfNextSibling(startingStepNumber)
			if (stepNumberOfNextSibling != -1){
				this.setCurrentStepNumber(stepNumberOfNextSibling)					// ** CurrentStep = the next sibling after the Repeat statement **
				if((this.getCurrentStepText().search(/^\s*repeat\b/i) != -1)) { // advanced by Step or Run from a step above this Repeat step, so when this step executes, it will be the first iteration of this loop
					this.repeatStepData.firstIterationP =  true
				}
				//this.notifyEventListeners('advancestep')
				return true
			} else {
				//logCoScripterEvent("final step was executed")
				//this.notifyEventListeners('doneexecuting')	// fire "finish execute" event
				return false
			}
		}
		
		// Find the next step to execute
		var newCurrentStep = null
		var nextStepNumber = startingStepNumber
		while (nextStepNumber = this.getNextNonCommentStepNumber(nextStepNumber)) {
			var nextStep = this.getStepFromStepNumber(nextStepNumber)
			var nextStepIndent = this.getStepIndent(nextStep)
			var nextStepText = this.getStepText(nextStep)
			
			// If we're skipping a nested block (e.g. an IF that failed) and this step is indented more than the starting step, keep going
			if (skipNestedBlockP && nextStepIndent > startingStepIndent) {
				continue;
			}
			if (skipNestedBlockP && nextStepIndent == startingStepIndent && nextStepText.search(/\s*else\b/i) != -1) { //The previous IF block was skipped, so execute this ELSE block
				skipNestedBlockP = false	
				continue;
			}
			if (nextStepText && nextStepText.search(/\s*else\b/i) != -1) { //if the previous clause didn't step over this "else" statement, its preceding IF block was executed, so skip this ELSE block
				skipNestedBlockP = true
				startingStepIndent = nextStepIndent
				continue;
			}
			if(!this.isStepCommentP(nextStep)){
				newCurrentStep = nextStep						// ** newCurrentStep is set HERE **
				break;
			}
		}
		
		// We're about to set CurrentStep to newCurrentStep
		// But there are two special cases: 
		// 1) We just executed the last step in the script 
		// 2) We just executed the last step in a Repeat block

		// 1) If we just executed the last step in the script, return false. 
		//    However, check whether the end of the script is also the end of a Repeat block. If so, set CurrentStep to the Repeat statement. 
		if(newCurrentStep == null){
			//We didn't find any step to execute past startingStep, so we are at the end of the script.
			//newCurrentStep == null can occur because pI.hasCurrentStepNext() fails when: startingStep is the last step of the script; skipping over an If that failed; skipping over an Else at the end of the script; skipping over comments at the end of the script

			//	Did we just complete an iteration of a repeat block that extends to the end of the script?
			/* To find a repeat block that ends at the end of the script, 
			  go back from startingStep until you get to a step with indent = 1.
			   If any step encountered on the way is a repeat, it is a repeat block that ends at the end of the script.
			   Given the firstStepNumberOfRepeatBlock, how do we find the lastStepNumberOfRepeatBlock? We might as well use the end of the script as the last step,
			  since at worst we will include some irrelevant comments.
			*/
			var firstStepNumberOfRepeatBlock = this.getStepNumberOfRepeatStatementContainingStepNumber(startingStepNumber)
			if (firstStepNumberOfRepeatBlock != -1){	// the repeat block ends with the last step of the script
				this.repeatStepData.firstIterationP = false
				this.setCurrentStepNumber(firstStepNumberOfRepeatBlock)				// ** CurrentStep = Repeat statement **
			} else {
				//logCoScripterEvent("final step was executed")
				//this.notifyEventListeners('doneexecuting')	// fire "finish execute" event
				//this.call(this.EVENTS.SCRIPT_FINISHED, [])
				//this.moveToFirstStep()
				return false
			}
		} else {
			// 2) If we just executed the last step in a Repeat block,
			//    set CurrentStep to the Repeat statement. When the Repeat statement executes, it will determine whether this was the last iteration.
			var currentStepMovedToRepeatStatementP = false
			var stepNumberOfPreviousSibling = this.getStepNumberOfPreviousSibling(this.getStepNumberOfStep(newCurrentStep))
			if(stepNumberOfPreviousSibling != -1){
				var siblingStepText = this.getStepText(this.getStepFromStepNumber(stepNumberOfPreviousSibling))
				if (siblingStepText.search(/^\s*repeat\b/i) != -1) {	// we just completed an iteration of a repeat block
					currentStepMovedToRepeatStatementP = true
					this.repeatStepData.firstIterationP = false
					this.setCurrentStepNumber(stepNumberOfPreviousSibling)			// ** CurrentStep = Repeat statement **
				}
			}
			if (!currentStepMovedToRepeatStatementP){	// the normal case
				this.setCurrentStepNumber(this.getStepNumberOfStep(newCurrentStep))			// ** CurrentStep = newCurrentStep **
				if((this.getStepText(newCurrentStep).search(/^\s*repeat\b/i) != -1)) {
					// advanced by Step or Run from a step above this Repeat step, so when this step executes, it will be the first iteration of this loop
					this.repeatStepData.firstIterationP =  true
				}
			}
		}
		return true
	},	// end of advanceStep
	

	/////////////////////////////////
	//		findTargetOrWait
	////////////////////////////////
	/**
	 * Called by findTargetAndExecuteStep
	 * Returns the target, or false if the target was not found.
	 * If findTarget() does not find the target, then as long as we aren't giving up because AUTOWAIT_PERIOD seconds have passed, 
	 * 		we set up a timer on the mainChromeWindow to call this.findTargetAndExecuteStep() again after 1 second
	 * Changed Oct'11 so that the autowait is set to a large number for all cases except for "if there is a" commands
	 */
	findTargetOrWait : function() {
		//debug('findTargetOrWait: Looking for target on page... ')
		try {
			var commands = this.components.commands()
			var execEnv = this.components.executionEnvironment()
			var mainChromeWindow = execEnv.getMainBrowserWindow()
			var autowaitWindow = mainChromeWindow.setTimeout ? mainChromeWindow : mainChromeWindow.contentWindow
			
			var cmd = this.currentStep
			var targetElement = cmd.findTarget()
			if (targetElement != null) {
				//debug("findTargetOrWait: found target: " + cmd.targetElement.toString())
				this.currentState = this.STATES.FOUND_TARGET
				return targetElement
			}
			
			//debug('findTargetOrWait: findTarget did not find a target')
			if (!this.inRunModeP) {	// We're STEPping but the target wasn't found
				this.currentState = this.STATES.ERROR
				this.call(this.EVENTS.ERROR, [this.currentStepNumber, cmd, "target not found: " + cmd.targetSpec.toSlop()])
				return false
			}
			
			if (this.autowaitSecondsRemaining == null) {	// first time autowaiting
				//debug('findTargetOrWait: first time autowaiting')
				this.autowaitSecondsRemaining = AUTOWAIT_PERIOD // wait AUTOWAIT_PERIOD seconds before giving up
			}
			else if (this.autowaitSecondsRemaining > 0) {	// We're in the middle of an autowait but we still haven't found it
					this.autowaitSecondsRemaining = this.autowaitSecondsRemaining - 1
					//debug("findTargetOrWait: " + this.autowaitSecondsRemaining + " seconds remaining")
			}
			else {	// We waited, but the target never showed up
					debug('findTargetOrWait: We waited, but the target never showed up')
					this.autowaitSecondsRemaining = null
					// Invoke the error callback to notify interested parties that this step failed to execute				
					if (cmd.getAction() == commands.ACTIONS.ASSERT) {
						if (!cmd.canExecute()) {
							this.currentState = this.STATES.ERROR
							this.call(this.EVENTS.ERROR, [this.currentStepNumber, cmd, "Assertion Failed: " + cmd.toSlop()])
						}
						else {
							this.currentState = this.STATES.FOUND_TARGET
							return true	// this must be for "Assert there is not ..."  (AC)
						}
					}
					else {
						this.currentState = this.STATES.ERROR
						this.call(this.EVENTS.ERROR, [this.currentStepNumber, cmd, "Step #" + this.currentStepNumber + ". Target not found after waiting " + AUTOWAIT_PERIOD + " seconds: " + cmd.targetSpec.toSlop()])
					}
					return false
			}
			
			// We've updated autowaitSecondsRemaining
			// Try again in a second
			var _this = this
			//debug("findTargetOrWait: calling setTimeout with " +  this.autowaitSecondsRemaining + " seconds remaining for " + cmd.toSlop())
			this.currentState = this.STATES.WAITING_FOR_TARGET
			this.autowaitTimeoutID = autowaitWindow.setTimeout(function(){
												//debug("executing autowait callback of findTargetAndExecuteStep with " +  this.autowaitSecondsRemaining + " seconds remaining for " + cmd.toSlop())
												_this.findTargetAndExecuteStep()
												//debug("finished autowait callback of findTargetAndExecuteStep with " +  this.autowaitSecondsRemaining + " seconds remaining for " + cmd.toSlop())
													}, 1000)
			//debug("findTargetOrWait: called setTimeout. autowaitTimeoutID is " + this.autowaitTimeoutID.toString())
			return false

		} catch (e) {
			errorMsg("findTargetOrWait: " + e.toSource() + "/" + e.toString() + '\n')
		}	
	},

	clearAutowaitTimeout : function() {
		this.autowaitSecondsRemaining = null
		var execEnv = this.components.executionEnvironment()
		var mainChromeWindow = execEnv.getMainBrowserWindow()
		var autowaitWindow = mainChromeWindow.setTimeout ? mainChromeWindow : mainChromeWindow.contentWindow
		if (this.autowaitTimeoutID != null) {
			//debug("clearAutowaitTimeout: autowaitTimeoutID is " + this.autowaitTimeoutID.toString())
			autowaitWindow.clearTimeout(this.autowaitTimeoutID)
			this.autowaitTimeoutID = null
		}
		else {
			//debug("clearAutowaitTimeout: autowaitTimeoutID is NULL")
		}
	},
	
	
	/////////////////////////////////
	//		utility methods
	////////////////////////////////
	callStepExecutedCallback : function() {
		var execEnv = this.components.executionEnvironment()
		execEnv.callThenDoThis(this.stepExecutedCallback)
	},
	
	isStepCommentP : function(step) {
		return (step.getIndent() == 0)
	},
	
	getCurrentStep : function() {
		return this.currentStep
	},
	
	getCurrentStepIndent : function() {
		return this.currentStep.getIndent()
	},
	
	getCurrentStepText : function() {
		return this.currentStep.slop
	},
	
	getStepFromStepNumber : function(stepNumber) {
		return this.stepList[stepNumber]
	},
	
	getStepNumberOfStep : function(step) {
		return step.lineNumber
	},
	
	getStepIndent : function(step) {
		return step.getIndent()
	},
	
	getStepIndentFromStepNumber : function(stepNumber) {
		var step = this.getStepFromStepNumber(stepNumber)
		return step.getIndent()
	},
	
	getStepText : function(step) {
		return step.slop
	},
		
	// Used when 'repeat' changes a row#
	replaceStepText : function(stepNumber, text) {
		var oldStep = this.getStepFromStepNumber(stepNumber)
		var indent = oldStep.getIndent()
		var p = this.components.parser()
		var parser = new p.Parser(text)
		var step = parser.parse()
		step.setIndent(indent)
		step.setLineNumber(stepNumber)
		this.stepList[stepNumber] = step
		this.call(this.EVENTS.SLOP_CHANGED, [stepNumber, step, text])
	},
	
	getNextNonCommentStepNumber : function(stepNumber) {
		for (var i=stepNumber+1; i<this.stepList.length; i++) {
			var nextStep = this.getStepFromStepNumber(i)
			if (!this.isStepCommentP(nextStep)) return i
		}
		return false
	},
	
	getStepNumberOfPreviousSibling : function(currentStepNumber) {
		// Step back until you find a step at this indentation level
		// Abort if you encounter a step that is indented less.
		// Return its stepNumber.
		var currentIndent = this.getStepIndentFromStepNumber(currentStepNumber)
		for (var stepNumber=currentStepNumber-1; stepNumber>=0; stepNumber--) {
			var stepIndent = this.getStepIndentFromStepNumber(stepNumber)
			if (stepIndent == 0) continue;	// ignore comments
			if (stepIndent == currentIndent) return stepNumber
			if (stepIndent < currentIndent) return -1
		}
		return -1
	},
	
	getStepNumberOfNextSibling : function(currentStepNumber) {
		// Step forward until you find a step at this indentation level
		// Abort if you encounter a step that is indented less.
		// Return its stepNumber.
		var currentIndent = this.getStepIndentFromStepNumber(currentStepNumber)
		for (var stepNumber=currentStepNumber+1; true; stepNumber++) {
			var step = this.getStepFromStepNumber(stepNumber)
			if (!step) return -1
			var stepIndent = this.getStepIndentFromStepNumber(stepNumber)
			if (stepIndent == 0) continue;	// ignore comments
			if (stepIndent == currentIndent) return stepNumber
			if (stepIndent < currentIndent) return -1
		}
		return -1
	},
	
	// Is containedStepNumber contained in a repeat block? If so, return the stepNumber of the first step of the repeat block. Else, return -1
	getStepNumberOfRepeatStatementContainingStepNumber : function(containedStepNumber) {
		// Go back from containedStepNumber until you get to a step with indent = 1.
		//If any step encountered on the way is a repeat, it is a repeat block that contains this step.
		var stepNumberOfRepeatStatement = -1
		for (var stepNumber=containedStepNumber-1; stepNumber>=0; stepNumber--) {
			var step = this.getStepFromStepNumber(stepNumber)
			var stepText = this.getStepText(step)
			var stepIndent = this.getStepIndentFromStepNumber(stepNumber)
			if (stepIndent == 0) continue;
			if (stepText.search(/\s*repeat\b/i) != -1) return stepNumber
			if (stepIndent == 1) return -1
		}
		return -1
	},
	
	getLastStepNumberInThisRepeatBlock : function(stepNumberOfRepeatStatement) {
		// Go forward until you find a step at this indentation level or less, or the end of the script
		// the step before that is the last step of this repeat block
		if (!stepNumberOfRepeatStatement) stepNumberOfRepeatStatement = this.currentStepNumber // Assume this.getCurrentStep() is a Repeat step
		var repeatIndent = this.getStepIndentFromStepNumber(stepNumberOfRepeatStatement)
		for (var stepNumber=stepNumberOfRepeatStatement+1; true; stepNumber++) {
			var step = this.getStepFromStepNumber(stepNumber)
			if (!step) return stepNumber-1
			var stepIndent = this.getStepIndentFromStepNumber(stepNumber)
			if (stepIndent == 0) continue;	// ignore comments
			if (stepIndent <= repeatIndent) return stepNumber-1
		}
	},
	
	setInfiniteLoopP : function() {
		// Assumes this.getCurrentStep() is a Repeat step
		// If there are no scratchtable references, this is an infinite loop	
		// look in the current Repeat block for a row reference
		var firstStepNumberOfRepeatBlock = this.currentStepNumber
		var lastStepNumberOfRepeatBlock = this.getLastStepNumberInThisRepeatBlock(firstStepNumberOfRepeatBlock)
		for (var stepNumber=firstStepNumberOfRepeatBlock; stepNumber<=lastStepNumberOfRepeatBlock; stepNumber++) {
			var step = this.getStepFromStepNumber(stepNumber)
			var stepText = this.getStepText(step)
			if (stepText.indexOf("scratchtable") != -1 || stepText.indexOf("scratchspace") != -1) {
				this.repeatStepData.infiniteLoopP = false
				return false
			}
		}
		this.repeatStepData.infiniteLoopP = true
		return true		
	},

	updateScratchtableRowNumberReferences : function(newScratchtableRowNumber) {
		// called by RepeatStep's execute() when the currentStep is a Repeat step
		// updates scratchtableRowNumber references in all steps from firstStepNumberOfRepeatBlock to lastStepNumberOfRepeatBlock
		var u = this.components.utils()
		var firstStepNumberOfRepeatBlock = this.currentStepNumber
		var lastStepNumberOfRepeatBlock = this.getLastStepNumberInThisRepeatBlock(firstStepNumberOfRepeatBlock)
		for (var stepNumber=firstStepNumberOfRepeatBlock; stepNumber<=lastStepNumberOfRepeatBlock; stepNumber++) {
			var step = this.getStepFromStepNumber(stepNumber)
			var stepText = this.getStepText(step)
			if (stepText.indexOf("scratchtable") != -1 || stepText.indexOf("scratchspace") != -1) {
				// a step with a scratchtable reference needs to be modified if it uses a literal to reference its rowNumber
				var regexp = /(\brow\b\s*)(\d+)/gi	// finds digits following "row".  Can change this later to allow variableValues
				var matchResult = null
				while ((matchResult = regexp.exec(stepText)) != null){	// iterate because there might be multiple row references in the step
					var rowNumberString = matchResult[2]
					var startIndex = matchResult.index + matchResult[1].length
					var endIndex = startIndex + matchResult[2].length
					var stepCurrentScratchtableRowNumber = Number(rowNumberString)	// for debugging; not used
					stepText = stepText.substring(0,startIndex) + newScratchtableRowNumber.toString() + stepText.substring(endIndex)
				}
				this.replaceStepText(stepNumber, stepText)
			}	// end of if the step contains a scratchtable reference
		}	// end of For every step in the Repeat block
		this.setCurrentStepNumber(firstStepNumberOfRepeatBlock)
	},


	///////////////////////////////
	//		event listeners
	///////////////////////////////
	eventTypes: {
		'advancestep' : [],
		'previewcurrentstep': [],
		'doneexecuting': []
	},
	
	/**
	 * Register a listener on the specified event.  The list of events is
	 * specified by ExecutionEngine.EVENTS
	 */
	setListener : function(eventName, cb) {
		this._cb[eventName] = cb
	},

	/**
	 * Remove the listener on the specified event.  If there was no
	 * listener for that event, nothing is done.
	 */
	removeListener : function(eventName) {
		this._cb[eventname] = null
	},

	addEventListener: function(topic,callback){
		if(this.eventTypes[topic] !== null ){
			this._addEventListener(this.eventTypes[topic], callback)
		}
	},

	removeEventListener: function(topic,callback){
		if(this.eventTypes[topic] !== null ){
			this._removeEventListener(this.eventTypes[topic], callback)
		}
	},

	notifyEventListeners: function(topic){
		if(this.eventTypes[topic] !== null ){
			for(var j=0;j<this.eventTypes[topic].length;j++){
				try{
					var event = {topic:topic, currentStep:this.currentStep}
					this.eventTypes[topic][j](event)
				}catch(e){
					this._removeEventListener(this.eventTypes[topic], this.eventTypes[topic][j])
				}			
			}
		}
	},

	containsEventListener:function(topic,callback){
		if(this.eventTypes[topic] !== null ){
			return ( this._indexOfEventListener(this.eventTypes[topic],callback) !=-1 )
		}
		return false 
	},

	_indexOfEventListener:function(listeners,callback){
		var i = 0 
		for(i=0;i<listeners.length;i++){
			if(listeners[i]===callback){
				return i 
			}
		}
		return -1
	},

	_addEventListener:function(listeners,callback){
		if(this._indexOfEventListener(listeners,callback) == -1){
			listeners.push(callback)
		}
	},

	_removeEventListener:function(listeners,callback){
		var index = this._indexOfEventListener(listeners,callback)
		if(index != -1){
			var removed = listeners.splice(index,1)
		}
	},

}	// end of ExecutionEngine methods

var executionEngine = new ExecutionEngine()
//debug('done parsing coscripter-execution-engine.js')