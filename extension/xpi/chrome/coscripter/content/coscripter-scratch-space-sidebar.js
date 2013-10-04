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

Components.utils.import("resource://coscripter/coscripter-scratch-space.js");

// Loaded in coscripter-sidebar.xul. Defines a global object in the coscripter-sidebar. Its initialize() method is called by initializeSidebar() by the sidebar's onLoad() method
var ScratchSpaceSidebar = function() {
	
	function openSelectedScratchSpace(event) {
		var scratchSpaceList = document.getElementById("scratchspaces");
		var spaceItem = scratchSpaceList.selectedItem;
		scratchSpaceList.setAttribute("style", "cursor: progress");
		if (true){
			loadSpaceLocally(spaceItem.value)
			scratchSpaceList.setAttribute("style", "");
		}
		else ScratchSpaceUtils.loadSpaceFromServer(spaceItem.value, function(scratchSpace) {
			scratchSpaceList.setAttribute("style", "");
			if (scratchSpace == null) {
				alert("Cannot load scratch space " + spaceItem.label + " from the server.");
			}
			else {
				window.top.coscripter.scratchSpaceUI.open(scratchSpace);
			}
		});
	}
	
	function deleteSelectedScratchSpace(event) {
		var scratchSpaceList = document.getElementById("scratchspaces");
		var spaceItem = scratchSpaceList.selectedItem;
		scratchSpaceList.setAttribute("style", "cursor: progress");
		if (true){
			var successP = deleteSpaceLocally(spaceItem.value)
		}
		else {
			successP = ScratchSpaceUtils.deleteSpaceFromServer(spaceItem.value)
		}
		if (successP) scratchSpaceList.removeChild(spaceItem)
		scratchSpaceList.setAttribute("style", "");
	}
	
	function createScratchSpace(event) {
		var scratchSpace = ScratchSpaceUtils.createScratchSpace();
		window.top.coscripter.scratchSpaceUI.open(scratchSpace);
		//window.top.coscripter.DataExtraction.startExtractionMode(window.top.gBrowser.selectedBrowser, window.top.coscripter.scratchSpaceUI);
	}
	
	return {
		initialize: function(){
			var scratchSpaceList = document.getElementById("scratchspaces");
			var openScratchSpaceButton = document.getElementById("openScratchSpace");
			var deleteScratchSpaceButton = document.getElementById("deleteScratchSpace");
			var newScratchSpaceButton = document.getElementById("newScratchSpace");
			
			scratchSpaceList.addEventListener('select', function(event){
				openScratchSpaceButton.disabled = (scratchSpaceList.selectedCount == 0);
				deleteScratchSpaceButton.disabled = (scratchSpaceList.selectedCount == 0);
			}, false);
			
			openScratchSpaceButton.addEventListener('command', openSelectedScratchSpace, false);
			deleteScratchSpaceButton.addEventListener('command', deleteSelectedScratchSpace, false);
			newScratchSpaceButton.addEventListener('command', createScratchSpace, false);
			
			scratchSpaceList.setAttribute("style", "cursor: progress");
			if (true) {
				displayLocalScratchSpaceList(openSelectedScratchSpace)
			}
			else {
				ScratchSpaceUtils.getSpacesFromServer(function(spaces) {
					scratchSpaceList.setAttribute("style", "");
					// Remove the "Loading..." item from the listbox
					while (scratchSpaceList.firstChild) {
						scratchSpaceList.removeChild(scratchSpaceList.firstChild);
					}
					
					if (spaces == null) {
						var listItem = document.createElement("listitem");
						listItem.setAttribute("label", "Cannot load tables from server");
						scratchSpaceList.appendChild(listItem);
						scratchSpaceList.disabled = true;
						return;
					}
					
					for (var i = 0, n = spaces.length; i < n; i++) {
						var spaceInfo = spaces[i];
						var listItem = document.createElement("listitem");
						listItem.setAttribute("label", spaceInfo.title);
						listItem.setAttribute("value", spaceInfo.id);
						listItem.setAttribute("tooltiptext", spaceInfo.description);
						listItem.addEventListener("dblclick", openSelectedScratchSpace, true)
						scratchSpaceList.appendChild(listItem);
					}
				})
			}
		}
	}
}();
