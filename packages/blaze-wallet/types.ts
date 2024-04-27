import {
  Address,
  HexBlob,
  NetworkId,
  RewardAddress,
  Transaction,
  TransactionId,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Value,
} from "../blaze-core";

type CoseSign1CborHex = HexBlob;
type CoseKeyCborHex = HexBlob;

export interface CIP30DataSignature {
  key: CoseKeyCborHex;
  signature: CoseSign1CborHex;
}

/**
 * CIP-30 Wallet interface.
 */
export interface CIP30Interface {
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
  signData(
    address: string,
    payload: string,
  ): Promise<{ signature: string; key: string }>;
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
 * Abstract class for Wallet.
 */
export abstract class Wallet {
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
  abstract signTransaction(
    tx: Transaction,
    partialSign: boolean,
  ): Promise<TransactionWitnessSet>;

  /**
   * Requests signed data from the wallet.
   * @param {Address} address - The address to sign the data with.
   * @param {string} payload - The data to sign.
   * @returns {Promise<Cip30DataSignature>} - The signed data.
   */
  abstract signData(
    address: Address,
    payload: string,
  ): Promise<CIP30DataSignature>;

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
