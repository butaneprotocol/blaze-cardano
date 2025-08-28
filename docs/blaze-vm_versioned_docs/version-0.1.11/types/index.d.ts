import type { Evaluator } from '@blaze-cardano/core';
import type { ProtocolParameters } from '@blaze-cardano/core';
import type { SlotConfig } from '@blaze-cardano/core';

/**
 * This function returns an evaluator function that can be used to evaluate a transaction.
 * The evaluator function uses the UPLC (Untyped Plutus Core) evaluator to simulate the execution of scripts.
 * @param params - The protocol parameters.
 * @param overEstimateSteps - The overestimation factor for execution steps.
 * @param overEstimateMem - The overestimation factor for memory.
 * @param slotConfig - The slot configuration to be used. Defaults to Mainnet.
 * @returns An evaluator function.
 */
export declare function makeUplcEvaluator(params: ProtocolParameters, overEstimateSteps: number, overEstimateMem: number, slotConfig?: SlotConfig): Evaluator;

export { }
