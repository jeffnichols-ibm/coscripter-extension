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

var CoScripterScratchSpaceOverlay = {
	
	// CoScripter has a global variable: scratchSpaceUI
	getScratchSpaceUI: function() {
		return CoScripterScratchSpaceOverlay.getCoScripterObject().scratchSpaceUI;
	},
	
	getTargetWindow: function() {
		// Kinda hacky: we assume that window is either a browser window (i.e., has the coscripter and gBrowser objects), or that window was opened from a browser window.
		if (window.top.coscripter) return window.top
		else return window.opener.top
	},
	
	getCoScripterObject: function() {
		return CoScripterScratchSpaceOverlay.getTargetWindow().top.coscripter;
	},
	
	getUtils: function() {
		return CoScripterScratchSpaceOverlay.getCoScripterObject().components.utils();
	},
	
	getCoScripterSidebar: function() {
		var win = CoScripterScratchSpaceOverlay.getTargetWindow();
		return CoScripterScratchSpaceOverlay.getUtils().getCoScripterWindow(win);		
	},
	
	getScratchSpaceEditor: function() {
		return CoScripterScratchSpaceOverlay.getScratchSpaceUI().getEditor();
	},
	
	getCurrentTableIndex: function() {
		return CoScripterScratchSpaceOverlay.getScratchSpaceEditor().getCurrentTableIndex();
	},
	
	getCurrentTable: function() {
		var scratchSpace = CoScripterScratchSpaceOverlay.getScratchSpaceUI().getScratchSpace();
		return scratchSpace.getTables()[CoScripterScratchSpaceOverlay.getCurrentTableIndex()];
	},
	
	newScriptClicked: function(event) {
		CoScripterScratchSpaceOverlay.getTargetWindow().top.coscripter.startNewProcedureInSidebar();
	},

	extractClicked: function(event) {
		var w = CoScripterScratchSpaceOverlay.getTargetWindow();
		var c = CoScripterScratchSpaceOverlay.getCoScripterObject();
		var d = c.DataExtraction;
		if (!d.inExtractionMode()) {
			// start extracting. These methods are in data-extraction-mode.js
			d.startExtractionMode(w.top.gBrowser.selectedBrowser, c.scratchSpaceUI);
			d.onPerformContentSelection(function() {d.onElementSelected.apply(d, arguments);});
			event.target.label = "Done Selecting. Import Data";
		}
		else {
			// stop extracting
			//d.createExtractionScript();
			d.extract();
			event.target.label = "Import Data from Web Page...";
			var coscripterSidebar = this.getCoScripterSidebar()
			var coscripter = this.getCoScripterObject()
			var commands = coscripter.components.commands();
			var execEnv = coscripter.components.executionEnvironment();
			var scratchSpaceUI = CoScripterScratchSpaceOverlay.getScratchSpaceUI()
			var scratchSpace = scratchSpaceUI.getScratchSpace();
			if (coscripterSidebar.recording) {
				//var titleBox = scratchSpaceUI.getTitleTextBox()
				var title = scratchSpace.getTitle()
				var slop = 'extract the \"' + title + '\" scratchtable'
				var commandObj = commands.createExtractFromSlop(slop, execEnv)
				coscripterSidebar.receiveRecordedCommand(commandObj)
			}
		}
	},
	
	refreshTableClicked: function(event) {
		var sidebar = CoScripterScratchSpaceOverlay.getCoScripterSidebar();
		var editor = CoScripterScratchSpaceOverlay.getScratchSpaceEditor();
		var t = CoScripterScratchSpaceOverlay.getCurrentTableIndex();
		var table = CoScripterScratchSpaceOverlay.getCurrentTable();
		var log = table.getLog();
		
		// Delete all rows except the first one
		for (var i = 1, n = editor.getDataRowCount(t); i < n; i++) {
			editor.deleteRow(t, 1);
		}
		
		// Clear the data in the first row
		for (var j = 0, m = editor.getDataColumnCount(t); j < m; j++) {
			editor.setData(t, 0, j, "");
		}
		
		// Run through the log actions
		var commandProcessor = sidebar.getCommandProcessor();
		var i = 0;
		table.setLoggingEnabled(false);
		commandProcessor.addEventListener('doneexecuting', function() {
			i++;
			if (i < log.length) {
				var action = log[i];
				action.run(editor);
			}
			else {
				commandProcessor.removeEventListener('doneexecuting', arguments.callee);
				table.setLoggingEnabled(true);
			}
		})
		if (log.length >= 1) {
			var action = log[i];
			action.run(editor);
		}
	},
	
	copyTableToClipboardClicked: function(event) {
		var editor = CoScripterScratchSpaceOverlay.getScratchSpaceEditor();
		var t = CoScripterScratchSpaceOverlay.getCurrentTableIndex();
		
		var data = [];

		var colHeaders = [];
		for (var j = 0, m = editor.getDataColumnCount(t); j < m; j++) {
			colHeaders.push(editor.getDataColumnName(t, j));
		}
		data.push(colHeaders.join('\t'));
		
		for (var i = 0, n = editor.getDataRowCount(t); i < n; i++) {
			var row = [];
			for (var j = 0, m = editor.getDataColumnCount(t); j < m; j++) {
				row.push(editor.getData(t, i, j));
			}
			data.push(row.join('\t'));
		}
		
		var dataStr = data.join('\n');

		CoScripterScratchSpaceOverlay.getUtils().sendToClipboard(dataStr);		
	},
	
	pasteClipboardToTableClicked: function(event) {
		var clipText = CoScripterScratchSpaceOverlay.getUtils().getClipboardContentsAsText();
		if (clipText == null) {
			return;
		}
		
		var t = CoScripterScratchSpaceOverlay.getCurrentTableIndex();
		var editor = CoScripterScratchSpaceOverlay.getScratchSpaceEditor();
		var treeView = editor.getTreeBoxObject(t).view;
		
		// Fill in the table
		var data = clipText.split('\n');
		var dataRowCount = data.length - 1
		if (data[data.length - 1] == "") {
			data.splice(dataRowCount, 1);
		}

		// Make sure there are enough rows
		var numRows = editor.getDataRowCount(t);
		for (var i = 0, rowsNeeded = dataRowCount - numRows; i < rowsNeeded; i++) {
			editor.addRow(t);
		}
		
		for (var i = 0; i <= dataRowCount; i++) {
			var row = data[i].split('\t');
			
			// Make sure there are enough columns
			var numCols = editor.getDataColumnCount(t);
			for (var j = 0, colsNeeded = row.length - numCols; j < colsNeeded; j++) {
				editor.addColumn(t);
			}
			
			for (var j = 0, m = row.length; j < m; j++) {
				var datum = row[j];
				editor.setData(t, i-1, j, datum);
			}
		}
	}
}
