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
Contributor(s): Yevgen Borodin, Jeffrey Nichols (jwnichols@us.ibm.com), Clemens Drews.

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
// Clients of Yule (e.g. the CoScripter FFox extension is a client) 
// *subscribe* to have yule *notify* them whenever any Event that interests them occurs in FFox.
// See the "Client Subscription" section below
//
// yule.js contains EventDescriptors for each type of event that it may receive from FFox. 
// When an EventDescriptor's createEvent method is called, it creates a Yule Event Object
// which it fills in and then passes to any client that subscribed to that type of Event.
//
// Note: due to a name change, the term "recorder" in this file refers to "Yule"
///////////////////////////////////////////////// 
//		
// ************************ Utility Set Class
// **************** Inheritance
// ************************ Event Base Class
// ***************** Event Descriptor Base Class
// ************* Document Level Descriptor Base Class
// ****************  Event and Descriptor Definitions
// Mouse Event
// ChangeEvent and EventDescriptor
// DojoChangeEvent and EventDescriptor
// Focus Event
// KeyDown Event
// Load Event
// DOMNodeInserted Event
// XmlHttpRequest
// Interval Event
// Timeout Event
// LocationBarChange Event
// Find Event
// Command Event
// YULEInternalEventDescriptor
// DialogCreateEvent
//
//******************* Browser
//******************* Window
//
//************* Implementation of yule recorder
// Initialization (register all DOM event descriptors)
// handleEvent (calls _notify Clients)
// observe
// Window Registration
//		_registerAllWindowsWithEventDescriptor
// Browser Registration
// Client Subscription
// 	_notifyClients
// Event Registration
// 	registerEventDescriptor
//
/////////////////////////////////////////////////

const VERSION_NUM = 1.1;
var EXPORTED_SYMBOLS = ["yule"];  

//======================================================
// Debug Section

var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

//var doConsoleDebugging = false ;
var Preferences = {
	DO_CONSOLE_DEBUGGING		: false,
	DO_DUMP_DEBUGGING 			: false,
	DEBUG_SET_USAGE 			: false,
	DEBUG_YULE 					: true,	// this must be set to true if you don't want yule to revoke your subscription for an event
											//when it gets an exception
	CLIENTEXCEPTION_DEBUGGING 	: true		// set just this Preference to true if you are only interested 
											//in finding out about client exceptions
}

function debug(msg, alwaysP){
	if (alwaysP) {
		consoleService.logStringMessage("yule: " + msg );
		return
	}
	if(Preferences.DO_CONSOLE_DEBUGGING){
		consoleService.logStringMessage("yule: " + msg );
		//consoleService.logStringMessage("yuleCoScripter: " + msg );
	}else if(Preferences.DO_DUMP_DEBUGGING){
		dump("yule: " + msg + "\n");
	}
}

//debug('parsing yule.js version: ' + VERSION_NUM);
//if (Preferences.CLIENTEXCEPTION_DEBUGGING)consoleService.logStringMessage("yule: " + 'parsing yule.js' );
//if (Preferences.CLIENTEXCEPTION_DEBUGGING)consoleService.logStringMessage("yuleCoScripter: " + 'parsing yule.js' );

// ====================================================================
// utility function to get a handle to the yule from within (window-)event callbacks

function getYule(){
	return yule ; 
}

// ********************************************************************
// ************************ Utility Set Class *************************
// ********************************************************************

function Set(){
	// TODO: why not use a hashSet?
	this._elements = [];
	return this ;
}

Set.prototype = {

	_add:function(f){
		this._elements.push(f);
	},

	_indexOf:function(f){
		var i = 0 ;
		for(i=0;i<this._elements.length;i++){
			if(this._elements[i]===f){
				return i ;
			}
		}
		return -1;
	},

	add:function(f){
		if(Preferences.DEBUG_SET_USAGE) dump('begin set.add: _elements.length=' + this._elements.length + '\n');
		if(!this.contains(f)){
			this._add(f);
		}else{
			if(Preferences.DEBUG_SET_USAGE) dump('      set.add: _elements already contained\n');
		}
		if(Preferences.DEBUG_SET_USAGE) dump('end   set.add: _elements.length=' + this._elements.length + '\n');
	},

	addArray:function(f){
		for(var i = 0; i < f.length; i++)
			this.add(f[i]);
	},

	size:function(f){
		return this._elements.length;
	},

	// TODO: why is this not using Array.pop(f)?
	remove:function(f){
		if(Preferences.DEBUG_SET_USAGE) dump('begin set.remove: elements.length=' + this._elements.length + '\n');
		if(this.contains(f)){
			var index = this._indexOf(f);
			var removed = this._elements.splice(index,1);
		}else{
			if(Preferences.DEBUG_SET_USAGE) dump('      set.remove: _elements not!!! contained\n');
		}
		if(Preferences.DEBUG_SET_USAGE) dump('end   set.remove: elements.lenth=' + this._elements.length + '\n');
	},

	contains:function(f){
		return this._indexOf(f)!= -1;
	},

	elements: function(){
		return this._elements ;
	}
};

// ====================================================================
// END Set Class
// ====================================================================

// ********************************************************************
// **************** Inheritance Convenience Methods *******************
// ********************************************************************

/** Inheritance convenience class adopted under BSD license from:
 * 		http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
 *		http://www.kevlindev.com/license.txt 
 * Example of Use:
 * 		JSInheritance.extend(MouseEvent, Event);
 * 		MouseEvent.superClass.funcName.call(this[, params]);
 * 		MouseEvent.baseConstructor.call(this[, params]);
 * @param subClass
 * @param baseClass
 */
JSInheritance = {};
JSInheritance.extend = function(subClass, baseClass) {
   function inheritance() {}
   inheritance.prototype = baseClass.prototype;

   subClass.prototype = new inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}

// ====================================================================
// End Inheritance convenience methods
// ====================================================================

// ********************************************************************
// ************************ Event Base Class **************************
// ********************************************************************

function Event(evt){
	if(typeof(evt) != "undefined"){ // this constructor may be called by the derived class at object instantiation
		/* get the event target object from event object */ 
	 	if(evt != null){ // this block is ONLY for DOM events 
			this.target = evt.target;
			this.originalTarget = evt.originalTarget;
			// Dialog boxes set target to the dialog box.  Need to use the originalTarget (AC)
			// contextualMenu right-click has target.nodeName = "menuitem"
			if (this.target.nodeName == "dialog") this.target = evt.originalTarget;
			if(this.target.ownerDocument)
				this.URL = this.target.ownerDocument.URL;
			else if(this.target.nodeType == 9) // document node
				this.URL = this.target.URL;
	 	}	
		/* Set the timestamp at the Event creation
		 * Date().getTime() - returns Linux epoch timestamp
		 * evt.timeStamp returns a smaller number, and returns 0 for mutation events */
		this.timestamp = new Date().getTime();
	}
	else 	// this constructor will be called from the derived class at parse time
	{
		this.type = null;
		this.timestamp = null;
		this.target	= null;
		this.originalTarget	= null;
		this.targetXpath = null;
		this.browserID = null;
		this.windowID = null;
		this.URL = null;
	}
}

Event.prototype = {
	
	getType:function(){
		return this.type ;
	},
	
	setURL:function(url){
		this.URL = url ;
	},
	
	getURL:function(){
		return this.URL ;
	},
	
	setTarget:function(target){
		this.target = target ;
	},
	
	getTarget:function(){
		return this.target ;
	},

	hasTarget:function(){
		return (this.target != null);
	},
	
	setOriginalTarget:function(originalTarget){
		this.originalTarget = originalTarget ;
	},
	
	getOriginalTarget:function(){
		return this.originalTarget ;
	},

	hasOriginalTarget:function(){
		return (this.originalTarget != null);
	},
	
	setTargetXpath:function(targetXpath){
		this.targetXpath = targetXpath ;
	},
	
	getTargetXpath:function(){
		return this.targetXpath;
	},
	
	setBrowserID: function(browserID){
		this.browserID = browserID ;
	},
	getBrowserID: function(){
		return this.browserID;
	},
	
	setWindowID: function(windowID){
		this.windowID = windowID ;
	},
	
	getWindowID: function(){
		return this.windowID;
	},

	setTimeStamp: function(timestamp){
		this.timestamp = timestamp;
	},

	getTimeStamp: function(){
		return this.timestamp;
	},
	
	cleanUpContext: function(){
		// this method clears out any references to external elements
		// or documents that may exist within the event object
		this.target = null;
	},

	completeInContext: function(browser){
		// this method finds a new value for the target based on the 
		// document parameter and the targetXpath member variable
		var document = browser.contentDocument;
		this.target = document.evaluate(this.targetXpath, document, null, 9, null).singleNodeValue;

		return this.target;
	},

	hasContext: function(){
		return (this.target != null);
	},
};

// ====================================================================
// END Event Base Class
// ====================================================================

// ********************************************************************
// ***************** Event Descriptor Base Class **********************
// ********************************************************************
function EventDescriptor(recorder, EventObj, type){ 
	if(typeof(recorder) != "undefined"){ // this constructor may be called by the derived class at object instantiation
		this.recorder = recorder;
		this.EventObj = EventObj;
		this.type = type;
	}
	else {	// this constructor will be called from the derived class at parse time
		this.recorder = null;
		this.EventObj = null;
		this.type =  null;
	}
}

EventDescriptor.prototype= {
	register: function(obj){	// obj is a winObj or a browserObj. Has id, EventHandlersMap, browser or window
		var descriptor = this;	//  e.g. ClickEventDescriptor
		var recorder = this.recorder;	// has _BroswerCounter, _WindowCounter, _activeBrowserEventSet, etc
		obj.EventHandlersMap[this.type] = function(domEvent) {	// e.g. this.type = "click"
			recorder.handleEvent(domEvent, obj, descriptor);
		};

		if (obj.isBrowser())
		{
			debug(this.type + 'EventDescriptor: registering on browser id=' +  obj.id);
			obj.browser.addEventListener(this.type, obj.EventHandlersMap[this.type], true);
		}
		else if (obj.isWindow())
		{
			debug(this.type + 'EventDescriptor: registering on window id=' +  obj.id + ' ' + obj.win.document.documentURI);
			obj.win.addEventListener(this.type, obj.EventHandlersMap[this.type], true);
		}
		// TODO: should the clients be able to set the last parameter (true/false)?  
	},
	
	unregister: function(obj){
		if (obj.isBrowser())
		{
			obj.browser.removeEventListener(this.type, obj.EventHandlersMap[this.type], true);
		}
		else if (obj.isWindow())
		{
			obj.win.removeEventListener(this.type, obj.EventHandlersMap[this.type], true);
		}
		// TODO: should the clients be able to set the last parameter (true/false)?  
	},
	
	// recorder.handleEvent calls _notifyCients which calls createEvent 
	//and then passes the created Event as the parameter of the client's callback
	createEvent: function(domEvent, obj){
		debug(this.type + 'EventDescriptor: in createEvent ' +  domEvent);
		var event = new this.EventObj(domEvent);

		if (obj.isBrowser())
		{
			event.setWindowID(obj.winObj.id);
			event.setBrowserID(obj.id);
		}
		else if (obj.isWindow())
		{
			event.setWindowID(obj.id);
			event.setBrowserID(obj.getSelectedBrowserId());
		}

		debug(this.type + 'EventDescriptor: done createEvent');
		return event;
	}
};

// ====================================================================
// END Event Descriptor Base Class
// ====================================================================

// ********************************************************************
// ************* Document Level Descriptor Base Class *****************
// ********************************************************************
function DocLoadEventDescriptor(recorder, EventObj, type){ 
	if(typeof(recorder) != "undefined"){ // this constructor may be called by the derived class at object instantiation
		this.recorder = recorder;
		this.EventObj = EventObj;
		this.type = type;
	}
	else {	// this constructor will be called from the derived class at parse time
		this.recorder = null;
		this.EventObj = null;
		this.type =  null;
	}
}

DocLoadEventDescriptor.prototype= {

	register: function(browserObj){
		debug("This.type is " + this.type);
		debug(this.type + "EventDescriptor: registering on browser's frames " +  browserObj);

		var descriptor = this;
		var recorder = this.recorder;
		browserObj.EventHandlersMap[this.type] = function(domEvent) {
			recorder.handleEvent(domEvent, browserObj, descriptor);
		};

		// This adds a load event listener to the browser, which then adds the actual event listener to each frame   
		browserObj.EventHandlersMap["load" + this.type] = function(domEvent) {
			// domEvent.target should be the loaded document
			domEvent.target.addEventListener(descriptor.type, browserObj.EventHandlersMap[descriptor.type], true);
			// Load event is expected to be thrown for every loaded frame - there is no need recurse for the frames
		};
		// add load event listeners to the browser so that on every load event mutation listener is restored 
		browserObj.browser.addEventListener("load", browserObj.EventHandlersMap["load" + this.type], true);
		// add mutation event listener to the current browser and all frames
		browserObj.browser.contentDocument.addEventListener(this.type, browserObj.EventHandlersMap[this.type], true);
		var allFrames = browserObj.browser.contentWindow.frames;
		for (var i = 0; i < allFrames.length; i++) // for every frame of the given browser add mutation events to every document
			allFrames[i].document.addEventListener(this.type, browserObj.EventHandlersMap[this.type], true);
	},

	unregister: function(browserObj){
		// remove load event listeners from the browser to stop adding mutation listeners on every load events 
		browserObj.browser.removeEventListener("load", browserObj.EventHandlersMap["load" + this.type], true);
		// remove mutation event listeners from the current browser and all frames
		browserObj.browser.contentDocument.removeEventListener(this.type, browserObj.EventHandlersMap[this.type], true);
		var allFrames = browserObj.browser.contentWindow.frames;
		for (var i = 0; i < allFrames.length; i++) // for every frame in the given browser remove mutation events from every document
			allFrames[i].document.removeEventListener(this.type, browserObj.EventHandlersMap[this.type], true);
	},
	
	createEvent: function(domEvent, browserObj){
		debug(this.type + 'EventDescriptor: in createEvent ' +  domEvent);
		var event = new this.EventObj(domEvent);
		event.setWindowID(browserObj.winObj.id);
		event.setBrowserID(browserObj.id);
		debug(this.type + 'EventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// END DocLoadEvent Descriptor
// ============================================================

// ********************************************************************
// ****************  Event and Descriptor Definitions *****************
// ********************************************************************

//*************************** SCROLL EVENTS ***************************

//============================================================
//Scroll Event Class and Event Descriptor
//============================================================
var SCROLL_EVENT = "scroll";

JSInheritance.extend(ScrollEvent, Event);

function ScrollEvent(evt){
	ScrollEvent.baseConstructor.call(this, evt);
	this.type = SCROLL_EVENT;
}

JSInheritance.extend(ScrollEventDescriptor, EventDescriptor);
function ScrollEventDescriptor(recorder){
	ScrollEventDescriptor.baseConstructor.call(this, recorder, ScrollEvent, SCROLL_EVENT);
}


// *************************** MOUSE EVENTS ***************************

// ============================================================
// Mouse Event Base Class
// ============================================================
JSInheritance.extend(MouseEvent, Event);

function MouseEvent(evt){
	MouseEvent.baseConstructor.call(this, evt);

	if(typeof(evt) != "undefined"){ // this constructor may be called by the derived class at object instantiation
		this.x = evt.clientX;
		this.y = evt.clientY;
		var macP = false
		if (evt.view && evt.view.navigator) {
			var platform =  evt.view.navigator.platform
			if (platform.indexOf("Mac") != -1) macP = true
		}
		this.controlKeyDown = macP ? evt.metaKey : evt.ctrlKey; // indicates whether the control key was down
		this.shiftKeyDown = evt.shiftKey; // indicates whether the shift key was down
		this.altKeyDown = evt.altKey; // indicates whether the alt / option key was down
	}
	else 	// this constructor will be called from the derived class at parse time
	{
		this.x = null;
		this.y = null;
		this.controlKeyDown = null; // indicates whether the control key was down
	}
}

MouseEvent.prototype.setCoordinates = function (x,y){
	this.x=x;
	this.y=y;
};

MouseEvent.prototype.getCoordinates = function (){
	return {x:this.x,y:this.y};
};

MouseEvent.prototype.getControlKeyDown = function (){
	return this.controlKeyDown;
};

// ============================================================
// Click Event and EventDescriptor
// ============================================================
var CLICK_EVENT = "click";

JSInheritance.extend(ClickEvent, MouseEvent);
function ClickEvent(evt){
	ClickEvent.baseConstructor.call(this, evt);
	this.type = CLICK_EVENT;
}

JSInheritance.extend(ClickEventDescriptor, EventDescriptor);
function ClickEventDescriptor(recorder){
	ClickEventDescriptor.baseConstructor.call(this, recorder, ClickEvent, CLICK_EVENT);
}

// ============================================================
// DblClick Event and EventDescriptor
// ============================================================
var DBL_CLICK_EVENT = "dblclick";

JSInheritance.extend(DblClickEvent, MouseEvent);
function DblClickEvent(evt){
	DblClickEvent.baseConstructor.call(this, evt);
	this.type = DBL_CLICK_EVENT;
}

JSInheritance.extend(DblClickEventDescriptor, EventDescriptor);
function DblClickEventDescriptor(recorder){
	DblClickEventDescriptor.baseConstructor.call(this, recorder, DblClickEvent, DBL_CLICK_EVENT);
}

// ============================================================
// MouseDown Event and EventDescriptor
// ============================================================
var MOUSE_DOWN_EVENT = "mousedown";

JSInheritance.extend(MouseDownEvent, MouseEvent);
function MouseDownEvent(evt){
	MouseDownEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_DOWN_EVENT;
}

JSInheritance.extend(MouseDownEventDescriptor, EventDescriptor);
function MouseDownEventDescriptor(recorder){
	MouseDownEventDescriptor.baseConstructor.call(this, recorder, MouseDownEvent, MOUSE_DOWN_EVENT);
}

// ============================================================
// MouseUp Event and EventDescriptor
// ============================================================
var MOUSE_UP_EVENT = "mouseup";

JSInheritance.extend(MouseUpEvent, MouseEvent);
function MouseUpEvent(evt){
	MouseUpEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_UP_EVENT;
}

JSInheritance.extend(MouseUpEventDescriptor, EventDescriptor);
function MouseUpEventDescriptor(recorder){
	MouseUpEventDescriptor.baseConstructor.call(this, recorder, MouseUpEvent, MOUSE_UP_EVENT);
}

// ============================================================
// MouseOver Event and EventDescriptor
// ============================================================
var MOUSE_OVER_EVENT = "mouseover";

JSInheritance.extend(MouseOverEvent, MouseEvent);
function MouseOverEvent(evt){
	MouseOverEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_OVER_EVENT;
}

JSInheritance.extend(MouseOverEventDescriptor, EventDescriptor);
function MouseOverEventDescriptor(recorder){
	MouseOverEventDescriptor.baseConstructor.call(this, recorder, MouseOverEvent, MOUSE_OVER_EVENT);
}

// ============================================================
// MouseMove Event and EventDescriptor
// ============================================================
var MOUSE_MOVE_EVENT = "mousemove";

JSInheritance.extend(MouseMoveEvent, MouseEvent);
function MouseMoveEvent(evt){
	MouseMoveEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_MOVE_EVENT;
}

JSInheritance.extend(MouseMoveEventDescriptor, EventDescriptor);
function MouseMoveEventDescriptor(recorder){
	MouseMoveEventDescriptor.baseConstructor.call(this, recorder, MouseMoveEvent, MOUSE_MOVE_EVENT);
}

// ============================================================
// MouseOut Event and EventDescriptor
// ============================================================
var MOUSE_OUT_EVENT = "mouseout";

JSInheritance.extend(MouseOutEvent, MouseEvent);
function MouseOutEvent(evt){
	MouseOutEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_OUT_EVENT;
}

JSInheritance.extend(MouseOutEventDescriptor, EventDescriptor);
function MouseOutEventDescriptor(recorder){
	MouseOutEventDescriptor.baseConstructor.call(this, recorder, MouseOutEvent, MOUSE_OUT_EVENT);
}

// ============================================================
// MouseMultiWheel Event and EventDescriptor
// ============================================================
var MOUSE_MULTI_WHEEL_EVENT = "mousemultiwheel";

JSInheritance.extend(MouseMultiWheelEvent, MouseEvent);
function MouseMultiWheelEvent(evt){
	MouseMultiWheelEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_MULTI_WHEEL_EVENT;
}

JSInheritance.extend(MouseMultiWheelEventDescriptor, EventDescriptor);
function MouseMultiWheelEventDescriptor(recorder){
	MouseMultiWheelEventDescriptor.baseConstructor.call(this, recorder, MouseMultiWheelEvent, MOUSE_MULTI_WHEEL_EVENT);
}

// ============================================================
// MouseWheel Event and EventDescriptor
// ============================================================
var MOUSE_WHEEL_EVENT = "mousewheel";

JSInheritance.extend(MouseWheelEvent, MouseEvent);
function MouseWheelEvent(evt){
	MouseWheelEvent.baseConstructor.call(this, evt);
	this.type = MOUSE_WHEEL_EVENT;
}

JSInheritance.extend(MouseWheelEventDescriptor, EventDescriptor);
function MouseWheelEventDescriptor(recorder){
	MouseWheelEventDescriptor.baseConstructor.call(this, recorder, MouseWheelEvent, MOUSE_WHEEL_EVENT);
}

// *************************** OTHER EVENTS ***************************

// ============================================================
// ChangeEvent and EventDescriptor
// ============================================================
var CHANGE_EVENT = "change";

JSInheritance.extend(ChangeEvent, Event);
function ChangeEvent(evt){
    ChangeEvent.baseConstructor.call(this, evt);
    this.type = CHANGE_EVENT;

    if (evt != null){
        this.setText(evt.target.value);
    }
}

ChangeEvent.prototype.getText = function(){
    return this.text;
};
ChangeEvent.prototype.setText = function(text){
    this.text = text;
};

JSInheritance.extend(ChangeEventDescriptor, EventDescriptor);
function ChangeEventDescriptor(recorder){ 
    ChangeEventDescriptor.baseConstructor.call(this, recorder, ChangeEvent, CHANGE_EVENT);
}

// ** This code is not used, because Yule does not capture Custom events.
// ============================================================
// DojoChangeEvent and EventDescriptor
// ============================================================

var DOJO_CHANGE_EVENT = "CoScripterDojoOnChange";

JSInheritance.extend(DojoChangeEvent, Event);
function DojoChangeEvent(evt){
    DojoChangeEvent.baseConstructor.call(this, evt);
    this.type = DOJO_CHANGE_EVENT;

    if (evt != null){
        this.setText(evt.target.value);
    }
}

DojoChangeEvent.prototype.getText = function(){
    return this.text;
};
DojoChangeEvent.prototype.setText = function(text){
    this.text = text;
};

JSInheritance.extend(DojoChangeEventDescriptor, EventDescriptor);
function DojoChangeEventDescriptor(recorder){ 
    DojoChangeEventDescriptor.baseConstructor.call(this, recorder, DojoChangeEvent, DOJO_CHANGE_EVENT);
}

// ============================================================
// Focus Event and EventDescriptor
// ============================================================

var FOCUS_EVENT = "focus";

JSInheritance.extend(FocusEvent, Event);
function FocusEvent(evt){
	FocusEvent.baseConstructor.call(this, evt);
	this.type = FOCUS_EVENT;
}

JSInheritance.extend(FocusEventDescriptor, EventDescriptor);
function FocusEventDescriptor(recorder){ 
	FocusEventDescriptor.baseConstructor.call(this, recorder, FocusEvent, FOCUS_EVENT);
}

// ============================================================
// KeyDown Event and EventDescriptor
// ============================================================

var KEY_DOWN_EVENT = "keydown";

JSInheritance.extend(KeyDownEvent, Event);
function KeyDownEvent(evt){
	KeyDownEvent.baseConstructor.call(this, evt);
	this.type = KEY_DOWN_EVENT;
}

JSInheritance.extend(KeyDownEventDescriptor, EventDescriptor);
function KeyDownEventDescriptor(recorder){ 
	KeyDownEventDescriptor.baseConstructor.call(this, recorder, KeyDownEvent, KEY_DOWN_EVENT);
}

// ============================================================
// Load Event and EventDescriptor
// ============================================================

var LOAD_EVENT = "load";

JSInheritance.extend(LoadEvent, Event);
function LoadEvent(evt){
	LoadEvent.baseConstructor.call(this, evt);
	this.type = LOAD_EVENT;
}

JSInheritance.extend(LoadEventDescriptor, EventDescriptor);
function LoadEventDescriptor(recorder){ 
	LoadEventDescriptor.baseConstructor.call(this, recorder, LoadEvent, LOAD_EVENT);
}

// ============================================================
// DOMNodeInserted Event and EventDescriptor
// ============================================================

var DOM_NODE_INSERTED_EVENT = "DOMNodeInserted";

JSInheritance.extend(DOMNodeInsertedEvent, Event);
function DOMNodeInsertedEvent(evt){
	DOMNodeInsertedEvent.baseConstructor.call(this, evt);
	this.type = DOM_NODE_INSERTED_EVENT;
}

JSInheritance.extend(DOMNodeInsertedEventDescriptor, DocLoadEventDescriptor);
function DOMNodeInsertedEventDescriptor(recorder){ 
	DOMNodeInsertedEventDescriptor.baseConstructor.call(this, recorder, DOMNodeInsertedEvent, DOM_NODE_INSERTED_EVENT);
}

// ============================================================
// DOMNodeRemoved Event and EventDescriptor
// ============================================================

var DOM_NODE_REMOVED_EVENT = "DOMNodeRemoved";

JSInheritance.extend(DOMNodeRemovedEvent, Event);
function DOMNodeRemovedEvent(evt){
	DOMNodeRemovedEvent.baseConstructor.call(this, evt);
	this.type = DOM_NODE_REMOVED_EVENT;
}

JSInheritance.extend(DOMNodeRemovedEventDescriptor, DocLoadEventDescriptor);
function DOMNodeRemovedEventDescriptor(recorder){ 
	DOMNodeRemovedEventDescriptor.baseConstructor.call(this, recorder, DOMNodeRemovedEvent, DOM_NODE_REMOVED_EVENT);
}

// ============================================================
// DOMAttrModified Event and EventDescriptor
// ============================================================

var DOM_ATTR_MODIFIED_EVENT = "DOMAttrModified";

JSInheritance.extend(DOMAttrModifiedEvent, Event);
function DOMAttrModifiedEvent(evt){
	DOMAttrModifiedEvent.baseConstructor.call(this, evt);
	this.type = DOM_ATTR_MODIFIED_EVENT;
}

JSInheritance.extend(DOMAttrModifiedEventDescriptor, DocLoadEventDescriptor);
function DOMAttrModifiedEventDescriptor(recorder){ 
	DOMAttrModifiedEventDescriptor.baseConstructor.call(this, recorder, DOMAttrModifiedEvent, DOM_ATTR_MODIFIED_EVENT);
}

// ============================================================
// Interval Event and EventDescriptor
// ============================================================

var INTERVAL_EVENT = "interval";
var INTERVAL_SET = "set";
var INTERVAL_CLEAR = "clear";
var INTERVAL_CALL = "call";

JSInheritance.extend(IntervalEvent, Event);
function IntervalEvent(evt){
	IntervalEvent.baseConstructor.call(this, null);
	this.type = INTERVAL_EVENT;
	this.subtype = evt.subtype; // possible values: INTERVAL_SET, INTERVAL_CLEAR, INTERVAL_CALL
	this.id = evt.id;
}
IntervalEvent.prototype.setID = function(id){ this.id = id;	}
IntervalEvent.prototype.getID = function(){ return this.id; }
IntervalEvent.prototype.setSubtype = function(subtype){ this.subtype = subtype; }
IntervalEvent.prototype.getSubtype = function(){ return this.subtype; }

function IntervalEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = INTERVAL_EVENT;
	this.isRegistered = false;
}
IntervalEventDescriptor.prototype = {
	register: function(obj){ this.isRegistered = true; },
	unregister: function(obj){ this.isRegistered = false; },
	wrap: function(obj){
		var descriptor = this;
		var recorder = this.recorder;
		
		var wrapInterval = function(){
			var contentWindow = obj.browser.contentWindow;

			if("isIntervalYuleWrapped" in contentWindow) // prevent double wrapping
				return;
			contentWindow.isIntervalYuleWrapped = null;
			// wrapping ClearInterval
			var nativeClearInterval = contentWindow.wrappedJSObject.clearInterval;
			obj.EventHandlersMap[descriptor.type + "Clear" + "wr"] = {
				originalClearInterval : nativeClearInterval,
				newClearInterval : function(intervalID){ 
					if(descriptor.isRegistered) // clearInterval is intercepted, handle only if registered
						recorder.handleEvent({"id": intervalID, "subtype": INTERVAL_CLEAR}, obj, descriptor); // Interval Clear event
					return nativeClearInterval(intervalID);
				}
			};
			contentWindow.wrappedJSObject.clearInterval = obj.EventHandlersMap[descriptor.type + "Clear" + "wr"].newClearInterval; 

			// wrapping SetInterval
			var nativeSetInterval = contentWindow.wrappedJSObject.setInterval;

			obj.EventHandlersMap[descriptor.type + "Set" + "wr"] = {
				originalSetInterval : nativeSetInterval,
				newSetInterval : function(callBack, time){ 
					var CallBackWrapper = function(){ 
						if(descriptor.isRegistered) // Interval is callBack intercepted, handle only if registered
							recorder.handleEvent({"id": intervalID, "subtype": INTERVAL_CALL}, obj, descriptor); // Interval Call event
						// call the original callback function
						if(typeof(callBack) == 'function') {
							callBack();
						} 
						else {
							try {
								eval("contentWindow.wrappedJSObject." + callBack);
							} catch (e) {
								dump('Error evaluating wrapped interval callback: '
									+ e + '\n');
							}
						}
					};
					//TODO recorder.handleEvent(domEvent, obj, descriptor); // set interval event
					var intervalID = nativeSetInterval(CallBackWrapper, time);
						if(descriptor.isRegistered) // IntervalSet is intercepted, handle only if registered
							recorder.handleEvent({"id": intervalID, "subtype": INTERVAL_SET}, obj, descriptor); // Interval Set event
					return intervalID;
				},
			}
			contentWindow.wrappedJSObject.setInterval = obj.EventHandlersMap[descriptor.type + "Set" + "wr"].newSetInterval; 
		}
		
		// Progress Listener is needed to rewrap the native functions after page load 
		obj.EventHandlersMap[descriptor.type + "pl"] = {
			stateIsRequest:false,
	
			QueryInterface : function(aIID) {
				if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports))
					return this;
				throw Components.results.NS_NOINTERFACE;
			},
		
			onStateChange: function(aProgress, aRequest, aFlag, aStatus){
	    		if(aFlag & Components.interfaces.nsIWebProgressListener.STATE_START){
					wrapInterval();
		   		}
		   		return 0;
		  	},

			onLocationChange 	: function(aProgress,aRequest,aLocation) { return 0; },
			onProgressChange 	: function(a,b,c,d,e,f){ return 0; },
			onStatusChange 		: function(a,b,c,d){ return 0; },
			onSecurityChange 	: function(a,b,c){ return 0; },
		};

		debug(this.type + 'EventDescriptor: registering on browser ' +  obj);
		obj.browser.addProgressListener(obj.EventHandlersMap[this.type + "pl"], Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
		// TODO: should the clients be able to set the last parameter (true/false)?
	},
	
	unwrap: function(obj){
		obj.browser.contentWindow.wrappedJSObject.clearInterval = obj.EventHandlersMap[this.type  + "Clear" + "wr"].originalClearInterval;
		obj.browser.contentWindow.wrappedJSObject.setInterval = obj.EventHandlersMap[this.type + "Set" + "wr"].originalSetInterval;
		obj.browser.removeProgressListener(obj.EventHandlersMap[this.type + "pl"], Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
		// TODO: should the clients be able to set the last parameter (true/false)?  
	},
	
	createEvent: function(e, obj){
		debug(this.type + 'EventDescriptor: in createEvent with id: ' + e.id + ' subtype: ' + e.subtype);
		var event = new IntervalEvent(e);
		event.setWindowID(obj.winObj.id);
		event.setBrowserID(obj.id);
		debug(this.type + 'EventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// Timeout Event and EventDescriptor
// ============================================================

var TIMEOUT_EVENT = "timeout";
var TIMEOUT_SET = "set";
var TIMEOUT_CLEAR = "clear";
var TIMEOUT_CALL = "call";

JSInheritance.extend(TimeoutEvent, Event);
function TimeoutEvent(evt){
	TimeoutEvent.baseConstructor.call(this, null); 
	this.type = TIMEOUT_EVENT;
	this.subtype = evt.subtype; // possible values: INTERVAL_SET, INTERVAL_CLEAR, INTERVAL_CALL
	this.id = evt.id;
}
TimeoutEvent.prototype.setID = function(id){ this.id = id ; }
TimeoutEvent.prototype.getID = function(){ return this.id; }
TimeoutEvent.prototype.setSubtype = function(subtype){ this.subtype = subtype; }
TimeoutEvent.prototype.getSubtype = function(){ return this.subtype; }

function TimeoutEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = TIMEOUT_EVENT;
	this.isRegistered = false;
}

TimeoutEventDescriptor.prototype = {
	register: function(obj){ this.isRegistered = true; },
	unregister: function(obj){ this.isRegistered = false; },
	wrap: function(obj){
		dump("(not) Wrapping timeout event\n");
		return;
		var descriptor = this;
		var recorder = this.recorder;
		
		var wrapTimeout = function(){
			var contentWindow = obj.browser.contentWindow;

			if("isTimeoutYuleWrapped" in contentWindow) // prevent double wrapping
				return;
			contentWindow.isTimeoutYuleWrapped = null;

			// wrapping ClearTimeout
			var nativeClearTimeout = contentWindow.wrappedJSObject.clearTimeout;
			obj.EventHandlersMap[descriptor.type + "Clear" + "wr"] = {
				originalClearTimeout : nativeClearTimeout,
				newClearTimeout : function(timeoutID){ 
					if(descriptor.isRegistered) // clearTimeout is intercepted, handle only if registered
						recorder.handleEvent({"id": timeoutID, "subtype": TIMEOUT_CLEAR}, obj, descriptor); // Timeout Clear event
					return nativeClearTimeout(timeoutID);
				}
			};
			contentWindow.wrappedJSObject.clearTimeout = obj.EventHandlersMap[descriptor.type + "Clear" + "wr"].newClearTimeout; 

			// wrapping SetTimeout
			var nativeSetTimeout = contentWindow.wrappedJSObject.setTimeout;

			if(!("_isYuleWrapped" in nativeSetTimeout)){	// prevent double wrapping
				obj.EventHandlersMap[descriptor.type + "Set" + "wr"] = {
					originalSetTimeout : nativeSetTimeout,
					newSetTimeout : function(callBack, time){ 
						var CallBackWrapper = function(){ 
							if(descriptor.isRegistered) // Timeout is callBack intercepted, handle only if registered
								recorder.handleEvent({"id": timeoutID, "subtype": TIMEOUT_CALL}, obj, descriptor); // Timeout Call event
							// call the original callback function
							if(typeof(callBack) == 'function') {
								callBack();
							} 
							else {
								try {
									eval("contentWindow.wrappedJSObject.__yuleCallback = function() {" + callBack + "}; contentWindow.wrappedJSObject.__yuleCallback();");
								} catch (e) {
									dump('Error evaluating wrapped timeout callback: '
										+ e + '\n');
									// Unable to evaluate the callback
								}
							}
						};
						//TODO recorder.handleEvent(domEvent, obj, descriptor); // set Timeout event
						var timeoutID = nativeSetTimeout(CallBackWrapper, time);
							if(descriptor.isRegistered) // TimeoutSet is intercepted, handle only if registered
								recorder.handleEvent({"id": timeoutID, "subtype": TIMEOUT_SET}, obj, descriptor); // Timeout Set event
						return timeoutID;
					},
				}
				obj.EventHandlersMap[descriptor.type + "Set" + "wr"].newSetTimeout._isYuleWrapped = true;
				contentWindow.wrappedJSObject.setTimeout = obj.EventHandlersMap[descriptor.type + "Set" + "wr"].newSetTimeout; 
			}
		}
		
		// Progress Listener is needed to rewrap the native functions after page load 
		obj.EventHandlersMap[descriptor.type + "pl"] = {
			stateIsRequest:false,
			
			QueryInterface : function(aIID) {
				if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports))
					return this;
				throw Components.results.NS_NOINTERFACE;
			},
		
			onStateChange: function(aProgress, aRequest, aFlag, aStatus){
	    		if(aFlag & Components.interfaces.nsIWebProgressListener.STATE_START){
					wrapTimeout();
		   		}
		   		return 0;
		  	},

			onLocationChange 	: function(aProgress,aRequest,aLocation) { return 0; },
			onProgressChange 	: function(a,b,c,d,e,f){ return 0; },
			onStatusChange 		: function(a,b,c,d){ return 0; },
			onSecurityChange 	: function(a,b,c){ return 0; },
		};

		debug(this.type + 'EventDescriptor: registering on browser ' +  obj);
		obj.browser.addProgressListener(obj.EventHandlersMap[this.type + "pl"], Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
		// TODO: should the clients be able to set the last parameter (true/false)?
	},
	
	unwrap: function(obj){
		obj.browser.contentWindow.wrappedJSObject.clearTimeout = obj.EventHandlersMap[this.type  + "Clear" + "wr"].originalClearTimeout;
		obj.browser.contentWindow.wrappedJSObject.setTimeout = obj.EventHandlersMap[this.type + "Set" + "wr"].originalSetTimeout;
		obj.browser.removeProgressListener(obj.EventHandlersMap[this.type + "pl"], Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
		// TODO: should the clients be able to set the last parameter (true/false)?  
	},
	
	createEvent: function(e, obj){
		debug(this.type + 'EventDescriptor: in createEvent with id: ' + e.id + ' subtype: ' + e.subtype);
		var event = new TimeoutEvent(e);
		event.setWindowID(obj.winObj.id);
		event.setBrowserID(obj.id);
		debug(this.type + 'EventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// LocationBarChange Event and EventDescriptor
// ============================================================

var LOCATION_BAR_CHANGE_EVENT = "LocationBarChangeEvent";

JSInheritance.extend(LocationBarChangeEvent, Event);
function LocationBarChangeEvent(url){
	LocationBarChangeEvent.baseConstructor.call(this, null); 
	this.URL = url;
	this.type = LOCATION_BAR_CHANGE_EVENT;
}

function LocationBarChangeEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = LOCATION_BAR_CHANGE_EVENT;
}

LocationBarChangeEventDescriptor.prototype= {
	register: function(winObj){
		var descriptor = this;
		var recorder = this.recorder;

		winObj.EventHandlersMap[this.type] = {
			originalMethod : winObj.win.handleURLBarCommand,
			newMethod : function() {
				try	{
					var window = winObj.win
					var arg1 = arguments[0]
					var url = null
					if (("gURLBar" in window) && window.gURLBar && ("value" in window.gURLBar)) url = window.gURLBar.value
					var url2 = window.document.getElementById("urlbar").value
					debug("url2 is " + url2)
				
					recorder.handleEvent(url, winObj, descriptor);     
			    }
			    catch(ex){
					debug(ex)
				}
				
				return winObj.EventHandlersMap[descriptor.type].originalMethod();
			},
		};

		winObj.win.handleURLBarCommand = winObj.EventHandlersMap[this.type].newMethod;
	},
	
	unregister: function(winObj){
		winObj.win.handleURLBarCommand = winObj.EventHandlersMap[this.type].originalMethod;
		delete winObj.EventHandlersMap[this.type];
	},
	
	createEvent: function(url, winObj){
		debug(this.type + 'LocationBarChangeEventDescriptor: in createEvent ' +  url);
		var event = new LocationBarChangeEvent(url);

		event.setWindowID(winObj.id);
		event.setBrowserID(winObj.getSelectedBrowserId());

		debug(this.type + 'LocationBarChangeEventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// LoadURI Event and EventDescriptor
// ============================================================

var LOAD_URI_EVENT = "LoadURIEvent";

JSInheritance.extend(LoadURIEvent, Event);
function LoadURIEvent(url){
	LoadURIEvent.baseConstructor.call(this, null); 
	this.URL = url;
	this.type = LOAD_URI_EVENT;
}

function LoadURIEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = LOAD_URI_EVENT;
}

LoadURIEventDescriptor.prototype= {
	register: function(obj){
		var descriptor = this;
		var recorder = this.recorder;
		var objWithLoadURI = obj.isBrowser() ? obj.browser : obj.win;
		var loadMethodName = obj.isBrowser() ? "loadURIWithFlags" : "loadURI";
		
		obj.EventHandlersMap[this.type] = {
			originalMethod : objWithLoadURI[loadMethodName],
			newMethod : function() {
				try	{
					var url = arguments[0]
				
					recorder.handleEvent(url, obj, descriptor);     
			    }
			    catch(ex){
					debug(ex)
				}
				
				return obj.EventHandlersMap[descriptor.type].originalMethod.apply(objWithLoadURI, arguments);
			},
		};

		objWithLoadURI[loadMethodName] = obj.EventHandlersMap[this.type].newMethod;
	},
	
	unregister: function(obj){
		var objWithLoadURI = obj.isBrowser() ? obj.browser : obj.win;
		var loadMethodName = obj.isBrowser() ? "loadURIWithFlags" : "loadURI";

		objWithLoadURI[loadMethodName] = obj.EventHandlersMap[this.type].originalMethod;
		delete obj.EventHandlersMap[this.type];
	},
	
	createEvent: function(url, obj){
		debug(this.type + 'LoadURIEventDescriptor: in createEvent ' +  url);
		var event = new LoadURIEvent(url);

		if (obj.isBrowser())
		{
			event.setWindowID(obj.winObj.id);
			event.setBrowserID(obj.id);
		}
		else 
		{
			event.setWindowID(obj.id);
			event.setBrowserID(obj.getSelectedBrowserId());
		}

		debug(this.type + 'LoadURIEventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// Find Event and EventDescriptor
// ============================================================

var FIND_EVENT = "find";

JSInheritance.extend(FindEvent, Event);
function FindEvent(continueFlag, termOrPreviousFlag){
	FindEvent.baseConstructor.call(this, null);
	this.continueFlag = continueFlag;
	if (!this.continueFlag)
	{
		this.searchTerm = termOrPreviousFlag;
		this.previousFlag = false;
	}
	else
	{
		this.previousFlag = termOrPreviousFlag;
		this.searchTerm = "";
	}
	this.type = FIND_EVENT;
}

function FindEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = FIND_EVENT;
}

FindEventDescriptor.prototype= {
	register: function(winObj){
		var descriptor = this;
		var recorder = this.recorder;
		
		//this could be called on a DialogBox window rather than a browser window
		if (winObj.win.gFindBar == null) return;
		winObj.EventHandlersMap[this.type] = {
			originalFindMethod : winObj.win.gFindBar._find,
			newFindMethod : function(value) {
				try	{
					var window = winObj.win				
					recorder.handleEvent([false,value], winObj, descriptor);     
			    }
			    catch(ex){
					debug(ex)
				}
				
				return winObj.EventHandlersMap[descriptor.type].originalFindMethod.apply(winObj.win.gFindBar, [value]);
			},
			originalFindAgainMethod : winObj.win.gFindBar._findAgain,
			newFindAgainMethod : function(previousFlag) {
				try	{
					var window = winObj.win				
					recorder.handleEvent([true,previousFlag], winObj, descriptor);     
			    }
			    catch(ex){
					debug(ex)
				}
				
				return winObj.EventHandlersMap[descriptor.type].originalFindAgainMethod.apply(winObj.win.gFindBar, [previousFlag]);
			},
		};

		winObj.win.gFindBar._find = winObj.EventHandlersMap[this.type].newFindMethod;
		winObj.win.gFindBar._findAgain = winObj.EventHandlersMap[this.type].newFindAgainMethod;
	},
	
	unregister: function(winObj){
		if (winObj.EventHandlersMap[this.type] == null)
			return;
	
		winObj.win.gFindBar._find = winObj.EventHandlersMap[this.type].originalFindMethod;
		winObj.win.gFindBar._findAgain = winObj.EventHandlersMap[this.type].originalFindAgainMethod;
		delete winObj.EventHandlersMap[this.type];
	},
	
	createEvent: function(data, winObj){
		debug(this.type + 'FindEventDescriptor: in createEvent ' + data.toString());
		var event = new FindEvent(data[0], data[1]);

		event.setWindowID(winObj.id);
		event.setBrowserID(winObj.getSelectedBrowserId());

		debug(this.type + 'FindEventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// PageNavigation Event and EventDescriptor
//   - go back and go forward events
// ============================================================

var PAGE_NAVIGATION_EVENT = "PageNavigationEvent";

JSInheritance.extend(PageNavigationEvent, Event);
function PageNavigationEvent(bIsBack, nNumberOfSteps){
	PageNavigationEvent.baseConstructor.call(this, null);
	this.bIsBack = bIsBack;
	this.nNumberOfSteps = nNumberOfSteps;
	this.type = PAGE_NAVIGATION_EVENT;
}

PageNavigationEvent.prototype.isBack = function()
{
	return this.bIsBack;
}

PageNavigationEvent.prototype.isForward = function()
{
	return !this.bIsBack;
}

PageNavigationEvent.prototype.hasMoreThanOneStep = function()
{
	return (this.nNumberOfSteps > 1);
}

PageNavigationEvent.prototype.getNumberOfSteps = function()
{
	return this.nNumberOfSteps;
}

function PageNavigationEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = PAGE_NAVIGATION_EVENT;
}

PageNavigationEventDescriptor.prototype= {
	register: function(winObj){
		var descriptor = this;
		var recorder = this.recorder;

		winObj.EventHandlersMap[this.type] = {
			navCommandListener : function(aEvent)
			{
				try	{
					switch (aEvent.target.id)
					{
					case "cmd_back":
					case "Browser:BackOrBackDuplicate":
						recorder.handleEvent([true,1], winObj, descriptor);     
						break;
						
					case "cmd_forward":
					case "Browser:ForwardOrForwardDuplicate":
						recorder.handleEvent([false,1], winObj, descriptor);     
						break;
					}
			    }
			    catch(ex){
					debug(ex)
				}
			},
			originalGotoHistoryIndexMethod : winObj.win.gotoHistoryIndex,
			newGotoHistoryIndexMethod : function(aEvent) {
				try	{
					var window = winObj.win
					var index = aEvent.target.getAttribute("index");
					if (index != null)
					{
						var currentIndex = window.getWebNavigation().sessionHistory.index;
						recorder.handleEvent([(index < currentIndex),Math.abs(index - currentIndex)], winObj, descriptor);
					}
			    }
			    catch(ex){
					debug(ex)
				}
				
				return winObj.EventHandlersMap[descriptor.type].originalGotoHistoryIndexMethod.apply(winObj.win, arguments);
			},
		};

		winObj.win.addEventListener("command", winObj.EventHandlersMap[this.type].navCommandListener, false);
		winObj.win.gotoHistoryIndex = winObj.EventHandlersMap[this.type].newGotoHistoryIndexMethod;
	},
	
	unregister: function(winObj){
		winObj.win.removeEventListener("command", winObj.EventHandlersMap[this.type].navCommandListener, false);
		winObj.win.gotoHistoryIndex = winObj.EventHandlersMap[this.type].originalGotoHistoryIndexMethod;
		delete winObj.EventHandlersMap[this.type];
	},
	
	createEvent: function(data, winObj){
		debug(this.type + 'PageNavigationEventDescriptor: in createEvent ' + data.toString());
		var event = new PageNavigationEvent(data[0], data[1]);

		event.setWindowID(winObj.id);
		event.setBrowserID(winObj.getSelectedBrowserId());

		debug(this.type + 'PageNavigationEventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// Reload Event and EventDescriptor
// ============================================================

var RELOAD_EVENT = "ReloadEvent";

JSInheritance.extend(ReloadEvent, Event);
function ReloadEvent(){
	ReloadEvent.baseConstructor.call(this, null);
	this.type = RELOAD_EVENT;
}

function ReloadEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = RELOAD_EVENT;
}

ReloadEventDescriptor.prototype= {
	register: function(obj){
		var descriptor = this;
		var recorder = this.recorder;

		var originalMethod = obj.isBrowser() ? obj.browser.reloadWithFlags :
			                                   obj.win.BrowserReloadWithFlags;
		
		obj.EventHandlersMap[this.type] = {
			originalBrowserReloadWithFlagsMethod : originalMethod,
			newBrowserReloadWithFlagsMethod : function(reloadFlags) {
				try	{
					recorder.handleEvent(null, obj, descriptor);
			    }
			    catch(ex){
					debug(ex)
				}
				
				return obj.EventHandlersMap[descriptor.type].originalBrowserReloadWithFlagsMethod.apply(obj.isBrowser() ? obj.browser : obj.win, arguments);
			},
		};

		if (obj.isBrowser())
			obj.browser.reloadWithFlags = obj.EventHandlersMap[this.type].newBrowserReloadWithFlagsMethod;
		else
			obj.win.BrowserReloadWithFlags = obj.EventHandlersMap[this.type].newBrowserReloadWithFlagsMethod;
	},
	
	unregister: function(obj){
		if (obj.isBrowser())
			obj.browser.reloadWithFlags = obj.EventHandlersMap[this.type].originalBrowserReloadWithFlagsMethod;
		else
			obj.win.BrowserReloadWithFlags = obj.EventHandlersMap[this.type].originalBrowserReloadWithFlagsMethod;
		
		delete obj.EventHandlersMap[this.type];
	},
	
	createEvent: function(data, obj){
		debug(this.type + 'ReloadEventDescriptor: in createEvent');
		var event = new ReloadEvent();

		if (obj.isBrowser())
		{
			event.setWindowID(obj.winObj.id);
			event.setBrowserID(obj.id);
		}
		else
		{
			event.setWindowID(obj.id);
			event.setBrowserID(obj.getSelectedBrowserId());
		}

		debug(this.type + 'ReloadEventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// Command Event and EventDescriptor
// ============================================================

// FFox menu commands.
// To determine the command that was fired, look at event.target.id
// some useful commands to use this with:
//   cmd_newNavigatorTab (new tab created by user)
//   cmd_copy, cmd_cut, cmd_paste

var COMMAND_EVENT = "command";

JSInheritance.extend(CommandEvent, Event);
function CommandEvent(evt){
	CommandEvent.baseConstructor.call(this, evt);	// fills in target and timestamp
	this.type = COMMAND_EVENT;
}

JSInheritance.extend(CommandEventDescriptor, EventDescriptor);
function CommandEventDescriptor(recorder){ 
	CommandEventDescriptor.baseConstructor.call(this, recorder, CommandEvent, COMMAND_EVENT);	// fills in Chrome Window ID
}

// ============================================================
// TabChangeEvent and TabChangeEventDescriptor
// ============================================================

var TAB_CHANGE_EVENT = "TabChangeEvent";

JSInheritance.extend(TabChangeEvent, Event);
function TabChangeEvent(evt, browser, browserID){
	TabChangeEvent.baseConstructor.call(this, evt);
	this.type = TAB_CHANGE_EVENT;
	this.newBrowser = browser;
	this.newBrowserID = browserID;
}

TabChangeEvent.prototype.getNewBrowser = function() {

	return this.newBrowser;
}

TabChangeEvent.prototype.getNewBrowserID = function() {

	return this.newBrowserID;
}

function TabChangeEventDescriptor(recorder){ 
	this.recorder = recorder;
	this.type = TAB_CHANGE_EVENT;
}

TabChangeEventDescriptor.prototype= {
	register: function(winObj){
		var descriptor = this;
		var recorder = this.recorder;

		winObj.EventHandlersMap[this.type] = function(event) {
			try	{
				var window = winObj.win;
				recorder.handleEvent(event, winObj, descriptor);
		    }
		    catch(ex){
				debug(ex)
			}
		};

		//this could be called on a DialogBox window rather than a browser window
		if (!winObj.win.gBrowser) return;
		winObj.win.gBrowser.addEventListener("TabSelect", winObj.EventHandlersMap[this.type], false);
	},
	
	unregister: function(winObj){
		winObj.win.gBrowser.removeEventListener("TabSelect", winObj.EventHandlersMap[this.type], false);
		delete winObj.EventHandlersMap[this.type];
	},
	
	createEvent: function(event, winObj){
		debug(this.type + 'TabChangeEventDescriptor: in createEvent ' + winObj.id);
		var newBrowser = winObj.win.gBrowser.selectedTab.linkedBrowser;
		var newBrowserId = this.recorder.getIdByBrowser(newBrowser);
		debug('new browser id is ' + newBrowserId);
		var event = new TabChangeEvent(event, newBrowser, newBrowserId);

		event.setWindowID(winObj.id);
		event.setBrowserID(winObj.getSelectedBrowserId());

		debug(this.type + 'TabChangeEventDescriptor: done createEvent');
		return event;
	}
};

// ============================================================
// YULEInternalEventDescriptor
// 
// This is the base descriptor for any event generated
// within the YULE framework, such as tab close and window close.
// ============================================================

function YULEInternalEventDescriptor(recorder, type){ 
	if (arguments.length != 0)
	{
		this.recorder = recorder;
		this.type = type;
	}
	else
	{
		this.recorder = null;
		this.type = null;
	}
}

// ============================================================
// TabCloseEvent and TabCloseEventDescriptor
// ============================================================

var TAB_CLOSE_EVENT = "TabCloseEvent";

JSInheritance.extend(TabCloseEvent, Event);
function TabCloseEvent(){
	TabCloseEvent.baseConstructor.call(this, null);
	this.type = TAB_CLOSE_EVENT;
}

JSInheritance.extend(TabCloseEventDescriptor, YULEInternalEventDescriptor);
function TabCloseEventDescriptor(recorder){
	TabCloseEventDescriptor.baseConstructor.call(this, recorder, TAB_CLOSE_EVENT);
}

TabCloseEventDescriptor.prototype.register = function(){	
	this.recorder.tabCloseEventDescriptor = this;
}
	
TabCloseEventDescriptor.prototype.unregister = function(){
	// unregister does not need to be specified for sub-classes of this descriptor
	this.recorder.tabCloseEventDescriptor = null;
}

TabCloseEventDescriptor.prototype.createEvent = function(data, browserObj){
	debug(this.type + ' TabCloseEventDescriptor: in createEvent ' + browserObj.id);
	var event = new TabCloseEvent();

	event.setWindowID(browserObj.winObj.id);
	event.setBrowserID(browserObj.id);

	debug(this.type + ' TabCloseEventDescriptor: done createEvent');
	return event;
}

// ============================================================
// WindowCloseEvent and WindowCloseEventDescriptor
// ============================================================

var WINDOW_CLOSE_EVENT = "WindowCloseEvent";

JSInheritance.extend(WindowCloseEvent, Event);
function WindowCloseEvent(){
	WindowCloseEvent.baseConstructor.call(this, null);
	this.type = WINDOW_CLOSE_EVENT;
}

JSInheritance.extend(WindowCloseEventDescriptor, YULEInternalEventDescriptor);
function WindowCloseEventDescriptor(recorder){
	WindowCloseEventDescriptor.baseConstructor.call(this, recorder, WINDOW_CLOSE_EVENT);
}

WindowCloseEventDescriptor.prototype.register = function(){
	this.recorder.windowCloseEventDescriptor = this;
}
	
WindowCloseEventDescriptor.prototype.unregister = function(){
	this.recorder.windowCloseEventDescriptor = null;
}

WindowCloseEventDescriptor.prototype.createEvent = function(data, winObj){
	debug(this.type + ' WindowCloseEventDescriptor: in createEvent ' + winObj.id);
	var event = new WindowCloseEvent();

	event.setWindowID(winObj.id);
	event.setBrowserID(winObj.getSelectedBrowserId());

	debug(this.type + ' WindowCloseEventDescriptor: done createEvent');
	return event;
}

// ============================================================
// DialogCreateEvent and DialogCreateEventDescriptor
// ============================================================

var DIALOG_CREATE_EVENT = "DialogCreateEvent";

JSInheritance.extend(DialogCreateEvent, Event);
function DialogCreateEvent(){
	debug('In DialogCreateEvent constructor');
	DialogCreateEvent.baseConstructor.call(this, null);
	this.type = DIALOG_CREATE_EVENT;
}

JSInheritance.extend(DialogCreateEventDescriptor, YULEInternalEventDescriptor);
function DialogCreateEventDescriptor(recorder){
	//debug('DialogCreateEventDescriptor: 1 constructor called', true);
	DialogCreateEventDescriptor.baseConstructor.call(this, recorder, DIALOG_CREATE_EVENT);
	//debug('DialogCreateEventDescriptor: 2 constructor called', true);
	//recorder.dialogCreateEventDescriptor = this	// DialogCreateEventDescriptor.register was never getting called (AC)
	//this.recorder.dialogCreateEventDescriptor = this	// DialogCreateEventDescriptor.register was never getting called (AC)
	//debug("DialogCreateEventDescriptor: 3 yule's dialogCreateEventDescriptor is " + recorder.dialogCreateEventDescriptor.toString(), true)
	//debug("DialogCreateEventDescriptor: 3 yule's dialogCreateEventDescriptor is " + this.recorder.dialogCreateEventDescriptor.toString(), true)
	/////////debug('DialogCreateEventDescriptor: 4 theYule is ' + this.toString(), true)
	//debug('DialogCreateEventDescriptor: 5 this is ' + DialogCreateEventDescriptor.toString(), true)
}

DialogCreateEventDescriptor.prototype.register = function(){
	//debug('DialogCreateEventDescriptor: register', true);
	this.recorder.dialogCreateEventDescriptor = this;
}
	
DialogCreateEventDescriptor.prototype.unregister = function(){
	this.recorder.dialogCreateEventDescriptor = null;
}

DialogCreateEventDescriptor.prototype.createEvent = function(data, winObj){
	//debug(this.type + ' DialogCreateEventDescriptor: in createEvent ' + winObj.id);
	var event = new DialogCreateEvent();
	if (typeof winObj != "object") return null;

	event.setWindowID(winObj.id);
	event.setBrowserID(winObj.getSelectedBrowserId());

	//debug(this.type + ' DialogCreateEventDescriptor: done createEvent');
	return event;
}

// ====================================================================
// END Event Descriptor Definitions
// ====================================================================

//******************************************************
//******************* Browser **************************
//******************************************************
// An internal object for tracking browsers that are open in Firefox
// These are the browser tabs (opened by File>New Tab) within a Main Chrome Window

function BrowserObj(idNum, winObj, browser)
{
	this.id = idNum;
	this.winObj = winObj;
	this.browser = browser;
}

BrowserObj.prototype = {
	isBrowser : function() { return true; },
	isWindow : function() { return false; }
	// yule's _registerBrowser also adds an EventHandlersMap
}

//******************************************************
//******************* Window **************************
//******************************************************
// An internal object for tracking windows that are open in Firefox
// These are the Main Chrome Windows opened by File>New Window
// Dialog boxes within a Tab Browser's content window are also Windows.

function WindowObj(idNum, w)
{
	this.id = idNum;
	this.win = w;
	// yule's _registerWindow also adds an EventHandlersMap
}

WindowObj.prototype = {
	isBrowser : function() { return false; },
	isWindow : function() { return true; },
	
	// this method returns the object for the currently selected
	// browser in the window, if the window has a gBrowser object
	getSelectedBrowserId : function() {
		
		var gBrowser = this.win.gBrowser;
		if (gBrowser == null)
			return -1;
		
		return getYule().getIdByBrowser(gBrowser.selectedBrowser);
	}
}



//**************************************************************
//**************************************************************
//************* Implementation of yule recorder ***************
//**************************************************************
//**************************************************************
// The rest of this file (other than the XPCOM code) is the Yule object
/**
 * @constructor
 */
function Yule() {
	//=================================================
	// Yule Member Variables Section

	// We keep track of browsers by assigning each a number as it is created...
	//   This probably is not very robust, but otherwise distinguishing between
	//   different browsers seems very hard.
	this._BrowserCounter = 0;
	this._browserList = [];
	this._WindowCounter = 0;
	this._windowList = [];

	// Use windowWatcher to record new windows and dialogs
	this._windowWatcher = null;

	// maps to keep track of clients and descriptors 
	this._eventToDescriptorMap = {}; // hashmap from eventName to Descriptor
	this._eventToClientsMap = {}; // hashmap from eventName to a Set of client callbacks subscribed for eventName 

	// sets tracking registered events
	this._allRegisteredWindowEventsSet = new Set();
	this._allRegisteredBrowserEventsSet = new Set();
	this._activeWindowEventsSet = new Set();
	this._activeBrowserEventsSet = new Set();
	this._wrappedBrowserEventsSet = new Set();

	// initialization flag
	this._initialized = false;

	// initialize method
	this._initialize();
	this.wrappedJSObject = this;

	// internal event descriptors
	this.tabCloseEventDescriptor = null;
	this.windowCloseEventDescriptor = null;
	this.dialogCreateEventDescriptor = null;

	// exposing base classes
	this.EventClass = Event;
	this.EventDescriptorClass = EventDescriptor;
	this.DocLoadEventDescriptorClass = DocLoadEventDescriptor;
	
	this.prefs = Preferences;
}

Yule.prototype = {

	/** 
	 * for version number testing at component registration time
	 */

	getVersion : function(){
	
		return VERSION_NUM;
	},

	getFactory : function(){
		
		return YuleFactory;
	},


	/** 
	 * Component initialization
	 */
	//======================================================================= 
	// Initialization (register all DOM event descriptors)
	_initialize : function() {
		// ensure that we only initialize this object once
		if (this._initialized) return;
		this._initialized = true;
		// registration of default events TODO: find a better way to register events
		//debug("_initialize", true)
		// Mouse Events
		this.registerEventDescriptor(CLICK_EVENT, ClickEventDescriptor, "browser");
		this.registerEventDescriptor(DBL_CLICK_EVENT, DblClickEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_DOWN_EVENT, MouseDownEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_UP_EVENT, MouseUpEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_OVER_EVENT, MouseOverEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_MOVE_EVENT, MouseMoveEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_OUT_EVENT, MouseOutEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_MULTI_WHEEL_EVENT, MouseMultiWheelEventDescriptor, "browser");
		this.registerEventDescriptor(MOUSE_WHEEL_EVENT, MouseWheelEventDescriptor, "browser");
		// Other events
        this.registerEventDescriptor(CHANGE_EVENT, ChangeEventDescriptor, "browser");
        this.registerEventDescriptor(DOJO_CHANGE_EVENT, DojoChangeEventDescriptor, "browser");
		this.registerEventDescriptor(LOAD_EVENT, LoadEventDescriptor, "browser");
		this.registerEventDescriptor(KEY_DOWN_EVENT, KeyDownEventDescriptor, "browser");
		this.registerEventDescriptor(TAB_CLOSE_EVENT, TabCloseEventDescriptor, "browser");
		this.registerEventDescriptor(SCROLL_EVENT, ScrollEventDescriptor, "browser");
		
		this.registerEventDescriptor(FOCUS_EVENT, FocusEventDescriptor, "browser");
//		this.registerEventDescriptor(XHR_EVENT, XHREventDescriptor, "browser");

		// TL: disabling Timeout and Interval Events because they cause
		// some page functionality to fail 8/18/09
		// this.registerEventDescriptor(INTERVAL_EVENT, IntervalEventDescriptor, "browser");
		// this.registerEventDescriptor(TIMEOUT_EVENT, TimeoutEventDescriptor, "browser");

		// Mutation events
		this.registerEventDescriptor(DOM_NODE_INSERTED_EVENT, DOMNodeInsertedEventDescriptor, "browser");
		this.registerEventDescriptor(DOM_NODE_REMOVED_EVENT, DOMNodeRemovedEventDescriptor, "browser");
		this.registerEventDescriptor(DOM_ATTR_MODIFIED_EVENT, DOMAttrModifiedEventDescriptor, "browser");

		// load uri event
		this.registerEventDescriptor(LOAD_URI_EVENT, LoadURIEventDescriptor, "browser");
		
		// window events
		this.registerEventDescriptor(PAGE_NAVIGATION_EVENT, PageNavigationEventDescriptor, "window");
		this.registerEventDescriptor(TAB_CHANGE_EVENT, TabChangeEventDescriptor, "window");
		this.registerEventDescriptor(COMMAND_EVENT, CommandEventDescriptor, "window");
		this.registerEventDescriptor(LOCATION_BAR_CHANGE_EVENT, LocationBarChangeEventDescriptor, "window");
		this.registerEventDescriptor(FIND_EVENT, FindEventDescriptor, "window");
		this.registerEventDescriptor(WINDOW_CLOSE_EVENT, WindowCloseEventDescriptor, "window");
		//debug("_initialize: registering DialogCreateEventDescriptor", true)
		this.registerEventDescriptor(DIALOG_CREATE_EVENT, DialogCreateEventDescriptor, "window");
		//debug("_initialize: registered DialogCreateEventDescriptor", true)
		
		// events that register on both window and browser
		this.registerEventDescriptor(RELOAD_EVENT, ReloadEventDescriptor, "both");
		
//		this._wrappedBrowserEventsSet.add(XHR_EVENT);
	
		// TL: disabling Timeout and Interval Events because they cause
		// some page functionality to fail 8/18/09
		//this._wrappedBrowserEventsSet.add(INTERVAL_EVENT);
		//this._wrappedBrowserEventsSet.add(TIMEOUT_EVENT);

		// get notified by windowWatcher when any new windows or dialogs are opened
		//windowWatcher will call this.observe
		this._windowWatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
		this._windowWatcher.registerNotification(this);
		
		// Enumerate and register any existing windows
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var winEnum = wm.getEnumerator("navigator:browser");
		while(winEnum.hasMoreElements()) 
		{
  			var win = winEnum.getNext();
  			var recorder = this;
			
			// Ensure that windows have their gBrowser defined before being registered
			var timeoutFunc = function() {
				if (win.gBrowser === null) win.setTimeout(timeoutFunc, 100);
				else recorder._registerWindow(win);					
			};

			timeoutFunc();
  		}
		//debug("_initialize finished", true)
	},
	

	//================================================================
	// handleEvent (calls _notify Clients)
	handleEvent : function(domEvent, obj, eventCallback){
		debug("in handleEvent")
		// TODO: Add some pre-processing?
		this._notifyClients(domEvent, obj, eventCallback);
	},


	//===============================================================
	// observe callback for WindowWatcher
	// Called whenever a new toplevel Chrome Window is created (and also when a dialog box is created),
	// this method Adds Event Listeners to the window for all of the DOM events
	observe : function(subject, topic, data) {
		// this._windowWatcher calls this
		// "open link in new window" in a link's contextual menu causes this to be called
		// file>new window causes this to be called
		// A quite different use is that a dialog box opened inside a browser causes this to be called
		//debug("observe got called", true);
		var win = subject.QueryInterface(Components.interfaces.nsIDOMWindow);
		var theYule = this;

		// topic has two values: domwindowopened, domwindowclosed
		if (topic == "domwindowopened") 
		{
			//** Register the new window **
	        function loadCallback(event)
	        {
	            win.removeEventListener("load", loadCallback, true);
	
				if (win.document.location.toString() == "chrome://browser/content/browser.xul") {
					debug("windowWatcher called yule's observe on a chromeWindow")
					// This is a Main Chrome Window -- the sort you get with File>New Window.
					var timeoutFunc = function() {
						if (win.gBrowser === null) win.setTimeout(timeoutFunc, 100);
						else theYule._registerWindow(win);					
					};

					timeoutFunc();
				}
				else {
					// This is not a standard browser window.  It could be a dialog box or Error Console or JS Debugger. 
					/* 
					* It might help to check explicitly here for 
					* (win.document.location.toString() == "chrome://global/content/commonDialog.xul")
					* Could also check that win.document.documentElement.nodeName == "dialog"
					* The FFox Preferences dialog is "chrome://browser/content/preferences/preferences.xul"
					* The ErrorConsole is "chrome://global/content/console.xul"
					*/
					//debug("windowWatcher called yule's observe. The new window's loadCallback got called. The new window is a dialog box or Error Console or JS Debugger", true)
					//debug("window's location is " + win.document.location.toString(), true)
					//if (win.document.location.toString() == "chrome://global/content/commonDialog.xul") {
					if (win.document.location.toString() != "chrome://venkman/content/venkman.xul") {	// don't record Venkman
						//debug("in observe's loadCallback. this is a dialog ", true)
						theYule._registerWindow(win)
						//debug("in observe's loadCallback. finished _registerWindow ", true)
											
						// This is where we know internally that a dialog has been created
						// TODO: change this from a DialogCreate event to a WindowOpen event (AC)
						var wIndex = theYule._indexOfWindow(win)
						//debug("in observe's loadCallback. wIndex is " + wIndex.toString(), true)
						var winObj = theYule._windowList[wIndex]
						var theYule2 = theYule
						var theDialogCreateEventDescriptor2 = theYule.dialogCreateEventDescriptor
						//debug("in observe's loadCallback. about to print to console ", true)
						//debug("in observe's loadCallback. theYule.dialogCreateEventDescriptor is " + theYule.dialogCreateEventDescriptor, true)
						
						var dialogHandleEvent = function() {
							//debug("theYule2.dialogCreateEventDescriptor is " + theYule2.dialogCreateEventDescriptor, true)
							//debug("theDialogCreateEventDescriptor2 is " + theDialogCreateEventDescriptor2, true)
							if (theYule2.dialogCreateEventDescriptor){
								//debug("observe's dialogHandleEvent callback is calling handleEvent on dialogCreateEventDescriptor", true)
								theYule2.handleEvent(null, winObj, theYule2.dialogCreateEventDescriptor)
							}		
						};	// end of dialogHandleEvent
	
						win.setTimeout(dialogHandleEvent, 1000)	// should be 1000 (AC) Changed temporarily to 0 for debugging
					}	// end of if !console
				}	// end of dialog box
	        }	// end of loadCallback
	
	        win.addEventListener("load", loadCallback, true);
		}  // end of domwindowopened
		
		else // domwindowclosed
			if (win.document.location.toString() == "chrome://browser/content/browser.xul" || 
				win.document.location.toString() == "chrome://global/content/commonDialog.xul"
				)
				this._unregisterWindow(win);
	},

	//======================================================================= 
	// Window Registration Section

	/**
	 * This private function registers a Main Chrome window or a dialog box with Recorder
	 * "Register" means 1) to add the window to yule's list of windows and 2) to attach event listeners to it
	 * @param {window} w - the window object to be registered
	 */
	_registerWindow : function(w)
	{
		//debug("in registerWindow", true);
		var dialogP = false
		try
		{
			if (w.gBrowser == null) {
				/*
				if (w.document.documentElement.nodeName != "dialog" && w.document.documentElement.nodeName != "prefwindow") {
					debug('Window attempting to register has no gBrowser and is not a Dialog Box (e.g. the Error Console or the JavaScript Debugger)')
					return;
				}
				*/
				// Dialog box
				dialogP = true
			}
			
			if (this._indexOfWindow(w) >= 0) return; // window already registered
			var wObj = new WindowObj(this._WindowCounter++, w);
			this._windowList.push(wObj);
			wObj.EventHandlersMap = {};	// hashmaps to store event handlers
			
			if (!dialogP){	 
				var recorder = this;
				
				// (I) Register the browser tabs in this Chrome Window
				// Whenever a new browser is created, Register it with the Recorder			
				w.koala_tabOpenHandler = function(event)
				{
					// As of FFox4, this no longer works:
					//var chromeWin = recorder._getChromeWindow(event.target.contentWindow);
					//recorder._registerBrowser(chromeWin, event.originalTarget.linkedBrowser);	
					// originalTarget has no pointer to the tabbrowser. You have to use currentTarget (which is "this")
					// Also linkedBrowser is deprecated. See Notes at bottom of page on https://developer.mozilla.org/en/Code_snippets/Tabbed_browser
					var tabbrowser = event.currentTarget.tabbrowser
					var browser = tabbrowser.getBrowserForTab(event.target)
					var chromeWin = recorder._getChromeWindow(browser.contentWindow);
					recorder._registerBrowser(chromeWin, browser);
				};
				// w.gBrowser.addEventListener("TabOpen", w.koala_tabOpenHandler, true);	// As of FFox4, this no longer works: You have to use the tabContainer
				w.gBrowser.tabContainer.addEventListener("TabOpen", w.koala_tabOpenHandler, true);
				
				// Whenever a browser is closed, Unregister it with the Recorder
				w.koala_tabCloseHandler = function(event) 
				{
					//recorder._unregisterBrowser(event.originalTarget.linkedBrowser);
					var tabbrowser = event.currentTarget.tabbrowser
					var browser = tabbrowser.getBrowserForTab(event.target)
					recorder._unregisterBrowser(browser);
				};
				//w.gBrowser.addEventListener("TabClose", w.koala_tabCloseHandler, true);	
				w.gBrowser.tabContainer.addEventListener("TabClose", w.koala_tabCloseHandler, true);

				// Register any browsers already associated with this window
				for(var i = 0; i < w.gBrowser.browsers.length; i++)
					this._registerBrowser(w, w.gBrowser.getBrowserAtIndex(i));

				// (II) Register this Chrome Window
				// Register event listeners with this window
				// (AC) Currently, the window events are: 
				// PAGE_NAVIGATION_EVENT, RELOAD_EVENT, TAB_CHANGE_EVENT, COMMAND_EVENT, LOCATION_BAR_CHANGE_EVENT, FIND_EVENT, WINDOW_CLOSE_EVENT
				for(var i = 0 ; i < this._activeWindowEventsSet.size(); i++){
					try {
						var eventName = this._activeWindowEventsSet.elements()[i];
						var eventDescriptor = this._eventToDescriptorMap[eventName];
						eventDescriptor.register(wObj);
					}
					catch(e) {debug(e)}
				}
			}
			
			if (dialogP){
				// Many of the event listeners that a browser adds to a content window on Load of that contentWindow should also be added to a dialog box
				// Register event listeners with this dialog box
				//debug('registering dialog with all active EventDescriptors', true);
				for(var i = 0 ; i < this._activeBrowserEventsSet.size(); i++){
					try {
						eventName = this._activeBrowserEventsSet.elements()[i];
						eventDescriptor = this._eventToDescriptorMap[eventName];
						eventDescriptor.register(wObj);
					}
					catch(e) {debug(e)}
				}
				/*
				// Register DialogCreateEventDescriptor
				if(this._allRegisteredWindowEventsSet.contains("DialogCreateEvent")){
					try {
						eventDescriptor = this._eventToDescriptorMap["DialogCreateEvent"];
						eventDescriptor.register();
					}
					catch(e) {debug("_registerWindow: Dialog: Failed to register DialogCreateEvent. " + e)}
				}
				*/
			}	// end of dialog
		}
		catch(e) {debug(e)}
		//debug('Registered (that is, attached event listeners to) a new window with ID: ' + wObj.id, true);
	},

	/**
	 * This private function unregisters a window with Recorder
	 * @param {window} w - the window object to be unregistered
	 */
	_unregisterWindow : function(w)
	{
		var win_idx = this._indexOfWindow(w);
		if (win_idx == -1) {
			// window has to be registered
			debug('Window was NOT registered!!!');
			return;
		}
		var winObj = this._windowList[win_idx];

		// if the window close descriptor is registered, then notify the event listeners
		if (this.windowCloseEventDescriptor != null)
		{
			this.handleEvent(null, winObj, this.windowCloseEventDescriptor);
		}
		
		this._windowList.splice(win_idx, 1);
		
		if (w.gBrowser != null) {
			// TODO: Remove any window specific event descriptors
		
			w.gBrowser.removeEventListener("TabOpen", w.koala_tabOpenHandler, true);
			delete w.koala_tabOpenHandler;

			w.gBrowser.removeEventListener("TabClose", w.koala_tabCloseHandler, true);
			delete w.koala_tabCloseHandler;

			// Unregister event listeners from this window
			for(var i = 0 ; i < this._activeWindowEventsSet.size(); i++){
				try
				{
					var eventName = this._activeWindowEventsSet.elements()[i];
					var eventDescriptor = this._eventToDescriptorMap[eventName];
					eventDescriptor.unregister(winObj);
				}
				catch(e) {debug(e)}
			}

			// Remove all browsers associated with this window
			for(var i = 0; i < this._browserList.length; i++)
			{
				var bObj = this._browserList[i];
				if (bObj.winObj == winObj)
				{
					this._unregisterBrowserAt(i);
					i--; // unregistering a browser splices the item out of the list
				}	
			}
		}
		else {	// this is a dialog
			debug('unregistering dialog with all active browser EventDescriptors ');
			for(var i = 0 ; i < this._activeBrowserEventsSet.size(); i++){
				try
				{
					var eventName = this._activeBrowserEventsSet.elements()[i];
					var eventDescriptor = this._eventToDescriptorMap[eventName];
					eventDescriptor.unregister(winObj);
				}
				catch(e) {debug(e)}
			}
		}					
		debug('Unregistered a window with ID: ' + winObj.id);
	},

	/**
	 * This private function resolves event.target.contentWindow to a window object
	 * @param {contentWindow} contentWindow - event.target.contentWindow?
	 * @return window object     
	 * @type window
	 */
	_getChromeWindow : function(contentWindow) {
		//e.g. get the main window that contains a content window
		return contentWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIWebNavigation)
	                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	                   .rootTreeItem
	                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	                   .getInterface(Components.interfaces.nsIDOMWindow) 
	},

	/**
	 * New
	 */
	//		_registerAllWindowsWithEventDescriptor
	_registerAllWindowsWithEventDescriptor: function(eventName){
		var eventDescriptor = this._eventToDescriptorMap[eventName];
		debug("registering all windows with eventDescriptor " + eventName);
		for(var w = 0; w < this._windowList.length; w++)	// for all registered windows,
		{
			try
			{
				eventDescriptor.register(this._windowList[w]); // register the window with this eventDescriptor
			}
			catch(e)
			{
				debug(e);
			}
		}
	},

	/**
	 * New
	 */
	_unregisterAllWindowsWithEventDescriptor: function(eventName){
		var eventDescriptor = this._eventToDescriptorMap[eventName];
		debug("unregistering all windows with eventDescriptor " + eventName);
		for(var w = 0; w < this._windowList.length; w++)	// for all registered windows
		{
			try
			{
				eventDescriptor.unregister(this._windowList[w]); // unregister windows with event descriptors
			}
			catch(e)
			{
				debug(e);
			}
		}
	},
	

	//================================================================
	// Browser Registration Section
	
	// A browser is one of the browser tabs in a Main Chrome Window
	// register to record user actions in a new browser
	_registerBrowser : function(win, browser)
	{
		debug('in registerBrowser');
		if (this._indexOfBrowser(browser) >= 0) return; // browser already registered
		var win_idx = this._indexOfWindow(win);	// this assumes win is registered before browser and is unregistered after browser
		if(win_idx == -1)	// window is not registered
		{
			debug("Window is NOT registered!!!");
			return;
		}
		var bObj = new BrowserObj(this._BrowserCounter++, this._windowList[win_idx], browser);
		bObj.EventHandlersMap = {};	// hashmaps to store event hanlders
		this._browserList.push(bObj);
	
		// wrap this browser's functions at creation time - necessary for interval and timeout events
		for(var i = 0 ; i < this._wrappedBrowserEventsSet.size(); i++){
			var eventName = this._wrappedBrowserEventsSet.elements()[i];
			var eventDescriptor = this._eventToDescriptorMap[eventName];
			eventDescriptor.wrap(bObj);
		}
				
		// Register event listeners with this browser
		for(var i = 0 ; i < this._activeBrowserEventsSet.size(); i++){
			try
			{
				debug('registering with all active EventDescriptors ');
				var eventName = this._activeBrowserEventsSet.elements()[i];
				var eventDescriptor = this._eventToDescriptorMap[eventName];
				eventDescriptor.register(bObj);
			}
			catch(e)
			{
				debug(e);
			}
		}
		//debug('Registered a new browser with ID: ' + bObj.id + ' in window with ID: ' + this._windowList[win_idx].id, true);

		return bObj;
	},

	_unregisterBrowser : function(browser)
	{
		var idx = this._indexOfBrowser(browser);
		if (idx != -1) 
			this._unregisterBrowserAt(idx);
	},

	_unregisterBrowserAt : function(idx)
	{
		var bObj = this._browserList[idx];

		// if the brwoser close descriptor is registered, then notify
		// the event listeners
		if (this.tabCloseEventDescriptor != null)
		{
			this.handleEvent(null, bObj, this.tabCloseEventDescriptor);
		}

		this._browserList.splice(idx, 1);
		
		// Unregister event listeners from this browser
		for(var i = 0 ; i < this._activeBrowserEventsSet.size(); i++){
			try
			{
				debug('unregistering with all active EventDescriptors ');
				var eventName = this._activeBrowserEventsSet.elements()[i];
				var eventDescriptor = this._eventToDescriptorMap[eventName];
				eventDescriptor.unregister(bObj);
			}
			catch(e)
			{
				debug(e);
			}
		}
		// Debug message
		debug('Unregistered a browser with ID: ' + bObj.id);
	},

	_indexOfBrowser : function(browser)
	{
		debug('in indexOfBrowser');
		for(var i = 0; i < this._browserList.length; i++)
			if (this._browserList[i].browser == browser)
				return i;
		return -1;
	},

	_indexOfWindow : function(w)
	{
		debug('in indexOfWindow');
		for(var i = 0; i < this._windowList.length; i++)
			if (this._windowList[i].win == w)
				return i;
		return -1;
	},

	getBrowserById : function(id)
	{
		for(var i = 0; i < this._browserList.length; i++)
		{
			if (this._browserList[i].id == id)
			{
				return this._browserList[i].browser;
			}
		}
		
		return null;
	},
	
	getIdByBrowser : function(browser)
	{
		var index = this._indexOfBrowser(browser);
		if (index != -1)
		{
			return this._browserList[index].id;
		}
		
		return null;
	},

	getWindowById : function(id)
	{
		for(var i = 0; i < this._windowList.length; i++)
		{
			if (this._windowList[i].id == id)
			{
				return this._windowList[i].win;
			}
		}
		
		return null;
	},
	
	getIdByWindow : function(window)
	{
		var index = this._indexOfWindow(window);
		if (index != -1)
		{
			return this._windowList[index].id;
		}
		
		return null;
	},

	/**
	 * New
	 */
	_registerAllBrowsersWithEventDescriptor: function(eventName){
		var eventDescriptor = this._eventToDescriptorMap[eventName];
		debug("registering all browsers with eventDescriptor " + eventName);
		for(var br = 0; br < this._browserList.length; br++)	// for all registered browsers
			eventDescriptor.register(this._browserList[br]); // register browsers with event descriptors
	},

	/**
	 * New
	 */
	_unregisterAllBrowsersWithEventDescriptor: function(eventName){
		var eventDescriptor = this._eventToDescriptorMap[eventName];
		debug("unregistering all browsers with eventDescriptor " + eventName);
		for(var br = 0; br < this._browserList.length; br++)	// for all registered browsers
		{
			eventDescriptor.unregister(this._browserList[br]); // unregister browsers with event descriptors
		}
	},

	
	//======================================================================= 
	// Custom Registration Section
	//
	//   This registration method supports using YULE in contexts where 
	//   a XUL browser component is embedded within a XULRunner app.
	//   This method may be used when no tabbed browser component or 
	//   other standard Firefox API methods are available.

	registerCustomBrowser: function(win, browser)
	{
		// the window may be already registered...if it is, then this method will
		// return without doing anything
		this._registerWindow(win);
		
		// register the browser
		return this._registerBrowser(win, browser);
	},
	
	unregisterCustomBrowser: function(win, browser)
	{
		// unregister the browser
		this._unregisterBrowser(win, browser);
		
		// Do not unregister the window in case it is still being used.
		// The system will properly unregister the window if it is closed.
	},

	
	//======================================================================= 
	// Client Subscription Section

	/**
	 * This PUBLIC function allows clients of Yule to subscribe for all or select events 
	 * Format: subscribe(listenerCallback [, eventName1 [, ...] ]) 
	 * EXAMPLE: yule.subscribe(this._yuleCallbackMethod, "click", "change" , "LocationBarChangeEvent");
	 * as of 08/06/08, the list includes: click, dblclick, mousedown, mouseup, mouseover, mousemove, mouseout, mousemultiwheel, mousewheel, change, keydown, load, focus, DOMNodeInserted, DOMNodeRemoved, DOMAttrModified
	 * @param {Function [, String [, ...]]} args listener callback, optionally followed by requested event names  
	 * 			if event names are ommitted, the client is subscribed for all known events
	 * @return true if the client was subscribed, false otherwise     
	 * @type Boolean
	 * NOTE: clients subscribed for ALL events will not be notified 
	 * 		of the events that may be added at a later time. (feel free to modify)
	 * Reasoning: Recorder registers all known system events by default. 
	 * 		Any client can register its own custom events, 
	 * 		which will be irrelevant for the other clients.
	 */
	subscribe : function(args){
		//check for number of arguments > 0 and that first argument is a callback function
		if(arguments.length === 0 || typeof(arguments[0]) !== "function")
			return false;

		var requestedEventsList;
		var allRegisteredEventsArray = this.getAllRegisteredEventDescriptors();
		if(arguments.length === 1)	// if no events specified, register client for all events
			requestedEventsList = allRegisteredEventsArray;	// list of all registered events
		else	//  if specific events are requested, register client for the requested events only
			requestedEventsList = Array.prototype.slice.call(arguments, 1); // list of events requested
		debug('Client requested to register for: ' + requestedEventsList); 

//		for(event in requestedEventsList) doesn't work because of the inheritance convenience class 
		var callBack = arguments[0];
		var clientsSet;
		var eventName;
		// check for eventNames and throw exception if an unknown event has been requested  
		for(var i = 0; i < requestedEventsList.length; i++)
		{
				eventName = requestedEventsList[i];
				if(allRegisteredEventsArray.indexOf(eventName) == -1){
					debug("registering client for event: " + eventName + " failed. Event name does not exist");
					throw "yule.subscribe: attempted to register for unknown event type '" + eventName +"'";
				}
		}
		for(var i = 0; i < requestedEventsList.length; i++)
		{
				eventName = requestedEventsList[i];
				debug("registering client for event: " + eventName);
				// register the client's callback to listen for eventName
				// TODO: ensure this._eventToClientsMap[eventName] is always defined
				clientsSet = this._eventToClientsMap[eventName];
				if (clientsSet.size() === 0)
				{
					if(this._allRegisteredBrowserEventsSet.contains(eventName)){
						this._registerAllBrowsersWithEventDescriptor(eventName); // TODO:  If listened at all!!!
						this._activeBrowserEventsSet.add(eventName);

						debug("Event " + eventName + " is now active on the browser!");
					}
					
					if(this._allRegisteredWindowEventsSet.contains(eventName)){
						this._registerAllWindowsWithEventDescriptor(eventName);
						this._activeWindowEventsSet.add(eventName);

						debug("Event " + eventName + " is now active on the window!");
					}
				}
				clientsSet.add(callBack); // Set.add() will ignore duplicates
		}
		return true;
	},

	/**
	 * This PUBLIC function allows clients of Yule to unsubscribe from all or select events 
	 * Format: unsubscribe(listenerCallback [, eventName1 [, ...] ]) 
	 * @param {Function [, String [, ...]]} args listener callback, optionally followed by requested event names  
	 * 			if event names are ommitted, the client is unsubscribed from all events
	 * @return true if the client was unsubscribed, false otherwise     
	 * @type Boolean
	 */
	unsubscribe: function(args){
		/* checking for valid number of arguments and that the 1st argument is a callback function */
		if(arguments.length === 0 || typeof(arguments[0]) !== "function")
			return false;

		var requestedEventsList;
		if(arguments.length === 1)	// if no events specified, unregister client for all events
			requestedEventsList = this.getAllRegisteredEventDescriptors();	// list of all registered events
		else	//  if specific events are requested, unregister client for the requested events only
			requestedEventsList = Array.prototype.slice.call(arguments, 1); // list of events requested
		debug('Client requested to unregister for: ' + requestedEventsList); 

//		for(event in requestedEventsList) doesn't work because of the inheritance convenience class 
		var client = arguments[0];
		var eventName;
		for(var i = 0; i < requestedEventsList.length; i++)
		{
				eventName = requestedEventsList[i];
				// TODO: what if eventName is not known?
				debug("unregistering client for event: " + eventName);
				// unregister the client's callback for eventName 
				this._removeClient(eventName, client);
		}
		return true;
	},

	/**
	 * This PUBLIC function allows clients of Yule to specify a custom XPathGenerator 
	 * If the custom XPathGenerator is not specified, XPath of the event will remain null
	 * @param client callback which is used to map clients to the respective XPathGenerators
	 * @param XPathGenerator the custom XPathGenerator to be used to specify the target XPath
	 */
	registerXPathGenerator: function(client, XPathGenerator)
	{
		if(client && client != null)
			client.XPathGenerator = XPathGenerator;
	},

	/**
	 * This private function notifies all Yule clients subscribed for this type of event 
	 * @param domEvent - Actual Dom Event object    
	 * @param obj - browserObj or windowObj where event occurred     
	 * @param eventCallback - event descriptor object    
	 */
	// 	_notifyClients
	_notifyClients : function(domEvent, obj, eventCallback){
		debug("in _notifyClients")
		var eventName = eventCallback.type;
		var clientsSet = this._eventToClientsMap[eventName];
		debug('notifying ' + clientsSet.size() + ' clients of event ' + eventName);
		var client;
		var event;
		for(var i = 0; i < clientsSet.size(); i++)
		{
			client = clientsSet.elements()[i];
			try{
				// generate XPath TODO: possibly provide a default XPath Generator, but try to avoid overhead...
				event = eventCallback.createEvent(domEvent, obj);
				if (event && event.hasTarget())
				{
					if("XPathGenerator" in client && client.XPathGenerator)
						event.setTargetXpath(client.XPathGenerator(event.getTarget())); 
				}
				client(event);
			}catch(e){
				var msg = 'client caused an exception: ' + e.toSource() +
					';' + e.toString() + "\n" + Components.stack;
				if(Preferences.CLIENTEXCEPTION_DEBUGGING)
				{
					consoleService.logStringMessage("yule: " + msg );
					dump("yule: " + msg + "\n");
				}
				debug(msg);
				dump('client caused an exception: ' + e.toSource() + '; ' +
					e.toString() + '\n');
				// remove client that doesn't behave well
				if(!this.prefs.DEBUG_YULE){
					msg = "revoking client's subscription for event " + eventName
					if(Preferences.CLIENTEXCEPTION_DEBUGGING)
					{
						consoleService.logStringMessage("yule: " + msg );
						dump("yule: " + msg + "\n");
					}
					debug(msg);
					this._removeClient(eventName, client);
					i--; // unregistering a client splices the item out of the list
				}
			}
		}
	},

	/**
	 * This private function unsubscribes the client from the eventName
	 * if no clients are subscribed for the event, event becomes enactive  
	 * @param {String} eventName - event from which the client has to be unsubscribed    
	 * @param {Function} client - call back function provided by the client    
	 */
	_removeClient: function(eventName, client){
		var clientsSet = this._eventToClientsMap[eventName];
		
		clientsSet.remove(client);  // Set.remove() will handle nonexistent events
		if(clientsSet.size() === 0) // if no subscribed clients, make event inactive
		{  
			if(this._allRegisteredBrowserEventsSet.contains(eventName)){
				this._unregisterAllBrowsersWithEventDescriptor(eventName); // TODO:  If listened at all!!!
				this._activeBrowserEventsSet.remove(eventName);
			}
			
			if(this._allRegisteredWindowEventsSet.contains(eventName)){
				this._unregisterAllWindowsWithEventDescriptor(eventName);
				this._activeWindowEventsSet.remove(eventName);
			}
			
			debug("Event " + eventName + " became inactive");
		}
	},

//===================================================================
// Event Registration Section  
// 	registerEventDescriptor	
/**
	 *	This PUBLIC function allows to register custom event descriptors with Recorder
	 * @param {String} eventName - custom event name to be registered 
	 * @param eventDescriptor - custom event descriptor class (uninstantiated)
	 */
	registerEventDescriptor : function(eventName, eventDescriptor, scope) {
		// TODO: Provide APIs to register custom events and eventDescriptors with Recorder
		//if (eventName == DIALOG_CREATE_EVENT) debug("registerEventDescriptor: starting", true)
		this._eventToDescriptorMap[eventName] = new eventDescriptor(this);
		this._eventToClientsMap[eventName] = new Set();
		if(scope == "browser" || scope == "both")
			this._allRegisteredBrowserEventsSet.add(eventName);
		if(scope == "window" || scope == "both")
			this._allRegisteredWindowEventsSet.add(eventName);
		//if (eventName == DIALOG_CREATE_EVENT) debug("registerEventDescriptor: done", true)
	},

	/**
	 * This PUBLIC function allows clients to get the list all available events in the Yule 
	 * @return Array of String event names     
	 * @type Array
	 */
	getAllRegisteredEventDescriptors : function() {
		return this._allRegisteredBrowserEventsSet.elements().concat(this._allRegisteredWindowEventsSet.elements());
	},
	
};	// end of Yule.prototype


var yule = new Yule();

