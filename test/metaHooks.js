'use strict';

const expect = require('chai').expect;
const JS     = require('../JS');

describe('metaHooks', function() {

	const Foo1 = JS.class('Foo1');
	const Foo2 = JS.class('Foo1');
	const Bar  = JS.class('Bar');

	let foo1, foo2;

	JS.class(Foo1, {
		static : {
			methods : {
				afterCreateClass : function(subclass) {
					foo1 = subclass;
				},
			},
		},
	});

	JS.class(Foo2, {
		inherits : Foo1,

		static : {
			methods : {
				afterCreateClass : function(subclass) {
					Foo1.afterCreateClass(subclass);
					foo2 = subclass;
				},
			},
		},
	});

	it('should call afterCreateClass on the parent of the subclass', function() {
		foo1 = foo2 = undefined;

		JS.class(Bar, {
			inherits : Foo2,
			static   : {
				methods : {
					afterCreateClass : function() {
						throw 'should not be called';
					},
				},
			},
		});

		expect(foo1).to.equal(Bar);
		expect(foo2).to.equal(Bar);
	});
});
