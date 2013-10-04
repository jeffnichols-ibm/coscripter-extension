var EXPORTED_SYMBOLS = ["registry"];  


//======================================================
// Debug Section

var filename = 'coscripter-registry.js';
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

debug('parsing');

Components.utils.import("resource://coscripter-platform/coscripter-slop-interpreter.js ");

function Registry(){
	debug('Registry Object created');
    this.consoleService = function(){
        return Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
    }
    this.addComponent("yule","resource://yule/yule.js");
    this.addComponent("previewer","resource://coscripter-platform/coscripter-previewer.js");
    this.addComponent("periodicPreviewer","resource://coscripter-platform/coscripter-previewer.js", "periodicPreviewer");
    this.addComponent("statusDisplay","resource://coscripter-platform/coscripter-previewer.js", "statusDisplay");
    this.addComponent("commands","resource://coscripter-platform/coscripter-command.js");
    this.addComponent("commandGenerator","resource://coscripter-platform/coscripter-command-generator.js");
    this.addComponent("compiler","resource://coscripter-platform/coscripter-compiler.js");
	this.addComponent("databaseXpcom","resource://coscripter-platform/coscripter-database.js","personalDB");
	this.addComponent("executionEnvironment","resource://coscripter-platform/coscripter-exec-env.js");
	this.addComponent("executionEngine","resource://coscripter-platform/coscripter-execution-engine.js");
    this.addComponent("filterPassword","resource://coscripter-platform/coscripter-filter-password.js");
    this.addComponent("labeler","resource://coscripter-platform/coscripter-labeler.js");
    this.addComponent("parser","resource://coscripter-platform/coscripter-strict-parser.js");
	this.addComponent("utils","resource://coscripter-platform/coscripter-utils.js");
	this.addComponent("autoClip","resource://coscripter-platform/coscripter-auto-clip.js");
	debug('Registry Object filled up');
	return this;
}

function getRegistry(){
	return registry; 
}
Registry.prototype = {
  addComponent: function(name,uri,varName){
	var _name = "_" + name;
	if(varName == null){
		varName = name ;
	}
	debug('adding cache' + _name );
	this[_name] = null ;
    this[name] = function(){
		try{
			debug("registry: " + name + "() requested")
			if(this[_name]===null){
				var scope = {} ;
				debug("registry: " + name + "() not cached")
				Components.utils.import(uri,scope);
				this[_name]=scope[varName];
			}
			if(this[_name]==null){
				debug("******* registry: " + name + " NOT FOUND")
			}
			return this[_name];
		}catch(e){
			debug('error requesting jsm: ' + uri + ' exception: ' +e.toString());
		}
    }
  }
}

var registry = new Registry();
debug('done parsing component-registry.js');


