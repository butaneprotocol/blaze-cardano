import {
  Address,
  AddressType,
  Ed25519PublicKeyHex,
  Ed25519PrivateNormalKeyHex,
  NetworkId,
  RewardAddress,
  TransactionId,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Value,
  CredentialType,
  Transaction,
  VkeyWitness,
  Ed25519SignatureHex,
  CborSet,
  blake2b_224,
  HexBlob,
  derivePublicKey,
  signMessage,
} from "@blaze-cardano/core";
import { Provider } from "@blaze-cardano/query";
import { Wallet, CIP30DataSignature } from "./types";
import * as value from "@blaze-cardano/tx/value";

/**
 * Wallet class that interacts with the HotWallet.
 */
export class HotWallet implements Wallet {
  private provider: Provider;
  private privateKey: Ed25519PrivateNormalKeyHex;
  private publicKey: Ed25519PublicKeyHex;
  readonly address: Address;
  readonly networkId: NetworkId;

  /**
   * Constructs a new instance of the HotWallet class.
   * @param {Ed25519PrivateNormalKeyHex} privateKey - The private key of the wallet.
   * @param {NetworkId} networkId - The network ID of the wallet.
   * @param {Provider} provider - The provider of the wallet.
   */
  constructor(
    privateKey: Ed25519PrivateNormalKeyHex,
    networkId: NetworkId,
    provider: Provider,
  ) {
    this.networkId = networkId;
    // Set private key (raw bytes)
    this.privateKey = privateKey;
    // Use noble derive public key
    this.publicKey = derivePublicKey(this.privateKey);

    this.address = new Address({
      type: AddressType.EnterpriseKey,
      networkId: this.networkId,
      paymentPart: {
        type: CredentialType.KeyHash,
        hash: blake2b_224(HexBlob(this.publicKey)),
      },
    });
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
    let utxos = await this.getUnspentOutputs();
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
    tx: Transaction,
    partialSign: boolean = true,
  ): Promise<TransactionWitnessSet> {
    if (partialSign == false) {
      throw new Error(
        "signTx: Hot wallet only supports partial signing = true",
      );
    }
    let signature = signMessage(HexBlob(tx.getId()), this.privateKey);
    let tws = new TransactionWitnessSet();
    let vkw = new VkeyWitness(this.publicKey, Ed25519SignatureHex(signature));
    tws.setVkeys(CborSet.fromCore([vkw.toCore()], VkeyWitness.fromCore));
    return tws;
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
    throw new Error("signData: Hot wallet does not yet support data signing");
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
