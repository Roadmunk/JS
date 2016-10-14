module.exports = {
	extends : "./node_modules/eslint-config-roadmunk/index.js",

	env : {
		mocha : true
	},

	globals : {
		setImmediate : true,
		humanizeJoin : true,
		require      : true,
		console      : true
	},

	rules : {
		"no-console": 0
	}
};
