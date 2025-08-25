import type { ProtocolParameters, Transaction, TransactionId } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { TxBuilder } from "@blaze-cardano/tx";
import type { Wallet } from "@blaze-cardano/wallet";
/**
 * The Blaze class is used to create and manage Cardano transactions.
 * It requires a provider and a wallet to interact with the blockchain and manage funds.
 */
export declare class Blaze<ProviderType extends Provider, WalletType extends Wallet> {
    readonly provider: ProviderType;
    wallet: WalletType;
    readonly params: ProtocolParameters;
    /**
     * Constructs a new instance of the Blaze class.
     * @param {ProviderType} provider - The provider to use for interacting with the blockchain.
     * @param {WalletType} wallet - The wallet to use for managing funds and signing transactions.
     * @private
     */
    private constructor();
    static from<ProviderType extends Provider, WalletType extends Wallet>(provider: ProviderType, wallet: WalletType): Promise<Blaze<ProviderType, WalletType>>;
    /**
     * Creates a new transaction using the provider and wallet.
     * @returns {TxBuilder} - The newly created transaction builder.
     */
    newTransaction(): TxBuilder;
    /**
     * Signs a transaction using the wallet.
     * @param {Transaction} tx - The transaction to sign.
     * @returns {Promise<Transaction>} - The signed transaction.
     */
    signTransaction(tx: Transaction): Promise<Transaction>;
    /**
     * Submits a transaction to the blockchain.
     * @param {Transaction} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The transaction ID.
     * @throws {Error} If the transaction submission fails.
     * @description This method sends the provided transaction to the blockchain network
     * using the configured wallet, or the configured provider if set.
     */
    submitTransaction(tx: Transaction, useProvider?: boolean): Promise<TransactionId>;
}
//# sourceMappingURL=blaze.d.ts.map