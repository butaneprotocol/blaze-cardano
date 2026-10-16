// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
/** Blockchain restriction for minimum coin quantity in a UTxO */
export const computeMinUtxoValue = (coinsPerUtxoWord: bigint): bigint => coinsPerUtxoWord * 29n;
