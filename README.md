CoScripter Extension
====================

CoScripter is a system for recording, automating, and sharing business processes performed in a web browser such as printing photos online, requesting a vacation hold for postal mail, or checking a bank account balance. CoScripter lets you make a recording as you perform a procedure, play it back later automatically, and share it with your friends.

CoScripter consists of two software components, a browser extension that runs in the Firefox browser and a online wiki-style database that stores scripts for later execution. This repository contains the source code for the CoScripter browser extension for Firefox. Code for the server can be found [here](http://github.com/jeffnichols-ibm/coscripter-server).

Contents
--------

This respository contains three sub-extensions that together implement the full functionality of the CoScripter extension.

*	__YULE__ is the event recording infrastructure for CoScripter.  It enables recording across multiple windows and tabs without requiring any work by the application developer, and was designed for easy extensibility.

*	__CoScripter Platform__ contains all of the non-UI modules of CoScripter, including the parser for the CoScripter language (ClearScript) and an execution engine for CoScripter events.  Other systems that wish to automate the web browser can be built on top of the CoScripter platform with requiring the presence of the CoScripter UI.

*	__CoScripter Extension__ contains the UI for the CoScripter, including the sidebar that allows users to view and execute scripts.  The extension can run separately, but works best when paired with the [Ruby on Rails-based server](http://github.com/jeffnichols-ibm/coscripter-server).

License
-------

The CoScripter source is provided as-is under the Mozilla Public License.  This code has not been actively maintained since at least 2012 so your mileage my vary, though it is known to function in recent versions of Firefox (including version 23.0.1).
