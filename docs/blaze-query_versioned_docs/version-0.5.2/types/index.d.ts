import { Address } from '@blaze-cardano/core';
import { AssetId } from '@blaze-cardano/core';
import type { Credential } from '@blaze-cardano/core';
import { DatumHash } from '@blaze-cardano/core';
import { Hash28ByteBase16 } from '@blaze-cardano/core';
import { NetworkId } from '@blaze-cardano/core';
import { PlutusData } from '@blaze-cardano/core';
import { PlutusLanguageVersion } from '@blaze-cardano/core';
import { ProtocolParameters } from '@blaze-cardano/core';
import { Redeemers } from '@blaze-cardano/core';
import type * as Schema from '@cardano-ogmios/schema';
import { Script } from '@blaze-cardano/core';
import { Slot } from '@blaze-cardano/core';
import { SlotConfig } from '@blaze-cardano/core';
import { Transaction } from '@blaze-cardano/core';
import { TransactionId } from '@blaze-cardano/core';
import { TransactionInput } from '@blaze-cardano/core';
import { TransactionUnspentOutput } from '@blaze-cardano/core';
import type { Unwrapped } from '@blaze-cardano/ogmios';

export declare class Blockfrost extends Provider {
    url: string;
    private projectId;
    private scriptCache;
    withScriptRefCaching: boolean;
    constructor({ network, projectId, withScriptRefCaching, }: {
        network: NetworkName;
        projectId: string;
        withScriptRefCaching?: boolean;
    });
    headers(): {
        project_id: string;
    };
    /**
     * This method fetches the protocol parameters from the Blockfrost API.
     * It constructs the query URL, sends a GET request with the appropriate headers, and processes the response.
     * The response is parsed into a ProtocolParameters object, which is then returned.
     * If the response is not in the expected format, an error is thrown.
     * @returns A Promise that resolves to a ProtocolParameters object.
     */
    getParameters(): Promise<ProtocolParameters>;
    /**
     * This method fetches the UTxOs under a given address.
     * The response is parsed into a TransactionUnspentOutput[] type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param address - The Address or Payment Credential
     * @returns A Promise that resolves to TransactionUnspentOutput[].
     */
    getUnspentOutputs(address: Address | Credential, filter?: (utxo: BlockfrostUTxO) => boolean): Promise<TransactionUnspentOutput[]>;
    /**
     * This method fetches the UTxOs under a given address that hold
     * a particular asset.
     * The response is parsed into a TransactionUnspentOutput[] type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param address - Address or Payment Credential.
     * @param unit - The AssetId
     * @returns A Promise that resolves to TransactionUnspentOutput[].
     */
    getUnspentOutputsWithAsset(address: Address | Credential, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * This method fetches the UTxO that holds a particular NFT given as
     * argument.
     * The response is parsed into a TransactionUnspentOutput type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param nft - The AssetId for the NFT
     * @returns A Promise that resolves to TransactionUnspentOutput.
     */
    getUnspentOutputByNFT(nft: AssetId): Promise<TransactionUnspentOutput>;
    /**
     * This method resolves transaction outputs from a list of transaction
     * inputs given as argument.
     * The response is parsed into a TransactionUnspentOutput[] type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param txIns - A list of TransactionInput
     * @returns A Promise that resolves to TransactionUnspentOutput[].
     */
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * This method returns the datum for the datum hash given as argument.
     * The response is parsed into a PlutusData type, which is then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param datumHash - The hash of a datum
     * @returns A Promise that resolves to PlutusData
     */
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    /**
     * This method awaits confirmation of the transaction given as argument.
     * The response is parsed into a boolean, which is then returned.
     * If tx is not confirmed at first and no value for timeout is provided,
     * then false is returned.
     * If tx is not confirmed at first and a value for timeout (in ms) is given,
     * then subsequent checks will be performed at a 20 second interval until
     * timeout is reached.
     * @param txId - The hash of a transaction
     * @param timeout - An optional timeout for waiting for confirmation. This
     * value should be greater than average block time of 20000 ms
     * @returns A Promise that resolves to a boolean
     */
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    /**
     * This method submits a transaction to the chain.
     * @param tx - The Transaction
     * @returns A Promise that resolves to a TransactionId type
     */
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    /**
     * This method evaluates how much execution units a transaction requires.
     * Optionally, additional outputs can be provided. These are added to the
     * evaluation without checking for their presence on-chain. This is useful
     * when performing transaction chaining, where some outputs used as inputs
     * to a transaction will have not yet been submitted to the network.
     * @param tx - The Transaction
     * @param additionalUtxos - Optional utxos to be added to the evaluation.
     * @returns A Promise that resolves to a Redeemers type
     */
    evaluateTransaction(tx: Transaction, additionalUtxos?: TransactionUnspentOutput[]): Promise<Redeemers>;
    private getScriptRef;
    resolveScriptRef(script: Script | Hash28ByteBase16, address?: Address): Promise<TransactionUnspentOutput | undefined>;
    private buildTransactionUnspentOutput;
}

declare type BlockfrostLanguageVersions = "PlutusV1" | "PlutusV2" | "PlutusV3";

export declare interface BlockfrostProtocolParametersResponse {
    epoch: number;
    min_fee_a: number;
    min_fee_b: number;
    max_block_size: number;
    max_tx_size: number;
    max_block_header_size: number;
    key_deposit: number;
    pool_deposit: number;
    e_max: number;
    n_opt: number;
    a0: string;
    rho: string;
    tau: string;
    decentralisation_param: number;
    extra_entropy: null;
    protocol_major_ver: number;
    protocol_minor_ver: number;
    min_utxo: string;
    min_pool_cost: number;
    nonce: string;
    cost_models: Record<BlockfrostLanguageVersions, {
        [key: string]: number;
    }>;
    cost_models_raw: Record<BlockfrostLanguageVersions, number[]>;
    price_mem: string;
    price_step: string;
    max_tx_ex_mem: number;
    max_tx_ex_steps: number;
    max_block_ex_mem: number;
    max_block_ex_steps: number;
    max_val_size: number;
    collateral_percent: number;
    max_collateral_inputs: number;
    coins_per_utxo_size: number;
    min_fee_ref_script_cost_per_byte?: number;
}

declare interface BlockfrostUTxO {
    address: string;
    tx_hash: string;
    output_index: number;
    amount: {
        unit: string;
        quantity: string;
    }[];
    block: string;
    data_hash?: string;
    inline_datum?: string;
    reference_script_hash?: string;
}

export declare const fromBlockfrostLanguageVersion: (x: BlockfrostLanguageVersions) => PlutusLanguageVersion;

export declare class Kupmios extends Provider {
    kupoUrl: string;
    ogmios: Unwrapped.Ogmios;
    static readonly plutusVersions: string[];
    static readonly confirmationTimeout: number;
    /**
     * Constructor to initialize Kupmios instance.
     * @param kupoUrl - URL of the Kupo service.
     * @param ogmiosUrl - URL of the Ogmios service.
     */
    constructor(kupoUrl: string, ogmios: Unwrapped.Ogmios);
    /**
     * Parses a fractional string into a number.
     * @param fraction - Fractional string in the format "numerator/denominator".
     * @returns The parsed fraction as a number.
     */
    private parseFraction;
    /**
     * Fetches unspent outputs using Kupo API.
     * @param prefix - Prefix for the URL.
     * @param postfix - Postfix for the URL.
     * @returns A promise that resolves to an array of fully resolved unspent outputs.
     */
    private _getUnspentOutputs;
    /**
     * Gets unspent outputs for a given address.
     * @param address - Address to fetch unspent outputs for.
     * @returns A promise that resolves to an array of unspent outputs.
     */
    getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    /**
     * Gets unspent outputs containing a specific asset.
     * @param address - Address to fetch unspent outputs for.
     * @param unit - Asset ID to filter by.
     * @returns A promise that resolves to an array of unspent outputs.
     */
    getUnspentOutputsWithAsset(address: Address | null, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * Gets an unspent output containing a specific NFT.
     * @param unit - Asset ID of the NFT.
     * @returns A promise that resolves to the unspent output.
     */
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    /**
     * Resolves unspent outputs for given transaction inputs.
     * @param txIns - Array of transaction inputs.
     * @returns A promise that resolves to an array of unspent outputs.
     */
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * Gets the protocol parameters from the blockchain.
     * @returns A promise that resolves to the protocol parameters.
     */
    getParameters(): Promise<ProtocolParameters>;
    /**
     * Resolves the datum for a given datum hash.
     * @param datumHash - Hash of the datum to resolve.
     * @returns A promise that resolves to the Plutus data.
     */
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    /**
     * Awaits confirmation of a transaction.
     * @param txId - ID of the transaction to await confirmation for.
     * @param timeout - Optional timeout in milliseconds.
     * @returns A promise that resolves to a boolean indicating confirmation status.
     */
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    /**
     * Posts a transaction to the blockchain.
     * @param tx - Transaction to post.
     * @returns A promise that resolves to the transaction ID.
     */
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    /**
     * Resolves the scripts for a given script hash.
     * @param scriptHash - Hash of the script to resolve.
     * @returns A promise that resolves to the JSON represenation of the scrip.
     * Note: we should reconsider creating a class for this as it could be expensive operation
     */
    private resolveScript;
    /**
     * Evaluates a transaction.
     * @param tx - Transaction to evaluate.
     * @param additionalUtxos - Additional UTXOs to consider.
     * @returns A promise that resolves to the redeemers.
     */
    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
    /**
     * Serialize unspent outputs to JSON format.
     * @param unspentOutputs - Unspent outputs to serialize.
     * @returns the serialized unspent outputs.
     */
    static serializeUtxos(unspentOutputs: TransactionUnspentOutput[]): Schema.Utxo;
}

export declare class Maestro extends Provider {
    private url;
    private apiKey;
    constructor({ network, apiKey, }: {
        network: "mainnet" | "preview" | "preprod";
        apiKey: string;
    });
    private headers;
    /**
     * This method fetches the protocol parameters from the Maestro API.
     * It constructs the query URL, sends a GET request with the appropriate headers, and processes the response.
     * The response is parsed into a ProtocolParameters object, which is then returned.
     * If the response is not in the expected format, an error is thrown.
     * @returns A Promise that resolves to a ProtocolParameters object.
     */
    getParameters(): Promise<ProtocolParameters>;
    getUnspentOutputs(address: Address | Credential): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
}

export declare type NetworkName = "cardano-mainnet" | "cardano-preprod" | "cardano-preview" | "cardano-sanchonet" | "unknown";

/**
 * Abstract class for the Provider.
 * This class provides an interface for interacting with the blockchain.
 */
export declare abstract class Provider {
    network: NetworkId;
    networkName: NetworkName;
    constructor(network: NetworkId, networkName: NetworkName);
    /**
     * Retrieves the parameters for a transaction.
     *
     * @returns {Promise<ProtocolParameters>} - The parameters for a transaction.
     */
    abstract getParameters(): Promise<ProtocolParameters>;
    /**
     * Retrieves the unspent outputs for a given address.
     *
     * @param {Address} address - The address to retrieve unspent outputs for.
     * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address.
     */
    abstract getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the unspent outputs for a given address and asset.
     *
     * @param {Address} address - The address to retrieve unspent outputs for.
     * @param {AssetId} unit - The asset to retrieve unspent outputs for.
     * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address and asset.
     */
    abstract getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the unspent output for a given NFT.
     *
     * @param {AssetId} unit - The NFT to retrieve the unspent output for.
     * @returns {Promise<TransactionUnspentOutput>} - The unspent output for the NFT.
     */
    abstract getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    /**
     * Resolves the unspent outputs for a given set of transaction inputs.
     *
     * @param {TransactionInput[]} txIns - The transaction inputs to resolve unspent outputs for.
     * @returns {Promise<TransactionUnspentOutput[]>} - The resolved unspent outputs.
     */
    abstract resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * Resolves the datum for a given datum hash.
     *
     * @param {DatumHash} datumHash - The datum hash to resolve the datum for.
     * @returns {Promise<PlutusData>} - The resolved datum.
     */
    abstract resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    /**
     * Waits for the confirmation of a given transaction.
     *
     * @param {TransactionId} txId - The transaction id to wait for confirmation.
     * @param {number} [timeout] - The timeout in milliseconds.
     * @returns {Promise<boolean>} - A boolean indicating whether the transaction is confirmed.
     */
    abstract awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    /**
     * Posts a given transaction to the chain.
     *
     * @param {Transaction} tx - The transaction to post to the chain.
     * @returns {Promise<TransactionId>} - The id of the posted transaction.
     */
    abstract postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    /**
     * Evaluates the transaction by calculating the exunits for each redeemer, applying them, and returning the redeemers.
     * This makes a remote call to the provider in most cases, however may use a virtual machine in some implementations.
     *
     * @param {Transaction} tx - The transaction to evaluate.
     * @param {TransactionUnspentOutput[]} additionalUtxos - The additional unspent outputs to consider.
     * @returns {Promise<Redeemers>} - The redeemers with applied exunits.
     */
    abstract evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
    /**
     * Resolves the script deployment by finding a UTxO containing the script reference.
     *
     * @param {Script | Hash28ByteBase16} script - The script or its hash to resolve.
     * @param {Address} [address] - The address to search for the script deployment. Defaults to a burn address.
     * @returns {Promise<TransactionUnspentOutput | undefined>} - The UTxO containing the script reference, or undefined if not found.
     *
     * @remarks
     * This is a default implementation that works but may not be optimal.
     * Subclasses of Provider should implement their own version for better performance.
     *
     * The method searches for a UTxO at the given address (or a burn address by default)
     * that contains a script reference matching the provided script or script hash.
     *
     * @example
     * ```typescript
     * const scriptUtxo = await provider.resolveScriptRef(myScript);
     * if (scriptUtxo) {
     *   console.log("Script found in UTxO:", scriptUtxo.input().toCore());
     * } else {
     *   console.log("Script not found");
     * }
     * ```
     */
    resolveScriptRef(script: Script | Hash28ByteBase16, address?: Address): Promise<TransactionUnspentOutput | undefined>;
    /**
     * Get the slot config, which describes how to translate between slots and unix timestamps
     * TODO: this is brittle; in theory this should work with the era histories; also, networkName is awkward
     */
    getSlotConfig(): SlotConfig;
    /**
     * Translate a unix millisecond timestamp to slot, according to the providers network
     * @param unix_millis Milliseconds since midnight, Jan 1 1970
     * @returns The slot in the relevant network
     */
    unixToSlot(unix_millis: bigint | number): Slot;
    /**
     * Translate a slot to a unix millisecond timestamp
     * @param slot The network slot
     * @returns The milliseconds since midnight, Jan 1 1970
     */
    slotToUnix(slot: Slot | number | bigint): number;
}

/**
 * Mapping of RedeemerPurpose to RedeemerTag.
 * Ensures consistency between purpose strings and tag numbers.
 */
export declare const purposeToTag: {
    [key: string]: number;
};

export { }
