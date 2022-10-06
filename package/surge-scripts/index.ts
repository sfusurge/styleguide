import * as Filesystem from "fs/promises";
// External modules as utilities.
import { default as merge } from "mergician";

import * as FilesystemUtils from "./src/FilesystemUtils";

export { Package } from "./src/Package";
export type { PackageName, PackageVersion, PackageJson } from "./src/Package";

export * from "./src/Configs";
export * from "./src/Scripts";

// Utilities
export const fse = {
	...Filesystem,
	...FilesystemUtils,
};

export { merge };
