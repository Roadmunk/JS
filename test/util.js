'use strict';

const JS     = require('../JS');
const expect = require('chai').expect;

describe('util.js', function() {

	describe('callback', function() {

		let output;

		const callback1 = function(arg1) {
			output = arg1;
		};
		const callback2 = function(arg1, arg2, arg3) {
			output = arg3;
		};
		const callback3 = function(arg1) {
			output = arg1; throw 'adsf';
		};

		beforeEach(function() {
			output = null;
		});

		it('should allow callbacks without arguments', function() {
			output = 'asdf';
			JS.util.callback(callback1);
			expect(output).to.equal(undefined);
		});

		it('should allow callbacks with arguments', function() {
			const obj1 = {};

			JS.util.callback(callback2, [ 1, 'string', obj1 ]);
			expect(output).to.equal(obj1);
		});

		it('should ignore falsy callback() values', function() {
			expect(function() {
				JS.util.callback(null);
				JS.util.callback(undefined);
			}).not.to.throw();
		});

		it('should catch exceptions', function() {
			expect(function() {
				JS.util.callback(callback3, [ 'test1' ]);
			}).not.to.throw();

			expect(output).to.equal('test1');
		});
	});

	describe('createFactory', function() {
		it('should create factories for the given type', function() {
			const dateFactory = JS.util.createFactory(Date);
			expect(dateFactory() instanceof Date).to.equal(true);
		});

		it('should pass any parameters to the constructor', function() {
			const dateFactory = JS.util.createFactory(Date);

			const date = dateFactory('Jan 1, 2014');

			expect(date instanceof Date).to.equal(true);
			expect(date.getMonth()).to.equal(0);
			expect(date.getFullYear()).to.equal(2014);
			expect(date.getDate()).to.equal(1);
		});
	});

	describe('defaults', function() {
		it('should create default values when missing', function() {
			const result = JS.util.defaults(undefined, { a : 5, b : 'asdf' });
			expect(result).not.to.be.undefined;
			expect(result.a).to.equal(5);
			expect(result.b).to.equal('asdf');
		});

		it('should not override values when provided', function() {
			let result = { a : 6 };
			result = JS.util.defaults(result, { a : 5, b : 'asdf' });
			expect(result.a).to.equal(6);
			expect(result.b).to.equal('asdf');
		});

		it('should not modify the options parameter', function() {
			const result  = { a : 6 };
			const result2 = JS.util.defaults(result, { a : 5, b : 'asdf' });
			expect(result).to.not.have.property('b');
			expect(result2).to.have.property('b');
		});
	});

	describe('ensureArray', function() {
		it('should return the value if already an array', function() {
			let array = [];
			expect(JS.util.ensureArray(array)).to.deep.equal(array);

			array = [ 1, 2, 3 ];
			expect(JS.util.ensureArray(array)).to.deep.equal(array);
		});

		it('should return an array that wraps a non-array value', function() {
			expect(JS.util.ensureArray('')).to.deep.equal([ '' ]);
			expect(JS.util.ensureArray('asdf')).to.deep.equal([ 'asdf' ]);
			expect(JS.util.ensureArray(1234)).to.deep.equal([ 1234 ]);

			const date = new Date();
			expect(JS.util.ensureArray(date)).to.deep.equal([ date ]);
		});

		it('should return a new empty array on null or undefined', function() {
			expect(JS.util.ensureArray(null)).to.deep.equal([]);
			expect(JS.util.ensureArray(undefined)).to.deep.equal([]);
			expect(JS.util.ensureArray()).to.deep.equal([]);
			expect(JS.util.ensureArray('')).to.deep.equal([ '' ]);
		});
	});

	describe('proxy', function() {
		it('should override given method and pass in the old method into the overriding function', function() {
			let foo = '';
			const testObject = {
				func1 : function(param1) {
					foo += `,${param1}`;
					return 5;
				},
			};

			JS.util.proxy(testObject, 'func1', function(oldFunc, param1) {
				foo += 'new';
				return oldFunc(param1);
			});

			const a = testObject.func1('test');

			expect(foo).to.equal('new,test');
			expect(a).to.equal(5);
		});
	});

});
