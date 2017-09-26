'use strict';

const JS     = require('../JS');
const expect = require('chai').expect;

describe('abstract.js', function() {

	const AbstractClass1 =
	JS.class('AbstractClass1', {
		methods : {
			method1 : {
				abstract : true,
			},
		},
	});

	const AbstractClass2 =
	JS.class('AbstractClass2', {
		inherits : AbstractClass1,

		methods : {
			method2 : { abstract : true },
		},
	});

	const AbstractClass3 =
	JS.class('AbstractClass3', {
		inherits : AbstractClass2,

		methods : {
			method1 : function() { return 'something'; },
		},
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
			},
		},
	});

	const AbstractClass4 =
	JS.class('AbstractClass4', {
		// inherits : ConcreteClass,

		fields : {
			field1 : { abstract : true },
		},
	});

	const AbstractClass5 =
	JS.class('AbstractClass5', {
		inherits : AbstractClass4,

		fields : {
			field2 : { abstract : true },
		},
	});

	const AbstractClass6 =
	JS.class('AbstractClass6', {
		inherits : AbstractClass5,

		fields : {
			field1 : { type : 'something' },
		},
	});

	const ConcreteClass2 =
	JS.class('ConcreteClass2', {
		inherits : AbstractClass5,

		fields : {
			field1 : {
				type : true,
			},
			field2 : {
				type : false,
			},
		},
	});


	it('should have isAbstract() return true for abstract classes and false for concrete classes', function() {
		expect(AbstractClass1.isAbstract()).to.equal(true);
		expect(AbstractClass2.isAbstract()).to.equal(true);
		expect(AbstractClass3.isAbstract()).to.equal(true);
		expect(ConcreteClass.isAbstract()).to.equal(false);

		expect(AbstractClass4.isAbstract()).to.equal(true);
		expect(AbstractClass5.isAbstract()).to.equal(true);
		expect(AbstractClass6.isAbstract()).to.equal(true);
		expect(ConcreteClass2.isAbstract()).to.equal(false);
	});

	it('should not allow classes with one or more abstract methods to be instantiated', function() {
		expect(function() { new AbstractClass1(); }).to.throw();
		expect(function() { new AbstractClass2(); }).to.throw();
		expect(function() { new AbstractClass3(); }).to.throw();
	});

	it('should not allow classes with one or more abstract fields to be instantiated', function() {
		expect(function() { new AbstractClass4(); }).to.throw();
		expect(function() { new AbstractClass5(); }).to.throw();
		expect(function() { new AbstractClass6(); }).to.throw();
	});

	it('should allow the creation of new instances of derived classes that have implemented all abstract methods', function() {
		const a = new ConcreteClass();
		expect(a.method1()).to.equal(true);
		expect(a.method2()).to.equal(false);
	});

	it('should allow the creation of new instances of derived classes that have implemented all abstract fields', function() {
		const a = new ConcreteClass2();
		expect(a.field1).to.equal(true);
		expect(a.field2).to.equal(false);
	});

	it('should report name of astract method when preventing instantiating abstract class', function() {
		expect(function() { new AbstractClass1(); }).to.throw().and.to.have.property('message').include('method1');
	});

	it('should report name of astract field when preventing instantiating abstract class', function() {
		expect(function() { new AbstractClass4(); }).to.throw().and.to.have.property('message').include('field1');
	});
});

