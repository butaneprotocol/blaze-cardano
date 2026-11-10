// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import type { Tagged } from 'type-fest';

export type OpaqueString<T extends PropertyKey> = Tagged<string, T>;
export type OpaqueNumber<T extends PropertyKey> = Tagged<number, T>;
