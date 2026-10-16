// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import type { TokenMap } from '../../Cardano';

/**
 * Remove all negative quantities from a TokenMap.
 * Does not modify the original TokenMap
 *
 * @param {TokenMap} assets TokenMap to remove negative quantities
 * @returns {TokenMap} a copy of `assets` with negative quantities removed, could be empty
 */
export const removeNegativesFromTokenMap = (assets: TokenMap): TokenMap => {
  const result: TokenMap = new Map(assets);
  for (const [assetId, assetQuantity] of result) {
    if (assetQuantity < 0) {
      result.delete(assetId);
    }
  }
  return result;
};
