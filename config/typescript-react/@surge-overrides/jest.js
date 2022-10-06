const { merge } = require("@sfusurge/surge-scripts");

const path = require("path");
const fs = require("fs");

module.exports = async (previous, extra) => {
	const { workdir } = extra;

	// If "src/setupTests.ts" exists in the project, use that.
	let setupFiles = [];

	if (fs.existsSync(path.join(workdir, "src", "setupTests.ts"))) {
		setupFiles.push(path.join(workdir, "src", "setupTests.ts"));
	}

	if (setupFiles.length === 0) {
		setupFiles.push(path.join(__dirname, "..", "jestSetup.js"));
	}

	// Merge the settings from the parent config.
	return merge(previous, {
		testEnvironment: "jsdom",
		setupFilesAfterEnv: setupFiles,

		moduleNameMapper: {
			"^.+\\.(css|less|scss)$": "babel-jest", // Use CSS modules.
		},
	});
};
