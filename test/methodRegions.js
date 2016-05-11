'use strict';

var JS     = require('../JS');
var expect = require('chai').expect;

describe('method regions', function() {
	var Foo = JS.class('Foo', {
		methods : {
			method0 : function() { return 0 },

			$group1 : {
				method1 : function() { return 1 },
				method2 : function() { return 2 },
				getter : {
					get : function() { return 3 }
				}
			}
		}
	});

	var Bar = JS.class('Bar', {
		inherits : Foo,

		methods : {
			method1 : function() { return 11 },

			$group2 : {
				method0 : function() { return -1 }
			}
		}
	});

	it('should allow methods to be enclosed in named regions', function() {
		var foo = new Foo();
		expect(foo.method0()).to.equal(0);
		expect(foo.method1()).to.equal(1);
		expect(foo.method2()).to.equal(2);
		expect(foo.getter).to.equal(3);
	});

	it('should not affect the overrideability of a method', function() {
		var bar = new Bar();
		expect(bar.method0()).to.equal(-1);
		expect(bar.method1()).to.equal(11);
	});
});

