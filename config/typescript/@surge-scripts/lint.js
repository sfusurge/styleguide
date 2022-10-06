/// <reference path="node_modules/@sfusurge/surge-scripts" />

const { fse } = require("@sfusurge/surge-scripts");
const { join } = require("path");
const { hasPrettierConfigFile, defaultPrettierConfigFile } = require("./format");

const ESLINT_CONFIG_FILES = [
	".eslintrc",
	".eslintrc.js",
	".eslintrc.json",
	".eslintrc.yml",
	".eslintrc.yaml",
	".eslintrc.cjs",
];

/**
 * @this {ScriptEnvironment}
 * @param {string[]} argv
 */
module.exports = async function SurgeFormat(argv) {
	const eslintBin = await this.where("eslint");
	const eslintArgs = [...argv];

	// Provide default arguments.
	if (!argv.find((a) => !a.startsWith("-"))) {
		eslintArgs.unshift("--help");
	}

	// Provide the default eslint config.
	if (
		!("eslint" in this.project.metadata) &&
		!(await fse.anyPathsExist(ESLINT_CONFIG_FILES.map((file) => join(this.workdir, file))))
	) {
		const configFile = await createEslintConfig(this);
		eslintArgs.unshift("--config", configFile);
	}

	// Run prettier.
	if (process.env.DEBUG != null) {
		console.log("Eslint arguments:");
		console.log([eslintBin, ...eslintArgs]);
	}

	this.exec(eslintBin, eslintArgs);
};

async function createEslintConfig(env) {
	const cacheDir = join(env.project.node_modules, ".cache");
	const destConfigFile = join(cacheDir, "eslint.config.json");
	await fse.ensureDir(cacheDir);

	// Get the eslint config.
	const eslintConfig = await env.readConfig("eslint", {}, { workdir: env.workdir });

	// If there isn't a prettier config file, we need to add one explicitly.
	if (!(await hasPrettierConfigFile(env))) {
		const rules = eslintConfig.rules ?? (eslintConfig.rules = {});
		rules["prettier/prettier"] = [
			"warn",
			{
				...require(await defaultPrettierConfigFile(env)),
			},
		];
	}

	// Write the config file.
	await fse.writeFile(destConfigFile, JSON.stringify(eslintConfig));
	return destConfigFile;
}
