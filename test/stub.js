'use strict';

const JS     = require('../JS');
const expect = require('chai').expect;

describe('stub.js', function() {

	const Foo = JS.class('Foo');
	const Bar = JS.class('Bar');
	const Stub = JS.class('Stub');

	JS.class(Foo, {
		fields : {
			bar : {
				type : Bar
			}
		}
	});

	JS.class(Bar, {
		fields : {
			foo : {
				type : Foo,
				init : null
			}
		}
	});

	it('should allow creation of instances whose classes have references to each other', function() {
		const foo = new Foo();
		const bar = new Bar();
		bar.foo = foo;
		expect(foo.bar instanceof Bar).to.be.ok;
		expect(bar.foo instanceof Foo).to.be.ok;
	});

	it('should disallow creation of instances of stub classes', function() {
		expect(function() { new Stub() }).to.throw();
	});
});
