declare module "mergician" {
	declare interface Config {}

	/**
	 * Configure the merge method.
	 */
	declare type newMergician = (config: Config) => merge;

	/**
	 * Merge two or more objects.
	 *
	 * @param obj1 The first object.
	 * @param obj2 The second (and remaining) object(s) to merge.
	 */
	declare type merge<A extends {}, B extends Array<{}>> = (
		obj1: A,
		...obj2: [...B]
	) => {
		[K in keyof A | keyof B]: B[K] extends {} ? InstanceType<B[K]> : A[K] extends {} ? InstanceType<A[K]> : never;
	};

	export default newMergician | merge;
}
