// v2.2.0
(function() {

	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.remove = function(from, to) {
	  var rest = this.slice((to || from) + 1 || this.length);
	  this.length = from < 0 ? this.length + from : from;
	  return this.push.apply(this, rest);
	};

	window.Simplr = {
		Config : {
			Data : {
				ConsoleActive : false
			},
			mToggleConsole : function(on) {
				$("#_simplr_core_console").remove();
				Simplr.Config.Data.ConsoleActive = false;
				if(on) {
					try {
						if( typeof window.console != "undefined" && typeof window.console.group != "undefined") {
							$(function() {
								var consoleHTML = '<p id="_simplr_core_console" style="margin: 0; text-align: center; position: fixed; top: 0; width: 100%; left: 0; border-bottom: 1px solid #000; color: #fff; font-weight: bold; background-color: #f00; padding: 5px; font-size: 11px; opacity: .75;">[console]: Console Messaging Active</p>';
								$("body").append(consoleHTML);
								$("#_simplr_core_console").mouseover(function() { $(this).slideUp(); }).mouseout(function() { $(this).delay(3000).slideDown(); });
							});
							Simplr.Config.Data.ConsoleActive = true;
						}
					} catch(e) {}
				}
				return Simplr.Config.Data.ConsoleActive;
			}
		}
	};

	(function() {
	
	var browserData = {
		UserAgent : ""
	};
	
	Simplr.Browser = {
	
		mAddressBarHeight : function() {
			var deviceID = Simplr.Browser.mDevice();
			return (deviceID == "iPhone" || deviceID == "iPod" || deviceID == "iPad") ? 60 : 0;
		},
		
		mDevice : function() {
			if(browserData.UserAgent.match(/iPhone/i)) {
				return "iPhone";
			} else if(browserData.UserAgent.match(/iPod/i) ) {
				return "iPod";
			} else if(browserData.UserAgent.match(/iPad/i)) {
				return "iPad";
			} else if(browserData.UserAgent.match(/Android/i)) {
				return "Android";
			}
			return "other";
		},

		mLocalStorageCapable : function() {
			return Simplr.Core.Util.mHasLocalStorage();
		},
		
		mSetUserAgent : function(uaString) {
			browserData.UserAgent = uaString;
		},
		
		mTouchCapable : function() {
			var deviceID = Simplr.Browser.mDevice();
			return (deviceID == "iPhone") || (deviceID == "iPod") || (deviceID == "iPad") || (deviceID == "Android");
		}
			
	};
	
	Simplr.Browser.mSetUserAgent(navigator.userAgent);
	
})();
(function() {
	
	function createTimeKey(key) {
		return key;
	};
	
	function createDataKey(key) {
		return key + "_data";
	};
	
	function createTimeValue(key, freshness) {
		return key + "|" + (new Date().getTime()+freshness);
	};
	
	Simplr.Cache = {
		
		mExpire : function(key) {
			if(Simplr.Core.Util.mHasLocalStorage()) {
				localStorage.removeItem(createTimeKey(key));
				localStorage.removeItem(createDataKey(key));
			}
			return null;
		},
		
		mGet : function(options) {
			var options = $.extend({ key : "", identifier : ""}, options);
			if(Simplr.Core.Util.mHasLocalStorage() && (options.key != "")) {
				var timeData = localStorage.getItem(createTimeKey(options.key));
				if(timeData != null) {
					var timeParts = timeData.split("|");
					if( timeParts.length == 2 ) {
						if(timeParts[0] == options.identifier) {
							if(new Date().getTime() <= (parseInt(timeParts[1], 10))) {
								return localStorage.getItem(createDataKey(options.key));
							} else {
								Simplr.Cache.mExpire(options.key);
							}
						}
					}
				}
			}
			return null;
		},
		
		mSet : function(options) {
			var options = $.extend({ key : "", identifier : "", data : "", freshness : 600000 }, options);
			if(Simplr.Core.Util.mHasLocalStorage()) {
				if(options.key != "") {
					localStorage.setItem(createTimeKey(options.key), createTimeValue(options.identifier, options.freshness));
					localStorage.setItem(createDataKey(options.key), options.data);
				}
			}
			return options.data;
		}
			
	};
	
})();(function() {

	function htmlEntities(string) {
		return string.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	};
	
	var ControllerData = {
		CRUD : { 
			"view" : true, 
			"new" : true, 
			"update" : true, 
			"delete" : true 
		},
		Commands : {},
		Bases : {}
	};
	
	Simplr.Controller = {
		
		mAddBases : function(bases) {
			var collection = $.isArray(bases) ? bases : [ bases ];
			for(var i = 0, iL = collection.length; i < iL; i++) {
				ControllerData.Bases[collection[i]] = 1;
			}
		},
		
		mAddCommands : function(commands) {
			for(var name in commands) {
				var tmp = $.extend({ route : [], callback : function() {} }, commands[name]);
				var key = tmp.route.join("_");
				if( key != "" )
				{ ControllerData.Commands[key] = tmp.callback; }
			}
		},
		
		mData : function() {
			return ControllerData;
		},
		
		mExecute : function(data) {
			var key = data.route.join("_");
			if($.isFunction(ControllerData.Commands[key])) {
				ControllerData.Commands[key](data); 
			}
		},
		
		mRoute : function(url) {
			var ret = { route : [], url : url, base : "", resources : {}, action : "", parameters : {} };
			
			// remove hash
			if(ret.url.charAt(0) == "#") {
				ret.url = ret.url.substring(1);
			}
			// remove bang
			if(ret.url.charAt(0) == "!") {
				ret.url = ret.url.substring(1);
			}
			
			var urlArray = ret.url.split("?");
			urlArray[0] = decodeURI(urlArray[0]);
			
			/* 1. Find the base and remove if its there */
			var tmpURL = urlArray[0];
			for(var base in ControllerData.Bases) {
				if( (urlArray[0] = urlArray[0].replace(base, "")) != tmpURL ) { 
					ret.base = base; ret.route.push(base); break;
				}
			}
			
			/* 2. Get CRUD Operation */
			urlArray[0] = urlArray[0].split("/");
			ret.action = urlArray[0][urlArray[0].length-1];
			ret.action = ControllerData.CRUD[ret.action] ? ret.action : "view";
			
			/* 3. Get the Resources */
			var isResource = true;
			var res = "";
			for(var x = 0, xL = urlArray[0].length-1; x < xL; x++)
			{
				if(urlArray[0][x] != "")
				{
					if( isResource )
					{ 
						res = urlArray[0][x];
						ret.route.push(res);
						ret.resources[res] = ""; 
					}
					else
					{ ret.resources[res] = urlArray[0][x]; }
					isResource = !isResource;
				}
			}
			
			/* 4. Get Parameters */
			if( urlArray[1] )
			{ 
				var kvArr = urlArray[1].split("&");
				for(var i = 0, iL = kvArr.length; i < iL; i++) {
					var keyValue = kvArr[i].split("=");
					ret.parameters[keyValue[0]] = $.trim(htmlEntities(decodeURIComponent(keyValue[1])));
				}
			}
			
			ret.route.push(ret.action);
			return ret;
		},
		
		mRouteAndExecute : function(hashURLPart) {
			Simplr.Controller.mExecute(Simplr.Controller.mRoute(hashURLPart));
		}
	};
	
	$(window).on("hashchange", {}, function() {
		Simplr.Controller.mRouteAndExecute(window.location.hash);
	});
	
})();/*
    http://www.JSON.org/json2.js
    2011-02-23

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
Simplr.Conversion = {
	// We use json2.js to do the actual conversion.
	mObjectToJSONString : function(value, replacer, space) {
		return JSON.stringify(value, replacer, space);
	},
	mJSONStringToObject : function(text, reviver) {
		return JSON.parse(text, reviver);
	}
};
		
	Simplr.Cookie = {
	mGet : function(options) {
		var opts = $.extend({ name : "" }, options);
		if( document.cookie.length > 0 && !Simplr.Core.Util.mEmpty(opts.name)) {
			var r = document.cookie.match( '(^|;) ?' + opts.name + '=([^;]*)(;|$)');
			if(r) {
				return decodeURIComponent(r[2]);
			}
		}
		return null;
	},
	mSet : function(options) {
		var opts = $.extend({ name : "", value : "", expireDays : null, path : "/", domain : null, secure : false }, options);
		if( !Simplr.Core.Util.mEmpty(opts.name) ) {
			var cookieString = opts.name + "=" + encodeURIComponent(opts.value);
			if(!Simplr.Core.Util.mEmpty(opts.expireDays)) {
				var expirationDate = new Date();
				expirationDate.setTime(expirationDate.getTime() + (opts.expireDays * 86400000));
				cookieString += "; expires=" + expirationDate.toUTCString();
			}
			cookieString += !Simplr.Core.Util.mEmpty(opts.path) ? "; path=" + opts.path : "";
			cookieString += !Simplr.Core.Util.mEmpty(opts.domain) ? "; domain=" + opts.domain : "";
			cookieString += opts.secure ? "; secure" : "";
			document.cookie = cookieString;
			return true;
		}
		return false;
	},
	mExpire : function(options) {
		return Simplr.Cookie.mSet($.extend({ name : "", expireDays : -1}, options));
	}
};Simplr.Core = {};(function() {
	
	function renderMessages(data) {
		if( $.isArray(data.message) ) {
			console.group(data.group);
			for(var i = 0, iL = data.message.length; i < iL; i++) {
				var newMessageData = $.extend(Simplr.Core.Console.mGetMessageTemplate(), data.message[i]);
				renderMessages(newMessageData);
			}
			console.groupEnd();
		} else {
			console.group(data.message);
			console.log(data.data);
			console.groupEnd();
		}
	};
	
	Simplr.Core.Console = {
			
		mGetMessageTemplate : function() {
			return { group : "", message : "", data : "" };
		},

		mMessage : function(options) {
			if(Simplr.Config.Data.ConsoleActive) {
				var messageData = $.extend(Simplr.Core.Console.mGetMessageTemplate(), options);
				renderMessages(messageData);
			}
		}
		
	};
	
})();(function() {
	
	var hasLocalStorage = typeof localStorage == "undefined" ? false : true;
	
	function htmlEntities(string) {
		return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	};
	
	function equal(thing1, thing2) {
		if( typeof thing1 == typeof thing2 ) {
			if(typeof thing1 == "object") {
				if( $.isArray(thing1) ) {
					if( thing1.length == thing2.length ) {
						for(var i = 0, iL = thing1.length; i < iL; i++) {
							if( !equal(thing1[i], thing2[i]) ) { 
								return false; 
							}
						}
						return true;
					}
					return false;
				} else {
					var ret = true;
					for(var key in thing1) {
						if( !equal(thing1[key], thing2[key]) ) { 
							ret = false; return false; 
						}
					}
					if(ret) {
						var l1 = 0;
						var l2 = 0;
						for(var key in thing1) {
							l1++;
						}
						for(var key in thing2) {
							l2++;
						}
						return l1 == l2;
					}
					return false;
				}
			} 
			return thing1 == thing2; 
		}
		return false;
	};
	
	Simplr.Core.Util = {
		mEmpty : function(thing) {
			var typeOfThing = typeof thing;
			if( typeOfThing != "undefined" && thing != null ) {
				if(typeOfThing == "object") {
					if($.isArray(thing)) {
						return thing.length == 0;
					}
					return $.isEmptyObject(thing);
				}
				return $.trim(thing) == "";				
			}
			return true;
		},
		mEqual : function(things) {
			if( !Simplr.Core.Util.mEmpty(things) ) {
				if( $.isArray(things) ) {
					var valid = true;
					for(var i = 0, iL = things.length; i < iL; i++) {
						if( !equal(things[0], things[i]) ) {
							valid = false;
							i = iL;
						}
					}
					return valid;
				} 
				return true;
			}
			return true;
		},
		mGetUrlParameter : function(name) {
			var string = window.location.search;
			if(!Simplr.Core.Util.mEmpty(string)) {
				var parameters = {};
				string = string.substring(1).split("&");
				for(var i = 0, iL = string.length; i < iL; i++) {
					var keyValue = string[i].split("=");
					parameters[keyValue[0]] = $.trim(htmlEntities(decodeURIComponent(keyValue[1])));
				}
				if(Simplr.Core.Util.mEmpty(name)) {
					return parameters;
				} else {
					var value = parameters[name];
					return typeof value == "undefined" ? null : value;
				}
			} else { 
				return null;
			}
		},
		mHasLocalStorage : function() {
			return hasLocalStorage;
		}
	};
	
})();(function() {
	
	var widgetIDs = {};
	
	Simplr.Core.Ui = {
		mElementInfo : function(options) {
			var opts = $.extend({ selector : "body" }, options);
			var jqThisElement = $(opts.selector).eq(0);
			var dimensions = [ jqThisElement.width(), jqThisElement.height() ];
			var offsets = jqThisElement.offset();
			offsets = [ offsets.left, offsets.top ];
			return { offsets : offsets, dimensions : dimensions };
		},
		mWindowInfo : function() {
			var screenInfo = {
				offsets : [0, 0],
				dimensions : [0, 0]
			};
			
			// Offsets
			if (typeof window.pageYOffset == 'number') { 
				// Netscape compliant
				screenInfo.offsets = [window.pageXOffset, window.pageYOffset];
			} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) { 
				// DOM compliant
				screenInfo.offsets = [document.body.scrollLeft, document.body.scrollTop];
			} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
				// IE6 standards compliant mode
				screenInfo.offsets = [document.documentElement.scrollLeft, document.documentElement.scrollTop];
			}

			// Width and Height
			if( typeof window.innerWidth == 'number' ) {
				// NON IE
				screenInfo.dimensions = [window.innerWidth, window.innerHeight];
			} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
				// IE 6 plus in standards compliant mode
				screenInfo.dimensions = [document.documentElement.clientWidth, document.documentElement.clientHeight];
			}
			return screenInfo;
		},
		Widget : {
			mGenerateWidgetID : function() {
				var num = Math.floor(Math.random()*10000000);
				if(Simplr.Core.Util.mEmpty(widgetIDs[num])) {
					widgetIDs[num] = true;
					return num;
				} else {
					return Simplr.Core.Ui.Widget.mGenerateWidgetID();
				}
			}
		}
	}	
	
	
})();(function($) {
	
	function mergeValidationResults(key, rule, newData, existingData) {
		existingData.codes[key].success = existingData.codes[key].success.concat( newData.successCodes );
		existingData.codes[key].error = existingData.codes[key].error.concat( newData.errorCodes );
		if( !newData.valid ) { existingData.valid = false; }
	};
	
	function replaceTokens(keys, message) {
		var results = message;
		for(var token in keys) {
			results = results.replace(new RegExp("\\$\\[" + token + "\\]", "g"), escape(keys[token]));
		}
		return unescape(results);
	};
	
	var data = {
		codes : {
			eEmpty : "$[label] is empty.",
			eMissingValidator : "Missing Validator"
		},
		codeResultsTemplate : { 
			success : [], 
			error : []
		},
		defaultCodeMessage : "$[label] is UNDEFINED",
		ruleResultsTemplate : { 
			valid : true, 
			successCodes : [], 
			errorCodes : []
		},
		validators : {
			missingvalidator : function(value) { 
				return $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : false, errorCodes : [ "eMissingValidator" ] }); 
			},
			notempty : function(value) {
				var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate());
				if( typeof value != "undefined" && value != null ) {
					if( typeof value == "string" ) { results.valid = !($.trim(value) == ""); }
					else if( $.isArray(value) ) { results.valid = !(value.length == 0); }
					else if( typeof value == "object" ) { results.valid = !$.isEmptyObject(value); }
				}
				if(!results.valid) { results.errorCodes.push("eEmpty"); }
				return results;
			}
		},
		validationResultsTemplate : { 
			data : "", 
			valid : true, 
			codes : {}
		}
	};
	
	
	Simplr.Core.Validation = {
		mAddCodes : function(obj) {
			$.extend(data.codes, obj);
		},
		mAddValidators : function(obj) {
			$.extend(data.validators, obj);
		},
		mData : function() {
			return data;
		},
		mGetCodeMessage : function(code, label) {
			if( data.codes[code] != undefined ) {
				return replaceTokens({ label : label }, data.codes[code]);
			}
			return replaceTokens({ label : code }, data.defaultCodeMessage);
		},
		mGetRuleResultsTemplate : function() {
			return $.extend(true, {}, data.ruleResultsTemplate);
		},
		mValidate : function(dataObject) {
			var results = $.extend(true, {}, data.validationResultsTemplate, { data : $.extend(true, {}, dataObject)});
			for(var key in results.data) {
				// Check the Rules for this data
				var entry = results.data[key];
				results.codes[key] = $.extend(true, {}, data.codeResultsTemplate);
				for(var i = 0, iL = entry.rules.length; i < iL; i++) {
					var rule = entry.rules[i];
					var tmpValidationData = $.extend(true, {}, data.ruleResultsTemplate);
					if( data.validators[rule] ) { 
						tmpValidationData = data.validators[rule](entry.value); 
					} else { 
						tmpValidationData = data.validators["missingvalidator"](entry.value); 
					}
					mergeValidationResults(key, rule, tmpValidationData, results);
				}
				// Cleanup Data
				if( results.codes[key].error.length == 0 && results.codes[key].success.length == 0 ) { 
					delete results.codes[key]; 
				}
			}
			return results;
		}
	};
	
})(jQuery);/* Add Codes */
Simplr.Core.Validation.mAddCodes({ 
	eMissingValidator : "Missing Validator",
	eAlphaNumeric : "$[label] is not alphanumeric.",
	eAmericanExpress : "$[label] is not a valid AMERICAN EXPRESS number.",
	eDinersClub : "$[label] is not a valid DINERS CLUB number.",
	eDiscover : "$[label] is not a valid DISCOVER number.",
	eEmail : "$[label] is not an email address.",
	eEqual : "$[label] does not match.",
	eMastercard : "$[label] is not a valid MASTERCARD number.",
	eEmpty : "$[label] is empty.",
	eNumber : "$[label] is not a number.",
	ePhoneNumber : "$[label] is not a valid Phone Number.",
	ePostalCode : "$[label] is not a Postal Code.",
	eVisa : "$[label] is not a valid VISA number."
});

/* Add Validators */
Simplr.Core.Validation.mAddValidators({
	/* Missing Validator */
	missingvalidator : function(value) { 
		return $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : false, errorCodes : [ "eMissingValidator" ] }); 
	},
	
	alphanumeric : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^\w*$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eAlphaNumeric"); }
		return results;
	},
	americanexpress : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^3(4|7)\d{2}-?\d{6}-?\d{5}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eAmericanExpress"); }
		return results;
	},
	dinersclub : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^3[0,6,8]\d{12}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eDinersClub"); }
		return results;
	},
	discover : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^6011-?\d{4}-?\d{4}-?\d{4}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eDiscover"); }
		return results;
	},
	email : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eEmail"); }
		return results;
	},
	equal : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate());
		if( $.isArray(value) ) { 
			for(var i = 0, iL = value.length; i < iL; i++) {
				if(!Simplr.Core.Util.mEqual([value[0], value[i]])) {
					results.valid = false; 
					i = iL;
				}
			}
		}
		if( !results.valid ) { results.errorCodes.push("eEqual"); }
		return results;
	},
	mastercard : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^5[1-5]\d{2}-?\d{4}-?\d{4}-?\d{4}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eMastercard"); }
		return results;
	},
	notempty : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate());
		if( typeof value != "undefined" && value != null ) {
			if( typeof value == "string" ) { results.valid = !($.trim(value) == ""); }
			else if( $.isArray(value) ) { results.valid = !(value.length == 0); }
			else if( typeof value == "object" ) { results.valid = !$.isEmptyObject(value); }
		}
		if(!results.valid) { results.errorCodes.push("eEmpty"); }
		return results;
	},
	number : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : ( !isNaN(parseFloat(value)) && isFinite(value) ) });
		if( !results.valid ) { results.errorCodes.push("eNumber"); }
		return results;
	},
	phonenumber : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^\d{10}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("ePhoneNumber"); }
		return results;
	},
	postalcode : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^\d{5}([\-]?\d{4})?$/.test(value) });
		if( !results.valid ) { 
			results.errorCodes.push("ePostalCode") 
		}
		return results;	
	},
	visa : function(value) {
		var results = $.extend(true, {}, Simplr.Core.Validation.mGetRuleResultsTemplate(), { valid : /^4\d{3}-?\d{4}-?\d{4}-?\d{4}$/.test(value) });
		if( !results.valid ) { results.errorCodes.push("eVisa"); }
		return results;
	}
});(function() {
	
	function render(selector, obj) {
		var specClass = "_simplr";
		var classes = FormData.Classes;
		
		// Reset the Form
		$("."+classes.FormError + "," + "."+classes.FieldError, selector).filter("." + specClass).removeClass(classes.FormError).removeClass(classes.FieldError);
		$("."+classes.TextInformation + "," + "."+classes.TextError, selector).filter("." + specClass).remove();
		
		// Create the Messages
		for(var key in obj.codes) {
			var msgObject = obj.codes[key];
			var msgArray = [ msgObject.error, msgObject.success ];
			var html = "";
			for(var i = 0; i < 2; i++) {
				// Only showing 1 message at a time.
				if(msgArray[i].length > 0) {
					html += '<p class="' + (( i == 0) ? classes.TextError : classes.TextInformation) + ' ' + specClass + '">' + Simplr.Core.Validation.mGetCodeMessage(msgArray[i][0], obj.data[key].label) + '</p>';
				}
			}
			
			// Now find the Form Entry to put the message html
			$("[name='" + key + "']:first", selector).addClass(classes.FieldError + " " + specClass).closest("."+classes.FormEntry).addClass(classes.FormError + " " + specClass).append(html);
		}
	};
	
	function transformValues(values) {
		var validationAndRenderValues = {};
		for(var key in values) {
			var label = FormData.Labels[key] ? FormData.Labels[key] : FormData.DefaultLabel;
			var validationObject = { value : values[key], label : label, rules : [] };
			// Add Validators as needed
			for(var i = 0, iL = FormData.DefaultRules.length; i < iL; i++) {
				validationObject.rules.push(FormData.DefaultRules[i]);
			}
			if($.isFunction(FormData.Rules[key])) {
			  FormData.Rules[key](validationObject.rules);
			}
			// Return the Transformed Data
			validationAndRenderValues[key] = validationObject;
		}
		return validationAndRenderValues;
	};
	
	var FormData = {
		Classes : {
			FormEntry : "formEntry",
			FormError : "formError",
			FieldError : "errorField",
			TextError : "errorText",
			TextInformation : "informationText"
		},
		DefaultRules : [ "notempty" ],
		DefaultLabel : "_LABEL_",
		Rules : { },
		Labels : { }
	};
	
	Simplr.Form = {
		mAddValidators : function(obj) {
			Simplr.Core.Validation.mAddValidators(obj);
		},
		mGetValidators : function() {
			return Simplr.Core.Validation.mData().validators;
		},
		mAddCodes : function(obj) {
			Simplr.Core.Validation.mAddCodes(obj);
		},
		mGetCodes : function() {
			return Simplr.Core.Validation.mData().codes;
		},
		mAddLabelAssociation : function(obj) {
			$.extend(FormData.Labels, obj);
		},
		mAddValidationAssociation : function(obj) {
			$.extend(FormData.Rules, obj);
		},
		mGetValues : function(selector) {
			var values = {};
			$("input, select, textarea", selector).each(function() {
				var thisEl = $(this);
				if(thisEl.is("[type='button']") || thisEl.is("[type='reset']") || thisEl.is("[type='submit']") || (thisEl.is("[type='radio']") && !thisEl.is(":checked"))) {
					// Excluded	
				} else if( thisEl.is("[type='checkbox']") ) {
					values[$(this).attr("name")] = $(this).is(":checked") ? ( $(this).val() != "on" ? $(this).val() : true ) : false;
				} else {
					values[$(this).attr("name")] = $(this).val();
				}
			});
			return values;
		},
		mValidateValuesAndRender : function(selector, values) {
			var validationData = transformValues(values);
			var validatedData = Simplr.Core.Validation.mValidate(validationData);
			render(selector, validatedData);
			return validatedData.valid;
		}
	};

})();/*
Written by Steve Tucker, 2006, http://www.stevetucker.co.uk
Full documentation can be found at http://www.stevetucker.co.uk/page-innerxhtml.php
Released under the Creative Commons Attribution-Share Alike 3.0  License, http://creativecommons.org/licenses/by-sa/3.0/

Change Log
----------
15/10/2006	v0.3	innerXHTML official release.
21/03/2007	v0.4	1. Third argument $appendage added (Steve Tucker & Stef Dawson, www.stefdawson.com)
			2. $source argument accepts string ID (Stef Dawson)
			3. IE6 'on' functions work (Stef Dawson & Steve Tucker)
*/

var innerXHTML = function($source,$string,$appendage) {
	/* (v0.4) Written 2006 by Steve Tucker, http://www.stevetucker.co.uk */
	if (typeof($source) == 'string') $source = document.getElementById($source);
	if (!($source.nodeType == 1)) return false;
	var $children = $source.childNodes;
	var $xhtml = '';
	if (!$string) {
		for (var $i=0; $i<$children.length; $i++) {
			if ($children[$i].nodeType == 3) {
				var $text_content = $children[$i].nodeValue;
				$text_content = $text_content.replace(/</g,'&lt;');
				$text_content = $text_content.replace(/>/g,'&gt;');
				$xhtml += $text_content;
			}
			else if ($children[$i].nodeType == 8) {
				$xhtml += '<!--'+$children[$i].nodeValue+'-->';
			}
			else {
				$xhtml += '<'+$children[$i].nodeName.toLowerCase();
				var $attributes = $children[$i].attributes;
 				for (var $j=0; $j<$attributes.length; $j++) {
					var $attName = $attributes[$j].nodeName.toLowerCase();
					var $attValue = $attributes[$j].nodeValue;
					if ($attName == 'style' && $children[$i].style.cssText) {
						$xhtml += ' style="'+$children[$i].style.cssText.toLowerCase()+'"';
					}
					else if ($attValue && $attName != 'contenteditable') {
						$xhtml += ' '+$attName+'="'+$attValue+'"';
					}
				}
				$xhtml += '>'+innerXHTML($children[$i]);
				$xhtml += '</'+$children[$i].nodeName.toLowerCase()+'>';
			}
		}
	}
	return $xhtml;
};(function() {
	
	function convertTokenToString(value) {
		if(typeof value == "object") {
			return Simplr.Layout.mAssembleLayout(value);
		}
		return value;
	};
	
	function loadLayoutComponent(component) {
		while( $(".layout-component", component).size() > 0 ) {
			loadLayoutComponent($(".layout-component:eq(0)", component));
		}
		var componentToLoad = {};
		componentToLoad[component.attr("id").split("-")[1]] = innerXHTML(component.get(0));
		Simplr.Layout.mAddComponents(componentToLoad);
		component.remove();
	};
	
	function getComponent(key) {
		if(typeof LayoutData.Components[key] == "undefined") {
			var layoutEl = $("#layout-"+key);
			if( layoutEl.size() > 0 ) {
				loadLayoutComponent($("#layout-"+key));
			} else {
				LayoutData.Components[key] = null;
			}
		}
		return LayoutData.Components[key];
	};
	
	var LayoutData = {
		Components : {}	,
		GlobalTokens : {}
	};
	
	Simplr.Layout = {
		mAddComponents : function(obj) {
			for(var key in obj) {
				LayoutData.Components[key] = $.trim(obj[key].replace(/\n/g,"").replace(/\s{1,}/g," "));
			}
		},
		
		mAddGlobalTokens : function(globalTokens) {
			$.extend(LayoutData.GlobalTokens, globalTokens);
		},
		
		mAssembleLayout : function(config) {
			var finalResults = "";
			if( config ) {
				if( config.component && config.tokens) {
					var tokenCollections = $.isArray(config.tokens) ? config.tokens : [ config.tokens ];
					for(var i = 0, iL = tokenCollections.length; i < iL; i++) {
						var tmpTokens = {};
						for(var tKey in tokenCollections[i]) {
							tmpTokens[tKey] = convertTokenToString(tokenCollections[i][tKey]);
						}
						finalResults += Simplr.Layout.mReplaceTokens(tmpTokens, Simplr.Layout.mGetComponent(config.component));
					}
				}
			}
			return finalResults;
		},
		
		mData : function() {
			return LayoutData;
		},
		
		mGetComponent : function(key) {
			return getComponent(key);
		},
		
		mReplaceTokens : function(keys, string) {
			if(string != null) {
				$.extend(keys, LayoutData.GlobalTokens);
				for(var token in keys) {
					string = string.replace(new RegExp("\\$\\[" + token + "\\]", "g"), escape(keys[token]));
				}
			}
			return unescape(string);
		}
	};
	
})();(function() {
	var TriggerData = {
		Env : "_simplr",
		Services : {}
	};
	
	function getServiceIDs() {
		var serviceIDs = [];
		for(var id in TriggerData.Services) {
			serviceIDs.push(id);
		}
		return serviceIDs;
	};
	
	function trigger(triggerObj) {
		var triggerOptions = { services : [], data : { envID : TriggerData.Env } };
		$.extend(true, triggerOptions, triggerObj.options);
		if(Simplr.Core.Util.mEmpty(triggerOptions.services)) { 
			triggerOptions.services = getServiceIDs(); 
		}
		
		var messages = $.extend(Simplr.Core.Console.mGetMessageTemplate(), {
			group : "simplr.trigger: " + TriggerData.Env + " environment",
			message : []
		});
		
		for(var i = 0, iL = triggerOptions.services.length; i < iL; i++) {
			var id = triggerOptions.services[i];
			if($.isFunction(TriggerData.Services[id][triggerObj.type]) && TriggerData.Services[id].data.environmentIDs[TriggerData.Env]) { 
				messages.message.push({
					message : "[" + id + "] " + triggerObj.type + " triggered.",
				    data : TriggerData.Services[id][triggerObj.type](triggerOptions.data)
				});
			}
		}
		
		if( messages.message.length > 0 ) {
			Simplr.Core.Console.mMessage(messages);
		}
	}
	
	Simplr.Trigger = {
		mAddServices : function( services ) {
			for(var serviceName in services) {
				TriggerData.Services[serviceName] = $.extend({
					data : {
						environmentIDs : {}
					},
					onLoad : function() {},
					onPage : function() {},
					onEvent : function() {},
					onTransaction : function() {}
				}, services[serviceName]);
				trigger({ type : "onLoad", options : { services : [ serviceName ] } });
			}
		},
		
		mData : function() {
			return TriggerData;
		},

		mSetEnvironment : function( env ) {
			TriggerData.Env = env;
		},
		
		mOnPage : function( options ) {
			trigger({ type : "onPage", options : $.extend({}, options) });
		},
		
		mOnEvent : function( options ) {
			trigger({ type : "onEvent", options : $.extend({}, options) });
		},
		
		mOnTransaction : function( options ) {
			trigger({ type : "onTransaction", options : $.extend({}, options) });
		}
	};
	
	
})();Simplr.Ui = { Widget : {} };(function() {
	
	var cClass = "_simplr_centerLayer";
	var kcClass = "_simplr_keepCenterLayer";
	
	function addLayer(opts) {
		var layer = $("#"+opts.id);
		if(layer.size() == 0) { // layer doesn't exist
			$("body").append('<div id="' + opts.id + '" style="position: absolute;"></div>');
		} else { // layer exists
			layer.removeClass(cClass).removeClass(kcClass);
			$(opts.closeSelector).unbind("click.simplr.layer.destroy." + opts.id);
		}
		
		var jqThisLayer = $("#" + opts.id);
		var centered = !(opts.xPos != null && opts.yPos != null);
		
		if( !centered ) {
			jqThisLayer.css("left", opts.xPos+"px").css("top", opts.yPos+"px"); 
		} else {
			if( opts.keepCentered ) { 
				jqThisLayer.addClass(kcClass); 
			}
			Simplr.Ui.Layer.mCenter(opts.id);
		}
		
		jqThisLayer.html(opts.defaultContent);
		if(centered) {
			Simplr.Ui.Layer.mCenter(opts.id);
		}
		
		$(opts.closeSelector).bind("click.simplr.layer.destroy." + opts.id, function(evt) {
			evt.preventDefault();
			Simplr.Ui.Layer.mDestroy({ id : opts.id, closeSelector : opts.closeSelector });
		});
	};
	
	Simplr.Ui.Layer = {
		mCenter : function(id) {
			if(!Simplr.Core.Util.mEmpty(id)) {
				var jqThisLayer = $("#" + id);
				var lWidth = jqThisLayer.width();
				var lHeight = jqThisLayer.height();
				var screenInfo = Simplr.Core.Ui.mWindowInfo();
				
				/* Get Left Offset */
				var left = 0;
				left = (( screenInfo.dimensions[0] - lWidth ) / 2);
				left = ( left < 0 ) ? 20 : left;
				left += screenInfo.offsets[0];
				
				/* Get Top Offset */
				var top = 0;
				top = (( screenInfo.dimensions[1] - lHeight ) / 2);
				top = ( top < 0 ) ? 20 : top;
				top += screenInfo.offsets[1];
				
				/* if layer Can't be centered on Screen */
				if( ( lWidth > screenInfo.dimensions[0] ) || ( lHeight > screenInfo.dimensions[1] ) ) { 
					/* Should this layer stay centered? */
					if( jqThisLayer.hasClass(kcClass) )	{ 
						jqThisLayer.removeClass(kcClass).addClass(cClass); 
					}
				}
				
				jqThisLayer.css("top",top+"px").css("left", left+"px");
			}
		},
		mCreate : function(options) {
			var opts = $.extend({
				ajax : null,
				callback : null,
				closeSelector : "#_simplr_layerClose",
				defaultContent : "",
				id : "_simplr_layer",
				isOverlay : false,
				keepCentered : false,
				xPos : null,
				yPos : null
			}, options);
			
			if( opts.isOverlay ) { 
				opts.id = opts.id == "_simplr_layer" ? "_simplr_overlay" : opts.id;
				opts.closeSelector = opts.closeSelector == "#_simplr_layerClose" ? "#_simplr_overlayClose" : opts.closeSelector;
				opts.xPos = 0;
				opts.yPos = 0;
			}
			
			addLayer(opts);
			
			if(opts.ajax != null) { 
				var previousCallback = opts.ajax.success;
				opts.ajax.success = function(data, textStatus) {
					opts.defaultContent = data;
					addLayer(opts);
					if( $.isFunction(previousCallback) ) { 
						previousCallback(data, textStatus); 
					}
				};
				$.ajax(opts.ajax); 
			} else {
				if( $.isFunction(opts.callback) ) { 
					opts.callback(); 
				}
			}
			
			if(opts.isOverlay) { 
				$("#" + opts.id).css({ "position" : "fixed", "width" : "100%", "height" : "100%" }); 
			}
		},
		mDestroy : function(options) {
			var opts = $.extend({ id : "_simplr_layer", closeSelector : "#_simplr_layerClose" }, options);
			if(!Simplr.Core.Util.mEmpty(opts.id)) {
				$("#"+opts.id).remove();
				$(opts.closeSelector).unbind("click.simplr.ui.layer.destroy." + opts.id);
			}
		}
	};
	
	/* this managers the layers during window scroll or resize. */
	$(function() {
		$(window).bind("resize.simplr.ui.layer", function() {
			$("." + kcClass +","+ "." +cClass).each(function(i, layer) {
				$(layer).addClass( kcClass ).removeClass( cClass );
				Simplr.Ui.Layer.mCenter($(layer).attr("id"));
			});
		}).bind("scroll.simplr.ui.layer", function() {
			$("." + kcClass).each(function(i, layer) { 
				Simplr.Ui.Layer.mCenter($(layer).attr("id")); 
			});
		});
	});

})();Simplr.Ui.mNewBrowserWindow = function(options) {
	var opts = $.extend({ url : "", width : 500, height: 500, name : "_simplr_newBrowserWindow"}, options);
	if(!Simplr.Core.Util.mEmpty(opts.url)) {
		var features = "width=" + opts.width + ",height=" + opts.height;
		var url = opts.url;
		var name = opts.name;
		delete opts.url; delete opts.width; delete opts.height; delete opts.name;
		
		for(var key in opts) {
			features += "," + key + "=" + opts[key];
		}
		
		var newWindow = window.open(url, name, features);
		if( newWindow != null) { 
			newWindow.focus(); 
		}
	}
};
(function() {
	
	Simplr.Ui.Widget.oTrackableScrollingElement = function(options) {
		return new trackableScrollingElement(options);
	};
	
	function trackableScrollingElement(options) {
		// user
		this.data = $.extend({
			animateSpeed : 200,
			containerSelector : "#_simplr_widget_trackableScrollingElement_container",
			elementSelector : "#_simplr_widget_trackableScrollingElement_element",
			offset : 10,
			refreshSpeed : 500,
			tolerance : 10
		}, options);
		
		// private
		this.data._PRIVATE = {
			evtString : "scroll.simplr.widget.trackableScrollingElement." + Simplr.Core.Ui.Widget.mGenerateWidgetID(),
			timeout : null,
			previousOffset : 0
		};
		
		// destroy
		this.destroy();
		
		// create this widget
		var thisWidget = this;
		$(window).bind(thisWidget.data._PRIVATE.evtString, function() {
			clearTimeout(thisWidget.data._PRIVATE.timeout);
			thisWidget.data._PRIVATE.timeout = setTimeout(function() {
				var parentEl = $(thisWidget.data.containerSelector).eq(0);
				var childEl = parentEl.children(thisWidget.data.elementSelector).eq(0);
				if( parentEl.is(":visible") && childEl.is(":visible") ) {
					/* Object Infos */
					var containerInfo = Simplr.Core.Ui.mElementInfo({ selector : parentEl });
					var mElementInfo = Simplr.Core.Ui.mElementInfo({ selector : childEl });
					var windowInfo = Simplr.Core.Ui.mWindowInfo();
					/* Figure Out How this thing is moving */
					var movingUP = ((windowInfo.offsets[1] - thisWidget.data._PRIVATE.previousOffset) < 0);
					thisWidget.data._PRIVATE.previousOffset = windowInfo.offsets[1];	
					var newMargin = null;
					var topToleranceRange = [ mElementInfo.offsets[1] - thisWidget.data.tolerance, mElementInfo.offsets[1] +  thisWidget.data.tolerance ];
					var bottomToleranceRange = [ mElementInfo.offsets[1] + mElementInfo.dimensions[1] - thisWidget.data.tolerance, mElementInfo.offsets[1] + mElementInfo.dimensions[1] + thisWidget.data.tolerance];
					/* Find new Margin */
					if((windowInfo.dimensions[1] > mElementInfo.dimensions[1]) && ((windowInfo.offsets[1] < topToleranceRange[0]) || (windowInfo.offsets[1] > topToleranceRange[1]))) {
						newMargin = windowInfo.offsets[1] - containerInfo.offsets[1] + thisWidget.data.offset;
					} else {
						if( movingUP && (windowInfo.offsets[1] < topToleranceRange[0])) {
							newMargin = windowInfo.offsets[1] - containerInfo.offsets[1] + thisWidget.data.offset;
						} else if((windowInfo.offsets[1] + mElementInfo.dimensions[1]) > bottomToleranceRange[1]) {
							newMargin = (windowInfo.offsets[1] - containerInfo.offsets[1] - (mElementInfo.dimensions[1] - windowInfo.dimensions[1]) - thisWidget.data.offset);
						}
					}
					/* Set this Margin */
					if(newMargin != null) {
						if(newMargin < 0 ) {
							newMargin = 0;
						} else if(newMargin > (containerInfo.dimensions[1] - mElementInfo.dimensions[1])) {
							newMargin = containerInfo.dimensions[1] - mElementInfo.dimensions[1];
						}
						childEl.stop().animate({ marginTop : newMargin }, thisWidget.data.animateSpeed);
					}
				} else {
					childEl.css("margin-top", 0);
				}
			}, thisWidget.data.refreshSpeed);
		});
	};
	
	trackableScrollingElement.prototype.reset = function() {
		$(this.data.elementSelector).eq(0).css("margin-top", 0);
	};
	
	trackableScrollingElement.prototype.destroy = function() {
		this.reset();
		$(window).unbind(this.data._PRIVATE.evtString);
	};

})();Simplr.Util = {
	mEmpty : function(thing) {
		return Simplr.Core.Util.mEmpty(thing);
	},
	mEqual : function(things) {
		return Simplr.Core.Util.mEqual(things);
	},
	mGetUrlParameter : function(name) {
		return Simplr.Core.Util.mGetUrlParameter(name);
	},
	mHasLocalStorage : function() {
		return Simplr.Core.Util.mHasLocalStorage();
	},
	mTruncateString : function(options) {
		var opts = $.extend({ string : "", size : 5, postfix : "", smart : true }, options);
		if(opts.string.length > opts.size) {
			var truncateIndex = opts.size - opts.postfix.length - 1;
			var defaultIndex = truncateIndex+1;
			if(opts.smart) {
				while((opts.string.charAt(truncateIndex) != " ") && (truncateIndex > 0)) {
					truncateIndex--;
				}
			}
			return opts.string.substring(0, (truncateIndex == 0 ? defaultIndex : (truncateIndex+1))) + opts.postfix;
		}
		return opts.string;
	}	
};
	Simplr.Validation = {
	mAddCodes : function(obj) {
		Simplr.Core.Validation.mAddCodes(obj);
	},
	mGetCodes : function() {
		return Simplr.Core.Validation.mData().codes;
	},
	mAddValidators : function(obj) {
		Simplr.Core.Validation.mAddValidators(obj);
	},
	mGetValidators : function() {
		return Simplr.Core.Validation.mData().validators;
	},
	mGetRuleResultsTemplate : function() {
		return Simplr.Core.Validation.mGetRuleResultsTemplate();
	},
	mGetCodeMessage : function(code, label) {
		return Simplr.Core.Validation.mGetCodeMessage(code, label);
	},
	mValidate : function(obj) {
		return Simplr.Core.Validation.mValidate(obj);
	}
};(function() {
	
	var ViewData = {
		Views : {}
	};
	
	Simplr.View = {
		mAddViews : function(obj) {
			for(var key in obj) {
				var newView = $.extend(true, {}, { 
					html : function(data) { return ""; }, 
					callback : function(selector, data) {} 
				}, obj[key]);
				ViewData.Views[key] = newView;
			}
		},
		
		mData : function() {
			return ViewData;
		},
		
		mRender : function(options) {
			var tmp = $.extend({ name : "", data: "", selector : ""}, options);
			$(tmp.selector).html(ViewData.Views[tmp.name].html(tmp.data));
			ViewData.Views[tmp.name].callback(tmp.selector, tmp.data);
		}
	};
	
})();
})();