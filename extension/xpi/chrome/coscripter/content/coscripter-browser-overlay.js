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
// within all coscripter files loaded into the MainChromeWindow, use coscripter.debug to print messages to the Error Console for debugging

// coscripter-browser-overlay.js is loaded into Firefox's mainChromeWindow by coscripter-browser-overlay.xul,
// along with coscripter-statusbar.js and coscripter-content-type-handler.js. 
// coscripter-scratch-space-browser-overlay.js is loaded into Firefox's mainChromeWindow by coscripter-scratch-space-browser-overlay.xul,
// along with coscripter-scratch-space-editor.js and coscripter-data-extraction-mode.js.
// 
// This file contains the 'coscripter' object (with methods for opening, closing, and loading the sidebar) and Top-Level Actions
//////////////////////////////////////////////////////////////////////////////////////////////////
//					          CoScripter object 
//////////////////////////////////////////////////////////////////////////////////////////////////
var coscripter = {
    components : registry,
	Preferences : {
		DO_CONSOLE_DEBUGGING		: false,
		DO_DUMP_DEBUGGING 			: false
	},
	consoleService : Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService),
	debugFilename : 'coscripter-browser-overlay',
	debug : function(msg){
		if(coscripter.Preferences.DO_CONSOLE_DEBUGGING) coscripter.consoleService.logStringMessage(coscripter.debugFilename + ": " + msg )
		if(coscripter.Preferences.DO_DUMP_DEBUGGING) dump(coscripter.debugFilename + ": " + msg + "\n")
	},
	errorMsg : function(msg){
		coscripter.consoleService.logStringMessage(coscripter.debugFilename + ": CoScripter Error Thrown: " + msg )
	},

    // here's the chrome address of the sidebar.xul window, which is useful to know when we want to see if the sidebar is open
    sidebarXulUrl : "chrome://coscripter/content/coscripter-sidebar.xul",
	newScriptTemplateUrl : "chrome://coscripter/content/interactor.html",
    // this is the id we pass to "toggleSidebar" in order to open the coscripter sidebar
	sidebarViewId : "view-coscripter-sidebar",

    statusbar : new Statusbar(), // defined in coscripter-statusbar.js

	// Reference to the personal db used by CoScripter sidebar
	// It will be initialized by the sidebar in its onLoad method
	db : null,

	//////////////////////////////////////////////////////////////////////////////////////////
	//					Opening, Closing, and Loading the sidebar
	//            	           onLoad, onUnLoad							
	//////////////////////////////////////////////////////////////////////////////////////////
	
	// this is a reference for a method that, if defined, will be executed once the sidebar is open
	sidebarListener : null, 
	
    setSidebarTitle: function(title, coscripterName) {
		//coscripterName is passed in so that it can be localized
       document.getElementById('sidebar-title').value = coscripterName + ": " + title;
    },

	//Checks whether coscripter is visible in the sidebar
     isSidebarVisible : function() {
		try {
			var sidebarBrowser = coscripter.components.utils().getSidebarBrowser(window)
			var contentDocument = sidebarBrowser.contentDocument  //this breaks if sidebar isn't visible
			return sidebarBrowser.getAttribute("src") == coscripter.sidebarXulUrl
		}
		catch (e) {return false}
    },

	// this ensures that the sidebar is open,
    // but in order to wait until the sidebar has finished loading,
    // we have to pass a continuation handler to run after the load
	makeSidebarOpen : function(thenDoThis) {
		if (coscripter.isSidebarVisible()) thenDoThis()
		else {
			coscripter.sidebarListener = thenDoThis
			toggleSidebar(coscripter.sidebarViewId, true)	//FFox call
		}
	},
	
	makeSidebarClosed : function(){
		if (coscripter.isSidebarVisible()){
			toggleSidebar(coscripter.sidebarViewId)	//FFox call
		}
	},
	
	// called by tools>coscripter menu item
	toggleSidebar : function(sidebarid) {
		if (!sidebarid) {
			sidebarid = coscripter.sidebarViewId;
		}
		toggleSidebar(sidebarid)	//FFox call
	},
	
	// Starts recording a new procedure in the sidebar 
	startNewProcedureInSidebar : function() {
		coscripter.makeSidebarOpen(
			function() {
				coscripter.components.utils().getCoScripterWindow(window).onNew();
			}
		)
	},
	
	//called by coscripter: protocol to load a procedure into the sidebar
	loadProcedureIntoSidebar : function(url, runP) {
		coscripter.makeSidebarOpen(
			// the function below will be run after the sidebar finishes opening.
			//loadProcedure waits for procedureBrowser to finish loading the procedure, and then calls setUpRunMode
			//Not waiting twice before calling setUpRunMode is what caused the previous 
			// "this.docShell has no properties" errors in Ffox's browser.xml
			function() {
			    coscripter.components.utils().getCoScripterWindow(window).loadProcedure(url, runP)
			}
		)
	},
	
	//Loads a procedure into the sidebar with the specified scratch space editor as context
	loadProcedureIntoSidebarWithScratchSpaceEditor : function(url, runP, spaceEditor) {
		coscripter.makeSidebarOpen(
			// the function below will be run after the sidebar finishes opening.
			//loadProcedure waits for procedureBrowser to finish loading the procedure, and then calls setUpRunMode
			//Not waiting twice before calling setUpRunMode is what caused the previous 
			// "this.docShell has no properties" errors in Ffox's browser.xml
			function() {
			    coscripter.components.utils().getCoScripterWindow(window).loadProcedureWithScratchSpaceEditor(url, runP, spaceEditor)
			}
		)
	},
	
	//called by coscripter-content-handler.js when coscripter mime type is loaded 
	loadProcedureDataIntoSidebar : function(data, runP) {
		coscripter.makeSidebarOpen(
			// the function below will be run after the sidebar finishes opening.
			//loadProcedure waits for procedureBrowser to finish loading the procedure, and then calls setUpRunMode
			//Not waiting twice before calling setUpRunMode is what caused the previous 
			// "this.docShell has no properties" errors in Ffox's browser.xml
			function() {
			    coscripter.components.utils().getCoScripterWindow(window).loadProcedureData(data,
					// 3rd param is script variables; TODO get them out of
					// the MIME type and pass in here
					false, null);
			}
		)
	},
		
	// This is an asynchronous call.  It will call callback(val) with
	// val null if the server is unavailable, or a json object containing
	// server parameters if the server is available.
	hasKoalescenceConnection: function(callback) {
		// We're assuming that if there's connectivity to the API then koalescence is up and running.
		// If the hostname does not resolve (e.g. you're outside the firewall) then it will return false.
		var timedOut = false;
		try {
			var h = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance()
			var url = coscripter.components.utils().getKoalescenceAPIFunction('ping');
			var async = true;
			h.open("get", url, async)
			h.setRequestHeader("COSCRIPTERVERSION" ,coscripter.components.utils().coscripterVersion())
		
			h.onreadystatechange = function() {
				if (h.readyState == 4) {
					clearTimeout(requestTimer);
					if (timedOut){
						callback(false)
					} else {
						try {
							if (h.status >= 200 && h.status < 300){ 
								var ret = JSON.parse(h.responseText);
								callback(ret) // worked fine
							} else {
								callback(null)	// server returned error
							}
						} catch (e) {
							// other error: connection refused, DNS failure
							callback(null);
						}
					}
				} else {
					// Don't do anything, we're not ready yet
				}
			}
	
			// Set a timeout that fires after 2 seconds just in case network calls take too long
			var requestTimer = setTimeout(function() {
					timedOut = true
					h.abort()
				 }, 2000)
	
			h.send(null)
		} catch(e) {
			dump('caught exception in hasKC: ' + e + '\n');
			callback(false);
		}
	},
	
	// loads a url into the main browser (not the sidebar browser)
    loadUrlIntoMainBrowser : function(url) {
	// if (coscripter.hasKoalescenceConnection())
	coscripter.components.utils().getCurrentContentBrowser(window).loadURI(url)
    },
	
    // loads the koalescence homepage into the main browser (not the sidebar)    
    loadCoScripterWikiHomepage : function() {
		try {
			var koalescenceURL = coscripter.components.utils().getKoalescenceURL();
			if (koalescenceURL) coscripter.loadUrlIntoMainBrowser(koalescenceURL);
			else throw 'coscripter-browser-overlay error in loadUrlIntoMainBrowser\n';
 		} catch(e) {
			dump('caught exception in hasKC: ' + e + '\n')
		}
   },
	
	setupSaveWarning : function() {
		if (window.toggleSidebar == null)
		{
			window.setTimeout(coscripter.setupSaveWarning, 1000);
			return;
		}
		var oldToggleSidebar = window.toggleSidebar;
	
		window.toggleSidebar = function(id) {
			// TL: this code is fishy when you have the ConQuery extension installed -- window.parent.document has no attributes
			if (window && window.parent && window.parent.document) {
				var extBar = window.parent.document.getElementById(coscripter.sidebarViewId);
				if (extBar.getAttribute("checked")) {
					var sidebar = coscripter.components.utils().getCoScripterWindow(window);
					if (sidebar) {
						if (sidebar.warnUnsavedChanges()) {
							// It returns true iff we do not close
							// We don't want to close, so return here before calling oldToggleSidebar
							return;
						}
					}
				}
			}
			oldToggleSidebar(id);
		};
	},

    enableRelatedScripts : function(on) {
		coscripter.statusbar.enableRelatedScripts(on);
    },
    
    enableCustomEventListener : function() {
		// TL: sometimes this gets called before window.gBrowser exists, so
		// I'm adding a poll here to wait for gBrowser to exist
		// window.gBrowser is null for non-browser windows (e.g. the Error Console)
		if (typeof(window.gBrowser) != "undefined" && window.gBrowser != null) {
			//coscripter.debug("coscripter enableCustomEventListener: contentType: " + window.document.contentType +", title: " + window.document.title)
			window.gBrowser.addEventListener("load",coscripter.onAnyPageLoad,true);
		} else {
			window.setTimeout("coscripter.enableCustomEventListener();",
				1000);
		}
    },

    onAnyPageLoad : function(event) {
    	// TODO: Add more events here
		// The MainChromeWindow's onload event fires whenever a new tab is added or a new content window is loaded into a tab
		//    and even whenever you mouse over the close "x" in a tab for a browser
		// The event's target is the document
        event.target.addEventListener("CoScripterCreateScript",coscripter.onCreateScript,true); 
        event.target.addEventListener("CoScripterDojoOnChange",coscripter.onDojoOnChange,true); 
        //event.target.addEventListener("CoScripterDojoOnFocus",coscripter.onDojoOnFocus,true); 

		coscripter.addDojoListeners(event);
    },
	
    // If the page uses Dojo, add listeners for Dojo Widget events
    addDojoListeners : function(event) {    // event is a load event
		var doc = event.target.contentDocument
		if (!doc) return;
		var dijitNodes = doc.evaluate('//*[contains(@class,"dijit ")]', doc.documentElement, null, 5, null )    // 5 is ordered
		var firstDijitNode = dijitNodes.iterateNext();
        if (!firstDijitNode) return;
		
		function CoScripterMarkDijits() {
			dojo.query(".dijit").forEach(function(dijitNode) {
			    // Add a "CoScripterDijitClass" attribute to all dijit nodes
			    var widget = dijit.byNode(dijitNode); 
			    dijitNode.setAttribute("CoScripterDijitClass", widget.declaredClass); 
			    // When an internal dojo onChange event fires, get the new value of the dijit, 
			    //and send a custom CoScripterDojoOnChange event
			    dojo.connect(widget, "onChange", function(){ 
			       dijitNode.setAttribute("CoScripterDojoOnChangeNewLabel", widget.getDisplayedValue ? widget.getDisplayedValue() : ""); 
			       var evt = document.createEvent("Events"); 
			       evt.initEvent("CoScripterDojoOnChange", true, false); 
			       dijitNode.dispatchEvent(evt);});
			  })
		};
		
        var newContent = doc.createElement('script')
        newContent.setAttribute("type", "text/javascript")
        newContent.appendChild(doc.createTextNode(CoScripterMarkDijits.toSource()));
        newContent.appendChild(doc.createTextNode("\nCoScripterMarkDijits()"));
        firstDijitNode.parentNode.insertBefore(newContent, firstDijitNode);
		
		// Now add listeners for Custom Dojo Widgets
		//var dojoCombobox = doc.evaluate('//input[@wairole="combobox"]', doc, null, 9, null ).singleNodeValue;
    },
    
    // Called when we receive the custom "CoScripterCreateScript" event,
    // triggered by the user clicking the "create script" button on Koalescence
    onCreateScript : function(event) {
        coscripter.startNewProcedureInSidebar();
    },
    
    // Called when we receive the custom "CoScripterDojoOnChange" event, triggered by a dijit onChange event
	// Yule can't handle this event, because it doesn't capture Custom events.
    onDojoOnChange : function(event) {
        //coscripter.debug("coscripter-browser-overlay: onDojoOnChange: a dijit onChange event was received ")
        var commandGenerator = coscripter.components.commandGenerator()
		//commandGenerator.handleEvent(event)
        commandGenerator.handleEvent.apply(commandGenerator, [event]);
       //commandGenerator._onCoScripterDojoOnChange(event)
    },
    
    // Called when we receive the custom "CoScripterDojoOnFocus" event, triggered by a dijit onFocus event
    onDojoOnFocus : function(event) {
        //coscripter.debug("coscripter-browser-overlay: onDojoOnFocus: a dijit onFocus event was received ")
        var commandGenerator = coscripter.components.commandGenerator();
        commandGenerator.handleEvent.apply(commandGenerator, [event]);
        //commandGenerator._onCoScripterDojoOnChange(event)
    },
    
	// consolidated all initialization code here:
	main : function(){
	    // before this "main" runs, components of the extensions are added to the component registry 
		// -> look for coscripter.registerComponents 
	    coscripter.setupSaveWarning();
	    coscripter.enableTestSidebar();
	    coscripter.enableCustomEventListener();
	    //coscripter.setupMicroformats();
	    
	    //window.addEventListener("load", coscripter.addInstructionCursor, true);
	    // See if Logging should start immediately
	    if (coscripter.components.logger()) {
	       coscripter.components.logger().initializeLogging();
	    }
	    coscripter.displayReleaseNotes();
	},
	
	registerComponents : function(){
		coscripter.components.addComponent("logger", "resource://coscripter/coscripter-logger.js");
		coscripter.components.addComponent("tabler", "resource://coscripter/coscripter-scratch-table.js");
		coscripter.components.addComponent("statusbar", "resource://coscripter/coscripter-statusbar.js");
		coscripter.components.addComponent("uFObserver","resource://coscripter/coscripter-uf-observer.js");
		coscripter.components.addComponent("coscripterPreview","resource://coscripter/coscripter-preview.js");
	},
	
	setupMicroformats: function(){
	    try {
	        coscripter.components.uFObserver().start();
	    } 
	    catch (e) {
	        coscripter.debug(e.toSource());
	    }
	},
	
	displayReleaseNotes : function(){
		var chromeWindow = coscripter.components.utils().getMainChromeWindow(window)
		if(chromeWindow == null)
			return ;
		var prefs = coscripter.components.utils().getCoScripterPrefs()
		var version = coscripter.components.utils().coscripterVersion();
		// firstUse user preference: the firstUse pref keeps track of whether the user has used this extension before. If not, a Logging Notice page will be displayed
		if (!prefs.prefHasUserValue('notFirstUse_' + version) || !prefs.getBoolPref('notFirstUse_' + version)) {
			// Display Release Notes
			var url = "chrome://coscripter/content/coscripter-release-notes.xhtml"
			chromeWindow.gBrowser.selectedTab = gBrowser.addTab(url);
			prefs.setBoolPref("notFirstUse_" + version, true) // Set notFirstUse to true
		}
	},
	
	enableTestSidebar:function (){
		try {
			var coscripterPrefs = coscripter.components.utils().getCoScripterPrefs();
			if (coscripterPrefs.prefHasUserValue('showTestSidebar') && coscripterPrefs.getBoolPref('showTestSidebar')) {
				var menu = document.getElementById("coscripter-test");
				menu.removeAttribute("hidden");
			}
		} catch (e) {
			// Don't do anything
		}
	},


	// ----------------------------------------------------------------------
	// Add CoScripter-specific items to the right-click context menu

	// Callback when user right-clicks on a web page and a context menu comes up
	showHideContextItems : function() {
		var sep = document.getElementById("coscripter-contextseparator");
		var menuitem = document.getElementById("coscripter-clip");

		var recording = coscripter.components.utils().getCoScripterWindow(window).recording;
		if (sep && menuitem && coscripter.isSidebarVisible() && recording) {
			// TODO: check whether we're recording
			sep.hidden = false;
			menuitem.hidden = false;
		} else {
			sep.hidden = true;
			menuitem.hidden = true;
		}

		// TL: this was for the menu item that let you import lists of
		// instructions on a webpage and turn them into a CoScripter
		// script.  It didn't work so well, so it's disabled.
		/*
		var menuitem = document.getElementById("coscripter-extract");
		if (menuitem) {
			if (scriptNode != null) {
				menuitem.hidden = false;
			} else {
				menuitem.hidden = true;
			}
		}
		*/
	},

	// Callback when user selects "clip node" from the right-click context menu
	clipNode : function(ev, target) {
		var sidebar = coscripter.components.utils().getCoScripterWindow(window);
		sidebar.unRegisterToReceiveRecordedCommands();
		
		// Add listeners to all of the frames in the contentWindow
		var frame = null
		var contentWindow = window.gBrowser.contentWindow
		if (contentWindow.frames.length == 0) {	// There are no frames.  John Barton discusses this lunacy at http://groups.google.com/group/mozilla.dev.platform/browse_thread/thread/5628c6f346859d4f/169aa7004565066?hl=en&ie=UTF-8&oe=utf-8&q=window.frames&pli=1
			frame = contentWindow.frames
			// frame.frameElement.getAttribute("title")
			// Even with nested framesets, this gets all of the frames in the contentWindow
			// But it won't get subframes, so it should be rewritten to be recursive (AC)
			frame.document.addEventListener("mouseover", coscripter.highlightTarget, false);
			frame.document.addEventListener("mouseout", coscripter.unhighlightTarget, false);
			frame.document.addEventListener("click", coscripter.captureTarget, true);
		}
		else for (var i=0; i<contentWindow.frames.length; i++) {
			frame = contentWindow.frames[i]
			// frame.frameElement.getAttribute("title")
			// Even with nested framesets, this gets all of the frames in the contentWindow
			frame.document.addEventListener("mouseover", coscripter.highlightTarget, false);
			frame.document.addEventListener("mouseout", coscripter.unhighlightTarget, false);
			frame.document.addEventListener("click", coscripter.captureTarget, true);
		}
		if (contentWindow.document){	// maps.google.com wasn't capturing events using frame.document above
			frame = contentWindow
			// frame.frameElement.getAttribute("title")
			// Even with nested framesets, this gets all of the frames in the contentWindow
			frame.document.addEventListener("mouseover", coscripter.highlightTarget, false);
			frame.document.addEventListener("mouseout", coscripter.unhighlightTarget, false);
			frame.document.addEventListener("click", coscripter.captureTarget, true);
		}
	},

	highlightTarget: function(event) {
		var node = event.target;
		node.style.setProperty("outline-style", "solid", "important");
		node.style.setProperty("outline-width", "2px", "important");
		node.style.setProperty("outline-color", "#ff0000", "important");
	},
	unhighlightTarget: function(event) {
		var node = event.target;
		node.style.removeProperty("outline-style");
		node.style.removeProperty("outline-width");
		node.style.removeProperty("outline-color");
	},

	// Given this DOM node, create a Clip command in the script
	captureTarget: function(event) {
		// Prevent the click from going through to the underlying page
		event.stopPropagation();
		event.preventDefault();
		
		// Remove our event listeners from all frames
		var frame = null
		var contentWindow = window.gBrowser.contentWindow
		if (contentWindow.frames.length == 0) {	// There are no frames	
			frame = contentWindow.frames
			// frame.frameElement.getAttribute("title")
			// Even with nested framesets, this gets all of the frames in the contentWindow
			// But it won't get subframes, so it should be rewritten to be recursive (AC)
			frame.document.removeEventListener("mouseover", coscripter.highlightTarget, false);
			frame.document.removeEventListener("mouseout", coscripter.unhighlightTarget, false);
			frame.document.removeEventListener("click", coscripter.captureTarget, true);
		}
		else for (var i=0; i<contentWindow.frames.length; i++) {
			frame = contentWindow.frames[i]
			// frame.frameElement.getAttribute("title")
			// Even with nested framesets, this gets all of the frames in the contentWindow
			frame.document.removeEventListener("mouseover", coscripter.highlightTarget, false);
			frame.document.removeEventListener("mouseout", coscripter.unhighlightTarget, false);
			frame.document.removeEventListener("click", coscripter.captureTarget, true);
		}
		if (contentWindow.document){	// maps.google.com wasn't capturing events using frame.document above
			frame = contentWindow
			// frame.frameElement.getAttribute("title")
			// Even with nested framesets, this gets all of the frames in the contentWindow
			frame.document.removeEventListener("mouseover", coscripter.highlightTarget, false);
			frame.document.removeEventListener("mouseout", coscripter.unhighlightTarget, false);
			frame.document.removeEventListener("click", coscripter.captureTarget, true);
		}
		
		// Unhighlight the node
		coscripter.unhighlightTarget(event);
		
		var sidebar = coscripter.components.utils().getCoScripterWindow(window);
		sidebar.registerToReceiveRecordedCommands();
		
		var xpath = coscripter.components.utils().getIdXPath(event.target);
		var sidebar = coscripter.components.utils().getCoScripterWindow(window);
		var step = "clip the x\"" + xpath + "\"";
		// TL: create clip command
		if ("" != xpath) {
			var cmd = coscripter.components.commands().createClipFromParams(event,
				event.target);
			sidebar.insertCommand(cmd);
		}
	},

	// Was used by the list-to-script functionality
	/*
	nodeContainingScript:function(n) {
		while (n) {
			if (n.nodeName == "UL" || n.nodeName == "OL") {
				// found it
				return n;
			} else {
				n = n.parentNode;
			}
		}
		return null;
	},
	*/

	// ----------------------------------------------------------------------
	// Display a special cursor when the user mouses over any instructions
	// TL: currently not in use, was used by the list-to-script
	// functionality
	/*
	addInstructionCursor : function(event) {
		var doc = coscripter.components.utils().getDocumentWithEvaluate(
			event.originalTarget);
		if (doc != null) {
			// Find all the instruction blocks in this document
			var lists = doc.evaluate('//ul | //ol', doc, null, 7, null);
			var i;
			for (i=0; i<lists.snapshotLength; i++) {
				var list = lists.snapshotItem(i);
				var oldstyle = list.getAttribute("class");
				var newstyle;
				if (oldstyle == null || oldstyle == "") {
					newstyle = "coscripter_instruction";
				} else {
					newstyle = oldstyle + " coscripter_instruction";
				}
				list.setAttribute("class", newstyle);
			}
			// Append our style to the document
			if (doc.body) {
				var style = doc.createElement("style");
				style.textContent = ".coscripter_instruction { cursor:url(chrome://coscripter/skin/images/feathers-button.gif), auto; }";
				doc.body.appendChild(style);
			}
		}
	}
	*/
};	// end of definition of coscripter object


//////////////////////////////////////////////////////////////////////////////////////////////////
//					          Top-Level Actions
//////////////////////////////////////////////////////////////////////////////////////////////////
// Performed when this new MainChromeWindow is created
// components have to be registered as the very first thing
coscripter.registerComponents();
window.setTimeout('coscripter.main()', 2000);
