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
Components.utils.import("resource://coscripter/coscripter-scratch-space.js");
// Debug method for all coscripter files loaded into Firefox's mainChromeWindow is coscripter.debug, defined in coscripter-browser-overlay.js

// coscripter-scratch-space-browser-overlay.js is loaded into Firefox's mainChromeWindow by coscripter-scratch-space-browser-overlay.xul,
// along with coscripter-scratch-space-editor.js and coscripter-data-extraction-mode.js.
//
// This file contains the UI for manipulating scratch spaces within the main window.
////////////////////////////////////////////////////////////////////
//////////////  coscripter-scratch-space-browser-overlay.js  ///////
////////////////////////////////////////////////////////////////////
(function() {
	var ScratchSpaceUI = function(window) {
		this.window = window;
		this.docked = true;
		this.visible = false;
		
		this.scratchSpace = null;
		this.scratchSpaceSource = null;
		
		this.scratchSpaceWindow = null;	// the floating window
		this.dockedEditor = null;
		
		// This actually gets set in CoScripterScratchSpaceWindow.onLoad()
		this.floatingEditor = null;
		
		this.initSaveButton = false;
		
		this.components = registry;
	}
	
	ScratchSpaceUI.prototype = {
		DOCKED_PANE: {docked: true},
		FLOATING_WINDOW: {docked: false},
		
		getScratchSpace: function() {
			return this.scratchSpace;
		},
		
		open: function(scratchSpace) {
			this.scratchSpace = scratchSpace;
			
			// Replace the editor in the docked window
			var attachPoint = this.getEditorAttachPoint(this.DOCKED_PANE);
			while (attachPoint.firstChild) {
				attachPoint.removeChild(attachPoint.firstChild);
			}
			
			this.dockedEditor = new CoScripterScratchSpaceEditor(this, this.window, this.window, this.DOCKED_PANE);

			if (!this.initSaveButton) {
				var that = this;
				this.getSaveButton(this.DOCKED_PANE).addEventListener('command', function(event) {
					that.saveButtonPressed();
				}, true);
				this.initSaveButton = true;
			}

			if (!this.initImportButton) {
				var that = this;
				this.getImportButton(this.DOCKED_PANE).addEventListener('command', function(event) {
					that.importButtonPressed();
				}, true);
				this.initImportButton = true;
			}
			
			//coscripter.debug("coscripter-scratch-space-browser-overlay open method calling this.setVisible")
			this.setVisible(true);
		},
		
		_setDockedPaneVisible: function(flag) {
			this.getDockedPane().hidden = !flag;
			this.getSplitter().hidden = !flag;
			if (flag) {
				// Since we are just hiding the docked pane when
				// we "undock" it, we need to manually refresh
				// the pane's contents when we "redock" it.
				//
				// There are timing issues with refresh (or more 
				// specifically, with XUL calls within refresh).
				// Therefore, delay just a bit before calling.
				var that = this;
				this.window.setTimeout(function() {
					that.dockedEditor.refresh();
				}, 100);
			}
		},
		
		_openWindow: function() {
			var that = this;
			this.scratchSpaceWindow = this.window.openDialog(
				"chrome://coscripter/content/coscripter-scratch-space-window.xul", 
				"CoScripter Table", 
				"chrome,dialog=no,resizable=yes", 
				{ui: that}
			);
		},
		
		_closeWindow: function() {
			this.scratchSpaceWindow.close();
			this.scratchSpaceWindow = null;
		},
			
		setVisible: function(makeVisible) {
			this.visible = makeVisible;
			if (this.isDocked()) {
				this._setDockedPaneVisible(makeVisible);
			}
			else {
				if (makeVisible) {
					this._openWindow();
				}
				else {
					this._closeWindow();
				}
			}
		},
		
		isVisible: function() {
			return this.visible;
		},
		
		setDocked: function(flag) {
			if (this.docked && !flag) {
				this.dockedEditor.saveScratchSpace();
			}
			else if (!this.docked && flag) {
				this.floatingEditor.saveScratchSpace();
			}
			
			this.docked = flag;
			if (this.isDocked()) {
				this._closeWindow();
				this._setDockedPaneVisible(true);
			}
			else {
				this._setDockedPaneVisible(false);
				this._openWindow();
			}
		},
		
		isDocked: function() {
			return this.docked;
		},
		
		_getDocument: function() {
			if (this.isDocked()) {
				return document;
			}
			else {
				return this.scratchSpaceWindow.document;
			}
		},
		
		getUIElement: function(id, context) {
			if (context === this.DOCKED_PANE) {
				return document.getElementById(id);
			}
			else if (context === this.FLOATING_WINDOW) {
				return this.scratchSpaceWindow.document.getElementById(id);
			}
			else {
				return this._getDocument().getElementById(id);
			}
		},
		
		getContainer: function(context) {
			return this.getUIElement('coscripterScratchSpaceContainer', context);
		},
		
		getEditorAttachPoint: function(context) {
			return this.getUIElement('coscripterScratchSpaceEditorAttachPoint', context);
		},
		
		getEditor: function(context) {
			if (context === this.DOCKED_PANE || (context == null && this.isDocked())) {
				return this.dockedEditor;
			}
			else {
				return this.floatingEditor;
			}
		},
		
		getScriptsMenu: function(context) {
			return this.getUIElement('coscripterScratchSpaceScriptsMenu', context);
		},
		
		getTitleTextBox: function(context) {
			return this.getUIElement('scratchSpaceTitleTextBox', context);
		},
		
		getSaveButton: function(context) {
			return this.getUIElement('saveScratchSpace', context);
		},
		
		getImportButton: function(context) {
			return this.getUIElement('importScratchSpace', context);
		},
		
		getSplitter: function() {
			return document.getElementById('coscripterScratchSpaceSplitter');
		},
		
		getDockedPane: function() {
			return document.getElementById('coscripterScratchSpaceDockedPane'); 
		},
		
		getBrowserWindow: function() {
			return this.window;
		},
		
		saveButtonPressed: function() {
			this.getEditor().saveScratchSpace();
			
			// Save scratch space to server
			var container = this.getContainer();
			var toolbar = this.getSaveButton().parentNode; 
			//container.style.cursor = "progress";
			//toolbar.style.cursor = "progress";
			
			if(true) {	//localScratchSpacesP
				var coscripterWindow = window.coscripter.components.utils().getCoScripterWindow(window)
				ScratchSpaceUtils.saveSpaceLocally(this.scratchSpace, coscripterWindow)
				//container.style.cursor = "auto";
				//toolbar.style.cursor = "auto";
				//Once the save is complete, update the list of scratchspaces in the sidebar
				//ScratchSpaceUtils.displaySpacesLocally()
				coscripterWindow.ScratchSpaceSidebar.initialize()
			}
			else {
				ScratchSpaceUtils.saveSpaceToServer(this.scratchSpace, function(success, statusCode, response) {
					container.style.cursor = "auto";
					toolbar.style.cursor = "auto";
					
					// TODO i18n
					var errorSavingTableExclamation = "Cannot save scratch space table";
					var serverReturnedErrorCode = "Server returned error code";
					
					if (!success) {
						var errorMsg = errorSavingTableExclamation;
						if (statusCode < 200 || statusCode >= 300) {
							errorMsg += ", Error code " + serverReturnedErrorCode + ": " + response;
						}
						alert(errorMsg);
					}
					
					//Once the save is complete, update the list of scratchspaces in the sidebar
					ScratchSpaceUtils.getSpacesFromServer(function(spaces) {
						var sidebarwindow = coscripter.components.utils().getCoScripterWindow(window)
						sidebarwindow.ScratchSpaceSidebar.initialize()
					})
						
					
				});	//end of ScratchSpaceUtils.saveSpaceToServer
			}
		},
		
		importButtonPressed: function() {
			this.getEditor().importDataFile()
		}
		
	} // end of ScratchSpaceUI.prototype
	
	coscripter.scratchSpaceUI = new ScratchSpaceUI(window);
}) ();


//////////////////////////////////////////////////////////////////////////////////////////////////
//					          Top-Level Actions
//////////////////////////////////////////////////////////////////////////////////////////////////
// Performed when this new browser window is created

// vim:set noet:ts=4:sts=4:sw=4:
