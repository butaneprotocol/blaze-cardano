import type { ProtocolParameters, DatumHash, Transaction } from "@blaze-cardano/core";
import { TransactionUnspentOutput, Address, AssetId, TransactionInput, TransactionId, Redeemers, PlutusData } from "@blaze-cardano/core";
import { Provider } from "./provider";
import type { Unwrapped } from "@blaze-cardano/ogmios";
import type * as Schema from "@cardano-ogmios/schema";
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
//# sourceMappingURL=kupmios.d.ts.map