import type { Address, NetworkId, RewardAddress, TransactionId, TransactionUnspentOutput, TransactionWitnessSet, Value, Transaction } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Wallet, CIP30DataSignature } from "./types";
/**
 * Wallet class that interacts with the ColdWallet.
 */
export declare class ColdWallet implements Wallet {
    private provider;
    readonly address: Address;
    readonly networkId: NetworkId;
    /**
     * Constructs a new instance of the ColdWallet class.
     * @param {Address} address - The address of the wallet.
     * @param {NetworkId} networkId - The network ID of the wallet.
     * @param {Provider} provider - The provider of the wallet.
     */
    constructor(address: Address, networkId: NetworkId, provider: Provider);
    /**
     * Retrieves the network ID of the currently connected account.
     * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
     */
    getNetworkId(): Promise<NetworkId>;
    /**
     * Retrieves the UTxO(s) controlled by the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
     */
    getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     * @returns {Promise<Value>} - The balance of the wallet.
     */
    getBalance(): Promise<Value>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
     */
    getUsedAddresses(): Promise<Address[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
     */
    getUnusedAddresses(): Promise<Address[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     * @returns {Promise<Address>} - The change address.
     */
    getChangeAddress(): Promise<Address>;
    /**
     * Retrieves the reward addresses controlled by the wallet.
     * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
     */
    getRewardAddresses(): Promise<RewardAddress[]>;
    /**
     * Requests a transaction signature from the wallet.
     * @param {string} tx - The transaction to sign.
     * @param {boolean} partialSign - Whether to partially sign the transaction.
     * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
     */
    signTransaction(_tx: Transaction, _partialSign?: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<CIP30DataSignature>} - The signed data.
     */
    signData(_address: Address, _payload: string): Promise<CIP30DataSignature>;
    /**
     * Submits a transaction through the wallet.
     * @param {string} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
     */
    postTransaction(tx: Transaction): Promise<TransactionId>;
    /**
     * Retrieves the collateral UTxO(s) for the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
     */
    getCollateral(): Promise<TransactionUnspentOutput[]>;
}
//# sourceMappingURL=cold.d.ts.map