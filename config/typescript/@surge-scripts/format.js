/// <reference path="node_modules/@sfusurge/surge-scripts" />

const { fse } = require("@sfusurge/surge-scripts");
const { join } = require("path");

const PRETTIER_CONFIG_FILES = [".prettierrc", "prettier.config.js"];

/**
 * @this {ScriptEnvironment}
 * @param {string[]} argv
 */
module.exports = async function SurgeFormat(argv) {
	const prettierBin = await this.where("prettier");
	const prettierArgs = [...argv];

	// Provide default arguments.
	if (!argv.find((a) => a.startsWith("-"))) {
		prettierArgs.unshift("--write");
	}

	// Plugin search dir.
	const possiblePluginDirs = this.resolution.map(mod => mod.node_modules);
	const pluginDirs = (await Promise.all(possiblePluginDirs.map(async (dir) => [dir, await fse.pathExists(dir)])))
		.filter(([_dir, exists]) => exists)
		.map(([dir, _exists]) => dir);
	
	prettierArgs.unshift(...pluginDirs.map((dir) => ["--plugin-search-dir", dir]).flat());

	// // Cache.
	// if (this.env.CI == null) {
	// 	prettierArgs.unshift("--cache");
	// }

	// Provide the default prettier config.
	if (!(await hasPrettierConfigFile(this))) {
		prettierArgs.unshift("--config", await defaultPrettierConfigFile(this));
	}

	// Run prettier.
	if (process.env.DEBUG != null) {
		console.log("Prettier arguments:");
		console.log([prettierBin, ...prettierArgs]);
	}

	this.exec(prettierBin, prettierArgs);
};

async function hasPrettierConfigFile(env) {
	return (
		"prettier" in env.project.metadata ||
		(await fse.anyPathsExist(PRETTIER_CONFIG_FILES.map((file) => join(env.workdir, file))))
	);
}

async function defaultPrettierConfigFile(env) {
	return join(env.resolution.find((m) => m.name === "@sfusurge/prettier-config").directory, ".prettierrc.json");
}

module.exports.hasPrettierConfigFile = hasPrettierConfigFile;
module.exports.defaultPrettierConfigFile = defaultPrettierConfigFile;
