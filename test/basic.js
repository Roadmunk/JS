'use strict';

const { expect } = require('chai');
const JS         = require('../JS');

describe('basic.js', function() {
	describe('a class', function() {
		it('should call base constructors', function() {
			const SubclassWithNoConstructor = JS.class('SubclassWithNoConstructor', {
				inherits : ParentClass,
			});

			const parentClass = new ParentClass();
			expect(parentClass.constructorHistory).to.equal('ParentClass;');

			const foo = new Foo();
			expect(foo.constructorHistory).to.equal('ParentClass;SubClass;Foo;');

			const subclassWithNoConstructor = new SubclassWithNoConstructor();
			expect(subclassWithNoConstructor.constructorHistory).to.equal('ParentClass;');
		});

		it('should have independant fields for different instances', function() {
			const foo1 = new Foo();
			const foo2 = new Foo();

			expect(foo1.a).to.equal('');
			expect(foo1.b).to.equal(1);
			expect(foo2.a).to.equal('');
			expect(foo2.b).to.equal(1);

			foo1.a = 'asdf';
			foo1.b = 34;
			expect(foo1.a).to.equal('asdf');
			expect(foo1.b).to.equal(34);
			expect(foo2.a).to.equal('');
			expect(foo2.b).to.equal(1);
		});

		it('should have value fields per instance and property fields per class', function() {
			const foo1 = new Foo();
			expect(foo1.hasOwnProperty('a')).to.be.ok;
			expect(foo1.hasOwnProperty('c')).not.to.be.ok;
			foo1.c = 'adf';
			expect(foo1.a).to.equal('adf');
			expect(foo1.c).to.equal('adf');
			expect(foo1.hasOwnProperty('a')).to.be.ok;
			expect(foo1.hasOwnProperty('c')).not.to.be.ok;
		});

		it('should correctly process shorthand notation for defining types', function() {
			const foo1 = new Foo();

			expect(typeof foo1.d).to.equal('boolean');
			expect(foo1.d).to.equal(true);

			expect(typeof foo1.e).to.equal('undefined');
			expect(foo1.e).to.equal(undefined);

			expect(typeof foo1.f).to.equal('object');
			expect(foo1.f).to.equal(null);

			expect(typeof foo1.g).to.equal('object');
			expect(foo1.g instanceof Bar).to.equal(true);
			expect(foo1.g).not.to.equal(null);

			expect(typeof foo1.h).to.equal('object');
			expect(foo1.h instanceof Bar).to.equal(true);
			expect(foo1.h).not.to.equal(null);

			expect(typeof foo1.i).to.equal('object');
			expect(foo1.i).to.equal(null);

			expect(typeof foo1.j).to.equal('object');
			expect(foo1.j).not.to.equal(null);
		});

		describe('JS.class.isSubclass and ParentClass.isSubclass', function() {
			it('should correctly lookup subclasses by class object', function() {
				// a class that inherits from a built-in class
				const MyError = JS.class('MyError', {
					inherits : Error,
					mixin    : JS.class.BaseClass,	// mixin BaseClass if we want BaseClass functionality (because it doesn't exist in Error)
				});

				expect(Foo.isSubclass(SubClass)).to.be.true;
				expect(Foo.isSubclass(ParentClass)).to.be.true;
				expect(Foo.isSubclass(Bar)).to.be.false;
				expect(MyError.isSubclass(Error)).to.be.true;
				expect(MyError.isSubclass(ParentClass)).to.be.false;	// can't inherit from both Error and ParentClass but ParentClass is mixed in
				expect(MyError.isSubclass(JS.class.BaseClass)).to.be.false;	// can't inherit from both Error and ParentClass but ParentClass is mixed in

				expect(JS.class.isSubclass(Foo, SubClass)).to.be.true;
				expect(JS.class.isSubclass(Foo, ParentClass)).to.be.true;
				expect(JS.class.isSubclass(Foo, Bar)).to.be.false;
				expect(JS.class.isSubclass(MyError, Error)).to.be.true;
				expect(JS.class.isSubclass(MyError, ParentClass)).to.be.false;	// can't inherit from both Error and ParentClass but ParentClass is mixed in
			});

			it('should correctly lookup subclasses by class name', function() {
				expect(Foo.isSubclass('SubClass')).to.be.true;
				expect(Foo.isSubclass('ParentClass')).to.be.true;
				expect(Foo.isSubclass('Bar')).not.to.be.true;
			});

			it('should correctly lookup subclasses by instance object', function() {
				expect(Foo.isSubclass(new SubClass())).to.be.true;
				expect(Foo.isSubclass(new ParentClass())).to.be.true;
				expect(Foo.isSubclass(new Bar())).not.to.be.true;
				expect(Foo.isSubclass({})).not.to.be.true;
			});

			it('should return false for non-class parameters', function() {
				expect(JS.class.isSubclass(null, '')).to.be.false;
				expect(JS.class.isSubclass(undefined, 0)).to.be.false;
				expect(JS.class.isSubclass(null, ParentClass)).to.be.false;
				expect(JS.class.isSubclass(undefined, ParentClass)).to.be.false;
				expect(JS.class.isSubclass(1, ParentClass)).to.be.false;
				expect(JS.class.isSubclass({}, ParentClass)).to.be.false;
				expect(JS.class.isSubclass('', ParentClass)).to.be.false;
				expect(JS.class.isSubclass(ParentClass, null)).to.be.false;
				expect(JS.class.isSubclass(ParentClass, 3)).to.be.false;
				expect(ParentClass.isSubclass(null)).to.be.false;
				expect(ParentClass.isSubclass(4)).to.be.false;
				expect(ParentClass.isSubclass(undefined)).to.be.false;
				expect(ParentClass.isSubclass('')).to.be.false;
			});

			it('should return false for two of the same classes when the properSubclass parameter is true', function() {
				expect(JS.class.isSubclass(Foo, Foo)).to.be.true;
				expect(JS.class.isSubclass(Foo, Foo, true)).to.be.false;
			});
		});

		it('should allow for class names with non-alpha characters', function() {
			const ClassWithDotsInName = JS.class('Class.With.Dots.In.Name', {});
			expect(ClassWithDotsInName.__className__).to.equal('Class.With.Dots.In.Name');
		});

		it('should inherit className from parent class if none specified', function() {
			const Bar1 = JS.class('Bar', {});
			const Bar2 = JS.class({ inherits : Bar1 });
			const Bar3 = JS.class({ inherits : Bar2 });

			expect(Bar1.__className__).to.equal('Bar');
			expect(Bar2.__className__).to.equal('Bar');
			expect(Bar3.__className__).to.equal('Bar');
		});

		it('should use primitive values for primitive types', function() {
			const a = new Foo();
			expect(typeof a.k1).to.equal('boolean');
			expect(typeof a.k2).to.equal('boolean');
			expect(a.k1).to.equal(true);
			expect(a.k2).to.equal(false);
		});

		it('should attach methods to instances', function() {
			const a = new Foo();
			expect(a.m1()).to.equal(2);
			expect(a.p1).to.equal(1);
			a.p1 = 3;
			expect(a.p1).to.equal(3);
			expect(a.b).to.equal(3);
			expect(a.m1()).to.equal(6);
			a.p1 = 1;
			expect(a.p1).to.equal(1);
		});

		it('should allow silently setting of fields even in strict mode', function() {
			const MyClass = JS.class('MyClass', {
				fields : {
					getterField : {
						get : function() {
							return 5;
						},
					},
				},

				methods : {
					getterMethod : {
						get : function() {
							return 6;
						},
					},
				},
			});

			const myClass = new MyClass();

			myClass.getterField  = 10;
			myClass.getterMethod = 6;
			expect(myClass.getterField).to.equal(5);
			expect(myClass.getterMethod).to.equal(6);
		});

		it('should call afterCreateInstance after an instance of the class is constructed', function() {
			const AfterCreateClass = JS.class('AfterCreateClass', {
				fields : {
					a : 0,
				},

				constructor : function() {
					this.a = 1;
				},

				methods : {
					afterCreateInstance : function() {
						this.a = 2;
					},
				},
			});

			const AfterCreateClass2 = JS.class('AfterCreateClass2', {
				inherits : AfterCreateClass,

				constructor : function() {
					this.a = 3;
				},
			});

			const instance = new AfterCreateClass2();
			expect(instance.a).to.equal(2);
		});
	});

	describe('JS.class.isUnderConstruction()', function() {
		const UnderConstructionTest      = JS.class('UnderConstructionTest');
		const UnderConstructionTestChild = JS.class('UnderConstructionTestChild');
		const UnderConstructionTest2     = JS.class('UnderConstructionTest2');

		JS.class(UnderConstructionTest, {
			fields : {
				isUnderConstruction : false,
				child               : UnderConstructionTestChild,
			},
			constructor : function() {
				this.isUnderConstruction = JS.class.isUnderConstruction(this);
			},
		});

		JS.class(UnderConstructionTestChild, {
			fields : {
				isUnderConstruction : {
					type : Boolean,
					init : function() {
						return JS.class.isUnderConstruction(this);
					},
				},
			},
		});

		JS.class(UnderConstructionTest2, {
			constructor : function() {
				throw 'asdf';
			},
		});

		it('should return true only when the given instance is currently being constructed', function() {
			const a = new UnderConstructionTest();
			expect(a.isUnderConstruction).to.be.true;
			expect(a.child.isUnderConstruction).to.be.true;
			expect(JS.class.isUnderConstruction(a)).to.be.false;
			expect(JS.class.isUnderConstruction(a.child)).to.be.false;
		});

		it('should recover if the instance never succeeds in construction', function() {
			expect(JS.class.isUnderConstruction.stackSize).to.equal(0);
			expect(function() {
				const a = new UnderConstructionTest2();
				a;
			}).to.throw;
			expect(JS.class.isUnderConstruction.stackSize).to.equal(0);
		});
	});

	describe('JS.class.new()', function() {
		it('should create classes just like "new"', function() {
			const foo = JS.class.new(Foo);
			expect(foo).to.be.instanceof(Foo);
			expect(foo.a).to.equal('');
			expect(foo.b).to.equal(1);
			expect(foo.c).to.equal('');
			expect(foo.d).to.equal(true);
		});

		it('should skip field initialization if initializeFields is not true', function() {
			const foo = JS.class.new(Foo, [], { initializeFields : false });
			expect(foo).to.be.instanceof(Foo);
			expect(foo.a).to.be.undefined;
			expect(foo.b).to.be.undefined;
			expect(foo.c).to.be.undefined;
		});
	});


	const ParentClass = JS.class('ParentClass', {
		fields : {
			constructorHistory : '',
		},

		constructor : function() {
			this.constructorHistory += 'ParentClass;';
		},
	});

	const SubClass = JS.class('SubClass', {
		inherits : ParentClass,

		constructor : function() {
			this.constructorHistory += 'SubClass;';
		},
	});

	const Bar = JS.class('Bar', {

	});

	const Foo = JS.class('Foo', {
		inherits : SubClass,

		fields : {
			a : '',
			b : 1,
			c : {
				init : '',
				get  : function()      {
					return this.a;
				},
				set : function(value) {
					this.a = value;
				},
				initDepedencies : 'a',
			},
			d : {
				type : true,
			},
			e : undefined,
			f : null,
			g : Bar,
			h : {
				type : Bar,
			},
			i : {
				type : Bar,
				init : null,
			},
			j : {
				type : null,
				init : function() {
					return {};
				},
			},
			k1 : {
				type : Boolean,
				init : true,
			},
			k2 : {
				type : Boolean,
			},
		},

		constructor : function() {
			this.constructorHistory += 'Foo;';
		},

		methods : {
			m1 : function() {
				return this.b * 2;
			},
			p1 : {
				get : function() {
					return this.b;
				},
				set : function(value) {
					this.b = value;
				},
			},
		},
	});

}); // end basic.js
