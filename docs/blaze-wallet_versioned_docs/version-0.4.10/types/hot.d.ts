import type { RewardAddress, TransactionId, TransactionUnspentOutput, Value, Transaction, Bip32PrivateKeyHex, Bip32PublicKey } from "@blaze-cardano/core";
import { Address, AddressType, TransactionWitnessSet, Bip32PrivateKey, NetworkId } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Wallet, CIP30DataSignature } from "./types";
/**
 * Wallet class that interacts with the HotWallet.
 */
export declare class HotWallet implements Wallet {
    private provider;
    private signingKey;
    private stakeSigningKey;
    private publicKey;
    readonly address: Address;
    readonly rewardAddress: RewardAddress | undefined;
    readonly networkId: NetworkId;
    /**
     * Constructs a new instance of the HotWallet class.
     * @param {Address} address - the wallets's address
     * @param {RewardAddress} rewardAddress - the wallet's reward address if there is any
     * @param {Bip32PrivateKey} signingKey - The signing key of the derived account's of wallet.
     * @param {Bip32PublicKey} publicKey - The public key of the derived account's of the wallet.
     * @param {Provider} provider - The provider of the wallet.
     */
    private constructor();
    private static harden;
    static generateAccountAddressFromMasterkey(masterkey: Bip32PrivateKey, networkId?: NetworkId, addressType?: AddressType): Promise<{
        address: Address;
        paymentKey: Bip32PrivateKey;
        stakePaymentKey: Bip32PrivateKey;
        publicKey: Bip32PublicKey;
    }>;
    static fromMasterkey(masterkey: Bip32PrivateKeyHex, provider: Provider, networkId?: NetworkId, addressType?: AddressType): Promise<HotWallet>;
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
     * @param {boolean} signWithStakeKey - Whether to also sign the transaction with the stake key.
     * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
     */
    signTransaction(tx: Transaction, partialSign?: boolean, signWithStakeKey?: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
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
//# sourceMappingURL=hot.d.ts.map