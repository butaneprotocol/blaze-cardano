import { Value, AssetId } from "@blaze-cardano/core";
/**
 * Merges two Value objects into a single Value object by combining their coins and multiassets.
 *
 * @param {Value} a - The first Value object.
 * @param {Value} b - The second Value object.
 * @returns {Value} - The resulting Value object after merging.
 */
export declare function merge(a: Value, b: Value): Value;
/**
 * Sums up a list of values into a single value instance.
 *
 * @param {...Value} values - An array of values.
 * @returns {Value} - The resulting Value object after summing up.
 */
export declare function sum(values: Value[]): Value;
/**
 * Negates the coin and multiasset values of a Value object.
 *
 * @param {Value} v - The Value object to negate.
 * @returns {Value} - The resulting Value object after negation.
 */
export declare function negate(v: Value): Value;
/**
 * Subtracts the values of one Value object from another.
 *
 * @param {Value} a - The Value object to subtract from.
 * @param {Value} b - The Value object to subtract.
 * @returns {Value} - The resulting Value object after subtraction.
 */
export declare function sub(a: Value, b: Value): Value;
/**
 * Determines the intersection of assets between two Value objects.
 *
 * @param {Value} a - The first Value object.
 * @param {Value} b - The second Value object.
 * @returns {number} - The count of intersecting assets.
 */
export declare function intersect(a: Value, b: Value): number;
/**
 * Filters out the positive coin and multiasset values from a Value object.
 *
 * @param {Value} v - The Value object to filter.
 * @returns {Value} - A new Value object containing only positive values.
 */
export declare function positives(v: Value): Value;
/**
 * Filters a Value object to retain only the negative coin and multiasset values.
 *
 * @param {Value} v - The Value object to filter.
 * @returns {Value} - A new Value object containing only negative values.
 */
export declare function negatives(v: Value): Value;
/**
 * Lists all assets (including 'lovelace' if present) in a Value object.
 *
 * @param {Value} v - The Value object to inspect.
 * @returns {(AssetId | 'lovelace')[]} - An array of asset identifiers.
 */
export declare function assets(v: Value): (AssetId | "lovelace")[];
/**
 * Counts the number of distinct asset types in a Value object.
 *
 * @param {Value} v - The Value object to count asset types in.
 * @returns {number} - The count of distinct asset types.
 */
export declare function assetTypes(v: Value): number;
/**
 * Determines if a Value object is empty (no coin and no multiassets).
 *
 * @param {Value} v - The Value object to check.
 * @returns {boolean} - True if the Value object is empty, false otherwise.
 */
export declare function empty(v: Value): boolean;
/**
 * A constant Value object with zero coins and no assets.
 *
 * @returns {Value} - The zero Value object.
 */
export declare const zero: () => Value;
/**
 * Creates a new Value object with the specified amount of lovelace and assets.
 *
 * @param {bigint} lovelace - The amount of lovelace.
 * @param {...[string, bigint][]} assets - The assets to include in the Value object.
 * @returns {Value} - The newly created Value object.
 */
export declare function makeValue(lovelace: bigint, ...assets: [string, bigint][]): Value;
//# sourceMappingURL=value.d.ts.map