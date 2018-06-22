module.exports = {
	extends : "./node_modules/@roadmunk/eslint-config-roadmunk/index.js",

	env : {
		mocha : true
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
