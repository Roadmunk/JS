module.exports = {
	extends : "eslint-config-roadmunk",

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
