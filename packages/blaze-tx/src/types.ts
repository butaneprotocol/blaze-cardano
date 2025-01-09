import type { TransactionUnspentOutput, Value } from "@blaze-cardano/core";

/**
 * The result of a coin selection operation.
 * It includes the selected inputs, the total value of the selected inputs, and the remaining inputs.
 */
export type SelectionResult = {
  selectedInputs: TransactionUnspentOutput[];
  selectedValue: Value;
  availableInputs: TransactionUnspentOutput[];
};

/**
 * The coin selection function to choose which inputs to use for the transaction.
 */
export type CoinSelectionFunc = (
  inputs: TransactionUnspentOutput[],
  collectedAssets: Value,
  preliminaryFee?: number,
  externalAssets?: Value,
  coinsPerUtxoByte?: number
) => SelectionResult