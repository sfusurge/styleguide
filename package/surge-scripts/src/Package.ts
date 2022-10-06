import { join } from "path";
import { inspect } from "util";

import { readJson, readJsonSync } from "./FilesystemUtils";

export type PackageVersion = string;
export type PackageName = UnscopedPackageName | `${ScopeName}/${UnscopedPackageName}`;
export type UnscopedPackageName = string;
export type ScopeName = `@${string}`;
export type DependencyMap = { [key: PackageName]: PackageVersion };

/**
 * A partial description of the NodeJS/NPM "package.json" manifest.
 */
export interface PackageJson {
	name: PackageName;
	version: PackageVersion;
	dependencies?: DependencyMap;
	devDependencies?: DependencyMap;
	peerDependencies?: DependencyMap;
	peerDependenciesMeta?: {
		[key: PackageName]: {
			optional?: boolean;
		};
	};
}

/**
 * A description of a NodeJS package.
 * This includes the package location and its metadata.
 */
export class Package {
	public readonly directory: string;
	public readonly metadata: Readonly<PackageJson>;
	public readonly node_modules: string;

	constructor(directory: string, metadata: PackageJson) {
		this.directory = directory;
		this.metadata = metadata;
		this.node_modules = join(directory, "node_modules");
	}

	/**
	 * The name of the package.
	 */
	get name(): PackageName {
		return this.metadata.name;
	}

	/**
	 * The package version.
	 */
	get version(): PackageVersion {
		return this.metadata.version;
	}

	/**
	 * The non-optional dependencies of the package.
	 * This does not include developer dependencies.
	 */
	get neededDependencies(): DependencyMap {
		const deps = {
			...(this.metadata.dependencies ?? {}),
			...(this.metadata.peerDependencies ?? {}),
		};

		for (const [name, meta] of Object.entries(this.metadata.peerDependenciesMeta ?? {})) {
			if (meta.optional) {
				delete deps[name];
			}
		}

		return deps;
	}

	public static async new(directory: string): Promise<Package> {
		const packageJson = (await readJson(join(directory, "package.json"))) as PackageJson;
		return new Package(directory, packageJson);
	}

	public static newSync(directory: string): Package {
		const packageJson = readJsonSync(join(directory, "package.json")) as PackageJson;
		return new Package(directory, packageJson);
	}

	private toString(): string {
		return `${this.metadata.name}@${this.metadata.version}`;
	}

	private [inspect.custom](): any {
		return {
			name: this.metadata.name,
			version: this.metadata.version,
			directory: this.directory,
		};
	}
}

export default Package;
