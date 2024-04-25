import {
  TransactionUnspentOutput,
  Address,
  AssetId,
  TransactionInput,
  DatumHash,
  PlutusData,
  TransactionId,
  Transaction,
  ProtocolParameters,
  Redeemers,
} from "../translucent-core";

/**
 * Abstract class for the Provider.
 * This class provides an interface for interacting with the blockchain.
 */
export abstract class Provider {
  /**
   * Retrieves the parameters for a transaction.
   *
   * @returns {Promise<ProtocolParameters>} - The parameters for a transaction.
   */
  abstract getParameters(): Promise<ProtocolParameters>;

  /**
   * Retrieves the unspent outputs for a given address.
   *
   * @param {Address} address - The address to retrieve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address.
   */
  abstract getUnspentOutputs(
    address: Address,
  ): Promise<TransactionUnspentOutput[]>;

  /**
   * Retrieves the unspent outputs for a given address and asset.
   *
   * @param {Address} address - The address to retrieve unspent outputs for.
   * @param {AssetId} unit - The asset to retrieve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address and asset.
   */
  abstract getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]>;

  /**
   * Retrieves the unspent output for a given NFT.
   *
   * @param {AssetId} unit - The NFT to retrieve the unspent output for.
   * @returns {Promise<TransactionUnspentOutput>} - The unspent output for the NFT.
   */
  abstract getUnspentOutputByNFT(
    unit: AssetId,
  ): Promise<TransactionUnspentOutput>;

  /**
   * Resolves the unspent outputs for a given set of transaction inputs.
   *
   * @param {TransactionInput[]} txIns - The transaction inputs to resolve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The resolved unspent outputs.
   */
  abstract resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]>;

  /**
   * Resolves the datum for a given datum hash.
   *
   * @param {DatumHash} datumHash - The datum hash to resolve the datum for.
   * @returns {Promise<PlutusData>} - The resolved datum.
   */
  abstract resolveDatum(datumHash: DatumHash): Promise<PlutusData>;

  /**
   * Waits for the confirmation of a given transaction.
   *
   * @param {TransactionId} txId - The transaction id to wait for confirmation.
   * @param {number} [timeout] - The timeout in milliseconds.
   * @returns {Promise<boolean>} - A boolean indicating whether the transaction is confirmed.
   */
  abstract awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean>;

  /**
   * Posts a given transaction to the chain.
   *
   * @param {Transaction} tx - The transaction to post to the chain.
   * @returns {Promise<TransactionId>} - The id of the posted transaction.
   */
  abstract postTransactionToChain(tx: Transaction): Promise<TransactionId>;

  /**
   * Evaluates the transaction by calculating the exunits for each redeemer, applying them, and returning the redeemers.
   * This makes a remote call to the provider in most cases, however may use a virtual machine in some implementations.
   *
   * @param {Transaction} tx - The transaction to evaluate.
   * @param {TransactionUnspentOutput[]} additionalUtxos - The additional unspent outputs to consider.
   * @returns {Promise<Redeemers>} - The redeemers with applied exunits.
   */
  abstract evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers>;
}
