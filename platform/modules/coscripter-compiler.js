/*
This Program contains software licensed pursuant to the following : 
MOZILLA PUBLIC LICENSE
Version 1.1
The contents of this file are subject to the Mozilla Public License
Version 1.1 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License at
http: //www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS"
basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
License for the specific language governing rights and limitations
under the License.
The Original Code is IBM.
The Initial Developer of the Original Code is IBM Corporation.
Portions created by IBM Corporation are Copyright (C) 2007
IBM Corporation. All Rights Reserved.
Contributor(s): Clemens Drews, Tessa Lau

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
furnished to do so, subject to the following conditions : 
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
Components.utils.import("resource://coscripter-platform/component-registry.js")
var EXPORTED_SYMBOLS = ["compiler"]
const nsISupports = Components.interfaces.nsISupports	// XPCOM registration constant
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false
}
var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
var filename = "coscripter-compiler.js"
function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING) consoleService.logStringMessage(filename + ": " + msg )
	if(Preferences.DO_DUMP_DEBUGGING) dump(filename + ": " + msg + "\n")
}
//debug('parsing " + filename)

///////////////////////////////////////////////// 
//		COMPILER
//
//	CompilerException
//////////////////////////////////////////////////////////////////////

function getCoScripterCompiler(){
	return coscripterCompiler
}

function CoScripterCompiler(){
    this.components = registry
	
	//////////////////////////////////////////
	// Define Member Variables Here
	// ////////////////////////////////////////

    return this
}

CoScripterCompiler.prototype = {
	compile : function(steps){
		var parserComponent = this.components.parser();
		var commandComponent = this.components.commands();
		var execEnv = this.components.executionEnvironment();
		var parserErrorP = false
		var cmd;
		var cmds = [] ;
		for(var i=0;i<steps.length;i++){
			// pre-process steps
			var ret = this.getSlop(steps[i]);
			var indent = ret[0];
			var slop = ret[1];
			debug("compile is compiling with i = " + i + " and indent/slop is " + indent + '/' + slop);
			if (indent != 0 && slop !== null) {
				slop = this.cleanSlop(slop);
				try {
					var parser = new parserComponent.Parser(slop);
					cmd = parser.parse();
				} catch (e) {
					//throw new CompilerException("Parsing Error: can not parse on line " + (i+1) + ": " + slop, i+1, slop);
					//throw new CompilerException("Error on Line " + (i+1) + ": Parsing Error - can not parse : " + slop, i+1, slop);
					parserErrorP = true
					cmd = new commandComponent.createUnexecutableFromSlop(ret[1], execEnv)
				}
			}
			else if (indent == 0) {
				cmd = new commandComponent.createCommentFromSlop(ret[1], execEnv)
			}
			debug("compile is setting indent")
			cmd.setIndent(indent);
			cmd.setLineNumber(i)
			cmds.push(cmd);
		}
		debug("compile is returning")
		return [cmds, parserErrorP] ;
	},

	cleanSlop : function(slop) {
		// Remove extra white spaces
		slop = this.components.utils().trim(slop);
		// Replace left and right quotation marks with double quotes
		slop = slop.replace(new RegExp(unescape("[%u201C%u201D]"), "g"), '"');
		// Replace \u2013 with -
		slop = slop.replace(new RegExp("\u2013", "g"), "-");
		// Replace \n with RETURN
		slop = slop.replace(new RegExp("\\\\n", "g"), "\n");
		return slop;
	},
	
	getSlop : function(step) {
		var indent = 0;
		if (step.substring(0, 1) == "*") {
			// Remove initial *'s
			var stars = step.match(/^(\*+) /)[1];
			indent = stars.length;
			step = step.replace(/^\*+ /, "");
			return [indent, step];
		} else {
			return [0, step];
		}
	},
};

//	CompilerException
function CompilerException(msg, lineno, code){
    this.msg = msg;
	this.lineno = lineno;
	this.code = code;
}

CompilerException.prototype.toString = function(){
    return this.msg;
};



var compiler = new CoScripterCompiler();
//debug('finished parsing " + filename)
