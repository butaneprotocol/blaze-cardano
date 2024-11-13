import {
  Ed25519PublicKey,
  HexBlob,
  blake2b_224,
  CredentialType,
  signMessage,
  Address,
  AddressType,
  TransactionWitnessSet,
  VkeyWitness,
  CborSet,
  Ed25519SignatureHex,
  derivePublicKey,
} from "@blaze-cardano/core";
import type {
  RewardAddress,
  TransactionId,
  TransactionUnspentOutput,
  Value,
  Transaction,
  Ed25519PrivateNormalKeyHex,
  NetworkId,
} from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Wallet, CIP30DataSignature } from "./types";
import * as value from "@blaze-cardano/tx/value";

/**
 * Wallet class that interacts with the HotSingleWallet.
 * This is like HotWallet, but without key derivation.
 */
export class HotSingleWallet implements Wallet {
  private provider: Provider;
  private paymentSigningKey: Ed25519PrivateNormalKeyHex;
  private paymentPublicKey: Ed25519PublicKey;

  private stakeSigningKey: Ed25519PrivateNormalKeyHex | undefined = undefined;
  private stakePublicKey: Ed25519PublicKey | undefined = undefined;

  readonly address: Address;
  readonly networkId: NetworkId;

  /**
   * Constructs a new instance of the HotSingleWallet class.
   * @param {Ed25519PrivateNormalKeyHex} signingKey - The private signing key of the wallet.
   * @param {NetworkId} networkId - The network ID for the wallet.
   * @param {Provider} provider - The provider for the wallet.
   * @param {Ed25519PrivateNormalKeyHex} stakeSigningKey - An optional private signing key for the delegation part of the wallet. If not provided, the wallet will have an enterprise address.
   */
  constructor(
    paymentSigningKey: Ed25519PrivateNormalKeyHex,
    networkId: NetworkId,
    provider: Provider,
    stakeSigningKey?: Ed25519PrivateNormalKeyHex
  ) {
    this.networkId = networkId;
    this.paymentSigningKey = paymentSigningKey;
    this.paymentPublicKey = Ed25519PublicKey.fromHex(
      derivePublicKey(this.paymentSigningKey)
    );

    if (stakeSigningKey) {
      this.stakeSigningKey = stakeSigningKey;
      this.stakePublicKey = Ed25519PublicKey.fromHex(
        derivePublicKey(this.stakeSigningKey)
      );
    }

    this.address = new Address({
      type: this.stakePublicKey
        ? AddressType.BasePaymentKeyStakeKey
        : AddressType.EnterpriseKey,
      networkId: this.networkId,
      paymentPart: {
        type: CredentialType.KeyHash,
        hash: blake2b_224(HexBlob(this.paymentPublicKey.hex())),
      },
      delegationPart: this.stakePublicKey
        ? {
            type: CredentialType.KeyHash,
            hash: blake2b_224(HexBlob(this.stakePublicKey.hex())),
          }
        : undefined,
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
    return (await this.getUnspentOutputs()).reduce(
      (x, y) => value.merge(x, y.output().amount()),
      value.zero()
    );
  }

  /**
   * Retrieves all used addresses controlled by the wallet.
   * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
   */
  async getUsedAddresses(): Promise<Address[]> {
    return [this.address];
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
   * Always empty in this class instance.
   * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
   */
  async getRewardAddresses(): Promise<RewardAddress[]> {
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
    partialSign: boolean = true
  ): Promise<TransactionWitnessSet> {
    if (partialSign == false) {
      throw new Error(
        "signTx: Hot single wallet only supports partial signing = true"
      );
    }

    const signature = signMessage(HexBlob(tx.getId()), this.paymentSigningKey);
    const tws = new TransactionWitnessSet();
    const vkw = new VkeyWitness(
      this.paymentPublicKey.hex(),
      Ed25519SignatureHex(signature)
    );
    tws.setVkeys(CborSet.fromCore([vkw.toCore()], VkeyWitness.fromCore));
    return tws;
  }

  /**
   * Requests signed data from the wallet.
   * Not supported, will always throw an error.
   * @param {Address} address - The address to sign the data with.
   * @param {string} payload - The data to sign.
   * @returns {Promise<CIP30DataSignature>} - The signed data.
   */
  async signData(
    _address: Address,
    _payload: string
  ): Promise<CIP30DataSignature> {
    throw new Error(
      "signData: Hot single wallet does not yet support data signing"
    );
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
