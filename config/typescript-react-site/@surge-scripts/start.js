/// <reference path="node_modules/@sfusurge/surge-scripts" />

const { execCraco } = require("./build");

/**
 * @this {ScriptEnvironment}
 * @param {string[]} argv
 */
module.exports = async function SurgeReactAppStart(argv) {
	await execCraco(this, "start", argv);
};
