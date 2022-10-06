/// <reference path="node_modules/@sfusurge/surge-scripts" />

/**
 * @this {ScriptEnvironment}
 * @param {string[]} argv
 */
module.exports = async function SurgeTest(argv) {
	const babelConfig = await this.readConfig("babel", {}, { workdir: this.workdir });
	const jestConfig = await this.readConfig("jest", {}, { babelConfig, workdir: this.workdir });

	const jestBin = await this.where("jest");
	const jestArgs = [`--config=${JSON.stringify(jestConfig)}`, ...argv];
	if (process.env.DEBUG != null) {
		console.log("Jest arguments:");
		console.log([jestBin, ...jestArgs]);
	}

	this.exec(jestBin, jestArgs);
};
