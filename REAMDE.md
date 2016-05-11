## Classes

`JS.class` creates a typical Javascript constructor Function that can be used to create new instances of Objects.

A class definition consists of two parts: the class name and the class properties.

Basic usage:
```javascript
	const FirstClass = JS.class('FirstClass', {});
	let i = new FirstClass();
```

The name of the class can be any string.  However, if it contains the period character,
then the substring after the last period character will be used as the name of the returned Function that is displayed in the Chrome inspector.

The class properties is an Object whose keys define various attributes of the class like fields and methods (see below)

### Fields

A class field stores a value for each instance that is created.

```javascript
	const Point = JS.class('Point', {
		fields : {
			x : { type : Number },
			y : { type : Number }
		}
	});

	let d1 = new Point();
	d1.x = 5;
	d1.y = 10;
```

A field definition consists of an Object with a number of properties.
These properties can be any key/value pair and can be read as meta-data for the field.
Certain properties are used by the JS.class system namely:

#### type

Defines the Javascript constructor Function whose instance is expected to be assigned to this field. (eg: String, Object, Date, etc..)
Unless there's an explicit `init` property, upon construction of a new instance of this class, the field will receive a `new` instance of this Function.

#### init

The initial value of the field after creating a new instance of this class.
While this is traditionally done in the constructor, this field property allows the initial value assignment to be done with each field
which puts it closer to the field definition.
In any cases this eliminates the need for an explicit constructor function.

##### Primitive Value

When this is a primitive value (ie. number, string) then that is initial value for this field.

##### Function

When this is a Function, it is invoked and the result is the initial value for this field.

#### short-hand notation

There a couple of short-hand forms for the `type` and `init` fields.
The `type` can be a primitive value (ie. `'hello world'`, `4`) in which case this is shorthand notation for the `init` value and the `type` is derived
from the type of initial value.

Eg:
```javascript
{
	type : 'hello world'
}
```

is the same as
```javascript
{
	type : String,
	init : 'hello world'
}
```

This is also the default property when a primitive value is supplied as the entire value of the field definition:

```javascript
field : 43
```

is the same as:
```
field : {
	type : Number,
	init : 43
}
```

### Constructor

This property is an optional function that is called during the creation of a new instance of this class.  It is called after all the fields have been initialized to their default values.
It's parameters are any values that were supplied during the construction call.

```javascript
const Point = JS.class('Point', {
	constructor : function(x, y) {
		console.log(x, y);
	}
});

var a = new Point(4, -10);    // prints out 4, -10 to the console
```

Constructors in base classes are called automatically with the same arguments.  There is currently no way to call base-class constructors explicitly.

### Methods

This property defines methods that can be invoked on instances of the class.

```javascript
const Point = JS.class('Point', {
	fields : {
		x : 0,
		y : 0
	},

	methods : {
		moveTo : function(newX, newY) {
			this.x = newX;
			this.y = newY;
		}
	}
});

var a = new Point();
a.moveTo(4, -10);
```

The context (ie. `this`) in an invoked method is the instance of the class.

### Inheritence

This optional property defines another class which is the parent class of this one.  The parent class's fields will be inherited and the parent class will be linked
into the prototype chain for this class making any of it's methods available to this class.

```javascript
const Circle = JS.class('Circle', {
	inherits : Point,

	fields : {
		radius : 1
	}
});

var a    = new Circle();
a.radius = 5;
a.moveTo(10, 10);
```

#### Calling super class methods

Within a method, the same method in the base class can be invoked by using this notation: `this.method.super()`

```javascript
const Sphere = JS.class('Sphere', {
	inherits : Circle,

	fields : {
		z : 0
	},

	methods : {
		moveTo : function(x, y, z) {
			this.moveTo.super(x, y);
			this.z = z;
		}
	}
});
```

### Mixins

A class can be mixed into another class.  This means that all fields and methods of the mixin class are copied into the mixed-in class.

This allows a certain amount of re-use without resorting to inheritence since a class can only inherit from one other class.

A class can have more than one mixin in which case all fields and methods of the mixed in classes will be used in order of the declared mixins with later fields & methods replacing any previous ones.

```javascript
const MyMixin = JS.class('MyMxin', {
	methods : {
		save : function() {}
	}
});

const Sphere = JS.class('Circle', {
	inherits : Point,
	mixin : [ MyMixin ]
});

var s = new Sphere();
s.save();
```

### Abstract Classes

TODO

### Static

A class can have static properties which are defined on the class object itself rather than on each instance.

```javascript
const Point = JS.class('Point', {
	constructor : function() {
		Point.allPoints.push(this);
	},

	static : {
		fields : {
			allPoints : Array
		},

		methods : {
			getAllPoints : function() {
				return this.allPoints;
			}
		}
	}
});

new Point();
new Point();
console.log(Point.getAllPoints().length); // prints out 2
```

Note that in addition to a class inheritence hierarchy, there's also another hierarchy with the class objects themselves.  Thus static properties are inherited by subclass class objects.

```javascript
const Circle = JS.class('Circle', {
	inherits : Point
});

new Circle();
console.log(Circle.getAllPoints().length) // prints out 3
```

#### afterCreateClass()

If a static method is declared with this name, it will be called everytime there is a class defined that is a subclass of this class.

```javascript
const BaseClass = JS.class('BaseClass', {
	static : {
		methods : {
			afterCreateClass : function(subclass) {
				// gets called with subclass === Subclass
			}
		}
	}
});

const Subclass = JS.class('Subclass', {
	inherits : BaseClass
});

```

This can be useful for creating a collection of all descendant subclasses in a base class.

### Class Stubs

A class can be declared without it's definition being supplied.
This allows the class to be used recursively during the definition of the class.

```javascript

const Node = JS.class('Node');

JS.class(Node, {
	fields : {
		parentNode : {
			type : Node,
			init : null
		},

		firstChild : {
			type : Node,
			init : null
		},

		nextSibling : {
			type : Node,
			init : null
		}
	}
});
```

### Class Events

#### fieldDefinition

### Advanced
#### JS.getter
#### JS.setter
#### JS.class.initialFieldValue
#### JS.class.isSubclass
#### JS.class.isUnderConstruction

#### BaseClass.isSubclass
#### BaseClass.forEachField
#### BaseClass.hasMixin
#### BaseClass.getFieldProperties
#### BaseClass.isAbstract

## Utils

#### JS.util.callback
#### JS.util.ensureArray
#### JS.util.proxy
#### JS.util.clone

## Development

to run tests:

1. `npm install -g mocha`
2. `mocha`