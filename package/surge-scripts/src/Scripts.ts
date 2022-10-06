import { ConfigFile, ConfigFiles } from "./Configs";
import Package from "./Package";
import { SpawnOptions, execExecutable, spawnExecutable, spawnExecutableSync, where, whereSync } from "./SpawnUtils";

/**
 * A script file.
 */
export type ScriptFile = {
	file: string;
	source: Package;
};

/**
 * An ordered set of script files.
 */
export interface ScriptFiles {
	[key: string]: ScriptFile;
}

/**
 * The environment of an executed surge-script.
 * This is used as the {@code this} context.
 */
export class ScriptEnvironment {
	public readonly resolution: Readonly<Package[]>;
	public readonly configs: ConfigFiles;
	public readonly script: ScriptFile;
	public readonly workdir: string;
	public readonly project: Package;
	public env: {
		[key: string]: string;
		NODE_PATH: string;
	};

	private readonly __debug: unknown;

	public constructor(
		options: Pick<ScriptEnvironment, "resolution" | "configs" | "script" | "workdir" | "env" | "project"> & {
			__debug: unknown;
		}
	) {
		this.resolution = options.resolution;
		this.configs = options.configs;
		this.script = options.script;
		this.project = options.project;
		this.workdir = options.workdir;
		this.env = options.env;
		this.__debug = options.__debug;
	}

	/**
	 * Reads config files.
	 *
	 * @param name The config name.
	 * @param initialValue The initial config value.
	 * @param extras The extra argument to pass to the config scripts.
	 * @returns The final config.
	 */
	public async readConfig<T, R extends T>(name: string, initialValue: T, extras?: any): Promise<R> {
		const configFiles = this.configs[name] ?? [];
		const configModules: [ConfigFile, any][] = await Promise.all(
			configFiles.map(async (file) => [file, await import(file.file)])
		);

		return configModules.reduceRight((data: any, [file, module]: [ConfigFile, any]) => {
			try {
				return module.default(data, extras);
			} catch (ex) {
				throw new Error(`error processing config from ${file.file}`, { cause: ex });
			}
		}, initialValue);
	}

	// Wrappers around utility methods.

	private wrappedSpawn(fn: any, executable: string, args: string[], options?: SpawnOptions): any {
		const opts = options ?? {};
		return fn(executable, args, {
			...opts,
			env: {
				...process.env,
				...this.env,
				...(opts.env ?? {}),
			},
		});
	}

	protected spawn(executable: string, args: string[], options?: SpawnOptions): ReturnType<typeof spawnExecutable> {
		return this.wrappedSpawn(spawnExecutable, executable, args, options);
	}

	protected spawnSync(
		executable: string,
		args: string[],
		options?: SpawnOptions
	): ReturnType<typeof spawnExecutableSync> {
		return this.wrappedSpawn(spawnExecutableSync, executable, args, options);
	}

	protected exec(executable: string, args: string[], options?: SpawnOptions): ReturnType<typeof execExecutable> {
		return this.wrappedSpawn(execExecutable, executable, args, options) as never;
	}

	protected where(name: string): ReturnType<typeof where> {
		return where(this.env.NODE_PATH, name);
	}

	protected whereSync(name: string): ReturnType<typeof where> {
		return where(this.env.NODE_PATH, name);
	}
}

export namespace ScriptEnvironment {
	type wrappedSpawn<T extends (...args: any[]) => any> = T & ((this: ScriptEnvironment) => ReturnType<T>);

	/**
	 * Run the executable and return a promise that resolves when the executable ends.
	 * You can access the {@link child_process.ChildProcess ChildProcess} as the {@code process} field on the returned Promise.
	 *
	 * @param executable The executable to run.
	 * @param args The arguments to pass to the executable.
	 * @param options The options to use.
	 */
	export type spawn = wrappedSpawn<typeof spawnExecutable>;

	/**
	 * Run the executable and return the status code.
	 *
	 * @param executable The executable to run.
	 * @param args The arguments to pass to the executable.
	 * @param options The options to use.
	 */
	export type spawnSync = wrappedSpawn<typeof spawnExecutableSync>;

	/**
	 * Run the executable and exit immediately after.
	 *
	 * @param executable The executable to run.
	 * @param args The arguments to pass to the executable.
	 * @param options The options to use.
	 */
	export type exec = wrappedSpawn<typeof execExecutable>;

	/**
	 * Search for an executable, respecting the node_modules bin folders.
	 *
	 * @param name The name of the executable.
	 * @returns The full path to the executable.
	 */
	export type where = typeof where;

	/**
	 * Search for an executable, respecting the node_modules bin folders.
	 *
	 * @param name The name of the executable.
	 * @returns The full path to the executable.
	 */
	export type whereSync = typeof whereSync;
}
