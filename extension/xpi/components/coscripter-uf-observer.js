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
 Contributor(s): Clemens Drews <cdrews@almaden.ibm.com>
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
//======================================================
// XPCOM registration constants Section
const nsISupports = Components.interfaces.nsISupports;

// You can change these if you like - 
const CLASS_ID = Components.ID("60cd3681-fcf2-4962-836e-f96205ac1bbd");
const CLASS_NAME = "CoScripter Microformat Observer";
const CONTRACT_ID = "@coscripter.ibm.com/coscripter-uf-observer/;1";

//======================================================
// Debug Section

var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

//var doConsoleDebugging = false ;
var Preferences = {
    DO_CONSOLE_DEBUGGING: false,
    DO_DUMP_DEBUGGING: false,
}

function debug(msg){
    if (Preferences.DO_CONSOLE_DEBUGGING) {
        consoleService.logStringMessage("coscripter-uf-observer.js: " + msg);
    }
    else 
        if (Preferences.DO_DUMP_DEBUGGING) {
            dump("coscripter-uf-observer.js: " + msg + "\n");
        }
}

debug('parsing coscripter-uf-observer.js');



function getUFObserver(){
    return Components.classes[CONTRACT_ID].getService(Components.interfaces.nsISupports).wrappedJSObject;
}


function UFObserver(){
    this.wrappedJSObject = this;
    return this;
}

function CoScriptUF(uf, url, date){
    // allow null params
    if (uf != null) {
        this.scriptid = uf.scriptid;
        this.scripttitle = uf.scripttitle;
        this.scriptbody = this.convertList(uf.scriptbody.toHTML());
    }
    this.url = url;
    this.date = date;
}

CoScriptUF.prototype = {
    fields: ["scriptid", "scripttitle", "scriptbody", "date", "url"],
    // methods to convert from/to database types (i.e. date<->string in this case)
    getField: function(name){
        switch (name) {
            case "scriptid":
                return this.scriptid;
            case "scripttitle":
                return this.scripttitle;
            case "scriptbody":
                return this.scriptbody;
            case "date":
                return this.date.toUTCString();
            case "url":
                return this.url;
        }
        throw "fieldname: " + fieldname + " not available in CoScriptUF";
    },
    setField: function(name, value){
        switch (name) {
            case "scriptid":
                this.scriptid = value;
                break;
            case "scripttitle":
                this.scripttitle = value;
                break;
            case "scriptbody":
                this.scriptbody = value;
                break;
            case "date":
                this.date = new Date(Date.parse(value));
                break;
            case "url":
                return this.url;
                break;
            default:
                throw "attemp to set unknown property on CoScriptUF";
        }
    },
    convertList:function(str){
        // hackedy ... remove <li> and replace with *
        return str.replace(/\<li>/gi,"* ").replace(/\<\/li\>/gi,"\n").replace(/\<ul\>/gi,"").replace(/\<\/ul\>/gi,"").replace(/\<..\>/gi,"")
    }
}

UFObserver.prototype = {
    QueryInterface: function(aIID){
        // add any other interfaces you support here
        if (!aIID.equals(nsISupports)) 
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    },
    
    FILENAME: "CoScripts.db.sqlite",
    
    start: function(){
        // start observing microformats after every page load
        
        // Add our Microformat
        Components.utils.import("resource://gre/modules/Microformats.js");
        
        var coscriptUf = {
            mfVersion: 0.1,
            className: "hcoscript",
            mfObject: this.hCoScript, // function to help interpret microformats below
            properties: {
                "scriptid": {}, // bummer html does not prefer camelcase
                "scripttitle": {},
                "createdat": {},
                "modifiedat": {},
                "description": {},
                "scriptbody": {
                    dataType:"HTML",
                    datatype:"HTML"
                }
            }
        };
        Microformats.add("hcoscript", coscriptUf);
        
        // add the onload listener
        var yule = Components.classes["@coscripter.ibm.com/yule;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
        var ufObserver = this;
        this._yuleCallbackMethod = function(event){
            ufObserver.checkForUf.apply(ufObserver, [event]);
        }
        yule.subscribe(this._yuleCallbackMethod, "load");
    },
    hCoScript: function(node, validate){
        // callback for mozilla to extract the data from a hcoscript node
        if (node) {
            Microformats.parser.newMicroformat(this, node, "hcoscript", validate);
        }
    },
    
    stop: function(){
        // stop observince microformats
        var yule = Components.classes["@coscripter.ibm.com/yule;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
        yule.unsubscribe(this._yuleCallbackMethod);
        delete this._yuleCallbackMethod;
    },
    
    checkForUf: function(e){
        // page load happened, let's check for hcoscript
        if (!e.target.nodeType == 9 /* Node.DOCUMENT_NODE*/)// make sure we're dealing with a document here, not some node ...
            return;
        try {
            var document = e.target;
            var uFcount = Microformats.count('hcoscript', document);
            if (uFcount > 0) {
                // found at least one on the page... store them
                var uFlist = Microformats.get('hcoscript', document);
                for (var i = 0; i < uFlist.length; i++) {
                    this._addCoScriptMicroFormat(uFlist[i], document.location.href, new Date());
                }
            }
        } 
        catch (e) {
            debug(e.toSource());
        }
    },
    
    getCoScriptMicroFormats: function(){
        // returns an array of all coscripter microformats we came across
        return this._retrieveMicroFormats();
    },
        
    _addCoScriptMicroFormat: function(uf, url, date){
        var spottedUf = new CoScriptUF(uf, url, date);
        this._storeMicroFormat(spottedUf);
    },
    
    // DB Functions
    _storeMicroFormat: function(uf){
        // store uf in the db
        var dbConn = this.getDatabase();
        var statement = dbConn.createStatement("INSERT INTO spottedcoscripts (scriptid,scripttitle,scriptbody,date,url) VALUES(:scriptid,:scripttitle,:scriptbody,:date,:url)");
        
        for (var i = 0; i < uf.fields.length; i++) {
            var field = uf.fields[i];
            var idx = statement.getParameterIndex(":" + field);// gotta include the ":" ...?!
            statement.bindUTF8StringParameter(idx, uf.getField(field));
        }
        
        statement.execute();
        statement.finalize();
        var rowid = dbConn.lastInsertRowID;
        dbConn.close();
        return rowid;
    },
    
    _retrieveMicroFormats: function(){
        // return all ufs from the db in an array of CoScriptUF's 
        var results = [];
        var dbConn = this.getDatabase();
        var fields = CoScriptUF.prototype.fields.join(",");
        var statement = dbConn.createStatement("SELECT " + fields + " FROM spottedcoscripts LIMIT 5");
        while (statement.executeStep()) {
            var uf = new CoScriptUF()
            for (var i = 0; i < uf.fields.length; i++) {
                var field = uf.fields[i];
                var idx = statement.getColumnIndex(field);
                var value = statement.getString(idx);
                uf.setField(field, value);
            }
            results.push(uf);
        }
        statement.finalize();
        dbConn.close();
        return results;
    },
    
    getDatabase: function(){
        // get a handle to and possibly create the DB file
        var coscripterDir = this.getDirectory();
        var file = coscripterDir.clone();
        file.append(this.FILENAME);
        var storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
        var conn = storageService.openDatabase(file);
        if (!conn.tableExists("spottedcoscripts")) {
            this.createTables(conn);
        }
        return conn;
    },
    createTables: function(conn){
        // create necessary tables
        conn.executeSimpleSQL("CREATE TABLE spottedcoscripts (scriptid STRING,scripttitle STRING,scriptbody STRING,date STRING,url STRING)");
    },
    getDirectory: function(){
        // the CoScripter dir in the users profile dir 
        var coscripterDataFolder = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
        coscripterDataFolder.append("CoScripterData");
        if (!coscripterDataFolder.exists() || !coscripterDataFolder.isDirectory()) {
            coscripterDataFolder.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
        }
        var coScriptUFFolder = coscripterDataFolder.clone();
        return coScriptUFFolder;
    }
}

//************************************************************************
//********************* XPCOM MODULE REGISTRATION*************************
//************************************************************************

//=================================================
// Note: You probably don't want to edit anything
// below this unless you know what you're doing.
//
// Factory
var UFObserverFactory = {
    singleton: null,
    createInstance: function(outer, iid){
        if (outer != null) 
            throw Components.results.NS_ERROR_NO_AGGREGATION;
        if (this.singleton == null) 
            this.singleton = new UFObserver();
        return this.singleton.QueryInterface(iid);
    }
};


// Module
var UFObserverModule = {
    registerSelf: function(aCompMgr, aFileSpec, aLocation, aType){
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
    },
    
    unregisterSelf: function(aCompMgr, aLocation, aType){
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
    },
    
    getClassObject: function(aCompMgr, aCID, aIID){
        if (!aIID.equals(Components.interfaces.nsIFactory)) 
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        
        if (aCID.equals(CLASS_ID)) 
            return UFObserverFactory;
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },
    
    canUnload: function(aCompMgr){
        return true;
    }
};

//module initialization
function NSGetModule(aCompMgr, aFileSpec){
    return UFObserverModule;
}

debug('done parsing coscripter-uf-observer.js');

