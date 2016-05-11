'use strict';

var JS     = require('../JS');
var expect = require('chai').expect;

describe('stub.js', function() {

	var Foo = JS.class('Foo');
	var Bar = JS.class('Bar');
	var Stub = JS.class('Stub');

	JS.class(Foo, {
		fields : {
			bar : {
				type : Bar
			}
		}
	});

	JS.class(Bar, {
		fields : {
			foo : {
				type : Foo,
				init : null
			}
		}
	});

	it('should allow creation of instances whose classes have references to each other', function() {
		var foo = new Foo();
		var bar = new Bar();
		bar.foo = foo;
		expect(foo.bar instanceof Bar).to.be.ok;
		expect(bar.foo instanceof Foo).to.be.ok;
	});

	it('should disallow creation of instances of stub classes', function() {
		expect(function() { var a= new Stub() }).to.throw();
	});
});
