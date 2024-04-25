import { Provider } from '../translucent-query'
import { TxBuilder } from '../translucent-tx'
import { Wallet } from '../translucent-wallet'

/**
 * The Translucent class is used to create and manage Cardano transactions.
 * It requires a provider and a wallet to interact with the blockchain and manage funds.
 */
export class Translucent {
  provider: Provider
  wallet: Wallet

  /**
   * Constructs a new instance of the Translucent class.
   * @param {Provider} provider - The provider to use for interacting with the blockchain.
   * @param {Wallet} wallet - The wallet to use for managing funds.
   */
  constructor(provider: Provider, wallet: Wallet) {
    this.provider = provider
    this.wallet = wallet
  }

  /**
   * Creates a new transaction using the provided provider and wallet.
   * @returns {TxBuilder} - The newly created transaction builder.
   */
  async newTransaction() {
    const params = await this.provider.getParameters()
    const myUtxos = await this.wallet.getUtxos()
    const changeAddress = await this.wallet.getChangeAddress()
    return new TxBuilder(params)
      .addUnspentOutputs(myUtxos)
      .setChangeAddress(changeAddress)
      .useEvaluator((x, y) => this.provider.evaluateTransaction(x, y))
  }
}
