/* globals JS */
const constructionSet       = new Set();		// the list of objects currently being constructed
const originalPropertiesMap = new WeakMap();	// keeps track of the original properties for classes as defined (before they are modified)

/**
	 * Creates a javascript class.
	 *
	 * For example:
	 * JS.class('BaseClass', {
	 *    static : {
	 *       fields : {
	 * 	        static1 : 'hello world'
	 *       },
	 *       methods : {
	 *
	 *       }
	 *    },
	 *
	 *    constructor : function() { },
	 *
	 *    fields : {
	 *       instanceField : 1,
	 *       instanceField : 2
	 *    },
	 *
	 *    methods : {
	 *      run : function(arg1) { },
	 *      run2 : { get : function() { } }
	 *    }
	 * });
	 *
	 * JS.class('Subclass', {
	 * 	  inherits : BaseClass,
	 *    mixin    : [ Mixin1, Mixin2 ]
	 * });
	 */
JS.class = function(className, originalProperties) {
	let clazz, fieldName;

	// full definition form with className inherited from parent class
	if (typeof className === 'object' && originalProperties === undefined && className.inherits) {
		originalProperties = className;
		className          = originalProperties.inherits.__className__;
	}

	if (typeof className === 'string') {
		const shortClassName = className.match(/[a-zA-Z0-9_]*$/)[0];	// take the last alphanum word since it must be a Javascript name

		// using eval here so that the className will be used in the function definition (shows in debuggers and such which makes debugging easier)
		eval(`clazz = function ${shortClassName}() { return JS.class.new.call(this, ${shortClassName}, arguments); };`);	// eslint-disable-line no-eval

		clazz.__className__ = className;

		// check for stub call
		if (originalProperties === undefined) {
			return clazz;
		}
	}
	else if (typeof className === 'function') {
		clazz     = className;
		className = clazz.__className__;
	}
	else {
		throw new Error(`invalid parameter className: ${className}`);
	}

	originalProperties = normalizeProperties(originalProperties);
	originalPropertiesMap.set(clazz, originalProperties);	// stash them away for use by subclasses in classes with mixins

	setupSuperClass(clazz, originalProperties);

	// compose final class properties from all original sources
	const properties   = clazz.properties = JS.util.clone(originalProperties);
	properties.fields  = {};
	properties.methods = {};
	extendPropertiesWithClass(properties, clazz);

	processFields(clazz);

	// define user constructor
	const constructor = getConstructor(properties, className);
	if (constructor) {
		constructor.methodName           = 'userConstructor';
		constructor.__class__            = clazz;
		clazz.properties.userConstructor = constructor;
	}

	// define methods
	clazz.prototype.toString     = BaseClass.prototype.toString;
	clazz.prototype.forEachField = BaseClass.prototype.forEachField;
	clazz.prototype.$super       = BaseClass.prototype.$super;
	clazz.prototype.$superFunc   = BaseClass.prototype.$superFunc;
	createMethods.call(clazz, properties.methods, clazz.prototype);
	createMethods.call(clazz, properties.static.methods, clazz);

	// define fields
	createGettersSetters.call(clazz, properties.static.fields, clazz);
	createGettersSetters.call(clazz, properties.fields, clazz.prototype);
	createFields.call(clazz, properties.static.fields);

	// call static constructor (if any)
	const staticConstructor = getConstructor(properties.static, className);
	if (staticConstructor) {
		staticConstructor.call(clazz);
	}

	if (clazz !== BaseClass && Object.getPrototypeOf(clazz).afterCreateClass) {
		Object.getPrototypeOf(clazz).afterCreateClass(clazz);
	}

	return clazz;
};

function setupSuperClass(clazz, properties) {
	// setup super class
	if (properties.inherits && typeof properties.inherits !== 'function') {
		throw new Error(`'inherits' property is specified but is not a function for class: ${clazz.__className__}`);
	}

	if (properties.inherits) {
		clazz.__parentClass__       = properties.inherits.prototype.constructor;
		clazz.prototype             = Object.create(properties.inherits.prototype);
		clazz.prototype.constructor = clazz;
	}

	// allows static properties inheritence
	if (clazz !== BaseClass) {
		Object.setPrototypeOf(clazz, properties.inherits || BaseClass);
	}
}

function normalizeProperties(properties) {
	properties = JS.util.defaults(properties, {
		methods : {}, fields  : {}, static  : {}, mixin   : [],
	});
	properties.mixin = JS.util.ensureArray(properties.mixin);

	properties.static = JS.util.defaults(properties.static, {
		methods : {}, fields  : {},
	});

	return properties;
}

function processFields(clazz) {
	// normalize fields and invoke fieldDefinition event on each field
	// done in a loop cause the event hander could add new field definitions
	let unprocessedFields, fieldName;
	const processedFields = {};
	const properties      = clazz.properties;

	do {
		unprocessedFields = {};

		for (fieldName in properties.fields) {
			if (properties.fields[fieldName] !== processedFields[fieldName]) {
				unprocessedFields[fieldName] = properties.fields[fieldName];
			}
		}

		// normalize field definitions so that any fieldDefinition event handlers can rely on a consistent field definition
		for (fieldName in unprocessedFields) {
			unprocessedFields[fieldName] = properties.fields[fieldName] = normalizeField(unprocessedFields[fieldName]);
		}

		for (fieldName in unprocessedFields) {
			invokeEvent('fieldDefinition', [ clazz, fieldName, unprocessedFields[fieldName] ]);

			// check if entire field has been replaced
			if (properties.fields[fieldName] !== unprocessedFields[fieldName]) {
				unprocessedFields[fieldName] = properties.fields[fieldName];
			}

			processedFields[fieldName] = properties.fields[fieldName] = normalizeField(unprocessedFields[fieldName]);
		}
	}
	while (Object.keys(unprocessedFields).length > 0);
}

/**
	 * Redefines the field definition if short-hand notations are used.
	 * @param  {Object} field definition
	 * @return {Object} field object definition (at least contains a type property)
	 */
function normalizeField(field) {
	switch (typeof field) {
		case 'undefined':
			field = { type : undefined };
			break;
		case 'boolean':
			field = { type : Boolean, init : field };
			break;
		case 'number':
			field = { type : Number, init : field };
			break;
		case 'string':
			field = { type : String, init : field };
			break;
		case 'function':
			field = { type : field };
			break;
		case 'object':
			if (field === null) {
				field = { type : Object, init : null };
			}
			else if (field.type === undefined) {
				field.type = undefined;
			}
			else if (field.type === Boolean) {
				if (!field.hasOwnProperty('init')) {
					field.init = false;
				}
			}
			else if (field.type === String) {
				if (!field.hasOwnProperty('init')) {
					field.init = '';
				}
			}
			else if (field.type === Number) {
				if (!field.hasOwnProperty('init')) {
					field.init = 0;
				}
			}
			else if (typeof field.type !== 'function') {
				const a    = normalizeField(field.type);
				field.type = a.type;
				field.init = field.init === undefined ? a.init : field.init;
			}
			break;
	}

	return field;
}

/**
	 * Returns the constructor function from amongst the properties object.
	 */
function getConstructor(properties, className) {
	const constructor = properties.hasOwnProperty('constructor') ? properties.constructor : undefined;

	if (constructor && typeof constructor != 'function') {
		throw new Error(`constructor must be a function for class: ${className}`);
	}

	return constructor;
}

/**
	 * Extends the given properties object with the properties of another class.
	 * @param {Object} properties
	 * @param {BaseClass} clazz - another class from which to copy properties
	 * @param {Object}  [options]
	 * @param {Boolean} [options.isMixin=false] if true, clazz is a mixin and properties must be copied
	 * @param {Boolean} [options.copyMethods=true] if false, does not copy the .methods key over
	 */
function extendPropertiesWithClass(properties, clazz, { isMixin = false, copyMethods = true } = {}) {
	if (!clazz) {
		return;
	}

	const classProperties = originalPropertiesMap.get(clazz);
	if (!classProperties) {
		// check if clazz is not a JS.class class
		if (clazz === BaseClass || BaseClass.isPrototypeOf(clazz)) {
			throw new Error(`invalid class: ${clazz}`);
		}

		return;
	}

	// check if mixin has a constructor which currently won't get run (atleast log a warning)
	if (isMixin && getConstructor(clazz.properties, clazz.__className__)) {
		console.warn(`mixin class has a constructor but it won't get run: ${clazz.__className__}`);
	}

	// 1. add from any base classes
	extendPropertiesWithClass(properties, classProperties.inherits, { isMixin, copyMethods : isMixin && copyMethods });

	// 2. copy any properties from mixin classes
	classProperties.mixin.forEach(function(mixinClass) {
		extendPropertiesWithClass(properties, mixinClass, { isMixin : true, copyMethods });
	});

	// 3. copy fields and optionally methods from clazz
	extendWithObject(properties.fields, classProperties.fields);

	if (isMixin || copyMethods) {
		extendWithObject(properties.static.fields,  classProperties.static.fields);

		// if this is a mixin, then don't copy methods -- instead create a wrapper around the mixin method
		if (isMixin && copyMethods) {
			extendWithMethodWrappers(properties.methods,        classProperties.methods);
			extendWithMethodWrappers(properties.static.methods, classProperties.static.methods);
		}
		else if (copyMethods) {
			extendWithObject(properties.methods,        classProperties.methods);
			extendWithObject(properties.static.methods, classProperties.static.methods);
		}
	}

	return properties;
}

function extendWithObject(dest, source) {
	if (!source) {
		return;
	}

	for (const name in source) {
		if (source.hasOwnProperty(name)) {
			const sourceValue = source[name];

			// recurse into method regions
			if (typeof sourceValue === 'object' && name.startsWith('$')) {
				extendWithMethodWrappers(dest, sourceValue);
			}
			else {
				dest[name] = JS.util.clone(sourceValue);
			}
		}
	}
}

function extendWithMethodWrappers(dest, source, clazz) {
	if (!source) {
		return;
	}

	for (const methodName in source) {
		if (source.hasOwnProperty(methodName)) {
			const sourceMethod = source[methodName];

			// recurse into method regions
			if (typeof sourceMethod === 'object' && methodName.startsWith('$')) {
				extendWithMethodWrappers(dest, sourceMethod);
			}

			else if (!sourceMethod || sourceMethod.abstract || typeof sourceMethod !== 'function') {
				dest[methodName] = JS.util.clone(sourceMethod);
			}

			else {
				const method      = makeWrapper(sourceMethod);
				method.methodType = 'method';
				method.methodName = methodName;
				method.__class__  = clazz;
				dest[methodName]  = method;
			}
		}
	}

	function makeWrapper(func) {
		return function() {
			return func.apply(this, arguments);
		};
	}
}

/**
	 * Provides a standard getter function that returns the value of the given property of this object.
	 * @param {String} property is the name of another property of the class whose value to retrieve
	 * @param {Object} [options]
	 * @param {Boolean} [options.asFunction] invokes the specified property as a function
	 */
JS.getter = function(property, { asFunction } = {}) {
	if (asFunction) {
		return function() {
			const prop = this[property];
			return typeof prop == 'function' ? prop() : undefined;
		};
	}

	return function() {
		return this[property];
	};
};

/**
	 * Provides a standard setter function that sets the value of the given property of this object.
	 * @param {String}  property is the name of another property of the class whose value to set
	 * @param {Object}  [options]
	 * @param {Boolean} [options.asFunction] invokes the specified property as a function with the value as the only parameter
	 */
JS.setter = function(property, { asFunction } = {}) {
	if (asFunction) {
		return function(value) {
			const prop = this[property];
			if (typeof prop === 'function') {
				prop(value);
			}
		};
	}

	return function(value) {
		this[property] = value;
	};
};

const classEvents = {
	fieldDefinition : [],
};

	/**
	 * Registers callbacks for JS.class events.
	 */
JS.class.on = function(eventName, callback) {
	if (classEvents[eventName] === undefined) {
		throw new Error(`JS.class.on: unknown event name: ${eventName}`);
	}

	classEvents[eventName].push(callback);
};

function invokeEvent(eventName, args) {
	return classEvents[eventName].map(function(callback) {
		return callback(...args);
	});
}

/**
	 * Factory method for creating instances of classes.  Like "new" but takes options to affect the construction process.
	 * @param {Function} clazz - the clazz for which to instantiate the new object
	 * @param {*[]} [constructorArgs=[]] any arguments to pass to the constructor of clazz
	 * @param {Object} [options]
	 * @param {Boolean} [options.allowAbstractClasses=false] if true, allows creation of an abstract class (used internally)
	 * @param {Boolean} [options.callConstructors=true] if false, does not call user constructors
	 * @param {Boolean} [options.callAfterCreateInstance=true] if false, does not call afterCreateInstance method
	 * @param {Boolean} [options.initAllFields=true] if false, only initializes fields mentioned in initFieldsWithValue and initFieldsWithInitArgs
	 * @param {Object}  [options.initFieldsWithValue]
	 *           if provided, initialize these fields
	 *           keys are field names of fields to initialize
	 *           values are the value to directly set for the field
	 * @param {Object}  [options.initFieldsWithInitArgs]
	 *           if provided, initialize these fields
	 *           keys are field names of fields to initialize
	 *           values are the array of arguments to pass to the field's init function (if it has one) otherwise the value is irrelevant
	 */
JS.class.new = function(clazz, constructorArgs = [], options) {
	// check if function called directly
	const instance = this === JS.class ? Object.create(clazz.prototype) : this;

	// calling separate functions in hopes of having it optimized since a try statement tends to kill JS VM optimization
	try {
		if (instance instanceof clazz) {
			constructionSet.add(instance);
			return createInstance.call(instance, clazz, constructorArgs, options);
		}
	}
	finally {
		constructionSet.delete(instance);
	}

	return castToBaseClass(clazz, constructorArgs[0]);
};

/**
	 * Regular instance initialization
	 * @param {Function} clazz - the class to create
	 * @param {*[]}      args  - array of arguments to pass to user constructors
	 * @param {Object}   [options] @see JS.class.new options
	 */
function createInstance(clazz, args, {
	initAllFields           = true,
	callConstructors        = true,
	callAfterCreateInstance = true,
	allowAbstractClasses    = false,
	initFieldsWithValue,
	initFieldsWithInitArgs,
} = {}) {
	if (clazz.properties === undefined) {
		throw new Error(`cannot instantiate stub class: ${this.constructor.__className__}`);
	}

	// check for abstract class only if this is the top-level call (ie. not a base-class constructor call)
	if (!allowAbstractClasses && this.constructor === clazz && BaseClass.isAbstract.call(clazz)) {
		const methodName = BaseClass.abstractMethodName.call(clazz);
		const fieldName  = BaseClass.abstractFieldName.call(clazz);
		throw new Error(`cannot instantiate abstract class: ${this.constructor.__className__} (${methodName ? `method : ${methodName}` : `field: ${fieldName}`})`);
	}

	// add instance fields
	createFields.call(this, clazz.properties.fields, {
		initAllFields,
		initialValues   : initFieldsWithValue,
		initialInitArgs : initFieldsWithInitArgs,
	});

	if (callConstructors) {
		callUserConstructors.apply(this, args);
	}
	if (callAfterCreateInstance) {
		if (typeof this.afterCreateInstance === 'function') {
			this.afterCreateInstance();
		}
	}

	return this;
}

/**
	 * Regular instance initialization
	 * @param {Function} clazz - the class to create
	 * @param {Object}   source - the source of the initial field properties
	 */
function castToBaseClass(clazz, source) {
	if (source === undefined) {
		throw new Error('required parameter missing; must supply a reference to subclass instance');
	}

	if (!source.constructor || !source.constructor.isSubclass) {
		throw new Error('parameter must be an instance of a class');
	}

	// check to make sure that the requested class is a base class of this one
	if (!source.constructor.isSubclass(clazz)) {
		throw new Error('can only cast to a base class');
	}

	return JS.class.new(clazz, undefined, {
		initFieldsWithValue     : source,
		callConstructors        : false,
		callAfterCreateInstance : false,
		allowAbstractClasses    : true,
	});
}

/**
	 * Helper function that calls user constructors. (including ancestor classes)
	 * The context (this) must be the instance of the class.
	 * All arguments are passed to the user constructor.
	 */
function callUserConstructors() {
	function helper(clazz, instance, args) {
		if (clazz && clazz.properties) {
			if (clazz.__parentClass__) {
				helper(clazz.__parentClass__, instance, args);
			}

			if (clazz.properties.userConstructor) {
				clazz.properties.userConstructor.apply(instance, args);
			}
		}
	}

	helper(this.constructor, this, arguments);
}

/**
	 * Helper function that creates methods on the class.
	 * Expects to be called in the context of the class object.
	 * @param {Object} definitions the class property definitions object
	 * @param {Object} destination where to add the new method
	 */
function createMethods(definitions, destination) {
	for (const name in definitions) {
		let method = definitions[name];

		if (typeof method === 'object') {
			if (typeof method.get === 'function' || typeof method.set === 'function') {
				const descriptor = {
					enumerable   : false,
					configurable : false,
				};
				if (typeof method.get === 'function') {
					method.get            = makeSuperStackUpdaterProxy(method.get);
					method.get.methodType = 'get';
					method.get.methodName = name;
					method.get.__class__  = this;
					method.get.super      = makeSuperMethodProxy(method.get);
					descriptor.get        = method.get;
					descriptor.set        = function() {};	// add silent setter in case there's only a getter (will be overwritten by setter if there is one)
				}
				if (typeof method.set === 'function') {
					method.set            = makeSuperStackUpdaterProxy(method.set);
					method.set.methodType = 'set';
					method.set.methodName = name;
					method.set.__class__  = this;
					method.set.super      = makeSuperMethodProxy(method.set);
					descriptor.set        = method.set;
				}

				Object.defineProperty(destination, name, descriptor);
			}
			else if (typeof method.$super == 'function') {
				// get the base class's method with the same name
				const superMethod = getSuperMethod({
					methodType : 'method',
					methodName : name,
					__class__  : this,
				}, this);
					// get the final method for this class that can include a call to the superMethod
				method = method.$super.call(this, superMethod);
			}
			else if (name[0] === '$') {
				// it's a region
				createMethods.call(this, method, destination);
			}
		}

		if (typeof method === 'function') {
			method            = makeSuperStackUpdaterProxy(method);
			method.methodType = 'method';
			method.methodName = name;
			method.__class__  = this;	// link each method to the class for which it is a method
			method.super      = makeSuperMethodProxy(method);
			destination[name] = method;
		}
	}
}

/**
	 * Helper function that creates fields which are getters/setters on the class.
	 * Expects to be called in the context of the class object.
	 * @param  {Object} definitions the class property definitions object
	 * @param  {Object} destination where to add the new fields
	 */
function createGettersSetters(definitions, destination) {
	for (const name in definitions) {
		// normalize again just to be sure
		const field = definitions[name] = normalizeField(definitions[name]);

		// define non-value fields (ie. getters/setters)
		if (typeof field.get === 'function' || typeof field.set === 'function') {
			if (field.get) {
				field.get            = makeSuperStackUpdaterProxy(field.get);
				field.get.methodType = 'get';
				field.get.methodName = name;
				field.get.__class__  = this;
				field.get.super      = makeSuperMethodProxy(field.get);
			}
			if (field.set) {
				field.set            = makeSuperStackUpdaterProxy(field.set);
				field.set.methodType = 'set';
				field.set.methodName = name;
				field.set.__class__  = this;
				field.set.super      = makeSuperMethodProxy(field.set);
			}
			Object.defineProperty(destination, name, {
				enumerable   : true,
				configurable : false,
				get          : field.get,
				// add silent setter in case there's only a getter
				// (goes against strict mode but it's useful to be able to do mass field updates without which fields are writable)
				set          : typeof field.set === 'function' ? field.set : function() {},
			});
		}
	}
}

/**
	 * Helper function that adds the given fields to this object.
	 * Expects to be called in the context of the class object.
	 * @param {Object} fields - field definitions with keys being the field names and values being the field properties
	 * @param {Object}  [options]
	 * @param {Boolean} [options.initAllFields=true] if false, only initializes fields named in initialValues or initialInitArgs
	 * @param {Object}  [options.initialValues] takes initial values for the fields from this object
	 * @param {Object}  [options.initialInitArgs] takes arguments for a field's possible init function from this object
	 */
function createFields(fields, { initAllFields = true, initialValues, initialInitArgs } = {}) {
	const sortedFieldNames = getSortedFieldNames(fields);
	const len              = sortedFieldNames.length;
	let a                  = 0;

	while (a < len) {
		const fieldName = sortedFieldNames[a];
		if (initialValues && initialValues.hasOwnProperty(fieldName)) {
			this[fieldName] = initialValues[fieldName];
		}
		else if (initAllFields || (initialInitArgs && initialInitArgs.hasOwnProperty(fieldName))) {
			this[fieldName] = JS.class.initialFieldValue(this, fields[fieldName], initialInitArgs ? initialInitArgs[fieldName] : undefined);
		}
		a++;
	}
}

/**
	 * Helper function that returns an array of this class' field names, sorted in their initialization order
	 * (i.e. fields with `initDependencies` appear in the array after all of their dependencies)
	 */
function getSortedFieldNames(fields) {
	// optimize by memoizing the result and attaching it to `fields`
	if (!fields.hasOwnProperty('___fieldsSortedInInitializationOrder')) {
		const sortedFields = [];

		for (const fieldName in fields) {
			processField(fields, fieldName, sortedFields);
		}

		Object.defineProperty(fields, '___fieldsSortedInInitializationOrder', {
			enumerable : false,
			value      : sortedFields,
		});
	}

	return fields.___fieldsSortedInInitializationOrder;
}

/**
	 * Helper function for `getSortedFieldNames` to process a field and recursively process the field's init dependencies
	 * @param  {Object}      fields          All field definitions
	 * @param  {String}      fieldName       The name of the specific field to process
	 * @param  {String[]}    sortedFields    Array of already processed fields, which this field should be added to once processed
	 * @param  {Set<String>} [visitedFields] The field names which have already been visited, in the current recursive callstack.
	 */
function processField(fields, fieldName, sortedFields, visitedFields) {
	if (sortedFields.includes(fieldName)) {
		return;
	}

	// check for any cycles in `initDependencies` of the fields
	if (!visitedFields) {
		visitedFields = new Set();
	}
	if (visitedFields.has(fieldName)) {
		throw new Error(`initDependencies cycle for '${fieldName}'`);
	}
	visitedFields.add(fieldName);

	// check for initialization dependencies (when field init needs to have other fields initialized first)
	const field = fields[fieldName];
	if (field.initDependencies) {
		JS.util.ensureArray(fields[fieldName].initDependencies).forEach(fieldName => processField(fields, fieldName, sortedFields, visitedFields));
	}

	sortedFields.push(fieldName);
}


/**
	 * Returns the initial value for a field.
	 * @param  {Object | Function} instance is the instance of the class or the class itself if the field is static
	 * @param  {Object | String} field the field specification or field name
	 * @param  {Array} [initArgs] arguments passed to the init function if the field has one
	 * @return {*}
	 */
JS.class.initialFieldValue = function(instance, field, initArgs) {
	if (typeof field === 'string') {
		field = (instance.constructor || instance).getFieldProperties(field);
	}

	// check if this is a getter field (with no setter thus not writable) then do nothing
	if (typeof field.get === 'function' && typeof field.set === 'undefined') {
		return undefined;
	}

	switch (typeof field.init) {
		case 'function':
			return field.init.apply(instance, initArgs);
		case 'string':
		case 'number':
		case 'boolean':
			return field.init;
		case 'object':
			if (field.init === null) {
				return null;
			}

			// this would set each instance with the same object reference probably leading to problems
			throw new Error('cannot initialize an instance field with a specific object value');

		case 'undefined':
			if (!field.hasOwnProperty('init') && field.type !== undefined) {
				return new field.type();
			}
			break;
	}

	return undefined;
};

/**
	 * Makes a proxy function that, if nessecary, updates the method's `superStack` callstack for the instance invoking the method,
	 * pushing the current invocation onto the top of the stack. This is nessecary to allow for recursive/cyclic super calls.
	 *
	 * NOTE: a method must be proxied using this function *before* any properties are assigned to it.
	 *
	 * @param  {Function} method
	 * @return {Function}
	 */
function makeSuperStackUpdaterProxy(method) {
	// check if the method doesn't even contain a call to it's super method
	if (method.toString().indexOf('.super.') === -1) {
		return method;
	}

	return function proxy(...args) {
		/* Note: superStack is a map of instance to an array of callstack methods on that instance,
			 * and is initialized on the first invocation of `super` for each method (@see makeSuperMethodProxy()) */

		const instanceStack = proxy.superStack ? proxy.superStack.get(this) : null;	// the super callstack for `this` instance, if any exists
		if (instanceStack && instanceStack.length && instanceStack[instanceStack.length - 1] != proxy) {
			instanceStack.push(proxy);

			// we've modified the stack, so need to clean up afterwards
			return possiblyAsyncTryFinally(
				() => method.apply(this, args),
				() => instanceStack.pop()
			);
		}

		return method.apply(this, args);
	};
}

/**
	 * Returns the method that the given method overrides.
	 * @param {Function} method  the method whose super method to find
	 * @param {JS.Class} clazz   the class upon which the method is being called
	 */
function getSuperMethod(method, clazz) {
	let parentClass = clazz.__parentClass__;

	if (method === clazz.properties.userConstructor) {
		throw new Error('cannot call $super in a constructor; it is called automatically');
	}

	while (parentClass !== undefined) {
		const desc = Object.getOwnPropertyDescriptor(parentClass.prototype, method.methodName);
		if (desc) {
			if (method.methodType === 'method' && typeof desc.value === 'function') {
				return desc.value;
			}
			if (method.methodType === 'get' && typeof desc.get === 'function') {
				return desc.get;
			}
			if (method.methodType === 'set' && typeof desc.set === 'function') {
				return desc.set;
			}
			throw new Error(`this method/field does not override the proper property type: ${method.methodName}`);
		}
		parentClass = parentClass.__parentClass__;
	}

	return null;
}

/**
	 * Returns method that invokes the next super method in the chain.
	 * Note that this.method.super is always called on the leaf-most method implementation.
	 * Since a super method could also call this.method.super, we maintain a stack of calls to super so that we can properly progress through the chain.
	 */
function makeSuperMethodProxy(method) {
	return function(...args) {
		// superStack is a map of instance to an array of callstack methods on that instance
		if (method.superStack === undefined) {
			method.superStack = new Map();
		}

		let currentStack = method.superStack.get(this);
		if (!currentStack) {
			currentStack = [];
			method.superStack.set(this, currentStack);
		}

		const currentMethod = currentStack.length > 0 ? currentStack[currentStack.length - 1] : method;
		if (currentMethod.__overrides__ === undefined) {
			currentMethod.__overrides__ = getSuperMethod(currentMethod, currentMethod.__class__);
		}
		if (currentMethod.__overrides__ === null) {
			return null;
		}

		currentStack.push(currentMethod.__overrides__);

		return possiblyAsyncTryFinally(
			() => currentMethod.__overrides__.apply(this, args),
			() => {
				if (currentStack.length < 2) {
					method.superStack.delete(this);
				}
				else {
					currentStack.pop();
				}
			}
		);
	};
}

/**
	 * Returns whether the given class is or is a subclass of the given class.
	 * @param  {Function} possibleSubclass
	 * @param  {Function | String | Object} ancestorClass or className or object instance of the ancestor class
	 * @param  {Boolean} [properSubclass=false] if true, possibleClass must be a proper subclass of ancestorClass (cannot be the same class)
	 * @return {Boolean}
	 */
JS.class.isSubclass = function(possibleSubclass, ancestorClass, properSubclass) {
	if (!possibleSubclass || !ancestorClass) {
		return false;
	}

	if (typeof ancestorClass === 'object') {
		ancestorClass = ancestorClass.constructor;
	}

	let currentClass = properSubclass ? possibleSubclass.__parentClass__ : possibleSubclass;
	while (currentClass) {
		if (currentClass === ancestorClass || currentClass.__className__ === ancestorClass) {
			return true;
		}

		currentClass = currentClass.__parentClass__;
	}

	return false;
};

/**
	 * Returns whether the given class includes the provided mixin
	 * @param  {Function}  possibleClass
	 * @param  {Function}  mixin
	 * @return {Boolean}
	 */
JS.class.hasMixin = function(possibleClass, mixin) {
	if (!possibleClass || !mixin) {
		return false;
	}

	if (typeof possibleClass === 'object') {
		possibleClass = possibleClass.constructor;
	}

	if (typeof possibleClass.hasMixin !== 'function') {
		return false;
	}

	return possibleClass.hasMixin(mixin);
};

/**
	 * Returns true if the given parameter is an instance of a class and is currently in the process of being
	 * constructed.
	 * @param {Object} instance
	 */
JS.class.isUnderConstruction = function(instance) {
	return constructionSet.has(instance);
};

Object.defineProperty(JS.class.isUnderConstruction, 'stackSize', {
	get : function() {
		return constructionSet.size;
	},
});

// The prototype object of all Classes
const BaseClass = JS.class.BaseClass = JS.class('BaseClass');	// create a stub for the BaseClass in order to solve the circular reference when defining a class

JS.class(BaseClass, {
	methods : {
		/**
			 * Default toString() method for all class instances.
			 */
		toString : function() {
			return `[object ${this.constructor.__className__}]`;
		},

		/**
			 * Instance version of the static forEachField.
			 * @see static.forEachField
			 */
		forEachField : function(callback) {
			this.constructor.forEachField.call(this.constructor, callback);
		},

		/**
			 * Gets called after the instance has been constructed.
			 * Can be overriden in instance classes to provide post-construction functionality.
			 */
		afterCreateInstance : function() {},
	},

	static : {
		methods : {
			/**
				 * Returns whether this class is or is a subclass of the given class.
				 * @param  {Function | String | Object} ancestorClass or className or object instance of the ancestor class
				 * @return {Boolean}
				 */
			isSubclass : function(ancestorClass) {
				return JS.class.isSubclass(this, ancestorClass);
			},

			/**
				 * Returns whether this class has a particular mixin.
				 * Mixins are checked in any ancestor classes as well as mixins of mixins.
				 * @param  {Function} mixinClass
				 * @return {Boolean}
				 */
			hasMixin : function(mixinClass) {
				for (let a = 0; a < this.properties.mixin.length; a++) {
					const mixin = this.properties.mixin[a];
					if (mixin === mixinClass) {
						return true;
					}
					if (typeof mixin.hasMixin === 'function' && mixin.hasMixin(mixinClass))   {
						return true;
					}
					if (typeof mixin.isSubclass === 'function' && mixin.isSubclass(mixinClass)) {
						return true;
					}
				}

				if (this.__parentClass__ && typeof this.__parentClass__.hasMixin === 'function' && this.__parentClass__.hasMixin(mixinClass)) {
					return true;
				}

				return false;
			},

			/**
				 * Returns whether this class is an abstract class that contains abstract methods or fields.
				 * Abstract classes cannot be instatiated as is; they need to be subclassed and all
				 * abstract methods/fields need to be implemented.
				 */
			isAbstract : function() {
				if (!this.hasOwnProperty('__abstract')) {
					const implementedMethods = {};
					const implementedFields  = {};
					let currentClass         = this;

					while (currentClass && currentClass.properties && !this.hasOwnProperty('__abstract')) {
						// COULDDO: don't repeat these blocks - makes it a little more difficult to differentiate fields from methods
						for (const methodName in currentClass.properties.methods) {
							if (currentClass.properties.methods[methodName].abstract && implementedMethods[methodName] === undefined) {
								this.__abstract           = true;
								this.__abstractMethodName = methodName;
								break;
							}
							implementedMethods[methodName] = true;
						}
						for (const fieldName in currentClass.properties.fields) {
							if (currentClass.properties.fields[fieldName].abstract && implementedFields[fieldName] === undefined) {
								this.__abstract          = true;
								this.__abstractFieldName = fieldName;
								break;
							}
							implementedFields[fieldName] = true;
						}

						currentClass = currentClass.__parentClass__;
					}

					if (!this.hasOwnProperty('__abstract')) {
						this.__abstract           = false;
						this.__abstractMethodName = undefined;
						this.__abstractFieldName  = undefined;
					}
				}

				return this.__abstract;
			},

			/**
				 * If this class is an abstract class, then this method returns the name of
				 * an un-implemented method.  This is useful for debugging.
				 *
				 * @returns {String}
				 */
			abstractMethodName : function() {
				return this.__abstractMethodName;
			},

			/**
				 * If this class is an abstract class, then this method returns the name of
				 * an un-implemented field.  This is useful for debugging.
				 *
				 * @returns {String}
				 */
			abstractFieldName : function() {
				return this.__abstractFieldName;
			},

			/**
				 * Invokes the specified callback function for every field in this class as well as any ancestor classes.
				 * @param {Function} callback is invoked for every field with the following parameters:
				 *           {String} the name of the field
				 *           {Object} the field definition properties (meta data)
				 */
			forEachField : function(callback) {
				const fields     = this.properties.fields;
				const fieldNames = getSortedFieldNames(fields);
				const length     = fieldNames.length;
				let index        = 0;
				while (index < length) {
					if (callback(fieldNames[index], fields[fieldNames[index]]) === false) {
						return;
					}
					index++;
				}
			},

			/**
				 * Returns the field properties for this class and field.
				 * @param  {String}   fieldName is the name of the field whose properties to return
				 * @return {Object}   the field's properties or null if no such field was found
				 */
			getFieldProperties : function(fieldName) {
				return this.properties.fields[fieldName];
			},

			/**
				 * Gets called everytime there is a subclass of this class declared.
				 * Can be overridden to create special behaviour.
				 * @param  {Function} subclass
				 */
			afterCreateClass : function(subclass) {
				/* eslint no-unused-vars:0 */
			},
		},
	},
});

/**
	 * Helper function that runs two functions in a try-finally block, but will only run the `finallyBlock`
	 * function after any promises returned from the `tryBlock` function has fulfilled/rejected.
	 * The `finallyBlock` function will only ever be invoked once.
	 * @param  {Function} tryBlock       A (possibly asynchronous) function to be run in the `try` block
	 * @param  {Function} [finallyBlock] A (synchronous) function to be run after the `tryBlock` function has executed and any returned promise has resolved
	 * @return {*}                       return value of the `tryBlock`
	 */
function possiblyAsyncTryFinally(tryBlock, finallyBlock) {
	let isAsync = false;
	try {
		let result = tryBlock();
		if (result instanceof Promise) {
			isAsync = true;
			result  = result.then(
				res => {
					finallyBlock ? finallyBlock() : null;
					return res;
				},
				err => {
					finallyBlock ? finallyBlock() : null;
					throw err;
				}
			);
		}
		return result;
	}
	finally {
		if (!isAsync && finallyBlock) {
			finallyBlock();
		}
	}
}
