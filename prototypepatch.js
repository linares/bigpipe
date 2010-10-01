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


/*
 * THESE ARE PATCHES TO THE SCRIPT.ACULO.US Sortable -CLASS.
 * These enable dropZone marking. More information via:
 * http://tankut.googlepages.com/home
 * or consult madari on this mysterious failure.
 */
Sortable.onHover = function(element, dropon, overlap) {
	if (Element.isParent(dropon, element)) {
		return;
	}

	var sortable = Sortable.options(dropon);
	var isghosting = sortable && sortable.ghosting;

	if (overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
		return;
	} else if (overlap > 0.5) {
		Sortable.mark(dropon, 'before');
		if (dropon.previousSibling != element) {
			var oldParentNode = element.parentNode;
			element.style.visibility = "hidden"; // fix gecko rendering
			Sortable.createGuide(element);
			dropon.parentNode.insertBefore(element, dropon);
			dropon.parentNode.insertBefore(Sortable._guide, element);

			Sortable.markEmptyPlace(element, isghosting);
			if (dropon.parentNode != oldParentNode) {
				Sortable.options(oldParentNode).onChange(element);
			}
			Sortable.options(dropon.parentNode).onChange(element);
		}
	} else {
		Sortable.mark(dropon, 'after');
		var nextElement = dropon.nextSibling || null;
		if(nextElement != element) {
			var oldParentNode = element.parentNode;
			element.style.visibility = "hidden"; // fix gecko rendering
			Sortable.createGuide(element);
			dropon.parentNode.insertBefore(element, nextElement);
			dropon.parentNode.insertBefore(Sortable._guide, element);
			Sortable.markEmptyPlace(element, isghosting);
			if(dropon.parentNode!=oldParentNode) {
				Sortable.options(oldParentNode).onChange(element);
			}
			Sortable.options(dropon.parentNode).onChange(element);
		}
	}
};

Sortable.onEmptyHover = function(element, dropon, overlap) {
	var oldParentNode = element.parentNode;
	var droponOptions = Sortable.options(dropon);

	if (!Element.isParent(dropon, element)) {
		var index;

		var sortable = Sortable.options(dropon);
		var isghosting = sortable && sortable.ghosting;

		var children = Sortable.findElements(dropon, {tag: droponOptions.tag, only: droponOptions.only});
		var child = null;

		if (children) {
			var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);

			for (index = 0; index < children.length; index += 1) {
				if (offset - Element.offsetSize(children[index], droponOptions.overlap) >= 0) {
					offset -= Element.offsetSize(children[index], droponOptions.overlap);
				} else if (offset - (Element.offsetSize(children[index], droponOptions.overlap) / 2) >= 0) {
					child = index + 1 < children.length ? children[index + 1] : null;
					break;
				} else {
					child = children[index];
					break;
				}
			}
		}

		Sortable.createGuide(element);
		dropon.insertBefore(element, child);
		dropon.insertBefore(Sortable._guide, element);
		Sortable.markEmptyPlace(element, isghosting);
		Sortable.options(oldParentNode).onChange(element);
		droponOptions.onChange(element);
	}
};

Sortable.createGuide = function (element) {
	if (!Sortable._guide) {
		Sortable._guide = $('_guide') || document.createElement('DIV');
		Sortable._guide.style.position = 'relative';
		Sortable._guide.style.width = element.clientWidth + 'px';
		Sortable._guide.style.height = '0px';
		Sortable._guide.style.cssFloat = 'left';
		Sortable._guide.id = 'guide';

		document.getElementsByTagName("body").item(0).appendChild(Sortable._guide);
	}
};

Sortable.markEmptyPlace = function(element, isghosting) {
	if (!Sortable._emptyPlaceMarker) {
		Sortable._emptyPlaceMarker = $(Sortable.options(element).dropZoneCss) || document.createElement('DIV');
		Element.hide(Sortable._emptyPlaceMarker);
		Element.addClassName(Sortable._emptyPlaceMarker, Sortable.options(element).dropZoneCss);
		Sortable._emptyPlaceMarker.style.position = 'absolute';
		document.getElementsByTagName("body").item(0).appendChild(Sortable._emptyPlaceMarker);
	} else {
		Sortable._emptyPlaceMarker.style.margin = '';
	}

	if (isghosting && Sortable._guide.previousSibling != null) {
		var pos = Position.cumulativeOffset(Sortable._guide.previousSibling);
	} else {
		var pos = Position.cumulativeOffset(Sortable._guide);
		var md = Element.getStyle(element, 'margin');
		if (md != null)  {
			Sortable._emptyPlaceMarker.style.margin = md;
		}
	}

	Sortable._emptyPlaceMarker.style.left = (pos[0]) + 'px';
	Sortable._emptyPlaceMarker.style.top = (pos[1]) + 'px';

	var d = {};
	d.width = (Element.getDimensions(element).width) + 'px';
	d.height = (Element.getDimensions(element).height) + 'px';

	Sortable._emptyPlaceMarker.setStyle(d);

	if (Sortable.options(element).markDropZone) {
		Element.show(Sortable._emptyPlaceMarker);
	}
};

Sortable.unmark = function() {
	if (Sortable._marker) {
		Sortable._marker.hide();
	}
	if (Sortable._guide && Sortable._guide.parentNode) {
		Sortable._guide.parentNode.removeChild(Sortable._guide);
	}
	if (Sortable._emptyPlaceMarker) {
		Sortable._emptyPlaceMarker.hide();
	}
};
