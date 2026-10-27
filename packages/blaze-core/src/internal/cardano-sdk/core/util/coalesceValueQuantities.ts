// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import * as assetUtil from '../Asset/util';
import { BigIntMath } from '../../util/index';
import type { Value } from '../Cardano';

/** Sum all quantities */
export const coalesceValueQuantities = (quantities: Value[]): Value => ({
  assets: assetUtil.coalesceTokenMaps(quantities.map(({ assets }) => assets)),
  coins: BigIntMath.sum(quantities.map(({ coins }) => coins))
});
