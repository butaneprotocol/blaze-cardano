import {
  TransactionUnspentOutput,
  Address,
  AssetId,
  TransactionInput,
  DatumHash,
  PlutusData,
  TransactionId,
  Transaction,
  ProtocolParameters
} from '../translucent-core'

/**
 * Interface for the Provider class.
 */
export interface Provider {
  /**
   * Retrieves the parameters for a transaction.
   *
   * @returns {Promise<ProtocolParameters>} - The parameters for a transaction.
   */
  getParameters(): Promise<ProtocolParameters>

  /**
   * Retrieves the unspent outputs for a given address.
   *
   * @param {Address} address - The address to retrieve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address.
   */
  getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>

  /**
   * Retrieves the unspent outputs for a given address and asset.
   *
   * @param {Address} address - The address to retrieve unspent outputs for.
   * @param {AssetId} unit - The asset to retrieve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address and asset.
   */
  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]>

  /**
   * Retrieves the unspent output for a given NFT.
   *
   * @param {AssetId} unit - The NFT to retrieve the unspent output for.
   * @returns {Promise<TransactionUnspentOutput>} - The unspent output for the NFT.
   */
  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>

  /**
   * Resolves the unspent outputs for a given set of transaction inputs.
   *
   * @param {TransactionInput[]} txIns - The transaction inputs to resolve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The resolved unspent outputs.
   */
  resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]>

  /**
   * Resolves the datum for a given datum hash.
   *
   * @param {DatumHash} datumHash - The datum hash to resolve the datum for.
   * @returns {Promise<PlutusData>} - The resolved datum.
   */
  resolveDatum(datumHash: DatumHash): Promise<PlutusData>

  /**
   * Waits for the confirmation of a given transaction.
   *
   * @param {TransactionId} txId - The transaction id to wait for confirmation.
   * @param {number} [timeout] - The timeout in milliseconds.
   * @returns {Promise<boolean>} - A boolean indicating whether the transaction is confirmed.
   */
  awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean>

  /**
   * Posts a given transaction to the chain.
   *
   * @param {Transaction} tx - The transaction to post to the chain.
   * @returns {Promise<TransactionId>} - The id of the posted transaction.
   */
  postTransactionToChain(tx: Transaction): Promise<TransactionId>
}

