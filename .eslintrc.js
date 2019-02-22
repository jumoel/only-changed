module.exports = {
	parserOptions: {
		ecmaVersion: 2019,
		sourceType: 'module',
		ecmaFeatures: {
			impliedStrict: true,
		},
	},

	env: {
		node: true,
		es6: true,
	},

	extends: ['eslint:recommended'],
};
