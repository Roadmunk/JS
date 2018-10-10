'use strict';

const expect = require('chai').expect;
const JS     = require('../JS');

describe('static.js', function() {

	const Foo = JS.class('Foo');

	JS.class(Foo, {
		static : {
			fields : {
				_bar : {
					type : String,
				},

				bar : {
					init : '',
					get  : function() {
						return Foo._bar;
					},
					set : function(value) {
						Foo._bar = value;
					},
					initDependencies : '_bar',
				},
			},

			methods : {
				barAsMethod : function() {
					return this._bar;
				},
				barAsMethodGetter : {
					get : function() {
						return this._bar;
					},
				},
				getClassNameFoo : function() {
					return this.__className__;
				},
			},
		},
	});

	const Bar = JS.class('Bar', {
		inherits : Foo,

		static : {
			methods : {
				barAsMethod2 : function() {
					return this.barAsMethod();
				},
				getClassNameBar : function() {
					return this.__className__;
				},
			},
		},
	});

	it('should allow static fields, methods, and getters/setters', function() {
		expect(Foo._bar).to.equal('');
		Foo._bar = 'asdf';
		expect(Foo.bar).to.equal('asdf');
		Foo.bar = 'wer';
		expect(Foo.bar).to.equal('wer');
		expect(Foo.barAsMethod()).to.equal('wer');
		expect(Foo.barAsMethodGetter).to.equal('wer');
	});

	it('should allow inheritence of static methods by subclasses', function() {
		Foo._bar = 'asdf';
		expect(Foo.bar).to.equal('asdf');
		expect(Bar.barAsMethod).not.to.be.undefined;
		expect(Bar.barAsMethod2()).to.equal('asdf');

		expect(Foo.getClassNameFoo()).to.equal('Foo');

		expect(Bar.getClassNameBar()).to.equal('Bar');
		expect(Bar.getClassNameFoo()).to.equal('Bar');
	});
});
