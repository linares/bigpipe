/*
 * $Id: prototypepatch.js,v 1.20 2010/09/13 12:09:58 antti-pe Exp $
 *
 * Copyright © 2008 - 2009 Sulake Dynamoid Oy http://www.dynamoid.com/
 * 
 * Patches for prototype 1.6.0.2
 */

Prototype.Browser.IE6 = Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5)) == 6;
Prototype.Browser.IE7 = Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5)) == 7;
Prototype.Browser.IE8 = Prototype.Browser.IE && !Prototype.Browser.IE6 && !Prototype.Browser.IE7;


/***** Event.observeOnce *****/

var PrototypeEventPatch = {
	observeOnce: function(element, eventName, handler, predicate) {
		var onceHandler = function() {
			if (typeof predicate != 'function' || predicate.apply(this, arguments)) {
				handler.apply(this, arguments);
				Event.stopObserving(element, eventName, onceHandler);
			}
		}.bindAsEventListener(element);

		return Event.observe(element, eventName, onceHandler);
	}
};

Object.extend(window.Event, PrototypeEventPatch);
Object.extend(document, {
	observeOnce: PrototypeEventPatch.observeOnce.methodize()
});

Element.addMethods({
	observeOnce: PrototypeEventPatch.observeOnce
});

/***** /Event.observeOnce *****/


var PrototypeElementPatch = {
	delegate: function(element, selector, eventName, callback) {
		element = $(element);
		element.observe(eventName, function(callback, evt) {
			if (el = evt.findElement(selector)) {
				callback.bind(el, evt)();
			}
		}.curry(callback));

		return element;
	},

	preventTextSelection: function(element) {
		if (typeof element.onselectstart != 'undefined') {
			// IE
			element.observe('selectstart', function(evt) {
				evt.preventDefault();
			});
		} else if (typeof element.style.MozUserSelect != 'undefined') {
			// Mozilla
			element.style.MozUserSelect = 'none';
		} else {
			// Others
			element.observe('mousedown', function(evt) {
				evt.preventDefault();
			});
		}
	}
};

Element.addMethods(PrototypeElementPatch);


function $RF(el, radioGroup) { 
	if($(el).type && $(el).type.toLowerCase() == 'radio') { 
		var radioGroup = $(el).name; 
		var el = $(el).form; 
	} else if ($(el).tagName.toLowerCase() != 'form') { 
		return false; 
	} 

	var checked = $(el).getInputs('radio', radioGroup).find(function(re) { return re.checked; }); 
	return (checked) ? $F(checked) : null; 
}

Object.extend(Element.Methods.ByTag, {
	"FORM":     Object.clone(Form.Methods),
	"INPUT":    Object.clone(Form.Element.Methods),
	"SELECT":   Object.clone(Form.Element.Methods),
	"TEXTAREA": Object.clone(Form.Element.Methods),
	"BUTTON":   Object.clone(Form.Element.Methods)
});

Element.addMethods();


/**
 * Event.simulate(@element, eventName[, options]) -> Element
 *
 * - @element: element to fire event on
 * - eventName: name of event to fire (only MouseEvents and HTMLEvents interfaces are supported)
 * - options: optional object to fine-tune event properties - pointerX, pointerY, ctrlKey, etc.
 *
 * $('foo').simulate('click'); // => fires "click" event on an element with id=foo
 *
 * @license    MIT
 * @copyright  (c) 2009 Juriy Zaytsev
 */
(function() {
	  
	var eventMatchers = {
		'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
		'MouseEvents': /^(?:click|mouse(?:down|up|over|move|out))$/
	}
	var defaultOptions = {
		pointerX: 0,
		pointerY: 0,
		button: 0,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		metaKey: false,
		bubbles: true,
		cancelable: true
	}
	
	Event.simulate = function(element, eventName) {
		var options = Object.extend(defaultOptions, arguments[2] || { });
		var oEvent, eventType = null;
		
		element = $(element);
		
		for (var name in eventMatchers) {
			if (eventMatchers[name].test(eventName)) { eventType = name; break; }
		}
 
		if (!eventType)
			throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
 
		if (document.createEvent) {
			oEvent = document.createEvent(eventType);
			if (eventType == 'HTMLEvents') {
				oEvent.initEvent(eventName, options.bubbles, options.cancelable);
			} else {
				oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
					options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
					options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
			}
			element.dispatchEvent(oEvent);
		}	else {
			options.clientX = options.pointerX;
			options.clientY = options.pointerY;
			oEvent = Object.extend(document.createEventObject(), options);
			element.fireEvent('on' + eventName, oEvent);
		}
		return element;
	}
	
	Element.addMethods({ simulate: Event.simulate });
})();

Object.extend(document, {
	bufferedEvents: new Hash(),

	fire: document.fire.wrap(function(proceed, eventName, memo) {
		var a = document.bufferedEvents.get(eventName);

		if (!a) {
			a = new Array();
			document.bufferedEvents.set(eventName, a);
		}

		a.push(proceed(eventName, memo));
	}),

	observe: document.observe.wrap(function(proceed, eventName, handler) {
		var a = document.bufferedEvents.get(eventName);

		if (a) {
			a.each(function(event) {
				handler(event)
			});
		}

		proceed(eventName, handler);
	})
});

Object.extend(Form.Element.Methods, {
	disable: Form.Element.Methods.disable.wrap(function(proceed, element) {
		element.fire('form:disable');
		return proceed(element);
	}),

	enable: Form.Element.Methods.enable.wrap(function(proceed, element) {
		element.fire('form:enable');
		return proceed(element);
	})
});

Element.addMethods([ 'FORM', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON' ], { disable: Form.Element.Methods.disable, enable: Form.Element.Methods.enable });


