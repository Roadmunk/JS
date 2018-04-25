'use strict'; // $super needs to work for classes that are declared in strict mode

const JS     = require('../JS');
const expect = require('chai').expect;

describe('super.js', function() {

	const BaseClass   = JS.class('BaseClass');
	const Subclass    = JS.class('Subclass');
	const Subsubclass = JS.class('Subsubclass');

	JS.class(BaseClass, {
		fields : {
			a : '',
			b : 1,
			d : {
				get : function() {
					return this.a + ' BaseClass';
				},
				set : function(value) {
					this.a = value + ' BaseClass';
				}
			},
			child : {
				type : Subsubclass,
				init : null
			}
		},
		constructor : function() {
			this.a = 'BaseClass constructor';
		},
		methods : {
			method : function(prefix) {
				this.a = prefix + ' BaseClass';
			},
			method2 : function(prefix) {
				this.a = prefix + ' BaseClass';
			},
			method3 : function(prefix) {
				this.a = prefix + ' BaseClass.method3';
			},
			method4 : {
				get : function() {
					return this.a + ' BaseClass';
				},
				set : function(value) {
					this.a = value + ' BaseClass';
				}
			},
			throwMethod : function() {
				throw new Error();
			},
			methodRecurse : function() {
				let childResult = this.child ? this.child.methodRecurse() : null;
				if (childResult)
					childResult = ' ' + childResult;
				return childResult;
			},
			methodRecurse2 : function(recurseCount) {
				const recursiveResult = recurseCount > 0 ? this.methodRecurse2(recurseCount - 1) + ' ' : '';
				return `Base ${recursiveResult}${this.a}`;
			},

			asyncMethod : async function(prefix) {
				await wait(10);
				this.a = prefix + ' BaseClass';
			},

			asyncRecurse2 : async function(recurseCount) {
				await wait(5);
				const recursiveResult = recurseCount > 0 ? await this.asyncRecurse2(recurseCount - 1) + ' ' : '';
				await wait(5);
				return `Base ${recursiveResult}${this.a}`;
			},
		}
	});

	JS.class(Subclass, {
		inherits : BaseClass,
		fields : {
			c : Object
		},
		methods : {
			method : function(prefix) {
				this.a = prefix + ' Subclass';
				this.method.super.call(this, prefix);
			},
			throwMethod : function() {
				this.throwMethod.super.call(this);
			},
			methodRecurse : function() {
				return 'Sub-' + this.a + (this.methodRecurse.super.call(this) || '');
			},
			methodRecurse2 : function(recurseCount) {	// eslint-disable-line no-unused-vars
				const superResult = this.methodRecurse2.super.apply(this, arguments);
				return `Sub-${superResult}`;
			},
			// note that method2 is deliberately ommitted
			
			asyncMethod : async function(prefix) {
				await wait(10);
				this.a = prefix + ' Subclass';
				await this.asyncMethod.super.call(this, prefix);
			},

			asyncRecurse2 : async function(recurseCount) {	// eslint-disable-line no-unused-vars
				await wait(5);
				const superResult = await this.asyncRecurse2.super.apply(this, arguments);
				await wait(5);
				return `Sub-${superResult}`;
			},
		}
	});

	JS.class(Subsubclass, {
		inherits : Subclass,
		fields : {
			d : {
				get : function() {
					return this.constructor.properties.fields.d.get.super.call(this) + ' Subsubclass';
				},
				set : function(value) {
					this.constructor.properties.fields.d.set.super.call(this, value + ' Subsubclass');
				}
			},
			e : ''
		},
		methods : {
			method : {
				$super : function($super) {
					return function(prefix) {
						this.a = prefix + ' Subsubclass';
						$super.call(this, prefix);
					};
				}
			},
			method2 : function(prefix) {
				this.a = prefix + ' Subsubclass';
				this.method2.super.call(this, prefix);
			},
			method3 : function(subsubclass, prefix) {
				this.method3.super.call(subsubclass, prefix);
			},
			method4 : {
				get : function() {
					return this.constructor.properties.methods.method4.get.super.call(this) + ' Subsubclass';
				},
				set : function(value) {
					this.constructor.properties.methods.method4.set.super.call(this, value + ' Subsubclass');
				}
			},
			methodRecurse : function() {
				return 'Subsub-' + this.methodRecurse.super.call(this);
			},
			methodRecurse2 : function(recurseCount) {	// eslint-disable-line no-unused-vars
				const superResult = this.methodRecurse2.super.apply(this, arguments);
				return `Subsub-${superResult}`;
			},

			asyncMethod : async function(prefix) {
				await wait(10);
				this.a = prefix + ' SubSubclass';
				await this.asyncMethod.super.call(this, prefix);
			},

			asyncRecurse2 : async function(recurseCount) {	// eslint-disable-line no-unused-vars
				await wait(5);
				const superResult = await this.asyncRecurse2.super.apply(this, arguments);
				await wait(5);
				return `Subsub-${superResult}`;
			},

		}
	});

	function wait(ms) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), ms);
		});
	};

	it('should allow calls to methods in ancestor classes', function() {
		const subsubclass = new Subsubclass();

		subsubclass.method('testing');
		expect(subsubclass.a).to.equal('testing BaseClass');
		subsubclass.method2('testing2');
		expect(subsubclass.a).to.equal('testing2 BaseClass');
	});

	it('should allow super calls on non-this instances', function() {
		const s1 = new Subsubclass();
		const s2 = new Subsubclass();
		s1.method3(s2, "testing");
		expect(s1.a).to.equal('BaseClass constructor');
		expect(s2.a).to.equal('testing BaseClass.method3');
	});

	it('should allow super calls to get/set fields in ancestor classes', function() {
		const s1 = new Subsubclass();

		s1.a = 'test';
		expect(s1.d).to.equal('test BaseClass Subsubclass');
		s1.d = 'test';
		expect(s1.a).to.equal('test Subsubclass BaseClass');
	});

	it('should allow super calls to get/set methods in ancestor classes', function() {
		const s1 = new Subsubclass();

		s1.a = 'test';
		expect(s1.method4).to.equal('test BaseClass Subsubclass');
		s1.method4 = 'test';
		expect(s1.a).to.equal('test Subsubclass BaseClass');
	});

	it('should propogate exceptions through super', function() {
		const s1 = new Subsubclass();
		expect(s1.throwMethod).to.throw;
	});

	it('should support super calling the same method on another instance', function() {
		const parent = new Subsubclass();
		parent.a     = 'parent';

		const child  = new Subsubclass();
		child.a      = 'child';
		parent.child = child;

		expect(parent.methodRecurse()).to.equal('Subsub-Sub-parent Subsub-Sub-child');
	})

	it('should support cyclical recursive super method calls', function() {
		const s1 = new Subclass();
		s1.a     = 'Foo';
		expect(s1.methodRecurse2(0)).to.equal('Sub-Base Foo');
		expect(s1.methodRecurse2(1)).to.equal('Sub-Base Sub-Base Foo Foo');
		expect(s1.methodRecurse2(2)).to.equal('Sub-Base Sub-Base Sub-Base Foo Foo Foo');
		expect(s1.methodRecurse2(3)).to.equal('Sub-Base Sub-Base Sub-Base Sub-Base Foo Foo Foo Foo');


		const s2 = new Subsubclass();
		s2.a     = 'Bar';
		expect(s2.methodRecurse2(0)).to.equal('Subsub-Sub-Base Bar');
		expect(s2.methodRecurse2(1)).to.equal('Subsub-Sub-Base Subsub-Sub-Base Bar Bar');
		expect(s2.methodRecurse2(2)).to.equal('Subsub-Sub-Base Subsub-Sub-Base Subsub-Sub-Base Bar Bar Bar');
		expect(s2.methodRecurse2(3)).to.equal('Subsub-Sub-Base Subsub-Sub-Base Subsub-Sub-Base Subsub-Sub-Base Bar Bar Bar Bar');
	});

	it('should allow asynchronous super calls', async function () {
		this.timeout(5000);

		const subsubclass = new Subsubclass();

		await subsubclass.asyncMethod('testing');
		expect(subsubclass.a).to.equal('testing BaseClass');
	});

	it('should support cyclical recursive asynchronous super method calls', async function() {
		this.timeout(5000);

		const s1 = new Subclass();
		s1.a     = 'Foo';
		expect(await s1.asyncRecurse2(0)).to.equal('Sub-Base Foo');
		expect(await s1.asyncRecurse2(1)).to.equal('Sub-Base Sub-Base Foo Foo');
		expect(await s1.asyncRecurse2(2)).to.equal('Sub-Base Sub-Base Sub-Base Foo Foo Foo');
		expect(await s1.asyncRecurse2(3)).to.equal('Sub-Base Sub-Base Sub-Base Sub-Base Foo Foo Foo Foo');


		const s2 = new Subsubclass();
		s2.a     = 'Bar';
		expect(await s2.asyncRecurse2(0)).to.equal('Subsub-Sub-Base Bar');
		expect(await s2.asyncRecurse2(1)).to.equal('Subsub-Sub-Base Subsub-Sub-Base Bar Bar');
		expect(await s2.asyncRecurse2(2)).to.equal('Subsub-Sub-Base Subsub-Sub-Base Subsub-Sub-Base Bar Bar Bar');
		expect(await s2.asyncRecurse2(3)).to.equal('Subsub-Sub-Base Subsub-Sub-Base Subsub-Sub-Base Subsub-Sub-Base Bar Bar Bar Bar');
	});

	it.skip('performance test', function() {
		const subsubclass = new Subsubclass();

		const start = new Date();
		console.profile();

		for (let a = 0; a < 1000000; a++)
			subsubclass.method('testing');

		console.profileEnd();
		console.log(new Date() - start);
	});
});
