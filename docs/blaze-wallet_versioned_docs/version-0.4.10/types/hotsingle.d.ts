import { Address, TransactionWitnessSet } from "@blaze-cardano/core";
import type { RewardAddress, TransactionId, TransactionUnspentOutput, Value, Transaction, Ed25519PrivateNormalKeyHex, NetworkId } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Wallet, CIP30DataSignature } from "./types";
/**
 * Wallet class that interacts with the HotSingleWallet.
 * This is like HotWallet, but without key derivation.
 */
export declare class HotSingleWallet implements Wallet {
    private provider;
    private paymentSigningKey;
    private paymentPublicKey;
    private stakeSigningKey;
    private stakePublicKey;
    readonly address: Address;
    readonly networkId: NetworkId;
    /**
     * Constructs a new instance of the HotSingleWallet class.
     * @param {Ed25519PrivateNormalKeyHex} signingKey - The private signing key of the wallet.
     * @param {NetworkId} networkId - The network ID for the wallet.
     * @param {Provider} provider - The provider for the wallet.
     * @param {Ed25519PrivateNormalKeyHex} stakeSigningKey - An optional private signing key for the delegation part of the wallet. If not provided, the wallet will have an enterprise address.
     */
    constructor(paymentSigningKey: Ed25519PrivateNormalKeyHex, networkId: NetworkId, provider: Provider, stakeSigningKey?: Ed25519PrivateNormalKeyHex);
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
    signTransaction(tx: Transaction, partialSign?: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * Not supported, will always throw an error.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<CIP30DataSignature>} - The signed data.
     */
    signData(address: Address, payload: string): Promise<CIP30DataSignature>;
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
//# sourceMappingURL=hotsingle.d.ts.map