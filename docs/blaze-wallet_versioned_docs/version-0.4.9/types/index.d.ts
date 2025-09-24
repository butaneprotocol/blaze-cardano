import { Address } from '@blaze-cardano/core';
import { AddressType } from '@blaze-cardano/core';
import { Bip32PrivateKey } from '@blaze-cardano/core';
import type { Bip32PrivateKeyHex } from '@blaze-cardano/core';
import type { Bip32PublicKey } from '@blaze-cardano/core';
import type { Ed25519PrivateNormalKeyHex } from '@blaze-cardano/core';
import type { HexBlob } from '@blaze-cardano/core';
import { NetworkId } from '@blaze-cardano/core';
import type { Provider } from '@blaze-cardano/query';
import { RewardAddress } from '@blaze-cardano/core';
import type { Transaction } from '@blaze-cardano/core';
import { TransactionId } from '@blaze-cardano/core';
import { TransactionUnspentOutput } from '@blaze-cardano/core';
import { TransactionWitnessSet } from '@blaze-cardano/core';
import { Value } from '@blaze-cardano/core';

export declare interface CIP30DataSignature {
    key: CoseKeyCborHex;
    signature: CoseSign1CborHex;
}

/**
 * CIP-30 Wallet interface.
 */
export declare interface CIP30Interface {
    /**
     * Retrieves the network ID of the currently connected account.
     *
     * @returns {Promise<number>} - The network ID of the currently connected account.
     */
    getNetworkId(): Promise<number>;
    /**
     * Retrieves the unspent transaction outputs (UTXOs) controlled by the wallet.
     *
     * @returns {Promise<string[] | undefined>} - The UTXOs controlled by the wallet.
     */
    getUtxos(): Promise<string[] | undefined>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     *
     * @returns {Promise<string>} - The balance of the wallet.
     */
    getBalance(): Promise<string>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     *
     * @returns {Promise<string[]>} - The used addresses controlled by the wallet.
     */
    getUsedAddresses(): Promise<string[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     *
     * @returns {Promise<string[]>} - The unused addresses controlled by the wallet.
     */
    getUnusedAddresses(): Promise<string[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     *
     * @returns {Promise<string>} - The change address.
     */
    getChangeAddress(): Promise<string>;
    /**
     * Retrieves all reward addresses owned by the wallet.
     *
     * @returns {Promise<string[]>} - The reward addresses owned by the wallet.
     */
    getRewardAddresses(): Promise<string[]>;
    /**
     * Requests a user's signature for the unsigned portions of a transaction.
     *
     * @param tx - The transaction CBOR to sign
     * @param partialSign - Whether a partial signature is permitted. If true, the wallet signs what it can. If false, the wallet must sign the full transaction.
     * @returns {Promise<string>} - The signed transaction's witness set, CBOR-encoded.
     */
    signTx(tx: string, partialSign: boolean): Promise<string>;
    /**
     * Request's a user's signature for a given payload conforming to the [CIP-0008 signing spec](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0008/README.md)
     *
     * @param address - The address to sign the payload with. The payment key is used for base, enterprise, and pointer addresses. The staking key is used for reward addresses.
     * @param payload - The payload to sign.
     * @returns {Promise<{ signature: string; key: string }>} - The hex-encoded CBOR bytes of the signature and public key parts of the signing-key.
     */
    signData(address: string, payload: string): Promise<{
        signature: string;
        key: string;
    }>;
    /**
     * Submits a signed transaction to the network.
     *
     * @param tx - The hex-encoded CBOR bytes of the transaction to submit.
     * @returns {Promise<string>} - The transaction ID of the submitted transaction.
     */
    submitTx(tx: string): Promise<string>;
    /**
     * Retrieves all collateral UTXOs owned by the wallet.
     *
     * @returns {Promise<string[]>} - The hex-encoded CBOR bytes of the collateral UTXOs owned by the wallet.
     */
    getCollateral(): Promise<string[]>;
}

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

declare type CoseKeyCborHex = HexBlob;

declare type CoseSign1CborHex = HexBlob;

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

/**
 * The namespace of the wallet.
 */
export declare type Namespace = "nami" | "eternl" | "flint" | "gerowallet" | "nufi" | "begin" | "lace" | "yoroi";

/**
 * The URL of the wallet.
 */
declare type Url = `${"http" | "https"}://${string}`;

/**
 * Abstract class for Wallet.
 */
export declare abstract class Wallet {
    /**
     * Retrieves the network ID of the currently connected account.
     * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
     */
    abstract getNetworkId(): Promise<NetworkId>;
    /**
     * Retrieves the UnspentOutputs controlled by the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The UnspentOutputs controlled by the wallet.
     */
    abstract getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     * @returns {Promise<Value>} - The balance of the wallet.
     */
    abstract getBalance(): Promise<Value>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
     */
    abstract getUsedAddresses(): Promise<Address[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
     */
    abstract getUnusedAddresses(): Promise<Address[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     * @returns {Promise<Address>} - The change address.
     */
    abstract getChangeAddress(): Promise<Address>;
    /**
     * Retrieves the reward addresses controlled by the wallet.
     * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
     */
    abstract getRewardAddresses(): Promise<RewardAddress[]>;
    /**
     * Requests a transaction signature from the wallet.
     * @param {Transaction} tx - The transaction to sign.
     * @param {boolean} partialSign - Whether to partially sign the transaction.
     * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
     */
    abstract signTransaction(tx: Transaction, partialSign: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<Cip30DataSignature>} - The signed data.
     */
    abstract signData(address: Address, payload: string): Promise<CIP30DataSignature>;
    /**
     * Posts a transaction through the wallet.
     * @param {Transaction} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
     */
    abstract postTransaction(tx: Transaction): Promise<TransactionId>;
    /**
     * Retrieves the collateral UnspentOutputs for the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
     */
    abstract getCollateral(): Promise<TransactionUnspentOutput[]>;
}

/**
 * The interface for a wallet.
 */
declare interface Wallet_2 {
    namespace: Namespace;
    name: string;
    icon?: string;
    websiteUrl: Url;
}

/**
 * The details of the wallets.
 */
export declare const WalletDetails: Wallet_2[];

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

export { }
