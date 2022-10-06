import * as semver from "semver";

import Package, { PackageName, PackageVersion } from "../Package";

interface InternalDependencyTreeNode extends DependencyTreeNode {
	dependencies: InternalDependencyTreeNode[];
	analyzing: boolean;
	analyzed: boolean;
}

/**
 * A node in the {@link DependencyTree}.
 * This contains pointers to its direct dependencies.
 */
export interface DependencyTreeNode {
	key: DependencyTreeNodeKey;
	package: Package;
	dependencies: DependencyTreeNode[];
}

export type DependencyTreeOptions = {
	[option in keyof typeof DefaultDependencyTreeOptions]?: typeof DefaultDependencyTreeOptions[option];
};

export type DependencyTreeNodeKey = `${PackageName}@${PackageVersion}`;
const DefaultDependencyTreeOptions = {
	/**
	 * Ignore missing dependencies instead of throwing an error.
	 */
	ignoreUnknown: false,

	/**
	 * Ignore impossible-to-satisfy dependencies instead of throwing an error.
	 */
	ignoreUnsatisfied: false,
};

/**
 * A dependency tree for {@link Package} objects.
 * This is nowhere near as complex as NPM's, and it only exists to find a heirarchy of dependencies.
 */
export class DependencyTree {
	private packagesByKey: Map<DependencyTreeNodeKey, InternalDependencyTreeNode>;
	private packagesByName: Map<PackageName, InternalDependencyTreeNode[]>;
	private packages: InternalDependencyTreeNode[];
	private options: DependencyTreeOptions;

	public constructor(allPackages: Package[], options?: DependencyTreeOptions) {
		this.options = Object.assign(DefaultDependencyTreeOptions, options);
		this.packages = allPackages.map((pkg) => ({
			key: `${pkg.name}@${pkg.version}`,
			package: pkg,
			dependencies: [],
			analyzing: false,
			analyzed: false,
		}));

		this.packagesByKey = new Map(this.packages.map((node) => [node.key, node]));
		this.packagesByName = new Map();
		for (const node of this.packages) {
			let pkgVersions = this.packagesByName.get(node.package.name);
			if (pkgVersions == null) {
				pkgVersions = [];
				this.packagesByName.set(node.package.name, pkgVersions);
			}

			pkgVersions.push(node);
		}
	}

	/**
	 * Resolves a dependency tree of a package.
	 *
	 * @param pkg The package to resolve.
	 * @returns The root node of the tree.
	 */
	public resolve(pkg: Package): DependencyTreeNode {
		const pkgKey: DependencyTreeNodeKey = `${pkg.name}@${pkg.version}`;
		const root = this.packagesByKey.get(pkgKey);
		if (root == null) {
			throw new DependencyTreeError(`missing dependency: '${pkgKey}' in (root)`);
		}

		this.analyze(root, []);
		return root;
	}

	/**
	 * Resolves distinct chains of dependencies for all the given packages.
	 *
	 * @param pkgs The packages to resolve.
	 * @returns The largest distinct chains.
	 */
	public resolveChains(pkgs: Package[]): DependencyTreeNode[][] {
		const nodes = new Map<DependencyTreeNodeKey, DependencyTreeNode>(
			pkgs.map((pkg) => this.resolve(pkg)).map((node) => [node.key, node])
		);

		// Build an inverse tree.
		const leaves = new Set<DependencyTreeNodeKey>();
		const dependentsOf = new Map<DependencyTreeNodeKey, Set<DependencyTreeNodeKey>>();
		for (const [key, node] of nodes.entries()) {
			if (node.dependencies.length === 0) {
				leaves.add(key);
				continue;
			}

			for (const dep of node.dependencies) {
				let dependentsOfDep = dependentsOf.get(dep.key);
				if (dependentsOfDep == null) {
					dependentsOfDep = new Set();
					dependentsOf.set(dep.key, dependentsOfDep);
				}

				dependentsOfDep.add(node.key);
			}
		}

		// Walk backwards from the leaves.
		// FIXME: This could probably be faster avoiding calculating some shared dependencies:
		//
		//               Redundant, since it's done by A -> [C -> D] -> E
		//               vvvvvv
		//    A ->  B -> C -> D  -> E
		//      \->      C -> D -/
		//
		const chains: DependencyTreeNode[][] = [];
		function walk(leaf: DependencyTreeNode, path: DependencyTreeNode[]): void {
			const dependentsOfLeaf = dependentsOf.get(leaf.key);
			if (dependentsOfLeaf == null) {
				chains.push([leaf, ...path]);
				return;
			}

			for (const dependentKey of dependentsOfLeaf) {
				const dependent = nodes.get(dependentKey)!;
				walk(dependent, [leaf, ...path]);
			}
		}

		leaves.forEach((leaf) => walk(nodes.get(leaf)!, []));

		// Extract only the longest chains.
		// FIXME: Does this cause problems?
		type ChainSEKey = `${DependencyTreeNodeKey}:${DependencyTreeNodeKey}`;
		const largestChains = new Map<ChainSEKey, DependencyTreeNode[]>();
		for (const chain of chains) {
			const chainKey = `${chain[0].key}:${chain[chain.length - 1].key}` as ChainSEKey;
			const bestChain = largestChains.get(chainKey);
			if (bestChain == null || bestChain.length < chain.length) {
				largestChains.set(chainKey, chain);
			}
		}

		return Array.from(largestChains.values());
	}

	private analyze(self: InternalDependencyTreeNode, path: string[]) {
		if (self.analyzed) {
			return;
		}

		if (self.analyzing) {
			throw new DependencyTreeError(`cyclic dependency: ${path.join(" -> ")}`);
		}

		self.analyzing = true;

		// For each dependency, get the best-matching version.
		// Recursively analyze if need be.
		for (const [depName, depVersion] of Object.entries(self.package.neededDependencies)) {
			const required = depVersion.includes(":") ? "*" : depVersion; // We can't resolve unmanaged dependencies.
			const candidates = this.packagesByName.get(depName);
			if (candidates == null) {
				if (this.options.ignoreUnknown) {
					continue;
				}

				throw new DependencyTreeError(`missing dependency: '${depName}@${depVersion}' in '${self.key}'`);
			}

			// Find the highest version that satisfies this dependency.
			let best = semver.maxSatisfying(candidates.map((c) => c.package.version)!, required);
			if (best == null) {
				if (!this.options.ignoreUnsatisfied) {
					throw new DependencyTreeError(
						`no candidate matches: '${depName}@${depVersion}' in [${candidates
							.map((c) => `"${c.package.version}"`)
							.join(", ")}]`
					);
				}

				best = semver.sort(candidates.map((c) => c.package.version))[0];
			}

			const bestNode = this.packagesByKey.get(`${depName}@${best}`)!;
			self.dependencies.push(bestNode);

			if (!bestNode.analyzed) {
				this.analyze(bestNode, [...path, self.key]);
			}
		}

		self.analyzing = false;
	}
}

export class DependencyTreeError extends Error {
	public constructor(message: string) {
		super(message);
	}
}

/**
 * Attempt to cram a bunch of dependencies into a linear array, prioritizing dependencies to avoid duplication.
 *
 * @param chains The chains to linearize.
 * @returns A best-effort sorted array of dependencies.
 */
export function linearize(chains: DependencyTreeNode[][]): DependencyTreeNode[] {
	const linearChain: DependencyTreeNode[] = [];
	const extracted = new Set<DependencyTreeNodeKey>();
	let chainsByLength = chains.map((c) => c.reverse()).sort((a, b) => b.length - a.length);

	for (
		;
		chainsByLength.length > 0;
		chainsByLength = chainsByLength.filter((c) => c.length > 0).sort((a, b) => b.length - a.length)
	) {
		const top = chainsByLength[0].pop()!;
		for (const chain of chainsByLength) {
			if (chain[chain.length - 1] === top) {
				chain.pop();
			}
		}

		extracted.add(top.key);
		linearChain.push(top);
	}

	return linearChain.reverse();
}
