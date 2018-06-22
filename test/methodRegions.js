'use strict';

const JS     = require('../JS');
const expect = require('chai').expect;

describe('method regions', function() {
	const Foo = JS.class('Foo', {
		methods : {
			method0 : function() {
				return 0;
			},

			$group1 : {
				method1 : function() {
					return 1;
				},
				method2 : function() {
					return 2;
				},
				getter : {
					get : function() {
						return 3;
					},
				},
			},
		},
	});

	const Bar = JS.class('Bar', {
		inherits : Foo,

		methods : {
			method1 : function() {
				return 11;
			},

			$group2 : {
				method0 : function() {
					return -1;
				},
			},
		},
	});

	const Bar2 = JS.class('Bar2', {
		mixin : Foo,

		methods : {
			method1 : function() {
				return 11;
			},

			$group1 : {
				method0 : function() {
					return -1;
				},
			},
		},
	});

	const Bar3 = JS.class('Bar3', {
		methods : {
			method0 : { abstract : true },
			method1 : { abstract : true },
		},
	});

	const Bar4 = JS.class('Bar4', {
		inherits : Bar3,
		mixin    : Foo,
	});

	const Bar5 = JS.class('Bar5', {
		mixin : Bar3,

		methods : {
			method0 : function() {
				return 0;
			},

			$group : {
				method1 : function() {
					return 1;
				},
			},
		},
	});

	it('should allow methods to be enclosed in named regions', function() {
		const foo = new Foo();
		expect(foo.method0()).to.equal(0);
		expect(foo.method1()).to.equal(1);
		expect(foo.method2()).to.equal(2);
		expect(foo.getter).to.equal(3);
	});

	it('should allow mixing in methods enclosed in a named region', function() {
		const bar2 = new Bar2();
		expect(bar2.method2()).to.equal(2);
	});

	it('should not affect the overrideability of a method', function() {
		const bar = new Bar();
		expect(bar.method0()).to.equal(-1);
		expect(bar.method1()).to.equal(11);

		const bar4 = new Bar4();
		expect(bar4.method0()).to.equal(0);
		expect(bar4.method1()).to.equal(1);
	});

	it('should not affect isAbstract detection', function() {
		expect(Bar4.isAbstract()).to.be.false;
		expect(Bar5.isAbstract()).to.be.false;
	});

	// it would be nice if this worked, but it is easy enough to work around for now
	it.skip('should work when mixing in a method and using the same named region', function() {
		const bar2 = new Bar2();
		expect(bar2.method0()).to.equal(-1);
		expect(bar2.method1()).to.equal(11);
		expect(bar2.method2()).to.equal(2);
	});
});

