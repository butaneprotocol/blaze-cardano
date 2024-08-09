import {
  type ProtocolParameters,
  type TransactionUnspentOutput,
  fromHex,
} from "@blaze-cardano/core";

/**
 * Calculates the fee for reference scripts in the transaction.
 * This method iterates through the reference inputs, finds the corresponding UTXOs,
 * and calculates the fee based on the size of the Plutus scripts referenced.
 *
 * The fee calculation follows a tiered approach where the base fee increases
 * for each range of script size, as defined in the protocol parameters.
 * See https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0
 *
 * @param {readonly TransactionInput[]} refUtxos - An array of reference inputs in the transaction.
 * @returns {number} The calculated fee for all reference scripts.
 * @throws {Error} If a reference input cannot be resolved or if a reference script is not a Plutus script.
 */
export function calculateReferenceScriptFee(
  refUtxos: TransactionUnspentOutput[],
  params: ProtocolParameters,
): number {
  let referenceScriptSize = refUtxos.reduce((acc, refUtxo) => {
    // const refUtxo = Array.from(this.utxoScope.values()).find(
    //   (x) => x.input().toCbor() == refInput.toCbor(),
    // );
    if (!refUtxo) {
      throw new Error(
        "calculateReferenceScriptFee: could not resolve some reference input",
      );
    }
    const script = refUtxo.output().scriptRef()?.toCore();
    if (!script) return acc;
    if (script.__type !== "plutus") {
      throw new Error(
        "calculateReferenceScriptFee: reference script is not a Plutus script",
      );
    }
    return acc + fromHex(script.bytes).length;
  }, 0);

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
