import * as child_process from "child_process";
import { accessSync, constants } from "fs";
import { isAbsolute, join, delimiter as pathDelimiter } from "path";

export type { SpawnOptions } from "child_process";

/**
 * Search for an executable, respecting the node_modules bin folders.
 *
 * @param name The name of the executable.
 * @returns The full path to the executable.
 */
export function whereSync(node_path: string, name: string): string {
	if (isAbsolute(name)) {
		return name;
	}

	const PATH = process.env.PATH?.split(pathDelimiter) ?? [];
	const PATHEXT = process.env.PATHEXT?.split(pathDelimiter) ?? [""];
	const NODE_PATH = node_path.split(pathDelimiter).map((p) => join(p, ".bin"));

	for (const dir of [...NODE_PATH, ...PATH]) {
		for (const ext of PATHEXT) {
			try {
				const candidate = join(dir, `${name}${ext}`);
				accessSync(candidate, constants.R_OK | constants.X_OK);
				return candidate;
			} catch (_ex) {}
		}
	}

	return name;
}

/**
 * Search for an executable, respecting the node_modules bin folders.
 *
 * @param name The name of the executable.
 * @returns The full path to the executable.
 */
export async function where(node_path: string, name: string): Promise<string> {
	return whereSync(node_path, name); // TODO: async version
}

/**
 * Run the executable and exit immediately after.
 *
 * @param executable The executable to run.
 * @param args The arguments to pass to the executable.
 * @param options The options to use.
 */
export function execExecutable(executable: string, args: string[], options: child_process.SpawnOptions): never {
	try {
		const status = spawnExecutableSync(executable, args, options);
		process.exit(status);
	} catch (ex) {
		console.error(ex);
		process.exit(2);
	}
}

export type SpawnedExecutable = Promise<number> & {
	process: child_process.ChildProcess;
};

/**
 * Run the executable and return a promise that resolves when the executable ends.
 * You can access the {@link child_process.ChildProcess ChildProcess} as the {@code process} field on the returned Promise.
 *
 * @param executable The executable to run.
 * @param args The arguments to pass to the executable.
 * @param options The options to use.
 */
export function spawnExecutable(
	executable: string,
	args: string[],
	options?: child_process.SpawnOptions
): SpawnedExecutable {
	const promise: SpawnedExecutable = new Promise((resolve, reject) => {
		const proc = child_process.spawn(executable, args, {
			stdio: "inherit",
			...options,
		});

		proc.addListener("error", (err) => {
			reject(err);
		});

		proc.addListener("exit", (code) => {
			if (code == null) {
				return;
			}

			resolve(code);
		});

		promise.process = proc;
	}) as SpawnedExecutable;
	return promise;
}

/**
 * Run the executable and return the status code.
 *
 * @param executable The executable to run.
 * @param args The arguments to pass to the executable.
 * @param options The options to use.
 */
export function spawnExecutableSync(executable: string, args: string[], options?: child_process.SpawnOptions): number {
	const proc = child_process.spawnSync(executable, args, {
		stdio: "inherit",
		...options,
	});

	if (proc.status == null) {
		throw proc.error;
	}

	return proc.status;
}
