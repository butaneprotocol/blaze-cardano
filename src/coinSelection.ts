import { TransactionUnspentOutput, Value } from './types'
import * as value from './value'

type SelectionResult = {
  selectedInputs: TransactionUnspentOutput[]
  selectedValue: Value
  inputs: TransactionUnspentOutput[]
}

// wide selection is a multiasset coin selector that doesn't care about magnitude
// this tries to maximise the number of coins covered by a small number of inputs
// it is a greedy best improvement algorithm that selects 1st what covers the most different assets fully,
// and then to tie split selects what covers the largest intersection (i.e the greater magnitude of those values)
function wideSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value,
): SelectionResult {
  const availableInputs: TransactionUnspentOutput[] = [...inputs]
  const selectedInputs: TransactionUnspentOutput[] = []
  let acc = new Value(0n)
  for (let j = 0; j < 30; j++) {
    let diff = value.sub(dearth, acc)
    let goal = value.positives(diff)
    // it's le 1 instead of lt 1 because depth is applied after, depth is best for size 1
    if (value.assetTypes(goal) <= 1) {
      break
    } else {
      let bestStep: [number, Value, number] = [0, new Value(0n), -1]
      for (let i = 0; i < availableInputs.length; i += 1) {
        const iValue = availableInputs[i].output().amount()
        const iImprove = value.positives(value.sub(goal, iValue))
        const iIntersect = value.intersect(goal, iValue)
        const rating =
          value.assetTypes(goal) - value.assetTypes(iImprove) + iIntersect / 10
        if (rating > bestStep[0]) {
          bestStep = [rating, iValue, i]
        }
      }
      if (bestStep[2] == -1) {
        throw new Error('UTxO Balance Insufficient')
      }
      selectedInputs.push(...availableInputs.splice(bestStep[2], 1))
      acc = value.merge(acc, bestStep[1])
    }
  }
  return { selectedInputs, selectedValue: acc, inputs: availableInputs }
}

// deepSelection works as a multiasset selector by solving a single asset fully, and then moving to another asset
// it repeatedly picks an asset to solve, picks the largest assets with
function deepSelection(
  inputs: TransactionUnspentOutput[],
  dearth: Value,
): SelectionResult {
  const availableInputs: TransactionUnspentOutput[] = [...inputs]
  const selectedInputs: TransactionUnspentOutput[] = []
  let acc = new Value(0n)
  for (let j = 0; j < 30; j++) {
    let diff = value.sub(dearth, acc)
    let goal = value.positives(diff)
    // break when there's no more goal to solve
    if (value.assetTypes(goal) == 0) {
      break
    } else {
      let searchAsset = value.assets(goal)[0]
      let bestStep: [bigint, Value, number] = [0n, new Value(0n), -1]
      for (let i = 0; i < availableInputs.length; i += 1) {
        const iValue = availableInputs[i].output().amount()
        let rating: bigint
        if (searchAsset == 'lovelace') {
          rating = iValue.coin()
        } else {
          rating = iValue.multiasset()?.get(searchAsset) ?? 0n
        }
        if (rating > bestStep[0]) {
          bestStep = [rating, iValue, i]
        }
      }
      if (bestStep[2] == -1) {
        throw new Error('UTxO Balance Insufficient')
      }
      selectedInputs.push(...availableInputs.splice(bestStep[2], 1))
      acc = value.merge(acc, bestStep[1])
    }
  }
  return { selectedInputs, selectedValue: acc, inputs: availableInputs }
}

// our main coin selection function executes wideSelection and then deepSelection, combining the two.
// this works to greedily select the smallest set of utxos, and then any extra is done with the depth search
export function micahsSelector(
  inputs: TransactionUnspentOutput[],
  dearth: Value,
): SelectionResult {
  let wideResult = wideSelection(inputs, dearth)
  let remainingDearth = value.positives(
    value.sub(dearth, wideResult.selectedValue),
  )
  let deepResult = deepSelection(wideResult.inputs, remainingDearth)
  let finalDearth = value.positives(
    value.sub(remainingDearth, deepResult.selectedValue),
  )
  if (!value.empty(finalDearth)) {
    throw new Error('Coin selector failed!')
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
  }
}
