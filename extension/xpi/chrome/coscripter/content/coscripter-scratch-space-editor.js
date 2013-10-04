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
// coscripter-scratch-space-browser-overlay.js, coscripter-scratch-space-editor.js and coscripter-data-extraction-mode.js are all loaded into Firefox's mainChromeWindow
// Debug method for all coscripter files loaded into Firefox's mainChromeWindow is coscripter.debug, defined in coscripter-browser-overlay.js

/////////////////////////
//
//	constructSpaceUI
//	constructTableUI
//	saveScratchSpace
//	importDataFile
//	getDataColumnName
//
/////////////////////////

/**
 * Opens a blank editor within the specific UI in the specified window (i.e. the docked or the floating window)
 */
var CoScripterScratchSpaceEditor = function(scratchSpaceUI, browserWindow, editorWindow, context) {
	// 'context' is the constant spaceUI.FLOATING_WINDOW or spaceUI.DOCKED_PANE
    this.components = registry ;
	this.scratchSpaceUI = scratchSpaceUI;	// Coscripter has a global var scratchSpaceUI, which is defined in coscripter-scratch-space-browser-overlay.js
	this.browserWindow = browserWindow;
	this.editorWindow = editorWindow;
	this.parent = scratchSpaceUI.getEditorAttachPoint(context);
	this.context = context;
	this.selectAll = [];  // list of booleans, length is number of tables
	this.cellMetaData = []; // cellMetaData[0][4][2] returns the metaData of table 0, row 4, col 2
	this.extractionXPathList = []; // extractionXPathList[0] is table 0's list of pairs { url : "http://movies.netflix.com/Queue?qtype=DD" , extractionXPaths : [
	
	//A ScratchSpace is a list of Tables. A Table contains the actual data that is displayed in a CoScripterScratchSpaceEditor.
	this.scratchSpace = scratchSpaceUI.getScratchSpace();	
	this.constructSpaceUI(context);
}

CoScripterScratchSpaceEditor.prototype = {
	//	constructSpaceUI
	constructSpaceUI: function(context) {
		// There is no xul file for the CoScripterScratchSpaceEditor. It is constructed by this method.
		var doc = this.getDocument();
		
		// Set the title
		this.titleTextBox = this.scratchSpaceUI.getTitleTextBox(context);
		this.titleTextBox.value = this.scratchSpace.getTitle();
		
		// Start laying out the editor
		this.scratchSpaceContainer = doc.createElement("vbox");
		//this.scratchSpaceContainer.setAttribute("width", "800");
		this.scratchSpaceContainer.setAttribute("flex", 1);
		this.scratchSpaceContainer.setAttribute("id", "coscripterScratchSpaceEditor");

		var that = this;
		
		// Add tabs for each table
		var tabBox = doc.createElement("tabbox");
		this.scratchSpaceContainer.appendChild(tabBox);
		tabBox.setAttribute("flex", 1);
		
		var tabPanels = doc.createElement("tabpanels");
		tabBox.appendChild(tabPanels);
		tabPanels.setAttribute("style", "border-bottom: 0px solid");
		tabPanels.setAttribute("flex", 1);
		
		this.tableUIs = [];
		
		var scratchSpaceTables = this.scratchSpace.getTables();
		var runMenu = this.scratchSpaceUI.getScriptsMenu(context);
		while (runMenu.firstChild) {
			runMenu.removeChild(runMenu.firstChild);
		}
	
		for (var tableNum = 0, numTables = scratchSpaceTables.length; tableNum < numTables; tableNum++) {
			var table = scratchSpaceTables[tableNum];
			
			var tabPanel = doc.createElement("tabpanel");
			tabPanels.appendChild(tabPanel);
			
			// Add the spreadsheet editor for the table
			var newTableUI = this.constructTableUI(tableNum);
			this.tableUIs.push(newTableUI);
			tabPanel.appendChild(newTableUI);

			// Add button for running scripts
			var runMenuPopup = doc.createElement("menupopup");
			runMenu.appendChild(runMenuPopup);

			var numScripts = table.getScriptCount();
			for (var i = 0; i < numScripts; i++) {
				var script = table.getScript(i);
				this.addScriptToRunMenu(script, runMenu, runMenuPopup);
			}

			if (tableNum != 0) {
				runMenuPopup.setAttribute("hidden", "true");
			}
			else {
				runMenu.disabled = (numScripts == 0);
			}
			
			//TODO when the current table is changed, enable the right popup
			// in the Run menu
		}
		
		var tabs = doc.createElement("tabs");
		this.tabs = tabs;
		tabs.setAttribute("class", "tabs-bottom");
		
		tabBox.appendChild(tabs);
		for (var tableNum = 0, numTables = scratchSpaceTables.length; tableNum < numTables; tableNum++) {
			var table = scratchSpaceTables[tableNum];
			
			var tab = doc.createElement("tab");
			tabs.appendChild(tab);

			tab.setAttribute("class", "tab-bottom");
			tab.setAttribute("label", table.getTitle());
		}
		
		this.parent.appendChild(this.scratchSpaceContainer);

		// Listen for events from the table
		for (var tableNum = 0, numTables = scratchSpaceTables.length; tableNum < numTables; tableNum++) {
			var table = scratchSpaceTables[tableNum];
			table.addEventListener("scriptAdded", function(event) {
				that.scriptAdded(event);
			}, true);
		}
	},	// end of constructSpaceUI

	//	constructTableUI	
	constructTableUI: function(index) {
		var that = this;
		var treeColElem = null, splitterElem = null, treeItemElem = null, treeRowElem = null, treeCellElem = null;

		var doc = this.getDocument();
		var scratchSpaceTable = this.scratchSpace.getTables()[index];
		
		// Add XUL table
		var treeElem = doc.createElement("tree");
		treeElem.setAttribute("id", "coscripter-scratch-space-table-editor-" + index);
		treeElem.setAttribute("flex", "1");
		treeElem.setAttribute("seltype", "cell");
		treeElem.setAttribute("editable", "true");
		treeElem.setAttribute("hidecolumnpicker", "true");
		treeElem.setAttribute("enableColumnDrag", "true");
		
		//treeElem.setAttribute("style", "position:absolute; left: " + tablePos.left + "px; top: " + tablePos.top + "px; height:auto; width:" + this.table.tableElem.clientWidth + "px");
		//treeElem.setAttribute("style", "height:auto; width:" + this.table.tableElem.clientWidth + "px");

		// A xul tree consists of two parts: treecols (the set of columns); and treechildren (the tree body which contains the data)
		////  treecols  \\\\
		var treeColsElem = doc.createElement("treecols");
		treeElem.appendChild(treeColsElem);
		var ordinal = 1;
			// Add checkbox column for selecting rows
		treeColElem = doc.createElement("treecol");
		treeColElem.setAttribute("type", "checkbox");
		treeColElem.setAttribute("editable", "true");
		treeColElem.setAttribute("src", "chrome://global/skin/checkbox/cbox-check.gif");
		treeColElem.setAttribute("class", "treecol-image");
		treeColElem.setAttribute("flex", "1");
		treeColElem.setAttribute("maxwidth", "20");
		treeColElem.setAttribute("ordinal", ordinal);
		treeColElem.addEventListener('click', function(event) {
			that.selectAllColHeaderClicked(event);
		}, true);
		this.selectAll.push(true);
		ordinal++;
		treeColsElem.appendChild(treeColElem);
		
		splitterElem = doc.createElement("splitter");
		splitterElem.setAttribute("class", "tree-splitter");
		splitterElem.setAttribute("ordinal", ordinal);
		ordinal++;
		treeColsElem.appendChild(splitterElem);
		
			// Add column for displaying the row number
		treeColElem = doc.createElement("treecol");
		treeColElem.setAttribute("editable", "false");
		treeColElem.setAttribute("flex", "1");
		treeColElem.setAttribute("maxwidth", "40");
		treeColElem.setAttribute("ordinal", ordinal);
		ordinal++;
			// Add keypress handler to detect a backspace to delete this row
		treeElem.addEventListener('keypress', function(event) {
			that.cellKeypress(event);
		}, false);
		treeColsElem.appendChild(treeColElem);
		
		splitterElem = doc.createElement("splitter");
		splitterElem.setAttribute("class", "tree-splitter");
		splitterElem.setAttribute("ordinal", ordinal);
		ordinal++;
		treeColsElem.appendChild(splitterElem);
		
			// Add columns for data
		for (var colNum = 0, numCols = scratchSpaceTable.getColumnCount(); colNum < numCols; colNum++) {
			treeColElem = doc.createElement("treecol");
			//treeColElem.setAttribute("label", String.fromCharCode(colNum + "A".charCodeAt(0)));
			treeColElem.setAttribute("label", String(colNum + 1))
			treeColElem.setAttribute("flex", "1");
			//treeColElem.setAttribute("width", "100");
			treeColElem.setAttribute("maxwidth", "250");
			treeColElem.setAttribute("ordinal", ordinal);
			ordinal++;
			treeColsElem.appendChild(treeColElem);

			splitterElem = doc.createElement("splitter");
			splitterElem.setAttribute("class", "tree-splitter");
			splitterElem.setAttribute("ordinal", ordinal);
			ordinal++;
			treeColsElem.appendChild(splitterElem);
		}
		
			// Add column for adding a column
		treeColElem = doc.createElement("treecol");
		treeColElem.setAttribute("label", "+");
		treeColElem.setAttribute("editable", "false");
		treeColElem.setAttribute("flex", "1");
		treeColElem.setAttribute("maxwidth", "35");
		treeColElem.setAttribute("ordinal", ordinal);
		ordinal++;
		treeColElem.addEventListener('click', function(event) {
			that.addColumn(index);
		}, true);
		treeColsElem.appendChild(treeColElem);
		//// end of treecols \\\\


		////  treechildren  \\\\
		// Using a Content Tree View (see https://developer.mozilla.org/en/XUL_Tutorial/Trees#The_Content_Tree_View )
		//events are sent to the treeChildrenElem element
		var treeChildrenElem = doc.createElement("treechildren");	
		treeElem.appendChild(treeChildrenElem);

		// First Row: Put in a row for editable column headers
		treeItemElem = doc.createElement("treeitem");
		treeChildrenElem.appendChild(treeItemElem);
		treeRowElem = doc.createElement("treerow");
		treeItemElem.appendChild(treeRowElem);
			// Add checkbox cell
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("class", "checkbox-cell");
		treeCellElem.setAttribute("properties", "disabled");
		treeCellElem.setAttribute("editable", "false");
		treeRowElem.appendChild(treeCellElem);
			// Add row number cell
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("properties", "disabled");
		treeCellElem.setAttribute("editable", "false");
		treeRowElem.appendChild(treeCellElem);
			// Add cells for column headers
		for (var colNum = 0, numCols = scratchSpaceTable.getColumnCount(); colNum < numCols; colNum++) {
			treeCellElem = doc.createElement("treecell");
			treeRowElem.appendChild(treeCellElem);
			treeCellElem.setAttribute("label", scratchSpaceTable.getColumnNameAt(colNum));
			treeCellElem.setAttribute("properties", "header");
		}
			// Add "+" cell for adding a column
		treeCellElem = doc.createElement("treecell");
		treeRowElem.appendChild(treeCellElem);
		treeCellElem.setAttribute("properties", "disabled");
		treeCellElem.setAttribute("editable", "false");
		treeCellElem.setAttribute("label", "");
		// end of First Row

		// Data Rows: Add rows for the table data itself
		for (var rowNum = 0, numRows = scratchSpaceTable.getRowCount(); rowNum < numRows; rowNum++) {
			treeItemElem = doc.createElement("treeitem");
			treeChildrenElem.appendChild(treeItemElem);
			treeRowElem = doc.createElement("treerow");
			treeItemElem.appendChild(treeRowElem);
			// Add checkbox cell
			treeCellElem = doc.createElement("treecell");
			treeCellElem.setAttribute("class", "checkbox-cell");
			treeCellElem.setAttribute("properties", "header");
			treeRowElem.appendChild(treeCellElem);
			// Add row number cell
			treeCellElem = doc.createElement("treecell");
			treeCellElem.setAttribute("properties", "header");
			treeCellElem.setAttribute("editable", "false");
			treeCellElem.setAttribute("label", (rowNum + 1));
			treeRowElem.appendChild(treeCellElem);
			// ** Add cells for table data **
			for (var colNum = 0, numCols = scratchSpaceTable.getColumnCount(); colNum < numCols; colNum++) {
				treeCellElem = doc.createElement("treecell");
				treeRowElem.appendChild(treeCellElem);
				treeCellElem.setAttribute("label", scratchSpaceTable.getDataAt(rowNum, colNum));	//editor.setData
				//treeBoxObject.view.setCellValue(rowIndex + 1, treeBoxObject.columns[columnIndex + 2],metaData)
				var metaData = scratchSpaceTable.getMetaDataAt(rowNum, colNum)
				if (metaData != ""){
					treeCellElem.setAttribute("properties", "link")
					treeCellElem.setAttribute("value", metaData)
				}
			}
			// Add empty cell in "add column" column
			treeCellElem = doc.createElement("treecell");
			treeCellElem.setAttribute("properties", "disabled");
			treeCellElem.setAttribute("editable", "false");
			treeRowElem.appendChild(treeCellElem);
		}
		// end of Data Rows
		
		// + Row: Add a row for "adding a new row"
		treeItemElem = doc.createElement("treeitem");
		treeChildrenElem.appendChild(treeItemElem);
		treeRowElem = doc.createElement("treerow");
		treeItemElem.appendChild(treeRowElem);
			// Add checkbox cell placeholder
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("properties", "disabled");
		treeCellElem.setAttribute("editable", "false");
		treeRowElem.appendChild(treeCellElem);
			// Add "+" cell for adding a row
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("properties", "header");
		treeCellElem.setAttribute("editable", "false");
		treeCellElem.setAttribute("label", "+");
		treeRowElem.appendChild(treeCellElem);
			// Add cell placeholders for table data
		for (var colNum = 0, numCols = scratchSpaceTable.getColumnCount(); colNum < numCols; colNum++) {
			treeCellElem = doc.createElement("treecell");
			treeRowElem.appendChild(treeCellElem);
			treeCellElem.setAttribute("properties", "disabled");
			treeCellElem.setAttribute("editable", "false");
		}
			// Add empty cell in "add column" column
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("properties", "disabled");
		treeCellElem.setAttribute("editable", "false");
		treeRowElem.appendChild(treeCellElem);
		// end of + Row
		//// end of treechildren \\\\
		
		// Add click handler to detect whether the "add row" or "add column" buttons are clicked
		treeElem.addEventListener('click', function(event) {
			that.treeClicked(event);
		}, false);
		return treeElem;
	},	// end of constructTableUI
	
	getBrowserWindow: function() {
		return this.browserWindow;
	},
	
	getEditorWindow: function() {
		return this.editorWindow;
	},

	getDocument: function() {
		return this.parent.ownerDocument;
	},
	
	
	getTree: function(tableIndex) {
		return this.tableUIs[tableIndex];
	},
	
	getTreeBoxObject: function(tableIndex) {
		return this.getTree(tableIndex).boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject);
	},
	
	getCurrentTableIndex: function() {
		return this.tabs.selectedIndex;
	},
	
	getSelectedRows: function(tableIndex) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex); 
		var treeView = treeBoxObject.view;
		var treeColumns = treeBoxObject.columns;
		var selectedRows = [];
		
		for (var i = 0, n = this.getDataRowCount(tableIndex); i < n; i++) {
			if (this.isDataRowSelected(tableIndex, i)) {
				selectedRows.push(i);
			}
		}
		return selectedRows;
	},

	setDataRowSelected: function(tableIndex, rowIndex, isSelected) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex); 
		var treeView = treeBoxObject.view;
		var treeColumns = treeBoxObject.columns;
		
		// Offset by 1 to account for the column headers
		treeView.setCellValue(rowIndex + 1, treeColumns[0], isSelected ? "true" : "false");
	},
	
	isDataRowSelected: function(tableIndex, rowIndex) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex); 
		var treeView = treeBoxObject.view;
		var treeColumns = treeBoxObject.columns;
		
		// Offset by 1 to account for the column headers
		return treeView.getCellValue(rowIndex + 1, treeColumns[0]) == "true";
	},

	toggleSelectAll: function(tableIndex) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex);
		var column0 = treeBoxObject.columns[0];
		var treeView = treeBoxObject.view;
		var selectAllValue = this.selectAll[tableIndex];
		for (var i = 1, n = treeView.rowCount - 1; i < n; i++) {
			treeView.setCellValue(i, column0, selectAllValue);
		}
		this.selectAll[tableIndex] = !selectAllValue;
	},

	isCellForAddingRows: function(tableIndex, rowIndex, columnIndex) {
		return (rowIndex == this.getTree(tableIndex).view.rowCount - 1) && (columnIndex == 1);
	},
	
	isCellForAddingColumns: function(tableIndex, rowIndex, columnIndex) {
		return (rowIndex == 0) && (columnIndex == this.getTree(tableIndex).columns.count - 1);
	},
	
	// ======= Table data methods
	getScratchSpace: function() {
		return this.scratchSpace;
	},
	
	//	saveScratchSpace
	saveScratchSpace: function() {
		// For each Table in the ScratchSpace,
		//Save the data from the Editor back into the Table object
		// To save the Table to the Server, use ScratchSpaceUtils.saveSpaceToServer in scratch-space.js
		this.scratchSpace.setTitle(this.titleTextBox.value);
		var tables = this.scratchSpace.getTables();
		for (var i = 0, n = tables.length; i < n; i++) {
			this.saveTable(i);
		}
	},

	saveTable: function(tableIndex) {
		// A Table contains the actual data that is displayed and edited in the Editor
		var table = this.scratchSpace.getTables()[tableIndex];

		// Stop any editing within the tree
		this.getTree(tableIndex).stopEditing(true);
		
		// Make sure there are enough columns
		for (var i = 0, n = this.getDataColumnCount(tableIndex) - table.getColumnCount(); i < n; i++) {
			table.addColumn("");
		}
		
		// Make sure there are enough rows
		for (var i = 0, n = this.getDataRowCount(tableIndex) - table.getRowCount(); i < n; i++) {
			table.addRow("");
		}
		
		//TODO this will need to handle deletions once the underlying model does
		
		// Save column headers
		for (var colNum = 0, numCols = this.getDataColumnCount(tableIndex); colNum < numCols; colNum++) {
			table.setColumnNameAt(colNum, this.getDataColumnName(tableIndex, colNum));
		}
		
		// Save data
		for (var rowNum = 0, numRows = this.getDataRowCount(tableIndex); rowNum < numRows; rowNum++) {
			for (var colNum = 0, numCols = this.getDataColumnCount(tableIndex); colNum < numCols; colNum++) {
				table.setDataAt(rowNum, colNum, this.getData(tableIndex, rowNum, colNum));
				table.setMetaDataAt(rowNum, colNum, this.getMetaData(tableIndex, rowNum, colNum));
			}
		}
		
		// Save extraction data
		// extraction data is temporarily stored in newExtractionElementsByUrl until this Save makes it a permanent part of the table
		for (var i=0; i<table.newExtractionElementsByUrl.length; i++) {
			for (var j=0; j<table.extractionElementsByUrl.length; j++) {
				// if this url is already in the list, remove the old data. Not really necessary; just removes extraneous info from the array
				var newSpec = table.newExtractionElementsByUrl[i].url.spec
				var oldSpec = table.extractionElementsByUrl[j].url.spec
				if (newSpec == oldSpec) {
					table.extractionElementsByUrl.splice[j,1]
					break;
				}
			}
			table.extractionElementsByUrl = table.extractionElementsByUrl.concat(table.newExtractionElementsByUrl)
			table.newExtractionElementsByUrl = []
		}
	},

	//	importDataFile
	// Select a csv file using the filePicker. 
	//Read it in, put its data in the editor.
	importDataFile: function() {
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"]
                   .createInstance(nsIFilePicker);
		var win = this.components.utils().getCurrentCoScripterWindow()
		
		fp.init(win, "Import .csv File", nsIFilePicker.modeOpen);
		fp.appendFilter("csv","*.csv");
		fp.appendFilters(nsIFilePicker.filterText);
		var rv = fp.show();
		if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
			var file = fp.file;
			// read the data into a scratch space table
			// display this table in the editor	  
			var data = this.readCSVFileWithColumnHeaders(file)
			//var scratchSpace = ScratchSpaceUtils.createScratchSpace(data);	
		}
		
		/*
		if (scratchSpace.id == null) {  // create new scratch space

		}
		else { // modify existing scratch space

		}
		var tables = scratchSpace.getTables();
		var serializedTables = [];
		for (var i = 0, n = tables.length; i < n; i++) {
			serializedTables.push(ScratchSpaceUtils.serializeTable(tables[i]));
		}
		var id = scratchSpace.getId();
		if (id != null) {

		}
		*/
	},	// end of importSpace
	
	// Read in the data from a tab-delimited file
	readTDFile: function(iFile){
		var text = ""
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream)
		var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream)
		fstream.init(iFile, -1, 0, 0)
		sstream.init(fstream)
		var str = sstream.read(4096)
		while (str.length > 0) {
			text += str
			str = sstream.read(4096)
		}
		sstream.close()
		fstream.close()
		if (text == null) {return;}
		
		var treeView = this.getTreeBoxObject(0).view;
		var startRowIndex = 0; 
		var startColumnIndex = 0;
		
		// Fill in the table
		var data = text.split('\r');
		if (data[data.length - 1] == "") {data.splice(data.length - 1, 1);}
		// Make sure there are enough rows
		var numRows = this.getDataRowCount(0);
		for (var i = 0, rowsNeeded = startRowIndex + data.length - numRows; i < rowsNeeded; i++) {
			this.addRow(0);
		}
		for (var i = 0, n = data.length; i < n; i++) {
			var row = data[i].split('\t');
			var rowNum = startRowIndex + i;
			// Make sure there are enough columns
			var numCols = this.getDataColumnCount(0);
			for (var j = 0, colsNeeded = startColumnIndex + row.length - numCols; j < colsNeeded; j++) {
				this.addColumn(0);
			}
			for (var j = 0, m = row.length; j < m; j++) {
				var datum = row[j];
				this.setData(0, rowNum, startColumnIndex + j, datum);
			}
		}
	},	// end of readTDFile

	// Read in the data from a comma-separated-values (csv) file
	readCSVFileWithColumnHeaders: function(iFile){
		var i = 0, j = 0;
		var text = ""
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream)
		var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream)
		fstream.init(iFile, -1, 0, 0)
		sstream.init(fstream)
		var str = sstream.read(4096)
		coscripter.debug("readCSVFileWithColumnHeaders: stream is open")
		while (str.length > 0) {
			text += str
			str = sstream.read(4096)
		}
		sstream.close()
		fstream.close()
		if (text == null) {return;}
		coscripter.debug("readCSVFileWithColumnHeaders: finished reading")
		
		// Fill in the table
		var data = text.split('\r');
		if (data[data.length - 1] == "" || data[data.length - 1] == '\n') {data.splice(data.length - 1, 1);}	// get rid of the last row if it is empty
		coscripter.debug("readCSVFileWithColumnHeaders: data split into " + data.length + " rows")
		
		// Make sure there are enough rows  
		var currentNumDataRows = this.getDataRowCount(0);
		var newNumDataRows = data.length-1
		var additionalDataRowsNeeded = newNumDataRows - currentNumDataRows;
		if (additionalDataRowsNeeded < 0){	// Delete extra rows if we are importing over an existing table
			for (i = 0; i < (-1 * additionalDataRowsNeeded); i++){
				this.deleteRow(0,currentNumDataRows - i);	// +1 for the header row, but -1 because arry is 0-based
			}
		}
		for (i = 0; i < additionalDataRowsNeeded; i++) this.addRow(0);
		coscripter.debug("readCSVFileWithColumnHeaders: rows added to table")
		
		var n = data.length
		for (i = 0; i < n; i++) {	
			var rowData = data[i]
			if (rowData.length > 0 && rowData[0] == '\n') rowData = rowData.slice(1);	// Windows files may have an extra "\n" as the first character of each row
			coscripter.debug("readCSVFileWithColumnHeaders: adding row #" + i)

			// Have to parse the line, since there may be escaped commas in the data.
			var rowArray = [];
			var rowArrayIndex = 0;	//indexes the columns in rowArray
			var rowArrayEntry = "";	// build up the string that will appear in rowArray at the current rowArrayIndex
			var insideAQuotedStringP = false	// when a " is first encountered, it begins a quoted string where commas may appear, and double-quotes appear as two double-quotes
			for (j = 0; j < rowData.length; j++) {
				var rowChar = rowData[j]
				if (rowChar == '"' && !insideAQuotedStringP){	// we are beginning a quoted string 
					insideAQuotedStringP = true
				}
				else if (rowChar == '"' && insideAQuotedStringP){	// This either ends the quoted string, or it is the first char representing a double-quote
					if ((j+1 < rowData.length) && rowData[j+1] == '"') {	//an escaped double-quote
						rowArrayEntry = rowArrayEntry + '"'
						j++;
					} 
					else {	// the end of the quoted string
						insideAQuotedStringP = false
					}
				}
				else if (rowChar == ',' && !insideAQuotedStringP) {	// a comma not in a quoted string: this is a csv delimiter
					rowArray[rowArrayIndex] = rowArrayEntry
					rowArrayEntry = ""
					rowArrayIndex++;
				} 
				else {	// add this character to the current entry in the rowArray
					rowArrayEntry = rowArrayEntry + rowChar
				}
				if (j == rowData.length-1){
					rowArray[rowArrayIndex] = rowArrayEntry
				}
			}	// end of for(j)

			// Make sure there are enough columns
			if (i == 0){
				var numDataCols = this.getDataColumnCount(0);
				var colsNeeded = rowArray.length - numDataCols;
				if (colsNeeded < 0) {	
					for (j = 0; j < (-1 * colsNeeded); j++) {
						this.deleteColumn(0,numDataCols+2-j);	// Delete extra columns if we are importing over an existing table. (+2 for checkbox and rowNumber columns)
					}
				}
				else {
					for (j = 0; j < colsNeeded; j++) {
						this.addColumn(0);
					}
				}
			}
			
			var rowNum = i - 1;	// rowNum is 0-based. i - 1 because the initial row of data is the column headers (AC)
			var m = rowArray.length
			for (j = 0; j < m; j++) {
				var datum = rowArray[j]
				if (i == 0) this.setDataColumnName(0, j, datum)	// column headers
				else this.setData(0, rowNum, j, datum)	// rowNum = 0 is the first row of data, not the header row.
			}
		}
	},	// end of readCSVFileWithColumnHeaders

	// Read in the data from a tab-delimited file
	readTDFileWithColumnHeaders: function(iFile){
		var i = 0, j = 0;
		var text = ""
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream)
		var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream)
		fstream.init(iFile, -1, 0, 0)
		sstream.init(fstream)
		var str = sstream.read(4096)
		while (str.length > 0) {
			text += str
			str = sstream.read(4096)
		}
		sstream.close()
		fstream.close()
		if (text == null) {return;}
		
		// Fill in the table
		var data = text.split('\r');
		if (data[data.length - 1] == "" || data[data.length - 1] == '\n') {data.splice(data.length - 1, 1);}	// get rid of the last row if it is empty
		
		// Make sure there are enough rows  
		var currentNumDataRows = this.getDataRowCount(0);
		var newNumDataRows = data.length-1
		var additionalDataRowsNeeded = newNumDataRows - currentNumDataRows;
		if (additionalDataRowsNeeded < 0){	// Delete extra rows if we are importing over an existing table
			for (i = 0; i < (-1 * additionalDataRowsNeeded); i++){
				this.deleteRow(0,currentNumDataRows - i);	// +1 for the header row, but -1 because array is 0-based
			}
		}
		for (i = 0; i < additionalDataRowsNeeded; i++) this.addRow(0);
		
		var n = data.length
		for (i = 0; i < n; i++) {	
			var row = data[i].split('\t');
			if ((row[0].length > 0) && (row[0][0] == '\n')) row[0] = row[0].slice(1);	// Windows files may have an extra "\n" as the first character of each row
			var rowNum = i - 1;	// rowNum is 0-based. i - 1 because the initial row of data is the column headers (AC)

			// Make sure there are enough columns
			if (i == 0){
				var numDataCols = this.getDataColumnCount(0);
				var colsNeeded = row.length - numDataCols;
				if (colsNeeded < 0) for (j = 0; j < (-1 * colsNeeded); j++) this.deleteColumn(0,numDataCols+2-j);	// Delete extra columns if we are importing over an existing table. (+2 for checkbox and rowNumber columns)
				for (j = 0; j < colsNeeded; j++) this.addColumn(0);
			}
			var m = row.length
			for (j = 0; j < m; j++) {
				var datum = row[j]
				if (i == 0) this.setDataColumnName(0, j, datum)	// column headers
				else this.setData(0, rowNum, j, datum)	// rowNum = 0 is the first row of data, not the header row.
			}
		}
	},	// end of readTDFileWithColumnHeaders
	
	refresh: function() {
		this.titleTextBox.value = this.scratchSpace.getTitle();
		var tables = this.scratchSpace.getTables();
		for (var i = 0, n = tables.length; i < n; i++) {
			this.refreshTable(i);
		}
	},
	
	refreshTable: function(tableIndex) {
		var table = this.scratchSpace.getTables()[tableIndex];
		
		// Make sure there are enough columns in the UI
		for (var i = 0, n = table.getColumnCount() - this.getDataColumnCount(tableIndex); i < n; i++) {
			this.addColumn(tableIndex);
		}
		
		// Make sure there are enough rows  
		var treeRowCount = this.getDataRowCount(tableIndex);
		var tableRowCount = table.getRowCount()	// **** ?? -1 ??
		var additionalTreeRowsNeeded = tableRowCount - treeRowCount;
		if (additionalTreeRowsNeeded < 0){	// Delete extra rows if we are importing over an existing table
			for (i = 0; i < (-1 * additionalTreeRowsNeeded); i++){
				this.deleteRow(tableIndex,treeRowCount - i);	// +1 for the header row, but -1 because array is 0-based
			}
		}
		for (i = 0; i < additionalTreeRowsNeeded; i++) this.addRow(tableIndex);
		
		// Update column headers
		for (var colNum = 0, numCols = table.getColumnCount(); colNum < numCols; colNum++) {
			this.setDataColumnName(tableIndex, colNum, table.getColumnNameAt(colNum));
		}
		
		// Update data
		for (var rowNum = 0, numRows = table.getRowCount(); rowNum < numRows; rowNum++) {
			for (var colNum = 0, numCols = table.getColumnCount(); colNum < numCols; colNum++) {
				this.setData(tableIndex, rowNum, colNum, table.getDataAt(rowNum, colNum));	// setData puts the table data into the editor
			}
		}
	},
	
	getDataRowCount: function(tableIndex) {
		// -1 for the editable column headers, -1 for the "new row" row
		return this.getTreeBoxObject(tableIndex).view.rowCount - 2;
	},
	
	getDataColumnCount: function(tableIndex) {
		// -1 for the checkbox column, -1 for the row number, -1 for the "new column" column
		return this.getTreeBoxObject(tableIndex).columns.count - 3;
	},
	
	//	getDataColumnName
	getDataColumnName: function(tableIndex, columnIndex) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex); 
		return treeBoxObject.view.getCellText(0, treeBoxObject.columns[columnIndex + 2]);
	},

	setDataColumnName: function(tableIndex, columnIndex, newValue) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex); 
		treeBoxObject.view.setCellText(0, treeBoxObject.columns[columnIndex + 2], newValue); 
	},
	

	getDataColumnNameOccurrence: function(tableIndex, columnIndex) {
		var columnName = this.getDataColumnName(tableIndex, columnIndex);
		var occurrence = 0;
		var totalOccurrence = 0;
		for (var i = 0, n = this.getDataColumnCount(); i < n; i++) {
			if (this.getDataColumnName(i).toLowerCase() == columnName.toLowerCase()) {
				if (i <= columnIndex) {
					occurrence++;
				}
				totalOccurrence++;
			}
		}
		
		if (totalOccurrence > 1) {
			return occurrence;
		}
		else {
			return null;
		}
	},

	getDataColumnIndex: function(tableIndex, columnName, columnNameOccurrence) {
		if (columnNameOccurrence == null) {
			columnNameOccurrence = 1;
		}
		
		var occurrence = 0;
		for (var i = 0, n = this.getDataColumnCount(tableIndex); i < n; i++) {
			if (this.getDataColumnName(tableIndex, i).toLowerCase() == columnName.toLowerCase()) {
				occurrence++;
				if (occurrence == columnNameOccurrence) {
					return i;
				}
			}
		}
		return -1;
	},
	
	getData: function(tableIndex, rowIndex, columnIndex) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex);
		var data =  treeBoxObject.view.getCellText(rowIndex + 1, treeBoxObject.columns[columnIndex + 2]); 
		return data
	},
	
	setData: function(tableIndex, rowIndex, columnIndex, newValue) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex); 
		treeBoxObject.view.setCellText(rowIndex + 1, treeBoxObject.columns[columnIndex + 2], newValue);
	},
	
	getMetaData: function(tableIndex, rowIndex, columnIndex) {
		var treeBoxObject = this.getTreeBoxObject(tableIndex);
		var metaData = treeBoxObject.view.getCellValue(rowIndex + 1, treeBoxObject.columns[columnIndex + 2])
		return metaData
	},

	// called by "extract" method in data-extraction-mode.js
	setMetaData: function(tableIndex, rowIndex, columnIndex, metaData) {		
		// Use the cell Value methods to hold the metaData. It can only hold a string, not an array, so it is the url string (AC)
		var treeBoxObject = this.getTreeBoxObject(tableIndex);
		var oldMetaData = this.getMetaData(tableIndex, rowIndex, columnIndex);
		var wasLink = (oldMetaData != "");
		treeBoxObject.view.setCellValue(rowIndex + 1, treeBoxObject.columns[columnIndex + 2],metaData)
		var isLink = (metaData != "");

		// Change the style of the cell if it has become a link, or if a link was removed
		if (wasLink != isLink) {
			var treeRowIndex = rowIndex + 1;
			var treeColumnIndex = columnIndex + 2;
			var tree = this.getTree(this.getCurrentTableIndex());
			var treeRow = tree.view.getItemAtIndex(treeRowIndex).firstChild;
			var treeCell = treeRow.getElementsByTagName("treecell")[treeColumnIndex];
			if (isLink) {
				treeCell.setAttribute("properties", "link");
			}
			else {
				treeCell.setAttribute("properties", "");
			}  
			treeBoxObject.invalidateCell(treeRowIndex, tree.columns[treeColumnIndex]);
		}
	},	
	
	addScriptToRunMenu: function(script, runMenu, runMenuPopup) {
		var that = this;
		var doc = this.getDocument();
		var runMenuItem = doc.createElement("menuitem");
		runMenuPopup.appendChild(runMenuItem);
		runMenuItem.setAttribute("label", script.title);
		runMenuItem.setAttribute("value", script.url);
		runMenuItem.addEventListener('command', function(event) {
			that.runMenuItemSelected(event);
		}, true);
		runMenu.disabled = false;
	},
	
	
	// We sometimes want to append to a table when adding new rows.
	// But if the current table is actually the initial blank table 
	// (used just to have a table visible when the scratchtable editor is first opened)
	// then we should start at the first row, rather than appending.
	initialTableP: function(tableIndex){
		var initialTable = ScratchSpaceUtils.INITIAL_TABLE
		var initialTableData = initialTable.data
		initialTableData = initialTableData.slice(1,initialTableData.length)	// without the header
		var currentTable =  this.scratchSpace.getTables()[tableIndex]
		return (JSON.stringify(initialTableData) == JSON.stringify(currentTable.data))
	},
	
	addRow: function(tableIndex) {
		var doc = this.getDocument();
		var treeBoxObject = this.getTreeBoxObject(tableIndex);
		var treeColumnsCount = treeBoxObject.columns.count;
		var treeChildrenElem = this.getTree(tableIndex).getElementsByTagName("treechildren")[0];

		var treeItemElem = doc.createElement("treeitem");
		//treeChildrenElem.appendChild(treeItemElem);
		treeChildrenElem.insertBefore(treeItemElem, treeChildrenElem.lastChild);
		
		var treeRowElem = doc.createElement("treerow");
		treeItemElem.appendChild(treeRowElem);

		// Add checkbox cell
		var treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("class", "checkbox-cell");
		treeCellElem.setAttribute("properties", "header");
		treeRowElem.appendChild(treeCellElem);			
		
		// Add row number cell
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("properties", "header");
		treeCellElem.setAttribute("editable", "false");
		treeCellElem.setAttribute("label", this.getDataRowCount(tableIndex));
		treeRowElem.appendChild(treeCellElem);			
		
		// Add cell for table data
		for (var colNum = 0, numCols = this.getDataColumnCount(tableIndex); colNum < numCols; colNum++) {
			treeCellElem = doc.createElement("treecell");
			treeRowElem.appendChild(treeCellElem);
		}
		
		// Add empty cell under "add column" column
		treeCellElem = doc.createElement("treecell");
		treeCellElem.setAttribute("properties", "disabled");
		treeCellElem.setAttribute("editable", "false");
		treeRowElem.appendChild(treeCellElem);
		
		treeBoxObject.invalidate();
	},
	
	deleteRow: function(tableIndex, rowIndex) {
		// rowIndex of 0 is the header row, last row is the "+" row
		var doc = this.getDocument();
		var treeBoxObject = this.getTreeBoxObject(tableIndex);
		var treeChildrenElem = this.getTree(tableIndex).getElementsByTagName("treechildren")[0];
		
		treeChildrenElem.removeChild(treeChildrenElem.childNodes[rowIndex]);
		
		// Renumber the remaining rows below
		for (var i = rowIndex, n = treeChildrenElem.childNodes.length - 1; i < n; i++) {
			var treeItemElem = treeChildrenElem.childNodes[i];
			treeItemElem.childNodes[0].childNodes[1].setAttribute("label", i);
		}

		treeBoxObject.invalidate();
	},
	
	addColumn: function(tableIndex) {
		var doc = this.getDocument();
		
		// We need to explicitly set the ordinal of the new column and splitter.
		// Otherwise, the columns are in the wrong order after undocking and redocking.
		var ordinal = this.getTreeBoxObject(tableIndex).columns.count * 2 - 1;
		
		var tree = this.getTree(tableIndex);
		var treeColsElem = tree.getElementsByTagName("treecols")[0];

		var treeColElem = doc.createElement("treecol");
		//treeColElem.setAttribute("label", String.fromCharCode(this.getDataColumnCount(tableIndex) + "A".charCodeAt(0)));
		treeColElem.setAttribute("label", String(this.getDataColumnCount(tableIndex) + 1));
		treeColElem.setAttribute("flex", "1");
		treeColElem.setAttribute("width", "100");
		treeColElem.setAttribute("maxwidth", "250");
		treeColElem.setAttribute("ordinal", ordinal);
		ordinal++;
		treeColsElem.insertBefore(treeColElem, treeColsElem.lastChild);
		
		var treeRows = tree.getElementsByTagName("treerow");
		for (var i = 0, n = treeRows.length; i < n; i++) {
			var treeRow = treeRows[i];
			var treeCell = doc.createElement("treecell");
			if (i == 0) {
				treeCell.setAttribute("properties", "header");
				// Assign a default Letter header
				treeCell.setAttribute("label", String.fromCharCode(this.getDataColumnCount(tableIndex) - 1 + "A".charCodeAt(0)));
			}
			else if (i == n - 1) {
				treeCell.setAttribute("properties", "disabled");
				treeCell.setAttribute("editable", "false");
			}
			treeRow.insertBefore(treeCell, treeRow.lastChild);
		}
		
		var splitterElem = doc.createElement("splitter");
		splitterElem.setAttribute("class", "tree-splitter");
		splitterElem.setAttribute("ordinal", ordinal);
		ordinal++;
		treeColsElem.insertBefore(splitterElem, treeColsElem.lastChild);
		
		// Reset the ordinal of the "add column" column
		treeColsElem.lastChild.setAttribute("ordinal", this.getTreeBoxObject(tableIndex).columns.count * 2 - 1);
			
		tree.boxObject.invalidate();
	},
	
	deleteColumn: function(tableIndex, colIndex) {
		var doc = this.getDocument();
		var tree = this.getTree(tableIndex);
		var treeColsElem = tree.getElementsByTagName("treecols")[0];

		// remove the column and the splitter before it
		var arrayIndex = (colIndex-1)*2
		var splitterIndex = arrayIndex-1
		treeColsElem.removeChild(treeColsElem.childNodes[arrayIndex]);
		if (splitterIndex != -1) treeColsElem.removeChild(treeColsElem.childNodes[splitterIndex]);
		
		// fix the ordinals of the following columns
		for (var i = treeColsElem.childElementCount-1; i > arrayIndex-2; i--) {
			treeColsElem.childNodes[i].setAttribute("ordinal", i+1);
		}
		
		var treeRows = tree.getElementsByTagName("treerow");
		for (var i = 0, n = treeRows.length; i < n; i++) {
			var treeRow = treeRows[i];
			treeRow.removeChild(treeRow.childNodes[colIndex-1]);	// -1 because array indices are 0-based, and colIndex is 1-based
		}
		
		tree.boxObject.invalidate();
	},
	
	// ======= Handlers for events from the table model
	scriptAdded: function(event) {
		var scriptsMenu = this.scratchSpaceUI.getScriptsMenu(this.context);
		var currentMenuPopUp = scriptsMenu.childNodes[this.getCurrentTableIndex()];
		this.addScriptToRunMenu(event.script, scriptsMenu, currentMenuPopUp);
	},
	
	// ======= Handlers for events from the UI
	runMenuItemSelected: function(event) {
		var menuItem = event.originalTarget;

		// If no rows are selected, select them all first
		var t = this.getCurrentTableIndex();
		var selectedRows = this.getSelectedRows(t);
		if (selectedRows.length == 0) {
			//Selecting no rows defaults to running the script over the whole table
			this.toggleSelectAll(t);
		}
		
		// Run the selected item
		var c = CoScripterScratchSpaceOverlay.getTargetWindow().top.coscripter;
		c.loadProcedureIntoSidebarWithScratchSpaceEditor(menuItem.getAttribute("value"), true, this);
	},
	
	cellKeypress: function(event) {
		// Used for Delete Row
		var tableIndex = this.getCurrentTableIndex();
		var selection = event.currentTarget.view.selection
		if (!selection) return;
		var selectedColumnIndex = selection.currentColumn.index
		var selectedRowIndex = selection.currentIndex
		if (selectedColumnIndex == 1 && (event.keyCode == event.DOM_VK_BACK_SPACE || event.keyCode == event.DOM_VK_DELETE)){	// Delete Row
			this.deleteRow(tableIndex,selectedRowIndex)
		}
	},
	
	treeClicked: function(event) {
		//coscripter.debug("scratch table treeClicked")
		var tableIndex = this.getCurrentTableIndex();
		var row = {};
		var col = {};
		var obj = {};
		this.getTreeBoxObject(tableIndex).getCellAt(event.clientX, event.clientY, row, col, obj);

		if(col.value == null) {
			// see if this was a click on the column header. If so, sort by this column
			// Hack Hack Use getCellAt for a point below the actual click.
			// There must be a better way to do this, but I haven't a clue. (AC)
			this.getTreeBoxObject(tableIndex).getCellAt(event.clientX, event.clientY + 30, row, col, obj);
			if (col.value == null) return;
			columnIndex = col.value.index - 1

			// Save first, since the sort is done on the saved data
			this.saveScratchSpace()
			var table = this.scratchSpace.getTables()[tableIndex];
			if (columnIndex <= table.getColumnCount()){
				table.sortByColumn(columnIndex)
				this.refreshTable(tableIndex)
				return;
			}
		}
		
		var u = this.components.utils();
		var labeler = this.components.labeler();
		var commands = this.components.commands();
		var coScripterWindow = u.getCoScripterWindow(window)
		var rowIndex = row.value
		var columnIndex = col.value.index
		var dataRowIndex = rowIndex - 1;
		var dataColumnIndex = columnIndex - 2;
		var metaData = this.getMetaData(tableIndex, dataRowIndex, dataColumnIndex);
		
		//if this is a click on a link in a cell,
		//take over for command-generator (since yule isn't sending chrome clicks)
		if (metaData && coScripterWindow.recording) {
			var targetLabel = "column " + u.convertColumnNumberToLetter(dataColumnIndex) + " of row " + (dataRowIndex + 1) + " of the " // so that labeler doesn't get called
			var targetType = labeler.WEBTYPES.SCRATCHSPACETABLE;
			var commandObj = commands.createClickFromParams(event, targetLabel, targetType);
			//Hack Hack. Call command-processor's receiveRecordedCommand directly
			coScripterWindow.receiveRecordedCommand(commandObj)
		}
				
		if (this.isCellForAddingRows(tableIndex, rowIndex, columnIndex)) {
			this.addRow(tableIndex);
		}
		else if (this.isCellForAddingColumns(tableIndex, rowIndex, columnIndex)) {
			this.addColumn(tableIndex);
		}
		else {
			if (metaData != "" && columnIndex != 0) {
				CoScripterScratchSpaceOverlay.getTargetWindow().gBrowser.selectedBrowser.contentDocument.defaultView.location.href = metaData
			}
		}
	},
	
	selectAllColHeaderClicked: function(event) {
		var tableIndex = this.getCurrentTableIndex();
		this.toggleSelectAll(tableIndex);
	}
}
