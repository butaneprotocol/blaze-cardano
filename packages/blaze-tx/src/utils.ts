import {
  blake2b_256,
  CborReader,
  CborWriter,
  CredentialType,
  type ProtocolParameters,
  type Script,
  type TransactionInput,
  type TransactionOutput,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import type {
  Redeemers,
  TransactionWitnessSet,
  Costmdls,
  AuxiliaryData,
  Hash32ByteBase16,
  Address,
} from "@blaze-cardano/core";
import type { IScriptData } from "./types";

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
  coinsPerUtxoByte: number,
): bigint {
  const byteLength = BigInt(output.toCbor().length / 2);
  return BigInt(coinsPerUtxoByte) * (byteLength + 160n);
}

/**
 * Calculate the required "collateral" the a transaction must put up if it is running smart contracts.
 * This is to prevent DDOS attacks with failing scripts, and must be some percentage above the total fee of the script.
 *
 * @param {bigint} fee The full transaction fee
 * @param {number} collateralPercentage The protocol parameter defining the buffer above the fee that is required
 * @returns {bigint}
 */
export function calculateRequiredCollateral(
  fee: bigint,
  collateralPercentage: number,
): bigint {
  return BigInt(Math.ceil(Number(fee) * (collateralPercentage / 100)));
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
  isEqualInput(self.input(), that.input()) &&
  isEqualOutput(self.output(), that.output());

/**
 * Utility function to compare the equality of two inputs.
 * @param {TransactionInput} self
 * @param {TransactionInput} that
 * @returns {boolean}
 */
export const isEqualInput = (
  self: TransactionInput,
  that: TransactionInput,
): boolean => self.toCbor() === that.toCbor();

/**
 * Utility function to compare the equality of two outputs.
 * @param {TransactionOutput} self
 * @param {TransactionOutput} that
 * @returns {boolean}
 */
export const isEqualOutput = (
  self: TransactionOutput,
  that: TransactionOutput,
): boolean => self.toCbor() === that.toCbor();

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

/**
 * Given an array and a string, it mutates the provided array and inserts
 * the string after the closest match. It returns the index at which the
 * string was inserted.
 *
 * @param {string[]} arr An array of strings to mutate.
 * @param {string} el The element to insert in provided array.
 * @returns {number} The index of the insert.
 */
export const insertSorted = (arr: string[], el: string): number => {
  const index = arr.findIndex((x) => x.localeCompare(el) > 0);
  if (index === -1) {
    arr.push(el);
    return arr.length - 1;
  }

  arr.splice(index, 0, el);
  return index;
};

/**
 * Computes the hash of the auxiliary data if it exists.
 *
 * @param {AuxiliaryData} data - The auxiliary data to hash.
 * @returns {Hash32ByteBase16} The hash of the auxiliary data or undefined if no auxiliary data is provided.
 */
export const getAuxiliaryDataHash = (data: AuxiliaryData): Hash32ByteBase16 =>
  blake2b_256(data.toCbor());

/**
 * Asserts that the given address is a valid payment address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is a script hash.
 */
export const assertPaymentsAddress = (address: Address): never | void => {
  const props = address.getProps();
  if (!props.paymentPart) {
    throw new Error("assertPaymentsAddress: address has no payment part!");
  }
  if (props.paymentPart.type == CredentialType.ScriptHash) {
    throw new Error(
      "assertPaymentsAddress: address payment credential cannot be a script hash!",
    );
  }
};

/**
 * Asserts that the given address is a valid lock address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is not a script hash.
 */
export const assertLockAddress = (address: Address): never | void => {
  const props = address.getProps();
  if (!props.paymentPart) {
    throw new Error("assertLockAddress: address has no payment part!");
  }
  if (props.paymentPart.type != CredentialType.ScriptHash) {
    throw new Error(
      "assertLockAddress: address payment credential must be a script hash!",
    );
  }
};

/**
 * Returns the maximum of two BigInt values.
 * @param {bigint} a - The first bigint value.
 * @param {bigint} b - The second bigint value.
 * @returns {bigint} The maximum value.
 */
export const bigintMax = (a: bigint, b: bigint): bigint => {
  return a > b ? a : b;
};

/**
 * Utility function to test the validity of a TransactionOutput.
 *
 * @param {TransactionOutput} output The TransactionOutput to test.
 * @param {number} coinsPerUtxoByte From the environment's protocol params.
 * @param {number} maxValueSize From the environment's protocl params.
 * @throws If the output does not satisfy the minAda required, or the output is larger than the maxValueSize, it will throw an error.
 */
export const assertValidOutput = (
  output: TransactionOutput,
  coinsPerUtxoByte: number,
  maxValueSize: number,
): void | never => {
  const byteLength = BigInt(output.toCbor().length / 2);
  const requiredAmount = BigInt(coinsPerUtxoByte) * (byteLength + 160n);
  if (output.amount().coin() < requiredAmount) {
    throw new Error(
      `checkOutputMinAda: collateral output does not have sufficient ADA to cover minUtxo value. Output only has ${output.amount().coin()} ADA after required amount, but needs at least ${requiredAmount}`,
    );
  }
  const valueByteLength = output.amount().toCbor().length / 2;
  if (valueByteLength > maxValueSize) {
    throw new Error("checkOutputMinAda: Failed due to max value size!");
  }
};
