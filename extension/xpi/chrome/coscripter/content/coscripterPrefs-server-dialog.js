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
Contributor(s): Greg Little, Allen Cypher (acypher@us.ibm.com), Tessa Lau, Clemens Drews, Jeffrey Nichols, Eser Kandogan, Jeffrey Wong, Gaston Cangiano.

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

function onLoad() {
	var params = window.arguments[0].inn;
	var name = document.getElementById('serverName');
	var url = document.getElementById('serverURL');
	name.value = params['name'];
	url.value = params['url'];
}

// Called once iff the user clicks OK
function onOK() {
	// Return the changed arguments
	// If the user clicks cancel, window.arguments[0].out remains null
	// because this function is never called
	
	// First we validate the server
	var server = { name :
		document.getElementById('serverName').value,
		url : document.getElementById('serverURL').value };
	server["api"] = server["url"] + "api/";

	var pingurl = server["api"] + "ping";
	var h = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
	h.open("get", pingurl, false);
	try {

		h.send(null);
		if (h.status == 200) {
			var ret = h.responseText;
			var nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
			var pingobj = nativeJSON.decode(ret);
			if (pingobj["coscripter-login-url"] !== "") {
				window.arguments[0].out = server;
				return true;
			}
		}

	} catch (e) {
		dump('Error pinging: ' + e + '\n\t' + e.toSource() + '\n');
	}

	// Otherwise, there was an error
	window.openDialog("chrome://coscripter/content/coscripterPrefs-server-error.xul",
		"", "chrome, dialog, modal, resizable=yes", null).focus();
	return false;
}

