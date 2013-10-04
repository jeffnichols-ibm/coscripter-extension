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
Components.utils.import("resource://coscripter-platform/component-registry.js")
var EXPORTED_SYMBOLS = ["ScratchSpace", "ScratchSpaceTable", "ScratchSpaceUtils"];
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
var debugFilename = 'coscripter-scratch-space.js';
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage(debugFilename + ": " + msg )
	if(Preferences.DO_DUMP_DEBUGGING) dump(debugFilename + ": " + msg + "\n")
}
function errorMsg(msg){
	consoleService.logStringMessage(debugFilename + ": CoScripter Error Thrown: " + msg )
}

var gUtils = null; // global utils object to cache the components call 
function getUtils() {
	if (gUtils == null) {
		gUtils = registry.utils();
	}
	return gUtils;
}
//debug('parsing coscripter-scratch-space.js')


//////////////////////////
//
//	ScratchSpaceUtils
//		loadSpaceFromServer
//		saveSpaceToServer
//		saveSpaceLocally
//
//	ScratchSpace object
//
//	ScratchSpaceTable object
//		addColumn
//		addRow
//
//////////////////////////

//	ScratchSpaceUtils
ScratchSpaceUtils = {
	/**
	 * @param {Object} data    an object of the form:
	 * {
	 *    title: String,
	 *    description: String,
	 *    ownerId: String,
	 *    spaceIsPrivate: String,
	 *    tables: []
	 * }
	 * 
	 * and where each item in tables is of the form:
	 * {
	 *     title: String,
	 *     data: [], // // each array entry is a row, which is an array of strings
	 *     metaData: [], // // each array entry is a row, which is an array of strings
	 *     extractionElementsByUrl: [], //XPath information for extracting a table from a web page
	 *     notes: String,
	 *     scriptData: [] // of {id: int, title: string}
	 *     log: String
	 * }
	 * 
	 * Table.data is e.g. [["A", "B"], ["", ""], ["", ""], ["", ""]] for a table with 3 rows and two columns, labeled A and B.
	 * 
	 */
	INITIAL_TABLE : {title: "Tab 1", data: [["A", "B"], ["", ""], ["", ""], ["", ""]], metaData: [["", ""], ["", ""], ["", ""], ["", ""]], extractionElementsByUrl: [], notes: "", scripts: [], log: []},
	
	createScratchSpace: function(params) {
		params = params || {};
		
		var tables;
		if (params.tables) {
			tables = [];
			var newTable;
			for (var i = 0, n = params.tables.length; i < n; i++) {
				var paramsTable = params.tables[i];
				newTable = {
					id: paramsTable.id,
					title: paramsTable.title,
					data: paramsTable.data,
					metaData: paramsTable.metaData,
					extractionElementsByUrl: paramsTable.extractionElementsByUrl,
					notes: paramsTable.notes,
					scripts: [],
					log: []
				}
				if (params.tables[i].scriptData){
					for (var j = 0, m = params.tables[i].scriptData.length; j < m; j++) {
						var scriptData = params.tables[i].scriptData[j];
						var scriptUrl = getUtils().getKoalescenceAPIFunction('script/' + scriptData.id);
						newTable.scripts.push({url: scriptUrl, title: scriptData.title});
					}
				}
				if (params.tables[i].log) {
					var logLines = params.tables[i].log.split('\n');
					for (var k = 0, nk = logLines.length; k < nk; k++) {
						var logLine = logLines[k];
						var action = ScratchSpaceTable.Action.parse(logLine);
						newTable.log.push(action);
					}
				}
				tables.push(newTable);
			}
		}
		else {
			// create a table with 2 columns and 3 rows
			tables = []
			tables[0] = this.INITIAL_TABLE
			//tables = JSON.parse("[{\"title\":\"Tab 1\",\"data\":[[\"A\"],[\"\"]],\"notes\":\"\",\"scripts\":[],\"log\":[]}]")
		}
		
		// The logic is crazy here: we create new tables and then pass them to the ScratchSpace constructor which takes the data from those tables to create a second set of new tables (AC)
		var scratchSpace = new ScratchSpace(
									params.id || null,
									params.title || "Untitled Table",
									params.description || "",
									params.ownerId || null,
									params.spaceIsPrivate || true,
									tables
								);
		return scratchSpace
	},
	
	//	function extractDataFromPage(tableElem: DOMElement): void
	extractDataFromPage: function(tableElem) {
		var newData = [];
		var newMetaData = [];
		this.tableElem = tableElem;
		
		var u = getUtils();
		var doc = u.getDocumentWithEvaluate(this.tableElem);
		if (!doc) {
			consoleService.logStringMessage("scratch-table's extractDataFromPage can't find a document");
			return;
		}
		
		var rows = u.getNodes('descendant::tr', this.tableElem)
		if (rows.length == 0) {
			return;
		}
		
		var columns = u.getNodes('descendant::th|td', rows[0])
		
		// Extract header row, if any
		var headerRowEntries = u.getNodes('descendant::th', rows[0])
		if (headerRowEntries != null) {
			rows.shift();
			var colHeaders = [];
			var metaColHeaders = [];
			for (var c = 0; c < headerRowEntries.length; c++) {
				colHeaders.push(u.trim(headerRowEntries[c].textContent)) // or perhaps .childNodes
				metaColHeaders.push("")
			}
			newData.push(colHeaders);
			newMetaData.push(metaColHeaders);
		}
		
		
		//fill in the cell data
		for (var r = 0; r < rows.length; r++) {
			var row = rows[r]
			var entries = u.getNodes('descendant::th|td', row)
			var rowData = [];
			for (var c = 0; c < columns.length; c++) {
				rowData.push(u.trim(entries[c].textContent)) // or perhaps .childNodes
			}
			newData.push(rowData);
		}
		
		//fill in the cell metaData
		for (var r = 0; r < rows.length; r++) {
			var row = rows[r]
			var entries = u.getNodes('descendant::th|td', row)
			var metaRowData = [];
			for (var c = 0; c < columns.length; c++) {
				metaRowData.push("") // or perhaps .childNodes
			}
			newMetaData.push(metaRowData);
		}
		
		return newData;
	},

	extractScriptsFromPage: function(listElem) {
		// Assumes that list is an OL or UL with LI child nodes
		// Each LI node consists of an A with the name of the script as A's child
		var scripts = [];
		var doc = listElem.ownerDocument;
		var itemResult = doc.evaluate("li", listElem, null, 7 /*XPathResult.ORDERED_NODE_SNAPSHOT_TYPE*/, null);
		for (var i = 0; i < itemResult.snapshotLength; i++) {
			var item = itemResult.snapshotItem(i);
			var link = doc.evaluate("a", item, null, 9 /*XPathResult.FIRST_NODE_SNAPSHOT_TYPE*/, null).singleNodeValue;
			if (link != null) {
				var name = link.textContent;
				var url = link.href;
				scripts.push({url: url, name: name});
			}
		}
		return scripts;
	},

	getSpacesFromServer: function(cb) {
		var url = getUtils().getKoalescenceAPIFunction('scratch_spaces');
		
		var response = getUtils().loadJSONWithStatus(url, function(success, statusCode, data) {
			if (success) {
				cb(data);
			}
			else {
				cb(null);
			}
		});
	},

//		loadSpaceFromServer
//		loadSpaceLocally is defined in local-save.js
	loadSpaceFromServer: function(scratchSpaceId, cb) {
		var url = getUtils().getKoalescenceAPIFunction('scratch_space/' + scratchSpaceId);
		
		var response = getUtils().loadJSONWithStatus(url, function(success, statusCode, scratchSpaceData) {
			if (success) {
				for (var i = 0, n = scratchSpaceData.tables.length; i < n; i++) {
					var table = scratchSpaceData.tables[i];
					table.data = JSON.parse(table.dataJson);
				}
				var scratchSpace = ScratchSpaceUtils.createScratchSpace(scratchSpaceData);
				cb(scratchSpace);
			}
			else {
				cb(null);
			}
		});
	},

//		deleteSpaceFromServer
	deleteSpaceFromServer: function(scratchSpaceId) {
		var url = getUtils().getKoalescenceAPIFunction('delete_scratch_space/' + scratchSpaceId);
		var response = getUtils().post(url, {})
		return (response[0] == 200)
	},
	
	serializeTable: function(table) {
		// Save columns
		var data = [];
		var metaData = [];
		var colHeaders = [];
		var metaColHeaders = [];
		for (var colNum = 0, numCols = table.getColumnCount(); colNum < numCols; colNum++) {
			colHeaders.push(table.getColumnNameAt(colNum));
			metaColHeaders.push("")
		}
		data.push(colHeaders);
		metaData.push(metaColHeaders);
		
		// Save data
		for (var rowNum = 0, numRows = table.getRowCount(); rowNum < numRows; rowNum++) {
			var row = [];
			for (var colNum = 0, numCols = table.getColumnCount(); colNum < numCols; colNum++) {
				row.push(table.getDataAt(rowNum, colNum));
			}
			data.push(row);
		}
		
		// Save metaData
		for (var rowNum = 0, numRows = table.getRowCount(); rowNum < numRows; rowNum++) {
			var row = [];
			for (var colNum = 0, numCols = table.getColumnCount(); colNum < numCols; colNum++) {
				row.push(table.getMetaDataAt(rowNum, colNum));
			}
			metaData.push(row);
		}
		
		// Save extractionElementsByUrl
		// only need to save the xpath info
		var extractionElementsByUrl = []
		for (var i = 0, n = table.extractionElementsByUrl.length; i < n; i++) {
			var extractionElements = table.extractionElementsByUrl[i].extractionElements;
			var extractionElementsToSave = []
			for (var j=0; j<extractionElements.length; j++) {
				var extractionElement = extractionElements[j]
				var extractionElementToSave = {xpath : extractionElement.xpath , xpathSnippet : extractionElement.xpathSnippet }
				extractionElementsToSave.push(extractionElementToSave)
			}
			var extractionElementByUrl = { url : table.extractionElementsByUrl[i].url, extractionElements : extractionElementsToSave }
			extractionElementsByUrl.push(extractionElementByUrl);
		}		
		
		// Save scripts
		var scriptIds = [];
		for (var i = 0, n = table.getScriptCount(); i < n; i++) {
			var script = table.getScript(i);
			// Assume the ID of the script is the last part of the script's URL
			scriptIds.push(script.url.slice(script.url.lastIndexOf("/") + 1));
		}
		
		// Save log
		var logList = [];
		var log = table.getLog();
		for (var i = 0, n = log.length; i < n; i++) {
			logList.push(log[i].toString());
		}
		
		var serializedTable = {
			title: table.getTitle(),
			dataJson: JSON.stringify(data),
			metaDataJson: JSON.stringify(metaData),
			extractionElementsByUrlJson: JSON.stringify(extractionElementsByUrl),
			notes: table.getNotes(),
			scriptIds: scriptIds,
			log: logList.join('\n')
		};
		var id = table.getId();
		if (id != null) {
			serializedTable.id = id;
		} 
		return serializedTable;
	},
	
//		saveSpaceToServer
	saveSpaceToServer: function(scratchSpace, cb) {
		var saveUrl;
		var httpMethod;
		
		if (scratchSpace.id == null) {  // create new scratch space
			saveUrl = getUtils().getKoalescenceAPIFunction('scratch_spaces');
			httpMethod = "POST";
		}
		else { // modify existing scratch space
			saveUrl = getUtils().getKoalescenceAPIFunction('scratch_space/' + scratchSpace.id);
			httpMethod = "PUT";
		}
		
		var tables = scratchSpace.getTables();
		var serializedTables = [];
		for (var i = 0, n = tables.length; i < n; i++) {
			serializedTables.push(ScratchSpaceUtils.serializeTable(tables[i]));
		}
		
		var params = {
			title: scratchSpace.getTitle(),
			description: scratchSpace.getDescription(),
			spaceIsPrivate: scratchSpace.isPrivate(),
			tablesJson: JSON.stringify(serializedTables)
		}
		
		var id = scratchSpace.getId();
		if (id != null) {
			params.id = id;
		}
		
		getUtils().httpRequest(saveUrl, httpMethod, params, function(success, statusCode, response) {
			if (success) {
				// In case the scratch space or any of its tables are newly created, save their new IDs
				scratchSpace.setId(response.id);
				for (var i = 0, n = response.tableIds.length; i < n; i++) {
					scratchSpace.getTables()[i].setId(response.tableIds[i]);
				}
			}
			cb(success, statusCode, response);
		}, null, true);
	},

//		saveSpaceLocally
	saveSpaceLocally: function(scratchSpace, coscripterWindow) {
		var u = getUtils()
		if (!scratchSpace.getId()) scratchSpace.setId(u.generateUUID())	// create new scratch space

		var tables = scratchSpace.getTables();
		var serializedTables = [];
		for (var i = 0, n = tables.length; i < n; i++) {
			serializedTables.push(ScratchSpaceUtils.serializeTable(tables[i]));
		}
		
		var serializedScratchSpace = {
			title: scratchSpace.getTitle(),
			description: scratchSpace.getDescription(),
			spaceIsPrivate: scratchSpace.isPrivate(),
			tablesJson: JSON.stringify(serializedTables),
			id: scratchSpace.getId()
		}		

		// Save to file
		var coScriptJSON = ""
		try {
			//debug("ScratchSpaceUtils module: saveSpaceLocally: " + scratchSpace.getId().slice(scratchSpace.getId().length-4, scratchSpace.getId().length))
			//cleanCurrentCoScriptForLocalSave()	//don't need unless there are attached scripts.
			var scratchSpaceJSON = JSON.stringify(serializedScratchSpace)
		} catch (e) {
			debug("ScratchSpaceUtils module: saveSpaceLocally: Error encoding scratchSpaceJSON: " + e)
		}
		
		var scratchSpaceFile = coscripterWindow.scratchSpaceFolder.clone()
		scratchSpaceFile.append("scratchSpace" + scratchSpace.getId())
		var fScriptStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		fScriptStream.init(scratchSpaceFile, 0x02 | 0x08 | 0x20, 0664, 0)
		fScriptStream.write(serializedScratchSpace.title, serializedScratchSpace.title.length)
		fScriptStream.write(scratchSpaceJSON, scratchSpaceJSON.length)
		fScriptStream.close()
		//debug("ScratchSpaceUtils module: saveSpaceLocally: done")
		
	},

}	// end of ScratchSpaceUtils


////////////////////////////////////////////////////////////////////////////////
//	ScratchSpace object
//

ScratchSpace = function(id, title, description, ownerId, spaceIsPrivate, tables) {
	this.id = id;
	this.title = title;
	this.description = description;
	this.ownerId = ownerId;
	this.spaceIsPrivate = spaceIsPrivate;
	
	this.tables = [];
	for (var i = 0, n = tables.length; i < n; i++) {
		var table = tables[i];
		this.createTable(table.id, table.title, table.data, table.metaData, table.extractionElementsByUrl, table.scripts, table.notes, table.log);
	}
}

ScratchSpace.prototype = {
	getId: function() {
		return this.id;
	},
	
	setId: function(newId) {
		this.id = newId;
	},
	
	getTitle: function() {
		return this.title;
	},
	
	setTitle: function(newTitle) {
		this.title = newTitle;
	},
	
	getDescription: function() {
		return this.description;
	},
	
	getOwnerId: function() {
		return this.ownerId;
	},
	
	isPrivate: function() {
		return this.spaceIsPrivate;
	},
	
	getTables: function() {
		return this.tables;
	},

	createTable: function(id, title, data, metaData, extractionElementsByUrl, scripts, notes, log) {
		var newTable = new ScratchSpaceTable(this, id, title || "", data || [], metaData || [], extractionElementsByUrl || [], scripts || [], notes || "", log || []);
		this.getTables().push(newTable);
		return newTable;
	},
	
	newTable: function(id, title, data, metaData, extractionElementsByUrl, scripts, notes, log) {
		var newTable = new ScratchSpaceTable(this, id, title || "", data || [], metaData || [], extractionElementsByUrl || [], scripts || [], notes || "", log || []);
		return newTable;
	},
}


////////////////////////////////////////////////////////////////////////////////
//	ScratchSpaceTable object
//
// row and column indices are 0-based
//
// EVENTS
//
// void     addDataChangeListener : function(callback) - callback takes 4 parameters: rowIndex, columnIndex, oldValue, newValue
// void     addDataLoadListener : function(callback)
// void     addDataSaveListener : function(callback)

ScratchSpaceTable = function(scratchSpace, id, title, data, metaData, extractionElementsByUrl, scripts, notes, log) {
	this.scratchSpace = scratchSpace;
	
	// Instance variables
	this.id = id;
	this.title = title;
	
	this.columnNames = [];  // array of strings
	this.columnNameToNum = {};  // of string->[int]
	this.rowNames = [];  // of strings
	this.rowNameToNum = {};  // of string->[int]
	this.columnSortAscendingP = {};	// dictionary of booleans
	this.sortColumn = -1;
	
	this.data = []; // 2-D array of strings
	this.metaData = []; // 2-D array of strings. Stores a url if the data is a link
	if (data.length >= 1) {
		for (var j = 0, m = data[0].length; j < m; j++) {
			var colName = data[0][j];
			this.addColumn(colName);
		}
		this._modifyDataToSize(data.length - 1, data[0].length);
	}
	for (var i = 1, n = data.length; i < n; i++) {
		var row = data[i];
		var metaRow = metaData[i];
		for (var j = 0, m = row.length; j < m; j++) {
			var datum = data[i][j];
			var metaDatum = metaData[i][j];
			this.setDataAt(i - 1, j, datum);
			this.setMetaDataAt(i - 1, j, metaDatum);
		}
	}
	 
	this.extractionElementsByUrl = extractionElementsByUrl		// See the "extract" method in data-extraction-mode.js for an explanation
	this.newExtractionElementsByUrl = []	// a temporary holding place for extraction information until the editor is saved to the table.
	
	this.scripts = scripts; // of {url: string, name: string}
	
	this.listeners = {}; // listener type (string) -> [functions]
	
	this.fireEvents = true;
	
	this.notes = notes;
	this.log = log;
	this.loggingEnabled = true;
}

ScratchSpaceTable.prototype = {

	////////////////////////////////////////////////////////////
	// Constants
	
	
	////////////////////////////////////////////////////////////
	// Methods

	// function getScratchSpace(): ScratchSpace
	getScratchSpace: function() {
		return this.scratchSpace;
	},
	
	// function getId(): string
	getId: function() {
		return this.id;
	},
	
	// function setId(newId: string)
	setId: function(newId) {
		this.id = newId;
	},
	
	// function getTitle(): string
	getTitle: function() {
		return this.title;
	},
	
	// function getNotes(): string
	getNotes: function() {
		return this.notes;
	},
	
	// function getLog(): [] of ScratchSpaceTable.Action
	getLog: function() {
		return this.log;
	},
	
	// function logAction(action: ScratchSpaceTable.Action):
	logAction: function(action) {
		if (this.loggingEnabled) {
			this.log.push(action);
		}
	},
	
	setLoggingEnabled: function(flag) {
		this.loggingEnabled = flag;
	},
	
	// function addColumn(columnName=null: string): void
	//		addColumn
	addColumn: function(columnName) {
		var columnNum = this.columnNames.length;
		
		if (columnName == null) {
			columnName = this.columnNames.length.toString();
		}
		
		this.columnNames.push(columnName);
		this._setColumnNameHelper(columnNum, columnName);			
		
		// add the new column to each row
		for (var i = 0; i < this.data.length; i++) {
			var row = this.data[i];
			var metaRow = this.metaData[i];
			row.push("");
			metaRow.push("");
		}

		this._fireEvent("columnAdded", {index: columnNum});
	},
		
	// function getColumnCount(): int
	getColumnCount: function() {
		return this.columnNames.length;
	},
	
	// function getColumnNameAt(index: int): string
	getColumnNameAt: function(index) {
		return this.columnNames[index];
	},

	// private function setColumnNameHelper(index: int, name: string): void
	_setColumnNameHelper: function(index, name) {
		// Sets the new column name without dealing with any old names
		this.columnNames[index] = name;
		var lowerCaseColumnName = name.toLowerCase();
		if (!this.columnNameToNum[lowerCaseColumnName]) {
			this.columnNameToNum[lowerCaseColumnName] = [];
		}
		this.columnNameToNum[lowerCaseColumnName].push(index);
		this.columnNameToNum[lowerCaseColumnName].sort(function(a, b) {return a - b});
	},
	
	// function setColumnNameAt(index: int, name: string): void
	setColumnNameAt: function(index, name) {
		// First, remove the old column name
		var oldColumnNameLowerCase = this.getColumnNameAt(index).toLowerCase();
		var oldColumnNameIndices = this.columnNameToNum[oldColumnNameLowerCase];
		
		for (var i = 0, n = oldColumnNameIndices.length; i < n; i++) {
			if (oldColumnNameIndices[i] == index) {
				oldColumnNameIndices.splice(i, 1);
				break;
			}
		}
		if (oldColumnNameIndices.length == 0) {
			delete this.columnNameToNum[oldColumnNameLowerCase];
		}
		
		// Now set the new column name
		this._setColumnNameHelper(index, name);
	},
	
	// function getColumnNameOccurrenceAt(index: int): int?
	getColumnNameOccurrenceAt: function(index) {
		var lowerCaseColumnName = this.columnNames[index].toLowerCase();
		for (var i = 0, n = this.columnNameToNum[lowerCaseColumnName].length; i < n; i++) {
			if (this.columnNameToNum[lowerCaseColumnName][i] == index) {
				return i + 1;
			}
		}
		return null;
	},
	
	getSortColumn: function() {
		return this.sortColumn;
	},
	
	setSortColumn: function(columnIndex) {
		this.sortColumn = columnIndex
		return columnIndex;
	},
	
	getColumnSortDirection: function(columnIndex) {
		// return true if columnSortAscendingP is true for this columnIndex
		if (this.columnSortAscendingP[columnIndex] == true) return true
		else {
			this.columnSortAscendingP[columnIndex] = false
			return false
		}
	},

	toggleColumnSortDirection: function(columnIndex) {
		if (this.columnSortAscendingP[columnIndex] == true) this.columnSortAscendingP[columnIndex] = false
		else this.columnSortAscendingP[columnIndex] = true
		return this.columnSortAscendingP[columnIndex]
	},

	// function sortByColumn(columnIndex: int): void
	sortByColumn: function(columnIndex) {
		if (this.getSortColumn() == columnIndex) this.toggleColumnSortDirection(columnIndex)
		this.setSortColumn(columnIndex)
		if (this.getColumnSortDirection(columnIndex) == true) this.data.sort(function(a, b) {return a[columnIndex-1] < b[columnIndex-1]})	// ascending
		else this.data.sort(function(a, b) {return a[columnIndex-1] > b[columnIndex-1]})
		return;
	},
	
	// function addRow(): void
	//		addRow
	addRow: function() {
		var newRow = [];
		var newMetaRow = [];
		for (var i = 0; i < this.columnNames.length; i++) {
			newRow.push("");
			newMetaRow.push("");
		}
		
		this.data.push(newRow);
		this.metaData.push(newMetaRow);
		
		this._fireEvent("rowAdded", {index: this.data.length - 1});
	},
	
	// function getRowCount(): int
	getRowCount: function() {
		return this.data.length;
	},
	
	// function getDataAt(rowIndex: int, columnIndex: int): string
	getDataAt: function(rowIndex, columnIndex) {
		return this.data[rowIndex][columnIndex];
	},
	
	getMetaDataAt: function(rowIndex, columnIndex) {
		return this.metaData[rowIndex][columnIndex];
	},
	
	// function setDataAt(rowIndex: int, columnIndex: int, stringValue: string): void
	setDataAt: function(rowIndex, columnIndex, stringValue) {
		//var oldValue = this.getDataAt(rowIndex, columnIndex);
		this.data[rowIndex][columnIndex] = stringValue;
		/*
		this._fireEvent("dataChanged", {
			rowIndex: rowIndex,
			columnIndex: columnIndex,
			oldValue: oldValue,
			newValue: stringValue
		});
		*/
	},
	
	setMetaDataAt: function(rowIndex, columnIndex, stringValue) {
		//var oldValue = this.getMetaDataAt(rowIndex, columnIndex);
		this.metaData[rowIndex][columnIndex] = stringValue;
		/*
		this._fireEvent("metaDataChanged", {
			rowIndex: rowIndex,
			columnIndex: columnIndex,
			oldValue: oldValue,
			newValue: stringValue
		});
		*/
	},
	
	// function addScript(script: {url: string, name: string}, index=null: int?): void
	addScript: function(script, index) {
		var existingIndex = this.getScriptIndex(script);
		if (existingIndex == -1) {
			if (index == null) {
				this.scripts.push(script);
			}
			else {
				this.scripts.splice(index, 0, script);
			}
			var that = this;
			this._fireEvent("scriptAdded", {source: that, index: index, script: script});
			if (index == null) {
				return this.scripts.length - 1;
			}
			else {
				return index;
			}
		}
		else {
			return existingIndex; 
		}
	},
	
	// function removeScript(index: int): {url: string, name: string}
	removeScript: function(index) {
		return this.scripts.splice(index, 1);
	},

	// function getScript(index: int): {url: string, title: string} 
	getScript: function(index) {
		return this.scripts[index];
	},
	
	// function getScriptCount(): int
	getScriptCount: function() {
		return this.scripts.length;
	},

	// function getScriptIndex: function(script: {url: string, title: string}): int
	getScriptIndex: function(script) {
		var existingIndex = -1;
		for (var i = 0, n = this.getScriptCount(); i < n; i++) {
			var existingScript = this.getScript(i);
			if (existingScript.url == script.url) {
				existingIndex = i;
			}
		}
		return existingIndex;
	},
	
	// function getColumnIndicesWithName(columnName): [int]
	getColumnIndicesWithName: function(columnName) {
		var lowerCaseColumnName = columnName.toLowerCase();
		return this.columnNameToNum[lowerCaseColumnName] || [];
	},
	
	// function getColumnIndex(columnName: string, columnNameOccurrence: int?): int
	getColumnIndex: function(columnName, columnNameOccurrence) {
		var columnNameOccurrenceIndex;
		if (columnNameOccurrence == null) {
			columnNameOccurrenceIndex = 0;
		}
		else {
			columnNameOccurrenceIndex = columnNameOccurrence - 1;
		}
		
		var columnIndices = this.getColumnIndicesWithName(columnName);
		if (columnNameOccurrenceIndex >= columnIndices.length) {
			return -1;
		}
		else {
			return columnIndices[columnNameOccurrenceIndex];
		}
	},
	
	// Used to resize the data table to a specific row/column size.
	//
	// private function modifyDataToSize(rowSize: int, columnSize: int): void
	_modifyDataToSize: function(rowSize, columnSize) {
		var columnChange = (columnSize != this.columnNames.length);
		var columnsShrink = (columnSize < this.columnNames.length);
		
		var rowChange = (rowSize != this.data.length);
		var rowsShrink = (rowSize < this.data.length);
		
		if (rowChange && rowsShrink) {
			// remove extra rows that we don't need anymore
			this.data.splice(rowSize, this.data.length - rowSize);
			this.metaData.splice(rowSize, this.data.length - rowSize);
		}
		
		if (columnChange) {
			if (columnsShrink) {
				// remove extra columns that we don't need
				this.columnNames.splice(columnSize, this.columnNames.length - columnSize);
				
				for (var i = 0; i < this.data.length; i++) {
					this.data[i].splice(columnSize, this.columnNames.length - columnSize);
					this.metaData[i].splice(columnSize, this.columnNames.length - columnSize);
				}
			}
			else {
				// add extra column names (using numeric names)
				var numExtraColumns = columnSize - this.columnNames.length;
				for (var i = 0; i < numExtraColumns; i++) {
					this.columnNames.push(this.columnNames.length.toString());
				}
				
				// add extra columns with empty data to the existing rows
				for (var i = 0; i < this.data.length; i++) {
					var data = this.data[i];
					var metaData = this.metaData[i];
					for (var j = 0; j < numExtraColumns; j++) {
						data.push("");
						metaData.push("");
					}
				}
			}
		}
		
		if (rowChange && !rowsShrink) {
			// add rows
			var numExtraRows = rowSize - this.data.length;
			for (var i = 0; i < numExtraRows; i++) {
				var newRow = [];
				var newMetaRow = [];
				for (var j = 0; j < columnSize; j++) {
					newRow.push("");
					newMetaRow.push("");
				}				
				this.data.push(newRow);
				this.metaData.push(newMetaRow);
			}
		}
	},

	setFireEvents: function(flag) {
		this.fireEvents = flag;
	},
	
	_getListeners: function(eventType) {
		var listenersForEventType = this.listeners[eventType];
		if (listenersForEventType == null) {
			listenersForEventType = [];
			this.listeners[eventType] = listenersForEventType;
		}
		return listenersForEventType;
	},
	
	addEventListener: function(eventType, listener) {
		this._getListeners(eventType).push(listener);
	},
	
	removeEventListener: function(eventType, listener) {
		var listenersForEventType = this._getListeners(eventType);
		for (var i = listenersForEventType.length - 1; i >= 0; i--) {
			if (listenersForEventType[i] == listener) {
				listenersForEventType.splice(i, 1);
			}
		}
	},

	_fireEvent: function(eventType, eventObject) {
		if (this.fireEvents) {
			var listenersForEventType = this._getListeners(eventType);
			for (var i = 0, n = listenersForEventType.length; i < n; i++) {
				var listener = listenersForEventType[i];
				listener(eventObject);
			}
		}
	}
}

ScratchSpaceTable.Action = function() {
	//TODO figure out what, if anything, goes in here
}

ScratchSpaceTable.Action.parse = function(s) {
	// Simple regex matching for now
	if (m = s.match(/extract\s+(.*)\s+from\s+(.*)/i)) {
		var url = m[2];
		var xpathsJson = m[1];
		var xpaths = JSON.parse(xpathsJson);
		return new ScratchSpaceTable.ExtractAction(url, xpaths);
	}
	else if (m = s.match(/run\s+script\s+(\d+)(?:\s+on\s+row\s+(\d+))?/i)) {
		var scriptId = parseInt(m[1]);
		if (m[2] != null) {
			var rowIndex = parseInt(m[2]);
			return new ScratchSpaceTable.RunScriptAction(scriptId, rowIndex);
		}
		else {
			return new ScratchSpaceTable.RunScriptAction(scriptId);
		}
	}
	else {
		return new ScratchSpaceTable.UnrecognizedAction(s);
	}
}

ScratchSpaceTable.ExtractAction = function(url, xpaths) {
	this.url = url;
	this.xpaths = xpaths;
}

ScratchSpaceTable.ExtractAction.prototype.toString = function() {
	return "Extract " + this.xpaths.toSource() + " from " + this.url;
}

ScratchSpaceTable.ExtractAction.prototype.run = function(scratchSpaceEditor) {
	//TODO
}

ScratchSpaceTable.RunScriptAction = function(scriptId, rowIndex) {
	this.scriptId = scriptId;
	if (rowIndex == null) {
		this.rowIndex = -1;
	}
	else {
		this.rowIndex = rowIndex;
	}
}

ScratchSpaceTable.RunScriptAction.prototype.toString = function() {
	var s = "Run script " + this.scriptId;
	if (this.rowIndex != -1) {
		s += " on row " + this.rowIndex;
	}
	return s;
}

ScratchSpaceTable.RunScriptAction.prototype.run = function(scratchSpaceEditor) {
	var coscripter = scratchSpaceEditor.getBrowserWindow().top.coscripter;
	var scriptUrl = getUtils().getKoalescenceAPIFunction('script/' + this.scriptId);
	
	if (this.rowIndex == -1) {
		coscripter.loadProcedureIntoSidebar(scriptUrl, true);
	}
	else {
		var currentTableIndex = scratchSpaceEditor.getCurrentTableIndex();
		// Select only the row specified in this action
		for (var i = 0, n = scratchSpaceEditor.getDataRowCount(currentTableIndex); i < n; i++) {
			scratchSpaceEditor.setDataRowSelected(currentTableIndex, i, false);
		}
		scratchSpaceEditor.setDataRowSelected(currentTableIndex, this.rowIndex, true);
		
		coscripter.loadProcedureIntoSidebarWithScratchSpaceEditor(scriptUrl, true, scratchSpaceEditor);
	}
}

ScratchSpaceTable.InsertRowAction = function() {
	//TODO
}

ScratchSpaceTable.InsertColumnAction = function() {
	//TODO
}

ScratchSpaceTable.DeleteRowAction = function() {
	//TODO
}

ScratchSpaceTable.DeleteColumnAction = function() {
	//TODO
}

ScratchSpaceTable.EditCellAction = function() {
	//TODO
}

ScratchSpaceTable.UnrecognizedAction = function(str) {
	this.str = str;
}

ScratchSpaceTable.UnrecognizedAction.prototype.toString = function() {
	return this.str;
}

ScratchSpaceTable.UnrecognizedAction.prototype.run = function() {
	// Intentionally empty
}

//debug('done parsing coscripter-scratch-space.js')