import { type ProtocolParameters, type Script, type TransactionInput, type TransactionOutput, type TransactionUnspentOutput } from "@blaze-cardano/core";
import type { Redeemers, TransactionWitnessSet, Costmdls, AuxiliaryData, Hash32ByteBase16, Address } from "@blaze-cardano/core";
import type { IScriptData } from "./types";
export declare function getScriptSize(script: Script): number;
/**
 * Calculates the fee for reference scripts in the transaction.
 * This method iterates through the reference inputs, finds the corresponding UTXOs,
 * and calculates the fee based on the size of the Plutus scripts referenced.
 *
 * The fee calculation follows a tiered approach where the base fee increases
 * for each range of script size, as defined in the protocol parameters.
 * See https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0
 *
 * @param {readonly TransactionInput[]} refScripts - An array of reference inputs in the transaction.
 * @returns {number} The calculated fee for all reference scripts.
 * @throws {Error} If a reference input cannot be resolved or if a reference script is not a Plutus script.
 */
export declare function calculateReferenceScriptFee(refScripts: Script[], params: ProtocolParameters): number;
/**
 * This methods calculates the minimum ada required for a transaction output.
 * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
 * @param {number} coinsPerUtxoByte - The coinsPerUtxoByte value from the protocol parameters.
 * @returns {bigint} The minimum ada required for the output.
 */
export declare function calculateMinAda(output: TransactionOutput, coinsPerUtxoByte: number): bigint;
/**
 * Calculate the required "collateral" the a transaction must put up if it is running smart contracts.
 * This is to prevent DDOS attacks with failing scripts, and must be some percentage above the total fee of the script.
 *
 * @param {bigint} fee The full transaction fee
 * @param {number} collateralPercentage The protocol parameter defining the buffer above the fee that is required
 * @returns {bigint}
 */
export declare function calculateRequiredCollateral(fee: bigint, collateralPercentage: number): bigint;
/**
 * Wraps JSON.stringify with a serializer for bigints.
 * @param {any} value The value you want to stringify.
 * @returns
 */
export declare const stringifyBigint: typeof JSON.stringify;
/**
 * Sorts a list of UTxOs by highest total value first.
 * @param {TransactionUnspentOutput[]} inputs A list of UTxOs to sort.
 * @returns {TransactionUnspentOutput[]}
 */
export declare function sortLargestFirst(inputs: TransactionUnspentOutput[]): TransactionUnspentOutput[];
/**
 * Utility function to compare the equality of two UTxOs.
 * @param {TransactionUnspentOutput} self
 * @param {TransactionUnspentOutput} that
 * @returns {boolean}
 */
export declare const isEqualUTxO: (self: TransactionUnspentOutput, that: TransactionUnspentOutput) => boolean;
/**
 * Utility function to compare the equality of two inputs.
 * @param {TransactionInput} self
 * @param {TransactionInput} that
 * @returns {boolean}
 */
export declare const isEqualInput: (self: TransactionInput, that: TransactionInput) => boolean;
/**
 * Utility function to compare the equality of two outputs.
 * @param {TransactionOutput} self
 * @param {TransactionOutput} that
 * @returns {boolean}
 */
export declare const isEqualOutput: (self: TransactionOutput, that: TransactionOutput) => boolean;
/**
 * Calculates the correct script data hash for a transaction
 *
 * Separate from the `getScriptData` method in `TxBuilder` to allow for more thorough testing
 * This is heavily documented here:
 * https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/cddl-files/conway.cddl#L423-L490
 *
 * @param redeemers - The redeemers of the transaction
 * @param datums - The datums in the witness set of the transaction
 * @param usedCostModels - The cost models for any languages used in the transaction
 */
export declare function computeScriptData(redeemers: Redeemers, datums: ReturnType<TransactionWitnessSet["plutusData"]>, // TODO: weird import shenanigans
usedCostModels: Costmdls): IScriptData | undefined;
/**
 * Given an array and a string, it mutates the provided array and inserts
 * the string after the closest match. It returns the index at which the
 * string was inserted.
 *
 * @param {string[]} arr An array of strings to mutate.
 * @param {string} el The element to insert in provided array.
 * @returns {number} The index of the insert.
 */
export declare const insertSorted: (arr: string[], el: string) => number;
/**
 * Computes the hash of the auxiliary data if it exists.
 *
 * @param {AuxiliaryData} data - The auxiliary data to hash.
 * @returns {Hash32ByteBase16} The hash of the auxiliary data or undefined if no auxiliary data is provided.
 */
export declare const getAuxiliaryDataHash: (data: AuxiliaryData) => Hash32ByteBase16;
/**
 * Asserts that the given address is a valid payment address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is a script hash.
 */
export declare const assertPaymentsAddress: (address: Address) => never | void;
/**
 * Asserts that the given address is a valid lock address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is not a script hash.
 */
export declare const assertLockAddress: (address: Address) => never | void;
/**
 * Returns the maximum of two BigInt values.
 * @param {bigint} a - The first bigint value.
 * @param {bigint} b - The second bigint value.
 * @returns {bigint} The maximum value.
 */
export declare const bigintMax: (a: bigint, b: bigint) => bigint;
/**
 * Utility function to test the validity of a TransactionOutput.
 *
 * @param {TransactionOutput} output The TransactionOutput to test.
 * @param {number} coinsPerUtxoByte From the environment's protocol params.
 * @param {number} maxValueSize From the environment's protocl params.
 * @throws If the output does not satisfy the minAda required, or the output is larger than the maxValueSize, it will throw an error.
 */
export declare const assertValidOutput: (output: TransactionOutput, coinsPerUtxoByte: number, maxValueSize: number) => void | never;
//# sourceMappingURL=utils.d.ts.map