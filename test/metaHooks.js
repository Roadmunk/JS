'use strict';

var JS     = require('../JS');
var expect = require('chai').expect;

describe('metaHooks', function() {

	var Foo1 = JS.class('Foo1');
	var Foo2 = JS.class('Foo1');
	var Bar  = JS.class('Bar');

	var foo1, foo2;

	JS.class(Foo1, {
		static : {
			methods : {
				afterCreateClass : function(subclass) {
					foo1 = subclass;
				}
			}
		}
	});

	JS.class(Foo2, {
		inherits : Foo1,

		static : {
			methods : {
				afterCreateClass : function(subclass) {
					Foo1.afterCreateClass(subclass);
					foo2 = subclass;
				}
			}
		}
	});

	it('should call afterCreateClass on the parent of the subclass', function() {
		foo1 = foo2 = undefined;

		JS.class(Bar, {
			inherits : Foo2,
			static : {
				methods : {
					afterCreateClass : function() {
						throw "should not be called";
					}
				}
			}
		});

		expect(foo1).to.equal(Bar);
		expect(foo2).to.equal(Bar);
	});
});
