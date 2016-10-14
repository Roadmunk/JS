module.exports = {
	extends : "eslint:recommended",

	parserOptions : {
		ecmaVersion : 6
	},

	env : {
		es6 : true
	},

	globals : {
		setImmediate : true,
		require      : true
	},

	rules : {
		// Possible Errors
		"no-cond-assign"          : 2,
		"no-constant-condition"   : 2,
		"no-debugger"             : 1,	// should be 2 in production builds
		"no-dupe-args"            : 2,
		"no-dupe-keys"            : 2,
		"no-duplicate-case"       : 2,
		"no-empty-character-class": 2,
		"no-extra-boolean-cast"   : 2,
		"no-extra-parens"         : [2, "functions"],
		"no-func-assign"          : 2,
		"no-inner-declarations"   : 2,
		"no-invalid-regexp"       : 2,
		"no-irregular-whitespace" : 2,
		"no-negated-in-lhs"       : 2,
		"no-obj-calls"            : 2,
		"valid-jsdoc"             : 0,
		"valid-typeof"            : 2,

		// Best Practices
		"no-eval"             : 2,
		"no-else-return"      : 1,
		"no-floating-decimal" : 2,
		"no-loop-func"        : 2,
		"no-implied-eval"     : 1,
		"yoda"                : 1,
		"prefer-const"        : 1,

		// Variables
		"no-unused-vars"       : 2,

		// Stylistic
		"arrow-parens"             : [1, "as-needed" ],
		"block-spacing"            : 1,
		"brace-style"              : [1, "stroustrup", { "allowSingleLine": true }],
		"camelcase"                : [1, {"properties": "always"}],
		"comma-spacing"            : [1, {"before": false, "after": true}],
		"comma-style"              : [1, "last"],
		"curly"                    : [1, "multi-or-nest"],
		"dot-notation"             : 1,
		"linebreak-style"          : [1, "unix"],
		"no-array-constructor"     : 1,
		"no-nested-ternary"        : 1,
		"no-mixed-spaces-and-tabs" : [1, "smart-tabs"],
		"no-trailing-spaces"       : 1,
		"keyword-spacing"          : 1,
		"space-before-blocks"      : 1,
		"space-infix-ops"          : 1
	}
};
