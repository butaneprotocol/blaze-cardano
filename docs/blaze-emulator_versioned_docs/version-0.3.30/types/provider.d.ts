import type { Address, ProtocolParameters, AssetId, TransactionId, Transaction, Redeemers, DatumHash, SlotConfig } from "@blaze-cardano/core";
import { TransactionInput, PlutusData } from "@blaze-cardano/core";
import { TransactionUnspentOutput } from "@blaze-cardano/core";
import { Provider } from "@blaze-cardano/query";
import type { Emulator } from "./emulator";
/**
 * The EmulatorProvider class implements the Provider interface.
 * It provides methods to interact with the Emulator.
 */
export declare class EmulatorProvider extends Provider {
    /**
     * The Emulator instance.
     */
    private emulator;
    constructor(emulator: Emulator);
    getParameters(): Promise<ProtocolParameters>;
    getSlotConfig(): SlotConfig;
    getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    awaitTransactionConfirmation(txId: TransactionId, _timeout?: number | undefined): Promise<boolean>;
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
}
//# sourceMappingURL=provider.d.ts.map