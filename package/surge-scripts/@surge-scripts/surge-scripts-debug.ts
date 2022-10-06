import { ScriptEnvironment } from "..";
import * as ThisPackage from "../package.json";

export default function SurgeScriptsDebug(this: ScriptEnvironment) {
	console.log(`\x1B[34msurge-scripts ${ThisPackage.version}\x1B[0m`);

	// Show how surge-scripts resolved the dependencies.
	console.log(`\x1B[35msurge-scripts resolution order:`);
	for (const pkg of this.resolution) {
		console.log(`  - \x1B[35m${pkg.name} \x1B[0m${pkg.version}\x1B[0m`);
		console.log(`    \x1B[32m${pkg.directory}\x1B[0m`);
	}

	// Show the config files being used.
	if (Object.keys(this.configs).length > 0) {
		console.log(`\n\x1B[35mconfig overrides:\x1B[0m`);
		for (const [config, files] of Object.entries(this.configs)) {
			console.log(`  - \x1B[35m${config}\x1B[0m`);
			for (const file of files) {
				console.log(`      \x1B[35m-\x1B[0m ${file.file}`);
			}
		}
	}

	// Show the timing info.
	const debug = (this as any & { __debug: any }).__debug;
	if (debug != null) {
		const fields = {
			ms_spent_waiting: debug.PROFILE_TIME_STARTED - debug.PROFILE_TIME_LOADED,
			ms_spent_reading_fs:
				debug.PROFILE_TIME_SCANNED -
				debug.PROFILE_TIME_STARTED +
				(debug.PROFILE_TIME_READY - debug.PROFILE_TIME_RESOLVED),
			ms_spent_calculating_tree: debug.PROFILE_TIME_RESOLVED - debug.PROFILE_TIME_SCANNED,
		};
		console.log("\n\x1B[35mdebug info:\x1B[0m");
		console.log(fields);
	}
}
