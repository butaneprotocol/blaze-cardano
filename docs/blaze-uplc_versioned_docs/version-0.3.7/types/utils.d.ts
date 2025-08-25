import { type PlutusData, Script } from "@blaze-cardano/core";
import { HexBlob } from "@blaze-cardano/core";
import { type Exact, type TArray } from "@blaze-cardano/data";
export type ScriptType = "Native" | "PlutusV1" | "PlutusV2" | "PlutusV3";
/**
 * Applies parameters to a UPLC program encoded as a hex blob.
 *
 * This function takes a hex-encoded UPLC program and applies one or more
 * Plutus data parameters to it. It does this by decoding the program,
 * modifying its AST to apply the parameters, and then re-encoding it.
 *
 * @param hex - The hex-encoded UPLC program.
 * @param params - The Plutus data parameters to apply to the program.
 * @returns A new hex-encoded UPLC program with the parameters applied.
 */
export declare function applyParams(hex: HexBlob, ...params: PlutusData[]): HexBlob;
/**
 * Applies the given Plutus data parameters to a hex-encoded Plutus script.
 *
 * This function decodes the provided Plutus script, applies the given parameters
 * to it, and then re-encodes the script. The parameters are cast to the specified
 * type and converted to a list of PlutusData before being applied.
 *
 * @typeParam T - The type of the parameters list.
 * @param {HexBlob} plutusScript - The hex-encoded Plutus script to which the parameters will be applied.
 * @param {Exact<T>} params - The parameters to apply to the Plutus script.
 * @param {T} type - The type of the parameters list.
 * @returns {HexBlob} - A new hex-encoded Plutus script with the parameters applied.
 */
export declare function applyParamsToScript<T extends TArray>(plutusScript: string, type: T, params: Exact<T>): HexBlob;
/**
 * Converts the compiled code of a UPLC program into a Script based on the specified script type, handling possible double-CBOR encoding.
 *
 * @param {HexBlob} cbor - The script, possibly double-CBOR-encoded.
 * @param {ScriptType} type - The type of the script (Native, PlutusV1, or PlutusV2).
 * @returns {Script} - The Script created from the hex blob.
 * @throws {Error} - Throws an error if the script type is unsupported.
 */
export declare function cborToScript(cbor: string, type: ScriptType): Script;
//# sourceMappingURL=utils.d.ts.map