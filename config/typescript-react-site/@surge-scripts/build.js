/// <reference path="node_modules/@sfusurge/surge-scripts" />

const { fse } = require("@sfusurge/surge-scripts");
const { join } = require("path");

const CRACO_CONFIG_FILES = ["craco.config.ts", "craco.conf.js", ".cracorc.ts", ".cracorc.js", ".cracorc"];

/**
 * @this {ScriptEnvironment}
 * @param {string[]} argv
 */
module.exports = async function SurgeReactAppBuild(argv) {
	await execCraco(this, "build", argv);
};

async function execCraco(env, script, argv) {
	const cracoBin = await env.where("craco");
	const cracoArgs = argv;

	// Inject the config file if there isn't already one.
	if (!(await hasCracoConfigFile(env))) {
		cracoArgs.unshift("--config", await defaultCracoConfigFile(env));
	}

	if (process.env.DEBUG != null) {
		console.log("Craco arguments:");
		console.log([cracoBin, script, ...cracoArgs]);
	}

	env.exec(cracoBin, [script, ...cracoArgs]);
}

async function hasCracoConfigFile(env) {
	return (
		"cracoConfig" in env.project.metadata ||
		(await fse.anyPathsExist(CRACO_CONFIG_FILES.map((file) => join(env.workdir, file))))
	);
}

async function defaultCracoConfigFile(env) {
	return join(env.resolution.find((m) => m.name === "@sfusurge/craco-config").directory, "craco.config.js");
}

module.exports.execCraco = execCraco;
module.exports.hasCracoConfigFile = hasCracoConfigFile;
module.exports.defaultCracoConfigFile = defaultCracoConfigFile;
