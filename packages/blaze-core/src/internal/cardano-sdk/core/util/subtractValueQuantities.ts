// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { BigIntMath } from '../../util/index';
import { util } from '../Asset';
import type { Value } from '../Cardano';

/** Subtract all quantities */
export const subtractValueQuantities = (quantities: Value[]) => ({
  assets: util.subtractTokenMaps(quantities.map(({ assets }) => assets)),
  coins: BigIntMath.subtract(quantities.map(({ coins }) => coins))
});
