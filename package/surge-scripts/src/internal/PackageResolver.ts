import { readdir, stat } from "fs/promises";
import { join } from "path";

import { pathExists, readJson } from "../FilesystemUtils";
import Package, { PackageName, PackageVersion, ScopeName } from "../Package";

export async function findAvailablePackages(
	modulesDir: string,
	checkPredicate: (name: PackageName | `${ScopeName}/*`, parent: Package | null) => boolean,
	keepPredicate: (pkg: Package, parent: Package | null) => boolean
) {
	const found = new Map<`${PackageName}@${PackageVersion}`, Package>();

	async function packagesIn(dir: string, parent: Package | null): Promise<PackageName[]> {
		if (!(await pathExists(dir))) return [];

		const subdirs = await readdir(dir);
		return (
			await Promise.all(
				subdirs.map(async (child) => {
					const childDir = join(dir, child);
					const stats = await stat(childDir);
					if (!stats.isDirectory()) return [];

					// Look into the scope if it's a scope.
					if (child.startsWith("@")) {
						if (!checkPredicate(`${child}/*`, parent)) {
							return [];
						}

						return (await readdir(childDir)).map((d) => `${child}/${d}`);
					}

					// Return the child.
					return [child];
				})
			)
		).flat();
	}

	async function packageData(dir: string): Promise<Package> {
		return new Package(dir, await readJson(join(dir, "package.json")));
	}

	async function scan(dir: string, parent: Package | null): Promise<Package[]> {
		const packageNames = (await packagesIn(dir, parent)).filter((name) => checkPredicate(name, parent));
		const packages = await Promise.all(packageNames.map((name) => packageData(join(dir, name))));
		return packages.filter((pkg) => keepPredicate(pkg, parent));
	}

	async function scanRecursive(dir: string, parent: Package | null): Promise<Package[]> {
		const packages = await scan(dir, parent);
		const newPackages = packages.filter((pkg) => !found.has(`${pkg.name}@${pkg.version}`));
		for (const pkg of newPackages) {
			found.set(`${pkg.name}@${pkg.version}`, pkg);
		}

		return (await Promise.all(newPackages.map((pkg) => scanRecursive(pkg.node_modules, pkg)))).flat();
	}

	await scanRecursive(modulesDir, null);
	return Array.from(found.values());
}
