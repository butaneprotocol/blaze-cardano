import type { AssetId as AssetIdType, Credential, ProtocolParameters, Transaction } from "@blaze-cardano/core";
import { Address, AssetId, DatumHash, Hash28ByteBase16, PlutusData, PlutusLanguageVersion, Redeemers, Script, TransactionId, TransactionInput, TransactionUnspentOutput } from "@blaze-cardano/core";
import { Provider, type NetworkName } from "./provider";
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
    getUnspentOutputsWithAsset(address: Address | Credential, unit: AssetIdType): Promise<TransactionUnspentOutput[]>;
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
type BlockfrostLanguageVersions = "PlutusV1" | "PlutusV2" | "PlutusV3";
export declare const fromBlockfrostLanguageVersion: (x: BlockfrostLanguageVersions) => PlutusLanguageVersion;
export interface BlockfrostProtocolParametersResponse {
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
interface BlockfrostUTxO {
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
export {};
//# sourceMappingURL=blockfrost.d.ts.map