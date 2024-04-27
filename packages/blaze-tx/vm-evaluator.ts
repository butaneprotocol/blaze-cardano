import {
  Costmdls,
  Evaluator,
  HexBlob,
  ProtocolParameters,
  Redeemer,
  Redeemers,
  Transaction,
  TransactionUnspentOutput,
  fromHex,
  toHex,
} from "../blaze-core";
import * as U from "uplc-node";

const SLOT_CONFIG_NETWORK = {
  Mainnet: { zeroTime: 1596059091000, zeroSlot: 4492800, slotLength: 1000 }, // Starting at Shelley era
  Preview: { zeroTime: 1666656000000, zeroSlot: 0, slotLength: 1000 }, // Starting at Shelley era
  Preprod: {
    zeroTime: 1654041600000 + 1728000000,
    zeroSlot: 86400,
    slotLength: 1000,
  }, // Starting at Shelley era
  /** Customizable slot config (Initialized with 0 values). */
  Custom: { zeroTime: 0, zeroSlot: 0, slotLength: 0 },
};

/**
 * This function returns an evaluator function that can be used to evaluate a transaction.
 * The evaluator function uses the UPLC (Untyped Plutus Core) evaluator to simulate the execution of scripts.
 * @param params - The protocol parameters.
 * @param overEstimateSteps - The overestimation factor for execution steps.
 * @param overEstimateMem - The overestimation factor for memory.
 * @returns An evaluator function.
 */
export function evaluate(
  params: ProtocolParameters,
  overEstimateSteps: number,
  overEstimateMem: number,
): Evaluator {
  return (
    draft_tx: Transaction,
    allUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> => {
    // Simulate the execution of scripts using the UPLC (Untyped Plutus Core) evaluator.
    const uplcResults = U.eval_phase_two_raw(
      fromHex(draft_tx.toCbor()), // Convert the draft transaction to CBOR and hex format.
      allUtxos.map((x) => fromHex(x.input().toCbor())), // Convert all input UTXOs to CBOR and hex format.
      allUtxos.map((x) => fromHex(x.output().toCbor())), // Convert all output UTXOs to CBOR and hex format.
      fromHex(Costmdls.fromCore(params.costModels).toCbor()), // Convert the cost models to hex format.
      BigInt(
        Math.floor(
          params.maxExecutionUnitsPerTransaction.steps /
            (overEstimateSteps ?? 1),
        ),
      ), // Calculate the estimated max execution steps.
      BigInt(
        Math.floor(
          params.maxExecutionUnitsPerTransaction.memory /
            (overEstimateMem ?? 1),
        ),
      ), // Calculate the estimated max memory.
      BigInt(SLOT_CONFIG_NETWORK.Mainnet.zeroTime), // Network-specific zero time for slot calculation.
      BigInt(SLOT_CONFIG_NETWORK.Mainnet.zeroSlot), // Network-specific zero slot.
      SLOT_CONFIG_NETWORK.Mainnet.slotLength, // Network-specific slot length.
    );

    let redeemerValues: Redeemer[] = []; // Initialize an array to hold the updated redeemers.

    // Iterate over the results from the UPLC evaluator.
    for (const redeemerBytes of uplcResults) {
      let redeemer = Redeemer.fromCbor(HexBlob(toHex(redeemerBytes))); // Convert each result back from CBOR to a Redeemer object.
      let exUnits = redeemer.exUnits(); // Extract the execution units from the redeemer.

      // Adjust the execution units based on overestimation factors.
      exUnits.setSteps(
        BigInt(Math.round(Number(exUnits.steps()) * overEstimateSteps)),
      );
      exUnits.setMem(
        BigInt(Math.round(Number(exUnits.mem()) * overEstimateMem)),
      );

      redeemer.setExUnits(exUnits); // Update the redeemer with the adjusted execution units.
      redeemerValues.push(redeemer); // Add the updated redeemer to the array.
    }

    // Create a new Redeemers object and set its values to the updated redeemers.
    let redeemers: Redeemers = Redeemers.fromCore([]);
    redeemers.setValues(redeemerValues);
    return Promise.resolve(redeemers);
  };
}
