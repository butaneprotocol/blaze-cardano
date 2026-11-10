// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { isNotNil } from '../../../util/index';
import type { TokenMap } from '../../Cardano';

/** Sum asset quantities */
export const coalesceTokenMaps = (totals: (TokenMap | undefined)[]): TokenMap | undefined => {
  const result: TokenMap = new Map();
  for (const assetTotals of totals.filter(isNotNil)) {
    for (const [assetId, assetQuantity] of assetTotals.entries()) {
      const sum = result.get(assetId) || 0n;
      result.set(assetId, sum + assetQuantity);
    }
  }
  if (result.size === 0) {
    return undefined;
  }
  return result;
};
