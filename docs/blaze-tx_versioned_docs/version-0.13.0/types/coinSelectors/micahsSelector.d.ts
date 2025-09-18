import type { CoinSelectionFunc } from "../types";
/**
 * The main coin selection function executes wideSelection and then deepSelection, combining the two.
 * It greedily selects the smallest set of utxos, and then any extra is done with the depth search.
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
export declare const micahsSelector: CoinSelectionFunc;
//# sourceMappingURL=micahsSelector.d.ts.map