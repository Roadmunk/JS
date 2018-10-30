/**
 * Various Javascript utility functions.
 */

/* global JS */
JS.util = {};

/**
 * Does a call to the given function (it provided) and trapping any exceptions.
 * Useful when dealing with callback functions.
 * @param  {Function}   func
 * @param  {Array()}    args
 * @param  {Object}     context is an optional calling context so that inside func, this === context
 */
JS.util.callback = function(func, args, context) {
	if (context === undefined) {
		context = null;
	}

	try {
		if (typeof func === 'function') {
			func.apply(context, args);
		}
	}
	catch (e) {
		(console.error || console.log)(e.stack || e.message || e);
	}

	if (func && typeof func !== 'function') {
		throw new Error(`callback is not a function: ${func}`);
	}
};

/**
 * Creates/amends the given object with the given set of default properties.
 * @param  {Object|undefined} object   the object whose properties to ammend
 * @param  {Object}           defaults the map of keys/values to ensure exist in the result object
 * @return {Object}
 */
JS.util.defaults = function(object, defaultValues) {
	if (!object) {
		return defaultValues;
	}

	const keys = Object.keys(object);
	let index  = keys.length;
	while (index--) {
		const key = keys[index];
		if (object.hasOwnProperty(key)) {
			defaultValues[key] = object[key];
		}
	}

	return defaultValues;
};

/**
 * Returns a function that returns a new instance of the given constructor passing along
 * any parameters.  Useful for factory methods.
 * @param  {Function} constructor the constructor function for resultant instances
 * @return {Function}
*/
JS.util.createFactory = function(constructor) {
	return function() {
		return new (constructor.bind(...[ null ].concat(Array.prototype.slice.call(arguments))))();
	};
};

/**
 * Ensures that the given value is either an array or turned into an array.
 * Null and undefined are treated as empty arrays.
 * @param  {*} value
 * @return {Array} if value is already an Array, value; otherwise a new Array containing value as it's only element
 */
JS.util.ensureArray = function(value) {
	if (value === undefined || value === null) {
		return [];
	}
	return Array.isArray(value) ? value : [ value ];
};

/**
 * Replaces an object's property that is a function with another but gives the new
 * function access to the old replaced function during calling.
 * @param  {Object}   object      object whose property to replace
 * @param  {String}   property    the name of the property to replace (value must be a function)
 * @param  {Function} newFunction the replacement function
 *                                it's called with the same parameters as the original but with an extra
 *                                first paramter that is a reference to the original function
 * @returns {Function} the original function that is being proxied
 */
JS.util.proxy = function(object, property, newFunction) {
	const oldFunc = object[property];

	if (typeof oldFunc !== 'function') {
		throw new Error(`property value must be a function: ${property}`);
	}

	if (typeof newFunction !== 'function') {
		throw new Error(`newFunction must be a function: ${newFunction}`);
	}

	object[property] = function() {
		const len  = arguments.length;
		const args = new Array(len + 1);
		args[0]    = oldFunc;

		for (let a = 0; a < len; a++) {
			args[a + 1] = arguments[a];
		}

		return newFunction.apply(this, args);
	};

	return oldFunc;
};

/**
 * Returns a deep copy of the given object.
 * @param  {Object} obj
 * @return {Object}
 */
JS.util.clone = function clone(obj) {
	if (!obj || typeof obj !== 'object') {
		return obj;
	}

	const result = obj instanceof Array ? [] : {};
	for (const key in obj) {
		if (!obj.hasOwnProperty(key)) {
			continue;
		}
		let val = obj[key];
		if (val && typeof val === 'object') {
			val = clone(val);
		}
		result[key] = val;
	}

	return result;
};
