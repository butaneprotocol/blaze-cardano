import type {
  RewardAddress,
  TransactionId,
  TransactionUnspentOutput,
  Value,
  Transaction,
  Bip32PrivateKeyHex,
  Bip32PublicKey,
} from "@blaze-cardano/core";
import {
  Address,
  AddressType,
  TransactionWitnessSet,
  CredentialType,
  VkeyWitness,
  CborSet,
  HexBlob,
  Bip32PrivateKey,
  NetworkId,
  Hash28ByteBase16,
} from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Wallet, CIP30DataSignature } from "./types";
import * as value from "@blaze-cardano/tx/value";
import { signData } from "./utils";

/**
 * Wallet class that interacts with the HotWallet.
 */
export class HotWallet implements Wallet {
  private provider: Provider;
  private signingKey: Bip32PrivateKey;
  private stakeSigningKey: Bip32PrivateKey | undefined;
  private publicKey: Bip32PublicKey;
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
  private constructor(
    address: Address,
    rewardAddress: RewardAddress | undefined,
    signingKey: Bip32PrivateKey,
    publicKey: Bip32PublicKey,
    provider: Provider,
    stakePaymentKey?: Bip32PrivateKey,
  ) {
    this.address = address;
    this.rewardAddress = rewardAddress;
    this.networkId = this.address.getNetworkId() as NetworkId;
    this.signingKey = signingKey;
    this.publicKey = publicKey;
    this.provider = provider;
    this.stakeSigningKey = stakePaymentKey;
  }

  private static harden = (num: number): number => 0x80000000 + num;

  static async generateAccountAddressFromMasterkey(
    masterkey: Bip32PrivateKey,
    networkId: NetworkId = NetworkId.Testnet,
    addressType: AddressType = AddressType.BasePaymentKeyStakeKey,
  ): Promise<{
    address: Address;
    paymentKey: Bip32PrivateKey;
    stakePaymentKey: Bip32PrivateKey;
    publicKey: Bip32PublicKey;
  }> {
    if (
      addressType !== AddressType.BasePaymentKeyStakeKey &&
      addressType !== AddressType.EnterpriseKey
    ) {
      throw new Error(
        "Hot wallets only support the BasePaymentKeyStakeKey and EnterpriseKey adresses!",
      );
    }

    const accountKey = await masterkey.derive([
      this.harden(1852),
      this.harden(1815),
      this.harden(0),
    ]);

    // 1852H/1815H/0H/0/0
    const paymentKey = await accountKey.derive([0, 0]);
    const stakePaymentKey = await accountKey.derive([2, 0]);

    const address = new Address({
      type: addressType,
      networkId: networkId,
      paymentPart: {
        type: CredentialType.KeyHash,
        hash: Hash28ByteBase16.fromEd25519KeyHashHex(
          (await (await paymentKey.toPublic()).toRawKey().hash()).hex(),
        ),
      },
      delegationPart:
        addressType === AddressType.EnterpriseKey
          ? undefined
          : {
              type: CredentialType.KeyHash,
              // 1852H/1815H/0H/2/0
              hash: Hash28ByteBase16.fromEd25519KeyHashHex(
                (
                  await (await (await accountKey.derive([2, 0])).toPublic())
                    .toRawKey()
                    .hash()
                ).hex(),
              ),
            },
    });

    return {
      address,
      paymentKey,
      stakePaymentKey,
      publicKey: await paymentKey.toPublic(),
    };
  }

  static async fromMasterkey(
    masterkey: Bip32PrivateKeyHex,
    provider: Provider,
    networkId: NetworkId = NetworkId.Testnet,
    addressType: AddressType = AddressType.BasePaymentKeyStakeKey,
  ): Promise<HotWallet> {
    const rootKey = Bip32PrivateKey.fromHex(masterkey);

    const { address, paymentKey, stakePaymentKey, publicKey } =
      await this.generateAccountAddressFromMasterkey(
        rootKey,
        networkId,
        addressType,
      );

    return new HotWallet(
      address,
      address.asReward(),
      paymentKey,
      publicKey,
      provider,
      stakePaymentKey,
    );
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
   * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
   */
  async getRewardAddresses(): Promise<RewardAddress[]> {
    return this.rewardAddress ? [this.rewardAddress] : [];
  }

  /**
   * Requests a transaction signature from the wallet.
   * @param {string} tx - The transaction to sign.
   * @param {boolean} partialSign - Whether to partially sign the transaction.
   * @param {boolean} signWithStakeKey - Whether to also sign the transaction with the stake key.
   * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
   */
  async signTransaction(
    tx: Transaction,
    partialSign: boolean = true,
    signWithStakeKey: boolean = false,
  ): Promise<TransactionWitnessSet> {
    if (partialSign == false) {
      throw new Error(
        "signTx: Hot wallet only supports partial signing = true",
      );
    }

    const signature = await this.signingKey
      .toRawKey()
      .sign(HexBlob(tx.getId()));

    const tws = new TransactionWitnessSet();

    const payemntVkw = new VkeyWitness(
      this.publicKey.toRawKey().hex(),
      signature.hex(),
    );

    const vkeys = [payemntVkw.toCore()];

    if (signWithStakeKey) {
      if (!this.stakeSigningKey) {
        throw new Error(
          "signTx: Signing with stake key requested but no stake key is available",
        );
      }
      const stakeSignature = await this.stakeSigningKey
        .toRawKey()
        .sign(HexBlob(tx.getId()));
      const stakePublicKey = (await this.stakeSigningKey.toPublic())
        .toRawKey()
        .hex();
      const stakeVkw = new VkeyWitness(stakePublicKey, stakeSignature.hex());

      vkeys.push(stakeVkw.toCore());
    }

    tws.setVkeys(CborSet.fromCore(vkeys, VkeyWitness.fromCore));
    return tws;
  }

  /**
   * Requests signed data from the wallet.
   * @param {Address} address - The address to sign the data with.
   * @param {string} payload - The data to sign.
   * @returns {Promise<CIP30DataSignature>} - The signed data.
   */
  async signData(
    address: Address,
    payload: string,
  ): Promise<CIP30DataSignature> {
    const paymentKey = address.getProps().paymentPart;
    const signingPublic = await this.signingKey.toPublic();
    const stakeSigningPublic = await this.stakeSigningKey?.toPublic();
    const signingKeyHash = await signingPublic.toRawKey().hash();
    const stakeSigningKeyHash = await stakeSigningPublic?.toRawKey().hash();
    if (!paymentKey)
      throw new Error("signData: Address does not have a payment key");
    const signingKeyMap: Record<string, Bip32PrivateKey> = {};
    if (signingKeyHash)
      signingKeyMap[signingKeyHash.hex().toString()] = this.signingKey;
    if (stakeSigningKeyHash)
      signingKeyMap[stakeSigningKeyHash.hex().toString()] =
        this.stakeSigningKey!;
    const signingKey = signingKeyMap[paymentKey.hash.toString()];
    if (!signingKey)
      throw new Error("signData: Address does not have a signing key");

    return signData(address.toBytes(), payload, signingKey.toRawKey());
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
