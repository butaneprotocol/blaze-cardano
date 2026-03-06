import type {
  Hash32ByteBase16,
  HexBlob,
  TransactionUnspentOutput,
  TransactionInput,
  RewardAccount,
  PlutusData,
  Value,
} from "@blaze-cardano/core";

/**
 * The result of a coin selection operation.
 * It includes the selected inputs, the total value of the selected inputs, and the remaining inputs.
 */
export type SelectionResult = {
  leftoverInputs: TransactionUnspentOutput[];
  selectedInputs: TransactionUnspentOutput[];
  selectedValue: Value;
};

export interface UseCoinSelectionArgs {
  useCoinSelection: boolean;
}

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

/**
 * Context provided to deferred redeemer functions during transaction completion.
 * Allows redeemers to reference final sorted indices, fee, and other tx state.
 */
export interface RedeemerContext {
  /** All spending inputs in canonical sorted order */
  sortedSpendInputs: TransactionInput[];
  /** Minting policies in canonical sorted order, with their minted assets */
  sortedMints: Array<{ policyId: string; assets: Map<string, bigint> }>;
  /** Withdrawals in canonical sorted order */
  sortedWithdrawals: Array<{ rewardAccount: RewardAccount; amount: bigint }>;
  /** Current fee estimate */
  fee: bigint;
  /**
   * Sorted position of THIS redeemer's subject:
   * - For Spend: index in sortedSpendInputs
   * - For Mint: index in sortedMints
   * - For Reward: index in sortedWithdrawals
   */
  ownIndex: number;
}

/**
 * A function that produces redeemer data lazily, receiving the current
 * transaction context so it can reference sorted indices, fee, etc.
 */
export type DeferredRedeemer = (context: RedeemerContext) => PlutusData;
