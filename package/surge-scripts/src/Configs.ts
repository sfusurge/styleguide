import Package from "./Package";

/**
 * A configuration override file.
 */
export type ConfigFile = {
	file: string;
	source: Package;
};

/**
 * An ordered set of configuration override files.
 */
export interface ConfigFiles {
	[key: string]: ConfigFile[];
}
