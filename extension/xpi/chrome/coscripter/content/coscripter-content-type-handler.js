var COSCRIPTER_CONTENT_TYPE = "application/x-coscripter+json"

var coscripterContentListener = {
	QueryInterface: function(aIID){
		if (aIID.equals(Components.interfaces.nsISupports) || aIID.equals(Components.interfaces.nsIURIContentListener) ||
		aIID.equals(Components.interfaces.nsISupportsWeakReference)) 			
			return this;
		throw Components.results.NS_NOINTERFACE;
	},
	
	canHandleContent: function( contentType, isContentPreferred, desiredContentType){
		if (contentType == COSCRIPTER_CONTENT_TYPE) {
			return true;
		} else {
			return false;
		}
	},
	
	doContent: function( contentType, isContentPreferred, request, contentHandler){
		contentHandler.value = new StreamListener(this.openProcedureInSideBar);
		return false;
	},
	
	isPreferred: function( contentType, desiredContentType){
		if (contentType == COSCRIPTER_CONTENT_TYPE) 
			return true;
		else 
			return false;
	},
	
	onStartURIOpen: function( URI){
		return true;
	},
	openProcedureInSideBar : function (data){
		try{
			var utils = Components.classes["@coscripter.ibm.com/coscripter-utils/;1"].getService(Components.interfaces.nsISupports).wrappedJSObject
			var mainChromeWindow = utils.mostRecentMainWindow();
			mainChromeWindow.coscripter.loadProcedureDataIntoSidebar(data, false, null)
		}catch(e){
			dump('error while loading script into sidebar in coscripter-content-handler.js:' +e);
		}
	}

};

function StreamListener(aCallbackFunc){
	this.mCallbackFunc = aCallbackFunc;
}

StreamListener.prototype = {
	mData: "",
	
	onStartRequest: function(aRequest, aContext){
		this.mData = "";
	},
	
	onDataAvailable: function(aRequest, aContext, aStream, aSourceOffset, aLength){
		var scriptableInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
		scriptableInputStream.init(aStream);
		
		this.mData += scriptableInputStream.read(aLength);
	},
	
	onStopRequest: function(aRequest, aContext, aStatus){
		if (Components.isSuccessCode(aStatus)) {
			this.mCallbackFunc(this.mData);
		} else {
			this.mCallbackFunc(null);
		}
	},
	
	onChannelRedirect: function(aOldChannel, aNewChannel, aFlags){
	},
	
	getInterface: function(aIID){
		try {
			return this.QueryInterface(aIID);
		} 
		catch (e) {
			throw Components.results.NS_NOINTERFACE;
		}
	},
	
	onProgress: function(aRequest, aContext, aProgress, aProgressMax){
	},
	onStatus: function(aRequest, aContext, aStatus, aStatusArg){
	},
	
	onRedirect: function(aOldChannel, aNewChannel){
	},
	
	QueryInterface: function(aIID){
		if (aIID.equals(Components.interfaces.nsISupports) ||
		aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
		aIID.equals(Components.interfaces.nsIChannelEventSink) ||
		aIID.equals(Components.interfaces.nsIProgressEventSink) ||
		aIID.equals(Components.interfaces.nsIHttpEventSink) ||
		aIID.equals(Components.interfaces.nsIStreamListener)) 			
			return this;
		throw Components.results.NS_NOINTERFACE;
	}
};

Components.classes["@mozilla.org/uriloader;1"].getService(Components.interfaces.nsIURILoader).registerContentListener(coscripterContentListener);
