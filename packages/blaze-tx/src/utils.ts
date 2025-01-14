import {
  blake2b_256,
  CborReader,
  CborWriter,
  type ProtocolParameters,
  type Script,
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
export function computeScriptDataHash(
  redeemers: Redeemers,
  datums: ReturnType<TransactionWitnessSet["plutusData"]>, // TODO: weird import shenanigans
  usedCostModels: Costmdls,
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
    "hex",
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
