import type { Hash32ByteBase16, HexBlob, TransactionUnspentOutput, Value } from "@blaze-cardano/core";

/**
 * The result of a coin selection operation.
 * It includes the selected inputs, the total value of the selected inputs, and the remaining inputs.
 */
export type SelectionResult = {
  leftoverInputs: TransactionUnspentOutput[];
  selectedInputs: TransactionUnspentOutput[];
  selectedValue: Value;
};

/**
 * The coin selection function to choose which inputs to use for the transaction.
 */
export type CoinSelectionFunc = (
  inputs: TransactionUnspentOutput[],
  collectedAssets: Value,
  preliminaryFee?: number,
  externalAssets?: Value,
  coinsPerUtxoByte?: number,
) => SelectionResult;

/**
 * The type interface for script data.
 */
export interface IScriptData {
  redeemersEncoded: string;
  datumsEncoded: string | undefined;
  costModelsEncoded: string;
  hashedData: HexBlob;
  scriptDataHash: Hash32ByteBase16;
}