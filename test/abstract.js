'use strict';

const JS     = require('../JS');
const expect = require('chai').expect;

describe('abstract.js', function() {

	const AbstractClass1 =
	JS.class('AbstractClass1', {
		methods : {
			method1 : {
				abstract : true
			}
		}
	});

	const AbstractClass2 =
	JS.class('AbstractClass2', {
		inherits : AbstractClass1,

		methods : {
			method2 : { abstract : true }
		}
	});

	const AbstractClass3 =
	JS.class('AbstractClass3', {
		inherits : AbstractClass2,

		methods : {
			method1 : function() { return 'something'; }
		}
	});

	const ConcreteClass =
	JS.class('ConcreteClass', {
		inherits : AbstractClass2,

		methods : {
			method1 : function() {
				return true;
			},
			method2 : function() {
				return false;
			}
		}
	});

	it('should have isAbstract() return true for abstract classes and false for concrete classes', function() {
		expect(AbstractClass1.isAbstract()).to.equal(true);
		expect(AbstractClass2.isAbstract()).to.equal(true);
		expect(AbstractClass3.isAbstract()).to.equal(true);
		expect(ConcreteClass.isAbstract()).to.equal(false);
	});

	it('should not allow classes with one or more abstract methods to be instantiated', function() {
		expect(function() { new AbstractClass1(); }).to.throw();
		expect(function() { new AbstractClass2(); }).to.throw();
		expect(function() { new AbstractClass3(); }).to.throw();
	});

	it('should allow the creation of new instances of derived classes that have implemented all abstract methods', function() {
		const a = new ConcreteClass();
		expect(a.method1()).to.equal(true);
		expect(a.method2()).to.equal(false);
	});
});

