'use strict';

const JS     = require('../JS');
const expect = require('chai').expect;

describe('mixin', function() {

	const Foo1 = JS.class('Foo1');
	const Foo2 = JS.class('Foo2');
	const Foo3 = JS.class('Foo3');
	const Foo4 = JS.class('Foo4');
	const Bar  = JS.class('Bar');
	const Bar2 = JS.class('Bar2');
	const Bar3 = JS.class('Bar3');

	JS.class(Foo1, {
		fields : {
			field1 : {
				type : Date,
			},
		},
		methods : {
			method1 : function() {
				return 'method1';
			},
		},
	});

	JS.class(Foo2, {
		inherits : Foo1,

		fields : {
			field2 : '',
			field3 : 0,
		},

		methods : {
			method2 : function() {
				return 'method2';
			},
		},
		static : {
			fields : {
				staticField1 : 'staticField1',
			},
			methods : {
				staticMethod1 : function() {
					return 'staticMethod1';
				},
			},
		},
	});

	JS.class(Foo3, {});

	JS.class(Foo4, {
		methods : {
			method4 : { abstract : true },
		},
	});

	JS.class(Bar, {
		mixin : [ Foo2, Foo3 ],

		fields : {
			field2 : 'overriden',
		},
	});

	JS.class(Bar2, {
		inherits : Bar,
	});

	JS.class(Bar3,  {
		inherits : Bar2,
		mixin    : Foo2,
	});

	it('should allow mixin of instance fields and methods', function() {
		const bar = new Bar();
		expect(bar.field3).to.equal(0);
		expect(bar.method2()).to.equal('method2');
	});

	it('should not override properties already defined by the class', function() {
		const bar = new Bar();
		expect(bar.field2).to.equal('overriden');
	});

	it('should override properties of the class that were inherited', function() {
		const bar = new Bar3();
		expect(bar.field2).to.equal('');
	});

	it('should allow mixed-in class to inherit fields and methods of mixin-base class', function() {
		const bar = new Bar();
		expect(bar.field1 instanceof Date).to.equal(true);
		expect(bar.method1()).to.equal('method1');
	});

	it('should allow mixin of static fields and methods', function() {
		expect(Bar.staticField1).to.equal('staticField1');
		expect(Bar.staticMethod1()).to.equal('staticMethod1');
	});

	it("should be true that a class's .hasMixin() method reports true for all inherited mixins", function() {
		expect(Bar.hasMixin(Foo1)).to.be.true;
		expect(Bar.hasMixin(Foo2)).to.be.true;
		expect(Bar.hasMixin(Foo3)).to.be.true;
		expect(Bar.hasMixin(Bar2)).to.be.false;

		expect(Bar2.hasMixin(Foo1)).to.be.true;
		expect(Bar2.hasMixin(Foo2)).to.be.true;
		expect(Bar2.hasMixin(Foo3)).to.be.true;
		expect(Bar2.hasMixin(Bar)).to.be.false;
	});

	it('should be true that the static JS.class.hasMixin method reports true for all inherited mixins', function() {
		expect(JS.class.hasMixin(Bar, Foo1)).to.be.true;
		expect(JS.class.hasMixin(Bar, Foo2)).to.be.true;
		expect(JS.class.hasMixin(Bar, Foo3)).to.be.true;
		expect(JS.class.hasMixin(Bar, Bar2)).to.be.false;

		expect(JS.class.hasMixin(Bar2, Foo1)).to.be.true;
		expect(JS.class.hasMixin(Bar2, Foo2)).to.be.true;
		expect(JS.class.hasMixin(Bar2, Foo3)).to.be.true;
		expect(JS.class.hasMixin(Bar2, Bar)).to.be.false;

		expect(JS.class.hasMixin(null, null)).to.be.false;
		expect(JS.class.hasMixin(null, Foo1)).to.be.false;
		expect(JS.class.hasMixin(Bar,  null)).to.be.false;
		expect(JS.class.hasMixin(new Bar(), Foo1)).to.be.true;
		expect(JS.class.hasMixin(new Bar(), 'Foo1')).to.be.true;
		expect(JS.class.hasMixin(new Bar(), new Foo1())).to.be.true;
	});

	it('should mixin methods to a base class, allow them to be overridden in a base class, and allow inheriting from that base class', function() {
		const Base = JS.class('Base',  {
			mixin : Foo1,

			methods : {
				method1 : function() {
					return 'overridden-method1';
				},
			},
		});

		const Sub = JS.class('Sub', {
			inherits : Base,
		});

		const base = new Base();
		const sub  = new Sub();

		expect(base.method1()).to.equal('overridden-method1');
		expect(sub.method1()).to.equal('overridden-method1');
	});

	it('should mixin methods to a base class and allow them to be overridden in a subclass', function() {
		const Base = JS.class('Base',  {
			mixin : Foo1,
		});

		const Sub = JS.class('Sub', {
			inherits : Base,

			methods : {
				method1 : function() {
					return 'overridden-method1';
				},
			},
		});

		const base = new Base();
		const sub  = new Sub();

		expect(base.method1()).to.equal('method1');
		expect(sub.method1()).to.equal('overridden-method1');
	});

	it('should mixin abtract methods to a base class, allow them to be implemented in a base class, and allow inheriting from that base class', function() {
		const Base = JS.class('Base',  {
			mixin : Foo4,

			methods : {
				method4 : function() {
					return 'method4';
				},
			},
		});

		const Sub = JS.class('Sub', {
			inherits : Base,
		});

		expect(Base.isAbstract()).to.be.false;
		expect(Sub.isAbstract()).to.be.false;

		const base = new Base();
		const sub  = new Sub();

		expect(base.method4()).to.equal('method4');
		expect(sub.method4()).to.equal('method4');
	});

	it('should mixin abtract methods to a base class and allow them to be implemented in a sub class', function() {
		const Base = JS.class('Base',  {
			mixin : Foo4,
		});

		const Sub = JS.class('Sub', {
			inherits : Base,

			methods : {
				method4 : function() {
					return 'method4';
				},
			},
		});

		expect(Base.isAbstract()).to.be.true;
		expect(Sub.isAbstract()).to.be.false;

		const sub = new Sub();
		expect(sub.method4()).to.equal('method4');
	});

	it('should support calling $super within a mixin method when mixin is applied to different classes', function() {
		const Base1 = JS.class('Base1', {
			methods : {
				func : function() {
					return 'B1';
				},
			},
		});
		const Base2 = JS.class('Base2', {
			methods : {
				func : function() {
					return 'B2';
				},
			},
		});
		const Mixin = JS.class('Mixin', {
			methods : {
				func : function() {
					return `${this.func.super.call(this)}+Mix`;
				},
			},
		});

		const Impl1 = JS.class('Impl1', {
			inherits : Base1,
			mixin    : Mixin,
		});
		const Impl2 = JS.class('Impl2', {
			inherits : Base2,
			mixin    : Mixin,
		});

		const impl1 = new Impl1();
		expect(impl1.func()).to.equal('B1+Mix');

		const impl2 = new Impl2();
		expect(impl2.func()).to.equal('B2+Mix');
	});

	it('should support calling $super within a mixin method when the mixin is applied to two classes in the tree', function() {
		const Mixin = JS.class('Mixin', {
			methods : {
				func : function() {
					return `${this.func.super.call(this)}+Mix`;
				},
			},
		});

		const Base = JS.class('Base', {
			methods : {
				func : function() {
					return 'Base';
				},
			},
		});

		const Sub = JS.class('Sub', {
			inherits : Base,
			mixin    : Mixin,
		});
		const SubSub = JS.class('SubSub', {
			inherits : Sub,
			mixin    : Mixin,
		});

		const obj = new SubSub();
		expect(obj.func()).to.equal('Base+Mix+Mix');
	});

	// COULDDO: implement this behaviour since it's counter-intuitive that this wouldn't happen
	// however, this might cause bugs in existing code since it would change existing behaviour
	it.skip("should call the mixin's constructor", function() {
		const Mixin = JS.class('Mixin', {
			fields : {
				f : 0,
			},
			constructor : function() {
				this.f = 1;
			},
		});

		const Foo = JS.class('Foo', {
			mixin : Mixin,
		});

		const foo = new Foo();
		expect(foo.f).to.equal(1);
	});
});
