import {
  CborReader,
  hardCodedProtocolParams,
  type TransactionOutput,
  type TransactionUnspentOutput,
  type ProtocolParameters,
  type Script,
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
  params: ProtocolParameters,
): number {
  let referenceScriptSize = refScripts.reduce(
    (acc, refScript) => acc + getScriptSize(refScript),
    0,
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
  coinsPerUtxoByte?: number,
): bigint {
  const byteLength = BigInt(output.toCbor().length / 2);
  return (
    BigInt(coinsPerUtxoByte || hardCodedProtocolParams.coinsPerUtxoByte) *
    (byteLength + 160n)
  );
}

/**
 * Wraps JSON.stringify with a serializer for bigints.
 * @param {any} value The value you want to stringify.
 * @returns
 */
export const stringifyBigint: typeof JSON.stringify = (value) =>
  JSON.stringify(value, (_k, v) =>
    typeof v === "bigint" ? v.toString() + "n" : v,
  );

/**
 * Sorts a list of UTxOs by highest total value first.
 * @param {TransactionUnspentOutput[]} inputs A list of UTxOs to sort.
 * @returns {TransactionUnspentOutput[]}
 */
export function sortLargestFirst(
  inputs: TransactionUnspentOutput[],
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
  that: TransactionUnspentOutput,
) =>
  self.input().transactionId() === that.input().transactionId() &&
  self.input().index() === that.input().index();
