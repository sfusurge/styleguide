module.exports = {
	extends: [
		"eslint-config-react-app"
	],

	rules: {
		"prettier/prettier": "warn",
		"no-unused-vars": ["warn", {
			"varsIgnorePattern": "^_.*",
			"argsIgnorePattern": "^_.*",
		}],
		"@typescript-eslint/no-unused-vars": ["warn", {
			"varsIgnorePattern": "^_.*",
			"argsIgnorePattern": "^_.*",
		}],
	},

	overrides: [
		{
			files: ["**/*.{ts,tsx}"],
			rules: {
				"no-unused-vars": ["off"]
			}
		},
	],
	
	plugins: [
		"prettier"
	]
};
