import type {
  Evaluator,
  ProtocolParameters,
  Script,
  SlotConfig,
  Transaction,
  TransactionUnspentOutput,
} from "@blaze-cardano/core";
import {
  Costmdls,
  HexBlob,
  Redeemer,
  Redeemers,
  SLOT_CONFIG_NETWORK,
  fromHex,
  toHex,
} from "@blaze-cardano/core";
import * as U from "@blaze-cardano/uplc/wasm";

/**
 * Optional sink for evaluator debug messages. Passed to {@link makeUplcEvaluator}
 * to observe internal behaviour such as script substitutions during evaluation.
 */
export type EvaluatorDebugLogger = (message: string) => void;

/**
 * Extracts the raw script bytes from a Script object.
 * Returns the inner flat-encoded UPLC bytes (not CBOR-wrapped).
 */
function getScriptRawBytes(script: Script): Uint8Array {
  const lang = script.language();
  let rawHex: string | undefined;
  if (lang === 1) {
    rawHex = script.asPlutusV1()?.rawBytes();
  } else if (lang === 2) {
    rawHex = script.asPlutusV2()?.rawBytes();
  } else if (lang === 3) {
    rawHex = script.asPlutusV3()?.rawBytes();
  }
  if (!rawHex) {
    throw new Error(
      `Cannot extract raw bytes from script with language ${lang}`,
    );
  }
  return fromHex(rawHex);
}

/**
 * This function returns an evaluator function that can be used to evaluate a transaction.
 * The evaluator function uses the UPLC (Untyped Plutus Core) evaluator to simulate the execution of scripts.
 * @param params - The protocol parameters.
 * @param overEstimateSteps - The overestimation factor for execution steps.
 * @param overEstimateMem - The overestimation factor for memory.
 * @param slotConfig - The slot configuration to be used. Defaults to Mainnet.
 * @param debugLogger - Optional sink for evaluator debug messages (e.g. script
 * substitutions applied during evaluation). No-op when omitted.
 * @returns An evaluator function.
 */
export function makeUplcEvaluator(
  params: ProtocolParameters,
  overEstimateSteps: number,
  overEstimateMem: number,
  slotConfig: SlotConfig = SLOT_CONFIG_NETWORK.Mainnet,
  debugLogger?: EvaluatorDebugLogger,
): Evaluator {
  return (
    draft_tx: Transaction,
    allUtxos: TransactionUnspentOutput[],
    scriptSubstitutions?: Map<string, Script>,
  ): Promise<Redeemers> => {
    const txBytes = fromHex(draft_tx.toCbor());
    const inputRefs = allUtxos.map((x) => fromHex(x.input().toCbor()));
    const outputBytes = allUtxos.map((x) => fromHex(x.output().toCbor()));
    const costMdlsBytes = fromHex(
      Costmdls.fromCore(params.costModels).toCbor(),
    );
    const cpuBudget = BigInt(
      Math.floor(
        params.maxExecutionUnitsPerTransaction.steps / (overEstimateSteps ?? 1),
      ),
    );
    const memBudget = BigInt(
      Math.floor(
        params.maxExecutionUnitsPerTransaction.memory / (overEstimateMem ?? 1),
      ),
    );
    const zeroTime = BigInt(slotConfig.zeroTime);
    const zeroSlot = BigInt(slotConfig.zeroSlot);
    const slotLength = slotConfig.slotLength;

    let uplcResults;

    if (scriptSubstitutions && scriptSubstitutions.size > 0) {
      // Build parallel arrays for the override
      const overrideHashes: Uint8Array[] = [];
      const overrideBytes: Uint8Array[] = [];
      const overrideLangs: number[] = [];

      for (const [hash, script] of scriptSubstitutions) {
        const rawBytes = getScriptRawBytes(script);
        overrideHashes.push(fromHex(hash));
        overrideBytes.push(rawBytes);
        overrideLangs.push(script.language());
        debugLogger?.(
          `[vm override] hash=${hash} lang=${script.language()} bytes=${rawBytes.length}`,
        );
      }

      uplcResults = U.eval_phase_two_raw_with_override(
        txBytes,
        inputRefs,
        outputBytes,
        costMdlsBytes,
        cpuBudget,
        memBudget,
        zeroTime,
        zeroSlot,
        slotLength,
        overrideHashes,
        overrideBytes,
        new Uint8Array(overrideLangs),
      );
    } else {
      // No overrides — use the original function
      uplcResults = U.eval_phase_two_raw(
        txBytes,
        inputRefs,
        outputBytes,
        costMdlsBytes,
        cpuBudget,
        memBudget,
        zeroTime,
        zeroSlot,
        slotLength,
      );
    }

    const redeemerValues: Redeemer[] = []; // Initialize an array to hold the updated redeemers.

    // Iterate over the results from the UPLC evaluator.
    for (const result of uplcResults) {
      const redeemerBytes = result.redeemer;
      const redeemer = Redeemer.fromCbor(HexBlob(toHex(redeemerBytes))); // Convert each result back from CBOR to a Redeemer object.
      const exUnits = redeemer.exUnits(); // Extract the execution units from the redeemer.

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
    const redeemers: Redeemers = Redeemers.fromCore([]);
    redeemers.setValues(redeemerValues);
    return Promise.resolve(redeemers);
  };
}
