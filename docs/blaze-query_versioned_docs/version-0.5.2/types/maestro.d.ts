import type { AssetId, DatumHash, Transaction, ProtocolParameters, Credential } from "@blaze-cardano/core";
import { TransactionUnspentOutput, Address, TransactionInput, PlutusData, TransactionId, Redeemers } from "@blaze-cardano/core";
import { Provider } from "./provider";
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
//# sourceMappingURL=maestro.d.ts.map