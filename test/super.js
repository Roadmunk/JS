'use strict'; // $super needs to work for classes that are declared in strict mode

var JS     = require('../JS');
var expect = require('chai').expect;

describe('super.js', function() {

	var BaseClass = JS.class('BaseClass', {
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
				var childResult = this.child ? this.child.methodRecurse() : null;
				if (childResult)
					childResult = ' ' + childResult;
				return childResult;
			}
		}
	});

	var Subclass = JS.class('Subclass', {
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
			}
			// note that method2 is deliberately ommitted
		}
	});

	var Subsubclass = JS.class('Subsubclass', {
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
			}
		}
	});

	it('should allow calls to methods in ancestor classes', function() {
		var subsubclass = new Subsubclass();

		subsubclass.method('testing');
		expect(subsubclass.a).to.equal('testing BaseClass');
		subsubclass.method2('testing2');
		expect(subsubclass.a).to.equal('testing2 BaseClass');
	});

	it('should allow super calls on non-this instances', function() {
		var s1 = new Subsubclass();
		var s2 = new Subsubclass();
		s1.method3(s2, "testing");
		expect(s1.a).to.equal('BaseClass constructor');
		expect(s2.a).to.equal('testing BaseClass.method3');
	});

	it('should allow super calls to get/set fields in ancestor classes', function() {
		var s1 = new Subsubclass();

		s1.a = 'test';
		expect(s1.d).to.equal('test BaseClass Subsubclass');
		s1.d = 'test';
		expect(s1.a).to.equal('test Subsubclass BaseClass');
	});

	it('should allow super calls to get/set methods in ancestor classes', function() {
		var s1 = new Subsubclass();

		s1.a = 'test';
		expect(s1.method4).to.equal('test BaseClass Subsubclass');
		s1.method4 = 'test';
		expect(s1.a).to.equal('test Subsubclass BaseClass');
	});

	it('should propogate exceptions through super', function() {
		var s1 = new Subsubclass();
		expect(s1.throwMethod).to.throw;
	});

	it('should support super calling the same method on another instance', function() {
		var parent = new Subsubclass();
		parent.a = 'parent';

		var child = new Subsubclass();
		child.a = 'child';
		parent.child = child;

		expect(parent.methodRecurse()).to.equal('Subsub-Sub-parent Subsub-Sub-child');
	})

	it.skip('performance test', function() {
		var subsubclass = new Subsubclass();

		var start = new Date();
		console.profile();

		for (var a=0; a<1000000; a++)
			subsubclass.method('testing');

		console.profileEnd();
		console.log(new Date() - start);
	});
});
