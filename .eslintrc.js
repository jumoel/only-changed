module.exports = {
	parserOptions: {
		ecmaVersion: 2019,
		sourceType: 'module',
		ecmaFeatures: {
			impliedStrict: true,
		},
	},
	plugins: ['jest'],

	env: {
		node: true,
		es6: true,
	},

	extends: ['eslint:recommended'],

	rules: {
		'no-console': 'off',
	},

	overrides: [
		{
			files: ['*.test.js', '*.spec.js'],
			env: {
				'jest/globals': true,
			},
			rules: {
				'jest/no-alias-methods': 'warn',
				'jest/no-disabled-tests': 'warn',
				'jest/no-focused-tests': 'error',
				'jest/no-identical-title': 'error',
				'jest/no-jest-import': 'error',
				'jest/no-jasmine-globals': 'warn',
				'jest/no-test-prefixes': 'error',
				'jest/valid-describe': 'error',
				'jest/valid-expect': 'error',
				'jest/valid-expect-in-promise': 'error',
				'jest/prefer-to-be-null': 'error',
				'jest/prefer-to-be-undefined': 'error',
				'jest/prefer-to-contain': 'error',
				'jest/prefer-to-have-length': 'error',
			},
		},
	],
};
