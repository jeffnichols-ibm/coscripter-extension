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
Contributor(s): Greg Little, Allen Cypher (acypher@us.ibm.com), Tessa Lau, Clemens Drews, James Lin, Jeffrey Nichols, Eser Kandogan, Jeffrey Wong, Gaston Cangiano, Jeffrey Bigham, Jalal Mahmud.

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
// Coscripter Strict Parser
//
//	ParserConstants
//	tokendefs
//
//	General Parsing Methods
//
//	parse()
//		GotoCommand
//		EnterCommand
//		PutCommand
//		IncrementCommand
//		SelectCommand
//		Repeat
//		If/Wait/Verify Commands
//		Clip Command
//		ClickCommand
//		MouseoverCommand
//		CopyCommand
//		PasteCommand
//		Extract Command
//		Find Command
//
//	targetSpec
//		parseVariableValue
//		parseScratchTableReference
//
//////////////////////////////////////////////

Components.utils.import("resource://coscripter-platform/component-registry.js");
var EXPORTED_SYMBOLS = ["parser"];

var Preferences = {
	DO_CONSOLE_DEBUGGING:false,
	DO_DUMP_DEBUGGING:false
};

var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

function debug(msg){
	if(Preferences.DO_CONSOLE_DEBUGGING){
		consoleService.logStringMessage("coscripter-strict-parser.js: " + msg );
	}
	if(Preferences.DO_DUMP_DEBUGGING){
		dump("coscripter-strict-parser.js: " + msg + "\n");
	}
}

//debug('Parsing coscripter-strict-parser.js component\n');


function CoScripterStrictParser()
{
	debug("CoScripterStrictParser() called");
	return this;
}

/////////////////////////////////////////////////////////
// private object constructors
/////////////////////////////////////////////////////////

// A parsed Token is stored here
var Token = function(type,str,index){
    this.type= type;
    this.str=str;
	this.index = index ;
    return this ;
}

// definitions of the possible tokens and reserved words
var Tokendef = function(type,regex){
    this.type = type;
    this.regex = regex;
    return this ;
}

/////////////////////////////////////////////////////////
// CoScripterStrictParser prototype
/////////////////////////////////////////////////////////

CoScripterStrictParser.prototype = {
	
	ParseException : function(string){
		this.string = string ;
		return this ;
	},
		
	Parser : function(str,options){
		debug("Parser() constructor called str="+str);
		var components = registry;
		this.execEnv = components.executionEnvironment(); 		
		this.str = str;
		this.pos = 0;
		
		if (options != null) {
			if (typeof(options) != 'undefined') {
				// pass in your own execution environment into the constructor if you don't want the default one
				this.execEnv = options['execEnv'];
			}
		}
		this.str = str;
		this.pos = 0;
		return this ;
	},
	
	
	//	ParserConstants
	ParserConstants : {	
		GOTO : 'goto',
		REPEAT : 'repeat',
		PASTE : 'paste',
		CLIP : 'clip',
		GOBACK : 'goback',
		GOFORWARD : 'goforward',
		ENTER : 'enter',
		PUT : 'put',
		ANDAPPEND : 'andAppend',
		APPEND : 'append',
		SELECT  : 'select',
		TURN  : 'turn',
		CLICK : 'click',
		MOUSEOVER : 'mouseover',
		COPY : 'copy',
		SWITCH:'switch',
		CREATE:'create',
		RELOAD:'reload',		
		EXPAND: 'expand',
		COLLAPSE: 'collapse',
		TOGGLE: 'toggle',
		CLOSE:'close',
		OPEN:'open',
		FROM  : 'from',
		NUMBERWORD  : 'number',
		STRING : 'string',
		//MATCHTOKEN : 'matchtoken',	// used by Select command
		IS : 'is',
		DOES : 'does',
		ENDSWITH : 'endswith',
		STARTSWITH : 'startswith',
		WITH : 'with',	// used in "repeat with your "counter"
		CONTAINS : 'contains',
		EQUALS : 'equals',
		EQUALSIGN : 'equalsign',
		GREATERTHANSIGN : 'greaterthansign',
		LESSTHANSIGN : 'lessthansign',
		DISAMBIGUATOR : 'disambiguator',
		ORDINAL : 'ordinal',
		WORD : 'word',
		REGEX : 'regex',
		XPATH : 'xpath',
		XPATHTOKEN : 'xpathtoken',
		LOC : 'loc',	// e.g. {x:12, y:55}  a location, used with an xPath
		SPACE : 'space',
		IN : 'in',
		AT : 'at',
		OF : 'of',
		IF : 'if',
		ELSE : 'else',
		END : 'end',
		YOUR : 'your',
		YOU : 'you',
		CLIPBOARD : 'clipboard',
		EXAMPLE : 'example',
		TEXTBOX : 'textbox',
		CHECKBOXELEMENT : 'checkbox',
		RADIOBUTTONELEMENT : 'radiobutton',
		CLOSEBUTTONELEMENT : 'closebutton',
		BUTTONELEMENT : 'buttonelement',
		LINKELEMENT : 'linkelement',
		MENU : 'menu',
		ITEM : 'item',	//'item' is used by: select, dijitTreeNode, onClick handlers
		SECTION : 'section',//dojo section (for expand/collapse)
		THAT : 'that',
		TAB : 'tab',	// Browser Tab
		LISTELEMENT : 'listelement',
		AREAELEMENT : 'area',
		REGIONELEMENT : 'region',	
		CELL : 'cell',
		ROW : 'row',
		COLUMN : 'column',
		CELLREFERENCE : 'cellreference',	// eg cell A12
		//SCRATCHTABLEREFERENCE : 'scratch space',
		SCRATCHTABLEREFERENCE : 'scratchtable',
		TABLEREFERENCE : 'tablereference',
		BEGINEXTRACTION : 'begin extraction',
		ENDEXTRACTION : 'end extraction',
		EXTRACT : 'extract',
		TEXTEDITOR : 'text editor',	// Dojo rich text editor
		TEXT : 'text',
		ELEMENT : 'element',
		AFTER : 'after',
		PERIOD : '.',
		URL : 'url',
		THE : 'the',
		ONOFF : 'onoff',
		PAUSE : 'pause',
		WAIT : 'wait',
		SECONDS : 'seconds',
		THEREIS : 'thereis',
		NUM : 'num',
		COLON: ':',
		SEARCH : 'search',
		FOR : 'for',
		NEXT : 'next',
		PREVIOUS : 'previous',
		VERIFY: 'verify',	
		NOT : 'not',
		ARTICLE : 'a',
		AN: 'an',
		SELECTION : 'selection',
		WHICH: 'which',
		WHOSE: 'whose',
		LABELLED: 'labelled',	
		REGIONELEMENT : 'region',
		DIALOGBOX : 'dialog box',			
		MAINWINDOW : 'main window',
		WINDOW : 'window',
		JS : 'Javascript',
		POUNDSIGN : '#',
		MENUITEM : 'menuitem',
		INCREMENT : 'increment',
		DECREMENT : 'decrement',
		BY : 'by'
	},

}

CoScripterStrictParser.prototype.ParseException.prototype = {
	toString : function(){
		return this.string; 
	}
}

var ParserConstants = CoScripterStrictParser.prototype.ParserConstants;
var ParseException = CoScripterStrictParser.prototype.ParseException;

CoScripterStrictParser.prototype.Parser.prototype = {
	//	tokendefs
	tokendefs: [
		new Tokendef(ParserConstants.SPACE,/\s+/g),
        new Tokendef(ParserConstants.VERIFY,/(assert|verify)/gi),
        new Tokendef(ParserConstants.CLIP,/clip[\s]+the/gi),
		new Tokendef(ParserConstants.PASTE, /paste/gi),
        new Tokendef(ParserConstants.GOBACK,/go[\s]+back/gi),
        new Tokendef(ParserConstants.GOFORWARD,/go[\s]+forward/gi),
        new Tokendef(ParserConstants.GOTO,/go([\s]*to|) /gi),
        new Tokendef(ParserConstants.REPEAT,/repeat/gi),
		new Tokendef(ParserConstants.SWITCH,/switch to/gi),
		new Tokendef(ParserConstants.CREATE,/create/gi),
		new Tokendef(ParserConstants.CLOSE,/close/gi),
		new Tokendef(ParserConstants.OPEN,/open/gi),
		new Tokendef(ParserConstants.RELOAD,/reload/gi),
		new Tokendef(ParserConstants.EXPAND,/expand/gi),
		new Tokendef(ParserConstants.COLLAPSE,/collapse/gi),
		new Tokendef(ParserConstants.TOGGLE,/toggle/gi),
		new Tokendef(ParserConstants.ENTER, /enter/gi),
		new Tokendef(ParserConstants.PUT, /put/gi),
		new Tokendef(ParserConstants.ANDAPPEND, /and[\s]+append([\s]+(to)?|)/gi),	// used by * extract and append to 
		new Tokendef(ParserConstants.APPEND, /append/gi),
        new Tokendef(ParserConstants.CLICK,/(control)?(-)?click([\s]+on|)([\s]+the|)/gi),
        new Tokendef(ParserConstants.MOUSEOVER,/mouseover([\s]+the|)/gi),
		new Tokendef(ParserConstants.IN,/in(to|)([\s]+the|)/gi),
		new Tokendef(ParserConstants.AT,/at/gi),
		new Tokendef(ParserConstants.SELECT,/((control|shift)?(-)?select|choose)/gi),
		new Tokendef(ParserConstants.TURN,/turn/gi),
		new Tokendef(ParserConstants.PAUSE,/pause/gi),
		new Tokendef(ParserConstants.WAIT,/wait[\s]+until/gi),	    
		new Tokendef(ParserConstants.COPY, /copy/gi),
		new Tokendef(ParserConstants.IF, /if/gi),
		new Tokendef(ParserConstants.ELSE, /else\b/gi),
		new Tokendef(ParserConstants.THEREIS, /there[\s]+is\b/gi),
		new Tokendef(ParserConstants.SECONDS,/seconds/gi),
		new Tokendef(ParserConstants.FROM,/from([ ]the|)/gi),
		new Tokendef(ParserConstants.NUMBERWORD,/number/gi),
		new Tokendef(ParserConstants.YOUR,/your/gi),
		new Tokendef(ParserConstants.YOU,/you(:|)/gi),
		//new Tokendef(ParserConstants.MATCHTOKEN,/the item that/gi),
		//new Tokendef(ParserConstants.NOT,/no(t)?/gi), 
		new Tokendef(ParserConstants.NOT,/(not(\san?)?)|(no)/gi), // no | not | not a | not an
		new Tokendef(ParserConstants.AN,/an/gi), 		
		new Tokendef(ParserConstants.ARTICLE,/a/gi),
		new Tokendef(ParserConstants.SELECTION,/selection/gi),
		new Tokendef(ParserConstants.THAT,/that/gi),
		new Tokendef(ParserConstants.WHICH,/which/gi),
		new Tokendef(ParserConstants.WHOSE,/whose/gi),
		new Tokendef(ParserConstants.NAME,/name/gi),
		new Tokendef(ParserConstants.CONTAINING,/containing/gi),
		new Tokendef(ParserConstants.IS,/is/gi),
		new Tokendef(ParserConstants.DOES,/does/gi),
		new Tokendef(ParserConstants.STARTSWITH,/starts? with/gi),
		new Tokendef(ParserConstants.ENDSWITH,/ends? with/gi),
		new Tokendef(ParserConstants.WITH,/with/gi),
		new Tokendef(ParserConstants.CONTAINS,/contains?/gi),
		new Tokendef(ParserConstants.EQUALS,/equals?/gi),
		new Tokendef(ParserConstants.EQUALSIGN,/=/gi),
		new Tokendef(ParserConstants.GREATERTHANSIGN,/>/gi),
		new Tokendef(ParserConstants.LESSTHANSIGN,/</gi),
		new Tokendef(ParserConstants.LABELLED,/labelled/gi),
		new Tokendef(ParserConstants.CLIPBOARD,/the[\s]+clipboard/gi),
		new Tokendef(ParserConstants.EXAMPLE,/\((e\.g\.|i\.e\.)[^\)]*\)/gi),
		new Tokendef(ParserConstants.TEXTBOX,/(input([ ]|)field|(text|)box)/gi),
		new Tokendef(ParserConstants.AREAELEMENT,/area/gi),	// has to be before ELEMENT
		new Tokendef(ParserConstants.CHECKBOXELEMENT,/check[ ]*box/gi),
		new Tokendef(ParserConstants.RADIOBUTTONELEMENT,/(radio[ ]*button)/gi),
		new Tokendef(ParserConstants.CLOSEBUTTONELEMENT,/(close[ ]*button)/gi),
		new Tokendef(ParserConstants.BUTTONELEMENT,/button/gi),
		new Tokendef(ParserConstants.LINKELEMENT,/link/gi),
		new Tokendef(ParserConstants.MENUITEM,/menu[\s]*(item)+/gi),
		new Tokendef(ParserConstants.MENU,/menu/gi),
		new Tokendef(ParserConstants.ITEM,/item/gi),
		new Tokendef(ParserConstants.SECTION,/section/gi),
		new Tokendef(ParserConstants.TAB,/tab/gi),
		new Tokendef(ParserConstants.LISTELEMENT,/(listbox|list)/gi),
		new Tokendef(ParserConstants.CELL,/(the )?cell([ ]+(at|in))?/gi),
		new Tokendef(ParserConstants.ROW,/row/gi),
		new Tokendef(ParserConstants.COLUMN,/column/gi),
		new Tokendef(ParserConstants.SCRATCHTABLEREFERENCE,/(scratchtable|scratchspace)/gi),
		new Tokendef(ParserConstants.TABLEREFERENCE,/table [0-9]+/gi),
		new Tokendef(ParserConstants.ELEMENT,/a|p|li|ul|body|table|div|span|td|tr|anchor|heading|h[1-6]|element|node/gi),		
		new Tokendef(ParserConstants.DIALOGBOX,/dialog\s+box/gi),
		new Tokendef(ParserConstants.MAINWINDOW,/main\s+window/gi),
        new Tokendef(ParserConstants.WINDOW,/window/gi),
		new Tokendef(ParserConstants.BEGINEXTRACTION,/begin extraction/gi),
		new Tokendef(ParserConstants.ENDEXTRACTION,/end extraction/gi),
		new Tokendef(ParserConstants.EXTRACT,/extract/gi),
		new Tokendef(ParserConstants.TEXTEDITOR, /text editor/gi),
		new Tokendef(ParserConstants.TEXT, /text/gi),
		new Tokendef(ParserConstants.COLON, /:/),
		new Tokendef(ParserConstants.SEARCH, /\bsearch\b/gi),
		new Tokendef(ParserConstants.FOR, /\bfor\b/gi),
		new Tokendef(ParserConstants.NEXT, /\bnext\b/gi),
		new Tokendef(ParserConstants.PREVIOUS, /\bprevious\b/gi),
        new Tokendef(ParserConstants.POUNDSIGN,/#/gi),
		// TL TODO: parse everything that the recorder can spit out
		new Tokendef(ParserConstants.ORDINAL,/first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|[0-9]*1st|[0-9]*2nd|[0-9]*3rd|[0-9]*[0-9]th/gi),
		new Tokendef(ParserConstants.NUM,/\d+/gi),
		new Tokendef(ParserConstants.REGEX,/(r\"([^"\\]|\\.)*")|(r\'([^\'\\]|\\.)*\')/g),
		new Tokendef(ParserConstants.XPATH,/(x\"([^"\\]|\\.)*")|(r\'([^\'\\]|\\.)*\')/g),
		new Tokendef(ParserConstants.XPATHTOKEN, /\bxpath\b/gi),
		new Tokendef(ParserConstants.LOC,/\(([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)\)/g),
		new Tokendef(ParserConstants.DISAMBIGUATOR,/(\"[^\"]*\"\'s)|('[^']*)'\'s|\"[^\"]*\" row\'s/g), // e.g. the "by commodity"'s "search" button.  The third exp is kludgy for "cobra3" row's (AC)
		new Tokendef(ParserConstants.STRING,/(\"([^"\\]|\\.)*")|(\'([^\'\\]|\\.)*\')/g),	// quoted string	
		new Tokendef(ParserConstants.PERIOD,/\./g),
		new Tokendef(ParserConstants.URL,/(file:\/\/|((http|https|ftp):\/\/)?[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)+)?/),
		new Tokendef(ParserConstants.THE,/the/gi),
		new Tokendef(ParserConstants.ONOFF,/(on|off)/gi),
		new Tokendef(ParserConstants.OF,/of/gi), // must appear after ONOFF
		new Tokendef(ParserConstants.IN,/in(to|)([\s]+the[\s]+|)/gi),
		new Tokendef(ParserConstants.FROM,/from([ ]the|)/gi),
		new Tokendef(ParserConstants.AFTER, /after (the)?/gi),
		new Tokendef(ParserConstants.INCREMENT, /increment/gi),
		new Tokendef(ParserConstants.DECREMENT, /decrement/gi),
		new Tokendef(ParserConstants.BY, /by/gi),
        new Tokendef(ParserConstants.REGIONELEMENT,/region/gi),
 		new Tokendef(ParserConstants.JS,/(j\"([^"\\]|\\.)*")|(j\'([^\'\\]|\\.)*\')/g),
		// TL: moving CELLREFERENCE down to the end because it should not
		// override the "h2" match in ELEMENT
		new Tokendef(ParserConstants.CELLREFERENCE,/[a-zA-Z][0-9]+/gi),
		new Tokendef(ParserConstants.WORD,/[^\s'\"]+/g), // matches everything else		
    ], 
		
//	General Parsing Methods
// ********************************************************************************		
// **********************General Parsing Methods***********************************
// ********************************************************************************
// Scan for the next tokenRegex
	lex : function (){
	    var found = false;
	    var maxMatchLength = 0 ;
	    for(var i=0;i<this.tokendefs.length;i++){
			var tokendef = this.tokendefs[i]
			var tokenType = tokendef.type
			var tokenRegex = tokendef.regex
	        tokenRegex.lastIndex = this.pos ;
	        var match =tokenRegex.exec(this.str);
	        if (match !=null){
	            if(this.pos == match.index && match[0].length > maxMatchLength ){
	                maxMatchLength = match[0].length ;
					var t = new Token(tokenType,match[0],match.index);
					found = true;
	            }
	        }
	    }
	    if(found){
	    	this.pos += t.str.length ;
	    	return t;
	    }else{
			if ( this.pos >= this.str.length ){
				var t = new Token('end', null,this.pos);
	    		return t; 
			}else{
				throw new ParseException("no valid token found at pos" + this.pos + " : " + this.str.substring(this.pos));
			}
	    }
		return null;
	},

	// get the next token of type tokenType
	// if not available throws exception
	mandatory : function(tokenType){
		var token = this.nextToken();
		
		if( tokenType != null && token.type != tokenType){ 
			throw new ParseException("Expected " + tokenType + " but found " +token.type +" : " + token.str);
		} 
		return token ; 
	},

	// get the next token
	nextToken : function(){
		if(this.curToken != null){
			var t = this.curToken;
			this.curToken = null;
			return t ;
			
		}
		do{
			var token = this.lex();
		}while(token.type == ParserConstants.SPACE);
		
		return token;
	},

	// get the next token if its of type tokenType/null otherwise	
	optional : function(tokenType){
		var token = this.peekToken();
		if( tokenType !=null &&  token.type !=  tokenType){
			return null ; 
		}else { 
			return this.nextToken() ;
		}	 
	},

	// look ahead to see what the next token is
	peekToken : function(){
		if(this.curToken == null){
			do{
				this.curToken = this.lex();
			}while(this.curToken.type == ParserConstants.SPACE);
		}
		return this.curToken ;
	},
	// end of general parsing methods
	
	// ********************************************************************************		
	// ********************* Slop Specific Parsing Methods ****************************
	// ********************************************************************************

	//	parse()
	// parse a slop string
	parse : function(){
		//debug('Parser.parse()');
	    var token = this.mandatory();
		if (token.type == ParserConstants.VERIFY) {
			return this.IfCommand(token);     
		} else if (token.type == ParserConstants.CLIP) {
			return this.ClipCommand(token);
		} else if (token.type == ParserConstants.GOTO) {
			return this.GotoCommand(token);
		} else if (token.type == ParserConstants.PASTE) {
			return this.PasteCommand(token);
		} else if (token.type == ParserConstants.GOBACK) {
			return this.GobackCommand(token);
		} else if (token.type == ParserConstants.GOFORWARD) {
			return this.GoforwardCommand(token);
		} else if (token.type == ParserConstants.SWITCH) {
			return this.SwitchCommand(token);
		} else if (token.type == ParserConstants.CREATE) {
			return this.CreateCommand(token);
		} else if (token.type == ParserConstants.CLOSE) {
			return this.CloseCommand(token);
		} else if (token.type == ParserConstants.RELOAD) {
			return this.ReloadCommand(token);
		} else if (token.type == ParserConstants.TOGGLE) {
			return this.ToggleCommand(token);
		} else if (token.type == ParserConstants.EXPAND || token.type == ParserConstants.COLLAPSE) {
			return this.ExpandCollapseCommand(token);
		} else if (token.type == ParserConstants.ENTER) {
			return this.EnterCommand(token);
		} else if (token.type == ParserConstants.PUT) {
			return this.PutCommand(token);
		} else if (token.type == ParserConstants.INCREMENT || token.type == ParserConstants.DECREMENT) {
			return this.IncrementCommand(token);
		} else if (token.type == ParserConstants.APPEND) {
			return this.AppendCommand(token);
		} else if (token.type == ParserConstants.SELECT) {
			return this.SelectCommand(token);
		} else if (token.type == ParserConstants.TURN) {
	   	    return this.TurnCommand(token);
		} else if (token.type == ParserConstants.REPEAT) {
	   	    return this.RepeatCommand(token);
        } else if (token.type == ParserConstants.CLICK ) {
    		return this.ClickCommand(token);
        } else if (token.type == ParserConstants.MOUSEOVER ) {
    		return this.MouseoverCommand(token);
		} else if (token.type == ParserConstants.YOU) {
			return this.YouCommand(token);
		} else if (token.type == ParserConstants.PAUSE) {
			return this.PauseCommand(token);
		} else if (token.type == ParserConstants.WAIT) {
			return this.IfCommand(token);
		} else if (token.type == ParserConstants.OPEN) {
			return this.OpenCommand(token);
		} else if (token.type == ParserConstants.COPY) {
			return this.CopyCommand(token);
		} else if (token.type == ParserConstants.IF) {
			return this.IfCommand(token);
		} else if (token.type == ParserConstants.ELSE) {
			return this.ElseCommand(token);
		} else if (token.type == ParserConstants.BEGINEXTRACTION) {
			return this.BeginExtractionCommand(token);
		} else if (token.type == ParserConstants.ENDEXTRACTION) {
			return this.EndExtractionCommand(token);
		} else if (token.type == ParserConstants.EXTRACT) {
			return this.ExtractCommand(token);
		} else if (token.type == ParserConstants.SEARCH) {
			return this.FindCommand(token);
		} else throw new ParseException("Expected GOTO/ENTER/SELECT/CLICK/COPY/PASTE/IF but found " + token.type + " : " + token.str);
	},

	YouCommand : function (){
		// YOU STRING|WORD +
		// Parse the rest of the string as a nested command
		var nestedCommand;
		try {
			nestedCommand = this.parse();
		} catch (e) {
			// Unable to parse embedded command
			nestedCommand = null;
		}
		var commandComponent = getCommandComponent();
		var youCommand = new commandComponent.YouCommand(this.str, this.execEnv, nestedCommand);
		return youCommand;
	},

	//		GotoCommand
	GotoCommand : function (){
		// GOTO STRING|URL|WORD
		// go to "google.com"
		// go to "http://www.google.com"
		// go to your "search engine"
		// go to the cell in the "title" column of row 4 of the scratchtable
		//
		// go to window 2 -- this syntax refers to windows/tabs in the order in which they are encountered by the script. 
		//					So "window 1" is always the initial window. window/tab are interchangeable and mean the same thing.
		// go to window # 2 -- the browser windows in z-order starting with the frontmost
		// go to tab # 2 -- the tabs in the current browser window, numbered from left to right
		// go to the "Faces" window -- by window title. window/tab are interchangeable and mean the same thing.
		// go to the window that contains "Amazon"
		var commandComponent = getCommandComponent();
		var gotoCommand = new commandComponent.GotoCommand(this.str,this.execEnv);
		
		// First check for 'go to window' commands
		gotoCommand.targetSpec = new commandComponent.WindowSpec();
		var targetSpec = gotoCommand.targetSpec
		var url = null
		
		var t = this.optional(ParserConstants.WINDOW);
		if(t!=null){
			targetSpec.windowOrTab = "window"
			var t = this.optional(ParserConstants.POUNDSIGN);
			if(t!=null) targetSpec.poundsignP = true
			targetSpec.number = this.parseVariableValue();
			this.optional(ParserConstants.PERIOD);
			this.mandatory(ParserConstants.END);
			return gotoCommand;
		}
		var t = this.optional(ParserConstants.TAB);
		if(t!=null){
			targetSpec.windowOrTab = "tab"
			var t = this.optional(ParserConstants.POUNDSIGN);
			if(t!=null) targetSpec.poundsignP = true
			targetSpec.number = this.parseVariableValue();
			this.optional(ParserConstants.PERIOD);
			this.mandatory(ParserConstants.END);
			return gotoCommand;
		}
		t = this.optional(ParserConstants.THE);
		if(t!=null){
			t = this.optional(ParserConstants.STRING)
			targetSpec.windowOrTab = "tab"
			if(t!=null){								// the "Preferences" window/tab
				targetSpec.windowName = new commandComponent.VariableValue();	
				targetSpec.windowName.setVarOrVal(this.unQuote(t.str));
				t = this.optional(ParserConstants.WINDOW)
				if(t!=null) targetSpec.windowOrTab = "window"
				if(t == null) t = this.mandatory(ParserConstants.TAB)
			}else{										// Partial Matches (e.g. contains, starts with, ends with)					
				t = this.optional(ParserConstants.WINDOW)
				if(t!=null) targetSpec.windowOrTab = "window"
				if(t == null) t = this.mandatory(ParserConstants.TAB)
				var t = this.mandatory(ParserConstants.THAT);
				var matchtype = this.parseMatchType()
				if (!matchtype) throw new ParseException("Goto Command Parser Exception: 'window/tab that' not followed by 'contains/starts with/ends with'")
				// the value following the partial match phrase can be any variableValue.
				targetSpec.windowName = this.parseVariableValue()
				if (!(targetSpec.windowName.literal || targetSpec.windowName.dbkey || targetSpec.windowName.targetAreaType)){
					throw new ParseException("Goto Command Parser Exception: Expected match label after matchtype ");
				}
				targetSpec.windowName.setMatchType(matchtype);
			}
			this.optional(ParserConstants.PERIOD);
			this.mandatory(ParserConstants.END);
			return gotoCommand;
		}
		
		// go to a url
		gotoCommand.window = null;
		var p = this.peekToken()
		if (p && p.type == ParserConstants.CELL) {
			url = this.parseScratchTableReference()
		}else{
			url = new commandComponent.VariableValue();
			t = this.optional(ParserConstants.YOUR);
			if(t!=null){
				url.setNeedVar(true);	
				this.parseVariableValue(url);	
			}else{
				t= this.optional(ParserConstants.STRING);
				if(t!=null){
					var theText = this.unQuote(t.str).toLowerCase()
					if (this.unQuote(t.str).toLowerCase().indexOf("javascript") == 0) {
						// blocking a security risk that could execute arbitrary javascript
						// Thanks to ADI SHARABANI's script #3223
						// "5" just means that the string starts with "javascript"
						throw new ParseException("javascript not allowed in 'go to' commands");
					}
					url.setVarOrVal(this.unQuote(t.str));
				}else{
					t= this.optional(ParserConstants.URL);
					if(t!=null){
						url.setVarOrVal(t.str);
					}else{
						t= this.optional(ParserConstants.WORD);
						if(t!=null){
							url.setVarOrVal(t.str);
						}
					}
				}
			}
			
		}
		gotoCommand.url = url;
		
		this.optional(ParserConstants.EXAMPLE);
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return gotoCommand;
	},
	
	GobackCommand:function(){
		var commandComponent = getCommandComponent();
		var gobackCommand = new commandComponent.GoforwardCommand(this.str,this.execEnv);
		gobackCommand.direction = gobackCommand.BACK
		return gobackCommand;
	},
	GoforwardCommand:function(){
		var commandComponent = getCommandComponent();
		var goforwardCommand = new commandComponent.GoforwardCommand(this.str,this.execEnv);
		return goforwardCommand;
	},
	SwitchCommand:function(){
		var commandComponent = getCommandComponent();
		var switchCommand = new commandComponent.SwitchCommand(this.str,this.execEnv);
		// Label Tab
		t = this.optional(ParserConstants.THE)
		
		switchCommand.targetSpec = this.targetSpec([ParserConstants.TAB]);

		return switchCommand
	},
	CreateCommand:function(){
		var commandComponent = getCommandComponent();
		var createCommand = new commandComponent.CreateCommand(this.str,this.execEnv);
		
		var t=this.optional(ParserConstants.TAB);

		return createCommand;
	},

	CloseCommand:function(){
		var commandComponent = getCommandComponent();
		var closeCommand = new commandComponent.CloseCommand(this.str,this.execEnv);
		// Label Tab
		t = this.optional(ParserConstants.THE)
		
		closeCommand.targetSpec = this.targetSpec([ParserConstants.TAB]);

		return closeCommand;
	},
	
	ReloadCommand:function(){
		var commandComponent = getCommandComponent();
		var reloadCommand = new commandComponent.ReloadCommand(this.str,this.execEnv);
		return reloadCommand;
	},

	ToggleCommand:function(){
		var commandComponent = getCommandComponent();
		var toggleCommand = new commandComponent.ToggleCommand(this.str,this.execEnv);
		toggleCommand.targetSpec = this.targetSpec([ParserConstants.ITEM]); 
		return toggleCommand ;
	},

	ExpandCollapseCommand:function(token){
		// (EXPAND | COLLAPSE) THE [TARGET SPEC]
		var commandComponent = getCommandComponent();
		var expandCollapseCommand = new commandComponent.ExpandCollapseCommand(this.str,this.execEnv);

		expandCollapseCommand.turnon = (token.type == ParserConstants.EXPAND);

		var t = this.mandatory(ParserConstants.THE)
		expandCollapseCommand.targetSpec = this.targetSpec([ParserConstants.ITEM,  ParserConstants.SECTION]);
		
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);

		return expandCollapseCommand;
	},
	
	//		OpenCommand
	OpenCommand : function(){
		// Open the "Risks" scratchtable
		var commandComponent = getCommandComponent();
		var openCommand = new commandComponent.OpenCommand(this.str,this.execEnv);

		var t = this.optional(ParserConstants.THE)

		t = this.mandatory(ParserConstants.STRING);
		if (t != null) {	// personal DB entry
			openCommand.tableName = t.str.replace(/[\'\"]/gi,"");
		}
		
		t = this.optional(ParserConstants.SCRATCHTABLEREFERENCE)
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		
		return openCommand;
	},
	
	//		EnterCommand
	EnterCommand : function(){
		// ENTER (STRING|(WORD+)) IN [TARGET SPEC]
		var commandComponent = getCommandComponent();
		var enterCommand = new commandComponent.EnterCommand(this.str,this.execEnv);
		enterCommand.string = this.parseVariableValue();
		
		var t = this.mandatory(ParserConstants.IN)
		enterCommand.targetSpec = this.targetSpec([ParserConstants.TEXTBOX, ParserConstants.TEXTEDITOR]);
		
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		
		return enterCommand;
	},

	//		PutCommand
	PutCommand : function(){
		// put "Allen" into your "first name"  (personal DB entry)
		// put "Allen" into the cell in the "first name" column of row 3 of the scratchtable
		// put the clipboard into your "first name"
		var t = null
		var commandComponent = getCommandComponent();
		var putCommand = new commandComponent.PutCommand(this.str,this.execEnv);
		
		t = this.optional(ParserConstants.CLIPBOARD)
		if (t != null) {	// put the clipboard into ...
			putCommand.clipboardP = true
		}
		else {
			this.parseVariableValue(putCommand.string);
		}
		
		t = this.mandatory(ParserConstants.IN)

		t = this.optional(ParserConstants.YOUR)
		if (t != null) {	// personal DB entry
			putCommand.dbKey = this.parseVariableValue();
		}
		else {	// scratchtable cell
			putCommand.cellReference = this.parseScratchTableReference()
		}
				
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		
		return putCommand;
	},

	//		IncrementCommand
	IncrementCommand : function(){
		// increment your "counter"
		// increment your "counter" by 3
		// increment your "quantity" by your "amount"
		// increment your "quantity" by the "quantity" textbox
		// increment your "quantity" by the cell in the "amount" column of row 3 of the scratchtable
		// increment the cell in the "quantity" column of row 3 of the scratchtable
		var commandComponent = getCommandComponent();
		var incrementCommand = new commandComponent.IncrementCommand(this.str,this.execEnv);
		
		if (this.str.search(/^\s*decrement/i) != -1) incrementCommand.positiveP = false;

		t = this.optional(ParserConstants.YOUR)
		if (t != null) {	// personal DB entry
			incrementCommand.dbKey = this.parseVariableValue();
		}
		else {	// scratchtable cell
			incrementCommand.cellReference = this.parseScratchTableReference()
		}
		
		var t = this.optional(ParserConstants.BY)
		if (t != null) {
			this.parseVariableValue(incrementCommand.amount);
		}
		else {
			incrementCommand.amount = new commandComponent.VariableValue("1")
		}
		
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		
		return incrementCommand;
	},

	//		AppendCommand
	AppendCommand : function(){
		// APPEND (STRING|(WORD+)) TO [TARGET SPEC]
		var commandComponent = getCommandComponent();
		var appendCommand = new commandComponent.AppendCommand(this.str,this.execEnv);
		//appendCommand.string = new commandComponent.VariableValue();
		appendCommand.string = this.parseVariableValue();
		
		var t = this.mandatory(ParserConstants.TO)
		t = this.optional(ParserConstants.THE)
		appendCommand.targetSpec = this.targetSpec([ParserConstants.TEXTBOX, ParserConstants.TEXTEDITOR]);
		
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		
		return appendCommand;
	},
		
	//		SelectCommand
	SelectCommand : function(token){
		// select the "File>New Tab" menu
		// select "San Jose" from the "IMDB" listbox
		// select the cell in the 'city' column of row 2 of the scratchtable from the "IMDB" listbox
		// control-select "San Jose" from the "Cities" listbox
		// shift-select "San Jose" from the "Cities" listbox
		var t = null
		var commandComponent = getCommandComponent(); 
		var selectCommand = new commandComponent.SelectCommand(this.str,this.execEnv);
		var variablevalueConstructor = getCommandComponent().VariableValue;
		selectCommand.string = new variablevalueConstructor();
		
	    // maybe it is a control-select or shift-select command	
		if (token != null && token.str.match(/^control/i) !==null) {
			selectCommand.specialKey = "control";
		}else if (token != null && token.str.match(/^shift/i) !==null) {
			selectCommand.specialKey = "shift";
		}else {
			selectCommand.specialKey = null;
		}

		// It's not good to have "menu" and "listbox" use the same command
		// We can distinguish them because the only legal words following "the" in a listbox command are "cell" and "item"
		t = this.optional(ParserConstants.THE)
		if(t!=null){
			var p = this.peekToken()
			if (p && (p.type != ParserConstants.CELL && p.type != ParserConstants.ITEM)) {	//menu command
				// select the "File>New Tab" menu
				selectCommand.menuP = true
				selectCommand.targetSpec = this.targetSpec([ParserConstants.MENU]);
				this.optional(ParserConstants.PERIOD);
				this.mandatory(ParserConstants.END);
				return selectCommand;
			}
		}
		
		// listbox command
		t = this.optional(ParserConstants.ITEM)
		if(t!=null){	// partial match phrase
			var t = this.mandatory(ParserConstants.THAT);
			var matchtype = this.parseMatchType()
			// the value following the partial match phrase can be any variableValue.
			this.parseVariableValue(selectCommand.string)
			if (!(selectCommand.string.literal || selectCommand.string.dbkey || selectCommand.string.targetAreaType)){
				throw new ParseException("selctCommand Parser Exception: Expected match label after matchtype ");
			}
			selectCommand.string.setMatchType(matchtype);			
		} else {
			this.parseVariableValue(selectCommand.string)
		}
		
		t = this.mandatory(ParserConstants.FROM)
		t = this.optional(ParserConstants.THE)
		selectCommand.targetSpec = this.targetSpec([ParserConstants.LISTELEMENT]);
		
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return selectCommand;
	},
	
	TurnCommand : function(){
		// TURN (ON|OFF) THE [TARGETFIELD SPEC] CHECKBOX
		var commandComponent = getCommandComponent() ; 
		var turnCommand = new commandComponent.TurnCommand(this.str,this.execEnv);
		
		var t = this.mandatory(ParserConstants.ONOFF)
		if(t !=null){
			turnCommand.turnon = (t.str == "on");
		}else{
		}
		
		t = this.optional(ParserConstants.THE)
		
		turnCommand.targetSpec = this.targetSpec([ParserConstants.CHECKBOXELEMENT,ParserConstants.RADIOBUTTONELEMENT,ParserConstants.ITEM]);
		//t=this.optional();
		//if (t != null) {
		//	turnCommand.targetSpec.targetType = getLabeler().WEBTYPES.CHECKBOX;
		//} else {
		//	t = this.optional(ParserConstants.RADIOBUTTONELEMENT);
		//	if (t != null) {
		//		turnCommand.targetSpec.targetType = getLabeler().WEBTYPES.RADIOBUTTON;
		//	}
		//}
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return turnCommand;
	},
	
	//		RepeatCommand
	RepeatCommand : function(){
		//		repeat		// This repeats for all rows in the scratchtable
		//		repeat with your "counter"
		//Later, add commands that specify a table on a content page
		var commandComponent = getCommandComponent();
		var repeatCommand = new commandComponent.RepeatCommand(this.str,this.execEnv);

		var t = this.optional(ParserConstants.WITH)
		if (t != null) {
			t = this.optional(ParserConstants.YOUR)
			if (t != null) {	// personal DB entry
				repeatCommand.dbKey = this.parseVariableValue();
			}
			else {	// scratchtable cell
				repeatCommand.cellReference = this.parseScratchTableReference()
			}
		}
		
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return repeatCommand;
	},
	
	//		ElseCommand
	ElseCommand : function(){
		var commandComponent = getCommandComponent();
		var elseCommand = new commandComponent.ElseCommand(this.str,this.execEnv);

		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return elseCommand;
	},
	
	
	//
	//		If/Wait/Verify Commands
	//
	// (if | wait until | verify) there is
	//		a "submit" button | no "submit" button | not a "submit" button
	//		a div | no div | not a div
	//		a div that contains "foo" | no div that contains "foo" | not a div that contains "foo" 
	//		text "foo" in the "first name" textbox | no text "foo" in the "first name" textbox | not text "foo" in the "first name" textbox
	//
	//	(if | wait until | verify) 
	//		your "counter" < your "max value"
	//		your "subject" contains "health"
	//		your "subject" does not contain "health"
	//		your "cost" < the "total amount" textbox
	IfCommand : function(token){
		// if there is a "Sign in" link
		// if there is a "Log in" button
		// if there is a "Email address:" textbox
		// if there is text "foo" in the "bar" textbox
		var commandComponent = getCommandComponent();
		var ifCommand = new commandComponent.IfCommand(this.str,this.execEnv);

		ifCommand.token = token;
		var t = this.optional(ParserConstants.THEREIS)
		if (t != null) {
			this.parseIsNoText(ifCommand);	// 'no | not | not a | not an'		
			return this.parseAssertionTargetSpec(ifCommand);
		}

		ifCommand.leftSide = this.parseVariableValue();
		this.checkIsNot(ifCommand)
		var matchType = this.parseMatchType()
		if (!matchType) throw new ParseException("If Command Parser Exception: no comparison operator found")
		ifCommand.matchType = matchType
		ifCommand.rightSide = this.parseVariableValue();	// this will include a regexp for the matchType
		return ifCommand;
	},

	// Parse the latter part of an if/wait/verify/clip command
	parseAssertionTargetSpec : function(assertCommand) {
		var t = this.optional(ParserConstants.ELEMENT);	// An HTML element, e.g.  * verify there is a td that contains "foo"
		if (t != null) {	// verify there is a td that contains "foo"
			t = this.optional(ParserConstants.THAT);								
			if (t!= null) {
				t = this.mandatory(ParserConstants.CONTAINS);
				if (t != null) {
					assertCommand.targetSpec = this.targetSpec();
					assertCommand.targetSpec.targetType = ParserConstants.ELEMENT;
					assertCommand.targetSpec.targetLabel.setMatchType(ParserConstants.CONTAINS);
				}					
			} else {
				t = this.optional(ParserConstants.WHICH);
				if (t!= null) {
				   t = this.mandatory(ParserConstants.CONTAINS);
				   if (t != null) {
					 assertCommand.targetSpec = this.targetSpec();
			   		 assertCommand.targetSpec.targetType = ParserConstants.ELEMENT;
				     assertCommand.targetSpec.targetLabel.setMatchType(ParserConstants.CONTAINS);
				   } 						
				} else {
					// JM:
					//TODO: currently we can parse, whose name contains or whose name is, but don't actually verify that
					// perhaps we should not be parsing this as well
				  	t = this.optional(ParserConstants.WHOSE);
					if (t!= null) {
				    	t = this.mandatory(ParserConstants.NAME);
				    	if (t != null) {							
					   		t = this.mandatory(ParserConstants.CONTAINS);
						    if (t != null) {
							   	assertCommand.targetSpec = this.targetSpec();
							   	assertCommand.targetSpec.targetType = ParserConstants.ELEMENT;
							   	assertCommand.targetSpec.targetLabel.setMatchType(ParserConstants.CONTAINS);
						    } else {
					   	    	t = this.mandatory(ParserConstants.IS);
						    	if (t!=null) {
							   		assertCommand.targetSpec = this.targetSpec();
						   			assertCommand.targetSpec.targetType = ParserConstants.ELEMENT;
								} // end if t != null
						  	} // end else
						} // end if						 
					} else {
						t = this.optional(ParserConstants.LABELLED);
						if (t != null) {
						   	assertCommand.targetSpec = this.targetSpec();
						   	assertCommand.targetSpec.targetType = ParserConstants.ELEMENT;
					    }	
					} // end if WHOSE else LABELLED   
				} // end if WHICH else WHOSE
			} // end if THAT else WHICH
		} else {
			t = this.optional(ParserConstants.SELECTION)
		  	if (t!= null) {
				assertCommand.selectionP = true;
			}
			else { 	// verify there is a "foo" link	// here target type can be button/textbox/link, etc.
				assertCommand.targetSpec = this.targetSpec([ParserConstants.TEXTBOX,ParserConstants.CHECKBOXELEMENT,ParserConstants.RADIOBUTTONELEMENT,ParserConstants.CLOSEBUTTONELEMENT,ParserConstants.BUTTONELEMENT,ParserConstants.LINKELEMENT,ParserConstants.MENU,
	ParserConstants.ITEM,ParserConstants.SECTION,ParserConstants.TAB,ParserConstants.LISTELEMENT,ParserConstants.AREAELEMENT,ParserConstants.REGIONELEMENT,	ParserConstants.CELL,ParserConstants.SCRATCHTABLEREFERENCE,ParserConstants.TEXTEDITOR]);
			}					
		}	// end if ELEMENT else SELECTION
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);		
		return assertCommand;
	},	// end of parseAssertionTargetSpec
	
	parseIsNoText : function(assertCommand) {
		//Tokendef for if/wait/verify includes "there is/are"	
		this.checkNegation(assertCommand); // 'there is no'	
		this.checkText(assertCommand);  // 'there (is | is no) text "foo" in'	
		this.parseArticle(assertCommand); 	// parse a/an
	},

	// Look for: not 
	checkNegation : function(assertCommand) {
		var t = this.optional(ParserConstants.NOT);	// NOT matches 
		if (t != null) {
			assertCommand.positive = false;			
		} else {
			assertCommand.positive = true;
		}	
	},

	// Look for: is not; does not 
	checkIsNot : function(assertCommand) {
		this.optional(ParserConstants.IS) 
		this.optional(ParserConstants.DOES) 
		this.checkNegation(assertCommand)
	},

	// Look for:
	//    text "foo" in/into the
	//    text foo in/into the
	checkText : function(assertCommand) {
		var commandComponent = getCommandComponent();		

		// The 'string' property holds the text for 
		// * verify there is text "foo" in the "password" textbox
		assertCommand.string = new commandComponent.VariableValue();	

		assertCommand.textCommandP = false
		var t = this.optional(ParserConstants.TEXT)
		if (t != null) {
			assertCommand.textCommandP = true
			t = this.optional(ParserConstants.WORD)
			if(t !=null){
				assertCommand.string.setVarOrVal(this.stringFromWords(t));
			}else{
			    t = this.mandatory(ParserConstants.STRING)
				assertCommand.string.setVarOrVal(this.unQuote(t.str));
			}		
			this.mandatory(ParserConstants.IN)
		}				
	},
	
	// Look for: a | an 
	parseArticle : function(assertCommand) {
		// checkNegation has already been called, and it has set assertCommand.positive correctly
		// The slop could have been "there is not a", or "there is a" (or "this is an")
		// In either case, the a/an should be parsed at this point, without change the setting of assertCommand.positive
		// If the slop had been "there is link", that is incorrect English that probably means "there is a link", and it will parse correctly
		var t = this.optional(ParserConstants.AN);		
		if (t == null){ // "an" is not found, now check if "a" appears. 
			this.optional(ParserConstants.ARTICLE);	
		}	
	},

	PauseCommand : function(){
		// PAUSE NUM SECONDS
		var commandComponent = getCommandComponent();
		var pauseCommand = new commandComponent.PauseCommand(this.str,this.execEnv);

		var t = this.mandatory(ParserConstants.NUM);
		if (t != null) {
			pauseCommand.pauseLength = parseInt(t.str);
		}

		t = this.mandatory(ParserConstants.SECONDS);
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);

		return pauseCommand;
	},


	//		Clip Command
	// This calls the same code that AssertCommand does to parse the target specifier
	ClipCommand : function(token) { // CLIP THE [TARGET SPEC]		
		var commandComponent = getCommandComponent();
        var clipCmd = new commandComponent.ClipCommand(this.str,this.execEnv);
		return this.parseAssertionTargetSpec(clipCmd);
	},

	//		ClickCommand
	ClickCommand : function(token){
		// (CONTROL-|)CLICK [CLICK TARGET SPEC]
		var t = null
		var commandComponent = getCommandComponent();		
		var clickCommand = new commandComponent.ClickCommand(this.str,this.execEnv);
	    // maybe it was a control-click?	
		if (token != null && token.str.match(/^control/i) !==null) {
			clickCommand.controlP = true;
		}else{
			clickCommand.controlP = false;
		}
		
		/* Parse a scratchtable cell target
		// Since scratchtable cells can contain a link, they are unusual in that they can both be the target of a click and the (variableValue) label of a clicked element
		// * click the cell in the "conference paper" column of row 4 of the scratchtable
		// * click the     the cell in the "username" column of the "cobra1" row of the scratchtable     button
		// The syntax is awkward because we don't have a graphic to display personalDB and table references.
		*/
		var p = this.peekToken()
		if (p && p.type == ParserConstants.CELL) {
			var scratchTableReference = this.parseScratchTableReference()
			if (scratchTableReference) {
				this.optional(ParserConstants.PERIOD);
				t = this.optional(ParserConstants.END);
				if (t != null) {	// click the scratchtable cell
					clickCommand.targetSpec = scratchTableReference
					return clickCommand;
				}
			}
			// start parsing again from the beginning
			this.pos = 0;
			this.mandatory();	// click
		}
		
		clickCommand.targetSpec = this.targetSpec([ParserConstants.BUTTONELEMENT,ParserConstants.LINKELEMENT,ParserConstants.ITEM,ParserConstants.AREAELEMENT,ParserConstants.MENU, ParserConstants.TAB, ParserConstants.TEXTBOX, ParserConstants.CLOSEBUTTONELEMENT, ParserConstants.MENUITEM]);
		
		if ( !(clickCommand.targetSpec.xpath || clickCommand.targetSpec.targetType) ) throw new ParseException("no targetName found for click command");

		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return clickCommand ;
	},

	//		MouseoverCommand
	MouseoverCommand : function(token){
		// MOUSEOVER [MOUSEOVER TARGET SPEC]
		var t = null
		var commandComponent = getCommandComponent();		
		var mouseoverCommand = new commandComponent.MouseoverCommand(this.str,this.execEnv);
		mouseoverCommand.controlP = false;
		
		mouseoverCommand.targetSpec = this.targetSpec([ParserConstants.BUTTONELEMENT,ParserConstants.LINKELEMENT,ParserConstants.ITEM,ParserConstants.AREAELEMENT,ParserConstants.MENU, ParserConstants.TAB, ParserConstants.TEXTBOX, ParserConstants.CLOSEBUTTONELEMENT, ParserConstants.MENUITEM]);
		
		if ( !(mouseoverCommand.targetSpec.xpath || mouseoverCommand.targetSpec.targetType) ) throw new ParseException("no targetName found for mouseover command");

		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return mouseoverCommand ;
	},

	//		CopyCommand
	CopyCommand : function(){
		var commandComponent = getCommandComponent();
		var labeler = getLabeler();
		var u = getUtils();
		var copyCommand = new commandComponent.CopyCommand(this.str,this.execEnv);
		var t = this.optional(ParserConstants.THE);

		// CELL at/in
		var p = this.peekToken()
		if (p && p.type == ParserConstants.CELL) {	//ScratchTable command
			copyCommand.targetSpec = this.parseScratchTableReference()
			copyCommand.sourceType = commandComponent.TARGETAREATYPE.SCRATCHTABLE;
			return copyCommand
		}

		// Copy text after "Morningstar Stylebox"
		t = this.optional(ParserConstants.TEXT);
		if (t != null) {
			copyCommand.sourceType = commandComponent.TARGETAREATYPE.WEBPAGE;
			// after
			t = this.mandatory(ParserConstants.AFTER);
			// "Morningstar Stylebox"
			t = this.mandatory(ParserConstants.STRING);
			copyCommand.label = t.str;

			this.optional(ParserConstants.PERIOD);
			this.mandatory(ParserConstants.END);
			return copyCommand;
		}
		
		// Copy the targetspec
		// e.g. Copy the "Google Search" textbox
		// Copy the "Walk Score:" text
		copyCommand.targetSpec = this.targetSpec([ParserConstants.TEXT, ParserConstants.TEXTBOX]);	// doesn't targetSpec include the element name, eg 'text' or 'textbox'??
		if (copyCommand.targetSpec.targetType == ParserConstants.TEXTBOX) {
			copyCommand.sourceType = commandComponent.TARGETAREATYPE.TEXTBOX
		}
		else {
			if (copyCommand.targetSpec.targetType == ParserConstants.TEXT) {
				copyCommand.sourceType = commandComponent.TARGETAREATYPE.TEXT;
			}
			else {
				if (copyCommand.targetSpec.xpath != null) {
					copyCommand.sourceType = commandComponent.TARGETAREATYPE.XPATH;
				}
			}
		}

		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return copyCommand;
	},	// end of CopyCommand
	
	//		PasteCommand
	PasteCommand : function(){
		var commandComponent = getCommandComponent();
		var labeler = getLabeler();
		var u = getUtils();
		var pasteCommand = new commandComponent.PasteCommand(this.str,this.execEnv);

		var t = this.optional(ParserConstants.IN);  // /in(to|)([\s]+the[\s]+|)/

		// CELL at/in
		var p = this.peekToken()
		if (p && p.type == ParserConstants.CELL) {	//ScratchTable command
			pasteCommand.targetSpec = this.parseScratchTableReference()
			pasteCommand.destType = commandComponent.TARGETAREATYPE.SCRATCHTABLE;
			return pasteCommand
		}

		// Paste into the "Google Search" textbox
		pasteCommand.destType = commandComponent.TARGETAREATYPE.WEBPAGE;
		pasteCommand.targetSpec = this.targetSpec();
		t = this.optional(ParserConstants.TEXTBOX);
		if (t != null) {
			pasteCommand.targetSpec.targetType = getLabeler().WEBTYPES.TEXTBOX;
		}

		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		return pasteCommand;
	},	// end of PasteCommand

		
	BeginExtractionCommand : function(){
		// BEGIN EXTRACTION
		var commandComponent = getCommandComponent();
		var beginExtractionCommand = new commandComponent.BeginExtractionCommand(this.str,this.execEnv);
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);

		return beginExtractionCommand;
	},

	EndExtractionCommand : function(){
		// END EXTRACTION
		var commandComponent = getCommandComponent();
		var endExtractionCommand = new commandComponent.EndExtractionCommand(this.str,this.execEnv);
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);

		return endExtractionCommand;
	},

	//		Extract Command
	ExtractCommand : function(){
		// extract the "netflix queue" scratchtable
		// extract and append to the "netflix queue" scratchtable
		// re-extracts the table on the current content page, using XPaths saved from the original interactive extraction.
		var commandComponent = getCommandComponent();
		var extractCommand = new commandComponent.ExtractCommand(this.str,this.execEnv);
		
		extractCommand.overwriteP = true
		var t = this.optional(ParserConstants.ANDAPPEND);
		if (t != null) {	// and append to
			extractCommand.overwriteP = false
		}
		
		t = this.optional(ParserConstants.THE);

		t = this.optional(ParserConstants.STRING);
		if (t != null) {	// personal DB entry
			extractCommand.tableName = t.str.replace(/[\'\"]/gi,"");
		}
		
		t = this.optional(ParserConstants.SCRATCHTABLEREFERENCE)
		this.optional(ParserConstants.PERIOD);
		this.mandatory(ParserConstants.END);
		
		return extractCommand;
	},

	//
	//		Find Command
	//
	FindCommand : function(){
		// search for "library"
		// search for your "searchTerm"
		// search next
		// search previous
		var commandComponent = getCommandComponent();
		var findCommand = new commandComponent.FindCommand(this.str,this.execEnv);
		
		var t = this.optional(ParserConstants.FOR);
		
		t = this.optional(ParserConstants.NEXT);
		if(t!=null){
			findCommand.continueFlag = true;
			findCommand.previousFlag = false;
		}
		else
		{		
			t = this.optional(ParserConstants.PREVIOUS)
			if(t !=null){
				findCommand.continueFlag = true;
				findCommand.previousFlag = true;
			}else{
				this.parseVariableValue(findCommand.searchTerm)
				findCommand.continueFlag = false;
			}
		}
		
		return findCommand;
	},

	////////////////////
	//	targetSpec
	////////////////////
	targetSpec : function(targetTypes){
		// Returns a targetSpec object that matches one of the specified targetTypes,
		//with optional disambiguator, label, and partial label match (e.g. "that begins with")
		//and possibly the containing window
		//
		// (DISAMBIGUATOR|ORDINAL|) STRING | WORD | XPATH
		// Field Description e.g. 
		//  "yo" textbox
		//  "yo" textbox
		//  first "yo" textbox/
		//  "News"'s "yo" textbox
		//  yo dude textbox
		//  /HTML/BODY[2]/A
		// "OK" button in the dialog box
		// link that starts with the cell in the "Total Cost" column of the first row of the scratchtable
		var t = null
		var commandComponent = getCommandComponent()
		var targetSpecConstructor = commandComponent.TargetSpec;
		var spec = new targetSpecConstructor();
		var variablevalueConstructor = commandComponent.VariableValue;
		spec.targetLabel = new variablevalueConstructor();

		// ordinal
		t = this.optional(ParserConstants.DISAMBIGUATOR)	// e.g. the "by commodity"'s "search" button
		if(t!=null){
			spec.disambiguator = t.str ;
		}
		t = this.optional(ParserConstants.ORDINAL);	// e.g. "sixth"
		if(t!=null){
			//spec.ordinal = getUtils().getCardinal(t.str);
			spec.ordinal = new variablevalueConstructor()	
			spec.ordinal.setVarOrVal(getUtils().getCardinal(t.str));
		}
		t = this.optional(ParserConstants.NUMBERWORD);	// "number 4" instead of "fourth"
		if(t!=null){
			spec.ordinal = new variablevalueConstructor()
			this.parseVariableValue(spec.ordinal)
			//t = this.mandatory(ParserConstants.NUM);
			//if(t!=null){
				//spec.ordinal = parseInt(t.str); 
			//}
		}
		t = this.optional(ParserConstants.POUNDSIGN);	// "# 4" instead of "fourth"
		if(t!=null){
			spec.ordinal = new variablevalueConstructor()
			this.parseVariableValue(spec.ordinal)
			//t = this.mandatory(ParserConstants.NUM);
			//if(t!=null){
				//spec.ordinal = parseInt(t.str); 
			//}
		}
		
		// label
		this.parseVariableValue(spec.targetLabel)
			
		// xPath or targetType
		t = this.optional(ParserConstants.XPATH);
		if (t != null) {	// xPath target  e.g.  x"//*[@id='content-main']/DIV[1]/A[1]"
			spec.xpath = this.unQuote(t.str.substr(1));
			t = this.optional(ParserConstants.AT)
			if(t!=null){
				t = this.optional(ParserConstants.LOC)
				if(t!=null){
					var tStr = t.str
					var clickLoc = {}
					var commaLoc = tStr.indexOf(",")
					clickLoc.x = tStr.substring(1,commaLoc);
					clickLoc.y = tStr.substring(commaLoc+1,tStr.length-1);
					spec.clickLoc = clickLoc;
				}
			}
		} else {
			t = this.optional(ParserConstants.XPATHTOKEN);
			if (t != null) {	// xPath target  e.g. the "//*[@id='content-main']/DIV[1]/A[1]" xpath
				spec.xpath = spec.targetLabel.literal;	// the xPath was incorrectly parsed as the targetLabel: make it the spec's xpath
				spec.targetLabel = new variablevalueConstructor();	// empty out the targetLabel
				t = this.optional(ParserConstants.AT)
				if(t!=null){
					t = this.optional(ParserConstants.LOC)
					if(t!=null){
						var tStr = t.str
						var clickLoc = {}
						var commaLoc = tStr.indexOf(",")
						clickLoc.x = tStr.substring(1,commaLoc);
						clickLoc.y = tStr.substring(commaLoc+1,tStr.length-1);
						spec.clickLoc = clickLoc;
					}
				}
			} else if (spec.targetLabel.javascript && (spec.targetLabel.javascript.indexOf("'x\\\"") != -1 || spec.targetLabel.javascript.indexOf('"x\\\'') != -1)) {	// javascript that evaluates to an XPath.  
				//This is getting kludgey and maybe there should be a more principled way to write and parse javascript that generates an XPath target. But I want to support:
				// clip the j"  'x\"' + '//TR[4]/TD[' + personalDB['counter'] + ']\"'     "
				// I just look for the x" or x' text since you may not be able to actually evaluate the javascript at parse time.
				//  the javascript was incorrectly parsed as the targetLabel's javascript: make it the spec's javascript
				spec.javascriptVariableValue = spec.targetLabel
				spec.targetLabel = new variablevalueConstructor();	// empty out the targetLabel
				t = this.optional(ParserConstants.AT)
				if(t!=null){
					t = this.optional(ParserConstants.LOC)
					if(t!=null){
						var tStr = t.str
						var clickLoc = {}
						var commaLoc = tStr.indexOf(",")
						clickLoc.x = tStr.substring(1,commaLoc);
						clickLoc.y = tStr.substring(commaLoc+1,tStr.length-1);
						spec.clickLoc = clickLoc;
					}
				}
			} else if (typeof(targetTypes)!='undefined') {
				for(var i=0;i<targetTypes.length;i++){	// targetTypes
					var targetType = targetTypes[i];
					if((t = this.optional(targetType))!=null){
						spec.targetType = this.targetTypeForElement(targetType);
						break;			
					}
				}
			}
		}
		// NOTE THAT the above code produces specs that have no targetType if they have a .xpath or a .javascript property.		
		
		// Partial Matches (e.g. contains, starts with, ends with)
		// (AC) need to add IS, and negations
		t = this.optional(ParserConstants.THAT);
		if(t!=null && !(spec.targetLabel.literal || spec.targetLabel.dbkey || spec.targetLabel.targetAreaType)){	// there can't be both a label and a partial match phrase
			var matchtype = this.parseMatchType()
						
			// the value following the partial match phrase can be any variableValue. It is stored as the spec.targetLabel
			this.parseVariableValue(spec.targetLabel)
			if (!(spec.targetLabel.literal || spec.targetLabel.dbkey || spec.targetLabel.targetAreaType)){
				throw new ParseException("Parser Exception: Expected match label after matchtype ");
			}
			spec.targetLabel.setMatchType(matchtype);
		}
		// END Partial Matches
		
		// Window descriptor
		t = this.optional(ParserConstants.IN)
		if(t!=null ){
			t = this.optional(ParserConstants.DIALOGBOX)	// in the dialog box
			if(t!=null ) {
				spec.isDialogP = true
			}else{
				t = this.optional(ParserConstants.MAINWINDOW)	// in the main window
				if(t!=null){
					spec.windowId=0
				}else{
					t = this.optional(ParserConstants.STRING)	// in the "Preferences" window
					if(t!=null){
						spec.windowName=this.unQuote(t.str);
						t = this.mandatory(ParserConstants.WINDOW)
					}else{
						t = this.optional(ParserConstants.WINDOW)	// in window #2; in window 2
						if(t!=null){
							t = this.optional(ParserConstants.POUNDSIGN)
							t = this.mandatory(ParserConstants.NUM)
							if(t!=null){
								spec.windowId=(t.str);
							}
						}
					}
				}
			}
		}
		return spec;
	},	// end of targetSpec
	

	//		parseMatchType
	parseMatchType : function (){
		var matchtype = null
		var t = this.optional(ParserConstants.CONTAINS);
		if(t!=null){
			matchtype = ParserConstants.CONTAINS
		}else {
			t = this.optional(ParserConstants.ENDSWITH);
			if(t!=null){
				matchtype = ParserConstants.ENDSWITH
			}else{
				t = this.optional(ParserConstants.STARTSWITH);
				if(t!=null){
					matchtype = ParserConstants.STARTSWITH
				}else{
					t = this.optional(ParserConstants.EQUALS);
					if(t!=null){
						matchtype = ParserConstants.EQUALS
					}else{
						t = this.optional(ParserConstants.EQUALSIGN);
						if(t!=null){
							matchtype = ParserConstants.EQUALSIGN
						}else{
							t = this.optional(ParserConstants.GREATERTHANSIGN);
							if(t!=null){
								matchtype = ParserConstants.GREATERTHANSIGN
							}else{
								t = this.optional(ParserConstants.LESSTHANSIGN);
								if(t!=null){
									matchtype = ParserConstants.LESSTHANSIGN
								}
							}
						}
					}
				}
			}
		}	
		return matchtype;
	},

	//		parseVariableValue
	parseVariableValue : function (variableValueObj){
		var commandComponent = getCommandComponent(); 
		// If you don't pass in your own variableValueObj, one will be created for you
		if (!variableValueObj) variableValueObj = new commandComponent.VariableValue();		
		
		// CELL at/in scratchtable
		var p = this.peekToken()
		if (p && p.type == ParserConstants.CELL) {
			variableValueObj.tableTargetSpec = this.parseScratchTableReference()
			variableValueObj.targetAreaType = commandComponent.TARGETAREATYPE.SCRATCHTABLE;	// used by variableValue's getvalue()
			return variableValueObj;
		}else{
			// javascript
			var t = this.optional(ParserConstants.JS);	
			if(t!=null){
				var evalStr = t.str.substr(2,t.str.length-3)
				variableValueObj.javascript = evalStr
			}else{
				// personalDBValue
				t = this.optional(ParserConstants.YOUR);
				if(t!=null){
					variableValueObj.setNeedVar(true);
				}
				// personalDBValue or stringLiteral or regexp label
				t = this.optional(ParserConstants.STRING)
				if(t!=null){
					variableValueObj.setVarOrVal(this.unQuote(t.str));
					// variableValueObj.getNeedVar()));
				}else{
					t=this.optional(ParserConstants.WORD)
					if(t != null){
						variableValueObj.setVarOrVal(this.stringFromWords(t));
					}else{
						t=this.optional(ParserConstants.REGEX)
						if(t != null){
							variableValueObj.setVarOrVal(new RegExp(this.unQuote(t.str.substr(1)))); // remove the leading 'r' before unquoting
						}
					}
				}
				t = this.optional(ParserConstants.EXAMPLE);
				if(t!=null && variableValueObj.needsVars()){
					variableValueObj.literal = t.str;
				}
			}
		}	
		return variableValueObj;
	},	

	//////////
	// TABLES
	//Paste into ....,  Click the link that starts with ...,  Select the ... menu item, 
	//
	//... the cell at/in the     	first 			column 		of the 	second 		row	 	of the scratchtable
	//... the cell at/in the     	number 4 		column 		of the 	number 2 	row	 	of the scratchtable
	//... the cell at/in the     	"Total Cost" 	column 		of the 	"Palo Alto"	row		of the scratchtable
	//... the cell at/in	     					column 6 	of 					row 2	of the scratchtable
	//note that in these cases, the ordinal is not a disambiguator
	//////////
	//
	//		parseScratchTableReference
	parseScratchTableReference : function(){
		var commandComponent = getCommandComponent();
		var labeler = getLabeler();
		var u = getUtils();
		
		var tableTargetSpecConstructor = commandComponent.TableTargetSpec;
		var tableTargetSpec = new tableTargetSpecConstructor();
		tableTargetSpec.targetType = labeler.WEBTYPES.TABLECELL;
		tableTargetSpec.tableType = labeler.WEBTYPES.SCRATCHTABLE;
		//var variablevalueConstructor = getCommandComponent().VariableValue;
		//spec.targetLabel = new variablevalueConstructor();
		var t = this.mandatory(ParserConstants.CELL);
		if (t != null) {
			t = this.optional(ParserConstants.THE);
			if(t!=null){
				t = this.optional(ParserConstants.ORDINAL);	// e.g. first column
				if(t!=null){		
					tableTargetSpec.targetColumnNumber = u.getCardinal(t.str); 
				}
				else {
					t = this.optional(ParserConstants.NUMBERWORD);	// "number 4" instead of "fourth"
					if(t!=null){
						t = this.mandatory(ParserConstants.NUM);	// preferably make this a variableValue that will ultimately have to be coercable into a number (AC)
						tableTargetSpec.targetColumnNumber = parseInt(t.str);
					}
					else {
						var variableValue = this.parseVariableValue()
						tableTargetSpec.targetColumnLabel = variableValue	// e.g. "Total Cost" column
					}
				}
			}
		}
		t = this.mandatory(ParserConstants.COLUMN)
		if(!tableTargetSpec.targetColumnNumber && (!tableTargetSpec.targetColumnLabel || tableTargetSpec.targetColumnLabel.getValue() == "")){
			t = this.mandatory(ParserConstants.NUM)	// e.g. column 6.  preferably make this a variableValue that will ultimately have to be coercable into a number (AC)
			tableTargetSpec.targetColumnNumber = parseInt(t.str)
		}	// end of COLUMN

		t = this.mandatory(ParserConstants.OF);
		t = this.optional(ParserConstants.THE);
		if(t!=null){
			t = this.optional(ParserConstants.ORDINAL);	// e.g. first row
			if(t!=null){
				tableTargetSpec.targetRowNumber = u.getCardinal(t.str); 
			}
			else {
				t = this.optional(ParserConstants.NUMBERWORD);	// "number 4" instead of "fourth"
				if(t!=null){
					t = this.mandatory(ParserConstants.NUM);	// preferably make this a variableValue that will ultimately have to be coercable into a number (AC)
					tableTargetSpec.targetRowNumber = parseInt(t.str);
				}
				else {
					variableValue = this.parseVariableValue()
					tableTargetSpec.targetRowLabel = variableValue	// e.g. "Total Cost" row
				}
			}
		}
		t = this.mandatory(ParserConstants.ROW)
		if(!tableTargetSpec.targetRowNumber && (!tableTargetSpec.targetRowLabel || tableTargetSpec.targetRowLabel.getValue() == "")){
			t = this.mandatory(ParserConstants.NUM)	// e.g. row 6.  preferably make this a variableValue that will ultimately have to be coercable into a number (AC)
			tableTargetSpec.targetRowNumber = parseInt(t.str)
		}	// end of ROW

		this.mandatory(ParserConstants.OF);
		this.optional(ParserConstants.THE);
		this.mandatory(ParserConstants.SCRATCHTABLEREFERENCE);
		return tableTargetSpec
		/*
		// special A5 spreadsheet syntax:
		// Copy Cell A5 in Table 3
		t = this.optional(ParserConstants.CELL);
		if (t != null) {
			copyCommand.sourceType = commandComponent.TARGETAREATYPE.TABLE;
			// A5 into Table 5
			t = this.mandatory(this.CELLREFERENCE);
			copyCommand.cellreference = t.str ;
			t = this.optional(ParserConstants.IN);
			t = this.mandatory(ParserConstants.TABLEREFERENCE);
			copyCommand.tablereference = t.str ;

			this.optional(ParserConstants.PERIOD);
			this.mandatory(ParserConstants.END);
			return copyCommand;
		}
		*/
	},	// end of parseScratchTableReference
	
	stringFromWords : function(firstWord){
		// this is parsing a string of words without quotes into a string
		var startpos = firstWord.index;
		var endpos = firstWord.index + firstWord.str.length;
		var t;
		while((t=this.optional(ParserConstants.WORD))!= null){
			endpos = t.index + t.str.length;
		}
		return this.str.substring(startpos,endpos);
	},

	unQuote : function (str){
		str = str.replace(/\\"/g,'"');
		str = str.replace(/\\'/g,"'");
		return str.substring(1, str.length - 1);
	},

	getAnyElement : function() {
		var t;

		t=this.optional(ParserConstants.BUTTONELEMENT);
		if (t != null) {
			return getLabeler().WEBTYPES.BUTTON;
		}

		t = this.optional(ParserConstants.LINKELEMENT);
		if (t != null) {
			return getLabeler().WEBTYPES.LINK;
		}

		t = this.optional(ParserConstants.ITEM);
		if (t != null) {
			return getLabeler().WEBTYPES.ITEM;
		}

		t = this.optional(ParserConstants.AREAELEMENT);
		if (t != null) {
			return getLabeler().WEBTYPES.AREA;
		}

		t = this.optional(ParserConstants.RADIOBUTTONELEMENT);
		if (t != null) {
			return getLabeler().WEBTYPES.RADIOBUTTON;
		}

		t = this.optional(ParserConstants.CHECKBOXELEMENT);
		if (t != null) {
			return getLabeler().WEBTYPES.CHECKBOX;
		}

		t = this.optional(ParserConstants.TEXTBOX);
		if (t != null) {
			return getLabeler().WEBTYPES.TEXTBOX;
		}

		t = this.optional(ParserConstants.LISTELEMENT);
		if (t != null) {
			return getLabeler().WEBTYPES.LISTBOX;
		}
		
		t = this.optional(ParserConstants.ELEMENT);
		if (t != null) {
//			return 'element';
			return t.str;
		}


		// Otherwise, couldn't find an element
		return null;
	},
	
	targetTypeForElement : function (element){
		switch(element){
			case ParserConstants.BUTTONELEMENT:
				return getLabeler().WEBTYPES.BUTTON;
			case ParserConstants.LINKELEMENT:
				return getLabeler().WEBTYPES.LINK;
			case ParserConstants.MENU:
				return "menu";			
			case ParserConstants.ITEM:
				return getLabeler().WEBTYPES.ITEM;			
			case ParserConstants.SECTION:
				return "section";			
			case ParserConstants.TAB:
				return "tab";			
			case ParserConstants.AREAELEMENT:
				return getLabeler().WEBTYPES.AREA;			
			case ParserConstants.CLOSEBUTTONELEMENT:
				return getLabeler().WEBTYPES.CLOSEBUTTON;			
			case ParserConstants.RADIOBUTTONELEMENT:
				return getLabeler().WEBTYPES.RADIOBUTTON;			
			case ParserConstants.CHECKBOXELEMENT:
				return getLabeler().WEBTYPES.CHECKBOX;
			case ParserConstants.TEXTEDITOR:
				return getLabeler().WEBTYPES.TEXTEDITOR;	
			case ParserConstants.TEXTBOX:
				return getLabeler().WEBTYPES.TEXTBOX;	
			case ParserConstants.TEXT:
				return getLabeler().WEBTYPES.TEXT;	
			case ParserConstants.REGIONELEMENT:
				return getLabeler().WEBTYPES.REGION;						
			case ParserConstants.LISTELEMENT:
				return getLabeler().WEBTYPES.LISTBOX;
			case ParserConstants.MENUITEM:
				return getLabeler().WEBTYPES.MENUITEM;
		}
		return null;
	}
	
}


// get access to the coscripter-labeler component for 
// findTargetElement and getLabel
function getLabeler(){
	//debug('coscripter-strict-parsers.js: getLabeler()');
	return registry.labeler();
}

function getCommandComponent(){
	//debug('coscripter-strict-parsers.js: getCommandComponent()');
	return registry.commands();
}

function getUtils() {
	//debug('coscripter-strict-parsers.js: getUtils()');
	return registry.utils();
}


var parser = new CoScripterStrictParser();
//debug('Done Parsing coscripter-strict-parsers.js component\n');
