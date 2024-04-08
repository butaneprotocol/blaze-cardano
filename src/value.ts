import { Value } from './types'
import * as C from '@cardano-sdk/core'

export function merge(a: Value, b: Value): Value {
  let ma: C.Cardano.TokenMap | undefined
  if (!a.multiasset()) {
    ma = b.multiasset()
  } else {
    ma = a.multiasset()!
    let bma = b.multiasset()
    if (bma) {
      for (const key of bma.keys()) {
        let a = ma.get(key)
        let b = bma.get(key)!
        if (a) {
          ma.set(key, a + b)
        } else {
          ma.set(key, b)
        }
      }
    }
  }
  return new Value(a.coin() + b.coin(), ma)
}

export function negate(v: Value): Value {
  let entries = v.multiasset()?.entries()
  let tokenMap: C.Cardano.TokenMap = new Map()
  if (entries) {
    for (const entry of entries) {
      tokenMap.set(entry[0], -entry[1])
    }
  }
  return new Value(-v.coin(), tokenMap)
}

export function sub(a: Value, b: Value): Value {
  return merge(a, negate(b))
}

export function intersect(a: Value, b: Value): number {
  let count = a.coin() != 0n && b.coin() != 0n ? 1 : 0
  let multiAssetA = a.multiasset()
  let multiAssetB = b.multiasset()
  if (multiAssetA && multiAssetB) {
    for (const [asset] of multiAssetA) {
      if (multiAssetB.get(asset) != undefined) {
        count += 1
      }
    }
  }
  return count
}

export function positives(v: Value): Value {
  let entries = v.multiasset()?.entries()
  let coin = v.coin() > 0n ? v.coin() : 0n
  let tokenMap: C.Cardano.TokenMap = new Map()
  if (entries) {
    for (const entry of entries) {
      if (entry[1] > 0n) {
        tokenMap.set(entry[0], entry[1])
      }
    }
  }
  return new Value(coin, tokenMap)
}

export function negatives(v: Value): Value {
    let entries = v.multiasset()?.entries()
    let coin = v.coin() < 0n ? v.coin() : 0n
    let tokenMap: C.Cardano.TokenMap = new Map()
    if (entries) {
      for (const entry of entries) {
        if (entry[1] < 0n) {
          tokenMap.set(entry[0], entry[1])
        }
      }
    }
    return new Value(coin, tokenMap)
}

export function assets(v: Value): (C.Cardano.AssetId | 'lovelace')[] {
  const assets: (C.Cardano.AssetId | 'lovelace')[] =
    v.coin() == 0n ? [] : ['lovelace']
  let assetKeys = v.multiasset()?.keys()
  if (assetKeys) {
    for (const asset of assetKeys) {
      assets.push(asset)
    }
  }
  return assets
}

export function assetTypes(v: Value): number {
  let count = v.coin() == 0n ? 0 : 1
  let entries = v.multiasset()?.entries()
  if (entries){
    for (const _entry of entries){
        count += 1
    }
  }
  return count
}

export function empty(v: Value): boolean {
  return assetTypes(v) == 0
}
