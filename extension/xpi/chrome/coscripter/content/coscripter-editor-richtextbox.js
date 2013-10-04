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




//////////////////////////////////
// SECTIONS:
//
//	editor.RichTextBox
//	markCurrentLine
//	insertLine
//	getCurrentLine
//////////////////////////////////


var editor = new Object();

editor.RETURN = 13;
editor.BACKSPACE = 8;
editor.SPACE = 32;
editor.UP = 38;
editor.DOWN = 40;
editor.LEFT = 37;
editor.RIGHT = 39;
editor.DEL = 46;
editor.HOME = 36;
editor.END = 35;
editor.ESCAPE = 27;
editor.TAB = 9;
editor.STAR = 42;
editor.HYPEN = 45;
editor.UNDERSCORE = 95;
editor.NULL = 0;
editor.a = 97;
editor.z = 122;
editor.A = 65;
editor.Z = 90;
editor.N0 = 48;
editor.N9 = 57;
editor.COPY = 67; // CTRL-C
editor.PASTE = 86; // CTRL-V
editor.CUT = 88; // CTRL-X
editor.SELECTALL = 65; // CTRL-A
editor.REDO = 89; // CTRL-Y
editor.UNDO = 90; // CTRL-Z

editor.LEFT_RIGHT = 1;
editor.RIGHT_LEFT = -1;

editor.WAIT_TIME = 500;
editor.MAX_OPTIONS = 100;

var count = 0;

editor.TEXT_CHANGE_EVENT = 1;
editor.LINE_MOVEMENT_EVENT = 2;
editor.LINE_CHANGE_EVENT = 3;


const clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                                    getService(Components.interfaces.nsIClipboardHelper);  
                                    
const clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].
                  getService(Components.interfaces.nsIClipboard);

editor.History=function(size) {
   this.size = size;
   this.data = new Array();
   this.first = -1;
   this.last = -1;
   this.pointer = -1;
}

editor.History.prototype.add=function(key) {
   
   if ( this.pointer != this.last ) 
      this.last = this.pointer;
      
   this.last++;
   if ( this.last == this.size )
      this.last = 0;
      
   this.data[this.last] = key;

   if ( this.first == -1 ) 
      this.first = 0;
   else if ( this.first == this.last ) {
      this.first++;
      if ( this.first == this.size ) 
         this.first = 0;
   }
      
   this.pointer = this.last;
}

editor.History.prototype.undo=function() {
   if ( this.pointer == -1 )
      return null;
   
   var d = this.data[this.pointer];
   
   if ( this.pointer == this.first )
      this.pointer = -1;
   else {
      this.pointer--;
      if ( this.pointer < 0 )
         this.pointer = this.size - 1;
   }
   return d;
}

editor.History.prototype.redo=function() {
   if ( this.pointer == this.last ) 
      return null;
      
   if ( this.pointer == -1 ) 
      this.pointer = this.first;
   else
      this.pointer++;
      
   if ( this.pointer == this.size )
      this.pointer = 0;
      
   var d = this.data[this.pointer];
   
   return d;
}

editor.History.prototype.length=function() {
   if ( this.last == -1 && 
        this.first == -1 ) 
      return 0;
      
   var l = this.last - this.first;
   if ( l < 0 ) 
      l += this.size;
   
   return l+1;
}

editor.History.prototype.dump=function() {
   var i = this.first;
   var l = this.length();
   var x = 0;
   var s = "";
   while ( x < l) {
       s += this.data[i];
       i++;
       x++;
       if ( i > this.size ) 
          i = 0;
   }
}

/////////////////////////
//	editor.RichTextBox
/////////////////////////
editor.RichTextBox=function(w, location, text, validate, url, optionsxmldoc, fetchonce, multiline, casesensitive, infixmatch, waittime) {

   this.w = w;
   this.location = location;
   this.url = url;
   this.optionsxmldoc = optionsxmldoc;
   this.validate = validate;
   this.validateOn = false;
   this.interactOn = false;
   this.keyBuffer = new Array();
   this.keyBufferOn = false;
   this.typeahead = false;
   this.singlelineedit = true;
   this.history = new editor.History(5);
   this.currentLine = false;
   this.startingLineText = "";	// keep track of starting text for currentLine, so we can send a 'change' event
   this.eventCameFromUser = false; // maintain a flag for whether events were initiated by a user

   if ( multiline )
      this.multiline = multiline;
   else
      this.multiline = false;
   
   if ( text )
      this.text = text;
   else
      this.text = "";


   if ( fetchonce ) 
      this.fetchonce = fetchonce;
   else
      this.fetchonce = false;

   if ( casesensitive )
 	  this.casesensitive = casesensitive;
   else
      this.casesensitive = false;
      
   if ( infixmatch ) 
      this.infixmatch = infixmatch;
   else
      this.infixmatch = true;
      
   if ( waittime ) 
      this.waittime = waittime;
   else
      this.waittime = editor.WAIT_TIME;
      
   
   this.setRegularExpression();
   
   this.areOptionsShowing = false;
   this.isSelectorShowing = false;
   this.autoShowOptions = true;
      
   this.optionNames = new Array();
   this.optionValues = new Array();
   this.filterOptionNames = new Array();
   this.filterOptionValues = new Array();
   this.matchingOptionName = new Array();
   this.matchingOptionValue = null;
   this.selectedOptionIndex = -1;

   this.handledKey = false;
   this.charSelectionInProgress = false;
   this.charSelectionAnchorBegin = null;
   this.charSelectionAnchorEnd = null;
   this.charSelectionAnchorLeft = null;
   this.charSelectionAnchorRight = null;
   this.charSelectionActive = false;
   this.charSelectionText = null;
   this.charSelectionClipboard = null;
   this.charSelectionDirection = editor.LEFT_RIGHT;
   
   this.lineSelection = null;
   this.lineSelectionText = null;
   this.lineSelectionClipboard = null;
   this.lineSelectionActive = false;
   
   this.blinkCursorWaitID = null;
   this.sample = false;
   
   this.listener = null;
   
   this.editing = false;
   this.numClick = 0;
   this.clickWaitID = null;
   this.waitBlurID = null;
   
   this.insertTextBox();
   this.appendOptionsBox();
   this.insertCursor();
   this.setEnabled(true);
   
   if ( this.optionsxmldoc ) 
      this.buildOptions(optionsxmldoc);
   else if ( this.fetchonce ) 
      this.fetchOptions("");

   this.setText(this.text);
   this.setMultiLine(this.multiline);
   
   this.NumClicksToEdit = 1;
}

editor.RichTextBox.prototype.setListener=function(listener) {
   this.listener = listener;
}

editor.RichTextBox.prototype.notifyListener=function(eventtype) {
   if ( !this.interactOn || !editor.RichTextBox.eventCameFromUser ) 
      return;
   
   var h = this;
   if ( this.listener ) {
      this.listener.call(h, eventtype);
   }
   
   //debug("editor notifyListener got event: " + eventtype);
}

editor.RichTextBox.prototype.setMultiLine=function(multiline) {
   this.multiline=multiline;
   if ( this.multiline ) 
      CoscripterDomUtils.addClass(this.outerbox, "multiline");
   else
      CoscripterDomUtils.removeClass(this.outerbox, "multiline");

   return;
   
   /*
   if ( this.multiline ) {
      this.location.style.height=100;
      this.outerbox.style.height=this.location.style.height;
      CoscripterDomUtils.removeClass(this.outerbox, "singleline");
      CoscripterDomUtils.addClass(this.outerbox, "multiline");
      this.togglerimage.src="images/togglesingle-off.gif";
      this.togglerimage.setAttribute("title", "Show single line");
      }
   else {
      this.location.style.height=16;
      this.outerbox.style.height=this.location.style.height;
      CoscripterDomUtils.removeClass(this.outerbox, "multiline");
      CoscripterDomUtils.addClass(this.outerbox, "singleline");
      this.togglerimage.src="images/togglemulti-off.gif";
      this.togglerimage.setAttribute("title", "Show multiple lines");
   }
   
   this.toggler.style.left = this.outerbox.style.width;
   this.toggler.style.top = -20;
   */
}

editor.RichTextBox.toggleMultiLine=function() {
   if ( !this.hasMultiLineText() ) 
      this.setMultiLine(!this.multiline);
}

editor.RichTextBox.onMultiLine=function() {
   if ( this.multiline ) {
      this.togglerimage.src="images/togglesingle.gif";
      }
   else {
      this.togglerimage.src="images/togglemulti.gif";
   }
 
}

editor.RichTextBox.offMultiLine=function() {
   if ( this.multiline ) {
      this.togglerimage.src="images/togglesingle-off.gif";
      }
   else {
      this.togglerimage.src="images/togglemulti-off.gif";
   }
 
}

editor.RichTextBox.prototype.setOptionsDoc=function(optionsxmldoc) {
   this.optionsxmldoc = optionsxmldoc;
   if ( this.optionsxmldoc ) {
      this.buildOptions(optionsxmldoc);   
      }
}


editor.RichTextBox.prototype.setRegularExpression=function() {
   this.regexpflags = this.casesensitive ? "" : "i";
   this.regexpmatch = this.infixmatch ? "" : "^";
}

editor.RichTextBox.prototype.appendOptionsBox=function() {
   
   var doc = this.location.ownerDocument;
   var body = doc.getElementsByTagName("body")[0];
   
   var optionsbox = doc.createElement("span");
   optionsbox.className="optionsbox invisible";
   body.appendChild(optionsbox);

   this.optionsbox = optionsbox;
}

editor.RichTextBox.prototype.showOptionsBox=function(e) {
   this.areOptionsShowing = true;
   CoscripterDomUtils.removeClass(this.optionsbox, "invisible");
   CoscripterDomUtils.addClass(this.optionsbox, "visible");
}

editor.RichTextBox.hideOptionsBox=function(e) {
   this.areOptionsShowing = false;
   CoscripterDomUtils.removeClass(this.optionsbox, "visible");
   CoscripterDomUtils.addClass(this.optionsbox, "invisible");
}

editor.RichTextBox.delayedHideOptionsBox=function(e) {
   var h = this;
   var f = function() {
       editor.RichTextBox.hideOptionsBox.call(h);
   }
   setTimeout(f, 500);
}

editor.RichTextBox.prototype.insertTextBox=function() {
   var h = this;
  
   var p = this.location.parentNode;
   
   var doc = this.location.ownerDocument;

   this.w.addEventListener("scroll", function(event) {
	  editor.RichTextBox.eventCameFromUser = true;
      var result = editor.RichTextBox.repositionInputBox.call(h, event);
	  editor.RichTextBox.eventCameFromUser = false;
	  return result;
   }, false);
   // Create cursor proxy
   this.cursorproxy = doc.createElement('div');
   this.cursorproxy.style.position = 'absolute';
   //this.cursorproxy.class = 'invisible';
   this.cursorproxy.setAttribute('class', 'invisible');
   this.cursorproxy.innerHTML="&#166;";
   this.location.appendChild(this.cursorproxy);

   this.cursorproxy.addEventListener("dblclick", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineDoubleClick.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);

	// CD 4/14/05 event handler for editing key presses 	   
	doc.addEventListener('keypress',function(event){ 
		editor.RichTextBox.eventCameFromUser = true;
   		var result = editor.RichTextBox.handleKeyPress.call(h, event)
		editor.RichTextBox.eventCameFromUser = false;
		return result
   	},true);

	doc.addEventListener('keydown',function(event){ 
		editor.RichTextBox.eventCameFromUser = true;
		var r = editor.RichTextBox.handleKeyDown.call(h, event);
		var pp = function() {
			editor.RichTextBox.postProcessKeyDown.call(h, event);
		}	
		//setTimeout(pp, 5);
		editor.RichTextBox.eventCameFromUser = false;
	   	return r;
   },true);
   
   
   
   
   // Create hidden input box
   this.inputboxspan = doc.createElement('span');
   this.inputboxspan.style.position = 'absolute';
   this.inputboxspan.style.visibility = 'hidden';

   this.inputbox = doc.createElement('input');
   // the line below exists to quash a bug in Firefox 1.5 (https://bugzilla.mozilla.org/show_bug.cgi?id=236791)
   this.inputbox.setAttribute('autocomplete', 'off');
   // TL: to help debug [#91575] Garbage steps sometimes inserted into script
   this.inputbox.setAttribute('id', 'CoScripter-richtextbox-editor');
   
   this.inputbox.type = 'text';
   this.inputbox.style.width = "0px";
   this.inputbox.style.backgroundColor = "red";

   // added for IE:
	if (typeof ActiveXObject != 'undefined')
	 	this.inputbox.style.visibility = 'visible';
	 	
 	

   this.inputboxspan.appendChild(this.inputbox);
   this.location.appendChild(this.inputboxspan);

   this.outerbox = doc.createElement("DIV");
   this.outerbox.className="outerbox";
   //this.outerbox.style.width=this.location.style.width;
   // again, for IE, a hack to get it to capture clicks correctly
	if (typeof ActiveXObject != 'undefined')
	 	this.outerbox.style.backgroundColor = 'white';
   //if ( this.multiline )
   //   this.outerbox.style.height=200;
   //else
   //   this.outerbox.style.height=this.location.style.height;

   this.location.appendChild(this.outerbox);
      
   // Create rich text box
   this.richtextbox = doc.createElement("DIV");

   this.richtextbox.className="richtextbox";
   //this.richtextbox.style.width=10000;
   //this.richtextbox.style.height=this.location.style.height;
   //this.richtextbox.style.fontFamily = 'arial';
   //this.richtextbox.style.fontSize = '11pt';
   
   this.outerbox.appendChild(this.richtextbox);
   // Create single/multi line toggler
   this.toggler = doc.createElement("DIV");
   this.toggler.className="toggler";
   this.togglerimage = doc.createElement("IMG");
   if ( this.singleline )
      this.togglerimage.src="images/togglemulti.gif";
   else
      this.togglerimage.src="images/togglesingle.gif";
   this.toggler.appendChild(this.togglerimage);
   this.location.appendChild(this.toggler);

	// we need two seperate functions here, because IE doesn't capture all keys on keyPress, 
	// and FF doesn't capture alphanumeric keys desireably on keyDown.
   // CD 4/14/05 The input box does not work in FF 3.0 (something that is invisible apparently
   // can't receive events). I added event handler to the doc inside the rich textbox and disabled 
   // old handlers below 
   //this.inputbox.onkeypress = function(event) {
	//          editor.RichTextBox.eventCameFromUser = true;
   //    	    var result = editor.RichTextBox.handleKeyPress.call(h, event);
	//          editor.RichTextBox.eventCameFromUser = false;
    //   	    return result;
   //    };
   //this.inputbox.onkeydown = function(event) {
	//          editor.RichTextBox.eventCameFromUser = true;
   //   	    var r = editor.RichTextBox.handleKeyDown.call(h, event);
   //    	    var pp = function() {
   //    	       editor.RichTextBox.postProcessKeyDown.call(h, event);
   //    	    }
   //    	    //setTimeout(pp, 5);
	//          editor.RichTextBox.eventCameFromUser = false;
   //    	    return r;
   //    };
              
   this.richtextbox.addEventListener("mouseout", function(event) {
	        editor.RichTextBox.eventCameFromUser = true;
            var result = editor.RichTextBox.handleMouseOut.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
            return result;
       }, false);
    
   this.inputbox.addEventListener("blur", function(event) {
	        editor.RichTextBox.eventCameFromUser = true;
            editor.RichTextBox.handleBlur.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);
       
   this.inputbox.addEventListener("focus", function(event) {
	        editor.RichTextBox.eventCameFromUser = true;
            editor.RichTextBox.handleFocus.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);

   // TL: attempt to prevent inputbox onchange events from propagating
   this.inputbox.addEventListener("change", function(event) {
	        editor.RichTextBox.eventCameFromUser = true;
			event.stopPropagation();
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);

   this.richtextbox.addEventListener("mousedown", function(event) {
	        editor.RichTextBox.eventCameFromUser = true;
            editor.RichTextBox.handleMouseDown.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);

   this.toggler.addEventListener("click", function (event) {
	        editor.RichTextBox.eventCameFromUser = true;
            editor.RichTextBox.toggleMultiLine.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);

   this.toggler.addEventListener("mouseover", function (event) {
	        editor.RichTextBox.eventCameFromUser = true;
            editor.RichTextBox.onMultiLine.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);

   this.toggler.addEventListener("mouseout", function (event) {
	        editor.RichTextBox.eventCameFromUser = true;
            editor.RichTextBox.offMultiLine.call(h, event);
	        editor.RichTextBox.eventCameFromUser = false;
       }, false);
}

editor.RichTextBox.postProcessKeyDown=function(e) {
   if  ( !this.enabled ) 
       return;
             
   var keyCode = e.keyCode;
      
   //debug.showMessage("debug", "paste: " + this.inputbox.value);
   
   if ( e.ctrlKey  && keyCode == editor.PASTE ) {
      this.charSelectionClipboard = this.inputbox.value;
      this.pasteSelection();
   }
   else {
      this.inputbox.value = "";
   }
}

editor.RichTextBox.prototype.undo=function() {
   var k = this.history.undo();
   if ( k ) {
      //alert("undo " + k.action + " " + k.data );
   }
}

editor.RichTextBox.prototype.redo=function() {
   var k = this.history.redo();
   if ( k ) {
      //alert("redo " + k.action + " " + k.data );
   }
}

editor.RichTextBox.prototype.recordKey=function(action, data) {
   var k = new Object();
   k.action = action;
   k.data = data;
   
   this.history.add(k);
   
   this.addKeyToBuffer(data);
}

editor.RichTextBox.prototype.clearKeyBuffer=function() {
   this.keyBuffer = new Array();
}

editor.RichTextBox.prototype.getKeyBuffer=function() {
   return this.keyBuffer;
}

editor.RichTextBox.prototype.addKeyToBuffer=function(keyCode) {
   if ( this.isKeyBufferOn() )
     this.keyBuffer[this.keyBuffer.length] = keyCode;
}

editor.RichTextBox.prototype.isKeyBufferOn=function() {
   return this.keyBufferOn;
}

editor.RichTextBox.prototype.setKeyBufferOn=function(keyBufferOn) {
   this.keyBufferOn = keyBufferOn;
}

// handles keyPress, so we deal with alphanumeric characters here.
// other keys will consistently invoke keyDown, so we handle them there.
editor.RichTextBox.handleKeyPress=function(e) {

	if  ( !this.enabled) 
		return false;

	if ( !this.editing )
		return false;
      
	var charCode = e.charCode;

	if (charCode != 0) {
		var handled = this.handleCharCode(charCode);
		if (handled) {
			 // TL: attempt to prevent this keypress from doing anything else such
			 // as scrolling the window
			 e.preventDefault();
			 e.stopPropagation();
		}
		return handled;
	} else {
		return false;
	}
}

editor.RichTextBox.prototype.handleCharCode=function(charCode)  {


   this.delayedBlinkCursor();
 
   this.removeLineInfo();
   
   if ( this.handledKey ) {
       this.addLineInfo();
       return true;
   }
       
   // Remove option cursor 
   this.removeSelectorCursors();
    	  
   if (charCode == editor.NULL) {
      this.addLineInfo();
      return false;
   } else if (charCode == editor.SPACE) {
      //if ( this.areOptionsShowing ) {
      //    this.acceptOptionSelection();
      //}
      if ( this.charSelectionActive ) 
         this.cutSelection(true);
      else if ( this.lineSelectionActive ) 
         this.clearLineSelection();
         
      this.insertSpecialChar("&nbsp;", "space");
      this.isSelectorShowing = false;
      editor.RichTextBox.hideOptionsBox.call(this);
      this.recordKey("insert", charCode);
   } else {
         if ( this.charSelectionActive ) 
             this.cutSelection(true);
         else if ( this.lineSelectionActive ) 
             this.clearLineSelection();
         if ( charCode == editor.STAR && this.isCursorAtLineBegin() ) {
             this.increaseCurrentLineIndent();
         } else {
            if ( this.isQuote(charCode) ) {
                this.insertSpecialChar(String.fromCharCode(charCode), "quote");
            }
            else if ( this.isPunctuation(charCode) ) {
                this.insertSpecialChar(String.fromCharCode(charCode), "punctuation");
            }
            else
                this.insertChar(String.fromCharCode(charCode));
            this.recordKey("insert", charCode);
         }
      }
   
   this.processCurrentWord();

      
   if ( this.isSelectorShowing && this.autoShowOptions) {
      this.renderOptionsBox();
   }
         
   this.addLineInfo();
   this.adjustView();
   this.notifyListener(editor.TEXT_CHANGE_EVENT);
    
   //debug.clear("debug");
   //debug.showXMLDocument("debug", this.richtextbox);

   return true;
}

editor.RichTextBox.prototype.isPunctuation=function(charCode) {
   return (charCode > 32 && charCode < 65) || (charCode > 90 && charCode <97) || (charCode > 122 && charCode < 127);
}

editor.RichTextBox.prototype.isQuote=function(charCode) {
   return (charCode == 34 || charCode == 39);
}

editor.RichTextBox.prototype.isFunction=function(charCode) {
   return (charCode >= 112 && charCode <= 123);
}

editor.RichTextBox.prototype.setValidate=function(validateOn) {
   this.validateOn = validateOn;
}

editor.RichTextBox.prototype.setInteract=function(interactOn) {
   this.interactOn = interactOn;
}

// this should trigger on all browsers for all key presses.
// unfortunately, it's not suited for alphanumeric characters, so.
editor.RichTextBox.handleKeyDown=function(e) {
   if  ( !this.enabled ) 
       return false;
       
   if ( !this.editing ) 
      return false;
  
   var keyCode = e.keyCode;
   return this.handleKeyCode(keyCode, e); 
}

editor.RichTextBox.prototype.handleKeyCode=function(keyCode, e) {
      
   this.removeLineInfo();

   this.delayedBlinkCursor();
  
  
   this.handledKey = true;
   
	// Remove option cursor 
   if ( ( keyCode == editor.UP || keyCode == editor.DOWN ) && this.areOptionsShowing ) {
   } 
   else 
      this.removeSelectorCursors();
   
   //debug("Editor handleKeyCode: " + e.ctrlKey + " " + e.altKey + " " + keyCode);
   // Copy and paste
   if ( e.altKey ) {
   }
   else if ( e.ctrlKey ) {
      switch ( keyCode ) {
         case editor.COPY:
            this.copySelection();
            e.preventDefault();
            e.stopPropagation();
            this.notifyListener(editor.TEXT_CHANGE_EVENT);
            break;
         case editor.PASTE:
            if ( this.charSelectionActive || this.lineSelectionActive )
            	 this.cutSelection(true);
         	this.pasteSelection();
         	e.preventDefault();
         	e.stopPropagation();
         	this.notifyListener(editor.TEXT_CHANGE_EVENT);
            break;
         case editor.CUT:
         	this.cutSelection();
         	e.preventDefault();
         	e.stopPropagation();
         	this.notifyListener(editor.TEXT_CHANGE_EVENT);
         	break;
         case editor.SELECTALL:
	        this.selectLineAll();
    	    e.preventDefault();
        	e.stopPropagation();
        	break;
         case editor.REDO:
         	this.redo();
         	e.preventDefault();
         	e.stopPropagation();
	        break;
	     case editor.UNDO:
            this.undo();
            e.preventDefault();
            e.stopPropagation();
            break;
         case editor.LEFT:
            this.moveCursorLeftWord(false);
            this.recordKey("move", keyCode);
            this.addLineInfo();
            this.notifyListener(editor.LINE_MOVEMENT_EVENT);
            this.adjustView();
            return true;
            break;
         case editor.RIGHT:
            this.moveCursorRightWord(false);
            this.recordKey("move", keyCode);
            this.addLineInfo();
            this.notifyListener(editor.LINE_MOVEMENT_EVENT);
            this.adjustView();
            return true;
            break;
         default:
      }

   } 
   else if ( e.shiftKey && keyCode == editor.LEFT ) {
         this.moveCursorSelectionLeft();
         this.notifyListener(editor.LINE_MOVEMENT_EVENT);
         return true;
   }
   else if ( e.shiftKey && keyCode == editor.RIGHT ) {
         this.moveCursorSelectionRight();
         this.notifyListener(editor.LINE_MOVEMENT_EVENT);
         return true;
   }
   else if ( this.isFunction(keyCode) ) {
   }
   else {
      
      switch ( keyCode ) {
         case editor.LEFT: 
                 this.moveCursorLeft(false);
                 this.recordKey("move", keyCode);
                 this.addLineInfo();
                 this.notifyListener(editor.LINE_MOVEMENT_EVENT);
                 this.adjustView();
                 return true;
                 break;
         case editor.RIGHT: 
                 this.moveCursorRight(false);
                 this.recordKey("move", keyCode);
                 this.addLineInfo();
                 this.notifyListener(editor.LINE_MOVEMENT_EVENT);
                 this.adjustView();
                 return true;
                 break;
         case editor.UP: 
                 if ( this.areOptionsShowing ) {
                    this.moveSelectedOption(-1);
                 }
                 else if ( this.multiline ) {
                    this.moveCursorUp(false);
                 }
                 this.recordKey("move", keyCode);
                 
                 this.addLineInfo();
                 this.adjustView();
                 
                 return true;
                 break;
         case editor.DOWN: 
                 if ( this.areOptionsShowing ) {
                    this.moveSelectedOption(1);
                 }
                 else if ( this.isSelectorShowing ) {
                    this.renderOptionsBox();
                 }
                 else if ( this.multiline ) {
                    this.moveCursorDown(false);
                 }
                 this.recordKey("move", keyCode);
                 
                 
                 this.adjustView();
                 this.addLineInfo();
                 
                 return true;
                 break;
         case editor.TAB:
                 e.preventDefault();
                 e.stopPropagation();
                 
                 if ( this.isCursorAtLineBegin() ) {
                    this.increaseCurrentLineIndent();
                    this.notifyListener(editor.TEXT_CHANGE_EVENT);
				 }
                 
                 break;
         case editor.DEL: 
                 if ( this.charSelectionActive || this.lineSelectionActive )
                     this.cutSelection(true);
                 else
                     this.deleteCharAfter();
                 this.recordKey("delete", keyCode);
                 this.notifyListener(editor.TEXT_CHANGE_EVENT);
                 break;
         case editor.HOME:
                 if ( e.shiftKey ) {
                    this.selectLineToHome();
                 }
                 else {
                    this.moveCursorLineHome(false);
                    this.recordKey("move", keyCode);
                 }
                 this.notifyListener(editor.LINE_MOVEMENT_EVENT);
                 break;
         case editor.END:
                 if ( e.shiftKey ) {
                    this.selectLineToEnd();
                 }
                 else {
                    this.moveCursorLineEnd(false);
                    this.recordKey("move", keyCode);
                 }
                 this.notifyListener(editor.LINE_MOVEMENT_EVENT);
                 break;
         case editor.ESCAPE:
                 this.unmatchCurrentWord();
              
                 this.recordKey("escape", keyCode);
                 break;
         case editor.BACKSPACE:
                 e.preventDefault();
                 e.stopPropagation();
     	         if ( this.charSelectionActive || this.lineSelectionActive)
                     this.cutSelection(true);
                 else { 
                     if ( this.isCursorAtLineBegin() && this.hasCurrentLineIndent() )
                        this.decreaseCurrentLineIndent();
                     else
                        this.deleteCharBefore();
                 }
                 
		         this.recordKey("delete", keyCode);
		         
		         this.notifyListener(editor.TEXT_CHANGE_EVENT);
		         break;
         case editor.RETURN:
		         if ( this.areOptionsShowing ) {
        	     	 this.acceptOptionSelection();
			        }
		        else  {
		           if ( this.multiline  ) {
					  var currentIndent = this.getCurrentLineIndent();
           		      this.insertLine();
           		      this.notifyListener(editor.TEXT_CHANGE_EVENT);
           		      this.notifyListener(editor.LINE_CHANGE_EVENT);
           		      // Auto indent
           		      // this.increaseCurrentLineIndent();
					  // TL: if the last line was a comment, then the next
					  // line should probably be a script step.
					  if (currentIndent == "0" || currentIndent == null)
						currentIndent = "1";
					  this.setCurrentLineIndent(currentIndent);
					}
		        }
    		    this.recordKey("insert", keyCode);
			    break;
         default: 
	             this.handledKey = false;
	             this.addLineInfo();
                 return false;
      }
   }
   
   this.processCurrentWord();

   if ( this.isSelectorShowing && this.autoShowOptions) {
      this.renderOptionsBox();
   }
   
   
   this.addLineInfo();
   this.adjustView();
   
   return true;
}	// end of handleKeyCode



editor.RichTextBox.prototype.showError=function(error) {
   if ( !CoscripterDomUtils.isClass(this.outerbox, "error") )
      CoscripterDomUtils.addClass(this.outerbox, "error");
}

editor.RichTextBox.prototype.clearError=function() {
   CoscripterDomUtils.removeClass(this.outerbox, "error");
}

editor.RichTextBox.prototype.setLineError=function(line, msg) {
   var lineinfo = line.firstChild;
   if ( CoscripterDomUtils.isClass(lineinfo, "lineinfo") ) {
      lineinfo.setAttribute("title", msg);
      CoscripterDomUtils.addClass(lineinfo, "error");
   }
}

editor.RichTextBox.prototype.clearLineError=function(line) {
   var lineinfo = line.firstChild;
   if ( CoscripterDomUtils.isClass(lineinfo, "lineinfo") ) {
      lineinfo.setAttribute("title", "");
      CoscripterDomUtils.removeClass(lineinfo, "error");
   }
}

editor.RichTextBox.handleMouseOut=function(e) {
}

editor.RichTextBox.repositionInputBox=function(e) {
//   alert("Eser");
   var doc = this.location.ownerDocument;

   this.inputboxspan.style.left= doc.body.scrollLeft+5;
   this.inputboxspan.style.top = doc.body.scrollTop+5;
}

editor.RichTextBox.handleBlur=function(e) {

   editor.focusedBox = null;
   
   var h = this;
   var f = function() {
      editor.RichTextBox.delayedHandleBlur.call(h);
   }

   this.waitBlurID = setTimeout(f, 500);
}

editor.RichTextBox.delayedHandleBlur=function() {
   if ( this.waitBlurID == null )
      return;
   
   this.waitBlurID = null;
      
   this.numClick = 0;
   this.clickWaitID = null;
   
   this.removeSelectorCursors();
   if ( this.selectorClick ) {
       this.selectorClick = false;
       return;
   }
   
   //CoscripterDomUtils.removeClass(this.outerbox, "editing");
   //this.editing = false;
   
   editor.RichTextBox.hideOptionsBox.call(this);
   
   if ( this.optionClick ) {
       this.optionClick = false;
       return;
   } 
   
   this.hideCursor();
}

editor.RichTextBox.handleFocus=function(e) {

   
   if ( !this.enabled )
      return;
   
   //e.preventBubble();
   e.preventDefault();
   //e.preventCapture();
   e.stopPropagation();
                 
   if ( this.waitBlurID ) 
      clearTimeout(this.waitBlurID);
      
   this.waitBlurID = null;
   
}

editor.RichTextBox.handleMouseDown=function(e) {
   
   if ( !this.enabled ) 
       return;
       
   if ( this.editing )
       return;
       
   var target = e.target;
   if ( CoscripterDomUtils.isClass(target, "lineinfo") ) 
       return;
   
   this.numClick++;
   
   if ( this.numClick >= this.NumClicksToEdit ) {
      if ( this.clickWaitID ) {
         clearTimeout(this.clickWaitID);
         this.clickWaitID = null;
         this.numClick = 0;
      }  
      this.edit();
      }
   else {
      var h = this;
      var f=function() {
         editor.RichTextBox.clearClicks.call(h);
      }
   
      this.clickWaitID = setTimeout(f, 200);
   }   
}

editor.RichTextBox.clearClicks=function() {
   if ( this.clickWaitID == null )
      return;
      
   this.clickWaitID = null;
   this.numClick = 0;
   
}



editor.RichTextBox.prototype.edit=function(e) {
         
   if ( this.sample ) { 
      this.clearAllText();
      this.sample = false;

      CoscripterDomUtils.removeClass(this.richtextbox, "sample");
   }
   
   editor.focusedBox = this;
   this.editing = true;
   CoscripterDomUtils.addClass(this.outerbox, "editing");
      
   if ( !this.hasTextCursor() )
      this.moveCursorTextEnd();
   
   var d = this;
   var f = function() {
      d.inputbox.focus();
   }
   setTimeout(f, 100);
   
   
}


editor.RichTextBox.prototype.cancelEdit=function(e) {
   
   this.inputbox.blur();
         
   editor.focusedBox = null;
   this.editing = false;
   CoscripterDomUtils.removeClass(this.outerbox, "editing");

   this.hideCursor();
}

editor.RichTextBox.prototype.getText=function() {
   var text = "";
   var lines = this.richtextbox.childNodes;
   for ( var i = 0; i < lines.length; i++ ) {
      var line = lines[i];
      if ( i > 0 ) {
         text += "\n";
      }
      text += this.getLineText(line);
   }
   return text;
}

// NEW (AC) Apr2011
editor.RichTextBox.prototype.setLineText=function(lineNumber, text) {
	var currentLine = this.getCurrentLine()
	var line = this.getLineWithNumber(lineNumber)
	this.moveCursorToLine(line);
	this.removeLineInfo();
	this.inserText(text)
	this.addLineInfo();
	this.moveCursorToLine(currentLine);
	
}

editor.RichTextBox.prototype.getLineText=function(line) {
   var text = "";
   
   for ( var l = 0; l < line.childNodes.length; l++ ) {
      var child = line.childNodes[l];
      if ( CoscripterDomUtils.isClass(child, "word") )
          text += this.extractWord(child);
      else if ( CoscripterDomUtils.isClass(child, "space") )
          text += " ";
      else if ( CoscripterDomUtils.isClass(child, "punctuation") ) 
          text += this.extractChar(child);	
      else if ( CoscripterDomUtils.isClass(child, "quote") ) 
          text += this.extractChar(child);		  
   }
   return text;
}

editor.RichTextBox.prototype.setEnabled=function(enabled) {
   this.enabled = enabled;
   if ( enabled ) {
      CoscripterDomUtils.removeClass(this.richtextbox, "disable");
      CoscripterDomUtils.addClass(this.richtextbox, "enable");
      CoscripterDomUtils.removeClass(this.outerbox, "disable");
      CoscripterDomUtils.addClass(this.outerbox, "enable");
  }
   else {
      CoscripterDomUtils.removeClass(this.richtextbox, "enable");
      CoscripterDomUtils.addClass(this.richtextbox, "disable");
      CoscripterDomUtils.removeClass(this.outerbox, "enable");
      CoscripterDomUtils.addClass(this.outerbox, "disable");
   }
}

editor.RichTextBox.prototype.isEnabled=function() {
   return this.enabled;
}

editor.RichTextBox.prototype.getTextDocument=function() {
   var doc = this.location.ownerDocument;
   return this.richtextbox;
}

editor.RichTextBox.prototype.clearAllText=function() {
   this.removeLineInfo();
   
   var i = 0; 
   var children = this.richtextbox.childNodes;
   while  ( children.length > 0 ) {
      var child = children[0];
      this.richtextbox.removeChild(child);
   }
   
   this.insertCursor();
   this.addLineInfo();
}

editor.RichTextBox.prototype.setText=function(text, type) {
   if ( this.sample ) {
       this.sample = false;
      
      CoscripterDomUtils.removeClass(this.richtextbox, "sample");
   }
   
   this.clearAllText();
   this.insertText(text, type);
}

editor.RichTextBox.prototype.setSample=function(text) {
   this.setText(text);
   this.removeCurrentLineWidget();
   this.sample=true;

   CoscripterDomUtils.addClass(this.richtextbox, "sample");
}

editor.RichTextBox.prototype.insertSubLine=function(type) {
   this.insertLine("subline");
}

editor.RichTextBox.prototype.addCurrentLineType=function(type) {
   var currentLine = this.getCurrentLine();
   this.addLineType(currentLine, type);
}

editor.RichTextBox.prototype.addLineType=function(line, type) {
    CoscripterDomUtils.addClass(line, type);
}

////////////////
//	insertLine
////////////////
editor.RichTextBox.prototype.insertLine=function(type, generatedActionP) {
	//generatedActionP is true when the insert is due to Recording a new command or Loading a procedure.
   this.removeLineInfo();
   
   // "newLine" event
   if (!generatedActionP){
		var currentLineNumber = this.getCurrentLineNumber()
		var currentScriptLength = this.getCurrentScriptLength()
	}

	// Create a new line element
   var doc = this.location.ownerDocument;
   var de = doc.createElement("DIV")
   de.className="line";
   if ( type )
      de.className += " " + type;
      
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;
   
   if ( parent == null ) {
      // This should not be the case
   }
   else if ( CoscripterDomUtils.isClass(parent, "line") ) {
      var next = this.cursor.nextSibling;
      
      var isCursorFirst = this.isCursorAtLineBegin();
      
      // First insert the cursor to the new line
      parent.removeChild(this.cursor);
      de.appendChild(this.cursor);
      
      // Next insert all next siblings into the new line
      if ( !this.singlelineedit || isCursorFirst ) {
         while ( next ) {
            var m = next;
            next = next.nextSibling;
            parent.removeChild(m);
            de.appendChild(m);
         }
      }
      
      // Insert the new line
      var parentnext = parent.nextSibling;
      if ( CoscripterDomUtils.isClass(parent, "closed") ) {
         // Ignore alternatives
         while ( parentnext ) {
            if ( CoscripterDomUtils.isClass(parentnext, "subline") ) {
                parentnext = parentnext.nextSibling;
            }
            else
                break;
         }
      }
      else if ( CoscripterDomUtils.isClass(parent, "open") && !CoscripterDomUtils.isClass(parent, "subline")) {
         CoscripterDomUtils.removeClass(parent, "open");
         CoscripterDomUtils.addClass(de, "open");
      }
      if ( parentnext ) {
         grandparent.insertBefore(de, parentnext);
         if ( CoscripterDomUtils.isClass(parentnext, "subline") ) {
             CoscripterDomUtils.addClass(de, "open");
         }
      }
      else {
         grandparent.appendChild(de);
      }
   }
   else if ( CoscripterDomUtils.isClass(parent, "word") ) {
      // Create a new word element
      var wse = doc.createElement("SPAN");
      wse.className="word";
       
      var next = this.cursor.nextSibling;
      
      // First insert the cursor to the new line
      parent.removeChild(this.cursor);
      de.appendChild(this.cursor);
      
      // Next insert all next siblings into the new word
      if ( !this.singlelineedit ) {
         while ( next ) {
            var m = next;
            next = next.nextSibling;
            parent.removeChild(m);
            wse.appendChild(m);
         }
      
         // Add the new word to the new line
         de.appendChild(wse);
      }
      
      // Insert the new line
      var grandparentnext = grandparent.nextSibling;
      
      if ( CoscripterDomUtils.isClass(parent, "closed") ) {
         // Ignore alternatives
         while ( grandparentnext ) {
            if ( CoscripterDomUtils.isClass(grandparentnext, "subline") ) {
                grandparentnext = grandparentnext.nextSibling;
            }
            else
                break;
         }
      }
      else if ( CoscripterDomUtils.isClass(parent, "open") && !CoscripterDomUtils.isClass(parent, "subline")) {
         CoscripterDomUtils.removeClass(parent, "open");
         CoscripterDomUtils.addClass(de, "open");
      }
      
      var greatgrandparent = grandparent.parentNode;
      
      if ( grandparentnext) {
         if ( CoscripterDomUtils.isClass(grandparentnext, "subline") ) {
             CoscripterDomUtils.addClass(de, "open");
         }
         greatgrandparent.insertBefore(de, grandparentnext);
      }
      else {
         greatgrandparent.appendChild(de);
      }
      
      if ( !this.singlelineedit) {
         // Add the remaining siblings from the line
         var parentnext = parent.nextSibling;
   
         while ( parentnext ) {
            var m = parentnext;
            parentnext = parentnext.nextSibling;
            grandparent.removeChild(m);
            de.appendChild(m);
         }
      }
   }
   
   this.clearWordMatches();
   this.rematchWords();
   
   var h = this;
   de.addEventListener("click", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineClick.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
   de.addEventListener("dblclick", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineDoubleClick.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
   de.addEventListener("mousedown", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineMouseDown.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
   de.addEventListener("mouseup", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineMouseUp.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
   de.addEventListener("mousemove", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineMouseMove.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
   de.addEventListener("mouseout", function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleLineMouseOut.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
   
   this.addLineInfo();
}

editor.RichTextBox.handleLineClick=function(e) {
   this.clearCharSelection();
   this.clearLineSelection();
   
   var from = this.getCurrentLine();
      
   this.unmarkCurrentLines();
   this.moveCursor(e);
   this.inputbox.focus();
   
   this.addLineInfo();
   this.adjustView();
   
   var line = this.getCurrentLine();

   var c = e.clientX;
   var i = line.getAttribute("indent");
   
   if ( i ) 
       i = parseInt(i);
   else
       i = 0;
       
   if ( c < i * 20 + 30 ) {
      if ( this.editing ) {  
         if ( e.shiftKey )      
            this.selectToCurrentLine(from);
         else
            this.selectCurrentLine();
      }
      this.hideCursor();
   }
   else {
      this.showCursor();
      this.blinkCursor();
   }
   
// TL 11/4/08: this used to only send a LINE_CHANGE_EVENT if you clicked on
// a line different than the current line, and not when you clicked twice
// within the same line.  However, because the code above removes the
// colored box around the current line and redraws it, this was overriding
// the different color that we set in coscripter-command-processor for
// certain situations (like YOU commands).  So now we send the
// LINE_CHANGE_EVENT for every click on a line, even if the current line
// has not changed.  This will result in a bit of extra work (to preview
// the current line again, for example) but it also means the colors get
// drawn correctly.
//
// In the future we probably need to rewrite the editor such that colors
// can be specified up front or via a reasonable API, rather than changing
// them post hoc (and having to send events like this when we really
// shouldn't).
//   if ( from != line ) 
   this.notifyListener(editor.LINE_CHANGE_EVENT);   
}

editor.RichTextBox.handleLineDoubleClick=function(e) {
   
   this.clearCharSelection();
   this.clearLineSelection();

   this.selectWord(this.cursor);
   this.inputbox.focus();
}

editor.RichTextBox.handleLineMouseDown=function(e) {
   if ( !this.editing )
      return false;
      
   this.beginCharSelection(e);
   return false;
}

editor.RichTextBox.handleLineMouseUp=function(e) {
   if ( !this.editing )
      return;
      
   this.endCharSelection(e);
}

editor.RichTextBox.handleLineMouseOut=function(e) {
   if ( !this.editing )
      return;
     
   if ( !this.charSelectionInProgress )
       return;
       
   if ( e.relatedTarget != null && e.relatedTarget.tagName == "HTML" )
      this.endCharSelection();
}

editor.RichTextBox.handleLineMouseMove=function(e) {
   if ( !this.editing )
      return;
      
   
   this.moveCharSelection(e);
}


editor.RichTextBox.prototype.insertText=function(text, type) {
   this.removeLineInfo();

	for ( var i = 0; i < text.length; i++ ) {
      var c = text.charAt(i);
      var charCode = c.charCodeAt(0);

      if ( charCode == editor.SPACE )
         this.insertSpecialChar("&nbsp;", "space");
      else if ( text.charAt(i) == '\n' ) {
         this.insertLine();
         this.removeLineInfo();
         }
      else  {
         if ( charCode == editor.STAR && this.isCursorAtLineBegin() ) {
             this.increaseCurrentLineIndent();
         } else {
            if ( this.isQuote(charCode) ) {
                this.insertSpecialChar(String.fromCharCode(charCode), "quote");
            }
            else if ( this.isPunctuation(charCode) ) {
                this.insertSpecialChar(String.fromCharCode(charCode), "punctuation");
            }
            else
                this.insertChar(String.fromCharCode(charCode));
         }
      }
   }

   this.clearWordMatches();
   this.rematchWords();
   
   this.addLineInfo();
}

editor.RichTextBox.prototype.insertHTML=function(text) {
   this.removeLineInfo();
   
   var line = this.getCurrentLine();
   var l = "";
   var wordStarted = false;
   for ( var i = 0; i < text.length; i++ ) {
      var c = text.charAt(i);
      var charCode = c.charCodeAt(0);

      if ( charCode == editor.SPACE ) {
         if ( wordStarted ) {
            l += "</SPAN>";
            wordStarted = false;
         }
         l += "<SPAN class='char space delimiter'>" + "&nbsp;" + "<WBR>" + "</SPAN>";
      }
      else if ( this.isQuote(charCode) ) {
         if ( wordStarted ) {
            l += "</SPAN>";
            wordStarted = false;
         }
         l += "<SPAN class='char quote delimiter'>" + String.fromCharCode(charCode) + "</SPAN>";
      }
      else if ( this.isPunctuation(charCode) ) {
         if ( wordStarted ) {
            l += "</SPAN>";
            wordStarted = false;
         }
         l += "<SPAN class='char punctuation delimiter'>" + String.fromCharCode(charCode) + "<WBR>" + "</SPAN>";
      }
      else {
         if ( !wordStarted ) {
            l += "<SPAN class='word'>";
            wordStarted = true;
         }
         l += "<SPAN class='char'>" + String.fromCharCode(charCode) + "</SPAN>";
      }
   }
   if ( wordStarted ) {
       l += "</SPAN>";
   }
   
   line.innerHTML = l;
   line.appendChild(this.cursor);
   
   this.addLineInfo();
}

editor.RichTextBox.prototype.appendLine=function(type) {
   this.moveCursorTextEnd();
   this.insertLine(type);
}

editor.RichTextBox.prototype.appendText=function(text) {
   this.moveCursorTextEnd();
   this.insertText(text);
}

editor.RichTextBox.prototype.insertChar=function(character, type) {

   var doc = this.location.ownerDocument;
   var se = doc.createElement("SPAN")
   se.className="char";
  
      
   if ( type ) 
      se.className += " " + type;
   var t = doc.createTextNode(character);
   se.appendChild(t);

   var prev = this.cursor.previousSibling;
   var next = this.cursor.nextSibling;
   var parent = this.cursor.parentNode;
   
   if ( prev && CoscripterDomUtils.isClass(prev, "word") ) {
      prev.appendChild(se);
   }
   else if ( next && CoscripterDomUtils.isClass(next, "word") ) {
      var fc = next.firstChild;
      next.insertBefore(se, fc);
      parent.removeChild(this.cursor);
      next.insertBefore(this.cursor, fc);
   }
   else if ( prev ) {
      if ( CoscripterDomUtils.isClass(prev, "char") ) {
         if ( CoscripterDomUtils.isClass(prev, "delimiter") ) {
            var wse = doc.createElement("SPAN");
            wse.className="word";
            wse.appendChild(se);
            parent.insertBefore(wse, this.cursor);
        }
        else {
            var p = prev.parentNode;
            p.insertBefore(se, this.cursor);
        }
     }
   }
   else if ( next ) {
      if ( CoscripterDomUtils.isClass(next, "char") ) {
         if ( CoscripterDomUtils.isClass(next, "delimiter") ) {
            var wse = doc.createElement("SPAN");
            wse.className="word";
            wse.appendChild(se);
            parent.insertBefore(wse, next);
            parent.insertBefore(this.cursor, next);
         }
      }
   }
   else {
      var wse = doc.createElement("SPAN");
      wse.className="word";
      wse.appendChild(se);
      parent.insertBefore(wse, this.cursor);
   }

   var h = this;
   /*
   se.onclick=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharClick.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.ondblclick=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharDoubleClick.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.onmousedown=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharMouseDown.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.onmouseup=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharMouseUp.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.onmousemove=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharMouseMove.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   */
      
}

editor.RichTextBox.handleCharClick=function(e) {
   return;
   
   if ( !this.editing ) {
      if ( this.sample ) 
         return;
      this.selectLine(e);
   }
   else {       
      this.removeLineInfo();
      this.moveCursor(e);
      this.notifyListener(editor.LINE_CHANGE_EVENT);
      this.addLineInfo();
   }
}

editor.RichTextBox.handleCharDoubleClick=function(e) {
   this.clearCharSelection();
   this.clearLineSelection();

   this.selectWord(this.cursor);
}

editor.RichTextBox.handleCharMouseDown=function(e) {
   return false;

   if ( !this.editing )
      return false;
      
   this.beginCharSelection(e);
   return false;
}

editor.RichTextBox.handleCharMouseUp=function(e) {
   return;

   if ( !this.editing )
      return;
      
   this.endCharSelection(e);
}

editor.RichTextBox.handleCharMouseMove=function(e) {
   return;

   if ( !this.editing )
      return;
      
   this.moveCharSelection(e);
}

editor.RichTextBox.prototype.insertSpecialChar=function(character, type) {

   var doc = this.location.ownerDocument;
   var se = doc.createElement("SPAN")
   se.className="char delimiter";
   
      
   if ( type ) 
      se.className += " " + type;
   
   if ( type == "quote" )
      se.innerHTML=character;
   else
      se.innerHTML=character+"<WBR>"
      
   var prev = this.cursor.previousSibling;
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;
   
   if ( prev ) {
       if ( CoscripterDomUtils.isClass(prev, "word") ) {
          parent.insertBefore(se, this.cursor);
       }
       else if ( CoscripterDomUtils.isClass(prev, "char") ) {
          if ( CoscripterDomUtils.isClass(prev, "delimiter") ) {
             parent.insertBefore(se, this.cursor);
          }
          else {
             var wse = doc.createElement("SPAN");
             wse.className="word";
             var n = this.cursor.nextSibling;
             parent.setAttribute("value", "");
             while ( n ) {
                parent.removeChild(n);
                wse.appendChild(n);
                n = this.cursor.nextSibling;
             }
             var nw = parent.nextSibling;
             if ( nw ) {
                grandparent.insertBefore(wse, nw);
             }
             else {
                grandparent.appendChild(wse);
             }
             parent.removeChild(this.cursor);
             grandparent.insertBefore(this.cursor, wse);
             grandparent.insertBefore(se, this.cursor);
             
             this.processWord(parent, true);
          }   
       }
   }
   else {
       parent.insertBefore(se, this.cursor);
   }
   

   /*
   var h = this;
   se.onclick=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharClick.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.onmousedown=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharMouseDown.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.onmouseup=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharMouseUp.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   se.onmousemove=function(e) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleCharMouseMove.call(h,e);
	  editor.RichTextBox.eventCameFromUser = false;
   }
   */
      
}

editor.RichTextBox.prototype.deleteCharBefore=function() {
   var doc = this.location.ownerDocument;

   var prev = this.cursor.previousSibling;
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;
   
   if ( prev ) {
       if ( CoscripterDomUtils.isClass(prev, "word") ) {
           var lc = prev.lastChild;
           if ( prev.childNodes.length > 1 ) {
               prev.removeChild(lc);
           }
           else {
               prev.removeChild(lc);
               parent.removeChild(prev);
           }
       }
       else if ( CoscripterDomUtils.isClass(prev, "char") ) {
          if ( CoscripterDomUtils.isClass(prev, "delimiter") ) {
              parent.removeChild(prev);
              var b = this.cursor.previousSibling;
              var a = this.cursor.nextSibling;
              if ( a && b ) {
                  if ( CoscripterDomUtils.isClass(a, "word") && CoscripterDomUtils.isClass(b, "word") ) {
                     var c = a.firstChild;
                     parent.removeChild(this.cursor);
                     b.appendChild(this.cursor);
                     while ( c ) {
                         a.removeChild(c);
                         b.appendChild(c);
                         c = a.firstChild;
                     }
                     parent.removeChild(a);
                  }
              }
          }
          else {
             parent.removeChild(prev);
             
             if ( !this.cursor.previousSibling ) {
                parent.removeChild(this.cursor);
                grandparent.insertBefore(this.cursor, parent);
             }
             
          }   
       }
   }
   else {

          
      if ( CoscripterDomUtils.isClass(parent, "line") ) {
         var parentprev = parent.previousSibling;
         var parentnext = parent.nextSibling;
         
         if ( this.singlelineedit ) {
             if ( parent.childNodes.length == 1 ) {
                 var c = parent.firstChild;
                 if ( !CoscripterDomUtils.isClass(c, "cursor") )
                    return;
             }
             else
                return;
         }
          
          
         if ( parentprev ) {
            // Create dummy char
            var dcse = doc.createElement("SPAN")
            dcse.className="char delimiter";
           
      
            parentprev.appendChild(dcse);
   
            // Move cursor to parent's prev
            parent.removeChild(this.cursor);
            parentprev.appendChild(this.cursor);
            
            // Move parent's children to parent's prev
            var c = parent.firstChild;
            while ( c ) {
               parent.removeChild(c);
               parentprev.appendChild(c);
               c = parent.firstChild;
            }
            
            // Remove empty line
            grandparent.removeChild(parent);
            
            // Delete dummy char
            this.deleteCharBefore();
            
            if ( !CoscripterDomUtils.isClass(parentprev, "subline") ) {
                if ( !parentnext ) {
                    CoscripterDomUtils.removeClass(parentprev, "open");
                }
                else if ( !CoscripterDomUtils.isClass(parentnext, "subline" ) ) {
                    CoscripterDomUtils.removeClass(parentprev, "open");
                }
            }
         }
      }
   }
}

editor.RichTextBox.prototype.deleteCharAfter=function() {
   var doc = this.location.ownerDocument;

   var next = this.cursor.nextSibling;
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;

   if ( next ) {
       if ( CoscripterDomUtils.isClass(next, "word") ) {
           var fc = next.firstChild;
           if ( next.childNodes.length > 1 ) {
               next.removeChild(fc);
           }
           else {
               next.removeChild(fc);
               parent.removeChild(next);
           }           
       }
       else if ( CoscripterDomUtils.isClass(next, "char") ) {
          if ( CoscripterDomUtils.isClass(next, "delimiter") ) {
              parent.removeChild(next);
              var b = this.cursor.previousSibling;
              var a = this.cursor.nextSibling;
              if ( a && b ) {
                  if ( CoscripterDomUtils.isClass(a, "word") && CoscripterDomUtils.isClass(b, "word") ) {
                     var c = a.firstChild;
                     parent.removeChild(this.cursor);
                     b.appendChild(this.cursor);
                     while ( c ) {
                         a.removeChild(c);
                         b.appendChild(c);
                         c = a.firstChild;
                     }
                     parent.removeChild(a);
                  }
              }
              
          }
          else {             
             parent.removeChild(next);
             
             if ( !this.cursor.nextSibling ) {
                parent.removeChild(this.cursor);
                var n = parent.nextSibling;
                if ( n ) {
                   grandparent.insertBefore(this.cursor, n);
                }
                else {
                   grandparent.appendChild(this.cursor);
                }
             }
          }   
       }
   }   
   else {
          
      if ( CoscripterDomUtils.isClass(parent, "line") ) {
         var parentnext = parent.nextSibling;
         
         if ( this.singlelineedit ) {
             if ( parent.childNodes.length == 1 ) {
                 var c = parent.firstChild;
                 if ( !CoscripterDomUtils.isClass(c, "cursor") )
                    return;
             }
             else
                return;
         }
         
         if ( parentnext ) {
            var parentnextnext = parentnext.nextSibling;
            var fc = parentnext.firstChild;
            
            // Create dummy char after cursor
            var dcse = doc.createElement("SPAN")
            dcse.className="char delimiter";
            
      
            parent.appendChild(dcse);
               
            // Move parent next's children to parent's 
            var c = parentnext.firstChild;
            while ( c ) {
               parentnext.removeChild(c);
               parent.appendChild(c);
               c = parentnext.firstChild;
            }
            
            // Remove empty line
            grandparent.removeChild(parentnext);
            
            // Delete dummy char
            this.deleteCharAfter();
            
            if ( !CoscripterDomUtils.isClass(parent, "subline") ) {
                if ( !parentnextnext ) {
                    CoscripterDomUtils.removeClass(parent, "open");
                }
                else if ( !CoscripterDomUtils.isClass(parentnextnext, "subline" ) ) {
                    CoscripterDomUtils.removeClass(parent, "open");
                }
            }            
         }
      }
   }
}

editor.RichTextBox.prototype.deleteLine=function(line) {
   if ( this.isLineCurrent(line) ) {
       if ( line.nextSibling ) {
          this.moveCurrentLineNext();
       }
       else {
          this.cursor = null;
       }
   }
   var p = line.parentNode;
   p.removeChild(line);
}


editor.RichTextBox.prototype.hasMultiLineText=function() {
   var lines = CoscripterDomUtils.getElementsByClass(this.richtextbox, "return");
   return lines.length > 0;
}

editor.RichTextBox.prototype.insertCursor=function() {
   var doc = this.location.ownerDocument;

   // Create a text cursor
   var cursor = doc.createElement("SPAN");
   cursor.className="cursor invisible text";
   cursor.style.width="0px";
   cursor.style.height="16px";


   this.cursor = cursor;
   
   var lastline = this.richtextbox.lastChild;
   if ( lastline ) {
      lastline.appendChild(this.cursor);
   }
   else {
      // Create a new line and insert there
      var doc = this.location.ownerDocument;
      var de = doc.createElement("DIV")
      de.className="line";
        
      //de.setAttribute("indent", "0");
      
   
      var h = this;
      de.addEventListener("click", function(e) {
	     editor.RichTextBox.eventCameFromUser = true;
         editor.RichTextBox.handleLineClick.call(h,e);
	     editor.RichTextBox.eventCameFromUser = false;
      }, false);
      de.addEventListener("dblclick", function(e) {
	     editor.RichTextBox.eventCameFromUser = true;
         editor.RichTextBox.handleLineDoubleClick.call(h,e);
	     editor.RichTextBox.eventCameFromUser = false;
      }, false);
      de.addEventListener("mousedown", function(e) {
	     editor.RichTextBox.eventCameFromUser = true;
         editor.RichTextBox.handleLineMouseDown.call(h,e);
	     editor.RichTextBox.eventCameFromUser = false;
      }, false);
      de.addEventListener("mouseup", function(e) {
	     editor.RichTextBox.eventCameFromUser = true;
         editor.RichTextBox.handleLineMouseUp.call(h,e);
	     editor.RichTextBox.eventCameFromUser = false;
      }, false);
      de.addEventListener("mousemove", function(e) {
	     editor.RichTextBox.eventCameFromUser = true;
         editor.RichTextBox.handleLineMouseMove.call(h,e);
	     editor.RichTextBox.eventCameFromUser = false;
      }, false);
      de.addEventListener("mouseout", function(e) {
	     editor.RichTextBox.eventCameFromUser = true;
         editor.RichTextBox.handleLineMouseOut.call(h,e);
	     editor.RichTextBox.eventCameFromUser = false;
      }, false);
   
   
      de.appendChild(this.cursor);
      
      this.richtextbox.appendChild(de);
      
      this.removeLineInfo();
      this.addLineInfo();
   }
}

editor.RichTextBox.prototype.isCursorAtLineBegin=function() {
    return this.cursor.previousSibling == null;
}

editor.RichTextBox.prototype.moveCursorLeft=function(skipclear, singleline) {

   if ( !this.enabled ) 
       return false;
       
   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }   
   
   var prev = this.cursor.previousSibling;
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;

   if ( prev ) {
       if ( CoscripterDomUtils.isClass(prev, "word") ) {
           var lc = prev.lastChild;
           parent.removeChild(this.cursor);
           if ( prev.childNodes.length > 1 ) {
               prev.insertBefore(this.cursor, lc);
           }
           else {
               parent.insertBefore(this.cursor, prev);
           }           
       }
       else if ( CoscripterDomUtils.isClass(prev, "char") ) {
          if ( CoscripterDomUtils.isClass(prev, "delimiter") ) {
              parent.insertBefore(this.cursor, prev);
          }
          else {
             parent.removeChild(this.cursor);

             var pp = prev.previousSibling;
 
             if ( pp ) {
                parent.insertBefore(this.cursor, prev);
             }
             else {
                grandparent.insertBefore(this.cursor, parent);
             }
              
          }   
       }
       return false;
   }  
   else {
       if ( singleline )
          return false;
          
       if ( CoscripterDomUtils.isClass(parent, "line") ) {
          var parentprev = parent.previousSibling;
          if ( parentprev ) {
              parent.removeChild(this.cursor);
              parentprev.appendChild(this.cursor);
              this.notifyListener(editor.LINE_CHANGE_EVENT);
              return true;
          }
          else {
             return false;
          }
       }
   } 
   return false;
}

editor.RichTextBox.prototype.moveCursorLeftBy=function(n) {
   
   for ( var i = 0; i < n; i++ ) {
      var up = this.moveCursorLeft();
      if ( up ) {
         this.moveCursorRight();
         break;
      }
   }
}

editor.RichTextBox.prototype.moveCursorRight=function(skipclear, singleline) {
   var next = this.cursor.nextSibling;
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;
   
   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }  
   
   if ( next ) {
       if ( CoscripterDomUtils.isClass(next, "word") ) {
           var fc = next.firstChild;
           parent.removeChild(this.cursor);
           if ( next.childNodes.length > 1 ) {
               var n = fc.nextSibling;
               next.insertBefore(this.cursor, n);
           }
           else {
               var n = next.nextSibling;
               if ( n ) {
                   parent.insertBefore(this.cursor, n);
               }
               else {
                   parent.appendChild(this.cursor);
               }
           }           
       }
       else if ( CoscripterDomUtils.isClass(next, "char") ) {
          if ( CoscripterDomUtils.isClass(next, "delimiter") ) {
              parent.removeChild(this.cursor);
              var n = next.nextSibling;
              if ( n ) {
                  parent.insertBefore(this.cursor, n);
              }
              else {
                  parent.appendChild(this.cursor);
              }
          }
          else {
              parent.removeChild(this.cursor);
              
              var n = next.nextSibling;
              if ( n ) {
                 parent.insertBefore(this.cursor, n);
              }
              else {
                 var pn = parent.nextSibling;
                 if ( pn ) {
                    grandparent.insertBefore(this.cursor, pn);
                 }
                 else {
                    grandparent.appendChild(this.cursor);
                 }
              }
              
          }   
       }
       return false;
   }   
   else {
       if ( singleline )
          return false;
          
	   // TL: this part returns true iff the cursor moves down to the next
	   // line as a result of moving one step to the right
       if ( CoscripterDomUtils.isClass(parent, "line") ) {
          var parentnext = parent.nextSibling;
          if ( parentnext ) {
             var fc = parentnext.firstChild;
             if ( fc ) {
                 parent.removeChild(this.cursor);
                 parentnext.insertBefore(this.cursor, fc);
             }
             else {
                 parentnext.appendChild(this.cursor);
             }
             this.notifyListener(editor.LINE_CHANGE_EVENT);
             return true;
          } else {
             return false;
          }
       }
    }
	return false;
}

// TL: the original implementation of this function moved the cursor to the
// right until it dropped down to the next line, then moved it left one
// character to back up on to the previous line.  I'm changing the
// semantics of this to move it right by at most the length of the line
// (and therefore not generate spurious LINE_CHANGE_EVENTS).
editor.RichTextBox.prototype.moveCursorRightBy=function(n) {
	var maxlen = this.getLineText(this.getCurrentLine()).length;
	if (n > maxlen) {
		n = maxlen;
	}

	for ( var i = 0; i < n; i++ ) {
		this.moveCursorRight(true);
	}
}

editor.RichTextBox.prototype.moveCursorLeftWord=function(skipclear) {

   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }
   
   var parent = this.cursor.parentNode;
   var c = this.cursor;
   
   // Skip immediate spaces
   var lc = c.previousSibling;

   if ( lc == null || CoscripterDomUtils.isClass(lc, "space") ) {
      c = lc;
      while ( CoscripterDomUtils.isClass(c, "space" ) ) {
         c = c.previousSibling;
         if ( c == null ) {
            break;
         }
      }
      if ( c == null ) {
         this.moveCursorLineHome(skipclear);
         this.moveCursorLeft(skipclear);
         return;
      }
   }
   
   // Skip to the first space
   while ( !CoscripterDomUtils.isClass(c, "space") ) {
       c = c.previousSibling;
       if ( c == null ) {
           var cp = this.cursor.parentNode;
           if ( CoscripterDomUtils.isClass(cp, "word") ) {
               c = cp.previousSibling;
           }
           else
               break;
       }
   }
   
   
   // Insert cursor after space
   if ( c == null ) {
      var cp = this.getCurrentLine();
      var fc = cp.firstChild;
      parent.removeChild(this.cursor);
      cp.insertBefore(this.cursor, fc);
   }
   else {
      parent.removeChild(this.cursor);
      var cp = c.parentNode;
      cp.insertBefore(this.cursor, c.nextSibling);
   }
   
  
}

editor.RichTextBox.prototype.moveCursorRightWord=function(skipclear) {

   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }
   
   var parent = this.cursor.parentNode;
   var c = this.cursor;
   
   var rc = c.nextSibling;
   if ( rc == null ) {
       this.moveCursorLineEnd(skipclear);
       this.moveCursorRight(skipclear);
       return;
   }
   
   // Skip to the non spaces
   while ( !CoscripterDomUtils.isClass(c, "space") ) {
       c = c.nextSibling;
       if ( c == null ) {
           var cp = this.cursor.parentNode;
           if ( CoscripterDomUtils.isClass(cp, "word") ) {
               c = cp.nextSibling;
           }
           else
               break;
       }
   }

   if ( c == null || CoscripterDomUtils.isClass(c, "space") ) {
      while ( CoscripterDomUtils.isClass(c, "space" ) ) {
         c = c.nextSibling;
         if ( c == null ) {
            break;
         }
      }
   }
   
   // Insert cursor before non-space
   if ( c == null ) {
      var cp = this.getCurrentLine();
      parent.removeChild(this.cursor);
      cp.appendChild(this.cursor);
   }
   else {
      parent.removeChild(this.cursor);
      var cp = c.parentNode;
      cp.insertBefore(this.cursor, c);
   }
   
}

editor.RichTextBox.prototype.moveCursorTextHome=function(skipclear) {

   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }   
   
   this.removeLineInfo();
   this.removeCursor();
   
   var firstline = this.richtextbox.firstChild;
   var first = firstline.firstChild;
   if ( first ) 
      firstline.insertBefore(this.cursor, first);
   else
      firstline.appendChild(this.cursor);

   this.addLineInfo();
   this.forceScrollIntoView();
}

editor.RichTextBox.prototype.moveCursorTextEnd=function(skipclear) {
   
   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }   
   
   this.removeCursor();
   this.removeLineInfo();
   
   var lastline = this.richtextbox.lastChild;
   lastline.appendChild(this.cursor);
   
   this.addLineInfo();
}

editor.RichTextBox.prototype.moveCursorLineHome=function(skipclear) {

   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }  
   
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;
   var curline = null;
      
   if ( CoscripterDomUtils.isClass(parent, "line") ) {
      curline = parent;
   }
   else if ( CoscripterDomUtils.isClass(grandparent, "line") ) {
      curline = grandparent;
   }
   
   this.removeCursor();
   var first = curline.firstChild;
   
   if ( first ) {
      curline.insertBefore(this.cursor, first);
   }
   else {
      curline.appendChild(this.cursor);
   }
}

editor.RichTextBox.prototype.moveCursorLineEnd=function(skipclear) {
   
   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }   
      
   
   var parent = this.cursor.parentNode;
   var grandparent = parent.parentNode;
   var curline = null;
      
   if ( CoscripterDomUtils.isClass(parent, "line") ) {
      curline = parent;
   }
   else if ( CoscripterDomUtils.isClass(grandparent, "line") ) {
      curline = grandparent;
   }
   
   this.removeCursor();
   curline.appendChild(this.cursor);
   this.adjustView();
}

editor.RichTextBox.prototype.getCursorCharIndex=function() {

   var i = 0;       
   var current = this.cursor;
   var prev = null;

   while ( true ) {
       prev = current.previousSibling;
       
       if ( prev == null ) {
          var parent = current.parentNode;
          if ( CoscripterDomUtils.isClass(parent, "word") ) {
             prev = parent.previousSibling;
          }
          else 
             break;
       }
       
       if ( prev == null )
          break;

       if ( CoscripterDomUtils.isClass(prev, "word") ) 
          prev = prev.lastChild;
       
       if ( prev == null )
          break;
          
       if ( CoscripterDomUtils.isClass(prev, "char") ) 
          i++;
          
       current = prev;
   }
   
   return i;
}

editor.RichTextBox.prototype.moveCursorUp=function(skipclear) {

   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }
   
   var i = this.getCursorCharIndex();
   this.moveCursorLineHome(true);
   this.moveCursorLeft(true);
   this.moveCursorLineHome(true);
   this.moveCursorRightBy(i);
}

editor.RichTextBox.prototype.moveCursorDown=function(skipclear) {
 
   if ( !skipclear ) {
      this.clearCharSelection();
      this.clearLineSelection();
   }
   
   var i = this.getCursorCharIndex();
   this.moveCursorLineEnd(true);
   this.moveCursorRight(true);
   this.moveCursorRightBy(i);
}

editor.RichTextBox.prototype.hasTextCursor=function() {
   return this.cursor != null;
   /*
   var cursors = CoscripterDomUtils.getElementsByClass(this.richtextbox, "cursor");
   for ( var i = 0; i < cursors.length; i++ ) {
       var c = cursors[i];
       if ( !CoscripterDomUtils.isClass(c, "selector") )
          return true;
   }
   return false;
   */
}

editor.RichTextBox.prototype.hasSelectorCursor=function() {
   var cursors = CoscripterDomUtils.getElementsByClass(this.richtextbox, "cursor");
   for ( var i = 0; i < cursors.length; i++ ) {
       var c = cursors[i];
       if ( CoscripterDomUtils.isClass(c, "selector") )
          return true;
   }
   return false;
}

editor.RichTextBox.prototype.copySelection=function() {
   if ( this.charSelectionActive ) {
      // Save it to clipboard
      this.charSelectionClipboard = this.charSelectionText;
      clipboardHelper.copyString(this.charSelectionClipboard);
   }
   else if ( this.lineSelectionActive ) {
      // Save it to clipboard
      this.lineSelectionClipboard = this.lineSelectionText;
      clipboardHelper.copyString(this.lineSelectionClipboard);
   }
}

editor.RichTextBox.prototype.pasteSelection=function() {      
   var trans = Components.classes["@mozilla.org/widget/transferable;1"].
               createInstance(Components.interfaces.nsITransferable);
   trans.addDataFlavor("text/unicode");

   clipboard.getData(trans, clipboard.kGlobalClipboard);
   var str  = new Object();
   var strLength = new Object();

   trans.getTransferData("text/unicode", str, strLength);
   if (str) 
      str  = str.value.QueryInterface(Components.interfaces.nsISupportsString);
   if (str) 
      this.charSelectionClipboard = str.data.substring(0, strLength.value / 2);
      
   if (this.charSelectionClipboard && this.charSelectionClipboard.length > 0) {
	  // TL: this is a terrible hack to make copying and pasting lines of
	  // script work better; see bug [#91982] Copying and pasting multiple
	  // lines in a script cause subsequent lines to be indented more.
	  // This hack works for singly-indented code, but it causes extra
	  // spaces to be inserted in front of deeper indented code.  I think
	  // that a partial solution is better than none though.
      var lines = this.charSelectionClipboard.split("\n");

	  // TL: handle the first line specially.  Insert it at the current
	  // indentation level.  See bug [#93531] Paste into Editor is screwed
	  // up.
      while (lines[0][0] == '*' && lines[0][1] == ' ') {
			lines[0] = lines[0].substr(2, lines[0].length);
      }
	  this.insertText(lines[0]);

	  for (var i=1; i<lines.length; i++) {
		this.insertLine();
		// Strip out leading "* "s if they exist
		var indent = 0;
		while (lines[i][0] == '*' && lines[i][1] == ' ') {
			indent++;
			lines[i] = lines[i].substr(2, lines[i].length);
		}
		this.insertText(lines[i]);
		this.setCurrentLineIndent("" + indent);
	  }
	}
}

editor.RichTextBox.prototype.cutSelection=function(skipcopy) {
   if ( this.charSelectionActive ) {
      // Save it to clipboard
      if ( !skipcopy ) 
         this.copySelection();
      
      // Delete each char one by one
      this.moveCursorToNode(this.charSelectionAnchorLeft);
      var l = this.charSelectionText.length;
      for ( var i = 0; i < l; i++ ) 
         this.deleteCharAfter();
         
      this.clearCharSelection();
   }
   else if ( this.lineSelectionActive ) {
      // Save it to clipboard
      if ( !skipcopy ) 
         this.copySelection();
      
      // Delete each line one by one 
      for ( var i = 0; i < this.lineSelection.length; i++ ) {
          var line = this.lineSelection[i];
          this.deleteLine(line);
       }
         
	  this.clearLineSelection();
	  if ( !this.cursor ) {
	      this.insertCursor();
	  }
	  
	  // No lines left insert an empty one
	  if ( this.getLineCount() == 0 )
	     this.insertLine("", true);
   }
 }

editor.RichTextBox.prototype.selectWord=function(n) {

    // Find the first char on word
   this.charSelectionAnchorBegin = this.findFirstCharNodeWord(this.cursor);
   
   // Find the last char on word
   this.charSelectionAnchorEnd = this.findLastCharNodeWord(this.cursor);
   
   this.markCharSelection();  
}

editor.RichTextBox.prototype.selectLineAll=function() {
   var currentline = this.getCurrentLine();
   // Find the first char on current line
   this.charSelectionAnchorBegin = this.findFirstCharNodeLine(currentline);
   
   // Find the last char on current line
   this.charSelectionAnchorEnd = this.findLastCharNodeLine(currentline);
   
   this.markCharSelection();
}

editor.RichTextBox.prototype.selectLineToHome=function() {
   var currentline = this.getCurrentLine();
   // Find the first char on current line
   this.charSelectionAnchorBegin = this.findFirstCharNodeLine(currentline);
   
   // Find the last char on current line
   this.charSelectionAnchorEnd = this.findLeftCharNode(this.cursor);
   
   if ( this.charSelectionAnchorEnd == null )
       return;
       
   this.markCharSelection();
}

editor.RichTextBox.prototype.selectLineToEnd=function() {
   var currentline = this.getCurrentLine();
   // Find the first char on current line
   this.charSelectionAnchorBegin = this.findRightCharNode(this.cursor);
   
   // Find the last char on current line
   this.charSelectionAnchorEnd = this.findLastCharNodeLine(currentline);
   
   if ( this.charSelectionAnchorBegin == null )
      return;
      
   this.markCharSelection();
}

editor.RichTextBox.prototype.findLeftCharNode=function(n) {
   var prev = n.previousSibling;
   if ( prev ) {
      var l = this.findLastCharNodeLine(prev);
      if ( l )
         return l;
      else
         return this.findLeftCharNode(prev);
   }
   else {
      var p = n.parentNode;
      if ( CoscripterDomUtils.isClass(p, "line") ) 
          return null;
      else
          return this.findLeftCharNode(p);
   }
}

editor.RichTextBox.prototype.findRightCharNode=function(n) {
   var next = n.nextSibling;
   if ( next ) {
      var r = this.findFirstCharNodeLine(next);
      if ( r ) 
         return r;
      else
         return this.findRightCharNode(next);
   }
   else {
      var p = n.parentNode;
      if ( CoscripterDomUtils.isClass(p, "line") )
          return null;
      else
          return this.findRightCharNode(p);
   }
}

editor.RichTextBox.prototype.findFirstCharNodeWord=function(n) {
   var word = CoscripterDomUtils.getParentByClass(n, "word");
   
   if ( !word )
      return null;
      
   var cn = word.childNodes;
   var ci = 0;
      
   while ( ci < cn.length ) {
     var c = cn[ci];
     if ( CoscripterDomUtils.isClass(c, "char") )
         return c;
     else
         ci++;
   }

   return null;
}

editor.RichTextBox.prototype.findLastCharNodeWord=function(n) {
   var word = CoscripterDomUtils.getParentByClass(n, "word");
   
   var cn = word.childNodes;
   var ci = cn.length;
      
   while ( ci >= 0 ) {
     var c = cn[ci];
     if ( CoscripterDomUtils.isClass(c, "char") )
         return c;
     else
         ci--;
   }

   return null;
}

editor.RichTextBox.prototype.findFirstCharNodeLine=function(n) {
   if ( CoscripterDomUtils.isClass(n, "char") )
      return n;
   else {

      var cn = n.childNodes;
      var ci = 0;
      
      while ( ci < cn.length ) {
         var c = cn[ci];
         var fcn = this.findFirstCharNodeLine(c);
         if ( fcn )
            return fcn;
         else
            ci++;
      }
   }

   return null;
}

editor.RichTextBox.prototype.findLastCharNodeLine=function(n) {
   if ( CoscripterDomUtils.isClass(n, "char") )
      return n;
   else {
      var cn = n.childNodes;
      var ci = cn.length - 1;
      
      while ( ci >= 0 ) {
         var c = cn[ci];
         var fcn = this.findLastCharNodeLine(c);
         if ( fcn )
            return fcn;
         else
            ci--;
      }
   }

   return null;
}

editor.RichTextBox.prototype.moveCursorSelectionLeft=function() {
   if ( !this.charSelectionAnchorBegin ) {
       this.charSelectionAnchorBegin = this.cursor.previousSibling;
       if ( CoscripterDomUtils.isClass(this.charSelectionAnchorBegin, "word") ) {
          this.charSelectionAnchorBegin = this.charSelectionAnchorBegin.lastChild;
       }
   }
   this.moveCursorLeft(true, true);   
   if ( !this.charSelectionAnchorEnd )
       this.charSelectionAnchorEnd = this.charSelectionAnchorBegin;
   else {
       this.charSelectionAnchorEnd = this.cursor.nextSibling;
       if ( CoscripterDomUtils.isClass(this.charSelectionAnchorEnd, "word") ) {
          this.charSelectionAnchorEnd = this.charSelectionAnchorEnd.firstChild;
       }
   }
   
   this.markCharSelection();
}

editor.RichTextBox.prototype.moveCursorSelectionRight=function() {
   if ( !this.charSelectionAnchorBegin ) {
       this.charSelectionAnchorBegin = this.cursor.nextSibling;
       if ( CoscripterDomUtils.isClass(this.charSelectionAnchorBegin, "word") ) {
           this.charSelectionAnchorBegin = this.charSelectionAnchorBegin.firstChild;
       }
   }
   this.moveCursorRight(true, true);
   if ( !this.charSelectionAnchorEnd )          
       this.charSelectionAnchorEnd = this.charSelectionAnchorBegin;
   else {
       this.charSelectionAnchorEnd = this.cursor.previousSibling;
       if ( CoscripterDomUtils.isClass(this.charSelectionAnchorEnd, "word") ) {
           this.charSelectionAnchorEnd = this.charSelectionAnchorEnd.lastChild;
       }
   }
   
   this.markCharSelection();
}

editor.RichTextBox.prototype.beginCharSelection=function(e) {
   
    
   var target = e.target;
   var line = CoscripterDomUtils.getParentByClass(target, "line");
   if ( !CoscripterDomUtils.isClass(line, "current") )
      return;
      
   this.clearCharSelection();
   this.clearLineSelection();
   

   if ( CoscripterDomUtils.isClass(target, "line") ) {
      target = this.findLastCharNodeLine(target);
   }
   
   this.charSelectionAnchorBegin = target;

   this.markCharSelection();
}

editor.RichTextBox.prototype.endCharSelection=function(e) {
   
   if ( !this.charSelectionInProgress )
       return;
       

         
   this.inputbox.focus();
   
   this.charSelectionInProgress = false;
   this.charSelectionAnchorBegin = null;
   this.charSelectionAnchorEnd = null; 
}

editor.RichTextBox.prototype.moveCharSelection=function(e) {
    
   if ( !this.charSelectionInProgress ) {
      if ( this.charSelectionAnchorBegin != null && this.charSelectionAnchorEnd == null )
         this.charSelectionInProgress = true;
      else
         return;
   }

   
   var target = e.target;
   if ( CoscripterDomUtils.isClass(target, "line") ) {
      target = this.findLastCharNodeLine(target);
   }  
   this.charSelectionAnchorEnd = target;
   this.markCharSelection();
   
   //this.moveCursor(e);
   
   //if ( this.charSelectionDirection == editor.LEFT_RIGHT )
   //   this.moveCursorRight(true);
}

editor.RichTextBox.prototype.markCharSelection=function() {
   this.charSelectionActive = false;

   this.unselectAllCharNodes();
      
   this.hideCursor();
   
   if ( this.charSelectionAnchorBegin == null || this.charSelectionAnchorEnd == null )
      return;
      
   
   this.charSelectionAnchorLeft = CoscripterDomUtils.getLeftNode(this.charSelectionAnchorBegin, this.charSelectionAnchorEnd);
   this.charSelectionAnchorRight = this.charSelectionAnchorLeft == this.charSelectionAnchorBegin ?
   									this.charSelectionAnchorEnd : this.charSelectionAnchorBegin;
      
   var charSelectionAnchorLeftLine = CoscripterDomUtils.getParentByClass(this.charSelectionAnchorLeft, "line");
   var charSelectionAnchorRightLine = CoscripterDomUtils.getParentByClass(this.charSelectionAnchorRight, "line");
   var charSelectionAnchorBeginLine = CoscripterDomUtils.getParentByClass(this.charSelectionAnchorBegin, "line");
   
   if ( this.charSelectionAnchorBegin == this.charSelectionAnchorLeft ) {
      this.charSelectionDirection = editor.LEFT_RIGHT;
   }
   else {
      this.charSelectionDirection = editor.RIGHT_LEFT;
   }
   
   if ( charSelectionAnchorLeftLine != charSelectionAnchorRightLine ) {
      var li = this.getLineNumber(charSelectionAnchorLeftLine);
      var ri = this.getLineNumber(charSelectionAnchorRightLine);
      var bi = this.getLineNumber(charSelectionAnchorBeginLine);
      if ( bi == li ) {
          this.charSelectionAnchorEnd = this.findLastCharNodeLine(charSelectionAnchorBeginLine);
          this.charSelectionAnchorRight = this.charSelectionAnchorEnd;
      }
      else {
          this.charSelectionAnchorEnd = this.findFirstCharNodeLine(charSelectionAnchorBeginLine);
          this.charSelectionAnchorLeft = this.charSelectionAnchorEnd;
      }
   }
   
   var selectedChars = CoscripterDomUtils.getRangeNodes(this.charSelectionAnchorBegin, this.charSelectionAnchorEnd);
   
   this.charSelectionText = "";
   for ( var i = 0; i < selectedChars.length; i++ ) {
      var c = selectedChars[i];
      if ( CoscripterDomUtils.isClass(c, "char") ) {
         this.selectCharNode(c);
         this.charSelectionText += this.extractChar(c);
      }
      else if ( CoscripterDomUtils.isClass(c, "line") ) {
         this.charSelectionText += "\n";
      }
   }
   
   this.charSelectionActive = true;

}

editor.RichTextBox.prototype.getTextBetweenNodes=function(n1, n2) {
   var chars = CoscripterDomUtils.getRangeNodes(n1, n2);
  
   var text = "";
   for ( var i = 0; i < chars.length; i++ ) {
       var c = chars[i];
       if ( CoscripterDomUtils.isClass(c, "char") ) {
          text += this.extractChar(c);
       }
       else if ( CoscripterDomUtils.isClass(c, "line") ) {
          text += "\n";
       }
   }
   return text;
}

editor.RichTextBox.prototype.clearCharSelection=function() {

   this.unselectAllCharNodes();
   
   this.charSelectionAnchorBegin = null;
   this.charSelectionAnchorEnd = null;
   this.charSelectionInProgress = false;
   this.charSelectionActive = false;
}

editor.RichTextBox.prototype.unselectAllCharNodes=function() {

   var lineLeft = CoscripterDomUtils.getParentByClass(this.charSelectionAnchorLeft, "line");
   var lineRight = CoscripterDomUtils.getParentByClass(this.charSelectionAnchorRight, "line");
   var line = lineLeft;
   while ( line ) {
      var selectedChars = CoscripterDomUtils.getElementsByClass(line, "selection");
      for ( var i = 0; i < selectedChars.length; i++  ) {
         this.unselectCharNode(selectedChars[i]);
      }
      if ( line == lineRight ) 
          break;
          
      line = line.nextSibling;   
   }
}
editor.RichTextBox.prototype.selectCharNode=function(n) {
   if ( n == null )
      return;
      
   if ( !CoscripterDomUtils.isClass(n, "selection") ) {
      CoscripterDomUtils.addClass(n, "selection");
   }
}

editor.RichTextBox.prototype.unselectCharNode=function(n) {
   if ( n == null )
      return;
      
   if ( CoscripterDomUtils.isClass(n, "selection") ) {
      CoscripterDomUtils.removeClass(n, "selection");
   }
}

editor.RichTextBox.prototype.moveCursor=function(e) {

   var target = e.target;
   var ex = e.clientX;
   var tx = target.offsetLeft;
   var tw = target.offsetWidth;
   var advance = ex >= tx + tw / 2;
   
   this.removeLineInfo();
   
   if ( CoscripterDomUtils.isClass(target, "line") ) {
      this.moveCursorToLine(target);
   }  
   else if ( CoscripterDomUtils.isClass(target, "char") ) {
      this.moveCursorToNode(target, advance);
   }
   else {
      target = CoscripterDomUtils.getParentByClass(target, "char");
      this.moveCursorToNode(target, advance);
   }
   
   if ( e ) 
      e.stopPropagation();
      
   
   
   
   this.processCurrentWord();   
   
   if ( this.isSelectorShowing && this.autoShowOptions) {
      this.renderOptionsBox();
   }
   
   return true;
}

editor.RichTextBox.prototype.expandLine=function(line) {

   if ( !line ) 
      return;
      
   CoscripterDomUtils.removeClass(line, "closed");
   CoscripterDomUtils.addClass(line, "open");
   
   var ns = line;
   while (true) {
      var ns = ns.nextSibling;
      if ( CoscripterDomUtils.isClass(ns, "subline") )
         CoscripterDomUtils.addClass(ns, "open");
      else
         break;
   }

}

editor.RichTextBox.prototype.collapseLine=function(line) {

   if ( !line ) 
      return;
      
   CoscripterDomUtils.removeClass(line, "open");
   CoscripterDomUtils.addClass(line, "closed");
      
   var ns = line;
   while (true) {
      var ns = ns.nextSibling;
      if ( CoscripterDomUtils.isClass(ns, "subline") )
         CoscripterDomUtils.removeClass(ns, "open");
      else
         break;
   }

}

editor.RichTextBox.prototype.selectCurrentLine=function(e) {
      
   var line = this.getCurrentLine();
   
   this.markLineSelection(line);
   
   return true;
}

editor.RichTextBox.prototype.selectToCurrentLine=function(from) {
      
   var line = this.getCurrentLine();
   
   this.markLineSelection(from, line);
   
   return true;
}


editor.RichTextBox.prototype.markLineSelection=function(from, to) {
   
   this.lineSelection = new Array();
   
   if ( !to )
      to = from;
      
   var fi = this.getLineNumber(from);
   var ti = this.getLineNumber(to);
   var min = fi < ti ? fi : ti;
   var max = fi < ti ? ti : fi;
   
   var lines = this.getLines();
   this.lineSelectionText = "";
   for ( var i = min; i <= max; i++ ) {
      var line = lines[i];
      var indent = line.getAttribute("indent");
      if ( indent ) {
          indent = parseInt(indent);
      }
      else
          indent = 0;
      this.lineSelection[this.lineSelection.length] = line;
      CoscripterDomUtils.addClass(line, "selection");
      if ( i > min ) 
         this.lineSelectionText += "\n";
      for ( var j = 0; j < indent; j++ ) {
         this.lineSelectionText += "* ";
      }
      this.lineSelectionText += this.getLineText(line);
   }
   this.lineSelectionActive = true;
}

editor.RichTextBox.prototype.clearLineSelection=function() {
   if ( this.lineSelection ) {
       for ( var i = 0; i < this.lineSelection.length; i++ ) {
          var line = this.lineSelection[i];
          CoscripterDomUtils.removeClass(line, "selection");
       }
   }
   
   this.lineSelection = null;
   this.lineSelectionActive = false;
   this.lineSelectionText = null;
   this.lineSelectionClipboard = null;
}

editor.RichTextBox.prototype.selectLineNumber=function(linenum) {

   var target = e.target;
   
   if ( this.editing ) 
      return false;
      
   
   if ( e ) 
      e.stopPropagation();

      
   return true;
}


editor.RichTextBox.prototype.getCursorLine=function() {
   if ( this.cursor ) {
      var parent = this.cursor.parentNode;
      while ( parent ) {
         if ( CoscripterDomUtils.isClass(parent, "line") ) 
            return parent;
         parent = parent.parentNode;
      }
   }
   
   return null;
   
}

editor.RichTextBox.prototype.moveCursorToLine=function(l) {
   this.removeCursor();
   this.removeSelectorCursors();
   l.appendChild(this.cursor);
   this.markCurrentLine();
}

editor.RichTextBox.prototype.moveCursorToNode=function(n, advance) {
   if (!n ) 
      return;
      
   var p = n.parentNode;
   var gp = p.parentNode;
   this.removeCursor();
   this.removeSelectorCursors();
   
   if ( CoscripterDomUtils.isClass(p, "word") ) {
      var np = n.previousSibling;
      if ( np ) {
         p.insertBefore(this.cursor, n);
      }
      else {
         gp.insertBefore(this.cursor, p);
      }
   }
   else {
      p.insertBefore(this.cursor, n);
   }
   if ( advance ) 
      this.moveCursorRight(true);
   this.markCurrentLine();
}

editor.RichTextBox.prototype.showCursor=function() {
   if ( this.cursorproxy ) {
      CoscripterDomUtils.removeClass(this.cursorproxy,"invisible");
      CoscripterDomUtils.addClass(this.cursorproxy,"visible");
   }
}

editor.RichTextBox.prototype.hideCursor=function() {
   if ( this.cursor ) {
      CoscripterDomUtils.removeClass(this.cursorproxy,"visible");
      CoscripterDomUtils.addClass(this.cursorproxy,"invisible");
   }
}

editor.RichTextBox.prototype.isCursorVisible=function() {
   if ( this.cursorproxy ) {
      if ( CoscripterDomUtils.isClass(this.cursorproxy, "visible") ) 
          return true;
   }
   
   return false;
}


editor.RichTextBox.prototype.blinkCursor=function() {
   if ( this.cursorproxy ) {
      CoscripterDomUtils.addClass(this.cursorproxy, "blink");
   }
}

editor.RichTextBox.prototype.unblinkCursor=function() {
   if ( this.cursorproxy ) {
      CoscripterDomUtils.removeClass(this.cursorproxy, "blink");
   }
}

editor.RichTextBox.prototype.delayedBlinkCursor=function() {
   this.showCursor();
   this.unblinkCursor();
      
   if ( this.blinkCursorWaitID ) {
      clearTimeout(this.blinkCursorWaitID);
   }
   
   var h = this;
   var startBlinkCursor=function(e) {
      editor.RichTextBox.startBlinkCursor.call(h);
   }
   this.blinkCursorWaitID = setTimeout(startBlinkCursor, 1500);
}

editor.RichTextBox.prototype.dispatchOnChangeEvent=function() {
	var prevCurrentLine = this.currentLine
	var currentLine = CoscripterDomUtils.getParentByClass(this.cursor, "line")
	// send a 'change' event if appropriate
	if (
		(prevCurrentLine && currentLine && prevCurrentLine != currentLine) ) {	// a different line has been selected
		var startingPrevLineText = this.startingLineText
		//save off the starting text of the new current line, for use in the next call to dispatchOnChangeEvent
		this.startingLineText = currentLine.textContent	
		var endingPrevLineText = prevCurrentLine.textContent
		if (startingPrevLineText != endingPrevLineText){
			prevCurrentLine.startingText = startingPrevLineText
			prevCurrentLine.endingText = endingPrevLineText
			var prevCurrentLineNumber = this.getLineNumber(prevCurrentLine)+1
			prevCurrentLine.lineNumber = prevCurrentLineNumber
			var changeEvent = u.constructChangeEvent(prevCurrentLine)
			// loadingScript: 1=loading. 0=done, newly loaded.   -1=loaded but not newly (or not loaded).)
			// DEATHTOME if (loadingScript == 1) getRecorder().loadingStep()	
			prevCurrentLine.dispatchEvent(changeEvent)
		}
	}	
}

///////////////////
//	markCurrentLine
///////////////////
editor.RichTextBox.prototype.markCurrentLine=function() {
   // Indicate the current line 
	if ( this.cursor ) {
		var currentLine = CoscripterDomUtils.getParentByClass(this.cursor, "line")
		//this.dispatchOnChangeEvent()	// Disabled for now
		if ( currentLine ) {
		  this.currentLine = currentLine
		  CoscripterDomUtils.addClass(currentLine, "current");
		}
	}
}

editor.RichTextBox.prototype.unmarkCurrentLine=function() {
   // Indicate the current line 
   if ( this.cursor ) {
       var currentline = CoscripterDomUtils.getParentByClass(this.cursor, "line");
       if ( currentline ) {
          CoscripterDomUtils.removeClass(currentline, "current");
          currentline.style.border = "";
       }
   }
}

editor.RichTextBox.prototype.unmarkCurrentLines=function() {
   // Indicate the current line 
   var lines = this.getLines();
   for ( var i = 0; i < lines.length; i++ ) {
      var line = lines[i];
      CoscripterDomUtils.removeClass(line, "current");
      line.style.border = "";
   }
}

// TL: set the color of the box around the current line
editor.RichTextBox.prototype.colorCurrentLine=function(color) {
	if (this.cursor) {
		var currentline = CoscripterDomUtils.getParentByClass(this.cursor, "line");
		if ( currentline ) {
			try {
				currentline.style.border = "3px solid " + color;
			} catch (e) {
				dump(e);
			}
		}
	}
}

editor.RichTextBox.startBlinkCursor=function() {
   this.blinkCursorWaitID = null;
   this.blinkCursor();
}

editor.RichTextBox.prototype.increaseCurrentLineIndent=function() {
   var currentline = this.getCurrentLine();
   this.increaseLineIndent(currentline);
   this.adjustCursorPosition();
}

editor.RichTextBox.prototype.decreaseCurrentLineIndent=function() {
   var currentline = this.getCurrentLine();
   this.decreaseLineIndent(currentline);
   this.adjustCursorPosition();
}

editor.RichTextBox.prototype.hasCurrentLineIndent=function() {
   var currentline = this.getCurrentLine();
   return this.hasLineIndent(currentline);
}

editor.RichTextBox.prototype.getCurrentLineIndent=function() {
   var line = this.getCurrentLine();
   var indent = line.getAttribute("indent");
   return indent;
}

editor.RichTextBox.prototype.setCurrentLineIndent=function(indent) {
   var line = this.getCurrentLine();
   line.setAttribute("indent", indent);
   if (!indent) {
	indent = 0;
   } else {
	indent = parseInt(indent);
   }
   this.adjustCursorPosition();
   this.fixCommentClasses(line, indent);
}
   
editor.RichTextBox.prototype.increaseLineIndent=function(line) {
   if ( !line ) 
       return;
       
   var indent = line.getAttribute("indent");
   if ( !indent )
      indent = 1;
   else {
      indent = parseInt(indent);
      indent++;
      if ( indent > 5 )
         indent = 5;
   }
   
   line.setAttribute("indent", indent);
   this.fixCommentClasses(line, indent);
}

editor.RichTextBox.prototype.decreaseLineIndent=function(line) {
   if ( !line ) 
       return;
       
   var indent = line.getAttribute("indent");
   if ( !indent )
      indent = 0;
   else {
      indent = parseInt(indent);
      indent--;
      if ( indent < 0 )
         indent = 0;
   }
   this.fixCommentClasses(line, indent);
}

   
editor.RichTextBox.prototype.fixCommentClasses=function(line, indent) {
   // TL: I added code here set or remove the "comment" class on lines that
   // have 0 indent (used when saving the script)
   if ( indent > 0 ) {
	   line.setAttribute("indent", indent);
	   CoscripterDomUtils.removeClass(line, "comment");
	} else {
       line.removeAttribute("indent");
	   CoscripterDomUtils.addClass(line, "comment");
	}
}

editor.RichTextBox.prototype.hasLineIndent=function(line) {
   if ( !line ) 
       return false;
       
   var indent = line.getAttribute("indent");
   if ( indent ) {
      indent = parseInt(indent);
      if ( indent > 0 )
         return true;
   }
   
   return false;
}

editor.RichTextBox.prototype.clearWordMatches=function() {
   if ( !this.typeahead )
      return;
      
   var words = CoscripterDomUtils.getElementsByClass(this.richtextbox, "word", 2);
   for ( var i = 0; i < words.length; i++ ) {
       var w = words[i];
       CoscripterDomUtils.removeClass(w, "match");
       w.setAttribute("value", "");
   }
}

editor.RichTextBox.prototype.rematchWords=function() {
   if ( !this.typeahead )
      return;
      
   var words = CoscripterDomUtils.getElementsByClass(this.richtextbox, "word", 2);
   for ( var i = 0; i < words.length; i++ ) {
       var w = words[i];
       if ( !CoscripterDomUtils.isClass(w, "unmatch") ) {
           var cw = this.extractWord(w);
           if ( cw && cw.length >= 3 ) {
           
              // Is there an exact match?
              w.setAttribute("value", "");
              CoscripterDomUtils.removeClass(w, "match");
              this.matchOptions(cw);
              if ( this.matchingOptionName ) {
                 w.setAttribute("value", this.matchingOptionValue);
                 CoscripterDomUtils.addClass(w, "match");
              }
           }
       }   
   }
}

editor.RichTextBox.prototype.processCurrentWord=function() {
   if ( !this.typeahead )
      return;
      
   var c = this.getCurrentWordElement();
   this.processWord(c, false);

   //this.adjustView();
    
}

editor.RichTextBox.prototype.processWord=function(c, silent) {   
   if ( !this.typeahead )
      return;
      
   if ( c ) {
       var cw = this.extractWord(c);
       //debug.showMessage("debug", cw);
       if ( cw && cw.length >= 3 ) {
           // Is there an exact match?
           c.setAttribute("value", "");
           CoscripterDomUtils.removeClass(c, "match");
           var match = false;
           if ( !CoscripterDomUtils.isClass(c, "unmatch") ) {
              this.matchOptions(cw);
              if ( this.matchingOptionName ) {
                 c.setAttribute("value", this.matchingOptionValue);
                 CoscripterDomUtils.addClass(c, "match");
                 match = true;
                 this.isSelectorShowing = false;
                 editor.RichTextBox.hideOptionsBox.call(this);
              }
           }
           
           // If not, is there a partial match?
           if ( !silent && !match) {
              this.filterOptions(cw);
              if ( (!CoscripterDomUtils.isClass(c, "match") && this.filterOptionNames.length > 0)  ||
                   ( CoscripterDomUtils.isClass(c, "match") && this.filterOptionNames.length > 1) ) {
                 this.insertSelectorCursor(c);
                 this.isSelectorShowing = true;
                 if ( this.areOptionsShowing ) {
                    this.renderOptionsBox();
                 }
              }
              else {
                 this.isSelectorShowing = false;
                 editor.RichTextBox.hideOptionsBox.call(this);
              }
           }
       }
       else {
           if ( !silent) {
              this.isSelectorShowing = false;
              editor.RichTextBox.hideOptionsBox.call(this);
           }
       }
   }

}

editor.RichTextBox.prototype.unmatchCurrentWord=function() {
   if ( !this.typeahead )
      return;
      
   var c = this.getCurrentWordElement();
   this.unmatchWord(c);  
}

editor.RichTextBox.prototype.unmatchWord=function(w) {
   if ( !this.typeahead )
      return;
      
   if ( CoscripterDomUtils.isClass(w, "match") ) {
       CoscripterDomUtils.removeClass(w, "match");
       CoscripterDomUtils.addClass(w, "unmatch");
       w.setAttribute("value", "");
   }
   else if ( CoscripterDomUtils.isClass(w, "unmatch") ) {
       CoscripterDomUtils.removeClass(w, "unmatch");
   }
}

editor.RichTextBox.prototype.replaceCurrentWord=function(text, value) {
   var c = this.getCurrentWordElement();
   var cp = c.parentNode;
   
   // Remove unmatch
   CoscripterDomUtils.removeClass(c, "unmatch");
   
   // Remove cursor
   this.cursor.parentNode.removeChild(this.cursor);
   
   // Remove option cursor
   this.removeSelectorCursors();
   
   // Replace char nodes
   while ( c.childNodes.length > 0 ) {
       c.removeChild(c.childNodes[0]);
   }
   
   var doc = this.location.ownerDocument;
   for ( var i = 0; i < text.length; i++ ) {   
       var se = doc.createElement("SPAN")
       se.className="char";
       var t = doc.createTextNode(text.charAt(i));
       se.appendChild(t);
       c.appendChild(se);
   }   
   
   // Add cursor
   var next = c.nextSibling;
   if ( next ) {
      cp.insertBefore(this.cursor, next);
   }
   else {
      cp.appendChild(this.cursor);
   }
     
   this.processCurrentWord();
}

editor.RichTextBox.prototype.insertSelectorCursor=function(c) {

   var doc = this.location.ownerDocument;

   this.selectorcursor = doc.createElement("SPAN");
   this.selectorcursor.className="cursor selector visible";
   this.selectorcursor.style.width="12px";
   this.selectorcursor.style.height="16px";

   this.selectorcursor.innerHTML="&nbsp;&nbsp;&nbsp;";

   var n = c.nextSibling;
   var cp = c.parentNode;
   if ( n ) 
      cp.insertBefore(this.selectorcursor, n);
   else
      cp.appendChild(this.selectorcursor);
      
   var h = this;

   this.selectorcursor.addEventListener("mousedown", function(event) {
	  editor.RichTextBox.eventCameFromUser = true;
      editor.RichTextBox.handleSelectorClick.call(h, event);
	  editor.RichTextBox.eventCameFromUser = false;
   }, false);
}

editor.RichTextBox.handleSelectorClick=function(e) {
   if ( this.areOptionsShowing ) {
       editor.RichTextBox.hideOptionsBox.call(this);
   }
   else {
       this.renderOptionsBox();
       this.selectorClick=true;
   }
   setTimeout('CoscripterDomUtils.getElementsByTagName(document.documentElement, \'INPUT\')[0].focus()', 10);
		// was failing to allow focus set.
   
   
   this.processCurrentWord();
}

editor.RichTextBox.prototype.removeSelectorCursors=function() {

   var doc = this.location.ownerDocument;
   
   if ( this.selectorcursor ) {
       var p = this.selectorcursor.parentNode;
       if ( p ) 
          p.removeChild(this.selectorcursor);
   }
   
   this.selectorcursor = null;
}

editor.RichTextBox.prototype.removeCursor=function() {  
   var doc = this.location.ownerDocument;

   if ( this.cursor ) {
      var p = this.cursor.parentNode;
      if ( p ) 
         p.removeChild(this.cursor);
   }
}

editor.RichTextBox.scrollIntoView=function() {
   
   
   //this.inputboxspan.style.left= CoscripterDomUtils.getOffsetLeft(this.cursor);
   if ( !this.editing )
       return;
       
   this.forceScrollIntoView();
}

editor.RichTextBox.prototype.forceScrollIntoView=function() {
	// TL: why do we move the inputboxspan here?  What is that?
	this.inputboxspan.style.top = CoscripterDomUtils.getOffsetTop(this.cursor);
	var line = CoscripterDomUtils.getParentByClass(this.cursor, "line");
	var div = line.offsetParent;

	// TL: check to see whether it's visible or not
	// div.clientHeight is the height of the visible portion of the window
	// div.scrollTop is the position of the topmost viewable pixel
	// line.offsetTop is the position of the topmost pixel of the selected line
	// line.offsetHeight is the height of the line in pixels
	//
	// [div.scrollTop, div.scrollTop + div.clientHeight] is the range of
	// pixels visible in the current viewport
	//
	// First we check if it's off the top edge of the screen
	if (line.offsetTop < div.scrollTop) {
		// the true says to align the top of the scrolled element with the
		// top of the viewport
		line.scrollIntoView(true);
	// Then we check if it's off the bottom edge
	} else if (line.offsetTop + line.offsetHeight > div.scrollTop +
			div.clientHeight) {
		// false says to align the bottom of the scrolled element with the
		// bottom of the viewport
		line.scrollIntoView(false);
	}
}

editor.RichTextBox.prototype.adjustCursorPosition=function() {
   var next = this.cursor.nextSibling;
   var prev = this.cursor.previousSibling;
   var parent = this.cursor.parentNode;
   if ( next ) {
       this.cursorproxy.style.left = next.offsetLeft - 2;
       this.cursorproxy.style.top = next.offsetTop; 
   }
   else if (prev) {
       this.cursorproxy.style.left = prev.offsetLeft + prev.offsetWidth - 2;
       this.cursorproxy.style.top = prev.offsetTop;
   }
   else {
       var i = parent.getAttribute("indent");
       if ( i ) 
   	       i = parseInt(i);
  	   else
   		   i = 0;
       this.cursorproxy.style.left = parent.offsetLeft + i * 20 + 31;
       this.cursorproxy.style.top = parent.offsetTop + 8;
   }
}

editor.RichTextBox.prototype.adjustView=function() {
   
      this.adjustCursorPosition();
      
      
      
      var h = this;
      var f = function() {
        editor.RichTextBox.scrollIntoView.call(h);
      };    
      
      if ( this.adjustViewWaitID ) 
          clearTimeout(this.adjustViewWaitID);
          
      this.adjustViewWaitID = setTimeout(f, 10);
      return;
      
      return;
      var cl = this.cursor.offsetLeft;
      var ct = this.cursor.offsetTop;
      
      //if ( this.multiline )
      //   ct += 36;
         
      if ( this.selectorcursor ) {
          var scl = this.selectorcursor.offsetLeft;
          if ( scl > cl )
              cl = scl;
      }
      cl += 15;
      var rl = this.richtextbox.style.left;
      var rt = this.richtextbox.style.top;
      
      var ow = this.outerbox.offsetWidth;
      var oh = this.outerbox.offsetHeight;

      rl = ow - cl;
      if ( rl > 0 ) 
         rl = 0;
      this.richtextbox.style.left = rl;
 
      //rt = oh - ct;
      //if ( rt > 0 ) 
      //   rt = 0;
      //this.richtextbox.style.top = rt;
      
   //}
   
}

editor.RichTextBox.prototype.getCurrentWord=function() {
   var wb = this.getCurrentWordElement();
   if ( wb )
      return this.extractWord(wb);
   else
      return null;
}


editor.RichTextBox.prototype.getCurrentWordElement=function() {
   var pc = this.cursor.parentNode;
   if ( pc == null ) 
       return null;
       
   if ( CoscripterDomUtils.isClass(pc, "word") ) {
       return pc;
   }
   else {
       var p = this.cursor.previousSibling;
       if ( p ) {
           // Skip selector
           if ( CoscripterDomUtils.isClass(p, "selector") ) 
               p = p.previousSibling;
               
           if ( CoscripterDomUtils.isClass(p, "word") ) {
              return p;
           }
           else if ( CoscripterDomUtils.isClass(p, "char") ) {
               if ( CoscripterDomUtils.isClass(p, "delimiter") ) {
                  var n = this.cursor.nextSibling;
                  if ( n ) {
                     if ( CoscripterDomUtils.isClass(n, "word") ) {
                        return n;
                     }
                     else {
                        return null;
                     }
                  }
                  else {
                     return null;
                  }
               }
               else {
                  return null;
               }
           }
       }
       else {
           var n = this.cursor.nextSibling;
           if ( n ) {
              if ( CoscripterDomUtils.isClass(n, "word") ) {
                  return n;
              }
              else {
                 return null;
              }
           } 
           else {
              return null;
           }
            
       }
   }
   
   return null;
}

editor.RichTextBox.prototype.extractWord=function(n) {
   if ( CoscripterDomUtils.isClass(n, "word") ) {
      var w = "";
      for ( var i = 0; i < n.childNodes.length; i++ ) {
         var c = n.childNodes[i];
         w += this.extractChar(c);
      }
      return w;
   }
   else
      return null;
}

editor.RichTextBox.prototype.extractChar=function(n) {
   if ( n == null )
      return "";
      
   if ( CoscripterDomUtils.isClass(n, "char") ) {
       if ( CoscripterDomUtils.isClass(n, "space") )
          return " ";
       if ( n.childNodes.length > 0 ) 
          return n.childNodes[0].nodeValue;
   }
   return "";
}

editor.RichTextBox.prototype.parseOptionNames=function(xmldoc) {
   if ( !this.typeahead )
      return null;
      
    var optionNames = null;
    //debug.showMessage("debug", "parseOptionNames");
    var nameElements = xmldoc.getElementsByTagName("OPTION");
    
    optionNames = new Array();
    for (var i=0; i<nameElements.length; i++ ) {
       optionNames[optionNames.length] = nameElements[i].childNodes[0].nodeValue;
       //debug.showMessage("debug", "name " + optionNames[i]);
    }
    
    return optionNames;
}

editor.RichTextBox.prototype.parseOptionValues=function(xmldoc) {
    var optionValues = null;
    
    //debug.showMessage("debug", "parseOptionValues");
    var valueElements = xmldoc.getElementsByTagName("OPTION");
    
    optionValues = new Array();
       
    for (var i=0; i<valueElements.length; i++ ) {
       optionValues[optionValues.length] = valueElements[i].getAttribute("value");
       //debug.showMessage("debug", "value " + optionValues[i]);
    }
    
    return optionValues;
}

editor.RichTextBox.prototype.buildOptions=function(xmldoc) {
   if ( !this.typeahead )
      return;
      
    this.optionNames = this.parseOptionNames(xmldoc);
    this.optionValues = this.parseOptionValues(xmldoc);
      
    this.clearWordMatches();
    this.rematchWords();
}

editor.RichTextBox.prototype.fetchOptions=function(text) {
   if ( !this.typeahead )
      return;
      
    var params = null;
       
    if ( this.url == null )
       return;
       
    editor.focusedBox = this;
    //debug.showMessage("debug", "fetching options " + this.url);
    var loader = new net.XMLHTTPLoader(this.url, true, editor.RichTextBox.optionsLoaded, editor.RichTextBox.optionsErrorReceived, null, "GET", params);
    loader.load();
}

editor.RichTextBox.optionsLoaded=function() {
    var xmldoc = this.getXMLDocument();
    //debug.showXMLDocument("debug", xmldoc);
    editor.focusedBox.buildOptions(xmldoc);
}

editor.RichTextBox.optionsErrorReceived=function() {
    alert(this.errorMessage);
}

editor.RichTextBox.prototype.filterOptions=function(text) {
   if ( !this.typeahead )
      return;
         
    this.filterOptionNames = new Array();
    this.filterOptionValues = new Array();
    
    //debug.showMessage("debug", "filterOptions");
    var regexp = new RegExp(this.regexpmatch + text, this.regexpflags);
    for( var i=0; i< this.optionNames.length; i++){
        var match = regexp.test(this.optionNames[i]);
        if (match) {
            this.filterOptionNames[this.filterOptionNames.length] = this.optionNames[i];
            this.filterOptionValues[this.filterOptionValues.length] = this.optionValues[i];
        }
    }
}

editor.RichTextBox.prototype.matchOptions=function(text) {
   if ( !this.typeahead )
      return;
      
    this.matchingOptionName = null;
    this.matchingOptionValue = null;

    var regexp = new RegExp('^' + text + '$', this.regexpflags);
    for( var i=0; i< this.optionNames.length; i++){
        var match = regexp.test(this.optionNames[i]);
        if (match) {
            this.matchingOptionName = this.optionNames[i];
            this.matchingOptionValue = this.optionValues[i];
            return;
        }
    }
}

editor.RichTextBox.prototype.renderOptionsBox=function() {
   if ( !this.typeahead )
      return;
      
    var c = this.getCurrentWordElement();
    if ( c == null )
       return;
       
    var cw = this.extractWord(c);
      
    var x = CoscripterDomUtils.getOffsetLeft(c);
    var y = CoscripterDomUtils.getOffsetTop(c);
    var h = CoscripterDomUtils.getOffsetHeight(c);
    var w = CoscripterDomUtils.getOffsetWidth(c);
   
    this.optionsbox.style.left = x - this.outerbox.scrollLeft;
    this.optionsbox.style.top = y + h + 1 - this.outerbox.scrollTop;
    
	/* TL 4/23/09: setting/removing event listeners directly on an element
	 * doesn't work anymore.  I don't think the options box is being used
	 * anymore, so if you need it, you will need to figure out how to
	 * remove the event handlers properly.
    this.optionsbox.onmouseout = null;
    this.optionsbox.onmouseover = null;
	*/
    
    this.optionsbox.innerHTML = "";
    this.selectedOptionIndex = -1;
   
    var limit = this.getShownFilteredOptionCount();
    
    for ( var i= 0; i < limit; i++ ) {
        this.addOption(this.filterOptionNames[i], this.filterOptionValues[i], i, cw);
    }
            
    if(this.filterOptionNames.length > 0){
        this.setSelectedOption(0);
        this.showOptionsBox();
    }
    else {
        this.selectedOptionIndex = -1;
    }
}

editor.RichTextBox.prototype.addOption=function(name, value, i, text) {
    var doc = this.optionsbox.ownerDocument;
    var matchdiv = doc.createElement("DIV");
    matchdiv.id = "Option_" + i;
    matchdiv.setAttribute("value", value);
    matchdiv.className = "option";
    
    var h = this;
    matchdiv.addEventListener("mouseover", function(event) {
	    editor.RichTextBox.eventCameFromUser = true;
        editor.RichTextBox.changeSelectedOption.call(h, event);
	    editor.RichTextBox.eventCameFromUser = false;
    }, false);

    matchdiv.addEventListener("click", function(event) {
	    editor.RichTextBox.eventCameFromUser = true;
        editor.RichTextBox.acceptSelectedOption.call(h, event);
	    editor.RichTextBox.eventCameFromUser = false;
    }, false);
    
    // EXPERIMENTAL
    matchdiv.addEventListener("mousedown", function(event) {
   		matchdiv.onclick.call(h, event); 
   	}, false);
    
    var regexp = new RegExp(this.regexpmatch + text, this.regexpflags);
    var m = regexp.exec(name);
    if ( m == null )
       return;
    var index = name.indexOf(m[0]);
    var n1 = name.substring(0,index);
    var n2 = name.substring(index, index + m[0].length);
    var n3 = name.substring(index + m[0].length);
 
    var mt1 = doc.createTextNode(n1);
    var mt2 = doc.createElement("SPAN");
    mt2.className = "matchingtext";
    var mt2x = doc.createTextNode(n2);
    mt2.appendChild(mt2x);
    var mt3 = doc.createTextNode(n3);
    matchdiv.appendChild(mt1);
    matchdiv.appendChild(mt2);
    matchdiv.appendChild(mt3);
    
    this.optionsbox.appendChild(matchdiv);
}

editor.RichTextBox.changeSelectedOption=function(e) {
    var id = e.target.id;
    if (!id)
    	id = e.target.parentNode.id; // hovering over bolded text was messing up, since 
    								// for some reason the selection was counting as a mouseout
    var index = id.substring(7);
    this.setSelectedOption(index);
}

editor.RichTextBox.acceptSelectedOption=function(e) {
    this.acceptOptionSelection();
}

editor.RichTextBox.prototype.acceptOptionSelection=function() {
    this.optionClick = true;
    var selectedOptionName = this.filterOptionNames[this.selectedOptionIndex];
    var selectedOptionValue = this.filterOptionValues[this.selectedOptionIndex];
    this.replaceCurrentWord(selectedOptionName, selectedOptionValue);
    editor.RichTextBox.hideOptionsBox.call(this);
    
	setTimeout('CoscripterDomUtils.getElementsByTagName(document.documentElement, \'INPUT\')[0].focus()', 10);
   
    this.processCurrentWord();
}


editor.RichTextBox.prototype.getSelectedOptionIndex=function() {
    return this.selectedOptionIndex;
}

editor.RichTextBox.prototype.setSelectedOption=function(selectedOptionIndex) {
   
   if ( selectedOptionIndex < -1 || selectedOptionIndex >= this.filterOptionNames.length )
      return;
      
   var selected = this.optionsbox.ownerDocument.getElementById("Option_" + this.selectedOptionIndex);
   if ( selected ) {
      CoscripterDomUtils.removeClass(selected, "selection");
   }
   this.selectedOptionIndex = selectedOptionIndex;
       
   selected = this.optionsbox.ownerDocument.getElementById("Option_" + this.selectedOptionIndex);
   if ( selected ) {
      CoscripterDomUtils.addClass(selected, "selection");
   }
}

editor.RichTextBox.prototype.moveSelectedOption=function(increment) {
   var s = this.selectedOptionIndex + increment;
   var limit = this.getShownFilteredOptionCount();
   if ( s < 0 ) 
      s = 0;
   if ( s >= limit ) 
      s = limit - 1;
   this.setSelectedOption(s);
}

editor.RichTextBox.prototype.getShownFilteredOptionCount=function(){
   return this.filterOptionNames.length > editor.MAX_OPTIONS ? editor.MAX_OPTIONS : this.filterOptionNames.length;
}

editor.RichTextBox.prototype.addLineInfo=function() {
   
   this.markCurrentLine();
   this.adjustCursorPosition();
   return;
   
   if ( !this.multiline )
      return;
      
   this.removeLineInfo();
   
   var doc = this.optionsbox.ownerDocument;
  
   var lines = this.richtextbox.childNodes;
  
   var majorlineindex = 0;
   var minorlineindex = 0;
   for ( var i = 0; i < lines.length; i++ ) {
      var line = lines[i];
      line.setAttribute("line", i+1);
      
      // Add line info div
      var lineinfodiv = doc.createElement("SPAN");
      lineinfodiv.setAttribute("title", "");
      var lineindexstr = "";
      if ( CoscripterDomUtils.isClass(line, "comment") ) {
         lineindexstr = "c";
      }
      else if ( CoscripterDomUtils.isClass(line, "subline") ) {
          minorlineindex++;
          lineindexstr = majorlineindex + "." + minorlineindex;
      }
      else {
          minorlineindex = 0;
          majorlineindex++;
          lineindexstr = majorlineindex;
      }
      
      lineinfodiv.setAttribute("line", lineindexstr);
      lineinfodiv.className = "lineinfo";
      //lineinfodiv.innerHTML = lineindexstr;
      lineinfodiv.innerHTML = "&nbsp;";
      
      var fc = line.firstChild;
      if ( fc ) {
         line.insertBefore(lineinfodiv, fc);
      }
      else {
         line.appendChild(lineinfodiv);
      }
      
      var h = this;
      
      lineinfodiv.addEventListener("click", function(e) {
  	      editor.RichTextBox.eventCameFromUser = true;
          editor.RichTextBox.handleLineInfoClick.call(h,e);
  	      editor.RichTextBox.eventCameFromUser = false;
      }, false);
   }
   

}

editor.RichTextBox.handleLineInfoClick=function(e) {
      if ( this.sample ) 
         return;
         
      var target = e.target;
      
      var line = CoscripterDomUtils.getParentByClass(target, "line");

      this.removeLineInfo();
      this.moveCursorToLine(line);
      this.notifyListener(editor.LINE_CHANGE_EVENT);
      this.addLineInfo();
        
      if ( CoscripterDomUtils.isClass(line, "open") && !CoscripterDomUtils.isClass(line, "subline")) 
         this.collapseLine(line);
      else if ( CoscripterDomUtils.isClass(line, "closed") ) 
         this.expandLine(line);     

}

editor.RichTextBox.prototype.removeCurrentLineWidget=function() {
  
   if ( this.cursor ) {
       var currentline = CoscripterDomUtils.getParentByClass(this.cursor, "line");
       if ( currentline ) {
          CoscripterDomUtils.removeClass(currentline, "current");
          this.removeLineWidget(currentline);
       }
   }
}

////////////////////////
//	getCurrentLine
////////////////////////
editor.RichTextBox.prototype.getCurrentLine=function() {
   if ( this.cursor ) {
      var currentline = CoscripterDomUtils.getParentByClass(this.cursor, "line");
       if ( currentline ) {
          return currentline;
       }
   }
   return null;
}

// (AC) added these Sept'10
editor.RichTextBox.prototype.getLineIndent=function(lineNumber) {
	var line = this.getLineWithNumber(lineNumber)
	if (!line) return -1
	var lineIndent = -1
	var indentAttribute = line.getAttribute("indent")
	if (!indentAttribute) indentAttribute = "0"
	if (line && indentAttribute) lineIndent = parseInt(indentAttribute)	// It seems that some comment lines don't get their "indent" attribute set
	return lineIndent
}

editor.RichTextBox.prototype.getCurrentLineIndent=function() {
	var line = this.getCurrentLine()
	var lineIndent = -1
	if (line) lineIndent = parseInt(line.getAttribute("indent"))
	return lineIndent
}

editor.RichTextBox.prototype.setCurrentLineNumber=function(lineNumber) {
	var line = this.getLineWithNumber(lineNumber)
	this.removeLineInfo();
	this.moveCursorToLine(line);
	this.notifyListener(editor.LINE_CHANGE_EVENT);
	this.addLineInfo();
}


editor.RichTextBox.prototype.isLineCurrent=function(line) {
   if ( this.cursor ) {
      var currentline = CoscripterDomUtils.getParentByClass(this.cursor, "line");
       if ( currentline ) {
          return (line == currentline);
       }
   }
   return false;
}

editor.RichTextBox.prototype.getCurrentLineNumber=function() {
   var currentLine = this.getCurrentLine();
   return this.getLineNumber(currentLine);
}

editor.RichTextBox.prototype.getLineNumber=function(line) {
   if ( line ) {
       var lines = this.getLines();
       for ( var i = 0; i < lines.length; i++ ) {
          if ( line == lines[i] )
             return i;
       }
   }
   return -1;
}

editor.RichTextBox.prototype.getCurrentScriptLength=function() {
	var currentLine = this.getCurrentLine()
	var scriptDiv = currentLine.parentNode
	var firstLine = scriptDiv.firstChild
	var scriptLength = scriptDiv.childNodes.length
	return scriptLength
}

editor.RichTextBox.prototype.replaceCurrentLine=function(text) {
   var line = this.getCurrentLine();
      
   var oldtext = this.getLineText(line);
   if ( oldtext == text ) 
      return;
      
   this.removeLineInfo();
   
   var i = 0;
   var ci = this.getCursorCharIndex();
   
   // Remember cursors position
   var bn = this.findFirstCharNodeLine(line);
   var ln = this.findLeftCharNode(this.cursor);
   var rn = this.findRightCharNode(this.cursor);
   var en = this.findLastCharNodeLine(line);
   
   var lt = null;
   if ( ln )
      lt = this.getTextBetweenNodes(bn, ln);
      
   var rt = null;
   if ( rn )
      rt = this.getTextBetweenNodes(rn, en);
   
   if ( lt == null )
       i = 0;
   else if ( rt == null )
       i = text.length;
   else if ( text.indexOf(lt) == 0 ) {
       i = ci;
   }
   else if ( text.indexOf(rt) == text.length - rt.length ) {
       i = text.length - rt.length;
   }
   
   // Remove cursor
   this.cursor.parentNode.removeChild(this.cursor);
   
   // Remove option cursor
   this.removeSelectorCursors();
   
   // Replace other nodes in line
   while ( line.childNodes.length > 0 ) {
       line.removeChild(line.childNodes[0]);
   }
   
   // Add cursor at the beginning
   line.appendChild(this.cursor);
   
   this.insertText(text);
   
   // Reposition cursor
   this.moveCursorLineHome(true);
   this.moveCursorRightBy(i);
     
   this.processCurrentWord();
   
   this.addLineInfo();
}

editor.RichTextBox.prototype.moveCurrentLineNext=function() {
   this.removeLineInfo();
   this.moveCursorDown(true);
   this.moveCursorLineHome(true);
   this.addLineInfo();
   
   this.forceScrollIntoView();
}

editor.RichTextBox.prototype.moveCurrentLinePrev=function() {
   this.removeLineInfo();
   this.moveCursorUp(true);
   this.moveCursorLineHome(true);
   this.addLineInfo();
}

editor.RichTextBox.prototype.getCurrentLineText=function() {
   var currentline = this.getCurrentLine();
   return this.getLineText(currentline);
}

editor.RichTextBox.prototype.getLineWithNumber=function(linenum) { 
   var lines = this.getLines();
   
   if ( linenum >= lines.length || linenum < 0)
      return null;
   else
      return lines[linenum];
}

editor.RichTextBox.prototype.getLines=function() { 
   var lines = this.richtextbox.childNodes;
   return lines;
}

editor.RichTextBox.prototype.getLineCount=function() { 
   var lines = this.richtextbox.childNodes;
   return lines.length;
}


editor.RichTextBox.prototype.hasCurrentLineNext=function() {
   var currentline = this.getCurrentLine();
   return currentline.nextSibling;
}

editor.RichTextBox.prototype.removeLineInfo=function() {
   
   this.unmarkCurrentLine();
   return;
   
   var doc = this.location.ownerDocument;

   var lines = this.richtextbox.childNodes;
   for ( var i = 0; i < lines.length; i++ ) {
       var line = lines[i];
       
       // Remove current indicator
       CoscripterDomUtils.removeClass(line, "current");
       
       // Remove line info
       var lineinfo = line.firstChild;
       if ( lineinfo && CoscripterDomUtils.isClass(lineinfo, "lineinfo") ) {
          line.removeChild(lineinfo);
       }      
   } 
   
   this.removeCurrentLineWidget();
}

editor.RichTextBox.prototype.addLineWidget=function(line, text) {
   return;
   
   /*
   if ( !this.multiline )
      return;
      
   this.removeLineWidget(line);
   
   var doc = this.location.ownerDocument;
   
   // Add line widget div
   var linewidgetdiv = doc.createElement("SPAN");
   linewidgetdiv.setAttribute("title", "");
   linewidgetdiv.className = "linewidget";
   
	var sidebarBundle = document.getElementById("bundle-coscripter-sidebar")
	var seeWhatCoscripterThinksHere = ""; //sidebarBundle.getString("seeWhatCoscripterThinksHere")
	var doubleClickToEdit = ""; //sidebarBundle.getString("doubleClickToEdit")
   var linewidgetpopup = doc.createElement("DIV");
   linewidgetpopup.className = "linewidgetpopup hide";
   if ( text ) 
      linewidgetpopup.innerHTML = text;
   else
      linewidgetpopup.innerHTML = seeWhatCoscripterThinksHere + "...";
   
   line.appendChild(linewidgetdiv);
   line.appendChild(linewidgetpopup);
   
   var h = this;
      
   linewidgetdiv.onmouseover=function(e) {
  	   editor.RichTextBox.eventCameFromUser = true;
       editor.RichTextBox.handleLineWidgetMouseOver.call(h,e);
  	   editor.RichTextBox.eventCameFromUser = false;
   }
   
   linewidgetdiv.onmouseout=function(e) {
  	   editor.RichTextBox.eventCameFromUser = true;
       editor.RichTextBox.handleLineWidgetMouseOut.call(h,e);
  	   editor.RichTextBox.eventCameFromUser = false;
   }
   */
}

editor.RichTextBox.prototype.showLineWidget=function(line) {
    var linewidgetpopups = CoscripterDomUtils.getElementsByClass(line, "linewidgetpopup", 1);
    if ( linewidgetpopups && linewidgetpopups.length > 0 ) {
      var linewidgetpopup = linewidgetpopups[0];
      if ( linewidgetpopup && CoscripterDomUtils.isClass(linewidgetpopup, "linewidgetpopup") ) {
         CoscripterDomUtils.removeClass(linewidgetpopup, "hide");
      }
    }
}

editor.RichTextBox.prototype.hideLineWidget=function(line) {
    var linewidgetpopups = CoscripterDomUtils.getElementsByClass(line, "linewidgetpopup", 1);
    if ( linewidgetpopups && linewidgetpopups.length > 0 ) {
      var linewidgetpopup = linewidgetpopups[0];
      if ( linewidgetpopup && CoscripterDomUtils.isClass(linewidgetpopup, "linewidgetpopup") ) {
         CoscripterDomUtils.addClass(linewidgetpopup, "hide");
      }
    }
}

editor.RichTextBox.handleLineWidgetMouseOver=function(e) {
   if ( this.editing ) {
      if ( this.sample ) 
         return;

      var linewidgetdiv = e.target;
      var line = linewidgetdiv.parentNode;
      this.showLineWidget(line);      
   }
}

editor.RichTextBox.handleLineWidgetMouseOut=function(e) {
   if ( this.editing ) {
      if ( this.sample ) 
         return;
         
      var linewidgetdiv = e.target;
      var line = linewidgetdiv.parentNode;
      this.hideLineWidget(line);
   }
}


editor.RichTextBox.prototype.removeLineWidget=function(line) {  
   return;
      
   // Remove line widget
   var linewidgets = CoscripterDomUtils.getElementsByClass(line, "linewidget", 1);
   if ( !linewidgets ) 
      return;
   var linewidget = linewidgets[0];
   if ( linewidget && CoscripterDomUtils.isClass(linewidget, "linewidget") ) {
      line.removeChild(linewidget);
   }
   
   // Remove line widget popup
   var linewidgetpopups = CoscripterDomUtils.getElementsByClass(line, "linewidgetpopup", 1);
   if ( !linewidgetpopups ) 
      return;
   var linewidgetpopup = linewidgetpopups[0];
   if ( linewidgetpopup && CoscripterDomUtils.isClass(linewidgetpopup, "linewidgetpopup") ) {
      line.removeChild(linewidgetpopup);
   }
}




