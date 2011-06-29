[v2.0.0] SimplrJS
=============

Description
-----------

SimplrJS ( Simplr ) is javascript platform for developing flexable, dynamic, ajaxy web applications with a stressing MVC and resource driven url design patterns.

Requirments
-----------


Installation & Requirments
-----------

jQuery (1.6+) is required for underlying javascript support.  SimplrJS is NOT a jQuery plugin, but instead leverages jQuery as needed for DOM manipulation.
Just include this javascript library with jQuery and start coding away!

Change Log
------------

v2.0.0

	Features:
		- Simplr.Core.*, core functionality now available for use in your applications.

	Bug Fixes:
		- Simplr.Controller.mRouteAndExecute(), expects properly encoded urls using encodeURI and encodeURIComponent for parameters.

	Refactor:
		- Refactor simplr object for consistency.  Simplr Object references have been updated to uppercase. 
		Examples: [old] simplr.util.mEmpty() --> [new] Simplr.Util.mEmpty()

Functionality
---------------

* Simplr.Core.*
	+	Simplr.Core.Console.*
		-	Simplr.Core.Console.mGetMessageTemplate()
		-	Simplr.Core.Console.mMessage()
	+	Simplr.Core.Ui.*
		-	Simplr.Core.Ui.mElementInfo()
		-	Simplr.Core.Ui.mWindowInfo()
	+	Simplr.Core.Ui.Widget.*
		-	Simplr.Core.Ui.Widget.mGenerateWidgetID()
	+	Simplr.Core.Util.*
		-	Simplr.Core.Util.mEmpty()
		-	Simplr.Core.Util.mEqual()
		-	Simplr.Core.Util.mGetUrlParameter()
		-	Simplr.Core.Util.mHasLocalStorage()
	+	Simplr.Core.Validation.*
		-	Simplr.Core.Validation.mAddCodes()
		-	Simplr.Core.Validation.mAddValidators()
		-	Simplr.Core.Validation.mGetCodes()
		-	Simplr.Core.Validation.mGetCodeMessage()
		-	Simplr.Core.Validation.mGetRuleResultsTemplate()
		-	Simplr.Core.Validation.mGetValidators()
		-	Simplr.Core.Validation.mValidate()

Usage
-----
see [SimplrJS Documentation](http://simplrjs.com/docs/)
