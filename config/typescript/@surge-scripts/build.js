/// <reference path="node_modules/@sfusurge/surge-scripts" />

/**
 * @this {ScriptEnvironment}
 * @param {string[]} argv
 */
module.exports = async function SurgeBuild(argv) {
	const tscBin = await this.where("tsc");
	const tscArgs = [...argv];

	// Provide default arguments.
	if (!argv.length === 0) {
		tscArgs.unshift("--project", ".");
	}
	
	// Run tsc.
	if (process.env.DEBUG != null) {
		console.log("TypeScript Compiler arguments:");
		console.log([tscBin, ...tscArgs]);
	}

	this.exec(tscBin, tscArgs);
};
