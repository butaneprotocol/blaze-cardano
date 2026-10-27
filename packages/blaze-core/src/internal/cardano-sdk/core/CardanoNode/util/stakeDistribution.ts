// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import type { Lovelace } from '../../Cardano';
import type { StakeDistribution } from '../types';

/**
 * Transforms StakeDistribution to a single live stake value of the network
 *
 * @param {StakeDistribution} stakeDistribution
 */

export const toLiveStake = (stakeDistribution: StakeDistribution): Lovelace =>
  [...stakeDistribution.values()].reduce((accumulator, { stake }) => accumulator + stake.pool, BigInt(0));
