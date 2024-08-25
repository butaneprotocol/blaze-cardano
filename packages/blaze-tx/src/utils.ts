import {
  CborReader,
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
