module.exports = {
	extends : "./node_modules/@roadmunk/eslint-config-roadmunk/index.js",

	parserOptions : {
		ecmaVersion  : 2017,
	},

	env : {
		mocha : true,
		node  : true,
	},

	globals : {
		setImmediate : true,
		humanizeJoin : true,
		require      : true,
		console      : true,
		module       : true,
	},

	rules : {
		"no-console": 0
	}
};
