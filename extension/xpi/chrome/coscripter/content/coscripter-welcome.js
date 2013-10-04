const CC = Components.classes, CI = Components.interfaces, CIS = CI.nsISupports
var consoleService = CC['@mozilla.org/consoleservice;1'].getService(CI.nsIConsoleService)
var promptService = CC['@mozilla.org/embedcomp/prompt-service;1']
			.getService(CI.nsIPromptService)
function debug(msg) {
	//return ;	//comment out to turn on debugging
	consoleService.logStringMessage(msg)
}

function searchScripts(website, searchtext) {
 	Components.utils.import("resource://coscripter-platform/component-registry.js");
	var u = registry.utils();
	var serverURL = u.getKoalescenceURL();
	if (serverURL[serverURL.length - 1] != "/") serverURL += "/";
	var t = encodeURIComponent(searchtext);
	var searchURL = serverURL + "browse/search?q=" + t;
	u.getCurrentContentBrowser(window).loadURI(searchURL);
	return false;
}


function loadLocalScript(uuid, runP){
	//debug("loadLocalScript called with " + arguments[0].parentNode.previousSibling.textContent)
	//document.load("coscript:http://coscripter.almaden.ibm.com/coscripter/api/script/2438")
    Components.utils.import("resource://coscripter-platform/component-registry.js");
	var u = registry.utils();
	//u.getCurrentContentBrowser(window).loadURI("coscript:http://coscripter.almaden.ibm.com/coscripter/api/script/2438");
	u.getCoScripterWindow(window).loadLocalProcedure(uuid, runP)
	return false;
}

function deleteLocalScript(uuid){
	//debug("deleteLocalScript called with " + arguments[0].parentNode.previousSibling.textContent)
    Components.utils.import("resource://coscripter-platform/component-registry.js");
	var u = registry.utils();
	//u.getCurrentContentBrowser(window).loadURI("coscript:http://coscripter.almaden.ibm.com/coscripter/api/script/2438");
	u.getCoScripterWindow(window).deleteLocalProcedure(uuid)
	return false;
}

// Local Save

