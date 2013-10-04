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

const CC = Components.classes, CI = Components.interfaces, CIS = CI.nsISupports

var coscripterPrefs = {
	serverList : [],
	defaultServer : -1,

	prefs : CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).
		getBranch("coscripter."),

	init : function() {
		// default preferences go into xpi/defaults/preferences/coscripter.js
		// If there is a Logging component (i.e. the IBM-internal version), show the Logging tab
		var logger = CC["@coscripter.ibm.com/coscripter-logger/;1"] ? CC["@coscripter.ibm.com/coscripter-logger/;1"].getService(CIS).wrappedJSObject : null	
		if (logger) {
			document.getElementById('loggingTabLabel').collapsed = false
			document.getElementById('loggingTabContents').collapsed = false
		} else {
			document.getElementById('loggingTabLabel').collapsed = true
			document.getElementById('loggingTabContents').collapsed = true			
		}

		try {

			// Populate the server list
			var serverlistdata = this.prefs.getCharPref('serverList');
			this.serverList = JSON.parse(serverlistdata);
			var listbox = document.getElementById('serverList');
			for (var i=0; i<this.serverList.length; i++) {
				var server = this.serverList[i];
				var item = document.createElement("listitem");
				item.setAttribute("label", server["name"]);
				item.server = server;
				listbox.appendChild(item);
			}
	
			// Set the default server
			this.defaultServer = -1;
			var defaultServer = this.prefs.getIntPref('defaultServer');
			if (defaultServer < 0 || defaultServer > this.serverList.length) {
				defaultServer = 0;
			}
			this.updateDefault(defaultServer);

			// Enable the Edit, Set as Default, and Delete buttons only
			// if a server is selected
			var editServerButton = document.getElementById("editServer");
			var setDefaultServerButton = document.getElementById("setAsDefaultServer");
			var deleteServerButton = document.getElementById("deleteServer");
			var that = this;
			listbox.addEventListener('select', function(event){
				editServerButton.disabled = (listbox.selectedCount == 0);
				setDefaultServerButton.disabled = (listbox.selectedCount == 0 || that.defaultServer == listbox.selectedIndex);
				deleteServerButton.disabled = (listbox.selectedCount == 0 || listbox.getRowCount() == 1);
			}, false);

		} catch (e) {
			dump('error populating servers: ' + e + '\n');
		}

		
		// Recording
		var recordAllClicksP = this.prefs.getBoolPref('recordAllClicksP');
		document.getElementById('recordAllClicksP').checked = recordAllClicksP
		
		var recordDialogsP = this.prefs.getBoolPref('recordDialogsP');
		document.getElementById('recordDialogsP').checked = recordDialogsP
		
		// Local Save
		var saveLocal = this.prefs.getIntPref('saveLocal');	//0 (the default) means "to CoScripter server", 1 means localSave
		document.getElementById('saveWhere').selectedIndex = saveLocal

		//In Feb08 release on TAP, the recordActionHistory pref is used to determine whether to Log to the CoScripter server.
		var recordActionHistory = this.prefs.getCharPref('recordActionHistory');	//"1" means "when sidebar is open"
		document.getElementById('recordActionHistory').selectedIndex = recordActionHistory

		var showBubbleHelp = this.prefs.getBoolPref('showBubbleHelp');
		document.getElementById('showBubbleHelp').checked = showBubbleHelp;

		var contextP = this.prefs.getBoolPref('contextP');
		document.getElementById('contextP').checked = contextP;

		var spreadsheetP = this.prefs.getBoolPref('spreadsheetP');
		document.getElementById('spreadsheetP').checked = spreadsheetP;

		//var showMashupTables = this.prefs.getBoolPref('showMashupTables');
		//document.getElementById('showMashupTables').checked = showMashupTables;
		
	},

	save : function() {
		// Save list of servers
		var server_json = JSON.stringify(this.serverList);
		this.prefs.setCharPref('serverList', server_json);
		this.prefs.setIntPref('defaultServer', this.defaultServer);

		// Save the remaining preferences
		this.prefs.setCharPref('recordActionHistory', document.getElementById('recordActionHistory').selectedIndex);
		this.prefs.setBoolPref('recordAllClicksP', document.getElementById('recordAllClicksP').checked);
		this.prefs.setBoolPref('recordDialogsP', document.getElementById('recordDialogsP').checked);
		this.prefs.setBoolPref('showBubbleHelp', document.getElementById('showBubbleHelp').checked);
		this.prefs.setBoolPref('contextP', document.getElementById('contextP').checked);
		this.prefs.setBoolPref('spreadsheetP', document.getElementById('spreadsheetP').checked);
		//this.prefs.setBoolPref('showMashupTables', document.getElementById('showMashupTables').checked);
		this.prefs.setIntPref('saveLocal', document.getElementById('saveWhere').selectedIndex);
	},

	displayLog : function() {
		try {
			var logger = CC["@coscripter.ibm.com/coscripter-logger/;1"].getService(CIS).wrappedJSObject
			if (logger){
				window.alert(logger.getRecentLogText())
			}
		} catch (e) {
			dump("Error in coscripterPrefs_displayLog: " + e + "\n");
		}
	},

	editServer : function() {
		var listbox = document.getElementById("serverList");
		var item = listbox.selectedItem;
		var index = listbox.selectedIndex;
		if (null === item) return;
		var server = item.server;

		// Use this params hash to pass arguments to/from the dialog
		var params = { inn: server, out: null};
		window.openDialog("chrome://coscripter/content/coscripterPrefs-server-dialog.xul",
			"", "chrome, dialog, modal, resizable=yes",
			params).focus();
		if (params.out) {
			item.server = params.out;
			if (listbox.selectedIndex == this.defaultServer) {
				// TL: need to localize this
				item.setAttribute("label", item.server["name"] + " (default)");
				// Also update the "default server" label
				coscripterPrefs.updateDefault(listbox.selectedIndex);
			}
			else {
				item.setAttribute("label", item.server["name"]);
			}
			this.serverList[index] = item.server;
		} else {
			// User clicked Cancel
			return;
		}
	},

	setDefault : function() {
		var listbox = document.getElementById("serverList");
		var index = listbox.selectedIndex;
		if (index == -1) return;
		
		coscripterPrefs.updateDefault(index);
	},

	updateDefault : function(serverIndex) {
		var listbox = document.getElementById('serverList');

		// Change the one currently labelled "(default)" to remove the
		// "(default)"
		var currentDefaultItem = listbox.getItemAtIndex(this.defaultServer);
		if (currentDefaultItem != null) {
			currentDefaultItem.setAttribute("label", currentDefaultItem.server.name);
		}

		// Add "(default)" to the newly selected default server
		this.defaultServer = serverIndex;
		// TL: need to localize this
		var item = listbox.getItemAtIndex(this.defaultServer);
		item.setAttribute("label", item.server.name + " (default)");
		
		// Disable the "set as default" button if the default is currently
		// selected
		var setDefaultServerButton = document.getElementById("setAsDefaultServer");
		setDefaultServerButton.disabled = (listbox.selectedIndex == -1 || this.defaultServer == listbox.selectedIndex);
		
		var defaultlabel = document.getElementById('serverDefault');
		// TL: need to localize this
		defaultlabel.value = "Default server: " + item.server.name;
	},

	addNewServer : function() {
		var params = { inn : { name : "", url : ""},
			out : null};

		window.openDialog("chrome://coscripter/content/coscripterPrefs-server-dialog.xul",
			"", "chrome, dialog, modal, resizable=yes",
			params).focus();
		if (params.out) {
			var listbox = document.getElementById("serverList");
			var item = document.createElement("listitem");
			item.setAttribute("label", params.out["name"]);
			item.server = params.out;
			listbox.appendChild(item);
			this.serverList[this.serverList.length] = params.out;
		} else {
			// User clicked Cancel
			return;
		}
	},

	deleteServer : function() {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
			getService(Components.interfaces.nsIPromptService);

		var listbox = document.getElementById("serverList");
		var item = listbox.selectedItem;
		var index = listbox.selectedIndex;
		if (null === item || index === -1) return;
		if (listbox.getRowCount() == 1) {
			// This should never get called, since the delete button is grayed out.
			// TL: need to localize
			prompts.alert(null, "Error deleting server", "You cannot delete the only server.");
			return;
		}
		
		// TL: need to localize
		var ret = prompts.confirmEx(window, "CoScripter: Delete Server",
			"Are you sure you want to delete the " + listbox.selectedItem.server.name + " server?",
			prompts.STD_YES_NO_BUTTONS, null, null, null, null, {});
		if (ret == 1) {
			return;
		}
		
		listbox.removeChild(item);
		this.serverList.splice(index, 1);
		var deleteServerButton = document.getElementById("deleteServer");
		deleteServerButton.disabled = (listbox.selectedCount == 0 || listbox.getRowCount() == 1);

		var defaultServer = this.defaultServer;
		if (defaultServer < 0 || defaultServer >= this.serverList.length) {
			defaultServer = 0;
		}
		coscripterPrefs.updateDefault(defaultServer);
	}
}

// other unused prefs:
//enablelogging, remotelogging, enablesearch, enablerelated, enablesimpleregressiondatabase

/*
function setLogging()
{
	var loggingCheckboxNode = document.getElementById('enablelogging');
	var remoteLoggingCheckboxNode = document.getElementById('remotelogging');
	if(loggingCheckboxNode && loggingCheckboxNode.checked) {
		remoteLoggingCheckboxNode.checked = false;
		var label = document.getElementById('remotelogging.label');
		if(label) label.setAttribute('hidden','true');
	}
}

function showLoggingText() 
{  
	var loggingCheckboxNode = document.getElementById('enablelogging');
	var remoteLoggingCheckboxNode = document.getElementById('remotelogging');
	var remoteLoggingLabelNode = document.getElementById('remotelogging.label');
	// works the other way around because the message gets sent before the checkbox is set
	if(!remoteLoggingCheckboxNode.checked) {
		remoteLoggingLabelNode.removeAttribute('hidden');
		loggingCheckboxNode.checked = true;
	}
	else
		remoteLoggingLabelNode.setAttribute('hidden','true');
}
*/
