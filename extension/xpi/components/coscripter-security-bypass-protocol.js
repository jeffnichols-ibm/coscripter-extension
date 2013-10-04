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

This Program also contains a code package known as TestProtocol.js that is licensed pursuant to the license listed below. 

TestProtocol.js 
The program known as TestProtocol.js is licensed under the terms of the Mozilla Public License version 1.1. Those terms are reproduced below for your reference. 
*/
/***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Mozilla.
*
* The Initial Developer of the Original Code is IBM Corporation.
* Portions created by IBM Corporation are Copyright (C) 2004
* IBM Corporation. All Rights Reserved.
*
* Contributor(s):
* Darin Fisher <darin@meer.net>
* Doron Rosenberg <doronr@us.ibm.com>
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
* 
* ***** END LICENSE BLOCK ***** 
*/

//======================================================
// Debug Section

var filename = 'coscripter-security-bypass-protocol.js';
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


debug("parsing");


// change these if you use this file as a template for another protocol
const kSCHEME = "coscript";
const kPROTOCOL_NAME = "CoScripter Protocol";
const kPROTOCOL_CID = Components.ID("76c60d3b-786f-4b8e-bfe4-678d42132995");

// don't change these, they are fine the way they are
const kPROTOCOL_CONTRACTID = "@mozilla.org/network/protocol;1?name=" + kSCHEME;
const kSIMPLEURI_CONTRACTID = "@mozilla.org/network/simple-uri;1";
const kIOSERVICE_CONTRACTID = "@mozilla.org/network/io-service;1";
const nsISupports = Components.interfaces.nsISupports;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIURI = Components.interfaces.nsIURI;

// moved from the old manual xpcom crud to use XPCOMUtils to generate a bunch
// of the boiler plate code
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// ok, I don't know what most of this does, look for comments,
// I have comments at all the places with non-template code
function Protocol()
{
}

Protocol.prototype =
{
  // needed properties set for XPCOMUtils
  classID:          kPROTOCOL_CID,
  classDescription: kPROTOCOL_NAME,  
  contractID:       kPROTOCOL_CONTRACTID, 
  
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIProtocolHandler, 
                                         Components.interfaces.nsISupports, 
                                         Components.interfaces.nsIObserver]),

  scheme: kSCHEME,
  defaultPort: -1,
  protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                 nsIProtocolHandler.URI_NOAUTH,
  
  allowPort: function(port, scheme)
  {
    return false;
  },

  newURI: function(spec, charset, baseURI)
  {
    var uri = Components.classes[kSIMPLEURI_CONTRACTID].createInstance(nsIURI);
    uri.spec = spec;
    return uri;
  },

  newChannel: function(aURI)
  {
    // Here we are! Non-template code!
    
    
    // now we'll give a nice name to the url    
    var url = aURI.spec
    
    // ok, the url will look like "coscript:http://www.google.com",
    // and we want just the "http://www.google.com" part...    
    if (url.match(/^[^:]+:(.*)/)) {
        // ...and now we have it
        var procedureUrl = RegExp.$1
        // find the top-most firefox window, and load this url into its coscripter sidebar
        Components.utils.import("resource://coscripter-platform/component-registry.js");

        var mainChromeWindow = registry.utils().mostRecentMainWindow();
		mainChromeWindow.coscripter.loadProcedureIntoSidebar(procedureUrl, false)		
    }
    
    // we have to return something, or Firefox crashes,
    // one option is to return "about:blank",
    // but that has the effect of openning a blank page.
    // returning "javascript:if(false) {}" has no effect at all, which is ideal
    // NOTE: I tried just "javascript:", but that opened the error console
    var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService)
    return ios.newChannel("javascript:if(false) {}", null, null)
    
    // ok, I don't know what's going on past here... good luck
  },
  
  // since FF 4.0 you need to implement observable 
  // it's configured in chrome.manifest 
  observe: function(subject, topic, data) {
			   debug("subject: '" + subject + "' topic: '" + topic + " ' data: '" + data + "'" );
  },
}
// generate NSGetFactory for FF 4.0 (Gecko 2)
// and NSGetModule for older version
if (XPCOMUtils.generateNSGetFactory){
	debug("NSGetFactory defined (gecko 2.0)");
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([Protocol]);
}else{
	debug("NSGetFactory undefined (gecko 1.9)");
	var NSGetModule = XPCOMUtils.generateNSGetModule([Protocol]);
}

debug("done parsing");

