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
var EXPORTED_SYMBOLS = ["personalDB"];


const CC = Components.classes, CI = Components.interfaces, CIS = CI.nsISupports

// this should be called only once, when the xpcom object is initially loaded;
// Its purpose is to grab a handle to the useful my-util object,
// and also read in the database from the file that it's stored in (in the profiles directory)
const KOALA_DB_FILENAME = 'coscripter_database.txt' ;

////////////////////////////////////////////////////////////////////////////////
// the code below is based on template from:
// developer.mozilla.org/en/docs/Code_snippets:JS_XPCOM
// template had the license: MIT License 

function PersonalDB()
{
	// Add any initialisation for your component here.
    this.wrappedJSObject = this;
	return this;
}

PersonalDB.prototype = {
	init : function(dbfilename) {
		// TL: there are multiple editors because there can be one in each
		// firefox main window
		this.editors = [];

		// Cache bluepages results so we can reuse them
		this.coscripter_bpcache = {};

		// Other databases to be searched at runtime
		this.otherDBs = {};

		if (dbfilename) {
			this.dbfilename = dbfilename;
		} else {
			this.dbfilename = KOALA_DB_FILENAME;
		}

		this.data = "";
		this.database = [];

		this.components = registry ;
	},

	load : function () {
		this.components = registry ;
		
		var profileDirectory = CC["@mozilla.org/file/directory_service;1"]
			.getService(CI.nsIProperties)
			.get("ProfD", CI.nsIFile);
		var oldDbFile = profileDirectory.clone();
		oldDbFile.append(this.dbfilename);
		
		var coscripterDataDir = profileDirectory.clone();
		coscripterDataDir.append('CoScripterData');
	  
		var dbFile =  coscripterDataDir.clone();
		dbFile.append(this.dbfilename);
		
		// migration to new db file location
		// this is necessary since the versions 1.370 or greater of the sidebar
		// store everything in the CoScripterData directory inside the profile directory
		// whereas before it was stored directly in the profile dir... 
		// cdrews@us.ibm.com
		if( oldDbFile.exists() ){ 
			if(!dbFile.exists()){
				oldDbFile.moveTo(coscripterDataDir,this.dbfilename); // move the db to the new location
			}else{
				oldDbFile.remove(false); // unless the new file exists in which 
								 // case we delete the old file
								 // and wonder how this could have happened
			}
		}
		
		this.data = this.components.utils().readFile(dbFile)
		if (!this.data) {
			this.data = ""
		}
		this.update()
	},

	// this saves out the databse to the appropriate file
	save : function() {
		var dbFile = CC["@mozilla.org/file/directory_service;1"]
			.getService(CI.nsIProperties)
			.get("ProfD", CI.nsIFile);
		dbFile.append("CoScripterData")
		var coscripterDataFolder = dbFile.clone();
		if( !coscripterDataFolder.exists() || !coscripterDataFolder.isDirectory() )	
			{coscripterDataFolder.create(CI.nsIFile.DIRECTORY_TYPE, 0755)}
		dbFile.append(this.dbfilename)
		
		this.data = this.removeOldSecretLine(this.data);
		this.components.utils().saveString(dbFile, this.data)
	},
 
	removeOldSecretLine : function(str){
		str = str.replace(/\n--.*secret.*--\n/g,"")
		return str;
	},

	// Simple Regression Database
	// serializes the database as a string that looks like what the user
	// has entered in the database text area,
	// but instead of just copying the text that the user actually has entered,
	// we serialize it manually,
	// mainly to include the stuff from BluePages (if they have that),
	// and for future compatibility,
	// in case some other module also adds stuff to the database
	databaseToString : function() {
		var buf = []
		
		// print out non-secret stuff
		this.database.
		   filter(function (e) { return !e.secret }).
		   forEach(function (e) { buf.push(e.ident.string + " = " + e.value + "\n") })
		
		//buf.push("-- top secret, don't look! --\n")
		
		// print out secret stuff
		this.database.
		   filter(function (e) { return e.secret }).
		   forEach(function (e) { buf.push(e.ident.string + " = " + e.value + "\n") })
		
		return buf.join("")
	},

	databaseToArray : function() {
		var dbArray = []
		for (var i=0; i<this.database.length; i++) {
			dbArray[this.database[i].ident.string] = this.database[i].value
		}
		return dbArray
	},

	// each textbox that contains a "view" to the database should be passed
	// in here, so that when changes are made to one of them, the rest of
	// them can be updated
	addListener : function(editor) {
		this.editors.push(editor);
	},

	// if a textbox dies, it should have the courtesy to let us know,
	// so we don't go throwing exception when we try to update a dead object later on
	removeListener : function(editor) {
		for (i in this.editors) {
			if (this.editors[i] == editor) {
				this.editors.splice(i, 1);
				break;
			}
		}
	},

	// update does two things...
	// if we pass in an editor, then we'll update all the other editors to
	// look the same as it
	// ...also...
	// we'll parse the textual version of the database to extract the "data"
	update : function(editor) {
		// update editors to look like this one...
		if (editor) {
			this.data = editor.value
			for (var i = 0; i < this.editors.length; i++) {
				var currEditor = this.editors[i]
				
				if (currEditor != editor) {
					currEditor.value = this.data
				}
			}
		}
		
		// parse data...
		this.database = [];
		this.processData(this.data);
		this.processOtherDBs();
		this.save();
	},

	processOtherDBs : function() {
		for (var otherdb in this.otherDBs) {
		//	dump('Processing CoScripter database: ' + otherdb + '\n');
			this.processData(this.otherDBs[otherdb])
		}

	},

	// Process a text string containing a list of name/value pairs such as the
	// personal database. Returns a list of the keys provided in this text
	// string.
	processData : function(dbtext) {
		var lines = dbtext.split(/\r?\n/);
		var secret = false;
		var ret = new Array();
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i]
			
			/*
			// everything after a line with the following regex is considered secret
			if (line.match(/^[^=]*secret[^=]*$/i)) {
				secret = true
			}
			*/
			
			var m = line.match(/^([^=]*)=(.*)$/)
			if (m) {
				var entry = {}
				entry.ident = new (this.components.utils()).Ident(this.components.utils().trim(m[1]))
				entry.value = this.components.utils().trim(m[2])
				entry.secret = secret
				this.database.push(entry)
				ret.push(entry.ident.string.toLowerCase());
			}
		}
		return ret;
	},

    changeEntry : function(key, value) {
        this.save();
        var lines = this.data.split(/\r?\n/);
        //dump('looking for key:' + key +'\n');
        var found = false;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i]

			var m = line.match(/^([^=]*)=(.*)$/)
            if (m) {
                var dbKey = this.components.utils().trim(m[1]);
                var dbVal = this.components.utils().trim(m[2]);
                if(dbKey == key){
                    //dump('found key:' + key + ' setting it to value ' + value + '\n');
                    lines[i] = dbKey + " = " + value ;
                    found = true ;
                }
            }
        }
        if( true != found){
            lines.push(key + " = " + value );
        }
        var newData = lines.join('\n');
        this.data = newData ;
        this.save();
        this.load();
 		for( var i=0;i<this.editors.length;i++) {
            this.editors[i].value = this.data;
        }
    },	
	
	// Register another db to be searched at runtime
	addOtherDB : function(dbname, dbtext) {
		this.otherDBs[dbname] = dbtext;
		this.update();
	},

	removeOtherDB : function(dbname) {
		//dump('removing database: ' + dbname + '\n');
		delete this.otherDBs[dbname];
		this.update();
	},

	// returns the first key associated with the given value (the match must be exact, including capitalization)
	inverseLookup : function(value) {
		var entry = this.inverseLookupEntry(value)
		if (entry) {
			return entry.ident.string
		}
	},

	// returns the first entry that has the given value (the match must be exact, including capitalization)
	inverseLookupEntry : function(value) {
		value = this.components.utils().trim(String(value))
		for (var i = 0; i < this.database.length; i++) {
			var entry = this.database[i]
			var entryValue = entry.value
			
			if (value == entryValue) {
				return entry
			}
		}
	},

	// returns the value associated with the given key (the match need not be exact, it will find the "best" match)
	lookup : function(ident) {
		var entry = this.lookupEntry(ident)
		if (entry) {
			return entry.value
		}
	},

	// returns the entry that has the given key (the match need not be exact, it will find the "best" match)
	lookupEntry : function(ident) {
		var bestScore = 0
		var bestEntry
		for (var i = 0; i < this.database.length; i++) {
			var entry = this.database[i]
			
			var score = entry.ident.score(ident)
			
			if (score > bestScore) {
				bestScore = score
				bestEntry = entry
			}
		}
		if (bestScore > 0.5) {
			return bestEntry
		}
	},

	// returns the value associated with the given key (the match needs to have all the same tokens in the same order)
	lookupAlgorithm2 : function(ident) {
		var entry = this.lookupAlgorithm2Entry(ident)
		if (entry) {
			return entry.value
		}
	},

	// returns the entry that has the given key (the match needs to have
	// all the same tokens in the same order)
	lookupAlgorithm2Entry : function(ident) {
		var bestScore = 0
		var bestEntry
		var matchP = false
		for (var i = 0; i < this.database.length; i++) {
			var entry = this.database[i]
			matchP = this.components.utils().arrayBeginsWith(ident.tokens,
				entry.ident.tokens)
			if (matchP) {
				var score = entry.ident.tokens.length
				
				if (score > bestScore) {
					bestScore = score
					bestEntry = entry
				}
			}
		}
		return bestEntry
	},

	// returns the entry that best matches the given key
	// keyAndValue is e.g. { key : databaseKey, value : "" }
	// key becomes the exact string that matched bestEntry's database key
	// We could change this to parse an unquoted string to determine the
	// key unambiguously
	lookupAlgorithm3Entry : function(keyAndValue) {
		var key = keyAndValue.key.toLowerCase()
		var quotedKey, dbKey, bestKey = ""
		var value, dbValue, bestValue = ""
		var dbSecret, bestSecret
		var match
		
		//remove leading spaces and multiple spaces
		key = key.match(/^\s*(.*)/)[1]
		key = key.replace(/\s+/g, " ")
		// see if there is a key in quotes
		if (match = key.match(/^[\"\u0019\u2019\x19'](.*?)[\"\u0019\u2019\x19']/i)) {
			quotedKey = match[1].toLowerCase()
			for (var i = 0; i < this.database.length; i++) {
				var entry = this.database[i]
				dbKey = entry.ident.string.toLowerCase()
				dbKey = dbKey.match(/^\s*(.*)/)[1]
				dbKey = dbKey.replace(/\s+/g, " ")
				dbValue = entry.value
				dbSecret = entry.secret
				if (quotedKey == dbKey) {
					keyAndValue.key = dbKey
					keyAndValue.value = dbValue
					keyAndValue.secret = dbSecret
					return
				}
			}
		}
			
		for (i = 0; i < this.database.length; i++) {
			entry = this.database[i]
			dbKey = entry.ident.string.toLowerCase()
			dbKey = dbKey.match(/^\s*(.*)/)[1]
			dbKey = dbKey.replace(/\s+/g, " ")
			dbValue = entry.value
			dbSecret = entry.secret
			if (key.indexOf(dbKey) !== 0) continue
			if (dbKey.length > bestKey.length) {
				bestKey = dbKey
				bestValue = dbValue
				bestSecret = dbSecret
			}
		}
		keyAndValue.key = bestKey
		keyAndValue.value = bestValue
		keyAndValue.secret = bestSecret
	},

	// returns an object containing information about the user (scraped
	// from bluepages)
	getBPinfo : function(email, cbfunc) {
		if (this.coscripter_bpcache[email]) {
			cbfunc(this.coscripter_bpcache[email]);
		} else {
			var url =
				'http://bluepages.ibm.com/BpHttpApisv3/wsapi?byInternetAddr=' +
				escape(email);
			var _this = this;
			this.components.utils().loadWebPage(url, function (ret) {
				var lines = ret ? ret.split('\n') : null
				var bpinfo = {}
				for (var i in lines) {
					var line = lines[i];
					if (line.indexOf(": ") != -1) {
						var results = line.split(": ", 2);
						bpinfo[results[0].toLocaleLowerCase()] = results[1];
					}
				}
				_this.coscripter_bpcache[email] = bpinfo;
				cbfunc(bpinfo);
				}
			)
		}
	},

	getActivityData : function(acturl, cbfunc) {
		this.components.utils().loadWebPageXml(acturl, cbfunc);
	},

	// Boilerplate code required of an XPCOM component
};

var personalDB = new PersonalDB();
