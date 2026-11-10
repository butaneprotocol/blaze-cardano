// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
export const isNotNil = <T>(item: T | null | undefined): item is T => typeof item !== 'undefined' && item !== null;
