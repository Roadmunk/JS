'use strict';

const { expect } = require('chai');
const JS         = require('../JS');

describe('casting.js', function() {
	let constructorCalled = false;

	const Foo = JS.class('Foo', {
		fields : {
			string : {
				type : '',
			},

			reference : {
				type : Object,
			},
		},

		constructor : function() {
			constructorCalled = true;
		},

		methods : {
			method1 : {
				abstract : true,
			},
		},
	});

	const Bar = JS.class('Bar', {
		inherits : Foo,

		fields : {
			number : {
				type : 0,
			},
		},

		methods : {
			method1 : function() {
				return;
			},
		},
	});

	const Other = JS.class('Other', {});

	it('should allow casting of subclass instance to an instance of base class', function() {
		const bar  = new Bar();
		bar.string = 'asdf';

		expect(constructorCalled).to.be.true;
		constructorCalled = false;

		const foo = Foo(bar);

		expect(constructorCalled).to.be.false;
		expect(foo).not.to.be.null;
		expect(foo instanceof Foo).to.be.ok;
		expect(foo.string).to.equal('asdf');
		expect(foo.reference).not.to.be.undefined;
		expect(foo.reference).to.equal(bar.reference);

		expect(bar.number).to.equal(0);
		expect(foo.number).to.be.undefined;

		bar.reference.a = 5;
		expect(foo.reference.a).to.equal(bar.reference.a);
	});

	it('should creates a shallow clone if the given instance is of the same class as the casting class', function() {
		const bar  = new Bar();
		bar.string = 'asdf';
		bar.number = 5;
		const bar2 = Bar(bar);

		expect(bar2.constructor).to.equal(bar.constructor);
		expect(bar2).not.to.equal(bar);
		expect(bar2.string).to.equal(bar.string);
		expect(bar2.number).to.equal(bar.number);
		expect(bar2.reference).to.equal(bar.reference);
	});

	it('should disallow casting to classes that are not base classes', function() {
		const bar = new Bar();
		expect(function() {
			Other(bar);
		}).to.throw();
	});

	it('should not allow empty arguments', function() {
		expect(function() {
			Other();
		}).to.throw();
	});
});
