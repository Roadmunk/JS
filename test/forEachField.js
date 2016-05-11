'use strict';

var JS     = require('../JS');
var expect = require('chai').expect;

describe('forEachField.js', function() {

	var BaseClass = JS.class('BaseClass', {
		fields : {
			a : '',
			b : {
				type : 0,
				extra : ''
			}
		},
	});

	var Subclass = JS.class('Subclass', {
		inherits : BaseClass,
		fields : {
			c : Object
		},
	});

	var Subsubclass = JS.class('Subsubclass', {
		inherits : Subclass,
		fields : {
			d : {
				type : BaseClass
			}
		}
	});

	it('forEachField() should visit fields in current class and all ancestors', function() {
		var subsubclass = new Subsubclass();

		var fields = {};

		subsubclass.forEachField(function(fieldName, properties) {
			fields[fieldName] = properties;
		});

		expect(Object.keys(fields)).to.have.lengthOf(4);

		expect(fields.a).not.to.be.undefined;
		expect(fields.a.type).to.equal(String);
		expect(fields.a.init).to.equal('');

		expect(fields.b).not.to.be.undefined;
		expect(fields.b.type).to.equal(Number);
		expect(fields.b.init).to.equal(0);
		expect(fields.b.extra).to.equal('');

		expect(fields.c).not.to.be.undefined;
		expect(fields.c.type).to.equal(Object);
		expect(fields.c.init).to.be.undefined;

		expect(fields.d).not.to.be.undefined;
		expect(fields.d.type).to.equal(BaseClass);
		expect(fields.d.init).to.be.undefined;
	});
});
