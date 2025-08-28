import { type TransactionUnspentOutput, Value } from "@blaze-cardano/core";
import type { CoinSelectionFunc, SelectionResult } from "../types";
/**
 * Returns a list of UTxOs whose total assets are equal to or greater than the asset value provided
 * @link https://github.com/Anastasia-Labs/lucid-evolution/blob/main/packages/utils/src/utxo.ts#L112
 * @param utxos list of available utxos
 * @param assetsRequired minimum total assets required
 * @param includeUTxOsWithScriptRef Whether to include UTxOs with scriptRef or not. default = false
 */
export declare const selectUTxOs: (utxos: TransactionUnspentOutput[], totalRequired: Value, includeUTxOsWithScriptRef?: boolean) => TransactionUnspentOutput[];
/**
 * Performs coin selection to obtain the "requiredAssets" and then carries out
 * recursive coin selection to ensure that leftover assets (selectedAssets + externalAssets - requiredAssets)
 * have enough ADA to satisfy minimum ADA requirement for them to be sent as change output.
 * If "requiredAssets" is empty, it still checks for minimum ADA requirement of "externalAssets"
 * and does coin selection if required.
 * @param inputs
 * @param requiredAssets
 * @param coinsPerUtxoByte
 * @param externalAssets
 * @param error
 * @returns
 */
export declare const recursive: (inputs: TransactionUnspentOutput[], requiredAssets: Value, externalAssets?: Value, coinsPerUtxoByte?: number) => SelectionResult;
/**
 * This coin selection algorithm follows a Highest Value First (HVF) function, taking into consideration things like fee estimation.
 * Inspiration taken from Lucid Evolution: https://github.com/Anastasia-Labs/lucid-evolution/blob/main/packages/lucid/src/tx-builder/internal/CompleteTxBuilder.ts#L789
 * @param inputs
 * @param collectedAssets
 * @param preliminaryFee
 * @param externalAssets
 * @param coinsPerUtxoByte
 * @returns
 */
export declare const hvfSelector: CoinSelectionFunc;
//# sourceMappingURL=hvfSelector.d.ts.map