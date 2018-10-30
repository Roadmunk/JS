'use strict';

const expect = require('chai').expect;
const JS     = require('../dist/JS');

describe('init.js', function() {

	const Foo = JS.class('Foo', {
		fields : {
			e : {
				type : String,
				init : function() {
					return this.a;
				},
				initDependencies : 'a',
			},
			a : {
				type : String,
				init : 'primitive constant',
			},
			b : {
				type : String,
				init : function() {
					return 'init with function';
				},
			},
			c : {
				type : Object,
				init : null,
			},
			d : {
				type : '',
			},
			f : {
				type : Number,
				init : undefined,
			},
		},
	});

	const Bar = JS.class('Bar', {
		fields : {
			a : {
				type : Object,
				init : {},
			},
		},
	});

	it('should allow field initialization with primitive constants', function() {
		const foo = new Foo();
		expect(foo.a).to.equal('primitive constant');
	});

	it('should allow field initialization with a function', function() {
		const foo = new Foo();
		expect(foo.b).to.equal('init with function');
	});

	it('should allow field initialization with null', function() {
		const foo = new Foo();
		expect(foo.c).to.be.null;
	});

	it('should allow default field initialization when no init is present', function() {
		const foo = new Foo();
		expect(typeof foo.d).to.equal('string');
		expect(foo.d).to.equal('');
	});

	it('should allow field initialization with undefined when undefined is explicitly provided', function() {
		const foo = new Foo();
		expect(foo.f).to.be.undefined;
	});

	it('should throw an error when trying to initialize with a specific object', function() {
		expect(function() {
			const a = new Bar(); return a;
		}).to.throw();
	});

	it('should initialize any dependency fields first', function() {
		const foo = new Foo();
		expect(foo.e).to.equal('primitive constant');
	});

	it('should throw an error when a dependency cycle exists', function() {
		const Cycle1 = JS.class('Cycle1', {
			fields : {
				a : {
					type             : String,
					initDependencies : 'b',
				},
				b : {
					type             : String,
					initDependencies : 'a',
				},
			},
		});

		const Cycle2 = JS.class('Cycle2', {
			fields : {
				a : {
					type             : String,
					initDependencies : 'b',
				},
				b : {
					type             : String,
					initDependencies : 'c',
				},
				c : {
					type             : String,
					initDependencies : 'a',
				},
			},
		});

		const Cycle3 = JS.class('Cycle3', {
			inherits : Foo,

			fields : {
				a : {
					type             : String,
					initDependencies : 'e',
				},
			},
		});

		/* Make sure the error we're expecting is thrown by matching against the
		 * error message, since a 'Maximum call stack size exceeded' error can
		 * be thrown instead if the cycle detection is not working. */
		const errorExp = /initDependencies cycle/;
		expect(() => new Cycle1()).to.throw(errorExp);
		expect(() => new Cycle2()).to.throw(errorExp);
		expect(() => new Cycle3()).to.throw(errorExp);
	});

	it("should allow passing arguments to the field's init function", function() {
		const Foo = JS.class('Foo', {
			fields : {
				a : {
					type : Number,
					init : function(arg1) {
						return arg1 !== undefined ? arg1 + 1 : 0;
					},
				},
			},
		});

		const foo = new Foo();
		expect(foo.a).to.equal(0);

		expect(JS.class.initialFieldValue(foo, 'a', [ 5 ])).to.equal(6);
	});
});
