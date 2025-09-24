import type { NetworkId, Transaction } from "@blaze-cardano/core";
import { Address, RewardAddress, TransactionId, TransactionUnspentOutput, TransactionWitnessSet, Value } from "@blaze-cardano/core";
import type { Wallet, CIP30DataSignature, CIP30Interface } from "./types";
/**
 * Wallet class that interacts with the WalletInterface.
 */
export declare class WebWallet implements Wallet {
    private webWallet;
    /**
     * Constructs a new instance of the WebWallet class.
     * @param {CIP30Interface} webWallet - The CIP30Interface to be used.
     */
    constructor(webWallet: CIP30Interface);
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
    signTransaction(tx: Transaction, partialSign: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<CIP30DataSignature>} - The signed data.
     */
    signData(address: Address, payload: string): Promise<CIP30DataSignature>;
    /**
     * Submits a transaction through the wallet.
     * @param {Transaction} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
     */
    postTransaction(tx: Transaction): Promise<TransactionId>;
    /**
     * Retrieves the collateral UTxO(s) for the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
     */
    getCollateral(): Promise<TransactionUnspentOutput[]>;
}
//# sourceMappingURL=web.d.ts.map