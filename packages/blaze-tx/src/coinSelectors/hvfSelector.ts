import {
  type Address,
  AssetId,
  CredentialType,
  hardCodedProtocolParams,
  type TokenMap,
  TransactionOutput,
  type TransactionUnspentOutput,
  Value,
} from "@blaze-cardano/core";
import * as value from "../value";
import type { CoinSelectionFunc, SelectionResult } from "../types";
import { calculateMinAda, isEqualUTxO, stringifyBigint } from "../utils";

/**
 * Returns a list of UTxOs whose total assets are equal to or greater than the asset value provided
 * @link https://github.com/Anastasia-Labs/lucid-evolution/blob/main/packages/utils/src/utxo.ts#L112
 * @param utxos list of available utxos
 * @param assetsRequired minimum total assets required
 * @param includeUTxOsWithScriptRef Whether to include UTxOs with scriptRef or not. default = false
 */
export const selectUTxOs = (
  utxos: TransactionUnspentOutput[],
  totalRequired: Value,
  includeUTxOsWithScriptRef: boolean = false,
): TransactionUnspentOutput[] => {
  const selectedUtxos: TransactionUnspentOutput[] = [];
  let isSelected = false;
  isSelected = false;
  const assetsRequired = new Map<string, bigint>([
    ...Object.entries({
      lovelace: totalRequired.coin(),
    }),
    ...(totalRequired.multiasset()?.entries() || []),
  ]);

  for (const utxo of utxos) {
    if (!includeUTxOsWithScriptRef && utxo.output().scriptRef()) continue;
    isSelected = false;
    for (const [unit, amount] of assetsRequired) {
      const assetAmount =
        unit === "lovelace"
          ? utxo.output().amount().coin()
          : utxo.output().amount().multiasset()?.get(AssetId(unit));
      if (assetAmount) {
        if (assetAmount >= amount) {
          assetsRequired.delete(unit);
        } else {
          assetsRequired.set(unit, amount - assetAmount);
        }
        isSelected = true;
      }
    }
    if (isSelected) {
      selectedUtxos.push(utxo);
    }
    if (assetsRequired.size == 0) {
      break;
    }
  }
  if (assetsRequired.size > 0) return [];
  return selectedUtxos;
};

const calculateExtraLovelace = (
  leftoverAssets: Value,
  address: Address,
  coinsPerUtxoByte: number,
): Value => {
  const output = new TransactionOutput(address, leftoverAssets);
  const minLovelace = calculateMinAda(output, coinsPerUtxoByte);
  const currentLovelace = leftoverAssets.coin();
  return currentLovelace >= minLovelace
    ? new Value(0n)
    : new Value(minLovelace - currentLovelace);
};

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
export const recursive = (
  inputs: TransactionUnspentOutput[],
  requiredAssets: Value,
  externalAssets: Value = new Value(0n),
  coinsPerUtxoByte: number = hardCodedProtocolParams.coinsPerUtxoByte,
): SelectionResult => {
  const firstInput = inputs[0];
  let selected: TransactionUnspentOutput[] = selectUTxOs(
    inputs,
    requiredAssets,
  );
  if (!firstInput || selected.length === 0) {
    throw new Error(
      `Your wallet does not have enough funds to cover the required assets: ${stringifyBigint(requiredAssets.toCore())}. Or it contains UTxOs with reference scripts; which are excluded from coin selection.`,
    );
  }

  const selectedAssets: Value = value.sum(
    selected.map((s) => s.output().amount()),
  );

  let availableAssets = value.sub(selectedAssets, requiredAssets);
  availableAssets = value.sum([availableAssets, externalAssets]);

  let extraLovelace: Value | undefined = calculateExtraLovelace(
    availableAssets,
    firstInput.output().address(),
    coinsPerUtxoByte,
  );

  let remainingInputs = inputs;

  while (extraLovelace.coin() > 0n) {
    remainingInputs = remainingInputs.filter(
      (i, index) => !selected[index] || !isEqualUTxO(i, selected[index]),
    );

    const extraSelected = selectUTxOs(remainingInputs, extraLovelace);
    if (extraSelected.length === 0) {
      throw new Error(
        `Your wallet does not have enough funds to cover required minimum ADA for change output: ${stringifyBigint(extraLovelace.toCore())}. Or it contains UTxOs with reference scripts; which are excluded from coin selection.`,
      );
    }

    const extraSelectedAssets: Value = value.sum(
      extraSelected.map((v) => v.output().amount()),
    );
    selected = [...selected, ...extraSelected];
    availableAssets = value.sum([availableAssets, extraSelectedAssets]);

    extraLovelace = calculateExtraLovelace(
      availableAssets,
      firstInput.output().address(),
      coinsPerUtxoByte,
    );
  }

  const leftoverInputs = inputs.filter((i) => !selected.includes(i));

  return {
    selectedInputs: selected,
    leftoverInputs,
    selectedValue: selectedAssets,
  };
};

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
export const hvfSelector: CoinSelectionFunc = (
  inputs,
  collectedAssets,
  preliminaryFee = 0,
  externalAssets = new Value(0n),
  coinsPerUtxoByte = hardCodedProtocolParams.coinsPerUtxoByte,
) => {
  const requiredAssets = new Value(
    collectedAssets.coin() + externalAssets.coin() + BigInt(preliminaryFee),
  );
  const nonRequiredAssets = new Value(0n);

  externalAssets.multiasset()?.forEach((amount, id) => {
    const requiredMultiAsset = requiredAssets.multiasset()?.get(id);
    const nonRequiredMultiAsset = nonRequiredAssets.multiasset()?.get(id);
    if (amount < 0n) {
      if (nonRequiredMultiAsset) {
        (nonRequiredAssets.multiasset() as TokenMap).set(
          id,
          nonRequiredMultiAsset + amount,
        );
      } else {
        nonRequiredAssets.setMultiasset(new Map([[AssetId(id), amount]]));
      }
    } else {
      if (requiredMultiAsset) {
        (requiredAssets.multiasset() as TokenMap).set(
          id,
          requiredMultiAsset + amount,
        );
      } else {
        requiredAssets.setMultiasset(new Map([[AssetId(id), amount]]));
      }
    }
  });

  const cleanInputs = inputs.filter(utxo => {
    if (utxo.output().address().getProps().paymentPart?.type === CredentialType.ScriptHash) {
      return false;
    }

    return true;
  });

  return recursive(cleanInputs, requiredAssets, nonRequiredAssets, coinsPerUtxoByte);
};
