const {CracoAliasPlugin} = require('react-app-alias');

module.exports = {
	plugins: [
		{
			plugin: CracoAliasPlugin,
			options: {}
		},
		{
			plugin: require('./plugin-sass-resources-loader'),
			options: {}
		}
	],

	rules: [
		{
			test: /.jsonc$/,
			use: [{loader: `jsonc-loader`}],
		},
	],
}
