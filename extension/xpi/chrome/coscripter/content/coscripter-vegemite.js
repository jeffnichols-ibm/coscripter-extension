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

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// Modified from Jeff Wong's original content/vegemite/vegemite-sidebar.js
var Vegemite = {}		

Vegemite.substituteRow = function(procedure, row) {
	var newBodyLines = procedure.getBody().split('\n');
	var oldRowStr = /of row \d+/;
	var newRowStr = "of row "
	newRowStr += (row + 1)
	var oldNumberStr = /the number \d+/;	// where 'the number 3' is used instead of 'the third' as a disambiguator
	var newNumberStr = "the number "
	newNumberStr += (row + 1)
	
	// Split the procedure by line
	// For each line
	//   If the line is slop (and not comment or blank)
	// 		Replace the "row" text
		
	for (var i = 0, n = newBodyLines.length; i < n; i++) {
		var line = newBodyLines[i];
		if (isSlopStep(line)) {
			var newStep = line.replace(oldRowStr, newRowStr)					
			newStep = newStep.replace(oldNumberStr, newNumberStr)					
			newBodyLines[i] = newStep;
		}
	}
	procedure.setBody(newBodyLines.join('\n'));
}


// returns true if we should do another iteration
Vegemite.doNextIterationP = function () {
	/*  from JeffW's version of vegemite
	if (! Vegemite.scratchSpaceActiveP()) {return;}
	// TODO:  switch back to the active scratch space and close any tabs that the previous iteration of the script opened.
	*/
	try {
		if (window.top.coscripter.currentScratchSpaceEditor) {
			var scratchSpaceEditor = window.top.coscripter.currentScratchSpaceEditor;
			if (currentProcedure.currentRowIndex == -1) {
				return false;
			}
			//TODO uncheck current entry
			
			currentProcedure.currentRowIndex++;

			// If there aren't any more, stop iterating
			if (currentProcedure.currentRowIndex == currentProcedure.selectedRows.length) {
				currentProcedure.currentRowIndex = -1;
				return false;
			}
			
			var currentRow = currentProcedure.selectedRows[currentProcedure.currentRowIndex];
			Vegemite.substituteRow(currentProcedure, currentRow);
			var currentTable = scratchSpaceEditor.getScratchSpace().getTables()[scratchSpaceEditor.getCurrentTableIndex()]; 
			currentTable.logAction(new ScratchSpaceTable.RunScriptAction(currentProcedure.scriptjson.id, currentRow));
			loadProcedureIntoInteractor(currentProcedure.getBody())

			return true;
		}
	}
	catch (e) {
		if (e.name = "StopIteration") {
			dump ("stop iteration\n")
		}
		else throw e
	}
}	//end of doNextIterationP
