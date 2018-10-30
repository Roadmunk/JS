const fs = require('fs');

try {
	fs.mkdirSync('dist');
}
catch (err) {
	if (err.code !== 'EEXIST') {
		throw err;
	}
}

fs.writeFileSync('dist/JS.js', `
if (typeof define !== 'function')  {
	var define = require('amdefine')(module); // eslint-disable-line no-var
}

define(function(require, exports, module) {
	const JS = exports;
	(function jsUtilWrapper() { ${fs.readFileSync('./JS.util.js')}; })();
	(function jsWrapper() { ${fs.readFileSync('./JS.js')}; })();
});`);
