import { F_OK } from "constants";
import { Stats, readFileSync } from "fs";
import { access, mkdir, readFile, readdir, stat } from "fs/promises";
import { dirname, join } from "path";

async function getPredicateInDirectory(
	dir: string,
	predicate: (path: string, stat: Stats) => boolean
): Promise<ReaddirEntries> {
	const children = await readdir(dir);
	const entries: [string, Stats][] = await Promise.all(
		children.map(async (c) => {
			const path = join(dir, c);
			return [c, await stat(path)] as [string, Stats];
		})
	);

	const filtered = entries.filter(([name, stat]) => predicate(name, stat));
	const result: ReaddirEntries = filtered.map(([name, _stat]) => name) as ReaddirEntries;
	result.stats = filtered.map(([_name, stat]) => stat);

	return result;
}

export type ReaddirEntries = Array<string> & {
	stats: Stats[];
};

/**
 * Lists all files within a directory.
 *
 * @param dir The directory.
 * @returns The files within the directory.
 */
export async function readdirFiles(dir: string): Promise<ReaddirEntries> {
	return getPredicateInDirectory(dir, (_name, stat) => stat.isFile());
}

/**
 * Lists all directories within a directory.
 *
 * @param dir The directory.
 * @returns The directories within the directory.
 */
export async function readdirDirs(dir: string): Promise<ReaddirEntries> {
	return getPredicateInDirectory(dir, (name, stat) => {
		return stat.isDirectory() && name !== "." && name !== "..";
	});
}

/**
 * Walk upwards from a directory, stopping when a specific file is found.
 *
 * @param dir The starting directory.
 * @param file The file that was found.
 * @returns The directory containing the file, or null if not found.
 */
export async function walkUp(dir: string, file: string): Promise<string | null> {
	// Get all the directories upwards.
	let dirs = [];
	for (let current = dir, last = null; current !== last; last = current, current = dirname(last)) {
		dirs.push(current);
	}

	// Look at all possible candidates at once and return the highest one that's found.
	for (const promise of dirs.map(async (dir) => [await pathExists(join(dir, file)), dir])) {
		const [exists, dir] = await promise;
		if (exists) {
			return dir as string;
		}
	}

	return null;
}

/**
 * Checks if a path exists.
 *
 * @param path The path to check.
 * @returns True if the path exists.
 */
export async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path, F_OK);
		return true;
	} catch (_ex) {
		return false;
	}
}

/**
 * Checks if any of the provided paths exist.
 *
 * @param path The paths to check.
 * @returns True if any of the paths exists.
 */
export async function anyPathsExist(paths: string[]): Promise<boolean> {
	const promises = paths.map((path) => pathExists(path));
	return (await Promise.all(promises)).includes(true);
}

/**
 * Read a file as JSON.
 *
 * @param path The path to the file.
 * @returns The JSON contents.
 */
export async function readJson(path: string): Promise<any> {
	return JSON.parse(await readFile(path, "utf-8"));
}

/**
 * Read a file as JSON.
 *
 * @param path The path to the file.
 * @returns The JSON contents.
 */
export function readJsonSync(path: string): any {
	return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Ensure a directory exists.
 *
 * @param path The path to a directory.
 */
export async function ensureDir(path: string): Promise<void> {
	try {
		const stats = await stat(path);
		if (!stats.isDirectory()) {
			throw new Error(`cannot make directory over file: ${path}`);
		}
	} catch (_ex) {
		await mkdir(path, { recursive: true });
	}
}
