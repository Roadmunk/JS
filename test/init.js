'use strict';

var JS     = require('../JS');
var expect = require('chai').expect;

describe('init.js', function() {

	var Foo = JS.class('Foo', {
		fields : {
			e: {
				type : String,
				init : function() {
					return this.a;
				},
				initDependencies : 'a'
			},
			a : {
				type : String,
				init : 'primitive constant'
			},
			b : {
				type : String,
				init : function() {
					return 'init with function';
				}
			},
			c : {
				type : Object,
				init : null
			},
			d : {
				type : ''
			},
			f : {
				type : Number,
				init : undefined
			}
		}
	});

	var Bar = JS.class('Bar', {
		fields : {
			a : {
				type : Object,
				init : {}
			}
		}
	});

	it('should allow field initialization with primitive constants', function() {
		var foo = new Foo();
		expect(foo.a).to.equal('primitive constant');
	});

	it('should allow field initialization with a function', function() {
		var foo = new Foo();
		expect(foo.b).to.equal('init with function');
	});

	it('should allow field initialization with null', function() {
		var foo = new Foo();
		expect(foo.c).to.be.null;
	});

	it('should allow default field initialization when no init is present', function() {
		var foo = new Foo();
		expect(typeof foo.d).to.equal("string");
		expect(foo.d).to.equal('');
	});

	it('should allow field initialization with undefined when undefined is explicitly provided', function() {
		var foo = new Foo();
		expect(foo.f).to.be.undefined;
	});

	it('should throw an error when trying to initialize with a specific object', function() {
		expect(function() { var a = new Bar(); return a }).to.throw();
	});

	it('should initialize any dependency fields first', function() {
		var foo = new Foo();
		expect(foo.e).to.equal("primitive constant");
	});
});
