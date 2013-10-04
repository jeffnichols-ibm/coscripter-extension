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
Contributor(s): Tessa Lau <tessalau@us.ibm.com>

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

var EXPORTED_SYMBOLS = ["preview"];

//======================================================
// Debug Section
var filename = 'coscripter-preview.js';
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

var Preferences = {
    DO_CONSOLE_DEBUGGING        : false,
    DO_DUMP_DEBUGGING           : false
}

function debug(msg){
    if(Preferences.DO_CONSOLE_DEBUGGING){
        consoleService.logStringMessage(filename + ": " + msg );
    }
	if(Preferences.DO_DUMP_DEBUGGING){
        dump(filename + ": " + msg + "\n");
    }
}
// End Debug Stuff 
//======================================================

debug('parsing');


function getCoScripterPreview(){
	return registry.preview();
}

function CoScripterPreview(){
    this.components = registry ;
    return this;
}

CoScripterPreview.prototype ={
	createAnchoredBubble : function(node, slop, stepNum, totalSteps, slopID) {
		// Create the DIV containing the slop instruction.
		var slopDiv = node.ownerDocument.createElement('div');

		slopDiv.innerHTML =
			"<div align='left' style='text-align: left; align: left; font-size: 12pt; font-family: Tahoma, sans-serif;'><b><label for='" + slopID + "'>Step " + stepNum + " of " +
				totalSteps + ": </label></b><br/>" +
				"<div tabindex='0' id='" +
				slopID + "'>" + slop + "</div></div>";

		slopDiv.style.padding = "0.5em";

		var slopContainer = node.ownerDocument.createElement('div');

		// Append the slop DIV and set its width so we can figure
		// out what height it will have.
		slopContainer.appendChild(slopDiv);
		// This might not be needed, because we reparent it inside the
		// bubble down below
		node.ownerDocument.body.appendChild(slopContainer);

		var slopw = slopContainer.offsetWidth;
		var sloph = slopContainer.offsetHeight;

		// Create the big highlight.
		var divs_ref = this.components.utils().makeBigArrowHighlight(node);

		// Reparent the slopContainer to be inside the slopholder
		divs_ref.slopholder.appendChild(slopContainer);

		// Set the height of the slop holder equal to the height
		// of the DIV containing the slop itself.
		divs_ref.slopholder.style.height = slopDiv.offsetHeight + 'px';

		// Buttons should be no taller than this.
		divs_ref.buttonholder.style.height = "30px";

		this._createOnStepDiv(divs_ref.buttonholder, stepNum);

		divs_ref.buttonholder.style.top =
			(parseInt(divs_ref.slopholder.style.top) +
			 divs_ref.slopholder.offsetHeight) + "px";

		var middleheight = (parseInt(divs_ref.slopholder.offsetHeight) +
			parseInt(divs_ref.buttonholder.offsetHeight)) + "px";

		divs_ref.arrowcontainermiddle.style.height = middleheight;

		divs_ref.slopholder.style.backgroundColor = "#0FF;";

		divs_ref.arrowcontainerbottom.style.top =
			parseInt(divs_ref.arrowcontainermiddle.offsetHeight) +
				parseInt(divs_ref.arrowcontainermiddle.style.top) + "px";

		// Figure out what offset we need to use to guard against
		// this being a node within an absolutely positioned element.
		var testDiv = node.ownerDocument.createElement('div');
		testDiv.innerHTML = "&nbsp;";
		testDiv.style.position = "absolute";
		testDiv.style.left = "0";
		testDiv.style.top = "0";
		node.parentNode.appendChild(testDiv);

		var testPos = this.components.utils().getNodePosition(testDiv);
		var offsetLeft = -(testPos.x);
		var offsetTop = -(testPos.y);

		if(offsetLeft != 0 || offsetTop != 0) {
			divs_ref.slopholder.style.left = (parseInt(divs_ref.slopholder.style.left) + offsetLeft) + "px";
			divs_ref.slopholder.style.top = (parseInt(divs_ref.slopholder.style.top) + offsetTop) + "px";					

			divs_ref.buttonholder.style.left = (parseInt(divs_ref.buttonholder.style.left) + offsetLeft) + "px";
			divs_ref.buttonholder.style.top = (parseInt(divs_ref.buttonholder.style.top) + offsetTop) + "px";					
		}

		previewConf = {
			divs : divs_ref,
			target : node,
		};

		return previewConf;
	},

	createUnanchoredBubble : function(doc, slop, stepNum, totalSteps, slopID) {
		// Create the DIV containing the slop instruction.
		var slopDiv = doc.createElement('div');

		slopDiv.style.textAlign = 'left';
		slopDiv.style.align = 'left';
		slopDiv.style.fontFamily = "Tahoma, sans-serif";
		slopDiv.style.fontSize = "12pt";
		slopDiv.innerHTML =
			"<b><label for='" + slopID + "'>Step " + stepNum + " of " +
				totalSteps + ":&nbsp;&nbsp;</label></b>" +
				"<div tabindex='0' " +
				"style='border: none; padding: 0; height: 1.2em;' id='" +
				slopID + "'>" + slop + "</div>";

		var slopContainer = doc.createElement('div');
		slopContainer.style.textAlign = "center";
		slopContainer.style.align = "left";
		slopContainer.appendChild(slopDiv);
		// Set the slopContainer's width to be 250 pixels less wide than
		// the current document
		slopContainer.style.width = (doc.body.offsetWidth - 250) + "px";

		// Need to append it to the body so that it gets sized properly
		doc.body.appendChild(slopContainer);

		var divs_ref = this.components.utils().makeBigArrowInfoHighlight(doc);

		divs_ref.slopholder.style.width = slopContainer.offsetWidth + "px";
		divs_ref.infocontainermiddle.style.width = slopContainer.offsetWidth + "px";
		// Reposition the right side of the box to be adjacent to the
		// middle, given the middle's new width
		divs_ref.infocontainerright.style.left =
			(parseInt(divs_ref.infocontainermiddle.style.left) +
				divs_ref.infocontainermiddle.offsetWidth) + "px";

		// Reparent the slopContainer to the slopholder
		divs_ref.slopholder.appendChild(slopContainer);

		// Move the buttonholder div to the right place
		// The "10" here is an arbitrary magic number to position the
		// button at the right height
		divs_ref.buttonholder.style.top = (parseInt(divs_ref.slopholder.style.top) + divs_ref.slopholder.offsetHeight - 10) + "px";

		// Set the height of the slop holder equal to the height
		// of the DIV containing the slop itself.
		divs_ref.slopholder.style.height = slopDiv.offsetHeight + "px";

		// Buttons should be no taller than this.
		divs_ref.buttonholder.style.height = "30px";
		divs_ref.buttonholder.style.width = slopContainer.offsetWidth + "px";

		this._createOnStepDiv(divs_ref.buttonholder, stepNum);

		// Center the DIVs.
		var offsetLeft =
			Math.floor((doc.body.offsetWidth - (divs_ref.infocontainerleft.offsetWidth + divs_ref.infocontainermiddle.offsetWidth +
				divs_ref.infocontainerright.offsetWidth)) / 2);
		divs_ref.infocontainerleft.style.left = offsetLeft + "px";
		divs_ref.infocontainermiddle.style.left =
			(parseInt(divs_ref.infocontainerleft.style.left) + divs_ref.infocontainerleft.offsetWidth) + "px";
		divs_ref.infocontainerright.style.left =
			(parseInt(divs_ref.infocontainermiddle.style.left) + divs_ref.infocontainermiddle.offsetWidth) + "px";

		divs_ref.slopholder.style.left =
			(parseInt(divs_ref.slopholder.style.left) + offsetLeft) + "px";

		divs_ref.buttonholder.style.left =
			(parseInt(divs_ref.buttonholder.style.left) + offsetLeft) + "px";


		var previewConf = {
			divs : divs_ref,
			target : null,
		};

		return previewConf;
	},

	_createOnStepDiv : function(parentDiv, stepNum){
		var stepDiv = parentDiv.ownerDocument.createElement('div');

		stepDiv.style.textAlign = "center";
		stepDiv.innerHTML =
		/*
			'<button id="coscripter_previous_step" onclick="return false;" style="">' +
			'<img src="chrome://coscripter/skin/images/step-back.gif" alt="Previous Step">' +
			'</button>' +
		*/
			'<button id="coscripter_step" onclick="return false;">' +
			'<img src="chrome://coscripter/skin/images/step.gif" alt="Complete Step ' + stepNum + '">' +
			'</button>';
						
		stepDiv.style.padding = "0.0em";
		stepDiv.style.margin = "0.5em";

		parentDiv.appendChild(stepDiv)

		// Add the onStep() listener to the Step button.
		//setTimeout(function(){
		var stepbut = parentDiv.ownerDocument.getElementById('coscripter_step');
		var coscripter = this.components.utils().getCurrentCoScripterWindow();
		stepbut.addEventListener("click", function(e) {e.stopPropagation();
			coscripter.onStep(); return false;}, false);

		// TL: this doesn't work yet
		/*
		var previousbut = parentDiv.ownerDocument.getElementById('coscripter_previous_step');
		previousbut.addEventListener("click", function(e) {e.stopPropagation(); onStop(); return false;}, false);
		*/

		//stepDiv.style.height = "30px";
		//stepDiv.style.width = "180px";

		return stepDiv;
	}
}
var preview  = new CoScripterPreview();

debug('done');
