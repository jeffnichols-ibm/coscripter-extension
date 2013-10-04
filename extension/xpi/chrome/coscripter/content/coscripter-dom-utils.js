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


var CoscripterDomUtils = new Object();


CoscripterDomUtils.getElementsByClass=function(p,c,l,d, f) {
    if ( f == null )
      f = new Array();
      
    if ( d == null )
      d = 0;
   
    if ( CoscripterDomUtils.isClass(p,c) ) {
       f[f.length]=p;
    }
    
    if ( l == null || ( d < l ) ) {       
       var children = p.childNodes;
    	
       for (var i=0; i<children.length;i++) {
           CoscripterDomUtils.getElementsByClass(children[i],c,l,d+1,f);
       }
    }
    
    return f;    
}


CoscripterDomUtils.getParentByClass=function(p, c) {
   while ( p ) {
      if ( CoscripterDomUtils.isClass(p, c) ) 
         return p;
      else
         p = p.parentNode;
   }
   return null;
}

CoscripterDomUtils.getElementsByTagName=function(p,t) {
    var found = new Array();
    var children = p.childNodes;
     
    if ( children == null ) 
       return found;
       
    for (var i=0; i<children.length;i++) {
        var child = children.item(i);

        var tn = child.tagName;
        
        if ( tn == null )
           continue;
           
        if ( tn.toUpperCase()==t.toUpperCase()) {
           found[found.length]=child;
         }
        
        var childfound = CoscripterDomUtils.getElementsByTagName(child,t);
        for (var j=0; j<childfound.length;j++) {
            found[found.length]=childfound[j];
        }
        
    }
     
    return found;    
}

CoscripterDomUtils.concatElementNodeValues=function(n) {
   var str = "";
   
   if ( n == null )
      return str;
      
   if ( n.nodeValue && n.nodeValue != '')
      str += CoscripterDomUtils.trimString(n.nodeValue) + " ";
      
   var children = n.childNodes;
     
   if ( children == null ) 
       return str;
       
   for (var i=0; i<children.length;i++) {
       var child = children[i];
       str += CoscripterDomUtils.concatElementNodeValues(child);
   }
    
   return str;
}


CoscripterDomUtils.trimString=function(str) {
    return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
}

// This exists to standardize the className attribute of 
// an element before it is dealt with: each class should occur 
// only once if it occurs, and information should be stored in the 
// "className", not the "class." (Issues of reserved keywords/IE wonkiness)
CoscripterDomUtils.consolidateClasses = function(n, checkNeed)
{
	if (checkNeed)
	{
		if (!n || !n.getAttribute)
			return;		// no object or attribute getter
		var classAtt = n.getAttribute("class");
		if (!classAtt || (classAtt == n.className))
			return;		// no need to copy
	}
	else
		var classAtt = n.getAttribute("class");
	n.removeAttribute("class");
	var classes = classAtt.split(" ");
	for (var i = 0; i < classes.length; i++)
		CoscripterDomUtils.addClass(n, classes[i], true);
}


CoscripterDomUtils.isClass=function(n, c, cs) {
      
   if ( !n ) 
        return false;
        
   if (!n.className)    
   		return false;
   		
   var ci = n.className.indexOf(c);
   
   if ( ci < 0 )
        return false;
        
   if ( n.className.charAt(ci+c.length) == ' ' )
        return true;
        
   if ( n.className.length == ci + c.length )
        return true;
   
   return false;
}

CoscripterDomUtils.addClass=function(n, c, cs) {
   //CoscripterDomUtils.consolidateClasses(n, true);
   if ( !n )
       return;
       
   if ( CoscripterDomUtils.isClass(n,c, cs) ) 
       return;
   else if ( !n.className ) 
      n.className = c;
   else
      n.className = n.className + " " + c;
}

CoscripterDomUtils.removeClass=function(n,c, cs) {
   //CoscripterDomUtils.consolidateClasses(n, true);
   
   if ( CoscripterDomUtils.isClass(n,c, cs) ) { 
		var oc = n.className;
		var ci = oc.indexOf(c);
		var nc = oc.substring(0,ci) + oc.substring(ci+c.length);
		n.className = CoscripterDomUtils.trimString(nc);
   }
   else
      return;
}

CoscripterDomUtils.getOffsetLeft=function(n) {
   if ( n == null )
      return 0;
   else
      return n.offsetLeft + CoscripterDomUtils.getOffsetLeft(n.offsetParent);

}

CoscripterDomUtils.getOffsetTop=function(n) {
   if ( n == null )
      return 0;
   else
      return n.offsetTop + CoscripterDomUtils.getOffsetTop(n.offsetParent);
}

CoscripterDomUtils.getOffsetWidth=function(n) {
   return n.offsetWidth;
}

CoscripterDomUtils.getOffsetHeight=function(n) {
   return n.offsetHeight;
}

// function exists to work around IE's incorrect setAttribute
CoscripterDomUtils.setAttribute = function(element, name, value)
{
	if (!element.getAttribute(name))
		element.removeAttribute(name);
	element.setAttribute(name, value);
}

CoscripterDomUtils.getParents=function(n, sp) {
   var pl = new Array();
   pl[pl.length] = n;
   var p = n.parentNode;
   while ( p != null && p != sp ) {
      pl[pl.length] = p;
      p = p.parentNode;
   }
   var plr = new Array();
   for ( var i = 0; i < pl.length; i++ ) {
      plr[plr.length] = pl[pl.length-1-i];
   }
   return plr;
}

CoscripterDomUtils.getLeftNode=function(a, b, sp) {
   if ( a == null || b == null )
      return null;
      
   var apl = CoscripterDomUtils.getParents(a, sp);
   var bpl = CoscripterDomUtils.getParents(b, sp);
   
   var mls = apl.length > bpl.length ? bpl.length : apl.length;
   
   for ( var i = 0; i < mls; i++ ) {
      var ap = apl[i];
      var bp = bpl[i];
      if ( ap != bp ) {
          var p = ap.parentNode;
          for ( var c = 0; c < p.childNodes.length; c++ ) {
             if ( p.childNodes[c] == ap ) 
                return a;
             else if ( p.childNodes[c] == bp ) 
                return b;
          }
      }   
   }
   return a;
}

CoscripterDomUtils.getRightNode=function(a, b, sp) {
   var left = CoscripterDomUtils.getLeftNode(a, b, sp);
   if ( left == null )
      return null;
      
   return left == a ? b : a;
}

CoscripterDomUtils.getRangeNodes=function(a, b, rn) {
   var left = CoscripterDomUtils.getLeftNode(a,b, rn);
   var right = left == a ? b : a;
   
   return CoscripterDomUtils.getOrderedRangeNodes(left, right, rn);
}

CoscripterDomUtils.getOrderedRangeNodes=function(l, r, rn) {
   if ( rn == null )
      rn = new Array();
      
   if ( l != null ) {
      rn[rn.length] = l;
   }
   
   if ( l == r || l == null) 
      return rn;
      
   if ( l.nextSibling ) {
      l = l.nextSibling;
      if ( l == r ) {
         rn[rn.length] = r;
         return rn;
      }
      while ( l.firstChild ) {
         l = l.firstChild;
         if ( l == r ) {
            rn[rn.length] = r;
            return rn;
         }
      }
      return CoscripterDomUtils.getOrderedRangeNodes(l, r, rn);
   }
   else {
      return CoscripterDomUtils.getOrderedRangeNodes(l.parentNode, r, rn);
   }
}

CoscripterDomUtils.getSubtreeNodes=function(n, rn) {
   if ( rn == null ) 
      rn = new Array();
      
   if ( n != null ) 
      rn[n] = n;
      
   if ( n.childNodes ) {
       for ( var i = 0; i < n.childNodes.length; i++ ) {
           var c = n.childNodes[i];
           CoscripterDomUtils.getSubtreeNodes(c, rn);
       }
   }
   
   return rn;
}

CoscripterDomUtils.setText=function(n, t) {
   if ( n.nodeName == "#text" ) 
      n.nodeValue = t;
   else if ( n.firstChild && n.firstChild == n.lastChild  && n.firstChild.nodeName == "#text" ) {
      n.firstChild.nodeValue = t;
   }
}

CoscripterDomUtils.getText=function(n, t) {
   if ( n.nodeName == "#text" ) 
      return n.nodeValue;
   else if ( n.firstChild && n.firstChild == n.lastChild  && n.firstChild.nodeName == "#text" ) {
      return n.firstChild.nodeValue;
   }
   
   return null;
}


