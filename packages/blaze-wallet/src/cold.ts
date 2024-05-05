import type {
  Address,
  NetworkId,
  RewardAddress,
  TransactionId,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Value,
  Transaction,
} from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Wallet, CIP30DataSignature } from "./types";
import * as value from "@blaze-cardano/tx/value";

/**
 * Wallet class that interacts with the ColdWallet.
 */
export class ColdWallet implements Wallet {
  private provider: Provider;
  readonly address: Address;
  readonly networkId: NetworkId;

  /**
   * Constructs a new instance of the ColdWallet class.
   * @param {Address} address - The address of the wallet.
   * @param {NetworkId} networkId - The network ID of the wallet.
   * @param {Provider} provider - The provider of the wallet.
   */
  constructor(address: Address, networkId: NetworkId, provider: Provider) {
    this.networkId = networkId;

    this.address = address;
    this.provider = provider;
  }

  /**
   * Retrieves the network ID of the currently connected account.
   * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
   */
  async getNetworkId(): Promise<NetworkId> {
    return this.networkId;
  }

  /**
   * Retrieves the UTxO(s) controlled by the wallet.
   * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
   */
  async getUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    return this.provider.getUnspentOutputs(this.address);
  }

  /**
   * Retrieves the total available balance of the wallet, encoded in CBOR.
   * @returns {Promise<Value>} - The balance of the wallet.
   */
  async getBalance(): Promise<Value> {
    let balance = value.zero();
    const utxos = await this.getUnspentOutputs();
    for (const utxo of utxos) {
      balance = value.merge(balance, utxo.output().amount());
    }
    return balance;
  }

  /**
   * Retrieves all used addresses controlled by the wallet.
   * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
   */
  async getUsedAddresses(): Promise<Address[]> {
    return Promise.resolve([this.address]);
  }

  /**
   * Retrieves all unused addresses controlled by the wallet.
   * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
   */
  async getUnusedAddresses(): Promise<Address[]> {
    return [];
  }

  /**
   * Retrieves an address owned by the wallet which should be used to return transaction change.
   * @returns {Promise<Address>} - The change address.
   */
  async getChangeAddress(): Promise<Address> {
    return this.address;
  }

  /**
   * Retrieves the reward addresses controlled by the wallet.
   * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
   */
  async getRewardAddresses(): Promise<RewardAddress[]> {
    // todo!
    return [];
  }

  /**
   * Requests a transaction signature from the wallet.
   * @param {string} tx - The transaction to sign.
   * @param {boolean} partialSign - Whether to partially sign the transaction.
   * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
   */
  async signTransaction(
    _tx: Transaction,
    _partialSign: boolean = true,
  ): Promise<TransactionWitnessSet> {
    throw new Error(
      "ColdWallet signTransaction: Cold wallet cannot sign a transaction!",
    );
  }

  /**
   * Requests signed data from the wallet.
   * @param {Address} address - The address to sign the data with.
   * @param {string} payload - The data to sign.
   * @returns {Promise<CIP30DataSignature>} - The signed data.
   */
  async signData(
    _address: Address,
    _payload: string,
  ): Promise<CIP30DataSignature> {
    throw new Error("ColdWallet signData: Cold wallet cannot sign data!");
  }

  /**
   * Submits a transaction through the wallet.
   * @param {string} tx - The transaction to submit.
   * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
   */
  async postTransaction(tx: Transaction): Promise<TransactionId> {
    return this.provider.postTransactionToChain(tx);
  }

  /**
   * Retrieves the collateral UTxO(s) for the wallet.
   * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
   */
  async getCollateral(): Promise<TransactionUnspentOutput[]> {
    return [];
  }
}
