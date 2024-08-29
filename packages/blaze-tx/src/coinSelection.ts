import type { TransactionUnspentOutput } from "@blaze-cardano/core";
import { Value } from "@blaze-cardano/core";
import * as value from "./value";

/**
 * The result of a coin selection operation.
 * It includes the selected inputs, the total value of the selected inputs, and the remaining inputs.
 */
export type SelectionResult = {
  selectedInputs: TransactionUnspentOutput[];
  selectedValue: Value;
  inputs: TransactionUnspentOutput[];
};

/**
 * The wide selection algorithm is a multiasset coin selector that doesn't care about magnitude.
 * It maximizes the number of coins covered by a small number of inputs.
 * It is a greedy best improvement algorithm that selects first what covers the most different assets fully,
 * and then to tie split selects what covers the largest intersection (i.e the greater magnitude of those values).
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the wide selection operation.
 */
function wideSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value,
): SelectionResult {
  const availableInputs: TransactionUnspentOutput[] = [...inputs];
  const selectedInputs: TransactionUnspentOutput[] = [];
  let acc = new Value(0n);
  for (let j = 0; j < 30; j++) {
    const diff = value.sub(dearth, acc);
    const goal = value.positives(diff);
    // it's le 1 instead of lt 1 because depth is applied after, depth is best for size 1
    if (value.assetTypes(goal) <= 1) {
      break;
    } else {
      let bestStep: [number, Value, number] = [0, new Value(0n), -1];
      for (let i = 0; i < availableInputs.length; i += 1) {
        const iValue = availableInputs[i]!.output().amount();
        const iImprove = value.positives(value.sub(goal, iValue));
        const iIntersect = value.intersect(goal, iValue);
        const rating =
          value.assetTypes(goal) - value.assetTypes(iImprove) + iIntersect / 10;
        if (rating > bestStep[0]) {
          bestStep = [rating, iValue, i];
        }
      }
      if (bestStep[2] == -1) {
        throw new Error("UTxO Balance Insufficient");
      }
      selectedInputs.push(...availableInputs.splice(bestStep[2], 1));
      acc = value.merge(acc, bestStep[1]);
    }
  }
  return { selectedInputs, selectedValue: acc, inputs: availableInputs };
}

/**
 * The deep selection algorithm works as a multiasset selector by solving a single asset fully, and then moving to another asset.
 * It repeatedly picks an asset to solve, picking the largest assets with the greatest magnitude.
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the deep selection operation.
 */
function deepSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value,
): SelectionResult {
  const availableInputs: TransactionUnspentOutput[] = [...inputs];
  const selectedInputs: TransactionUnspentOutput[] = [];
  let acc = new Value(0n);
  for (let j = 0; j < 30; j++) {
    const diff = value.sub(dearth, acc);
    const goal = value.positives(diff);
    // break when there's no more goal to solve
    if (value.assetTypes(goal) == 0) {
      break;
    } else {
      const searchAsset = value.assets(goal)[0]!;
      let bestStep: [bigint, Value, number] = [0n, new Value(0n), -1];
      for (let i = 0; i < availableInputs.length; i += 1) {
        const iValue = availableInputs[i]!.output().amount();
        let rating: bigint;
        if (searchAsset == "lovelace") {
          rating = iValue.coin();
        } else {
          rating = iValue.multiasset()?.get(searchAsset) ?? 0n;
        }
        if (rating > bestStep[0]) {
          bestStep = [rating, iValue, i];
        }
      }
      if (bestStep[2] == -1) {
        throw new Error("UTxO Balance Insufficient");
      }
      selectedInputs.push(...availableInputs.splice(bestStep[2], 1));
      acc = value.merge(acc, bestStep[1]);
    }
  }
  return { selectedInputs, selectedValue: acc, inputs: availableInputs };
}

/**
 * Primitive coin selection algorithm as described in - https://arxiv.org/pdf/2311.01113
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
function primitiveSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value
): SelectionResult {
  const selectedInputs: TransactionUnspentOutput[] = [];
  let selectedValue = new Value(0n);
  let remain = dearth;

  for (const input of inputs) {
    if (value.empty(remain)) break;

    selectedInputs.push(input);
    selectedValue = value.merge(selectedValue, input.output().amount());
    remain = value.positives(value.sub(remain, input.output().amount()));
  }

  if (!value.empty(remain)) {
    throw new Error("UTxO Balance Insufficient");
  }

  return {
    selectedInputs,
    selectedValue,
    inputs: inputs.filter(input => !selectedInputs.includes(input))
  };
}

/**
 * The main coin selection function executes wideSelection and then deepSelection, combining the two.
 * It greedily selects the smallest set of utxos, and then any extra is done with the depth search.
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
export function micahsSelector(
  inputs: TransactionUnspentOutput[],
  dearth: Value,
): SelectionResult {
  const wideResult = wideSelection(inputs, dearth);
  const remainingDearth = value.positives(
    value.sub(dearth, wideResult.selectedValue),
  );
  const deepResult = deepSelection(wideResult.inputs, remainingDearth);
  const finalDearth = value.positives(
    value.sub(remainingDearth, deepResult.selectedValue),
  );
  if (!value.empty(finalDearth)) {
    throw new Error("Coin selector failed!");
  }
  return {
    selectedInputs: [
      ...wideResult.selectedInputs,
      ...deepResult.selectedInputs,
    ],
    selectedValue: value.merge(
      wideResult.selectedValue,
      deepResult.selectedValue,
    ),
    inputs: deepResult.inputs,
  };
}

/**
 * HVF (Highest Value First) coin selection algorithm.
 * Only sorts by ADA
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The target value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
export function hvfSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value
): SelectionResult {
  // Sort inputs by total value in descending order
  const sortedInputs = [...inputs].sort((a, b) => {
    const aValue = a.output().amount().coin();
    const bValue = b.output().amount().coin();
    return Number(bValue - aValue);
  });

  // Use primitiveSelection with sorted inputs
  return primitiveSelection(sortedInputs, dearth);
}

/**
 * LVF (Lowest Value First) coin selection algorithm. 
 * Only sorts by ADA
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The target value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
export function lvfSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value
): SelectionResult {
  // Sort inputs by total value in ascending order
  const sortedInputs = [...inputs].sort((a, b) => {
    const aValue = a.output().amount().coin();
    const bValue = b.output().amount().coin();
    return Number(aValue - bValue);
  });

  // Use primitiveSelection with sorted inputs
  return primitiveSelection(sortedInputs, dearth);
}

/**
 * Greedy coin selection algorithm.
 * @param {TransactionUnspentOutput[]} inputs - The available inputs for the selection.
 * @param {Value} dearth - The target value to be covered by the selected inputs.
 * @returns {SelectionResult} The result of the coin selection operation.
 */
export function greedySelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value
): SelectionResult {
  const selectedInputs: TransactionUnspentOutput[] = [];
  let selectedValue = new Value(0n);
  let remain = dearth;

  // Sort inputs by value in descending order
  const sortedInputs = [...inputs].sort((a, b) =>
    Number(b.output().amount().coin() - a.output().amount().coin())
  );

  // First pass: select inputs that are less than or equal to the remaining target
  for (const input of sortedInputs) {
    if (value.empty(remain)) break;

    const inputValue = input.output().amount();

    const lte = (a: Value, b: Value) => value.empty(value.positives(value.sub(a, b)));

    if (lte(inputValue, remain)) {
      selectedInputs.push(input);
      selectedValue = value.merge(selectedValue, inputValue);
      remain = value.positives(value.sub(remain, inputValue));
    }
  }

  // Second pass: if target is not met, add smallest input that covers the remaining amount
  while (!value.empty(remain)) {
    const gte = (a: Value, b: Value) => value.empty(value.positives(value.sub(b, a)));

    const smallestCoveringInput = sortedInputs.find(input =>
      !selectedInputs.includes(input) && gte(input.output().amount(), remain)
    );

    if (!smallestCoveringInput) {
      throw new Error("UTxO Balance Insufficient");
    }

    selectedInputs.push(smallestCoveringInput);
    selectedValue = value.merge(selectedValue, smallestCoveringInput.output().amount());
    remain = value.positives(value.sub(remain, smallestCoveringInput.output().amount()));
  }

  return {
    selectedInputs,
    selectedValue,
    inputs: inputs.filter(input => !selectedInputs.includes(input))
  };
}