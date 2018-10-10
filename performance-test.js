'use strict';

const JS = require('../JS');

const BaseClass   = JS.class('BaseClass');
const Subclass    = JS.class('Subclass');
const Subsubclass = JS.class('Subsubclass');

JS.class(BaseClass, {
	fields : {
		a : '',
		b : 1,
		d : {
			get : function() {
				return `${this.a} BaseClass`;
			},
			set : function(value) {
				this.a = `${value} BaseClass`;
			},
		},
		child : {
			type : Subsubclass,
			init : null,
		},
	},
	constructor : function() {
		this.a = 'BaseClass constructor';
	},
	methods : {
		method : function(prefix) {
			this.a = `${prefix} BaseClass`;
		},
		method2 : function(prefix) {
			this.a = `${prefix} BaseClass`;
		},
		method3 : function(prefix) {
			this.a = `${prefix} BaseClass.method3`;
		},
		method4 : {
			get : function() {
				return `${this.a} BaseClass`;
			},
			set : function(value) {
				this.a = `${value} BaseClass`;
			},
		},
		throwMethod : function() {
			throw new Error();
		},
		methodRecurse : function() {
			let childResult = this.child ? this.child.methodRecurse() : null;
			if (childResult) {
				childResult = ` ${childResult}`;
			}
			return childResult;
		},
		methodRecurse2 : function(recurseCount) {
			const recursiveResult = recurseCount > 0 ? `${this.methodRecurse2(recurseCount - 1)} ` : '';
			return `Base ${recursiveResult}${this.a}`;
		},

		asyncMethod : async function(prefix) {
			await wait(10);
			this.a = `${prefix} BaseClass`;
		},

		asyncRecurse2 : async function(recurseCount) {
			await wait(5);
			const recursiveResult = recurseCount > 0 ? `${await this.asyncRecurse2(recurseCount - 1)} ` : '';
			await wait(5);
			return `Base ${recursiveResult}${this.a}`;
		},
	},
});

JS.class(Subclass, {
	inherits : BaseClass,
	fields   : {
		c : Object,
	},
	methods : {
		method : function(prefix) {
			this.a = `${prefix} Subclass`;
			this.method.super.call(this, prefix);
		},
		throwMethod : function() {
			this.throwMethod.super.call(this);
		},
		methodRecurse : function() {
			return `Sub-${this.a}${this.methodRecurse.super.call(this) || ''}`;
		},
		methodRecurse2 : function(recurseCount) {	// eslint-disable-line no-unused-vars
			const superResult = this.methodRecurse2.super.apply(this, arguments);
			return `Sub-${superResult}`;
		},
		// note that method2 is deliberately ommitted

		asyncMethod : async function(prefix) {
			await wait(10);
			this.a = `${prefix} Subclass`;
			await this.asyncMethod.super.call(this, prefix);
		},

		asyncRecurse2 : async function(recurseCount) {	// eslint-disable-line no-unused-vars
			await wait(5);
			const superResult = await this.asyncRecurse2.super.apply(this, arguments);
			await wait(5);
			return `Sub-${superResult}`;
		},
	},
});

JS.class(Subsubclass, {
	inherits : Subclass,
	fields   : {
		d : {
			get : function() {
				return `${this.constructor.properties.fields.d.get.super.call(this)} Subsubclass`;
			},
			set : function(value) {
				this.constructor.properties.fields.d.set.super.call(this, `${value} Subsubclass`);
			},
		},
		e : '',
	},
	methods : {
		method : {
			$super : function($super) {
				return function(prefix) {
					this.a = `${prefix} Subsubclass`;
					$super.call(this, prefix);
				};
			},
		},
		method2 : function(prefix) {
			this.a = `${prefix} Subsubclass`;
			this.method2.super.call(this, prefix);
		},
		method3 : function(subsubclass, prefix) {
			this.method3.super.call(subsubclass, prefix);
		},
		method4 : {
			get : function() {
				return `${this.constructor.properties.methods.method4.get.super.call(this)} Subsubclass`;
			},
			set : function(value) {
				this.constructor.properties.methods.method4.set.super.call(this, `${value} Subsubclass`);
			},
		},
		methodRecurse : function() {
			return `Subsub-${this.methodRecurse.super.call(this)}`;
		},
		methodRecurse2 : function(recurseCount) {	// eslint-disable-line no-unused-vars
			const superResult = this.methodRecurse2.super.apply(this, arguments);
			return `Subsub-${superResult}`;
		},

		asyncMethod : async function(prefix) {
			await wait(10);
			this.a = `${prefix} SubSubclass`;
			await this.asyncMethod.super.call(this, prefix);
		},

		asyncRecurse2 : async function(recurseCount) {	// eslint-disable-line no-unused-vars
			await wait(5);
			const superResult = await this.asyncRecurse2.super.apply(this, arguments);
			await wait(5);
			return `Subsub-${superResult}`;
		},

	},
});

function wait(ms) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), ms);
	});
}


module.exports.run = function run() {
	const start = new Date();
	console.profile();

	for (let a = 0; a < 500000; a++) {
		const subsubclass = new Subsubclass();      // eslint-disable-line no-unused-vars
	}

	console.profileEnd();
	console.log(new Date() - start);
};

if (require.main === module) {
	run();
}
