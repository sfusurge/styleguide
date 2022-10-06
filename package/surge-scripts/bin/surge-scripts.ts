#!/usr/bin/env node
import { readdir } from "fs/promises";
import { basename, extname, join, delimiter as pathDelimiter } from "path";
import { cwd } from "process";

import { ConfigFile, ConfigFiles } from "../src/Configs";
import { readdirFiles, walkUp } from "../src/FilesystemUtils";
import Package from "../src/Package";
import { ScriptEnvironment, ScriptFiles } from "../src/Scripts";
import { DependencyTree, linearize } from "../src/internal/DependencyAnalyzer";
import { findAvailablePackages } from "../src/internal/PackageResolver";

// Get the script name, file, and arguments.
const PROFILE_TIME_LOADED = Date.now();
const _scriptExt = extname(process.argv[1]);
const scriptName = process.argv[2];
const scriptArgs = process.argv.slice(3);

if (scriptName != null && !/^[a-z-]+$/.test(scriptName)) {
	console.error(`unknown surge-scripts script: ${scriptName}`);
	process.exit(2);
}

(async () => {
	// Look for the first package.json starting upwards from the current working directory.
	// This is the project that we're working on.
	const workdir = await walkUp(cwd(), "package.json");
	if (workdir === null) {
		throw new Error("unable to find package root.");
	}

	const project = await Package.new(workdir);

	// Find all the packages provided by sfusurge.
	// These are the only packages that are allowed to contain config or scripts.
	const PROFILE_TIME_STARTED = Date.now();
	const packages = [project].concat(
		await findAvailablePackages(
			join(workdir, "node_modules"),
			(name, _p) => name.startsWith("@sfusurge/"),
			(pkg, _p) => pkg.name.startsWith("@sfusurge/")
		)
	);

	// Move devDependencies of the current package into actual dependencies.
	// This is needed so the current project's scripts and configs take precedence.
	// Note: Don't do this for surge-scripts. It intentionally has a cyclic dependency.
	if (project.name !== "@sfusurge/surge-scripts") {
		(project.metadata as any).dependencies = {
			...(project.metadata.devDependencies ?? {}),
			...(project.metadata.dependencies ?? {})
		}
	}

	// Find the largest dependency chains.
	const PROFILE_TIME_SCANNED = Date.now();
	const tree = new DependencyTree(packages, {
		ignoreUnknown: true,
		ignoreUnsatisfied: true,
	});

	const chains = linearize(tree.resolveChains(packages));
	const PROFILE_TIME_RESOLVED = Date.now();

	// Try to get a single dependency chain to use for the NODE_PATH.
	// Reverse it to find the script path.
	const NODE_PATH_DEPS: Package[] = chains.map((d) => d.package);
	const SCRIPT_PATH_DEPS: Package[] = chains.reverse().map((d) => d.package);

	// Find the script files and config files.
	const { scripts, configs } = await getScriptsAndConfigs(SCRIPT_PATH_DEPS);

	// Run the script.
	if (scriptName != null && scripts[scriptName] == null) {
		console.error(`unknown surge-scripts script: ${scriptName}`);
	}

	if (scriptName != null) {
		const PROFILE_TIME_READY = Date.now();
		const scriptFile = scripts[scriptName];
		const script = await import(scriptFile.file);

		try {
			const result = await script.default.call(
				new ScriptEnvironment({
					project,
					configs,
					workdir,
					resolution: SCRIPT_PATH_DEPS,
					script: scriptFile,
					env: {
						NODE_PATH: NODE_PATH_DEPS.map((dep) => dep.node_modules).join(pathDelimiter),
					},
					__debug: {
						PROFILE_TIME_LOADED,
						PROFILE_TIME_SCANNED,
						PROFILE_TIME_READY,
						PROFILE_TIME_RESOLVED,
						PROFILE_TIME_STARTED,
					},
				}),
				scriptArgs
			);

			if (typeof result === "number") {
				process.exit(result);
			}
		} catch (ex) {
			console.error(ex);
			process.exit(2);
		}

		return;
	}

	// Print help.
	console.log("Surge Scripts:");
	for (const script of Object.keys(scripts)) {
		console.log(`    surge-scripts ${script}`);
	}

	process.exit(1);
})().catch((ex) => {
	console.error(`\x1B[31mUnexpected error:\x1B[0m`);
	console.error(ex);
	process.exit(2);
});

/**
 * Searches for Surge scripts and config files within resolved packages.
 * The prededence is first-come.
 *
 * @param packages The packages to search.
 * @returns The scripts and configs.
 */
async function getScriptsAndConfigs(packages: Package[]): Promise<{ scripts: ScriptFiles; configs: ConfigFiles }> {
	type ScanResult = { [key: string]: ConfigFile };
	const configsAndScripts = await Promise.all(
		packages.map(async (p) => {
			const dirs = await readdir(p.directory);
			let scripts: ScanResult = {};
			let configs: ScanResult = {};

			if (dirs.includes("@surge-scripts")) {
				for (const script of await readdirFiles(join(p.directory, "@surge-scripts"))) {
					const fullpath = join(p.directory, "@surge-scripts", script);
					const fileext = extname(script);
					if (fileext.toLowerCase() !== ".js") continue;

					const filename = basename(script, fileext).toLowerCase();
					scripts[filename] = {
						file: fullpath,
						source: p,
					};
				}
			}

			if (dirs.includes("@surge-overrides")) {
				for (const config of await readdirFiles(join(p.directory, "@surge-overrides"))) {
					const fullpath = join(p.directory, "@surge-overrides", config);
					const fileext = extname(config);
					if (fileext.toLowerCase() !== ".js") continue;

					const filename = basename(config, fileext).toLowerCase();
					configs[filename] = {
						file: fullpath,
						source: p,
					};
				}
			}

			return { configs, scripts };
		})
	);

	const scripts: ScriptFiles = {};
	for (const [name, script] of configsAndScripts.map((cs) => Object.entries(cs.scripts)).flat()) {
		if (name in scripts) {
			continue;
		}

		scripts[name] = script;
	}

	const configs: ConfigFiles = {};
	for (const [name, config] of configsAndScripts.map((cs) => Object.entries(cs.configs)).flat()) {
		if (configs[name] == null) {
			configs[name] = [];
		}

		configs[name].push(config);
	}

	return {
		scripts,
		configs,
	};
}
