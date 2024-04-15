import { HexBlob } from "../translucent-core";

type CoseSign1CborHex = HexBlob;
type CoseKeyCborHex = HexBlob;

export interface Cip30DataSignature {
  key: CoseKeyCborHex;
  signature: CoseSign1CborHex;
}

/**
 * CIP-30 Wallet interface.
 */
export interface WalletInterface {
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
