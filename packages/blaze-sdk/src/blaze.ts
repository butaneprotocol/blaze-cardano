import type {
  ProtocolParameters,
  Transaction,
  TransactionId,
} from "@blaze-cardano/core";
import { CborSet, VkeyWitness } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { TxBuilder } from "@blaze-cardano/tx";
import type { Wallet } from "@blaze-cardano/wallet";

/**
 * The Blaze class is used to create and manage Cardano transactions.
 * It requires a provider and a wallet to interact with the blockchain and manage funds.
 */
export class Blaze<ProviderType extends Provider, WalletType extends Wallet> {
  readonly provider: ProviderType;
  readonly wallet: WalletType;
  readonly params: ProtocolParameters;

  /**
   * Constructs a new instance of the Blaze class.
   * @param {ProviderType} provider - The provider to use for interacting with the blockchain.
   * @param {WalletType} wallet - The wallet to use for managing funds and signing transactions.
   * @private
   */
  private constructor(
    provider: ProviderType,
    wallet: WalletType,
    params: ProtocolParameters,
  ) {
    this.provider = provider;
    this.wallet = wallet;
    this.params = params;
  }

  static async from<ProviderType extends Provider, WalletType extends Wallet>(
    provider: ProviderType,
    wallet: WalletType,
  ) {
    const params = await provider.getParameters();
    return new Blaze(provider, wallet, params);
  }

  /**
   * Creates a new transaction using the provider and wallet.
   * @returns {TxBuilder} - The newly created transaction builder.
   */
  newTransaction() {
    return new TxBuilder(this.params).addPreCompleteHook(async (tx) => {
      const myUtxos = await this.wallet.getUnspentOutputs();
      const changeAddress = await this.wallet.getChangeAddress();
      tx.setNetworkId(await this.wallet.getNetworkId())
        .addUnspentOutputs(myUtxos)
        .setChangeAddress(changeAddress)
        .useEvaluator((x, y) => this.provider.evaluateTransaction(x, y));
    });
  }

  /**
   * Signs a transaction using the wallet.
   * @param {Transaction} tx - The transaction to sign.
   * @returns {Promise<Transaction>} - The signed transaction.
   */
  async signTransaction(tx: Transaction): Promise<Transaction> {
    const signed = await this.wallet.signTransaction(tx, true);
    const ws = tx.witnessSet();
    const vkeys = ws.vkeys()?.toCore() ?? [];

    const signedKeys = signed.vkeys();
    if (!signedKeys) {
      throw new Error(
        "signTransaction: no signed keys in wallet witness response",
      );
    }

    if (
      signedKeys.toCore().some(([vkey]) => vkeys.some(([key2]) => vkey == key2))
    ) {
      throw new Error("signTransaction: some keys were already signed");
    }

    ws.setVkeys(
      CborSet.fromCore(
        [...signedKeys.toCore(), ...vkeys],
        VkeyWitness.fromCore,
      ),
    );
    tx.setWitnessSet(ws);
    return tx;
  }

  /**
   * Submits a transaction to the blockchain.
   * @param {Transaction} tx - The transaction to submit.
   * @returns {Promise<TransactionId>} - The transaction ID.
   * @throws {Error} If the transaction submission fails.
   * @description This method sends the provided transaction to the blockchain network
   * using the configured provider.
   */
  async submitTransaction(tx: Transaction): Promise<TransactionId> {
    return this.provider.postTransactionToChain(tx);
  }
}
