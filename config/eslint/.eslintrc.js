module.exports = {
	extends: [
		"eslint-config-react-app"
	],

	rules: {
		"prettier/prettier": "warn",
		"no-unused-vars": ["warn", {
			"varsIgnorePattern": "^_.*",
		}],
		"@typescript-eslint/no-unused-vars": ["warn", {
			"varsIgnorePattern": "^_.*",
		}],
	},
	
	plugins: [
		"prettier"
	]
};
