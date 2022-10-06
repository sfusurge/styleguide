const { merge } = require("@sfusurge/surge-scripts");

module.exports = (previous, extra) => {
	const { workdir, babelConfig } = extra;

	return merge(previous, {
		transform: {
			"\\.[jt]sx?$": [
				"babel-jest",
				{
					// Ensure TypeScript can be tested.
					...babelConfig,
				},
			],
		},

		rootDir: workdir,
		roots: [workdir],
	});
};
