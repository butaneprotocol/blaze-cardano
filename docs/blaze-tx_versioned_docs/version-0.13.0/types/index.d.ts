import { Address } from '@blaze-cardano/core';
import { AssetId } from '@blaze-cardano/core';
import type { AssetName } from '@blaze-cardano/core';
import { AuxiliaryData } from '@blaze-cardano/core';
import type { Costmdls } from '@blaze-cardano/core';
import { Credential } from '@blaze-cardano/core';
import type { Datum } from '@blaze-cardano/core';
import type { Ed25519KeyHashHex } from '@blaze-cardano/core';
import { Ed25519PublicKeyHex } from '@blaze-cardano/core';
import { Ed25519SignatureHex } from '@blaze-cardano/core';
import type { Evaluator } from '@blaze-cardano/core';
import type { Hash32ByteBase16 } from '@blaze-cardano/core';
import type { HexBlob } from '@blaze-cardano/core';
import type { Metadata } from '@blaze-cardano/core';
import type { NetworkId } from '@blaze-cardano/core';
import { PlutusData } from '@blaze-cardano/core';
import type { PolicyId } from '@blaze-cardano/core';
import type { PoolId } from '@blaze-cardano/core';
import { ProtocolParameters } from '@blaze-cardano/core';
import type { Redeemers } from '@blaze-cardano/core';
import type { RewardAccount } from '@blaze-cardano/core';
import { Script } from '@blaze-cardano/core';
import type { Slot } from '@blaze-cardano/core';
import { Transaction } from '@blaze-cardano/core';
import { TransactionInput } from '@blaze-cardano/core';
import { TransactionOutput } from '@blaze-cardano/core';
import { TransactionUnspentOutput } from '@blaze-cardano/core';
import { TransactionWitnessSet } from '@blaze-cardano/core';
import { Value as Value_2 } from '@blaze-cardano/core';

/**
 * Asserts that the given address is a valid lock address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is not a script hash.
 */
export declare const assertLockAddress: (address: Address) => never | void;

/**
 * Asserts that the given address is a valid payment address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is a script hash.
 */
export declare const assertPaymentsAddress: (address: Address) => never | void;

/**
 * Utility function to test the validity of a TransactionOutput.
 *
 * @param {TransactionOutput} output The TransactionOutput to test.
 * @param {number} coinsPerUtxoByte From the environment's protocol params.
 * @param {number} maxValueSize From the environment's protocl params.
 * @throws If the output does not satisfy the minAda required, or the output is larger than the maxValueSize, it will throw an error.
 */
export declare const assertValidOutput: (output: TransactionOutput, coinsPerUtxoByte: number, maxValueSize: number) => void | never;

/**
 * Lists all assets (including 'lovelace' if present) in a Value object.
 *
 * @param {Value} v - The Value object to inspect.
 * @returns {(AssetId | 'lovelace')[]} - An array of asset identifiers.
 */
declare function assets(v: Value_2): (AssetId | "lovelace")[];

/**
 * Counts the number of distinct asset types in a Value object.
 *
 * @param {Value} v - The Value object to count asset types in.
 * @returns {number} - The count of distinct asset types.
 */
declare function assetTypes(v: Value_2): number;

/**
 * Returns the maximum of two BigInt values.
 * @param {bigint} a - The first bigint value.
 * @param {bigint} b - The second bigint value.
 * @returns {bigint} The maximum value.
 */
export declare const bigintMax: (a: bigint, b: bigint) => bigint;

/**
 * This methods calculates the minimum ada required for a transaction output.
 * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
 * @param {number} coinsPerUtxoByte - The coinsPerUtxoByte value from the protocol parameters.
 * @returns {bigint} The minimum ada required for the output.
 */
export declare function calculateMinAda(output: TransactionOutput, coinsPerUtxoByte: number): bigint;

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
 * Calculate the required "collateral" the a transaction must put up if it is running smart contracts.
 * This is to prevent DDOS attacks with failing scripts, and must be some percentage above the total fee of the script.
 *
 * @param {bigint} fee The full transaction fee
 * @param {number} collateralPercentage The protocol parameter defining the buffer above the fee that is required
 * @returns {bigint}
 */
export declare function calculateRequiredCollateral(fee: bigint, collateralPercentage: number): bigint;

/**
 * The coin selection function to choose which inputs to use for the transaction.
 */
declare type CoinSelectionFunc = (inputs: TransactionUnspentOutput[], collectedAssets: Value_2, preliminaryFee?: number, externalAssets?: Value_2, coinsPerUtxoByte?: number) => SelectionResult;

export declare namespace CoinSelector {
    export {
        hvfSelector,
        micahsSelector
    }
}

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
 * Determines if a Value object is empty (no coin and no multiassets).
 *
 * @param {Value} v - The Value object to check.
 * @returns {boolean} - True if the Value object is empty, false otherwise.
 */
declare function empty(v: Value_2): boolean;

/**
 * Computes the hash of the auxiliary data if it exists.
 *
 * @param {AuxiliaryData} data - The auxiliary data to hash.
 * @returns {Hash32ByteBase16} The hash of the auxiliary data or undefined if no auxiliary data is provided.
 */
export declare const getAuxiliaryDataHash: (data: AuxiliaryData) => Hash32ByteBase16;

export declare function getScriptSize(script: Script): number;

/**
 * This coin selection algorithm follows a Highest Value First (HVF) function, taking into consideration things like fee estimation.
 * Inspiration taken from Lucid Evolution: https://github.com/Anastasia-Labs/lucid-evolution/blob/main/packages/lucid/src/tx-builder/internal/CompleteTxBuilder.ts#L789
 * @param inputs
 * @param collectedAssets
 * @param preliminaryFee
 * @param externalAssets
 * @param coinsPerUtxoByte
 * @returns
 */
declare const hvfSelector: CoinSelectionFunc;

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
 * Determines the intersection of assets between two Value objects.
 *
 * @param {Value} a - The first Value object.
 * @param {Value} b - The second Value object.
 * @returns {number} - The count of intersecting assets.
 */
declare function intersect(a: Value_2, b: Value_2): number;

/**
 * The type interface for script data.
 */
declare interface IScriptData {
    redeemersEncoded: string;
    datumsEncoded: string | undefined;
    costModelsEncoded: string;
    hashedData: HexBlob;
    scriptDataHash: Hash32ByteBase16;
}

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
 * Utility function to compare the equality of two UTxOs.
 * @param {TransactionUnspentOutput} self
 * @param {TransactionUnspentOutput} that
 * @returns {boolean}
 */
export declare const isEqualUTxO: (self: TransactionUnspentOutput, that: TransactionUnspentOutput) => boolean;

/**
 * Creates a new Value object with the specified amount of lovelace and assets.
 *
 * @param {bigint} lovelace - The amount of lovelace.
 * @param {...[string, bigint][]} assets - The assets to include in the Value object.
 * @returns {Value} - The newly created Value object.
 */
export declare function makeValue(lovelace: bigint, ...assets: [string, bigint][]): Value_2;

/**
 * Merges two Value objects into a single Value object by combining their coins and multiassets.
 *
 * @param {Value} a - The first Value object.
 * @param {Value} b - The second Value object.
 * @returns {Value} - The resulting Value object after merging.
 */
declare function merge(a: Value_2, b: Value_2): Value_2;

/**
 * The main coin selection function executes wideSelection and then deepSelection, combining the two.
 * It greedily selects the smallest set of utxos, and then any extra is done with the depth search.
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
declare const micahsSelector: CoinSelectionFunc;

/**
 * Negates the coin and multiasset values of a Value object.
 *
 * @param {Value} v - The Value object to negate.
 * @returns {Value} - The resulting Value object after negation.
 */
declare function negate(v: Value_2): Value_2;

/**
 * Filters a Value object to retain only the negative coin and multiasset values.
 *
 * @param {Value} v - The Value object to filter.
 * @returns {Value} - A new Value object containing only negative values.
 */
declare function negatives(v: Value_2): Value_2;

/**
 * Filters out the positive coin and multiasset values from a Value object.
 *
 * @param {Value} v - The Value object to filter.
 * @returns {Value} - A new Value object containing only positive values.
 */
declare function positives(v: Value_2): Value_2;

/**
 * The result of a coin selection operation.
 * It includes the selected inputs, the total value of the selected inputs, and the remaining inputs.
 */
declare type SelectionResult = {
    leftoverInputs: TransactionUnspentOutput[];
    selectedInputs: TransactionUnspentOutput[];
    selectedValue: Value_2;
};

/**
 * Sorts a list of UTxOs by highest total value first.
 * @param {TransactionUnspentOutput[]} inputs A list of UTxOs to sort.
 * @returns {TransactionUnspentOutput[]}
 */
export declare function sortLargestFirst(inputs: TransactionUnspentOutput[]): TransactionUnspentOutput[];

/**
 * Wraps JSON.stringify with a serializer for bigints.
 * @param {any} value The value you want to stringify.
 * @returns
 */
export declare const stringifyBigint: typeof JSON.stringify;

/**
 * Subtracts the values of one Value object from another.
 *
 * @param {Value} a - The Value object to subtract from.
 * @param {Value} b - The Value object to subtract.
 * @returns {Value} - The resulting Value object after subtraction.
 */
declare function sub(a: Value_2, b: Value_2): Value_2;

/**
 * Sums up a list of values into a single value instance.
 *
 * @param {...Value} values - An array of values.
 * @returns {Value} - The resulting Value object after summing up.
 */
declare function sum(values: Value_2[]): Value_2;

/**
 * A builder class for constructing Cardano transactions with various components like inputs, outputs, and scripts.
 */
export declare class TxBuilder {
    private tracing;
    readonly params: ProtocolParameters;
    private preCompleteHooks;
    private body;
    private auxiliaryData?;
    private redeemers;
    private utxos;
    private utxoScope;
    private collateralUtxos;
    private scriptScope;
    private scriptSeen;
    private changeAddress?;
    private collateralChangeAddress?;
    private rewardAddress?;
    private networkId?;
    private changeOutputIndex?;
    private plutusData;
    private requiredWitnesses;
    private requiredNativeScripts;
    private requiredPlutusScripts;
    private usedLanguages;
    private extraneousDatums;
    private fee;
    private additionalSigners;
    private evaluator?;
    private consumedDelegationHashes;
    private consumedMintHashes;
    private consumedWithdrawalHashes;
    private consumedDeregisterHashes;
    private consumedSpendInputs;
    private minimumFee;
    private feePadding;
    private coinSelector;
    private _burnAddress?;
    /**
     * Constructs a new instance of the TxBuilder class.
     * Initializes a new transaction body with an empty set of inputs, outputs, and no fee.
     */
    constructor(params: ProtocolParameters, tracing?: boolean);
    /**
     * Returns the burn address.
     *
     * @returns {Address}
     */
    get burnAddress(): Address;
    /**
     * Returns the number of transaction outputs in the current transaction body.
     *
     * @returns {number} The number of transaction outputs.
     */
    get outputsCount(): number;
    /**
     * Internal tracing functiong to log.
     *
     * @param {string} msg Describe message.
     * @param {any[]} extra Extra variables you want to print in the trace message.
     */
    private trace;
    /**
     * Hook to allow an existing instance to turn on tracing.
     *
     * @param {boolean} enabled Whether to enable tracing.
     * @returns {TxBuilder}
     */
    enableTracing(enabled: boolean): TxBuilder;
    /**
     * Sets the change address for the transaction.
     * This address will receive any remaining funds not allocated to outputs or fees.
     *
     * @param {Address} address - The address to receive the change.
     * @param {boolean} [override=true] - Whether to override the change address if one is already set.
     * @returns {TxBuilder} The same transaction builder
     */
    setChangeAddress(address: Address, override?: boolean): TxBuilder;
    /**
     * Sets the collateral change address for the transaction.
     * This address will receive the collateral change if there is any.
     *
     * @param {Address} address - The address to receive the collateral change.
     * @returns {TxBuilder} The same transaction builder
     */
    setCollateralChangeAddress(address: Address): TxBuilder;
    /**
     * Sets the reward address for the transaction.
     * This address will be used for delegation purposes and also stake key component of the transaction.
     *
     * @param {Address} address - The reward address
     * @returns {TxBuilder} The same transaction builder
     */
    setRewardAddress(address: Address): TxBuilder;
    /**
     * Sets the evaluator for the transaction builder.
     * The evaluator is used to execute Plutus scripts during transaction building.
     *
     * @param {Evaluator} evaluator - The evaluator to be used for script execution.
     * @param {boolean} [override=true] - Whether to override the evaluator if one is already set.
     * @returns {TxBuilder} The same transaction builder
     */
    useEvaluator(evaluator: Evaluator, override?: boolean): TxBuilder;
    /**
     * Sets a custom coin selector function for the transaction builder.
     * This function will be used to select inputs during the transaction building process.
     *
     * @param {(inputs: TransactionUnspentOutput[], dearth: Value): SelectionResult} selector - The coin selector function to use.
         * @returns {TxBuilder} The same transaction builder
         */
     useCoinSelector(selector: (inputs: TransactionUnspentOutput[], dearth: Value_2) => SelectionResult): TxBuilder;
     /**
      * Sets the network ID for the transaction builder.
      * The network ID is used to determine which network the transaction is intended for.
      *
      * @param {NetworkId} networkId - The network ID to set.
      * @returns {TxBuilder} The same transaction builder
      */
     setNetworkId(networkId: NetworkId): TxBuilder;
     /**
      * The additional signers field is used to add additional signing counts for fee calculation.
      * These will be included in the signing phase at a later stage.
      * This is needed due to native scripts signees being non-deterministic.
      * @param {number} amount - The amount of additional signers
      * @returns {TxBuilder} The same transaction builder
      */
     addAdditionalSigners(amount: number): TxBuilder;
     /**
      * Sets the minimum fee for the transaction.
      * This fee will be used during the transaction building process.
      *
      * @param {bigint} fee - The minimum fee to be set.
      * @returns {TxBuilder} The same transaction builder
      */
     setMinimumFee(fee: bigint): TxBuilder;
     /**
      * Sets the donation to the treasury in lovelace
      *
      * @param {bigint} donation - The amount of lovelace to donate back to the treasury
      * @returns {TxBuilder} The same transaction builder
      */
     setDonation(donation: bigint): TxBuilder;
     /**
      * Sets an additional padding to add onto the transactions.
      * Use this only in emergencies, and please open a ticket at https://github.com/butaneprotocol/blaze-cardano so we can correct the fee calculation!
      *
      * @param {bigint} pad - The padding to add onto the transaction fee
      * @returns {TxBuilder} the same transaction builder
      */
     setFeePadding(pad: bigint): TxBuilder;
     /**
      * Adds a reference input to the transaction. Reference inputs are used to refer to outputs from previous transactions
      * without spending them, allowing scripts to read their data. This can be useful for various contract logic, such as
      * checking the state of a datum without consuming the UTxO that holds it.
      *
      * @param {TransactionUnspentOutput} utxo - The unspent transaction output to add as a reference input.
      * @returns {TxBuilder} The same transaction builder
      * @throws {Error} If the input to be added is already present in the list of reference inputs, to prevent duplicates.
      */
     addReferenceInput(utxo: TransactionUnspentOutput): TxBuilder;
     /**
      * Adds an input to the transaction. This method is responsible for including a new input, which represents
      * a reference to an unspent transaction output (UTxO) that will be consumed by the transaction. Optionally,
      * a redeemer and an unhashed datum can be provided for script validation purposes.
      *
      * @param {TransactionUnspentOutput} utxo - The UTxO to be consumed as an input.
      * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation, required for spending Plutus script-locked UTxOs.
      * @param {PlutusData} [unhashDatum] - Optional. The unhashed datum, required if the UTxO being spent includes a datum hash instead of inline datum.
      * @returns {TxBuilder} The same transaction builder
      * @throws {Error} If attempting to add a duplicate input, if the UTxO payment key is missing, if attempting to spend with a redeemer for a KeyHash credential,
      *                 if attempting to spend without a datum when required, or if providing both an inline datum and an unhashed datum.
      */
     addInput(utxo: TransactionUnspentOutput, redeemer?: PlutusData, unhashDatum?: PlutusData): TxBuilder;
     /**
      * Adds unspent transaction outputs (UTxOs) to the set of UTxOs available for this transaction.
      * These UTxOs can then be used for balancing the transaction, ensuring that inputs and outputs are equal.
      *
      * @param {TransactionUnspentOutput[]} utxos - The unspent transaction outputs to add.
      * @returns {TxBuilder} The same transaction builder
      */
     addUnspentOutputs(utxos: TransactionUnspentOutput[]): TxBuilder;
     /**
      * Adds unspent transaction outputs (UTxOs) to the set of collateral UTxOs available for this transaction.
      * These UTxOs can then be used to provide collateral for the transaction, if necessary. If provided, they will b
      * If there are specific, valid collateral UTxOs provided, Blaze will use them before using any other UTxO.
      *
      * @param {TransactionUnspentOutput[]} utxos - the UTxOs to add as collateral
      * @returns {TxBuilder} The same transaction builder
      */
     provideCollateral(utxos: TransactionUnspentOutput[]): TxBuilder;
     /**
      * Adds minting information to the transaction. This includes specifying the policy under which assets are minted,
      * the assets to be minted, and an optional redeemer for Plutus scripts.
      *
      * @param {PolicyId} policy - The policy ID under which the assets are minted.
      * @param {Map<AssetName, bigint>} assets - A map of asset names to the amounts being minted.
      * @param {PlutusData} [redeemer] - Optional. A redeemer to be used if the minting policy requires Plutus script validation.
      */
     addMint(policy: PolicyId, assets: Map<AssetName, bigint>, redeemer?: PlutusData): this;
     /**
      * This methods calculates the minimum ada required for a transaction output.
      * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
      * @returns {bigint} The minimum ada required for the output.
      */
     private calculateMinAda;
     /**
      * This method checks and alters the output of a transaction.
      * It ensures that the output meets the minimum ada requirements and does not exceed the maximum value size.
      *
      * @param {TransactionOutput} output - The transaction output to be checked and altered.
      * @returns {TransactionOutput} The altered transaction output.
      * @throws {Error} If the output does not meet the minimum ada requirements or exceeds the maximum value size.
      */
     private checkAndAlterOutput;
     /**
      * Adds a transaction output to the current transaction body. This method also ensures that the minimum ada
      * requirements are met for the output. After adding the output, it updates the transaction body's outputs.
      * It also checks if the output value exceeds the maximum value size.
      *
      * @param {TransactionOutput} output - The transaction output to be added.
      * @returns {TxBuilder} The same transaction builder
      */
     addOutput(output: TransactionOutput): TxBuilder;
     /**
      * Adds a payment in lovelace to the transaction output.
      * This method ensures that the address is valid and the payment is added to the transaction output.
      *
      * @param {Address} address - The address to send the payment to.
      * @param {bigint} lovelace - The amount of lovelace to send.
      * @param {Datum} [datum] - Optional datum to be associated with the paid assets.
      * @returns {TxBuilder} The same transaction builder
      */
     payLovelace(address: Address, lovelace: bigint, datum?: Datum): TxBuilder;
     /**
      * Adds a payment in assets to the transaction output.
      * This method ensures that the address is valid and the payment is added to the transaction output.
      *
      * @param {Address} address - The address to send the payment to.
      * @param {Value} value - The value of the assets to send.
      * @param {Datum} [datum] - Optional datum to be associated with the paid assets.
      * @returns {TxBuilder} The same transaction builder
      */
     payAssets(address: Address, value: Value_2, datum?: Datum): TxBuilder;
     /**
      * Locks a specified amount of lovelace to a script.
      * The difference between 'pay' and 'lock' is that you pay to a public key/user,
      * and you lock at a script.
      * This method ensures that the address is valid and the lovelace is locked to the script.
      *
      * @param {Address} address - The address to lock the lovelace to.
      * @param {bigint} lovelace - The amount of lovelace to lock.
      * @param {Datum} datum - The datum to be associated with the locked lovelace.
      * @param {Script} scriptReference - The reference to the script to lock the lovelace to.
      * @returns {TxBuilder} The same transaction builder
      */
     lockLovelace(address: Address, lovelace: bigint, datum: Datum, scriptReference?: Script): TxBuilder;
     /**
      * Locks a specified amount of assets to a script.
      * The difference between 'pay' and 'lock' is that you pay to a public key/user,
      * and you lock at a script.
      * This method ensures that the address is valid and the assets are locked to the script.
      *
      * @param {Address} address - The address to lock the assets to.
      * @param {Value} value - The value of the assets to lock.
      * @param {Datum} datum - The datum to be associated with the locked assets.
      * @param {Script} scriptReference - The reference to the script to lock the assets to.
      * @returns {TxBuilder} The same transaction builder
      */
     lockAssets(address: Address, value: Value_2, datum: Datum, scriptReference?: Script): TxBuilder;
     /**
      * Deploys a script by creating a new UTxO with the script as its reference.
      *
      * @param {Script} script - The script to be deployed.
      * @param {Address} [address] - The address to lock the script to. Defaults to a burn address where the UTxO will be unspendable.
      * @returns {TxBuilder} The same transaction builder.
      *
      *
      * @example
      * ```typescript
      * const myScript = Script.newPlutusV2Script(new PlutusV2Script("..."));
      * txBuilder.deployScript(myScript);
      * // or
      * txBuilder.deployScript(myScript, someAddress);
      * ```
      */
     deployScript(script: Script, address?: Address): TxBuilder;
     /**
      * Adds a Plutus datum to the transaction. This datum is not directly associated with any particular output but may be used
      * by scripts during transaction validation. This method is useful for including additional information that scripts may
      * need to validate the transaction without requiring it to be attached to a specific output.
      *
      * @param {PlutusData} datum - The Plutus datum to be added to the transaction.
      * @returns {TxBuilder} The same transaction builder
      */
     provideDatum(datum: PlutusData): TxBuilder;
     /**
      * Evaluates the scripts for the given draft transaction and calculates the execution units and fees required.
      * This function iterates over all UTXOs within the transaction's scope, simulates the execution of associated scripts,
      * and aggregates the execution units. It then calculates the total fee based on the execution units and updates the
      * transaction's redeemers with the new execution units.
      *
      * @param {Transaction} draft_tx - The draft transaction to evaluate.
      * @returns {Promise<bigint>} The total fee calculated based on the execution units of the scripts.
      */
     private evaluate;
     /**
      * Builds a full witness set with the provided signatures
      *
      * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
      * vkey signatures, redeemers, and Plutus data required for script validation.
      *
      * It organizes these components into a structured format that can be
      * serialized and included in the transaction.
      *
      * @returns {TransactionWitnessSet} A constructed transaction witness set.
      * @throws {Error} If a required script cannot be resolved by its hash.
      */
     protected buildFinalWitnessSet(signatures: [Ed25519PublicKeyHex, Ed25519SignatureHex][]): TransactionWitnessSet;
     /**
      * Recalculates the internal tracking of required signatures/redeemers
      * by looping through existing inputs and certificates.
      *
      * @return {void}
      */
     private updateRequiredWitnesses;
     /**
      * Builds a placeholder transaction witness set required for the transaction.
      *
      * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
      * redeemers, and Plutus data required for script validation.
      *
      * Includes placeholder signatures for the known required signers, so we estimate the transaction size accurately
      *
      * It organizes these components into a structured format that can be
      * serialized and included in the transaction.
      *
      * @returns {TransactionWitnessSet} A constructed transaction witness set.
      * @throws {Error} If a required script cannot be resolved by its hash.
      */
     protected buildPlaceholderWitnessSet(): TransactionWitnessSet;
     /**
      * Calculates the total net change of assets from a transaction.
      * That is, all sources of assets (inputs, withrawal certificates, etc) minus all destinations (outputs, minting, fees, etc)
      * In a balanced / well-formed transaction, this should be zero
      *
      * @returns {Value} The net value that represents the transaction's pitch.
      * @throws {Error} If a corresponding UTxO for an input cannot be found.
      */
     private getAssetSurplus;
     /**
      * Generates a script data hash for the transaction if there are any datums or redeemers present.
      * This hash is crucial for the validation of Plutus scripts in the transaction.
      *
      * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
      * @returns {IScriptData | undefined} The full lscript data if datums or redeemers are present, otherwise undefined.
      */
     protected getScriptData(tw: TransactionWitnessSet): IScriptData | undefined;
     /**
      * Helper method to just get the script data hash from a TransactionWitnessSet.
      *
      * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
      * @returns {Hash32ByteBase16 | undefined} The script data hash if datums or redeemers are present, otherwise undefined.
      */
     private getScriptDataHash;
     /**
      * We may have overcommitted some lovelace from our inputs just as part of balance change;
      * On the next time around, we may want to "recover" that lovelace to cover the slightly increased fee, etc.
      */
     private recoverLovelaceFromChangeOutput;
     /**
      * Given some excess value on a transaction, ensure this is returned as change to the change address
      *
      * @param {Value | undefined} surplusValue The excess value to balance into the change output(s)
      */
     private adjustChangeOutput;
     private getOrCreateChangeOutput;
     private splitOutputIfNeeded;
     /**
      * Calculates the transaction fees based on the transaction size and parameters.
      * It updates the transaction body with the calculated fee.
      *
      * @param {Transaction} draft_tx - The draft transaction to calculate fees for.
      */
     protected calculateFees(): void;
     /**
      * Prepares the collateral for the transaction by selecting suitable UTXOs.
      * Throws an error if suitable collateral cannot be found or if some inputs cannot be resolved.{boolean}
      */
     protected prepareCollateral({ useCoinSelection }?: UseCoinSelectionArgs): void;
     /**
      * Prints the transaction cbor in its current state without trying to complete it
      * @returns {string} The CBOR representation of the transaction
      * */
     toCbor(): string;
     /**
      * Completes the transaction by performing several key operations:
      * - Verifies the presence of a change address.
      * - Gathers inputs and performs coin selection if necessary.
      * - Balances the change output.
      * - Builds the transaction witness set.
      * - Calculates the script data hash.
      * - Estimates and sets the transaction fee.
      * - Merges the fee value with the excess value and rebalances the change.
      *
      * @throws {Error} If the change address is not set, or if the coin selection fails to eliminate negative values,
      *                 or if balancing the change output fails.
      * @returns {Promise<Transaction>} A new Transaction object with all components set and ready for submission.
      */
     complete({ useCoinSelection }?: UseCoinSelectionArgs): Promise<Transaction>;
     /**
      * Adds a certificate to delegate a staker to a pool
      *
      * @param {Credential} delegator - The credential of the staker to delegate.
      * @param {PoolId} poolId - The ID of the pool to delegate to.
      * @param {PlutusData} [redeemer] - Optional. A redeemer to be used if the delegation requires Plutus script validation.
      * @returns {TxBuilder} The updated transaction builder.
      */
     addDelegation(delegator: Credential, poolId: PoolId, redeemer?: PlutusData): TxBuilder;
     /**
      * This method delegates the selected reward address to a pool.
      * It first checks if the reward address is set and if it has a stake component.
      * If both conditions are met, it adds a delegation to the transaction.
      *
      * @param {PoolId} poolId - The ID of the pool to delegate the reward address to.
      * @throws {Error} If the reward address is not set or if the method is unimplemented.
      */
     delegate(poolId: PoolId, redeemer?: PlutusData): this;
     /**
      * Adds a certificate to register a staker.
      * @param {Credential} credential - The credential to register.
      * @throws {Error} Method not implemented.
      */
     addRegisterStake(credential: Credential): this;
     /**
      * Adds a certificate to deregister a stake account.
      *
      * @param {Credential} credential - The credential to deregister.
      * @returns {TxBuilder} The updated transaction builder.
      */
     addDeregisterStake(credential: Credential, redeemer?: PlutusData): TxBuilder;
     /**
      * Adds a certificate to register a pool.
      * @throws {Error} Method not implemented.
      */
     addRegisterPool(): void;
     /**
      * Adds a certificate to retire a pool.
      * @throws {Error} Method not implemented.
      */
     addRetirePool(): void;
     /**
      * Specifies the exact time when the transaction becomes valid.
      *
      * @param {Slot} validFrom - The slot from which the transaction becomes valid.
      * @throws {Error} If the validity start interval is already set.
      * @returns {TxBuilder} The instance of this TxBuilder for chaining.
      */
     setValidFrom(validFrom: Slot): TxBuilder;
     /**
      * Specifies the exact time when the transaction expires.
      *
      * @param {Slot} validUntil - The slot until which the transaction is valid.
      * @throws {Error} If the time to live is already set.
      * @returns {TxBuilder} The instance of this TxBuilder for chaining.
      */
     setValidUntil(validUntil: Slot): TxBuilder;
     /**
      * Adds a withdrawal to the transaction. This method allows for the withdrawal of funds from a staking reward account.
      * Optionally, a redeemer can be provided for script validation purposes.
      *
      * @param {C.Cardano.RewardAccount} address - The reward account from which to withdraw.
      * @param {bigint} amount - The amount of ADA to withdraw.
      * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation.
      * @returns {TxBuilder} The same transaction builder
      * @throws {Error} If the reward account does not have a stake credential or if any other error occurs.
      */
     addWithdrawal(address: RewardAccount, amount: bigint, redeemer?: PlutusData): TxBuilder;
     /**
      * Adds a required signer to the transaction. This is necessary for transactions that must be explicitly signed by a particular key.
      *
      * @param {Ed25519KeyHashHex} signer - The hash of the Ed25519 public key that is required to sign the transaction.
      * @returns {TxBuilder} The same transaction builder
      */
     addRequiredSigner(signer: Ed25519KeyHashHex): TxBuilder;
     /**
      * Sets the auxiliary data for the transaction and updates the transaction's auxiliary data hash.
      *
      * @param {AuxiliaryData} auxiliaryData - The auxiliary data to set.
      * @returns {TxBuilder} The same transaction builder
      */
     setAuxiliaryData(auxiliaryData: AuxiliaryData): TxBuilder;
     /**
      * Sets the transaction metadata and updates the transaction's auxiliary data hash.
      * @param {Metadata} metadata the metadata to set
      * @returns {TxBuilder} The same transaction builder
      */
     setMetadata(metadata: Metadata): TxBuilder;
     /**
      * Adds a script to the transaction's script scope. If the script is already provided via a reference script,
      * it will not be explicitly used again. This method ensures that each script is only included once in the
      * transaction, either directly or by reference, to optimize the transaction size and processing.
      *
      * @param {Script} script - The script to be added to the transaction's script scope.
      * @returns {TxBuilder} The same transaction builder
      */
     provideScript(script: Script): TxBuilder;
     /**
      * Adds a pre-complete hook to the transaction builder. This hook will be executed
      * before the transaction is finalized.
      *
      * Pre-complete hooks are useful for performing last-minute modifications or
      * validations on the transaction before it's completed. Multiple hooks can be
      * added, and they will be executed in the order they were added.
      *
      * @param {(tx: TxBuilder) => Promise<void>} hook - A function that takes the TxBuilder
      * instance as an argument and performs some operation. The hook should be asynchronous.
      * @returns {TxBuilder} The same transaction builder instance for method chaining.
      */
     addPreCompleteHook(hook: (tx: TxBuilder) => Promise<void>): TxBuilder;
    }

    declare interface UseCoinSelectionArgs {
        useCoinSelection: boolean;
    }

    export declare namespace Value {
        export {
            merge,
            sum,
            negate,
            sub,
            intersect,
            positives,
            negatives,
            assets,
            assetTypes,
            empty,
            makeValue,
            zero
        }
    }

    /**
     * A constant Value object with zero coins and no assets.
     *
     * @returns {Value} - The zero Value object.
     */
    declare const zero: () => Value_2;

    export { }
