const {CracoAliasPlugin} = require('react-app-alias');

module.exports = {
	webpack: {
		configure: (config, {env, paths}) => {
			config.module = config.module ?? {};
			config.module.rules = config.module.rules ?? [];

			config.module.rules.push(
				{
					test: /\.jsonc$/,
					use: [{loader: `jsonc-loader`}],
				},
			);

			return config;
		}
	},

	plugins: [{
		plugin: CracoAliasPlugin,
		options: {}
	}, {
		plugin: require('./plugin-sass-resources-loader'),
		options: {}
	}]
}
