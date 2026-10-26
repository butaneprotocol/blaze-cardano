import type {
  ProtocolParameters,
  SubTransaction,
  Transaction,
  TransactionId,
  TransactionWitnessSet,
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
  wallet: WalletType;
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
    return new TxBuilder(this.params)
      .setNetworkId(this.provider.network)
      .addPreCompleteHook(async (tx) => {
        const myUtxos = await this.wallet.getUnspentOutputs();
        const changeAddress = await this.wallet.getChangeAddress();
        tx.setNetworkId(await this.wallet.getNetworkId())
          .addUnspentOutputs(myUtxos)
          // We do not want to override the change address if it was already set
          .setChangeAddress(changeAddress, false)
          .useEvaluator(
            (x, y) => this.provider.evaluateTransaction(x, y),
            false,
          );
      });
  }

  /**
   * Signs a transaction using the wallet.
   * @param {Transaction} tx - The transaction to sign.
   * @returns {Promise<Transaction>} - The signed transaction.
   */
  async signTransaction(tx: Transaction): Promise<Transaction> {
    const signed = await this.wallet.signTransaction(tx, true);
    tx.setWitnessSet(mergeVkeys(tx.witnessSet(), signed, "signTransaction"));
    return tx;
  }

  /**
   * Signs a CIP-0118 sub-transaction using the wallet.
   * @param {SubTransaction} subTx - The sub-transaction to sign.
   * @returns {Promise<SubTransaction>} - The signed sub-transaction.
   * @throws {Error} If the wallet can't sign sub-transactions.
   * @experimental CIP-0118 is not live on mainnet; this API may change.
   */
  async signSubTransaction(subTx: SubTransaction): Promise<SubTransaction> {
    if (!this.wallet.signSubTransaction) {
      throw new Error(
        "signSubTransaction: this wallet can't sign sub-transactions",
      );
    }
    const signed = await this.wallet.signSubTransaction(subTx, true);
    subTx.setWitnessSet(
      mergeVkeys(subTx.witnessSet(), signed, "signSubTransaction"),
    );
    return subTx;
  }

  /**
   * Submits a transaction to the blockchain.
   * @param {Transaction} tx - The transaction to submit.
   * @returns {Promise<TransactionId>} - The transaction ID.
   * @throws {Error} If the transaction submission fails.
   * @remarks
   * This method sends the provided transaction to the blockchain network
   * using the configured wallet, or the configured provider if set.
   */
  async submitTransaction(
    tx: Transaction,
    useProvider?: boolean,
  ): Promise<TransactionId> {
    return useProvider
      ? this.provider.postTransactionToChain(tx)
      : this.wallet.postTransaction(tx);
  }
}

/** Adds the wallet's vkey witnesses in `signed` to `witnessSet`, refusing keys it already has. */
function mergeVkeys(
  witnessSet: TransactionWitnessSet,
  signed: TransactionWitnessSet,
  caller: string,
): TransactionWitnessSet {
  const vkeys = witnessSet.vkeys()?.toCore() ?? [];
  const signedKeys = signed.vkeys();
  if (!signedKeys) {
    throw new Error(`${caller}: no signed keys in wallet witness response`);
  }
  if (
    signedKeys.toCore().some(([vkey]) => vkeys.some(([key2]) => vkey == key2))
  ) {
    throw new Error(`${caller}: some keys were already signed`);
  }
  witnessSet.setVkeys(
    CborSet.fromCore([...signedKeys.toCore(), ...vkeys], VkeyWitness.fromCore),
  );
  return witnessSet;
}
