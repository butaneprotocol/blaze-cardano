import {
  type TransactionUnspentOutput,
  type Address,
  type AssetId,
  type TransactionInput,
  type DatumHash,
  type PlutusData,
  type TransactionId,
  type Transaction,
  type ProtocolParameters,
  type Redeemers,
  type NetworkId,
  type Hash28ByteBase16,
  type SlotConfig,
  Slot,
  RedeemerPurpose,
  RedeemerTag,
  Script,
  getBurnAddress,
  SLOT_CONFIG_NETWORK,
} from "@blaze-cardano/core";

export type NetworkName =
  | "cardano-mainnet"
  | "cardano-preprod"
  | "cardano-preview"
  | "cardano-sanchonet"
  | "unknown";

/**
 * Abstract class for the Provider.
 * @remarks
 * This class provides an interface for interacting with the blockchain.
 */
export abstract class Provider {
  network: NetworkId;
  networkName: NetworkName;

  constructor(network: NetworkId, networkName: NetworkName) {
    this.network = network;
    this.networkName = networkName;
  }

  /**
   * Retrieves the parameters for a transaction.
   * @returns {Promise<ProtocolParameters>} - The parameters for a transaction.
   */
  abstract getParameters(): Promise<ProtocolParameters>;

  /**
   * Retrieves the unspent outputs for a given address.
   * @param {Address} address - The address to retrieve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address.
   */
  abstract getUnspentOutputs(
    address: Address,
  ): Promise<TransactionUnspentOutput[]>;

  /**
   * Retrieves the unspent outputs for a given address and asset.
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
   * @param {AssetId} unit - The NFT to retrieve the unspent output for.
   * @returns {Promise<TransactionUnspentOutput>} - The unspent output for the NFT.
   */
  abstract getUnspentOutputByNFT(
    unit: AssetId,
  ): Promise<TransactionUnspentOutput>;

  /**
   * Resolves the unspent outputs for a given set of transaction inputs.
   * @param {TransactionInput[]} txIns - The transaction inputs to resolve unspent outputs for.
   * @returns {Promise<TransactionUnspentOutput[]>} - The resolved unspent outputs.
   */
  abstract resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]>;

  /**
   * Resolves the datum for a given datum hash.
   * @param {DatumHash} datumHash - The datum hash to resolve the datum for.
   * @returns {Promise<PlutusData>} - The resolved datum.
   */
  abstract resolveDatum(datumHash: DatumHash): Promise<PlutusData>;

  /**
   * Waits for the confirmation of a given transaction.
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
   * @param {Transaction} tx - The transaction to post to the chain.
   * @returns {Promise<TransactionId>} - The id of the posted transaction.
   */
  abstract postTransactionToChain(tx: Transaction): Promise<TransactionId>;

  /**
   * Evaluates the transaction.
   * @remarks
   * It does so by calculating the exunits for each redeemer, applying them, and returning the redeemers.
   * This makes a remote call to the provider in most cases, however may use a virtual machine in some implementations.
   * @param {Transaction} tx - The transaction to evaluate.
   * @param {TransactionUnspentOutput[]} additionalUtxos - The additional unspent outputs to consider.
   * @returns {Promise<Redeemers>} - The redeemers with applied exunits.
   */
  abstract evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers>;

  /**
   * Resolves the script deployment by finding a UTxO containing the script reference.
   * @param {Script | Hash28ByteBase16} script - The script or its hash to resolve.
   * @param {Address} [address] - The address to search for the script deployment. Defaults to a burn address.
   * @returns {Promise<TransactionUnspentOutput | undefined>} - The UTxO containing the script reference, or undefined if not found.
   * @remarks
   * This is a default implementation that works but may not be optimal.
   * Subclasses of Provider should implement their own version for better performance.
   *
   * The method searches for a UTxO at the given address (or a burn address by default)
   * that contains a script reference matching the provided script or script hash.
   * @example
   * ```typescript
   * const scriptUtxo = await provider.resolveScriptRef(myScript);
   * if (scriptUtxo) {
   *   console.log("Script found in UTxO:", scriptUtxo.input().toCore());
   * } else {
   *   console.log("Script not found");
   * }
   * ```
   */
  async resolveScriptRef(
    script: Script | Hash28ByteBase16,
    address: Address = getBurnAddress(this.network),
  ): Promise<TransactionUnspentOutput | undefined> {
    const utxos = await this.getUnspentOutputs(address);
    if (script instanceof Script) {
      script = script.hash();
    }
    return utxos.find((utxo) => utxo.output().scriptRef()?.hash() === script);
  }

  /**
   * Get the slot config, which describes how to translate between slots and unix timestamps.
   */
  getSlotConfig(): SlotConfig {
    // TODO: this is brittle; in theory this should work with the era histories; also, networkName is awkward
    switch (this.networkName) {
      case "cardano-mainnet":
        return SLOT_CONFIG_NETWORK.Mainnet;
      case "cardano-preprod":
        return SLOT_CONFIG_NETWORK.Preprod;
      case "cardano-preview":
        return SLOT_CONFIG_NETWORK.Preview;
      default:
        throw new Error("unsupported network");
    }
  }
  /**
   * Translate a unix millisecond timestamp to slot, according to the providers network
   * @param unix_millis Milliseconds since midnight, Jan 1 1970
   * @returns The slot in the relevant network
   */
  unixToSlot(unix_millis: bigint | number): Slot {
    const slotConfig = this.getSlotConfig();

    return Slot(
      (Number(unix_millis) - slotConfig.zeroTime) / slotConfig.slotLength +
        slotConfig.zeroSlot,
    );
  }
  /**
   * Translate a slot to a unix millisecond timestamp
   * @param slot The network slot
   * @returns The milliseconds since midnight, Jan 1 1970
   */
  slotToUnix(slot: Slot | number | bigint): number {
    const slotConfig = this.getSlotConfig();

    return Number(
      slotConfig.zeroTime +
        (Number(slot.valueOf()) - slotConfig.zeroSlot) * slotConfig.slotLength,
    );
  }
}

/**
 * Mapping of RedeemerPurpose to RedeemerTag. Ensures consistency between purpose strings and tag numbers.
 */
export const purposeToTag: { [key: string]: number } = {
  [RedeemerPurpose.spend]: RedeemerTag.Spend,
  [RedeemerPurpose.mint]: RedeemerTag.Mint,
  [RedeemerPurpose.certificate]: RedeemerTag.Cert,
  [RedeemerPurpose.withdrawal]: RedeemerTag.Reward,
  [RedeemerPurpose.vote]: RedeemerTag.Voting,
  [RedeemerPurpose.propose]: RedeemerTag.Proposing,
};
