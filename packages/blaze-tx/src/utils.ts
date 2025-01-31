import {
  blake2b_256,
  CborReader,
  CborWriter,
  hardCodedProtocolParams,
  type ProtocolParameters,
  type Script,
  type TransactionInput,
  type TransactionOutput,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import type {
  Redeemers,
  TransactionWitnessSet,
  HexBlob,
  Hash32ByteBase16,
  Costmdls,
} from "@blaze-cardano/core";

export function getScriptSize(script: Script): number {
  const cborReader = new CborReader(script.toCbor());
  // cborReader.readTag();
  cborReader.readStartArray();
  cborReader.readInt();
  return cborReader.readByteString().length;
}

/**
 * Calculates the fee for reference scripts in the transaction.
 * This method iterates through the reference inputs, finds the corresponding UTXOs,
 * and calculates the fee based on the size of the Plutus scripts referenced.
 *
 * The fee calculation follows a tiered approach where the base fee increases
 * for each range of script size, as defined in the protocol parameters.
 * See https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0
 *
 * @param {readonly TransactionInput[]} refScripts - An array of reference inputs in the transaction.
 * @returns {number} The calculated fee for all reference scripts.
 * @throws {Error} If a reference input cannot be resolved or if a reference script is not a Plutus script.
 */
export function calculateReferenceScriptFee(
  refScripts: Script[],
  params: ProtocolParameters
): number {
  let referenceScriptSize = refScripts.reduce(
    (acc, refScript) => acc + getScriptSize(refScript),
    0
  );

  const { base, multiplier, range } = params.minFeeReferenceScripts!;
  let baseFee = base;
  let refFee = 0;

  while (referenceScriptSize > 0) {
    refFee += Math.min(range, referenceScriptSize) * baseFee;
    referenceScriptSize -= range;
    baseFee *= multiplier;
  }

  return refFee;
}

/**
 * This methods calculates the minimum ada required for a transaction output.
 * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
 * @param {number} coinsPerUtxoByte - The coinsPerUtxoByte value from the protocol parameters.
 * @returns {bigint} The minimum ada required for the output.
 */
export function calculateMinAda(
  output: TransactionOutput,
  coinsPerUtxoByte?: number
): bigint {
  const byteLength = BigInt(output.toCbor().length / 2);
  return (
    BigInt(coinsPerUtxoByte || hardCodedProtocolParams.coinsPerUtxoByte) *
    (byteLength + 160n)
  );
}

/**
 * Returns the effective coin value of the utxo substracting the min utxo needed for the multiasset in the utxo
 *
 * @param {TransactionUnspentOutput} utxo - The utxo to calculate the effective coin value
 * @returns {bigint} The effective coin value of the utxo
 * */
export function getUtxoEffectiveCoin(utxo: TransactionUnspentOutput): bigint {
  const output = utxo.output();
  const multiasset = output.amount().multiasset();
  const hasMultiasset = multiasset && multiasset.size > 0;
  const outputMinAda = calculateMinAda(output);
  return hasMultiasset
    ? output.amount().coin() - outputMinAda
    : output.amount().coin();
}

/**
 * Wraps JSON.stringify with a serializer for bigints.
 * @param {any} value The value you want to stringify.
 * @returns
 */
export const stringifyBigint: typeof JSON.stringify = (value) =>
  JSON.stringify(value, (_k, v) =>
    typeof v === "bigint" ? v.toString() + "n" : v
  );

/**
 * Sorts a list of UTxOs by highest total value first.
 * @param {TransactionUnspentOutput[]} inputs A list of UTxOs to sort.
 * @returns {TransactionUnspentOutput[]}
 */
export function sortLargestFirst(
  inputs: TransactionUnspentOutput[]
): TransactionUnspentOutput[] {
  return [...inputs].sort((a, b) => {
    const lovelaceA = Number(a.output().amount().coin());
    const lovelaceB = Number(b.output().amount().coin());

    if (lovelaceA === lovelaceB) {
      const aMultiAssetCount = a.output().amount().multiasset()?.size || 0;
      const bMultiAssetCount = a.output().amount().multiasset()?.size || 0;
      // Add 1 for lovelace.
      return (
        Object.keys(aMultiAssetCount + 1).length -
        Object.keys(bMultiAssetCount + 1).length
      );
    }
    return -1 * (lovelaceA - lovelaceB);
  });
}

/**
 * Utility function to compare the equality of two UTxOs.
 * @param {TransactionUnspentOutput} self
 * @param {TransactionUnspentOutput} that
 * @returns {boolean}
 */
export const isEqualUTxO = (
  self: TransactionUnspentOutput,
  that: TransactionUnspentOutput
) => isEqualInput(self.input(), that.input());

/**
 * Utility function to compare the equality of two inputs.
 * @param {TransactionInput} self
 * @param {TransactionInput} that
 * @returns {boolean}
 */
export const isEqualInput = (self: TransactionInput, that: TransactionInput) =>
  self.transactionId() === that.transactionId() &&
  self.index() === that.index();
export interface IScriptData {
  redeemersEncoded: string;
  datumsEncoded: string | undefined;
  costModelsEncoded: string;
  hashedData: HexBlob;
  scriptDataHash: Hash32ByteBase16;
}

/**
 * Calculates the correct script data hash for a transaction
 *
 * Separate from the `getScriptData` method in `TxBuilder` to allow for more thorough testing
 * This is heavily documented here:
 * https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/cddl-files/conway.cddl#L423-L490
 *
 * @param redeemers - The redeemers of the transaction
 * @param datums - The datums in the witness set of the transaction
 * @param usedCostModels - The cost models for any languages used in the transaction
 */
export function computeScriptData(
  redeemers: Redeemers,
  datums: ReturnType<TransactionWitnessSet["plutusData"]>, // TODO: weird import shenanigans
  usedCostModels: Costmdls
): IScriptData | undefined {
  const writeDatums = datums && (datums?.size() ?? 0) > 0;
  // If there are no redeemers *or* datums in the witness set, we don't need a script data hash at all
  if (redeemers.size() == 0 && !writeDatums) {
    return undefined;
  }

  // Encode the relevant types to CBOR
  const redeemersEncoded = Buffer.from(redeemers.toCbor(), "hex");
  const datumsEncoded = writeDatums
    ? Buffer.from(datums.toCbor(), "hex")
    : undefined;
  const costModelsEncoded = Buffer.from(
    usedCostModels.languageViewsEncoding(),
    "hex"
  );

  // Write out the script data hash to the cbor writer
  // NOTE: this uses bytestring concatenation, and will not result in valid CBOR
  const writer = new CborWriter();
  writer.writeEncodedValue(redeemersEncoded);
  if (writeDatums) {
    writer.writeEncodedValue(datumsEncoded!);
  }
  writer.writeEncodedValue(costModelsEncoded);

  // Compute the hash
  const hashedData = writer.encodeAsHex();
  const scriptDataHash = blake2b_256(hashedData);
  return {
    redeemersEncoded: redeemersEncoded.toString("hex"),
    datumsEncoded: writeDatums ? datumsEncoded!.toString("hex") : undefined,
    costModelsEncoded: costModelsEncoded.toString("hex"),
    hashedData,
    scriptDataHash,
  };
}
