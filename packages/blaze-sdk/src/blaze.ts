import { Provider } from "@blazecardano/query";
import { TxBuilder } from "@blazecardano/tx";
import { Wallet } from "@blazecardano/wallet";
import { Transaction } from "@blazecardano/core";

/**
 * The Blaze class is used to create and manage Cardano transactions.
 * It requires a provider and a wallet to interact with the blockchain and manage funds.
 */
export class Blaze<ProviderType extends Provider, WalletType extends Wallet> {
  provider: ProviderType;
  wallet: WalletType;

  /**
   * Constructs a new instance of the blaze class.
   * @param {ProviderType} provider - The provider to use for interacting with the blockchain.
   * @param {WalletType} wallet - The wallet to use for managing funds.
   */
  constructor(provider: ProviderType, wallet: WalletType) {
    this.provider = provider;
    this.wallet = wallet;
  }

  /**
   * Creates a new transaction using the provider and wallet.
   * @returns {TxBuilder} - The newly created transaction builder.
   */
  async newTransaction() {
    const params = await this.provider.getParameters();
    const myUtxos = await this.wallet.getUnspentOutputs();
    const changeAddress = await this.wallet.getChangeAddress();
    return new TxBuilder(params)
      .addUnspentOutputs(myUtxos)
      .setChangeAddress(changeAddress)
      .useEvaluator((x, y) => this.provider.evaluateTransaction(x, y));
  }

  /**
   * Signs a transaction using the wallet.
   * @param {Transaction} tx - The transaction to sign.
   * @returns {Promise<Transaction>} - The signed transaction.
   */
  async signTransaction(tx: Transaction): Promise<Transaction> {
    const signedWs = await this.wallet.signTransaction(tx, true);
    const txWs = tx.witnessSet();
    txWs.setVkeys(signedWs.vkeys()!);
    tx.setWitnessSet(txWs);
    return tx;
  }
}
